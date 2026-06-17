<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { SellStockSchema, type SellStockInput } from '@/schemas/stock';
import type { EmotionTag, SellExecutionCheck, Stock } from '@/types/api';

const props = defineProps<{
  open: boolean;
  stock: Stock | null;
  loading?: boolean;
}>();

const emit = defineEmits<{
  close: [];
  submit: [data: SellStockInput];
}>();

const form = ref<SellStockInput>({
  sellPrice: 0,
  sellDate: '',
  sellQuantity: undefined,
  sellEmotionTag: '理性',
  sellType: 'take_profit',
  sellExecutionCheck: '部分执行',
  patternBroken: false,
  stopLossHit: false,
  takeProfitHit: false,
  reversalCandle: false,
  sellSummary: '',
});

const errors = ref<Record<string, string>>({});

watch(() => props.open, (isOpen) => {
  if (isOpen && props.stock) {
    form.value = {
      sellPrice: props.stock.buyPrice * 1.1,
      sellDate: nowLocalDateTime(),
      sellQuantity: props.stock.buyQuantity,
      sellEmotionTag: '理性',
      sellType: 'take_profit',
      sellExecutionCheck: '部分执行',
      patternBroken: false,
      stopLossHit: false,
      takeProfitHit: false,
      reversalCandle: false,
      sellSummary: '',
    };
    errors.value = {};
  }
});

const emotionOptions: EmotionTag[] = ['理性', '犹豫', 'FOMO'];

function nowLocalDateTime() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

const expectedReturn = computed(() => {
  if (!props.stock) return 0;
  return ((form.value.sellPrice - props.stock.buyPrice) / props.stock.buyPrice) * 100;
});

const returnClass = computed(() => {
  return expectedReturn.value >= 0 ? 'text-emerald-600' : 'text-red-600';
});

const returnBgClass = computed(() => {
  return expectedReturn.value >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200';
});

const priceMatch = computed<{ label: string; check: SellExecutionCheck; tone: string }>(() => {
  const stock = props.stock;
  if (!stock) return { label: '无记录，无法比对', check: '部分执行', tone: 'text-slate-500' };
  const price = Number(form.value.sellPrice || 0);
  const targetPrice = Number(stock.targetPrice || stock.takeProfitPrice || 0);
  if (!targetPrice || !stock.stopLossPrice) {
    return { label: '未设置目标/止损价，无法比对', check: '部分执行', tone: 'text-amber-600' };
  }
  if (price >= targetPrice) {
    return { label: '达到计划目标价，严格执行', check: '是', tone: 'text-emerald-600' };
  }
  if (price <= stock.stopLossPrice) {
    return { label: '触发计划止损价，严格执行', check: '是', tone: 'text-emerald-600' };
  }
  return { label: '未触发计划目标/止损价', check: '否', tone: 'text-amber-600' };
});

watch(priceMatch, (value) => {
  form.value.sellExecutionCheck = value.check;
}, { immediate: true });

function validate(): boolean {
  errors.value = {};
  if (props.stock?.buyDate && form.value.sellDate) {
    const buy = new Date(props.stock.buyDate).getTime();
    const sell = new Date(form.value.sellDate).getTime();
    if (!Number.isNaN(buy) && !Number.isNaN(sell) && sell < buy) {
      errors.value.sellDate = '卖出时间不能早于买入时间';
      return false;
    }
  }
  if (props.stock?.buyQuantity != null && form.value.sellQuantity != null) {
    if (form.value.sellQuantity > props.stock.buyQuantity) {
      errors.value.sellQuantity = '卖出数量不能大于当前持仓数量';
      return false;
    }
  }
  const result = SellStockSchema.safeParse(form.value);
  if (!result.success) {
    result.error.issues.forEach(err => {
      const key = err.path[0] as string;
      errors.value[key] = err.message;
    });
    return false;
  }
  return true;
}

function handleSubmit() {
  if (!validate()) return;
  emit('submit', {
    ...form.value,
    sellType: props.stock?.stopLossPrice && form.value.sellPrice <= props.stock.stopLossPrice ? 'stop_loss' : 'take_profit',
    sellExecutionCheck: priceMatch.value.check,
    sellQuantity: form.value.sellQuantity ? Number(form.value.sellQuantity) : undefined,
    sellSummary: '',
  });
}

function handleClose() {
  emit('close');
}

function formatCurrency(value: number): string {
  return '¥' + value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const quantityHint = computed(() => {
  if (!props.stock?.buyQuantity) return '未记录持仓数量，留空按全部卖出处理';
  return `当前持仓 ${props.stock.buyQuantity}，小于该数量会保留剩余持仓`;
});
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop"
      >
        <div class="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden">
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-5 border-b border-slate-100">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-bold text-slate-900">卖出 SOP 检查单</h3>
                <p class="text-sm text-slate-500">卖出 {{ stock?.name }} 前确认执行纪律</p>
              </div>
            </div>
            <button
              @click="handleClose"
              class="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-all duration-150 cursor-pointer"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Info Banner -->
          <div class="mx-6 mt-6 p-4 rounded-xl border-2" :class="returnBgClass">
            <div class="grid grid-cols-4 gap-4 text-center">
              <div>
                <div class="text-xs text-slate-500 mb-1">买入价</div>
                <div class="number-font text-sm font-bold text-slate-900">{{ formatCurrency(stock?.buyPrice || 0) }}</div>
              </div>
              <div>
                <div class="text-xs text-slate-500 mb-1">卖出价</div>
                <div class="number-font text-sm font-bold text-slate-900">{{ formatCurrency(form.sellPrice) }}</div>
              </div>
              <div>
                <div class="text-xs text-slate-500 mb-1">预计收益</div>
                <div class="number-font text-sm font-bold" :class="returnClass">
                  {{ expectedReturn >= 0 ? '+' : '' }}{{ expectedReturn.toFixed(2) }}%
                </div>
              </div>
              <div>
                <div class="text-xs text-slate-500 mb-1">执行检查</div>
                <div class="text-sm font-bold" :class="priceMatch.tone">{{ priceMatch.check }}</div>
              </div>
            </div>
          </div>

          <!-- Form -->
          <form @submit.prevent="handleSubmit" class="p-6 space-y-5">
            <!-- Price & Date & Quantity -->
            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-2">卖出价格</label>
                <div class="currency-input">
                  <span class="currency-input__symbol">¥</span>
                  <input
                    v-model.number="form.sellPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    class="input-field currency-input__field number-font text-base"
                    :class="{ 'border-red-400 bg-red-50': errors.sellPrice }"
                    @blur="form.sellPrice = parseFloat(form.sellPrice.toFixed(2))"
                  />
                </div>
                <p v-if="errors.sellPrice" class="mt-1.5 text-xs text-red-600">{{ errors.sellPrice }}</p>
              </div>
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-2">卖出数量</label>
                <input
                  v-model.number="form.sellQuantity"
                  type="number"
                  step="1"
                  min="1"
                  :max="stock?.buyQuantity || undefined"
                  placeholder="留空=全部"
                  class="input-field number-font text-base"
                  :class="{ 'border-red-400 bg-red-50': errors.sellQuantity }"
                />
                <p class="mt-1.5 text-xs" :class="errors.sellQuantity ? 'text-red-600' : 'text-slate-400'">
                  {{ errors.sellQuantity || quantityHint }}
                </p>
              </div>
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-2">卖出日期</label>
                <input
                  v-model="form.sellDate"
                  type="datetime-local"
                  class="input-field"
                  :class="{ 'border-red-400 bg-red-50': errors.sellDate }"
                />
                <p v-if="errors.sellDate" class="mt-1.5 text-xs text-red-600">{{ errors.sellDate }}</p>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-4">
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-2">卖出情绪</label>
                <select v-model="form.sellEmotionTag" class="input-field">
                  <option v-for="option in emotionOptions" :key="option" :value="option">{{ option }}</option>
                </select>
              </div>
            </div>

            <div class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div class="text-xs text-slate-500">价格匹配检查</div>
              <div class="mt-1 text-sm font-semibold" :class="priceMatch.tone">{{ priceMatch.label }}</div>
              <div class="mt-1 text-xs text-slate-400">
                计划目标 {{ stock?.targetPrice || stock?.takeProfitPrice ? formatCurrency(stock.targetPrice || stock.takeProfitPrice || 0) : '-' }} / 计划止损 {{ stock?.stopLossPrice ? formatCurrency(stock.stopLossPrice) : '-' }}
              </div>
            </div>

            <!-- SOP Checklist -->
            <div class="rounded-2xl border border-slate-200 bg-white p-4">
              <div class="mb-3 text-sm font-semibold text-slate-900">卖出 SOP 核查</div>
              <div class="grid gap-3 md:grid-cols-4">
                <label class="flex items-start gap-3 rounded-2xl border border-slate-200 px-4 py-3 cursor-pointer hover:border-slate-300 transition-all">
                  <input v-model="form.patternBroken" type="checkbox" class="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  <span class="text-sm text-slate-700">形态破坏</span>
                </label>
                <label class="flex items-start gap-3 rounded-2xl border border-slate-200 px-4 py-3 cursor-pointer hover:border-slate-300 transition-all">
                  <input v-model="form.stopLossHit" type="checkbox" class="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  <span class="text-sm text-slate-700">触及止损</span>
                </label>
                <label class="flex items-start gap-3 rounded-2xl border border-slate-200 px-4 py-3 cursor-pointer hover:border-slate-300 transition-all">
                  <input v-model="form.takeProfitHit" type="checkbox" class="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  <span class="text-sm text-slate-700">触及止盈</span>
                </label>
                <label class="flex items-start gap-3 rounded-2xl border border-slate-200 px-4 py-3 cursor-pointer hover:border-slate-300 transition-all">
                  <input v-model="form.reversalCandle" type="checkbox" class="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  <span class="text-sm text-slate-700">反转 K 线</span>
                </label>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-3 pt-2">
              <button
                type="button"
                @click="handleClose"
                class="btn-secondary flex-1"
              >
                取消
              </button>
              <button
                type="submit"
                :disabled="loading"
                class="btn-primary flex-1"
              >
                {{ loading ? '保存中...' : '确认卖出' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from > div,
.modal-leave-to > div {
  transform: scale(0.95) translateY(10px);
}
</style>
