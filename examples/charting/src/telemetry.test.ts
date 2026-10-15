import { Array, Effect, Layer, Match, String } from 'effect'
import { HttpClient, HttpClientResponse } from 'effect/http'
import { expect, test } from 'vitest'

import { GitHubApiLive } from './githubApi'
import {
  mockGitHubRepository,
  mockNpmDownloads,
  mockNpmPackument,
} from './main.fixture'
import { NpmApiLive } from './npmApi'
import {
  cumulativeStarsByWeek,
  fetchRawTelemetry,
  transformTelemetry,
  weeklyStars,
} from './telemetry'

test.each([
  '2026-06-13T10:00:00Z',
  '2026-06-13T23:00:00Z',
  '2026-06-14T00:00:00Z',
  '2026-06-14T12:00:00Z',
])(
  'aligns star history starting at %s with Monday-based chart weeks',
  latestWeekStart => {
    const latestWeek = Date.parse(latestWeekStart) / 1_000
    const secondsPerWeek = 7 * 24 * 60 * 60
    const starHistory = [
      {
        week: latestWeek,
        total: 8,
        days: [3, 5, 0, 0, 0, 0, 0],
      },
      {
        week: latestWeek - secondsPerWeek,
        total: 6,
        days: [2, 4, 0, 0, 0, 0, 0],
      },
    ]
    const weekStarts = ['2026-06-08', '2026-06-15']

    expect(weeklyStars(starHistory, weekStarts)).toEqual([
      { weekStart: '2026-06-08', count: 7 },
      { weekStart: '2026-06-15', count: 5 },
    ])
    expect(cumulativeStarsByWeek(20, starHistory, weekStarts)).toEqual([
      { weekStart: '2026-06-08', count: 15 },
      { weekStart: '2026-06-15', count: 20 },
    ])
  },
)

test('folds public API responses into a Telemetry value', async () => {
  const mockClient = HttpClient.make(request =>
    Effect.sync(() => {
      const body = Match.value(request.url).pipe(
        Match.when(String.includes('/contributors'), () => [
          { login: 'devin', contributions: 42 },
        ]),
        Match.when(String.includes('/issues'), () => [
          {},
          { pull_request: {} },
        ]),
        Match.when(String.includes('/pulls'), () => [{ id: 1 }]),
        Match.when(String.includes('/releases'), () => [
          {
            tag_name: 'v0.115.0',
            published_at: '2026-06-20T12:00:00Z',
            prerelease: false,
            draft: false,
          },
        ]),
        Match.when(String.includes('/stargazers/history'), () => [
          { week: 1781395200, total: 1, days: [0, 1, 0, 0, 0, 0, 0] },
        ]),
        Match.when(String.includes('/stats/commit_activity'), () => [
          { week: 1781481600, total: 5 },
        ]),
        Match.when(String.includes('/stats/code_frequency'), () => [
          [1781481600, 120, -35],
        ]),
        Match.when(String.includes('api.npmjs.org'), () => mockNpmDownloads),
        Match.when(
          String.includes('registry.npmjs.org'),
          () => mockNpmPackument,
        ),
        Match.orElse(() => mockGitHubRepository),
      )

      return HttpClientResponse.fromWeb(
        request,
        new Response(JSON.stringify(body), { status: 200 }),
      )
    }),
  )

  const telemetryLayer = Layer.mergeAll(GitHubApiLive, NpmApiLive).pipe(
    Layer.provide(Layer.succeed(HttpClient.HttpClient, mockClient)),
  )
  const telemetry = await fetchRawTelemetry.pipe(
    Effect.map(transformTelemetry),
    Effect.provide(telemetryLayer),
    Effect.runPromise,
  )

  expect(telemetry.repository.stars).toBe(342)
  expect(telemetry.repository.openIssues).toBe(1)
  expect(Array.length(telemetry.packages)).toBeGreaterThan(0)
})
