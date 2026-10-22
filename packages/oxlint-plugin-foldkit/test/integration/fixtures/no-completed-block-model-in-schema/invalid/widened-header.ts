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
const Safe: Block.FromAssemblyWithoutViewOrOutMessage<typeof Model, typeof assemble> = assemble()
const Reannotated: ReturnType<typeof assemble> = Safe
const Cast = Safe as ReturnType<typeof assemble>
const AngleCast = <ReturnType<typeof assemble>>Safe
const ImportedReannotated: ReturnType<typeof assemble> = PublicHeader
const ImportedCast = PublicHeader as ReturnType<typeof assemble>
const SameAnnotation: typeof Safe = Safe
const WidenedModel = (Safe as ReturnType<typeof assemble>).Model
const ViaWidenedModel: Block.FromAssemblyWithoutViewOrOutMessage<typeof WidenedModel, typeof assemble> = assemble()
const Inferred = Composition.assembleBlock({})
const ModelAlias = Inferred.Model
const ViaInferredModel: Block.FromAssemblyWithoutViewOrOutMessage<typeof Inferred.Model, typeof assemble> = assemble()
const ViaModelAlias: Block.FromAssemblyWithoutViewOrOutMessage<typeof ModelAlias, typeof assemble> = assemble()
const ViaImportedModel: Block.FromAssemblyWithoutViewOrOutMessage<typeof InferredModel, typeof assemble> = assemble()
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
