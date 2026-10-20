import { Option } from 'effect'
import { Update } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import { PlaygroundBinding, UiPagesBinding } from '../composition'
import { ApplicationDefinition } from '../definition'
import { findActiveSectionKeyForRoute } from '../docsNav'
import {
  type Message,
  type ResolvedTheme,
  type ThemePreference,
} from '../message'
import { initialSidebarGroups } from '../sidebarStorage'
import { ApplyTheme, resolveTheme } from '../theme'

export const handleCompletedLoadBrowserEnvironment = ApplicationDefinition.step(
  (
    _,
    {
      maybeThemePreference,
      maybeSidebarState,
      systemTheme,
      isPlaygroundSupported,
      currentYear,
      today,
    }: typeof Message.CompletedLoadBrowserEnvironment.Type,
  ) => {
    const themePreference: typeof ThemePreference.Type = Option.getOrElse(
      maybeThemePreference,
      () => 'System',
    )
    const resolvedTheme: typeof ResolvedTheme.Type = resolveTheme(
      themePreference,
      systemTheme,
    )

    const applyBrowserEnvironment = ApplicationDefinition.step(stepModel => ({
      model: modifyFields(stepModel, {
        currentYear: () => currentYear,
        maybeIsPlaygroundSupported: () => Option.some(isPlaygroundSupported),
        sidebarGroups: () =>
          initialSidebarGroups(
            maybeSidebarState,
            findActiveSectionKeyForRoute(stepModel.route),
          ),
        maybeThemePreference: () => Option.some(themePreference),
        systemTheme: () => systemTheme,
        resolvedTheme: () => resolvedTheme,
      }),
      commands: [ApplyTheme({ theme: resolvedTheme })],
    }))

    const initUiPages = ApplicationDefinition.step(stepModel => {
      return UiPagesBinding.init({
        args: [today],
        toParentModel: uiPages =>
          modifyFields(stepModel, { uiPages: () => uiPages }),
      })
    })

    return Update.combine([
      applyBrowserEnvironment,
      PlaygroundBinding.informSupport({ isSupported: isPlaygroundSupported }),
      initUiPages,
    ])
  },
)
