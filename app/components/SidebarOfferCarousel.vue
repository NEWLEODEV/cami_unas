<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const supabase = useSupabaseClient()
const offers = ref([])
const currentIndex = ref(0)
let interval = null

const fetchOffers = async () => {
  const { data } = await supabase
    .from('shopping_products')
    .select('id, title, image_url, redirect_slug')
    .eq('is_active', true)
    .eq('is_offer', true)
    .order('created_at', { ascending: false })
    .limit(5)
    
  if (data) {
    offers.value = data
  }
}

const nextSlide = () => {
  if (offers.value.length === 0) return
  currentIndex.value = (currentIndex.value + 1) % offers.value.length
}

const resetInterval = () => {
  if (interval) clearInterval(interval)
  interval = setInterval(nextSlide, 4000)
}

const goToSlide = (idx) => {
  currentIndex.value = idx
  resetInterval()
}

onMounted(() => {
  fetchOffers()
  resetInterval()
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
})
</script>

<template>
  <div v-if="offers.length > 0" class="px-6 py-2 h-full flex flex-col w-full">

    
    <div class="relative w-full flex-1 rounded-2xl overflow-hidden shadow-sm border border-brand-100 group bg-white min-h-[200px]">
      <div 
        class="flex transition-transform duration-500 ease-out h-full"
        :style="{ transform: `translateX(-${currentIndex * 100}%)` }"
      >
        <a 
          v-for="offer in offers" 
          :key="offer.id"
          :href="`/go/${offer.redirect_slug}`"
          target="_blank"
          class="w-full h-full shrink-0 relative block group/link"
        >
          <img v-if="offer.image_url" :src="offer.image_url" :alt="offer.title" class="w-full h-full object-cover group-hover/link:scale-105 transition-transform duration-700" />
          <div v-else class="w-full h-full bg-brand-50 flex items-center justify-center">
            <span class="text-brand-300">Sem Imagem</span>
          </div>

          <div class="absolute top-2 left-2 z-10 bg-brand-500/80 backdrop-blur-sm text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm border border-white/20 flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
            Oferta
          </div>
          
          <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-12">
            <p class="text-white text-xs font-semibold line-clamp-2 leading-snug drop-shadow-md">{{ offer.title }}</p>
          </div>
        </a>
      </div>
      
      <!-- Dots -->
      <div v-if="offers.length > 1" class="absolute bottom-2 inset-x-0 flex justify-center gap-1.5 z-10">
        <button 
          v-for="(_, idx) in offers" 
          :key="idx"
          @click.prevent="goToSlide(idx)"
          class="h-1.5 rounded-full transition-all duration-300 shadow-sm"
          :class="currentIndex === idx ? 'bg-white w-4' : 'bg-white/50 hover:bg-white/90 w-1.5'"
        ></button>
      </div>
    </div>
  </div>
</template>
