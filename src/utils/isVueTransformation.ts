import type { VueTransformation } from '../types/VueTransformation'

export function isVueTransformation(obj: unknown): obj is VueTransformation {
  if (typeof obj !== 'object' || obj === null) {
    return false
  }

  return Object.keys(obj).every((key) => ['script', 'template', 'style'].includes(key))
}
