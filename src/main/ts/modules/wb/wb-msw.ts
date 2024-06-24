import { Integer, IntegerRange, range } from '@main/core/utils'
import {
  FIELD_DESTINY_ACTION,
  FIELD_DESTINY_READ,
  FIELD_DESTINY_READ_AND_WRITE,
  PhysicalWbDevice,
  TOPIC_VALUE_ACTION,
  TOPIC_VALUE_CO2,
  TOPIC_VALUE_HUMIDITY,
  TOPIC_VALUE_ILLUMINANCE,
  TOPIC_VALUE_MOTION,
  TOPIC_VALUE_SOUND_LEVEL,
  TOPIC_VALUE_SWITCH,
  TOPIC_VALUE_TEMPERATURE,
  TopicSubscriptionConfig,
} from '@main/modules/core/definitions'

const TOPIC_TEMPERATURE = 'Temperature'
const TOPIC_HUMIDITY = 'Humidity'
const TOPIC_CO2 = 'CO2'
const TOPIC_SOUND_LEVEL = 'Sound Level'
const TOPIC_ILLUMINANCE = 'Illuminance'
const TOPIC_MOTION_SUFFIX = 'Motion'
const TOPIC_BUZZER = 'Buzzer'
const TOPIC_LED_SUFFIX = 'LED'
const TOPIC_PLAY = 'Play from ROM'

const MOTION_TYPE_MAX = 'Max'
const MOTION_TYPE_CURRENT = 'Current'

const LED_TYPE_RED = 'Red'
const LED_TYPE_GREEN = 'Green'

type MotionType = typeof MOTION_TYPE_MAX | typeof MOTION_TYPE_CURRENT
type LedType = typeof LED_TYPE_RED | typeof LED_TYPE_GREEN

const PROPERTY_TEMPERATURE = 'temperature'
const PROPERTY_HUMIDITY = 'humidity'
const PROPERTY_CO2 = 'co2'
const PROPERTY_SOUND_LEVEL = 'soundLevel'
const PROPERTY_ILLUMINANCE = 'illuminance'
const PROPERTY_MOTION = 'motion'
const PROPERTY_BUZZER = 'buzzer'
const PROPERTY_LED = 'led'
const PROPERTY_PLAY = 'play'

type TemperatureTopicSubscriptionConfig = TopicSubscriptionConfig<`${typeof PROPERTY_TEMPERATURE}`, typeof FIELD_DESTINY_READ, typeof TOPIC_VALUE_TEMPERATURE>;
type HumidityTopicSubscriptionConfig = TopicSubscriptionConfig<`${typeof PROPERTY_HUMIDITY}`, typeof FIELD_DESTINY_READ, typeof TOPIC_VALUE_HUMIDITY>;
type CO2TopicSubscriptionConfig = TopicSubscriptionConfig<`${typeof PROPERTY_CO2}`, typeof FIELD_DESTINY_READ, typeof TOPIC_VALUE_CO2>;
type SoundLevelTopicSubscriptionConfig = TopicSubscriptionConfig<`${typeof PROPERTY_SOUND_LEVEL}`, typeof FIELD_DESTINY_READ, typeof TOPIC_VALUE_SOUND_LEVEL>;
type IlluminanceTopicSubscriptionConfig = TopicSubscriptionConfig<`${typeof PROPERTY_ILLUMINANCE}`, typeof FIELD_DESTINY_READ, typeof TOPIC_VALUE_ILLUMINANCE>;
type MotionTopicSubscriptionConfig<Type extends MotionType> = TopicSubscriptionConfig<`${typeof PROPERTY_MOTION}${Type}`, typeof FIELD_DESTINY_READ, typeof TOPIC_VALUE_MOTION>;
type BuzzerTopicSubscriptionConfig = TopicSubscriptionConfig<`${typeof PROPERTY_BUZZER}`, typeof FIELD_DESTINY_READ_AND_WRITE, typeof TOPIC_VALUE_SWITCH>;
type LedTopicSubscriptionConfig<Type extends LedType> = TopicSubscriptionConfig<`${typeof PROPERTY_LED}${Type}`, typeof FIELD_DESTINY_READ_AND_WRITE, typeof TOPIC_VALUE_SWITCH>;
type PlayTopicSubscriptionConfig<Index extends Integer> = TopicSubscriptionConfig<`${typeof PROPERTY_PLAY}${Index}`, typeof FIELD_DESTINY_ACTION, typeof TOPIC_VALUE_ACTION>;

type WbMswTemperatureTopicsSubscriptionConfig = {
  readonly [TOPIC_TEMPERATURE]: TemperatureTopicSubscriptionConfig
}
type WbMswHumidityTopicsSubscriptionConfig = {
  readonly [TOPIC_HUMIDITY]: HumidityTopicSubscriptionConfig
}
type WbMswCO2TopicsSubscriptionConfig = {
  readonly [TOPIC_CO2]: CO2TopicSubscriptionConfig
}
type WbMswSoundLevelTopicsSubscriptionConfig = {
  readonly [TOPIC_SOUND_LEVEL]: SoundLevelTopicSubscriptionConfig
}
type WbMswIlluminanceTopicsSubscriptionConfig = {
  readonly [TOPIC_ILLUMINANCE]: IlluminanceTopicSubscriptionConfig
}
type WbMswMotionTopicsSubscriptionConfig<Types extends MotionType> = {
  readonly [Type in Types as `${Type} ${typeof TOPIC_MOTION_SUFFIX}`]: MotionTopicSubscriptionConfig<Type>
}
type WbMswBuzzerTopicsSubscriptionConfig = {
  readonly [TOPIC_BUZZER]: BuzzerTopicSubscriptionConfig
}
type WbMswLedTopicsSubscriptionConfig<Types extends LedType> = {
  readonly [Type in Types as `${Type} ${typeof TOPIC_LED_SUFFIX}`]: LedTopicSubscriptionConfig<Type>
}
type WbMswPlayTopicsSubscriptionConfig<Count extends Integer> = {
  readonly [Index in Count as `${typeof TOPIC_PLAY}${Index}`]: PlayTopicSubscriptionConfig<Index>
}

type WbMswPrototypeConfig<MotionTypes extends MotionType, LedTypes extends LedType, IrCount extends Integer> =
  WbMswTemperatureTopicsSubscriptionConfig
  & WbMswHumidityTopicsSubscriptionConfig
  & WbMswCO2TopicsSubscriptionConfig
  & WbMswSoundLevelTopicsSubscriptionConfig
  & WbMswIlluminanceTopicsSubscriptionConfig
  & WbMswMotionTopicsSubscriptionConfig<MotionTypes>
  & WbMswBuzzerTopicsSubscriptionConfig
  & WbMswLedTopicsSubscriptionConfig<LedTypes>
  & WbMswPlayTopicsSubscriptionConfig<IrCount>

const MSW_LAST_ROM_EXCLUSIVE = 100
const MSW_FIRST_ROM_INCLUSIVE = 1

type WbMswConfig = WbMswPrototypeConfig<typeof MOTION_TYPE_CURRENT | typeof MOTION_TYPE_MAX, typeof LED_TYPE_GREEN | typeof LED_TYPE_RED, IntegerRange<typeof MSW_FIRST_ROM_INCLUSIVE, typeof MSW_LAST_ROM_EXCLUSIVE>>

export type WbMswDevice = PhysicalWbDevice<WbMswConfig>

function temperatureTopicSubscriptionConfig(): TemperatureTopicSubscriptionConfig {
  return {
    fieldBaseName: PROPERTY_TEMPERATURE,
    fieldDestiny: FIELD_DESTINY_READ,
    fieldValueType: TOPIC_VALUE_TEMPERATURE,
  }
}

function humidityTopicSubscriptionConfig(): HumidityTopicSubscriptionConfig {
  return {
    fieldBaseName: PROPERTY_HUMIDITY,
    fieldDestiny: FIELD_DESTINY_READ,
    fieldValueType: TOPIC_VALUE_HUMIDITY,
  }
}

function co2TopicSubscriptionConfig(): CO2TopicSubscriptionConfig {
  return {
    fieldBaseName: PROPERTY_CO2,
    fieldDestiny: FIELD_DESTINY_READ,
    fieldValueType: TOPIC_VALUE_CO2,
  }
}

function soundLevelTopicSubscriptionConfig(): SoundLevelTopicSubscriptionConfig {
  return {
    fieldBaseName: PROPERTY_SOUND_LEVEL,
    fieldDestiny: FIELD_DESTINY_READ,
    fieldValueType: TOPIC_VALUE_SOUND_LEVEL,
  }
}

function illuminanceTopicSubscriptionConfig(): IlluminanceTopicSubscriptionConfig {
  return {
    fieldBaseName: PROPERTY_ILLUMINANCE,
    fieldDestiny: FIELD_DESTINY_READ,
    fieldValueType: TOPIC_VALUE_ILLUMINANCE,
  }
}

function motionTopicSubscriptionConfig<Type extends MotionType>(type: Type): MotionTopicSubscriptionConfig<Type> {
  return {
    fieldBaseName: `${PROPERTY_MOTION}${type}`,
    fieldDestiny: FIELD_DESTINY_READ,
    fieldValueType: TOPIC_VALUE_MOTION,
  }
}

function buzzerTopicSubscriptionConfig(): BuzzerTopicSubscriptionConfig {
  return {
    fieldBaseName: PROPERTY_BUZZER,
    fieldDestiny: FIELD_DESTINY_READ_AND_WRITE,
    fieldValueType: TOPIC_VALUE_SWITCH,
  }
}

function ledTopicSubscriptionConfig<Type extends LedType>(type: Type): LedTopicSubscriptionConfig<Type> {
  return {
    fieldBaseName: `${PROPERTY_LED}${type}`,
    fieldDestiny: FIELD_DESTINY_READ_AND_WRITE,
    fieldValueType: TOPIC_VALUE_SWITCH,
  }
}

function playTopicSubscriptionConfig<Index extends Integer>(index: Index): PlayTopicSubscriptionConfig<Index> {
  return {
    fieldBaseName: `${PROPERTY_PLAY}${index}`,
    fieldDestiny: FIELD_DESTINY_ACTION,
    fieldValueType: TOPIC_VALUE_ACTION,
  }
}

function motionsTopicSubscriptionConfig<Type extends MotionType>(types: Type[]): WbMswMotionTopicsSubscriptionConfig<Type> {
  return types
    .reduce(
      (collector, type) => Object.assign(collector, { [`${type} ${TOPIC_MOTION_SUFFIX}`]: motionTopicSubscriptionConfig(type) }),
      {} as WbMswMotionTopicsSubscriptionConfig<Type>)
}

function ledsTopicSubscriptionConfig<Type extends LedType>(types: Type[]): WbMswLedTopicsSubscriptionConfig<Type> {
  return types
    .reduce(
      (collector, type) => Object.assign(collector, { [`${type} ${TOPIC_LED_SUFFIX}`]: ledTopicSubscriptionConfig(type) }),
      {} as WbMswLedTopicsSubscriptionConfig<Type>)
}

function playsTopicSubscriptionConfig<F extends Integer, T extends Integer, Index extends IntegerRange<F, T>>(from: F, to: T): WbMswPlayTopicsSubscriptionConfig<Index> {
  return [...range(from, to)]
    .reduce(
      (collector, index) => Object.assign(collector, { [`${TOPIC_PLAY}${index}`]: playTopicSubscriptionConfig(+index) }),
      {} as WbMswPlayTopicsSubscriptionConfig<Index>)
}

export const WB_MSW_CONFIG: WbMswConfig = {
  [TOPIC_TEMPERATURE]: temperatureTopicSubscriptionConfig(),
  [TOPIC_HUMIDITY]: humidityTopicSubscriptionConfig(),
  [TOPIC_CO2]: co2TopicSubscriptionConfig(),
  [TOPIC_SOUND_LEVEL]: soundLevelTopicSubscriptionConfig(),
  [TOPIC_ILLUMINANCE]: illuminanceTopicSubscriptionConfig(),
  ...motionsTopicSubscriptionConfig([MOTION_TYPE_CURRENT, MOTION_TYPE_MAX]),
  [TOPIC_BUZZER]: buzzerTopicSubscriptionConfig(),
  ...ledsTopicSubscriptionConfig([LED_TYPE_RED, LED_TYPE_GREEN]),
  ...playsTopicSubscriptionConfig(MSW_FIRST_ROM_INCLUSIVE, MSW_LAST_ROM_EXCLUSIVE),
}

export const WB_MSW_TOPIC_IDENTIFIER = 'wb-msw-v3'
