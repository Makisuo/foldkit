import { Option, Record } from 'effect'
import { Update } from 'foldkit'
import { Transition } from 'foldkit/route'
import { modifyFields } from 'foldkit/struct'
import { type Url } from 'foldkit/url'

import * as Command from '../command'
import {
  MobileMenuDialogBinding,
  SearchBinding,
  ThemeMenuBinding,
} from '../composition'
import { type Model } from '../model'
import { urlToApplicationRoute } from '../route'
import {
  maybeActiveSectionKeyForRoute,
  reconcileRoutedChildModels,
  routeDataLoadingSteps,
} from '../routePolicy'

const isPathnameEqual = (left: Url, right: Url): boolean =>
  left.pathname === right.pathname

export const handleChangedUrl = (model: Model, url: Url) => {
  const nextRoute = urlToApplicationRoute(url)
  const transition = Transition.make(model.route, nextRoute)
  const maybeNextActiveSectionKey = maybeActiveSectionKeyForRoute(nextRoute)

  const nextSidebarGroups = Option.match(maybeNextActiveSectionKey, {
    onNone: () => model.sidebarGroups,
    onSome: activeSectionKey =>
      model.sidebarGroups[activeSectionKey]
        ? model.sidebarGroups
        : Record.set(model.sidebarGroups, activeSectionKey, true),
  })

  const writeRouteFields = (stepModel: Model) => ({
    model: modifyFields(stepModel, {
      route: () => nextRoute,
      url: () => url,
      sidebarGroups: () => nextSidebarGroups,
    }),
  })

  const isChangingPathname = !isPathnameEqual(model.url, url)
  const maybeScrollSidebar = Option.liftPredicate(
    Command.ScrollSidebarActiveLinkIntoView(),
    () => isChangingPathname,
  )
  const maybeScrollToTop = Option.liftPredicate(
    Command.ScrollToTop(),
    () => isChangingPathname,
  )

  const scrollToRoute = (stepModel: Model) => ({
    model: stepModel,
    commands: [
      ...Option.match(url.hash, {
        onNone: () => Option.toArray(maybeScrollToTop),
        onSome: hash => [Command.ScrollToAnchor({ hash })],
      }),
      ...Option.toArray(maybeScrollSidebar),
    ],
  })

  return Update.combine(model, [
    writeRouteFields,
    reconcileRoutedChildModels(transition, model.maybeIsPlaygroundSupported),
    MobileMenuDialogBinding.close(),
    ThemeMenuBinding.close(),
    SearchBinding.informRouteChanged(),
    ...routeDataLoadingSteps(transition),
    scrollToRoute,
  ])
}
