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

function transformClass(klassString) {
  return klassString
    .split(' ')
    .map((klass) =>
      classMap.reduce((acc, [oldClass, newClass]) => {
        return preserveClass(klass)
          ? klass
          : acc.replace(new RegExp(`-${escapeRegex(oldClass)}$`), `-${newClass}`)
      }, klass),
    )
    .join(' ')
}

module.exports = transformClass
