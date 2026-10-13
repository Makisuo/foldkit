import { Layer } from 'effect'
import * as Block from 'foldkit/block'
import * as Command from 'foldkit/command'
import * as Update from 'foldkit/update'

import {
  Child,
  ChildEffectsLayer,
  ChildModel,
  Clock,
  Direct,
  DirectModel,
  Parent,
  ParentModel,
  ReadDirectValue,
  ReadCount,
  type RefreshContext,
  RefinedChoice,
  child,
  contextualRefreshChild,
  directChild,
  makePageProgram,
  makeProgram,
  type RefinedChoiceOutMessage,
  refreshDirectValue,
  renderPage,
} from './accepted.js'

type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends <
    Value,
  >() => Value extends Right ? 1 : 2
    ? true
    : false
type Expect<Value extends true> = Value

const childModel = ChildModel.make({ value: 1 })
const directModel = DirectModel.make({ value: 1 })
const parentModel = ParentModel.make({ child: childModel })

export const childRefresh = Child.steps.refresh(childModel)
export const directRefresh = Direct.steps.refreshDirectValue(directModel)
export const boundRefresh = child.refresh()(parentModel)
export const directBoundRefresh = directChild.refresh()(parentModel)
export const parentRefresh = Parent.steps.refreshChild(parentModel)
export const refinedSelection = RefinedChoice.OutMessage.make({ value: 'Two' })
export const program = makeProgram(document.createElement('div'))
export const pageProgram = makePageProgram(document.createElement('div'))
export const renderedPage = renderPage()

type EmittedServicesAreExact = Expect<
  Equal<Layer.Services<typeof ChildEffectsLayer>, Clock>
>
type EmittedErrorIsExact = Expect<
  Equal<Layer.Error<typeof ChildEffectsLayer>, 'HandlerUnavailable'>
>
type EmittedBoundRequirementsAreExact = Expect<
  Equal<
    Update.RequirementsOf<ReturnType<typeof child.refresh>>,
    Block.Scoped<'child', Command.HandlerOf<typeof ReadCount>>
  >
>
type EmittedProducerParametersAreExact = Expect<
  Equal<
    Parameters<typeof contextualRefreshChild>,
    [model: ParentModel, context?: RefreshContext]
  >
>
type EmittedProducerRequirementsAreExact = Expect<
  Equal<
    Update.RequirementsOf<typeof contextualRefreshChild>,
    Block.Scoped<'child', Command.HandlerOf<typeof ReadCount>>
  >
>
type EmittedDirectRequirementsAreExact = Expect<
  Equal<
    Update.RequirementsOf<typeof refreshDirectValue>,
    Command.HandlerOf<typeof ReadDirectValue>
  >
>
type EmittedRefinementIsExact = Expect<
  Equal<RefinedChoiceOutMessage['value'], 'One' | 'Two'>
>

export type EmittedAssertions = [
  EmittedServicesAreExact,
  EmittedErrorIsExact,
  EmittedBoundRequirementsAreExact,
  EmittedProducerParametersAreExact,
  EmittedProducerRequirementsAreExact,
  EmittedDirectRequirementsAreExact,
  EmittedRefinementIsExact,
]
