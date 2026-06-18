<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { BuyStockSchema, type BuyStockInput } from '@/schemas/stock';
import TechnicalPatternSelect from '@/components/ui/TechnicalPatternSelect.vue';
import type { StockMarketTag } from '@/types/api';
import {
  getBuyPositionOptions,
  getStateOptionsForTrend,
  getStrategyRule,
  getStrategyRuleTone,
  PATTERN_REMARK_OPTIONS,
} from '@/utils/tradingRules';

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
const trendOptions = ['上涨趋势', '下降趋势', '区间震荡'];

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
  riskRewardRatio: undefined,
  weeklyCloseAboveEma20Ok: false,
  weeklyEma20SlopeOk: false,
  forceContinued: false,
  priceAboveMa50Ok: false,
  trendJudgment: '上涨趋势',
  marketState: '强上升',
  buyStrategy: '强趋势小回调H1',
  technicalPattern: '强趋势小回调H1',
  patternRemark: '平台整理',
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
      riskRewardRatio: undefined,
      weeklyCloseAboveEma20Ok: false,
      weeklyEma20SlopeOk: false,
      forceContinued: false,
      priceAboveMa50Ok: false,
      trendJudgment: '上涨趋势',
      marketState: '强上升',
      buyStrategy: '强趋势小回调H1',
      technicalPattern: '强趋势小回调H1',
      patternRemark: '平台整理',
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

const strategyCombo = computed(() => [
  form.value.trendJudgment,
  form.value.marketState,
  form.value.buyStrategy,
].filter(Boolean).join('-'));

const strategyRule = computed(() => getStrategyRule(form.value.trendJudgment, form.value.marketState));
const strategyRuleTone = computed(() => getStrategyRuleTone(strategyRule.value.action));
const stateOptions = computed(() => getStateOptionsForTrend(form.value.trendJudgment));
const buyPositionOptions = computed(() => getBuyPositionOptions(form.value.trendJudgment, form.value.marketState));
const strategyAllowed = computed(() => {
  if (strategyRule.value.action !== 'buy') return false;
  return strategyRule.value.allowedStrategies.length === 0 || strategyRule.value.allowedStrategies.includes(form.value.buyStrategy || '');
});

const sopPassed = computed(() => Boolean(
  form.value.grossMarginOk &&
  form.value.operatingCashFlowPositiveOk &&
  form.value.assetLiabilityRatioOk &&
  form.value.parentNetProfitGrowthOk &&
  Boolean(form.value.riskRewardRatio) &&
  form.value.weeklyCloseAboveEma20Ok &&
  form.value.weeklyEma20SlopeOk &&
  strategyAllowed.value &&
  Number(form.value.triggerPrice) > 0 &&
  Number(form.value.targetPrice) > 0 &&
  Number(form.value.stopLossPrice) > 0
));

const canForceContinue = computed(() => !sopPassed.value);

watch([() => form.value.trendJudgment, () => form.value.marketState], () => {
  if (stateOptions.value.length > 0 && !stateOptions.value.includes(form.value.marketState || '')) {
    form.value.marketState = stateOptions.value[0];
    return;
  }
  if (!buyPositionOptions.value.includes(form.value.buyStrategy || '')) {
    form.value.buyStrategy = buyPositionOptions.value[0] || '';
    form.value.technicalPattern = form.value.buyStrategy || '';
  }
});

function validate(forceContinued = false): boolean {
  errors.value = {};
  const payload = {
    ...form.value,
    buyReason: strategyCombo.value || 'SOP买入',
    technicalPattern: form.value.buyStrategy || form.value.technicalPattern,
    takeProfitPrice: Number(form.value.targetPrice || form.value.takeProfitPrice || 0),
    status: 'holding',
    reviewDecision: 'approved',
    watchingOutcome: undefined,
    riskRewardOk: Boolean(form.value.riskRewardRatio),
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
    buyReason: strategyCombo.value || 'SOP买入',
    decisionReason: form.value.decisionReason?.trim() || '',
    trackingAnalysis: '',
    technicalPattern: form.value.buyStrategy || form.value.technicalPattern,
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
                  <div class="rounded-2xl border border-slate-200 px-4 py-3 md:col-span-2">
                    <div class="mb-2 text-sm text-slate-700">盈亏比核查（二选一）</div>
                    <div class="flex flex-wrap gap-4">
                      <label class="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                        <input v-model="form.riskRewardRatio" type="radio" value="gt2" class="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500" />
                        <span>盈亏比 &gt; 2</span>
                      </label>
                      <label class="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                        <input v-model="form.riskRewardRatio" type="radio" value="eq1" class="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500" />
                        <span>盈亏比 = 1</span>
                      </label>
                    </div>
                  </div>
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

              <section class="rounded-2xl border border-slate-200 bg-white p-4">
                <div class="mb-4 text-sm font-semibold text-slate-900">交易策略组合</div>
                <div class="grid items-start gap-4 md:grid-cols-4">
                  <TechnicalPatternSelect v-model="form.trendJudgment" label="背景" option-type="trend" :options="trendOptions" readonly-options />
                  <TechnicalPatternSelect v-model="form.marketState" label="状态" option-type="marketState" :options="stateOptions" readonly-options />
                  <TechnicalPatternSelect v-model="form.buyStrategy" label="买入位置" option-type="buyStrategy" :options="buyPositionOptions" readonly-options />
                  <TechnicalPatternSelect v-model="form.patternRemark" label="形态" option-type="patternRemark" :options="PATTERN_REMARK_OPTIONS" readonly-options />
                </div>
                <div class="mt-4 rounded-2xl border px-4 py-3" :class="strategyRuleTone">
                  <div class="text-sm font-semibold">{{ strategyRule.title }}</div>
                  <div class="mt-1 text-xs leading-5">{{ strategyRule.description }}</div>
                  <div v-if="strategyRule.allowedStrategies.length" class="mt-2 text-xs">
                    推荐场景：{{ strategyRule.allowedStrategies.join(' / ') }}
                  </div>
                  <div v-if="!strategyAllowed" class="mt-2 text-xs font-semibold">
                    当前组合不支持「{{ form.buyStrategy }}」，常规确认会被拦截。
                  </div>
                </div>
              </section>

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
              <div class="grid gap-3 md:grid-cols-3">
                <button type="button" @click="handleClose" class="btn-secondary">取消交易</button>
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
