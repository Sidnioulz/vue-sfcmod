function getPathForImportName(name) {
  // Rev* imports are components.
  if (name.startsWith('Rev')) {
    return `@new-name/components/${name.replace('Rev', '')}`
  }

  // Icon* imports are icons.
  if (name.startsWith('Icon')) {
    return `@new-name/icons/${name}`
  }

  switch (name) {
    case 'icons':
      return '@new-name/main'
    case 'illustrationPlugin':
      return '@new-name/plugins/illustration'
    case 'localePlugin':
      return '@new-name/plugins/locale'
    case 'emitter':
      return '@new-name/utils/tracking'
    case 'getPhoneNumberToE164':
    case 'getPhoneNumberInfos':
    case 'validPhoneNumber':
      return '@new-name/components/InputPhone'
    case 'makeValidate':
    case 'matchingRegExp':
    case 'maxLength':
    case 'minLength':
    case 'required':
    case 'FORM_VALID':
      return '@new-name/components/Form'
    case 'closeModal':
    case 'openModal':
      return '@new-name/components/ModalBase'
    case 'resetForm':
    case 'setFormErrors':
    case 'setFormValues':
    case 'submitForm':
      return '@new-name/components/Form/Form.actions'
    default:
      throw new Error(`Missing import name in codemod script: ${name}`)
  }
}

module.exports = function transformer(file, api) {
  const j = api.jscodeshift
  const root = j(file.source)

  // split @orgname/old-package imports
  root
    .find(j.ImportDeclaration)
    .filter((node) => node.value.source.value === '@orgname/old-package')
    .find(j.ImportSpecifier)
    .forEach((path) => {
      const localName = path.value.local.name

      // insert a new import with the corrected import path
      j(path.parent).insertAfter(
        j.importDeclaration(
          [j.importSpecifier(j.identifier(localName))],
          j.literal(getPathForImportName(localName)),
        ),
      )

      // the new import has been created, we can remove the original one
      j(path).remove()
    })

  // rewrite dynamic imports
  root
    .find(j.ImportExpression)
    .filter((node) => node.value.source.value?.startsWith('@orgname/old-package/dist/ssr'))
    .forEach((path) => {
      const localName = path.value.source.value.split('/').at(-1)
      const correctedPath = getPathForImportName(localName)

      path.replace(j.importExpression(j.literal(correctedPath)), j.literal(localName))
    })

  // remove empty @orgname/old-package imports
  root
    .find(j.ImportDeclaration)
    .filter((node) => node.value.source.value === '@orgname/old-package')
    .filter((node) => node.value.specifiers.length === 0)
    .remove()

  // rewrite jest.mock statements
  root
    .find(j.ExpressionStatement, {
      expression: {
        callee: {
          object: {
            name: 'jest',
          },
          property: {
            name: 'mock',
          },
        },
        arguments: [{ value: '@orgname/old-package' }],
      },
    })
    .forEach((path) => {
      const arrowFunction = path.value.expression.arguments[1]

      if (arrowFunction?.body.type === 'ObjectExpression') {
        /**
         * Build a mapping between new path to use and an array of the related imports
         *
         * @example
         * {
         *   '@new-name/components/ModalBase': ['openModal', 'closeModal']
         * }
         */
        const mockedExports = arrowFunction.body.properties
          .filter((property) => property.type === 'Property')
          .reduce((acc, property) => {
            const exportName = property.key.name
            const exportPath = getPathForImportName(exportName)

            const i = acc[exportPath] || []

            return { ...acc, [exportPath]: [...i, exportName] }
          }, {})

        // For each new path to use we create a new jes.mock statement
        Object.entries(mockedExports).forEach(([exportPath, exportNames]) => {
          /**
           * Build the body of the arrow function in the mocked import
           *
           * @example
           * {
           *  ...jest.requireActual('@new-name/components/Modal')
           *  closeModal: jest.fn()
           * }
           */
          const mockedProperties = arrowFunction.body.properties.reduce((acc, curr) => {
            if (curr.type === 'SpreadElement') {
              // we rewrite the import path in the spread element ...jest.requireActual('@orgname/old-package')
              acc.push(
                j.spreadElement(j.callExpression(curr.argument.callee, [j.literal(exportPath)])),
              )
            } else if (curr.key && exportNames.includes(curr.key.name)) {
              acc.push(curr)
            }

            return acc
          }, [])

          /**
           * Build the full mocked import
           *
           * @example
           * jest.mock('@new-name/components/Modal', () => ({
           *  ...jest.requireActual('@new-name/components/Modal')
           *  closeModal: jest.fn()
           * }))
           */
          const newArguments = [
            j.literal(exportPath),
            {
              ...path.value.expression.arguments[1],
              body: j.objectExpression(mockedProperties),
            },
          ]

          const newNode = j.expressionStatement(
            j.callExpression(path.value.expression.callee, newArguments),
          )
          j(path).insertAfter(newNode)
        })
      } else {
        console.error(path)
        console.error(
          'Please contact the codemod developers with a link to your branch, so they can analyse your code and adjust the codemod.',
        )
        process.exit(-1)
      }
      // the mocked exports has been created, we can remove the original one

      j(path).remove()
    })

  return root.toSource()
}
