<template>
  <div class="flex flex-col items-center justify-center h-full">
    <div class="bg-white/80 backdrop-blur-md p-10 rounded-[2rem] border border-white shadow-soft text-center max-w-md w-full">
      <div class="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-brand-100/50">
        <ShoppingBag class="w-10 h-10 text-brand-300" />
      </div>
      <h1 class="text-3xl font-bold text-rose-950 tracking-tight mb-2">Shopping</h1>
      <p class="text-brand-600 font-medium text-lg">Em desenvolvimento</p>
      <p class="text-slate-400 text-sm mt-4">Em breve, uma nova experiência de compras para você.</p>
    </div>
  </div>
</template>

<script setup>
import { ShoppingBag } from 'lucide-vue-next'
</script>
