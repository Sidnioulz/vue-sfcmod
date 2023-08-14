import type { JSTransformation } from './JSTransformation'
import type { StyleTransformation } from './StyleTransformation'
import type { TemplateTransformation } from './TemplateTransformation'

export interface VueTransformation {
  /**
   * The transformation applied to HTML template content in an SFC.
   */
  readonly template?: TemplateTransformation

  /**
   * The transformation applied to script or script setup content in an SFC.
   */
  readonly script?: JSTransformation

  /**
   * The transformation applied to style template content in an SFC.
   * @todo Implement this.
   */
  readonly style?: StyleTransformation
}
