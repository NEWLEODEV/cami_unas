<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');

body {
  font-family: 'Outfit', sans-serif;
  @apply bg-[#FCF8FA] text-rose-950;
}

/* Custom Tooltip using data-tooltip attribute */
[data-tooltip] {
  position: relative;
}
[data-tooltip]::after {
  content: attr(data-tooltip);
  @apply absolute px-2 py-1 bg-rose-950/95 backdrop-blur-sm text-white text-[10px] font-bold tracking-widest uppercase rounded-lg shadow-xl opacity-0 pointer-events-none transition-all duration-200 z-[100] whitespace-nowrap border border-white/10;
}

/* Default: Top */
[data-tooltip]:not(.tooltip-left):not(.tooltip-bottom):not(.tooltip-right)::after {
  bottom: 100%;
  left: 50%;
  transform: translate(-50%, 4px) scale(0.95);
  margin-bottom: 8px;
}
[data-tooltip]:not(.tooltip-left):not(.tooltip-bottom):not(.tooltip-right):hover::after {
  @apply opacity-100;
  transform: translate(-50%, 0) scale(1);
}

/* Left */
[data-tooltip].tooltip-left::after {
  top: 50%;
  right: 100%;
  transform: translate(4px, -50%) scale(0.95);
  margin-right: 8px;
}
[data-tooltip].tooltip-left:hover::after {
  @apply opacity-100;
  transform: translate(0, -50%) scale(1);
}

/* Right */
[data-tooltip].tooltip-right::after {
  top: 50%;
  left: 100%;
  transform: translate(-4px, -50%) scale(0.95);
  margin-left: 8px;
}
[data-tooltip].tooltip-right:hover::after {
  @apply opacity-100;
  transform: translate(0, -50%) scale(1);
}

/* Bottom */
[data-tooltip].tooltip-bottom::after {
  top: 100%;
  left: 50%;
  transform: translate(-50%, -4px) scale(0.95);
  margin-top: 8px;
}
[data-tooltip].tooltip-bottom:hover::after {
  @apply opacity-100;
  transform: translate(-50%, 0) scale(1);
}
</style>
