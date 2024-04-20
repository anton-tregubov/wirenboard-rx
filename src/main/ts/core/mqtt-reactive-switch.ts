import { connectAsync, IClientOptions, MqttClient } from 'mqtt'
import { from, Observable } from 'rxjs'
import {
  InfinityObserver,
  Options,
  TopicBaseEventStreamReactiveSwitch,
  TopicName,
  TopicValueEvent,
} from '@main/core/topic-base-event-stream-reactive-switch'

export type LogEvent = string

export interface MqttReactiveSwitchOptions extends Options {
  readonly connectionOptions: IClientOptions
  readonly loggingEvent$: InfinityObserver<LogEvent>
}

export class MqttReactiveSwitch extends TopicBaseEventStreamReactiveSwitch<MqttClient> {
  private readonly _connectionOptions: IClientOptions
  private readonly _loggingEvent$: InfinityObserver<LogEvent>

  public constructor(private readonly _brokerUrl: string, options: Partial<MqttReactiveSwitchOptions> = {}) {
    super(options)
    this._connectionOptions = options.connectionOptions ?? {}
    this._loggingEvent$ = options.loggingEvent$ ?? (value => console.log(value))
  }

  protected async createConnection(): Promise<MqttClient> {
    const client = await connectAsync(this._brokerUrl, this._connectionOptions)
    client.on('connect', () => {
      this._loggingEvent$(`Connected to ${this._brokerUrl}`)
    })
    client.on('disconnect', () => {
      this._loggingEvent$(`Disconnected from ${this._brokerUrl}`)
    })
    client.on('reconnect', () => {
      this._loggingEvent$(`Reconnected to ${this._brokerUrl}`)
    })
    client.on('error', (error) => {
      this._loggingEvent$(`Error in ${error.name}: ${error.message}. \n${error.stack}`)
    })
    return client
  }

  protected closeConnection(connection: MqttClient): Promise<void> {
    return connection.endAsync()
  }

  protected async createEventConsumer(connection: MqttClient): Promise<(event: TopicValueEvent) => Observable<void>> {
    return Promise.resolve<(event: TopicValueEvent) => Observable<void>>(event =>
      from(connection.publishAsync(event.topic, event.value).then<void>(() => {})),
    )
  }

  protected async createEventProvider(connection: MqttClient): Promise<Observable<TopicValueEvent>> {
    return new Observable(subscriber => {
      this._loggingEvent$('Start listen events')
      connection.on('message', (topic, payload) => subscriber.next({
        topic,
        value: payload.toString(),
      } satisfies TopicValueEvent))
      subscriber.remove(() => {connection.off('message', () => this._loggingEvent$('Stop listen events'))})
    })
  }

  protected async subscribeToTopic(connection: MqttClient, topic: TopicName): Promise<void> {
    await connection.subscribeAsync(topic)
    this._loggingEvent$(`Start subscription to topic: ${topic}`)
  }

  protected async unsubscribeFromTopic(connection: MqttClient, topic: TopicName): Promise<void> {
    await connection.unsubscribeAsync(topic)
    this._loggingEvent$(`Stop subscription from topic:${topic}`)
  }

  async stop(): Promise<void> {
    await super.stop()
    this._loggingEvent$(`Stop subscription from all topics`)
  }
}