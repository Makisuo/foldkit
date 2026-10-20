import { Effect, Layer, Schema } from 'effect'
import { Block, Command, Message, Update } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import {
  CountStore,
  GeneratedDispatchChildBlock,
  PreparationFailure,
} from './generated-dispatch.accepted.js'

export const Model = Schema.Struct({
  child: GeneratedDispatchChildBlock.Model,
  isReady: Schema.Boolean,
})
export const LocalMessage = Message.defineMessageUnion({
  CompletedPrepare: {},
})
export const ComposedInitDefinition = Block.makeDefinition('ComposedInit', {
  Model,
  Message: LocalMessage,
})
export const Prepare = ComposedInitDefinition.command('Prepare', {
  messages: [LocalMessage.CompletedPrepare],
  handler: function* () {
    return () => Effect.succeed(LocalMessage.CompletedPrepare())
  },
})
export const ChildBinding = ComposedInitDefinition.bindChild(
  GeneratedDispatchChildBlock,
  { field: 'child' },
)
export const ComposedInitComposition = ComposedInitDefinition.makeComposition({
  bindings: [ChildBinding],
})
export const prepare = ComposedInitDefinition.step(model => ({
  model: modifyFields(model, { isReady: () => true }),
  commands: [Prepare()],
}))
export const prepareTogether = ComposedInitDefinition.step(() =>
  Update.combineSteps([ChildBinding.requestReadCount(), prepare]),
)
export const init = ComposedInitComposition.makeInit((isReady: boolean) => ({
  model: { isReady },
  steps: [prepareTogether],
}))
export const ComposedInitBlock = ComposedInitComposition.assembleBlock({
  init,
  update: ComposedInitComposition.makeUpdate(model => ({ model })),
  EffectsLayer: Prepare.layer,
})

type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends <
    Value,
  >() => Value extends Right ? 1 : 2
    ? true
    : false
type Expect<Value extends true> = Value

export type ExactArguments = Expect<
  Equal<Parameters<typeof init>, [isReady: boolean]>
>
export type ExactRequirements = Expect<
  Equal<
    Update.RequirementsOf<typeof init>,
    | Update.RequirementsOf<ReturnType<typeof ChildBinding.requestReadCount>>
    | Command.HandlerOf<typeof Prepare>
  >
>
export type ExactServices = Expect<
  Equal<Layer.Services<typeof ComposedInitBlock.EffectsLayer>, CountStore>
>
export type ExactConstructorError = Expect<
  Equal<Layer.Error<typeof ComposedInitBlock.EffectsLayer>, PreparationFailure>
>
