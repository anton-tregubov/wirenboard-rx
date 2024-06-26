import { Integer, IntegerRange, range } from '@main/core/utils'
import {
  FIELD_DESTINY_ACTION,
  PhysicalWbDevice,
  TOPIC_VALUE_ACTION,
  TopicSubscriptionConfig,
} from '@main/modules/core/definitions'

const TOPIC_PLAY = 'Play from ROM'
const PROPERTY_PLAY = 'play'

const MIR_LAST_ROM_EXCLUSIVE = 100
const MIR_FIRST_ROM_INCLUSIVE = 1

type PlayTopicSubscriptionConfig<Index extends Integer> = TopicSubscriptionConfig<`${typeof PROPERTY_PLAY}${Index}`, typeof FIELD_DESTINY_ACTION, typeof TOPIC_VALUE_ACTION>;

type WbMirPlayTopicsSubscriptionConfig<Count extends Integer> = {
  readonly [Index in Count as `${typeof TOPIC_PLAY}${Index}`]: PlayTopicSubscriptionConfig<Index>
}

type WbMirPrototypeConfig<IrCount extends Integer> =
  WbMirPlayTopicsSubscriptionConfig<IrCount>

type WbMirConfig = WbMirPrototypeConfig<IntegerRange<typeof MIR_FIRST_ROM_INCLUSIVE, typeof MIR_LAST_ROM_EXCLUSIVE>>

export type WbMirDevice = PhysicalWbDevice<WbMirConfig>

function playTopicSubscriptionConfig<Index extends Integer>(index: Index): PlayTopicSubscriptionConfig<Index> {
  return {
    fieldBaseName: `${PROPERTY_PLAY}${index}`,
    fieldDestiny: FIELD_DESTINY_ACTION,
    fieldValueType: TOPIC_VALUE_ACTION,
  }
}

function playsTopicSubscriptionConfig<F extends Integer, T extends Integer, Index extends IntegerRange<F, T>>(from: F, to: T): WbMirPlayTopicsSubscriptionConfig<Index> {
  return [...range(from, to)]
    .reduce(
      (collector, index) => Object.assign(collector, { [`${TOPIC_PLAY}${index}`]: playTopicSubscriptionConfig(+index) }),
      {} as WbMirPlayTopicsSubscriptionConfig<Index>)
}

export const WB_MIR_CONFIG: WbMirConfig = {
  ...playsTopicSubscriptionConfig(MIR_FIRST_ROM_INCLUSIVE, MIR_LAST_ROM_EXCLUSIVE),
}

export const WB_MIR_TOPIC_IDENTIFIER = 'wb-mir_v2'
