import {
  CONTROL_TYPE_READ_AND_WRITE,
  ModbusSlave,
  PhysicalColdWbDevice,
  PhysicalHotWbDevice,
  TopicsSubscriptionConfig,
  VirtualColdWbDevice,
  VirtualHotWbDevice,
} from '@main/modules/core/definitions'

export interface ModbusDeviceFactory {

  createPhysicalColdWbDevice<Config extends TopicsSubscriptionConfig>(slave: ModbusSlave, config: Config): PhysicalColdWbDevice<Config>

  createPhysicalHotWbDevice<Config extends TopicsSubscriptionConfig>(slave: ModbusSlave, config: Config): PhysicalHotWbDevice<Config>

  createVirtualColdWbDevice<Config extends TopicsSubscriptionConfig<typeof CONTROL_TYPE_READ_AND_WRITE>>(id: string, config: Config): VirtualColdWbDevice<Config>

  createVirtualHotWbDevice<Config extends TopicsSubscriptionConfig<typeof CONTROL_TYPE_READ_AND_WRITE>>(id: string, config: Config): VirtualHotWbDevice<Config>
}

export class DeviceFactoryImpl implements ModbusDeviceFactory {
  createPhysicalColdWbDevice<Config extends TopicsSubscriptionConfig>(slave: ModbusSlave, config: Config): PhysicalColdWbDevice<Config> {
    throw new Error('Not Implemented' + slave + config)
  }

  createPhysicalHotWbDevice<Config extends TopicsSubscriptionConfig>(slave: ModbusSlave, config: Config): PhysicalHotWbDevice<Config> {
    throw new Error('Not Implemented' + slave + config)
  }

  createVirtualColdWbDevice<Config extends TopicsSubscriptionConfig<typeof CONTROL_TYPE_READ_AND_WRITE>>(id: string, config: Config): VirtualColdWbDevice<Config> {
    throw new Error('Not Implemented' + id + config)
  }

  createVirtualHotWbDevice<Config extends TopicsSubscriptionConfig<typeof CONTROL_TYPE_READ_AND_WRITE>>(id: string, config: Config): VirtualHotWbDevice<Config> {
    throw new Error('Not Implemented' + id + config)
  }

}