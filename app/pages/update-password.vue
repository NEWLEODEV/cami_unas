<script setup>
import { ref, watchEffect } from 'vue'

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const password = ref('')
const confirmPassword = ref('')
const errorMsg = ref('')
const successMsg = ref('')
const loading = ref(false)

// Sem layout, pois a tela ocupa tudo
definePageMeta({
  layout: false
})

const handleUpdatePassword = async () => {
  if (password.value !== confirmPassword.value) {
    errorMsg.value = 'As senhas não coincidem.'
    return
  }

  loading.value = true
  errorMsg.value = ''
  successMsg.value = ''

  const { error } = await supabase.auth.updateUser({
    password: password.value
  })

  if (error) {
    errorMsg.value = 'Erro ao atualizar senha: ' + error.message
  } else {
    successMsg.value = 'Senha atualizada com sucesso! Redirecionando...'
    setTimeout(() => {
      navigateTo('/login')
    }, 2000)
  }
  
  loading.value = false
}
</script>

<template>
  <div class="relative min-h-screen flex items-center justify-center bg-[url(https://www.transparenttextures.com/patterns/cubes.png)] bg-gradient-to-br from-brand-50 via-white to-brand-100 p-4">
    <div class="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-hover p-10 border border-white">
      <div class="text-center mb-10">
        <div class="flex justify-center mx-auto mb-8">
          <img src="/camis.png" alt="Camis" class="h-20 w-auto object-contain drop-shadow-md hover:scale-105 transition-transform duration-500" />
        </div>
        <h1 class="text-xl font-bold text-rose-950">Criar Nova Senha</h1>
        <p class="text-sm text-slate-500 mt-2">Digite sua nova senha abaixo para recuperar o acesso à sua conta.</p>
      </div>
      
      <div v-if="errorMsg" class="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center">
        {{ errorMsg }}
      </div>
      
      <div v-if="successMsg" class="mb-4 p-3 bg-emerald-50 text-emerald-600 rounded-lg text-sm text-center">
        {{ successMsg }}
      </div>

      <form class="space-y-6" @submit.prevent="handleUpdatePassword">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">Nova Senha</label>
          <input v-model="password" type="password" placeholder="••••••••" required class="w-full px-4 py-3 rounded-lg border border-surface-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors">
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">Confirmar Nova Senha</label>
          <input v-model="confirmPassword" type="password" placeholder="••••••••" required class="w-full px-4 py-3 rounded-lg border border-surface-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors">
        </div>
        
        <button type="submit" :disabled="loading" class="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors shadow-sm">
          {{ loading ? 'Salvando...' : 'Salvar Nova Senha' }}
        </button>
      </form>
      
    </div>
  </div>
</template>
