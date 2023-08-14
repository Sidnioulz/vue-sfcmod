import type { Transform, Parser } from 'jscodeshift'

import type { JSTransformation } from './JSTransformation'
import type { VueTransformation } from './VueTransformation'

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
