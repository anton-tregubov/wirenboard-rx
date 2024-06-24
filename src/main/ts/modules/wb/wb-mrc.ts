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
const TOPIC_INPUT = 'Input'
const TOPIC_COUNTER = 'Counter'

const PROPERTY_RELAY = 'relay'
const PROPERTY_INPUT = 'input'
const PROPERTY_PRESS = 'Press'
const PROPERTY_COUNTER = 'Count'

const PRESS_TYPE_SINGLE = 'Single'
const PRESS_TYPE_DOUBLE = 'Double'
const PRESS_TYPE_LONG = 'Long'

type PressTypes = typeof PRESS_TYPE_SINGLE | typeof PRESS_TYPE_DOUBLE | typeof PRESS_TYPE_LONG

type RelayTopicSubscriptionConfig<Index extends Integer> = TopicSubscriptionConfig<`${typeof PROPERTY_RELAY}${Index}`, typeof FIELD_DESTINY_READ_AND_WRITE, typeof TOPIC_VALUE_SWITCH>;
type InputTopicSubscriptionConfig<Index extends Integer> = TopicSubscriptionConfig<`${typeof PROPERTY_INPUT}${Index}`, typeof FIELD_DESTINY_READ, typeof TOPIC_VALUE_SWITCH>;
type InputPressCountTopicSubscriptionConfig<Index extends Integer, PressType extends PressTypes> = TopicSubscriptionConfig<`${typeof PROPERTY_INPUT}${Index}${typeof PROPERTY_PRESS}${PressType}${typeof PROPERTY_COUNTER}`, typeof FIELD_DESTINY_READ, typeof TOPIC_VALUE_COUNTER>;

type WbMrcRelayTopicsSubscriptionConfig<Count extends Integer> = {
  readonly [Index in Count as `${typeof TOPIC_RELAY}${Index}`]: RelayTopicSubscriptionConfig<Index>
}
type WbMrcInputTopicsSubscriptionConfig<Count extends Integer> = {
  readonly [Index in Count as `${typeof TOPIC_INPUT} ${Index}`]: InputTopicSubscriptionConfig<Index>
}
type WbMrcPressInputCountTopicsSubscriptionConfig<Count extends Integer, PressType extends PressTypes> = {
  readonly [Index in Count as `${typeof TOPIC_INPUT} ${PressType} ${Index} ${typeof TOPIC_COUNTER}`]: InputPressCountTopicSubscriptionConfig<Index, PressType>
}

type WbMrcPrototypeConfig<Count extends Integer, PressType extends PressTypes> =
  WbMrcRelayTopicsSubscriptionConfig<Count>
  & WbMrcInputTopicsSubscriptionConfig<Count>
  & WbMrcPressInputCountTopicsSubscriptionConfig<Count, PressType>

const MR6C_FIRST_CHANNEL_INCLUSIVE = 1
const MR6C_LAST_CHANNEL_EXCLUSIVE = 7

type WbMr6cConfig = WbMrcPrototypeConfig<IntegerRange<typeof MR6C_FIRST_CHANNEL_INCLUSIVE, typeof MR6C_LAST_CHANNEL_EXCLUSIVE>, typeof PRESS_TYPE_SINGLE | typeof PRESS_TYPE_DOUBLE | typeof PRESS_TYPE_LONG>

export type WbMr6cDevice = PhysicalWbDevice<WbMr6cConfig>

function relayTopicSubscriptionConfig<Index extends Integer>(index: Index): RelayTopicSubscriptionConfig<Index> {
  return {
    fieldBaseName: `${PROPERTY_RELAY}${index}`,
    fieldDestiny: FIELD_DESTINY_READ_AND_WRITE,
    fieldValueType: TOPIC_VALUE_SWITCH,
  }
}

function inputTopicSubscriptionConfig<Index extends Integer>(index: Index): InputTopicSubscriptionConfig<Index> {
  return {
    fieldBaseName: `${PROPERTY_INPUT}${index}`,
    fieldDestiny: FIELD_DESTINY_READ,
    fieldValueType: TOPIC_VALUE_SWITCH,
  }
}

function inputPressCountTopicSubscriptionConfig<Index extends Integer, PressType extends PressTypes>(index: Index, pressType: PressType): InputPressCountTopicSubscriptionConfig<Index, PressType> {
  return {
    fieldBaseName: `${PROPERTY_INPUT}${index}${PROPERTY_PRESS}${pressType}${PROPERTY_COUNTER}`,
    fieldDestiny: FIELD_DESTINY_READ,
    fieldValueType: TOPIC_VALUE_COUNTER,
  }
}

function relaysTopicSubscriptionConfig<F extends Integer, T extends Integer, Index extends IntegerRange<F, T>>(from: F, to: T): WbMrcRelayTopicsSubscriptionConfig<Index> {
  return [...range(from, to)]
    .reduce(
      (collector, index) => Object.assign(collector, { [`${TOPIC_RELAY}${index}`]: relayTopicSubscriptionConfig(+index) }),
      {} as WbMrcRelayTopicsSubscriptionConfig<Index>)
}

function inputsTopicSubscriptionConfig<F extends Integer, T extends Integer, Index extends IntegerRange<F, T>>(from: F, to: T): WbMrcInputTopicsSubscriptionConfig<Index> {
  return [...range(from, to)]
    .reduce(
      (collector, index) => Object.assign(collector, { [`${TOPIC_INPUT} ${index}`]: inputTopicSubscriptionConfig(+index) }),
      {} as WbMrcInputTopicsSubscriptionConfig<Index>)
}

function inputPressCountsTopicSubscriptionConfig<F extends Integer, T extends Integer, PressType extends PressTypes, Index extends IntegerRange<F, T>>(from: F, to: T, pressTypes: PressType[]): WbMrcPressInputCountTopicsSubscriptionConfig<Index, PressType> {
  return [...range(from, to)]
    .flatMap(index => pressTypes.map(pressType => ({ index, pressType })))
    .reduce(
      (collector, pair) => Object.assign(collector, { [`${TOPIC_INPUT} ${pair.pressType} ${pair.index} ${TOPIC_COUNTER}`]: inputPressCountTopicSubscriptionConfig(+pair.index, pair.pressType) }),
      {} as WbMrcPressInputCountTopicsSubscriptionConfig<Index, PressType>)
}

export const WB_MR6C_CONFIG: WbMr6cConfig = {
  ...relaysTopicSubscriptionConfig(MR6C_FIRST_CHANNEL_INCLUSIVE, MR6C_LAST_CHANNEL_EXCLUSIVE),
  ...inputsTopicSubscriptionConfig(MR6C_FIRST_CHANNEL_INCLUSIVE, MR6C_LAST_CHANNEL_EXCLUSIVE),
  ...inputPressCountsTopicSubscriptionConfig(MR6C_FIRST_CHANNEL_INCLUSIVE, MR6C_LAST_CHANNEL_EXCLUSIVE, [PRESS_TYPE_SINGLE, PRESS_TYPE_DOUBLE, PRESS_TYPE_LONG]),

}

export const WB_MR6C_TOPIC_IDENTIFIER = 'wb-mr6c'
