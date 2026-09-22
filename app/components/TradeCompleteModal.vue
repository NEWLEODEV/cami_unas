<script setup>
import { ref, computed } from 'vue'
import { X, PackageOpen, Info } from 'lucide-vue-next'

const isOpen = ref(false)
const isSubmitting = ref(false)
const request = ref(null)

const form = ref({
  quantity: 1,
  price: 0
})

const { showAlert } = useDialog()
const emit = defineEmits(['saved'])

const isEditing = computed(() => request.value?.status === 'completed')

const maxQuantity = computed(() => {
  if (!request.value || !request.value.trade_items) return 1;
  // Se for edição, a quantidade máxima que ele pode informar é a quantidade atual do estoque ofertado + a quantidade que ele já negociou
  if (isEditing.value) {
    return request.value.trade_items.quantity + (request.value.negotiated_quantity || 0)
  }
  return request.value.trade_items.quantity || 1;
})

const openModal = (tradeRequest) => {
  request.value = tradeRequest
  
  if (isEditing.value) {
    form.value = {
      quantity: tradeRequest.negotiated_quantity || 1,
      price: tradeRequest.negotiated_price || 0
    }
  } else {
    form.value = {
      quantity: tradeRequest.trade_items?.quantity || 1,
      // Se for venda, preenche o preço original. Senão 0.
      price: tradeRequest.trade_items?.intent?.includes('vender') ? (tradeRequest.trade_items?.price || 0) : 0
    }
  }
  
  isOpen.value = true
}

const submitCompletion = async () => {
  if (form.value.quantity > maxQuantity.value) {
    await showAlert('Erro', `A quantidade não pode ser maior que o disponível (${maxQuantity.value}).`)
    return
  }

  isSubmitting.value = true
  
  try {
    const response = await $fetch('/api/trade/complete', {
      method: 'POST',
      body: {
        requestId: request.value.id,
        quantity: form.value.quantity,
        price: form.value.price
      }
    })

    if (response.success) {
      isOpen.value = false
      emit('saved')
      await showAlert('Sucesso!', 'A negociação foi processada e os estoques foram atualizados!')
    } else {
      await showAlert('Aviso', 'Não foi possível completar: ' + (response.message || 'Erro desconhecido.'))
    }
  } catch (err) {
    console.error('Erro na requisição de concluir trade:', err)
    let errorMessage = err.statusMessage || err.message || 'Ocorreu um erro interno.'
    if (err.response && err.response._data && err.response._data.statusMessage) {
      errorMessage = err.response._data.statusMessage
    }
    await showAlert('Erro', errorMessage)
  } finally {
    isSubmitting.value = false
  }
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

defineExpose({
  openModal
})
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4 bg-rose-950/40 backdrop-blur-sm">
    <div class="bg-white rounded-[2rem] shadow-hover w-full max-w-md max-h-[95vh] flex flex-col overflow-hidden border border-white">
      
      <!-- Cabeçalho -->
      <div class="p-4 border-b border-brand-50 flex items-center justify-between bg-white/95 backdrop-blur-sm z-10 shrink-0">
        <h2 class="text-lg font-bold text-rose-950">{{ isEditing ? 'Editar Conclusão de Trade' : 'Concluir Negociação' }}</h2>
        <button @click="isOpen = false" class="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Corpo -->
      <div class="p-4 overflow-y-auto space-y-4 [&::-webkit-scrollbar]:hidden" style="scrollbar-width: none; -ms-overflow-style: none;">
        
        <div class="bg-blue-50 border border-blue-100 rounded-xl p-3 flex gap-3 text-blue-800 text-sm">
          <Info class="w-5 h-5 shrink-0 text-blue-500" />
          <p v-if="!isEditing">Ao confirmar, o estoque será transferido imediatamente. Verifique com a outra parte se os itens já foram entregues.</p>
          <p v-else>Você tem até 7 dias da data da primeira conclusão para editar quantidades ou valores.</p>
        </div>

        <!-- Info do Produto -->
        <div class="flex items-center gap-3 bg-brand-50/50 p-3 rounded-2xl border border-brand-100">
          <div v-if="request?.trade_items?.products?.image_url" class="w-12 h-12 rounded-xl bg-white shadow-sm border border-brand-100 overflow-hidden shrink-0">
            <img :src="request.trade_items.products.image_url" class="w-full h-full object-cover" />
          </div>
          <div v-else class="w-12 h-12 rounded-xl bg-white shadow-sm border border-brand-100 flex items-center justify-center text-brand-400 shrink-0">
            <PackageOpen class="w-6 h-6" />
          </div>
          <div class="flex-1">
            <h3 class="font-bold text-rose-950 line-clamp-1">{{ request?.trade_items?.products?.name }}</h3>
            <p class="text-sm text-slate-500">{{ request?.trade_items?.products?.brand }}</p>
          </div>
        </div>

        <form id="tradeCompleteForm" @submit.prevent="submitCompletion" class="space-y-4">
          <!-- Quantidade -->
          <div>
            <label class="block text-sm font-bold text-rose-950 mb-1.5">Quantidade Final Negociada</label>
            <div class="flex items-center gap-3">
              <input v-model.number="form.quantity" type="number" min="1" :max="maxQuantity" required class="w-24 px-3 py-1.5 text-sm font-bold text-rose-950 rounded-xl border border-brand-100 bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors text-center shadow-sm" />
              <span class="text-sm text-slate-500 font-medium">máximo permitido: <span class="font-bold text-rose-950">{{ maxQuantity }}</span></span>
            </div>
          </div>

          <!-- Valor Final -->
          <div>
            <label class="block text-sm font-bold text-rose-950 mb-1.5">Valor Final da Transação (Total)</label>
            <p class="text-xs text-slate-400 mb-2 font-medium">Informe R$ 0,00 caso tenha sido uma troca simples ou doação.</p>
            <div class="flex items-center gap-2">
              <span class="text-slate-500 font-bold">R$</span>
              <input v-model.number="form.price" type="number" step="0.01" min="0" required class="flex-1 px-3 py-1.5 text-sm rounded-xl border border-brand-100 bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors shadow-sm" placeholder="Ex: 15,50">
            </div>
            <p class="text-xs text-brand-600 mt-2 font-bold bg-brand-50 p-2 rounded-lg border border-brand-100" v-if="form.quantity > 0">
              O custo unitário que será registrado no estoque do novo dono é: {{ formatCurrency(form.price / form.quantity) }}
            </p>
          </div>
        </form>
      </div>

      <!-- Rodapé Fixo -->
      <div class="p-4 border-t border-surface-100 flex justify-end gap-2 bg-slate-50/50 shrink-0">
        <button type="button" @click="isOpen = false" class="px-5 py-2 text-sm rounded-xl text-slate-600 hover:bg-surface-200 font-medium transition-colors">
          Cancelar
        </button>
        <button type="submit" form="tradeCompleteForm" :disabled="isSubmitting" class="px-5 py-2 text-sm rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 text-white font-bold shadow-sm transition-all flex items-center gap-2">
          <span v-if="isSubmitting" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          {{ isSubmitting ? 'Processando...' : 'Confirmar e Transferir' }}
        </button>
      </div>

    </div>
  </div>
</template>
