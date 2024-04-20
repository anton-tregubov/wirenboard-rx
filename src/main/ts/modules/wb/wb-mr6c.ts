import { Count } from '@main/core/utils'
import {
  ChannelDefinition,
  CONTROL_TYPE_READ,
  CONTROL_TYPE_READ_AND_WRITE,
  ControlMeta,
  PhysicalColdWbDevice,
  PhysicalHotWbDevice,
} from '@main/modules/wb/wb-commn'

type WbMrcRelayConfig<Channels extends Count> = {
  readonly [Channel in Channels as `K${Channel}`]: ChannelDefinition<`relay${Channel}`, boolean, typeof CONTROL_TYPE_READ_AND_WRITE, ControlMeta>
}
type WbMrcInputConfig<Channels extends Count> = {
  readonly [Channel in Channels as `Input ${Channel}`]: ChannelDefinition<`input${Channel}`, boolean, typeof CONTROL_TYPE_READ, ControlMeta>
}
type WbMrcInputCountConfig<Channels extends Count, PressType extends string> = {
  readonly [Channel in Channels as `Input ${PressType} ${Channel} Counter`]: ChannelDefinition<`input${Channel}Press${PressType}Count`, Count, typeof CONTROL_TYPE_READ, ControlMeta>
}

type WbMrcConfig<Channels extends Count, PressType extends string> =
  WbMrcRelayConfig<Channels>
  & WbMrcInputConfig<Channels>
  & WbMrcInputCountConfig<Channels, PressType>

type WbMr6cConfig = WbMrcConfig<1 | 2 | 3 | 4 | 5 | 6, `Single` | 'Double' | 'Long'>

export type ColdWbMr6c = PhysicalColdWbDevice<WbMr6cConfig>
export type HotWbMr6c = PhysicalHotWbDevice<WbMr6cConfig>

// const WB_MR6C_PREFIX = 'wb-mr6c'
//
// const WB_MR6C_RELAY_PREFIX = 'K'
// const WB_MR6C_INPUT_PREFIX = 'Input'
// const WB_MR6C_INPUT_COUNT_SUFFIX = 'Press Counter'
//
// const WB_MR6C_COUNTER_SINGLE = 'Single'
// const WB_MR6C_COUNTER_LONG = 'Long'
// const WB_MR6C_COUNTER_DOUBLE = 'Double'

//    private relayTopicName<Port extends WbMr6cPort>(port: Port): keyof WbMr6cDeviceRelay<Slave, Port> {
//         return `${WB_MR6C_PREFIX}_${this._slave}/${WB_MR6C_RELAY_PREFIX}${port}`;
//     }
//
//     private inputTopicName<Port extends WbMr6cPort>(port: Port): keyof WbMr6cDeviceInput<Slave, Port> {
//         return `${WB_MR6C_PREFIX}_${this._slave}/${WB_MR6C_INPUT_PREFIX} ${port}`;
//     }
//
//     private inputCountTopicName<Port extends WbMr6cPort, PressType extends WbMr6cCounter>(port: Port, pressType: PressType): keyof WbMr6cDeviceInputCount<Slave, Port, PressType> {
//         return `${WB_MR6C_PREFIX}_${this._slave}/${WB_MR6C_INPUT_PREFIX} ${port} ${pressType} ${WB_MR6C_INPUT_COUNT_SUFFIX}`;
//     }