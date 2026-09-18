<script setup>
import { ArrowRightLeft } from 'lucide-vue-next'

definePageMeta({
  layout: false,
  middleware: 'auth'
})
</script>

<template>
  <NuxtLayout name="default">
    <template #header-left>
      <p class="text-lg truncate">
        <span class="text-slate-700 font-bold">Trade</span>
        <span class="text-slate-500 font-medium ml-1">- Troque, venda ou doe os produtos da sua coleção.</span>
      </p>
    </template>

    <div class="h-full w-full flex flex-col items-center justify-center p-12 text-slate-400 bg-white/80 backdrop-blur-md rounded-[2rem] border border-white shadow-soft">
      <div class="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mb-4 shadow-inner border border-brand-100/50">
        <ArrowRightLeft class="w-10 h-10 text-brand-400" />
      </div>
      <p class="text-rose-900 font-medium text-xl">Em breve...</p>
      <p class="text-sm text-slate-500 mt-2 text-center max-w-md">
        A área de <b>Trade</b> está sendo desenvolvida com muito carinho! Logo você poderá se conectar com outras pessoas para trocar, vender ou doar os esmaltes que não usa mais.
      </p>
    </div>
  </NuxtLayout>
</template>
