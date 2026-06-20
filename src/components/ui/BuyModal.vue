<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { BuyStockSchema, type BuyStockInput } from '@/schemas/stock';
import BuyStrategyPanel from '@/components/ui/BuyStrategyPanel.vue';
import type { StockMarketTag, TurnoverDirection } from '@/types/api';
import {
  evaluateBuyStrategy,
  getStrategySummary,
  DECISION_LABELS,
} from '@/utils/buyStrategyEngine';
import type { MarketBackground, TradingScenario, EntryTrigger } from '@/utils/buyStrategyEngine';

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

const form = ref({
  status: 'holding' as const,
  marketTag: 'A股' as StockMarketTag,
  name: '',
  buyQuantity: undefined as number | undefined,
  triggerPrice: 0,
  buyPrice: 0,
  buyDate: nowLocalDateTime(),
  emotionTag: '理性' as const,
  // 基本面检查
  revenueGrowthOk: false,
  deductedNetProfitGrowthOk: false,
  grossMarginChangeOk: false,
  roicOk: false,
  operatingCashFlowPositiveOk: false,
  // 换手率
  turnoverRate: undefined as number | undefined,
  turnoverDirection: undefined as TurnoverDirection | undefined,
  turnoverConfirm: false,
  // 周线
  weeklyCloseAboveEma20Ok: false,
  // 策略（三级联动）
  marketBackground: 'STRONG_UP' as MarketBackground,
  tradingScenario: 'SHALLOW_PULLBACK' as TradingScenario,
  entryTrigger: 'H1_CONFIRM' as EntryTrigger,
  volumePriceConfirmed: false,
  entryType: '',
  // 交易计划
  stopLossPrice: 0,
  targetPrice: 0,
  decisionReason: '',
});

const errors = ref<Record<string, string>>({});
const showTurnoverWarning = computed(() => {
  const rate = form.value.turnoverRate;
  return rate != null && rate > 15;
});

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
      emotionTag: '理性',
      revenueGrowthOk: false,
      deductedNetProfitGrowthOk: false,
      grossMarginChangeOk: false,
      roicOk: false,
      operatingCashFlowPositiveOk: false,
      turnoverRate: undefined,
      turnoverDirection: undefined,
      turnoverConfirm: false,
      weeklyCloseAboveEma20Ok: false,
      marketBackground: 'STRONG_UP',
      tradingScenario: 'SHALLOW_PULLBACK',
      entryTrigger: 'H1_CONFIRM',
      volumePriceConfirmed: false,
      entryType: '',
      stopLossPrice: 0,
      targetPrice: 0,
      decisionReason: '',
    };
    errors.value = {};
  }
});

const strategyInput = computed(() => ({
  marketBackground: form.value.marketBackground,
  tradingScenario: form.value.tradingScenario,
  entryTrigger: form.value.entryTrigger,
  volumePriceConfirmed: form.value.volumePriceConfirmed,
}));
const strategyOutput = computed(() => evaluateBuyStrategy(strategyInput.value));
const strategySummary = computed(() => getStrategySummary(strategyInput.value, strategyOutput.value));

const isStrategyBlocked = computed(() =>
  strategyOutput.value.decision === 'DO_NOT_BUY' || strategyOutput.value.decision === 'PASS'
);

const riskRewardRatio = computed(() => {
  const trigger = Number(form.value.triggerPrice || 0);
  const stop = Number(form.value.stopLossPrice || 0);
  const target = Number(form.value.targetPrice || 0);
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

const sopPassed = computed(() => {
  // 基本面五项全过
  const fundamentals = Boolean(
    form.value.revenueGrowthOk &&
    form.value.deductedNetProfitGrowthOk &&
    form.value.grossMarginChangeOk &&
    form.value.roicOk &&
    form.value.operatingCashFlowPositiveOk
  );
  // 盈亏比
  const reward = riskRewardOk.value;
  // 周线趋势
  const trend = form.value.marketBackground === 'STRONG_UP' || form.value.marketBackground === 'NORMAL_UP'
    ? form.value.weeklyCloseAboveEma20Ok
    : true;
  // 换手率检查
  const rate = form.value.turnoverRate;
  let turnoverOk = false;
  if (rate == null) {
    turnoverOk = false;
  } else if (rate <= 15 && rate > 1) {
    turnoverOk = true;
  } else if (rate > 15) {
    turnoverOk = form.value.turnoverConfirm && form.value.turnoverDirection != null;
  } else {
    turnoverOk = false;
  }
  // 策略未被拦截
  const strategyOk = strategyOutput.value.decision === 'BUY';
  // 三价齐全
  const pricesOk = Number(form.value.triggerPrice) > 0 && Number(form.value.targetPrice) > 0 && Number(form.value.stopLossPrice) > 0;

  return fundamentals && reward && trend && turnoverOk && strategyOk && pricesOk;
});

// 未通过但允许提交（需填写原因）
const canForceSubmit = computed(() => {
  // 允许基本面、盈亏比、周线、换手率未满足，但策略不能是DO_NOT_BUY/PASS
  if (isStrategyBlocked.value) return false;
  return form.value.decisionReason.trim().length > 0;
});

function validate(): boolean {
  errors.value = {};

  // 换手率区间检查
  const rate = form.value.turnoverRate;
  if (rate != null) {
    if (rate <= 1) {
      errors.value.turnoverRate = '换手率 ≤ 1% 流动性过低';
      return false;
    }
    if (rate > 15 && (!form.value.turnoverConfirm || !form.value.turnoverDirection)) {
      errors.value.turnoverRate = '换手率 > 15%，请确认资金方向';
      return false;
    }
  }

  const payload: BuyStockInput = {
    status: 'holding',
    marketTag: form.value.marketTag,
    name: form.value.name.trim(),
    buyQuantity: form.value.buyQuantity || undefined,
    triggerPrice: Number(form.value.triggerPrice || 0),
    buyPrice: Number(form.value.buyPrice),
    buyDate: form.value.buyDate,
    buyReason: strategySummary.value,
    emotionTag: form.value.emotionTag,
    revenueGrowthOk: form.value.revenueGrowthOk,
    deductedNetProfitGrowthOk: form.value.deductedNetProfitGrowthOk,
    grossMarginChangeOk: form.value.grossMarginChangeOk,
    roicOk: form.value.roicOk,
    operatingCashFlowPositiveOk: form.value.operatingCashFlowPositiveOk,
    riskRewardOk: riskRewardOk.value,
    turnoverRate: form.value.turnoverRate,
    turnoverDirection: form.value.turnoverDirection,
    weeklyCloseAboveEma20Ok: form.value.weeklyCloseAboveEma20Ok,
    marketBackground: form.value.marketBackground,
    tradingScenario: form.value.tradingScenario,
    entryTrigger: form.value.entryTrigger,
    volumePriceConfirmed: form.value.volumePriceConfirmed,
    strategyDecision: strategyOutput.value.decision,
    entryType: strategyOutput.value.entryType,
    strategyNote: strategyOutput.value.note,
    stopLossPrice: Number(form.value.stopLossPrice || 0),
    targetPrice: Number(form.value.targetPrice || 0),
    takeProfitPrice: Number(form.value.targetPrice || 0),
    reviewDecision: sopPassed.value ? 'approved' : 'rejected',
    decisionReason: form.value.decisionReason.trim(),
  };

  const result = BuyStockSchema.safeParse(payload);
  if (!result.success) {
    result.error.issues.forEach(err => {
      const key = err.path[0] as string;
      errors.value[key] = err.message;
    });
    return false;
  }
  return true;
}

function handleSubmit(force = false) {
  if (force && isStrategyBlocked.value) return;
  if (!force && !sopPassed.value) {
    if (!canForceSubmit.value) return;
  }
  if (!validate()) return;
  emit('submit', {
    ...form.value,
    name: form.value.name.trim(),
    buyReason: strategySummary.value,
    decisionReason: form.value.decisionReason.trim(),
    strategyDecision: strategyOutput.value.decision,
    entryType: strategyOutput.value.entryType,
    strategyNote: strategyOutput.value.note,
    riskRewardOk: riskRewardOk.value,
    reviewDecision: sopPassed.value ? 'approved' : 'rejected',
    buyPrice: Number(form.value.buyPrice),
    buyQuantity: form.value.buyQuantity ? Number(form.value.buyQuantity) : undefined,
    triggerPrice: Number(form.value.triggerPrice || 0),
    stopLossPrice: Number(form.value.stopLossPrice || 0),
    targetPrice: Number(form.value.targetPrice || 0),
    takeProfitPrice: Number(form.value.targetPrice || 0),
    turnoverRate: form.value.turnoverRate,
    turnoverDirection: form.value.turnoverDirection,
  } as unknown as BuyStockInput);
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
              <!-- 基础信息 -->
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

              <!-- 系统预设检查项 -->
              <section class="rounded-2xl border border-slate-200 bg-white p-4">
                <div class="mb-4 text-sm font-semibold text-slate-900">系统预设检查项</div>
                <div class="grid gap-3 md:grid-cols-4">
                  <label class="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 cursor-pointer">
                    <input v-model="form.revenueGrowthOk" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    <span class="text-sm text-slate-700">营业总收入同比 ≥ 15%</span>
                  </label>
                  <label class="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 cursor-pointer">
                    <input v-model="form.deductedNetProfitGrowthOk" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    <span class="text-sm text-slate-700">扣非净利润同比 ≥ 15%</span>
                  </label>
                  <label class="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 cursor-pointer">
                    <input v-model="form.grossMarginChangeOk" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    <span class="text-sm text-slate-700">毛利率同比 ≥ -3个百分点</span>
                  </label>
                  <label class="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 cursor-pointer">
                    <input v-model="form.roicOk" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    <span class="text-sm text-slate-700">ROIC（TTM）≥ 8%</span>
                  </label>
                  <label class="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 cursor-pointer">
                    <input v-model="form.operatingCashFlowPositiveOk" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    <span class="text-sm text-slate-700">经营现金流 &gt; 0</span>
                  </label>
                  <label class="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 cursor-pointer">
                    <input v-model="form.weeklyCloseAboveEma20Ok" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                    <span class="text-sm text-slate-700">周线收盘 &gt; EMA20（上涨环境要求）</span>
                  </label>
                  <!-- 换手率 -->
                  <div class="md:col-span-2 rounded-2xl border border-slate-200">
                    <div class="flex flex-col gap-2 px-4 py-3">
                      <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
                        <span class="text-sm text-slate-700 font-medium">换手率</span>
                        <span v-if="showTurnoverWarning" class="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
                          ⚠ &gt;15% 异常放量
                        </span>
                      </div>
                      <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
                        <input v-model.number="form.turnoverRate" type="number" step="0.1" min="0" placeholder="%" class="input-field w-28 number-font" :class="{ 'border-red-400 bg-red-50': errors.turnoverRate }" />
                        <span class="text-xs text-slate-400">%</span>
                        <template v-if="showTurnoverWarning">
                          <select v-model="form.turnoverDirection" aria-label="资金方向" class="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none">
                            <option value="">资金方向...</option>
                            <option value="net_inflow">净流入（放量启动）</option>
                            <option value="net_outflow">净流出（出货风险）</option>
                          </select>
                          <label class="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer shrink-0">
                            <input v-model="form.turnoverConfirm" type="checkbox" class="h-3.5 w-3.5 rounded border-slate-300 text-blue-600" />
                            已确认
                          </label>
                        </template>
                      </div>
                      <p v-if="errors.turnoverRate" class="text-xs text-red-600">{{ errors.turnoverRate }}</p>
                      <p v-else class="text-xs text-slate-400">≤ 1% 流动性过低；1%-15% 正常；> 15% 需确认资金方向</p>
                    </div>
                  </div>
                </div>
              </section>

              <!-- 交易策略 -->
              <BuyStrategyPanel
                v-model:market-background="form.marketBackground"
                v-model:trading-scenario="form.tradingScenario"
                v-model:entry-trigger="form.entryTrigger"
                v-model:volume-price-confirmed="form.volumePriceConfirmed"
                v-model:entry-type="form.entryType"
              />

              <!-- 计划与备注 -->
              <section class="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div class="mb-4 flex items-center justify-between gap-3">
                  <div class="text-sm font-semibold text-slate-900">计划与备注</div>
                  <span class="badge" :class="sopPassed ? 'badge-success' : 'badge-cta'">
                    {{ sopPassed ? '全部通过' : '存在未通过项' }}
                  </span>
                </div>
                <div class="grid gap-4 md:grid-cols-4">
                  <label class="text-sm text-slate-700 md:col-span-4">
                    备注原因
                    <textarea v-model="form.decisionReason" rows="3" placeholder="检查项未通过时填写原因；也可记录买入理由" class="input-field mt-2 resize-none" :class="{ 'border-red-400 bg-red-50': errors.decisionReason }"></textarea>
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
                  <div class="flex items-center rounded-lg border px-4 py-3 md:col-span-1" :class="riskRewardOk ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'">
                    <div>
                      <div class="text-xs">系统计算盈亏比</div>
                      <div class="mt-1 text-sm font-bold number-font">{{ riskRewardRatio == null ? '请填写有效三价' : `1 : ${riskRewardRatio.toFixed(2)}` }}</div>
                      <div class="mt-1 text-xs">要求 ≥ 1 : 2</div>
                    </div>
                  </div>
                  <div class="flex items-center justify-between rounded-lg border px-4 py-3 md:col-span-4" :class="finalTradeDecision.tone">
                    <span class="text-sm font-semibold">最终结论</span>
                    <strong class="text-sm">{{ finalTradeDecision.label }}</strong>
                  </div>
                </div>
              </section>

              <!-- 策略决策结果 -->
              <div v-if="isStrategyBlocked" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                ⛔ 策略决策为「{{ DECISION_LABELS[strategyOutput.decision] }}」——当前组合无法买入。
              </div>
            </div>

            <!-- Footer -->
            <div class="shrink-0 border-t border-slate-100 bg-white/95 px-6 py-4 backdrop-blur">
              <div class="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  :disabled="loading || isStrategyBlocked || !form.decisionReason.trim()"
                  class="btn-secondary"
                  @click="handleSubmit(true)"
                >
                  {{ loading ? '保存中...' : '强制提交' }}
                </button>
                <button
                  type="button"
                  :disabled="loading || !sopPassed"
                  class="btn-primary"
                  @click="handleSubmit(false)"
                >
                  {{ loading ? '保存中...' : '确认检查并买入' }}
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
