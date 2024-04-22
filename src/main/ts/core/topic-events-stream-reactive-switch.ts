import { Integer, isDefine, Optional } from './utils'
import {
  BehaviorSubject,
  concatMap,
  EMPTY,
  groupBy,
  map,
  mergeMap,
  Observable,
  Observer,
  ReplaySubject,
  Subject,
  Subscription,
  tap,
} from 'rxjs'
import { difference, pull } from 'lodash-es'
import { WaitableQueue } from '@main/core/waitable-queue'
import { lazyResource } from '@main/core/lazy-resource'

export type TopicName = string
export type TopicValueParser<T> = (value: string) => T
export type TopicValueSerializer<T> = (value: T) => string
export type InfinityObserver<T> = Pick<Observer<T>, 'next'>['next']

const ERROR_CODES = {
  unexpected: (event: TopicValueEvent) => ({
    code: 1,
    event,
    reason: `Event from topic: ${event.topic} wasn't requested`,
  } as UnprocessedTopicValueEvent),
  parseException: (event: TopicValueEvent, cause: unknown) => ({
    code: 2,
    event,
    reason: `Can't parse value. Because ${cause}`,
  } as UnprocessedTopicValueEvent),
  serializeException: (topic: TopicName, value: unknown, cause: unknown) => ({
    code: 4,
    event: { topic, value: '<undefined>' },
    reason: `Can't serialize value ${value}. Because ${cause}`,
  } as UnprocessedTopicValueEvent),
} as const

export interface UnprocessedTopicValueEvent {
  readonly code: number;
  readonly reason: string;
  readonly event: TopicValueEvent;
}

export interface Options {
  readonly bufferSizeForProducer: Integer
  readonly providerConcurrency: Integer
  readonly notProcessingConsumerValue$: InfinityObserver<UnprocessedTopicValueEvent>
  readonly notProcessingProviderValue$: InfinityObserver<UnprocessedTopicValueEvent>
}

export interface TopicValueEvent {
  readonly topic: TopicName;
  readonly value: string;
}

type SmartSubject<Value> = ColdSmartSubject<Value> | HotSmartSubject<Value>

interface CommonSmartSubject<Value> {
  readonly observable: Observable<Value>;
  readonly parser: TopicValueParser<Value>;
}

interface ColdSmartSubject<Value> extends CommonSmartSubject<Value> {
  readonly subject: Subject<Value>;
}

interface HotSmartSubject<Value> extends CommonSmartSubject<Value> {
  readonly subject: BehaviorSubject<Value>;
}

interface SmartObserver<Value> {
  readonly observer: InfinityObserver<Value>;
  readonly serializer: TopicValueSerializer<Value>;
}

export interface HotTopicConsumer<Value> {
  readonly changes$: Observable<Value>
  readonly currentValue: Value
}

export interface ColdTopicConsumer<Value> {
  readonly changes$: Observable<Value>
}

export interface TopicProducer<Value> {
  readonly subscriber: Partial<Observer<Value>>
}

export interface TopicEventStreamReactiveSwitch {
  start(): Promise<void>

  stop(): Promise<void>

  createColdTopicConsumer(topicName: TopicName): ColdTopicConsumer<string>

  createColdTopicConsumer<Value>(topicName: TopicName, parser: TopicValueParser<Value>): ColdTopicConsumer<Value>

  createHotTopicConsumer(topicName: TopicName): HotTopicConsumer<Optional<string>>

  createHotTopicConsumer<Value>(topicName: TopicName, parser: TopicValueParser<Value>): HotTopicConsumer<Optional<Value>>

  createHotTopicConsumer<Value>(topicName: TopicName, parser: TopicValueParser<Value>, initialValue: Value): HotTopicConsumer<Value>

  createTopicProducer(topicName: TopicName): TopicProducer<string>

  createTopicProducer<Value>(topicName: TopicName, serializer: TopicValueSerializer<Value>): TopicProducer<Value>
}

export abstract class AbstractTopicEventsStreamReactiveSwitch<Connection> implements TopicEventStreamReactiveSwitch {
  private readonly _topicToSubject: Map<TopicName, SmartSubject<unknown>>
  private readonly _topicToObserver: Map<TopicName, SmartObserver<unknown>>
  private readonly _deferredTopicSubscription: TopicName[]
  private readonly _publisher: ReplaySubject<TopicValueEvent>
  private readonly _providerQueue: WaitableQueue<TopicValueEvent>
  private readonly _subscribedTopics: Set<TopicName>
  private _consumerSubscription: Optional<Subscription>
  private _producerSubscription: Optional<Subscription>
  protected readonly options: Options
  protected connection: Optional<Connection>

  protected constructor(options: Partial<Options> = {}) {
    this._topicToSubject = new Map()
    this._topicToObserver = new Map()
    this._subscribedTopics = new Set()
    this._deferredTopicSubscription = []
    this.options = {
      bufferSizeForProducer: options.bufferSizeForProducer ?? 1000,
      notProcessingConsumerValue$: options.notProcessingConsumerValue$ ?? (event => console.error(`Error: ${event.code} [${event.event.topic}]:${event.event.value}. Reason: ${event.reason}`)),
      notProcessingProviderValue$: options.notProcessingProviderValue$ ?? (event => console.error(`Error: ${event.code} [${event.event.topic}]:${event.event.value}. Reason: ${event.reason}`)),
      providerConcurrency: options.providerConcurrency ?? 3,
    } satisfies Options
    this._providerQueue = new WaitableQueue()
    this._publisher = new ReplaySubject(this.options.bufferSizeForProducer)
  }

  protected abstract createConnection(): Promise<Connection>

  protected abstract closeConnection(connection: Connection): Promise<void>

  protected abstract createEventConsumer(connection: Connection): Promise<(event: TopicValueEvent) => Observable<void>>

  protected abstract createEventProvider(connection: Connection): Promise<Observable<TopicValueEvent>>

  protected abstract subscribeToTopic(connection: Connection, topic: TopicName): Promise<void>

  protected abstract unsubscribeFromTopic(connection: Connection, topic: TopicName): Promise<void>

  public async start(): Promise<void> {
    const connection = this.connection = await this.createConnection()
    const eventProvider$ = await this.createEventProvider(connection)
    const eventConsumer$ = await this.createEventConsumer(connection)
    this._consumerSubscription = eventProvider$.pipe(
      groupBy(event => event.topic),
      mergeMap(topics$ => {
          topics$.subscribe((event) => {
            const smartSubject = this._topicToSubject.get(topics$.key)
            if (smartSubject) {
              try {
                const parseValue = smartSubject.parser(event.value)
                smartSubject.subject.next(parseValue)
              } catch (e) {
                this.options.notProcessingConsumerValue$(ERROR_CODES.parseException(event, e))
              }
            } else {
              this.options.notProcessingConsumerValue$(ERROR_CODES.unexpected(event))
            }
          })
          return EMPTY
        },
      ),
    ).subscribe()
    this._producerSubscription = this._publisher
      .pipe(
        tap(event => this._providerQueue.add(event)),
        groupBy(event => event.topic),
        mergeMap(topics$ => {
          return topics$.pipe(
            concatMap(event => eventConsumer$(event)
              .pipe(
                map(() => event),
              )),
          )
        }, this.options.providerConcurrency),
        tap(event => this._providerQueue.remove(event)),
      ).subscribe()
    while (this._deferredTopicSubscription.length) {
      this.startSubscription(this._deferredTopicSubscription.pop()!)
    }
  }

  private isHotSmartSubject<Value>(sub: SmartSubject<Value>): sub is HotSmartSubject<Value> {
    return sub.subject instanceof BehaviorSubject
  }

  private isColdSmartSubject<Value>(sub: SmartSubject<Value>): sub is ColdSmartSubject<Value> {
    return !this.isHotSmartSubject(sub)
  }

  public createColdTopicConsumer(topicName: TopicName): ColdTopicConsumer<string>
  public createColdTopicConsumer<Value>(topicName: TopicName, parser: TopicValueParser<Value>): ColdTopicConsumer<Value>
  createColdTopicConsumer<Value>(topicName: TopicName, parser: TopicValueParser<Value> = value => value as Value): ColdTopicConsumer<Value> {
    this.assertPrefixTopicName(topicName)
    let smartSubject = this._topicToSubject.get(topicName) as Optional<ColdSmartSubject<Value>>
    if (!isDefine(smartSubject)) {
      const subject = new Subject<Value>()
      smartSubject = {
        subject: subject,
        observable: lazyResource(
          () => subject,
          () => this._topicToSubject.get(topicName)?.subject === subject && this.startSubscription(topicName),
          () => this._topicToSubject.get(topicName)?.subject === subject && this.stopSubscription(topicName),
        ),
        parser,
      } satisfies ColdSmartSubject<Value>
      this._topicToSubject.set(topicName, smartSubject as ColdSmartSubject<unknown>)
    }
    if (!this.isColdSmartSubject(smartSubject)) {
      throw new Error(`Try to subscribe to the topic ${topicName} that already have another type of subscription`)
    }
    return {
      changes$: smartSubject.observable,
    }
  }

  public createHotTopicConsumer(topicName: TopicName): HotTopicConsumer<Optional<string>>
  public createHotTopicConsumer<Value>(topicName: TopicName, parser: TopicValueParser<Value>): HotTopicConsumer<Optional<Value>>
  public createHotTopicConsumer<Value>(topicName: TopicName, parser: TopicValueParser<Value>, initialValue: Value): HotTopicConsumer<Value>
  createHotTopicConsumer<Value>(topicName: TopicName, parser: TopicValueParser<Value> = (value) => value as Value, initialValue: Value = undefined as Value): HotTopicConsumer<Value> {
    this.assertPrefixTopicName(topicName)
    let smartSubject = this._topicToSubject.get(topicName) as Optional<HotSmartSubject<Value>>
    if (!isDefine(smartSubject)) {
      const behaviorSubject = new BehaviorSubject<Value>(initialValue)
      smartSubject = {
        subject: behaviorSubject,
        observable: behaviorSubject.asObservable(),
        parser,
      } as HotSmartSubject<Value>
      this.startSubscription(topicName)
      behaviorSubject.subscribe().add(() => this.stopSubscription(topicName))
      this._topicToSubject.set(topicName, smartSubject as HotSmartSubject<unknown>)
    } else {
      if (!this.isHotSmartSubject(smartSubject)) {
        throw new Error(`Try to subscribe to the topic ${topicName} that already have another type of subscription`)
      }
    }
    return {
      changes$: smartSubject.observable,
      get currentValue() {
        return smartSubject.subject.value
      },
    }
  }

  private assertPrefixTopicName(topicName: string) {
    if (topicName.endsWith('#')) {
      throw new Error('Not implemented not direct topic subscription')
    }
  }

  createTopicProducer(topicName: TopicName): TopicProducer<string>
  createTopicProducer<Value>(topicName: TopicName, serializer: TopicValueSerializer<Value>): TopicProducer<Value>
  public createTopicProducer<Value>(topicName: TopicName, serializer: TopicValueSerializer<Value> = value => String(value)): TopicProducer<Value> {
    this.assertPrefixTopicName(topicName)
    let smartObserver = this._topicToObserver.get(topicName) as Optional<SmartObserver<Value>>
    if (!isDefine(smartObserver)) {
      const observer: InfinityObserver<Value> = value => {
        try {
          const stringValue = serializer(value)
          this._publisher.next({ topic: topicName, value: stringValue })
        } catch (e) {
          this.options.notProcessingConsumerValue$(ERROR_CODES.serializeException(topicName, value, e))
        }
      }
      smartObserver = {
        observer,
        serializer,
      }
      this._topicToObserver.set(topicName, smartObserver as SmartObserver<unknown>)
    }

    return {
      subscriber: {
        next: smartObserver.observer,
      },
    }
  }

  protected async waitPendingEvents(): Promise<void> {
    await this._providerQueue.waitEmpty()
  }

  protected get subscribedTopics(): TopicName[] {
    return [...this._subscribedTopics]
  }

  public async stop(): Promise<void> {
    await this.waitPendingEvents()
    this._producerSubscription?.unsubscribe()
    this._consumerSubscription?.unsubscribe()
    this.passivateActiveSubscriptions()
    if (isDefine(this.connection)) {
      await this.closeConnection(this.connection)
    }
    this.connection = undefined
  }

  private passivateActiveSubscriptions() {
    const topicToSave = difference([...this._subscribedTopics], this._deferredTopicSubscription)
    topicToSave.forEach(topic => this.stopSubscription(topic))
    this._deferredTopicSubscription.push(...topicToSave)
    this._subscribedTopics.clear()
  }

  private startSubscription(topicName: string) {
    if (isDefine(this.connection)) {
      if (this._subscribedTopics.has(topicName)) {
        throw new Error(`Topic ${topicName} already listen`)
      }
      this.subscribeToTopic(this.connection, topicName).finally(/*ignore? where should w8 result?*/)
      this._subscribedTopics.add(topicName)
    } else {
      this._deferredTopicSubscription.push(topicName)
    }

  }

  private stopSubscription(topicName: string) {
    if (isDefine(this.connection)) {
      if (!this._subscribedTopics.has(topicName)) {
        throw new Error(`Topic ${topicName} not yet listen`)
      }
      this.unsubscribeFromTopic(this.connection, topicName).finally(/*ignore? where should w8 result?*/)
      this._subscribedTopics.delete(topicName)
    } else {
      pull(this._deferredTopicSubscription, topicName)
    }
  }
}

// function createLog<T>(prefix: string, from: number): MonoTypeOperatorFunction<T> {
//   return tap({
//     next: value => console.log(`[${new Date().getTime() - from}].${prefix}.VALUE`, value),
//     error: err => console.log(`[${new Date().getTime() - from}].${prefix}.ERROR`, err),
//     complete: () => console.log(`[${new Date().getTime() - from}].${prefix}.COMPLETE`),
//     subscribe: () => console.log(`[${new Date().getTime() - from}].${prefix}.SUBSCRIBE`),
//     unsubscribe: () => console.log(`[${new Date().getTime() - from}].${prefix}.UNSUBSCRIBE`),
//     finalize: () => console.log(`[${new Date().getTime() - from}].${prefix}.FINALIZE`),
//   })
// }
//
// function createObs(prefix: string, from: number, done: () => void): Observer<any> {
//   return {
//     next: value => console.log(`[${new Date().getTime() - from}].${prefix}.VALUE`, value),
//     error: err => console.log(`[${new Date().getTime() - from}].${prefix}.ERROR`, err),
//     complete: () => {
//       console.log(`[${new Date().getTime() - from}].${prefix}.COMPLETE`)
//       done()
//     },
//   }
// }