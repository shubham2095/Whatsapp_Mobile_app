const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // '@/…' is resolved by Metro via jsconfig.json, which eslint-plugin-import can't read.
    rules: { 'import/no-unresolved': ['error', { ignore: ['^@/'] }] },
  },
  { ignores: ['dist/*', '.expo/*'] },
]);
