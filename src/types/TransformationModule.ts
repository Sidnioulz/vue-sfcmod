import type { Transform, Parser } from 'jscodeshift'

import type { JSTransformation } from '~/types/JSTransformation'
import type { VueTransformation } from '~/types/VueTransformation'

export type JSTransformationModule =
  | JSTransformation
  | {
      default: Transform
      parser?: string | Parser
    }

export type VueTransformationModule =
  | VueTransformation
  | {
      default: VueTransformation
    }

export type TransformationModule = JSTransformationModule | VueTransformationModule
