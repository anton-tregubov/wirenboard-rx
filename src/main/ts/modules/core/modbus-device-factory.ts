import {
  ControlMeta,
  ControlMetaError,
  DeviceMeta,
  DeviceMetaError,
  DEVICES_TOPIC_IDENTIFIER,
  FIELD_DESTINY_ACTION,
  FIELD_DESTINY_READ,
  FIELD_DESTINY_READ_AND_WRITE,
  PhysicalWbDevice,
  PROPERTY_NAME_SUFFIX_ERROR,
  PROPERTY_NAME_SUFFIX_META,
  PROPERTY_NAME_SUFFIX_OBSERVABLE,
  SystemTopic,
  TOPIC_VALUE_COUNTER,
  TOPIC_VALUE_SWITCH,
  TopicsSubscriptionConfig,
  TopicValueType,
  VirtualWbDevice,
} from '@main/modules/core/definitions'
import {
  TopicConsumer,
  TopicEventStreamReactiveSwitch,
  TopicName,
  TopicProducer,
  TopicValueParser,
  TopicValueSerializer,
} from '@main/core/topic-events-stream-reactive-switch'
import { Optional, propertyKeys } from '@main/core/utils'
import { lowerCase } from 'lodash-es'
import { BehaviorSubject } from 'rxjs'

type PartialTopicName<Config extends TopicsSubscriptionConfig> = keyof Config
type TopicNameResolver<Config extends TopicsSubscriptionConfig> = (suffix: Optional<PartialTopicName<Config>>) => TopicName

const TOPIC_SUFFIX_VALUE_WRITER = '/on'
const TOPIC_SUFFIX_META_READER = '/meta'
const TOPIC_SUFFIX_META_ERROR_READER = '/meta/error'

const VALUE_PARSERS = {
  [TOPIC_VALUE_SWITCH]: str => Boolean(parseInt(str)),
  [TOPIC_VALUE_COUNTER]: parseInt,
} satisfies Record<TopicValueType, TopicValueParser<unknown>>

const VALUE_SERIALIZERS = {
  [TOPIC_VALUE_SWITCH]: val => {
    switch (val) {
      case true:
        return '1'
      case false:
        return '0'
      default:
        throw new Error(`Boolean expected. But ${val}`)
    }
  },
  [TOPIC_VALUE_COUNTER]: Number.toString,
} satisfies Record<TopicValueType, TopicValueSerializer<unknown>>

const META_PARSERS = {
  [TOPIC_VALUE_SWITCH]: JSON.parse,
  [TOPIC_VALUE_COUNTER]: JSON.parse,
} satisfies Record<TopicValueType, TopicValueParser<ControlMeta>>

const PROPERTY_DEFINER = {
  defineSetter: <Value>(collector: Record<PropertyKey, Value>, propertyName: string, valueProducer: TopicProducer<Value>) =>
    Object.defineProperty(collector, propertyName, {
      enumerable: true,
      set: (value) => valueProducer.subscriber.next(value),
      get: () => {throw new Error('By design, you should subscribe to  field end with $ to read value. If you want have last value in topic you can wrap observable with <todo> ')},
    }),
  defineGetter: <Value>(collector: Record<PropertyKey, Value>, propertyName: string, valueConsumer: TopicConsumer<Value>) =>
    Object.defineProperty(collector, propertyName, {
      value: valueConsumer.changes$,
      writable: false,
      enumerable: true,
    }),
  defineCaller: (collector: Record<PropertyKey, unknown>, propertyName: string, valueProducer: TopicProducer<unknown>) =>
    Object.defineProperty(collector, propertyName, {
      value: () => valueProducer.subscriber.next('1'),
      writable: false,
      enumerable: true,
    }),
}

export interface ModbusDeviceFactory {

  createPhysicalWbDevice<Config extends TopicsSubscriptionConfig>(config: Config, topicNameResolver: TopicNameResolver<Config>): PhysicalWbDevice<Config>

  createVirtualWbDevice<Config extends TopicsSubscriptionConfig<typeof FIELD_DESTINY_READ_AND_WRITE>>(config: Config, virtualDeviceId: string): VirtualWbDevice<Config>
}

export class ModbusDeviceFactoryImpl implements ModbusDeviceFactory {
  // private readonly _systemTopicProducer: TopicProducer<SystemTopic>
  private readonly _definedNewVirtualDevicesTopicNames$: BehaviorSubject<Set<TopicName>>

  constructor(private readonly _reactiveSwitch: TopicEventStreamReactiveSwitch) {
    // this._systemTopicProducer = _reactiveSwitch.createTopicProducer(`/${SYSTEM_TOPIC_IDENTIFIER}`, serializeSystemTopic)
    this._definedNewVirtualDevicesTopicNames$ = new BehaviorSubject(new Set())
    // const definedCleanUpVirtualDevicesTopicNames$ = _reactiveSwitch
    //   .createTopicConsumer(`/${SYSTEM_TOPIC_IDENTIFIER}`, parseSystemTopic)
    //   .changes$.pipe(map(system => new Set([...system.definedVirtualDevicesTopicNames])))
  }

  createPhysicalWbDevice<Config extends TopicsSubscriptionConfig>(config: Config, topicNameResolver: TopicNameResolver<Config>): PhysicalWbDevice<Config> {
    const topicNameIdentities = propertyKeys(config)
    const device = {} as Record<keyof PhysicalWbDevice<Config>, unknown>
    PROPERTY_DEFINER.defineGetter(device, `${lowerCase(PROPERTY_NAME_SUFFIX_META)}${PROPERTY_NAME_SUFFIX_OBSERVABLE}`, this._reactiveSwitch.createTopicConsumer(`${topicNameResolver(undefined)}${TOPIC_SUFFIX_META_READER}`, parseDeviceMeta))
    PROPERTY_DEFINER.defineGetter(device, `${lowerCase(PROPERTY_NAME_SUFFIX_ERROR)}${PROPERTY_NAME_SUFFIX_OBSERVABLE}`, this._reactiveSwitch.createTopicConsumer(`${topicNameResolver(undefined)}${TOPIC_SUFFIX_META_ERROR_READER}`, parseDeviceMetaError))
    return topicNameIdentities.reduce((collector, topicIdentifier) => {
      const baseTopicName = topicNameResolver(topicIdentifier)
      const { fieldBaseName, fieldValueType, fieldDestiny } = config[topicIdentifier]
      const valueProducer = this._reactiveSwitch.createTopicProducer<unknown>(`${baseTopicName}${TOPIC_SUFFIX_VALUE_WRITER}`, VALUE_SERIALIZERS[fieldValueType])
      const valueConsumer = this._reactiveSwitch.createTopicConsumer<unknown>(baseTopicName, VALUE_PARSERS[fieldValueType])
      const metaConsumer = this._reactiveSwitch.createTopicConsumer<unknown>(`${baseTopicName}${TOPIC_SUFFIX_META_READER}`, META_PARSERS[fieldValueType])
      const errorConsumer = this._reactiveSwitch.createTopicConsumer<unknown>(`${baseTopicName}${TOPIC_SUFFIX_META_ERROR_READER}`, parseControlMetaError)
      PROPERTY_DEFINER.defineGetter(collector, `${fieldBaseName}${PROPERTY_NAME_SUFFIX_META}${PROPERTY_NAME_SUFFIX_OBSERVABLE}`, metaConsumer)
      PROPERTY_DEFINER.defineGetter(collector, `${fieldBaseName}${PROPERTY_NAME_SUFFIX_ERROR}${PROPERTY_NAME_SUFFIX_OBSERVABLE}`, errorConsumer)
      switch (fieldDestiny) {
        case FIELD_DESTINY_READ_AND_WRITE:
          PROPERTY_DEFINER.defineSetter(collector, fieldBaseName, valueProducer)
          PROPERTY_DEFINER.defineGetter(collector, `${fieldBaseName}${PROPERTY_NAME_SUFFIX_OBSERVABLE}`, valueConsumer)
          break
        case FIELD_DESTINY_READ:
          PROPERTY_DEFINER.defineGetter(collector, `${fieldBaseName}${PROPERTY_NAME_SUFFIX_OBSERVABLE}`, valueConsumer)
          break
        case FIELD_DESTINY_ACTION:
          PROPERTY_DEFINER.defineCaller(collector, fieldBaseName, valueProducer)
      }
      return collector
    }, device) as PhysicalWbDevice<Config>
  }

  createVirtualWbDevice<Config extends TopicsSubscriptionConfig<typeof FIELD_DESTINY_READ_AND_WRITE>>(config: Config, virtualDeviceId: string): VirtualWbDevice<Config> {
    const virtualDevicePrefixTopicName = `/${DEVICES_TOPIC_IDENTIFIER}/${virtualDeviceId}`
    const alreadyExistedVirtualDeviceTopics = this._definedNewVirtualDevicesTopicNames$.value
    if (alreadyExistedVirtualDeviceTopics.has(virtualDevicePrefixTopicName)) {
      throw new Error('Unique name collision detected')
    }
    this._definedNewVirtualDevicesTopicNames$.next(new Set([...alreadyExistedVirtualDeviceTopics, virtualDeviceId]))

    this._reactiveSwitch.createTopicProducer(`${alreadyExistedVirtualDeviceTopics}/meta`, serializeSystemTopic)
    const device = {} as Record<keyof PhysicalWbDevice<Config>, unknown>
    return device as VirtualWbDevice<Config>
  }
}

function parseDeviceMeta(str: string): DeviceMeta {
  return JSON.parse(str)
}

function parseDeviceMetaError(str: string): DeviceMetaError {
  return { value: str }
}

function parseControlMetaError(str: string): ControlMetaError {
  return { value: str }
}

function parseSystemTopic(str: string): SystemTopic {
  return JSON.parse(str)
}

function serializeSystemTopic(topic: SystemTopic): string {
  return JSON.stringify(topic)
}