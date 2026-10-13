import { Effect, Layer } from 'effect'
import * as Block from 'foldkit/block'
import * as Command from 'foldkit/command'
import * as Runtime from 'foldkit/runtime'
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
  ProvisionDependencyLayer,
  ProvisionExtra,
  ReadCount,
  ReadDirectValue,
  RefinedChoice,
  type RefinedChoiceOutMessage,
  type RefreshContext,
  child,
  contextualRefreshChild,
  directChild,
  makePageProgram,
  makeProgram,
  makeProvisionElement,
  makeProvisionPageAwaitingDependency,
  provisionPorts,
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

const provisionPageAwaitingDependency = makeProvisionPageAwaitingDependency(
  document.createElement('div'),
)
const provideDependency = provisionPageAwaitingDependency.provide
export const provisionPage = provideDependency(ProvisionDependencyLayer)
export const provisionElement = makeProvisionElement(
  document.createElement('div'),
)
export const provisionElementHandle = Runtime.embed(provisionElement)

Runtime.run(provisionPage, {
  flags: Effect.map(ProvisionExtra, ({ value }) => ({ initialValue: value })),
})
Runtime.hydrate(provisionPage)
provisionElementHandle.ports.valueChanged.send('updated')
provisionElementHandle.ports.valueRead.subscribe(value => {
  const count: number = value
  void count
})

type EmittedPagePortsAreExact = Expect<
  Equal<typeof provisionPage.ports, typeof provisionPorts>
>
type EmittedElementPortsAreExact = Expect<
  Equal<typeof provisionElement.ports, typeof provisionPorts>
>

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
  EmittedPagePortsAreExact,
  EmittedElementPortsAreExact,
]
