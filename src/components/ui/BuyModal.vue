<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { BuyStockSchema, type BuyStockInput } from '@/schemas/stock';
import BuyStrategyPanel from '@/components/ui/BuyStrategyPanel.vue';
import type { StockMarketTag } from '@/types/api';
import {
  ENTRY_TYPE_LABELS,
  evaluateBuyStrategy,
  getStrategySummary,
} from '@/utils/buyStrategyEngine';

const props = defineProps<{
  open: boolean;
  loading?: boolean;
}>();

const emit = defineEmits<{
  close: [];
  submit: [data: BuyStockInput];
}>();

const nowLocalDateTime = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
};

const marketTagOptions: StockMarketTag[] = ['A股', '美股'];

const form = ref<BuyStockInput>({
  status: 'holding',
  marketTag: 'A股',
  name: '',
  buyQuantity: undefined,
  triggerPrice: 0,
  buyPrice: 0,
  buyDate: nowLocalDateTime(),
  buyReason: '',
  emotionTag: '理性',
  roicOk: false,
  grossMarginOk: false,
  operatingCashFlowPositiveOk: false,
  assetLiabilityRatioOk: false,
  parentNetProfitGrowthOk: false,
  profitGrowthOk: false,
  revenueGrowthOk: false,
  riskRewardOk: false,
  riskRewardRatio: 'gt2',
  turnoverRateOk: false,
  tradingAmountOk: false,
  superLargeNetInflowOk: false,
  superLargeNetInflowRatioOk: false,
  weeklyCloseAboveEma20Ok: false,
  weeklyEma20SlopeOk: false,
  forceContinued: false,
  priceAboveMa50Ok: false,
  trendJudgment: '上涨趋势',
  marketState: '强上升',
  buyStrategy: '强趋势小回调H1',
  technicalPattern: '强趋势小回调H1',
  patternRemark: '平台整理',
  marketStructure: 'UP',
  trendQuality: 'STRONG',
  priceLocation: 'TREND_PULLBACK',
  marketBackground: 'STRONG_UP',
  currentStructure: 'SHALLOW_PULLBACK',
  riskState: 'NONE',
  entryType: 'H1',
  reviewDecision: 'approved',
  decisionReason: '',
  stopLossPrice: 0,
  targetPrice: 0,
  takeProfitPrice: 0,
  trackingAnalysis: '',
  watchingOutcome: 'pending',
});

const errors = ref<Record<string, string>>({});

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    form.value = {
      status: 'holding',
      marketTag: 'A股',
      name: '',
      buyQuantity: undefined,
      triggerPrice: 0,
      buyPrice: 0,
      buyDate: nowLocalDateTime(),
      buyReason: '',
      emotionTag: '理性',
      roicOk: false,
      grossMarginOk: false,
      operatingCashFlowPositiveOk: false,
      assetLiabilityRatioOk: false,
      parentNetProfitGrowthOk: false,
      profitGrowthOk: false,
      revenueGrowthOk: false,
      riskRewardOk: false,
      riskRewardRatio: 'gt2',
      turnoverRateOk: false,
      tradingAmountOk: false,
      superLargeNetInflowOk: false,
      superLargeNetInflowRatioOk: false,
      weeklyCloseAboveEma20Ok: false,
      weeklyEma20SlopeOk: false,
      forceContinued: false,
      priceAboveMa50Ok: false,
      trendJudgment: '上涨趋势',
      marketState: '强上升',
      buyStrategy: '强趋势小回调H1',
      technicalPattern: '强趋势小回调H1',
      patternRemark: '平台整理',
      marketStructure: 'UP',
      trendQuality: 'STRONG',
      priceLocation: 'TREND_PULLBACK',
      marketBackground: 'STRONG_UP',
      currentStructure: 'SHALLOW_PULLBACK',
      riskState: 'NONE',
      entryType: 'H1',
      reviewDecision: 'approved',
      decisionReason: '',
      stopLossPrice: 0,
      targetPrice: 0,
      takeProfitPrice: 0,
      trackingAnalysis: '',
      watchingOutcome: 'pending',
    };
    errors.value = {};
  }
});

const strategyInput = computed(() => ({
  marketBackground: form.value.marketBackground || 'STRONG_UP',
  currentStructure: form.value.currentStructure || 'SHALLOW_PULLBACK',
  riskState: form.value.riskState || 'NONE',
  entryType: form.value.entryType || 'H1',
}));
const strategyOutput = computed(() => evaluateBuyStrategy(strategyInput.value));
const strategySummary = computed(() => getStrategySummary(strategyInput.value, strategyOutput.value));

const sopPassed = computed(() => Boolean(
  form.value.grossMarginOk &&
  form.value.operatingCashFlowPositiveOk &&
  form.value.assetLiabilityRatioOk &&
  form.value.parentNetProfitGrowthOk &&
  form.value.riskRewardOk &&
  Boolean(form.value.riskRewardRatio) &&
  form.value.turnoverRateOk &&
  form.value.tradingAmountOk &&
  form.value.superLargeNetInflowOk &&
  form.value.superLargeNetInflowRatioOk &&
  form.value.weeklyCloseAboveEma20Ok &&
  form.value.weeklyEma20SlopeOk &&
  strategyOutput.value.decision === 'BUY' &&
  Number(form.value.triggerPrice) > 0 &&
  Number(form.value.targetPrice) > 0 &&
  Number(form.value.stopLossPrice) > 0
));

const canForceContinue = computed(() => !sopPassed.value);

function validate(forceContinued = false): boolean {
  errors.value = {};
  const payload = {
    ...form.value,
    buyReason: strategySummary.value,
    buyStrategy: ENTRY_TYPE_LABELS[strategyInput.value.entryType],
    technicalPattern: undefined,
    patternRemark: undefined,
    strategyDecision: strategyOutput.value.decision,
    entryType: strategyInput.value.entryType,
    entryOptions: strategyOutput.value.entryOptions,
    strategyNote: strategyOutput.value.note,
    takeProfitPrice: Number(form.value.targetPrice || form.value.takeProfitPrice || 0),
    status: 'holding',
    reviewDecision: 'approved',
    watchingOutcome: undefined,
    riskRewardOk: Boolean(form.value.riskRewardOk && form.value.riskRewardRatio),
    forceContinued,
  } as BuyStockInput;
  if (!forceContinued && !sopPassed.value) {
    errors.value.decisionReason = '存在未通过检查项';
    return false;
  }
  if (forceContinued && !payload.decisionReason?.trim()) {
    errors.value.decisionReason = '强制继续必须填写备注原因';
    return false;
  }
  const result = BuyStockSchema.safeParse(payload);
  if (!result.success) {
    result.error.issues.forEach(err => {
      const key = err.path[0] as string;
      errors.value[key] = err.message;
    });
    return false;
  }
  form.value = payload;
  return true;
}

function submitWithMode(forceContinued = false) {
  if (!validate(forceContinued)) return;
  emit('submit', {
    ...form.value,
    name: form.value.name.trim(),
    buyReason: strategySummary.value,
    decisionReason: form.value.decisionReason?.trim() || '',
    trackingAnalysis: '',
    technicalPattern: undefined,
    forceContinued,
    triggerPrice: Number(form.value.triggerPrice || 0),
    buyQuantity: form.value.buyQuantity ? Number(form.value.buyQuantity) : undefined,
    stopLossPrice: Number(form.value.stopLossPrice || 0),
    targetPrice: Number(form.value.targetPrice || 0),
    takeProfitPrice: Number(form.value.targetPrice || 0),
  });
}

function handleClose() {
  emit('close');
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
        <div class="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
          <div class="flex items-center justify-between border-b border-slate-100 px-6 py-5">
            <div>
              <h3 class="text-lg font-bold text-slate-900">买入 SOP 检查单</h3>
              <p class="text-sm text-slate-500">交易前完成检查，减少情绪化买入</p>
            </div>
            <button @click="handleClose" class="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form @submit.prevent class="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div class="flex-1 space-y-5 overflow-y-auto px-6 py-6">
              <section class="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div class="mb-4 text-sm font-semibold text-slate-900">基础信息</div>
                <div class="grid gap-4 md:grid-cols-4">
                  <label class="text-sm text-slate-700">
                    股票标记
                    <select v-model="form.marketTag" class="input-field mt-2">
                      <option v-for="option in marketTagOptions" :key="option" :value="option">{{ option }}</option>
                    </select>
                  </label>
                  <label class="text-sm text-slate-700 md:col-span-2">
                    股票名称
                    <input v-model="form.name" type="text" placeholder="如：贵州茅台" class="input-field mt-2" :class="{ 'border-red-400 bg-red-50': errors.name }" />
                    <p v-if="errors.name" class="mt-1.5 text-xs text-red-600">{{ errors.name }}</p>
                  </label>
                  <label class="text-sm text-slate-700">
                    买入价格
                    <input v-model.number="form.buyPrice" type="number" step="0.01" min="0" class="input-field mt-2 number-font" :class="{ 'border-red-400 bg-red-50': errors.buyPrice }" />
                    <p v-if="errors.buyPrice" class="mt-1.5 text-xs text-red-600">{{ errors.buyPrice }}</p>
                  </label>
                  <label class="text-sm text-slate-700">
                    买入数量
                    <input v-model.number="form.buyQuantity" type="number" step="1" min="0" class="input-field mt-2 number-font" />
                  </label>
                  <label class="text-sm text-slate-700">
                    买入时间
                    <input v-model="form.buyDate" type="datetime-local" class="input-field mt-2" :class="{ 'border-red-400 bg-red-50': errors.buyDate }" />
                  </label>
                </div>
              </section>

              <section class="rounded-2xl border border-slate-200 bg-white p-4">
                <div class="mb-4 text-sm font-semibold text-slate-900">系统预设检查项</div>
                <div class="grid gap-3 md:grid-cols-4">
                  <label class="flex items-start gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                    <input v-model="form.grossMarginOk" type="checkbox" class="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    <span class="text-sm text-slate-700">毛利率 &gt; 25%</span>
                  </label>
                  <label class="flex items-start gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                    <input v-model="form.operatingCashFlowPositiveOk" type="checkbox" class="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    <span class="text-sm text-slate-700">经营现金流 &gt; 0</span>
                  </label>
                  <label class="flex items-start gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                    <input v-model="form.assetLiabilityRatioOk" type="checkbox" class="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    <span class="text-sm text-slate-700">资产负债率 &lt; 60%</span>
                  </label>
                  <label class="flex items-start gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                    <input v-model="form.parentNetProfitGrowthOk" type="checkbox" class="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    <span class="text-sm text-slate-700">归母净利润同比 &gt; 20%</span>
                  </label>
                  <label class="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                    <input v-model="form.riskRewardOk" type="checkbox" class="h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    <span class="whitespace-nowrap text-sm text-slate-700">盈亏比</span>
                    <select v-model="form.riskRewardRatio" aria-label="盈亏比选项" class="h-9 min-w-24 flex-1 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100">
                      <option value="eq1">= 1</option><option value="gt2">≥ 2</option>
                    </select>
                  </label>
                  <label class="flex items-start gap-3 rounded-2xl border border-slate-200 px-4 py-3"><input v-model="form.turnoverRateOk" type="checkbox" class="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" /><span class="text-sm text-slate-700">换手率 3%-15%</span></label>
                  <label class="flex items-start gap-3 rounded-2xl border border-slate-200 px-4 py-3"><input v-model="form.tradingAmountOk" type="checkbox" class="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" /><span class="text-sm text-slate-700">成交额 ≥ 3亿</span></label>
                  <label class="flex items-start gap-3 rounded-2xl border border-slate-200 px-4 py-3"><input v-model="form.superLargeNetInflowOk" type="checkbox" class="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" /><span class="text-sm text-slate-700">超大单净流入</span></label>
                  <label class="flex items-start gap-3 rounded-2xl border border-slate-200 px-4 py-3"><input v-model="form.superLargeNetInflowRatioOk" type="checkbox" class="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" /><span class="text-sm text-slate-700">超大单净流入 / 成交额 ≥ 5%</span></label>
                  <label class="flex items-start gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                    <input v-model="form.weeklyCloseAboveEma20Ok" type="checkbox" class="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    <span class="text-sm text-slate-700">周线收盘 &gt; EMA20</span>
                  </label>
                  <label class="flex items-start gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                    <input v-model="form.weeklyEma20SlopeOk" type="checkbox" class="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    <span class="text-sm text-slate-700">周线EMA20斜率 &gt; 0</span>
                  </label>
                </div>
              </section>

              <BuyStrategyPanel v-model:market-background="form.marketBackground" v-model:current-structure="form.currentStructure" v-model:risk-state="form.riskState" v-model:entry-type="form.entryType" />

              <section class="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div class="mb-4 flex items-center justify-between gap-3">
                  <div class="text-sm font-semibold text-slate-900">计划与备注</div>
                  <span class="badge" :class="sopPassed ? 'badge-success' : 'badge-cta'">{{ sopPassed ? '检查通过' : '存在未通过检查项' }}</span>
                </div>
                <div class="mt-4 grid gap-4 md:grid-cols-4">
                  <label class="text-sm text-slate-700 md:col-span-4">
                    备注
                    <textarea v-model="form.decisionReason" rows="3" placeholder="检查项未通过时必须填写原因；也可记录买入理由" class="input-field mt-2 resize-none" :class="{ 'border-red-400 bg-red-50': errors.decisionReason }"></textarea>
                    <p v-if="errors.decisionReason" class="mt-1.5 text-xs text-red-600">{{ errors.decisionReason }}</p>
                  </label>
                  <label class="text-sm text-slate-700">
                    触发价
                    <input v-model.number="form.triggerPrice" type="number" min="0" step="0.01" class="input-field mt-2 number-font" />
                  </label>
                  <label class="text-sm text-slate-700">
                    止损价
                    <input v-model.number="form.stopLossPrice" type="number" min="0" step="0.01" class="input-field mt-2 number-font" />
                  </label>
                  <label class="text-sm text-slate-700">
                    目标价
                    <input v-model.number="form.targetPrice" type="number" min="0" step="0.01" class="input-field mt-2 number-font" />
                  </label>
                </div>
              </section>
            </div>

            <div class="shrink-0 border-t border-slate-100 bg-white/95 px-6 py-4 backdrop-blur">
              <div class="grid grid-cols-2 gap-3">
                <button type="button" :disabled="loading || !canForceContinue" class="btn-secondary" @click="submitWithMode(true)">
                  {{ loading ? '保存中...' : '强制继续' }}
                </button>
                <button type="button" :disabled="loading || !sopPassed" class="btn-primary" @click="submitWithMode(false)">
                  {{ loading ? '保存中...' : '确认检查' }}
                </button>
              </div>
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
