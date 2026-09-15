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
  '5cinco', 'Ana Hickmann', 'Anita', 'Avon', 'Bauny', 'Bella Brasil', 'Blant', 
  'Chanel', 'Colorama', 'Cora', 'Cuccio', 'Dailus', 'Dior', 'Essence', 'Essie', 
  'Fortilon', 'Granado', 'Hits', 'Ideal', 'Impala', 'Kiko Milano', 'Ludurana', 
  'Mavala', 'Mohda', 'Natura', 'Novo Toque', 'OPI', 'Orly', 'Revlon', 'Risqué', 
  'Risqué GEL', 'Top Beauty'
]

const availableBrands = ref([...predefinedBrands])

const selectedBrand = ref(predefinedBrands[0])
const customBrand = ref('')
const customType = ref('')

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
  initial_expiration_date: '',
  inventory_id: null
})

const baseBrands = [
  'Base fosca',
  'Base de tratamento',
  'Base comum',
  'Base niveladora',
  'Base endurecedora/fortalecedora'
]

const currentBrandOptions = computed(() => {
  if (newProduct.value.category === 'Base/Tratamento') {
    return baseBrands
  }
  if (['Utensílio', 'Descartável', 'Outros'].includes(newProduct.value.category)) {
    return ['Genérico']
  }
  return availableBrands.value
})

watch(() => newProduct.value.category, (newCategory) => {
  if (newCategory === 'Base/Tratamento') {
    if (!baseBrands.includes(selectedBrand.value) && selectedBrand.value !== 'Outra') {
      selectedBrand.value = baseBrands[0]
    }
  } else if (['Utensílio', 'Descartável', 'Outros'].includes(newCategory)) {
    selectedBrand.value = 'Genérico'
  } else {
    if (!availableBrands.value.includes(selectedBrand.value) && selectedBrand.value !== 'Outra') {
      selectedBrand.value = availableBrands.value[0] || predefinedBrands[0]
    }
  }
})

const getProductType = (name) => {
  const match = name?.match(/\((.*?)\)$/)
  return match && match[1] ? match[1] : 'Indefinido'
}

const predefinedTypes = ['Cremoso', 'Perolado e Cintilante', 'Glitter', 'Fosco', 'Metálico']
const availableTypes = ref([...predefinedTypes])

const fetchMetadata = async () => {
  const { data } = await supabase.from('products').select('name, brand')
  if (data) {
    const dbBrands = data.map(p => p.brand).filter(Boolean)
    availableBrands.value = [...new Set([...predefinedBrands, ...dbBrands])].sort()

    const dbTypes = data.map(p => getProductType(p.name)).filter(t => t !== 'Indefinido')
    availableTypes.value = [...new Set([...predefinedTypes, ...dbTypes])].sort()
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
    type: 'Cremoso', category: 'Esmalte', brand: '', color: '', collection: '', unit_measure: 'Mililitro', size_variation: '',
    initial_quantity: 1, initial_price: 0.00, initial_purchase_date: new Date().toISOString().split('T')[0], initial_expiration_date: '', image_url: null, inventory_id: null
  }
  selectedImageFile.value = null
  imageUrlInput.value = ''
  imagePreview.value = null
  customType.value = ''
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
  
  const extractedType = getProductType(product.name) !== 'Indefinido' ? getProductType(product.name) : 'Cremoso'
  let typeValue = 'Cremoso'
  if (availableTypes.value.includes(extractedType)) {
    typeValue = extractedType
    customType.value = ''
  } else {
    typeValue = 'Outros'
    customType.value = extractedType
  }

  newProduct.value = {
    type: typeValue,
    category: product.category,
    brand: product.brand,
    color: product.color,
    collection: product.collection || '',
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

  let finalType = newProduct.value.type === 'Outros' ? customType.value : newProduct.value.type;
  if (newProduct.value.type === 'Outros') finalType = formatTitleCase(finalType);
  
  newProduct.value.color = formatTitleCase(newProduct.value.color);
  newProduct.value.collection = formatTitleCase(newProduct.value.collection);

  const generatedName = `${finalBrand} ${newProduct.value.color} (${finalType})`.trim()

  const payload = {
    name: generatedName,
    category: newProduct.value.category,
    brand: finalBrand,
    color: newProduct.value.color,
    collection: newProduct.value.collection,
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
  <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-rose-950/20 backdrop-blur-sm">
    <div class="bg-white rounded-[2rem] shadow-hover w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-white">
      <div class="p-4 border-b border-brand-50 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-10">
        <h2 class="text-xl font-bold text-rose-950">{{ isEditing ? 'Editar Produto / Estoque' : 'Cadastrar Novo Produto' }}</h2>
        <div class="flex items-center gap-2">
          <button @click="isModalOpen = false" class="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors">
            <X class="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <form @submit.prevent="saveProduct" class="p-5 space-y-3">
        
        <!-- Foto do Produto -->
        <div class="flex items-center gap-4 mb-4">
          <div class="flex gap-2 shrink-0">
            <div data-tooltip="Adicionar da Galeria" class="tooltip-bottom relative w-20 h-20 rounded-2xl bg-brand-50 border-2 border-dashed border-brand-200 flex items-center justify-center overflow-hidden group">
              <img v-if="imagePreview" :src="imagePreview" class="w-full h-full object-cover" />
              <div v-else class="text-brand-400 flex flex-col items-center gap-1">
                <ImagePlus class="w-6 h-6" />
              </div>
              <input type="file" accept="image/*" @change="handleImageSelect" class="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10">
              <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <span class="text-white text-[10px] font-bold uppercase tracking-wider">Galeria</span>
              </div>
            </div>

            <div data-tooltip="Tirar Foto" class="tooltip-bottom relative w-20 h-20 rounded-2xl bg-brand-50 border-2 border-dashed border-brand-200 flex items-center justify-center overflow-hidden group">
              <div class="text-brand-400 flex flex-col items-center gap-1">
                <Camera class="w-6 h-6" />
              </div>
              <input type="file" accept="image/*" capture="environment" @change="handleImageSelect" class="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10">
              <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <span class="text-white text-[10px] font-bold uppercase tracking-wider">Câmera</span>
              </div>
            </div>
          </div>
          <div class="flex-1 space-y-2">
            <h3 class="text-sm font-bold text-rose-950">Foto do Produto</h3>
            <p class="text-[11px] text-slate-500 font-medium">Use a galeria ou a câmera, <span class="text-brand-600">ou cole a URL de uma imagem:</span></p>
            <div class="relative flex items-center">
              <input 
                type="url" 
                v-model="imageUrlInput" 
                @input="handleUrlInput" 
                placeholder="https://..." 
                class="w-full px-3 py-1.5 text-sm rounded-lg border border-surface-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors bg-white/50"
              >
            </div>
          </div>
        </div>


        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <!-- Categoria e Marca -->
          <div>
            <label class="block text-xs font-medium text-slate-700 mb-1">Categoria *</label>
            <CustomSelect
              v-model="newProduct.category"
              :options="['Esmalte', 'Base/Tratamento', 'Utensílio', 'Descartável', 'Outros']"
              placeholder="Selecione a categoria"
              variant="outline"
              :required="true"
              :showEmptyOption="false"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-700 mb-1">Marca *</label>
            <div :class="{'mb-2': selectedBrand === 'Outra'}">
              <CustomSelect
                v-model="selectedBrand"
                :options="[...currentBrandOptions, { label: 'Outra (incluir marca)', value: 'Outra' }]"
                placeholder="Selecione a marca"
                variant="outline"
                :required="true"
                :showEmptyOption="false"
              />
            </div>
            <input v-if="selectedBrand === 'Outra'" v-model="customBrand" required type="text" class="w-full px-3 py-1.5 text-sm rounded-lg border border-surface-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors" placeholder="Digite o nome da marca">
          </div>

          <!-- Cor e Tipo -->
          <div>
            <label class="block text-xs font-medium text-slate-700 mb-1">Cor *</label>
            <input v-model="newProduct.color" required type="text" class="w-full px-3 py-1.5 text-sm rounded-lg border border-surface-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors" placeholder="Ex: Maçã do Amor">
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-700 mb-1">Tipo *</label>
            <div :class="{'mb-2': newProduct.type === 'Outros'}">
              <CustomSelect
                v-model="newProduct.type"
                :options="[...availableTypes, { label: 'Outros (incluir tipo)', value: 'Outros' }]"
                placeholder="Selecione o tipo"
                variant="outline"
                :required="true"
                :showEmptyOption="false"
              />
            </div>
            <input v-if="newProduct.type === 'Outros'" v-model="customType" required type="text" class="w-full px-3 py-1.5 text-sm rounded-lg border border-surface-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors" placeholder="Digite o tipo do esmalte">
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
            <CustomSelect
              v-model="newProduct.unit_measure"
              :options="[{ label: 'Unidade (un)', value: 'Unidade' }, { label: 'Mililitro (ml)', value: 'Mililitro' }, { label: 'Grama (g)', value: 'Grama' }, { label: 'Kit', value: 'Kit' }]"
              placeholder="Selecione a unidade"
              variant="outline"
              :required="true"
              :showEmptyOption="false"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-700 mb-1">Variação / Tamanho</label>
            <input v-model="newProduct.size_variation" type="text" class="w-full px-3 py-1.5 text-sm rounded-lg border border-surface-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors" placeholder="Ex: 8ml, Pacote com 100...">
          </div>
        </div>

        <!-- Estoque Inicial -->
        <div class="pt-3 border-t border-surface-200">
          <h3 class="text-base font-bold text-rose-950 mb-2 flex items-center gap-2">
            <Package class="w-4 h-4 text-brand-500" />
            Dados do Estoque
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
              <input 
                v-model="newProduct.initial_expiration_date" 
                type="text" 
                placeholder="MM/AAAA"
                maxlength="7"
                @input="formatExpirationDateInput"
                class="w-full px-3 py-1.5 text-sm rounded-lg border border-surface-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
              >
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
            {{ isSubmitting ? 'Salvando...' : 'Salvar' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
