<script setup lang="ts">
import { computed, watch } from 'vue';
import StrategyInfoPopover from '@/components/ui/StrategyInfoPopover.vue';
import {
  MARKET_BACKGROUND_OPTIONS, DECISION_LABELS, ENTRY_TYPE_LABELS, RISK_HINT_LABELS,
  getPositionPhases, getConcretePatterns, evaluateBuyStrategy,
  MARKET_BACKGROUND_LABELS, POSITION_PHASE_LABELS, CONCRETE_PATTERN_LABELS,
  type MarketBackground, type PositionPhase, type ConcretePattern,
} from '@/utils/buyStrategyEngine';

const props = defineProps<{
  marketBackground?: MarketBackground;
  positionPhase?: PositionPhase;
  concretePattern?: ConcretePattern;
}>();

const emit = defineEmits<{
  'update:marketBackground': [value: MarketBackground];
  'update:positionPhase': [value: PositionPhase];
  'update:concretePattern': [value: ConcretePattern];
}>();

const bg = computed({
  get: () => props.marketBackground || 'BULL_TREND',
  set: (v: MarketBackground) => emit('update:marketBackground', v),
});
const phase = computed({
  get: () => props.positionPhase || 'PULLBACK',
  set: (v: PositionPhase) => emit('update:positionPhase', v),
});
const pattern = computed({
  get: () => props.concretePattern || 'SHALLOW_PULLBACK',
  set: (v: ConcretePattern) => emit('update:concretePattern', v),
});

const phaseOptions = computed(() => getPositionPhases(bg.value));
const patternOptions = computed(() => getConcretePatterns(phase.value));
const strategy = computed(() => evaluateBuyStrategy({
  marketBackground: bg.value,
  positionPhase: phase.value,
  concretePattern: pattern.value,
}));

const decisionTone = computed(() => ({
  BUY: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  WATCH: 'border-amber-300 bg-amber-50 text-amber-800',
  DO_NOT_BUY: 'border-red-300 bg-red-50 text-red-800',
  PASS: 'border-slate-300 bg-slate-100 text-slate-700',
}[strategy.value.decision]));

const riskTone = computed(() => ({
  none: 'bg-emerald-100 text-emerald-700',
  overheating: 'bg-red-100 text-red-700',
  divergence: 'bg-amber-100 text-amber-700',
  invalidated: 'bg-red-100 text-red-700',
}[strategy.value.riskHint]));

// Reset phase when bg changes if current phase invalid
watch(bg, () => {
  const valid = phaseOptions.value.some(o => o.value === phase.value);
  if (!valid) phase.value = phaseOptions.value[0]?.value || 'PULLBACK';
});

// Reset pattern when phase changes if current pattern invalid
watch(phase, () => {
  const opts = patternOptions.value;
  if (opts.length === 0) {
    pattern.value = 'NONE';
  } else if (!opts.some(o => o.value === pattern.value)) {
    pattern.value = opts[0]?.value || 'NONE';
  }
});

// When pattern changes, auto-select entry type from strategy
watch(pattern, () => {
  // Entry type is already derived by strategy — no user action needed
}, { immediate: true });
</script>

<template>
  <section class="rounded-2xl border border-slate-200 bg-white p-4">
    <div class="mb-4 flex items-center justify-between">
      <div>
        <h4 class="text-sm font-semibold text-slate-900">交易策略（价格行为）</h4>
        <p class="mt-1 text-xs text-slate-500">市场背景 → 形态位置 → 具体形态，三级联动</p>
      </div>
      <span v-if="strategy.riskHint !== 'none'" class="rounded-full px-3 py-1 text-xs font-bold" :class="riskTone">
        {{ RISK_HINT_LABELS[strategy.riskHint] }}
      </span>
    </div>

    <div class="grid gap-4 sm:grid-cols-3">
      <!-- Level 1: 背景 -->
      <div>
        <div class="flex items-center gap-1.5 text-sm text-slate-700">
          ① 市场背景
          <StrategyInfoPopover title="市场背景：60～120 根 K 线的大结构">
            <p><b>上涨趋势：</b>HH + HL 清晰，回调不破前低，驱动方向向上。</p>
            <p class="mt-2"><b>下降趋势：</b>LH + LL，反弹不破前高，驱动方向向下。</p>
            <p class="mt-2"><b>区间震荡：</b>有清晰上下沿，价格在边界之间摆动，无趋势方向。</p>
          </StrategyInfoPopover>
        </div>
        <select v-model="bg" aria-label="市场背景" class="input-field mt-2">
          <option v-for="item in MARKET_BACKGROUND_OPTIONS" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </div>

      <!-- Level 2: 形态位置 -->
      <div>
        <div class="flex items-center gap-1.5 text-sm text-slate-700">
          ② 形态位置
          <StrategyInfoPopover title="形态位置：价格在背景中的阶段">
            <p class="mb-2">不同背景有不同可选的位置。</p>
            <p class="mt-2"><b>上涨趋势：</b>回调中（歇脚）/ 中继整理（横盘）/ 高位加速（过热）</p>
            <p class="mt-2"><b>下降趋势：</b>反弹中（不买）/ 反转试探（唯一例外）</p>
            <p class="mt-2"><b>区间震荡：</b>下沿 / 中部 / 上沿 / 区间内整理</p>
          </StrategyInfoPopover>
        </div>
        <select v-model="phase" aria-label="形态位置" class="input-field mt-2">
          <option v-for="item in phaseOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </div>

      <!-- Level 3: 具体形态 -->
      <div>
        <div class="flex items-center gap-1.5 text-sm text-slate-700">
          ③ 具体形态
          <StrategyInfoPopover title="具体形态：K 线级别的结构">
            <p>只有当前位置下的合法形态才会显示。</p>
          </StrategyInfoPopover>
        </div>
        <select v-model="pattern" aria-label="具体形态" class="input-field mt-2" :disabled="patternOptions.length === 0">
          <option v-if="patternOptions.length === 0" value="NONE">无合适形态（系统建议等待）</option>
          <option v-for="item in patternOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </div>
    </div>

    <!-- Result -->
    <div class="mt-4 rounded-lg border p-4" :class="decisionTone">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <strong class="text-sm">最终决策：{{ DECISION_LABELS[strategy.decision] }}</strong>
          <span v-if="strategy.decision !== 'PASS' && strategy.entryType !== 'NONE'" class="text-xs">
            入场方式：{{ ENTRY_TYPE_LABELS[strategy.entryType] }}
          </span>
        </div>
        <span class="text-xs font-semibold">
          {{ MARKET_BACKGROUND_LABELS[bg] }} → {{ POSITION_PHASE_LABELS[phase] }} → {{ CONCRETE_PATTERN_LABELS[pattern] }}
        </span>
      </div>
      <p class="mt-2 text-xs leading-5">{{ strategy.note }}</p>
    </div>
  </section>
</template>
