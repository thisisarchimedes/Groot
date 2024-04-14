module.exports = {
  'env': {
    'es2021': true,
    'node': true,
  },
  'extends': [
    'eslint:recommended',
    'google',
    'plugin:@typescript-eslint/recommended',
    'plugin:mocha/recommended',
  ],
  'overrides': [
    {
      'env': {
        'node': true,
      },
      'files': [
        '.eslintrc.{js,cjs}',
      ],
      'parserOptions': {
        'sourceType': 'script',
      },
    },
  ],
  'parser': '@typescript-eslint/parser',
  'parserOptions': {
    'ecmaVersion': 'latest',
    'sourceType': 'module',
  },
  'plugins': [
    '@typescript-eslint',
    'promise',
    'mocha',
  ],
  'rules': {
    'complexity': ['error', 8],
    'require-await': 'error',
    'max-len': ['error', {'code': 120}],
    'require-jsdoc': 'off',
    'valid-jsdoc': 'off',
  },
  'ignorePatterns': ['test/**/*'],
};
