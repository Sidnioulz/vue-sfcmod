module.exports = {
  style: function prefixClasses(fileInfo, { root }, options) {
    const prefix = options?.prefix || 'app-'
    const cleanedPrefix = prefix.replace('-', '')

    // Transform class selectors
    root.walkRules((rule) => {
      rule.selector = rule.selector.replace(/\.([a-zA-Z][\w-]*)/g, (match, className) => {
        // Don't prefix if it already has the prefix
        if (className.startsWith(cleanedPrefix)) {
          return match
        }
        return `.${prefix}${className}`
      })
    })
  },
}
