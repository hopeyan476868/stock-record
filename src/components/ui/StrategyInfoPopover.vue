<script setup lang="ts">
import { ref } from 'vue';
defineProps<{ title: string }>();
const pinned = ref(false);
const hovering = ref(false);
</script>

<template>
  <span class="relative inline-flex" @mouseenter="hovering = true" @mouseleave="hovering = false">
    <button type="button" class="flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 bg-white text-xs font-bold text-slate-500 hover:border-blue-400 hover:text-blue-600" :aria-label="`查看${title}说明`" :aria-expanded="pinned || hovering" @click.stop="pinned = !pinned" @keydown.esc="pinned = false">i</button>
    <span v-show="hovering && !pinned" class="absolute left-0 top-7 z-[80] block max-h-80 w-[min(20rem,calc(100vw-4rem))] overflow-y-auto rounded-lg border border-slate-200 bg-white p-4 text-left text-xs font-normal leading-5 text-slate-600 shadow-xl" @click.stop>
      <strong class="mb-2 block text-sm text-slate-900">{{ title }}</strong>
      <slot />
    </span>
    <Teleport to="body">
      <div v-if="pinned" class="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 p-4" @click.self="pinned = false">
        <div class="flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
          <div class="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3">
            <strong class="text-sm text-slate-900">{{ title }}</strong>
            <button type="button" class="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-lg text-slate-500 hover:bg-slate-200" aria-label="关闭说明" @click="pinned = false">×</button>
          </div>
          <div class="overflow-y-auto px-4 py-3 text-left text-sm font-normal leading-6 text-slate-600"><slot /></div>
        </div>
      </div>
    </Teleport>
  </span>
</template>
