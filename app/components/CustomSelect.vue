<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ChevronDown, Check } from 'lucide-vue-next'

const props = defineProps({
  modelValue: {
    type: [String, Number, Boolean],
    default: ''
  },
  options: {
    type: Array,
    required: true
  },
  placeholder: {
    type: String,
    default: 'Selecione...'
  },
  variant: {
    type: String,
    default: 'outline' // 'outline' | 'ghost'
  },
  required: {
    type: Boolean,
    default: false
  },
  showEmptyOption: {
    type: Boolean,
    default: true
  },
  dropdownClasses: {
    type: String,
    default: '' // Used to adjust dropdown width or position if needed
  }
})

const emit = defineEmits(['update:modelValue'])

const isOpen = ref(false)
const selectRef = ref(null)

const toggle = () => {
  isOpen.value = !isOpen.value
}

const selectOption = (option) => {
  const val = typeof option === 'object' ? option.value : option
  emit('update:modelValue', val)
  isOpen.value = false
}

const handleClickOutside = (event) => {
  if (selectRef.value && !selectRef.value.contains(event.target)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const displayValue = computed(() => {
  if (props.modelValue === '' || props.modelValue === null || props.modelValue === undefined) {
    return props.placeholder
  }
  const option = props.options.find(opt => {
    const val = typeof opt === 'object' ? opt.value : opt
    return val === props.modelValue
  })
  return option ? (typeof option === 'object' ? option.label : option) : props.placeholder
})
</script>

<template>
  <div class="relative w-full" ref="selectRef">
    <!-- Hidden select for native form validation if required -->
    <select 
      v-if="required"
      :value="modelValue" 
      @change="$emit('update:modelValue', $event.target.value)" 
      class="opacity-0 absolute inset-0 w-full h-full pointer-events-none z-[-1]"
      :required="required"
    >
      <option value="" disabled>{{ placeholder }}</option>
      <option v-for="(opt, i) in options" :key="i" :value="typeof opt === 'object' ? opt.value : opt">
        {{ typeof opt === 'object' ? opt.label : opt }}
      </option>
    </select>

    <button 
      type="button" 
      @click="toggle"
      class="w-full flex items-center justify-between text-left transition-colors relative"
      :class="{
        'px-3 py-1.5 text-sm rounded-lg border focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white shadow-sm': variant === 'outline',
        'border-surface-200': variant === 'outline' && !isOpen,
        'border-brand-500 ring-2 ring-brand-500/20': variant === 'outline' && isOpen,
        'text-sm bg-transparent border-none focus:ring-0 outline-none cursor-pointer text-slate-700 font-medium p-0': variant === 'ghost'
      }"
    >
      <span class="block truncate" :class="{'text-slate-500': (!modelValue && modelValue !== 0) && variant === 'outline'}">
        {{ displayValue }}
      </span>
      <span class="pointer-events-none flex items-center" :class="{'ml-2': variant === 'ghost'}">
        <ChevronDown 
          class="w-4 h-4 transition-transform duration-200" 
          :class="{
            'text-slate-400': variant === 'outline',
            'text-brand-500': variant === 'ghost',
            'rotate-180': isOpen
          }" 
        />
      </span>
    </button>

    <Transition
      enter-active-class="transition duration-100 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-75 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div 
        v-if="isOpen" 
        class="absolute z-[100] mt-1 bg-white border border-brand-100 rounded-xl shadow-xl overflow-hidden"
        :class="dropdownClasses || (variant === 'ghost' ? 'min-w-[200px] left-0' : 'w-full left-0')"
      >
        <ul class="max-h-60 overflow-auto py-1.5 text-sm text-slate-700 scrollbar-thin scrollbar-thumb-brand-200 scrollbar-track-transparent" tabindex="-1">
          <li 
             v-if="showEmptyOption"
             class="px-3 py-2 cursor-pointer hover:bg-brand-50 hover:text-brand-600 transition-colors flex items-center justify-between mx-1 rounded-lg"
             :class="{'bg-brand-50 text-brand-600 font-medium': !modelValue && modelValue !== 0}"
             @click="selectOption('')"
          >
            {{ placeholder }}
            <Check v-if="!modelValue && modelValue !== 0" class="w-4 h-4 text-brand-600" />
          </li>
          
          <li 
            v-for="(opt, i) in options" 
            :key="i"
            class="px-3 py-2 cursor-pointer hover:bg-brand-50 hover:text-brand-600 transition-colors flex items-center justify-between mx-1 rounded-lg"
            :class="{
              'bg-brand-50 text-brand-600 font-medium': modelValue === (typeof opt === 'object' ? opt.value : opt)
            }"
            @click="selectOption(opt)"
          >
            <span class="block truncate">{{ typeof opt === 'object' ? opt.label : opt }}</span>
            <Check v-if="modelValue === (typeof opt === 'object' ? opt.value : opt)" class="w-4 h-4 text-brand-600" />
          </li>
        </ul>
      </div>
    </Transition>
  </div>
</template>
