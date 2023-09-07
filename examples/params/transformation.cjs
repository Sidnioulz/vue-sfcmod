// ------------------------------------------------------------- //
// This example shows how parameters can be passed to a transformer.
// ------------------------------------------------------------- //

function template(ast, api, options) {
  const optKeys = Object.keys(options)
  if (optKeys.length === 0) {
    process.stderr.write(`Pass options to this example to test its behaviour, e.g. :
  
  yarn example params --root-heading 2

This example will read \`params.rootHeading\` to exploit the value.
`)
  } else {
    process.stderr.write(`
Received options:
${JSON.stringify(options, null, 2)}

`)

    if (options.rootHeading) {
      const newTopLevel = options.rootHeading
      if (typeof newTopLevel !== 'number' || newTopLevel < 1 || newTopLevel > 4) {
        throw new Error('Invalid option --root-heading: value must be a number between 1 and 4.')
      }

      const headings = api.exploreAst(
        ast,
        ({ tag, type }) => tag && tag.match(/h[1-6]/) && type === 1,
      )
      const oldTopLevel = headings
        .map((h) => Number(h.tag.replace('h', '')))
        .reduce((min, n) => Math.min(min, n), 6)
      const topLevelDiff = newTopLevel - oldTopLevel

      headings.forEach((h) => {
        const currentLevel = Number(h.tag.replace('h', ''))
        h.tag = `h${currentLevel + topLevelDiff}`
      })
    }
  }

  return ast
}

module.exports = {
  template,
}
