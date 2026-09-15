<script setup>
import { Package, TrendingUp, AlertTriangle, Heart, CheckCircle2, ShoppingBag, Clock, Star, Droplet } from 'lucide-vue-next'
import { Pie, Line } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title, Filler } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title, Filler)

const supabase = useSupabaseClient()
const totalItems = ref(0)
const totalValue = ref(0)
const expiries = ref([])
const recentEntries = ref([])
const gosteiItems = ref([])
const ameiItems = ref([])
const superAmeiItems = ref([])
const loading = ref(true)

// Dados Agrupados
const colorData = ref(null)
const finishData = ref([])
const topBrands = ref([])
const unusedPercentage = ref(0)
const unusedCount = ref(0)
const investmentData = ref(null)

const getProductType = (name) => {
  const match = name?.match(/\((.*?)\)$/)
  return match && match[1] ? match[1] : 'Indefinido'
}

const colorPalette = ['#ec4899', '#f472b6', '#fbcfe8', '#db2777', '#9d174d', '#fda4af', '#e11d48']

onMounted(async () => {
  loading.value = true
  const { data, error } = await supabase
    .from('inventory_entries')
    .select(`
      id,
      quantity,
      purchase_price,
      purchase_date,
      expiration_date,
      created_at,
      products (id, name, brand, color, image_url, favorite_level, is_used)
    `)
  
  if (!error && data) {
    let items = 0
    let value = 0
    let expList = []
    
    // Aggregation maps
    const colorCount = {}
    const finishCount = {}
    const brandCount = {}
    let unused = 0
    const investmentByMonth = {}
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(today.getDate() + 30)
    thirtyDaysFromNow.setHours(23, 59, 59, 999)

    // Setup for favorites and recent
    let uniqueProducts = new Map()

    data.forEach(entry => {
      const qty = entry.quantity
      items += qty
      value += (qty * entry.purchase_price)
      
      // Investment over time
      if (entry.purchase_date) {
        const d = new Date(entry.purchase_date)
        const monthYear = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        if (!investmentByMonth[monthYear]) investmentByMonth[monthYear] = 0
        investmentByMonth[monthYear] += (qty * entry.purchase_price)
      }
      
      if (entry.products) {
        // Unique products for favorites
        if (!uniqueProducts.has(entry.products.id)) {
          uniqueProducts.set(entry.products.id, entry.products)
        }
        
        // Unused
        if (!entry.products.is_used) {
          unused += qty
        }
        
        // Colors
        if (entry.products.color) {
          const colorName = entry.products.color.trim()
          colorCount[colorName] = (colorCount[colorName] || 0) + qty
        }
        
        // Finishes
        const type = getProductType(entry.products.name)
        if (type !== 'Indefinido') {
          finishCount[type] = (finishCount[type] || 0) + qty
        }
        
        // Brands
        if (entry.products.brand) {
          const brand = entry.products.brand
          brandCount[brand] = (brandCount[brand] || 0) + qty
        }
      }

      // Expiries
      if (entry.expiration_date) {
        const expDate = new Date(entry.expiration_date)
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
    
    // Set Basic stats
    totalItems.value = items
    totalValue.value = value
    expiries.value = expList.sort((a,b) => a.daysLeft - b.daysLeft)
    unusedCount.value = unused
    unusedPercentage.value = items > 0 ? Math.round((unused / items) * 100) : 0
    
    // Set Recent (Sort data by created_at)
    const sortedData = [...data].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    recentEntries.value = sortedData.slice(0, 4)
    
    // Set Favorites
    const shuffleArray = (array) => {
      let currentIndex = array.length, randomIndex;
      while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
      }
      return array;
    }

    const allProducts = Array.from(uniqueProducts.values())
    gosteiItems.value = shuffleArray(allProducts.filter(p => p.favorite_level === 1)).slice(0, 5)
    ameiItems.value = shuffleArray(allProducts.filter(p => p.favorite_level === 2)).slice(0, 5)
    superAmeiItems.value = shuffleArray(allProducts.filter(p => p.favorite_level === 3)).slice(0, 5)
    
    // Set Chart Data: Colors
    const sortedColors = Object.entries(colorCount).sort((a,b) => b[1] - a[1])
    const topColors = sortedColors.slice(0, 5)
    if (sortedColors.length > 5) {
      const othersCount = sortedColors.slice(5).reduce((sum, c) => sum + c[1], 0)
      topColors.push(['Outras', othersCount])
    }
    
    if (topColors.length > 0) {
      colorData.value = {
        labels: topColors.map(c => c[0]),
        datasets: [{
          data: topColors.map(c => c[1]),
          backgroundColor: colorPalette,
          borderWidth: 0,
          hoverOffset: 4
        }]
      }
    }
    
    // Set Finishes
    const sortedFinishes = Object.entries(finishCount).sort((a,b) => b[1] - a[1])
    finishData.value = sortedFinishes.slice(0, 4).map(f => ({
      name: f[0],
      count: f[1],
      percentage: Math.round((f[1] / items) * 100)
    }))
    
    // Set Brands
    const sortedBrands = Object.entries(brandCount).sort((a,b) => b[1] - a[1])
    topBrands.value = sortedBrands.slice(0, 4)
    
    // Set Investment Chart (Cumulative)
    const sortedMonths = Object.keys(investmentByMonth).sort()
    let cumulative = 0
    const invLabels = []
    const invDataPoints = []
    
    sortedMonths.forEach(m => {
      const [year, month] = m.split('-')
      invLabels.push(`${month}/${year.slice(2)}`)
      cumulative += investmentByMonth[m]
      invDataPoints.push(cumulative)
    })
    
    if (invLabels.length > 0) {
      investmentData.value = {
        labels: invLabels,
        datasets: [{
          label: 'Valor Acumulado (R$)',
          data: invDataPoints,
          borderColor: '#ec4899',
          backgroundColor: 'rgba(236, 72, 153, 0.1)',
          fill: true,
          tension: 0.4
        }]
      }
    }
  }
  loading.value = false
})

const colorChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right',
      labels: { font: { family: "'Outfit', sans-serif" }, usePointStyle: true, padding: 15 }
    }
  },
  cutout: '65%'
}

const lineChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
  },
  scales: {
    y: { beginAtZero: true, grid: { color: '#f3f4f6' }, border: { display: false } },
    x: { grid: { display: false }, border: { display: false } }
  }
}
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto">
    <div class="flex items-center justify-between">
      <h1 class="text-3xl font-bold text-rose-950 tracking-tight">Dashboard</h1>
    </div>

    <!-- Overview Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white/80 backdrop-blur-md p-6 rounded-[2rem] shadow-soft flex items-center gap-4 border border-white hover:-translate-y-1 transition-transform duration-300">
        <div class="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-500 shadow-sm border border-brand-100/50">
          <Package class="w-6 h-6" />
        </div>
        <div>
          <p class="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Itens no Acervo</p>
          <p class="text-2xl font-bold text-rose-950 mt-0.5">{{ totalItems }}</p>
        </div>
      </div>
      
      <div class="bg-white/80 backdrop-blur-md p-6 rounded-[2rem] shadow-soft flex items-center gap-4 border border-white hover:-translate-y-1 transition-transform duration-300">
        <div class="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-100/50">
          <TrendingUp class="w-6 h-6" />
        </div>
        <div>
          <p class="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Valor Estimado</p>
          <p class="text-2xl font-bold text-rose-950 mt-0.5">R$ {{ totalValue.toFixed(2) }}</p>
        </div>
      </div>

      <div class="bg-white/80 backdrop-blur-md p-6 rounded-[2rem] shadow-soft flex items-center gap-4 border border-white hover:-translate-y-1 transition-transform duration-300">
        <div class="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-500 shadow-sm border border-purple-100/50">
          <ShoppingBag class="w-6 h-6" />
        </div>
        <div>
          <p class="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Resumo Shopping</p>
          <p class="text-lg font-bold text-slate-400 mt-0.5">Em breve</p>
        </div>
      </div>

      <div class="bg-white/80 backdrop-blur-md p-6 rounded-[2rem] shadow-soft flex items-center gap-4 border border-white hover:-translate-y-1 transition-transform duration-300">
        <div class="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 shadow-sm border border-amber-100/50">
          <CheckCircle2 class="w-6 h-6" />
        </div>
        <div>
          <p class="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Status: Encalhados</p>
          <p class="text-2xl font-bold text-rose-950 mt-0.5">{{ unusedPercentage }}% <span class="text-sm font-medium text-slate-400">novos</span></p>
        </div>
      </div>
    </div>

    <!-- Favoritos Grid (Gostei, Adorei, Super Amei) -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      <!-- Gostei -->
      <div class="bg-white/80 backdrop-blur-md rounded-[2rem] shadow-soft border border-white overflow-hidden">
        <div class="p-5 border-b border-surface-100 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-50/50 to-transparent">
          <div class="flex gap-0.5">
            <Heart class="w-5 h-5 text-rose-500 fill-rose-500" />
            <Heart class="w-5 h-5 text-rose-200" />
            <Heart class="w-5 h-5 text-rose-200" />
          </div>
          <h2 class="font-bold text-blue-950 uppercase tracking-wide">Gostei</h2>
        </div>
        <div class="p-2">
          <div v-for="product in gosteiItems" :key="product.id" class="flex items-center gap-3 p-3 hover:bg-white rounded-2xl transition-colors">
            <div class="w-10 h-10 bg-surface-50 rounded-full overflow-hidden shrink-0 border border-surface-100 flex items-center justify-center text-slate-300">
              <img v-if="product.image_url" :src="product.image_url" class="w-full h-full object-cover">
              <Heart v-else class="w-4 h-4 text-blue-300" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-bold text-blue-950 truncate">{{ product.name }}</p>
              <div class="flex items-center gap-2 mt-0.5">
                <p class="text-xs text-slate-400 truncate">{{ product.brand }}</p>
                <div class="flex items-end gap-0.5">
                  <Heart class="w-3 h-3 text-blue-400 fill-blue-400" />
                </div>
              </div>
            </div>
          </div>
          <div v-if="gosteiItems.length === 0" class="p-6 text-center">
            <p class="text-sm text-slate-400">Nenhum item.</p>
          </div>
        </div>
      </div>

      <!-- Adorei -->
      <div class="bg-white/80 backdrop-blur-md rounded-[2rem] shadow-soft border border-white overflow-hidden">
        <div class="p-5 border-b border-surface-100 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-50/50 to-transparent">
          <div class="flex gap-0.5">
            <Heart class="w-5 h-5 text-rose-500 fill-rose-500" />
            <Heart class="w-5 h-5 text-rose-500 fill-rose-500" />
            <Heart class="w-5 h-5 text-rose-200" />
          </div>
          <h2 class="font-bold text-purple-950 uppercase tracking-wide">Adorei</h2>
        </div>
        <div class="p-2">
          <div v-for="product in ameiItems" :key="product.id" class="flex items-center gap-3 p-3 hover:bg-white rounded-2xl transition-colors">
            <div class="w-10 h-10 bg-surface-50 rounded-full overflow-hidden shrink-0 border border-surface-100 flex items-center justify-center text-slate-300">
              <img v-if="product.image_url" :src="product.image_url" class="w-full h-full object-cover">
              <Heart v-else class="w-4 h-4 text-purple-300" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-bold text-purple-950 truncate">{{ product.name }}</p>
              <div class="flex items-center gap-2 mt-0.5">
                <p class="text-xs text-slate-400 truncate">{{ product.brand }}</p>
                <div class="flex items-end gap-0.5">
                  <Heart class="w-3 h-3 text-purple-400 fill-purple-400" />
                  <Heart class="w-3 h-3 text-purple-400 fill-purple-400" />
                </div>
              </div>
            </div>
          </div>
          <div v-if="ameiItems.length === 0" class="p-6 text-center">
            <p class="text-sm text-slate-400">Nenhum item.</p>
          </div>
        </div>
      </div>

      <!-- Super Amei -->
      <div class="bg-white/80 backdrop-blur-md rounded-[2rem] shadow-soft border border-white overflow-hidden">
        <div class="p-5 border-b border-surface-100 flex items-center justify-center gap-2 bg-gradient-to-r from-rose-50/50 to-transparent">
          <div class="flex gap-0.5">
            <Heart class="w-5 h-5 text-rose-500 fill-rose-500" />
            <Heart class="w-5 h-5 text-rose-500 fill-rose-500" />
            <Heart class="w-5 h-5 text-rose-500 fill-rose-500" />
          </div>
          <h2 class="font-bold text-rose-950 uppercase tracking-wide">Super Amei</h2>
        </div>
        <div class="p-2">
          <div v-for="product in superAmeiItems" :key="product.id" class="flex items-center gap-3 p-3 hover:bg-white rounded-2xl transition-colors">
            <div class="w-10 h-10 bg-surface-50 rounded-full overflow-hidden shrink-0 border border-surface-100 flex items-center justify-center text-slate-300">
              <img v-if="product.image_url" :src="product.image_url" class="w-full h-full object-cover">
              <Heart v-else class="w-4 h-4 text-rose-300" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-bold text-rose-950 truncate">{{ product.name }}</p>
              <div class="flex items-center gap-2 mt-0.5">
                <p class="text-xs text-slate-400 truncate">{{ product.brand }}</p>
                <div class="flex items-end gap-0.5">
                  <Heart class="w-3 h-3 text-rose-500 fill-rose-500" />
                  <Heart class="w-3 h-3 text-rose-500 fill-rose-500" />
                  <Heart class="w-3 h-3 text-rose-500 fill-rose-500" />
                </div>
              </div>
            </div>
          </div>
          <div v-if="superAmeiItems.length === 0" class="p-6 text-center">
            <p class="text-sm text-slate-400">Nenhum item.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- MAIN GRIDS -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- Coluna 1: Composição do Acervo (Donut & Finishes) -->
      <div class="lg:col-span-2 space-y-6">
        
        <div class="bg-white/80 backdrop-blur-md rounded-[2rem] shadow-soft border border-white p-6">
          <h2 class="text-lg font-bold text-rose-950 mb-6 flex items-center gap-2">
            <Droplet class="w-5 h-5 text-brand-400" />
            Distribuição por Cores
          </h2>
          <div v-if="colorData" class="h-64 relative w-full flex items-center justify-center">
             <Pie :data="colorData" :options="colorChartOptions" />
          </div>
          <div v-else class="h-64 flex items-center justify-center text-slate-400">Sem dados suficientes.</div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Investment Chart -->
          <div class="bg-white/80 backdrop-blur-md rounded-[2rem] shadow-soft border border-white p-6">
            <h2 class="text-lg font-bold text-rose-950 mb-6 flex items-center gap-2">
              <TrendingUp class="w-5 h-5 text-emerald-400" />
              Evolução do Investimento
            </h2>
            <div v-if="investmentData && investmentData.labels.length > 0" class="h-48 w-full">
               <Line :data="investmentData" :options="lineChartOptions" />
            </div>
            <div v-else class="h-48 flex items-center justify-center text-slate-400 text-sm">Dados insuficientes.</div>
          </div>

          <!-- Finishes Progress Bars -->
          <div class="bg-white/80 backdrop-blur-md rounded-[2rem] shadow-soft border border-white p-6">
            <h2 class="text-lg font-bold text-rose-950 mb-4 flex items-center gap-2">
              <Star class="w-5 h-5 text-brand-400" />
              Tipos de Acabamento
            </h2>
            <div class="space-y-4">
              <div v-for="finish in finishData" :key="finish.name" class="relative">
                <div class="flex justify-between text-sm mb-1">
                  <span class="font-medium text-slate-700">{{ finish.name }}</span>
                  <span class="text-brand-600 font-bold">{{ finish.percentage }}%</span>
                </div>
                <div class="w-full bg-surface-100 rounded-full h-2">
                  <div class="bg-gradient-to-r from-brand-300 to-brand-500 h-2 rounded-full" :style="{ width: finish.percentage + '%' }"></div>
                </div>
              </div>
              <div v-if="finishData.length === 0" class="text-slate-400 text-sm text-center py-4">Nenhum acabamento detectado.</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Coluna 2: Entradas, Top Marcas, Favoritos -->
      <div class="space-y-6">
        
        <!-- Últimas Entradas -->
        <div class="bg-white/80 backdrop-blur-md rounded-[2rem] shadow-soft border border-white overflow-hidden">
          <div class="p-5 border-b border-surface-100 flex items-center gap-2 bg-gradient-to-r from-brand-50/50 to-transparent">
            <Clock class="w-5 h-5 text-brand-500" />
            <h2 class="font-bold text-rose-950">Últimas Entradas</h2>
          </div>
          <div class="p-2">
            <div v-for="entry in recentEntries" :key="entry.id" class="flex items-center gap-3 p-3 hover:bg-white rounded-2xl transition-colors">
              <div class="w-12 h-12 bg-surface-50 rounded-xl overflow-hidden shrink-0 border border-surface-100 flex items-center justify-center text-slate-300">
                <img v-if="entry.products?.image_url" :src="entry.products.image_url" class="w-full h-full object-cover">
                <Package v-else class="w-6 h-6" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-bold text-rose-950 truncate">{{ entry.products?.name }}</p>
                <p class="text-xs text-slate-400 truncate">{{ entry.products?.brand }} • {{ entry.quantity }} un</p>
              </div>
            </div>
            <div v-if="recentEntries.length === 0" class="p-4 text-center text-sm text-slate-400">Nenhuma entrada recente.</div>
          </div>
        </div>

        <!-- Top Marcas -->
        <div class="bg-white/80 backdrop-blur-md rounded-[2rem] shadow-soft border border-white p-5">
          <h2 class="text-lg font-bold text-rose-950 mb-4">Top Marcas</h2>
          <div class="space-y-3">
            <div v-for="(brand, index) in topBrands" :key="brand[0]" class="flex items-center justify-between p-2 rounded-xl" :class="index === 0 ? 'bg-brand-50' : ''">
              <div class="flex items-center gap-3">
                <div class="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs" :class="index === 0 ? 'bg-brand-500 text-white shadow-sm' : 'bg-surface-200 text-slate-500'">{{ index + 1 }}</div>
                <span class="font-medium text-slate-700">{{ brand[0] }}</span>
              </div>
              <span class="text-sm font-bold text-rose-950">{{ brand[1] }}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>
