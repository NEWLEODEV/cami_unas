<script setup>
import { Search, Plus, X, Package, Pencil, Trash2 } from 'lucide-vue-next'

const supabase = useSupabaseClient()
const { showConfirm, showAlert } = useDialog()
const products = ref([])
const loading = ref(true)

// Modal state
const isModalOpen = ref(false)
const isSubmitting = ref(false)
const isEditing = ref(false)
const editingId = ref(null)

const predefinedBrands = [
  '5cinco', 'Ana Hickmann', 'Anita', 'Avon', 'Bauny', 'Bella Brasil', 'Blant', 
  'Chanel', 'Colorama', 'Cora', 'Cuccio', 'Dailus', 'Dior', 'Essence', 'Essie', 
  'Fortilon', 'Granado', 'Hits', 'Ideal', 'Impala', 'Kiko Milano', 'Ludurana', 
  'Mavala', 'Mohda', 'Natura', 'Novo Toque', 'OPI', 'Orly', 'Revlon', 'Risqué', 
  'Risqué GEL', 'Top Beauty'
]

const selectedBrand = ref(predefinedBrands[0])
const customBrand = ref('')

const newProduct = ref({
  type: 'Cremoso',
  category: 'Esmalte',
  brand: '',
  color: '',
  collection: '',
  unit_measure: 'Mililitro',
  size_variation: '',
  initial_quantity: 1,
  initial_price: 0.00,
  initial_purchase_date: new Date().toISOString().split('T')[0],
  initial_expiration_date: ''
})

const getProductType = (name) => {
  const match = name?.match(/\((.*?)\)$/)
  return match && match[1] ? match[1] : 'Indefinido'
}

const fetchProducts = async () => {
  loading.value = true
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)
  
  if (!error && data) {
    products.value = data
  }
  loading.value = false
}

const resetForm = () => {
  isEditing.value = false
  editingId.value = null
  selectedBrand.value = predefinedBrands[0]
  customBrand.value = ''
  newProduct.value = {
    type: 'Cremoso', category: 'Esmalte', brand: '', color: '', collection: '', unit_measure: 'Mililitro', size_variation: '',
    initial_quantity: 1, initial_price: 0.00, initial_purchase_date: new Date().toISOString().split('T')[0], initial_expiration_date: ''
  }
}

const openEditModal = (product) => {
  isEditing.value = true
  editingId.value = product.id
  
  if (predefinedBrands.includes(product.brand)) {
    selectedBrand.value = product.brand
    customBrand.value = ''
  } else {
    selectedBrand.value = 'Outra'
    customBrand.value = product.brand
  }
  
  newProduct.value = {
    type: getProductType(product.name) !== 'Indefinido' ? getProductType(product.name) : 'Cremoso',
    category: product.category,
    brand: product.brand,
    color: product.color,
    collection: product.collection || '',
    unit_measure: product.unit_measure,
    size_variation: product.size_variation || '',
    initial_quantity: 1, initial_price: 0.00, initial_purchase_date: new Date().toISOString().split('T')[0], initial_expiration_date: ''
  }
  isModalOpen.value = true
}

const deleteProduct = async (id) => {
  const confirmed = await showConfirm('Tem certeza que deseja excluir este produto?')
  if (!confirmed) return
  
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (!error) {
    fetchProducts()
  } else {
    await showAlert('Erro ao excluir produto: ' + error.message, 'Erro')
  }
}

const saveProduct = async () => {
  isSubmitting.value = true
  
  const finalBrand = selectedBrand.value === 'Outra' ? customBrand.value : selectedBrand.value;
  newProduct.value.brand = finalBrand;

  const generatedName = `${finalBrand} ${newProduct.value.color} (${newProduct.value.type})`.trim()

  const payload = {
    name: generatedName,
    category: newProduct.value.category,
    brand: finalBrand,
    color: newProduct.value.color,
    collection: newProduct.value.collection,
    unit_measure: newProduct.value.unit_measure,
    size_variation: newProduct.value.size_variation
  }

  let error;
  if (isEditing.value) {
    const { error: updateError } = await supabase
      .from('products')
      .update(payload)
      .eq('id', editingId.value)
    error = updateError
  } else {
    payload.sku = `PRD-${Date.now()}`
    payload.barcode = null
    const { data: insertedProduct, error: insertError } = await supabase
      .from('products')
      .insert([payload])
      .select()
      
    error = insertError

    // Insert initial stock if product was created successfully
    if (!error && insertedProduct && insertedProduct.length > 0) {
      const productId = insertedProduct[0].id
      
      const inventoryPayload = {
        product_id: productId,
        quantity: parseInt(newProduct.value.initial_quantity) || 1,
        purchase_price: parseFloat(newProduct.value.initial_price) || 0,
        purchase_date: newProduct.value.initial_purchase_date,
        expiration_date: newProduct.value.initial_expiration_date || null
      }

      const { error: inventoryError } = await supabase
        .from('inventory_entries')
        .insert([inventoryPayload])
        
      if (inventoryError) {
        await showAlert('Produto criado, mas houve erro ao registrar estoque inicial: ' + inventoryError.message, 'Erro de Estoque')
      }
    }
  }
  
  isSubmitting.value = false
  if (!error) {
    isModalOpen.value = false
    resetForm()
    fetchProducts()
  } else {
    await showAlert('Erro ao salvar produto: ' + error.message, 'Erro')
  }
}

onMounted(() => {
  fetchProducts()
})

</script>

<template>
  <div class="space-y-8">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <h1 class="text-3xl font-bold text-rose-950 tracking-tight">Catálogo de Produtos</h1>
      <button @click="isModalOpen = true" class="bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 hover:-translate-y-0.5 text-white px-6 py-3 rounded-full flex items-center justify-center gap-2 transition-all duration-300 shadow-md">
        <Plus class="w-5 h-5" />
        Novo Produto
      </button>
    </div>



    <!-- Lista de Produtos -->
    <div class="bg-white/80 backdrop-blur-md rounded-[2rem] shadow-soft overflow-hidden border border-white">
      <div class="px-8 py-6 border-b border-brand-50/50">
        <h2 class="text-xl font-bold text-rose-950">Últimos itens cadastrados</h2>
      </div>
      
      <div v-if="loading" class="p-12 text-center text-slate-400 font-medium">
        Carregando produtos...
      </div>
      <div v-else-if="products.length === 0" class="p-16 text-center flex flex-col items-center">
        <div class="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mb-4 shadow-inner border border-brand-100/50">
          <Package class="w-10 h-10 text-brand-300" />
        </div>
        <p class="text-rose-900 font-medium text-lg">Nenhum produto encontrado</p>
        <p class="text-sm text-slate-400 mt-1">Tente buscar por outro termo ou cadastre um novo produto.</p>
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-brand-50/50">
              <th class="py-5 px-8 font-semibold text-slate-400 text-sm uppercase tracking-wider">Produto</th>
              <th class="py-5 px-8 font-semibold text-slate-400 text-sm uppercase tracking-wider">Marca</th>
              <th class="py-5 px-8 font-semibold text-slate-400 text-sm uppercase tracking-wider">Coleção</th>
              <th class="py-5 px-8 font-semibold text-slate-400 text-sm uppercase tracking-wider">Categoria</th>
              <th class="py-5 px-8 font-semibold text-slate-400 text-sm uppercase tracking-wider">Tipo</th>
              <th class="py-5 px-8 font-semibold text-slate-400 text-sm uppercase tracking-wider text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in products" :key="product.id" class="border-b border-brand-50/30 hover:bg-white transition-colors group">
              <td class="py-5 px-8">
                <p class="font-semibold text-rose-950 group-hover:text-brand-600 transition-colors">{{ product.name }}</p>
                <p class="text-sm text-slate-400 mt-0.5">{{ product.color }} {{ product.size_variation ? `• ${product.size_variation}` : '' }}</p>
              </td>
              <td class="py-5 px-8 font-medium text-slate-500">{{ product.brand }}</td>
              <td class="py-5 px-8 font-medium text-slate-500">{{ product.collection || '-' }}</td>
              <td class="py-5 px-8">
                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-600 border border-brand-100/50">
                  {{ product.category }}
                </span>
              </td>
              <td class="py-5 px-8 text-sm text-slate-500 font-medium">
                {{ getProductType(product.name) }}
              </td>
              <td class="py-5 px-8 text-right">
                <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button @click="openEditModal(product)" class="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-full transition-colors" title="Editar">
                    <Pencil class="w-4 h-4" />
                  </button>
                  <button @click="deleteProduct(product.id)" class="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors" title="Excluir">
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Novo Produto -->
    <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-rose-950/20 backdrop-blur-sm">
      <div class="bg-white rounded-[2rem] shadow-hover w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-white">
        <div class="p-4 border-b border-brand-50 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <h2 class="text-xl font-bold text-rose-950">{{ isEditing ? 'Editar Produto' : 'Cadastrar Novo Produto' }}</h2>
          <button @click="isModalOpen = false" class="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors">
            <X class="w-5 h-5" />
          </button>
        </div>
        
        <form @submit.prevent="saveProduct" class="p-5 space-y-3">
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <!-- Categoria e Marca -->
            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1">Categoria *</label>
              <select v-model="newProduct.category" required class="w-full px-3 py-1.5 text-sm rounded-lg border border-surface-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors">
                <option value="Esmalte">Esmalte</option>
                <option value="Base/Tratamento">Base / Tratamento</option>
                <option value="Utensílio">Utensílio</option>
                <option value="Descartável">Descartável</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1">Marca *</label>
              <select v-model="selectedBrand" required class="w-full px-3 py-1.5 text-sm rounded-lg border border-surface-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors" :class="{'mb-2': selectedBrand === 'Outra'}">
                <option v-for="brand in predefinedBrands" :key="brand" :value="brand">{{ brand }}</option>
                <option value="Outra">Outra (incluir marca)</option>
              </select>
              <input v-if="selectedBrand === 'Outra'" v-model="customBrand" required type="text" class="w-full px-3 py-1.5 text-sm rounded-lg border border-surface-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors" placeholder="Digite o nome da marca">
            </div>

            <!-- Cor e Tipo -->
            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1">Cor *</label>
              <input v-model="newProduct.color" required type="text" class="w-full px-3 py-1.5 text-sm rounded-lg border border-surface-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors" placeholder="Ex: Maçã do Amor">
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1">Tipo *</label>
              <select v-model="newProduct.type" required class="w-full px-3 py-1.5 text-sm rounded-lg border border-surface-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors">
                <option value="Cremoso">Cremoso</option>
                <option value="Perolado e Cintilante">Perolado e Cintilante</option>
                <option value="Glitter">Glitter</option>
                <option value="Fosco">Fosco</option>
                <option value="Metálico">Metálico</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            <!-- Coleção e Vazio para alinhar -->
            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1">Coleção</label>
              <input v-model="newProduct.collection" type="text" class="w-full px-3 py-1.5 text-sm rounded-lg border border-surface-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors" placeholder="Opcional">
            </div>
            <div></div>

            <!-- Unidade e Tamanho -->
            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1">Unidade de Medida *</label>
              <select v-model="newProduct.unit_measure" required class="w-full px-3 py-1.5 text-sm rounded-lg border border-surface-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors">
                <option value="Unidade">Unidade (un)</option>
                <option value="Mililitro">Mililitro (ml)</option>
                <option value="Grama">Grama (g)</option>
                <option value="Kit">Kit</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-700 mb-1">Variação / Tamanho</label>
              <input v-model="newProduct.size_variation" type="text" class="w-full px-3 py-1.5 text-sm rounded-lg border border-surface-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors" placeholder="Ex: 8ml, Pacote com 100...">
            </div>
          </div>

          <!-- Estoque Inicial (Apenas Novo Produto) -->
          <div v-if="!isEditing" class="pt-3 border-t border-surface-200">
            <h3 class="text-base font-bold text-rose-950 mb-2 flex items-center gap-2">
              <Package class="w-4 h-4 text-brand-500" />
              Estoque Inicial
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label class="block text-xs font-medium text-slate-700 mb-1">Quantidade *</label>
                <input v-model="newProduct.initial_quantity" required type="number" min="1" class="w-full px-3 py-1.5 text-sm rounded-lg border border-surface-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors">
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-700 mb-1">Custo Unitário (R$) *</label>
                <input v-model="newProduct.initial_price" required type="number" step="0.01" min="0" class="w-full px-3 py-1.5 text-sm rounded-lg border border-surface-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors">
              </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-slate-700 mb-1">Data da Compra *</label>
                <input v-model="newProduct.initial_purchase_date" required type="date" class="w-full px-3 py-1.5 text-sm rounded-lg border border-surface-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors">
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-700 mb-1">Data de Validade</label>
                <input v-model="newProduct.initial_expiration_date" type="date" class="w-full px-3 py-1.5 text-sm rounded-lg border border-surface-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors">
                <p class="text-[10px] text-slate-500 mt-1">Opcional</p>
              </div>
            </div>
          </div>

          <div class="pt-3 border-t border-surface-200 flex justify-end gap-2">
            <button type="button" @click="isModalOpen = false" class="px-5 py-2 text-sm rounded-lg text-slate-600 hover:bg-surface-100 font-medium transition-colors">
              Cancelar
            </button>
            <button type="submit" :disabled="isSubmitting" class="px-5 py-2 text-sm rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-medium shadow-sm transition-colors flex items-center gap-2">
              <span v-if="isSubmitting" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              {{ isSubmitting ? 'Salvando...' : 'Salvar Produto' }}
            </button>
          </div>
        </form>

      </div>
    </div>
  </div>
</template>
