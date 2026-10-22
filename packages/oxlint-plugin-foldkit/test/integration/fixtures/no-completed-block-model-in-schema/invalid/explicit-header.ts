import { Schema } from 'effect'
import { Block } from 'foldkit'
import type { FromAssemblyWithView as RealHeader, FromAssembly as FailedUnified } from 'foldkit/block'
import type { FromAssemblyWithView as FakeHeader } from '../shared/fake-header'
import { PublicInferred } from '../shared/header-barrel'

const Model = Schema.Struct({ count: Schema.Number })
const Composition = Block.makeDefinition('Child', { Model }).makeComposition()
const assemble = () => Composition.assembleBlock({})
const assembleOther = () => Composition.assembleBlock({})
const Unified: FailedUnified<typeof Model, typeof assemble> = assemble()
const NonQuery: RealHeader<typeof Model, ReturnType<typeof assemble>> = assemble()
const CallTypes: RealHeader<typeof Model, typeof assemble> = assemble<unknown>()
const Inferred = assemble()
const Fake: FakeHeader<typeof Model, typeof assemble> = assemble()
const WrongProducer: RealHeader<typeof Model, typeof assembleOther> = assemble()
const WrongArity: RealHeader<typeof Model> = assemble()
const ExtraArity: RealHeader<typeof Model, typeof assemble, typeof assembleOther> = assemble()
const WrongInit: RealHeader<typeof Model, typeof assemble> = assembleOther()
const Arguments: RealHeader<typeof Model, typeof assemble> = assemble(123)
const Satisfies = assemble() satisfies RealHeader<typeof Model, typeof assemble>
const Cast = assemble() as RealHeader<typeof Model, typeof assemble>
const assembleWrapped = () => Composition.assembleBlock({}) as unknown
const WrappedProducer: RealHeader<typeof Model, typeof assembleWrapped> = assembleWrapped()
type RealHeaderAlias = unknown
const UnknownAlias: RealHeaderAlias = assemble()
namespace FakeBlock {
  export type FromAssemblyWithView<Model, Producer> = Model & Producer
}
const QualifiedFake: FakeBlock.FromAssemblyWithView<typeof Model, typeof assemble> = assemble()
export const Parent = Schema.Struct({
  unified: Unified.Model,
  nonQuery: NonQuery.Model,
  callTypes: CallTypes.Model,
  inferred: Inferred.Model,
  fake: Fake.Model,
  wrongProducer: WrongProducer.Model,
  wrongArity: WrongArity.Model,
  extraArity: ExtraArity.Model,
  wrongInit: WrongInit.Model,
  arguments: Arguments.Model,
  satisfies: Satisfies.Model,
  cast: Cast.Model,
  wrappedProducer: WrappedProducer.Model,
  alias: UnknownAlias.Model,
  qualifiedFake: QualifiedFake.Model,
  imported: Schema.Option(Schema.Array(PublicInferred.Model)),
})
export const shadowed = <RealHeader>() => {
  const Child: RealHeader<typeof Model, typeof assemble> = assemble()
  return Schema.Struct({ child: Child.Model })
}
