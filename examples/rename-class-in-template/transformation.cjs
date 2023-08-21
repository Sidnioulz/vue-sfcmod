// ------------------------------------------------------------- //
// This example transforms Tailwind CSS classes to use a new
// scale system in place of the old one. It only transforms class
// attributes within the template. Order of transformations
// matters here. Sometimes, new values overlap with old values,
// so we apply transforms in a specific order.
// ------------------------------------------------------------- //

// const classMap = [
//   ['6', 24],
//   ['5', 20],
//   ['4', 16],
//   ['3', 12],
//   ['2', 8],
//   ['1', 4],
//   ['[2.5rem]', 40],
// ]

// function escapeRegex(klass) {
//   return klass.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&')
// }

// function preserveClass(klass) {
//   return [/^flex/, /^border/].some((kw) => klass.match(kw))
// }

function transformer(file) {
  // TODO
  return file.source
}

module.exports = {
  template: transformer,
}
