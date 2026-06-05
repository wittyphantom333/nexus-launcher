require('@electron-toolkit/eslint-config-ts/eslint.config.mjs')

module.exports = {
  extends: [
    '@electron-toolkit/eslint-config-ts',
    '@electron-toolkit/eslint-config-prettier'
  ],
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'warn'
  }
}
