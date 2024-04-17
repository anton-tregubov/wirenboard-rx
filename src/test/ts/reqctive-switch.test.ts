import { InMemoryReactiveSwitch } from '@main/core/in-memory-reactive-switch'
import { combineLatest, map } from 'rxjs'
import 'jest-extended'
import { TopicValueEvent } from '@main/core/topic-base-event-stream-reactive-switch'

jest.useRealTimers()

describe('reactive switch', () => {
  let rw: InMemoryReactiveSwitch

  beforeEach(async () => {
    rw = new InMemoryReactiveSwitch()
    // rw.debug = true
    rw.consumerProcessingDelay = 100
    await rw.start()
  })

  it('just work', async () => {
    const device1 = rw.createTopicConsumer('Topic in 1', value => parseInt(value), 0)
    const device2 = rw.createTopicConsumer('Topic in 2', value => parseInt(value), 0)
    const producer = rw.createTopicProducer<number>('Topic out', value => value.toString())
    const subscription = combineLatest([device1.changes$, device2.changes$])
      .pipe(
        map(([d1, d2]) => d1 + d2),
      )
      .subscribe(producer.subscriber)

    rw.event('Topic in 2', '1')
    rw.event('Topic in 2', '2')
    rw.event('Topic in 1', '1')

    await rw.stop()
    expect(rw.subscribedTopics).toContainValues(['Topic in 1', 'Topic in 2'])
    expect(rw.consumedEvents).toContainAllValues([
      { topic: 'Topic out', value: '0' },
      { topic: 'Topic out', value: '1' },
      { topic: 'Topic out', value: '2' },
      { topic: 'Topic out', value: '3' },
    ] satisfies TopicValueEvent[])
    subscription.unsubscribe()
  })
})
