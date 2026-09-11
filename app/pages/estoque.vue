<script setup>
import { Search, Plus, X, ArrowDownToLine, Calendar, PackageOpen, Pencil, Trash2 } from 'lucide-vue-next'

const supabase = useSupabaseClient()
const { showConfirm, showAlert } = useDialog()
const entries = ref([])
const products = ref([])
const loading = ref(true)
const loadingProducts = ref(true)
const searchQuery = ref('')

// Modal state
const isModalOpen = ref(false)
const isSubmitting = ref(false)
const isEditing = ref(false)
const editingId = ref(null)
const selectedBrand = ref('')

const newEntry = ref({
  product_id: '',
  quantity: 1,
  purchase_price: 0.00,
  purchase_date: new Date().toISOString().split('T')[0],
  expiration_date: ''
})

const fetchEntries = async () => {
  loading.value = true
  // Fetch entries with joined product details
  const { data, error } = await supabase
    .from('inventory_entries')
    .select(`
      *,
      products (
        name,
        brand,
        color,
        size_variation
      )
    `)
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

const uniqueBrands = computed(() => {
  const brands = products.value.map(p => p.brand).filter(Boolean)
  return [...new Set(brands)].sort()
})

const filteredProducts = computed(() => {
  if (!selectedBrand.value) return []
  return products.value.filter(p => p.brand === selectedBrand.value)
})

watch(selectedBrand, () => {
  newEntry.value.product_id = ''
})

const resetForm = () => {
  isEditing.value = false
  editingId.value = null
  selectedBrand.value = ''
  newEntry.value = {
    product_id: '',
    quantity: 1,
    purchase_price: 0.00,
    purchase_date: new Date().toISOString().split('T')[0],
    expiration_date: ''
  }
}

const openEditModal = async (entry) => {
  isEditing.value = true
  editingId.value = entry.id
  
  selectedBrand.value = entry.products?.brand || ''
  
  // Esperar o Vue atualizar o computed filteredProducts devido à mudança da marca
  await nextTick()
  
  newEntry.value = {
    product_id: entry.product_id,
    quantity: entry.quantity,
    purchase_price: entry.purchase_price,
    purchase_date: entry.purchase_date,
    expiration_date: entry.expiration_date || ''
  }
  isModalOpen.value = true
}

const deleteEntry = async (id) => {
  const confirmed = await showConfirm('Tem certeza que deseja excluir esta movimentação de estoque?')
  if (!confirmed) return
  
  const { error } = await supabase.from('inventory_entries').delete().eq('id', id)
  if (!error) {
    fetchEntries()
  } else {
    await showAlert('Erro ao excluir entrada: ' + error.message, 'Erro')
  }
}

const saveEntry = async () => {
  isSubmitting.value = true
  
  // Format data before sending
  const payload = {
    product_id: newEntry.value.product_id,
    quantity: parseInt(newEntry.value.quantity),
    purchase_price: parseFloat(newEntry.value.purchase_price),
    purchase_date: newEntry.value.purchase_date,
    expiration_date: newEntry.value.expiration_date || null
  }

  let error;
  if (isEditing.value) {
    const { error: updateError } = await supabase
      .from('inventory_entries')
      .update(payload)
      .eq('id', editingId.value)
    error = updateError
  } else {
    const { error: insertError } = await supabase
      .from('inventory_entries')
      .insert([payload])
    error = insertError
  }
  
  isSubmitting.value = false
  if (!error) {
    isModalOpen.value = false
    resetForm()
    fetchEntries()
  } else {
    await showAlert('Erro ao salvar entrada: ' + error.message, 'Erro')
  }
}

onMounted(() => {
  fetchEntries()
  fetchProducts()
})

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const [year, month, day] = dateString.split('-')
  return `${day}/${month}/${year}`
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

const filteredEntries = computed(() => {
  if (!searchQuery.value) return entries.value
  const query = searchQuery.value.toLowerCase()
  return entries.value.filter(entry => 
    (entry.products?.name && entry.products.name.toLowerCase().includes(query)) ||
    (entry.products?.brand && entry.products.brand.toLowerCase().includes(query)) ||
    (entry.products?.color && entry.products.color.toLowerCase().includes(query)) ||
    (entry.products?.size_variation && entry.products.size_variation.toLowerCase().includes(query))
  )
})
</script>

<template>
  <div class="space-y-8">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-rose-950 tracking-tight">Movimentações de Estoque</h1>
        <p class="text-slate-400 text-sm mt-1 font-medium">Histórico de entradas e compras de produtos.</p>
      </div>
    </div>

    <!-- Barra de Busca -->
    <div class="bg-white/80 backdrop-blur-md p-2 rounded-full shadow-sm border border-white flex items-center gap-3 w-full max-w-2xl">
      <div class="w-10 h-10 bg-brand-50 rounded-full flex items-center justify-center shrink-0">
        <Search class="w-5 h-5 text-brand-400" />
      </div>
      <input 
        v-model="searchQuery" 
        type="text" 
        placeholder="Buscar por produto, marca, cor..." 
        class="flex-1 bg-transparent border-none focus:outline-none text-rose-950 placeholder-slate-400 font-medium px-2"
      >
    </div>

    <!-- Lista de Entradas -->
    <div class="bg-white/80 backdrop-blur-md rounded-[2rem] shadow-soft overflow-hidden border border-white">
      <div v-if="loading" class="p-12 text-center text-slate-400 font-medium">
        Carregando movimentações...
      </div>
      <div v-else-if="filteredEntries.length === 0" class="p-16 text-center flex flex-col items-center">
        <div class="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mb-4 shadow-inner border border-brand-100/50">
          <PackageOpen class="w-10 h-10 text-brand-300" />
        </div>
        <p class="text-rose-900 font-medium text-lg">Nenhuma entrada registrada</p>
        <p class="text-sm text-slate-400 mt-1">Clique em "Registrar Entrada" para adicionar itens ao seu estoque.</p>
      </div>
      <div v-else class="overflow-x-auto">
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
            <tr v-for="entry in filteredEntries" :key="entry.id" class="border-b border-brand-50/30 hover:bg-white transition-colors group">
              <td class="py-5 px-8">
                <p class="font-semibold text-rose-950 group-hover:text-brand-600 transition-colors">{{ entry.products?.name || 'Produto Excluído' }}</p>
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
                  {{ formatDate(entry.expiration_date) }}
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
                  <button @click="openEditModal(entry)" class="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-full transition-colors" title="Editar">
                    <Pencil class="w-4 h-4" />
                  </button>
                  <button @click="deleteEntry(entry.id)" class="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors" title="Excluir">
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Nova Entrada -->
    <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-rose-950/20 backdrop-blur-sm">
      <div class="bg-white rounded-[2rem] shadow-hover w-full max-w-xl max-h-[90vh] overflow-y-auto border border-white">
        <div class="p-8 border-b border-brand-50 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <h2 class="text-2xl font-bold text-rose-950 flex items-center gap-2">
            <ArrowDownToLine class="w-6 h-6 text-brand-500" />
            {{ isEditing ? 'Editar Movimentação' : 'Registrar Entrada' }}
          </h2>
          <button @click="isModalOpen = false" class="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors">
            <X class="w-5 h-5" />
          </button>
        </div>
        
        <form @submit.prevent="saveEntry" class="p-6 space-y-6">
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">Marca *</label>
              <select v-model="selectedBrand" required class="w-full px-4 py-2.5 rounded-lg border border-surface-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors bg-white">
                <option value="" disabled>Selecione a marca...</option>
                <option v-for="brand in uniqueBrands" :key="brand" :value="brand">
                  {{ brand }}
                </option>
              </select>
              <p v-if="products.length === 0 && !loadingProducts" class="text-sm text-red-500 mt-2">
                Nenhum produto cadastrado. Cadastre um produto primeiro.
              </p>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">Produto *</label>
              <select v-model="newEntry.product_id" required :disabled="!selectedBrand" class="w-full px-4 py-2.5 rounded-lg border border-surface-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors bg-white disabled:opacity-50">
                <option value="" disabled>Selecione a cor...</option>
                <option v-for="prod in filteredProducts" :key="prod.id" :value="prod.id">
                  {{ prod.color || prod.name }} {{ prod.size_variation ? `(${prod.size_variation})` : '' }}
                </option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">Quantidade *</label>
              <input v-model="newEntry.quantity" required type="number" min="1" class="w-full px-4 py-2.5 rounded-lg border border-surface-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors">
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">Custo Unitário (R$) *</label>
              <input v-model="newEntry.purchase_price" required type="number" step="0.01" min="0" class="w-full px-4 py-2.5 rounded-lg border border-surface-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">Data da Compra *</label>
              <input v-model="newEntry.purchase_date" required type="date" class="w-full px-4 py-2.5 rounded-lg border border-surface-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors">
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">Data de Validade</label>
              <input v-model="newEntry.expiration_date" type="date" class="w-full px-4 py-2.5 rounded-lg border border-surface-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors">
              <p class="text-xs text-slate-500 mt-1">Deixe em branco se não aplicável.</p>
            </div>
          </div>

          <div class="bg-brand-50 rounded-lg p-4 flex items-center justify-between">
            <span class="text-brand-800 font-medium">Custo Total:</span>
            <span class="text-xl font-bold text-brand-700">{{ formatCurrency((newEntry.quantity || 0) * (newEntry.purchase_price || 0)) }}</span>
          </div>

          <div class="pt-4 border-t border-surface-200 flex justify-end gap-3">
            <button type="button" @click="isModalOpen = false" class="px-6 py-2.5 rounded-lg text-slate-600 hover:bg-surface-100 font-medium transition-colors">
              Cancelar
            </button>
            <button type="submit" :disabled="isSubmitting || !newEntry.product_id" class="px-6 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-medium shadow-sm transition-colors flex items-center gap-2">
              <span v-if="isSubmitting" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              {{ isSubmitting ? 'Salvando...' : 'Salvar' }}
            </button>
          </div>
        </form>

      </div>
    </div>
  </div>
</template>
