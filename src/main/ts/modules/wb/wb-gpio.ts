import { Integer, IntegerRange, range } from '@main/core/utils'
import {
  FIELD_DESTINY_READ,
  FIELD_DESTINY_READ_AND_WRITE,
  PhysicalWbDevice,
  TOPIC_VALUE_SWITCH,
  TopicSubscriptionConfig,
} from '@main/modules/core/definitions'

export const EXT_PREFIX = 'EXT'
const DI_WD_IN_SENSOR = 'IN'
const DO_R10A_OUT_SENSOR = 'R3A'

const PROPERTY_DI_WD_IN = 'in'
const PROPERTY_DO_R10A_OUT = 'out'

const DI_WD_14_LAST_SENSOR_EXCLUSIVE = 15
const DI_WD_14_FIRST_SENSOR_INCLUSIVE = 1

const DO_R10A_8_LAST_SENSOR_EXCLUSIVE = 9
const DO_R10A_8_FIRST_SENSOR_INCLUSIVE = 1

type DiWdInTopicSubscriptionConfig<Index extends Integer> = TopicSubscriptionConfig<`${typeof PROPERTY_DI_WD_IN}${Index}`, typeof FIELD_DESTINY_READ, typeof TOPIC_VALUE_SWITCH>;
type DoR10AOutTopicSubscriptionConfig<Index extends Integer> = TopicSubscriptionConfig<`${typeof PROPERTY_DO_R10A_OUT}${Index}`, typeof FIELD_DESTINY_READ_AND_WRITE, typeof TOPIC_VALUE_SWITCH>;

type DiWdInsTopicsSubscriptionConfig<Count extends Integer> = {
  readonly [Index in Count as `${typeof DI_WD_IN_SENSOR}${Index}`]: DiWdInTopicSubscriptionConfig<Index>
}

type DoR10AOutsTopicsSubscriptionConfig<Count extends Integer> = {
  readonly [Index in Count as `${typeof DO_R10A_OUT_SENSOR}${Index}`]: DoR10AOutTopicSubscriptionConfig<Index>
}

type DiWdPrototypeConfig<Count extends Integer> = DiWdInsTopicsSubscriptionConfig<Count>
type DoR10APrototypeConfig<Count extends Integer> = DoR10AOutsTopicsSubscriptionConfig<Count>

type WbDiWd14Config = DiWdPrototypeConfig<IntegerRange<typeof DI_WD_14_FIRST_SENSOR_INCLUSIVE, typeof DI_WD_14_LAST_SENSOR_EXCLUSIVE>>
type WbDoR10A8Config = DoR10APrototypeConfig<IntegerRange<typeof DO_R10A_8_FIRST_SENSOR_INCLUSIVE, typeof DO_R10A_8_LAST_SENSOR_EXCLUSIVE>>

export type WbDiWd14Device = PhysicalWbDevice<WbDiWd14Config>
export type WbDoR10A8Device = PhysicalWbDevice<WbDoR10A8Config>

function diWdInTopicSubscriptionConfig<Index extends Integer>(index: Index): DiWdInTopicSubscriptionConfig<Index> {
  return {
    fieldBaseName: `${PROPERTY_DI_WD_IN}${index}`,
    fieldDestiny: FIELD_DESTINY_READ,
    fieldValueType: TOPIC_VALUE_SWITCH,
  }
}

function doR10AOutTopicSubscriptionConfig<Index extends Integer>(index: Index): DoR10AOutTopicSubscriptionConfig<Index> {
  return {
    fieldBaseName: `${PROPERTY_DO_R10A_OUT}${index}`,
    fieldDestiny: FIELD_DESTINY_READ_AND_WRITE,
    fieldValueType: TOPIC_VALUE_SWITCH,
  }
}

function diWdInsTopicSubscriptionConfig<F extends Integer, T extends Integer, Index extends IntegerRange<F, T>>(from: F, to: T): DiWdInsTopicsSubscriptionConfig<Index> {
  return [...range(from, to)]
    .reduce(
      (collector, index) => Object.assign(collector, { [`${DI_WD_IN_SENSOR}${index}`]: diWdInTopicSubscriptionConfig(+index) }),
      {} as DiWdInsTopicsSubscriptionConfig<Index>)
}

function doR10AOutsTopicSubscriptionConfig<F extends Integer, T extends Integer, Index extends IntegerRange<F, T>>(from: F, to: T): DoR10AOutsTopicsSubscriptionConfig<Index> {
  return [...range(from, to)]
    .reduce(
      (collector, index) => Object.assign(collector, { [`${DO_R10A_OUT_SENSOR}${index}`]: doR10AOutTopicSubscriptionConfig(+index) }),
      {} as DoR10AOutsTopicsSubscriptionConfig<Index>)
}

export const WB_DI_WD_14_CONFIG: WbDiWd14Config = {
  ...diWdInsTopicSubscriptionConfig(DI_WD_14_FIRST_SENSOR_INCLUSIVE, DI_WD_14_LAST_SENSOR_EXCLUSIVE),
}

export const WB_DO_R10A_8_CONFIG: WbDoR10A8Config = {
  ...doR10AOutsTopicSubscriptionConfig(DO_R10A_8_FIRST_SENSOR_INCLUSIVE, DO_R10A_8_LAST_SENSOR_EXCLUSIVE),
}

export const WB_GPIO_TOPIC_IDENTIFIER = 'wb-gpio'
