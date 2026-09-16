<script setup>
import { ref, watch } from 'vue'
import { X, Save, Sparkles, Tag } from 'lucide-vue-next'

const props = defineProps({
  product: {
    type: Object,
    default: null
  },
  categories: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['close', 'saved'])
const supabase = useSupabaseClient()

const loading = ref(false)
const formData = ref({
  shopping_category_id: '',
  title: '',
  description: '',
  image_url: '',
  redirect_slug: '',
  affiliate_url: '',
  is_sponsored: false,
  is_offer: false,
  is_active: true
})
const errorMsg = ref('')

// Preenche os dados caso seja edição
watch(() => props.product, (newVal) => {
  if (newVal) {
    formData.value = { ...newVal }
  } else {
    formData.value = { 
      shopping_category_id: props.categories.length > 0 ? props.categories[0].id : '',
      title: '', 
      description: '', 
      image_url: '', 
      redirect_slug: '', 
      affiliate_url: '', 
      is_sponsored: false, 
      is_offer: false,
      is_active: true 
    }
  }
}, { immediate: true })

// Autofill da descrição baseado na categoria selecionada
watch(() => formData.value.shopping_category_id, (newCatId) => {
  if (newCatId) {
    const cat = props.categories.find(c => c.id === newCatId)
    // Só preenche se a descrição atual estiver vazia e a categoria tiver uma descrição padrão
    if (cat && cat.default_description && !formData.value.description) {
      formData.value.description = cat.default_description
    }
  }
})

// Gera o slug automaticamente com base no título
const generateSlug = () => {
  if (!props.product && formData.value.title) {
    formData.value.redirect_slug = formData.value.title
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') 
      .replace(/[^a-z0-9]+/g, '-') 
      .replace(/(^-|-$)+/g, '') 
  }
}

const handleSubmit = async () => {
  loading.value = true
  errorMsg.value = ''
  
  if (!formData.value.shopping_category_id) {
    errorMsg.value = 'Por favor, selecione uma categoria.'
    loading.value = false
    return
  }

  try {
    if (props.product?.id) {
      // Edição
      const { error } = await supabase
        .from('shopping_products')
        .update({
          shopping_category_id: formData.value.shopping_category_id,
          title: formData.value.title,
          description: formData.value.description,
          image_url: formData.value.image_url,
          affiliate_url: formData.value.affiliate_url,
          is_sponsored: formData.value.is_sponsored,
          is_offer: formData.value.is_offer,
          is_active: formData.value.is_active
        })
        .eq('id', props.product.id)
        
      if (error) throw error
    } else {
      // Criação
      const { error } = await supabase
        .from('shopping_products')
        .insert([{
          shopping_category_id: formData.value.shopping_category_id,
          title: formData.value.title,
          description: formData.value.description,
          image_url: formData.value.image_url,
          redirect_slug: formData.value.redirect_slug,
          affiliate_url: formData.value.affiliate_url,
          is_sponsored: formData.value.is_sponsored,
          is_offer: formData.value.is_offer,
          is_active: formData.value.is_active
        }])
        
      if (error) throw error
    }
    
    emit('saved')
    emit('close')
  } catch (error) {
    console.error(error)
    if (error.code === '23505') {
      errorMsg.value = 'Já existe um produto com este Slug de redirecionamento.'
    } else {
      errorMsg.value = 'Ocorreu um erro ao salvar o produto.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-[1.5rem] shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh]">
      
      <!-- Header -->
      <div class="p-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
        <h2 class="text-xl font-bold text-slate-800">
          {{ product ? 'Editar Produto' : 'Novo Produto' }}
        </h2>
        <button @click="emit('close')" class="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Body -->
      <div class="p-4 overflow-y-auto">
        <div v-if="errorMsg" class="mb-3 p-2.5 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
          {{ errorMsg }}
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-3">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="md:col-span-2">
              <label class="block text-xs font-bold text-slate-700 mb-1">Título do Produto</label>
              <input 
                v-model="formData.title" 
                @input="generateSlug"
                type="text" 
                required 
                class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all bg-slate-50/50 text-sm"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Categoria</label>
              <select 
                v-model="formData.shopping_category_id" 
                required 
                class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all bg-slate-50/50 text-sm"
              >
                <option value="" disabled>Selecione...</option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                  {{ cat.name }} {{ !cat.is_active ? '(Inativa)' : '' }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Slug (Link de Redirecionamento)</label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm">/go/</span>
                <input 
                  v-model="formData.redirect_slug" 
                  type="text" 
                  required 
                  :disabled="!!product"
                  class="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all bg-slate-50/50 disabled:opacity-60 text-sm"
                />
              </div>
            </div>

            <div class="md:col-span-2">
              <label class="block text-xs font-bold text-slate-700 mb-1">Link do Afiliado (URL de Destino)</label>
              <input 
                v-model="formData.affiliate_url" 
                type="url" 
                required 
                placeholder="https://..."
                class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all bg-slate-50/50 text-sm"
              />
            </div>

            <div class="md:col-span-2">
              <label class="block text-xs font-bold text-slate-700 mb-1">Descrição Curta (Opcional)</label>
              <textarea 
                v-model="formData.description" 
                rows="2"
                class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all bg-slate-50/50 text-sm"
              ></textarea>
            </div>

            <div class="md:col-span-2">
              <label class="block text-xs font-bold text-slate-700 mb-1">URL da Imagem (Opcional)</label>
              <input 
                v-model="formData.image_url" 
                type="url" 
                placeholder="https://..."
                class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all bg-slate-50/50 text-sm"
              />
            </div>

            <!-- Toggles -->
            <div class="md:col-span-2 flex flex-col sm:flex-row gap-4 pt-1">
              <!-- Ativo -->
              <label class="flex items-center gap-2 cursor-pointer">
                <div class="relative">
                  <input type="checkbox" v-model="formData.is_active" class="sr-only peer" />
                  <div class="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                </div>
                <span class="text-xs font-bold text-slate-700">Produto Ativo na Vitrine</span>
              </label>

              <!-- Patrocinado -->
              <label class="flex items-center gap-2 cursor-pointer">
                <div class="relative">
                  <input type="checkbox" v-model="formData.is_sponsored" class="sr-only peer" />
                  <div class="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                </div>
                <span class="text-xs font-bold text-slate-700 flex items-center gap-1 text-amber-600">
                  <Sparkles class="w-3.5 h-3.5" /> Marcar como Patrocinado
                </span>
              </label>

              <!-- Oferta -->
              <label class="flex items-center gap-2 cursor-pointer">
                <div class="relative">
                  <input type="checkbox" v-model="formData.is_offer" class="sr-only peer" />
                  <div class="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-500"></div>
                </div>
                <span class="text-xs font-bold text-slate-700 flex items-center gap-1 text-brand-600">
                  <Tag class="w-3.5 h-3.5" /> Ofertas
                </span>
              </label>
            </div>
            
          </div>
        </form>
      </div>

      <!-- Footer -->
      <div class="p-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0 bg-slate-50/50">
        <button 
          type="button" 
          @click="emit('close')"
          class="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-xl transition-colors"
        >
          Cancelar
        </button>
        <button 
          @click="handleSubmit"
          :disabled="loading"
          class="px-5 py-2 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 rounded-xl transition-all shadow-sm flex items-center gap-2"
        >
          <Save class="w-4 h-4" />
          {{ loading ? 'Salvando...' : 'Salvar' }}
        </button>
      </div>

    </div>
  </div>
</template>
