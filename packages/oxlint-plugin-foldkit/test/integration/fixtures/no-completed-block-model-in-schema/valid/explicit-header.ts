import { Schema } from 'effect'
import type { Block as Boundary } from 'foldkit'
import * as Feature from 'foldkit/block'
import type {
  FromAssemblyWithView as ViewHeader,
  FromAssemblyWithViewAndOutMessage as ViewOutHeader,
  FromAssemblyWithOutMessage as OutHeader,
  FromAssemblyWithoutViewOrOutMessage as PlainHeader,
} from 'foldkit/block'

import { PublicHeader } from '../shared/header-barrel'
import * as HeaderFeature from '../shared/header-barrel'

const Model = Schema.Struct({ count: Schema.Number })
const Composition = Feature.makeDefinition('Child', { Model }).makeComposition()
const assembleQualified = () => Composition.assembleBlock({})
const Qualified: Boundary.FromAssemblyWithoutViewOrOutMessage<typeof Model, typeof assembleQualified> = assembleQualified()
const assembleView = () => Composition.assembleBlock({})
const View: ViewHeader<typeof Model, typeof assembleView> = assembleView()
const assembleViewOut = () => { return Composition.assembleBlock({}) }
const ViewOut: ViewOutHeader<typeof Model, typeof assembleViewOut> = assembleViewOut()
const assembleOut = () => Composition.assembleBlock({})
const Out: OutHeader<typeof Model, typeof assembleOut> = assembleOut()
const assemblePlain = () => Composition.assembleBlock({})
const Plain: PlainHeader<typeof Model, typeof assemblePlain> = assemblePlain()
const alias = Qualified
export const Parent = Schema.Struct({
  qualified: Schema.Option(Schema.Array(alias.Model)),
  satisfies: (alias satisfies unknown).Model,
  parenthesized: (alias).Model,
  nonNull: alias!.Model,
  view: View.Model,
  viewOut: ViewOut.Model,
  out: Out.Model,
  plain: Plain.Model,
  imported: PublicHeader.Model,
  namespace: HeaderFeature.PublicHeader.Model,
})
export type ChildModel = typeof Qualified.Model.Type
export const ordinary = Qualified.Model
