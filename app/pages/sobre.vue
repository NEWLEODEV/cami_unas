<script setup>
import { ref, computed } from 'vue'

const tabs = [
  {
    id: 3,
    title: ' Acompanhe a CAMIS',
    content: `Oi, eu sou Camila... ou melhor, a Camis!

Sabe aquele momento sagrado de escolher a cor do esmalte da semana, passar um hidratante nas mãos e simplesmente esquecer dos problemas lá fora? É exatamente essa energia que eu quero trazer para o seu dia. 

O Universo CAMIS foi projetado para ser o seu refúgio particular de beleza. Aqui, a gente organiza nossos vidrinhos, planeja o visual e lembra que tirar um tempinho para cuidar de si mesma é um abraço na própria autoestima. Não quer perder nossas fofocas de beleza e tutoriais? Fuça ali no menu lateral e vem me acompanhar no TikTok e no Instagram! Bora colorir a vida juntas?`
  },
  {
    id: 0,
    title: ' Monte sua Coleção',
    content: 'Esta área foi desenvolvida para que você possa criar e organizar a sua própria coleção de itens de beleza! Ao se cadastrar, você ganha um banco de dados 100% seu. Adicione seus esmaltes, gerencie quantidades, acompanhe os prazos de validade e nunca mais perca o controle da sua bancada.'
  },
  {
    id: 1,
    title: ' Dashboard Inteligente',
    content: 'Um painel dinâmico e inteligente. Acompanhe as estatísticas do seu acervo, veja a distribuição das suas paletas de cores, descubra quais tons você mais ama e tenha um resumo visual completo da sua coleção.'
  },
  {
    id: 2,
    title: ' Comprinhas/Shopping',
    content: 'Nossa curadoria especial! Quer saber quais produtos usamos nos vídeos? Separamos a dedo os melhores equipamentos, esmaltes e utensílios. Clicou em "Ver Produto", você vai direto para a loja oficial.',
    note: 'Dica: Nossa vitrine contém links de afiliados. Ao comprar por eles, você apoia nosso conteúdo sem pagar nada a mais por isso!'
  }
]

const activeTabId = ref(3)
const activeTabContent = computed(() => tabs.find(t => t.id === activeTabId.value))

useHead({
  link: [
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap'
    }
  ]
})

definePageMeta({
  layout: false
})
</script>

<template>
  <NuxtLayout name="default">
    <template #header-left>
      <p class="text-slate-600 font-medium text-lg truncate">Bem-vindo(a) ao Universo CAMIS!</p>
    </template>

    <div class="h-full w-full py-6 md:py-8 px-4 md:px-8 flex flex-col" style="font-family: 'Poppins', sans-serif;">
      
      <!-- Intro Section (Below Header) -->
      <div class="mb-6 lg:mb-8 -mt-10 md:-mt-12 shrink-0 w-full text-center">
        <p class="text-slate-600 text-[15px] md:text-base leading-relaxed font-medium">
          Mais do que um aplicativo, o CAMIS é a sua ferramenta pessoal para organizar, gerenciar e inspirar o seu próprio espaço de beleza.
        </p>
      </div>

      <!-- Container Split (Grid) -->
      <div class="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 flex-1 min-h-0">
        
        <!-- Coluna da Esquerda (Menu e Intro) -->
        <div class="lg:col-span-1 xl:col-span-1 flex flex-col gap-8 h-full">
          
          <!-- Vertical Tabs -->
          <div class="flex flex-col gap-2 pb-8 relative z-10">
            <button 
              v-for="tab in tabs" 
              :key="tab.id"
              @click="activeTabId = tab.id"
              class="w-full text-left px-4 py-3 md:py-3.5 rounded-2xl transition-all duration-300 relative focus:outline-none text-[15px]"
              :class="activeTabId === tab.id 
                ? 'bg-white/90 backdrop-blur-md text-brand-600 font-bold lg:rounded-r-none lg:w-[calc(100%+3rem+1px)] lg:scale-[1.05] lg:origin-left z-20' 
                : 'bg-transparent text-slate-500 hover:bg-white/60 hover:text-slate-700 font-medium z-0'"
            >
              {{ tab.title }}
            </button>
            <p class="text-slate-500 text-sm font-semibold italic opacity-80 text-center mt-4">
              Sinta-se em casa, organize suas <span class="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-amber-400 to-cyan-500">cores</span> e inspire-se!
            </p>
          </div>
        </div>

        <!-- Coluna da Direita (Conteúdo) -->
        <div class="lg:col-span-4 xl:col-span-4 flex flex-col h-full min-h-[400px] relative z-0">
          <div class="flex-1 bg-white/90 backdrop-blur-md rounded-3xl p-4 md:p-6 lg:p-8 border border-white flex flex-col justify-center">
            
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
              <div :key="activeTabId" class="w-full max-w-4xl mx-auto">
                
                <p class="text-slate-600 text-lg md:text-xl leading-[1.8] whitespace-pre-line" :class="{'text-center': activeTabContent.id === 3}">
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
