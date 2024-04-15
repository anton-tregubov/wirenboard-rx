import { from, Observable, ObservableInput, ObservedValueOf } from 'rxjs'
import { isDefine, Optional } from './utils'

export function lazyResource<R extends ObservableInput<unknown>>(observableFactory: () => R, beforeFirstSubscription: () => void, afterLastUnsubscription: () => void): Observable<ObservedValueOf<R>> {
  let activeObservable: Optional<Observable<ObservedValueOf<R>>>
  let activeCount = 0
  return new Observable<ObservedValueOf<R>>((subscriber) => {
    if (!isDefine(activeObservable)) {
      beforeFirstSubscription()
      activeObservable = from(observableFactory())
    }
    activeCount++
    activeObservable.subscribe(subscriber).add(() => {
      activeCount--
      if (activeCount === 0) {
        activeObservable = null
        afterLastUnsubscription()
      }
    })
  })
}