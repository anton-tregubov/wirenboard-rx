import { Observable } from 'rxjs'
import { Integer, IntegerRange, Optional } from '@main/core/utils'
import { TopicName } from '@main/core/topic-events-stream-reactive-switch'

export const FIELD_DESTINY_READ = 'read'
export const FIELD_DESTINY_READ_AND_WRITE = 'read-and-write'
export const FIELD_DESTINY_ACTION = 'action'
export type FieldDestiny =
  typeof FIELD_DESTINY_READ
  | typeof FIELD_DESTINY_READ_AND_WRITE
  | typeof FIELD_DESTINY_ACTION

export const LANGUAGE_ENGLISH = 'en'
export const LANGUAGE_RUSSIAN = 'ru'

export const PROPERTY_NAME_SUFFIX_OBSERVABLE = '$'
export const PROPERTY_NAME_SUFFIX_META = 'Meta'
export const PROPERTY_NAME_SUFFIX_ERROR = 'Error'

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

export interface ButtonControlMeta extends BaseControlMeta {

}

export type ControlMeta = BooleanControlMeta | NumberControlMeta | ButtonControlMeta

export interface ControlMetaError {
// ??? ask wb
}

export interface DeviceMetaError {
// ??? ask wb
}

export const TOPIC_VALUE_COUNTER = 'counter'
export const TOPIC_VALUE_SWITCH = 'switch'
export const TOPIC_VALUE_ACTION = 'never'

export type TopicValueType =
  | typeof TOPIC_VALUE_COUNTER
  | typeof TOPIC_VALUE_SWITCH
  | typeof TOPIC_VALUE_ACTION

export interface TopicValueTypeToNativeType {
  [TOPIC_VALUE_COUNTER]: Integer
  [TOPIC_VALUE_SWITCH]: boolean
  [TOPIC_VALUE_ACTION]: never
}

export interface TopicValueTypeToControlMetaType {
  [TOPIC_VALUE_COUNTER]: NumberControlMeta
  [TOPIC_VALUE_SWITCH]: BooleanControlMeta
  [TOPIC_VALUE_ACTION]: BooleanControlMeta
}

export interface TopicSubscriptionConfig<Name extends string, Destiny extends FieldDestiny, Type extends TopicValueType> {
  readonly fieldBaseName: Name,
  readonly fieldValueType: Type,
  readonly fieldDestiny: Destiny,
}

export type TopicsSubscriptionConfig<AllowedFieldDestiny extends FieldDestiny = FieldDestiny, AllowedFieldType extends TopicValueType = TopicValueType> = Record<string, TopicSubscriptionConfig<string, AllowedFieldDestiny, AllowedFieldType>>

type ExtractPropertyKeysByFieldDestiny<Source extends TopicsSubscriptionConfig, Destiny extends FieldDestiny> = {
  [Property in keyof Source]: (Source[Property]['fieldDestiny']) extends Destiny ? Property : never
}[keyof Source]

type ValueTopicReaderProperties<Config extends TopicsSubscriptionConfig> = {
  readonly [Control in ExtractPropertyKeysByFieldDestiny<Config, typeof FIELD_DESTINY_READ | typeof FIELD_DESTINY_READ_AND_WRITE> as `${Config[Control]['fieldBaseName']}${typeof PROPERTY_NAME_SUFFIX_OBSERVABLE}`]: Observable<TopicValueTypeToNativeType[Config[Control]['fieldValueType']]>
}

type ValueTopicWriterProperties<Config extends TopicsSubscriptionConfig> = {
  /*writeonly*/-readonly [Control in ExtractPropertyKeysByFieldDestiny<Config, typeof FIELD_DESTINY_READ_AND_WRITE> as `${Config[Control]['fieldBaseName']}`]: TopicValueTypeToNativeType[Config[Control]['fieldValueType']]
}

type ActionCallProperties<Config extends TopicsSubscriptionConfig> = {
  readonly [Control in ExtractPropertyKeysByFieldDestiny<Config, typeof FIELD_DESTINY_ACTION> as `${Config[Control]['fieldBaseName']}`]: () => void
}

type ControlTopicReaderProperties<Config extends TopicsSubscriptionConfig> = {
  readonly [Control in keyof Config as `${Config[Control]['fieldBaseName']}${typeof PROPERTY_NAME_SUFFIX_META}${typeof PROPERTY_NAME_SUFFIX_OBSERVABLE}`]: Observable<TopicValueTypeToControlMetaType[Config[Control]['fieldValueType']]>
}

type ControlErrorTopicReaderProperties<Config extends TopicsSubscriptionConfig> = {
  readonly [Control in keyof Config as `${Config[Control]['fieldBaseName']}${typeof PROPERTY_NAME_SUFFIX_ERROR}${typeof PROPERTY_NAME_SUFFIX_OBSERVABLE}`]: Observable<ControlMetaError>
}

type WbDeviceMetaReaderProperties = {
  readonly meta$: Observable<DeviceMeta>
  readonly error$: Observable<DeviceMetaError>
}

type WbDeviceMetaWriterProperties = {
  set meta(v: Optional<DeviceMeta>)
}

export type PhysicalWbDevice<Config extends TopicsSubscriptionConfig> =
  WbDeviceMetaReaderProperties
  & ValueTopicReaderProperties<Config>
  & ValueTopicWriterProperties<Config>
  & ActionCallProperties<Config>
  & ControlTopicReaderProperties<Config>
  & ControlErrorTopicReaderProperties<Config>

export type VirtualWbDevice<Config extends TopicsSubscriptionConfig<typeof FIELD_DESTINY_READ_AND_WRITE>> =
  PhysicalWbDevice<Config> & WbDeviceMetaWriterProperties

export type ModbusSlave = IntegerRange<1, 250/*or less?*/>

export const DEVICES_TOPIC_IDENTIFIER = 'devices'
export const CONTROLS_TOPIC_IDENTIFIER = 'controls'
export const SYSTEM_TOPIC_IDENTIFIER = 'wb-rx'

export interface SystemTopic {
  readonly definedVirtualDevicesTopicNames: TopicName[]
}