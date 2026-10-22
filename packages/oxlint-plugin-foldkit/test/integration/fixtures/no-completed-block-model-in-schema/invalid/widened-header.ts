import { Schema } from 'effect'
import { Block } from 'foldkit'
import {
  PublicHeader,
  WidenedHeader,
  CastHeader,
  InferredModel,
  InferredModelHeader,
  WidenedModelHeader,
} from '../shared/header-barrel'

const Model = Schema.Struct({ count: Schema.Number })
const Composition = Block.makeDefinition('Child', { Model }).makeComposition()
const assemble = () => Composition.assembleBlock({})
const Safe: Block.FromAssemblyWithoutViewOrOutMessage<typeof Model, typeof assemble> = Block.complete(assemble)
const Reannotated: typeof Safe = Safe
const Cast = Safe as typeof Safe
const AngleCast = <typeof Safe>Safe
const ImportedReannotated: typeof Safe = PublicHeader
const ImportedCast = PublicHeader as typeof Safe
const SameAnnotation: typeof Safe = Safe
const WidenedModel = (Safe as typeof Safe).Model
const ViaWidenedModel: Block.FromAssemblyWithoutViewOrOutMessage<typeof WidenedModel, typeof assemble> = Block.complete(assemble)
const Inferred = Block.complete(assemble)
const ModelAlias = Inferred.Model
const ViaInferredModel: Block.FromAssemblyWithoutViewOrOutMessage<typeof Inferred.Model, typeof assemble> = Block.complete(assemble)
const ViaModelAlias: Block.FromAssemblyWithoutViewOrOutMessage<typeof ModelAlias, typeof assemble> = Block.complete(assemble)
const ViaImportedModel: Block.FromAssemblyWithoutViewOrOutMessage<typeof InferredModel, typeof assemble> = Block.complete(assemble)
export const Parent = Schema.Struct({
  reannotated: Reannotated.Model,
  cast: Schema.Option(Schema.Array(Cast.Model)),
  angleCast: AngleCast.Model,
  importedReannotated: ImportedReannotated.Model,
  importedCast: ImportedCast.Model,
  sourceAnnotation: WidenedHeader.Model,
  sourceCast: CastHeader.Model,
  inlineCast: (Safe as ReturnType<typeof assemble>).Model,
  nestedCast: ((Safe as ReturnType<typeof assemble>) satisfies unknown).Model,
  sameAnnotation: SameAnnotation.Model,
  inferredModel: ViaInferredModel.Model,
  modelAlias: ViaModelAlias.Model,
  importedModel: ViaImportedModel.Model,
  sourceModel: InferredModelHeader.Model,
  widenedModel: ViaWidenedModel.Model,
  sourceWidenedModel: WidenedModelHeader.Model,
})
