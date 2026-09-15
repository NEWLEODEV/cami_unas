<script setup>
import { ref, watch } from 'vue'
import { X, Save } from 'lucide-vue-next'

const props = defineProps({
  category: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'saved'])
const supabase = useSupabaseClient()

const loading = ref(false)
const formData = ref({
  name: '',
  slug: '',
  default_description: '',
  is_active: true
})
const errorMsg = ref('')

// Preenche os dados caso seja edição
watch(() => props.category, (newVal) => {
  if (newVal) {
    formData.value = { ...newVal }
  } else {
    formData.value = { name: '', slug: '', default_description: '', is_active: true }
  }
}, { immediate: true })

// Gera o slug automaticamente com base no nome
const generateSlug = () => {
  if (!props.category && formData.value.name) {
    formData.value.slug = formData.value.name
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9]+/g, '-') // Substitui espaços e especiais por hífen
      .replace(/(^-|-$)+/g, '') // Remove hífens no início e fim
  }
}

const handleSubmit = async () => {
  loading.value = true
  errorMsg.value = ''
  
  try {
    if (props.category?.id) {
      // Edição
      const { error } = await supabase
        .from('shopping_categories')
        .update({
          name: formData.value.name,
          slug: formData.value.slug,
          default_description: formData.value.default_description,
          is_active: formData.value.is_active
        })
        .eq('id', props.category.id)
        
      if (error) throw error
    } else {
      // Criação
      const { error } = await supabase
        .from('shopping_categories')
        .insert([{
          name: formData.value.name,
          slug: formData.value.slug,
          default_description: formData.value.default_description,
          is_active: formData.value.is_active
        }])
        
      if (error) throw error
    }
    
    emit('saved')
    emit('close')
  } catch (error) {
    console.error(error)
    if (error.code === '23505') {
      errorMsg.value = 'Já existe uma categoria com este Slug.'
    } else {
      errorMsg.value = 'Ocorreu um erro ao salvar a categoria.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-[2rem] shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
      
      <!-- Header -->
      <div class="p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
        <h2 class="text-xl font-bold text-slate-800">
          {{ category ? 'Editar Categoria' : 'Nova Categoria' }}
        </h2>
        <button @click="emit('close')" class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Body -->
      <div class="p-6 overflow-y-auto">
        <div v-if="errorMsg" class="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
          {{ errorMsg }}
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-5">
          <div>
            <label class="block text-sm font-bold text-slate-700 mb-1.5">Nome da Categoria</label>
            <input 
              v-model="formData.name" 
              @input="generateSlug"
              type="text" 
              required 
              placeholder="Ex: Maquiagem, Rosto..."
              class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all bg-slate-50/50"
            />
          </div>
          
          <div>
            <label class="block text-sm font-bold text-slate-700 mb-1.5">Slug (URL amigável)</label>
            <input 
              v-model="formData.slug" 
              type="text" 
              required 
              :disabled="!!category"
              class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all bg-slate-50/50 disabled:opacity-60"
            />
            <p class="text-xs text-slate-500 mt-1">Identificador único. Não pode ser alterado depois.</p>
          </div>
          
          <div>
            <label class="block text-sm font-bold text-slate-700 mb-1.5">Descrição Padrão para Produtos (Opcional)</label>
            <textarea 
              v-model="formData.default_description" 
              rows="3"
              placeholder="Ex: Todos os produtos desta categoria acompanham brinde..."
              class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all bg-slate-50/50"
            ></textarea>
            <p class="text-xs text-slate-500 mt-1">Ao cadastrar um novo produto nesta categoria, essa descrição será preenchida automaticamente.</p>
          </div>
          
          <div class="pt-2">
            <label class="flex items-center gap-3 cursor-pointer">
              <div class="relative">
                <input type="checkbox" v-model="formData.is_active" class="sr-only peer" />
                <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </div>
              <span class="text-sm font-bold text-slate-700">Categoria Ativa</span>
            </label>
            <p class="text-xs text-slate-500 mt-1 ml-14">Se desativada, os produtos desta categoria não aparecerão na vitrine.</p>
          </div>
        </form>
      </div>

      <!-- Footer -->
      <div class="p-6 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0 bg-slate-50/50">
        <button 
          type="button" 
          @click="emit('close')"
          class="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-xl transition-colors"
        >
          Cancelar
        </button>
        <button 
          @click="handleSubmit"
          :disabled="loading"
          class="px-6 py-2.5 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 rounded-xl transition-all shadow-sm flex items-center gap-2"
        >
          <Save class="w-4 h-4" />
          {{ loading ? 'Salvando...' : 'Salvar' }}
        </button>
      </div>

    </div>
  </div>
</template>
