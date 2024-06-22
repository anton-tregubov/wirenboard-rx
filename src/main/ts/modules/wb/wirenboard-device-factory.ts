import { WB_MR6C_CONFIG, WB_MR6C_TOPIC_IDENTIFIER, WbMr6cDevice } from '@main/modules/wb/wb-mr6c'
import { ModbusDeviceFactory } from '@main/modules/core/modbus-device-factory'
import { CONTROLS_TOPIC_IDENTIFIER, DEVICES_TOPIC_IDENTIFIER, ModbusSlave } from '@main/modules/core/definitions'
import { WB_MIR_CONFIG, WB_MIR_TOPIC_IDENTIFIER, WbMirDevice } from '@main/modules/wb/wb-mir'
import { WB_MSW_CONFIG, WB_MSW_TOPIC_IDENTIFIER, WbMswDevice } from '@main/modules/wb/wb-msw'

export interface WirenboardDeviceFactory {
  createWbMr6c(slave: ModbusSlave): WbMr6cDevice

  createWbMir(slave: ModbusSlave): WbMirDevice

  createWbMsw(slave: ModbusSlave): WbMswDevice
}

export class WirenboardDeviceFactoryImpl implements WirenboardDeviceFactory {
  constructor(
    private _modbusDeviceFactory: ModbusDeviceFactory,
  ) {

  }

  createWbMr6c(slave: ModbusSlave): WbMr6cDevice {
    return this._modbusDeviceFactory.createPhysicalWbDevice(
      WB_MR6C_CONFIG,
      suffix => `/${DEVICES_TOPIC_IDENTIFIER}/${WB_MR6C_TOPIC_IDENTIFIER}_${slave}` + (suffix ? `/${CONTROLS_TOPIC_IDENTIFIER}/${suffix}` : ''),
    )
  }

  createWbMir(slave: ModbusSlave): WbMirDevice {
    return this._modbusDeviceFactory.createPhysicalWbDevice(
      WB_MIR_CONFIG,
      suffix => `/${DEVICES_TOPIC_IDENTIFIER}/${WB_MIR_TOPIC_IDENTIFIER}_${slave}` + (suffix ? `/${CONTROLS_TOPIC_IDENTIFIER}/${suffix}` : ''),
    )
  }

  createWbMsw(slave: ModbusSlave): WbMswDevice {
    return this._modbusDeviceFactory.createPhysicalWbDevice(
      WB_MSW_CONFIG,
      suffix => `/${DEVICES_TOPIC_IDENTIFIER}/${WB_MSW_TOPIC_IDENTIFIER}_${slave}` + (suffix ? `/${CONTROLS_TOPIC_IDENTIFIER}/${suffix}` : ''),
    )
  }
}