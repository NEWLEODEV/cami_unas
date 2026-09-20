<script setup>
import { ref } from 'vue'
import { X, PackageOpen } from 'lucide-vue-next'

const isOpen = ref(false)
const isSubmitting = ref(false)
const isCancelling = ref(false)
const entry = ref(null)
const activeTradeItem = ref(null)
const supabase = useSupabaseClient()
const user = useSupabaseUser()

const form = ref({
  quantity: 1,
  condition: 'novo',
  intents: ['trocar'],
  unitPrice: 0
})

const { showAlert, showConfirm } = useDialog()
const emit = defineEmits(['saved'])

const handleIntentChange = (changedIntent) => {
  if (changedIntent === 'doar' && form.value.intents.includes('doar')) {
    form.value.intents = ['doar']
  } else if (changedIntent !== 'doar' && form.value.intents.includes(changedIntent)) {
    form.value.intents = form.value.intents.filter(i => i !== 'doar')
  }
}

const openModal = (item) => {
  entry.value = item
  
  // Verifica se já existe um anúncio ativo para este item
  const existing = item.trade_items?.find(t => t.status === 'active')
  
  if (existing) {
    activeTradeItem.value = existing
    const existingIntents = existing.intent ? existing.intent.split(',').map(i => i.trim()) : ['trocar']
    form.value = {
      quantity: existing.quantity || 1,
      condition: existing.condition || 'novo',
      intents: existingIntents,
      unitPrice: (existing.price || 0) / (existing.quantity || 1)
    }
  } else {
    activeTradeItem.value = null
    form.value = {
      quantity: 1,
      condition: 'novo',
      intents: ['trocar'],
      unitPrice: 0
    }
  }
  
  isOpen.value = true
}

const cancelOffer = async () => {
  const confirmed = await showConfirm(
    'Remover Oferta', 
    'Tem certeza que deseja remover este item das vitrines de trocas?'
  )
  if (!confirmed) return
  
  isCancelling.value = true
  const { data, error } = await supabase
    .from('trade_items')
    .update({ status: 'cancelled' })
    .eq('id', activeTradeItem.value.id)
    .select()
    
  isCancelling.value = false
  
  if (error) {
    console.error('Erro ao cancelar:', error)
    await showAlert('Erro', 'Ocorreu um erro ao remover: ' + error.message)
    return
  }
  
  if (!data || data.length === 0) {
    await showAlert('Não foi possível remover', 'Este item possui negociações em andamento (doação, troca ou venda). Por favor, cancele ou recuse as propostas antes de remover a oferta.')
    return
  }
  
  isOpen.value = false
  
  // Atualiza o estado local para refletir na interface instantaneamente
  if (entry.value && entry.value.trade_items) {
    const itemToUpdate = entry.value.trade_items.find(t => t.id === activeTradeItem.value.id)
    if (itemToUpdate) {
      itemToUpdate.status = 'cancelled'
    }
  }
  
  emit('saved', { entry: entry.value })
  await showAlert('Sucesso', 'Oferta removida com sucesso!')
}

const submitTrade = async () => {
  isSubmitting.value = true
  
  const { data: authData } = await supabase.auth.getUser()
  const currentUser = authData?.user

  if (!currentUser) {
    isSubmitting.value = false
    await showAlert('Erro', 'Você precisa estar logado para fazer isso.')
    return
  }

  const intentString = form.value.intents.join(',')

  const finalPrice = form.value.unitPrice * form.value.quantity

  const payload = {
    user_id: currentUser.id,
    inventory_entry_id: entry.value.id,
    product_id: entry.value.products?.id || entry.value.product_id, // Garantir que o product_id existe
    quantity: form.value.quantity,
    condition: form.value.condition,
    intent: intentString,
    price: form.value.intents.includes('vender') ? finalPrice : 0
  }

  let error;
  let newTradeItem = null;
  if (activeTradeItem.value) {
    const { data, error: updateError } = await supabase
      .from('trade_items')
      .update(payload)
      .eq('id', activeTradeItem.value.id)
      .select()
    error = updateError
    if (data && data.length > 0) newTradeItem = data[0]
  } else {
    const { data, error: insertError } = await supabase
      .from('trade_items')
      .insert(payload)
      .select()
    error = insertError
    if (data && data.length > 0) newTradeItem = data[0]
  }

  isSubmitting.value = false

  if (error) {
    console.error('Erro no Supabase:', error)
    await showAlert('Erro', 'Ocorreu um erro ao salvar: ' + error.message)
    return
  }
  
  isOpen.value = false
  
  // Atualiza o estado local
  if (entry.value) {
    if (!entry.value.trade_items) entry.value.trade_items = []
    
    if (activeTradeItem.value && newTradeItem) {
      const idx = entry.value.trade_items.findIndex(t => t.id === activeTradeItem.value.id)
      if (idx !== -1) entry.value.trade_items[idx] = newTradeItem
    } else if (newTradeItem) {
      entry.value.trade_items.push(newTradeItem)
    }
  }

  emit('saved', { ...form.value, entry: entry.value })
  await showAlert('Sucesso!', activeTradeItem.value ? 'Alterações salvas com sucesso!' : 'Seu produto agora está visível para outras pessoas!')
}

const formatMonthYear = (dateString) => {
  if (!dateString) return '-'
  const [year, month] = dateString.split('-')
  return `${month}/${year}`
}

const isExpiredOrNear = (dateString) => {
  if (!dateString) return false;
  return new Date(dateString) < new Date(new Date().setMonth(new Date().getMonth() + 1));
}

defineExpose({
  openModal
})
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4 bg-rose-950/40 backdrop-blur-sm">
    <div class="bg-white rounded-[2rem] shadow-hover w-full max-w-lg max-h-[95vh] flex flex-col overflow-hidden border border-white">
      
      <!-- Cabeçalho -->
      <div class="p-4 border-b border-brand-50 flex items-center justify-between bg-white/95 backdrop-blur-sm z-10 shrink-0">
        <h2 class="text-lg font-bold text-rose-950">Disponibilizar para Trade</h2>
        <button @click="isOpen = false" class="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Corpo -->
      <div class="p-4 overflow-y-auto space-y-4 [&::-webkit-scrollbar]:hidden" style="scrollbar-width: none; -ms-overflow-style: none;">
        
        <!-- Info do Produto -->
        <div class="flex items-center gap-3 bg-brand-50/50 p-3 rounded-2xl border border-brand-100">
          <div v-if="entry?.products?.image_url" class="w-12 h-12 rounded-xl bg-white shadow-sm border border-brand-100 overflow-hidden shrink-0">
            <img :src="entry.products.image_url" class="w-full h-full object-cover" />
          </div>
          <div v-else class="w-12 h-12 rounded-xl bg-white shadow-sm border border-brand-100 flex items-center justify-center text-brand-400 shrink-0">
            <PackageOpen class="w-6 h-6" />
          </div>
          <div class="flex-1">
            <h3 class="font-bold text-rose-950 line-clamp-1">{{ entry?.products?.name }}</h3>
            <p class="text-sm text-slate-500">{{ entry?.products?.brand }} <span v-if="entry?.products?.color">• {{ entry?.products?.color }}</span></p>
            
            <div class="mt-1.5 flex items-center gap-1.5">
              <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400">Validade:</span>
              <span v-if="entry?.expiration_date" class="text-xs font-bold px-1.5 py-0.5 rounded-md" :class="isExpiredOrNear(entry.expiration_date) ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-700'">
                {{ formatMonthYear(entry.expiration_date) }}
              </span>
              <span v-else class="text-xs text-slate-400 font-medium">Não informada</span>
            </div>
          </div>
        </div>

        <form id="tradeForm" @submit.prevent="submitTrade" class="space-y-4">
          <!-- Quantidade -->
          <div>
            <label class="block text-sm font-bold text-rose-950 mb-1.5">Quantidade a disponibilizar</label>
            <div class="flex items-center gap-3">
              <input v-model.number="form.quantity" type="number" min="1" :max="entry?.quantity || 1" required class="w-24 px-3 py-1.5 text-sm font-bold text-rose-950 rounded-xl border border-brand-100 bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors text-center shadow-sm" />
              <span class="text-sm text-slate-500 font-medium">de <span class="font-bold text-rose-950">{{ entry?.quantity || 1 }}</span> em estoque</span>
            </div>
          </div>

          <!-- Condição -->
          <div>
            <label class="block text-sm font-bold text-rose-950 mb-1.5">Condição do Produto</label>
            <div class="grid grid-cols-2 gap-3">
              <label class="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border cursor-pointer transition-colors" :class="form.condition === 'novo' ? 'bg-brand-50 border-brand-400 text-brand-700 font-bold' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'">
                <input type="radio" v-model="form.condition" value="novo" class="hidden" />
                Produto Novo
              </label>
              <label class="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border cursor-pointer transition-colors" :class="form.condition === 'usado' ? 'bg-brand-50 border-brand-400 text-brand-700 font-bold' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'">
                <input type="radio" v-model="form.condition" value="usado" class="hidden" />
                Produto Usado
              </label>
            </div>
          </div>

          <!-- O que deseja fazer? -->
          <div>
            <label class="block text-sm font-bold text-rose-950 mb-1.5">O que você deseja fazer?</label>
            <div class="space-y-1.5">
              <label class="flex items-center gap-3 py-2 px-3 rounded-xl border cursor-pointer transition-colors" :class="form.intents.includes('doar') ? 'bg-brand-50 border-brand-400' : 'bg-white border-slate-200 hover:bg-slate-50'">
                <input type="checkbox" v-model="form.intents" value="doar" @change="handleIntentChange('doar')" class="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300" />
                <div>
                  <span class="block text-sm font-bold" :class="form.intents.includes('doar') ? 'text-brand-700' : 'text-slate-700'">Desapeguei, quero doar</span>
                </div>
              </label>

              <label class="flex items-center gap-3 py-2 px-3 rounded-xl border cursor-pointer transition-colors" :class="form.intents.includes('trocar') ? 'bg-emerald-50 border-emerald-400' : 'bg-white border-slate-200 hover:bg-slate-50'">
                <input type="checkbox" v-model="form.intents" value="trocar" @change="handleIntentChange('trocar')" class="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300" />
                <div>
                  <span class="block text-sm font-bold" :class="form.intents.includes('trocar') ? 'text-emerald-700' : 'text-slate-700'">Quero trocar</span>
                </div>
              </label>

              <label class="flex items-center gap-3 py-2 px-3 rounded-xl border cursor-pointer transition-colors" :class="form.intents.includes('vender') ? 'bg-sky-50 border-sky-400' : 'bg-white border-slate-200 hover:bg-slate-50'">
                <input type="checkbox" v-model="form.intents" value="vender" @change="handleIntentChange('vender')" class="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300" />
                <div>
                  <span class="block text-sm font-bold" :class="form.intents.includes('vender') ? 'text-sky-700' : 'text-slate-700'">Quero vender</span>
                </div>
              </label>
            </div>
          </div>

          <!-- Valor (Só aparece se vender) -->
          <div v-if="form.intents.includes('vender')" class="animate-in fade-in slide-in-from-top-2 duration-200 bg-sky-50/50 p-3 rounded-xl border border-sky-100">
            <label class="block text-sm font-bold text-sky-900 mb-1.5">Valor por unidade (R$)</label>
            <input v-model.number="form.unitPrice" type="number" step="0.01" min="0" required class="w-full px-3 py-1.5 text-sm rounded-xl border border-sky-200 bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors" placeholder="Ex: 5,00">
            <p class="text-xs text-slate-500 mt-1.5 font-medium">
              Valor Total: <span class="text-sky-700 font-bold">R$ {{ (form.unitPrice * form.quantity).toFixed(2) }}</span>
            </p>
          </div>
        </form>
      </div>

      <!-- Rodapé Fixo -->
      <div class="p-4 border-t border-surface-100 flex justify-end gap-2 bg-slate-50/50 shrink-0">
        <button v-if="activeTradeItem" type="button" @click="cancelOffer" :disabled="isCancelling || isSubmitting" class="px-5 py-2 text-sm rounded-xl text-rose-600 hover:bg-rose-50 font-medium transition-colors mr-auto flex items-center gap-2">
          <span v-if="isCancelling" class="w-4 h-4 border-2 border-rose-600 border-t-transparent rounded-full animate-spin"></span>
          Remover Oferta
        </button>
        <button type="button" @click="isOpen = false" class="px-5 py-2 text-sm rounded-xl text-slate-600 hover:bg-surface-200 font-medium transition-colors">
          Cancelar
        </button>
        <button type="submit" form="tradeForm" :disabled="isSubmitting || isCancelling" class="px-5 py-2 text-sm rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 disabled:opacity-50 text-white font-bold shadow-sm transition-all flex items-center gap-2">
          <span v-if="isSubmitting" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          {{ isSubmitting ? 'Processando...' : (activeTradeItem ? 'Salvar Alterações' : 'Confirmar') }}
        </button>
      </div>

    </div>
  </div>
</template>
