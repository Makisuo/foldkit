import { Layer, Schema } from 'effect'
import { Block } from 'foldkit'

const Model = Schema.Struct({ count: Schema.Number })
const Composition = Block.makeDefinition('HeaderChild', { Model }).makeComposition()
const assembleChild = () => Composition.assembleBlock({})
export const HeaderChild: Block.FromAssemblyWithoutViewOrOutMessage<
  typeof Model,
  typeof assembleChild
> = assembleChild()

const assembleInferred = () => Composition.assembleBlock({})
export const InferredChild = assembleInferred()

export const WidenedHeader: ReturnType<typeof assembleChild> = HeaderChild
export const CastHeader = HeaderChild as ReturnType<typeof assembleChild>
export const InferredModel = InferredChild.Model
const assembleBad = () => Composition.assembleBlock({})
export const InferredModelHeader: Block.FromAssemblyWithoutViewOrOutMessage<
  typeof InferredModel,
  typeof assembleBad
> = assembleBad()

const WidenedModel = (HeaderChild as ReturnType<typeof assembleChild>).Model
const assembleWidenedModel = () => Composition.assembleBlock({})
export const WidenedModelHeader: Block.FromAssemblyWithoutViewOrOutMessage<
  typeof WidenedModel,
  typeof assembleWidenedModel
> = assembleWidenedModel()

export const ProvidedHeader = HeaderChild.provideHandlers(Layer.empty)
export const ReplacedHeader = HeaderChild.replaceEffectsLayer(Layer.empty)
export const ProvidedInferred = InferredChild.provideHandlers(Layer.empty)
export const ReplacedInferred = InferredChild.replaceEffectsLayer(Layer.empty)
