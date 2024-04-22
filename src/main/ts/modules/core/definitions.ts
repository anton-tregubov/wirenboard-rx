import { Observable } from 'rxjs'
import { IntegerRange, Optional } from '@main/core/utils'

export const CONTROL_TYPE_READ = 'read'
export const CONTROL_TYPE_READ_AND_WRITE = 'read-and-write'
export const CONTROL_TYPE_ACTION = 'action'
export type ControlType = typeof CONTROL_TYPE_READ | typeof CONTROL_TYPE_READ_AND_WRITE | typeof CONTROL_TYPE_ACTION

export const LANGUAGE_ENGLISH = 'en'
export const LANGUAGE_RUSSIAN = 'ru'

export type Language = typeof LANGUAGE_ENGLISH | typeof LANGUAGE_RUSSIAN

export interface DeviceMeta {
  driver: string
  title: Record<Language, string>
}

export interface BaseControlMeta {

}

export interface BooleanControlMeta extends BaseControlMeta {

}

export interface NumberControlMeta extends BaseControlMeta {

}

export type ControlMeta = BooleanControlMeta | NumberControlMeta

export interface ControlError {
// ??? ask wb
}

//TODO rename to TopicDefinition
export interface TopicSubscriptionConfig<FieldName extends string, VType, CType extends ControlType, MetaType extends ControlMeta> {
  readonly fieldName: FieldName,
  readonly valueType: VType,
  readonly controlType: CType,
  readonly controlMeta: MetaType,
}

export type TopicsSubscriptionConfig<AllowedControlType extends ControlType = ControlType, AllowedControlMeta extends ControlMeta = ControlMeta> = Record<string, TopicSubscriptionConfig<string, unknown, AllowedControlType, AllowedControlMeta>>

type ExtractPropertyKeysByControlType<Source extends TopicsSubscriptionConfig, CType extends ControlType> = {
  [Property in keyof Source]: (Source[Property]['controlType']) extends CType ? Property : never
}[keyof Source]

type ColdValueTopicReaderProperties<Config extends TopicsSubscriptionConfig> = {
  readonly [Control in ExtractPropertyKeysByControlType<Config, typeof CONTROL_TYPE_READ | typeof CONTROL_TYPE_READ_AND_WRITE> as `${Config[Control]['fieldName']}$`]: Observable<Config[Control]['valueType']>
}

type HotValueTopicReaderProperties<Config extends TopicsSubscriptionConfig> = {
  readonly [Control in ExtractPropertyKeysByControlType<Config, typeof CONTROL_TYPE_READ> as `${Config[Control]['fieldName']}`]: Optional<Config[Control]['valueType']>
}

type ValueTopicWriterProperties<Config extends TopicsSubscriptionConfig> = {
  /*writeonly*/-readonly [Control in ExtractPropertyKeysByControlType<Config, typeof CONTROL_TYPE_READ_AND_WRITE> as `${Config[Control]['fieldName']}`]: Config[Control]['valueType']
}

type ActionCallProperties<Config extends TopicsSubscriptionConfig> = {
  readonly [Control in ExtractPropertyKeysByControlType<Config, typeof CONTROL_TYPE_ACTION> as `${Config[Control]['fieldName']}`]: () => void
}

type ColdControlTopicReaderProperties<Config extends TopicsSubscriptionConfig> = {
  readonly [Control in keyof Config as `${Config[Control]['fieldName']}Meta$`]: Observable<Config[Control]['controlMeta']>
}

type HotControlTopicReaderProperties<Config extends TopicsSubscriptionConfig> = {
  readonly [Control in keyof Config as `${Config[Control]['fieldName']}Meta`]: Optional<Config[Control]['controlMeta']>
}

type ColdControlErrorTopicReaderProperties<Config extends TopicsSubscriptionConfig> = {
  readonly [Control in keyof Config as `${Config[Control]['fieldName']}Error$`]: Observable<ControlError>
}

type ColdWbDeviceMetaReaderProperties = {
  readonly meta$: Observable<DeviceMeta>
}

type HotWbDeviceMetaReaderProperties = {
  get meta(): DeviceMeta
}

type WbDeviceMetaWriterProperties = {
  set meta(v: Optional<DeviceMeta>)
}

export type PhysicalColdWbDevice<Config extends TopicsSubscriptionConfig> =
  ColdWbDeviceMetaReaderProperties
  & ColdValueTopicReaderProperties<Config>
  & ValueTopicWriterProperties<Config>
  & ActionCallProperties<Config>
  & ColdControlTopicReaderProperties<Config>
  & ColdControlErrorTopicReaderProperties<Config>

export type PhysicalHotWbDevice<Config extends TopicsSubscriptionConfig> =
  PhysicalColdWbDevice<Config> & HotValueTopicReaderProperties<Config> & HotWbDeviceMetaReaderProperties

export type VirtualColdWbDevice<Config extends TopicsSubscriptionConfig<typeof CONTROL_TYPE_READ_AND_WRITE>> =
  PhysicalColdWbDevice<Config> & WbDeviceMetaWriterProperties

export type VirtualHotWbDevice<Config extends TopicsSubscriptionConfig<typeof CONTROL_TYPE_READ_AND_WRITE>> =
  VirtualColdWbDevice<Config>
  & HotValueTopicReaderProperties<Config>
  & HotControlTopicReaderProperties<Config>
  & HotWbDeviceMetaReaderProperties

export type ModbusSlave = IntegerRange<1, 250/*or less?*/>
