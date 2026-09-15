<script setup>
import { Mail, MessageCircle } from 'lucide-vue-next'
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto min-h-[calc(100vh-10rem)] flex flex-col justify-center items-center">
    
    <div class="bg-white/80 backdrop-blur-md p-10 rounded-[2rem] shadow-soft border border-white flex flex-col items-center justify-center max-w-lg w-full text-center">
      <h1 class="text-3xl font-bold text-rose-950 mb-2">Fale Conosco</h1>
      <p class="text-slate-500 mb-8">Entre em contato para dúvidas, parcerias ou suporte.</p>
      
      <div class="w-full flex flex-col gap-4">
        <div class="bg-surface-50 p-6 rounded-2xl border border-surface-100 w-full flex flex-col items-center gap-4 transition-transform hover:-translate-y-1 duration-300 shadow-sm">
          <div class="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center text-rose-500 shadow-sm">
            <Mail class="w-6 h-6" />
          </div>
          <div>
            <p class="text-sm text-slate-400 font-medium uppercase tracking-wider mb-1">E-mail</p>
            <a href="mailto:contato.nailsbycamis@gmail.com" class="text-lg font-bold text-rose-600 hover:text-rose-700 transition-colors">
              contato.nailsbycamis@gmail.com
            </a>
          </div>
        </div>

        <div class="bg-surface-50 p-6 rounded-2xl border border-surface-100 w-full flex flex-col items-center gap-4 transition-transform hover:-translate-y-1 duration-300 shadow-sm">
          <div class="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-500 shadow-sm">
            <MessageCircle class="w-6 h-6" />
          </div>
          <div>
            <p class="text-sm text-slate-400 font-medium uppercase tracking-wider mb-1">WhatsApp</p>
            <a href="https://wa.me/" target="_blank" class="text-lg font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
              Chamar no WhatsApp
            </a>
          </div>
        </div>
      </div>

    </div>

  </div>
</template>
