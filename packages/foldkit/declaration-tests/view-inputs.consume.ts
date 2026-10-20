import { Option, Schema } from 'effect'
import * as Block from 'foldkit/block'

import {
  ChildBinding,
  SchemaBackedItem,
  ViewInputsModel,
  makeGenericBlock,
  view,
} from './view-inputs.accepted.js'

export const emittedView = view

export const emittedConfig = ChildBinding.embedView({
  slotId: 'emitted-child',
  model: ViewInputsModel.make({ id: 'emitted-child' }),
  viewInputs: {
    toView: value => value,
    content: null,
    attributes: [],
    maybeLabel: Option.none(),
    item: SchemaBackedItem.make({ id: 'emitted-item' }),
    recursive: { id: 'root', children: [] },
  },
})

const GenericParentModel = Schema.Struct({ child: ViewInputsModel })
const EmittedGenericViewInputsParentDefinition = Block.makeDefinition(
  'EmittedGenericViewInputsParent',
  {
    Model: GenericParentModel,
    Message: Schema.Never,
  },
)
const GenericStringBinding =
  EmittedGenericViewInputsParentDefinition.makeBinding(
    makeGenericBlock<string>(),
    { field: 'child' },
  )

export const emittedGenericConfig = GenericStringBinding.embedView({
  slotId: 'emitted-generic-child',
  model: ViewInputsModel.make({ id: 'emitted-generic-child' }),
  viewInputs: {
    items: ['first'],
    itemToView: () => null,
  },
})
