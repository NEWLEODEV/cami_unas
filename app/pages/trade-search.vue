<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { Search, MapPin, PackageOpen, Handshake, HeartHandshake, ArrowLeft, ChevronLeft, ChevronRight, Check } from 'lucide-vue-next'

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const { showAlert, showConfirm } = useDialog()

const tradeItems = ref([])
const loading = ref(true)

// Filtros
const searchProduct = ref('')
const searchCity = ref('')

// Para controlar botões de "solicitando..."
const requestingIds = ref([])
// Para manter botões em estado de "solicitado"
const requestedIds = ref([])

const fetchTradeItems = async () => {
  loading.value = true
  
  const { data: authData } = await supabase.auth.getUser()
  const currentUser = authData?.user

  if (!currentUser) {
    loading.value = false
    return
  }

  const { data, error } = await supabase
    .from('trade_items')
    .select(`
      *,
      products (
        id, name, category, brand, color, collection, image_url
      ),
      inventory_entries (
        expiration_date
      )
    `)
    .eq('status', 'active')
    .neq('user_id', currentUser.id) // Não mostrar meus próprios itens
  
  if (!error && data) {
    // Buscar profiles manualmente já que não há foreign key direta
    const userIds = new Set(data.map(item => item.user_id))
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, name, city, state')
      .in('id', Array.from(userIds))
      
    const profilesMap = {}
    if (profilesData) {
      profilesData.forEach(p => {
        profilesMap[p.id] = p
      })
    }
    
    tradeItems.value = data.map(item => ({
      ...item,
      profiles: profilesMap[item.user_id]
    }))
  }
  loading.value = false
}

const filteredItems = computed(() => {
  let result = tradeItems.value

  if (searchProduct.value) {
    const q = searchProduct.value.toLowerCase()
    result = result.filter(item => 
      item.products?.name?.toLowerCase().includes(q) || 
      item.products?.brand?.toLowerCase().includes(q) ||
      item.products?.category?.toLowerCase().includes(q)
    )
  }

  if (searchCity.value) {
    const q = searchCity.value.toLowerCase()
    result = result.filter(item => item.profiles?.city?.toLowerCase().includes(q))
  }

  return result
})

const currentPage = ref(1)
const itemsPerPage = 25

const totalPages = computed(() => {
  return Math.ceil(filteredItems.value.length / itemsPerPage)
})

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredItems.value.slice(start, end)
})

watch([searchProduct, searchCity], () => {
  currentPage.value = 1
})

onMounted(() => {
  fetchTradeItems()
})

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

const formatMonthYear = (dateString) => {
  if (!dateString) return '-'
  const [year, month] = dateString.split('-')
  return `${month}/${year}`
}

const getIntentLabels = (intentString) => {
  if (!intentString) return []
  const intents = intentString.split(',').map(i => i.trim())
  
  return intents.map(intent => {
    switch (intent) {
      case 'doar': return { text: 'Doação', class: 'bg-brand-50 text-brand-700 border-brand-100' }
      case 'trocar': return { text: 'Troca', class: 'bg-emerald-50 text-emerald-700 border-emerald-100' }
      case 'vender': return { text: 'Venda', class: 'bg-sky-50 text-sky-700 border-sky-100' }
      default: return { text: intent, class: 'bg-slate-50 text-slate-700 border-slate-100' }
    }
  })
}

const requestTrade = async (item) => {
  const confirmed = await showConfirm(
    'Solicitar Troca', 
    `Você tem certeza que deseja solicitar a negociação deste item com ${item.profiles?.name}?`
  )
  
  if (!confirmed) return

  requestingIds.value.push(item.id)

  const { data: authData } = await supabase.auth.getUser()
  const currentUser = authData?.user

  const { error } = await supabase.from('trade_requests').insert({
    trade_item_id: item.id,
    requester_id: currentUser?.id,
    target_user_id: item.user_id,
    status: 'pending'
  })

  requestingIds.value = requestingIds.value.filter(id => id !== item.id)

  if (error) {
    await showAlert('Erro', 'Não foi possível enviar a solicitação: ' + error.message)
  } else {
    requestedIds.value.push(item.id)
    await showAlert('Sucesso!', 'Solicitação enviada! Aguarde a resposta do outro usuário.')
  }
}

const cancelRequest = async (item) => {
  const confirmed = await showConfirm(
    'Cancelar Solicitação', 
    'Tem certeza que deseja cancelar esta solicitação?'
  )
  
  if (!confirmed) return

  const { data: authData } = await supabase.auth.getUser()
  const currentUser = authData?.user
  if (!currentUser) return

  const { error } = await supabase
    .from('trade_requests')
    .update({ status: 'cancelled' })
    .eq('trade_item_id', item.id)
    .eq('requester_id', currentUser.id)
    .eq('status', 'pending')

  if (!error) {
    requestedIds.value = requestedIds.value.filter(id => id !== item.id)
    await showAlert('Cancelado', 'Sua solicitação foi cancelada com sucesso.')
  } else {
    await showAlert('Erro', 'Não foi possível cancelar: ' + error.message)
  }
}

definePageMeta({
  layout: false,
  middleware: 'auth'
})
</script>

<template>
  <NuxtLayout name="default">
    <template #header-left>
      <div class="flex items-center gap-3">
        <NuxtLink to="/trade" class="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft class="w-5 h-5" />
        </NuxtLink>
        <p class="text-lg truncate">
          <span class="text-slate-700 font-bold">Localizar Pessoas</span>
          <span class="text-slate-500 font-medium ml-1">- Encontre itens disponíveis para troca na sua região.</span>
        </p>
      </div>
    </template>

    <div class="space-y-6">
      
      <!-- Filtros -->
      <div class="flex flex-col md:flex-row gap-4 w-full z-20 relative -mt-4 lg:-mt-6">
        <div class="flex-1 bg-white/80 backdrop-blur-md p-2 rounded-full shadow-sm border border-white flex items-center gap-3">
          <div class="w-10 h-10 bg-brand-50 rounded-full flex items-center justify-center shrink-0">
            <Search class="w-5 h-5 text-brand-400" />
          </div>
          <input 
            v-model="searchProduct" 
            type="text" 
            placeholder="Buscar produto ou marca..." 
            class="flex-1 bg-transparent border-none focus:outline-none text-rose-950 placeholder-slate-400 font-medium px-2 min-w-0"
          >
        </div>

        <div class="flex flex-1 gap-2 bg-white/80 backdrop-blur-md p-2 rounded-full shadow-sm border border-white">
          <div class="w-10 h-10 bg-sky-50 rounded-full flex items-center justify-center shrink-0 hidden sm:flex">
            <MapPin class="w-5 h-5 text-sky-400" />
          </div>
          <input 
            v-model="searchCity" 
            type="text" 
            placeholder="Cidade..." 
            class="flex-1 bg-transparent border-none focus:outline-none text-rose-950 placeholder-slate-400 font-medium px-2 min-w-0"
          >
        </div>
      </div>

      <!-- Lista -->
      <div v-if="loading" class="p-12 text-center text-slate-400 font-medium bg-white/80 backdrop-blur-md rounded-[2rem] border border-white shadow-soft">
        Buscando itens na rede...
      </div>
      
      <div v-else-if="filteredItems.length === 0" class="p-16 text-center flex flex-col items-center bg-white/80 backdrop-blur-md rounded-[2rem] border border-white shadow-soft">
        <div class="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 shadow-inner border border-slate-100">
          <Search class="w-10 h-10 text-slate-300" />
        </div>
        <p class="text-rose-950 font-medium text-lg">Nenhum item encontrado</p>
        <p class="text-sm text-slate-400 mt-1">Tente mudar a cidade, estado ou os termos de busca.</p>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <div v-for="item in paginatedItems" :key="item.id" class="h-full bg-white/80 backdrop-blur-md border border-white rounded-[2rem] p-6 shadow-soft hover:shadow-hover transition-all flex flex-col justify-between relative overflow-hidden group">
          
          <!-- Badges Topo -->
          <div class="absolute top-4 right-4 flex flex-col items-end gap-1 z-10">
            <span v-if="item.condition === 'novo'" class="px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold rounded-lg border shadow-sm bg-purple-50 text-purple-700 border-purple-100">
              Produto Novo
            </span>
            <span v-else-if="item.condition === 'usado'" class="px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold rounded-lg border shadow-sm bg-amber-50 text-amber-700 border-amber-100">
              Produto Usado
            </span>
            <span v-for="label in getIntentLabels(item.intent)" :key="label.text" class="px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold rounded-lg border shadow-sm" :class="label.class">
              {{ label.text }}
            </span>
          </div>

          <div class="flex flex-col items-center text-center gap-3 mb-5 mt-2 flex-1">
            <div v-if="item.products?.image_url" class="w-20 h-20 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-brand-100 overflow-hidden relative group/img">
              <img :src="item.products.image_url" alt="Foto" class="w-full h-full object-cover">
            </div>
            <div v-else class="w-20 h-20 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0 text-brand-500 shadow-inner">
              <PackageOpen class="w-7 h-7" />
            </div>
            
            <div class="px-2">
              <h3 class="font-bold text-rose-950 line-clamp-2 leading-snug text-base">{{ item.products?.name }}</h3>
              <p class="text-xs text-slate-400 font-medium mt-1 tracking-wide">
                <span v-if="item.products?.category">{{ item.products.category }} &bull; </span>{{ item.products?.brand }}
              </p>
              <p v-if="item.inventory_entries?.expiration_date" class="text-xs text-slate-400 font-medium mt-0.5 tracking-wide">
                Validade: {{ formatMonthYear(item.inventory_entries?.expiration_date) }}
              </p>
            </div>
          </div>

          <div class="space-y-3 mt-auto pt-4 border-t border-slate-100">
            <!-- Usuário -->
            <div class="flex flex-col items-center gap-1">
              <div class="flex items-center gap-2">
                <p class="text-sm font-bold text-slate-700 truncate">{{ item.profiles?.name }}</p>
              </div>
              <div class="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <MapPin class="w-3.5 h-3.5 text-sky-400" />
                {{ item.profiles?.city || 'Cidade desconhecida' }} - {{ item.profiles?.state || 'UF' }}
              </div>
            </div>

            <div class="flex items-center justify-between text-sm pt-2 border-t border-slate-50">
              <span class="text-slate-500 font-medium">Quantidade Disp.</span>
              <span class="font-bold text-rose-950 bg-rose-50 px-2 py-0.5 rounded-lg text-xs border border-rose-100">{{ item.quantity }}x</span>
            </div>
            
            <div class="flex items-center justify-between text-sm">
              <span class="text-slate-500 font-medium">Valor Total</span>
              <span v-if="item.intent?.includes('vender') && item.price > 0" class="font-bold text-emerald-600">{{ formatCurrency(item.price) }}</span>
              <span v-else class="font-bold text-slate-300">--</span>
            </div>

            <!-- Botão Ação -->
            <button 
              @click="requestTrade(item)" 
              :disabled="requestingIds.includes(item.id) || requestedIds.includes(item.id)"
              class="w-full mt-2 px-2 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all font-bold text-[13px] whitespace-nowrap shadow-sm disabled:opacity-50"
              :class="requestedIds.includes(item.id) ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white'"
            >
              <HeartHandshake v-if="!requestingIds.includes(item.id) && !requestedIds.includes(item.id)" class="w-4 h-4 shrink-0" />
              <Check v-else-if="requestedIds.includes(item.id)" class="w-4 h-4 shrink-0" />
              <span v-else class="w-4 h-4 shrink-0 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
              {{ requestedIds.includes(item.id) ? 'Solicitado! Aguardando...' : (requestingIds.includes(item.id) ? 'Enviando...' : 'Solicitar Negociação') }}
            </button>
            
            <button 
              v-if="requestedIds.includes(item.id)"
              @click="cancelRequest(item)"
              class="w-full mt-2 text-center text-[11px] font-bold text-slate-400 hover:text-rose-500 transition-colors underline-offset-2 hover:underline"
            >
              Cancelar solicitação
            </button>
          </div>

        </div>
      </div>

      <!-- Paginação -->
      <div v-if="totalPages > 1" class="flex items-center justify-center gap-4 mt-8 pb-4">
        <button 
          @click="currentPage--" 
          :disabled="currentPage === 1" 
          class="w-10 h-10 rounded-full flex items-center justify-center bg-white/80 backdrop-blur-md border border-white text-slate-600 hover:text-brand-600 hover:bg-white shadow-sm disabled:opacity-40 disabled:hover:text-slate-600 transition-all"
        >
          <ChevronLeft class="w-5 h-5" />
        </button>
        <span class="text-sm font-bold text-rose-950 bg-white/80 backdrop-blur-md px-5 py-2 rounded-full border border-white shadow-sm">
          Página {{ currentPage }} de {{ totalPages }}
        </span>
        <button 
          @click="currentPage++" 
          :disabled="currentPage === totalPages" 
          class="w-10 h-10 rounded-full flex items-center justify-center bg-white/80 backdrop-blur-md border border-white text-slate-600 hover:text-brand-600 hover:bg-white shadow-sm disabled:opacity-40 disabled:hover:text-slate-600 transition-all"
        >
          <ChevronRight class="w-5 h-5" />
        </button>
      </div>

    </div>
  </NuxtLayout>
</template>
