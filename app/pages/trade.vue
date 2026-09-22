<script setup>
import { Search, Plus, X, ArrowDownToLine, Calendar, PackageOpen, Grid, LayoutGrid, List, ArrowRightLeft, Users, Bell, MessageCircle, Check, Phone } from 'lucide-vue-next'

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const loggedInUserId = ref(null)
const { showAlert, showConfirm } = useDialog()
const entries = ref([])
const products = ref([])
const tradeRequests = ref([])
const loading = ref(true)
const loadingRequests = ref(true)
const loadingProducts = ref(true)
const searchQuery = ref('')
const viewMode = ref('medium') // 'medium', 'large', 'details'
const activeTab = ref('inventory') // 'inventory', 'requests'

const filterBrand = ref('')
const filterCollection = ref('')

const expandedImage = ref(null)
const productModal = ref(null)
const tradeModal = ref(null)
const completeModal = ref(null)

const openNewModal = () => productModal.value?.openNewModal()

const openCompleteModal = (req) => {
  completeModal.value?.openModal(req)
}

const isWithinEditPeriod = (req) => {
  if (!req.completed_at) return false
  const completedDate = new Date(req.completed_at)
  const now = new Date()
  const diffTime = now.getTime() - completedDate.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays <= 7
}

const fetchEntries = async () => {
  if (entries.value.length === 0) loading.value = true
  const currentUserId = user.value?.id || loggedInUserId.value

  if (!currentUserId) {
    loading.value = false
    return
  }

  const { data, error } = await supabase
    .from('inventory_entries')
    .select(`
      *,
      products (
        id,
        name,
        category,
        brand,
        color,
        collection,
        size_variation,
        image_url,
        favorite_level,
        is_used
      ),
      trade_items (
        id,
        status,
        quantity,
        condition,
        intent,
        price
      )
    `)
    .eq('user_id', currentUserId)
    .order('created_at', { ascending: false })
  
  if (!error && data) {
    entries.value = data
  }
  loading.value = false
}

const fetchProducts = async () => {
  loadingProducts.value = true
  const { data, error } = await supabase
    .from('products')
    .select('id, name, brand, color, size_variation')
    .order('name', { ascending: true })
  
  if (!error && data) {
    products.value = data
  }
  loadingProducts.value = false
}



const toggleTradeStatus = (entry) => {
  tradeModal.value?.openModal(entry)
}



const fetchTradeRequests = async () => {
  if (tradeRequests.value.length === 0) loadingRequests.value = true
  
  const { data: authData } = await supabase.auth.getUser()
  const currentUser = authData?.user
  
  if (!currentUser) {
    loadingRequests.value = false
    return
  }

  const { data, error } = await supabase
    .from('trade_requests')
    .select(`
      *,
      trade_items (
        intent, price, condition, quantity,
        products ( name, image_url, brand )
      )
    `)
    .or(`requester_id.eq.${currentUser.id},target_user_id.eq.${currentUser.id}`)
    .order('created_at', { ascending: false })
  
  console.log('fetchTradeRequests data:', data)
  console.log('fetchTradeRequests error:', error)
  
  if (!error && data) {
    const userIds = new Set()
    data.forEach(r => { userIds.add(r.requester_id); userIds.add(r.target_user_id) })
    
    const { data: profiles } = await supabase.from('profiles').select('id, name, city, state, phone').in('id', Array.from(userIds))
    
    const profilesMap = {}
    if (profiles) profiles.forEach(p => profilesMap[p.id] = p)
    
    tradeRequests.value = data.map(r => ({
      ...r,
      requester: profilesMap[r.requester_id],
      target: profilesMap[r.target_user_id]
    }))
  } else if (error) {
    console.error("Erro ao buscar solicitações:", error)
    await showAlert('Erro de Consulta', 'Não foi possível carregar as solicitações: ' + error.message)
  }
  loadingRequests.value = false
}

const updateRequestStatus = async (id, newStatus) => {
  const { error } = await supabase.from('trade_requests').update({ status: newStatus }).eq('id', id)
  if (!error) {
    await showAlert('Sucesso', 'Status atualizado com sucesso!')
    fetchTradeRequests()
  } else {
    await showAlert('Erro', 'Ocorreu um erro: ' + error.message)
  }
}

const incomingRequests = computed(() => {
  const currentUserId = loggedInUserId.value || user.value?.id
  const filtered = tradeRequests.value.filter(r => r.target_user_id === currentUserId)
  return filtered
})
const outgoingRequests = computed(() => {
  const currentUserId = loggedInUserId.value || user.value?.id
  return tradeRequests.value.filter(r => r.requester_id === currentUserId)
})

let tradeChannel = null

onMounted(async () => {
  const { data: authData } = await supabase.auth.getUser()
  if (authData?.user) {
    loggedInUserId.value = authData.user.id
  }
  
  fetchEntries()
  fetchProducts()
  fetchTradeRequests()
  
  // Realtime (WebSockets) - Atualiza automaticamente via Push do Servidor
  tradeChannel = supabase.channel('trade-updates')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'trade_requests' },
      () => fetchTradeRequests()
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'inventory_entries' },
      () => fetchEntries()
    )
    .subscribe()
})

onUnmounted(() => {
  if (tradeChannel) supabase.removeChannel(tradeChannel)
})

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const [year, month, day] = dateString.split('-')
  return `${day}/${month}/${year}`
}

const formatMonthYear = (dateString) => {
  if (!dateString) return '-'
  const [year, month] = dateString.split('-')
  return `${month}/${year}`
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

const uniqueEntryBrands = computed(() => {
  const brands = entries.value.map(e => e.products?.brand).filter(Boolean)
  const map = new Map()
  brands.forEach(b => {
    const lower = b.trim().toLowerCase()
    if (!map.has(lower)) map.set(lower, b.trim())
  })
  return Array.from(map.values()).sort()
})

const uniqueCollections = computed(() => {
  const collections = entries.value.map(e => e.products?.collection).filter(Boolean)
  const map = new Map()
  collections.forEach(c => {
    const lower = c.trim().toLowerCase()
    if (!map.has(lower)) map.set(lower, c.trim())
  })
  return Array.from(map.values()).sort()
})

const filteredEntries = computed(() => {
  let result = entries.value

  if (activeTab.value === 'trading') {
    result = result.filter(entry => entry.trade_items?.some(t => t.status === 'active'))
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(entry => 
      (entry.products?.name && entry.products.name.toLowerCase().includes(query)) ||
      (entry.products?.category && entry.products.category.toLowerCase().includes(query)) ||
      (entry.products?.brand && entry.products.brand.toLowerCase().includes(query)) ||
      (entry.products?.color && entry.products.color.toLowerCase().includes(query)) ||
      (entry.products?.size_variation && entry.products.size_variation.toLowerCase().includes(query)) ||
      (entry.products?.collection && entry.products.collection.toLowerCase().includes(query))
    )
  }

  if (filterBrand.value) {
    const filterLower = filterBrand.value.toLowerCase()
    result = result.filter(entry => entry.products?.brand?.toLowerCase() === filterLower)
  }

  if (filterCollection.value) {
    const filterLower = filterCollection.value.toLowerCase()
    result = result.filter(entry => entry.products?.collection?.toLowerCase() === filterLower)
  }

  return result
})

const filteredIncomingRequests = computed(() => {
  let result = incomingRequests.value
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(req => {
      const prod = req.trade_items?.products
      if (!prod) return false
      return (prod.name && prod.name.toLowerCase().includes(query)) ||
             (prod.category && prod.category.toLowerCase().includes(query)) ||
             (prod.brand && prod.brand.toLowerCase().includes(query)) ||
             (prod.color && prod.color.toLowerCase().includes(query)) ||
             (prod.collection && prod.collection.toLowerCase().includes(query))
    })
  }
  
  if (filterBrand.value) {
    const filterLower = filterBrand.value.toLowerCase()
    result = result.filter(req => req.trade_items?.products?.brand?.toLowerCase() === filterLower)
  }
  
  if (filterCollection.value) {
    const filterLower = filterCollection.value.toLowerCase()
    result = result.filter(req => req.trade_items?.products?.collection?.toLowerCase() === filterLower)
  }
  
  return result
})

const recentIncomingRequests = computed(() => filteredIncomingRequests.value.slice(0, 5))

const filteredOutgoingRequests = computed(() => {
  let result = outgoingRequests.value
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(req => {
      const prod = req.trade_items?.products
      if (!prod) return false
      return (prod.name && prod.name.toLowerCase().includes(query)) ||
             (prod.category && prod.category.toLowerCase().includes(query)) ||
             (prod.brand && prod.brand.toLowerCase().includes(query)) ||
             (prod.color && prod.color.toLowerCase().includes(query)) ||
             (prod.collection && prod.collection.toLowerCase().includes(query))
    })
  }
  
  if (filterBrand.value) {
    const filterLower = filterBrand.value.toLowerCase()
    result = result.filter(req => req.trade_items?.products?.brand?.toLowerCase() === filterLower)
  }
  
  if (filterCollection.value) {
    const filterLower = filterCollection.value.toLowerCase()
    result = result.filter(req => req.trade_items?.products?.collection?.toLowerCase() === filterLower)
  }
  
  return result
})

const recentOutgoingRequests = computed(() => filteredOutgoingRequests.value.slice(0, 5))

definePageMeta({
  layout: false,
  middleware: 'auth'
})
</script>

<template>
  <NuxtLayout name="default">
    <template #header-left>
      <p class="text-lg truncate">
        <span class="text-slate-700 font-bold">Trade</span>
        <span class="text-slate-500 font-medium ml-1 hidden sm:inline">- Aqui você gerencia suas trocas, desapegos e negociações de produtos.</span>
      </p>
    </template>

    <div class="space-y-6">
    <!-- Sticky Header Wrapper para Trade -->
    <div class="sticky -top-4 md:-top-8 z-40 bg-[#FCF8FA] -mx-4 md:-mx-8 px-4 md:px-8 pb-4 -mt-4 md:-mt-8 mb-6 flex flex-col xl:flex-row xl:items-center gap-3 transition-all">

      <!-- Tab Switcher -->
      <div class="flex p-1 bg-white/80 backdrop-blur-md rounded-full shadow-sm border border-white shrink-0 z-30 relative">
        <button @click="activeTab = 'inventory'" class="flex-1 py-1 px-4 rounded-full text-sm font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap" :class="activeTab === 'inventory' ? 'bg-brand-50 text-brand-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'">
          <PackageOpen class="w-4 h-4" />
        Minha Coleção
        </button>
        <button @click="activeTab = 'trading'" class="flex-1 py-1 px-4 rounded-full text-sm font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap" :class="activeTab === 'trading' ? 'bg-brand-50 text-brand-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'">
          <ArrowRightLeft class="w-4 h-4" />
          Quero trocar
        </button>
        <button @click="activeTab = 'requests'" class="flex-1 py-1 px-4 rounded-full text-sm font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap" :class="activeTab === 'requests' ? 'bg-brand-50 text-brand-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'">
          <Bell class="w-4 h-4" />
          Solicitações
          <span v-if="incomingRequests.filter(r => r.status === 'pending').length > 0" class="w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px]">
            {{ incomingRequests.filter(r => r.status === 'pending').length }}
          </span>
        </button>
      </div>


      <!-- Barra de Busca -->
      <div class="flex-1 min-w-[200px] bg-white/80 backdrop-blur-md p-1.5 px-3 rounded-full shadow-sm border border-white flex items-center gap-2 z-20">
        <div class="w-7 h-7 bg-brand-50 rounded-full flex items-center justify-center shrink-0">
          <Search class="w-3.5 h-3.5 text-brand-400" />
        </div>
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Buscar produto, categoria, marca..." 
          class="flex-1 bg-transparent border-none focus:outline-none text-rose-950 placeholder-slate-400 text-sm px-1 min-w-0"
        >
      </div>

      <!-- Filtros na mesma linha -->
      <div class="flex flex-nowrap overflow-x-auto xl:overflow-visible items-center gap-3 bg-white/80 backdrop-blur-md p-1.5 px-3 rounded-full shadow-sm border border-white shrink-0 z-20" style="scrollbar-width: none; -ms-overflow-style: none;">
        <div class="flex items-center gap-2 shrink-0">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Marca</span>
          <CustomSelect 
            v-model="filterBrand" 
            :options="uniqueEntryBrands"
            placeholder="Todas"
            variant="ghost"
          />
        </div>
      </div>

      <!-- Controles de Visualização -->
      <div class="bg-white/80 backdrop-blur-md p-1 rounded-full shadow-sm border border-white flex items-center gap-1 shrink-0 hidden sm:flex z-20">
        <button @click="viewMode = 'large'" :class="viewMode === 'large' ? 'bg-brand-50 text-brand-600 shadow-sm' : 'text-slate-400 hover:text-brand-500 hover:bg-slate-50/50'" class="p-1.5 rounded-full transition-all tooltip-bottom" data-tooltip="Ícones grandes">
          <LayoutGrid class="w-4 h-4" />
        </button>
        <button @click="viewMode = 'details'" :class="viewMode === 'details' ? 'bg-brand-50 text-brand-600 shadow-sm' : 'text-slate-400 hover:text-brand-500 hover:bg-slate-50/50'" class="p-1.5 rounded-full transition-all tooltip-bottom" data-tooltip="Detalhes">
          <List class="w-4 h-4" />
        </button>
      </div>

      <!-- Action Button -->
      <NuxtLink to="/trade-search" class="bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 hover:-translate-y-0.5 text-white px-4 py-1.5 rounded-full flex items-center justify-center gap-2 transition-all duration-300 shadow-md text-sm font-bold shrink-0">
        <Users class="w-4 h-4" />
        Encontre quem quer trocar!
      </NuxtLink>
    </div>
    
    <!-- Lista de Entradas -->
    <div v-if="activeTab === 'inventory' || activeTab === 'trading'" class="space-y-6">
      <div :class="viewMode === 'details' ? 'bg-white/80 backdrop-blur-md rounded-[2rem] shadow-soft overflow-hidden border border-white' : ''">
      <div v-if="loading" class="p-12 text-center text-slate-400 font-medium bg-white/80 backdrop-blur-md rounded-[2rem] border border-white shadow-soft">
        Carregando movimentações...
      </div>
      <div v-else-if="filteredEntries.length === 0" class="p-16 text-center flex flex-col items-center bg-white/80 backdrop-blur-md rounded-[2rem] border border-white shadow-soft">
        <div class="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mb-4 shadow-inner border border-brand-100/50">
          <PackageOpen class="w-10 h-10 text-brand-300" />
        </div>
        <p class="text-rose-900 font-medium text-lg">Nenhuma entrada registrada</p>
        <p class="text-sm text-slate-400 mt-1">Clique em "Registrar Entrada" para adicionar itens ao seu estoque.</p>
      </div>
      <div v-else>
        <!-- Detalhes (Tabela) -->
        <div v-if="viewMode === 'details'" class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-brand-50/50">
                <th class="py-5 px-8 font-semibold text-slate-400 text-sm uppercase tracking-wider">Produto</th>
                <th class="py-5 px-8 font-semibold text-slate-400 text-sm uppercase tracking-wider">Data de Compra</th>
                <th class="py-5 px-8 font-semibold text-slate-400 text-sm uppercase tracking-wider">Validade</th>
                <th class="py-5 px-8 font-semibold text-slate-400 text-sm uppercase tracking-wider text-center">Qtd.</th>
                <th class="py-5 px-8 font-semibold text-slate-400 text-sm uppercase tracking-wider text-right">Custo Unit.</th>
                <th class="py-5 px-8 font-semibold text-slate-400 text-sm uppercase tracking-wider text-right">Total</th>
                <th class="py-5 px-8 font-semibold text-slate-400 text-sm uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="entry in filteredEntries" :key="entry.id" class="border-b transition-colors group" :class="entry.trade_items?.some(t => t.status === 'active') ? 'bg-yellow-50/50 border-yellow-100 hover:bg-yellow-100/50' : 'border-brand-50/30 hover:bg-white'">
                <td class="py-5 px-8">
                  <div class="flex items-center gap-2 mb-1">
                    <p class="font-semibold text-rose-950 group-hover:text-brand-600 transition-colors">{{ entry.products?.name || 'Produto Excluído' }}</p>

                  </div>
                  <p class="text-sm text-slate-400 mt-0.5" v-if="entry.products">
                    {{ entry.products.brand }} {{ entry.products.color ? `• ${entry.products.color}` : '' }} 
                  </p>
                </td>
                <td class="py-5 px-8 text-sm text-slate-500 font-medium">
                  <div class="flex items-center gap-2">
                    <Calendar class="w-4 h-4 text-brand-300" />
                    {{ formatDate(entry.purchase_date) }}
                  </div>
                </td>
                <td class="py-5 px-8 text-sm text-slate-500 font-medium">
                  <span :class="{'text-orange-500 bg-orange-50 px-2 py-1 rounded-lg border border-orange-100': entry.expiration_date && new Date(entry.expiration_date) < new Date(new Date().setMonth(new Date().getMonth() + 1))}">
                    {{ formatMonthYear(entry.expiration_date) }}
                  </span>
                </td>
                <td class="py-5 px-8 text-sm font-bold text-rose-950 text-center">
                  +{{ entry.quantity }}
                </td>
                <td class="py-5 px-8 text-sm text-slate-500 font-medium text-right">
                  {{ formatCurrency(entry.purchase_price) }}
                </td>
                <td class="py-5 px-8 text-sm font-bold text-emerald-600 text-right">
                  {{ formatCurrency(entry.quantity * entry.purchase_price) }}
                </td>
                <td class="py-5 px-8 text-right">
                  <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button @click="toggleTradeStatus(entry)" class="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors tooltip-left" data-tooltip="Disponivel para troca">
                      <ArrowRightLeft class="w-4 h-4" />
                    </button>

                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Ícones Médios e Grandes (Grid) -->
        <div v-else class="grid gap-6" :class="viewMode === 'medium' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'">
          <div v-for="entry in filteredEntries" :key="entry.id" class="backdrop-blur-md rounded-[2rem] p-6 shadow-soft hover:shadow-hover transition-all group relative flex flex-col h-full overflow-hidden pt-8" :class="entry.trade_items?.some(t => t.status === 'active') ? 'bg-yellow-50/80 border-yellow-200' : 'bg-white/80 border-white'">
            
            <div v-if="entry.trade_items?.some(t => t.status === 'active')" class="absolute top-2 left-0 right-0 text-center pointer-events-none">
              <span class="text-[8px] font-bold text-yellow-700 uppercase tracking-widest">Disponível para troca</span>
            </div>

            <!-- Ações -->
            <div class="absolute top-4 right-4 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-white/90 backdrop-blur-sm rounded-full p-1 shadow-sm border border-brand-50">
              <button @click="toggleTradeStatus(entry)" class="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors tooltip-left" data-tooltip="Disponivel para troca">
                <ArrowRightLeft class="w-3.5 h-3.5" />
              </button>

            </div>



            <div class="flex flex-col items-center text-center gap-3 mb-5 mt-2">
              <div v-if="entry.products?.image_url" @click="expandedImage = entry.products.image_url" class="w-20 h-20 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-brand-100 overflow-hidden cursor-pointer hover:scale-105 transition-transform relative group/img">
                <img :src="entry.products.image_url" alt="Foto" class="w-full h-full object-cover">
                <div class="absolute inset-0 bg-rose-900/20 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                  <Search class="w-6 h-6 text-white drop-shadow-md" />
                </div>
              </div>
              <div v-else class="w-16 h-16 rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0 text-brand-500 shadow-inner">
                <PackageOpen class="w-7 h-7" />
              </div>
              <div>
                <h3 class="font-bold text-rose-950 line-clamp-2 leading-snug" :class="viewMode === 'large' ? 'text-lg' : 'text-base'">{{ entry.products?.name || 'Produto Excluído' }}</h3>
                <p class="text-xs text-slate-400 font-medium mt-1 tracking-wide">{{ entry.products?.brand }} {{ entry.products?.color ? `• ${entry.products.color}` : '' }}</p>
                <p v-if="entry.expiration_date" class="text-xs text-slate-400 font-medium mt-0.5 tracking-wide">
                  Validade: {{ formatMonthYear(entry.expiration_date) }}
                </p>
              </div>
            </div>

            <div class="mt-auto space-y-3 pt-4 border-t border-brand-50/50">
              <div class="flex items-center justify-between text-sm">
                <span class="text-slate-500 font-medium">Quantidade</span>
                <span class="font-bold text-rose-950 bg-rose-50 px-2 py-0.5 rounded-lg text-xs border border-rose-100 shadow-sm">+{{ entry.quantity }}</span>
              </div>
              <template v-if="viewMode === 'large'">
                <div class="flex items-center justify-between text-sm">
                  <span class="text-slate-500 font-medium">Data Compra</span>
                  <span class="font-medium text-slate-700">{{ formatDate(entry.purchase_date) }}</span>
                </div>
                <div class="pt-3 border-t border-brand-50 flex items-center justify-between">
                  <span class="text-sm font-medium text-slate-500">Custo Total</span>
                  <span class="font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">{{ formatCurrency(entry.quantity * entry.purchase_price) }}</span>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div> <!-- End Inventory View -->
    <div v-else class="grid grid-cols-1 xl:grid-cols-2 gap-8 animate-in fade-in duration-300 items-start">
      
      <!-- Recebidas -->
      <div class="bg-white/80 backdrop-blur-md rounded-[2rem] border border-white shadow-soft p-8">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
          <h3 class="text-lg font-bold text-rose-950 flex items-center gap-2">
            <ArrowDownToLine class="w-5 h-5 text-emerald-500" />
            Propostas Recebidas
          </h3>
          <NuxtLink to="/historico-trade?tab=recebidas" class="text-sm font-bold text-brand-500 hover:text-brand-600 transition-colors bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-xl text-center">
            Clique aqui para visualizar todas as propostas.
          </NuxtLink>
        </div>
        
        <div v-if="loadingRequests" class="text-center text-slate-400 py-8">Carregando...</div>
        <div v-else-if="recentIncomingRequests.length === 0" class="text-center text-slate-400 py-8">Nenhuma proposta recebida.</div>
        <div v-else class="space-y-2">
          <div v-for="req in recentIncomingRequests" :key="req.id" class="p-3 border rounded-xl transition-colors" :class="req.status === 'pending' ? 'bg-orange-50/50 border-orange-100' : (req.status === 'accepted' ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50 border-slate-100 opacity-70')">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <div v-if="req.trade_items?.products?.image_url" class="w-10 h-10 rounded-lg bg-white shadow-sm shrink-0 overflow-hidden">
                  <img :src="req.trade_items.products.image_url" class="w-full h-full object-cover" />
                </div>
                <div v-else class="w-10 h-10 rounded-lg bg-brand-50 shadow-sm shrink-0 flex items-center justify-center text-brand-400 border border-brand-100">
                  <PackageOpen class="w-5 h-5" />
                </div>
                <div>
                  <h4 class="font-bold text-sm text-rose-950 leading-tight">{{ req.trade_items?.products?.name || 'Produto indisponível' }}</h4>
                  <p class="text-xs text-slate-500">Solicitado por: <span class="font-bold">{{ req.requester?.name || 'Usuário' }}</span></p>
                  
                  <div v-if="req.status === 'accepted'" class="mt-1 flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-md w-fit">
                    <Phone class="w-3 h-3" />
                    {{ req.requester?.phone || 'Não informado' }}
                  </div>
                </div>
              </div>
              
              <div v-if="req.status === 'pending'" class="flex gap-1.5 shrink-0">
                <button @click="updateRequestStatus(req.id, 'accepted')" class="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold text-xs shadow-sm transition-colors flex items-center gap-1.5"><Check class="w-3.5 h-3.5"/> Aceitar</button>
                <button @click="updateRequestStatus(req.id, 'rejected')" class="px-2.5 py-1.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg font-bold text-xs shadow-sm transition-colors flex items-center gap-1.5"><X class="w-3.5 h-3.5"/> Recusar</button>
              </div>
              <div v-else class="flex flex-col sm:items-end gap-1.5 shrink-0">
                <div class="font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md border w-fit" :class="req.status === 'accepted' ? 'text-emerald-600 border-emerald-200 bg-emerald-50' : (req.status === 'completed' ? 'text-sky-600 border-sky-200 bg-sky-50' : 'text-slate-500 border-slate-200 bg-slate-50')">
                  {{ req.status === 'accepted' ? 'Aceita' : (req.status === 'completed' ? 'Concluída' : (req.status === 'cancelled' ? 'Cancelada' : 'Recusada')) }}
                </div>
                
                <div v-if="req.status === 'accepted' || (req.status === 'completed' && isWithinEditPeriod(req))" class="flex flex-wrap justify-end gap-1.5">
                  <button v-if="req.status === 'accepted'" @click="updateRequestStatus(req.id, 'cancelled')" class="px-2 py-1 bg-white border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 rounded-lg font-bold text-[10px] shadow-sm transition-colors">Desistir</button>
                  <button @click="openCompleteModal(req)" class="px-2 py-1 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-bold text-[10px] shadow-sm transition-colors">{{ req.status === 'completed' ? 'Editar Conclusão' : 'Concluir' }}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Enviadas -->
      <div class="bg-white/80 backdrop-blur-md rounded-[2rem] border border-white shadow-soft p-8">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
          <h3 class="text-lg font-bold text-rose-950 flex items-center gap-2">
            <MessageCircle class="w-5 h-5 text-sky-500" />
            Propostas Enviadas
          </h3>
          <NuxtLink to="/historico-trade?tab=enviadas" class="text-sm font-bold text-brand-500 hover:text-brand-600 transition-colors bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-xl text-center">
            Clique aqui para visualizar todas as propostas.
          </NuxtLink>
        </div>
        
        <div v-if="loadingRequests" class="text-center text-slate-400 py-8">Carregando...</div>
        <div v-else-if="recentOutgoingRequests.length === 0" class="text-center text-slate-400 py-8">Você ainda não enviou nenhuma proposta.</div>
        <div v-else class="space-y-2">
          <div v-for="req in recentOutgoingRequests" :key="req.id" class="p-3 border rounded-xl transition-colors" :class="req.status === 'pending' ? 'bg-orange-50/50 border-orange-100' : (req.status === 'accepted' ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50 border-slate-100 opacity-70')">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <div v-if="req.trade_items?.products?.image_url" class="w-10 h-10 rounded-lg bg-white shadow-sm shrink-0 overflow-hidden">
                  <img :src="req.trade_items.products.image_url" class="w-full h-full object-cover" />
                </div>
                <div v-else class="w-10 h-10 rounded-lg bg-brand-50 shadow-sm shrink-0 flex items-center justify-center text-brand-400 border border-brand-100">
                  <PackageOpen class="w-5 h-5" />
                </div>
                <div>
                  <h4 class="font-bold text-sm text-rose-950 leading-tight">{{ req.trade_items?.products?.name || 'Produto indisponível' }}</h4>
                  <p class="text-xs text-slate-500">Enviada para: <span class="font-bold">{{ req.target?.name || 'Usuário' }}</span></p>
                  
                  <div v-if="req.status === 'accepted'" class="mt-1 flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-md w-fit">
                    <Phone class="w-3 h-3" />
                    {{ req.target?.phone || 'Não informado' }}
                  </div>
                </div>
              </div>
              
              <div class="flex flex-col sm:items-end gap-1.5 shrink-0">
                <div class="font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md border w-fit" :class="req.status === 'pending' ? 'text-orange-600 border-orange-200 bg-orange-50' : (req.status === 'accepted' ? 'text-emerald-600 border-emerald-200 bg-emerald-50' : (req.status === 'completed' ? 'text-sky-600 border-sky-200 bg-sky-50' : 'text-slate-500 border-slate-200 bg-slate-50'))">
                  {{ req.status === 'pending' ? 'Aguardando' : (req.status === 'accepted' ? 'Aceita' : (req.status === 'completed' ? 'Concluída' : (req.status === 'cancelled' ? 'Cancelada' : 'Recusada'))) }}
                </div>
                
                <div v-if="req.status === 'accepted' || (req.status === 'completed' && isWithinEditPeriod(req))" class="flex flex-wrap justify-end gap-1.5">
                  <button v-if="req.status === 'accepted'" @click="updateRequestStatus(req.id, 'cancelled')" class="px-2 py-1 bg-white border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 rounded-lg font-bold text-[10px] shadow-sm transition-colors">Desistir</button>
                  <button @click="openCompleteModal(req)" class="px-2 py-1 bg-brand-500 hover:bg-brand-600 text-white rounded-lg font-bold text-[10px] shadow-sm transition-colors">{{ req.status === 'completed' ? 'Editar Conclusão' : 'Concluir' }}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div> <!-- End Requests View -->

    <ProductFormModal ref="productModal" @saved="fetchEntries" />
    <TradeFormModal ref="tradeModal" @saved="fetchEntries" />
    <TradeCompleteModal ref="completeModal" @saved="() => { fetchTradeRequests(); fetchEntries(); }" />

    <!-- Modal de Imagem Expandida -->
    <div v-if="expandedImage" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-rose-950/60 backdrop-blur-md" @click="expandedImage = null">
      <div class="relative max-w-2xl w-full rounded-[2rem] overflow-hidden flex items-center justify-center shadow-2xl" @click.stop>
        <button @click="expandedImage = null" class="absolute top-4 right-4 w-10 h-10 bg-white/50 hover:bg-white backdrop-blur-md text-rose-950 flex items-center justify-center rounded-full transition-all z-10 shadow-sm">
          <X class="w-5 h-5" />
        </button>
        <img :src="expandedImage" alt="Imagem Expandida" class="w-full h-auto max-h-[85vh] object-contain rounded-[2rem] bg-white">
      </div>
    </div>
  </div>
  </NuxtLayout>
</template>
