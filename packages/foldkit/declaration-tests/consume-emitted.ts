import { Effect, Layer } from 'effect'
import type { HtmlBuilderOf as ApplicationHtmlBuilderOf } from 'foldkit/application'
import * as Block from 'foldkit/block'
import * as Command from 'foldkit/command'
import type { Html } from 'foldkit/html'
import * as Runtime from 'foldkit/runtime'
import * as Update from 'foldkit/update'

import {
  Child,
  ChildEffectsLayer,
  ChildModel,
  Clock,
  type CompletedChild,
  type CompletedChoice,
  type CompletedPure,
  Direct,
  DirectModel,
  Measure,
  Parent,
  ParentComposition,
  ParentMessage,
  ParentModel,
  ProvisionDependencyLayer,
  ProvisionExtra,
  Pure,
  ReadCount,
  ReadDirectValue,
  RefinedChoice,
  type RefinedChoiceOutMessage,
  type RefreshContext,
  child,
  childInspection,
  contextualRefreshChild,
  directChild,
  applicationBuilderRender,
  applicationInputRender,
  applicationModelRender,
  ApplicationComposition,
  makePageProgram,
  makeProgram,
  makeProvisionElement,
  makeProvisionPageAwaitingDependency,
  provisionPorts,
  parentArrayRender,
  parentBuilderRender,
  parentInputRender,
  parentModelRender,
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
type CommandMessageOfReturn<Value> =
  Value extends Readonly<{
    commands?: Update.Commands<infer Message, any> | undefined
  }>
    ? Message
    : never

const childModel = ChildModel.make({ value: 1 })
const directModel = DirectModel.make({ value: 1 })
const parentModel = ParentModel.make({ child: childModel })

export const childRefresh = Child.expose.refresh(childModel)
export const directRefresh = Direct.expose.refreshDirectValue(directModel)
export const boundRefresh = child.refresh()(parentModel)
export const directBoundRefresh = directChild.refresh()(parentModel)
export const parentRefresh = Parent.expose.refreshChild(parentModel)
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
type EmittedBoundEvidenceIsExact = Expect<
  Equal<
    Update.RegistrationEvidenceOf<ReturnType<ReturnType<typeof child.refresh>>>,
    Block.BindingRequirement<'child', typeof Child>
  >
>
type EmittedAccessorMappedMessageIsExact = Expect<
  Equal<
    CommandMessageOfReturn<ReturnType<typeof child.fold>>,
    ReturnType<typeof ParentMessage.GotChildMessage>
  >
>
type EmittedDirectMappedMessageIsExact = Expect<
  Equal<
    CommandMessageOfReturn<ReturnType<typeof directChild.fold>>,
    ReturnType<typeof ParentMessage.GotChildMessage>
  >
>
type EmittedBindingStringKeysAreExact = Expect<
  Equal<
    Extract<keyof typeof child, string>,
    'placement' | 'init' | 'fold' | 'embedView' | 'refresh'
  >
>
type EmittedInspectionServicesAreExact = Expect<
  Equal<Layer.Services<typeof childInspection.EffectsLayer>, Clock>
>
type EmittedInspectionErrorIsExact = Expect<
  Equal<Layer.Error<typeof childInspection.EffectsLayer>, 'HandlerUnavailable'>
>
type EmittedInspectionMountsAreExact = Expect<
  Equal<(typeof childInspection.mounts)[number], typeof Measure>
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
type EmittedCompletedChildIsExact = Expect<Equal<CompletedChild, typeof Child>>
type EmittedCompletedPureIsExact = Expect<Equal<CompletedPure, typeof Pure>>
type EmittedCompletedChoiceIsExact = Expect<
  Equal<CompletedChoice<readonly ['One', 'Two']>, typeof RefinedChoice>
>
type EmittedCompletedChoiceInputIsExact = Expect<
  Equal<
    Parameters<CompletedChoice<readonly ['One', 'Two']>['expose']['finish']>,
    [model: typeof RefinedChoice.Model.Type, value: 'One' | 'Two']
  >
>
type EmittedCompletedChildMountsAreExact = Expect<
  Equal<CompletedChild['mounts'][number], typeof Measure>
>
type EmittedParentModelRenderParametersAreExact = Expect<
  Equal<
    Parameters<typeof parentModelRender>,
    [model: ParentModel, h: Block.HtmlBuilderOf<typeof ParentComposition>]
  >
>
type EmittedParentBuilderRenderParametersAreExact = Expect<
  Equal<
    Parameters<typeof parentBuilderRender>,
    [h: Block.HtmlBuilderOf<typeof ParentComposition>]
  >
>
type EmittedParentInputRenderParametersAreExact = Expect<
  Equal<
    Parameters<typeof parentInputRender>,
    [
      input: typeof ChildModel.Type,
      h: Block.HtmlBuilderOf<typeof ParentComposition>,
    ]
  >
>
type EmittedParentArrayRenderOutputIsHtmlArray = Expect<
  ReturnType<typeof parentArrayRender> extends ReadonlyArray<Html>
    ? true
    : false
>
type EmittedApplicationModelRenderParametersAreExact = Expect<
  Equal<
    Parameters<typeof applicationModelRender>,
    [
      model: ParentModel,
      h: ApplicationHtmlBuilderOf<typeof ApplicationComposition>,
    ]
  >
>
type EmittedApplicationBuilderRenderParametersAreExact = Expect<
  Equal<
    Parameters<typeof applicationBuilderRender>,
    [h: ApplicationHtmlBuilderOf<typeof ApplicationComposition>]
  >
>
type EmittedApplicationInputRenderParametersAreExact = Expect<
  Equal<
    Parameters<typeof applicationInputRender>,
    [
      input: typeof ChildModel.Type,
      h: ApplicationHtmlBuilderOf<typeof ApplicationComposition>,
    ]
  >
>

export type EmittedAssertions = [
  EmittedServicesAreExact,
  EmittedErrorIsExact,
  EmittedBoundRequirementsAreExact,
  EmittedBoundEvidenceIsExact,
  EmittedAccessorMappedMessageIsExact,
  EmittedDirectMappedMessageIsExact,
  EmittedBindingStringKeysAreExact,
  EmittedInspectionServicesAreExact,
  EmittedInspectionErrorIsExact,
  EmittedInspectionMountsAreExact,
  EmittedProducerParametersAreExact,
  EmittedProducerRequirementsAreExact,
  EmittedDirectRequirementsAreExact,
  EmittedRefinementIsExact,
  EmittedCompletedChildIsExact,
  EmittedCompletedPureIsExact,
  EmittedCompletedChoiceIsExact,
  EmittedCompletedChoiceInputIsExact,
  EmittedCompletedChildMountsAreExact,
  EmittedParentModelRenderParametersAreExact,
  EmittedParentBuilderRenderParametersAreExact,
  EmittedParentInputRenderParametersAreExact,
  EmittedParentArrayRenderOutputIsHtmlArray,
  EmittedApplicationModelRenderParametersAreExact,
  EmittedApplicationBuilderRenderParametersAreExact,
  EmittedApplicationInputRenderParametersAreExact,
  EmittedPagePortsAreExact,
  EmittedElementPortsAreExact,
]
