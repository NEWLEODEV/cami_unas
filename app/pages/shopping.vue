<script setup>
import { ref, onMounted, computed } from 'vue'
import { ShoppingBag, ExternalLink, Sparkles, Filter, Tag, Search, Heart } from 'lucide-vue-next'

const supabase = useSupabaseClient()
const categories = ref([])
const loading = ref(true)
const selectedCategoryId = ref('')
const searchQuery = ref('')
const showWishlistOnly = ref(false)
const wishlistIds = useCookie('shopping_wishlist', { default: () => [] })

const toggleWishlist = (productId) => {
  let current = wishlistIds.value || []
  if (current.includes(productId)) {
    wishlistIds.value = current.filter(id => id !== productId)
  } else {
    wishlistIds.value = [...current, productId]
  }
}

const fetchShoppingData = async () => {
  loading.value = true
  
  // Buscar categorias ativas
  const { data: catsData } = await supabase
    .from('shopping_categories')
    .select('*')
    .eq('is_active', true)
    .order('name')
    
  if (catsData) {
    // Buscar produtos ativos
    const { data: prodsData } = await supabase
      .from('shopping_products')
      .select('*')
      .eq('is_active', true)
      .order('title')
      
    if (prodsData) {
      // Agrupar produtos por categoria
      categories.value = catsData.map(cat => {
        return {
          ...cat,
          products: prodsData.filter(p => p.shopping_category_id === cat.id)
        }
      }).filter(cat => cat.products.length > 0) // Oculta categorias vazias
    }
  }
  
  loading.value = false
}

onMounted(() => {
  fetchShoppingData()
})

const filteredProducts = computed(() => {
  let products = []
  if (!selectedCategoryId.value) {
    products = categories.value.flatMap(c => c.products)
  } else {
    const category = categories.value.find(c => c.id === selectedCategoryId.value)
    products = category ? category.products : []
  }

  if (showWishlistOnly.value) {
    const currentWishlist = wishlistIds.value || []
    products = products.filter(p => currentWishlist.includes(p.id))
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    products = products.filter(p => 
      (p.title && p.title.toLowerCase().includes(query)) || 
      (p.description && p.description.toLowerCase().includes(query))
    )
  }

  return products
})

const categoryOptions = computed(() => {
  return categories.value.map(cat => ({
    label: cat.name,
    value: cat.id
  }))
})

definePageMeta({
  layout: false
})
</script>

<template>
  <NuxtLayout name="default">
    <template #header-left>
      <p class="text-lg truncate">
        <span class="text-slate-700 font-bold">Dia de comprinhas? Que delícia!</span>
        <span class="text-slate-500 font-medium ml-1">- Aqui separei meus achados favoritos: tudo testado e escolhido a dedo pra você.</span>
      </p>
    </template>

    <div class="space-y-8">
      
      <!-- Loading State -->
    <div v-if="loading" class="text-center p-12 bg-white/80 backdrop-blur-md rounded-[2rem] border border-white shadow-soft">
      <div class="w-12 h-12 border-4 border-brand-100 border-t-brand-500 rounded-full animate-spin mx-auto mb-4"></div>
      <p class="text-slate-500 font-medium">Carregando vitrine...</p>
    </div>
    
    <!-- Empty State -->
    <div v-else-if="categories.length === 0" class="text-center p-16 bg-white/80 backdrop-blur-md rounded-[2rem] border border-white shadow-soft flex flex-col items-center">
      <div class="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mb-4 shadow-inner border border-brand-100/50">
        <ShoppingBag class="w-10 h-10 text-brand-300" />
      </div>
      <p class="text-rose-900 font-bold text-xl mb-1">Vitrine em Construção</p>
      <p class="text-slate-500 font-medium max-w-sm">Ainda não temos produtos disponíveis no momento. Volte em breve para conferir nossas novidades!</p>
    </div>
    
    <!-- Vitrine (Categories and Products) -->
    <div v-else class="space-y-8">
      
      <!-- Filters and Search -->
      <div class="flex flex-col lg:flex-row lg:items-center gap-4 w-full z-20 relative -mt-4 lg:-mt-6">
        <!-- Barra de Busca -->
        <div class="flex-1 min-w-[250px] bg-white/80 backdrop-blur-md p-2 rounded-full shadow-sm border border-white flex items-center gap-3">
          <div class="w-10 h-10 bg-brand-50 rounded-full flex items-center justify-center shrink-0">
            <Search class="w-5 h-5 text-brand-400" />
          </div>
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Buscar recomendações..." 
            class="flex-1 bg-transparent border-none focus:outline-none text-rose-950 placeholder-slate-400 font-medium px-2 min-w-0"
          >
        </div>

        <!-- Categoria Dropdown -->
        <div class="flex items-center gap-3 bg-white/80 backdrop-blur-md p-2.5 px-4 rounded-full shadow-sm border border-white shrink-0">
          <div class="flex items-center gap-2 shrink-0 min-w-[200px]">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Categoria</span>
            <CustomSelect 
              v-model="selectedCategoryId" 
              :options="categoryOptions"
              placeholder="Todas as Categorias"
              variant="ghost"
            />
          </div>
        </div>

        <!-- Wishlist Filter -->
        <button 
          @click="showWishlistOnly = !showWishlistOnly"
          :class="showWishlistOnly ? 'bg-rose-50 text-rose-600 border-rose-200 shadow-sm' : 'bg-white/80 text-slate-500 border-white hover:bg-white hover:text-rose-500 shadow-sm'"
          class="flex items-center gap-2 px-4 py-2.5 rounded-full border transition-all shrink-0 font-bold text-sm backdrop-blur-md"
        >
          <Heart class="w-4 h-4" :class="{'fill-current': showWishlistOnly}" />
          Desejos
        </button>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 w-full">
        <div v-for="product in filteredProducts" :key="product.id" class="bg-white/90 backdrop-blur-md rounded-2xl p-2.5 border border-white shadow-soft hover:shadow-hover transition-all duration-300 flex flex-col group relative">
          
          <!-- Badge Patrocinado -->
          <div v-if="product.is_sponsored" class="absolute -top-1.5 -right-1.5 z-10 bg-gradient-to-r from-amber-400 to-amber-500 text-white text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full shadow-sm flex items-center gap-0.5 border border-white/50">
            <Sparkles class="w-2.5 h-2.5" />
            Patrocinado
          </div>

          <!-- Badge Oferta -->
          <div v-if="product.is_offer" class="absolute -top-1.5 -left-1.5 z-10 bg-gradient-to-r from-brand-500 to-brand-600 text-white text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full shadow-sm flex items-center gap-0.5 border border-white/50">
            <Tag class="w-2.5 h-2.5" />
            Oferta
          </div>
          
          <!-- Imagem do Produto -->
          <a :href="`/go/${product.redirect_slug}`" target="_blank" rel="noopener noreferrer" class="aspect-square bg-white rounded-xl mb-2.5 overflow-hidden flex items-center justify-center border border-brand-50 shadow-sm relative block group/img">
            <img v-if="product.image_url" :src="product.image_url" :alt="product.title" class="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500" />
            <ShoppingBag v-else class="w-8 h-8 text-brand-200" />
            
            <div class="absolute inset-0 bg-rose-950/5 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
              <div class="bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-sm text-brand-600">
                <ExternalLink class="w-4 h-4" />
              </div>
            </div>
          </a>
          
          <!-- Detalhes do Produto -->
          <div class="flex-1 flex flex-col">
            <h3 class="font-bold text-rose-950 text-xs leading-snug mb-1 line-clamp-2" :title="product.title">{{ product.title }}</h3>
            <p v-if="product.description" class="text-[10px] text-slate-500 mb-3 line-clamp-2 leading-relaxed flex-1" :title="product.description">{{ product.description }}</p>
            <div v-else class="flex-1 mb-3"></div>
            
            <!-- Botão de Ação -->
            <a :href="`/go/${product.redirect_slug}`" target="_blank" rel="noopener noreferrer" class="mt-auto w-full bg-brand-50 text-brand-600 hover:bg-brand-500 hover:text-white font-bold py-2 text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all border border-brand-100 hover:border-brand-500 shadow-sm">
              Ver Produto
              <ExternalLink class="w-3.5 h-3.5" />
            </a>
            
            <!-- Wishlist Botão -->
            <button @click="toggleWishlist(product.id)" class="w-full mt-2 font-bold py-2 text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all border shadow-sm" :class="(wishlistIds || []).includes(product.id) ? 'bg-amber-50 text-amber-600 border-amber-300 hover:bg-amber-100' : 'bg-white text-slate-500 border-slate-200 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200'">
              <Heart class="w-3.5 h-3.5" :class="{'fill-current': (wishlistIds || []).includes(product.id)}" />
              {{ (wishlistIds || []).includes(product.id) ? 'Na Lista de Desejos' : 'Adcionar a Lista de Desejos' }}
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Aviso de Afiliados (Disclaimer) -->
    <div class="mt-16 pt-8 border-t border-brand-100/50">
      <div class="bg-white/60 backdrop-blur-sm p-6 rounded-3xl border border-white text-center shadow-sm max-w-3xl mx-auto">
        <p class="text-xs text-slate-500 font-medium leading-relaxed">
          <span class="font-bold text-brand-700 block mb-1">Aviso de Transparência</span>
          Nossa vitrine contém links de afiliados. Isso significa que podemos receber uma comissão caso você realize uma compra através deles, sem nenhum custo adicional para você. Selecionamos apenas produtos de confiança. Agradecemos o seu apoio!
        </p>
      </div>
      </div>
    </div>
  </NuxtLayout>
</template>
