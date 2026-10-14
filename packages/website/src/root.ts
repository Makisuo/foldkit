import {
  Clock,
  DateTime,
  Effect,
  Layer,
  Match,
  Option,
  Record,
  Schema,
  pipe,
} from 'effect'
import { Calendar, Dom, Update } from 'foldkit'
import { UrlRequest, load, pushUrl } from 'foldkit/navigation'
import { modifyFields } from 'foldkit/struct'
import { Url, toString as urlToString } from 'foldkit/url'
import { githubStarCount } from 'virtual:landing-data'

import { inject } from '@vercel/analytics'
import * as SpeedInsights from '@vercel/speed-insights'

import { DARK_COLOR_SCHEME_QUERY } from './colorScheme'
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
} from './connection'
import { ApplicationDefinition } from './definition'
import { Deployment, isTelemetryEnabled } from './deployment'
import {
  DOCS_SIDEBAR_NAV_ID,
  MOBILE_MENU_NAV_ID,
  findActiveSectionKey,
} from './docsNav'
import { Message, ResolvedTheme, ThemePreference } from './message'
import { Model } from './model'
import { ApiReference, Example } from './page'
import {
  ApplicationRoute,
  isPlaygroundRoute,
  urlToApplicationRoute,
} from './route'
import {
  GroupKey,
  SIDEBAR_STORAGE_KEY,
  SidebarGroups,
  SidebarState,
  SidebarStateJsonString,
} from './sidebarStorage'
import { LocalStorage, SessionStorage } from './storage'
import {
  ApplyTheme,
  SaveThemePreference,
  THEME_STORAGE_KEY,
  resolveTheme,
} from './theme'

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

// NOTE: Playground navigation loads a fresh document with COOP/COEP headers.
// Firefox can boot this standalone WebContainer embed, but its iframe preview
// stays blank and opening the URL needs a project connection route Foldkit lacks.
const detectPlaygroundSupport = (): boolean =>
  window.crossOriginIsolated === true &&
  typeof SharedArrayBuffer !== 'undefined' &&
  !navigator.userAgent.includes('Firefox/')

const loadBrowserEnvironment = Effect.gen(function* () {
  const themePreference: Option.Option<ThemePreference> = yield* Effect.gen(
    function* () {
      const store = yield* LocalStorage
      const json = yield* Effect.fromOption(
        Option.fromNullishOr(yield* store.get(THEME_STORAGE_KEY)),
      )
      const theme = yield* Schema.decodeEffect(
        Schema.fromJsonString(ThemePreference),
      )(json)
      return Option.some(theme)
    },
  ).pipe(Effect.catch(() => Effect.succeed(Option.none<ThemePreference>())))

  const maybeSidebarState: Option.Option<SidebarState> = yield* Effect.gen(
    function* () {
      const store = yield* SessionStorage
      const json = yield* Effect.fromOption(
        Option.fromNullishOr(yield* store.get(SIDEBAR_STORAGE_KEY)),
      )
      const state = yield* Schema.decodeEffect(SidebarStateJsonString)(json)

      return Option.some(state)
    },
  ).pipe(Effect.catch(() => Effect.succeed(Option.none<SidebarState>())))

  const systemTheme: ResolvedTheme = yield* Effect.sync(() =>
    window.matchMedia(DARK_COLOR_SCHEME_QUERY).matches ? 'Dark' : 'Light',
  )

  const isPlaygroundSupported = yield* Effect.sync(detectPlaygroundSupport)

  const currentYear = yield* DateTime.now.pipe(
    Effect.map(DateTime.getPartUtc('year')),
  )

  const today = yield* Calendar.today.local

  return Message.CompletedLoadBrowserEnvironment({
    maybeThemePreference: themePreference,
    maybeSidebarState,
    systemTheme,
    isPlaygroundSupported,
    currentYear,
    today,
  })
})

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
    Option.liftPredicate(route => route._tag === 'Home'),
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
    ? [InjectAnalytics(), InjectSpeedInsights()]
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
      LoadBrowserEnvironment(),
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
      ScrollSidebarActiveLinkIntoView(),
      ...Option.match(url.hash, {
        onNone: () => [],
        onSome: hash => [ScrollToAnchor({ hash })],
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

export const update = ApplicationDefinition.update((model, message) =>
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
              commands: [LoadExternal({ href: urlToString(url) })],
            }
          }
          return {
            model,
            commands: [NavigateInternal({ url: urlToString(url) })],
          }
        },
        External: ({ href }) => ({
          model,
          commands: [LoadExternal({ href })],
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
        ScrollSidebarActiveLinkIntoView(),
        () => !isPathnameEqual(model.url, url),
      )

      const maybeScrollToTop = Option.liftPredicate(
        ScrollToTop(),
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
            onSome: hash => [ScrollToAnchor({ hash })],
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
        CopyLink({
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
          commands: [ScrollMobileMenuActiveLinkIntoView()],
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
        (stepModel: Model) => {
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

const InjectAnalytics = ApplicationDefinition.command('InjectAnalytics', {
  messages: [Message.CompletedInjectAnalytics],
  handler: function* () {
    return () =>
      Effect.sync(() => inject()).pipe(
        Effect.as(Message.CompletedInjectAnalytics()),
      )
  },
})

const LoadBrowserEnvironment = ApplicationDefinition.command(
  'LoadBrowserEnvironment',
  {
    messages: [Message.CompletedLoadBrowserEnvironment],
    handler: function* () {
      const localStorage = yield* LocalStorage
      const sessionStorage = yield* SessionStorage
      const clock = yield* Clock.Clock

      return () =>
        loadBrowserEnvironment.pipe(
          Effect.provideService(LocalStorage, localStorage),
          Effect.provideService(SessionStorage, sessionStorage),
          Effect.provideService(Clock.Clock, clock),
        )
    },
  },
)

const InjectSpeedInsights = ApplicationDefinition.command(
  'InjectSpeedInsights',
  {
    messages: [Message.CompletedInjectSpeedInsights],
    handler: function* () {
      return () =>
        Effect.sync(() => SpeedInsights.injectSpeedInsights()).pipe(
          Effect.as(Message.CompletedInjectSpeedInsights()),
        )
    },
  },
)

const CopyLink = ApplicationDefinition.command('CopyLink', {
  args: { url: Schema.String },
  messages: [Message.SucceededCopyLink, Message.FailedCopyLink],
  handler: function* () {
    return ({ url }) =>
      Effect.tryPromise({
        try: () => navigator.clipboard.writeText(url),
        catch: () => new Error('Failed to copy link to clipboard'),
      }).pipe(
        Effect.as(Message.SucceededCopyLink()),
        Effect.catch(() => Effect.succeed(Message.FailedCopyLink())),
      )
  },
})

export const ScrollToTop = ApplicationDefinition.command('ScrollToTop', {
  messages: [Message.CompletedScrollToTop],
  handler: function* () {
    return () =>
      Effect.sync(() => {
        window.scrollTo({ top: 0, behavior: 'instant' })
        return Message.CompletedScrollToTop()
      })
  },
})

const ScrollToAnchor = ApplicationDefinition.command('ScrollToAnchor', {
  args: { hash: Schema.String },
  messages: [Message.CompletedScrollToAnchor],
  handler: function* () {
    return ({ hash }) =>
      Effect.gen(function* () {
        const target = `#${CSS.escape(hash)}`
        yield* Dom.scrollIntoViewAfterPaint(target, { block: 'start' })
        yield* Dom.focus(target, { preventScroll: true, makeFocusable: true })
      }).pipe(Effect.ignore, Effect.as(Message.CompletedScrollToAnchor()))
  },
})

export const ScrollSidebarActiveLinkIntoView = ApplicationDefinition.command(
  'ScrollSidebarActiveLinkIntoView',
  {
    messages: [Message.CompletedScrollSidebarActiveLinkIntoView],
    handler: function* () {
      return () =>
        Dom.scrollIntoViewIfNotVisible(
          `#${DOCS_SIDEBAR_NAV_ID} [aria-current="page"]`,
        ).pipe(
          Effect.ignore,
          Effect.as(Message.CompletedScrollSidebarActiveLinkIntoView()),
        )
    },
  },
)

const MOBILE_MENU_ACTIVE_LINK = `#${MOBILE_MENU_NAV_ID} [aria-current="page"]`

const ScrollMobileMenuActiveLinkIntoView = ApplicationDefinition.command(
  'ScrollMobileMenuActiveLinkIntoView',
  {
    messages: [Message.CompletedScrollMobileMenuActiveLinkIntoView],
    handler: function* () {
      return () =>
        Dom.scrollIntoViewIfNotVisible(MOBILE_MENU_ACTIVE_LINK, {
          when: 'Commit',
        }).pipe(
          Effect.ignore,
          Effect.as(Message.CompletedScrollMobileMenuActiveLinkIntoView()),
        )
    },
  },
)

const SaveSidebarState = ApplicationDefinition.command('SaveSidebarState', {
  args: { state: SidebarState },
  messages: [Message.CompletedSaveSidebarState],
  handler: function* () {
    const store = yield* SessionStorage

    return ({ state }) =>
      Effect.gen(function* () {
        const json = yield* Schema.encodeEffect(SidebarStateJsonString)(state)
        yield* store.set(SIDEBAR_STORAGE_KEY, json)
        return Message.CompletedSaveSidebarState()
      }).pipe(
        Effect.catch(() => Effect.succeed(Message.CompletedSaveSidebarState())),
      )
  },
})

const modelToSidebarState = (model: Model): SidebarState => ({
  open: model.sidebarGroups,
})

const saveSidebarState = (model: Model) =>
  SaveSidebarState({ state: modelToSidebarState(model) })

const NavigateInternal = ApplicationDefinition.command('NavigateInternal', {
  args: { url: Schema.String },
  messages: [Message.CompletedNavigateInternal],
  handler: function* () {
    return ({ url }) =>
      pushUrl(url).pipe(Effect.as(Message.CompletedNavigateInternal()))
  },
})

const LoadExternal = ApplicationDefinition.command('LoadExternal', {
  args: { href: Schema.String },
  messages: [Message.CompletedLoadExternal],
  handler: function* () {
    return ({ href }) =>
      load(href).pipe(Effect.as(Message.CompletedLoadExternal()))
  },
})

export const EffectsLayer = Layer.mergeAll(
  InjectAnalytics.layer,
  LoadBrowserEnvironment.layer,
  InjectSpeedInsights.layer,
  ScrollToTop.layer,
  ScrollToAnchor.layer,
  ScrollSidebarActiveLinkIntoView.layer,
  ScrollMobileMenuActiveLinkIntoView.layer,
  NavigateInternal.layer,
  LoadExternal.layer,
  ApplyTheme.layer,
  SaveThemePreference.layer,
  SaveSidebarState.layer,
  CopyLink.layer,
)
