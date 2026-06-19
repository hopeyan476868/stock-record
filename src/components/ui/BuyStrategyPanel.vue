<script setup lang="ts">
import { computed, watch } from 'vue';
import {
  DECISION_LABELS,
  ENTRY_TYPE_LABELS,
  MARKET_STRUCTURE_OPTIONS,
  PRICE_LOCATION_OPTIONS,
  RISK_STATE_OPTIONS,
  TREND_QUALITY_OPTIONS,
  evaluateBuyStrategy,
  type MarketStructure,
  type PriceLocation,
  type RiskState,
  type TrendQuality,
} from '@/utils/buyStrategyEngine';

const props = defineProps<{ marketStructure?: MarketStructure; trendQuality?: TrendQuality; priceLocation?: PriceLocation; riskState?: RiskState }>();
const emit = defineEmits<{
  'update:marketStructure': [value: MarketStructure];
  'update:trendQuality': [value: TrendQuality];
  'update:priceLocation': [value: PriceLocation];
  'update:riskState': [value: RiskState];
}>();

const structure = computed({ get: () => props.marketStructure || 'UP', set: (value) => emit('update:marketStructure', value) });
const quality = computed({ get: () => props.trendQuality || 'STRONG', set: (value) => emit('update:trendQuality', value) });
const location = computed({ get: () => props.priceLocation || 'TREND_PULLBACK', set: (value) => emit('update:priceLocation', value) });
const risk = computed({ get: () => props.riskState || 'NONE', set: (value) => emit('update:riskState', value) });
const strategy = computed(() => evaluateBuyStrategy({ marketStructure: structure.value, trendQuality: quality.value, priceLocation: location.value, riskState: risk.value }));
const decisionTone = computed(() => ({ BUY: 'border-emerald-300 bg-emerald-50 text-emerald-800', WATCH: 'border-amber-300 bg-amber-50 text-amber-800', DO_NOT_BUY: 'border-red-300 bg-red-50 text-red-800', PASS: 'border-slate-300 bg-slate-100 text-slate-700' })[strategy.value.decision]);

watch(structure, (value) => {
  if (value === 'DOWN' || value === 'UNCLEAR') {
    quality.value = 'NONE';
    location.value = 'NO_EDGE';
  } else if (value === 'RANGE') {
    quality.value = 'NONE';
    if (!['RANGE_EDGE', 'NO_EDGE'].includes(location.value)) location.value = 'RANGE_EDGE';
  } else if (value === 'UP') {
    if (quality.value === 'NONE') quality.value = 'STRONG';
    if (location.value === 'NO_EDGE' || location.value === 'RANGE_EDGE') location.value = 'TREND_PULLBACK';
  }
});
</script>

<template>
  <section class="rounded-lg border border-slate-200 bg-white p-4">
    <div class="mb-4">
      <h4 class="text-sm font-semibold text-slate-900">买入记录策略</h4>
      <p class="mt-1 text-xs text-slate-500">四个单选输入，系统自动给出买入决策。</p>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <label class="text-sm text-slate-700">市场结构
        <select v-model="structure" class="input-field mt-2"><option v-for="item in MARKET_STRUCTURE_OPTIONS" :key="item.value" :value="item.value">{{ item.label }}</option></select>
      </label>
      <label class="text-sm text-slate-700">趋势质量
        <select v-model="quality" class="input-field mt-2" :disabled="structure !== 'UP'"><option v-for="item in TREND_QUALITY_OPTIONS" :key="item.value" :value="item.value">{{ item.label }}</option></select>
      </label>
      <label class="text-sm text-slate-700">价格位置
        <select v-model="location" class="input-field mt-2" :disabled="structure === 'DOWN' || structure === 'UNCLEAR'"><option v-for="item in PRICE_LOCATION_OPTIONS" :key="item.value" :value="item.value">{{ item.label }}</option></select>
      </label>
      <label class="text-sm text-slate-700">风险状态
        <select v-model="risk" class="input-field mt-2"><option v-for="item in RISK_STATE_OPTIONS" :key="item.value" :value="item.value">{{ item.label }}</option></select>
      </label>
    </div>

    <div class="mt-4 rounded-lg border p-4" :class="decisionTone">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <strong class="text-sm">交易结论：{{ DECISION_LABELS[strategy.decision] }}</strong>
        <span class="text-xs font-semibold">买入类型：{{ strategy.entryTypes.map((item) => ENTRY_TYPE_LABELS[item]).join(' / ') }}</span>
      </div>
      <p class="mt-2 text-xs leading-5">{{ strategy.note }}</p>
    </div>

    <details class="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <summary class="cursor-pointer text-sm font-semibold text-slate-800">字段判断说明</summary>
      <div class="mt-3 grid gap-2 text-xs leading-5 text-slate-600 md:grid-cols-2">
        <p><strong>市场结构：</strong>看最近 2～3 个波段。</p>
        <p><strong>趋势质量：</strong>看当前主动腿和当前回调。</p>
        <p><strong>价格位置：</strong>看当前 K 线相对突破位、回踩位、均线、区间边界的位置。</p>
        <p><strong>风险状态：</strong>看当前 3～10 根 K 线是否过热、分歧或破坏。</p>
        <p><strong>强趋势：</strong>突破有跟随，回调浅且快，空头打不穿关键均线/结构位，通常可考虑 H1。</p>
        <p><strong>普通趋势：</strong>阴阳交错、回调更深、常回踩 EMA21；禁止 H1，只等 H2 或回踩确认。</p>
        <p><strong>无趋势：</strong>弱上升、震荡、均线缠绕均归入无趋势，只看区间边界。</p>
        <p><strong>过热：</strong>远离 EMA21、短期涨幅过快、连续大阳；禁止追，H1 降级。</p>
        <p><strong>分歧：</strong>放量长上影、突破无跟随、爆量不涨，一般不买。</p>
        <p><strong>破坏：</strong>跌回平台、跌破 EMA21 或关键 higher low，不买。</p>
      </div>
    </details>
  </section>
</template>
