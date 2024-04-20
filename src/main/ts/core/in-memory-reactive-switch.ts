import { EMPTY, map, Observable, Subject, tap, timer } from 'rxjs'
import {
  Options,
  TopicBaseEventStreamReactiveSwitch,
  TopicName,
  TopicValueEvent,
} from '@main/core/topic-base-event-stream-reactive-switch'
import { Duration } from '@main/core/utils'

export class InMemoryReactiveSwitch extends TopicBaseEventStreamReactiveSwitch<never> {
  private readonly _consumedEvents: TopicValueEvent[]
  private readonly _eventProducer: Subject<TopicValueEvent>
  public consumerProcessingDelay: Duration
  public debug: boolean

  public constructor(options: Partial<Options> = {}) {
    super(options)
    this._consumedEvents = []
    this.consumerProcessingDelay = 0
    this.debug = false
    this._eventProducer = new Subject()
  }

  protected log(message: string) {
    if (this.debug) {
      console.log(message)
    }
  }

  public get subscribedTopics(): TopicName[] {
    return super.subscribedTopics
  }

  public get consumedEvents(): TopicValueEvent[] {
    return [...this._consumedEvents]
  }

  public event(topic: TopicValueEvent['topic'], value: TopicValueEvent['value']) {
    this._eventProducer.next({ topic, value })
  }

  protected async createConnection(): Promise<never> {
    this.log(`Create connection`)
    return '' as never
  }

  protected async closeConnection(): Promise<void> {
    this.log(`Close connection`)
  }

  protected async createEventConsumer(): Promise<(event: TopicValueEvent) => Observable<void>> {
    return event => {
      this.log(`>> [${event.topic}]: ${event.value}. Sending...`)
      this._consumedEvents.push(event)
      if (this.consumerProcessingDelay) {
        return timer(this.consumerProcessingDelay)
          .pipe(
            map(() => {}),
            tap(() => this.log(`>> [${event.topic}]: ${event.value}. Send`)),
          )
      } else {
        this.log(`>> [${event.topic}]: ${event.value}. Send`)
        return EMPTY
      }
    }
  }

  protected async createEventProvider(): Promise<Observable<TopicValueEvent>> {
    return this._eventProducer.asObservable()
      .pipe(tap((event) => this.log(`<< [${event.topic}]: ${event.value}. Receive`)))
  }

  protected async subscribeToTopic(_: never, topic: TopicName): Promise<void> {
    this.log(`++[${topic}]. Subscribe`)
  }

  protected async unsubscribeFromTopic(_: never, topic: TopicName): Promise<void> {
    this.log(`--[${topic}]. Unsubscribe`)
  }

  public async waitPendingEvents(): Promise<void> {
    await super.waitPendingEvents()
  }
}