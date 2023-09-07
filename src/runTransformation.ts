import { parse } from '@vue/compiler-sfc'

import { stringify as stringifySFC } from '~/stringifySfc'
import transformCode from '~/transformCode'
import transformStyle from '~/transformStyle'
import transformTemplate from '~/transformTemplate'
import type { FileInfo } from '~/types/FileInfo'
import type { JSTransformation } from '~/types/JSTransformation'
import type { StyleTransformation } from '~/types/StyleTransformation'
import type { TemplateTransformation } from '~/types/TemplateTransformation'
import type { TransformationBlock } from '~/types/TransformationBlock'
import type { TransformationModule } from '~/types/TransformationModule'
import type { Options } from '~/types/TransformationOptions'
import debug from '~/utils/debug'
import { normaliseTransformationModule } from '~/utils/normaliseTransformationModule'

export default function runTransformation(
  fileInfo: FileInfo,
  transformationModule: TransformationModule,
  params: Options = {},
) {
  const transformation = normaliseTransformationModule(transformationModule)

  debug('Analysing source file')

  const { path, source } = fileInfo
  const extension = (/\.([^.]*)$/.exec(path) || [])[0]

  if (extension === '.vue') {
    debug('Source file is Vue SFC')
    const { descriptor } = parse(source, { filename: path })
    const transformsToRun: {
      runner: (...args: unknown[]) => boolean
      descriptor: TransformationBlock
      transform: JSTransformation | StyleTransformation | TemplateTransformation
    }[] = []

    if (descriptor.scriptSetup && transformation.script) {
      debug('Planning to transform <script setup>')
      transformsToRun.push({
        runner: transformCode,
        transform: transformation.script,
        descriptor: descriptor.scriptSetup,
      })
    }
    if (descriptor.script && transformation.script) {
      debug('Planning to transform <script>')
      transformsToRun.push({
        runner: transformCode,
        transform: transformation.script,
        descriptor: descriptor.script,
      })
    }
    if (descriptor.template && transformation.template) {
      debug('Planning to transform <template>')
      transformsToRun.push({
        runner: transformTemplate,
        transform: transformation.template,
        descriptor: descriptor.template,
      })
    }
    if (descriptor.styles && transformation.style) {
      debug('Planning to transform <style>')
      for (let index = 0; index < descriptor.styles.length; index += 1) {
        transformsToRun.push({
          runner: transformStyle,
          transform: transformation.style,
          descriptor: descriptor.styles[index],
        })
      }
    }

    const hasChanges = transformsToRun.reduce((previouslyHadChanges, current) => {
      const currentHasChanges = current.runner(current.transform, current.descriptor, path, params)

      return previouslyHadChanges || currentHasChanges
    }, false)

    return hasChanges ? stringifySFC(descriptor) : fileInfo.source
  }
  if (!transformation.script) {
    throw new Error(
      'When passing a non-Vue file, a JavaScript transformation function must be provided.',
    )
  }

  transformCode(
    transformation.script,
    {
      type: 'script',
      get content() {
        return fileInfo.source
      },
      set content(out: string) {
        // eslint-disable-next-line no-param-reassign
        fileInfo.source = out
      },
      attrs: {},
      lang: extension?.slice(1),
    },
    path,
    params,
  )

  return fileInfo.source
}
