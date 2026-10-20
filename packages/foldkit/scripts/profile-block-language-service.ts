import { Option, Predicate, String } from 'effect'
import { execFileSync, spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  existsSync,
  globSync,
  readFileSync,
  realpathSync,
  statSync,
} from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, relative, resolve } from 'node:path'
import { performance } from 'node:perf_hooks'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'

import {
  createMessageConnection,
  StreamMessageReader,
  StreamMessageWriter,
  type MessageConnection,
} from '../node_modules/typescript/vendor/vscode-jsonrpc/lib/node/main.js'

type Response = Readonly<{
  result: unknown
  latencyMs: number
}>

type SourceDocument = {
  readonly uri: string
  readonly originalText: string
  version: number
}

type Position = Readonly<{ line: number; character: number }>

type RequestTarget = Readonly<{
  method: string
  source: SourceDocument
  position: Position
}>

type Measurement = Readonly<{
  label: string
  latencyMs: number
  resultCount: number | undefined
  resultBytes: number
}>

type ServerInfo = Readonly<{
  name: string
  version: string
}>

type ScenarioResult = Readonly<{
  serverInfo: ServerInfo
  measurements: ReadonlyArray<Measurement>
}>

type Options = Readonly<{
  runs: number
  timeoutMs: number
}>

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const workspaceRoot = resolve(packageRoot, '../..')
const benchmarkScriptPath = fileURLToPath(import.meta.url)
const definitionPath = 'packages/website/src/definition.ts'
const compositionPath = 'packages/website/src/composition/composition.ts'
const changedUrlPath = 'packages/website/src/update/handleChangedUrl.ts'
const typescriptManifestPath = join(
  packageRoot,
  'node_modules',
  'typescript',
  'package.json',
)
const nativeCompilerPackage = `@typescript/typescript-${process.platform}-${process.arch}`
const workloadGitPaths = [
  ':(glob)packages/website/**/*.ts',
  ':(glob)packages/website/**/*.tsx',
  ':(glob)packages/website/**/*.mts',
  ':(glob)packages/website/**/*.cts',
  ':(glob)packages/**/src/**/*.ts',
  ':(glob)packages/**/src/**/*.tsx',
  ':(glob)packages/**/src/**/*.mts',
  ':(glob)packages/**/src/**/*.cts',
  ':(glob)internal/**/src/**/*.ts',
  ':(glob)internal/**/src/**/*.tsx',
  ':(glob)internal/**/src/**/*.mts',
  ':(glob)internal/**/src/**/*.cts',
  ':(glob)packages/**/*.d.ts',
  ':(glob)packages/**/*.d.mts',
  ':(glob)packages/**/*.d.cts',
  ':(glob)packages/**/*.d.ts.map',
  ':(glob)packages/**/*.d.mts.map',
  ':(glob)packages/**/*.d.cts.map',
  ':(glob)internal/**/*.d.ts',
  ':(glob)internal/**/*.d.mts',
  ':(glob)internal/**/*.d.cts',
  ':(glob)internal/**/*.d.ts.map',
  ':(glob)internal/**/*.d.mts.map',
  ':(glob)internal/**/*.d.cts.map',
  ':(glob)packages/**/package.json',
  ':(glob)internal/**/package.json',
  'package.json',
  'packages/website/tsconfig.json',
  'pnpm-lock.yaml',
  'pnpm-workspace.yaml',
  'tsconfig.base.json',
]

const fail = (message: string): never => {
  throw new Error(message)
}

const nativeCompilerExecutable = (): string => {
  try {
    const requireFromTypescript = createRequire(
      realpathSync(typescriptManifestPath),
    )
    const nativeCompilerManifestPath = requireFromTypescript.resolve(
      `${nativeCompilerPackage}/package.json`,
    )
    const executable = join(
      dirname(nativeCompilerManifestPath),
      'lib',
      process.platform === 'win32' ? 'tsc.exe' : 'tsc',
    )
    return existsSync(executable)
      ? executable
      : fail(`Pinned native TypeScript executable is missing.`)
  } catch {
    return fail(
      `Install the pinned native TypeScript compiler before profiling.`,
    )
  }
}

const parsePositiveInteger = (value: string, option: string): number => {
  const parsed = globalThis.Number(value)

  if (!globalThis.Number.isSafeInteger(parsed) || parsed < 1) {
    return fail(`${option} requires a positive integer, received ${value}.`)
  }

  return parsed
}

const parseOptions = (): Options => {
  const { values } = parseArgs({
    options: {
      help: { type: 'boolean', default: false },
      runs: { type: 'string', default: '3' },
      'timeout-ms': { type: 'string', default: '60000' },
    },
  })
  if (values.help) {
    process.stdout.write(
      'Usage: node packages/foldkit/scripts/profile-block-language-service.ts [--runs N] [--timeout-ms N]\n',
    )
    process.exit(0)
  }

  return {
    runs: parsePositiveInteger(values.runs, '--runs'),
    timeoutMs: parsePositiveInteger(values['timeout-ms'], '--timeout-ms'),
  }
}

const delay = (milliseconds: number): Promise<void> =>
  new Promise(resolveDelay => setTimeout(resolveDelay, milliseconds))

class LspClient {
  private readonly child = spawn(
    nativeCompilerExecutable(),
    ['--lsp', '--stdio'],
    { cwd: workspaceRoot, stdio: ['pipe', 'pipe', 'pipe'] },
  )
  private readonly connection: MessageConnection
  private readonly exitPromise: Promise<void>
  private stderr = ''
  private hasExited = false
  private lifecycleError: Error | undefined

  constructor() {
    this.exitPromise = new Promise(resolveExit => {
      this.child.once('error', error => {
        this.lifecycleError = error
        if (this.child.pid === undefined) {
          this.hasExited = true
          resolveExit()
        }
      })
      this.child.once('close', (code, signal) => {
        this.hasExited = true
        const detail = signal === null ? `code ${code}` : `signal ${signal}`
        this.lifecycleError ??= new Error(
          `TypeScript language server exited with ${detail}.${
            this.stderr === '' ? '' : ` ${this.stderr.trim()}`
          }`,
        )
        resolveExit()
      })
    })
    this.child.stderr.on('data', chunk => {
      this.stderr += chunk.toString()
    })
    this.connection = createMessageConnection(
      new StreamMessageReader(this.child.stdout),
      new StreamMessageWriter(this.child.stdin),
    )
    this.connection.onRequest((method, params) => {
      if (method === 'workspace/configuration') {
        const items =
          params !== null &&
          typeof params === 'object' &&
          'items' in params &&
          globalThis.Array.isArray(params.items)
            ? params.items
            : []
        return items.map(() => null)
      } else if (method === 'workspace/workspaceFolders') {
        return [
          { uri: pathToFileURL(workspaceRoot).href, name: 'foldkit-monorepo' },
        ]
      }
      return null
    })
    this.connection.onError(([error]) => {
      this.lifecycleError = error
    })
    this.connection.listen()
  }

  async notify(method: string, params?: unknown): Promise<void> {
    if (this.lifecycleError !== undefined) {
      throw this.lifecycleError
    }
    await this.connection.sendNotification(method, params)
  }

  async request(
    method: string,
    params: unknown,
    timeoutMs: number,
  ): Promise<Response> {
    if (this.lifecycleError !== undefined) {
      throw this.lifecycleError
    }

    const started = performance.now()
    let timeoutHandle: NodeJS.Timeout | undefined
    const timeout = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(
        () =>
          reject(new Error(`${method} exceeded its ${timeoutMs}ms timeout.`)),
        timeoutMs,
      )
    })
    try {
      const result = await Promise.race([
        this.connection.sendRequest<unknown>(method, params),
        timeout,
      ])
      return { result, latencyMs: performance.now() - started }
    } finally {
      if (timeoutHandle !== undefined) {
        clearTimeout(timeoutHandle)
      }
    }
  }

  async close(timeoutMs: number): Promise<void> {
    if (this.hasExited) {
      this.connection.dispose()
      return
    }

    try {
      await this.request(
        'shutdown',
        undefined,
        globalThis.Math.min(5_000, timeoutMs),
      )
      await this.notify('exit')
      this.child.stdin.end()
      await Promise.race([this.exitPromise, delay(2_000)])
    } catch {
      this.child.kill('SIGTERM')
      await Promise.race([this.exitPromise, delay(2_000)])
    }

    if (!this.hasExited) {
      this.child.kill('SIGKILL')
      await Promise.race([this.exitPromise, delay(2_000)])
    }

    this.connection.dispose()
    if (!this.hasExited) {
      return fail(`TypeScript language server did not exit after SIGKILL.`)
    }
  }
}

const document = (relativePath: string): SourceDocument => {
  const path = join(workspaceRoot, relativePath)
  return {
    uri: pathToFileURL(path).href,
    originalText: readFileSync(path, 'utf8'),
    version: 1,
  }
}

const positionAt = (text: string, offset: number): Position => {
  const lines = text.slice(0, offset).split('\n')
  return { line: lines.length - 1, character: lines.at(-1)?.length ?? 0 }
}

const occurrence = (text: string, needle: string, within?: string): number => {
  const contextStart =
    within === undefined
      ? 0
      : Option.getOrElse(String.indexOf(within)(text), () =>
          fail(`Could not find context marker ${within}.`),
        )
  const offset = Option.getOrElse(
    String.indexOf(needle)(text.slice(contextStart)),
    () => fail(`Could not find workload marker ${needle}.`),
  )

  return contextStart + offset
}

const requestTarget = (
  method: string,
  source: SourceDocument,
  needle: string,
  within?: string,
): RequestTarget => ({
  method,
  source,
  position: positionAt(
    source.originalText,
    occurrence(source.originalText, needle, within) + needle.length / 2,
  ),
})

const bindingFactoryMarker = (text: string): string => {
  if (text.includes('.makeBinding')) {
    return 'makeBinding'
  } else if (text.includes('.bindChild')) {
    return 'bindChild'
  }

  return fail(`Could not find makeBinding or bindChild in Website composition.`)
}

const openDocument = async (
  client: LspClient,
  source: SourceDocument,
  text = source.originalText,
): Promise<void> => {
  await client.notify('textDocument/didOpen', {
    textDocument: {
      uri: source.uri,
      languageId: 'typescript',
      version: source.version,
      text,
    },
  })
}

const changeDocument = async (
  client: LspClient,
  source: SourceDocument,
  text: string,
): Promise<void> => {
  source.version += 1
  await client.notify('textDocument/didChange', {
    textDocument: { uri: source.uri, version: source.version },
    contentChanges: [{ text }],
  })
}

const serverInfoFrom = (response: Response): ServerInfo => {
  const result = response.result
  const serverInfo =
    result !== null &&
    typeof result === 'object' &&
    'serverInfo' in result &&
    result.serverInfo !== null &&
    typeof result.serverInfo === 'object'
      ? result.serverInfo
      : undefined
  const name =
    serverInfo !== undefined &&
    'name' in serverInfo &&
    Predicate.isString(serverInfo.name) &&
    String.isNonEmpty(String.trim(serverInfo.name))
      ? serverInfo.name
      : fail(`Language server initialize response has no name.`)
  const version =
    serverInfo !== undefined &&
    'version' in serverInfo &&
    Predicate.isString(serverInfo.version)
      ? serverInfo.version
      : 'unknown'

  return { name, version }
}

const initialize = async (
  client: LspClient,
  timeoutMs: number,
): Promise<ServerInfo> => {
  const rootUri = pathToFileURL(workspaceRoot).href
  const response = await client.request(
    'initialize',
    {
      processId: process.pid,
      rootUri,
      capabilities: {
        general: { positionEncodings: ['utf-16'] },
        workspace: { configuration: true, workspaceFolders: true },
        textDocument: {
          completion: { completionItem: { snippetSupport: false } },
          definition: { linkSupport: true },
          hover: { contentFormat: ['markdown', 'plaintext'] },
        },
      },
      workspaceFolders: [{ uri: rootUri, name: 'foldkit-monorepo' }],
    },
    timeoutMs,
  )
  await client.notify('initialized', {})
  return serverInfoFrom(response)
}

const completionItems = (result: unknown): ReadonlyArray<unknown> => {
  if (globalThis.Array.isArray(result)) {
    return result
  }

  if (
    result !== null &&
    typeof result === 'object' &&
    'items' in result &&
    globalThis.Array.isArray(result.items)
  ) {
    return result.items
  }

  return []
}

const markedStringText = (contents: unknown): string => {
  if (Predicate.isString(contents)) {
    return contents
  }

  if (
    contents !== null &&
    typeof contents === 'object' &&
    'value' in contents &&
    Predicate.isString(contents.value) &&
    'language' in contents &&
    Predicate.isString(contents.language)
  ) {
    return contents.value
  }

  return fail(`Hover returned an unsupported contents value.`)
}

const hoverText = (contents: unknown): string => {
  if (globalThis.Array.isArray(contents)) {
    return contents.map(markedStringText).join('\n')
  }

  if (
    contents !== null &&
    typeof contents === 'object' &&
    'kind' in contents &&
    (contents.kind === 'markdown' || contents.kind === 'plaintext') &&
    'value' in contents &&
    Predicate.isString(contents.value)
  ) {
    return contents.value
  }

  return markedStringText(contents)
}

const validateResult = (
  label: string,
  method: string,
  result: unknown,
): number | undefined => {
  if (method === 'textDocument/hover') {
    if (
      result === null ||
      typeof result !== 'object' ||
      !('contents' in result) ||
      String.isEmpty(String.trim(hoverText(result.contents)))
    ) {
      return fail(`${label} returned no hover contents.`)
    }

    return undefined
  }

  if (method === 'textDocument/definition') {
    if (!globalThis.Array.isArray(result) || result.length < 1) {
      return fail(`${label} returned no definitions.`)
    }

    return result.length
  }

  if (method === 'textDocument/completion') {
    const items = completionItems(result)
    const labels = items.flatMap(item =>
      item !== null &&
      typeof item === 'object' &&
      'label' in item &&
      Predicate.isString(item.label)
        ? [item.label]
        : [],
    )
    if (!labels.includes('_tag') || !labels.includes('exampleSlug')) {
      return fail(
        `${label} did not return the expected _tag and exampleSlug completions.`,
      )
    }

    return items.length
  }

  return fail(`No result validation is defined for ${method}.`)
}

const measure = async (
  client: LspClient,
  timeoutMs: number,
  label: string,
  target: RequestTarget,
): Promise<Measurement> => {
  const response = await client.request(
    target.method,
    { textDocument: { uri: target.source.uri }, position: target.position },
    timeoutMs,
  )
  const count = validateResult(label, target.method, response.result)
  const serializedResult =
    JSON.stringify(response.result) ?? fail(`${label} returned no JSON result.`)

  return {
    label,
    latencyMs: globalThis.Number(response.latencyMs.toFixed(3)),
    resultCount: count,
    resultBytes: Buffer.byteLength(serializedResult),
  }
}

const measurePair = async (
  client: LspClient,
  timeoutMs: number,
  labels: readonly [first: string, warm: string],
  target: RequestTarget,
): Promise<readonly [Measurement, Measurement]> => [
  await measure(client, timeoutMs, labels[0], target),
  await measure(client, timeoutMs, labels[1], target),
]

const editThenMeasurePair = async (
  client: LspClient,
  timeoutMs: number,
  labels: readonly [first: string, warm: string],
  target: RequestTarget,
  text: string,
): Promise<readonly [Measurement, Measurement]> => {
  await changeDocument(client, target.source, text)
  return measurePair(client, timeoutMs, labels, target)
}

const runScenario = async (
  timeoutMs: number,
  execute: (client: LspClient) => Promise<ReadonlyArray<Measurement>>,
): Promise<ScenarioResult> => {
  const client = new LspClient()
  try {
    const serverInfo = await initialize(client, timeoutMs)
    const measurements = await execute(client)
    return { serverInfo, measurements }
  } finally {
    await client.close(timeoutMs)
  }
}

const hoverScenario = (timeoutMs: number): Promise<ScenarioResult> =>
  runScenario(timeoutMs, async client => {
    const definition = document(definitionPath)
    const composition = document(compositionPath)
    await openDocument(client, definition)
    await openDocument(client, composition)

    const definitionTarget = requestTarget(
      'textDocument/hover',
      definition,
      'ApplicationDefinition',
    )
    const bindingTarget = requestTarget(
      'textDocument/hover',
      composition,
      'SearchBinding',
    )
    const measurements = [
      ...(await measurePair(
        client,
        timeoutMs,
        ['hover.first', 'hover.warm'],
        definitionTarget,
      )),
    ]

    measurements.push(
      ...(await editThenMeasurePair(
        client,
        timeoutMs,
        ['hover.postWhitespace', 'hover.postWhitespaceWarm'],
        bindingTarget,
        `${composition.originalText}\n`,
      )),
    )

    measurements.push(
      ...(await editThenMeasurePair(
        client,
        timeoutMs,
        ['hover.postSemantic', 'hover.postSemanticWarm'],
        bindingTarget,
        `${composition.originalText}\nexport const ProfilingSemanticEdit = 1\n`,
      )),
    )

    return measurements
  })

const definitionScenario = (timeoutMs: number): Promise<ScenarioResult> =>
  runScenario(timeoutMs, async client => {
    const composition = document(compositionPath)
    await openDocument(client, composition)
    const marker = bindingFactoryMarker(composition.originalText)
    const target = requestTarget('textDocument/definition', composition, marker)
    const measurements = [
      ...(await measurePair(
        client,
        timeoutMs,
        ['definition.first', 'definition.warm'],
        target,
      )),
    ]

    measurements.push(
      ...(await editThenMeasurePair(
        client,
        timeoutMs,
        ['definition.postWhitespace', 'definition.postWhitespaceWarm'],
        target,
        `${composition.originalText}\n`,
      )),
    )
    return measurements
  })

const completionScenario = (timeoutMs: number): Promise<ScenarioResult> =>
  runScenario(timeoutMs, async client => {
    const changedUrl = document(changedUrlPath)
    const completionNeedle =
      'previousRoute.exampleSlug === nextRoute.exampleSlug'
    const completionStart = occurrence(
      changedUrl.originalText,
      completionNeedle,
      "Transition.stayed(transition, 'ExampleDetail')",
    )
    const completionText = `${changedUrl.originalText.slice(
      0,
      completionStart,
    )}previousRoute.${changedUrl.originalText.slice(
      completionStart + 'previousRoute.exampleSlug'.length,
    )}`
    await openDocument(client, changedUrl, completionText)
    const target: RequestTarget = {
      method: 'textDocument/completion',
      source: changedUrl,
      position: positionAt(
        completionText,
        completionStart + 'previousRoute.'.length,
      ),
    }
    const measurements = [
      ...(await measurePair(
        client,
        timeoutMs,
        ['completion.first', 'completion.warm'],
        target,
      )),
    ]

    measurements.push(
      ...(await editThenMeasurePair(
        client,
        timeoutMs,
        ['completion.postWhitespace', 'completion.postWhitespaceWarm'],
        target,
        `${completionText}\n`,
      )),
    )
    return measurements
  })

const sha256 = (value: string | Buffer): string =>
  createHash('sha256').update(value).digest('hex')

const filesBelow = (
  directory: string,
  pattern: string,
  isIncludingDist = false,
): ReadonlyArray<string> =>
  globSync(pattern, {
    cwd: directory,
    exclude: [
      '**/node_modules/**',
      '**/coverage/**',
      ...(isIncludingDist ? [] : ['**/dist/**']),
      '**/playwright-report/**',
      '**/test-results/**',
    ],
  }).map(path => join(directory, path))

const workloadHash = (): string => {
  const workspaceSourceRoots = [
    join(workspaceRoot, 'packages'),
    join(workspaceRoot, 'internal'),
  ]
  const foldkitDeclarations = join(packageRoot, 'dist')
  if (
    !existsSync(foldkitDeclarations) ||
    !statSync(foldkitDeclarations).isDirectory()
  ) {
    return fail(
      `Build packages/foldkit before profiling language-service latency.`,
    )
  }
  const websiteRoot = join(workspaceRoot, 'packages/website')
  const paths = globalThis.Array.from(
    new Set([
      join(workspaceRoot, 'package.json'),
      join(workspaceRoot, 'pnpm-lock.yaml'),
      join(workspaceRoot, 'pnpm-workspace.yaml'),
      join(workspaceRoot, 'tsconfig.base.json'),
      join(websiteRoot, 'package.json'),
      join(websiteRoot, 'tsconfig.json'),
      ...filesBelow(websiteRoot, '**/*.{ts,tsx,mts,cts}'),
      ...workspaceSourceRoots.flatMap(root =>
        filesBelow(root, '**/package.json'),
      ),
      ...workspaceSourceRoots.flatMap(root =>
        filesBelow(root, '**/src/**/*.{ts,tsx,mts,cts}'),
      ),
      ...workspaceSourceRoots.flatMap(root =>
        filesBelow(root, '**/*.d.{ts,mts,cts}', true),
      ),
      ...workspaceSourceRoots.flatMap(root =>
        filesBelow(root, '**/*.d.{ts,mts,cts}.map', true),
      ),
    ]),
  ).sort()
  const hash = createHash('sha256')
  for (const path of paths) {
    hash.update(relative(workspaceRoot, path))
    hash.update('\0')
    hash.update(readFileSync(path))
    hash.update('\0')
  }
  return hash.digest('hex')
}

const gitOutput = (args: ReadonlyArray<string>): string =>
  execFileSync('git', args, { cwd: workspaceRoot, encoding: 'utf8' }).trim()

const compilerVersion = (): string => {
  const manifest: unknown = JSON.parse(
    readFileSync(typescriptManifestPath, 'utf8'),
  )
  if (
    manifest === null ||
    typeof manifest !== 'object' ||
    !('version' in manifest) ||
    !Predicate.isString(manifest.version)
  ) {
    return fail(`Could not read the pinned TypeScript version.`)
  }
  return manifest.version
}

const median = (values: ReadonlyArray<number>): number => {
  const sorted = [...values].sort((left, right) => left - right)
  const middle = globalThis.Math.floor(sorted.length / 2)
  const right = sorted.at(middle) ?? fail(`Cannot summarize empty samples.`)
  if (sorted.length % 2 === 1) {
    return right
  }
  const left = sorted.at(middle - 1) ?? right
  return (left + right) / 2
}

const summarize = (
  runs: ReadonlyArray<Readonly<{ measurements: ReadonlyArray<Measurement> }>>,
) => {
  const samples = new Map<string, Array<number>>()
  for (const run of runs) {
    for (const measurement of run.measurements) {
      const values = samples.get(measurement.label) ?? []
      values.push(measurement.latencyMs)
      samples.set(measurement.label, values)
    }
  }

  return globalThis.Array.from(samples, ([label, values]) => ({
    label,
    samplesMs: values,
    medianMs: globalThis.Number(median(values).toFixed(3)),
    minimumMs: globalThis.Math.min(...values),
    maximumMs: globalThis.Math.max(...values),
  }))
}

const main = async (): Promise<void> => {
  const options = parseOptions()
  nativeCompilerExecutable()

  const sourceCommit = gitOutput(['rev-parse', 'HEAD'])
  const sourceWorkloadDirty =
    gitOutput([
      'status',
      '--porcelain',
      '--untracked-files=all',
      '--',
      ...workloadGitPaths,
    ]) !== ''
  const initialWorkloadHash = workloadHash()
  const lockfileHash = sha256(
    readFileSync(join(workspaceRoot, 'pnpm-lock.yaml')),
  )
  const benchmarkScriptHash = sha256(readFileSync(benchmarkScriptPath))
  const typescriptVersion = compilerVersion()

  const runs: Array<
    Readonly<{ run: number; measurements: ReadonlyArray<Measurement> }>
  > = []
  let serverInfo: ServerInfo | undefined

  for (let run = 1; run <= options.runs; run += 1) {
    const hover = await hoverScenario(options.timeoutMs)
    const definition = await definitionScenario(options.timeoutMs)
    const completion = await completionScenario(options.timeoutMs)
    serverInfo ??= hover.serverInfo
    const expectedServer = serverInfo

    const scenarioInfos = [
      hover.serverInfo,
      definition.serverInfo,
      completion.serverInfo,
    ]
    if (
      scenarioInfos.some(
        actual =>
          actual.name !== expectedServer.name ||
          actual.version !== typescriptVersion,
      )
    ) {
      return fail(
        `Language server identity or version changed during the benchmark.`,
      )
    }

    runs.push({
      run,
      measurements: [
        ...hover.measurements,
        ...definition.measurements,
        ...completion.measurements,
      ],
    })
  }

  if (workloadHash() !== initialWorkloadHash) {
    return fail(`The measured source or declarations changed during the run.`)
  }
  if (sha256(readFileSync(benchmarkScriptPath)) !== benchmarkScriptHash) {
    return fail(`The benchmark script changed during the run.`)
  }

  const output = {
    metadata: {
      formatVersion: 1,
      measuredAt: new Date().toISOString(),
      sourceCommit,
      sourceWorkloadDirty,
      workloadSha256: initialWorkloadHash,
      lockfileSha256: lockfileHash,
      benchmarkScriptSha256: benchmarkScriptHash,
      compilerPackageVersion: typescriptVersion,
      nativeCompilerPackage,
      server: serverInfo ?? fail(`The benchmark produced no server metadata.`),
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch,
      runs: options.runs,
      timeoutMs: options.timeoutMs,
    },
    workload: {
      hoverFirst: `${definitionPath}#ApplicationDefinition`,
      hoverAfterEdit: `${compositionPath}#SearchBinding`,
      definitionFirst: `${compositionPath}#${bindingFactoryMarker(
        readFileSync(join(workspaceRoot, compositionPath), 'utf8'),
      )}`,
      completion: `${changedUrlPath}#previousRoute.`,
    },
    summary: summarize(runs),
    runs,
  }
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`)
}

main().catch(error => {
  const message =
    error instanceof Error ? error.message : globalThis.String(error)
  process.stderr.write(
    `[block-language-service] ${message.replaceAll(workspaceRoot, '<workspace>')}\n`,
  )
  process.exitCode = 1
})
