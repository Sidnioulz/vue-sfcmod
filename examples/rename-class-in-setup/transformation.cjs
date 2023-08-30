// ------------------------------------------------------------- //
// This example transforms Tailwind CSS classes to use a new
// scale system in place of the old one. It only transforms tw``
// references within the script, and shows that `<script setup>`
// is properly supported. Order of transformations matters here.
// Sometimes, new values overlap with old values, so we apply
// transforms in a specific order.
// ------------------------------------------------------------- //

const transformClass = require('./transformClass.cjs')

module.exports = function transformer(file, api) {
  const j = api.jscodeshift
  const root = j(file.source)

  root
    .find(j.TaggedTemplateExpression, {
      tag: {
        name: 'tw',
      },
    })
    .forEach((path) => {
      path.value.quasi.quasis.forEach((quasi) => {
        quasi.value.raw = transformClass(quasi.value.raw)
      })
    })

  return root.toSource()
}
