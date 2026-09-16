<script setup>
import { ref, computed } from 'vue'

const tabs = [
  {
    id: 0,
    title: '🎨 O Seu Acervo',
    content: 'Esta área foi desenvolvida para que você possa criar e organizar a sua própria coleção de itens de beleza! Ao se cadastrar, você ganha um banco de dados 100% seu. Adicione seus esmaltes, gerencie quantidades, acompanhe os prazos de validade e nunca mais perca o controle da sua bancada.'
  },
  {
    id: 1,
    title: '📊 Dashboard Inteligente',
    content: 'Um painel dinâmico e inteligente. Acompanhe as estatísticas do seu acervo, veja a distribuição das suas paletas de cores, descubra quais tons você mais ama e tenha um resumo visual completo da sua coleção.'
  },
  {
    id: 2,
    title: '🛍️ Shopping',
    content: 'Nossa curadoria especial! Quer saber quais produtos usamos nos vídeos? Separamos a dedo os melhores equipamentos, esmaltes e utensílios. Clicou em "Ver Produto", você vai direto para a loja oficial.',
    note: 'Dica: Nossa vitrine contém links de afiliados. Ao comprar por eles, você apoia nosso conteúdo sem pagar nada a mais por isso!'
  },
  {
    id: 3,
    title: '📲 Acompanhe a CAMIS',
    content: 'Não quer perder nenhuma dica, tutorial ou novidade? Use nosso menu lateral para se conectar diretamente com os nossos perfis no TikTok e Instagram, ou para entrar em contato com a gente.'
  }
]

const activeTabId = ref(0)
const activeTabContent = computed(() => tabs.find(t => t.id === activeTabId.value))

definePageMeta({
  layout: false
})
</script>

<template>
  <NuxtLayout name="default">
    <template #header-left>
      <p class="text-slate-600 font-medium text-lg truncate">Bem-vindo(a) ao Universo CAMIS!</p>
    </template>

    <div class="h-full w-full py-6 md:py-8 px-4 md:px-8 flex flex-col">
      <!-- Container Split (Grid) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 flex-1 min-h-0">
        
        <!-- Coluna da Esquerda (Menu e Intro) -->
        <div class="lg:col-span-4 xl:col-span-4 flex flex-col gap-8 h-full">
          
          <!-- Intro -->
          <div class="shrink-0">
            <p class="text-slate-600 text-[15px] md:text-base leading-relaxed font-medium mb-3">
              Mais do que um aplicativo, o CAMIS é a sua ferramenta pessoal para organizar, gerenciar e inspirar o seu próprio espaço de beleza.
            </p>
          </div>

          <!-- Vertical Tabs -->
          <div class="flex flex-col gap-2 overflow-y-auto pr-2 pb-8">
            <button 
              v-for="tab in tabs" 
              :key="tab.id"
              @click="activeTabId = tab.id"
              class="w-full text-left px-5 py-4 rounded-2xl transition-all duration-300 border"
              :class="activeTabId === tab.id 
                ? 'bg-brand-50 text-brand-600 shadow-sm border-brand-100 font-bold' 
                : 'bg-transparent text-slate-500 border-transparent hover:bg-white/60 hover:text-slate-700 font-medium'"
            >
              {{ tab.title }}
            </button>
            <p class="text-slate-500 text-sm font-semibold italic opacity-80 text-center mt-4">
              Sinta-se em casa, organize suas cores e inspire-se!
            </p>
          </div>
        </div>

        <!-- Coluna da Direita (Conteúdo) -->
        <div class="lg:col-span-8 xl:col-span-8 flex flex-col h-full min-h-[400px]">
          <div class="flex-1 bg-white/90 backdrop-blur-md shadow-sm rounded-3xl p-8 lg:p-14 border border-white flex flex-col justify-center">
            
            <Transition
              enter-active-class="transition-all duration-500 ease-out"
              enter-from-class="opacity-0 translate-y-4"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition-all duration-200 ease-in"
              leave-from-class="opacity-100 translate-y-0"
              leave-to-class="opacity-0 -translate-y-4"
              mode="out-in"
            >
              <!-- Conteúdo da Aba Ativa (Sem o Título Repetido) -->
              <div :key="activeTabId" class="w-full max-w-3xl">
                
                <p class="text-slate-600 text-lg md:text-xl leading-relaxed">
                  {{ activeTabContent.content }}
                </p>
                
                <!-- Box/Alerta de Destaque -->
                <div v-if="activeTabContent.note" class="mt-8 p-5 bg-brand-50/80 rounded-2xl border border-brand-100 flex flex-col sm:flex-row items-center gap-4 shadow-inner text-left">
                  <span class="text-3xl shrink-0 drop-shadow-sm">💡</span>
                  <p class="text-brand-700 text-sm md:text-[15px] font-semibold italic leading-relaxed">
                    {{ activeTabContent.note }}
                  </p>
                </div>

              </div>
            </Transition>

          </div>
        </div>

      </div>
    </div>
  </NuxtLayout>
</template>
