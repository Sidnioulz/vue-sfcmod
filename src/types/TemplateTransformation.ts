import type { RootNode } from '@vue/compiler-core'

import * as TemplateAPI from '~/template/api'

export type TemplateTransformation = (ast: RootNode, api: typeof TemplateAPI) => RootNode
