<script setup>
import { AlertCircle, AlertTriangle, X } from 'lucide-vue-next'

const { dialogState, closeDialog } = useDialog()
</script>

<template>
  <Teleport to="body">
    <div v-if="dialogState.isOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-rose-950/40 backdrop-blur-sm transition-opacity">
      <div class="bg-white rounded-[2rem] shadow-hover w-full max-w-md border border-white transform transition-all overflow-hidden relative">
        <button @click="closeDialog(false)" class="absolute top-4 right-4 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full p-2 transition-colors">
          <X class="w-5 h-5" />
        </button>
        <div class="p-8">
          <div class="flex items-start gap-4">
            <div class="shrink-0 flex items-center justify-center w-14 h-14 rounded-full shadow-inner border" 
                 :class="dialogState.type === 'alert' ? 'bg-rose-50 text-rose-500 border-rose-100/50' : 'bg-brand-50 text-brand-500 border-brand-100/50'">
              <AlertCircle v-if="dialogState.type === 'alert'" class="w-7 h-7" />
              <AlertTriangle v-else class="w-7 h-7" />
            </div>
            
            <div class="flex-1 mt-1.5">
              <h3 class="text-xl font-bold text-rose-950">{{ dialogState.title }}</h3>
              <p class="text-slate-500 mt-2 text-sm font-medium leading-relaxed">{{ dialogState.message }}</p>
            </div>
          </div>
        </div>

        <div class="bg-slate-50 p-6 flex items-center justify-end gap-3 border-t border-slate-100">
          <button v-if="dialogState.type === 'confirm'" 
                  @click="closeDialog(false)" 
                  class="px-5 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-200/50 transition-colors">
            Cancelar
          </button>
          
          <button @click="closeDialog(true)" 
                  class="px-6 py-2.5 rounded-xl font-medium text-white shadow-sm transition-transform hover:-translate-y-0.5"
                  :class="dialogState.type === 'alert' ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20' : 'bg-brand-600 hover:bg-brand-700 shadow-brand-500/20'">
            {{ dialogState.type === 'confirm' ? 'Confirmar' : 'OK' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
