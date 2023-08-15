export default {
  '*.{js,jsx,ts,tsx}': ['yarn lint:eslint:staged', 'yarn format:staged'],
  '*.{json,md,scss,css,html,yml}': ['yarn format:fix'],
}
