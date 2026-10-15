import { Array, Effect, Layer } from 'effect'
import { HttpClient, HttpClientResponse } from 'effect/http'
import { expect, test } from 'vitest'

import { GitHubApi, GitHubApiLive } from './githubApi'

const MILLISECONDS_PER_SECOND = 1_000
const SECONDS_PER_WEEK = 7 * 24 * 60 * 60
const STAR_HISTORY_PAGE_SIZE = 30
const LATEST_WEEK = Date.parse('2026-06-21T00:00:00Z') / MILLISECONDS_PER_SECOND

const starHistory = Array.makeBy(60, weekIndex => ({
  week: LATEST_WEEK - weekIndex * SECONDS_PER_WEEK,
  total: 1,
  days: [0, 1, 0, 0, 0, 0, 0],
}))

test.each([
  {
    name: 'paginates until the requested year is covered',
    cutoff: '2025-06-22T00:00:00Z',
    history: starHistory,
    expectedPages: [1, 2],
    expectedWeeks: 60,
  },
  {
    name: 'stops at a full page that reaches the cutoff',
    cutoff: '2026-06-01T00:00:00Z',
    history: starHistory,
    expectedPages: [1],
    expectedWeeks: 30,
  },
  {
    name: 'stops when a young repository has a partial page',
    cutoff: '2025-06-22T00:00:00Z',
    history: Array.take(starHistory, 3),
    expectedPages: [1],
    expectedWeeks: 3,
  },
  {
    name: 'accepts a repository with no star history',
    cutoff: '2025-06-22T00:00:00Z',
    history: [],
    expectedPages: [1],
    expectedWeeks: 0,
  },
])('$name', async ({ cutoff, history, expectedPages, expectedWeeks }) => {
  const requestedPages: Array<number> = []
  const mockClient = HttpClient.make(request =>
    Effect.sync(() => {
      const url = new URL(request.url)
      expect(url.pathname).toBe('/repos/foldkit/foldkit/stargazers/history')
      expect(url.searchParams.get('per_page')).toBe('30')
      const page = Number(url.searchParams.get('page'))
      requestedPages.push(page)
      const pageHistory = history.slice(
        (page - 1) * STAR_HISTORY_PAGE_SIZE,
        page * STAR_HISTORY_PAGE_SIZE,
      )

      return HttpClientResponse.fromWeb(
        request,
        new Response(JSON.stringify(pageHistory), { status: 200 }),
      )
    }),
  )
  const githubLayer = GitHubApiLive.pipe(
    Layer.provide(Layer.succeed(HttpClient.HttpClient, mockClient)),
  )
  const historyResponse = await Effect.gen(function* () {
    const github = yield* GitHubApi
    return yield* github.fetchStarHistory(Date.parse(cutoff))
  }).pipe(Effect.provide(githubLayer), Effect.runPromise)

  expect(requestedPages).toEqual(expectedPages)
  expect(historyResponse).toEqual(Array.take(history, expectedWeeks))
})
