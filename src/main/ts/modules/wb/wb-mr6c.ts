import { Integer, IntegerRange, range } from '@main/core/utils'
import {
  CONTROL_TYPE_READ,
  CONTROL_TYPE_READ_AND_WRITE,
  ControlMeta,
  PhysicalColdWbDevice,
  PhysicalHotWbDevice,
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

type RelayTopicSubscriptionConfig<Index extends Integer> = TopicSubscriptionConfig<`${typeof PROPERTY_RELAY}${Index}`, boolean, typeof CONTROL_TYPE_READ_AND_WRITE, ControlMeta>;
type InputTopicSubscriptionConfig<Index extends Integer> = TopicSubscriptionConfig<`${typeof PROPERTY_INPUT}${Index}`, boolean, typeof CONTROL_TYPE_READ, ControlMeta>;
type InputPressCountTopicSubscriptionConfig<Index extends Integer, PressType extends string> = TopicSubscriptionConfig<`${typeof PROPERTY_INPUT}${Index}${typeof PROPERTY_PRESS}${PressType}${typeof PROPERTY_COUNTER}`, Integer, typeof CONTROL_TYPE_READ, ControlMeta>;

type WbMrcRelayTopicsSubscriptionConfig<Count extends Integer> = {
  readonly [Index in Count as `${typeof TOPIC_RELAY}${Index}`]: RelayTopicSubscriptionConfig<Index>
}
type WbMrcInputTopicsSubscriptionConfig<Count extends Integer> = {
  readonly [Index in Count as `${typeof TOPIC_INPUT} ${Index}`]: InputTopicSubscriptionConfig<Index>
}
type WbMrcPressInputCountTopicsSubscriptionConfig<Count extends Integer, PressType extends PressTypes> = {
  readonly [Index in Count as `${typeof TOPIC_INPUT} ${PressType} ${Index} ${typeof TOPIC_COUNTER}`]: InputPressCountTopicSubscriptionConfig<Index, PressType>
}

type WbMrcConfig<Count extends Integer, PressType extends PressTypes> =
  WbMrcRelayTopicsSubscriptionConfig<Count>
  & WbMrcInputTopicsSubscriptionConfig<Count>
  & WbMrcPressInputCountTopicsSubscriptionConfig<Count, PressType>

type WbMr6cConfig = WbMrcConfig<IntegerRange<1, 7>, typeof PRESS_TYPE_SINGLE | typeof PRESS_TYPE_DOUBLE | typeof PRESS_TYPE_LONG>

export type ColdWbMr6c = PhysicalColdWbDevice<WbMr6cConfig>
export type HotWbMr6c = PhysicalHotWbDevice<WbMr6cConfig>

function relayTopicSubscriptionConfig<Index extends Integer>(index: Index): RelayTopicSubscriptionConfig<Index> {
  return {
    fieldName: `${PROPERTY_RELAY}${index}`,
    controlType: CONTROL_TYPE_READ_AND_WRITE,
    valueType: undefined as never,
    controlMeta: undefined as never,
  }
}

function inputTopicSubscriptionConfig<Index extends Integer>(index: Index): InputTopicSubscriptionConfig<Index> {
  return {
    fieldName: `${PROPERTY_INPUT}${index}`,
    controlType: CONTROL_TYPE_READ,
    valueType: undefined as never,
    controlMeta: undefined as never,
  }
}

function inputPressCountTopicSubscriptionConfig<Index extends Integer, PressType extends PressTypes>(index: Index, pressType: PressType): InputPressCountTopicSubscriptionConfig<Index, PressType> {
  return {
    fieldName: `${PROPERTY_INPUT}${index}${PROPERTY_PRESS}${pressType}${PROPERTY_COUNTER}`,
    controlType: CONTROL_TYPE_READ,
    valueType: undefined as never,
    controlMeta: undefined as never,
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
  ...relaysTopicSubscriptionConfig(1, 7),
  ...inputsTopicSubscriptionConfig(1, 7),
  ...inputPressCountsTopicSubscriptionConfig(1, 7, [PRESS_TYPE_SINGLE, PRESS_TYPE_DOUBLE, PRESS_TYPE_LONG]),

}

export const WB_MR6C_TOPIC_PREFIX = 'wb-mr6c'
