// ------------------------------------------------------------- //
// This example transforms Tailwind CSS classes to use a new
// scale system in place of the old one. It only transforms tw``
// references within the script, and shows that `<script setup>`
// is properly supported. Order of transformations matters here.
// Sometimes, new values overlap with old values, so we apply
// transforms in a specific order.
// ------------------------------------------------------------- //

const classMap = [
  ['6', 24],
  ['5', 20],
  ['4', 16],
  ['3', 12],
  ['2', 8],
  ['1', 4],
  ['[2.5rem]', 40],
]

function escapeRegex(klass) {
  return klass.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&')
}

function preserveClass(klass) {
  return [/^flex/, /^border/].some((kw) => klass.match(kw))
}

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
        quasi.value.raw = quasi.value.raw
          .split(' ')
          .map((klass) =>
            classMap.reduce((acc, [oldClass, newClass]) => {
              return preserveClass(klass)
                ? klass
                : acc.replace(new RegExp(`-${escapeRegex(oldClass)}$`), `-${newClass}`)
            }, klass),
          )
          .join(' ')
      })
    })

  return root.toSource()
}
