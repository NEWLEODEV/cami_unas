// https://nuxt.com/docs/api/configuration/nuxt-config

process.env.NUXT_PUBLIC_SUPABASE_URL = 'https://urtyfejykpkfkqueyjpz.supabase.co'
process.env.NUXT_PUBLIC_SUPABASE_KEY = 'sb_publishable_73OsN8qTuT603TF00UWVIA_kqoKn5Ls'
process.env.SUPABASE_URL = 'https://urtyfejykpkfkqueyjpz.supabase.co'
process.env.SUPABASE_KEY = 'sb_publishable_73OsN8qTuT603TF00UWVIA_kqoKn5Ls'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/supabase'
  ],
  supabase: {
    url: 'https://urtyfejykpkfkqueyjpz.supabase.co',
    key: 'sb_publishable_73OsN8qTuT603TF00UWVIA_kqoKn5Ls',
    redirect: false
  },
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  }
})
