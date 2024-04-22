import { ColdWbMr6c, HotWbMr6c, WB_MR6C_CONFIG } from '@main/modules/wb/wb-mr6c'
import { ModbusDeviceFactory } from '@main/modules/core/modbus-device-factory'
import { ModbusSlave } from '@main/modules/core/definitions'

export interface WirenboardDeviceFactory {
  createColdWbMr6c(slave: ModbusSlave): ColdWbMr6c

  createHotWbMr6c(slave: ModbusSlave): HotWbMr6c
}

export class WirenboardDeviceFactoryImpl implements WirenboardDeviceFactory {
  constructor(
    private _modbusDeviceFactory: ModbusDeviceFactory,
  ) {

  }

  createColdWbMr6c(slave: ModbusSlave): ColdWbMr6c {
    return this._modbusDeviceFactory.createPhysicalColdWbDevice(slave, WB_MR6C_CONFIG)
  }

  createHotWbMr6c(slave: ModbusSlave): HotWbMr6c {
    return this._modbusDeviceFactory.createPhysicalHotWbDevice(slave, WB_MR6C_CONFIG)
  }

}