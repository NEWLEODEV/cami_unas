<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { X, Package, ImagePlus, Camera } from 'lucide-vue-next'
import imageCompression from 'browser-image-compression'

const supabase = useSupabaseClient()
const { showAlert } = useDialog()

const emit = defineEmits(['saved'])

const formatTitleCase = (str) => {
  if (!str) return str;
  return str.trim().split(/\s+/).map((word, index) => {
    const lower = word.toLowerCase();
    if (index > 0 && ['do', 'da', 'de', 'e', 'das', 'dos', 'com', 'sem', 'para'].includes(lower)) return lower;
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');
}

const isModalOpen = ref(false)
const isSubmitting = ref(false)
const isEditing = ref(false)
const editingId = ref(null)
const selectedImageFile = ref(null)
const imagePreview = ref(null)
const imageUrlInput = ref('')


const handleImageSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    selectedImageFile.value = file
    imageUrlInput.value = ''
    imagePreview.value = URL.createObjectURL(file)
  }
}

const handleUrlInput = () => {
  if (imageUrlInput.value) {
    selectedImageFile.value = null
    imagePreview.value = imageUrlInput.value
  } else {
    imagePreview.value = null
  }
}

const predefinedBrands = [
  '5cinco', 'Ana Hickmann', 'Anita', 'Avon', 'Base Fosca', 'Bauny', 'Bella Brasil', 'Blant',
  'CUCCIO', 'Chanel', 'Colorama', 'Cora', 'Cuccio', 'Dailus', 'Dior', 'Essence', 'Essie',
  'Fortilon', 'Genérico', 'Granado', 'Hits', 'Ideal', 'Impala', 'Kiko Milano', 'Ludurana',
  'Mavala', 'Mohda', 'Natura', 'Novo Toque', 'OPI', 'Opi', 'Orly', 'Revlon', 'Risqué',
  'Risqué GEL', 'Top Beauty', 'Top Brilho'
]

const availableBrands = ref([...predefinedBrands])

const selectedBrand = ref(predefinedBrands[0])
const customBrand = ref('')

const newProduct = ref({
  category: 'Esmalte',
  brand: '',
  color: '',
  collection: '',
  description: '',
  unit_measure: 'Mililitro',
  size_variation: '',
  initial_quantity: 1,
  initial_price: 0.00,
  initial_purchase_date: new Date().toISOString().split('T')[0],
  initial_expiration_date: '',
  inventory_id: null
})

const currentBrandOptions = computed(() => {
  if (newProduct.value.category === 'Maquiagem') {
    return ['Genérica']
  }
  if (['Utensílio', 'Descartável', 'Outros'].includes(newProduct.value.category)) {
    return ['Genérico']
  }
  return availableBrands.value
})

watch(() => newProduct.value.category, (newCategory) => {
  if (newCategory === 'Maquiagem') {
    selectedBrand.value = 'Genérica'
  } else if (['Utensílio', 'Descartável', 'Outros'].includes(newCategory)) {
    selectedBrand.value = 'Genérico'
  } else {
    if (!availableBrands.value.includes(selectedBrand.value) && selectedBrand.value !== 'Outra') {
      selectedBrand.value = availableBrands.value[0] || predefinedBrands[0]
    }
  }
})

const fetchMetadata = async () => {
  const { data } = await supabase.from('products').select('name, brand')
  if (data) {
    const dbBrands = data.map(p => p.brand).filter(Boolean)
    availableBrands.value = [...new Set([...predefinedBrands, ...dbBrands])].sort()
  }
}

onMounted(() => {
  fetchMetadata()
})

const resetForm = () => {
  isEditing.value = false
  editingId.value = null
  selectedBrand.value = predefinedBrands[0]
  customBrand.value = ''
  newProduct.value = {
    category: 'Esmalte', brand: '', color: '', collection: '', description: '', unit_measure: 'Mililitro', size_variation: '',
    initial_quantity: 1, initial_price: 0.00, initial_purchase_date: new Date().toISOString().split('T')[0], initial_expiration_date: '', image_url: null, inventory_id: null
  }
  selectedImageFile.value = null
  imageUrlInput.value = ''
  imagePreview.value = null
}

const formatExpirationDateInput = (e) => {
  let value = e.target.value.replace(/\D/g, '')
  if (value.length > 2) {
    value = value.substring(0, 2) + '/' + value.substring(2, 6)
  }
  newProduct.value.initial_expiration_date = value
}

const openNewModal = () => {
  resetForm()
  isModalOpen.value = true
}

const openEditModal = async (productId, inventoryEntryId = null) => {
  resetForm()
  isEditing.value = true
  editingId.value = productId
  
  const { data: productData } = await supabase.from('products').select('*').eq('id', productId).single()
  if (!productData) {
    await showAlert('Erro', 'Produto não encontrado.')
    return
  }
  const product = productData
  
  if (predefinedBrands.includes(product.brand)) {
    selectedBrand.value = product.brand
    customBrand.value = ''
  } else {
    selectedBrand.value = 'Outra'
    customBrand.value = product.brand
  }

  newProduct.value = {
    category: product.category,
    brand: product.brand,
    color: product.color,
    collection: product.collection || '',
    description: product.description || '',
    unit_measure: product.unit_measure,
    size_variation: product.size_variation || '',
    initial_quantity: 1, initial_price: 0.00, initial_purchase_date: new Date().toISOString().split('T')[0], initial_expiration_date: '',
    image_url: product.image_url || null,
    inventory_id: null
  }
  selectedImageFile.value = null
  imageUrlInput.value = product.image_url || ''
  imagePreview.value = product.image_url || null

  let query = supabase.from('inventory_entries').select('*').eq('product_id', product.id)
  if (inventoryEntryId) {
    query = query.eq('id', inventoryEntryId)
  } else {
    query = query.order('created_at', { ascending: true }).limit(1)
  }
  
  const { data: invData } = await query

  if (invData && invData.length > 0) {
    const entry = invData[0]
    newProduct.value.initial_quantity = entry.quantity
    newProduct.value.initial_price = entry.purchase_price
    newProduct.value.initial_purchase_date = entry.purchase_date
    if (entry.expiration_date) {
      const [year, month] = entry.expiration_date.split('-')
      newProduct.value.initial_expiration_date = `${month}/${year}`
    }
    newProduct.value.inventory_id = entry.id
  }

  isModalOpen.value = true
}

const saveProduct = async () => {
  isSubmitting.value = true
  
  let finalBrand = selectedBrand.value === 'Outra' ? customBrand.value : selectedBrand.value;
  finalBrand = formatTitleCase(finalBrand);
  newProduct.value.brand = finalBrand;
  
  newProduct.value.color = formatTitleCase(newProduct.value.color);
  newProduct.value.collection = formatTitleCase(newProduct.value.collection);

  const generatedName = `${finalBrand} ${newProduct.value.color}`.trim()

  const payload = {
    name: generatedName,
    category: newProduct.value.category,
    brand: finalBrand,
    color: newProduct.value.color,
    collection: newProduct.value.collection,
    description: newProduct.value.description,
    unit_measure: newProduct.value.unit_measure,
    size_variation: newProduct.value.size_variation
  }

  let finalImageUrl = isEditing.value ? newProduct.value.image_url : null;
  
  if (selectedImageFile.value) {
    try {
      const options = { maxSizeMB: 0.5, maxWidthOrHeight: 800, useWebWorker: true }
      const compressedFile = await imageCompression(selectedImageFile.value, options)
      const fileExt = compressedFile.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('produtos')
        .upload(fileName, compressedFile)
        
      if (!uploadError) {
        const { data } = supabase.storage.from('produtos').getPublicUrl(fileName)
        finalImageUrl = data.publicUrl
      } else {
        await showAlert('Erro ao salvar imagem no Storage: ' + uploadError.message, 'Aviso')
      }
    } catch (error) {
      console.error("Compression error:", error)
    }
  } else if (imageUrlInput.value) {
    finalImageUrl = imageUrlInput.value;
  }

  payload.image_url = finalImageUrl;

  let error;
  if (isEditing.value) {
    const { error: updateError } = await supabase
      .from('products')
      .update(payload)
      .eq('id', editingId.value)
    error = updateError
    
    if (!error && newProduct.value.inventory_id) {
      let expDate = null;
      if (newProduct.value.initial_expiration_date && newProduct.value.initial_expiration_date.includes('/')) {
        const [month, year] = newProduct.value.initial_expiration_date.split('/');
        if (month && year) expDate = `${year}-${month.padStart(2, '0')}-01`;
      }
      
      await supabase
        .from('inventory_entries')
        .update({
          quantity: parseInt(newProduct.value.initial_quantity) || 1,
          purchase_price: parseFloat(newProduct.value.initial_price) || 0,
          purchase_date: newProduct.value.initial_purchase_date,
          expiration_date: expDate
        })
        .eq('id', newProduct.value.inventory_id)
    }
  } else {
    payload.sku = `PRD-${Date.now()}`
    const { data: insertedProduct, error: insertError } = await supabase
      .from('products')
      .insert([payload])
      .select()
      
    error = insertError

    // Insert initial stock if product was created successfully
    if (!error && insertedProduct && insertedProduct.length > 0) {
      const productId = insertedProduct[0].id
      
      let expDate = null;
      if (newProduct.value.initial_expiration_date && newProduct.value.initial_expiration_date.includes('/')) {
        const [month, year] = newProduct.value.initial_expiration_date.split('/');
        if (month && year) expDate = `${year}-${month.padStart(2, '0')}-01`;
      }

      const inventoryPayload = {
        product_id: productId,
        quantity: parseInt(newProduct.value.initial_quantity) || 1,
        purchase_price: parseFloat(newProduct.value.initial_price) || 0,
        purchase_date: newProduct.value.initial_purchase_date,
        expiration_date: expDate
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
    emit('saved')
  } else {
    await showAlert('Erro ao salvar produto: ' + error.message, 'Erro')
  }
}

defineExpose({
  openNewModal,
  openEditModal
})
</script>

<template>
  <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-rose-950/40 backdrop-blur-sm">
    <div class="bg-white rounded-[2rem] shadow-hover w-full max-w-3xl max-h-[95vh] flex flex-col overflow-hidden border border-white">
      
      <!-- Cabeçalho -->
      <div class="p-4 border-b border-brand-50 flex items-center justify-between bg-white/95 backdrop-blur-sm z-10 shrink-0">
        <h2 class="text-lg font-bold text-rose-950">{{ isEditing ? 'Editar Produto / Estoque' : 'Cadastrar Novo Produto' }}</h2>
        <button @click="isModalOpen = false" class="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors">
          <X class="w-5 h-5" />
        </button>
      </div>
      
      <!-- Formulário com scroll interno -->
      <form id="productForm" @submit.prevent="saveProduct" class="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4" style="scrollbar-width: thin;">
        
        <!-- Foto do Produto -->
        <div class="flex items-center gap-3">
          <div class="flex gap-2 shrink-0">
            <div data-tooltip="Galeria" class="tooltip-bottom relative w-12 h-12 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center overflow-hidden hover:border-brand-400 transition-colors">
              <img v-if="imagePreview" :src="imagePreview" class="w-full h-full object-cover" />
              <ImagePlus v-else class="w-5 h-5 text-brand-400" />
              <input type="file" accept="image/*" @change="handleImageSelect" class="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10">
            </div>
            <div data-tooltip="Câmera" class="tooltip-bottom relative w-12 h-12 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center overflow-hidden hover:border-brand-400 transition-colors">
              <Camera class="w-5 h-5 text-brand-400" />
              <input type="file" accept="image/*" capture="environment" @change="handleImageSelect" class="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10">
            </div>
          </div>
          <div class="flex-1">
            <label class="block text-[11px] font-bold text-slate-700 mb-0.5">URL da Imagem (Opcional)</label>
            <input type="url" v-model="imageUrlInput" @input="handleUrlInput" placeholder="https://..." class="w-full px-2.5 py-1.5 text-sm rounded-lg border border-surface-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors bg-white/50">
          </div>
        </div>

        <!-- Campos Principais (3 colunas) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-3 gap-y-3">
          <div>
            <label class="block text-[11px] font-bold text-slate-700 mb-0.5">Categoria *</label>
            <CustomSelect v-model="newProduct.category" :options="['Esmalte', 'Base/Tratamento', 'Maquiagem', 'Utensílio', 'Descartável', 'Outros']" placeholder="Categoria" variant="outline" :required="true" :showEmptyOption="false" />
          </div>
          
          <div>
            <label class="block text-[11px] font-bold text-slate-700 mb-0.5">Marca *</label>
            <div :class="{'mb-1.5': selectedBrand === 'Outra'}">
              <CustomSelect v-model="selectedBrand" :options="[...currentBrandOptions, { label: 'Outra (incluir)', value: 'Outra' }]" placeholder="Marca" variant="outline" :required="true" :showEmptyOption="false" />
            </div>
            <input v-if="selectedBrand === 'Outra'" v-model="customBrand" required type="text" class="w-full px-2.5 py-1.5 text-sm rounded-lg border border-surface-200 focus:ring-2 focus:ring-brand-500 transition-colors" placeholder="Nome da marca">
          </div>

          <div>
            <label class="block text-[11px] font-bold text-slate-700 mb-0.5">Cor *</label>
            <input v-model="newProduct.color" required type="text" class="w-full px-2.5 py-1.5 text-sm rounded-lg border border-surface-200 focus:ring-2 focus:ring-brand-500 transition-colors" placeholder="Ex: Maçã do Amor">
          </div>

          <div>
            <label class="block text-[11px] font-bold text-slate-700 mb-0.5">Coleção</label>
            <input v-model="newProduct.collection" type="text" class="w-full px-2.5 py-1.5 text-sm rounded-lg border border-surface-200 focus:ring-2 focus:ring-brand-500 transition-colors" placeholder="Opcional">
          </div>

          <div>
            <label class="block text-[11px] font-bold text-slate-700 mb-0.5">Unidade de Medida *</label>
            <CustomSelect v-model="newProduct.unit_measure" :options="[{ label: 'Unidade (un)', value: 'Unidade' }, { label: 'Mililitro (ml)', value: 'Mililitro' }, { label: 'Grama (g)', value: 'Grama' }, { label: 'Kit', value: 'Kit' }]" placeholder="Unidade" variant="outline" :required="true" :showEmptyOption="false" />
          </div>

          <div>
            <label class="block text-[11px] font-bold text-slate-700 mb-0.5">Variação / Tamanho</label>
            <input v-model="newProduct.size_variation" type="text" class="w-full px-2.5 py-1.5 text-sm rounded-lg border border-surface-200 focus:ring-2 focus:ring-brand-500 transition-colors" placeholder="Ex: 8ml">
          </div>
        </div>

        <!-- Descrição -->
        <div>
          <label class="block text-[11px] font-bold text-slate-700 mb-0.5">Descrição / Detalhes</label>
          <textarea v-model="newProduct.description" rows="2" class="w-full px-2.5 py-1.5 text-sm rounded-lg border border-surface-200 focus:ring-2 focus:ring-brand-500 transition-colors" placeholder="Informações adicionais (opcional)..."></textarea>
        </div>

        <!-- Estoque (4 colunas) -->
        <div class="pt-3 border-t border-surface-100">
          <h3 class="text-sm font-bold text-rose-950 mb-2.5 flex items-center gap-1.5">
            <Package class="w-4 h-4 text-brand-500" />
            Dados do Estoque
          </h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label class="block text-[11px] font-bold text-slate-700 mb-0.5">Quantidade *</label>
              <input v-model="newProduct.initial_quantity" required type="number" min="1" class="w-full px-2.5 py-1.5 text-sm rounded-lg border border-surface-200 focus:ring-2 focus:ring-brand-500 transition-colors">
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-700 mb-0.5">Custo Unitário (R$) *</label>
              <input v-model="newProduct.initial_price" required type="number" step="0.01" min="0" class="w-full px-2.5 py-1.5 text-sm rounded-lg border border-surface-200 focus:ring-2 focus:ring-brand-500 transition-colors">
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-700 mb-0.5">Data da Compra *</label>
              <input v-model="newProduct.initial_purchase_date" required type="date" class="w-full px-2.5 py-1.5 text-sm rounded-lg border border-surface-200 focus:ring-2 focus:ring-brand-500 transition-colors">
            </div>
            <div>
              <label class="block text-[11px] font-bold text-slate-700 mb-0.5">Validade</label>
              <input v-model="newProduct.initial_expiration_date" type="text" placeholder="MM/AAAA" maxlength="7" @input="formatExpirationDateInput" class="w-full px-2.5 py-1.5 text-sm rounded-lg border border-surface-200 focus:ring-2 focus:ring-brand-500 transition-colors">
            </div>
          </div>
        </div>
      </form>
      
      <!-- Rodapé Fixo -->
      <div class="p-4 border-t border-surface-100 flex justify-end gap-2 bg-slate-50/50 shrink-0">
        <button type="button" @click="isModalOpen = false" class="px-5 py-2 text-sm rounded-lg text-slate-600 hover:bg-surface-200 font-medium transition-colors">
          Cancelar
        </button>
        <button type="submit" form="productForm" :disabled="isSubmitting" class="px-5 py-2 text-sm rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-medium shadow-sm transition-colors flex items-center gap-2">
          <span v-if="isSubmitting" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          {{ isSubmitting ? 'Salvando...' : 'Salvar' }}
        </button>
      </div>

    </div>
  </div>
</template>
