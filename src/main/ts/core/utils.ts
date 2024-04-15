export type Optional<T> = T | null | undefined
export type Integer = number
export type Count = Integer

export function isDefine<T>(t: Optional<T>): t is T {
  return t !== null && t !== undefined
}