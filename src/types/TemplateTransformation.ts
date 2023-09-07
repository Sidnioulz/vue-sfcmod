import type { RootNode } from '@vue/compiler-core'

import * as TemplateAPI from '~/template/api'
import type { Options } from '~/types/TransformationOptions'

export type TemplateTransformation = (
  ast: RootNode,
  api: typeof TemplateAPI,
  options: Options,
) => RootNode
