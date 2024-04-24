import {
  ControlMeta,
  ControlMetaError,
  DeviceMeta,
  DeviceMetaError,
  FIELD_DESTINY_ACTION,
  FIELD_DESTINY_READ,
  FIELD_DESTINY_READ_AND_WRITE,
  PhysicalWbDevice,
  PROPERTY_NAME_SUFFIX_ERROR,
  PROPERTY_NAME_SUFFIX_META,
  PROPERTY_NAME_SUFFIX_OBSERVABLE,
  TOPIC_VALUE_COUNTER,
  TOPIC_VALUE_SWITCH,
  TopicsSubscriptionConfig,
  TopicValueType,
  VirtualWbDevice,
} from '@main/modules/core/definitions'
import {
  TopicEventStreamReactiveSwitch,
  TopicName,
  TopicValueParser,
  TopicValueSerializer,
} from '@main/core/topic-events-stream-reactive-switch'
import { Optional, propertyKeys } from '@main/core/utils'

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

export interface ModbusDeviceFactory {

  createPhysicalWbDevice<Config extends TopicsSubscriptionConfig>(config: Config, topicNameResolver: TopicNameResolver<Config>): PhysicalWbDevice<Config>

  createVirtualWbDevice<Config extends TopicsSubscriptionConfig<typeof FIELD_DESTINY_READ_AND_WRITE>>(config: Config): VirtualWbDevice<Config>
}

export class ModbusDeviceFactoryImpl implements ModbusDeviceFactory {
  constructor(private readonly _reactiveSwitch: TopicEventStreamReactiveSwitch) {}

  createPhysicalWbDevice<Config extends TopicsSubscriptionConfig>(config: Config, topicNameResolver: TopicNameResolver<Config>): PhysicalWbDevice<Config> {
    const topicNameIdentities = propertyKeys(config)
    return topicNameIdentities.reduce((collector, topicIdentifier) => {
      const baseTopicName = topicNameResolver(topicIdentifier)
      const { fieldBaseName, fieldValueType, fieldDestiny } = config[topicIdentifier]
      const valueProducer = this._reactiveSwitch.createTopicProducer<unknown>(`${baseTopicName}${TOPIC_SUFFIX_VALUE_WRITER}`, VALUE_SERIALIZERS[fieldValueType])
      const valueConsumer = this._reactiveSwitch.createTopicConsumer<unknown>(baseTopicName, VALUE_PARSERS[fieldValueType])
      const metaConsumer = this._reactiveSwitch.createTopicConsumer<unknown>(`${baseTopicName}${TOPIC_SUFFIX_META_READER}`, META_PARSERS[fieldValueType])
      const errorConsumer = this._reactiveSwitch.createTopicConsumer<unknown>(`${baseTopicName}${TOPIC_SUFFIX_META_ERROR_READER}`, parseControlMetaError)
      Object.assign(collector, {
        [`${fieldBaseName}${PROPERTY_NAME_SUFFIX_META}${PROPERTY_NAME_SUFFIX_OBSERVABLE}`]: metaConsumer.changes$,
        [`${fieldBaseName}${PROPERTY_NAME_SUFFIX_ERROR}${PROPERTY_NAME_SUFFIX_OBSERVABLE}`]: errorConsumer.changes$,
      })
      switch (fieldDestiny) {
        // @ts-expect-error cause define write and read will define later
        case FIELD_DESTINY_READ_AND_WRITE:
          Object.defineProperty(collector, fieldBaseName, {
            enumerable: true,
            set: (value) => valueProducer.subscriber.next(value),
            get: () => {throw new Error('By design, you should subscribe to  field end with $ to read value. If you want have last value in topic you can wrap observable with <todo> ')},
          })
        // eslint-disable-next-line no-fallthrough
        case FIELD_DESTINY_READ:
          Object.defineProperty(collector, `${fieldBaseName}${PROPERTY_NAME_SUFFIX_OBSERVABLE}`, {
            value: valueConsumer.changes$,
            writable: false,
            enumerable: true,
          })
          break
        case FIELD_DESTINY_ACTION:
          Object.defineProperty(collector, fieldBaseName, {
            value: () => valueProducer.subscriber.next('1'),
            writable: false,
            enumerable: true,
          })
      }
      return collector
    }, {
      meta$: this._reactiveSwitch.createTopicConsumer(`${topicNameResolver(undefined)}${TOPIC_SUFFIX_META_READER}`, parseDeviceMeta).changes$,
      error$: this._reactiveSwitch.createTopicConsumer(`${topicNameResolver(undefined)}${TOPIC_SUFFIX_META_ERROR_READER}`, parseDeviceMetaError).changes$,
    } as Record<keyof PhysicalWbDevice<Config>, unknown>) as PhysicalWbDevice<Config>
  }

  createVirtualWbDevice<Config extends TopicsSubscriptionConfig<typeof FIELD_DESTINY_READ_AND_WRITE>>(config: Config): VirtualWbDevice<Config> {
    throw new Error('Not Implemented' + config)
  }
}

function parseDeviceMeta(str: string): DeviceMeta {
  return JSON.parse(str) as DeviceMeta
}

function parseDeviceMetaError(str: string): DeviceMetaError {
  return { value: str }
}

function parseControlMetaError(str: string): ControlMetaError {
  return { value: str }
}