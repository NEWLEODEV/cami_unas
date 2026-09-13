<script setup>
const supabase = useSupabaseClient()
const email = ref('')
const password = ref('')
const errorMsg = ref('')
const loading = ref(false)

// Sem layout, pois a tela de login ocupa tudo
definePageMeta({
  layout: false
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
    navigateTo('/')
  }
  loading.value = false
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-[url(https://www.transparenttextures.com/patterns/cubes.png)] bg-gradient-to-br from-brand-50 via-white to-brand-100 p-4">
    <div class="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-hover p-10 border border-white">
      <div class="text-center mb-10">
        <div class="flex justify-center mx-auto mb-8">
          <img src="/camis.png" alt="Camis" class="h-32 w-auto object-contain drop-shadow-md hover:scale-105 transition-transform duration-500" />
        </div>
        <p class="text-brand-400 mt-1 font-medium">Coleção</p>
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
