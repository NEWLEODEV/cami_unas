<script setup>
import { LayoutDashboard, Package, ShoppingCart, LogOut } from 'lucide-vue-next'

const supabase = useSupabaseClient()

const handleLogout = async () => {
  await supabase.auth.signOut()
  navigateTo('/login')
}
</script>

<template>
  <div class="min-h-screen flex bg-transparent">
    <!-- Sidebar (Floating Style) -->
    <aside class="w-64 bg-white/80 backdrop-blur-md border-r border-brand-100 flex flex-col shrink-0 m-4 rounded-3xl shadow-soft">
      <div class="h-20 flex items-center justify-center border-b border-brand-50 mx-6">
        <h1 class="text-2xl font-bold text-brand-600 tracking-tight">Cami Unhas <span class="text-brand-300">🌸</span></h1>
      </div>
      
      <nav class="flex-1 p-6 space-y-2">
        <NuxtLink to="/" class="flex items-center gap-3 px-5 py-3.5 rounded-2xl text-slate-500 hover:bg-brand-50 hover:text-brand-600 hover:-translate-y-0.5 transition-all duration-300" active-class="bg-gradient-to-r from-brand-50 to-white text-brand-600 font-semibold shadow-sm border border-brand-100/50">
          <LayoutDashboard class="w-5 h-5" />
          Dashboard
        </NuxtLink>
         <NuxtLink to="/estoque" class="flex items-center gap-3 px-5 py-3.5 rounded-2xl text-slate-500 hover:bg-brand-50 hover:text-brand-600 hover:-translate-y-0.5 transition-all duration-300" active-class="bg-gradient-to-r from-brand-50 to-white text-brand-600 font-semibold shadow-sm border border-brand-100/50">
          <ShoppingCart class="w-5 h-5" />
          Meus Esmaltes
        </NuxtLink>
        <NuxtLink to="/produtos" class="flex items-center gap-3 px-5 py-3.5 rounded-2xl text-slate-500 hover:bg-brand-50 hover:text-brand-600 hover:-translate-y-0.5 transition-all duration-300" active-class="bg-gradient-to-r from-brand-50 to-white text-brand-600 font-semibold shadow-sm border border-brand-100/50">
          <Package class="w-5 h-5" />
          Cadastrar Produtos
        </NuxtLink>
      </nav>
      
      <div class="p-6">
        <button @click="handleLogout" class="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-2xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors">
          <LogOut class="w-5 h-5" />
          Sair
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
      <!-- Header -->
      <header class="h-20 flex items-center justify-end px-8 shrink-0">
        <div class="flex items-center gap-4 bg-white/60 backdrop-blur-md px-4 py-2 rounded-full shadow-sm border border-white">
          <span class="text-sm font-medium text-slate-600">Olá, Camila</span>
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-brand-200 to-brand-100 flex items-center justify-center text-brand-700 font-bold border-2 border-white shadow-sm">
            C
          </div>
        </div>
      </header>
      
      <!-- Page Content -->
      <div class="flex-1 overflow-auto p-8">
        <slot />
      </div>
    </main>
    <AppDialog />
  </div>
</template>
