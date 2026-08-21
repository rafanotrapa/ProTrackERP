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

        // Panggilan t() ditulis sebagai {t('...')} di dalam string HTML SweetAlert
        // dan tidak pernah dievaluasi, sehingga kurung kurawalnya tampil MENTAH di
        // layar pengguna. Bentuk itu hanya berlaku di JSX; di dalam template
        // literal yang benar adalah ${t('...')}, dan kalau posisinya sebagai nilai
        // atribut HTML hasilnya harus dikutip: placeholder="${t('...')}".
        //
        // Sudah pernah terjadi diam-diam di 6 berkas sekaligus dan baru ketahuan
        // dari screenshot produksi. TemplateElement dipakai karena di situlah
        // kasusnya hidup; quasi sebuah `${t(...)}` yang benar tidak pernah memuat
        // '{t(' sehingga penulisan yang betul tidak ikut tertangkap.
        {
          selector: 'TemplateElement[value.raw=/\\{t\\(/]',
          message: "Di dalam template literal, t() harus ditulis dengan awalan dolar: ${ t('kunci') }. Bentuk JSX { t('kunci') } tidak dievaluasi di sini dan akan tampil mentah di layar.",
        },
        {
          selector: 'Literal[value=/\\{t\\(/]',
          message: "String ini memuat pemanggilan t() berkurung kurawal yang tidak akan pernah diterjemahkan. Pakai t('kunci') sebagai ekspresi, atau beri awalan dolar kalau ini template literal.",
        },
      ],
    },
  },
])
