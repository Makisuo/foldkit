import { Match, Option, Record, Schema, pipe } from 'effect'
import { Calendar, Update } from 'foldkit'
import { UrlRequest } from 'foldkit/navigation'
import { modifyFields } from 'foldkit/struct'
import { Url, toString as urlToString } from 'foldkit/url'
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
} from './childBindings'
import * as Command from './command'
import { Application } from './definition'
import { Deployment, isTelemetryEnabled } from './deployment'
import { findActiveSectionKey } from './docsNav'
import { Message, ResolvedTheme, ThemePreference } from './message'
import { Model } from './model'
import { ApiReference, Example } from './page'
import {
  ApplicationRoute,
  isPlaygroundRoute,
  urlToApplicationRoute,
} from './route'
import { GroupKey, SidebarGroups, SidebarState } from './sidebarStorage'
import { ApplyTheme, resolveTheme } from './theme'

export type { Message } from './message'
export { Model } from './model'
export type { TableOfContentsEntry } from './tableOfContentsEntry'
export { type ThemePreference, type ResolvedTheme } from './message'

// FLAGS

export const Flags = Schema.Struct({
  currentYear: Schema.Number,
  today: Calendar.CalendarDate,
  deployment: Deployment,
  maybeApiData: Schema.Option(ApiReference.ApiData),
  maybeExampleSources: Schema.Option(Example.ExampleSources),
})
type Flags = typeof Flags.Type

const isGroupOpenOnBoot = (
  maybeSidebarState: Option.Option<SidebarState>,
  maybeActiveSectionKey: Option.Option<GroupKey>,
  key: GroupKey,
): boolean => {
  const isActiveSection = Option.exists(
    maybeActiveSectionKey,
    activeSectionKey => activeSectionKey === key,
  )
  if (isActiveSection) {
    return true
  }
  return Option.match(maybeSidebarState, {
    onNone: () => false,
    onSome: ({ open }) => open[key] ?? false,
  })
}

const initialSidebarGroups = (
  maybeSidebarState: Option.Option<SidebarState>,
  maybeActiveSectionKey: Option.Option<GroupKey>,
): SidebarGroups => {
  const sidebarGroups: globalThis.Record<GroupKey, boolean> =
    Record.fromIterableWith(GroupKey.literals, key => [
      key,
      isGroupOpenOnBoot(maybeSidebarState, maybeActiveSectionKey, key),
    ])
  return sidebarGroups
}

export const init = (flags: Flags, url: Url) => {
  const maybeThemePreference = Option.none<ThemePreference>()
  const systemTheme: ResolvedTheme = 'Light'
  const resolvedTheme = systemTheme

  const initialRoute = urlToApplicationRoute(url)
  const maybeHomeInit = pipe(
    initialRoute,
    Option.liftPredicate(ApplicationRoute.guards.Home),
    Option.map(() => home.init()),
  )
  const maybeHome = Option.map(maybeHomeInit, homeInit => homeInit.model)
  const homeCommands = Option.match(maybeHomeInit, {
    onNone: () => [],
    onSome: homeInit => homeInit.commands ?? [],
  })

  const maybeInitialExampleSlug = pipe(
    initialRoute,
    Option.liftPredicate(route => route._tag === 'ExampleDetail'),
    Option.map(({ exampleSlug }) => exampleSlug),
  )
  const searchInit = search.init()
  const exampleDetailInit = exampleDetail.init()
  const uiPagesInit = uiPages.init(flags.today)
  const maybePlaygroundInit = pipe(
    initialRoute,
    Option.liftPredicate(isPlaygroundRoute),
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

  const maybeInitialActiveSectionKey = findActiveSectionKey(
    initialRoute._tag,
    maybeInitialExampleSlug,
  )

  const analyticsCommands = isTelemetryEnabled(flags.deployment)
    ? [Command.InjectAnalytics(), Command.InjectSpeedInsights()]
    : []

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
      maybeInitialActiveSectionKey,
    ),
    coreBlockPage: coreBlockPageInit.model,
    themeMenu: themeMenuInit.model,
    maybeThemePreference,
    systemTheme,
    resolvedTheme,
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

const isPathnameEqual = (a: Url, b: Url): boolean => a.pathname === b.pathname

const reconcileHomePresence = (route: ApplicationRoute) => (model: Model) =>
  Match.value(route).pipe(
    Match.tag('Home', () => {
      if (Option.isSome(model.maybeHome)) {
        return { model }
      }

      const homeInit = home.init()
      const nextModel = modifyFields(model, {
        maybeHome: () => Option.some(homeInit.model),
      })

      return homeInit.commands === undefined
        ? { model: nextModel }
        : { model: nextModel, commands: homeInit.commands }
    }),
    Match.orElse(() => ({
      model: modifyFields(model, { maybeHome: () => Option.none() }),
    })),
  )

export const update = Application.update((model, message) =>
  Message.match(message, {
    ClickedLink: ({ request }) =>
      UrlRequest.match(request, {
        Internal: ({ url }) => {
          // NOTE: WebContainer requires `window.crossOriginIsolated`,
          // which only becomes true when the document is loaded with
          // the COEP/COOP response headers set in deploy-website.yml
          // and vite.config.ts. SPA navigation reuses the previous
          // page's document (no headers), so we navigate to playground
          // URLs by loading a fresh document instead.
          if (isPlaygroundRoute(urlToApplicationRoute(url))) {
            return {
              model,
              commands: [Command.LoadExternal({ href: urlToString(url) })],
            }
          }
          return {
            model,
            commands: [Command.NavigateInternal({ url: urlToString(url) })],
          }
        },
        External: ({ href }) => ({
          model,
          commands: [Command.LoadExternal({ href })],
        }),
      }),

    ChangedUrl: ({ url }) => {
      const nextRoute = urlToApplicationRoute(url)

      const maybeNextExampleSlug = pipe(
        nextRoute,
        Option.liftPredicate(route => route._tag === 'ExampleDetail'),
        Option.map(({ exampleSlug }) => exampleSlug),
      )

      const maybeNextActiveSectionKey = findActiveSectionKey(
        nextRoute._tag,
        maybeNextExampleSlug,
      )

      const nextSidebarGroups = Option.match(maybeNextActiveSectionKey, {
        onNone: () => model.sidebarGroups,
        onSome: activeSectionKey =>
          model.sidebarGroups[activeSectionKey]
            ? model.sidebarGroups
            : Record.set(model.sidebarGroups, activeSectionKey, true),
      })

      const routeSteps = Match.value(nextRoute).pipe(
        Match.tag('ApiModule', () => [apiReference.informRouteChanged()]),
        Match.tag('ExampleDetail', ({ exampleSlug }) => [
          exampleDetail.informRouteChanged(exampleSlug),
        ]),
        Match.orElse(() => []),
      )

      const maybeScrollSidebar = Option.liftPredicate(
        Command.ScrollSidebarActiveLinkIntoView(),
        () => !isPathnameEqual(model.url, url),
      )

      const maybeScrollToTop = Option.liftPredicate(
        Command.ScrollToTop(),
        () => !isPathnameEqual(model.url, url),
      )

      const maybeNextPlaygroundInit = pipe(
        nextRoute,
        Option.liftPredicate(isPlaygroundRoute),
        Option.map(({ exampleSlug }) =>
          playground.init(exampleSlug, model.maybeIsPlaygroundSupported),
        ),
      )
      const nextPlayground = Option.map(
        maybeNextPlaygroundInit,
        playgroundInit => playgroundInit.model,
      )
      const maybeNextPlaygroundCommands = Option.flatMap(
        maybeNextPlaygroundInit,
        playgroundInit => Option.fromNullishOr(playgroundInit.commands),
      )

      const writeRouteFields = (model: Model) => {
        const nextModel = modifyFields(model, {
          route: () => nextRoute,
          url: () => url,
          playground: () => nextPlayground,
          sidebarGroups: () => nextSidebarGroups,
        })

        return Option.match(maybeNextPlaygroundCommands, {
          onNone: () => ({ model: nextModel }),
          onSome: commands => ({ model: nextModel, commands }),
        })
      }

      const scrollToRoute = (model: Model) => ({
        model,
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
        reconcileHomePresence(nextRoute),
        mobileMenuDialog.close(),
        themeMenu.close(),
        search.informRouteChanged(),
        ...routeSteps,
        scrollToRoute,
      ])
    },

    ClickedCopyLink: ({ hash }) => ({
      model,
      commands: [
        Command.CopyLink({
          url: urlToString(
            modifyFields(model.url, { hash: () => Option.some(hash) }),
          ),
        }),
      ],
    }),

    ClickedOpenMobileMenu: () =>
      Update.combine(model, [
        mobileMenuDialog.open(),
        stepModel => ({
          model: stepModel,
          commands: [Command.ScrollMobileMenuActiveLinkIntoView()],
        }),
      ]),

    ClickedOpenSearch: () => search.open()(model),

    PressedSearchShortcut: () => search.open()(model),

    GotMobileMenuDialogMessage: ({ message }) =>
      mobileMenuDialog.fold(model, message),

    GotSnippetCopyMessage: ({ message }) => snippetCopy.fold(model, message),

    GotSnippetDisclosureMessage: ({ message }) =>
      snippetDisclosure.fold(model, message),

    GotCoreBlockPageMessage: ({ message }) =>
      coreBlockPage.fold(model, message),

    ToggledMobileTableOfContents: ({ isOpen }) => ({
      model: modifyFields(model, { isMobileTableOfContentsOpen: () => isOpen }),
    }),

    ClickedMobileTableOfContentsLink: ({ sectionId }) => ({
      model: modifyFields(model, {
        isMobileTableOfContentsOpen: () => false,
        activeSection: () => Option.some(sectionId),
      }),
    }),

    ChangedActiveSection: ({ sectionId }) => ({
      model: modifyFields(model, {
        activeSection: () => Option.some(sectionId),
      }),
    }),

    ChangedViewportWidth: ({ isNarrow }) => ({
      model: modifyFields(model, { isNarrowViewport: () => isNarrow }),
    }),

    CompletedLoadBrowserEnvironment: ({
      maybeThemePreference,
      maybeSidebarState,
      systemTheme,
      isPlaygroundSupported,
      currentYear,
      today,
    }) => {
      const themePreference: ThemePreference = Option.getOrElse(
        maybeThemePreference,
        () => 'System',
      )
      const resolvedTheme = resolveTheme(themePreference, systemTheme)
      const maybeExampleSlug = pipe(
        model.route,
        Option.liftPredicate(route => route._tag === 'ExampleDetail'),
        Option.map(({ exampleSlug }) => exampleSlug),
      )
      const maybeActiveSectionKey = findActiveSectionKey(
        model.route._tag,
        maybeExampleSlug,
      )
      const applyBrowserEnvironment = (stepModel: Model) => ({
        model: modifyFields(stepModel, {
          currentYear: () => currentYear,
          maybeIsPlaygroundSupported: () => Option.some(isPlaygroundSupported),
          sidebarGroups: () =>
            initialSidebarGroups(maybeSidebarState, maybeActiveSectionKey),
          maybeThemePreference: () => Option.some(themePreference),
          systemTheme: () => systemTheme,
          resolvedTheme: () => resolvedTheme,
        }),
        commands: [ApplyTheme({ theme: resolvedTheme })],
      })

      return Update.combine(model, [
        applyBrowserEnvironment,
        playground.informSupport(isPlaygroundSupported),
        stepModel => {
          const uiPagesInit = uiPages.init(today)
          const nextModel = modifyFields(stepModel, {
            uiPages: () => uiPagesInit.model,
          })

          return uiPagesInit.commands === undefined
            ? { model: nextModel }
            : { model: nextModel, commands: uiPagesInit.commands }
        },
      ])
    },

    GotThemeMenuMessage: ({ message }) => themeMenu.fold(model, message),

    GotHomeMessage: ({ message }) => home.fold(model, message),

    ChangedSystemTheme: ({ theme }) => {
      const resolvedTheme = resolveTheme(
        Option.getOrElse(model.maybeThemePreference, () => 'System'),
        theme,
      )

      return {
        model: modifyFields(model, {
          systemTheme: () => theme,
          resolvedTheme: () => resolvedTheme,
        }),
        commands: [ApplyTheme({ theme: resolvedTheme })],
      }
    },

    GotComingFromReactMessage: ({ message }) =>
      comingFromReact.fold(model, message),

    GotApiReferenceMessage: ({ message }) => apiReference.fold(model, message),

    GotUiPageMessage: ({ message }) => uiPages.fold(model, message),

    ToggledSidebarGroup: ({ key, isOpen }) => {
      const nextModel = modifyFields(model, {
        sidebarGroups: Record.set(key, isOpen),
      })
      return { model: nextModel, commands: [saveSidebarState(nextModel)] }
    },

    GotExampleDetailMessage: ({ message }) =>
      exampleDetail.fold(model, message),

    GotSearchMessage: ({ message }) => search.fold(model, message),

    GotPlaygroundMessage: ({ message }) => playground.fold(model, message),
    CompletedNavigateInternal: () => ({ model }),
    CompletedLoadExternal: () => ({ model }),
    CompletedLoadPlayground: () => ({ model }),
    CompletedInjectAnalytics: () => ({ model }),
    CompletedInjectSpeedInsights: () => ({ model }),
    CompletedScrollToTop: () => ({ model }),
    CompletedScrollToAnchor: () => ({ model }),
    CompletedScrollSidebarActiveLinkIntoView: () => ({ model }),
    CompletedScrollMobileMenuActiveLinkIntoView: () => ({ model }),
    CompletedApplyTheme: () => ({ model }),
    CompletedSaveThemePreference: () => ({ model }),
    CompletedSaveSidebarState: () => ({ model }),
    SucceededCopyLink: () => ({ model }),
    FailedCopyLink: () => ({ model }),
  }),
)

const modelToSidebarState = (model: Model): SidebarState => ({
  open: model.sidebarGroups,
})

const saveSidebarState = (model: Model) =>
  Command.SaveSidebarState({ state: modelToSidebarState(model) })
