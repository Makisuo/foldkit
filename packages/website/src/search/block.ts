import type { Block } from 'foldkit'

import { SearchComposition } from './composition'
import { init } from './init'
import { EffectsLayer } from './layer'
import { Message } from './message'
import type { Model } from './model'
import { update } from './update'
import { view } from './view'

const assembleSearchBlock = () =>
  SearchComposition.assembleBlock({
    init,
    update,
    view,
    operations: {
      requestOpen: Message.RequestedOpen,
      informRouteChanged: Message.InformedOfRouteChange,
    },
    EffectsLayer,
  })

export const SearchBlock: Block.FromAssemblyWithView<
  typeof Model,
  typeof assembleSearchBlock
> = assembleSearchBlock()
