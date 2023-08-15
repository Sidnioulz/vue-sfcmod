import { RawSourceMap, SourceMapGenerator } from 'source-map'

import { SFCBlock } from '../types/SFCBlock'
import { SFCDescriptor } from '../types/SFCDescriptor'
import { SFCParseOptions } from '../types/SFCParseOptions'

const splitRE = /\r?\n/g
const emptyRE = /^(?:\/\/)?\s*$/

function generateBlockSourceMap(
  filename: string,
  source: string,
  generated: string,
  sourceRoot: string,
  lineOffset: number,
): RawSourceMap {
  const map = new SourceMapGenerator({
    file: filename.replace(/\\/g, '/'),
    sourceRoot: sourceRoot.replace(/\\/g, '/'),
  })
  map.setSourceContent(filename, source)
  generated.split(splitRE).forEach((line, index) => {
    if (!emptyRE.test(line)) {
      const originalLine = index + 1 + lineOffset
      const generatedLine = index + 1
      for (let i = 0; i < line.length; i += 1) {
        if (!/\s/.test(line[i])) {
          map.addMapping({
            source: filename,
            original: {
              line: originalLine,
              column: i,
            },
            generated: {
              line: generatedLine,
              column: i,
            },
          })
        }
      }
    }
  })

  return JSON.parse(map.toString())
}

export function generateSourceMap(
  descriptor: SFCDescriptor,
  filename: string,
  source: string,
  sourceRoot: string,
  pad: SFCParseOptions['pad'],
) {
  const genWrapper = (block: SFCBlock | null) => {
    if (block && !block.src) {
      // eslint-disable-next-line no-param-reassign
      block.map = generateBlockSourceMap(
        filename,
        source,
        block.content,
        sourceRoot,
        !pad || block.type === 'template' ? block.loc.start.line - 1 : 0,
      )
    }
  }

  genWrapper(descriptor.template)
  genWrapper(descriptor.script)
  descriptor.styles.forEach(genWrapper)
  descriptor.customBlocks.forEach(genWrapper)
}
