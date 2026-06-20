<script setup lang="ts">
import { computed, watch } from 'vue';
import StrategyInfoPopover from '@/components/ui/StrategyInfoPopover.vue';
import {
  MARKET_BACKGROUND_OPTIONS,
  ENTRY_TRIGGER_LABELS,
  STRATEGY_CONCLUSION_LABELS,
  getTradingScenarios,
  getEntryTriggers,
  evaluateBuyStrategy,
  MARKET_BACKGROUND_LABELS,
  TRADING_SCENARIO_LABELS,
  SCENARIO_DESCRIPTIONS,
  type MarketBackground,
  type TradingScenario,
  type EntryTrigger,
} from '@/utils/buyStrategyEngine';

const props = defineProps<{
  marketBackground?: MarketBackground;
  tradingScenario?: TradingScenario;
  entryTrigger?: EntryTrigger;
  volumePriceConfirmed?: boolean;
  entryType?: string;
}>();

const emit = defineEmits<{
  'update:marketBackground': [value: MarketBackground];
  'update:tradingScenario': [value: TradingScenario];
  'update:entryTrigger': [value: EntryTrigger];
  'update:volumePriceConfirmed': [value: boolean];
  'update:entryType': [value: string];
}>();

const background = computed({
  get: () => props.marketBackground || 'STRONG_UP',
  set: (value: MarketBackground) => emit('update:marketBackground', value),
});
const scenario = computed({
  get: () => props.tradingScenario || 'SHALLOW_PULLBACK',
  set: (value: TradingScenario) => emit('update:tradingScenario', value),
});
const trigger = computed({
  get: () => props.entryTrigger || 'H1_CONFIRM',
  set: (value: EntryTrigger) => emit('update:entryTrigger', value),
});
const volumeConfirmed = computed({
  get: () => Boolean(props.volumePriceConfirmed),
  set: (value: boolean) => emit('update:volumePriceConfirmed', value),
});

const scenarioOptions = computed(() => getTradingScenarios(background.value));
const triggerOptions = computed(() => getEntryTriggers(scenario.value));
const strategy = computed(() => evaluateBuyStrategy({
  marketBackground: background.value,
  tradingScenario: scenario.value,
  entryTrigger: trigger.value,
  volumePriceConfirmed: volumeConfirmed.value,
}));
const scenarioDescription = computed(() => SCENARIO_DESCRIPTIONS[scenario.value]);
const decisionTone = computed(() => ({
  BUY: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  WATCH: 'border-amber-300 bg-amber-50 text-amber-800',
  DO_NOT_BUY: 'border-red-300 bg-red-50 text-red-800',
  PASS: 'border-slate-300 bg-slate-100 text-slate-700',
}[strategy.value.decision]));

watch(background, () => {
  const options = scenarioOptions.value;
  if (!options.some(item => item.value === scenario.value)) scenario.value = options[0].value;
  volumeConfirmed.value = false;
});
watch(scenario, () => {
  const options = triggerOptions.value;
  if (!options.some(item => item.value === trigger.value)) trigger.value = options[0].value;
  volumeConfirmed.value = false;
});
watch(trigger, () => {
  emit('update:entryType', trigger.value === 'NONE' ? '' : trigger.value);
  volumeConfirmed.value = false;
}, { immediate: true });
</script>

<template>
  <section class="rounded-2xl border border-slate-200 bg-white p-4">
    <div class="mb-4">
      <h4 class="text-sm font-semibold text-slate-900">交易策略（价格行为）</h4>
      <p class="mt-1 text-xs text-slate-500">市场环境 → 交易场景（形态＋位置）→ 入场触发 → 风控执行</p>
    </div>

    <div class="grid gap-4 md:grid-cols-3">
      <div>
        <div class="flex items-center gap-1.5 text-sm text-slate-700">
          ① 市场环境
          <StrategyInfoPopover title="市场环境：最近2～3个主要波段">
            <p><b>强势上涨：</b>HH/HL清晰，均线多头，回调浅。</p>
            <p class="mt-2"><b>普通上涨：</b>趋势仍向上，但回调加深、重叠增加。</p>
            <p class="mt-2"><b>震荡区间：</b>上下沿反复，没有持续方向。</p>
            <p class="mt-2"><b>下降趋势：</b>LH/LL清晰；只保留三推衰竭和突破前LH后的首次回调。</p>
            <p class="mt-2"><b>结构不清：</b>没有趋势、清晰区间或可执行计划，直接放弃。</p>
          </StrategyInfoPopover>
        </div>
        <select v-model="background" aria-label="市场环境" class="input-field mt-2">
          <option v-for="item in MARKET_BACKGROUND_OPTIONS" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </div>

      <div>
        <div class="flex items-center gap-1.5 text-sm text-slate-700">
          ② 交易场景
          <StrategyInfoPopover title="交易场景：形态＋关键位置">
            <p>场景回答“什么形态正在什么位置形成”，不再把位置和形态拆成两个容易重叠的字段。</p>
            <p class="mt-2">例如：区间下沿的双底、下降趋势三推衰竭＋大级别支撑。</p>
          </StrategyInfoPopover>
        </div>
        <select v-model="scenario" aria-label="交易场景" class="input-field mt-2">
          <option v-for="item in scenarioOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
        <p class="mt-1.5 text-xs leading-4 text-slate-500">{{ scenarioDescription }}</p>
      </div>

      <div>
        <div class="flex items-center gap-1.5 text-sm text-slate-700">
          ③ 入场触发
          <StrategyInfoPopover title="入场触发：明确的下单事件">
            <p><b>H1/H2确认：</b>突破对应信号K高点。</p>
            <p class="mt-2"><b>反包K高点突破：</b>下沿出现强阳反包后，突破反包K高点。</p>
            <p class="mt-2"><b>放量突破：</b>收盘突破关键位，量达到20日均量150%。</p>
            <p class="mt-2"><b>回踩确认转强：</b>缩量回踩不破，再突破止跌K高点。</p>
            <p class="mt-2"><b>假跌破收回确认：</b>收回下沿后突破收回K高点。</p>
            <p class="mt-2"><b>双底局部颈线突破：</b>右底形成后，突破两个底之间的局部反弹高点；不是区间上沿。</p>
          </StrategyInfoPopover>
        </div>
        <select v-model="trigger" aria-label="入场触发" class="input-field mt-2" :disabled="triggerOptions[0]?.value === 'NONE'">
          <option v-for="item in triggerOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </div>
    </div>

    <label v-if="trigger !== 'NONE'" class="mt-4 flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
      <input v-model="volumeConfirmed" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
      <span class="text-sm text-slate-700">量价条件已确认：{{ strategy.volumeGuide }}</span>
    </label>

    <div class="mt-4 rounded-lg border p-4" :class="decisionTone">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <strong class="text-sm">策略结论：{{ STRATEGY_CONCLUSION_LABELS[strategy.decision] }}</strong>
        <span class="text-xs font-semibold">
          {{ MARKET_BACKGROUND_LABELS[background] }} → {{ TRADING_SCENARIO_LABELS[scenario] }} → {{ ENTRY_TRIGGER_LABELS[trigger] }}
        </span>
      </div>
      <p class="mt-2 text-xs leading-5">{{ strategy.note }}</p>
      <div v-if="trigger !== 'NONE'" class="mt-3 grid gap-2 border-t border-current/15 pt-3 text-xs sm:grid-cols-2">
        <span><b>止损参考：</b>{{ strategy.stopLossGuide }}</span>
        <span><b>目标参考：</b>{{ strategy.targetGuide }}</span>
      </div>
    </div>
  </section>
</template>
