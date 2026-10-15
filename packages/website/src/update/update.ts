import { Option, Record } from 'effect'
import { Update } from 'foldkit'
import { UrlRequest } from 'foldkit/navigation'
import { modifyFields } from 'foldkit/struct'
import { toString as urlToString } from 'foldkit/url'

import * as Command from '../command'
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
} from '../composition'
import { Application } from '../definition'
import { Message } from '../message'
import { isPlaygroundRoute, urlToApplicationRoute } from '../route'
import { ApplyTheme, resolveTheme } from '../theme'
import { handleCompletedLoadBrowserEnvironment } from './browserEnvironment'
import { handleChangedUrl } from './changedUrl'

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

    ChangedUrl: ({ url }) => handleChangedUrl(model, url),

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

    CompletedLoadBrowserEnvironment: environment =>
      handleCompletedLoadBrowserEnvironment(model, environment),

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

      return {
        model: nextModel,
        commands: [
          Command.SaveSidebarState({
            state: { open: nextModel.sidebarGroups },
          }),
        ],
      }
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
