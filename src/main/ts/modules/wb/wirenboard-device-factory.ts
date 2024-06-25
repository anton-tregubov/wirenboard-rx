import { WB_MR6C_CONFIG, WB_MR6C_TOPIC_IDENTIFIER, WbMr6cDevice } from '@main/modules/wb/wb-mrc'
import { ModbusDeviceFactory } from '@main/modules/core/modbus-device-factory'
import {
  CONTROLS_TOPIC_IDENTIFIER,
  DEVICES_TOPIC_IDENTIFIER,
  GpioDeviceIndex,
  ModbusSlave,
} from '@main/modules/core/definitions'
import { WB_MIR_CONFIG, WB_MIR_TOPIC_IDENTIFIER, WbMirDevice } from '@main/modules/wb/wb-mir'
import { WB_MSW_CONFIG, WB_MSW_TOPIC_IDENTIFIER, WbMswDevice } from '@main/modules/wb/wb-msw'
import { WB_MWAC_CONFIG, WB_MWAC_TOPIC_IDENTIFIER, WbMWacDevice } from '@main/modules/wb/wb-mwac'
import { WB_M1W2_CONFIG, WB_M1W2_TOPIC_IDENTIFIER, WbM1W2Device } from '@main/modules/wb/wb-mw'
import { TopicName } from '@main/core/topic-events-stream-reactive-switch'
import { Optional } from '@main/core/utils'
import {
  EXT_PREFIX,
  WB_DI_WD_14_CONFIG,
  WB_DO_R10A_8_CONFIG,
  WB_GPIO_TOPIC_IDENTIFIER,
  WbDiWd14Device,
  WbDoR10A8Device,
} from '@main/modules/wb/wb-gpio'

export interface WirenboardDeviceFactory {
  createWbMr6c(slave: ModbusSlave): WbMr6cDevice

  createWbMir(slave: ModbusSlave): WbMirDevice

  createWbMsw(slave: ModbusSlave): WbMswDevice

  createWbMWac(slave: ModbusSlave): WbMWacDevice

  createWbM1W2(slave: ModbusSlave): WbM1W2Device

  createWbDiWd14(index: GpioDeviceIndex): WbDiWd14Device

  createWbDoR10A8(index: GpioDeviceIndex): WbDoR10A8Device
}

export class WirenboardDeviceFactoryImpl implements WirenboardDeviceFactory {
  constructor(
    private _modbusDeviceFactory: ModbusDeviceFactory,
  ) {

  }

  private creteModbusTopicSuffixResolver(identifier: string, slave: ModbusSlave): (suffix: Optional<string>) => TopicName {
    return suffix => `/${DEVICES_TOPIC_IDENTIFIER}/${identifier}_${slave}` + (suffix ? `/${CONTROLS_TOPIC_IDENTIFIER}/${suffix}` : '')
  }

  private creteGpioTopicSuffixResolver(index: GpioDeviceIndex): (suffix: Optional<string>) => TopicName {
    return suffix => `/${DEVICES_TOPIC_IDENTIFIER}/${WB_GPIO_TOPIC_IDENTIFIER}` + (suffix ? `/${CONTROLS_TOPIC_IDENTIFIER}/${EXT_PREFIX}${index}_${suffix}` : '')
  }

  createWbMr6c(slave: ModbusSlave): WbMr6cDevice {
    return this._modbusDeviceFactory.createPhysicalWbDevice(WB_MR6C_CONFIG, this.creteModbusTopicSuffixResolver(WB_MR6C_TOPIC_IDENTIFIER, slave))
  }

  createWbMir(slave: ModbusSlave): WbMirDevice {
    return this._modbusDeviceFactory.createPhysicalWbDevice(WB_MIR_CONFIG, this.creteModbusTopicSuffixResolver(WB_MIR_TOPIC_IDENTIFIER, slave))
  }

  createWbMsw(slave: ModbusSlave): WbMswDevice {
    return this._modbusDeviceFactory.createPhysicalWbDevice(WB_MSW_CONFIG, this.creteModbusTopicSuffixResolver(WB_MSW_TOPIC_IDENTIFIER, slave))
  }

  createWbMWac(slave: ModbusSlave): WbMWacDevice {
    return this._modbusDeviceFactory.createPhysicalWbDevice(WB_MWAC_CONFIG, this.creteModbusTopicSuffixResolver(WB_MWAC_TOPIC_IDENTIFIER, slave))
  }

  createWbM1W2(slave: ModbusSlave): WbM1W2Device {
    return this._modbusDeviceFactory.createPhysicalWbDevice(WB_M1W2_CONFIG, this.creteModbusTopicSuffixResolver(WB_M1W2_TOPIC_IDENTIFIER, slave))
  }

  createWbDiWd14(index: GpioDeviceIndex): WbDiWd14Device {
    return this._modbusDeviceFactory.createPhysicalWbDevice(WB_DI_WD_14_CONFIG, this.creteGpioTopicSuffixResolver(index))
  }

  createWbDoR10A8(index: GpioDeviceIndex): WbDoR10A8Device {
    return this._modbusDeviceFactory.createPhysicalWbDevice(WB_DO_R10A_8_CONFIG, this.creteGpioTopicSuffixResolver(index))
  }
}