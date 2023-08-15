import { ElementNode, CompilerError } from '@vue/compiler-core'

export function createDuplicateBlockError(node: ElementNode, isScriptSetup = false): CompilerError {
  const err = new SyntaxError(
    `Single file component can contain only one <${node.tag}${
      isScriptSetup ? ' setup' : ''
    }> element`,
  ) as CompilerError
  err.loc = node.loc

  return err
}
