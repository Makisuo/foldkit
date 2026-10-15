import { Option, pipe } from 'effect'
import { Transition } from 'foldkit/route'
import { type Url } from 'foldkit/url'
import { githubStarCount } from 'virtual:landing-data'

import {
  apiReference,
  comingFromReact,
  coreBlockPage,
  exampleDetail,
  home,
  mobileMenuDialog,
  playground,
  search,
  snippetCopy,
  snippetDisclosure,
  themeMenu,
  uiPages,
} from './application'
import * as Command from './command'
import { isTelemetryEnabled } from './deployment'
import { type Flags } from './flags'
import { type ResolvedTheme, type ThemePreference } from './message'
import { Model } from './model'
import { urlToApplicationRoute } from './route'
import {
  maybeActiveSectionKeyForRoute,
  maybeExampleSlugForRoute,
  maybeHomeRouteToInitialize,
  maybePlaygroundRouteToInitialize,
} from './routePolicy'
import { initialSidebarGroups } from './sidebarStorage'

export const init = (flags: Flags, url: Url) => {
  const initialRoute = urlToApplicationRoute(url)
  const initialTransition = Transition.coldLoad(initialRoute)
  const maybeInitialExampleSlug = maybeExampleSlugForRoute(initialRoute)

  const maybeHomeInit = pipe(
    maybeHomeRouteToInitialize(initialTransition),
    Option.map(() => home.init()),
  )
  const maybeHome = Option.map(maybeHomeInit, homeInit => homeInit.model)
  const homeCommands = Option.match(maybeHomeInit, {
    onNone: () => [],
    onSome: homeInit => homeInit.commands ?? [],
  })

  const searchInit = search.init()
  const exampleDetailInit = exampleDetail.init()
  const uiPagesInit = uiPages.init(flags.today)
  const maybePlaygroundInit = pipe(
    maybePlaygroundRouteToInitialize(initialTransition),
    Option.map(({ exampleSlug }) => playground.init(exampleSlug)),
  )
  const maybePlayground = Option.map(
    maybePlaygroundInit,
    playgroundInit => playgroundInit.model,
  )
  const playgroundCommands = Option.match(maybePlaygroundInit, {
    onNone: () => [],
    onSome: playgroundInit => playgroundInit.commands ?? [],
  })
  const snippetCopyInit = snippetCopy.init()
  const snippetDisclosureInit = snippetDisclosure.init()
  const coreBlockPageInit = coreBlockPage.init()
  const comingFromReactInit = comingFromReact.init()
  const apiReferenceInit = apiReference.init()
  const mobileMenuDialogInit = mobileMenuDialog.init({ id: 'mobile-menu' })
  const themeMenuInit = themeMenu.init({ id: 'theme-menu' })

  const maybeThemePreference = Option.none<ThemePreference>()
  const systemTheme: ResolvedTheme = 'Light'

  const initialModel = Model.make({
    route: initialRoute,
    url,
    deployment: flags.deployment,
    snippetCopy: snippetCopyInit.model,
    snippetDisclosure: snippetDisclosureInit.model,
    maybeGitHubStarCount: Option.fromNullishOr(githubStarCount),
    currentYear: flags.currentYear,
    mobileMenuDialog: mobileMenuDialogInit.model,
    isMobileTableOfContentsOpen: false,
    activeSection: Option.none(),
    maybeHome,
    isNarrowViewport: false,
    maybeIsPlaygroundSupported: Option.none(),
    playground: maybePlayground,
    sidebarGroups: initialSidebarGroups(
      Option.none(),
      maybeActiveSectionKeyForRoute(initialRoute),
    ),
    coreBlockPage: coreBlockPageInit.model,
    themeMenu: themeMenuInit.model,
    maybeThemePreference,
    systemTheme,
    resolvedTheme: systemTheme,
    uiPages: uiPagesInit.model,
    comingFromReact: comingFromReactInit.model,
    apiReference: apiReferenceInit.model,
    exampleDetail: exampleDetailInit.model,
    search: searchInit.model,
  })

  const apiReferenceBoot = apiReference.boot(flags.maybeApiData)(initialModel)

  const exampleDetailBoot = exampleDetail.boot(
    maybeInitialExampleSlug,
    flags.maybeExampleSources,
  )(apiReferenceBoot.model)

  const analyticsCommands = isTelemetryEnabled(flags.deployment)
    ? [Command.InjectAnalytics(), Command.InjectSpeedInsights()]
    : []

  return {
    model: exampleDetailBoot.model,
    commands: [
      Command.LoadBrowserEnvironment(),
      ...analyticsCommands,
      ...homeCommands,
      ...(searchInit.commands ?? []),
      ...(exampleDetailInit.commands ?? []),
      ...(uiPagesInit.commands ?? []),
      ...(coreBlockPageInit.commands ?? []),
      ...(comingFromReactInit.commands ?? []),
      ...(apiReferenceInit.commands ?? []),
      ...(mobileMenuDialogInit.commands ?? []),
      ...(themeMenuInit.commands ?? []),
      ...(apiReferenceBoot.commands ?? []),
      ...(exampleDetailBoot.commands ?? []),
      ...playgroundCommands,
      Command.ScrollSidebarActiveLinkIntoView(),
      ...Option.match(url.hash, {
        onNone: () => [],
        onSome: hash => [Command.ScrollToAnchor({ hash })],
      }),
    ],
  }
}
