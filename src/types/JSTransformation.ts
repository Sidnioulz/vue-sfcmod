import type { Transform, Parser } from 'jscodeshift'

export type JSTransformation = Transform & {
  parser?: string | Parser
}
