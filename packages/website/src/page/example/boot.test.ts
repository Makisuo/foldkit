import { Array, Option, pipe } from 'effect'
import { Calendar, Command, Update } from 'foldkit'
import {
  Command as StoryCommand,
  model as expectModel,
  given,
  story,
} from 'foldkit/story'
import type { StorySimulation } from 'foldkit/story'
import * as Url from 'foldkit/url'
import { describe, expect, expectTypeOf, test } from 'vitest'

import { Tabs } from '@foldkit/ui'

import { exampleDetail } from '../../composition'
import { Deployment } from '../../deployment'
import { init as initApplication } from '../../init'
import type { Message as ApplicationMessage } from '../../message'
import type { Model as ApplicationModel } from '../../model'
import { update as updateApplication } from '../../update'
import {
  LoadExampleSources,
  Message,
  boot,
  informRouteChanged,
  init,
  update,
} from './example'
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
  commands: ReturnType<typeof boot>['commands'],
): ReadonlyArray<string> =>
  pipe(
    commands ?? [],
    Array.map(command => command.name),
  )

describe('example detail boot', () => {
  test('preserves the initialized Model when there is no initial slug', () => {
    const model = initialModel()
    const unseededBoot = boot(model, Option.none(), Option.none())
    const seededBoot = boot(model, Option.none(), Option.some(sources))

    expect(unseededBoot.model).toBe(model)
    expect(unseededBoot.commands).toBeUndefined()
    expect(seededBoot.model).toBe(model)
    expect(seededBoot.commands).toBeUndefined()
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

    const unseededBoot = boot(
      withExampleUrl.model,
      Option.some('counter'),
      Option.none(),
    )

    expect(unseededBoot.model.currentSources._tag).toBe('Loading')
    expect(unseededBoot.model.maybeActiveSourceFilePath).toEqual(Option.none())
    expect(unseededBoot.model.maybeExampleUrl).toEqual(Option.none())
    expect(unseededBoot.model.sourceFileTabs).toEqual(
      Tabs.init({ id: 'source-file-tabs' }),
    )
    expect(commandNames(unseededBoot.commands)).toEqual([
      'ExampleDetail/LoadExampleSources',
    ])
    expectTypeOf<Update.RequirementsOf<typeof boot>>().toEqualTypeOf<
      Command.HandlerOf<typeof LoadExampleSources>
    >()
  })

  test('shows supplied sources without fetching them', () => {
    const seededBoot = boot(
      initialModel(),
      Option.some('counter'),
      Option.some(sources),
    )

    expect(seededBoot.model.currentSources).toEqual({
      _tag: 'Success',
      data: sources,
    })
    expect(seededBoot.model.maybeActiveSourceFilePath).toEqual(
      Option.some('src/application.ts'),
    )
    expect(seededBoot.commands).toBeUndefined()
  })

  test('leaves unavailable examples unchanged with or without supplied sources', () => {
    const model = initialModel()
    const unseededBoot = boot(model, Option.some('livestore'), Option.none())
    const seededBoot = boot(
      model,
      Option.some('livestore'),
      Option.some(sources),
    )

    expect(unseededBoot.model).toBe(model)
    expect(unseededBoot.commands).toBeUndefined()
    expect(seededBoot.model).toBe(model)
    expect(seededBoot.commands).toBeUndefined()
  })

  test('clears existing sources when routing to an unavailable example', () => {
    const loaded = boot(
      initialModel(),
      Option.some('counter'),
      Option.some(sources),
    )
    const withExampleUrl = update(
      loaded.model,
      Message.ChangedExampleUrl({ url: 'https://example.test' }),
    )

    const routeChange = informRouteChanged(withExampleUrl.model, 'livestore')

    expect(routeChange.model.currentSources._tag).toBe('Idle')
    expect(routeChange.model.maybeActiveSourceFilePath).toEqual(Option.none())
    expect(routeChange.model.maybeExampleUrl).toEqual(Option.none())
    expect(routeChange.model.sourceFileTabs).toEqual(
      Tabs.init({ id: 'source-file-tabs' }),
    )
    expect(routeChange.commands).toEqual([])
  })

  test('lifts the loading Command and its result through the application binding', () => {
    const url = pipe(
      Url.fromString('https://foldkit.dev/example-apps'),
      Option.getOrThrow,
    )
    const applicationInit = initApplication(
      {
        currentYear: 2026,
        today: Calendar.make(2026, 8, 30),
        deployment: Deployment.Canary({ commit: 'test' }),
        maybeApiData: Option.none(),
        maybeExampleSources: Option.none(),
      },
      url,
    )

    const applicationBoot = exampleDetail.boot(
      Option.some('counter'),
      Option.none(),
    )(applicationInit.model)

    expect(applicationBoot.model.exampleDetail.currentSources._tag).toBe(
      'Loading',
    )
    expect(
      pipe(
        applicationBoot.commands ?? [],
        Array.map(command => command.name),
      ),
    ).toEqual(['exampleDetail/LoadExampleSources'])

    story(
      updateApplication,
      given(applicationInit.model),
      (simulation: StorySimulation<ApplicationModel, ApplicationMessage>) => ({
        ...simulation,
        model: applicationBoot.model,
        commands: applicationBoot.commands ?? [],
      }),
      StoryCommand.resolve(
        LoadExampleSources,
        Message.SucceededLoadExampleSources({ sources }),
      ),
      expectModel(model => {
        expect(model.exampleDetail.currentSources).toEqual({
          _tag: 'Success',
          data: sources,
        })
      }),
    )
  })
})
