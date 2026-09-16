<script setup>
import { LayoutDashboard, ShoppingBag, Settings, LogOut, ArrowLeft } from 'lucide-vue-next'

const supabase = useSupabaseClient()

const handleLogout = async () => {
  await supabase.auth.signOut()
  navigateTo('/login')
}
</script>

<template>
  <div class="min-h-screen flex flex-col md:flex-row bg-slate-50">
    <!-- Sidebar Admin -->
    <aside class="hidden md:flex w-64 bg-slate-900 text-slate-300 flex-col shrink-0 m-4 rounded-3xl shadow-soft">
      <div class="h-20 flex items-center justify-center border-b border-slate-800 mx-6">
        <span class="text-white font-bold text-lg tracking-wider uppercase">Painel Admin</span>
      </div>
      
      <nav class="flex-1 p-6 space-y-2">
        <NuxtLink to="/admin/shopping" active-class="bg-brand-500 text-white shadow-sm" class="flex items-center gap-3 px-5 py-3.5 rounded-2xl hover:bg-slate-800 hover:text-white transition-all duration-300">
          <ShoppingBag class="w-5 h-5" />
          Vitrine / Afiliados
        </NuxtLink>
        <NuxtLink to="/admin" exact-active-class="bg-brand-500 text-white shadow-sm" class="flex items-center gap-3 px-5 py-3.5 rounded-2xl hover:bg-slate-800 hover:text-white transition-all duration-300">
          <LayoutDashboard class="w-5 h-5" />
          Dashboard
        </NuxtLink>
      </nav>
      
      <div class="p-6 space-y-2">
        <NuxtLink to="/" class="flex items-center gap-3 px-5 py-3.5 rounded-2xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all duration-300">
          <ArrowLeft class="w-5 h-5" />
          Voltar ao App
        </NuxtLink>

        <div class="pt-2 mt-2 border-t border-slate-800">
          <button @click="handleLogout" class="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-2xl text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-colors font-medium">
            <LogOut class="w-5 h-5" />
            Sair
          </button>
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col h-screen overflow-hidden min-w-0 pb-20 md:pb-0">
      <!-- Header Mobile -->
      <header class="md:hidden h-16 flex items-center justify-between px-4 bg-slate-900 text-white shrink-0 sticky top-0 z-30">
        <span class="font-bold uppercase tracking-wider text-sm">Admin</span>
        <button @click="handleLogout" class="p-2 text-slate-400 hover:text-red-400">
          <LogOut class="w-5 h-5" />
        </button>
      </header>
      
      <!-- Page Content -->
      <div class="flex-1 overflow-auto p-4 md:p-8 bg-slate-50/50">
        <slot />
      </div>
    </main>

    <!-- Mobile Bottom Navigation -->
    <nav class="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 text-slate-400 border-t border-slate-800 flex items-center justify-around p-2 z-50">
      <NuxtLink to="/admin" exact-active-class="text-white" class="flex flex-col items-center gap-1 p-2">
        <LayoutDashboard class="w-6 h-6" />
        <span class="text-[10px] font-medium">Painel</span>
      </NuxtLink>
      <NuxtLink to="/admin/shopping" active-class="text-white" class="flex flex-col items-center gap-1 p-2">
        <ShoppingBag class="w-6 h-6" />
        <span class="text-[10px] font-medium">Vitrine</span>
      </NuxtLink>
      <NuxtLink to="/" class="flex flex-col items-center gap-1 p-2">
        <ArrowLeft class="w-6 h-6" />
        <span class="text-[10px] font-medium">App</span>
      </NuxtLink>
    </nav>
  </div>
</template>
