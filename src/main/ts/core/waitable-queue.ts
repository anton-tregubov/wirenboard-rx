import { pull } from 'lodash-es'
import { isDefine, Optional } from '@main/core/utils'

export class WaitableQueue<T> {
  private readonly _queue: T[]
  private _waitPromise: Optional<Promise<void>>
  private _waitPromiseResolveFunction: Optional<() => void>

  public constructor() {
    this._queue = []
  }

  public add(t: T): void {
    this._queue.push(t)
  }

  public remove(t: T): void {
    pull(this._queue, t)
    if (this._queue.length === 0) {
      this._waitPromiseResolveFunction?.()
      this._waitPromise = undefined
      this._waitPromiseResolveFunction = undefined
    }
  }

  async waitEmpty(): Promise<void> {
    if (this._queue.length === 0) {
      return
    }
    if (isDefine(this._waitPromise)) {
      return this._waitPromise
    }
    return this._waitPromise = new Promise(resolve => this._waitPromiseResolveFunction = resolve)
  }
}