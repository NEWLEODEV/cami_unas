<script setup>
import { ref, onMounted } from 'vue'
import { User, MapPin, Phone, Mail, Edit3, ArrowLeft } from 'lucide-vue-next'

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const profile = ref(null)
const loading = ref(true)

onMounted(async () => {
  console.log('Mounting perfil/index.vue')
  const { data: authData } = await supabase.auth.getUser()
  
  if (authData?.user) {
    console.log('User found in authData:', authData.user.id)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()
      
    if (!error && data) {
      console.log('Profile found in DB:', data)
      profile.value = data
    } else {
      console.log('Profile not found in DB or error. Using fallback. Error:', error)
      // Fallback robusto se a tabela profiles falhar ou atrasar
      profile.value = {
        name: authData.user.user_metadata?.name || '',
        city: authData.user.user_metadata?.city || '',
        state: authData.user.user_metadata?.state || '',
        phone: authData.user.user_metadata?.phone || ''
      }
    }
  } else {
    console.log('No user found in authData')
  }
  loading.value = false
})

const userInitial = computed(() => {
  return profile.value?.name ? profile.value.name.charAt(0).toUpperCase() : 'U'
})

definePageMeta({
  layout: false,
  middleware: 'auth'
})
</script>

<template>
  <NuxtLayout name="default">
    <template #header-left>
      <div class="flex items-center gap-3">
        <NuxtLink to="/" class="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft class="w-5 h-5" />
        </NuxtLink>
        <p class="text-lg truncate">
          <span class="text-slate-700 font-bold">Meu Perfil</span>
          <span class="text-slate-500 font-medium ml-1">- Visualize suas informações pessoais.</span>
        </p>
      </div>
    </template>

    <div class="max-w-3xl mx-auto space-y-6 mt-2 lg:mt-4">
      <div v-if="loading" class="p-12 text-center text-slate-400 font-medium bg-white/80 backdrop-blur-md rounded-[2rem] border border-white shadow-soft">
        Carregando informações do perfil...
      </div>
      
      <div v-else class="bg-white/80 backdrop-blur-md rounded-[2rem] border border-white shadow-soft overflow-hidden">
        
        <!-- Header do Perfil (Capa) -->
        <div class="h-32 bg-gradient-to-r from-brand-300 to-rose-300 relative">
          <!-- Avatar centralizado na borda -->
          <div class="absolute -bottom-12 left-8 w-24 h-24 rounded-full bg-white p-1.5 shadow-md">
            <div class="w-full h-full rounded-full bg-gradient-to-br from-brand-400 to-rose-500 flex items-center justify-center text-white text-3xl font-bold shadow-inner border-2 border-white/20">
              {{ userInitial }}
            </div>
          </div>
        </div>

        <!-- Botão de Editar flutuante no topo direito -->
        <div class="flex justify-end p-4">
          <NuxtLink to="/perfil/editar" class="flex items-center gap-2 px-4 py-2 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-full font-bold text-sm transition-colors shadow-sm">
            <Edit3 class="w-4 h-4" />
            Editar Perfil
          </NuxtLink>
        </div>

        <!-- Conteúdo do Perfil -->
        <div class="px-8 pb-10 pt-4 space-y-8">
          
          <div>
            <h2 class="text-2xl font-bold text-rose-950">{{ profile?.name || 'Usuário Sem Nome' }}</h2>
            <p class="text-slate-500 font-medium mt-1 flex items-center gap-2">
              <MapPin class="w-4 h-4" />
              {{ profile?.city || 'Cidade não informada' }}{{ profile?.state ? ` - ${profile.state}` : '' }}
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Email -->
            <div class="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-4">
              <div class="w-10 h-10 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                <Mail class="w-5 h-5" />
              </div>
              <div>
                <p class="text-sm font-bold text-slate-500 uppercase tracking-wider">E-mail de acesso</p>
                <p class="text-rose-950 font-medium mt-1">{{ user?.email || 'Não informado' }}</p>
              </div>
            </div>

            <!-- Telefone / WhatsApp -->
            <div class="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-4">
              <div class="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <Phone class="w-5 h-5" />
              </div>
              <div>
                <p class="text-sm font-bold text-slate-500 uppercase tracking-wider">WhatsApp</p>
                <p class="text-rose-950 font-medium mt-1">{{ profile?.phone || 'Não informado' }}</p>
              </div>
            </div>
            
            <!-- Cidade -->
            <div class="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-4">
              <div class="w-10 h-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center shrink-0">
                <MapPin class="w-5 h-5" />
              </div>
              <div>
                <p class="text-sm font-bold text-slate-500 uppercase tracking-wider">Localização</p>
                <p class="text-rose-950 font-medium mt-1">
                  {{ profile?.city || 'Não informada' }}{{ profile?.state ? ` - ${profile.state}` : '' }}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  </NuxtLayout>
</template>
