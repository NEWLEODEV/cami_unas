<script setup>
import { Package, TrendingUp, AlertTriangle } from 'lucide-vue-next'

const supabase = useSupabaseClient()
const totalItems = ref(0)
const totalValue = ref(0)
const expiries = ref([])
const loading = ref(true)

onMounted(async () => {
  loading.value = true
  const { data, error } = await supabase
    .from('inventory_entries')
    .select(`
      id,
      quantity,
      purchase_price,
      expiration_date,
      products (name)
    `)
  
  if (!error && data) {
    let items = 0
    let value = 0
    let expList = []
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(today.getDate() + 30)
    thirtyDaysFromNow.setHours(23, 59, 59, 999)

    data.forEach(entry => {
      items += entry.quantity
      value += (entry.quantity * entry.purchase_price)
      
      if (entry.expiration_date) {
        const expDate = new Date(entry.expiration_date)
        
        // Verifica se vence em 30 dias ou menos (ou se já venceu recentemente)
        if (expDate <= thirtyDaysFromNow) {
          const diffTime = expDate.getTime() - today.getTime()
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) 
          
          expList.push({
            id: entry.id,
            name: entry.products?.name || 'Produto Excluído',
            expiration: expDate.toLocaleDateString('pt-BR', {timeZone: 'UTC', month: '2-digit', year: 'numeric'}),
            daysLeft: diffDays
          })
        }
      }
    })
    
    totalItems.value = items
    totalValue.value = value
    expiries.value = expList.sort((a,b) => a.daysLeft - b.daysLeft)
  }
  loading.value = false
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-slate-800">Dashboard</h1>
    </div>

    <!-- Overview Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white/80 backdrop-blur-md p-8 rounded-[2rem] shadow-soft flex items-center gap-5 border border-white hover:-translate-y-1 transition-transform duration-300">
        <div class="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-500 shadow-sm border border-brand-100/50">
          <Package class="w-7 h-7" />
        </div>
        <div>
          <p class="text-sm text-slate-400 font-medium tracking-wide uppercase">Itens em Estoque</p>
          <p class="text-3xl font-bold text-rose-950 mt-1">{{ totalItems }}</p>
        </div>
      </div>
      
      <div class="bg-white/80 backdrop-blur-md p-8 rounded-[2rem] shadow-soft flex items-center gap-5 border border-white hover:-translate-y-1 transition-transform duration-300">
        <div class="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-100/50">
          <TrendingUp class="w-7 h-7" />
        </div>
        <div>
          <p class="text-sm text-slate-400 font-medium tracking-wide uppercase">Valor Estimado</p>
          <p class="text-3xl font-bold text-rose-950 mt-1">R$ {{ totalValue.toFixed(2) }}</p>
        </div>
      </div>
    </div>

    <!-- Layout para Tabelas/Gráficos -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- Alertas de Vencimento -->
      <div class="bg-white/80 backdrop-blur-md rounded-[2rem] shadow-soft lg:col-span-1 border border-white overflow-hidden">
        <div class="p-6 border-b border-surface-100 flex items-center gap-3 bg-gradient-to-r from-orange-50/50 to-transparent">
          <div class="p-2 bg-orange-100 text-orange-500 rounded-xl">
            <AlertTriangle class="w-5 h-5" />
          </div>
          <h2 class="font-semibold text-rose-950">Próximos do Vencimento</h2>
        </div>
        <div class="p-4">
          <div v-for="item in expiries" :key="item.id" class="p-4 flex items-center justify-between hover:bg-white rounded-2xl transition-all duration-200 border border-transparent hover:border-surface-100 hover:shadow-sm mb-2">
            <div>
              <p class="font-medium text-rose-900 text-sm">{{ item.name }}</p>
              <p class="text-xs text-slate-400 mt-0.5">Vence em: {{ item.expiration }}</p>
            </div>
            <div class="px-3 py-1.5 bg-orange-50 text-orange-600 text-xs font-semibold rounded-xl border border-orange-100/50" :class="{'bg-red-50 text-red-600 border-red-100/50': item.daysLeft < 0}">
              {{ item.daysLeft < 0 ? `Vencido há ${Math.abs(item.daysLeft)} dias` : (item.daysLeft === 0 ? 'Vence hoje!' : `${item.daysLeft} dias`) }}
            </div>
          </div>
          <div v-if="expiries.length === 0" class="p-8 text-center flex flex-col items-center justify-center">
            <div class="w-12 h-12 bg-green-50 text-green-400 rounded-full flex items-center justify-center mb-3">
              <TrendingUp class="w-6 h-6" />
            </div>
            <p class="text-sm text-slate-500">Nenhum alerta de vencimento.</p>
          </div>
        </div>
      </div>

      <!-- Espaço para Gráficos -->
      <div class="bg-white/80 backdrop-blur-md rounded-[2rem] shadow-soft lg:col-span-2 flex flex-col items-center justify-center p-10 min-h-[300px] border border-white">
        <div class="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center text-brand-300 mb-4 shadow-inner">
          <Package class="w-10 h-10" />
        </div>
        <p class="text-slate-400 text-center font-medium">Gráfico de Categorias e Marcas<br><span class="text-sm font-normal opacity-75">(Funcionalidade futura)</span></p>
      </div>

    </div>
  </div>
</template>
