#!/usr/bin/env node

import * as fs from 'fs'
import * as path from 'path'

import createDebug from 'debug'
import { globbySync } from 'globby'
import yargs from 'yargs'

import runTransformation from '~/runTransformation'
import type { Options } from '~/types/TransformationOptions'

const debug = createDebug('vue-sfcmod')
// eslint-disable-next-line no-console
const log = console.log.bind(console)

const {
  _: files,
  transformation: transformationName,
  ...allOptions
} = yargs()
  .usage('Usage: $0 [file pattern] -t [transformation]')
  .option('transformation', {
    alias: 't',
    type: 'string',
    describe: 'Name or path of the transformation module',
  })
  .demandOption('transformation')
  .help()
  .parseSync(process.argv.slice(2))

function loadTransformationModule(nameOrPath: string) {
  const customModulePath = path.resolve(process.cwd(), nameOrPath)
  if (fs.existsSync(customModulePath)) {
    return import(`${process.env.PWD}/${nameOrPath}`)
  }

  throw new Error(`Cannot find transformation module ${nameOrPath}`)
}

async function main() {
  const resolvedPaths = globbySync(files as string[])
  const transformationModule = await loadTransformationModule(transformationName)

  const params: Options = {}
  for (const optKey of Object.keys(allOptions)) {
    if (optKey !== 't' && optKey !== '$0' && !optKey.match(/-[a-z]/)) {
      params[optKey] = allOptions[optKey]
    }
  }

  log(`Processing ${resolvedPaths.length} files…`)

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

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exit(1)
})
