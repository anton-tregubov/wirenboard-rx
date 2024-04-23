import { InMemoryReactiveSwitch } from '@main/core/in-memory-reactive-switch'
import { combineLatest, map } from 'rxjs'
import 'jest-extended'
import { TopicValueEvent } from '@main/core/topic-events-stream-reactive-switch'

jest.useRealTimers()

describe('reactive switch', () => {
  let rw: InMemoryReactiveSwitch

  beforeEach(async () => {
    rw = new InMemoryReactiveSwitch()
    // rw.debug = true
    rw.consumerProcessingDelay = 100
    await rw.start()
  })

  afterEach(async () => {
    await rw.stop()
  })

  it('e2e subscription', async () => {
    const topicIn1 = rw.createTopicConsumer('Topic in 1', value => parseInt(value))
    const topicIn2 = rw.createTopicConsumer('Topic in 2', value => parseInt(value))
    const topicOut = rw.createTopicProducer<number>('Topic out', value => value.toString())
    const subscription = combineLatest([topicIn1.changes$, topicIn2.changes$])
      .pipe(
        map(([d1, d2]) => d1 + d2),
      )
      .subscribe(topicOut.subscriber)

    rw.event('Topic in 2', '1')
    rw.event('Topic in 2', '2')
    rw.event('Topic in 1', '1')

    await rw.waitPendingEvents()

    expect(rw.subscribedTopics).toContainValues(['Topic in 1', 'Topic in 2'])
    expect(rw.consumedEvents).toContainAllValues([
      { topic: 'Topic out', value: '3' },
    ] satisfies TopicValueEvent[])

    subscription.unsubscribe()
    expect(rw.subscribedTopics).toStrictEqual([])
  })

  it('restart', async () => {
    const topicIn = rw.createTopicConsumer('In', value => parseInt(value))
    const topicOut = rw.createTopicProducer<number>('Out', value => value.toString())

    topicIn.changes$.pipe(map(v => 2 * v)).subscribe(topicOut.subscriber)

    expect(rw.subscribedTopics).toStrictEqual(['In'])
    await rw.stop()
    expect(rw.subscribedTopics).toStrictEqual([])

    await rw.start()
    expect(rw.subscribedTopics).toStrictEqual(['In'])

    rw.event('In', '2')

    await rw.waitPendingEvents()

    expect(rw.consumedEvents).toContainAllValues([
      { topic: 'Out', value: '4' },
    ] satisfies TopicValueEvent[])

  })

  //todo add support for /# subscription. trie-search
})
