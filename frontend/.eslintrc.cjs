
module.exports = {
  root: true,

  // Ignore generated files and dependencies
  ignorePatterns: [
    'dist/',
    'node_modules/',
    'coverage/',
  ],

  env: {
    browser: true,
    es2022: true,
  },

  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],

  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },

  plugins: ['react-refresh'],

  settings: {
    react: {
      version: 'detect',
    },
  },

  rules: {
    // React 17+ does not require React in JSX scope
    'react/react-in-jsx-scope': 'off',

    // PropTypes are not required for this project's current setup
    'react/prop-types': 'off',

    // Warn when exports may interfere with React Fast Refresh
    'react-refresh/only-export-components': 'warn',
  },
};
