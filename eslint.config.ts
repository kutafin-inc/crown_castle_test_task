import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import playwright from 'eslint-plugin-playwright';
import prettier from 'eslint-config-prettier';
import tsEsLint from 'typescript-eslint';

export default tsEsLint.config(
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsEsLint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json',
      },
    },
    plugins: { '@typescript-eslint': tsPlugin },
    rules: {
      // JavaScript/ES6+ Best Practices
      'no-console': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',
      'prefer-arrow-callback': 'error',
      'prefer-template': 'error',
      'prefer-destructuring': ['error', { object: true, array: false }],
      'prefer-rest-params': 'error',
      'prefer-spread': 'error',
      'no-undef': 'off', // TS handles this
      'object-shorthand': 'error',
      'quote-props': ['error', 'as-needed'],
      'no-array-constructor': 'error',
      'array-callback-return': 'error',
      'no-loop-func': 'error',
      'no-new-func': 'error',
      'prefer-promise-reject-errors': 'error',
      'no-return-await': 'error',
      'require-await': 'error',
      'no-async-promise-executor': 'error',

      // TypeScript Specific Rules
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': ['warn', { allowExpressions: true }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/prefer-as-const': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/prefer-readonly': 'warn',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'interface', format: ['PascalCase'] },
        { selector: 'typeAlias', format: ['PascalCase'] },
        { selector: 'class', format: ['PascalCase'] },
      ],
    },
  },
  prettier,
  {
    // Playwright linting for tests
    files: ['tests/**/*.{ts,js}', 'src/**/*.{spec,test}.ts'],
    ...playwright.configs['flat/recommended'],
  },
  {
    ignores: [
      'node_modules',
      'dist',
      'tests-output',
      'tests-report',
      'playwright-report',
      'test-results',
    ],
  },
);
