import fs from 'fs'
import path from 'path'

import type { TransformationModule } from '~/types/TransformationModule'
import debug from '~/utils/debug'

export function loadModuleFromPath(nameOrPath: string): Promise<TransformationModule> {
  debug(`Loading transformation module ${nameOrPath}`)

  const customModulePath = path.resolve(process.cwd(), nameOrPath)
  debug(`Resolved to ${customModulePath}`)

  if (fs.existsSync(customModulePath)) {
    debug('Module exists on filesystem')

    return import(customModulePath)
  }

  throw new Error(`Cannot find transformation module ${nameOrPath}`)
}
