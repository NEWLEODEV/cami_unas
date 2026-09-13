<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { Html5Qrcode } from 'html5-qrcode'
import { X } from 'lucide-vue-next'

const emit = defineEmits(['scanned', 'close'])

const html5QrCode = ref(null)
const errorMsg = ref('')

onMounted(async () => {
  html5QrCode.value = new Html5Qrcode("barcode-reader")
  try {
    await html5QrCode.value.start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: { width: 280, height: 120 } // Retângulo ideal para código de barras EAN
      },
      (decodedText, decodedResult) => {
        // Sucesso na leitura
        if (html5QrCode.value.isScanning) {
          html5QrCode.value.stop().then(() => {
            emit('scanned', decodedText)
          }).catch((err) => {
            console.error("Failed to stop scanner", err)
            emit('scanned', decodedText)
          });
        }
      },
      (errorMessage) => {
        // Falha na leitura (ocorre continuamente até achar, não mostramos erro)
      }
    )
  } catch (err) {
    errorMsg.value = "Não foi possível acessar a câmera. Verifique as permissões do seu navegador."
    console.error(err)
  }
})

onUnmounted(() => {
  if (html5QrCode.value && html5QrCode.value.isScanning) {
    html5QrCode.value.stop().catch(console.error)
  }
})
</script>

<template>
  <div class="fixed inset-0 z-[100] flex flex-col bg-slate-900/95 backdrop-blur-sm">
    <div class="p-4 flex justify-between items-center text-white border-b border-white/10">
      <h3 class="font-bold text-lg">Escanear Código</h3>
      <button @click="$emit('close')" class="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
        <X class="w-6 h-6" />
      </button>
    </div>
    
    <div class="flex-1 flex flex-col items-center justify-center p-6">
      <div v-if="errorMsg" class="text-rose-400 bg-rose-500/10 p-4 rounded-xl border border-rose-500/30 text-center mb-4 max-w-sm">
        {{ errorMsg }}
      </div>
      
      <div class="w-full max-w-sm overflow-hidden rounded-[2rem] shadow-2xl relative bg-black border-4 border-white/10">
        <div id="barcode-reader" class="w-full min-h-[300px]"></div>
      </div>
      
      <div class="mt-8 text-center max-w-xs">
        <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-500/20 text-brand-400 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><rect x="7" y="7" width="10" height="10" rx="1"/><path d="M7 12h10"/></svg>
        </div>
        <p class="text-slate-300 text-sm font-medium">
          Aponte a câmera para o código de barras (EAN).
        </p>
        <p class="text-slate-500 text-xs mt-2">A leitura será feita automaticamente.</p>
      </div>
    </div>
  </div>
</template>
