// ------------------------------------------------------------- //
// This example transforms Tailwind CSS classes to use a new
// scale system in place of the old one. It only transforms class
// attributes within the template. Order of transformations
// matters here. Sometimes, new values overlap with old values,
// so we apply transforms in a specific order.
// ------------------------------------------------------------- //

const transformClass = require('../rename-class-in-setup/transformClass.cjs')

function transformer(ast, api) {
  const classAttributes = api.findAstAttributes(ast, ({ name }) => name === 'class')

  classAttributes.forEach((attr) =>
    api.updateAttribute(attr, ({ value }) => {
      if (!value) {
        return {}
      }

      return {
        value: transformClass(value.content),
      }
    }),
  )

  return ast
}

module.exports = {
  template: transformer,
}
