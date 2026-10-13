import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

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

const main = (): void => {
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

    process.stdout.write(
      `[emitted-declarations] ${version}; accepted, rejected, and downstream declaration checks passed.\n`,
    )
  } finally {
    rmSync(outputDirectory, { recursive: true, force: true })
  }
}

try {
  main()
} catch (error) {
  const message =
    error instanceof Error ? error.message : globalThis.String(error)

  console.error(`[emitted-declarations] ${message}`)
  process.exitCode = 1
}
