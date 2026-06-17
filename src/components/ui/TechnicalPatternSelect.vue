<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  loadBuyStrategyOptions,
  loadMarketStateOptions,
  loadPatternRemarkOptions,
  loadTechnicalPatternOptions,
  loadTrendOptions,
  saveBuyStrategyOptions,
  saveMarketStateOptions,
  savePatternRemarkOptions,
  saveTechnicalPatternOptions,
  saveTrendOptions,
} from '@/utils/stockOptions';

const props = withDefaults(defineProps<{
  modelValue?: string;
  label?: string;
  optionType?: 'technicalPattern' | 'trend' | 'marketState' | 'buyStrategy' | 'patternRemark';
  options?: string[];
  readonlyOptions?: boolean;
  manageLabel?: string;
  addPlaceholder?: string;
}>(), {
  label: '策略选项',
  optionType: 'technicalPattern',
  readonlyOptions: false,
  manageLabel: '管理策略选项',
  addPlaceholder: '新增选项',
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

function loadOptions() {
  if (props.options) return [...props.options];
  if (props.optionType === 'trend') return loadTrendOptions();
  if (props.optionType === 'marketState') return loadMarketStateOptions();
  if (props.optionType === 'buyStrategy') return loadBuyStrategyOptions();
  if (props.optionType === 'patternRemark') return loadPatternRemarkOptions();
  return loadTechnicalPatternOptions();
}

function saveOptions(nextOptions: string[]) {
  if (props.optionType === 'trend') return saveTrendOptions(nextOptions);
  if (props.optionType === 'marketState') return saveMarketStateOptions(nextOptions);
  if (props.optionType === 'buyStrategy') return saveBuyStrategyOptions(nextOptions);
  if (props.optionType === 'patternRemark') return savePatternRemarkOptions(nextOptions);
  return saveTechnicalPatternOptions(nextOptions);
}

const options = ref<string[]>(loadOptions());
const newPattern = ref('');
const editingPattern = ref('');
const editingValue = ref('');

const selected = computed({
  get: () => props.modelValue || options.value[0] || '',
  set: (value: string) => emit('update:modelValue', value),
});

watch(() => props.modelValue, (value) => {
  if (props.readonlyOptions) return;
  if (value && !options.value.includes(value)) {
    options.value = saveOptions([value, ...options.value]);
  }
}, { immediate: true });

watch(() => props.options, () => {
  if (!props.options) return;
  options.value = [...props.options];
  if (!options.value.includes(selected.value)) {
    emit('update:modelValue', options.value[0] || '');
  }
}, { deep: true });

function persist(nextOptions: string[]) {
  options.value = saveOptions(nextOptions);
  if (!options.value.includes(selected.value)) {
    emit('update:modelValue', options.value[0] || '');
  }
}

function addPattern() {
  const value = newPattern.value.trim();
  if (!value) return;
  persist([value, ...options.value]);
  emit('update:modelValue', value);
  newPattern.value = '';
}

function startEdit(option: string) {
  editingPattern.value = option;
  editingValue.value = option;
}

function saveEdit() {
  const nextValue = editingValue.value.trim();
  if (!editingPattern.value || !nextValue) return;
  const nextOptions = options.value.map((option) => option === editingPattern.value ? nextValue : option);
  persist(nextOptions);
  if (selected.value === editingPattern.value) {
    emit('update:modelValue', nextValue);
  }
  editingPattern.value = '';
  editingValue.value = '';
}

function removePattern(option: string) {
  if (options.value.length <= 1) return;
  persist(options.value.filter((item) => item !== option));
}
</script>

<template>
  <div class="text-sm text-slate-700">
    <label class="block">
      {{ label }}
      <select v-model="selected" class="input-field mt-2">
        <option v-for="option in options" :key="option" :value="option">{{ option }}</option>
      </select>
    </label>

    <div v-if="!readonlyOptions" class="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <div class="mb-2 text-xs font-medium text-slate-500">{{ manageLabel }}</div>
      <div class="flex gap-2">
        <input v-model="newPattern" type="text" :placeholder="addPlaceholder" class="input-field h-9 flex-1 text-sm" @keydown.enter.prevent="addPattern" />
        <button type="button" class="btn-secondary px-3 py-2 text-sm" @click="addPattern">新增</button>
      </div>
      <div class="mt-3 flex flex-wrap gap-2">
        <div
          v-for="option in options"
          :key="option"
          class="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2 py-1"
        >
          <template v-if="editingPattern === option">
            <input v-model="editingValue" type="text" class="h-7 w-24 rounded-lg border border-slate-200 px-2 text-xs" @keydown.enter.prevent="saveEdit" />
            <button type="button" class="text-xs text-blue-600" @click="saveEdit">保存</button>
          </template>
          <template v-else>
            <span class="text-xs text-slate-700">{{ option }}</span>
            <button type="button" class="text-xs text-slate-400 hover:text-blue-600" @click="startEdit(option)">编辑</button>
            <button type="button" class="text-xs text-slate-400 hover:text-red-600" :disabled="options.length <= 1" @click="removePattern(option)">删除</button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
