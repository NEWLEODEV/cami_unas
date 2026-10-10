// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/supabase'
  ],
  supabase: {
    redirect: false
  },
  runtimeConfig: {
    public: {
      supabase: {
        url: process.env.SUPABASE_URL || 'https://urtyfejykpkfkqueyjpz.supabase.co',
        key: process.env.SUPABASE_KEY || 'sb_publishable_73OsN8qTuT603TF00UWVIA_kqoKn5Ls',
      }
    }
  },
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  }
})
