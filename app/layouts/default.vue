<script setup>
import { LayoutDashboard, Package, Droplet, LogOut, Instagram, Phone, PlaySquare, ShoppingBag } from 'lucide-vue-next'

const supabase = useSupabaseClient()

const handleLogout = async () => {
  await supabase.auth.signOut()
  navigateTo('/login')
}
</script>

<template>
  <div class="min-h-screen flex flex-col md:flex-row bg-transparent">
    <!-- Sidebar (Floating Style) -->
    <aside class="hidden md:flex w-64 bg-white/80 backdrop-blur-md border-r border-brand-100 flex-col shrink-0 m-4 rounded-3xl shadow-soft">
      <div class="h-20 flex items-center justify-center border-b border-brand-50 mx-6">
        <img src="/camis.png" alt="Cami Unhas" class="h-12 w-auto object-contain" />
      </div>
      
      <nav class="flex-1 p-6 space-y-2">
        <NuxtLink to="/" class="flex items-center gap-3 px-5 py-3.5 rounded-2xl text-slate-500 hover:bg-brand-50 hover:text-brand-600 hover:-translate-y-0.5 transition-all duration-300" active-class="bg-gradient-to-r from-brand-50 to-white text-brand-600 font-semibold shadow-sm border border-brand-100/50">
          <LayoutDashboard class="w-5 h-5" />
          Dashboard
        </NuxtLink>
         <NuxtLink to="/estoque" class="flex items-center gap-3 px-5 py-3.5 rounded-2xl text-slate-500 hover:bg-brand-50 hover:text-brand-600 hover:-translate-y-0.5 transition-all duration-300" active-class="bg-gradient-to-r from-brand-50 to-white text-brand-600 font-semibold shadow-sm border border-brand-100/50">
          <Droplet class="w-5 h-5" />
          Meus Esmaltes
        </NuxtLink>
        <NuxtLink to="/shopping" class="flex items-center gap-3 px-5 py-3.5 rounded-2xl text-slate-500 hover:bg-brand-50 hover:text-brand-600 hover:-translate-y-0.5 transition-all duration-300" active-class="bg-gradient-to-r from-brand-50 to-white text-brand-600 font-semibold shadow-sm border border-brand-100/50">
          <ShoppingBag class="w-5 h-5" />
          Shopping
        </NuxtLink>

      </nav>
      
      <div class="p-6 space-y-2">
        <a href="#" target="_blank" class="flex items-center gap-3 px-5 py-3.5 rounded-2xl text-slate-500 hover:bg-brand-50 hover:text-brand-600 hover:-translate-y-0.5 transition-all duration-300">
          <PlaySquare class="w-5 h-5" />
          TikTok
        </a>
        <a href="#" target="_blank" class="flex items-center gap-3 px-5 py-3.5 rounded-2xl text-slate-500 hover:bg-brand-50 hover:text-brand-600 hover:-translate-y-0.5 transition-all duration-300">
          <Instagram class="w-5 h-5" />
          Instagram
        </a>
        <a href="#" target="_blank" class="flex items-center gap-3 px-5 py-3.5 rounded-2xl text-slate-500 hover:bg-brand-50 hover:text-brand-600 hover:-translate-y-0.5 transition-all duration-300">
          <Phone class="w-5 h-5" />
          Contatos
        </a>

        <div class="pt-2 mt-2 border-t border-brand-50">
          <button @click="handleLogout" class="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-2xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors font-medium">
            <LogOut class="w-5 h-5" />
            Sair
          </button>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col h-screen overflow-hidden min-w-0 pb-20 md:pb-0">
      <!-- Header -->
      <header class="h-16 md:h-20 flex items-center justify-between md:justify-end px-4 md:px-8 shrink-0 bg-white/50 md:bg-transparent backdrop-blur-md sticky top-0 z-30 md:static">
        <!-- Logo Mobile -->
        <div class="md:hidden">
          <img src="/camis.png" alt="Cami Unhas" class="h-8 w-auto object-contain" />
        </div>
        
        <div class="flex items-center gap-4 bg-white/60 backdrop-blur-md px-4 py-2 rounded-full shadow-sm border border-white">
          <span class="text-sm font-medium text-slate-600">Olá, Camila</span>
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-brand-200 to-brand-100 flex items-center justify-center text-brand-700 font-bold border-2 border-white shadow-sm">
            C
          </div>
        </div>
      </header>
      
      <!-- Page Content -->
      <div class="flex-1 overflow-auto p-4 md:p-8">
        <slot />
      </div>
    </main>

    <!-- Mobile Bottom Navigation -->
    <nav class="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-brand-100 flex items-center justify-around p-2 z-50 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
      <NuxtLink to="/" class="flex flex-col items-center gap-1 p-2 text-slate-400" active-class="text-brand-600">
        <LayoutDashboard class="w-6 h-6" />
        <span class="text-[10px] font-medium">Início</span>
      </NuxtLink>
      <NuxtLink to="/estoque" class="flex flex-col items-center gap-1 p-2 text-slate-400" active-class="text-brand-600">
        <Droplet class="w-6 h-6" />
        <span class="text-[10px] font-medium">Esmaltes</span>
      </NuxtLink>
      <NuxtLink to="/shopping" class="flex flex-col items-center gap-1 p-2 text-slate-400" active-class="text-brand-600">
        <ShoppingBag class="w-6 h-6" />
        <span class="text-[10px] font-medium">Shopping</span>
      </NuxtLink>
      <button @click="handleLogout" class="flex flex-col items-center gap-1 p-2 text-slate-400 hover:text-rose-600">
        <LogOut class="w-6 h-6" />
        <span class="text-[10px] font-medium">Sair</span>
      </button>
    </nav>

    <AppDialog />
  </div>
</template>
