<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-vue-next'

const slides = [
  { desktop: '/carousel/Ola.png', mobile: '/carousel/SlideMobile1.png' },
  { desktop: '/carousel/Slide2.PNG', mobile: '/carousel/SlideMobile2.png' },
  { desktop: '/carousel/Slide3.PNG', mobile: '/carousel/SlideMobile3.png' },
  { desktop: '/carousel/Slide4.PNG', mobile: '/carousel/SlideMobile4.png' },
  { desktop: '/carousel/Slide4.PNG', mobile: '/carousel/SlideMobile5.jpg' }
]

const currentSlide = ref(0)
const isPlaying = ref(true)
const isPressed = ref(false)
let timer = null
let wasPlayingBeforePress = false

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
  stopAutoPlay()
  timer = setInterval(nextSlide, 5000)
  isPlaying.value = true
}

const stopAutoPlay = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  isPlaying.value = false
}

const togglePlay = () => {
  if (isPlaying.value) {
    stopAutoPlay()
  } else {
    startAutoPlay()
  }
}

const handlePressStart = () => {
  wasPlayingBeforePress = isPlaying.value
  isPressed.value = true
  stopAutoPlay()
}

const handlePressEnd = () => {
  if (isPressed.value) {
    isPressed.value = false
    if (wasPlayingBeforePress) {
      startAutoPlay()
    }
  }
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

    <div class="h-[calc(100dvh-11.5rem)] md:h-full w-full flex flex-col justify-between gap-1 lg:gap-0" style="font-family: 'Poppins', sans-serif;">
      
      <!-- Carrossel ocupando o espaço do card -->
      <div 
        class="relative w-full rounded-2xl md:rounded-3xl overflow-hidden shadow-soft border border-white/60 bg-white/40 backdrop-blur-md flex-1 min-h-0 select-none cursor-pointer"
        style="-webkit-touch-callout: none; -webkit-user-select: none; user-select: none;"
        @touchstart.passive="handlePressStart"
        @touchend="handlePressEnd"
        @touchcancel="handlePressEnd"
        @mousedown="handlePressStart"
        @mouseup="handlePressEnd"
        @mouseleave="handlePressEnd"
        @contextmenu.prevent
      >
        <!-- Slides -->
        <div 
          class="flex transition-transform duration-700 ease-in-out h-full w-full pointer-events-none"
          :style="{ transform: `translateX(-${currentSlide * 100}%)` }"
        >
          <div v-for="(slide, index) in slides" :key="index" class="w-full h-full shrink-0 flex items-center justify-center">
            <!-- Desktop Image -->
            <img 
              :src="slide.desktop" 
              alt="Slide" 
              draggable="false"
              class="hidden md:block w-full h-full object-contain scale-100 lg:scale-[1.27] transition-transform duration-500 pointer-events-none select-none" 
            />
            <!-- Mobile Image -->
            <img 
              :src="slide.mobile" 
              alt="Slide Mobile" 
              draggable="false"
              class="md:hidden w-full h-full object-contain scale-100 transition-transform duration-500 pointer-events-none select-none" 
            />
          </div>
        </div>
        
        <!-- Controles Laterais (Sempre Visíveis) -->
        <button 
          @click.stop="prevSlide" 
          @touchstart.stop 
          @touchend.stop 
          @mousedown.stop 
          class="absolute left-2.5 md:left-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white/80 hover:bg-white active:scale-95 backdrop-blur-md rounded-full flex items-center justify-center text-brand-600 shadow-md opacity-100 transition-all duration-300 hover:scale-110 z-20"
          title="Slide anterior"
        >
          <ChevronLeft class="w-5 h-5 md:w-6 md:h-6 ml-[-2px]" />
        </button>
        <button 
          @click.stop="nextSlide" 
          @touchstart.stop 
          @touchend.stop 
          @mousedown.stop 
          class="absolute right-2.5 md:right-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white/80 hover:bg-white active:scale-95 backdrop-blur-md rounded-full flex items-center justify-center text-brand-600 shadow-md opacity-100 transition-all duration-300 hover:scale-110 z-20"
          title="Próximo slide"
        >
          <ChevronRight class="w-5 h-5 md:w-6 md:h-6 mr-[-2px]" />
        </button>
        
        <!-- Controles de Reprodução e Indicadores (Apenas Desktop) -->
        <div class="hidden md:flex absolute bottom-6 left-1/2 -translate-x-1/2 items-center gap-4 bg-white/60 backdrop-blur-md px-5 py-2.5 rounded-full shadow-sm border border-white/50">
          <!-- Play / Pause -->
          <button @click="togglePlay" class="text-brand-600 hover:text-brand-700 transition-colors flex items-center justify-center hover:scale-110" :title="isPlaying ? 'Pausar' : 'Reproduzir'">
            <Pause v-if="isPlaying" class="w-4 h-4 fill-current" />
            <Play v-else class="w-4 h-4 fill-current" />
          </button>
          
          <div class="w-px h-4 bg-brand-200"></div>

          <!-- Indicadores (Bolinhas) -->
          <div class="flex items-center gap-3">
            <button 
              v-for="(_, index) in slides" 
              :key="'dot-'+index"
              @click="goToSlide(index); stopAutoPlay()"
              class="h-2.5 rounded-full transition-all duration-500 shadow-sm"
              :class="currentSlide === index ? 'bg-brand-500 w-8' : 'bg-white hover:bg-brand-100 w-2.5'"
            ></button>
          </div>
        </div>
      </div>

      <div class="mt-1 lg:mt-6 pb-2 text-center text-slate-400 text-[10px] sm:text-xs md:text-sm font-medium shrink-0 leading-relaxed translate-y-3.5 md:translate-y-0">
        <span class="block md:inline">© 2026 Desenvolvido por <a href="https://www.instagram.com/leonardo.bezerra.dev/" target="_blank" class="hover:text-brand-500 transition-colors"><b>Leonardo Bezerra</b></a></span>
        <span class="hidden md:inline"> - </span>
        <span class="block md:inline">Todos os direitos reservados.</span>
      </div>
    </div>
  </NuxtLayout>
</template>
