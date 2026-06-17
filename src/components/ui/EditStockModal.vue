<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import TechnicalPatternSelect from '@/components/ui/TechnicalPatternSelect.vue';
import type { EmotionTag, ReviewDecision, SellExecutionCheck, Stock, StockMarketTag } from '@/types/api';
import {
  getBuyPositionOptions,
  getStateOptionsForTrend,
  getStrategyRule,
  getStrategyRuleTone,
  PATTERN_REMARK_OPTIONS,
} from '@/utils/tradingRules';

type EditableStockInput = Omit<Stock, 'id' | 'createdAt' | 'updatedAt'>;

const props = defineProps<{
  open: boolean;
  stock: Stock | null;
  loading?: boolean;
}>();

const emit = defineEmits<{
  close: [];
  submit: [data: EditableStockInput];
}>();

const form = ref<EditableStockInput>({
  marketTag: 'A股',
  name: '',
  buyQuantity: undefined,
  triggerTime: new Date().toISOString(),
  triggerPrice: 0,
  buyPrice: 0,
  buyDate: new Date().toISOString().split('T')[0],
  buyReason: '',
  buyPsychology: '',
  emotionTag: '理性',
  roicOk: false,
  grossMarginOk: false,
  operatingCashFlowPositiveOk: false,
  assetLiabilityRatioOk: false,
  parentNetProfitGrowthOk: false,
  profitGrowthOk: false,
  revenueGrowthOk: false,
  riskRewardOk: false,
  weeklyCloseAboveEma20Ok: false,
  weeklyEma20SlopeOk: false,
  forceContinued: false,
  priceAboveMa50Ok: false,
  trendJudgment: '上涨趋势',
  marketState: '强上升',
  buyStrategy: '强趋势小回调H1',
  technicalPattern: '强趋势小回调H1',
  patternRemark: '平台整理',
  reviewDecision: 'pending',
  decisionReason: '',
  stopLossPrice: 0,
  targetPrice: 0,
  takeProfitPrice: 0,
  trackingAnalysis: '',
  watchingOutcome: 'pending',
  sellPrice: undefined,
  sellDate: undefined,
  sellQuantity: undefined,
  sellPsychology: undefined,
  sellEmotionTag: undefined,
  sellType: undefined,
  sellExecutionCheck: undefined,
  patternBroken: undefined,
  stopLossHit: undefined,
  takeProfitHit: undefined,
  reversalCandle: undefined,
  sellSummary: undefined,
  status: 'holding',
});

const errors = ref<Record<string, string>>({});

watch(() => props.open, (isOpen) => {
  if (isOpen && props.stock) {
    form.value = {
      marketTag: props.stock.marketTag || 'A股',
      name: props.stock.name,
      buyQuantity: props.stock.buyQuantity || undefined,
      triggerTime: props.stock.triggerTime || props.stock.createdAt || new Date().toISOString(),
      triggerPrice: props.stock.triggerPrice || 0,
      buyPrice: props.stock.buyPrice,
      buyDate: props.stock.buyDate,
      buyReason: props.stock.buyReason,
      buyPsychology: props.stock.buyPsychology || '',
      emotionTag: props.stock.emotionTag || '理性',
      roicOk: Boolean(props.stock.roicOk),
      grossMarginOk: Boolean(props.stock.grossMarginOk),
      operatingCashFlowPositiveOk: Boolean(props.stock.operatingCashFlowPositiveOk),
      assetLiabilityRatioOk: Boolean(props.stock.assetLiabilityRatioOk),
      parentNetProfitGrowthOk: props.stock.parentNetProfitGrowthOk == null ? Boolean(props.stock.profitGrowthOk) : Boolean(props.stock.parentNetProfitGrowthOk),
      profitGrowthOk: Boolean(props.stock.profitGrowthOk),
      revenueGrowthOk: props.stock.revenueGrowthOk == null ? Boolean(props.stock.profitGrowthOk) : Boolean(props.stock.revenueGrowthOk),
      riskRewardOk: Boolean(props.stock.riskRewardOk),
      weeklyCloseAboveEma20Ok: Boolean(props.stock.weeklyCloseAboveEma20Ok),
      weeklyEma20SlopeOk: Boolean(props.stock.weeklyEma20SlopeOk),
      forceContinued: Boolean(props.stock.forceContinued),
      netMarginOk: Boolean(props.stock.netMarginOk),
      debtRatioOk: Boolean(props.stock.debtRatioOk),
      priceAboveMa50Ok: Boolean(props.stock.priceAboveMa50Ok),
      trendJudgment: props.stock.trendJudgment || '上涨趋势',
      marketState: props.stock.marketState || '强上升',
      buyStrategy: props.stock.buyStrategy || props.stock.technicalPattern || '强趋势小回调H1',
      technicalPattern: props.stock.technicalPattern || props.stock.buyStrategy || '强趋势小回调H1',
      patternRemark: props.stock.patternRemark || '平台整理',
      reviewDecision: props.stock.reviewDecision || (props.stock.status === 'holding' || props.stock.status === 'sold' ? 'approved' : 'pending'),
      decisionReason: props.stock.decisionReason || '',
      stopLossPrice: props.stock.stopLossPrice || 0,
      targetPrice: props.stock.targetPrice || props.stock.takeProfitPrice || 0,
      takeProfitPrice: props.stock.targetPrice || props.stock.takeProfitPrice || 0,
      trackingAnalysis: props.stock.trackingAnalysis || '',
      watchingOutcome: props.stock.watchingOutcome || 'pending',
      sellPrice: props.stock.sellPrice,
      sellDate: props.stock.sellDate,
      sellQuantity: props.stock.sellQuantity || undefined,
      sellPsychology: props.stock.sellPsychology || '',
      sellEmotionTag: props.stock.sellEmotionTag || '理性',
      sellType: props.stock.sellType || 'take_profit',
      sellExecutionCheck: props.stock.sellExecutionCheck || '部分执行',
      patternBroken: Boolean(props.stock.patternBroken),
      stopLossHit: Boolean(props.stock.stopLossHit),
      takeProfitHit: Boolean(props.stock.takeProfitHit),
      reversalCandle: Boolean(props.stock.reversalCandle),
      sellSummary: props.stock.sellSummary || '',
      status: props.stock.status === 'sold' ? 'sold' : 'holding',
    };
    errors.value = {};
  }
});

const isSold = computed(() => form.value.status === 'sold');
const expectedReturn = computed(() => {
  if (!isSold.value || !form.value.sellPrice || form.value.buyPrice <= 0) return 0;
  return ((form.value.sellPrice - form.value.buyPrice) / form.value.buyPrice) * 100;
});

const emotionOptions: EmotionTag[] = ['理性', '犹豫', 'FOMO'];
const marketTagOptions: StockMarketTag[] = ['A股', '美股'];
const trendOptions = ['上涨趋势', '下降趋势', '区间震荡'];

const strategyRule = computed(() => getStrategyRule(form.value.trendJudgment, form.value.marketState));
const strategyRuleTone = computed(() => getStrategyRuleTone(strategyRule.value.action));
const stateOptions = computed(() => getStateOptionsForTrend(form.value.trendJudgment));
const buyPositionOptions = computed(() => getBuyPositionOptions(form.value.trendJudgment, form.value.marketState));
const strategyAllowed = computed(() => {
  if (strategyRule.value.action !== 'buy') return false;
  return strategyRule.value.allowedStrategies.length === 0 || strategyRule.value.allowedStrategies.includes(form.value.buyStrategy || '');
});
const decisionOptions: Array<{ value: ReviewDecision; label: string }> = [
  { value: 'pending', label: '待评估' },
  { value: 'approved', label: '通过' },
  { value: 'rejected', label: '拒绝' },
];

const priceMatch = computed<{ label: string; check: SellExecutionCheck; tone: string }>(() => {
  if (!isSold.value) return { label: '未卖出', check: '部分执行', tone: 'text-slate-500' };
  const price = Number(form.value.sellPrice || 0);
  const targetPrice = Number(form.value.targetPrice || form.value.takeProfitPrice || 0);
  if (!targetPrice || !form.value.stopLossPrice) {
    return { label: '未设置止盈/止损价，无法比对', check: '部分执行', tone: 'text-amber-600' };
  }
  if (price >= targetPrice) return { label: '达到计划目标价，严格执行', check: '是', tone: 'text-emerald-600' };
  if (price <= form.value.stopLossPrice) return { label: '触发计划止损价，严格执行', check: '是', tone: 'text-emerald-600' };
  return { label: '未触发计划目标/止损价', check: '否', tone: 'text-amber-600' };
});

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

function validate() {
  errors.value = {};

  if (!form.value.name.trim()) errors.value.name = '股票名称不能为空';
  if (!(form.value.buyPrice > 0)) errors.value.buyPrice = '买入价格必须大于 0';
  if (!form.value.buyDate) errors.value.buyDate = '买入日期不能为空';
  if (!form.value.buyReason.trim()) errors.value.buyReason = '策略备注不能为空';

  if (isSold.value) {
    if (!(Number(form.value.sellPrice) > 0)) errors.value.sellPrice = '卖出价格必须大于 0';
    if (!form.value.sellDate) errors.value.sellDate = '卖出日期不能为空';
    if (form.value.buyQuantity != null && form.value.sellQuantity != null && form.value.sellQuantity > form.value.buyQuantity) {
      errors.value.sellQuantity = '卖出数量不能大于买入数量';
    }
    if (form.value.buyDate && form.value.sellDate) {
      const buy = new Date(form.value.buyDate).getTime();
      const sell = new Date(form.value.sellDate).getTime();
      if (!Number.isNaN(buy) && !Number.isNaN(sell) && sell < buy) {
        errors.value.sellDate = '卖出时间不能早于买入时间';
      }
    }
  }

  return Object.keys(errors.value).length === 0;
}

function handleSubmit() {
  if (!validate()) return;

  emit('submit', {
    ...form.value,
    name: form.value.name.trim(),
    buyReason: form.value.buyReason.trim(),
    decisionReason: form.value.decisionReason?.trim() || '',
    trackingAnalysis: '',
    technicalPattern: form.value.buyStrategy || form.value.technicalPattern,
    triggerPrice: Number(form.value.triggerPrice || 0),
    targetPrice: Number(form.value.targetPrice || 0),
    takeProfitPrice: Number(form.value.targetPrice || 0),
    watchingOutcome: undefined,
    buyQuantity: form.value.buyQuantity ? Number(form.value.buyQuantity) : undefined,
    sellQuantity: isSold.value ? (form.value.sellQuantity ? Number(form.value.sellQuantity) : undefined) : undefined,
    sellEmotionTag: isSold.value ? (form.value.sellEmotionTag || '理性') : undefined,
    sellType: isSold.value ? (Number(form.value.sellPrice || 0) <= Number(form.value.stopLossPrice || 0) ? 'stop_loss' : 'take_profit') : undefined,
    sellExecutionCheck: isSold.value ? priceMatch.value.check : undefined,
    patternBroken: isSold.value ? Boolean(form.value.patternBroken) : undefined,
    stopLossHit: isSold.value ? Boolean(form.value.stopLossHit) : undefined,
    takeProfitHit: isSold.value ? Boolean(form.value.takeProfitHit) : undefined,
    reversalCandle: isSold.value ? Boolean(form.value.reversalCandle) : undefined,
    sellSummary: isSold.value ? '' : undefined,
    sellPrice: isSold.value ? Number(form.value.sellPrice) : undefined,
    sellDate: isSold.value ? form.value.sellDate : undefined,
  });
}

function handleClose() {
  emit('close');
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop"
      >
        <div class="w-full max-w-2xl max-h-[85vh] bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col">
          <div class="flex items-center justify-between px-6 py-5 border-b border-slate-100">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-bold text-slate-900">编辑记录</h3>
                <p class="text-sm text-slate-500">修改 {{ stock?.name }} 的交易信息</p>
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

          <form @submit.prevent="handleSubmit" class="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div class="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-semibold text-slate-700 mb-2">股票名称</label>
                  <input v-model="form.name" type="text" class="input-field" :class="{ 'border-red-400 bg-red-50': errors.name }" />
                  <p v-if="errors.name" class="mt-1.5 text-xs text-red-600">{{ errors.name }}</p>
                </div>
                <div>
                  <label class="block text-sm font-semibold text-slate-700 mb-2">股票标记</label>
                  <select v-model="form.marketTag" class="input-field">
                    <option v-for="option in marketTagOptions" :key="option" :value="option">{{ option }}</option>
                  </select>
                </div>

                <div class="col-span-2">
                  <label class="block text-sm font-semibold text-slate-700 mb-2">当前状态</label>
                  <div class="grid grid-cols-2 gap-3">
                    <label class="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 transition-all duration-150" :class="form.status === 'holding' ? 'border-blue-500 bg-blue-50 shadow-sm' : 'hover:border-slate-300'">
                      <input v-model="form.status" type="radio" value="holding" class="mt-1 text-blue-600 focus:ring-blue-500" />
                      <div>
                        <div class="text-sm font-semibold text-slate-900">持有</div>
                        <div class="mt-1 text-xs leading-5 text-slate-500">已经真实买入。</div>
                      </div>
                    </label>
                    <label class="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 transition-all duration-150" :class="form.status === 'sold' ? 'border-emerald-500 bg-emerald-50 shadow-sm' : 'hover:border-slate-300'">
                      <input v-model="form.status" type="radio" value="sold" class="mt-1 text-emerald-600 focus:ring-emerald-500" />
                      <div>
                        <div class="text-sm font-semibold text-slate-900">卖出</div>
                        <div class="mt-1 text-xs leading-5 text-slate-500">已经完成交易。</div>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-semibold text-slate-700 mb-2">买入价格</label>
                  <div class="currency-input">
                    <span class="currency-input__symbol">¥</span>
                    <input v-model.number="form.buyPrice" type="number" step="0.01" min="0" class="input-field currency-input__field number-font" :class="{ 'border-red-400 bg-red-50': errors.buyPrice }" />
                  </div>
                  <p v-if="errors.buyPrice" class="mt-1.5 text-xs text-red-600">{{ errors.buyPrice }}</p>
                </div>
                <div>
                  <label class="block text-sm font-semibold text-slate-700 mb-2">买入数量</label>
                  <input v-model.number="form.buyQuantity" type="number" step="1" min="0" class="input-field number-font" />
                </div>
                <div>
                  <label class="block text-sm font-semibold text-slate-700 mb-2">买入日期</label>
                  <input v-model="form.buyDate" type="datetime-local" class="input-field" :class="{ 'border-red-400 bg-red-50': errors.buyDate }" />
                  <p v-if="errors.buyDate" class="mt-1.5 text-xs text-red-600">{{ errors.buyDate }}</p>
                </div>

                <div class="col-span-2">
                  <label class="block text-sm font-semibold text-slate-700 mb-2">策略备注</label>
                  <input v-model="form.buyReason" type="text" class="input-field" :class="{ 'border-red-400 bg-red-50': errors.buyReason }" />
                  <p v-if="errors.buyReason" class="mt-1.5 text-xs text-red-600">{{ errors.buyReason }}</p>
                </div>

                <div>
                  <TechnicalPatternSelect v-model="form.trendJudgment" label="背景" option-type="trend" :options="trendOptions" readonly-options />
                </div>
                <div class="col-span-2">
                  <TechnicalPatternSelect v-model="form.marketState" label="状态" option-type="marketState" :options="stateOptions" readonly-options />
                </div>
                <div class="col-span-2">
                  <TechnicalPatternSelect v-model="form.buyStrategy" label="买入位置" option-type="buyStrategy" :options="buyPositionOptions" readonly-options />
                </div>
                <div class="col-span-2">
                  <TechnicalPatternSelect v-model="form.patternRemark" label="形态" option-type="patternRemark" :options="PATTERN_REMARK_OPTIONS" readonly-options />
                </div>
                <div class="col-span-2 rounded-2xl border px-4 py-3" :class="strategyRuleTone">
                  <div class="text-sm font-semibold">{{ strategyRule.title }}</div>
                  <div class="mt-1 text-xs leading-5">{{ strategyRule.description }}</div>
                  <div v-if="strategyRule.allowedStrategies.length" class="mt-2 text-xs">
                    推荐场景：{{ strategyRule.allowedStrategies.join(' / ') }}
                  </div>
                  <div v-if="!strategyAllowed" class="mt-2 text-xs font-semibold">
                    当前组合不支持「{{ form.buyStrategy }}」。
                  </div>
                </div>

                <div class="col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div class="mb-3 text-sm font-semibold text-slate-900">核查</div>
                  <div class="grid gap-3 md:grid-cols-2">
                    <label class="flex items-start gap-3 rounded-xl bg-white px-3 py-2">
                      <input v-model="form.grossMarginOk" type="checkbox" class="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      <span class="text-sm text-slate-700">毛利率 &gt; 25%</span>
                    </label>
                    <label class="flex items-start gap-3 rounded-xl bg-white px-3 py-2">
                      <input v-model="form.operatingCashFlowPositiveOk" type="checkbox" class="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      <span class="text-sm text-slate-700">经营现金流 &gt; 0</span>
                    </label>
                    <label class="flex items-start gap-3 rounded-xl bg-white px-3 py-2">
                      <input v-model="form.assetLiabilityRatioOk" type="checkbox" class="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      <span class="text-sm text-slate-700">资产负债率 &lt; 60%</span>
                    </label>
                    <label class="flex items-start gap-3 rounded-xl bg-white px-3 py-2">
                      <input v-model="form.parentNetProfitGrowthOk" type="checkbox" class="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      <span class="text-sm text-slate-700">归母净利润同比 &gt; 20%</span>
                    </label>
                    <label class="flex items-start gap-3 rounded-xl bg-white px-3 py-2">
                      <input v-model="form.riskRewardOk" type="checkbox" class="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      <span class="text-sm text-slate-700">盈亏比 &gt; 2</span>
                    </label>
                    <label class="flex items-start gap-3 rounded-xl bg-white px-3 py-2">
                      <input v-model="form.weeklyCloseAboveEma20Ok" type="checkbox" class="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      <span class="text-sm text-slate-700">周线收盘 &gt; EMA20</span>
                    </label>
                    <label class="flex items-start gap-3 rounded-xl bg-white px-3 py-2">
                      <input v-model="form.weeklyEma20SlopeOk" type="checkbox" class="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      <span class="text-sm text-slate-700">周线EMA20斜率 &gt; 0</span>
                    </label>
                  </div>
                </div>

                <div class="col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div class="mb-3 text-sm font-semibold text-slate-900">决策与计划</div>
                  <div class="grid gap-3 md:grid-cols-3">
                    <label
                      v-for="option in decisionOptions"
                      :key="option.value"
                      class="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2"
                      :class="form.reviewDecision === option.value ? option.value === 'approved' ? 'border-emerald-500 bg-emerald-50' : option.value === 'rejected' ? 'border-red-500 bg-red-50' : 'border-amber-500 bg-amber-50' : ''"
                    >
                      <input v-model="form.reviewDecision" type="radio" :value="option.value" class="text-blue-600 focus:ring-blue-500" />
                      <span class="text-sm font-medium text-slate-800">{{ option.label }}</span>
                    </label>
                  </div>
                  <div class="mt-4 grid gap-4 md:grid-cols-3">
                    <label class="text-sm text-slate-700 md:col-span-3">
                      决策理由
                      <textarea v-model="form.decisionReason" rows="3" class="input-field mt-2 resize-none"></textarea>
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
                </div>

              </div>

              <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-4">
                <div class="flex items-center justify-between">
                  <div>
                    <div class="text-sm font-semibold text-slate-900">卖出信息</div>
                    <div class="text-xs text-slate-500">只有状态切到“卖出”时，这部分才会生效。</div>
                  </div>
                  <span class="badge" :class="isSold ? 'badge-success' : 'badge-muted'">
                    {{ isSold ? '已启用' : '未启用' }}
                  </span>
                </div>

                <div v-if="isSold" class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-2">卖出价格</label>
                    <div class="currency-input">
                      <span class="currency-input__symbol">¥</span>
                    <input v-model.number="form.sellPrice" type="number" step="0.01" min="0" class="input-field currency-input__field number-font" :class="{ 'border-red-400 bg-red-50': errors.sellPrice }" />
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
                      :max="form.buyQuantity || undefined"
                      class="input-field number-font"
                      :class="{ 'border-red-400 bg-red-50': errors.sellQuantity }"
                    />
                    <p v-if="errors.sellQuantity" class="mt-1.5 text-xs text-red-600">{{ errors.sellQuantity }}</p>
                  </div>
                  <div>
                    <label class="block text-sm font-semibold text-slate-700 mb-2">卖出日期</label>
                    <input v-model="form.sellDate" type="datetime-local" class="input-field" :class="{ 'border-red-400 bg-red-50': errors.sellDate }" />
                    <p v-if="errors.sellDate" class="mt-1.5 text-xs text-red-600">{{ errors.sellDate }}</p>
                  </div>

                  <div class="col-span-2">
                    <label class="block text-sm font-semibold text-slate-700 mb-2">卖出情绪</label>
                    <select v-model="form.sellEmotionTag" class="input-field">
                      <option v-for="option in emotionOptions" :key="option" :value="option">{{ option }}</option>
                    </select>
                  </div>

                  <div class="col-span-2">
                    <div class="rounded-xl border px-4 py-3" :class="expectedReturn >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'">
                      <div class="text-xs text-slate-500 mb-1">当前收益率</div>
                      <div class="number-font text-lg font-bold" :class="expectedReturn >= 0 ? 'text-emerald-700' : 'text-red-700'">
                        {{ expectedReturn >= 0 ? '+' : '' }}{{ expectedReturn.toFixed(2) }}%
                      </div>
                    </div>
                  </div>

                  <div class="col-span-2 rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <div class="text-xs text-slate-500">价格匹配检查</div>
                    <div class="mt-1 text-sm font-semibold" :class="priceMatch.tone">{{ priceMatch.label }}（{{ priceMatch.check }}）</div>
                  </div>

                  <div class="col-span-2">
                    <div class="rounded-2xl border border-slate-200 bg-white p-4">
                      <div class="mb-3 text-sm font-semibold text-slate-900">卖出 SOP 核查</div>
                      <div class="grid gap-3 md:grid-cols-4">
                        <label class="flex items-start gap-3 rounded-xl bg-slate-50 px-3 py-2 cursor-pointer">
                          <input v-model="form.patternBroken" type="checkbox" class="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                          <span class="text-sm text-slate-700">形态破坏</span>
                        </label>
                        <label class="flex items-start gap-3 rounded-xl bg-slate-50 px-3 py-2 cursor-pointer">
                          <input v-model="form.stopLossHit" type="checkbox" class="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                          <span class="text-sm text-slate-700">触及止损</span>
                        </label>
                        <label class="flex items-start gap-3 rounded-xl bg-slate-50 px-3 py-2 cursor-pointer">
                          <input v-model="form.takeProfitHit" type="checkbox" class="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                          <span class="text-sm text-slate-700">触及止盈</span>
                        </label>
                        <label class="flex items-start gap-3 rounded-xl bg-slate-50 px-3 py-2 cursor-pointer">
                          <input v-model="form.reversalCandle" type="checkbox" class="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                          <span class="text-sm text-slate-700">反转 K 线</span>
                        </label>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            <div class="shrink-0 border-t border-slate-100 bg-white/95 backdrop-blur px-6 py-4">
              <div class="flex gap-3">
              <button type="button" @click="handleClose" class="btn-secondary flex-1">取消</button>
              <button type="submit" :disabled="loading" class="btn-primary flex-1">
                {{ loading ? '保存中...' : '保存修改' }}
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
