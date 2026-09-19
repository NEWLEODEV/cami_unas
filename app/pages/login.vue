<script setup>
import { onMounted, ref } from 'vue'
import { ArrowLeft, Eye, EyeOff } from 'lucide-vue-next'

const supabase = useSupabaseClient()
const name = ref('')
const email = ref('')
const password = ref('')
const city = ref('')
const state = ref('')
const phone = ref('')
const errorMsg = ref('')
const successMsg = ref('')
const loading = ref(false)
const isRegisterMode = ref(false)
const isForgotPasswordMode = ref(false)
const showPassword = ref(false)

const route = useRoute()
const user = useSupabaseUser()

watchEffect(() => {
  if (user.value) {
    navigateTo('/')
  }
})

// Sem layout, pois a tela de login ocupa tudo
definePageMeta({
  layout: false
})

const handleAuth = async () => {
  loading.value = true
  errorMsg.value = ''
  successMsg.value = ''
  
  if (isForgotPasswordMode.value) {
    const { error } = await supabase.auth.resetPasswordForEmail(email.value, {
      redirectTo: window.location.origin + '/update-password',
    })
    if (error) {
      errorMsg.value = 'Falha ao enviar e-mail: ' + error.message
    } else {
      successMsg.value = 'Link de recuperação enviado! Verifique sua caixa de entrada.'
    }
  } else if (isRegisterMode.value) {
    // Modo Cadastro
    const { data, error } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
      options: {
        data: {
          name: name.value,
          city: city.value,
          state: state.value,
          phone: phone.value
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
      errorMsg.value = 'Falha no login: ' + error.message
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
      redirectTo: window.location.origin + '/'
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
        <div v-if="isRegisterMode && !isForgotPasswordMode" class="animate-in fade-in slide-in-from-top-2 duration-300 space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">Nome Completo</label>
            <input v-model="name" type="text" placeholder="Seu nome completo" required class="w-full px-4 py-3 rounded-lg border border-surface-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors">
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">Cidade</label>
              <input v-model="city" type="text" placeholder="Ex: São Paulo" required class="w-full px-4 py-3 rounded-lg border border-surface-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors">
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">Estado</label>
              <input v-model="state" type="text" placeholder="Ex: SP" maxlength="2" required class="w-full px-4 py-3 rounded-lg border border-surface-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors uppercase">
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">Telefone / WhatsApp</label>
            <input v-model="phone" type="tel" placeholder="(11) 99999-9999" required class="w-full px-4 py-3 rounded-lg border border-surface-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors">
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">E-mail</label>
          <input v-model="email" type="email" placeholder="seu@email.com" required class="w-full px-4 py-3 rounded-lg border border-surface-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors">
        </div>
        
        <div v-if="!isForgotPasswordMode">
          <label class="block text-sm font-medium text-slate-700 mb-2">Senha</label>
          <div class="relative">
            <input v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="••••••••" required class="w-full px-4 py-3 pr-12 rounded-lg border border-surface-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors">
            <button type="button" @click="showPassword = !showPassword" class="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-brand-600 transition-colors rounded-full hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-brand-500">
              <EyeOff v-if="showPassword" class="w-5 h-5" />
              <Eye v-else class="w-5 h-5" />
            </button>
          </div>
          <div class="flex justify-end mt-2">
            <button v-if="!isRegisterMode" type="button" @click="isForgotPasswordMode = true" class="text-xs text-brand-600 hover:text-brand-700 font-bold transition-colors">Esqueceu a senha?</button>
          </div>
        </div>
        
        <button type="submit" :disabled="loading" class="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors shadow-sm">
          {{ loading ? 'Aguarde...' : (isForgotPasswordMode ? 'Enviar link de recuperação' : (isRegisterMode ? 'Cadastrar' : 'Entrar')) }}
        </button>
      </form>
      
      <div class="text-center text-sm text-slate-500 mt-8 space-y-3">
        <button v-if="isForgotPasswordMode" type="button" @click="isForgotPasswordMode = false" class="text-brand-600 hover:text-brand-700 font-bold transition-colors block mx-auto">
          Voltar para o Login
        </button>
        <button v-else type="button" @click="isRegisterMode = !isRegisterMode" class="text-brand-600 hover:text-brand-700 font-bold transition-colors block mx-auto">
          {{ isRegisterMode ? 'Já tem uma conta? Faça login' : 'Não tem conta? Cadastre-se' }}
        </button>
      </div>

      <div class="mt-6 pt-6 border-t border-slate-100 flex justify-center">
        <NuxtLink to="/" class="flex items-center gap-2 text-sm text-slate-400 hover:text-brand-600 transition-colors font-medium">
          <ArrowLeft class="w-4 h-4" />
          Voltar para a Home como visitante
        </NuxtLink>
      </div>
      
    </div>
  </div>
</template>
