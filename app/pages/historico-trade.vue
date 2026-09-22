<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ArrowLeft, Check, X, PackageOpen, Phone, ArrowDownToLine, MessageCircle, Clock, CheckCircle2, Ban } from 'lucide-vue-next'
import { useRoute } from 'vue-router'

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const { showAlert } = useDialog()
const route = useRoute()

const tradeRequests = ref([])
const loading = ref(true)
const loggedInUserId = ref(null)
const completeModal = ref(null)

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

const activeTab = ref(route.query.tab || 'todas')

let tradeChannel = null

const fetchTradeRequests = async () => {
  if (tradeRequests.value.length === 0) loading.value = true
  
  const { data: authData } = await supabase.auth.getUser()
  const currentUser = authData?.user
  
  if (!currentUser) {
    loading.value = false
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
    await showAlert('Erro de Consulta', 'Não foi possível carregar o histórico: ' + error.message)
  }
  loading.value = false
}

const updateRequestStatus = async (id, newStatus) => {
  const { error } = await supabase.from('trade_requests').update({ status: newStatus }).eq('id', id)
  if (!error) {
    fetchTradeRequests()
  } else {
    await showAlert('Erro', 'Não foi possível atualizar: ' + error.message)
  }
}

onMounted(async () => {
  const { data: authData } = await supabase.auth.getUser()
  if (authData?.user) {
    loggedInUserId.value = authData.user.id
  }
  
  fetchTradeRequests()
  
  tradeChannel = supabase.channel('historico-updates')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'trade_requests' },
      () => fetchTradeRequests()
    )
    .subscribe()
})

onUnmounted(() => {
  if (tradeChannel) supabase.removeChannel(tradeChannel)
})

const filteredRequests = computed(() => {
  let result = tradeRequests.value
  const currentUserId = loggedInUserId.value || user.value?.id
  
  if (activeTab.value === 'recebidas') {
    result = result.filter(r => r.target_user_id === currentUserId)
  } else if (activeTab.value === 'enviadas') {
    result = result.filter(r => r.requester_id === currentUserId)
  }
  
  return result
})

const formatDateFull = (dateString) => {
  if (!dateString) return '-'
  const d = new Date(dateString)
  return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

const getStatusConfig = (status, isIncoming) => {
  switch (status) {
    case 'pending': 
      return { label: 'Aguardando', icon: Clock, class: 'bg-orange-50 text-orange-600 border-orange-200' }
    case 'accepted': 
      return { label: 'Aceita (Em andamento)', icon: CheckCircle2, class: 'bg-emerald-50 text-emerald-600 border-emerald-200' }
    case 'completed': 
      return { label: 'Concluída', icon: Check, class: 'bg-sky-50 text-sky-600 border-sky-200' }
    case 'cancelled': 
      return { label: 'Cancelada', icon: Ban, class: 'bg-slate-50 text-slate-500 border-slate-200' }
    case 'rejected': 
      return { label: 'Recusada', icon: X, class: 'bg-rose-50 text-rose-600 border-rose-200' }
    default: 
      return { label: status, icon: Clock, class: 'bg-slate-50 text-slate-500 border-slate-200' }
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
          <span class="text-slate-700 font-bold">Histórico de Negociações</span>
          <span class="text-slate-500 font-medium ml-1 hidden sm:inline">- Registro de todas as suas transações.</span>
        </p>
      </div>
    </template>

    <div class="space-y-6">
      
      <!-- Tabs -->
      <div class="flex gap-2 border-b border-brand-100/50 pb-4">
        <button 
          @click="activeTab = 'todas'"
          class="px-4 py-2 rounded-xl font-bold text-sm transition-all"
          :class="activeTab === 'todas' ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-500 hover:bg-white hover:shadow-sm'"
        >
          Todas
        </button>
        <button 
          @click="activeTab = 'recebidas'"
          class="px-4 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2"
          :class="activeTab === 'recebidas' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:bg-white hover:shadow-sm'"
        >
          <ArrowDownToLine class="w-4 h-4" />
          Recebidas
        </button>
        <button 
          @click="activeTab = 'enviadas'"
          class="px-4 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2"
          :class="activeTab === 'enviadas' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-500 hover:bg-white hover:shadow-sm'"
        >
          <MessageCircle class="w-4 h-4" />
          Enviadas
        </button>
      </div>

      <!-- Log List -->
      <div class="bg-white/80 backdrop-blur-md rounded-[2rem] border border-white shadow-soft overflow-hidden">
        
        <div v-if="loading" class="text-center text-slate-400 py-12 font-medium">Carregando histórico...</div>
        <div v-else-if="filteredRequests.length === 0" class="text-center text-slate-400 py-12 font-medium">Nenhum registro encontrado.</div>
        
        <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
          <div v-for="req in filteredRequests" :key="req.id" class="p-5 sm:p-6 border border-slate-100 rounded-2xl bg-white/40 hover:bg-white hover:border-brand-200 hover:shadow-md transition-all">
            
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
              
              <div class="flex items-start sm:items-center gap-4 flex-1">
                <div v-if="req.trade_items?.products?.image_url" class="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-white shadow-sm shrink-0 overflow-hidden">
                  <img :src="req.trade_items.products.image_url" class="w-full h-full object-cover" />
                </div>
                <div v-else class="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-brand-50 shadow-sm shrink-0 flex items-center justify-center text-brand-400 border border-brand-100">
                  <PackageOpen class="w-6 h-6" />
                </div>
                
                <div class="space-y-1">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span v-if="req.target_user_id === (loggedInUserId || user?.id)" class="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700">Recebida</span>
                    <span v-else class="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-sky-100 text-sky-700">Enviada</span>
                    <span class="text-xs text-slate-400 font-medium">{{ formatDateFull(req.created_at) }}</span>
                  </div>
                  <h4 class="font-bold text-rose-950 text-base">{{ req.trade_items?.products?.name || 'Produto indisponível' }}</h4>
                  <p class="text-sm text-slate-500">
                    <span v-if="req.target_user_id === (loggedInUserId || user?.id)">De: <span class="font-bold">{{ req.requester?.name || 'Usuário' }}</span></span>
                    <span v-else>Para: <span class="font-bold">{{ req.target?.name || 'Usuário' }}</span></span>
                  </p>
                  
                  <div v-if="req.status === 'accepted'" class="mt-2 flex items-center gap-2 text-sm font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg w-fit border border-emerald-100">
                    <Phone class="w-4 h-4" />
                    WhatsApp: {{ req.target_user_id === (loggedInUserId || user?.id) ? (req.requester?.phone || 'Não informado') : (req.target?.phone || 'Não informado') }}
                  </div>
                </div>
              </div>
              
              <div class="flex flex-col items-start md:items-end gap-3 md:min-w-[200px]">
                
                <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold text-xs uppercase tracking-wider w-fit" :class="getStatusConfig(req.status, req.target_user_id === (loggedInUserId || user?.id)).class">
                  <component :is="getStatusConfig(req.status, req.target_user_id === (loggedInUserId || user?.id)).icon" class="w-4 h-4" />
                  {{ getStatusConfig(req.status, req.target_user_id === (loggedInUserId || user?.id)).label }}
                </div>
                
                <!-- Ações -->
                <div class="flex flex-wrap gap-2 w-full justify-start md:justify-end">
                  
                  <!-- Se for o dono do item e estiver pendente -->
                  <template v-if="req.status === 'pending' && req.target_user_id === (loggedInUserId || user?.id)">
                    <button @click="updateRequestStatus(req.id, 'accepted')" class="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-sm transition-colors flex items-center gap-1.5"><Check class="w-3.5 h-3.5"/> Aceitar</button>
                    <button @click="updateRequestStatus(req.id, 'rejected')" class="px-3 py-1.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl font-bold text-xs shadow-sm transition-colors flex items-center gap-1.5"><X class="w-3.5 h-3.5"/> Recusar</button>
                  </template>
                  
                  <!-- Se já foi aceita ou se está concluída e dentro do prazo -->
                  <template v-if="req.status === 'accepted' || (req.status === 'completed' && isWithinEditPeriod(req))">
                    <button v-if="req.status === 'accepted'" @click="updateRequestStatus(req.id, 'cancelled')" class="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 rounded-xl font-bold text-xs shadow-sm transition-colors">Desistir</button>
                    <button @click="openCompleteModal(req)" class="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold text-xs shadow-sm transition-colors">{{ req.status === 'completed' ? 'Editar Conclusão' : 'Concluir' }}</button>
                  </template>
                  
                </div>
                
              </div>
            </div>
            
          </div>
        </div>
      </div>

      <TradeCompleteModal ref="completeModal" @saved="fetchTradeRequests" />
    </div>
  </NuxtLayout>
</template>
