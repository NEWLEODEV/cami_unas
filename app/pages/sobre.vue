<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

const slides = [
  '/carousel/Ola.png',
  '/carousel/Slide2.PNG',
  '/carousel/Slide3.PNG',
  '/carousel/Slide4.PNG'
]

const currentSlide = ref(0)
let timer = null

const nextSlide = () => {
  currentSlide.value = (currentSlide.value + 1) % slides.length
}

const prevSlide = () => {
  currentSlide.value = currentSlide.value === 0 ? slides.length - 1 : currentSlide.value - 1
}

const goToSlide = (index) => {
  currentSlide.value = index
}

const startAutoPlay = () => {
  timer = setInterval(nextSlide, 5000)
}

const stopAutoPlay = () => {
  if (timer) clearInterval(timer)
}

onMounted(() => {
  startAutoPlay()
})

onUnmounted(() => {
  stopAutoPlay()
})

useHead({
  link: [
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap'
    }
  ]
})

definePageMeta({
  layout: false
})
</script>

<template>
  <NuxtLayout name="default">
    <template #header-left>
      <p class="text-slate-600 font-medium text-lg truncate">Bem-vindo(a) ao Universo CAMIS!</p>
    </template>

    <div class="h-full w-full flex flex-col" style="font-family: 'Poppins', sans-serif;">
      
      <!-- Carrossel ocupando o espaço do card -->
      <div 
        class="flex-1 relative w-full rounded-3xl overflow-hidden shadow-soft border border-white/60 bg-white/40 backdrop-blur-md group"
        @mouseenter="stopAutoPlay" 
        @mouseleave="startAutoPlay"
      >
        <!-- Slides -->
        <div 
          class="flex transition-transform duration-700 ease-in-out h-full w-full"
          :style="{ transform: `translateX(-${currentSlide * 100}%)` }"
        >
          <div v-for="(slide, index) in slides" :key="index" class="w-full h-full shrink-0 flex items-center justify-center">
            <img :src="slide" alt="Slide" class="w-full h-full object-contain scale-[1.27] transition-transform duration-500" />
          </div>
        </div>
        
        <!-- Controles Laterais -->
        <button @click="prevSlide" class="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/70 hover:bg-white backdrop-blur-md rounded-full flex items-center justify-center text-brand-600 shadow-md opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110">
          <ChevronLeft class="w-6 h-6 ml-[-2px]" />
        </button>
        <button @click="nextSlide" class="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/70 hover:bg-white backdrop-blur-md rounded-full flex items-center justify-center text-brand-600 shadow-md opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110">
          <ChevronRight class="w-6 h-6 mr-[-2px]" />
        </button>
        
        <!-- Indicadores (Bolinhas) -->
        <div class="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3">
          <button 
            v-for="(_, index) in slides" 
            :key="'dot-'+index"
            @click="goToSlide(index)"
            class="h-2.5 rounded-full transition-all duration-500 shadow-sm"
            :class="currentSlide === index ? 'bg-brand-500 w-8' : 'bg-white/80 hover:bg-white w-2.5'"
          ></button>
        </div>
      </div>

      <div class="mt-6 text-center text-slate-400 text-sm font-medium">
        © 2026 Desenvolvido por <a href="https://www.instagram.com/leonardo.bezerra.dev/" target="_blank" class="hover:text-brand-500 transition-colors"><b>Leonardo Bezerra</b></a> - Todos os direitos reservados.
      </div>
    </div>
  </NuxtLayout>
</template>
