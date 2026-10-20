import { Layer, Option, Schema } from 'effect'
import * as Block from 'foldkit/block'
import type { ChildAttribute, Html, HtmlBuilder } from 'foldkit/html'
import { defineMessageUnion } from 'foldkit/message'
import type * as Mount from 'foldkit/mount'

type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends <
    Value,
  >() => Value extends Right ? 1 : 2
    ? true
    : false

type Expect<Value extends true> = Value

export const ViewInputsModel = Schema.Struct({ id: Schema.String })
export type ViewInputsModel = typeof ViewInputsModel.Type

export const ViewInputsMessage = defineMessageUnion({ CompletedObserve: {} })
export type ViewInputsMessage = typeof ViewInputsMessage.Type

export class SchemaBackedItem extends Schema.Class<SchemaBackedItem>(
  'DeclarationViewInputsItem',
)({
  id: Schema.String,
}) {}

export type RecursiveItem = Readonly<{
  id: string
  children: ReadonlyArray<RecursiveItem>
}>

export type ViewInputs = Readonly<{
  toView: (
    value: Readonly<{ nestedCallback: () => unknown }>,
  ) => Readonly<{ nestedCallback: () => unknown }>
  content: Html
  attributes: ReadonlyArray<ChildAttribute>
  maybeLabel: Option.Option<Readonly<{ label: string }>>
  item: SchemaBackedItem
  recursive: RecursiveItem
}>

const DeclarationViewInputsNamespace = Block.makeNamespace(
  'DeclarationViewInputs',
)

export const Observe = DeclarationViewInputsNamespace.makeMount('Observe', {
  messages: [ViewInputsMessage.CompletedObserve],
})

export const DeclarationViewInputsComposition =
  DeclarationViewInputsNamespace.makeDefinition({
    Model: ViewInputsModel,
    Message: ViewInputsMessage,
  }).makeComposition({ mounts: [Observe] })

export const view =
  DeclarationViewInputsComposition.makeView.withInputs<ViewInputs>(
    (model, _viewInputs, h) => h.div([h.OnMount(Observe())], [model.id]),
  )

export type GenericViewInputs<Item> = Readonly<{
  items: ReadonlyArray<Item>
  itemToView: (item: Item) => Html
}>

export const DeclarationGenericViewInputsComposition = Block.makeNamespace(
  'DeclarationGenericViewInputs',
)
  .makeDefinition({
    Model: ViewInputsModel,
    Message: ViewInputsMessage,
  })
  .makeComposition()

export const makeGenericBlock = <Item>() => {
  const genericView =
    DeclarationGenericViewInputsComposition.makeView.withInputs<
      GenericViewInputs<Item>
    >((_model, _viewInputs, h) => h.empty)

  return DeclarationGenericViewInputsComposition.assembleBlock({
    init: () => ({ model: ViewInputsModel.make({ id: 'generic-child' }) }),
    update: DeclarationGenericViewInputsComposition.makeUpdate(model => ({
      model,
    })),
    view: genericView,
    EffectsLayer: Layer.empty,
    operations: {},
  })
}

const blockView =
  DeclarationGenericViewInputsComposition.makeView.withInputs<ViewInputs>(
    (_model, _viewInputs, h) => h.empty,
  )

type ViewParametersAreExact = Expect<
  Equal<
    Parameters<typeof view>,
    [
      model: ViewInputsModel,
      viewInputs: ViewInputs,
      h: HtmlBuilder<ViewInputsMessage, Mount.RequirementsOf<typeof Observe>>,
    ]
  >
>

export const block = DeclarationGenericViewInputsComposition.assembleBlock({
  init: () => ({ model: ViewInputsModel.make({ id: 'child' }) }),
  update: DeclarationGenericViewInputsComposition.makeUpdate(model => ({
    model,
  })),
  view: blockView,
  EffectsLayer: Layer.empty,
  operations: {},
})

const ParentModel = Schema.Struct({ child: ViewInputsModel })
const DeclarationViewInputsParentDefinition = Block.makeDefinition(
  'DeclarationViewInputsParent',
  {
    Model: ParentModel,
    Message: Schema.Never,
  },
)

export const ChildBinding = DeclarationViewInputsParentDefinition.makeBinding(
  block,
  {
    field: 'child',
  },
)

export const childConfig = ChildBinding.embedView({
  slotId: 'child',
  model: ViewInputsModel.make({ id: 'child' }),
  viewInputs: {
    toView: value => value,
    content: null,
    attributes: [],
    maybeLabel: Option.some({ label: 'Child' }),
    item: SchemaBackedItem.make({ id: 'item' }),
    recursive: { id: 'root', children: [] },
  },
})

export type ViewInputAssertions = [ViewParametersAreExact]
