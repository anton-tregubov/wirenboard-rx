import { Observable } from 'rxjs'
import { Optional } from '@main/core/utils'

export const CONTROL_TYPE_READ = 'read'
export const CONTROL_TYPE_READ_AND_WRITE = 'read-and-write'
export const CONTROL_TYPE_ACTION = 'action'
export type ControlType = typeof CONTROL_TYPE_READ | typeof CONTROL_TYPE_READ_AND_WRITE | typeof CONTROL_TYPE_ACTION

export interface ChannelDefinition<FieldName extends string, VType, CType extends ControlType, MetaType extends ControlMeta> {
  readonly fieldName: FieldName,
  readonly valueType: VType,
  readonly controlType: CType,
  readonly controlMeta: MetaType,
}

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

type OmitConfigFieldsByType<Source extends Record<string, ChannelDefinition<string, unknown, ControlType, ControlMeta>>, CType extends ControlType> = {
  [Property in keyof Source]: (Source[Property]['controlType']) extends CType ? Property : never
}[keyof Source]

type ColdReadFields<Config extends Record<string, ChannelDefinition<string, unknown, ControlType, ControlMeta>>> = {
  readonly [Control in OmitConfigFieldsByType<Config, typeof CONTROL_TYPE_READ | typeof CONTROL_TYPE_READ_AND_WRITE> as `${Config[Control]['fieldName']}$`]: Observable<Config[Control]['valueType']>
}

type HotReadFields<Config extends Record<string, ChannelDefinition<string, unknown, ControlType, ControlMeta>>> = {
  readonly [Control in OmitConfigFieldsByType<Config, typeof CONTROL_TYPE_READ> as `${Config[Control]['fieldName']}`]: Optional<Config[Control]['valueType']>
}

type WriteFields<Config extends Record<string, ChannelDefinition<string, unknown, ControlType, ControlMeta>>> = {
  /*writeonly*/-readonly [Control in OmitConfigFieldsByType<Config, typeof CONTROL_TYPE_READ_AND_WRITE> as `${Config[Control]['fieldName']}`]: Config[Control]['valueType']
}

type ActionFields<Config extends Record<string, ChannelDefinition<string, unknown, ControlType, ControlMeta>>> = {
  readonly [Control in OmitConfigFieldsByType<Config, typeof CONTROL_TYPE_ACTION> as `${Config[Control]['fieldName']}`]: () => void
}

type ColdControlMetaFields<Config extends Record<string, ChannelDefinition<string, unknown, ControlType, ControlMeta>>> = {
  readonly [Control in keyof Config as `${Config[Control]['fieldName']}Meta$`]: Observable<Config[Control]['controlMeta']>
}

type HotControlMetaFields<Config extends Record<string, ChannelDefinition<string, unknown, ControlType, ControlMeta>>> = {
  readonly [Control in keyof Config as `${Config[Control]['fieldName']}Meta`]: Optional<Config[Control]['controlMeta']>
}

type ControlErrorFields<Config extends Record<string, ChannelDefinition<string, unknown, ControlType, ControlMeta>>> = {
  readonly [Control in keyof Config as `${Config[Control]['fieldName']}Error$`]: Observable<ControlError>
}

type ColdReadWbDeviceMetaFiled = {
  readonly meta$: Observable<DeviceMeta>
}

type HotReadWbDeviceMetaFiled = {
  get meta(): DeviceMeta
}

type WriteWbDeviceMetaFiled = {
  set meta(v: Optional<DeviceMeta>)
}

export type PhysicalColdWbDevice<Config extends Record<string, ChannelDefinition<string, unknown, ControlType, ControlMeta>>> =
  ColdReadWbDeviceMetaFiled
  & ColdReadFields<Config>
  & WriteFields<Config>
  & ActionFields<Config>
  & ColdControlMetaFields<Config>
  & ControlErrorFields<Config>

export type PhysicalHotWbDevice<Config extends Record<string, ChannelDefinition<string, unknown, ControlType, ControlMeta>>> =
  PhysicalColdWbDevice<Config> & HotReadFields<Config> & HotReadWbDeviceMetaFiled

export type VirtualColdWbDevice<Config extends Record<string, ChannelDefinition<string, unknown, typeof CONTROL_TYPE_READ_AND_WRITE, ControlMeta>>> =
  PhysicalColdWbDevice<Config> & WriteWbDeviceMetaFiled

export type VirtualHotWbDevice<Config extends Record<string, ChannelDefinition<string, unknown, typeof CONTROL_TYPE_READ_AND_WRITE, ControlMeta>>> =
  VirtualColdWbDevice<Config> & HotReadFields<Config> & HotControlMetaFields<Config> & HotReadWbDeviceMetaFiled
