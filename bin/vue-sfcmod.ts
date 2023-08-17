#!/usr/bin/env node

import * as fs from 'fs'
import Module from 'module'
import * as path from 'path'

import createDebug from 'debug'
import { globbySync } from 'globby'
import yargs from 'yargs'

import { runTransformation } from 'vue-sfcmod'

const debug = createDebug('vue-sfcmod')
// eslint-disable-next-line no-console
const log = console.log.bind(console)

const {
  _: files,
  transformation: transformationName,
  params,
} = yargs()
  .usage('Usage: $0 [file pattern]')
  .option('transformation', {
    alias: 't',
    type: 'string',
    describe: 'Name or path of the transformation module',
  })
  .option('params', {
    alias: 'p',
    describe: 'Custom params to the transformation',
  })
  .demandOption('transformation')
  .help()
  .parseSync(process.argv.slice(2))

function loadTransformationModule(nameOrPath: string) {
  const customModulePath = path.resolve(process.cwd(), nameOrPath)
  if (fs.existsSync(customModulePath)) {
    const requireFunc = Module.createRequire(path.resolve(process.cwd(), './package.json'))

    // TODO: interop with ES module
    // TODO: fix absolute path
    return requireFunc(`./${nameOrPath}`)
  }

  throw new Error(`Cannot find transformation module ${nameOrPath}`)
}

// TODO: port the `Runner` interface of jscodeshift
async function main() {
  const resolvedPaths = globbySync(files as string[])
  const transformationModule = loadTransformationModule(transformationName)

  log(`Processing ${resolvedPaths.length} files…`)

  for (const p of resolvedPaths) {
    debug(`Processing ${p}…`)
    const fileInfo = {
      path: p,
      source: fs.readFileSync(p).toString(),
    }
    try {
      const result = runTransformation(fileInfo, transformationModule, params as object)
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
