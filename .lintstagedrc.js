export default {
  '*.{js,jsx,ts,tsx,cjs}': ['pnpm lint:eslint:staged', 'pnpm format:staged'],
  '*.{json,md,scss,css,html,yml}': ['pnpm format:fix'],
}
