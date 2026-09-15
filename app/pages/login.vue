<script setup>
import { Settings } from 'lucide-vue-next'
import { onMounted } from 'vue'

const supabase = useSupabaseClient()
const email = ref('')
const password = ref('')
const errorMsg = ref('')
const loading = ref(false)
const isAdminMode = ref(false)

const route = useRoute()

// Sem layout, pois a tela de login ocupa tudo
definePageMeta({
  layout: false
})

onMounted(() => {
  // Se veio redirecionado do admin, ativa o modo visual
  if (route.query.redirectTo && route.query.redirectTo.startsWith('/admin')) {
    isAdminMode.value = true
  }
})

const handleLogin = async () => {
  loading.value = true
  errorMsg.value = ''
  
  const { error } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value
  })

  if (error) {
    errorMsg.value = 'Falha no login. Verifique suas credenciais.'
  } else {
    if (isAdminMode.value) {
      navigateTo('/admin')
    } else {
      navigateTo('/')
    }
  }
  loading.value = false
}

const toggleAdminMode = () => {
  isAdminMode.value = true
}
</script>

<template>
  <div class="relative min-h-screen flex items-center justify-center bg-[url(https://www.transparenttextures.com/patterns/cubes.png)] bg-gradient-to-br from-brand-50 via-white to-brand-100 p-4">
    <!-- Ícone no canto superior direito da tela -->
    <div class="fixed top-6 right-6 sm:top-8 sm:right-8 z-50">
      <button v-if="!isAdminMode" @click="toggleAdminMode" class="block p-2 text-slate-400 hover:text-brand-600 transition-colors tooltip-left" data-tooltip="Painel Administrativo">
        <Settings class="w-6 h-6" />
      </button>
    </div>

    <div class="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-hover p-10 border border-white">
      <div class="text-center mb-10">
        <div class="flex justify-center mx-auto mb-8">
          <img src="/camis.png" alt="Camis" class="h-32 w-auto object-contain drop-shadow-md hover:scale-105 transition-transform duration-500" />
        </div>        
        <div v-if="isAdminMode" class="mt-4 inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full text-xs font-bold border border-slate-200 shadow-sm animate-pulse">
          <Settings class="w-3.5 h-3.5" /> Acesso Administrativo
        </div>
      </div>
      
      <div v-if="errorMsg" class="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center">
        {{ errorMsg }}
      </div>

      <form class="space-y-6" @submit.prevent="handleLogin">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">E-mail</label>
          <input v-model="email" type="email" placeholder="seu@email.com" required class="w-full px-4 py-3 rounded-lg border border-surface-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors">
        </div>
        
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">Senha</label>
          <input v-model="password" type="password" placeholder="••••••••" required class="w-full px-4 py-3 rounded-lg border border-surface-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors">
        </div>
        
        <button type="submit" :disabled="loading" class="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors shadow-sm">
          {{ loading ? 'Entrando...' : 'Entrar' }}
        </button>
      </form>
    </div>
  </div>
</template>
