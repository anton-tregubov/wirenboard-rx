import { ColdWbMr6c, HotWbMr6c } from '@main/modules/wb/wb-mr6c'

export interface WirenboardFactory {
  createColdWbMr6c(): ColdWbMr6c

  createHotWbMr6c(): HotWbMr6c
}

export class WirenboardFactoryImpl implements WirenboardFactory {
  constructor() {

  }

  createColdWbMr6c(): ColdWbMr6c {
    throw new Error('Not imlemented')
  }

  createHotWbMr6c(): HotWbMr6c {
    throw new Error('Not imlemented')
  }

}