import { Layer, Schema } from 'effect'
import { Block } from 'foldkit'

const Model = Schema.Struct({ count: Schema.Number })
const Composition = Block.makeDefinition('HeaderChild', { Model }).makeComposition()
const assembleChild = () => Composition.assembleBlock({})
export const HeaderChild: Block.FromAssemblyWithoutViewOrOutMessage<
  typeof Model,
  typeof assembleChild
> = Block.complete(assembleChild)

const assembleInferred = () => Composition.assembleBlock({})
export const InferredChild = Block.complete(assembleInferred)

export const WidenedHeader: typeof HeaderChild = HeaderChild
export const CastHeader = HeaderChild as typeof HeaderChild
export const InferredModel = InferredChild.Model
const assembleBad = () => Composition.assembleBlock({})
export const InferredModelHeader: Block.FromAssemblyWithoutViewOrOutMessage<
  typeof InferredModel,
  typeof assembleBad
> = Block.complete(assembleBad)

const WidenedModel = (HeaderChild as typeof HeaderChild).Model
const assembleWidenedModel = () => Composition.assembleBlock({})
export const WidenedModelHeader: Block.FromAssemblyWithoutViewOrOutMessage<
  typeof WidenedModel,
  typeof assembleWidenedModel
> = Block.complete(assembleWidenedModel)

export const ProvidedHeader = HeaderChild.provideHandlers(Layer.empty)
export const ReplacedHeader = HeaderChild.replaceEffectsLayer(Layer.empty)
export const ProvidedInferred = InferredChild.provideHandlers(Layer.empty)
export const ReplacedInferred = InferredChild.replaceEffectsLayer(Layer.empty)
