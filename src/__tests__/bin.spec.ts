import fs from 'fs'

import { cosmiconfigSync } from 'cosmiconfig'
import { globbySync } from 'globby'
import { prompt } from 'inquirer'
import { vol } from 'memfs'

import { main } from '../bin'

jest.mock('fs')
jest.mock('fs/promises')

/* TEST UTILS */
async function runBinary(...args: string[]) {
  jest.replaceProperty(process, 'argv', ['yarn', 'vue-sfcmod', ...args])

  jest.spyOn(process, 'exit').mockImplementation((code) => {
    throw new Error(`process.exit(${code})`)
  })

  return main()
}

async function runBinaryWithExit(exitCode: number, ...args: string[]) {
  return expect(() => runBinary(...args)).rejects.toThrow(`process.exit(${exitCode})`)
}

/* TEST SUITE */
describe('vue-sfcmod binary', () => {
  let consoleLogSpy
  let consoleErrSpy
  const search = jest.fn()

  beforeEach(() => {
    globbySync.mockImplementation((p) => (Array.isArray(p) ? p : [p]))
    cosmiconfigSync.mockImplementation(() => {
      return {
        search,
      }
    })
    search.mockImplementation(() => {
      return {
        config: null,
        isEmpty: false,
      }
    })

    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
    consoleErrSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    vol.reset()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  /* CLI Parameters */
  it('fails with usage instructions when no argument is passed', async () => {
    await runBinaryWithExit(1)
    expect(consoleErrSpy).toHaveBeenCalledWith('Missing required argument: transformation')
  })

  it('prints help when --help is passed', async () => {
    await runBinaryWithExit(0, '--help')
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringMatching(/^Usage: yarn \[file pattern\] -t \[transformation\]/),
    )
  })

  it('fails when the transformation module path is wrong', async () => {
    await expect(() => runBinary('Input.vue', '-t', 'foo')).rejects.toThrow(
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

    await expect(() =>
      runBinary(
        '--foo',
        'foo',
        '-t',
        '/tmp/transformation.cjs',
        '--bar=bar',
        '/tmp/Input.ts',
        '--flag',
      ),
    ).not.toThrow()
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
    prompt.mockReturnValueOnce({ preset: '/tmp/transformation.cjs' })
    search.mockImplementation(() => ({
      config: { presets: ['/tmp/transformation.cjs'] },
      filepath: 'mock-sfcmod.config.ts',
      isEmpty: false,
    }))

    await expect(() => runBinary('/tmp/Input.vue')).not.toThrow()
    expect(prompt).toHaveBeenCalled()
    expect(prompt).toHaveReturnedWith(
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

    await expect(() => runBinary('/tmp/Input.vue', '-t', '/tmp/transformation.cjs')).not.toThrow()
    expect(prompt).not.toHaveBeenCalled()
  })
})
