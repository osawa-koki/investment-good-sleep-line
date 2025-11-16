import love from 'eslint-config-love'
import reactPlugin from 'eslint-plugin-react'
import nextPlugin from '@next/eslint-plugin-next'

export default [
  {
    ignores: [
      '.next/**',
      'build/**',
      'dist/**',
      'out/**',
      'next-env.d.ts',
      'node_modules/**',
      'playwright.config.ts'
    ]
  },
  {
    ...love,
    files: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx']
  },
  {
    files: ['**/*.jsx', '**/*.tsx'],
    plugins: {
      react: reactPlugin,
      '@next/next': nextPlugin
    },
    settings: {
      react: {
        version: 'detect'
      }
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      // プロジェクト固有のルール緩和
      'max-lines': ['error', { max: 800, skipBlankLines: true, skipComments: true }],
      'complexity': ['error', { max: 15 }],
      '@typescript-eslint/max-params': ['error', { max: 6 }],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-negated-condition': 'off',
      '@typescript-eslint/prefer-destructuring': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/no-unsafe-type-assertion': 'off',
      'new-cap': ['error', { capIsNewExceptions: ['jsPDF'] }]
    }
  }
]
