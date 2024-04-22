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

  it('e2e cold subscription', async () => {
    const topicIn1 = rw.createColdTopicConsumer('Topic in 1', value => parseInt(value))
    const topicIn2 = rw.createColdTopicConsumer('Topic in 2', value => parseInt(value))
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

  it('e2e hot subscription', async () => {
    const topicIn1 = rw.createHotTopicConsumer('Topic in 1', value => parseInt(value), -1)
    const topicIn2 = rw.createHotTopicConsumer('Topic in 2', value => parseInt(value), -1)
    const topicOut = rw.createTopicProducer<number>('Topic out', value => value.toString())
    const subscription = combineLatest([topicIn1.changes$, topicIn2.changes$])
      .pipe(
        map(([d1, d2]) => d1 + d2),
      )
      .subscribe(topicOut.subscriber)

    expect(topicIn1.currentValue).toBe(-1)
    expect(topicIn2.currentValue).toBe(-1)

    rw.event('Topic in 2', '1')
    rw.event('Topic in 2', '2')

    expect(topicIn1.currentValue).toBe(-1)
    expect(topicIn2.currentValue).toBe(2)

    rw.event('Topic in 1', '1')

    expect(topicIn1.currentValue).toBe(1)
    expect(topicIn2.currentValue).toBe(2)

    await rw.waitPendingEvents()

    expect(rw.subscribedTopics).toContainValues(['Topic in 1', 'Topic in 2'])
    expect(rw.consumedEvents).toContainAllValues([
      { topic: 'Topic out', value: '-2' },
      { topic: 'Topic out', value: '0' },
      { topic: 'Topic out', value: '1' },
      { topic: 'Topic out', value: '3' },
    ] satisfies TopicValueEvent[])

    subscription.unsubscribe()
    expect(rw.subscribedTopics).toContainValues(['Topic in 1', 'Topic in 2'])
  })

  it('restart', async () => {
    const hot = rw.createHotTopicConsumer('Hot', value => parseInt(value), -1)
    const cold = rw.createColdTopicConsumer('Cold', value => parseInt(value))
    const topicOut = rw.createTopicProducer<number>('Out', value => value.toString())

    expect(rw.subscribedTopics).toStrictEqual(['Hot'])
    await rw.stop()
    expect(rw.subscribedTopics).toStrictEqual([])

    await rw.start()
    expect(rw.subscribedTopics).toStrictEqual(['Hot'])

    combineLatest([hot.changes$, cold.changes$]).pipe(map(([d1, d2]) => d1 + d2)).subscribe(topicOut.subscriber)

    rw.event('Hot', '1')
    rw.event('Cold', '2')

    await rw.waitPendingEvents()

    expect(rw.subscribedTopics).toContainValues(['Hot', 'Cold'])

    expect(rw.consumedEvents).toContainAllValues([
      { topic: 'Out', value: '3' },
    ] satisfies TopicValueEvent[])

  })

  //todo add support for /# subscription. trie-search
})
