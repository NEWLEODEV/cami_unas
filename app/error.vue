<script setup>
import { AlertCircle } from 'lucide-vue-next'

defineProps({
  error: Object
})
</script>

<template>
  <NuxtLayout>
    <template #header-left>
      <p class="text-sm truncate">
        <span class="text-slate-700 font-bold">404</span>
        <span class="text-slate-500 font-medium ml-1 hidden sm:inline">- Ops! Esta página tirou um dia de folga e não nos avisou onde foi.</span>
      </p>
    </template>

    <div class="h-full w-full font-sans">
      <div class="h-full w-full bg-white/80 backdrop-blur-md rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-soft border border-brand-100">
        <img src="/camis.png" alt="Cami Unhas" class="h-24 w-auto object-contain mb-6 hover:scale-105 transition-transform duration-300" />
        
        <div class="bg-brand-50 p-4 rounded-full mb-6">
          <AlertCircle class="w-12 h-12 text-brand-500" />
        </div>

        <h1 class="text-7xl font-bold text-brand-600 mb-2">{{ error?.statusCode || 404 }}</h1>
        <h2 class="text-2xl font-semibold text-slate-700 mb-4">Ops! Página não encontrada</h2>
        <p class="text-slate-500 mb-8 px-4 max-w-md">
          {{ error?.message || 'A página que você está procurando não existe, foi removida ou está temporariamente indisponível.' }}
        </p>
      </div>
    </div>
  </NuxtLayout>
</template>
