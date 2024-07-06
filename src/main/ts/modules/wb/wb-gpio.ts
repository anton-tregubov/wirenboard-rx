import { Integer, IntegerRange, range, Union } from '@main/core/utils'
import {
  FIELD_DESTINY_READ,
  FIELD_DESTINY_READ_AND_WRITE,
  PhysicalWbDevice,
  TOPIC_VALUE_SWITCH,
  TopicSubscriptionConfig,
} from '@main/modules/core/definitions'
import { Add } from 'ts-arithmetic'

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

// type ModuleIndex = IntegerRange<1, 9>
type ModuleIndex = Integer

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

// type OrEmptyConfig<T> = T extends never ? EmptyModuleConfig : T

export type WbGpioConfig<Modules extends readonly WbGpioModuleConfigs<ModuleIndex>[]> = Union<Modules, EmptyModuleConfig>

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

type WbGpioModuleConfigsArray<Modules extends readonly WbGpioModule[], Acc extends WbGpioModuleConfigs<ModuleIndex>[] = []> = Modules extends [infer Head extends WbGpioModule, ...infer Tail extends WbGpioModule[]] ? WbGpioModuleConfigsArray<Tail, [...Acc, ModuleToConfigMapper<Add<Acc['length'], 1>>[Head]]> : Acc

export type WbGpioDevice<Modules extends readonly WbGpioModule[]> = PhysicalWbDevice<WbGpioConfig<WbGpioModuleConfigsArray<Modules>>>

export function wbGpioConfig<Modules extends readonly WbGpioModule[]>(modules: Modules): WbGpioConfig<WbGpioModuleConfigsArray<Modules>> {
  return modules.reduce((collector, module, index) => {
    const moduleIndex = (index + 1) as ModuleIndex
    switch (module) {
      case GPIO_MODULE_DI_WD_14:
        return Object.assign(collector, moduleDiWdInsTopicSubscriptionConfig(moduleIndex, DI_WD_14_FIRST_SENSOR_INCLUSIVE, DI_WD_14_LAST_SENSOR_EXCLUSIVE))
      case GPIO_MODULE_DO_R10_8:
        return Object.assign(collector, moduleDoR10AOutsTopicSubscriptionConfig(moduleIndex, DO_R10A_8_FIRST_SENSOR_INCLUSIVE, DO_R10A_8_LAST_SENSOR_EXCLUSIVE))
    }
    return collector
  }, {} as WbGpioConfig<WbGpioModuleConfigsArray<Modules>>)
}

export const WB_GPIO_TOPIC_IDENTIFIER = 'wb-gpio'