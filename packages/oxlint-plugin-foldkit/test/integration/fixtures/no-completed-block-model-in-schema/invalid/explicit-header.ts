import { Schema } from 'effect'
import { Block } from 'foldkit'
import type { FromAssemblyWithView as RealHeader, FromAssembly as FailedUnified } from 'foldkit/block'
import type { FromAssemblyWithView as FakeHeader } from '../shared/fake-header'
import { PublicInferred } from '../shared/header-barrel'

const Model = Schema.Struct({ count: Schema.Number })
const Composition = Block.makeDefinition('Child', { Model }).makeComposition()
const assemble = () => Composition.assembleBlock({})
const assembleOther = () => Composition.assembleBlock({})
const FakeComposition = { assembleBlock: () => Composition.assembleBlock({}) }
const assembleFake = () => FakeComposition.assembleBlock()
const Unified: FailedUnified<typeof Model, typeof assemble> = Block.complete(assemble)
const NonQuery: RealHeader<typeof Model, ReturnType<typeof assemble>> = Block.complete(assemble)
const CallTypes: RealHeader<typeof Model, typeof assemble> = Block.complete<unknown>(assemble)
const Inferred = Block.complete(assemble)
const Fake: FakeHeader<typeof Model, typeof assemble> = Block.complete(assemble)
const FakeProducer: RealHeader<typeof Model, typeof assembleFake> = Block.complete(assembleFake)
const WrongProducer: RealHeader<typeof Model, typeof assembleOther> = Block.complete(assemble)
const WrongArity: RealHeader<typeof Model> = Block.complete(assemble)
const ExtraArity: RealHeader<typeof Model, typeof assemble, typeof assembleOther> = Block.complete(assemble)
const WrongInit: RealHeader<typeof Model, typeof assemble> = Block.complete(assembleOther)
const Satisfies = Block.complete(assemble) satisfies RealHeader<typeof Model, typeof assemble>
const Cast = Block.complete(assemble) as RealHeader<typeof Model, typeof assemble>
const assembleWrapped = () => Composition.assembleBlock({}) as unknown
const WrappedProducer: RealHeader<typeof Model, typeof assembleWrapped> = Block.complete(assembleWrapped)
type RealHeaderAlias = unknown
const UnknownAlias: RealHeaderAlias = Block.complete(assemble)
namespace FakeBlock {
  export type FromAssemblyWithView<Model, Producer> = Model & Producer
}
const QualifiedFake: FakeBlock.FromAssemblyWithView<typeof Model, typeof assemble> = Block.complete(assemble)
export const Parent = Schema.Struct({
  unified: Unified.Model,
  nonQuery: NonQuery.Model,
  callTypes: CallTypes.Model,
  inferred: Inferred.Model,
  fake: Fake.Model,
  fakeProducer: FakeProducer.Model,
  wrongProducer: WrongProducer.Model,
  wrongArity: WrongArity.Model,
  extraArity: ExtraArity.Model,
  wrongInit: WrongInit.Model,
  satisfies: Satisfies.Model,
  cast: Cast.Model,
  wrappedProducer: WrappedProducer.Model,
  alias: UnknownAlias.Model,
  qualifiedFake: QualifiedFake.Model,
  imported: Schema.Option(Schema.Array(PublicInferred.Model)),
})
export const shadowed = <RealHeader>() => {
  const Child: RealHeader<typeof Model, typeof assemble> = Block.complete(assemble)
  return Schema.Struct({ child: Child.Model })
}
