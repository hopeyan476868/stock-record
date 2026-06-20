export type MarketBackground = 'STRONG_UP' | 'NORMAL_UP' | 'RANGE' | 'DOWN' | 'UNCLEAR';
export type CurrentStructure =
  | 'SHALLOW_PULLBACK' | 'EMA21_PULLBACK' | 'HORIZONTAL_PLATFORM' | 'NARROW_UP_CHANNEL'
  | 'TRIANGLE_CONTRACTION' | 'CUP_HANDLE' | 'RANGE_BOTTOM' | 'RANGE_MIDDLE'
  | 'RANGE_TOP' | 'REVERSAL_BREAKOUT_PULLBACK' | 'NO_VALID_STRUCTURE';
export type RiskState = 'NONE' | 'OVERHEATED' | 'DIVERGENCE' | 'INVALIDATED';
export type StrategyDecision = 'BUY' | 'WATCH' | 'DO_NOT_BUY' | 'PASS';
export type EntryType =
  | 'H1' | 'H2' | 'PLATFORM_BREAKOUT' | 'BREAKOUT_PULLBACK' | 'CHANNEL_PULLBACK'
  | 'TRIANGLE_BREAKOUT' | 'CUP_HANDLE_BREAKOUT' | 'DOUBLE_BOTTOM_CONFIRMATION'
  | 'FAILED_BREAKDOWN_RECLAIM' | 'EFFECTIVE_BREAKOUT' | 'DIRECTIONAL_BREAKOUT'
  | 'REVERSAL_BREAKOUT_PULLBACK' | 'NONE';

export interface StrategyInput {
  marketBackground: MarketBackground;
  currentStructure: CurrentStructure;
  riskState: RiskState;
  entryType: EntryType;
}
export interface StrategyOutput {
  decision: StrategyDecision;
  entryOptions: EntryType[];
  note: string;
}

export const MARKET_BACKGROUND_OPTIONS: Array<{ value: MarketBackground; label: string }> = [
  { value: 'STRONG_UP', label: '强势上升' }, { value: 'NORMAL_UP', label: '普通上升' },
  { value: 'RANGE', label: '区间' }, { value: 'DOWN', label: '下降' }, { value: 'UNCLEAR', label: '结构不清晰' },
];
export const CURRENT_STRUCTURE_LABELS: Record<CurrentStructure, string> = {
  SHALLOW_PULLBACK: '浅回调', EMA21_PULLBACK: 'EMA21回踩', HORIZONTAL_PLATFORM: '水平平台整理',
  NARROW_UP_CHANNEL: '窄上升通道', TRIANGLE_CONTRACTION: '三角收敛', CUP_HANDLE: '杯柄整理',
  RANGE_BOTTOM: '区间底部', RANGE_MIDDLE: '区间中部', RANGE_TOP: '区间顶部',
  REVERSAL_BREAKOUT_PULLBACK: '反转突破后回踩', NO_VALID_STRUCTURE: '无合适结构',
};
const structures = (...values: CurrentStructure[]) => values.map((value) => ({ value, label: CURRENT_STRUCTURE_LABELS[value] }));
export const CURRENT_STRUCTURE_OPTIONS: Record<MarketBackground, Array<{ value: CurrentStructure; label: string }>> = {
  STRONG_UP: structures('SHALLOW_PULLBACK', 'EMA21_PULLBACK', 'HORIZONTAL_PLATFORM', 'NARROW_UP_CHANNEL', 'TRIANGLE_CONTRACTION', 'CUP_HANDLE', 'NO_VALID_STRUCTURE'),
  NORMAL_UP: structures('EMA21_PULLBACK', 'HORIZONTAL_PLATFORM', 'TRIANGLE_CONTRACTION', 'CUP_HANDLE', 'NO_VALID_STRUCTURE'),
  RANGE: structures('RANGE_BOTTOM', 'RANGE_MIDDLE', 'RANGE_TOP', 'HORIZONTAL_PLATFORM', 'TRIANGLE_CONTRACTION', 'NO_VALID_STRUCTURE'),
  DOWN: structures('REVERSAL_BREAKOUT_PULLBACK', 'NO_VALID_STRUCTURE'),
  UNCLEAR: structures('NO_VALID_STRUCTURE'),
};
export const RISK_STATE_OPTIONS: Array<{ value: RiskState; label: string }> = [
  { value: 'NONE', label: '无明显风险' }, { value: 'OVERHEATED', label: '过热' },
  { value: 'DIVERGENCE', label: '分歧' }, { value: 'INVALIDATED', label: '买点失效' },
];
export const DECISION_LABELS: Record<StrategyDecision, string> = { BUY: '可买', WATCH: '观察', DO_NOT_BUY: '不买', PASS: '放弃' };
export const ENTRY_TYPE_LABELS: Record<EntryType, string> = {
  H1: 'H1', H2: 'H2', PLATFORM_BREAKOUT: '平台突破', BREAKOUT_PULLBACK: '突破回踩',
  CHANNEL_PULLBACK: '通道回踩', TRIANGLE_BREAKOUT: '三角突破', CUP_HANDLE_BREAKOUT: '杯柄突破',
  DOUBLE_BOTTOM_CONFIRMATION: '双底确认', FAILED_BREAKDOWN_RECLAIM: '假跌破收回',
  EFFECTIVE_BREAKOUT: '有效突破', DIRECTIONAL_BREAKOUT: '方向突破',
  REVERSAL_BREAKOUT_PULLBACK: '反转突破回踩', NONE: '无买点',
};

const out = (decision: StrategyDecision, entryOptions: EntryType[], note: string): StrategyOutput => ({ decision, entryOptions, note });
const noBuy = (note: string) => out('DO_NOT_BUY', ['NONE'], note);
const watch = (entries: EntryType[], note: string) => out('WATCH', entries, note);

export function evaluateBuyStrategy(input: StrategyInput): StrategyOutput {
  const { marketBackground: bg, currentStructure: structure, riskState: risk } = input;
  if (bg === 'UNCLEAR') return out('PASS', ['NONE'], '结构不清晰，无法制定交易计划，直接放弃。');
  if (structure === 'NO_VALID_STRUCTURE') return bg === 'DOWN' ? out('PASS', ['NONE'], '下降背景且无反转结构，放弃。') : noBuy('当前没有合适结构，不买。');
  if (risk === 'INVALIDATED') return noBuy('原计划买点已失效，不买；买点失效不等于大背景已反转。');

  if (bg === 'STRONG_UP') {
    if (structure === 'SHALLOW_PULLBACK') {
      if (risk === 'NONE') return out('BUY', ['H1'], '强势上升浅回调，H1 可用。');
      if (risk === 'OVERHEATED') return watch(['H2'], '过热时 H1 降级，优先等 H2。');
      return watch(['NONE'], '浅回调出现分歧，先观察，不急于入场。');
    }
    if (structure === 'EMA21_PULLBACK') {
      if (risk === 'NONE') return out('BUY', ['H1', 'H2'], 'EMA21 回踩有支撑，可使用 H1/H2。');
      if (risk === 'OVERHEATED') return watch(['H2'], '等待过热消化，优先 H2。');
      return watch(['H2'], '存在分歧，只观察 H2 的二次确认。');
    }
    if (structure === 'HORIZONTAL_PLATFORM') {
      if (risk === 'NONE') return watch(['PLATFORM_BREAKOUT', 'BREAKOUT_PULLBACK'], '等平台突破或突破回踩。');
      if (risk === 'OVERHEATED') return watch(['BREAKOUT_PULLBACK'], '不追突破，等回踩。');
      return watch(['NONE'], '平台内分歧明显，观察不买。');
    }
    if (structure === 'NARROW_UP_CHANNEL') {
      if (risk === 'NONE') return out('BUY', ['CHANNEL_PULLBACK', 'H1'], '窄上升通道可在通道回踩寻找 H1。');
      if (risk === 'OVERHEATED') return watch(['CHANNEL_PULLBACK', 'H2'], '等通道回踩，优先 H2。');
      return watch(['NONE'], '通道中出现分歧，等待重新稳定。');
    }
    if (structure === 'TRIANGLE_CONTRACTION') return risk === 'NONE' ? watch(['TRIANGLE_BREAKOUT', 'BREAKOUT_PULLBACK'], '等三角突破或突破回踩。') : watch(['NONE'], '三角整理存在风险，只观察方向确认。');
    if (structure === 'CUP_HANDLE') return risk === 'NONE' ? watch(['CUP_HANDLE_BREAKOUT', 'BREAKOUT_PULLBACK'], '等杯柄突破或突破回踩。') : watch(['NONE'], '杯柄整理存在风险，先观察。');
  }

  if (bg === 'NORMAL_UP') {
    if (structure === 'EMA21_PULLBACK') {
      if (risk === 'NONE') return out('BUY', ['H2'], '普通上升禁止 H1，EMA21 回踩只做 H2。');
      if (risk === 'DIVERGENCE') return watch(['H2'], '存在分歧，只观察 H2 确认。');
      return watch(['NONE'], '普通上升过热，等待降温后再评估。');
    }
    if (structure === 'HORIZONTAL_PLATFORM') return risk === 'NONE' ? watch(['PLATFORM_BREAKOUT', 'BREAKOUT_PULLBACK'], '等平台突破或突破回踩。') : risk === 'OVERHEATED' ? watch(['BREAKOUT_PULLBACK'], '不追，等回踩。') : watch(['NONE'], '分歧状态先观察。');
    if (structure === 'TRIANGLE_CONTRACTION') return risk === 'NONE' ? watch(['TRIANGLE_BREAKOUT', 'BREAKOUT_PULLBACK'], '等三角突破或回踩确认。') : watch(['NONE'], '等待风险消化与方向确认。');
    if (structure === 'CUP_HANDLE') return risk === 'NONE' ? watch(['CUP_HANDLE_BREAKOUT', 'BREAKOUT_PULLBACK'], '等杯柄突破或回踩确认。') : watch(['NONE'], '等待风险消化。');
  }

  if (bg === 'RANGE') {
    if (structure === 'RANGE_BOTTOM') {
      if (risk === 'NONE') return watch(['DOUBLE_BOTTOM_CONFIRMATION', 'FAILED_BREAKDOWN_RECLAIM'], '区间底部等双底确认或假跌破收回。');
      if (risk === 'DIVERGENCE') return watch(['NONE'], '区间底部存在分歧，先观察。');
      return noBuy('区间底部过热反弹不追。');
    }
    if (structure === 'RANGE_MIDDLE') return noBuy('区间中部没有优势，不买。');
    if (structure === 'RANGE_TOP') {
      if (risk === 'NONE') return watch(['EFFECTIVE_BREAKOUT', 'BREAKOUT_PULLBACK'], '区间顶部不追，等有效突破或突破回踩。');
      if (risk === 'DIVERGENCE') return watch(['NONE'], '区间顶部存在分歧，只观察。');
      return noBuy('区间顶部过热，禁止追涨。');
    }
    if (structure === 'HORIZONTAL_PLATFORM') return watch(risk === 'NONE' ? ['DIRECTIONAL_BREAKOUT'] : ['NONE'], '等待平台方向突破。');
    if (structure === 'TRIANGLE_CONTRACTION') return watch(risk === 'NONE' ? ['DIRECTIONAL_BREAKOUT'] : ['NONE'], '等待三角方向确认。');
  }

  if (bg === 'DOWN') {
    if (structure !== 'REVERSAL_BREAKOUT_PULLBACK') return out('PASS', ['NONE'], '下降背景默认放弃。');
    if (risk === 'NONE') return watch(['REVERSAL_BREAKOUT_PULLBACK'], '下降背景唯一例外：观察反转突破后回踩确认。');
    return watch(['NONE'], '反转结构仍有风险，只观察，不急于买入。');
  }
  return noBuy('当前组合不合法，请重新检查。');
}

export interface LegacyStrategyFields {
  marketBackground?: MarketBackground; currentStructure?: CurrentStructure; entryType?: EntryType;
  marketStructure?: string; trendQuality?: string; priceLocation?: string;
  riskState?: RiskState | 'BROKEN'; entryTypes?: string[]; trendJudgment?: string; marketState?: string;
  buyStrategy?: string; technicalPattern?: string; patternRemark?: string; legacyTrigger?: string;
}
export function migrateLegacyStrategy(stock: LegacyStrategyFields): StrategyInput & { legacyTrigger?: string } {
  if (stock.marketBackground && stock.currentStructure && stock.riskState && stock.riskState !== 'BROKEN' && stock.entryType) return { marketBackground: stock.marketBackground, currentStructure: stock.currentStructure, riskState: stock.riskState, entryType: stock.entryType, legacyTrigger: stock.legacyTrigger };
  const oldBackground = stock.marketStructure || stock.trendJudgment || '';
  const oldState = stock.marketState || '';
  const oldPosition = `${stock.priceLocation || ''} ${stock.buyStrategy || ''} ${stock.technicalPattern || ''}`;
  const marketBackground: MarketBackground = oldBackground === 'DOWN' || oldBackground.includes('下降') ? 'DOWN' : oldBackground === 'RANGE' || oldBackground.includes('区间') || oldBackground.includes('震荡') ? 'RANGE' : oldBackground === 'UNCLEAR' ? 'UNCLEAR' : stock.trendQuality === 'NORMAL' || oldState.includes('普通') ? 'NORMAL_UP' : 'STRONG_UP';
  const firstStructure = CURRENT_STRUCTURE_OPTIONS[marketBackground][0].value;
  let currentStructure: CurrentStructure = firstStructure;
  if (oldPosition.includes('NO_EDGE') || oldPosition.includes('不买') || oldPosition.includes('无优势')) currentStructure = 'NO_VALID_STRUCTURE';
  else if (oldPosition.includes('EMA21') || oldPosition.includes('EMA20')) currentStructure = 'EMA21_PULLBACK';
  else if (oldPosition.includes('平台')) currentStructure = 'HORIZONTAL_PLATFORM';
  else if (oldPosition.includes('三角')) currentStructure = 'TRIANGLE_CONTRACTION';
  else if (oldPosition.includes('杯柄')) currentStructure = 'CUP_HANDLE';
  else if (oldPosition.includes('下沿') || oldPosition.includes('双底') || oldPosition.includes('假破')) currentStructure = 'RANGE_BOTTOM';
  else if (oldPosition.includes('中部')) currentStructure = 'RANGE_MIDDLE';
  else if (oldPosition.includes('上沿')) currentStructure = 'RANGE_TOP';
  else if (oldPosition.includes('PULLBACK') || oldPosition.includes('突破回踩')) currentStructure = marketBackground === 'DOWN' ? 'REVERSAL_BREAKOUT_PULLBACK' : 'HORIZONTAL_PLATFORM';
  if (!CURRENT_STRUCTURE_OPTIONS[marketBackground].some((item) => item.value === currentStructure)) currentStructure = firstStructure;
  let riskState: RiskState = 'NONE';
  if (stock.riskState === 'BROKEN' || oldState.includes('破位')) riskState = 'INVALIDATED';
  else if (stock.riskState) riskState = stock.riskState;
  else if (oldState.includes('高位加速')) riskState = 'OVERHEATED';
  const draft = { marketBackground, currentStructure, riskState, entryType: 'NONE' as EntryType };
  const strategy = evaluateBuyStrategy(draft);
  return { ...draft, entryType: strategy.entryOptions[0], legacyTrigger: stock.legacyTrigger || stock.patternRemark || stock.technicalPattern || stock.buyStrategy };
}
export function optionLabel<T extends string>(options: Array<{ value: T; label: string }>, value?: T): string { return options.find((item) => item.value === value)?.label || '未识别'; }
export function getStrategySummary(input: StrategyInput, strategy = evaluateBuyStrategy(input)): string {
  return `${optionLabel(MARKET_BACKGROUND_OPTIONS, input.marketBackground)} + ${CURRENT_STRUCTURE_LABELS[input.currentStructure]} + ${optionLabel(RISK_STATE_OPTIONS, input.riskState)} + ${ENTRY_TYPE_LABELS[input.entryType]} + ${DECISION_LABELS[strategy.decision]}`;
}
