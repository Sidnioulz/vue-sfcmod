module.exports = {
  style: function convertToColorVariables(fileInfo, { root, postcss }) {
    // Define color mappings - map actual colors to their variable names
    const colorMap = {
      '#333333': '--color-text-primary',
      '#666666': '--color-text-secondary',
      '#007bff': '--color-primary',
      '#0056b3': '--color-primary-dark',
      '#ffffff': '--color-background',
      '#e0e0e0': '--color-border',
      '#cccccc': '--color-disabled',
      white: '--color-background',
      'rgba(0, 0, 0, 0.1)': '--shadow-light',
    }

    // Only add variables if they don't already exist
    let rootRule = null
    root.walkRules(':root', (rule) => {
      rootRule = rule
    })

    if (!rootRule) {
      rootRule = new postcss.Rule({ selector: ':root' })

      // Create CSS custom properties with actual color values
      Object.entries(colorMap).forEach(([actualColor, varName]) => {
        const decl = new postcss.Declaration({
          prop: varName,
          value: actualColor,
        })
        rootRule.append(decl)
      })

      // Insert the :root rule at the beginning
      root.prepend(rootRule)
    }

    // Replace color values with CSS variable references (but not in the :root rule)
    root.walkDecls((decl) => {
      // Skip declarations inside :root rule to avoid circular references
      if (decl.parent.selector === ':root') {
        return
      }

      Object.entries(colorMap).forEach(([actualColor, varName]) => {
        if (decl.value === actualColor) {
          decl.value = `var(${varName})`
        }
      })
    })
  },
}
