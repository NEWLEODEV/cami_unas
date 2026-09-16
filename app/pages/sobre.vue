<script setup>
import { Construction } from 'lucide-vue-next'
</script>

<template>
  <div class="h-full flex flex-col items-center justify-center text-center p-8 bg-white/50 backdrop-blur-md rounded-3xl border border-white shadow-soft">
    <div class="bg-brand-50 w-24 h-24 rounded-full flex items-center justify-center mb-6">
      <Construction class="w-12 h-12 text-brand-400" />
    </div>
    <h1 class="text-3xl font-black text-slate-800 mb-4 tracking-tight">Página Sobre</h1>
    <p class="text-slate-500 max-w-md mx-auto text-lg leading-relaxed">
      Esta página está em desenvolvimento. Em breve você poderá conferir todo o conteúdo por aqui!
    </p>
  </div>
</template>
