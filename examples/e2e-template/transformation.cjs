// ------------------------------------------------------------- //
// This example is an end-to-end test of the template stringifier.
// It does not transform anything, but just shows what the
// template stringifier can handle.
// ------------------------------------------------------------- //

function transformer(ast) {
  return ast
}

module.exports = {
  template: transformer,
}
