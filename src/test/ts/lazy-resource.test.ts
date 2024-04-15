import { lazyResource } from '@main/core/lazy-resource'
import { Subject } from 'rxjs'

describe('lazy-resource', () => {
  it('just work', () => {
    const calls: string[] = []
    const sub: Subject<string> = new Subject()
    const observable = lazyResource(() => {
        calls.push('created')
        return sub
      },
      () => {
        calls.push('before')
      },
      () => {
        calls.push('after')
      })
    sub.next('ignore')
    expect(calls).toEqual([])
    const subs1 = observable.subscribe(value => calls.push(value))
    expect(calls).toEqual(['before', 'created'])
    const subs2 = observable.subscribe(value => calls.push(value))
    expect(calls).toEqual(['before', 'created'])
    sub.next('value')
    expect(calls).toEqual(['before', 'created', 'value', 'value'])
    subs1.unsubscribe()
    expect(calls).toEqual(['before', 'created', 'value', 'value'])
    const subs3 = observable.subscribe(value => calls.push(value))
    expect(calls).toEqual(['before', 'created', 'value', 'value'])
    sub.next('value2')
    expect(calls).toEqual(['before', 'created', 'value', 'value', 'value2', 'value2'])
    subs2.unsubscribe()
    expect(calls).toEqual(['before', 'created', 'value', 'value', 'value2', 'value2'])
    subs3.unsubscribe()
    expect(calls).toEqual(['before', 'created', 'value', 'value', 'value2', 'value2', 'after'])
  })
})
