import fs from 'fs'
import path from 'path'

import { cosmiconfig } from 'cosmiconfig'
import { globbySync } from 'globby'
import inquirer from 'inquirer'
import { vol } from 'memfs'
import type { MockInstance } from 'vitest'

import { main } from '../bin'
import { loadModuleFromPath } from '../utils/loadModuleFromPath'

vi.mock('cosmiconfig')
vi.mock('fs')
vi.mock('globby')
vi.mock('inquirer')
vi.mock('../utils/loadModuleFromPath')

/* TEST UTILS */
async function runBinary(...args: string[]) {
  vi.stubGlobal('process', { ...process, argv: ['pnpm', 'vue-sfcmod', ...args] })

  vi.spyOn(process, 'exit').mockImplementation((code) => {
    throw new Error(`process.exit(${code})`)
  })

  return main()
}

async function runBinaryWithExit(exitCode: number, ...args: string[]) {
  return expect(() => runBinary(...args)).rejects.toThrow(`process.exit(${exitCode})`)
}

/* TEST SUITE */
describe('vue-sfcmod binary', () => {
  let consoleLogSpy: MockInstance<typeof console.log>
  let consoleErrSpy: MockInstance<typeof console.error>
  const search = vi.fn()

  beforeEach(() => {
    vi.mocked(loadModuleFromPath).mockImplementation((nameOrPath: string) => {
      const customModulePath = path.resolve(process.cwd(), nameOrPath)
      if (fs.existsSync(customModulePath)) {
        const content = fs.readFileSync(customModulePath).toString('utf8')

        return eval(content)
      }

      throw new Error(`Cannot find transformation module ${nameOrPath}`)
    })

    vi.mocked(globbySync).mockImplementation((p: string | string[]) => (Array.isArray(p) ? p : [p]))

    // @ts-expect-error We don't mock the whole implementation.
    vi.mocked(cosmiconfig).mockImplementation(() => ({ search }))

    search.mockImplementation(() => {
      return {
        config: null,
        isEmpty: false,
      }
    })

    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    consoleErrSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    vol.reset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  /* CLI Parameters */
  it('fails with usage instructions when no argument is passed', async () => {
    await runBinaryWithExit(1)
    expect(consoleErrSpy).toHaveBeenCalledWith('Missing required argument: transformation')
  })

  it('prints help when --help is passed', async () => {
    await runBinaryWithExit(0, '--help')
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringMatching(/^Usage: pnpm \[file pattern\] -t \[transformation\]/),
    )
  })

  it('fails when the transformation module path is wrong', async () => {
    vol.fromJSON({
      '/tmp/Input.vue': '<template>Hello world</template><script></script>',
    })

    await expect(() => runBinary('/tmp/Input.vue', '-t', 'foo')).rejects.toThrow(
      'Cannot find transformation module foo',
    )
  })

  it('succeeds when the transformation module path is right', async () => {
    vol.fromJSON({
      '/tmp/Input.vue': '<template>Hello world</template><script></script>',
      '/tmp/transformation.cjs': 'module.exports = {}',
    })

    await expect(() => runBinary('/tmp/Input.vue', '-t', '/tmp/transformation.cjs')).not.toThrow()
  })

  /* Transformation */
  it('passes additional arguments to the transformation', async () => {
    vol.fromJSON({
      '/tmp/Input.ts': 'console.log("Hello world");',
      '/tmp/transformation.cjs':
        'module.exports = function(file, api, options) { return JSON.stringify(options) }',
    })

    await runBinary(
      '--foo',
      'foo',
      '-t',
      '/tmp/transformation.cjs',
      '--bar=bar',
      '/tmp/Input.ts',
      '--flag',
    )

    expect(fs.readFileSync('/tmp/Input.ts').toString('utf-8')).toBe(
      '{"foo":"foo","bar":"bar","flag":true}',
    )
  })

  it('prints errors thrown by transformation functions', async () => {
    vol.fromJSON({
      '/tmp/Input.ts': 'console.log("Hello world");',
      '/tmp/transformation.cjs':
        'module.exports = function(file, api, options) { throw new Error("test") }',
    })

    await runBinary('/tmp/Input.ts', '-t', '/tmp/transformation.cjs')
    expect(consoleErrSpy).toHaveBeenCalledWith(new Error('test'))
  })

  /* Config file */
  it('errors out due to missing presets when sfcmod.config.ts is not found', async () => {
    vol.fromJSON({
      '/tmp/Input.vue': '<template>Hello world</template><script></script>',
      '/tmp/transformation.cjs': 'module.exports = {}',
    })
    search.mockImplementation(() => null)

    await runBinaryWithExit(1, '/tmp/Input.vue')
    expect(consoleErrSpy).toHaveBeenCalledWith('Missing required argument: transformation')
  })

  it('errors out due to missing presets when sfcmod.config.ts is empty', async () => {
    vol.fromJSON({
      '/tmp/Input.vue': '<template>Hello world</template><script></script>',
      '/tmp/transformation.cjs': 'module.exports = {}',
    })
    search.mockImplementation(() => ({
      config: {},
      filepath: 'mock-sfcmod.config.ts',
      isEmpty: true,
    }))

    await runBinaryWithExit(1, '/tmp/Input.vue')
    expect(consoleErrSpy).toHaveBeenCalledWith('Missing required argument: transformation')
  })

  it('proposes presets when sfcmod.config.ts exists and no -t arg is passed', async () => {
    vol.fromJSON({
      '/tmp/Input.vue': '<template>Hello world</template><script></script>',
      '/tmp/transformation.cjs': 'module.exports = {}',
    })
    // @ts-expect-error We don't mock the whole implementation.
    vi.mocked(inquirer.prompt).mockReturnValueOnce({ preset: '/tmp/transformation.cjs' })
    search.mockImplementation(() => ({
      config: { presets: ['/tmp/transformation.cjs'] },
      filepath: 'mock-sfcmod.config.ts',
      isEmpty: false,
    }))

    await expect(() => runBinary('/tmp/Input.vue')).not.toThrow()
    expect(inquirer.prompt).toHaveBeenCalled()
    expect(inquirer.prompt).toHaveReturnedWith(
      expect.objectContaining({
        preset: '/tmp/transformation.cjs',
      }),
    )
  })

  it('ignores presets when sfcmod.config.ts exists and a -t arg is passed', async () => {
    vol.fromJSON({
      '/tmp/Input.vue': '<template>Hello world</template><script></script>',
      '/tmp/transformation.cjs': 'module.exports = {}',
    })
    search.mockImplementation(() => {
      return {
        config: { presets: ['/tmp/transformation.cjs'] },
        filepath: 'mock-sfcmod.config.ts',
        isEmpty: false,
      }
    })

    await expect(() => runBinary('/tmp/Input.vue', '-t', 'foo')).rejects.toThrow(
      'Cannot find transformation module foo',
    )
  })

  it('accepts objects in presets, with a glob property for the preset paths', async () => {
    vol.fromJSON({
      '/tmp/Input.vue': '<template>Hello world</template><script></script>',
      '/tmp/transformation.cjs': 'module.exports = {}',
    })
    // @ts-expect-error We don't mock the whole implementation.
    vi.mocked(inquirer.prompt).mockReturnValueOnce({ preset: '/tmp/transformation.cjs' })
    const name = vi.fn().mockReturnValue('test')
    search.mockImplementation(() => ({
      config: { presets: [{ glob: '/tmp/transformation.cjs', name }] },
      filepath: 'mock-sfcmod.config.ts',
      isEmpty: false,
    }))

    await expect(() => runBinary('/tmp/Input.vue')).not.toThrow()
    expect(inquirer.prompt).toHaveBeenCalled()
    expect(inquirer.prompt).toHaveReturnedWith(
      expect.objectContaining({
        preset: '/tmp/transformation.cjs',
      }),
    )
    expect(name).toHaveBeenCalledWith('/tmp/transformation.cjs')
    expect(name).toHaveReturnedWith('test')
  })
})
