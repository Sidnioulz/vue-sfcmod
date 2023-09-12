import fs from 'fs'

import { cosmiconfig } from 'cosmiconfig'
import { TypeScriptLoader } from 'cosmiconfig-typescript-loader'
import createDebug from 'debug'
import fuzzy from 'fuzzy'
import { globbySync } from 'globby'
import inquirer from 'inquirer'
import inquirerPrompt from 'inquirer-autocomplete-prompt'
import yargs from 'yargs'

import { isValidConfig } from '~/config.schema'
import { runTransformation } from '~/runTransformation'
import type { Options } from '~/types/TransformationOptions'
import { loadModuleFromPath } from '~/utils/loadModuleFromPath'

/* Find a transform to run and run it on input files. */
export async function main() {
  /* Init logger and inquirer. */
  inquirer.registerPrompt('autocomplete', inquirerPrompt)
  const debug = createDebug('vue-sfcmod')

  /* Load config file. */
  const explorer = cosmiconfig('sfcmod', {
    loaders: {
      '.ts': TypeScriptLoader(),
    },
  })
  const configResult = await explorer.search()
  let config
  if (configResult === null) {
    debug('No config file found.')
  } else if (configResult.isEmpty) {
    debug(`A config file was found but is empty: ${configResult.filepath}`)
  } else {
    debug(`Using config file: ${configResult.filepath}`)
    config = configResult.config
  }

  /* If config.presets is set, compute list of preset transforms. */
  let presets: { name: string; value: string }[] = []
  if (isValidConfig(config) && Array.isArray(config.presets)) {
    presets = config.presets
      .map((presetItem) => {
        const pathsToInclude = globbySync(
          typeof presetItem === 'object' ? presetItem.glob : presetItem,
        )

        return pathsToInclude.map((value) => ({
          name: typeof presetItem === 'object' ? presetItem.name(value) : value,
          value,
        }))
      })
      .flat()
  }

  /* Process CLI args. */
  const yargsChain = yargs()
    .usage('Usage: $0 [file pattern] -t [transformation]')
    .option('transformation', {
      alias: 't',
      type: 'string',
      describe: 'Name or path of the transformation module',
    })
    .help()

  if (!presets.length) {
    yargsChain.demandOption('transformation')
  }

  const {
    _: files,
    transformation: transformationName,
    ...allOptions
  } = yargsChain.parseSync(process.argv.slice(2))

  /* Compute transformation params. */
  const params: Options = {}
  for (const optKey of Object.keys(allOptions)) {
    if (optKey !== 't' && optKey !== '$0' && !optKey.match(/-[a-z]/)) {
      params[optKey] = allOptions[optKey]
    }
  }

  /* Load arbitrary transformation module path or ask the user if not found. */
  let transformationModule
  if (transformationName) {
    transformationModule = await loadModuleFromPath(transformationName)
  } else {
    const answer = await inquirer.prompt({
      // @ts-expect-error TS does not recognise `type: 'autocomplete'` which would be cumbersome to shim.
      type: 'autocomplete',
      name: 'preset',
      message: 'Preset transformation to run: ',
      pageSize: 20,
      source: async (_: unknown, input?: string) => {
        if (input === undefined || input === '') {
          return presets
        }

        const matches = fuzzy
          .filter(input || '', presets, {
            extract: (el: { name: string }) => el.name,
          })
          .map((el: { string: string }) => el.string)

        return presets.filter(({ name }) => matches.includes(name))
      },
    })

    transformationModule = await loadModuleFromPath(answer.preset)
  }

  /* Start running. */
  const resolvedPaths = globbySync(files as string[])
  process.stdout.write(`Processing ${resolvedPaths.length} files…\n`)

  for (const p of resolvedPaths) {
    debug(`Processing ${p}…`)
    const fileInfo = {
      path: p,
      source: fs.readFileSync(p).toString(),
    }
    try {
      const result = runTransformation(fileInfo, transformationModule, params)
      fs.writeFileSync(p, result)
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e)
    }
  }
}
