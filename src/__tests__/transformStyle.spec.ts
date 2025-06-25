import transformStyle from '~/transformStyle'
import type { StyleTransformation } from '~/types/StyleTransformation'
import type { TransformationBlock } from '~/types/TransformationBlock'

describe('transform', () => {
  describe('style', () => {
    const mockDescriptor: TransformationBlock = {
      content: '.foo { color: red; }',
      lang: 'css',
      start: 0,
      end: 20,
      map: undefined,
    }

    const mockPath = '/test/component.vue'
    const mockParams = {}

    test('should handle identity transform and return false', () => {
      const identityTransform: StyleTransformation = () => {}

      const result = transformStyle(identityTransform, mockDescriptor, mockPath, mockParams)

      expect(result).toBe(false)
      expect(mockDescriptor.content).toBe('.foo { color: red; }')
    })

    test('should handle simple selector transformation', () => {
      const selectorTransform: StyleTransformation = (fileInfo, { root }) => {
        root.walkRules((rule) => {
          if (rule.selector === '.foo') {
            // eslint-disable-next-line no-param-reassign
            rule.selector = '.bar'
          }
        })
      }

      const result = transformStyle(selectorTransform, mockDescriptor, mockPath, mockParams)

      expect(result).toBe(true)
      expect(mockDescriptor.content).toBe('.bar { color: red; }')
    })

    test('should handle property transformation', () => {
      const propertyTransform: StyleTransformation = (fileInfo, { root }) => {
        root.walkDecls('color', (decl) => {
          // eslint-disable-next-line no-param-reassign
          decl.value = 'blue'
        })
      }

      const testDescriptor = { ...mockDescriptor, content: '.foo { color: red; }' }
      const result = transformStyle(propertyTransform, testDescriptor, mockPath, mockParams)

      expect(result).toBe(true)
      expect(testDescriptor.content).toBe('.foo { color: blue; }')
    })

    test('should handle string return transformation', () => {
      const stringTransform: StyleTransformation = () => '.baz { background: green; }'

      const testDescriptor = { ...mockDescriptor }
      const result = transformStyle(stringTransform, testDescriptor, mockPath, mockParams)

      expect(result).toBe(true)
      expect(testDescriptor.content).toBe('.baz { background: green; }')
    })

    test('should handle root return transformation', () => {
      const rootTransform: StyleTransformation = (fileInfo, { postcss }) => {
        const newRoot = new postcss.Root()
        const rule = new postcss.Rule({ selector: '.transformed' })
        const decl = new postcss.Declaration({ prop: 'font-size', value: '16px' })
        rule.append(decl)
        newRoot.append(rule)

        return newRoot
      }

      const testDescriptor = { ...mockDescriptor }
      const result = transformStyle(rootTransform, testDescriptor, mockPath, mockParams)

      expect(result).toBe(true)
      expect(testDescriptor.content).toBe('.transformed {\n    font-size: 16px\n}')
    })

    test('should handle SCSS syntax', () => {
      const scssDescriptor: TransformationBlock = {
        content: '.foo { .bar { color: red; } }',
        lang: 'scss',
        start: 0,
        end: 28,
        map: undefined,
      }

      const nestedTransform: StyleTransformation = (fileInfo, { root }) => {
        root.walkRules('.bar', (rule) => {
          rule.walkDecls('color', (decl) => {
            // eslint-disable-next-line no-param-reassign
            decl.value = 'green'
          })
        })
      }

      const result = transformStyle(nestedTransform, scssDescriptor, mockPath, mockParams)

      expect(result).toBe(true)
      expect(scssDescriptor.content).toBe('.foo { .bar { color: green; } }')
    })

    test('should handle Less syntax', () => {
      const lessDescriptor: TransformationBlock = {
        content: '@color: red; .foo { color: @color; }',
        lang: 'less',
        start: 0,
        end: 35,
        map: undefined,
      }

      const variableTransform: StyleTransformation = (fileInfo, { root }) => {
        root.walkAtRules((atRule) => {
          if (atRule.name === 'color') {
            // eslint-disable-next-line no-param-reassign
            atRule.params = 'blue'
          }
        })
      }

      const result = transformStyle(variableTransform, lessDescriptor, mockPath, mockParams)

      expect(result).toBe(true)
      expect(lessDescriptor.content).toBe('@color: blue; .foo { color: @color; }')
    })

    test('should handle Vue scoped styles', () => {
      const scopedDescriptor: TransformationBlock = {
        content: '.foo[data-v-123] { color: red; }',
        lang: 'css',
        start: 0,
        end: 32,
        map: undefined,
      }

      const scopedTransform: StyleTransformation = (fileInfo, { root }) => {
        root.walkRules((rule) => {
          if (rule.selector.includes('[data-v-')) {
            // eslint-disable-next-line no-param-reassign
            rule.selector = rule.selector.replace(/\[data-v-\w+\]/, '[data-v-456]')
          }
        })
      }

      const result = transformStyle(scopedTransform, scopedDescriptor, mockPath, mockParams)

      expect(result).toBe(true)
      expect(scopedDescriptor.content).toBe('.foo[data-v-456] { color: red; }')
    })

    test('should handle CSS modules', () => {
      const moduleDescriptor: TransformationBlock = {
        content: ':local(.foo) { color: red; } :global(.bar) { color: blue; }',
        lang: 'css',
        start: 0,
        end: 58,
        map: undefined,
      }

      const moduleTransform: StyleTransformation = (fileInfo, { root }) => {
        root.walkRules((rule) => {
          if (rule.selector.includes(':local')) {
            // eslint-disable-next-line no-param-reassign
            rule.selector = rule.selector.replace(':local(.foo)', '.foo_abc123')
          }
        })
      }

      const result = transformStyle(moduleTransform, moduleDescriptor, mockPath, mockParams)

      expect(result).toBe(true)
      expect(moduleDescriptor.content).toBe(
        '.foo_abc123 { color: red; } :global(.bar) { color: blue; }',
      )
    })

    test('should handle custom pseudo-selectors', () => {
      const pseudoDescriptor: TransformationBlock = {
        content: '.foo:deep(.bar) { color: red; } .baz:slotted(span) { color: blue; }',
        lang: 'css',
        start: 0,
        end: 67,
        map: undefined,
      }

      const pseudoTransform: StyleTransformation = (fileInfo, { root }) => {
        root.walkRules((rule) => {
          // eslint-disable-next-line no-param-reassign
          rule.selector = rule.selector
            .replace(':deep', '::v-deep')
            .replace(':slotted', '::v-slotted')
        })
      }

      const result = transformStyle(pseudoTransform, pseudoDescriptor, mockPath, mockParams)

      expect(result).toBe(true)
      expect(pseudoDescriptor.content).toBe(
        '.foo::v-deep(.bar) { color: red; } .baz::v-slotted(span) { color: blue; }',
      )
    })

    test('should handle transformation with options', () => {
      const optionsTransform: StyleTransformation = (fileInfo, { root }, options) => {
        if (options?.newColor) {
          root.walkDecls('color', (decl) => {
            // eslint-disable-next-line no-param-reassign
            decl.value = options.newColor as string
          })
        }
      }

      const testDescriptor = { ...mockDescriptor, content: '.foo { color: red; }' }
      const result = transformStyle(optionsTransform, testDescriptor, mockPath, {
        newColor: 'purple',
      })

      expect(result).toBe(true)
      expect(testDescriptor.content).toBe('.foo { color: purple; }')
    })

    test('should return false when no transformation provided', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = transformStyle(null as any, mockDescriptor, mockPath, mockParams)

      expect(result).toBe(false)
    })

    test('should throw error for invalid CSS', () => {
      const invalidDescriptor: TransformationBlock = {
        content: '.foo { color: red',
        lang: 'css',
        start: 0,
        end: 17,
        map: undefined,
      }

      const transform: StyleTransformation = () => {}

      expect(() => {
        transformStyle(transform, invalidDescriptor, mockPath, mockParams)
      }).toThrow()
    })
  })
})
