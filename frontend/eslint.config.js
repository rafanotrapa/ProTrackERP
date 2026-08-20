import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],

      // Ukuran huruf ditulis sebagai piksel arbitrer sampai ada 929 kemunculan
      // di 61 berkas, dengan lima ukuran berbeda yang batasnya tidak pernah
      // disepakati. Sekarang semuanya memakai token di @theme pada index.css.
      // Aturan ini menjaganya: tanpa pagar, ukuran baru terus menyelinap masuk
      // lewat setiap komponen baru. Selektor kedua diperlukan karena sebagian
      // kelas hidup di dalam template literal dan string HTML SweetAlert, bukan
      // hanya di atribut className.
      'no-restricted-syntax': ['error',
        {
          selector: 'Literal[value=/text-\\[\\d+px\\]/]',
          message: 'Jangan pakai ukuran huruf piksel arbitrer. Pakai text-2xs / text-xs / text-sm, atau tambahkan token baru di @theme pada src/index.css.',
        },
        {
          selector: 'TemplateElement[value.raw=/text-\\[\\d+px\\]/]',
          message: 'Jangan pakai ukuran huruf piksel arbitrer. Pakai text-2xs / text-xs / text-sm, atau tambahkan token baru di @theme pada src/index.css.',
        },
      ],
    },
  },
])
