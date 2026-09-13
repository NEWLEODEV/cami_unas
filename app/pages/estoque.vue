<script setup>
import { Search, Plus, X, ArrowDownToLine, Calendar, PackageOpen, Pencil, Trash2, Grid, LayoutGrid, List } from 'lucide-vue-next'

const supabase = useSupabaseClient()
const { showConfirm, showAlert } = useDialog()
const entries = ref([])
const products = ref([])
const loading = ref(true)
const loadingProducts = ref(true)
const searchQuery = ref('')
const viewMode = ref('medium') // 'medium', 'large', 'details'

const filterBrand = ref('')
const filterCollection = ref('')
const filterMaxPrice = ref('')

const expandedImage = ref(null)
const productModal = ref(null)

const openNewModal = () => productModal.value?.openNewModal()
const openEditModal = (entry) => productModal.value?.openEditModal(entry.product_id, entry.id)

const fetchEntries = async () => {
  loading.value = true
  const { data, error } = await supabase
    .from('inventory_entries')
    .select(`
      *,
      products (
        name,
        brand,
        color,
        collection,
        size_variation,
        image_url
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

onMounted(() => {
  fetchEntries()
  fetchProducts()
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

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(entry => 
      (entry.products?.name && entry.products.name.toLowerCase().includes(query)) ||
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

  if (filterMaxPrice.value !== null && filterMaxPrice.value !== '') {
    result = result.filter(entry => entry.purchase_price <= filterMaxPrice.value)
  }

  return result
})
</script>

<template>
  <div class="space-y-8">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-rose-950 tracking-tight">Estoque</h1>
        <p class="text-slate-400 text-sm mt-1 font-medium">Lista de todas as movimentações de estoque</p>
      </div>
      <button @click="openNewModal" class="bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 hover:-translate-y-0.5 text-white px-6 py-3 rounded-full flex items-center justify-center gap-2 transition-all duration-300 shadow-md">
        <Plus class="w-5 h-5" />
        Registrar Entrada
      </button>
    </div>

    <div class="flex items-center gap-4 w-full z-20 relative">
      <!-- Barra de Busca -->
      <div class="flex-1 min-w-[250px] bg-white/80 backdrop-blur-md p-2 rounded-full shadow-sm border border-white flex items-center gap-3">
        <div class="w-10 h-10 bg-brand-50 rounded-full flex items-center justify-center shrink-0">
          <Search class="w-5 h-5 text-brand-400" />
        </div>
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Buscar por produto, marca, cor..." 
          class="flex-1 bg-transparent border-none focus:outline-none text-rose-950 placeholder-slate-400 font-medium px-2 min-w-0"
        >
      </div>

      <!-- Filtros na mesma linha -->
      <div class="flex items-center gap-3 bg-white/80 backdrop-blur-md p-2.5 px-4 rounded-full shadow-sm border border-white shrink-0 hidden lg:flex">
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Marca</span>
          <CustomSelect 
            v-model="filterBrand" 
            :options="uniqueEntryBrands"
            placeholder="Todas"
            variant="ghost"
          />
        </div>
        
        <div class="w-px h-5 bg-slate-200"></div>

        <div class="flex items-center gap-2">
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Coleção</span>
          <CustomSelect 
            v-model="filterCollection" 
            :options="uniqueCollections"
            placeholder="Todas"
            variant="ghost"
          />
        </div>

        <div class="w-px h-5 bg-slate-200"></div>

        <div class="flex items-center gap-2">
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Máx (R$)</span>
          <input v-model.number="filterMaxPrice" type="number" placeholder="Ex: 15" min="0" step="0.01" class="text-sm bg-transparent border-none focus:ring-0 outline-none text-slate-700 font-medium p-0 w-16 placeholder-slate-300">
        </div>
      </div>

      <!-- Controles de Visualização -->
      <div class="bg-white/80 backdrop-blur-md p-1.5 rounded-full shadow-sm border border-white flex items-center gap-1 shrink-0 hidden sm:flex">
        <button @click="viewMode = 'large'" :class="viewMode === 'large' ? 'bg-brand-50 text-brand-600 shadow-sm' : 'text-slate-400 hover:text-brand-500 hover:bg-slate-50/50'" class="p-2 rounded-full transition-all" title="Ícones grandes">
          <LayoutGrid class="w-5 h-5" />
        </button>
        <button @click="viewMode = 'medium'" :class="viewMode === 'medium' ? 'bg-brand-50 text-brand-600 shadow-sm' : 'text-slate-400 hover:text-brand-500 hover:bg-slate-50/50'" class="p-2 rounded-full transition-all" title="Ícones médios">
          <Grid class="w-5 h-5" />
        </button>
        <div class="w-px h-6 bg-slate-200 mx-1"></div>
        <button @click="viewMode = 'details'" :class="viewMode === 'details' ? 'bg-brand-50 text-brand-600 shadow-sm' : 'text-slate-400 hover:text-brand-500 hover:bg-slate-50/50'" class="p-2 rounded-full transition-all" title="Detalhes">
          <List class="w-5 h-5" />
        </button>
      </div>
    </div>

    <!-- Lista de Entradas -->
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

        <!-- Ícones Médios e Grandes (Grid) -->
        <div v-else class="grid gap-6" :class="viewMode === 'medium' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'">
          <div v-for="entry in filteredEntries" :key="entry.id" class="bg-white/80 backdrop-blur-md border border-white rounded-[2rem] p-6 shadow-soft hover:shadow-hover transition-all group relative flex flex-col h-full overflow-hidden">
            <!-- Ações -->
            <div class="absolute top-4 right-4 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-white/90 backdrop-blur-sm rounded-full p-1 shadow-sm border border-brand-50">
              <button @click="openEditModal(entry)" class="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-full transition-colors" title="Editar">
                <Pencil class="w-3.5 h-3.5" />
              </button>
              <button @click="deleteEntry(entry.id)" class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors" title="Excluir">
                <Trash2 class="w-3.5 h-3.5" />
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
                <div class="flex items-center justify-between text-sm">
                  <span class="text-slate-500 font-medium">Validade</span>
                  <span class="font-medium px-2 py-0.5 rounded-md" :class="entry.expiration_date && new Date(entry.expiration_date) < new Date(new Date().setMonth(new Date().getMonth() + 1)) ? 'text-orange-600 bg-orange-50 border border-orange-100' : 'text-slate-700'">
                    {{ formatMonthYear(entry.expiration_date) }}
                  </span>
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

    <ProductFormModal ref="productModal" @saved="fetchEntries" />

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
</template>
