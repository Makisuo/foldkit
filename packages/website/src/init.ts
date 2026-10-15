import { Option, pipe } from 'effect'
import { Update } from 'foldkit'
import { Transition } from 'foldkit/route'
import { type Url } from 'foldkit/url'
import { githubStarCount } from 'virtual:landing-data'

import * as Command from './command'
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
} from './composition'
import { Application } from './definition'
import { type Deployment, isTelemetryEnabled } from './deployment'
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

const browserStartupCommands = (deployment: Deployment) => [
  Command.LoadBrowserEnvironment(),
  ...(isTelemetryEnabled(deployment)
    ? [Command.InjectAnalytics(), Command.InjectSpeedInsights()]
    : []),
]

const initialScrollCommands = (url: Url) => [
  Command.ScrollSidebarActiveLinkIntoView(),
  ...Option.match(url.hash, {
    onNone: () => [],
    onSome: hash => [Command.ScrollToAnchor({ hash })],
  }),
]

export const init = Application.init((flags: Flags, url: Url) => {
  const initialRoute = urlToApplicationRoute(url)
  const initialTransition = Transition.coldLoad(initialRoute)
  const maybeInitialExampleSlug = maybeExampleSlugForRoute(initialRoute)

  const maybeHomeInit = pipe(
    maybeHomeRouteToInitialize(initialTransition),
    Option.map(() => home.init()),
  )
  const searchInit = search.init()
  const exampleDetailInit = exampleDetail.init()
  const uiPagesInit = uiPages.init(flags.today)
  const maybePlaygroundInit = pipe(
    maybePlaygroundRouteToInitialize(initialTransition),
    Option.map(({ exampleSlug }) => playground.init(exampleSlug)),
  )
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
    maybeHome: Option.map(maybeHomeInit, homeInit => homeInit.model),
    isNarrowViewport: false,
    maybeIsPlaygroundSupported: Option.none(),
    playground: Option.map(
      maybePlaygroundInit,
      playgroundInit => playgroundInit.model,
    ),
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

  const initialBoot = Update.combine(initialModel, [
    apiReference.boot(flags.maybeApiData),
    exampleDetail.boot(maybeInitialExampleSlug, flags.maybeExampleSources),
  ])

  return {
    model: initialBoot.model,
    commands: [
      ...browserStartupCommands(flags.deployment),
      ...Option.match(maybeHomeInit, {
        onNone: () => [],
        onSome: homeInit => homeInit.commands ?? [],
      }),
      ...(searchInit.commands ?? []),
      ...(exampleDetailInit.commands ?? []),
      ...(uiPagesInit.commands ?? []),
      ...(coreBlockPageInit.commands ?? []),
      ...(comingFromReactInit.commands ?? []),
      ...(apiReferenceInit.commands ?? []),
      ...(mobileMenuDialogInit.commands ?? []),
      ...(themeMenuInit.commands ?? []),
      ...(initialBoot.commands ?? []),
      ...Option.match(maybePlaygroundInit, {
        onNone: () => [],
        onSome: playgroundInit => playgroundInit.commands ?? [],
      }),
      ...initialScrollCommands(url),
    ],
  }
})
