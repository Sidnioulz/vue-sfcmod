// ------------------------------------------------------------- //
// This example shows that TS files are supported, and that the
// script transform is applied to them.
// ------------------------------------------------------------- //

const transformer = require('../rename-class-in-setup/transformation.cjs')

module.exports = {
  script: transformer,
}
