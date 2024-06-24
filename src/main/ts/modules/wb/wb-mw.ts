import { Integer, IntegerRange, range } from '@main/core/utils'
import {
  FIELD_DESTINY_READ,
  PhysicalWbDevice,
  TOPIC_VALUE_TEMPERATURE,
  TopicSubscriptionConfig,
} from '@main/modules/core/definitions'

const TOPIC_SENSOR = 'External Sensor'
const PROPERTY_SENSOR = 'sensor'

const M1W2_LAST_SENSOR_EXCLUSIVE = 3
const M1W2_FIRST_SENSOR_INCLUSIVE = 1

type SensorTopicSubscriptionConfig<Index extends Integer> = TopicSubscriptionConfig<`${typeof PROPERTY_SENSOR}${Index}`, typeof FIELD_DESTINY_READ, typeof TOPIC_VALUE_TEMPERATURE/*or raw number?*/>;

type WbMwSensorTopicsSubscriptionConfig<Count extends Integer> = {
  readonly [Index in Count as `${typeof TOPIC_SENSOR} ${Index}`]: SensorTopicSubscriptionConfig<Index>
}

type WbMwPrototypeConfig<Count extends Integer> =
  WbMwSensorTopicsSubscriptionConfig<Count>

type WbM1W2Config = WbMwPrototypeConfig<IntegerRange<typeof M1W2_FIRST_SENSOR_INCLUSIVE, typeof M1W2_LAST_SENSOR_EXCLUSIVE>>

export type WbM1W2Device = PhysicalWbDevice<WbM1W2Config>

function sensorTopicSubscriptionConfig<Index extends Integer>(index: Index): SensorTopicSubscriptionConfig<Index> {
  return {
    fieldBaseName: `${PROPERTY_SENSOR}${index}`,
    fieldDestiny: FIELD_DESTINY_READ,
    fieldValueType: TOPIC_VALUE_TEMPERATURE,
  }
}

function sensorsTopicSubscriptionConfig<F extends Integer, T extends Integer, Index extends IntegerRange<F, T>>(from: F, to: T): WbMwSensorTopicsSubscriptionConfig<Index> {
  return [...range(from, to)]
    .reduce(
      (collector, index) => Object.assign(collector, { [`${TOPIC_SENSOR} ${index}`]: sensorTopicSubscriptionConfig(+index) }),
      {} as WbMwSensorTopicsSubscriptionConfig<Index>)
}

export const WB_M1W2_CONFIG: WbM1W2Config = {
  ...sensorsTopicSubscriptionConfig(M1W2_FIRST_SENSOR_INCLUSIVE, M1W2_LAST_SENSOR_EXCLUSIVE),
}

export const WB_M1W2_TOPIC_IDENTIFIER = 'wb-m1w2'
