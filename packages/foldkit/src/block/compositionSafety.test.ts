import { Layer, Predicate, Schema } from 'effect'
import { describe, expect, it } from 'vitest'

import { defineMessageUnion } from '../schema/index.js'
import { modifyFields } from '../struct/index.js'
import { define } from './define.js'

const ChildModel = Schema.Struct({ count: Schema.Number })
const ChildMessage = defineMessageUnion({ Incremented: {} })

const Plain = define('CompositionSafetyRuntimePlain', {
  Model: ChildModel,
  Message: ChildMessage,
})
const PlainComposition = Plain.toComposition()
const PlainBlock = Reflect.apply(PlainComposition.toBlock, undefined, [
  {
    init: PlainComposition.init(() => ({
      model: ChildModel.make({ count: 0 }),
    })),
    update: Reflect.apply(PlainComposition.update, undefined, [
      (model: typeof ChildModel.Type) => ({
        model: modifyFields(model, { count: count => count + 1 }),
      }),
    ]),
    EffectsLayer: Layer.empty,
  },
])

const OptionalContext = define('CompositionSafetyRuntimeOptionalContext', {
  Model: ChildModel,
  Message: ChildMessage,
})
const OptionalContextComposition = OptionalContext.toComposition()
const OptionalContextBlock = Reflect.apply(
  OptionalContextComposition.toBlock,
  undefined,
  [
    {
      init: OptionalContextComposition.init(() => ({
        model: ChildModel.make({ count: 0 }),
      })),
      update: Reflect.apply(OptionalContextComposition.update, undefined, [
        (
          model: typeof ChildModel.Type,
          _message: typeof ChildMessage.Type,
          context?: Readonly<{ amount: number }>,
        ) => ({
          model: modifyFields(model, {
            count: count => count + (context?.amount ?? 1),
          }),
        }),
      ]),
      EffectsLayer: Layer.empty,
    },
  ],
)

const ParentModel = Schema.Struct({ child: ChildModel })
const ParentMessage = defineMessageUnion({
  GotChildMessage: { message: ChildMessage },
})
const Parent = define('CompositionSafetyRuntimeParent', {
  Model: ParentModel,
  Message: ParentMessage,
})

describe('Composition safety', () => {
  it('automatically routes a canonical child Message with no update context', () => {
    const binding = Reflect.apply(Parent.bindChild, undefined, [
      PlainBlock,
      {
        field: 'child',
        parentMessage: ParentMessage.GotChildMessage,
      },
    ])
    const composition = Reflect.apply(Parent.toComposition, undefined, [
      { childBindings: [binding] },
    ])
    const update = Reflect.apply(composition.update, undefined, [])
    const initial = ParentModel.make({
      child: ChildModel.make({ count: 0 }),
    })

    if (!Predicate.isFunction(update)) {
      throw new Error('Expected a Composition update function')
    }

    const result = Reflect.apply(update, undefined, [
      initial,
      ParentMessage.GotChildMessage({ message: ChildMessage.Incremented() }),
    ])

    expect(result).toMatchObject({ model: { child: { count: 1 } } })
  })

  it('rejects an omitted route for an observable optional update context', () => {
    expect(() =>
      Reflect.apply(Parent.bindChild, undefined, [
        OptionalContextBlock,
        {
          field: 'child',
          parentMessage: ParentMessage.GotChildMessage,
        },
      ]),
    ).toThrow(
      'A custom, keyed, or contextual Binding must supply fromParentMessage',
    )
  })
})
