export type Optional<T> = T | null | undefined
export type Integer = number
export type Duration = number/*ms*/

type IntegerEnumerate<N extends Integer, Acc extends Integer[] = []> = Acc['length'] extends N
  ? Acc[Integer]
  : IntegerEnumerate<N, [...Acc, Acc['length']]>

export type IntegerRange<F extends number, T extends number> = Exclude<IntegerEnumerate<T>, IntegerEnumerate<F>>

export function isDefine<T>(t: Optional<T>): t is T {
  return t !== null && t !== undefined
}

export function * range<From extends Integer, To extends Integer>(from: From, to: To): Generator<IntegerRange<From, To>[]> {
  for (let i = from; i < to; i++) {
    yield i as IntegerRange<From, To>
  }
}

export function propertyKeys<Jso extends Record<Exclude<PropertyKey, number>, unknown>>(jso: Jso): (keyof Jso)[] {
  return Reflect.ownKeys(jso) as (keyof Jso)[]
}