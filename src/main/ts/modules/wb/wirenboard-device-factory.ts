import { WB_MR6C_CONFIG, WB_MR6C_TOPIC_IDENTIFIER, WbMr6cDevice } from '@main/modules/wb/wb-mrc'
import { ModbusDeviceFactory } from '@main/modules/core/modbus-device-factory'
import { CONTROLS_TOPIC_IDENTIFIER, DEVICES_TOPIC_IDENTIFIER, ModbusSlave } from '@main/modules/core/definitions'
import { WB_MIR_CONFIG, WB_MIR_TOPIC_IDENTIFIER, WbMirDevice } from '@main/modules/wb/wb-mir'
import { WB_MSW_CONFIG, WB_MSW_TOPIC_IDENTIFIER, WbMswDevice } from '@main/modules/wb/wb-msw'
import { WB_MWAC_CONFIG, WB_MWAC_TOPIC_IDENTIFIER, WbMWacDevice } from '@main/modules/wb/wb-mwac'
import { WB_M1W2_CONFIG, WB_M1W2_TOPIC_IDENTIFIER, WbM1W2Device } from '@main/modules/wb/wb-mw'
import { TopicName } from '@main/core/topic-events-stream-reactive-switch'
import { Optional } from '@main/core/utils'
import {
  GPIO_MODULE_NOT_EXISTS,
  WB_GPIO_TOPIC_IDENTIFIER,
  wbGpioConfig,
  WbGpioDevice,
  WbGpioModule,
} from '@main/modules/wb/wb-gpio'

export interface WirenboardDeviceFactory {
  createWbMr6c(slave: ModbusSlave): WbMr6cDevice

  createWbMir(slave: ModbusSlave): WbMirDevice

  createWbMsw(slave: ModbusSlave): WbMswDevice

  createWbMWac(slave: ModbusSlave): WbMWacDevice

  createWbM1W2(slave: ModbusSlave): WbM1W2Device

  createWbGpio<
    M1 extends WbGpioModule
  >(m1: M1): WbGpioDevice<
    M1,
    typeof GPIO_MODULE_NOT_EXISTS,
    typeof GPIO_MODULE_NOT_EXISTS,
    typeof GPIO_MODULE_NOT_EXISTS,
    typeof GPIO_MODULE_NOT_EXISTS,
    typeof GPIO_MODULE_NOT_EXISTS,
    typeof GPIO_MODULE_NOT_EXISTS,
    typeof GPIO_MODULE_NOT_EXISTS
  >

  createWbGpio<
    M1 extends WbGpioModule,
    M2 extends WbGpioModule
  >(m1: M1, m2: M2): WbGpioDevice<
    M1,
    M2,
    typeof GPIO_MODULE_NOT_EXISTS,
    typeof GPIO_MODULE_NOT_EXISTS,
    typeof GPIO_MODULE_NOT_EXISTS,
    typeof GPIO_MODULE_NOT_EXISTS,
    typeof GPIO_MODULE_NOT_EXISTS,
    typeof GPIO_MODULE_NOT_EXISTS
  >

  createWbGpio<
    M1 extends WbGpioModule,
    M2 extends WbGpioModule,
    M3 extends WbGpioModule
  >(m1: M1, m2: M2, m3: M3): WbGpioDevice<
    M1,
    M2,
    M3,
    typeof GPIO_MODULE_NOT_EXISTS,
    typeof GPIO_MODULE_NOT_EXISTS,
    typeof GPIO_MODULE_NOT_EXISTS,
    typeof GPIO_MODULE_NOT_EXISTS,
    typeof GPIO_MODULE_NOT_EXISTS
  >

  createWbGpio<
    M1 extends WbGpioModule,
    M2 extends WbGpioModule,
    M3 extends WbGpioModule,
    M4 extends WbGpioModule
  >(m1: M1, m2: M2, m3: M3, m4: M4): WbGpioDevice<
    M1,
    M2,
    M3,
    M4,
    typeof GPIO_MODULE_NOT_EXISTS,
    typeof GPIO_MODULE_NOT_EXISTS,
    typeof GPIO_MODULE_NOT_EXISTS,
    typeof GPIO_MODULE_NOT_EXISTS
  >

  createWbGpio<
    M1 extends WbGpioModule,
    M2 extends WbGpioModule,
    M3 extends WbGpioModule,
    M4 extends WbGpioModule,
    M5 extends WbGpioModule
  >(m1: M1, m2: M2, m3: M3, m4: M4, m5: M5): WbGpioDevice<
    M1,
    M2,
    M3,
    M4,
    M5,
    typeof GPIO_MODULE_NOT_EXISTS,
    typeof GPIO_MODULE_NOT_EXISTS,
    typeof GPIO_MODULE_NOT_EXISTS
  >

  createWbGpio<
    M1 extends WbGpioModule,
    M2 extends WbGpioModule,
    M3 extends WbGpioModule,
    M4 extends WbGpioModule,
    M5 extends WbGpioModule,
    M6 extends WbGpioModule
  >(m1: M1, m2: M2, m3: M3, m4: M4, m5: M5, m6: M6): WbGpioDevice<
    M1,
    M2,
    M3,
    M4,
    M5,
    M6,
    typeof GPIO_MODULE_NOT_EXISTS,
    typeof GPIO_MODULE_NOT_EXISTS
  >

  createWbGpio<
    M1 extends WbGpioModule,
    M2 extends WbGpioModule,
    M3 extends WbGpioModule,
    M4 extends WbGpioModule,
    M5 extends WbGpioModule,
    M6 extends WbGpioModule,
    M7 extends WbGpioModule
  >(m1: M1, m2: M2, m3: M3, m4: M4, m5: M5, m6: M6, m7: M7): WbGpioDevice<
    M1,
    M2,
    M3,
    M4,
    M5,
    M6,
    M7,
    typeof GPIO_MODULE_NOT_EXISTS
  >

  // createWbGpio<
  //   M1 extends WbGpioModule,
  //   M2 extends WbGpioModule,
  //   M3 extends WbGpioModule,
  //   M4 extends WbGpioModule,
  //   M5 extends WbGpioModule,
  //   M6 extends WbGpioModule,
  //   M7 extends WbGpioModule,
  //   M8 extends WbGpioModule
  // >(m1: M1, m2: M2, m3: M3, m4: M4, m5: M5, m6: M6, m7: M7, m8: M8): WbGpioDevice<
  //   M1,
  //   M2,
  //   M3,
  //   M4,
  //   M5,
  //   M6,
  //   M7,
  //   M8
  // >
}

export class WirenboardDeviceFactoryImpl implements WirenboardDeviceFactory {
  constructor(
    private _modbusDeviceFactory: ModbusDeviceFactory,
  ) {

  }

  private creteModbusTopicSuffixResolver(identifier: string, slave: ModbusSlave): (suffix: Optional<string>) => TopicName {
    return suffix => `/${DEVICES_TOPIC_IDENTIFIER}/${identifier}_${slave}` + (suffix ? `/${CONTROLS_TOPIC_IDENTIFIER}/${suffix}` : '')
  }

  // private creteGpioTopicSuffixResolver(index: GpioDeviceIndex): (suffix: Optional<string>) => TopicName {
  //   return suffix => `/${DEVICES_TOPIC_IDENTIFIER}/${WB_GPIO_TOPIC_IDENTIFIER}` + (suffix ? `/${CONTROLS_TOPIC_IDENTIFIER}/${EXT_PREFIX}${index}_${suffix}` : '')
  // }

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

  createWbGpio<M1 extends WbGpioModule>(m1: M1): WbGpioDevice<M1, typeof GPIO_MODULE_NOT_EXISTS, typeof GPIO_MODULE_NOT_EXISTS, typeof GPIO_MODULE_NOT_EXISTS, typeof GPIO_MODULE_NOT_EXISTS, typeof GPIO_MODULE_NOT_EXISTS, typeof GPIO_MODULE_NOT_EXISTS, typeof GPIO_MODULE_NOT_EXISTS>
  createWbGpio<M1 extends WbGpioModule, M2 extends WbGpioModule>(m1: M1, m2: M2): WbGpioDevice<M1, M2, typeof GPIO_MODULE_NOT_EXISTS, typeof GPIO_MODULE_NOT_EXISTS, typeof GPIO_MODULE_NOT_EXISTS, typeof GPIO_MODULE_NOT_EXISTS, typeof GPIO_MODULE_NOT_EXISTS, typeof GPIO_MODULE_NOT_EXISTS>
  createWbGpio<M1 extends WbGpioModule, M2 extends WbGpioModule, M3 extends WbGpioModule>(m1: M1, m2: M2, m3: M3): WbGpioDevice<M1, M2, M3, typeof GPIO_MODULE_NOT_EXISTS, typeof GPIO_MODULE_NOT_EXISTS, typeof GPIO_MODULE_NOT_EXISTS, typeof GPIO_MODULE_NOT_EXISTS, typeof GPIO_MODULE_NOT_EXISTS>
  createWbGpio<M1 extends WbGpioModule, M2 extends WbGpioModule, M3 extends WbGpioModule, M4 extends WbGpioModule>(m1: M1, m2: M2, m3: M3, m4: M4): WbGpioDevice<M1, M2, M3, M4, typeof GPIO_MODULE_NOT_EXISTS, typeof GPIO_MODULE_NOT_EXISTS, typeof GPIO_MODULE_NOT_EXISTS, typeof GPIO_MODULE_NOT_EXISTS>
  createWbGpio<M1 extends WbGpioModule, M2 extends WbGpioModule, M3 extends WbGpioModule, M4 extends WbGpioModule, M5 extends WbGpioModule>(m1: M1, m2: M2, m3: M3, m4: M4, m5: M5): WbGpioDevice<M1, M2, M3, M4, M5, typeof GPIO_MODULE_NOT_EXISTS, typeof GPIO_MODULE_NOT_EXISTS, typeof GPIO_MODULE_NOT_EXISTS>
  createWbGpio<M1 extends WbGpioModule, M2 extends WbGpioModule, M3 extends WbGpioModule, M4 extends WbGpioModule, M5 extends WbGpioModule, M6 extends WbGpioModule>(m1: M1, m2: M2, m3: M3, m4: M4, m5: M5, m6: M6): WbGpioDevice<M1, M2, M3, M4, M5, M6, typeof GPIO_MODULE_NOT_EXISTS, typeof GPIO_MODULE_NOT_EXISTS>
  createWbGpio<M1 extends WbGpioModule, M2 extends WbGpioModule, M3 extends WbGpioModule, M4 extends WbGpioModule, M5 extends WbGpioModule, M6 extends WbGpioModule, M7 extends WbGpioModule>(m1: M1, m2: M2, m3: M3, m4: M4, m5: M5, m6: M6, m7: M7): WbGpioDevice<M1, M2, M3, M4, M5, M6, M7, typeof GPIO_MODULE_NOT_EXISTS>
  // createWbGpio<M1 extends WbGpioModule, M2 extends WbGpioModule, M3 extends WbGpioModule, M4 extends WbGpioModule, M5 extends WbGpioModule, M6 extends WbGpioModule, M7 extends WbGpioModule, M8 extends WbGpioModule>(m1: M1, m2: M2, m3: M3, m4: M4, m5: M5, m6: M6, m7: M7, m8: M8): WbGpioDevice<M1, M2, M3, M4, M5, M6, M7, M8>
  // createWbGpio(m1: WbGpioModule, m2?: WbGpioModule, m3?: WbGpioModule, m4?: WbGpioModule, m5?: WbGpioModule, m6?: WbGpioModule, m7?: WbGpioModule, m8?: WbGpioModule): WbGpioDevice<WbGpioModule, WbGpioModule, WbGpioModule, WbGpioModule, WbGpioModule, WbGpioModule, WbGpioModule, WbGpioModule> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createWbGpio(m1: any, m2?: any, m3?: any, m4?: any, m5?: any, m6?: any, m7?: any, m8?: any): any {
    const modules: WbGpioModule[] = [m1]
    if (m2) modules.push(m2)
    if (m3) modules.push(m3)
    if (m4) modules.push(m4)
    if (m5) modules.push(m5)
    if (m6) modules.push(m6)
    if (m7) modules.push(m7)
    if (m8) modules.push(m8)
    const config = wbGpioConfig(modules as [WbGpioModule, WbGpioModule, WbGpioModule, WbGpioModule, WbGpioModule, WbGpioModule, WbGpioModule, WbGpioModule])
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return this._modbusDeviceFactory.createPhysicalWbDevice(config, suffix => `/${DEVICES_TOPIC_IDENTIFIER}/${WB_GPIO_TOPIC_IDENTIFIER}` + (suffix ? `/${CONTROLS_TOPIC_IDENTIFIER}/${suffix}` : ''))
  }
}