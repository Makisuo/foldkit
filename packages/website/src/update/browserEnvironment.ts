import { Option } from 'effect'
import { Update } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import { PlaygroundBinding, UiPagesBinding } from '../composition'
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
    return UiPagesBinding.init({
      args: [today],
      toParentModel: uiPages =>
        modifyFields(stepModel, { uiPages: () => uiPages }),
    })
  }

  return Update.combine(model, [
    applyBrowserEnvironment,
    PlaygroundBinding.informSupport(isPlaygroundSupported),
    initializeUiPages,
  ])
}
