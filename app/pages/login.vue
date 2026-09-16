<script setup>
import { onMounted, ref } from 'vue'

const supabase = useSupabaseClient()
const name = ref('')
const email = ref('')
const password = ref('')
const errorMsg = ref('')
const successMsg = ref('')
const loading = ref(false)
const isRegisterMode = ref(false)

const route = useRoute()

// Sem layout, pois a tela de login ocupa tudo
definePageMeta({
  layout: false
})

const handleAuth = async () => {
  loading.value = true
  errorMsg.value = ''
  successMsg.value = ''
  
  if (isRegisterMode.value) {
    // Modo Cadastro
    const { data, error } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
      options: {
        data: {
          name: name.value
        }
      }
    })

    if (error) {
      errorMsg.value = 'Falha no cadastro: ' + error.message
    } else {
      successMsg.value = 'Cadastro realizado! Verifique seu e-mail para confirmar a conta.'
      isRegisterMode.value = false // Volta para login
      password.value = ''
    }
  } else {
    // Modo Login
    const { error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value
    })

    if (error) {
      errorMsg.value = 'Falha no login. Verifique suas credenciais.'
    } else {
      navigateTo('/sobre')
    }
  }
  
  
  loading.value = false
}

const handleOAuth = async (provider) => {
  errorMsg.value = ''
  successMsg.value = ''
  
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: window.location.origin + '/sobre'
    }
  })

  if (error) {
    errorMsg.value = `Falha no login com ${provider}: ` + error.message
  }
}
</script>

<template>
  <div class="relative min-h-screen flex items-center justify-center bg-[url(https://www.transparenttextures.com/patterns/cubes.png)] bg-gradient-to-br from-brand-50 via-white to-brand-100 p-4">
    <div class="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-hover p-10 border border-white">
      <div class="text-center mb-10">
        <div class="flex justify-center mx-auto mb-8">
          <img src="/camis.png" alt="Camis" class="h-20 w-auto object-contain drop-shadow-md hover:scale-105 transition-transform duration-500" />
        </div>        
      </div>
      
      <div v-if="errorMsg" class="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center">
        {{ errorMsg }}
      </div>
      
      <div v-if="successMsg" class="mb-4 p-3 bg-emerald-50 text-emerald-600 rounded-lg text-sm text-center">
        {{ successMsg }}
      </div>

      <form class="space-y-6" @submit.prevent="handleAuth">
        <div v-if="isRegisterMode" class="animate-in fade-in slide-in-from-top-2 duration-300">
          <label class="block text-sm font-medium text-slate-700 mb-2">Nome</label>
          <input v-model="name" type="text" placeholder="Seu nome completo" required class="w-full px-4 py-3 rounded-lg border border-surface-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors">
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">E-mail</label>
          <input v-model="email" type="email" placeholder="seu@email.com" required class="w-full px-4 py-3 rounded-lg border border-surface-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors">
        </div>
        
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">Senha</label>
          <input v-model="password" type="password" placeholder="••••••••" required class="w-full px-4 py-3 rounded-lg border border-surface-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors">
        </div>
        
        <button type="submit" :disabled="loading" class="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors shadow-sm">
          {{ loading ? 'Aguarde...' : (isRegisterMode ? 'Cadastrar' : 'Entrar') }}
        </button>
      </form>
      
      <div class="text-center text-sm text-slate-500 mt-8">
        <button type="button" @click="isRegisterMode = !isRegisterMode" class="text-brand-600 hover:text-brand-700 font-bold transition-colors">
          {{ isRegisterMode ? 'Já tem uma conta? Faça login' : 'Não tem conta? Cadastre-se' }}
        </button>
      </div>


      
    </div>
  </div>
</template>
