<script setup>
import { Search, Plus, X, ArrowDownToLine, Calendar, PackageOpen, Pencil, Trash2, Grid, LayoutGrid, List, Heart, CheckCircle2, Check } from 'lucide-vue-next'

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const { showConfirm, showAlert } = useDialog()
const entries = ref([])
const products = ref([])
const loading = ref(true)
const loadingProducts = ref(true)
const searchQuery = ref('')
const viewMode = ref('medium') // 'medium', 'large', 'details'

const filterBrand = ref('')
const filterCollection = ref('')
const filterFavoriteLevel = ref('')

const favoriteOptions = [
  { label: 'Gostei', value: 1 },
  { label: 'Adorei', value: 2 },
  { label: 'Super Amei', value: 3 }
]

const expandedImage = ref(null)
const productModal = ref(null)

const openNewModal = () => productModal.value?.openNewModal()
const openEditModal = (entry) => productModal.value?.openEditModal(entry.product_id, entry.id)

const fetchEntries = async () => {
  loading.value = true
  
  const { data: authData } = await supabase.auth.getUser()
  const currentUserId = authData?.user?.id
  
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

const setFavoriteLevel = async (product, level) => {
  if (!product) return;
  
  // Se clicar no mesmo nível, zera a avaliação
  const newValue = product.favorite_level === level ? 0 : level;
  const oldValue = product.favorite_level;
  
  product.favorite_level = newValue;
  
  const { error } = await supabase.from('products').update({ favorite_level: newValue }).eq('id', product.id);
  if (error) {
    product.favorite_level = oldValue;
    await showAlert('Erro', 'Não foi possível atualizar o favorito: ' + error.message);
  }
}

const toggleUsed = async (product) => {
  if (!product) return;
  const newValue = !product.is_used;
  product.is_used = newValue;
  
  const { error } = await supabase.from('products').update({ is_used: newValue }).eq('id', product.id);
  if (error) {
    product.is_used = !newValue;
    await showAlert('Erro', 'Não foi possível atualizar o status de uso: ' + error.message);
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

  if (filterFavoriteLevel.value) {
    result = result.filter(entry => entry.products?.favorite_level === filterFavoriteLevel.value)
  }

  return result
})

const selectedEntries = ref([])

const allSelected = computed(() => {
  return filteredEntries.value.length > 0 && selectedEntries.value.length === filteredEntries.value.length
})

const toggleSelectAll = () => {
  if (allSelected.value) {
    selectedEntries.value = []
  } else {
    selectedEntries.value = filteredEntries.value.map(e => e.id)
  }
}

const toggleSelection = (id) => {
  const index = selectedEntries.value.indexOf(id)
  if (index > -1) {
    selectedEntries.value.splice(index, 1)
  } else {
    selectedEntries.value.push(id)
  }
}

const deleteSelected = async () => {
  if (selectedEntries.value.length === 0) return
  
  const confirmed = await showConfirm(`Tem certeza que deseja excluir ${selectedEntries.value.length} item(ns) selecionado(s)?`)
  if (!confirmed) return
  
  const { error } = await supabase.from('inventory_entries').delete().in('id', selectedEntries.value)
  if (!error) {
    selectedEntries.value = []
    fetchEntries()
  } else {
    await showAlert('Erro ao excluir itens: ' + error.message, 'Erro')
  }
}

watch([searchQuery, filterBrand, filterCollection, filterFavoriteLevel], () => {
  selectedEntries.value = []
})

definePageMeta({
  layout: false,
  middleware: 'auth'
})
</script>

<template>
  <NuxtLayout name="default">
    <template #header-left>
      <p class="text-sm truncate">
        <span class="text-slate-700 font-bold">Meu Acervo de Beleza</span>
        <span class="text-slate-500 font-medium ml-1 hidden sm:inline">- Aqui você organiza todos os seus produtos, como esmaltes, bases, batons e o que mais você amar.</span>
      </p>
    </template>

    <div class="space-y-6">

    <!-- Sticky Header Wrapper para Estoque -->
    <div class="sticky -top-4 md:-top-8 z-40 bg-[#FCF8FA] -mx-4 md:-mx-8 px-4 md:px-8 pb-4 -mt-4 md:-mt-8 mb-6 flex flex-col lg:flex-row lg:items-center gap-4 transition-all">
      <!-- Barra de Busca -->
      <div class="flex-1 min-w-[250px] bg-white/80 backdrop-blur-md p-1.5 px-3 rounded-full shadow-sm border border-white flex items-center gap-2">
        <div class="w-7 h-7 bg-brand-50 rounded-full flex items-center justify-center shrink-0">
          <Search class="w-3.5 h-3.5 text-brand-400" />
        </div>
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Buscar por produto, marca, cor..." 
          class="flex-1 bg-transparent border-none focus:outline-none text-rose-950 placeholder-slate-400 text-sm px-1 min-w-0"
        >
      </div>

      <!-- Filtros na mesma linha -->
      <div class="flex flex-nowrap overflow-x-auto items-center gap-3 bg-white/80 backdrop-blur-md p-1.5 px-3 rounded-full shadow-sm border border-white shrink-0" style="scrollbar-width: none; -ms-overflow-style: none;">
        <div class="flex items-center gap-2 shrink-0">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Marca</span>
          <CustomSelect 
            v-model="filterBrand" 
            :options="uniqueEntryBrands"
            placeholder="Todas"
            variant="ghost"
          />
        </div>
        
        <div class="w-px h-4 bg-slate-200 shrink-0"></div>

        <div class="flex items-center gap-2 shrink-0">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Favoritos</span>
          <CustomSelect 
            v-model="filterFavoriteLevel" 
            :options="favoriteOptions"
            placeholder="Todos"
            variant="ghost"
          >
            <!-- Custom Option Layout -->
            <template #option="{ option }">
              <div class="flex items-center justify-between w-full pr-3">
                <span class="block truncate">{{ option.label }}</span>
                <div class="flex items-center gap-0.5 shrink-0" v-if="option.value">
                  <Heart class="w-3.5 h-3.5 text-rose-500" :class="option.value >= 1 ? 'fill-current' : 'opacity-40'" />
                  <Heart class="w-3.5 h-3.5 text-rose-500" :class="option.value >= 2 ? 'fill-current' : 'opacity-40'" />
                  <Heart class="w-3.5 h-3.5 text-rose-500" :class="option.value >= 3 ? 'fill-current' : 'opacity-40'" />
                </div>
              </div>
            </template>
            <!-- Custom Selected Layout -->
            <template #selected="{ option }">
              <div class="flex items-center gap-1.5" v-if="option && option.value">
                <span class="block truncate text-slate-700 font-medium">{{ option.label }}</span>
                <div class="flex items-center gap-0.5 shrink-0">
                  <Heart class="w-3 h-3 text-rose-500" :class="option.value >= 1 ? 'fill-current' : 'opacity-40'" />
                  <Heart class="w-3 h-3 text-rose-500" :class="option.value >= 2 ? 'fill-current' : 'opacity-40'" />
                  <Heart class="w-3 h-3 text-rose-500" :class="option.value >= 3 ? 'fill-current' : 'opacity-40'" />
                </div>
              </div>
              <span v-else class="block truncate text-slate-700 font-medium">Todos</span>
            </template>
          </CustomSelect>
        </div>
      </div>

      <!-- Controles de Visualização -->
      <div class="bg-white/80 backdrop-blur-md p-1 rounded-full shadow-sm border border-white flex items-center gap-1 shrink-0 hidden sm:flex">
        <button @click="viewMode = 'large'" :class="viewMode === 'large' ? 'bg-brand-50 text-brand-600 shadow-sm' : 'text-slate-400 hover:text-brand-500 hover:bg-slate-50/50'" class="p-1.5 rounded-full transition-all tooltip-bottom" data-tooltip="Ícones grandes">
          <LayoutGrid class="w-4 h-4" />
        </button>
        <button @click="viewMode = 'medium'" :class="viewMode === 'medium' ? 'bg-brand-50 text-brand-600 shadow-sm' : 'text-slate-400 hover:text-brand-500 hover:bg-slate-50/50'" class="p-1.5 rounded-full transition-all tooltip-bottom" data-tooltip="Ícones médios">
          <Grid class="w-4 h-4" />
        </button>
        <div class="w-px h-6 bg-slate-200 mx-1"></div>
        <button @click="viewMode = 'details'" :class="viewMode === 'details' ? 'bg-brand-50 text-brand-600 shadow-sm' : 'text-slate-400 hover:text-brand-500 hover:bg-slate-50/50'" class="p-1.5 rounded-full transition-all tooltip-bottom" data-tooltip="Detalhes">
          <List class="w-4 h-4" />
        </button>
      </div>

      <!-- Registrar Entrada -->
      <div class="flex items-center gap-3 shrink-0">
        <button @click="openNewModal" class="bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 hover:-translate-y-0.5 text-white px-4 py-1.5 rounded-full flex items-center justify-center gap-2 transition-all duration-300 shadow-md shrink-0 text-sm font-bold">
          <Plus class="w-4 h-4" />
          Registrar Entrada
        </button>

        <button 
          :disabled="selectedEntries.length === 0"
          @click="deleteSelected" 
          class="px-4 py-1.5 rounded-full flex items-center justify-center gap-2 transition-all duration-300 text-sm font-bold border"
          :class="selectedEntries.length > 0 ? 'bg-rose-100 hover:bg-rose-200 text-rose-700 border-rose-200 shadow-sm cursor-pointer' : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed opacity-70'"
        >
          <Trash2 class="w-4 h-4" />
          Excluir Selecionados <span v-if="selectedEntries.length > 0">({{ selectedEntries.length }})</span>
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
                <th class="py-5 px-6 font-semibold text-slate-400 text-sm uppercase tracking-wider w-12 text-center">
                  <button 
                    @click="toggleSelectAll"
                    class="w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200 border-2 mx-auto"
                    :class="allSelected ? 'bg-brand-500 border-brand-500 text-white' : 'bg-white border-slate-300 text-transparent hover:border-brand-400'"
                  >
                    <Check class="w-3.5 h-3.5 stroke-[3]" />
                  </button>
                </th>
                <th class="py-5 px-2 font-semibold text-slate-400 text-sm uppercase tracking-wider">Produto</th>
                <th class="py-5 px-8 font-semibold text-slate-400 text-sm uppercase tracking-wider">Data de Compra</th>
                <th class="py-5 px-8 font-semibold text-slate-400 text-sm uppercase tracking-wider">Validade</th>
                <th class="py-5 px-8 font-semibold text-slate-400 text-sm uppercase tracking-wider text-center">Qtd.</th>
                <th class="py-5 px-8 font-semibold text-slate-400 text-sm uppercase tracking-wider text-right">Custo Unit.</th>
                <th class="py-5 px-8 font-semibold text-slate-400 text-sm uppercase tracking-wider text-right">Total</th>
                <th class="py-5 px-8 font-semibold text-slate-400 text-sm uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="entry in filteredEntries" :key="entry.id" class="border-b border-brand-50/30 hover:bg-white transition-colors group" :class="{'bg-brand-50/30': selectedEntries.includes(entry.id)}">
                <td class="py-5 px-6 text-center">
                  <button 
                    @click.stop="toggleSelection(entry.id)"
                    class="w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200 border-2 mx-auto"
                    :class="selectedEntries.includes(entry.id) ? 'bg-brand-500 border-brand-500 text-white' : 'bg-white border-slate-300 text-transparent hover:border-brand-400'"
                  >
                    <Check class="w-3.5 h-3.5 stroke-[3]" />
                  </button>
                </td>
                <td class="py-5 px-2">
                  <div class="flex items-center gap-2 mb-1">
                    <p class="font-semibold text-rose-950 group-hover:text-brand-600 transition-colors">{{ entry.products?.name || 'Produto Excluído' }}</p>
                    <div v-if="entry.products" class="flex items-center gap-1">
                      <div class="flex items-end gap-0.5 group/hearts mr-2">
                        <button @click.stop="setFavoriteLevel(entry.products, 1)" class="p-0.5 transition-colors" :class="entry.products.favorite_level >= 1 ? 'text-rose-500' : 'text-slate-300 hover:text-rose-400'" data-tooltip="Gostei">
                          <Heart class="w-3 h-3" :class="{'fill-current': entry.products.favorite_level >= 1}" />
                        </button>
                        <button @click.stop="setFavoriteLevel(entry.products, 2)" class="p-0.5 transition-colors" :class="entry.products.favorite_level >= 2 ? 'text-rose-500' : 'text-slate-300 hover:text-rose-400'" data-tooltip="Adorei">
                          <Heart class="w-3.5 h-3.5" :class="{'fill-current': entry.products.favorite_level >= 2}" />
                        </button>
                        <button @click.stop="setFavoriteLevel(entry.products, 3)" class="p-0.5 transition-colors" :class="entry.products.favorite_level >= 3 ? 'text-rose-500' : 'text-slate-300 hover:text-rose-400'" data-tooltip="Super Amei">
                          <Heart class="w-4 h-4" :class="{'fill-current': entry.products.favorite_level >= 3}" />
                        </button>
                      </div>
                      <button @click.stop="toggleUsed(entry.products)" class="p-1 rounded-full transition-colors" :class="entry.products.is_used ? 'text-emerald-500' : 'text-slate-300 hover:text-emerald-400'" data-tooltip="Testado/Usado">
                        <CheckCircle2 class="w-4 h-4" />
                      </button>
                    </div>
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
                    <button @click="openEditModal(entry)" class="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-full transition-colors tooltip-left" data-tooltip="Editar">
                      <Pencil class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Ícones Médios e Grandes (Grid) -->
        <div v-else class="grid gap-6" :class="viewMode === 'medium' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'">
          <div v-for="entry in filteredEntries" :key="entry.id" class="bg-white/80 backdrop-blur-md border rounded-[2rem] p-6 shadow-soft hover:shadow-hover transition-all group relative flex flex-col h-full overflow-hidden" :class="selectedEntries.includes(entry.id) ? 'border-brand-400 ring-2 ring-brand-100' : 'border-white'">
            
            <!-- Checkbox de Seleção e Ações -->
            <div class="absolute top-4 right-4 z-20 flex flex-col gap-2">
              <button 
                @click.stop="toggleSelection(entry.id)"
                class="w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 border-2 mx-auto"
                :class="selectedEntries.includes(entry.id) ? 'bg-brand-500 border-brand-500 text-white shadow-md' : 'bg-white/80 border-slate-200 text-transparent hover:border-brand-400 opacity-0 group-hover:opacity-100 shadow-sm backdrop-blur-sm'"
              >
                <Check class="w-3.5 h-3.5 stroke-[3]" />
              </button>

              <button @click="openEditModal(entry)" class="w-7 h-7 bg-white/90 backdrop-blur-sm border border-brand-50 rounded-full flex items-center justify-center text-slate-400 hover:text-brand-600 hover:bg-brand-50 shadow-sm opacity-0 group-hover:opacity-100 transition-all tooltip-left mx-auto" data-tooltip="Editar">
                <Pencil class="w-3.5 h-3.5" />
              </button>
            </div>

            <!-- Indicadores (Favorito e Usado) -->
            <div class="absolute top-4 left-4 flex flex-col items-center gap-1.5 z-10" v-if="entry.products">
              <!-- Hearts Stack -->
              <div class="flex flex-col items-center gap-0.5 group/hearts bg-white/60 hover:bg-white/90 backdrop-blur-sm rounded-full p-1 pb-1.5 transition-colors shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-white/50 hover:border-brand-50" :class="{'opacity-0 group-hover:opacity-100': !entry.products.favorite_level}">
                <button @click.stop="setFavoriteLevel(entry.products, 3)" class="p-0.5 rounded-full transition-all tooltip-right" :class="entry.products.favorite_level >= 3 ? 'text-rose-500' : 'text-slate-300 hover:text-rose-400'" data-tooltip="Super Amei">
                  <Heart class="w-5 h-5" :class="{'fill-current': entry.products.favorite_level >= 3}" />
                </button>
                <button @click.stop="setFavoriteLevel(entry.products, 2)" class="p-0.5 rounded-full transition-all tooltip-right" :class="entry.products.favorite_level >= 2 ? 'text-rose-500' : 'text-slate-300 hover:text-rose-400'" data-tooltip="Adorei">
                  <Heart class="w-4 h-4" :class="{'fill-current': entry.products.favorite_level >= 2}" />
                </button>
                <button @click.stop="setFavoriteLevel(entry.products, 1)" class="p-0.5 rounded-full transition-all tooltip-right" :class="entry.products.favorite_level >= 1 ? 'text-rose-500' : 'text-slate-300 hover:text-rose-400'" data-tooltip="Gostei">
                  <Heart class="w-3.5 h-3.5" :class="{'fill-current': entry.products.favorite_level >= 1}" />
                </button>
              </div>

              <!-- Usado/Testado Button -->
              <button @click.stop="toggleUsed(entry.products)" class="p-1.5 rounded-full transition-all shadow-sm border tooltip-right" :class="entry.products.is_used ? 'text-emerald-500 bg-white border-emerald-100 opacity-100' : 'text-slate-300 bg-white/80 border-transparent opacity-0 group-hover:opacity-100 hover:text-emerald-400'" data-tooltip="Usado / Testado">
                <CheckCircle2 class="w-4 h-4" />
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
  </NuxtLayout>
</template>
