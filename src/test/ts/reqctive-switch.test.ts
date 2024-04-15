import { InMemoryReactiveSwitch } from '@main/core/in-memory-reactive-switch'
import { combineLatest, map } from 'rxjs'

describe('reactive switch', () => {
  let rw: InMemoryReactiveSwitch

  beforeEach(async () => {
    rw = new InMemoryReactiveSwitch()
    rw.debug = true
    // rw.consumerProcessingDelay = 1000
    await rw.start()
  })

  afterEach(async () => {
    await rw.stop()
  })

  it('just work', () => {
    const device1 = rw.createTopicConsumer('Device 1', value => parseInt(value), 0)
    const device2 = rw.createTopicConsumer('Device 2', value => parseInt(value), 0)
    const producer = rw.createTopicProducer<number>('Out', value => value.toString())
    combineLatest([device1.changes$, device2.changes$])
      .pipe(
        map(([d1, d2]) => d1 + d2),
      )
      .subscribe(producer.subscriber)

    rw.event('Device 2', '1')
    rw.event('Device 2', '2')
    rw.event('Device 1', '1')
    console.log(rw.consumedEvents)
    console.log(rw.subscribedTopics)
  })
})
