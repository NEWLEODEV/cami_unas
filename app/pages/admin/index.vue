<script setup>
import { LayoutDashboard, Users, MousePointerClick, ShoppingBag } from 'lucide-vue-next'

definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

const supabase = useSupabaseClient()
const stats = ref({
  totalProducts: 0,
  totalClicks: 0
})

const fetchStats = async () => {
  // Busca métricas simples para o dashboard
  const { data } = await supabase
    .from('shopping_products')
    .select('click_count, id')
    
  if (data) {
    stats.value.totalProducts = data.length
    stats.value.totalClicks = data.reduce((acc, curr) => acc + (curr.click_count || 0), 0)
  }
}

onMounted(() => {
  fetchStats()
})
</script>

<template>
  <div class="space-y-8">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-slate-800 tracking-tight">Visão Geral</h1>
        <p class="text-slate-500 mt-1">Bem-vindo ao Painel Administrativo da Cami Unhas.</p>
      </div>
    </div>
    
    <!-- Quick Stats -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
        <div class="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
          <ShoppingBag class="w-6 h-6" />
        </div>
        <p class="text-slate-500 font-medium text-sm">Produtos no Shopping</p>
        <p class="text-3xl font-bold text-slate-800 mt-1">{{ stats.totalProducts }}</p>
      </div>
      
      <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
        <div class="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
          <MousePointerClick class="w-6 h-6" />
        </div>
        <p class="text-slate-500 font-medium text-sm">Cliques em Afiliados</p>
        <p class="text-3xl font-bold text-slate-800 mt-1">{{ stats.totalClicks }}</p>
      </div>
    </div>

    <!-- Módulos Adicionais -->
    <div class="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
      <h2 class="text-xl font-bold text-slate-800 mb-4">Módulos Administrativos</h2>
      <p class="text-slate-500 mb-6">Utilize o menu lateral para navegar entre as diferentes seções de gerenciamento da plataforma.</p>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <NuxtLink to="/admin/shopping" class="group flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-brand-50 hover:border-brand-200 transition-all">
          <div class="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center group-hover:text-brand-600 transition-colors">
            <ShoppingBag class="w-6 h-6" />
          </div>
          <div>
            <h3 class="font-bold text-slate-800 group-hover:text-brand-700">Gerenciar Vitrine</h3>
            <p class="text-sm text-slate-500">Adicionar ou editar links de afiliados.</p>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
