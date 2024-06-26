import { Integer, IntegerRange, range } from '@main/core/utils'
import {
  FIELD_DESTINY_READ,
  FIELD_DESTINY_READ_AND_WRITE,
  PhysicalWbDevice,
  TOPIC_VALUE_SWITCH,
  TopicSubscriptionConfig,
} from '@main/modules/core/definitions'

const EXT_PREFIX = 'EXT'
const DI_WD_IN_SENSOR = 'IN'
const DO_R10A_OUT_SENSOR = 'R3A'

const PROPERTY_MODULE = 'module'
const PROPERTY_DI_WD_IN = 'in'
const PROPERTY_DO_R10A_OUT = 'out'

const DI_WD_14_LAST_SENSOR_EXCLUSIVE = 15
const DI_WD_14_FIRST_SENSOR_INCLUSIVE = 1

const DO_R10A_8_LAST_SENSOR_EXCLUSIVE = 9
const DO_R10A_8_FIRST_SENSOR_INCLUSIVE = 1

type ModuleIndex = IntegerRange<1, 9>

type ModuleDiWdInTopicSubscriptionConfig<Index extends ModuleIndex, Port extends Integer> = TopicSubscriptionConfig<`${typeof PROPERTY_MODULE}${Index}${typeof PROPERTY_DI_WD_IN}${Port}`, typeof FIELD_DESTINY_READ, typeof TOPIC_VALUE_SWITCH>;
type ModuleDoR10AOutTopicSubscriptionConfig<Index extends ModuleIndex, Port extends Integer> = TopicSubscriptionConfig<`${typeof PROPERTY_MODULE}${Index}${typeof PROPERTY_DO_R10A_OUT}${Port}`, typeof FIELD_DESTINY_READ_AND_WRITE, typeof TOPIC_VALUE_SWITCH>;

type ModuleDiWdInsTopicsSubscriptionConfig<Index extends ModuleIndex, PortCount extends Integer> = {
  readonly [Port in PortCount as `${typeof EXT_PREFIX}${Index}_${typeof DI_WD_IN_SENSOR}${Port}`]: ModuleDiWdInTopicSubscriptionConfig<Index, Port>
}

type ModuleDoR10AOutsTopicsSubscriptionConfig<Index extends ModuleIndex, PortCount extends Integer> = {
  readonly [Port in PortCount as `${typeof EXT_PREFIX}${Index}_${typeof DI_WD_IN_SENSOR}${Port}`]: ModuleDoR10AOutTopicSubscriptionConfig<Index, Port>
}

type ModuleDiWd14Config<Index extends ModuleIndex> = ModuleDiWdInsTopicsSubscriptionConfig<Index, IntegerRange<typeof DI_WD_14_FIRST_SENSOR_INCLUSIVE, typeof DI_WD_14_LAST_SENSOR_EXCLUSIVE>>
type ModuleDoR10A8Config<Index extends ModuleIndex> = ModuleDoR10AOutsTopicsSubscriptionConfig<Index, IntegerRange<typeof DO_R10A_8_FIRST_SENSOR_INCLUSIVE, typeof DO_R10A_8_LAST_SENSOR_EXCLUSIVE>>

type WbGpioModuleConfigs<Index extends ModuleIndex> =
  ModuleDiWd14Config<Index>
  | ModuleDoR10A8Config<Index>
  | EmptyModuleConfig

type EmptyModuleConfig = NonNullable<unknown>

type OrEmptyConfig<T> = T extends never ? EmptyModuleConfig : T

export type WbGpioConfig<
  Module1 extends WbGpioModuleConfigs<1>,
  Module2 extends WbGpioModuleConfigs<2>,
  Module3 extends WbGpioModuleConfigs<3>,
  Module4 extends WbGpioModuleConfigs<4>,
  Module5 extends WbGpioModuleConfigs<5>,
  Module6 extends WbGpioModuleConfigs<6>,
  Module7 extends WbGpioModuleConfigs<7>,
  Module8 extends WbGpioModuleConfigs<8>,
> = EmptyModuleConfig
  & OrEmptyConfig<Module1>
  & OrEmptyConfig<Module2>
  & OrEmptyConfig<Module3>
  & OrEmptyConfig<Module4>
  & OrEmptyConfig<Module5>
  & OrEmptyConfig<Module6>
  & OrEmptyConfig<Module7>
  & OrEmptyConfig<Module8>

function moduleDiWdInTopicSubscriptionConfig<Index extends ModuleIndex, Port extends Integer>(index: Index, port: Port): ModuleDiWdInTopicSubscriptionConfig<Index, Port> {
  return {
    fieldBaseName: `${PROPERTY_MODULE}${index}${PROPERTY_DI_WD_IN}${port}`,
    fieldDestiny: FIELD_DESTINY_READ,
    fieldValueType: TOPIC_VALUE_SWITCH,
  }
}

function moduleDoR10AOutTopicSubscriptionConfig<Index extends ModuleIndex, Port extends Integer>(index: Index, port: Port): ModuleDoR10AOutTopicSubscriptionConfig<Index, Port> {
  return {
    fieldBaseName: `${PROPERTY_MODULE}${index}${PROPERTY_DO_R10A_OUT}${port}`,
    fieldDestiny: FIELD_DESTINY_READ_AND_WRITE,
    fieldValueType: TOPIC_VALUE_SWITCH,
  }
}

function moduleDiWdInsTopicSubscriptionConfig<Index extends ModuleIndex, F extends Integer, T extends Integer, Port extends IntegerRange<F, T>>(moduleIndex: Index, from: F, to: T): ModuleDiWdInsTopicsSubscriptionConfig<Index, Port> {
  return [...range(from, to)]
    .reduce(
      (collector, port) => Object.assign(collector, { [`${EXT_PREFIX}${moduleIndex}_${DI_WD_IN_SENSOR}${port}`]: moduleDiWdInTopicSubscriptionConfig(moduleIndex, +port) }),
      {} as ModuleDiWdInsTopicsSubscriptionConfig<Index, Port>)
}

function moduleDoR10AOutsTopicSubscriptionConfig<Index extends ModuleIndex, F extends Integer, T extends Integer, Port extends IntegerRange<F, T>>(moduleIndex: Index, from: F, to: T): ModuleDoR10AOutsTopicsSubscriptionConfig<Index, Port> {
  return [...range(from, to)]
    .reduce(
      (collector, port) => Object.assign(collector, { [`${EXT_PREFIX}${moduleIndex}_${DO_R10A_OUT_SENSOR}${port}`]: moduleDoR10AOutTopicSubscriptionConfig(moduleIndex, +port) }),
      {} as ModuleDoR10AOutsTopicsSubscriptionConfig<Index, Port>)
}

export const GPIO_MODULE_DI_WD_14 = 'di-wd-14'
export const GPIO_MODULE_DO_R10_8 = 'di-wd-8'
export const GPIO_MODULE_NOT_EXISTS = ''

export type WbGpioModule = typeof GPIO_MODULE_DI_WD_14 | typeof GPIO_MODULE_DO_R10_8 | typeof GPIO_MODULE_NOT_EXISTS

type ModuleToConfigMapper<Index extends ModuleIndex> = {
  [GPIO_MODULE_DI_WD_14]: ModuleDiWd14Config<Index>
  [GPIO_MODULE_DO_R10_8]: ModuleDoR10A8Config<Index>
  [GPIO_MODULE_NOT_EXISTS]: EmptyModuleConfig
}

export type WbGpioDevice<
  Module1 extends WbGpioModule,
  Module2 extends WbGpioModule,
  Module3 extends WbGpioModule,
  Module4 extends WbGpioModule,
  Module5 extends WbGpioModule,
  Module6 extends WbGpioModule,
  Module7 extends WbGpioModule,
  Module8 extends WbGpioModule,
> = PhysicalWbDevice<
  WbGpioConfig<
    ModuleToConfigMapper<1>[Module1],
    ModuleToConfigMapper<2>[Module2],
    ModuleToConfigMapper<3>[Module3],
    ModuleToConfigMapper<4>[Module4],
    ModuleToConfigMapper<5>[Module5],
    ModuleToConfigMapper<6>[Module6],
    ModuleToConfigMapper<7>[Module7],
    ModuleToConfigMapper<8>[Module8]
  >
>

export function wbGpioConfig<
  Modules extends [
    WbGpioModule,
    WbGpioModule,
    WbGpioModule,
    WbGpioModule,
    WbGpioModule,
    WbGpioModule,
    WbGpioModule,
    WbGpioModule
  ]
>(modules: Modules): WbGpioConfig<
  ModuleToConfigMapper<1>[typeof modules[0]],
  ModuleToConfigMapper<2>[typeof modules[1]],
  ModuleToConfigMapper<3>[typeof modules[2]],
  ModuleToConfigMapper<4>[typeof modules[3]],
  ModuleToConfigMapper<5>[typeof modules[4]],
  ModuleToConfigMapper<6>[typeof modules[5]],
  ModuleToConfigMapper<7>[typeof modules[6]],
  ModuleToConfigMapper<8>[typeof modules[7]]
> {
  return modules.reduce((collector, module, index) => {
    const moduleIndex = (index + 1) as ModuleIndex
    switch (module) {
      case GPIO_MODULE_DI_WD_14:
        return Object.assign(collector, moduleDiWdInsTopicSubscriptionConfig(moduleIndex, DI_WD_14_FIRST_SENSOR_INCLUSIVE, DI_WD_14_LAST_SENSOR_EXCLUSIVE))
      case GPIO_MODULE_DO_R10_8:
        return Object.assign(collector, moduleDoR10AOutsTopicSubscriptionConfig(moduleIndex, DO_R10A_8_FIRST_SENSOR_INCLUSIVE, DO_R10A_8_LAST_SENSOR_EXCLUSIVE))
    }
    return collector
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }, {} as WbGpioConfig<any, any, any, any, any, any, any, any>)
}

export const WB_GPIO_TOPIC_IDENTIFIER = 'wb-gpio'