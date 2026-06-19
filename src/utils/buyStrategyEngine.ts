export type MarketStructure = 'UP' | 'RANGE' | 'DOWN' | 'UNCLEAR';
export type TrendQuality = 'STRONG' | 'NORMAL' | 'NONE';
export type PriceLocation = 'BREAKOUT' | 'PULLBACK' | 'TREND_PULLBACK' | 'RANGE_EDGE' | 'NO_EDGE';
export type RiskState = 'NONE' | 'OVERHEATED' | 'DIVERGENCE' | 'BROKEN';
export type StrategyDecision = 'BUY' | 'WATCH' | 'DO_NOT_BUY' | 'PASS';
export type EntryType = 'H1' | 'H2' | 'BREAKOUT' | 'PULLBACK_CONFIRMATION' | 'DOUBLE_BOTTOM' | 'FAILED_BREAKDOWN_RECLAIM' | 'NONE';

export interface StrategyInput { marketStructure: MarketStructure; trendQuality: TrendQuality; priceLocation: PriceLocation; riskState: RiskState }
export interface StrategyOutput { decision: StrategyDecision; entryTypes: EntryType[]; note: string }

export const MARKET_STRUCTURE_OPTIONS: Array<{ value: MarketStructure; label: string }> = [
  { value: 'UP', label: '上涨结构' }, { value: 'RANGE', label: '箱体结构' },
  { value: 'DOWN', label: '下降结构' }, { value: 'UNCLEAR', label: '结构不清' },
];
export const TREND_QUALITY_OPTIONS: Array<{ value: TrendQuality; label: string }> = [
  { value: 'STRONG', label: '强' }, { value: 'NORMAL', label: '普通' }, { value: 'NONE', label: '无' },
];
export const PRICE_LOCATION_OPTIONS: Array<{ value: PriceLocation; label: string }> = [
  { value: 'BREAKOUT', label: '突破位' }, { value: 'PULLBACK', label: '回踩位' },
  { value: 'TREND_PULLBACK', label: '趋势回调位' }, { value: 'RANGE_EDGE', label: '区间边界' },
  { value: 'NO_EDGE', label: '无优势位' },
];
export const RISK_STATE_OPTIONS: Array<{ value: RiskState; label: string }> = [
  { value: 'NONE', label: '无明显风险' }, { value: 'OVERHEATED', label: '过热' },
  { value: 'DIVERGENCE', label: '分歧' }, { value: 'BROKEN', label: '破坏' },
];
export const DECISION_LABELS: Record<StrategyDecision, string> = { BUY: '可买', WATCH: '观察', DO_NOT_BUY: '不买', PASS: '放弃' };
export const ENTRY_TYPE_LABELS: Record<EntryType, string> = { H1: 'H1', H2: 'H2', BREAKOUT: '突破', PULLBACK_CONFIRMATION: '回踩确认', DOUBLE_BOTTOM: '双底', FAILED_BREAKDOWN_RECLAIM: '假跌破收回', NONE: '无' };

const makeOutput = (decision: StrategyDecision, entryTypes: EntryType[], note: string): StrategyOutput => ({ decision, entryTypes, note });

export function evaluateBuyStrategy(input: StrategyInput): StrategyOutput {
  const { marketStructure, trendQuality, priceLocation, riskState } = input;
  if (marketStructure === 'DOWN') return makeOutput('PASS', ['NONE'], '下降结构不做多头买入。');
  if (marketStructure === 'UNCLEAR') return makeOutput('PASS', ['NONE'], '结构不清，无法制定有效交易计划。');
  if (marketStructure === 'RANGE') {
    if (priceLocation === 'RANGE_EDGE' && riskState === 'NONE') return makeOutput('WATCH', ['DOUBLE_BOTTOM', 'FAILED_BREAKDOWN_RECLAIM', 'BREAKOUT'], '区间边界只观察确认，等双底、假跌破收回或有效突破。');
    if (priceLocation === 'NO_EDGE') return makeOutput('DO_NOT_BUY', ['NONE'], '箱体内无优势位，不买。');
    return makeOutput('DO_NOT_BUY', ['NONE'], '箱体结构只做区间边界，当前条件不成立。');
  }
  if (marketStructure === 'UP' && trendQuality === 'STRONG') {
    if (riskState === 'DIVERGENCE') return makeOutput('DO_NOT_BUY', ['NONE'], '出现放量长上影、突破无跟随或爆量不涨，不买。');
    if (riskState === 'BROKEN') return makeOutput('DO_NOT_BUY', ['NONE'], '已跌回平台、跌破 EMA21 或关键 higher low，不买。');
    if (priceLocation === 'TREND_PULLBACK' && riskState === 'NONE') return makeOutput('BUY', ['H1'], '强趋势浅回调，H1 可用。');
    if (priceLocation === 'TREND_PULLBACK' && riskState === 'OVERHEATED') return makeOutput('WATCH', ['H1', 'H2'], 'H1 降级，优先 H2 或小仓。');
    if (priceLocation === 'BREAKOUT' && riskState === 'NONE') return makeOutput('WATCH', ['BREAKOUT'], '等待突破站稳与跟随，确认后可执行。');
    if (priceLocation === 'BREAKOUT' && riskState === 'OVERHEATED') return makeOutput('WATCH', ['PULLBACK_CONFIRMATION'], '不追，等回踩。');
    if (priceLocation === 'PULLBACK' && riskState === 'NONE') return makeOutput('BUY', ['PULLBACK_CONFIRMATION'], '突破后回踩不破，出现转强确认后买入。');
    if (priceLocation === 'NO_EDGE') return makeOutput('DO_NOT_BUY', ['NONE'], '当前价格没有清晰优势位，不买。');
    return makeOutput('WATCH', ['NONE'], '强趋势仍需等待有效位置与信号。');
  }
  if (marketStructure === 'UP' && trendQuality === 'NORMAL') {
    if (riskState !== 'NONE') return makeOutput('DO_NOT_BUY', ['NONE'], '普通趋势出现过热、分歧或破坏时不买。');
    if (priceLocation === 'TREND_PULLBACK') return makeOutput('WATCH', ['H2'], '普通趋势禁止 H1，等 H2。');
    if (priceLocation === 'PULLBACK') return makeOutput('BUY', ['PULLBACK_CONFIRMATION', 'H2'], '普通趋势等回踩确认或 H2。');
    if (priceLocation === 'BREAKOUT') return makeOutput('WATCH', ['BREAKOUT', 'PULLBACK_CONFIRMATION'], '不追第一反应，等突破跟随或回踩确认。');
    return makeOutput('DO_NOT_BUY', ['NONE'], '普通趋势禁止 H1，当前也没有 H2 或回踩优势。');
  }
  if (marketStructure === 'UP' && trendQuality === 'NONE') {
    if (priceLocation === 'RANGE_EDGE' && riskState === 'NONE') return makeOutput('WATCH', ['DOUBLE_BOTTOM', 'FAILED_BREAKDOWN_RECLAIM'], '无趋势只看区间边界的二次确认。');
    return makeOutput('DO_NOT_BUY', ['NONE'], '无趋势不做趋势买点，只看区间边界。');
  }
  return makeOutput('DO_NOT_BUY', ['NONE'], '当前组合不合法，请重新检查市场结构与趋势质量。');
}

export interface LegacyStrategyFields extends Partial<StrategyInput> { trendJudgment?: string; marketState?: string; buyStrategy?: string; technicalPattern?: string; patternRemark?: string; legacyTrigger?: string }
export function migrateLegacyStrategy(stock: LegacyStrategyFields): StrategyInput & { legacyTrigger?: string } {
  if (stock.marketStructure && stock.trendQuality && stock.priceLocation && stock.riskState) return { marketStructure: stock.marketStructure, trendQuality: stock.trendQuality, priceLocation: stock.priceLocation, riskState: stock.riskState, legacyTrigger: stock.legacyTrigger };
  const background = stock.trendJudgment || '';
  const state = stock.marketState || '';
  const position = `${stock.buyStrategy || ''} ${stock.technicalPattern || ''}`;
  const marketStructure: MarketStructure = background.includes('下降') ? 'DOWN' : background.includes('区间') || background.includes('震荡') ? 'RANGE' : 'UP';
  const trendQuality: TrendQuality = marketStructure !== 'UP' || state.includes('震荡') || state.includes('区间') ? 'NONE' : state.includes('普通') || state.includes('回调') ? 'NORMAL' : 'STRONG';
  const priceLocation: PriceLocation = marketStructure === 'DOWN' ? 'NO_EDGE' : position.includes('突破回踩') || position.includes('前高回踩') ? 'PULLBACK' : position.includes('突破') ? 'BREAKOUT' : position.includes('上沿') || position.includes('下沿') || position.includes('双底') || position.includes('假破') ? 'RANGE_EDGE' : position.includes('不买') || position.includes('持仓') ? 'NO_EDGE' : 'TREND_PULLBACK';
  const riskState: RiskState = state.includes('高位加速') ? 'OVERHEATED' : state.includes('破位') || state.includes('反弹') ? 'BROKEN' : 'NONE';
  return { marketStructure, trendQuality, priceLocation, riskState, legacyTrigger: stock.legacyTrigger || stock.patternRemark || stock.technicalPattern || stock.buyStrategy };
}
export function optionLabel<T extends string>(options: Array<{ value: T; label: string }>, value?: T): string { return options.find((option) => option.value === value)?.label || '未识别'; }
export function getStrategySummary(input: StrategyInput, strategyOutput = evaluateBuyStrategy(input)): string {
  return `${optionLabel(MARKET_STRUCTURE_OPTIONS, input.marketStructure)} + ${optionLabel(TREND_QUALITY_OPTIONS, input.trendQuality)} + ${optionLabel(PRICE_LOCATION_OPTIONS, input.priceLocation)} + ${optionLabel(RISK_STATE_OPTIONS, input.riskState)} + ${DECISION_LABELS[strategyOutput.decision]} + ${strategyOutput.entryTypes.map((item) => ENTRY_TYPE_LABELS[item]).join('/')}`;
}
