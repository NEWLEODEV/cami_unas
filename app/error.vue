<script setup>
import { Home, AlertCircle } from 'lucide-vue-next'

const props = defineProps({
  error: Object
})

const handleError = () => clearError({ redirect: '/' })
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-[#FCF8FA] p-4 font-sans">
    <div class="max-w-md w-full bg-white/80 backdrop-blur-md rounded-3xl p-8 flex flex-col items-center text-center shadow-soft border border-brand-100">
      <img src="/camis.png" alt="Cami Unhas" class="h-24 w-auto object-contain mb-6 hover:scale-105 transition-transform duration-300" />
      
      <div class="bg-brand-50 p-4 rounded-full mb-6">
        <AlertCircle class="w-12 h-12 text-brand-500" />
      </div>

      <h1 class="text-7xl font-bold text-brand-600 mb-2">{{ error?.statusCode || 404 }}</h1>
      <h2 class="text-2xl font-semibold text-slate-700 mb-4">Ops! Página não encontrada</h2>
      <p class="text-slate-500 mb-8 px-4">
        {{ error?.message || 'A página que você está procurando não existe, foi removida ou está temporariamente indisponível.' }}
      </p>
      
      <button @click="handleError" class="flex items-center justify-center w-full gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-brand-400 to-brand-500 text-white font-semibold shadow-md hover:shadow-hover hover:-translate-y-1 transition-all duration-300">
        <Home class="w-5 h-5" />
        Voltar para o Início
      </button>
    </div>
  </div>
</template>
