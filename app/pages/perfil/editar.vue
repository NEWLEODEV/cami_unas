<script setup>
import { ref, onMounted } from 'vue'
import { ArrowLeft, Lock, Save, User, MapPin, Phone, EyeOff, Eye } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()
const { showAlert } = useDialog()

definePageMeta({
  layout: false,
  middleware: 'auth'
})

// Estados de Segurança
const isVerified = ref(false)
const verifying = ref(false)
const passwordInput = ref('')
const showPassword = ref(false)

// Estados de Perfil
const loading = ref(true)
const saving = ref(false)
const form = ref({
  name: '',
  city: '',
  state: '',
  phone: ''
})

onMounted(async () => {
  if (user.value) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.value.id)
      .single()
      
    if (!error && data) {
      form.value = {
        name: data.name || '',
        city: data.city || '',
        state: data.state || '',
        phone: data.phone || ''
      }
    }
  }
  loading.value = false
})

const verifyPassword = async () => {
  if (!passwordInput.value) {
    await showAlert('Atenção', 'Digite sua senha atual para continuar.')
    return
  }

  verifying.value = true
  const { error } = await supabase.auth.signInWithPassword({
    email: user.value.email,
    password: passwordInput.value
  })

  verifying.value = false

  if (error) {
    await showAlert('Acesso Negado', 'Senha incorreta. Tente novamente.')
    passwordInput.value = ''
  } else {
    isVerified.value = true
  }
}

const saveProfile = async () => {
  if (!form.value.name) {
    await showAlert('Atenção', 'O nome é obrigatório.')
    return
  }
  
  saving.value = true
  
  // Resgata o usuário logado de forma absoluta direto da sessão do Supabase (ignorando proxies reativos)
  const { data: authData, error: authError } = await supabase.auth.getUser()
  
  if (authError || !authData?.user?.id) {
    saving.value = false
    await showAlert('Erro', 'Sessão inválida. Por favor, faça login novamente.')
    return
  }

  const userId = authData.user.id

  // 1. Atualiza ou Cria a tabela profiles (usamos upsert porque o seu perfil estava faltando no banco)
  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      name: form.value.name,
      city: form.value.city,
      state: form.value.state,
      phone: form.value.phone
    })

  // 2. Opcional: Atualiza também os metadados do Auth, para consistência global
  await supabase.auth.updateUser({
    data: {
      name: form.value.name,
      city: form.value.city,
      state: form.value.state,
      phone: form.value.phone
    }
  })

  saving.value = false

  if (error) {
    console.error(error)
    await showAlert('Erro', 'Ocorreu um erro ao salvar seu perfil: ' + error.message)
  } else {
    await showAlert('Sucesso!', 'Seu perfil foi atualizado com sucesso.')
    router.push('/perfil')
  }
}
</script>

<template>
  <NuxtLayout name="default">
    <template #header-left>
      <div class="flex items-center gap-3">
        <NuxtLink to="/perfil" class="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft class="w-5 h-5" />
        </NuxtLink>
        <p class="text-lg truncate">
          <span class="text-slate-700 font-bold">Editar Perfil</span>
          <span class="text-slate-500 font-medium ml-1">- Atualize suas informações pessoais.</span>
        </p>
      </div>
    </template>

    <div class="max-w-2xl mx-auto space-y-6 mt-4">
      
      <!-- LOADING INICIAL -->
      <div v-if="loading" class="p-12 text-center text-slate-400 font-medium bg-white/80 backdrop-blur-md rounded-[2rem] border border-white shadow-soft">
        Carregando informações do perfil...
      </div>

      <!-- TELA DE VERIFICAÇÃO DE SENHA -->
      <div v-else-if="!isVerified" class="animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div class="bg-white/80 backdrop-blur-md rounded-[2rem] border border-white shadow-soft p-8 md:p-12 text-center">
          <div class="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-brand-100">
            <Lock class="w-8 h-8 text-brand-500" />
          </div>
          
          <h2 class="text-2xl font-bold text-rose-950 mb-2">Segurança em primeiro lugar</h2>
          <p class="text-slate-500 mb-8 max-w-md mx-auto">
            Para garantir que ninguém altere os dados por você, por favor, insira sua senha atual para continuar.
          </p>

          <form @submit.prevent="verifyPassword" class="max-w-sm mx-auto space-y-4">
            <div class="relative text-left">
              <label class="block text-sm font-medium text-slate-700 mb-2">Sua Senha</label>
              <div class="relative">
                <input 
                  v-model="passwordInput" 
                  :type="showPassword ? 'text' : 'password'" 
                  placeholder="••••••••" 
                  required 
                  class="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors bg-white/50"
                >
                <button type="button" @click="showPassword = !showPassword" class="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-brand-600 transition-colors rounded-full focus:outline-none">
                  <EyeOff v-if="showPassword" class="w-5 h-5" />
                  <Eye v-else class="w-5 h-5" />
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              :disabled="verifying" 
              class="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
            >
              <span v-if="verifying" class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span v-else>Verificar Identidade</span>
            </button>
          </form>
        </div>
      </div>

      <!-- TELA DE EDIÇÃO -->
      <div v-else class="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <form @submit.prevent="saveProfile" class="bg-white/80 backdrop-blur-md rounded-[2rem] border border-white shadow-soft p-6 md:p-10 space-y-8">
          
          <div class="space-y-6">
            <h3 class="text-xl font-bold text-rose-950 flex items-center gap-2 border-b border-brand-50 pb-4">
              <User class="w-5 h-5 text-brand-500" />
              Dados Básicos
            </h3>

            <div>
              <label class="block text-sm font-bold text-slate-700 mb-2">Nome Completo</label>
              <input v-model="form.name" type="text" required class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 transition-colors bg-white/50">
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5"><MapPin class="w-4 h-4 text-slate-400"/> Cidade</label>
                <input v-model="form.city" type="text" placeholder="Sua cidade" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 transition-colors bg-white/50">
              </div>
              <div>
                <label class="block text-sm font-bold text-slate-700 mb-2">UF</label>
                <input v-model="form.state" type="text" maxlength="2" placeholder="Ex: SP" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 transition-colors bg-white/50 uppercase">
              </div>
            </div>

            <div>
              <label class="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5"><Phone class="w-4 h-4 text-slate-400"/> WhatsApp</label>
              <input v-model="form.phone" type="text" placeholder="(00) 00000-0000" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 transition-colors bg-white/50">
            </div>
          </div>

          <div class="pt-6 border-t border-brand-50 flex items-center justify-end gap-4">
            <NuxtLink to="/perfil" class="px-6 py-3 text-slate-500 hover:text-slate-700 hover:bg-slate-50 font-bold rounded-xl transition-colors">
              Cancelar
            </NuxtLink>
            <button type="submit" :disabled="saving" class="bg-gradient-to-r from-brand-500 to-rose-500 hover:from-brand-600 hover:to-rose-600 disabled:opacity-50 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-sm hover:shadow-md flex items-center gap-2">
              <span v-if="saving" class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <Save v-else class="w-5 h-5" />
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>

    </div>
  </NuxtLayout>
</template>
