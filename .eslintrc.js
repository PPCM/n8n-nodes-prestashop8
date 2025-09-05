module.exports = {
  root: true,
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'n8n-nodes-base'],
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'plugin:n8n-nodes-base/nodes',
  ],
  rules: {
    'n8n-nodes-base/node-dirname-against-convention': 'error',
    'n8n-nodes-base/node-class-description-inputs-wrong-regular-node': 'error',
    'n8n-nodes-base/node-class-description-outputs-wrong': 'error',
    'n8n-nodes-base/node-class-description-name-miscased': 'error',
  },
  ignorePatterns: ['dist/**', 'node_modules/**'],
};
