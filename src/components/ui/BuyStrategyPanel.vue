<script setup lang="ts">
import { computed, watch } from 'vue';
import StrategyInfoPopover from '@/components/ui/StrategyInfoPopover.vue';
import { CURRENT_STRUCTURE_OPTIONS, DECISION_LABELS, ENTRY_TYPE_LABELS, MARKET_BACKGROUND_OPTIONS, RISK_STATE_OPTIONS, evaluateBuyStrategy, type CurrentStructure, type EntryType, type MarketBackground, type RiskState } from '@/utils/buyStrategyEngine';

const props = defineProps<{ marketBackground?: MarketBackground; currentStructure?: CurrentStructure; riskState?: RiskState; entryType?: EntryType }>();
const emit = defineEmits<{ 'update:marketBackground': [value: MarketBackground]; 'update:currentStructure': [value: CurrentStructure]; 'update:riskState': [value: RiskState]; 'update:entryType': [value: EntryType] }>();
const background = computed({ get: () => props.marketBackground || 'STRONG_UP', set: (value) => emit('update:marketBackground', value) });
const structure = computed({ get: () => props.currentStructure || 'SHALLOW_PULLBACK', set: (value) => emit('update:currentStructure', value) });
const risk = computed({ get: () => props.riskState || 'NONE', set: (value) => emit('update:riskState', value) });
const entry = computed({ get: () => props.entryType || 'H1', set: (value) => emit('update:entryType', value) });
const structureOptions = computed(() => CURRENT_STRUCTURE_OPTIONS[background.value]);
const strategy = computed(() => evaluateBuyStrategy({ marketBackground: background.value, currentStructure: structure.value, riskState: risk.value, entryType: entry.value }));
const decisionTone = computed(() => ({ BUY: 'border-emerald-300 bg-emerald-50 text-emerald-800', WATCH: 'border-amber-300 bg-amber-50 text-amber-800', DO_NOT_BUY: 'border-red-300 bg-red-50 text-red-800', PASS: 'border-slate-300 bg-slate-100 text-slate-700' })[strategy.value.decision]);
watch(background, () => { if (!structureOptions.value.some((item) => item.value === structure.value)) structure.value = structureOptions.value[0].value; });
watch([background, structure, risk], () => { if (!strategy.value.entryOptions.includes(entry.value)) entry.value = strategy.value.entryOptions[0]; }, { immediate: true });
</script>

<template>
  <section class="rounded-lg border border-slate-200 bg-white p-4">
    <div class="mb-4"><h4 class="text-sm font-semibold text-slate-900">交易策略</h4><p class="mt-1 text-xs text-slate-500">四级联动：背景 + 当前结构 + 风险状态 + 买入位</p></div>
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <div class="flex items-center gap-1.5 text-sm text-slate-700">背景
          <StrategyInfoPopover title="背景：60～120 根 K 线的大结构">
            <p class="mb-2">看最近 2～3 个主要波段，不要被最近几根 K 线扰乱。</p>
            <p><b>强势上升：</b>HH + HL 清晰，EMA21/EMA50 向上；回调多为 1～3 根且不轻易跌破 EMA21，突破后有跟随。</p>
            <p class="mt-2"><b>普通上升：</b>仍有 HH + HL，但回调常为 3～8 根，经常触及 EMA21，第一根反弹容易失败。</p>
            <p class="mt-2"><b>区间：</b>有明确上沿和下沿，价格反复触碰边界，EMA21 走平或缠绕。</p>
            <p class="mt-2"><b>下降：</b>LH + LL，EMA21/EMA50 向下，反弹受压，原支撑变压力。</p>
            <p class="mt-2"><b>结构不清晰：</b>无趋势、无清晰箱体、支撑压力不明确，K 线重叠混乱。</p>
          </StrategyInfoPopover>
        </div>
        <select v-model="background" aria-label="背景" class="input-field mt-2"><option v-for="item in MARKET_BACKGROUND_OPTIONS" :key="item.value" :value="item.value">{{ item.label }}</option></select>
      </div>
      <div>
        <div class="flex items-center gap-1.5 text-sm text-slate-700">当前结构
          <StrategyInfoPopover title="当前结构：最近一段的交易形态">
            <p>只描述当前局部结构，不改变 60～120 根 K 线的大背景。</p>
            <p class="mt-2"><b>回调类：</b>浅回调、EMA21 回踩、窄上升通道。</p><p class="mt-2"><b>整理类：</b>水平平台、三角收敛、杯柄整理。</p>
            <p class="mt-2"><b>区间类：</b>区间底部、中部、顶部。</p><p class="mt-2"><b>下降例外：</b>必须先反转突破，再回踩确认。</p>
          </StrategyInfoPopover>
        </div>
        <select v-model="structure" aria-label="当前结构" class="input-field mt-2"><option v-for="item in structureOptions" :key="item.value" :value="item.value">{{ item.label }}</option></select>
      </div>
      <div>
        <div class="flex items-center gap-1.5 text-sm text-slate-700">风险状态
          <StrategyInfoPopover title="风险状态：最近 3～10 根 K 线">
            <p><b>优先级：</b>买点失效 &gt; 分歧 &gt; 过热 &gt; 无明显风险。</p>
            <p class="mt-2"><b>无明显风险：</b>未远离均线，无长上影、突破失败或关键位跌破。</p>
            <p class="mt-2"><b>过热：</b>5～10 根涨幅过大、连续 2～3 根大阳、远离 EMA21。</p>
            <p class="mt-2"><b>分歧：</b>高位震荡、长上影、放量滞涨或突破无跟随。</p>
            <p class="mt-2"><b>买点失效：</b>跌破突破位、信号 K 低点、小区间下沿或通道下轨。买点失效不等于背景已经反转。</p>
          </StrategyInfoPopover>
        </div>
        <select v-model="risk" aria-label="风险状态" class="input-field mt-2"><option v-for="item in RISK_STATE_OPTIONS" :key="item.value" :value="item.value">{{ item.label }}</option></select>
      </div>
      <div>
        <div class="flex items-center gap-1.5 text-sm text-slate-700">买入位
          <StrategyInfoPopover title="买入位：系统允许的触发方式">
            <p>买入位由前三项自动筛选。没有买点时只能选择“无买点”。</p>
            <p class="mt-2"><b>H1/H2：</b>当前回调第一次、第二次反转信号。</p><p class="mt-2"><b>突破类：</b>平台、三角、杯柄或区间边界有效突破。</p>
            <p class="mt-2"><b>回踩类：</b>突破后回踩原压力位不破，再出现转强信号。</p><p class="mt-2"><b>底部类：</b>双底确认或假跌破后重新收回区间。</p>
          </StrategyInfoPopover>
        </div>
        <select v-model="entry" aria-label="买入位" class="input-field mt-2"><option v-for="item in strategy.entryOptions" :key="item" :value="item">{{ ENTRY_TYPE_LABELS[item] }}</option></select>
      </div>
    </div>
    <div class="mt-4 rounded-lg border p-4" :class="decisionTone">
      <div class="flex flex-wrap items-center justify-between gap-2"><strong class="text-sm">最终决策：{{ DECISION_LABELS[strategy.decision] }}</strong><span class="text-xs font-semibold">买入位：{{ ENTRY_TYPE_LABELS[entry] }}</span></div>
      <p class="mt-2 text-xs leading-5">{{ strategy.note }}</p>
    </div>
  </section>
</template>
