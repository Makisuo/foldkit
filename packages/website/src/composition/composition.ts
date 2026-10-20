import { Option, pipe } from 'effect'
import { type Block } from 'foldkit'
import { modifyFields } from 'foldkit/struct'

import { DialogBlock } from '@foldkit/ui'

import { ApplicationDefinition } from '../definition'
import {
  ApiReferenceBlock,
  BlockPageBlock,
  ComingFromReactBlock,
  ExampleDetailBlock,
  PlaygroundBlock,
  UiBlock,
} from '../page'
import { ApplicationRoute, maybeExampleSlugForRoute } from '../route'
import { SearchBlock } from '../search'
import { SnippetCopyBlock } from '../snippetCopy'
import { SnippetDisclosureBlock } from '../snippetDisclosure'
import { ApplyTheme, SaveThemePreference, resolveTheme } from '../theme'
import { type ThemePreference } from '../themePreference'
import { ThemeMenu } from '../view'
import { HomeBinding } from './home'

export const SearchBinding = ApplicationDefinition.bindChild(SearchBlock, {
  field: 'search',
})

export const SnippetCopyBinding = ApplicationDefinition.bindChild(
  SnippetCopyBlock,
  {
    field: 'snippetCopy',
  },
)

export const SnippetDisclosureBinding = ApplicationDefinition.bindChild(
  SnippetDisclosureBlock,
  {
    field: 'snippetDisclosure',
  },
)

export const ExampleDetailBinding = ApplicationDefinition.bindChild(
  ExampleDetailBlock,
  {
    field: 'exampleDetail',
    init: {
      contextToArgs: ({ route, maybeExampleSources }) => [
        maybeExampleSlugForRoute(route),
        maybeExampleSources,
      ],
    },
  },
)

export const PlaygroundBinding = ApplicationDefinition.bindChild(
  PlaygroundBlock,
  {
    field: 'playground',
    init: {
      contextToArgs: ({ route }) =>
        pipe(
          route,
          Option.liftPredicate(ApplicationRoute.guards.Playground),
          Option.map(route => [route.exampleSlug]),
        ),
    },
  },
)

export const UiPagesBinding = ApplicationDefinition.bindChild(UiBlock, {
  field: 'uiPages',
  init: { contextToArgs: ({ today }) => [today] },
})

export const ApiReferenceBinding = ApplicationDefinition.bindChild(
  ApiReferenceBlock,
  {
    field: 'apiReference',
    init: { contextToArgs: ({ maybeApiData }) => [maybeApiData] },
  },
)

export const ComingFromReactBinding = ApplicationDefinition.bindChild(
  ComingFromReactBlock,
  {
    field: 'comingFromReact',
  },
)

export const CoreBlockPageBinding = ApplicationDefinition.bindChild(
  BlockPageBlock,
  {
    field: 'coreBlockPage',
  },
)

export const MobileMenuDialogBinding = ApplicationDefinition.bindChild(
  DialogBlock,
  {
    field: 'mobileMenuDialog',
    init: { contextToArgs: () => [{ id: 'mobile-menu' }] },
  },
).withOutMessagePolicy({
  fold: ApplicationDefinition.makeOutMessageFold(DialogBlock, {
    Opened: ApplicationDefinition.stepNoop,
    Closed: ApplicationDefinition.stepNoop,
    CompletedClose: ApplicationDefinition.stepNoop,
  }),
})

const applyThemePreference = (preference: typeof ThemePreference.Type) =>
  ApplicationDefinition.step(model => {
    const resolvedTheme = resolveTheme(preference, model.systemTheme)

    return {
      model: modifyFields(model, {
        maybeThemePreference: () => Option.some(preference),
        resolvedTheme: () => resolvedTheme,
      }),
      commands: [
        ApplyTheme({ theme: resolvedTheme }),
        SaveThemePreference({ preference }),
      ],
    }
  })

export const ThemeMenuBinding = ApplicationDefinition.bindChild(
  ThemeMenu.ThemeMenuBlock,
  {
    field: 'themeMenu',
    init: { contextToArgs: () => [{ id: 'theme-menu' }] },
  },
).withOutMessagePolicy({
  fold: ApplicationDefinition.makeOutMessageFold(ThemeMenu.ThemeMenuBlock, {
    Selected: ({ value }) => applyThemePreference(value),
    Closed: ApplicationDefinition.stepNoop,
  }),
})

export const ApplicationComposition = ApplicationDefinition.makeComposition({
  bindings: [
    ApiReferenceBinding,
    ComingFromReactBinding,
    CoreBlockPageBinding,
    ExampleDetailBinding,
    HomeBinding,
    MobileMenuDialogBinding,
    PlaygroundBinding,
    SearchBinding,
    SnippetCopyBinding,
    SnippetDisclosureBinding,
    ThemeMenuBinding,
    UiPagesBinding,
  ],
})
export type ApplicationViewBuilder = Block.ViewBuilderFor<
  typeof ApplicationComposition
>
