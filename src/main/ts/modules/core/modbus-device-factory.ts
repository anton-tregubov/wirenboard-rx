import {
  ControlMeta,
  ControlMetaError,
  DeviceMeta,
  DeviceMetaError,
  FIELD_DESTINY_ACTION,
  FIELD_DESTINY_READ,
  FIELD_DESTINY_READ_AND_WRITE,
  PhysicalWbDevice,
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

const VALUE_PARSERS = {
  [TOPIC_VALUE_SWITCH]: str => Boolean(parseInt(str)),
  [TOPIC_VALUE_COUNTER]: parseInt,
} satisfies Record<TopicValueType, TopicValueParser<unknown>>

const VALUE_SERIALIZERS = {
  [TOPIC_VALUE_SWITCH]: val => {
    switch (val) {
      case true:
        return '0'
      case false:
        return '1'
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
      const valueProducer = this._reactiveSwitch.createTopicProducer<unknown>(`${baseTopicName}/on`, VALUE_SERIALIZERS[fieldValueType])
      const valueConsumer = this._reactiveSwitch.createTopicConsumer<unknown>(baseTopicName, VALUE_PARSERS[fieldValueType])
      const metaConsumer = this._reactiveSwitch.createTopicConsumer<unknown>(`${baseTopicName}/meta`, META_PARSERS[fieldValueType])
      const errorConsumer = this._reactiveSwitch.createTopicConsumer<unknown>(`${baseTopicName}/meta/error`, parseControlMetaError)
      Object.assign(collector, {
        [`${fieldBaseName}Meta$`]: metaConsumer.changes$,
        [`${fieldBaseName}Error$`]: errorConsumer.changes$,
      })
      switch (fieldDestiny) {
        // @ts-expect-error cause define write and read will define later
        case FIELD_DESTINY_READ_AND_WRITE:
          Object.assign(collector, { set [fieldBaseName](value: unknown) {valueProducer.subscriber.next(value)} })
        // eslint-disable-next-line no-fallthrough
        case FIELD_DESTINY_READ:
          Object.assign(collector, { [`${fieldBaseName}$`]: valueConsumer.changes$ })
          break
        case FIELD_DESTINY_ACTION:
          Object.assign(collector, { [fieldBaseName]: () => {valueProducer.subscriber.next('1')} })
      }
      return collector
    }, {
      meta$: this._reactiveSwitch.createTopicConsumer(`${topicNameResolver(undefined)}/meta`, parseDeviceMeta).changes$,
      error$: this._reactiveSwitch.createTopicConsumer(`${topicNameResolver(undefined)}/meta/error`, parseDeviceMetaError).changes$,
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