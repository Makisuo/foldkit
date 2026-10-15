import { Array, Option, String } from 'effect'
import { spawnSync } from 'node:child_process'
import {
  copyFileSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { API } from '../node_modules/typescript/dist/api/async/api.js'

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const fixtureRoot = join(packageRoot, 'declaration-tests')
const compiler = join(
  packageRoot,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'tsc.cmd' : 'tsc',
)

const fail = (message: string): never => {
  throw new Error(message)
}

const runCompiler = (label: string, args: ReadonlyArray<string>): string => {
  const result = spawnSync(compiler, args, {
    cwd: packageRoot,
    encoding: 'utf8',
    env: process.env,
  })
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim()

  if (result.status !== 0) {
    return fail(`${label} failed${output === '' ? '' : `:\n${output}`}`)
  }

  return output
}

const assertBuiltEntry = (path: string): void => {
  if (!existsSync(join(packageRoot, path))) {
    fail(
      `Missing ${path}. Build the foldkit package before checking its emitted declarations.`,
    )
  }
}

const assertBindingCompletions = async (): Promise<void> => {
  const acceptedFixture = join(fixtureRoot, 'accepted.ts')
  const acceptedConfig = join(fixtureRoot, 'tsconfig.accepted.json')
  const marker = 'child.refresh()(model)'
  const source = readFileSync(acceptedFixture, 'utf8')
  const markerPosition = Option.getOrElse(String.indexOf(marker)(source), () =>
    fail(`Could not find the Binding completion marker ${marker}.`),
  )

  const api = new API({ cwd: packageRoot })

  try {
    const snapshot = await api.updateSnapshot({
      openProjects: [acceptedConfig],
      openFiles: [acceptedFixture],
    })
    const project = snapshot.getProject(acceptedConfig)

    if (project === undefined) {
      return fail(`Could not open the declaration project ${acceptedConfig}.`)
    }

    const diagnostics =
      await project.program.getSemanticDiagnostics(acceptedFixture)

    if (Array.isArrayNonEmpty(Array.fromIterable(diagnostics))) {
      fail(
        `The native completion fixture has ${diagnostics.length} semantic diagnostics.`,
      )
    }

    const completion = await project.checker.getCompletionsAtPosition(
      acceptedFixture,
      markerPosition + 'child.'.length,
    )
    const actual = completion?.entries.map(entry => entry.name).sort()
    const expected = ['embedView', 'fold', 'init', 'placement', 'refresh']

    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      fail(
        `Expected Binding completions ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}.`,
      )
    }
  } finally {
    await api.close()
  }
}

const main = async (): Promise<void> => {
  assertBuiltEntry('dist/index.d.ts')
  assertBuiltEntry('dist/block/public.d.ts')
  assertBuiltEntry('dist/command/public.d.ts')
  assertBuiltEntry('dist/update/public.d.ts')

  const version = runCompiler('Reading the package TypeScript version', [
    '--version',
  ])
  if (!/^Version 7\./.test(version)) {
    fail(`Expected the package TypeScript 7 compiler, received ${version}.`)
  }

  const outputDirectory = mkdtempSync(
    join(packageRoot, '.emitted-declarations-'),
  )

  try {
    runCompiler('Emitting the accepted consumer declaration', [
      '-p',
      join(fixtureRoot, 'tsconfig.accepted.json'),
      '--outDir',
      outputDirectory,
    ])

    runCompiler('Checking rejected consumer wiring', [
      '-p',
      join(fixtureRoot, 'tsconfig.rejected.json'),
    ])

    copyFileSync(
      join(fixtureRoot, 'consume-emitted.ts'),
      join(outputDirectory, 'consume-emitted.ts'),
    )
    copyFileSync(
      join(fixtureRoot, 'tsconfig.consumer.json'),
      join(outputDirectory, 'tsconfig.json'),
    )

    runCompiler('Consuming the emitted consumer declaration', [
      '-p',
      join(outputDirectory, 'tsconfig.json'),
    ])

    const focusedOutputDirectory = join(outputDirectory, 'focused')
    runCompiler('Emitting the focused Block declarations', [
      '-p',
      join(fixtureRoot, 'tsconfig.focused.accepted.json'),
      '--outDir',
      focusedOutputDirectory,
    ])

    runCompiler('Checking focused rejected Block wiring', [
      '-p',
      join(fixtureRoot, 'tsconfig.focused.rejected.json'),
    ])

    const focusedFixtureDirectory = join(
      focusedOutputDirectory,
      'declaration-tests',
    )
    copyFileSync(
      join(fixtureRoot, 'parent-owned-binding.consume.ts'),
      join(focusedFixtureDirectory, 'parent-owned-binding.consume.ts'),
    )
    copyFileSync(
      join(fixtureRoot, 'query-block.consume.ts'),
      join(focusedFixtureDirectory, 'query-block.consume.ts'),
    )
    const focusedConsumerConfig = join(focusedOutputDirectory, 'tsconfig.json')
    writeFileSync(
      focusedConsumerConfig,
      JSON.stringify({
        compilerOptions: {
          strict: true,
          skipLibCheck: false,
          module: 'NodeNext',
          moduleResolution: 'NodeNext',
          target: 'ES2022',
          lib: ['ESNext', 'DOM'],
          types: [],
          noEmit: true,
          exactOptionalPropertyTypes: true,
          noUncheckedIndexedAccess: true,
        },
        include: ['declaration-tests/*.consume.ts'],
      }),
    )

    runCompiler('Consuming the focused emitted Block declarations', [
      '-p',
      focusedConsumerConfig,
    ])

    const viewHelperOutputDirectory = join(outputDirectory, 'view-helper')
    runCompiler('Emitting the plain view helper declarations', [
      '-p',
      join(fixtureRoot, 'tsconfig.plain-view-helper.accepted.json'),
      '--outDir',
      viewHelperOutputDirectory,
    ])

    runCompiler('Checking rejected plain view helper wiring', [
      '-p',
      join(fixtureRoot, 'tsconfig.plain-view-helper.rejected.json'),
    ])

    const viewHelperFixtureDirectory = join(
      viewHelperOutputDirectory,
      'declaration-tests',
    )
    copyFileSync(
      join(fixtureRoot, 'plain-view-helper.consume.ts'),
      join(viewHelperFixtureDirectory, 'plain-view-helper.consume.ts'),
    )
    const viewHelperConsumerConfig = join(
      viewHelperOutputDirectory,
      'tsconfig.json',
    )
    writeFileSync(
      viewHelperConsumerConfig,
      JSON.stringify({
        compilerOptions: {
          strict: true,
          skipLibCheck: false,
          module: 'NodeNext',
          moduleResolution: 'NodeNext',
          target: 'ES2022',
          lib: ['ESNext', 'DOM'],
          types: [],
          noEmit: true,
          exactOptionalPropertyTypes: true,
          noUncheckedIndexedAccess: true,
        },
        include: ['declaration-tests/plain-view-helper.consume.ts'],
      }),
    )

    runCompiler('Consuming the emitted plain view helper declarations', [
      '-p',
      viewHelperConsumerConfig,
    ])

    const childPlacementOutputDirectory = join(
      outputDirectory,
      'child-placement',
    )
    runCompiler('Emitting the child placement declarations', [
      '-p',
      join(fixtureRoot, 'tsconfig.child-placement.accepted.json'),
      '--outDir',
      childPlacementOutputDirectory,
    ])

    runCompiler('Checking rejected child placements', [
      '-p',
      join(fixtureRoot, 'tsconfig.child-placement.rejected.json'),
    ])

    const childPlacementFixtureDirectory = join(
      childPlacementOutputDirectory,
      'declaration-tests',
    )
    copyFileSync(
      join(fixtureRoot, 'child-placement.consume.ts'),
      join(childPlacementFixtureDirectory, 'child-placement.consume.ts'),
    )
    const childPlacementConsumerConfig = join(
      childPlacementOutputDirectory,
      'tsconfig.json',
    )
    writeFileSync(
      childPlacementConsumerConfig,
      JSON.stringify({
        compilerOptions: {
          strict: true,
          skipLibCheck: false,
          module: 'NodeNext',
          moduleResolution: 'NodeNext',
          target: 'ES2022',
          lib: ['ESNext', 'DOM'],
          types: [],
          noEmit: true,
          exactOptionalPropertyTypes: true,
          noUncheckedIndexedAccess: true,
        },
        include: ['declaration-tests/child-placement.consume.ts'],
      }),
    )

    runCompiler('Consuming the emitted child placement declarations', [
      '-p',
      childPlacementConsumerConfig,
    ])

    for (const configName of ['direct-field', 'keyed-field']) {
      const fixtureName =
        configName === 'keyed-field' ? 'keyed-field-binding' : configName
      const directory = join(outputDirectory, configName)
      runCompiler(`Emitting ${configName} declarations`, [
        '-p',
        join(fixtureRoot, `tsconfig.${configName}.accepted.json`),
        '--outDir',
        directory,
      ])
      runCompiler(`Rejecting invalid ${configName} configurations`, [
        '-p',
        join(fixtureRoot, `tsconfig.${configName}.rejected.json`),
      ])
      copyFileSync(
        join(fixtureRoot, `${fixtureName}.consume.ts`),
        join(directory, 'declaration-tests', `${fixtureName}.consume.ts`),
      )
      const consumerConfig = join(directory, 'tsconfig.json')
      writeFileSync(
        consumerConfig,
        JSON.stringify({
          compilerOptions: {
            strict: true,
            skipLibCheck: false,
            module: 'NodeNext',
            moduleResolution: 'NodeNext',
            target: 'ES2022',
            lib: ['ESNext', 'DOM'],
            types: [],
            noEmit: true,
            exactOptionalPropertyTypes: true,
            noUncheckedIndexedAccess: true,
          },
          include: [`declaration-tests/${fixtureName}.consume.ts`],
        }),
      )
      runCompiler(`Consuming emitted ${configName} declarations`, [
        '-p',
        consumerConfig,
      ])
    }

    await assertBindingCompletions()

    process.stdout.write(
      `[emitted-declarations] ${version}; accepted, rejected, focused Binding and Query, plain view helpers, child placements, downstream, and native completion checks passed.\n`,
    )
  } finally {
    rmSync(outputDirectory, { recursive: true, force: true })
  }
}

try {
  await main()
} catch (error) {
  const message =
    error instanceof Error ? error.message : globalThis.String(error)

  console.error(`[emitted-declarations] ${message}`)
  process.exitCode = 1
}
