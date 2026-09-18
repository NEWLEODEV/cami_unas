<script setup>
import { ref } from 'vue'
import { X, PackageOpen } from 'lucide-vue-next'

const isOpen = ref(false)
const isSubmitting = ref(false)
const entry = ref(null)

const form = ref({
  quantity: 1,
  condition: 'novo',
  intent: 'trocar',
  price: 0
})

const { showAlert } = useDialog()
const emit = defineEmits(['saved'])

const openModal = (item) => {
  entry.value = item
  form.value = {
    quantity: 1,
    condition: 'novo',
    intent: 'trocar',
    price: 0
  }
  isOpen.value = true
}

const submitTrade = async () => {
  isSubmitting.value = true
  
  // Aqui futuramente será feita a integração com o banco de dados
  // para salvar os dados da intenção de trade.
  
  setTimeout(async () => {
    isSubmitting.value = false
    isOpen.value = false
    await showAlert('Sucesso!', 'Produto disponibilizado com sucesso! (A integração com o banco de dados será implementada em breve)')
    emit('saved', { ...form.value, entry: entry.value })
  }, 1000)
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
      <div class="p-5 overflow-y-auto space-y-6" style="scrollbar-width: thin;">
        
        <!-- Info do Produto -->
        <div class="flex items-center gap-4 bg-brand-50/50 p-4 rounded-2xl border border-brand-100">
          <div v-if="entry?.products?.image_url" class="w-16 h-16 rounded-xl bg-white shadow-sm border border-brand-100 overflow-hidden shrink-0">
            <img :src="entry.products.image_url" class="w-full h-full object-cover" />
          </div>
          <div v-else class="w-16 h-16 rounded-xl bg-white shadow-sm border border-brand-100 flex items-center justify-center text-brand-400 shrink-0">
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

        <form id="tradeForm" @submit.prevent="submitTrade" class="space-y-5">
          <!-- Quantidade -->
          <div>
            <label class="block text-sm font-bold text-rose-950 mb-2">Quantidade a disponibilizar</label>
            <div class="flex items-center gap-3">
              <input v-model.number="form.quantity" type="number" min="1" :max="entry?.quantity || 1" required class="w-24 px-3 py-2 text-base font-bold text-rose-950 rounded-xl border border-brand-100 bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors text-center shadow-sm" />
              <span class="text-sm text-slate-500 font-medium">de <span class="font-bold text-rose-950">{{ entry?.quantity || 1 }}</span> em estoque</span>
            </div>
          </div>

          <!-- Condição -->
          <div>
            <label class="block text-sm font-bold text-rose-950 mb-2">Condição do Produto</label>
            <div class="grid grid-cols-2 gap-3">
              <label class="flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-colors" :class="form.condition === 'novo' ? 'bg-brand-50 border-brand-400 text-brand-700 font-bold' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'">
                <input type="radio" v-model="form.condition" value="novo" class="hidden" />
                Produto Novo
              </label>
              <label class="flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-colors" :class="form.condition === 'usado' ? 'bg-brand-50 border-brand-400 text-brand-700 font-bold' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'">
                <input type="radio" v-model="form.condition" value="usado" class="hidden" />
                Produto Usado
              </label>
            </div>
          </div>

          <!-- O que deseja fazer? -->
          <div>
            <label class="block text-sm font-bold text-rose-950 mb-2">O que você deseja fazer?</label>
            <div class="space-y-2">
              <label class="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors" :class="form.intent === 'doar' ? 'bg-brand-50 border-brand-400' : 'bg-white border-slate-200 hover:bg-slate-50'">
                <input type="radio" v-model="form.intent" value="doar" class="w-4 h-4 text-brand-600 focus:ring-brand-500 border-slate-300" />
                <div>
                  <span class="block text-sm font-bold" :class="form.intent === 'doar' ? 'text-brand-700' : 'text-slate-700'">Desapeguei, quero doar</span>
                </div>
              </label>

              <label class="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors" :class="form.intent === 'trocar' ? 'bg-emerald-50 border-emerald-400' : 'bg-white border-slate-200 hover:bg-slate-50'">
                <input type="radio" v-model="form.intent" value="trocar" class="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300" />
                <div>
                  <span class="block text-sm font-bold" :class="form.intent === 'trocar' ? 'text-emerald-700' : 'text-slate-700'">Quero trocar</span>
                </div>
              </label>

              <label class="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors" :class="form.intent === 'vender' ? 'bg-sky-50 border-sky-400' : 'bg-white border-slate-200 hover:bg-slate-50'">
                <input type="radio" v-model="form.intent" value="vender" class="w-4 h-4 text-sky-600 focus:ring-sky-500 border-slate-300" />
                <div>
                  <span class="block text-sm font-bold" :class="form.intent === 'vender' ? 'text-sky-700' : 'text-slate-700'">Quero vender</span>
                </div>
              </label>
            </div>
          </div>

          <!-- Valor (Só aparece se vender) -->
          <div v-if="form.intent === 'vender'" class="animate-in fade-in slide-in-from-top-2 duration-200">
            <label class="block text-sm font-bold text-sky-900 mb-1">Valor desejado para venda (R$)</label>
            <input v-model="form.price" type="number" step="0.01" min="0" required class="w-full px-3 py-2 text-sm rounded-xl border border-sky-200 bg-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors" placeholder="Ex: 15,00">
          </div>
        </form>
      </div>

      <!-- Rodapé Fixo -->
      <div class="p-4 border-t border-surface-100 flex justify-end gap-2 bg-slate-50/50 shrink-0">
        <button type="button" @click="isOpen = false" class="px-5 py-2 text-sm rounded-xl text-slate-600 hover:bg-surface-200 font-medium transition-colors">
          Cancelar
        </button>
        <button type="submit" form="tradeForm" :disabled="isSubmitting" class="px-5 py-2 text-sm rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 disabled:opacity-50 text-white font-bold shadow-sm transition-all flex items-center gap-2">
          <span v-if="isSubmitting" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          {{ isSubmitting ? 'Processando...' : 'Confirmar' }}
        </button>
      </div>

    </div>
  </div>
</template>
