import { Array, Option, Schema } from 'effect'
import { expect, expectTypeOf, it } from 'vitest'

import { defineMessageUnion } from '../message/index.js'
import { modifyFields } from '../struct/index.js'
import type * as Update from '../update/index.js'
import { define } from './define.js'

const Model = Schema.Struct({ count: Schema.Number })
type Model = typeof Model.Type
const Message = defineMessageUnion({ ClickedIncrement: {} })
const ConnectionViewsChild = define('ConnectionViewsChild', { Model, Message })
const ViewInputs = Schema.Struct({ label: Schema.String })
type ViewInputs = typeof ViewInputs.Type
const view = ConnectionViewsChild.view.withInputs<ViewInputs>(
  (model, inputs, h) =>
    h.button(
      [h.OnClick(Message.ClickedIncrement())],
      [inputs.label, globalThis.String(model.count)],
    ),
)
const block = ConnectionViewsChild.toBlock({
  init: () => ({ model: Model.make({ count: 0 }) }),
  update: ConnectionViewsChild.update(model => ({
    model: modifyFields(model, { count: count => count + 1 }),
  })),
  view,
})

const Entry = Schema.Struct({ id: Schema.String, child: Model })
const ParentModel = Schema.Struct({
  child: Model,
  entries: Schema.Array(Entry),
})
type ParentModel = typeof ParentModel.Type
const ParentMessage = defineMessageUnion({
  GotChildMessage: { message: Message },
  GotEntryMessage: { id: Schema.String, message: Message },
})

const connected = block.connection({
  Model: ParentModel,
  field: 'child',
  parentMessage: ParentMessage.GotChildMessage,
})
const keyed = block.keyedConnection({
  readAll: (model: ParentModel) => model.entries,
  key: entry => entry.id,
  read: entry => entry.child,
  writeAt: (model, id, nextChild) =>
    modifyFields(model, {
      entries: Array.map(entry =>
        entry.id === id
          ? modifyFields(entry, { child: () => nextChild })
          : entry,
      ),
    }),
  toParentMessage: (id, message) =>
    ParentMessage.GotEntryMessage({ id, message }),
})
const ForeignMessage = defineMessageUnion({ ClickedForeignButton: {} })
const ConnectionViewsForeign = define('ConnectionViewsForeign', {
  Model,
  Message: ForeignMessage,
})
const foreignView = ConnectionViewsForeign.view((model, h) =>
  h.button(
    [h.OnClick(ForeignMessage.ClickedForeignButton())],
    [globalThis.String(model.count)],
  ),
)

const ActiveParent = Schema.TaggedStruct('Active', { child: Model })
const InactiveParent = Schema.TaggedStruct('Inactive', {})
const TaggedParentModel = Schema.Union([ActiveParent, InactiveParent])
type TaggedParentModel = typeof TaggedParentModel.Type
const tagged = block.connection({
  read: (model: TaggedParentModel) =>
    model._tag === 'Active' ? Option.some(model.child) : Option.none(),
  write: (model, nextChild) =>
    model._tag === 'Active' ? ActiveParent.make({ child: nextChild }) : model,
  parentMessage: ParentMessage.GotChildMessage,
})

it('retains default ViewInputs and checks alternate static and keyed Messages', () => {
  const model = Model.make({ count: 1 })
  const staticConfig = connected.embedView({
    slotId: 'child',
    model,
    viewInputs: { label: 'Count' },
  })
  const keyedConfig = keyed.embedView({
    slotId: 'entries',
    key: 'first',
    model,
    viewInputs: { label: 'Count' },
  })
  const alternate = block.view.withInputs<ViewInputs>((model, inputs, h) =>
    h.button(
      [h.OnClick(Message.ClickedIncrement())],
      [inputs.label, globalThis.String(model.count)],
    ),
  )
  const alternateConfig = keyed.embedView({
    slotId: 'entries',
    key: 'first',
    model,
    view: alternate,
    viewInputs: { label: 'Alternate' },
  })

  expect(staticConfig.view).toBe(view)
  expect(keyedConfig.view).toBe(view)
  expect(alternateConfig.view).toBe(alternate)

  // @ts-expect-error The default renderer requires its ViewInputs.
  connected.embedView({ slotId: 'child', model })
  keyed.embedView({
    slotId: 'entries',
    key: 'first',
    model,
    // @ts-expect-error Keyed default views preserve their ViewInputs contract.
    viewInputs: { label: 1 },
  })
  keyed.embedView({
    slotId: 'entries',
    // @ts-expect-error The registered key is a string.
    key: 1,
    model,
    viewInputs: { label: 'Count' },
  })
  // @ts-expect-error A keyed view requires its key.
  keyed.embedView({ slotId: 'entries', model, viewInputs: { label: 'Count' } })
  // @ts-expect-error Static custom views must emit the child's Message union.
  connected.embedView({ slotId: 'child', model, view: foreignView })
  // @ts-expect-error Keyed custom views must emit the child's Message union.
  keyed.embedView({ slotId: 'entries', key: 'first', model, view: foreignView })
})

it('supports explicit tagged-union readers and writers', () => {
  const active = ActiveParent.make({ child: Model.make({ count: 1 }) })
  const inactive = InactiveParent.make({})

  expect(tagged.fold(active, Message.ClickedIncrement()).model).toEqual(
    ActiveParent.make({ child: Model.make({ count: 2 }) }),
  )
  expect(tagged.fold(inactive, Message.ClickedIncrement()).model).toEqual(
    inactive,
  )

  if (false) {
    block.connection({
      // @ts-expect-error An invalid tagged writer makes the accessor pair incompatible.
      read: (model: TaggedParentModel) =>
        model._tag === 'Active' ? Option.some(model.child) : Option.none(),
      // @ts-expect-error A tagged connection writer must return the parent Model union.
      write: (_model: TaggedParentModel, nextChild) => nextChild,
      parentMessage: ParentMessage.GotChildMessage,
    })
  }
})

it('lowers required-field shorthand through the shared pure connection adapter', () => {
  const initial = ParentModel.make({
    child: Model.make({ count: 0 }),
    entries: [],
  })
  const result = connected.fold(initial, Message.ClickedIncrement())

  expect(result.model.child.count).toBe(1)
  expect(result.model.entries).toBe(initial.entries)
  expect(initial.child.count).toBe(0)
  expectTypeOf<
    Update.RequirementsOf<typeof connected.fold>
  >().toEqualTypeOf<never>()
  expectTypeOf(result.model).toEqualTypeOf<ParentModel>()

  const optionalModel = Schema.Struct({ maybeChild: Schema.Option(Model) })
  const optional = block.connection({
    read: (model: typeof optionalModel.Type) => model.maybeChild,
    write: (model, nextChild) =>
      modifyFields(model, { maybeChild: () => Option.some(nextChild) }),
    parentMessage: ParentMessage.GotChildMessage,
  })
  expect(
    optional.fold(
      optionalModel.make({ maybeChild: Option.none() }),
      Message.ClickedIncrement(),
    ).model.maybeChild,
  ).toEqual(Option.none())

  const widerModel = Schema.Struct({
    child: Schema.Union([Model, Schema.String]),
  })
  const narrowerModel = Schema.Struct({
    child: Schema.Struct({ count: Schema.Literal(0) }),
  })
  const extendedModel = Schema.Struct({
    child: Schema.Struct({
      count: Schema.Number,
      label: Schema.optionalKey(Schema.String),
    }),
  })

  if (false) {
    block.connection({
      Model: widerModel,
      // @ts-expect-error A wider field cannot be replaced by this child's Model.
      field: 'child',
      parentMessage: ParentMessage.GotChildMessage,
    })
    block.connection({
      Model: narrowerModel,
      // @ts-expect-error A narrower field cannot accept every child Model update.
      field: 'child',
      parentMessage: ParentMessage.GotChildMessage,
    })
    block.connection({
      Model: extendedModel,
      // @ts-expect-error The connection cannot discard additional optional child fields.
      field: 'child',
      parentMessage: ParentMessage.GotChildMessage,
    })
    block.connection({
      Model: optionalModel,
      // @ts-expect-error Optional children require explicit accessors.
      field: 'maybeChild',
      parentMessage: ParentMessage.GotChildMessage,
    })
    block.connection({
      Model: ParentModel,
      // @ts-expect-error Required-field shorthand rejects undeclared fields.
      field: 'missing',
      parentMessage: ParentMessage.GotChildMessage,
    })
    block.connection({
      Model: ParentModel,
      field: 'child',
      // @ts-expect-error Required-field shorthand cannot mix explicit readers.
      read: (model: ParentModel) => Option.some(model.child),
      parentMessage: ParentMessage.GotChildMessage,
    })
  }
})
