import { Integer, IntegerRange, range } from '@main/core/utils'
import {
  FIELD_DESTINY_READ,
  FIELD_DESTINY_READ_AND_WRITE,
  PhysicalWbDevice,
  TOPIC_VALUE_COUNTER,
  TOPIC_VALUE_SWITCH,
  TopicSubscriptionConfig,
} from '@main/modules/core/definitions'

const TOPIC_RELAY = 'K'
const TOPIC_COUNTER = 'Counter'
const TOPIC_ALARM = 'Alarm'

const PROPERTY_RELAY = 'relay'
const PROPERTY_INPUT = 'input'
const PROPERTY_COUNTER_SUFFIX = 'Count'
const PROPERTY_ALARM = 'alarm'

const INPUT_TYPE_S = 'S'
const INPUT_TYPE_F = 'F'

type InputTypes = typeof INPUT_TYPE_S | typeof INPUT_TYPE_F

type RelayTopicSubscriptionConfig<Index extends Integer> = TopicSubscriptionConfig<`${typeof PROPERTY_RELAY}${Index}`, typeof FIELD_DESTINY_READ_AND_WRITE, typeof TOPIC_VALUE_SWITCH>;
type InputTopicSubscriptionConfig<Type extends InputTypes, Index extends Integer> = TopicSubscriptionConfig<`${typeof PROPERTY_INPUT}${Type}${Index}`, typeof FIELD_DESTINY_READ, typeof TOPIC_VALUE_SWITCH>;
type InputCountTopicSubscriptionConfig<Type extends InputTypes, Index extends Integer> = TopicSubscriptionConfig<`${typeof PROPERTY_INPUT}${Type}${Index}${typeof PROPERTY_COUNTER_SUFFIX}`, typeof FIELD_DESTINY_READ, typeof TOPIC_VALUE_COUNTER>;
type AlarmTopicSubscriptionConfig = TopicSubscriptionConfig<`${typeof PROPERTY_ALARM}`, typeof FIELD_DESTINY_READ_AND_WRITE, typeof TOPIC_VALUE_SWITCH>;

type WbMWacRelayTopicsSubscriptionConfig<Count extends Integer> = {
  readonly [Index in Count as `${typeof TOPIC_RELAY}${Index}`]: RelayTopicSubscriptionConfig<Index>
}
type WbMWacInputTopicsSubscriptionConfig<Types extends InputTypes, Count extends Integer> = {
  readonly [Type in Types as `${Type}${Count}`]: InputTopicSubscriptionConfig<Type, Count>
}
type WbMWacInputCountTopicsSubscriptionConfig<Types extends InputTypes, Count extends Integer> = {
  readonly [Type in Types as `${Type}${Count} ${typeof TOPIC_COUNTER}`]: InputCountTopicSubscriptionConfig<Type, Count>
}
type WbMWacAlarmTopicsSubscriptionConfig = {
  readonly [TOPIC_ALARM]: AlarmTopicSubscriptionConfig
}

type WbMWacPrototypeConfig<Types extends InputTypes, RelayCount extends Integer, InputCount extends Integer> =
  WbMWacRelayTopicsSubscriptionConfig<RelayCount>
  & WbMWacInputTopicsSubscriptionConfig<Types, InputCount>
  & WbMWacInputCountTopicsSubscriptionConfig<Types, InputCount>
  & WbMWacAlarmTopicsSubscriptionConfig

const MWAC_FIRST_RELAY_INCLUSIVE = 1
const MWAC_LAST_RELAY_EXCLUSIVE = 3
const MWAC_FIRST_INPUT_INCLUSIVE = 1
const MWAC_LAST_INPUT_EXCLUSIVE = 4

type WbMWacConfig = WbMWacPrototypeConfig<typeof INPUT_TYPE_S | typeof INPUT_TYPE_F, IntegerRange<typeof MWAC_FIRST_RELAY_INCLUSIVE, typeof MWAC_LAST_RELAY_EXCLUSIVE>, IntegerRange<typeof MWAC_FIRST_INPUT_INCLUSIVE, typeof MWAC_LAST_INPUT_EXCLUSIVE>>

export type WbMWacDevice = PhysicalWbDevice<WbMWacConfig>

function relayTopicSubscriptionConfig<Index extends Integer>(index: Index): RelayTopicSubscriptionConfig<Index> {
  return {
    fieldBaseName: `${PROPERTY_RELAY}${index}`,
    fieldDestiny: FIELD_DESTINY_READ_AND_WRITE,
    fieldValueType: TOPIC_VALUE_SWITCH,
  }
}

function inputTopicSubscriptionConfig<Type extends InputTypes, Index extends Integer>(type: Type, index: Index): InputTopicSubscriptionConfig<Type, Index> {
  return {
    fieldBaseName: `${PROPERTY_INPUT}${type}${index}`,
    fieldDestiny: FIELD_DESTINY_READ,
    fieldValueType: TOPIC_VALUE_SWITCH,
  }
}

function inputCountTopicSubscriptionConfig<Type extends InputTypes, Index extends Integer>(type: Type, index: Index): InputCountTopicSubscriptionConfig<Type, Index> {
  return {
    fieldBaseName: `${PROPERTY_INPUT}${type}${index}${PROPERTY_COUNTER_SUFFIX}`,
    fieldDestiny: FIELD_DESTINY_READ,
    fieldValueType: TOPIC_VALUE_COUNTER,
  }
}

function alarmTopicSubscriptionConfig(): AlarmTopicSubscriptionConfig {
  return {
    fieldBaseName: `${PROPERTY_ALARM}`,
    fieldDestiny: FIELD_DESTINY_READ_AND_WRITE,
    fieldValueType: TOPIC_VALUE_SWITCH,
  }
}

function relaysTopicSubscriptionConfig<F extends Integer, T extends Integer, Index extends IntegerRange<F, T>>(from: F, to: T): WbMWacRelayTopicsSubscriptionConfig<Index> {
  return [...range(from, to)]
    .reduce(
      (collector, index) => Object.assign(collector, { [`${TOPIC_RELAY}${index}`]: relayTopicSubscriptionConfig(+index) }),
      {} as WbMWacRelayTopicsSubscriptionConfig<Index>)
}

function inputsTopicSubscriptionConfig<Type extends InputTypes, F extends Integer, T extends Integer, Index extends IntegerRange<F, T>>(types: Type[], from: F, to: T): WbMWacInputTopicsSubscriptionConfig<Type, Index> {
  return [...range(from, to)]
    .flatMap(index => types.map(type => ({ type, index })))
    .reduce(
      (collector, pair) => Object.assign(collector, { [`${pair.type}${pair.index}`]: inputTopicSubscriptionConfig(pair.type, +pair.index) }),
      {} as WbMWacInputTopicsSubscriptionConfig<Type, Index>)
}

function inputCountersTopicSubscriptionConfig<Type extends InputTypes, F extends Integer, T extends Integer, Index extends IntegerRange<F, T>>(types: Type[], from: F, to: T): WbMWacInputCountTopicsSubscriptionConfig<Type, Index> {
  return [...range(from, to)]
    .flatMap(index => types.map(type => ({ type, index })))
    .reduce(
      (collector, pair) => Object.assign(collector, { [`${pair.type}${pair.index}`]: inputCountTopicSubscriptionConfig(pair.type, +pair.index) }),
      {} as WbMWacInputCountTopicsSubscriptionConfig<Type, Index>)
}

export const WB_MWAC_CONFIG: WbMWacConfig = {
  ...relaysTopicSubscriptionConfig(MWAC_FIRST_RELAY_INCLUSIVE, MWAC_LAST_RELAY_EXCLUSIVE),
  ...inputsTopicSubscriptionConfig([INPUT_TYPE_S, INPUT_TYPE_F], MWAC_FIRST_INPUT_INCLUSIVE, MWAC_LAST_INPUT_EXCLUSIVE),
  ...inputCountersTopicSubscriptionConfig([INPUT_TYPE_S, INPUT_TYPE_F], MWAC_FIRST_INPUT_INCLUSIVE, MWAC_LAST_INPUT_EXCLUSIVE),
  [TOPIC_ALARM]: alarmTopicSubscriptionConfig(),

}

export const WB_MWAC_TOPIC_IDENTIFIER = 'wb-mwac'
