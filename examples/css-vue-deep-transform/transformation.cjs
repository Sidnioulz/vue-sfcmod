module.exports = {
  style: function transformVueSelectors(fileInfo, { root }) {
    // Transform Vue 3 deep and slotted selectors to Vue 2 syntax
    root.walkRules((rule) => {
      rule.selector = rule.selector
        // Convert :deep() to ::v-deep
        .replace(/:deep\(([^)]+)\)/g, '::v-deep $1')
        // Convert :slotted() to ::v-slotted
        .replace(/:slotted\(([^)]+)\)/g, '::v-slotted $1')
        // Normalize existing ::v-deep syntax
        .replace(/::v-deep\s*\(/g, '::v-deep ')
        .replace(/\)$/, '')
    })
  },
}
