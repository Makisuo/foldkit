import { Array, Option, pipe } from 'effect'
import { type Block, Command, Update } from 'foldkit'
import { describe, expect, expectTypeOf, test } from 'vitest'

import { Tabs } from '@foldkit/ui'

import { block } from './block'
import type { SourceFileTabs } from './composition'
import { LoadExampleSources, Message, init, update } from './example'
import type { ExampleSources } from './sources'

const sources: ExampleSources = {
  files: [
    {
      path: 'src/application.ts',
      highlightedHtml: '<pre><code>const application = true</code></pre>',
      rawCode: 'const application = true',
    },
  ],
}

const initialModel = () => init().model

const commandNames = (
  commands: ReturnType<
    typeof block.operations.requestLoadInitialSources
  >['commands'],
): ReadonlyArray<string> =>
  pipe(
    commands ?? [],
    Array.map(command => command.name),
  )

describe('example detail initial sources', () => {
  test('preserves the initialized Model when there is no initial slug', () => {
    const model = initialModel()
    const unseededSourcesLoad = block.operations.requestLoadInitialSources(
      model,
      Option.none(),
      Option.none(),
    )
    const seededSourcesLoad = block.operations.requestLoadInitialSources(
      model,
      Option.none(),
      Option.some(sources),
    )

    expect(unseededSourcesLoad.model).toBe(model)
    expect(unseededSourcesLoad.commands).toBeUndefined()
    expect(seededSourcesLoad.model).toBe(model)
    expect(seededSourcesLoad.commands).toBeUndefined()
  })

  test('starts loading an available unseeded example from clean child state', () => {
    const loaded = update(
      initialModel(),
      Message.SucceededLoadExampleSources({ sources }),
    )
    const focused = update(
      loaded.model,
      Message.GotSourceFileTabsMessage({
        message: Tabs.Message.FocusedTab({ index: 2 }),
      }),
    )
    const withExampleUrl = update(
      focused.model,
      Message.ChangedExampleUrl({ url: 'https://example.test' }),
    )

    const unseededSourcesLoad = block.operations.requestLoadInitialSources(
      withExampleUrl.model,
      Option.some('counter'),
      Option.none(),
    )

    expect(unseededSourcesLoad.model.currentSources._tag).toBe('Loading')
    expect(unseededSourcesLoad.model.maybeActiveSourceFilePath).toEqual(
      Option.none(),
    )
    expect(unseededSourcesLoad.model.maybeExampleUrl).toEqual(Option.none())
    expect(unseededSourcesLoad.model.sourceFileTabs).toEqual(
      Tabs.init({ id: 'source-file-tabs' }),
    )
    expect(commandNames(unseededSourcesLoad.commands)).toEqual([
      'ExampleDetail/LoadExampleSources',
    ])
    expectTypeOf<
      Update.RequirementsOf<typeof block.operations.requestLoadInitialSources>
    >().toEqualTypeOf<
      | Command.HandlerOf<typeof LoadExampleSources>
      | Block.Scoped<
          'sourceFileTabs',
          Update.RequirementsOf<typeof SourceFileTabs.update>
        >
    >()
  })

  test('shows supplied sources without fetching them', () => {
    const seededSourcesLoad = block.operations.requestLoadInitialSources(
      initialModel(),
      Option.some('counter'),
      Option.some(sources),
    )

    expect(seededSourcesLoad.model.currentSources).toEqual({
      _tag: 'Success',
      data: sources,
    })
    expect(seededSourcesLoad.model.maybeActiveSourceFilePath).toEqual(
      Option.some('src/application.ts'),
    )
    expect(seededSourcesLoad.commands).toBeUndefined()
  })

  test('leaves unavailable examples unchanged with or without supplied sources', () => {
    const model = initialModel()
    const unseededSourcesLoad = block.operations.requestLoadInitialSources(
      model,
      Option.some('livestore'),
      Option.none(),
    )
    const seededSourcesLoad = block.operations.requestLoadInitialSources(
      model,
      Option.some('livestore'),
      Option.some(sources),
    )

    expect(unseededSourcesLoad.model).toBe(model)
    expect(unseededSourcesLoad.commands).toBeUndefined()
    expect(seededSourcesLoad.model).toBe(model)
    expect(seededSourcesLoad.commands).toBeUndefined()
  })

  test('clears existing sources when routing to an unavailable example', () => {
    const loaded = block.operations.requestLoadInitialSources(
      initialModel(),
      Option.some('counter'),
      Option.some(sources),
    )
    const withExampleUrl = update(
      loaded.model,
      Message.ChangedExampleUrl({ url: 'https://example.test' }),
    )

    const routeChange = block.operations.informRouteChanged(
      withExampleUrl.model,
      { slug: 'livestore' },
    )

    expect(routeChange.model.currentSources._tag).toBe('Idle')
    expect(routeChange.model.maybeActiveSourceFilePath).toEqual(Option.none())
    expect(routeChange.model.maybeExampleUrl).toEqual(Option.none())
    expect(routeChange.model.sourceFileTabs).toEqual(
      Tabs.init({ id: 'source-file-tabs' }),
    )
    expect(routeChange.commands).toEqual([])
  })
})
