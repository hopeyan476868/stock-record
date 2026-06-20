<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import BuyStrategyPanel from '@/components/ui/BuyStrategyPanel.vue';
import type { EmotionTag, SellExecutionCheck, Stock, StockMarketTag } from '@/types/api';
import {
  evaluateBuyStrategy,
  getStrategySummary,
  migrateLegacyStrategy,
} from '@/utils/buyStrategyEngine';

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
  revenueGrowthOk: false,
  deductedNetProfitGrowthOk: false,
  grossMarginChangeOk: false,
  roicOk: false,
  operatingCashFlowPositiveOk: false,
  riskRewardOk: false,
  turnoverRate: undefined,
  turnoverDirection: undefined,
  weeklyCloseAboveEma20Ok: false,
  marketBackground: 'STRONG_UP',
  tradingScenario: 'SHALLOW_PULLBACK',
  entryTrigger: 'H1_CONFIRM',
  volumePriceConfirmed: false,
  entryType: '',
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
    const migrated = migrateLegacyStrategy(props.stock);
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
      revenueGrowthOk: Boolean(props.stock.revenueGrowthOk),
      deductedNetProfitGrowthOk: Boolean(props.stock.deductedNetProfitGrowthOk),
      grossMarginChangeOk: Boolean(props.stock.grossMarginChangeOk),
      roicOk: Boolean(props.stock.roicOk),
      operatingCashFlowPositiveOk: Boolean(props.stock.operatingCashFlowPositiveOk),
      riskRewardOk: Boolean(props.stock.riskRewardOk),
      turnoverRate: props.stock.turnoverRate,
      turnoverDirection: props.stock.turnoverDirection,
      weeklyCloseAboveEma20Ok: Boolean(props.stock.weeklyCloseAboveEma20Ok),
      marketBackground: migrated.marketBackground,
      tradingScenario: migrated.tradingScenario,
      entryTrigger: migrated.entryTrigger,
      volumePriceConfirmed: Boolean(props.stock.volumePriceConfirmed),
      entryType: props.stock.entryType || '',
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
const strategyInput = computed(() => ({
  marketBackground: form.value.marketBackground || 'STRONG_UP',
  tradingScenario: form.value.tradingScenario || 'SHALLOW_PULLBACK',
  entryTrigger: form.value.entryTrigger || 'H1_CONFIRM',
  volumePriceConfirmed: Boolean(form.value.volumePriceConfirmed),
}));
const strategyOutput = computed(() => evaluateBuyStrategy(strategyInput.value));
const strategySummary = computed(() => getStrategySummary(strategyInput.value, strategyOutput.value));

const riskRewardRatio = computed(() => {
  const trigger = Number(form.value.triggerPrice || 0);
  const stop = Number(form.value.stopLossPrice || 0);
  const target = Number(form.value.targetPrice || form.value.takeProfitPrice || 0);
  if (!(stop < trigger && trigger < target)) return null;
  return (target - trigger) / (trigger - stop);
});
const riskRewardOk = computed(() => (riskRewardRatio.value || 0) >= 2);
const finalTradeDecision = computed(() => {
  if (strategyOutput.value.decision === 'WATCH') return { label: '观察', tone: 'border-amber-200 bg-amber-50 text-amber-700' };
  if (strategyOutput.value.decision === 'DO_NOT_BUY' || strategyOutput.value.decision === 'PASS') {
    return { label: '不买', tone: 'border-red-200 bg-red-50 text-red-700' };
  }
  if (!riskRewardOk.value) return { label: '风控不通过', tone: 'border-red-200 bg-red-50 text-red-700' };
  return { label: '可买', tone: 'border-emerald-200 bg-emerald-50 text-emerald-700' };
});

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

function validate() {
  errors.value = {};
  if (!form.value.name.trim()) errors.value.name = '股票名称不能为空';
  if (!(form.value.buyPrice > 0)) errors.value.buyPrice = '买入价格必须大于 0';
  if (!form.value.buyDate) errors.value.buyDate = '买入日期不能为空';

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
    buyReason: strategySummary.value,
    decisionReason: form.value.decisionReason?.trim() || '',
    trackingAnalysis: '',
    strategyDecision: strategyOutput.value.decision,
    entryType: strategyOutput.value.entryType,
    strategyNote: strategyOutput.value.note,
    riskRewardOk: riskRewardOk.value,
    reviewDecision: strategyOutput.value.decision === 'BUY' && riskRewardOk.value ? 'approved' : 'rejected',
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

                <!-- 核查项 -->
                <div class="col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div class="mb-3 text-sm font-semibold text-slate-900">核查</div>
                  <div class="grid gap-3 md:grid-cols-2">
                    <label class="flex items-center gap-3 rounded-xl bg-white px-3 py-3 cursor-pointer">
                      <input v-model="form.revenueGrowthOk" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      <span class="text-sm text-slate-700">营业总收入同比 ≥ 15%</span>
                    </label>
                    <label class="flex items-center gap-3 rounded-xl bg-white px-3 py-3 cursor-pointer">
                      <input v-model="form.deductedNetProfitGrowthOk" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      <span class="text-sm text-slate-700">扣非净利润同比 ≥ 15%</span>
                    </label>
                    <label class="flex items-center gap-3 rounded-xl bg-white px-3 py-3 cursor-pointer">
                      <input v-model="form.grossMarginChangeOk" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      <span class="text-sm text-slate-700">毛利率同比 ≥ -3个百分点</span>
                    </label>
                    <label class="flex items-center gap-3 rounded-xl bg-white px-3 py-3 cursor-pointer">
                      <input v-model="form.roicOk" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      <span class="text-sm text-slate-700">ROIC（TTM）≥ 8%</span>
                    </label>
                    <label class="flex items-center gap-3 rounded-xl bg-white px-3 py-3 cursor-pointer">
                      <input v-model="form.operatingCashFlowPositiveOk" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      <span class="text-sm text-slate-700">经营现金流 &gt; 0</span>
                    </label>
                    <label class="flex items-center gap-3 rounded-xl bg-white px-3 py-3 cursor-pointer">
                      <input v-model="form.weeklyCloseAboveEma20Ok" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      <span class="text-sm text-slate-700">周线收盘 > EMA20</span>
                    </label>
                  </div>
                  <!-- 换手率 -->
                  <div class="mt-3 rounded-xl bg-white px-3 py-2">
                    <div class="flex flex-wrap items-center gap-2">
                      <span class="text-sm text-slate-700">换手率</span>
                      <input v-model.number="form.turnoverRate" type="number" step="0.1" min="0" placeholder="%" class="input-field w-24 number-font" />
                      <span class="text-xs text-slate-400">%</span>
                      <template v-if="form.turnoverRate != null && form.turnoverRate > 15">
                        <select v-model="form.turnoverDirection" aria-label="资金方向" class="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm">
                          <option value="">资金方向...</option>
                          <option value="net_inflow">净流入</option>
                          <option value="net_outflow">净流出</option>
                        </select>
                      </template>
                    </div>
                  </div>
                </div>

                <!-- 策略 -->
                <div class="col-span-2">
                  <BuyStrategyPanel
                    v-model:market-background="form.marketBackground"
                    v-model:trading-scenario="form.tradingScenario"
                    v-model:entry-trigger="form.entryTrigger"
                    v-model:volume-price-confirmed="form.volumePriceConfirmed"
                    v-model:entry-type="form.entryType"
                  />
                </div>

                <div class="col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div class="mb-3 text-sm font-semibold text-slate-900">计划与备注</div>
                  <div class="grid gap-4 md:grid-cols-3">
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
                    <div class="rounded-lg border px-3 py-3 text-sm" :class="riskRewardOk ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'">
                      <div class="text-xs">系统计算盈亏比</div>
                      <div class="mt-1 font-bold number-font">{{ riskRewardRatio == null ? '请填写有效三价' : `1 : ${riskRewardRatio.toFixed(2)}` }}</div>
                    </div>
                    <div class="flex items-center justify-between rounded-lg border px-3 py-3 text-sm md:col-span-3" :class="finalTradeDecision.tone">
                      <span class="font-semibold">最终结论</span>
                      <strong>{{ finalTradeDecision.label }}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 卖出信息 -->
              <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-4">
                <div class="flex items-center justify-between">
                  <div>
                    <div class="text-sm font-semibold text-slate-900">卖出信息</div>
                    <div class="text-xs text-slate-500">只有状态切到"卖出"时，这部分才会生效。</div>
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
                    <input v-model.number="form.sellQuantity" type="number" step="1" min="1" :max="form.buyQuantity || undefined" class="input-field number-font" :class="{ 'border-red-400 bg-red-50': errors.sellQuantity }" />
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
              <button type="submit" :disabled="loading" class="btn-primary w-full">
                {{ loading ? '保存中...' : '保存修改' }}
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
