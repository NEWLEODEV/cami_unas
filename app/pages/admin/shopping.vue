<script setup>
import { ref, computed, onMounted } from 'vue'
import { ShoppingBag, Search, Plus, Edit2, MousePointerClick, FolderTree, Filter, Trash2 } from 'lucide-vue-next'

definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

const supabase = useSupabaseClient()
const { showConfirm, showAlert } = useDialog()
const activeTab = ref('products') // 'products' ou 'categories'

// Data
const products = ref([])
const categories = ref([])
const loading = ref(true)
const selectedCategoryFilter = ref('') // ID da categoria para filtro

// Computed para filtrar produtos
const filteredProducts = computed(() => {
  if (!selectedCategoryFilter.value) return products.value
  return products.value.filter(p => p.shopping_category_id === selectedCategoryFilter.value)
})

// Modals State
const showProductModal = ref(false)
const showCategoryModal = ref(false)
const selectedProduct = ref(null)
const selectedCategory = ref(null)

const fetchData = async () => {
  loading.value = true
  
  // Buscar categorias
  const { data: catsData } = await supabase
    .from('shopping_categories')
    .select('*')
    .order('name')
    
  if (catsData) categories.value = catsData
  
  // Buscar produtos
  const { data: prodsData } = await supabase
    .from('shopping_products')
    .select('*')
    .order('created_at', { ascending: false })
    
  if (prodsData) products.value = prodsData
  
  loading.value = false
}

onMounted(() => {
  fetchData()
})

// Helpers
const getCategoryName = (id) => {
  const cat = categories.value.find(c => c.id === id)
  return cat ? cat.name : 'Desconhecida'
}

// Modal Actions
const openCategoryModal = (cat = null) => {
  selectedCategory.value = cat
  showCategoryModal.value = true
}

const openProductModal = (prod = null) => {
  selectedProduct.value = prod
  showProductModal.value = true
}

const onModalSaved = () => {
  fetchData()
}

const deleteProduct = async (id) => {
  const confirmed = await showConfirm('Tem certeza que deseja excluir este produto da vitrine?')
  if (!confirmed) return
  
  const { error } = await supabase.from('shopping_products').delete().eq('id', id)
  if (!error) {
    fetchData()
  } else {
    await showAlert('Erro ao excluir produto: ' + error.message, 'Erro')
  }
}

const deleteCategory = async (id) => {
  const hasProducts = products.value.some(p => p.shopping_category_id === id)
  if (hasProducts) {
    await showAlert('Esta categoria possui produtos vinculados. Remova ou altere a categoria dos produtos primeiro.', 'Não é possível excluir')
    return
  }
  
  const confirmed = await showConfirm('Tem certeza que deseja excluir esta categoria?')
  if (!confirmed) return
  
  const { error } = await supabase.from('shopping_categories').delete().eq('id', id)
  if (!error) {
    fetchData()
  } else {
    await showAlert('Erro ao excluir categoria: ' + error.message, 'Erro')
  }
}
</script>

<template>
  <div class="h-full flex flex-col space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
          <ShoppingBag class="w-8 h-8 text-brand-500" />
          Vitrine (Shopping)
        </h1>
        <p class="text-slate-500 mt-1">Gerencie os produtos afiliados e organize por categorias.</p>
      </div>
      
      <!-- Actions -->
      <div class="flex gap-3">
        <button v-if="activeTab === 'categories'" @click="openCategoryModal()" class="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors shadow-sm">
          <Plus class="w-4 h-4" /> Nova Categoria
        </button>
        <button v-if="activeTab === 'products'" @click="openProductModal()" class="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors shadow-sm">
          <Plus class="w-4 h-4" /> Novo Produto
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-2 border-b border-slate-200">
      <button 
        @click="activeTab = 'products'"
        :class="activeTab === 'products' ? 'border-brand-500 text-brand-600 bg-brand-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'"
        class="px-6 py-3 border-b-2 font-bold text-sm transition-all flex items-center gap-2 rounded-t-xl"
      >
        <ShoppingBag class="w-4 h-4" />
        Produtos
      </button>
      <button 
        @click="activeTab = 'categories'"
        :class="activeTab === 'categories' ? 'border-brand-500 text-brand-600 bg-brand-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'"
        class="px-6 py-3 border-b-2 font-bold text-sm transition-all flex items-center gap-2 rounded-t-xl"
      >
        <FolderTree class="w-4 h-4" />
        Categorias
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="w-10 h-10 border-4 border-brand-100 border-t-brand-500 rounded-full animate-spin"></div>
    </div>

    <!-- Conteúdo da Tabela de Produtos -->
    <div v-else-if="activeTab === 'products'" class="flex-1 flex flex-col space-y-4">
      
      <!-- Filtro de Categorias -->
      <div class="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm w-full sm:w-auto self-start">
        <Filter class="w-4 h-4 text-slate-400 ml-2 shrink-0" />
        <select 
          v-model="selectedCategoryFilter" 
          class="bg-transparent border-none text-sm font-bold text-slate-700 focus:outline-none focus:ring-0 cursor-pointer pr-4"
        >
          <option value="">Todas as Categorias</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">
            {{ cat.name }}
          </option>
        </select>
      </div>

      <div class="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div v-if="filteredProducts.length === 0" class="flex-1 flex flex-col items-center justify-center p-12 text-slate-400">
          <ShoppingBag class="w-12 h-12 mb-3 opacity-50" />
          <p class="font-medium text-lg">Nenhum produto encontrado</p>
          <p class="text-sm">Nenhum item corresponde a este filtro ou você ainda não cadastrou nenhum.</p>
        </div>
        
        <div v-else class="overflow-x-auto flex-1">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
              <th class="p-4 font-bold">Produto</th>
              <th class="p-4 font-bold">Categoria</th>
              <th class="p-4 font-bold">Status</th>
              <th class="p-4 font-bold text-center">Cliques</th>
              <th class="p-4 font-bold text-right">Ação</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="prod in filteredProducts" :key="prod.id" class="hover:bg-slate-50 transition-colors">
              <td class="p-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                    <img v-if="prod.image_url" :src="prod.image_url" class="w-full h-full object-cover" />
                    <ShoppingBag v-else class="w-5 h-5 text-slate-300" />
                  </div>
                  <div>
                    <p class="font-bold text-slate-800 text-sm leading-tight flex items-center flex-wrap gap-1">
                      {{ prod.title }}
                      <span v-if="prod.is_sponsored" class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wider ml-1 border border-amber-200">Patrocinado</span>
                      <span v-if="prod.is_offer" class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-brand-100 text-brand-700 uppercase tracking-wider ml-1 border border-brand-200">Oferta</span>
                    </p>
                    <p class="text-xs text-slate-500 mt-0.5 max-w-[200px] truncate" :title="prod.affiliate_url">{{ prod.affiliate_url }}</p>
                  </div>
                </div>
              </td>
              <td class="p-4">
                <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                  {{ getCategoryName(prod.shopping_category_id) }}
                </span>
              </td>
              <td class="p-4">
                <span v-if="prod.is_active" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Ativo
                </span>
                <span v-else class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
                  <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Inativo
                </span>
              </td>
              <td class="p-4 text-center">
                <div class="flex flex-col items-center justify-center">
                  <span class="font-bold text-slate-800 text-lg flex items-center gap-1.5">
                    {{ prod.click_count || 0 }}
                  </span>
                  <span class="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">Visitas</span>
                </div>
              </td>
              <td class="p-4 text-right">
                <div class="flex justify-end gap-2">
                  <button @click="openProductModal(prod)" class="p-2 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors border border-transparent hover:border-brand-200 inline-flex items-center gap-2 text-sm font-bold">
                    <Edit2 class="w-4 h-4" /> Editar
                  </button>
                  <button @click="deleteProduct(prod.id)" class="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200 inline-flex items-center gap-2 text-sm font-bold">
                    <Trash2 class="w-4 h-4" /> Excluir
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      </div>
    </div>

    <!-- Conteúdo da Tabela de Categorias -->
    <div v-else-if="activeTab === 'categories'" class="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      <div v-if="categories.length === 0" class="flex-1 flex flex-col items-center justify-center p-12 text-slate-400">
        <FolderTree class="w-12 h-12 mb-3 opacity-50" />
        <p class="font-medium text-lg">Nenhuma categoria</p>
        <p class="text-sm">Clique em "Nova Categoria" para começar.</p>
      </div>
      
      <div v-else class="overflow-x-auto flex-1">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
              <th class="p-4 font-bold w-1/3">Nome</th>
              <th class="p-4 font-bold w-1/3">Slug</th>
              <th class="p-4 font-bold w-1/6">Status</th>
              <th class="p-4 font-bold text-right w-1/6">Ação</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="cat in categories" :key="cat.id" class="hover:bg-slate-50 transition-colors">
              <td class="p-4">
                <p class="font-bold text-slate-800">{{ cat.name }}</p>
              </td>
              <td class="p-4">
                <code class="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-mono border border-slate-200">
                  {{ cat.slug }}
                </code>
              </td>
              <td class="p-4">
                <span v-if="cat.is_active" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Ativa
                </span>
                <span v-else class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
                  <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Inativa
                </span>
              </td>
              <td class="p-4 text-right">
                <div class="flex justify-end gap-2">
                  <button @click="openCategoryModal(cat)" class="p-2 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors border border-transparent hover:border-brand-200 inline-flex items-center gap-2 text-sm font-bold">
                    <Edit2 class="w-4 h-4" /> Editar
                  </button>
                  <button @click="deleteCategory(cat.id)" class="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200 inline-flex items-center gap-2 text-sm font-bold">
                    <Trash2 class="w-4 h-4" /> Excluir
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modals -->
    <AdminCategoryModal 
      v-if="showCategoryModal" 
      :category="selectedCategory" 
      @close="showCategoryModal = false" 
      @saved="onModalSaved" 
    />
    
    <AdminProductModal 
      v-if="showProductModal" 
      :product="selectedProduct" 
      :categories="categories"
      @close="showProductModal = false" 
      @saved="onModalSaved" 
    />
  </div>
</template>
