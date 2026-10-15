import { Option } from 'effect'
import { Update } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import { playground, uiPages } from '../composition'
import {
  type Message,
  type ResolvedTheme,
  type ThemePreference,
} from '../message'
import { type Model } from '../model'
import { maybeActiveSectionKeyForRoute } from '../routePolicy'
import { initialSidebarGroups } from '../sidebarStorage'
import { ApplyTheme, resolveTheme } from '../theme'

type BrowserEnvironment = typeof Message.CompletedLoadBrowserEnvironment.Type

export const handleCompletedLoadBrowserEnvironment = (
  model: Model,
  {
    maybeThemePreference,
    maybeSidebarState,
    systemTheme,
    isPlaygroundSupported,
    currentYear,
    today,
  }: BrowserEnvironment,
) => {
  const themePreference: ThemePreference = Option.getOrElse(
    maybeThemePreference,
    () => 'System',
  )
  const resolvedTheme: ResolvedTheme = resolveTheme(
    themePreference,
    systemTheme,
  )

  const applyBrowserEnvironment = (stepModel: Model) => ({
    model: modifyFields(stepModel, {
      currentYear: () => currentYear,
      maybeIsPlaygroundSupported: () => Option.some(isPlaygroundSupported),
      sidebarGroups: () =>
        initialSidebarGroups(
          maybeSidebarState,
          maybeActiveSectionKeyForRoute(model.route),
        ),
      maybeThemePreference: () => Option.some(themePreference),
      systemTheme: () => systemTheme,
      resolvedTheme: () => resolvedTheme,
    }),
    commands: [ApplyTheme({ theme: resolvedTheme })],
  })

  const initializeUiPages = (stepModel: Model) => {
    const uiPagesInit = uiPages.init(today)
    const nextModel = modifyFields(stepModel, {
      uiPages: () => uiPagesInit.model,
    })

    return uiPagesInit.commands === undefined
      ? { model: nextModel }
      : { model: nextModel, commands: uiPagesInit.commands }
  }

  return Update.combine(model, [
    applyBrowserEnvironment,
    playground.informSupport(isPlaygroundSupported),
    initializeUiPages,
  ])
}
