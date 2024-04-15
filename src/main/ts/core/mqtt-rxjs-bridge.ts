import { connectAsync, MqttClient } from 'mqtt'
import { Count, isDefine, Optional } from './utils'
import { BehaviorSubject, EMPTY, groupBy, mergeMap, Observable, Observer, ReplaySubject, Subscription } from 'rxjs'
import { lazyResource } from './lazy-resource'
import { pull } from 'lodash-es'

export type TopicName = string
export type TopicValueParser<T> = (value: string) => T
export type TopicValueSerializer<T> = (value: T) => string
export type LogEvent = string
export type InfinityObserver<T> = Pick<Observer<T>, 'next'>['next']

const UnprocessedErrorCodes = {
  unexpected: (event: RawMqttEvent) => ({
    code: 1,
    event,
    reason: 'Event from this topic not requested',
  } as UnprocessedRawMqttEvent),
  parseException: (event: RawMqttEvent, cause: unknown) => ({
    code: 2,
    event,
    reason: `Can't parse value. Because ${cause}`,
  } as UnprocessedRawMqttEvent),
  serializeException: (topic: TopicName, value: unknown, cause: unknown) => ({
    code: 4,
    event: { topic, value: '<undefined>' },
    reason: `Can't serialize value ${value}. Because ${cause}`,
  } as UnprocessedRawMqttEvent),
} as const

export interface UnprocessedRawMqttEvent {
  readonly code: number;
  readonly reason: string;
  readonly event: RawMqttEvent;
}

export interface MqttRxJsBridgeOptions {
  readonly bufferSizeForProducer: Count
  readonly notProcessingConsumerValue$: InfinityObserver<UnprocessedRawMqttEvent>
  readonly notProcessingProviderValue$: InfinityObserver<UnprocessedRawMqttEvent>
  readonly loggingEvent$: InfinityObserver<LogEvent>
}

interface RawMqttEvent {
  readonly topic: TopicName;
  readonly value: string;
}

interface SmartSubject<Value> {
  readonly subject: BehaviorSubject<Value>;
  readonly observable: Observable<Value>;
  readonly parser: TopicValueParser<Value>;
}

interface SmartObserver<Value> {
  readonly observer: InfinityObserver<Value>;
  readonly serializer: TopicValueSerializer<Value>;
}

export interface TopicConsumer<Value> {
  readonly changes$: Observable<Value>
  readonly currentValue: Value
}

export interface TopicProducer<Value> {
  readonly subscriber: Partial<Observer<Value>>
}

export class MqttRxJsBridge {
  private readonly _topicToSubject: Map<TopicName, SmartSubject<unknown>>
  private readonly _topicToObserver: Map<TopicName, SmartObserver<unknown>>
  private readonly _publisher: ReplaySubject<RawMqttEvent>
  private readonly _deferredTopicSubscription: TopicName[]
  private readonly _options: MqttRxJsBridgeOptions
  private _client: Optional<MqttClient>
  private _consumerSubscription: Optional<Subscription>
  private _producerSubscription: Optional<Subscription>

  public constructor(private readonly _brokerHost: string, options: Partial<MqttRxJsBridgeOptions> = {}) {
    this._topicToSubject = new Map()
    this._topicToObserver = new Map()
    this._deferredTopicSubscription = []
    this._options = {
      bufferSizeForProducer: options.bufferSizeForProducer ?? 1000,
      loggingEvent$: options.loggingEvent$ ?? (event => console.log(event)),
      notProcessingConsumerValue$: options.notProcessingConsumerValue$ ?? (event => console.error(`Error: ${event.code} [${event.event.topic}]:${event.event.value}. Reason: ${event.reason}`)),
      notProcessingProviderValue$: options.notProcessingProviderValue$ ?? (event => console.error(`Error: ${event.code} [${event.event.topic}]:${event.event.value}. Reason: ${event.reason}
            `)),
    } satisfies MqttRxJsBridgeOptions
    this._publisher = new ReplaySubject(this._options.bufferSizeForProducer)
  }

  public async start(): Promise<void> {
    const client = await connectAsync(`mqtt://${this._brokerHost}`)
    client.on('connect', () => {
      this._options.loggingEvent$(`Connected to ${this._brokerHost}`)
    })
    client.on('disconnect', () => {
      this._options.loggingEvent$(`Disconnected from ${this._brokerHost}`)
    })
    client.on('reconnect', () => {
      this._options.loggingEvent$(`Reconnected to ${this._brokerHost}`)
    })
    client.on('error', (error) => {
      this._options.loggingEvent$(`Error in ${error.name}: ${error.message}. \n${error.stack}`)
    })
    const rawMqttEventObservable$: Observable<RawMqttEvent> = new Observable(subscriber => {
      this._options.loggingEvent$('Start listen messages')
      client.on('message', (topic, payload) => subscriber.next({
        topic,
        value: payload.toString(),
      } satisfies RawMqttEvent))
      subscriber.remove(() => {client.off('message', () => this._options.loggingEvent$('Stop listen messages'))})
    })
    rawMqttEventObservable$.pipe(
      groupBy(event => event.topic),
      mergeMap(topics$ => {
          topics$.subscribe((event) => {
            const smartSubject = this._topicToSubject.get(topics$.key)
            if (smartSubject) {
              try {
                const parseValue = smartSubject.parser(event.value)
                smartSubject.subject.next(parseValue)
              } catch (e) {
                this._options.notProcessingConsumerValue$(UnprocessedErrorCodes.parseException(event, e))
              }
            } else {
              this._options.notProcessingConsumerValue$(UnprocessedErrorCodes.unexpected(event))
            }
          })
          return EMPTY
        },
      ),
    )
    this._client = client
    this._consumerSubscription = rawMqttEventObservable$.subscribe()
    this._producerSubscription = this._publisher.subscribe(event => client.publish(event.topic, event.value))
    while (this._deferredTopicSubscription.length) {
      this.startSubscription(this._deferredTopicSubscription.pop()!)
    }
  }

  public createTopicConsumer<Value>(topicName: TopicName, parser: TopicValueParser<Value>, initialValue: Value): TopicConsumer<Value> {
    let smartSubject = this._topicToSubject.get(topicName) as Optional<SmartSubject<Value>>
    if (!isDefine(smartSubject)) {
      const behaviorSubject = new BehaviorSubject<Value>(initialValue)
      smartSubject = {
        subject: behaviorSubject,
        observable: lazyResource(
          () => behaviorSubject,
          () => this.startSubscription(topicName),
          () => this.stopSubscription(topicName),
        ),
        parser,
      } as SmartSubject<Value>
      this._topicToSubject.set(topicName, smartSubject as SmartSubject<unknown>)
    }
    return {
      changes$: smartSubject.observable,
      get currentValue() {
        return smartSubject.subject.value
      },
    }
  }

  public createTopicProducer<Value>(topicName: TopicName, serializer: TopicValueSerializer<Value>): TopicProducer<Value> {
    let smartObserver = this._topicToObserver.get(topicName) as Optional<SmartObserver<Value>>
    if (!isDefine(smartObserver)) {
      const observer: InfinityObserver<Value> = value => {
        try {
          const stringValue = serializer(value)
          this._publisher.next({ topic: topicName, value: stringValue })
        } catch (e) {
          this._options.notProcessingConsumerValue$(UnprocessedErrorCodes.serializeException(topicName, value, e))
        }
      }
      smartObserver = {
        observer,
        serializer,
      }
      this._topicToObserver.set(topicName, smartObserver)
    }

    return {
      subscriber: {
        next: smartObserver.observer,
      },
    }
  }

  private startSubscription(topicName: string) {
    if (isDefine(this._client)) {
      this._client.subscribeAsync(topicName).then(() => console.log(`Start subscription to ${topicName}`))
    } else {
      this._deferredTopicSubscription.push(topicName)
    }

  }

  private stopSubscription(topicName: string) {
    if (isDefine(this._client)) {
      this._client.unsubscribeAsync(topicName).then(() => console.log(`Stop subscription to ${topicName}`))
    } else {
      pull(this._deferredTopicSubscription, topicName)
    }
  }

  public async stop(): Promise<void> {
    this._producerSubscription?.unsubscribe()
    this._consumerSubscription?.unsubscribe()
    return this._client?.endAsync()
  }
}