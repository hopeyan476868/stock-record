// Price-action decision model: environment -> scenario -> trigger -> execution.

export type MarketBackground = 'STRONG_UP' | 'NORMAL_UP' | 'TRADING_RANGE' | 'DOWN_TREND' | 'UNCLEAR';

export type TradingScenario =
  | 'SHALLOW_PULLBACK'
  | 'TWO_LEG_PULLBACK'
  | 'PLATFORM_CONSOLIDATION'
  | 'FIRST_BREAKOUT_RETEST'
  | 'DEEP_PULLBACK_DOUBLE_BOTTOM'
  | 'DEEP_PULLBACK_BREAK_LH_RETEST'
  | 'OVERHEATED'
  | 'RANGE_LOWER_DOUBLE_BOTTOM'
  | 'RANGE_LOWER_THREE_PUSH'
  | 'RANGE_LOWER_BULL_ENGULF'
  | 'RANGE_FAILED_BREAKDOWN_ZONE'
  | 'RANGE_UPPER_TEST'
  | 'RANGE_UPPER_RETEST'
  | 'RANGE_MIDDLE'
  | 'DOWN_THREE_PUSH_SUPPORT'
  | 'DOWN_BREAK_LH_FIRST_PULLBACK'
  | 'DOWN_BOUNCE_RESISTANCE'
  | 'NO_SCENARIO';

export type EntryTrigger =
  | 'H1_CONFIRM'
  | 'H2_CONFIRM'
  | 'BULL_ENGULF_HIGH_BREAK'
  | 'VOLUME_BREAKOUT'
  | 'RETEST_TURN_STRONG'
  | 'FAILED_BREAKDOWN_CONFIRM'
  | 'NECKLINE_BREAK'
  | 'NONE';

export type RiskHint = 'none' | 'overheating' | 'divergence' | 'invalidated';
export type StrategyDecision = 'BUY' | 'WATCH' | 'DO_NOT_BUY' | 'PASS';
export type EntryType = EntryTrigger;

export interface StrategyInput {
  marketBackground: MarketBackground;
  tradingScenario: TradingScenario;
  entryTrigger: EntryTrigger;
  volumePriceConfirmed?: boolean;
}

export interface StrategyOutput {
  decision: StrategyDecision;
  riskHint: RiskHint;
  entryType: EntryType;
  entryOptions: EntryType[];
  note: string;
  stopLossGuide: string;
  targetGuide: string;
  volumeGuide: string;
}

type Option<T> = { value: T; label: string };

export const MARKET_BACKGROUND_LABELS: Record<MarketBackground, string> = {
  STRONG_UP: '强势上涨',
  NORMAL_UP: '普通上涨',
  TRADING_RANGE: '震荡区间',
  DOWN_TREND: '下降趋势',
  UNCLEAR: '结构不清',
};

export const MARKET_BACKGROUND_OPTIONS: Option<MarketBackground>[] = Object.entries(MARKET_BACKGROUND_LABELS)
  .map(([value, label]) => ({ value: value as MarketBackground, label }));

const SCENARIO_OPTIONS: Record<MarketBackground, Option<TradingScenario>[]> = {
  STRONG_UP: [
    { value: 'SHALLOW_PULLBACK', label: '浅回调延续' },
    { value: 'PLATFORM_CONSOLIDATION', label: '平台整理' },
    { value: 'FIRST_BREAKOUT_RETEST', label: '突破后首次回踩' },
    { value: 'OVERHEATED', label: '高位过热（不买）' },
  ],
  NORMAL_UP: [
    { value: 'TWO_LEG_PULLBACK', label: '两段式正常回调' },
    { value: 'PLATFORM_CONSOLIDATION', label: '平台整理' },
    { value: 'FIRST_BREAKOUT_RETEST', label: '突破后首次回踩' },
    { value: 'DEEP_PULLBACK_DOUBLE_BOTTOM', label: '深回调后双底（关键HL未破）' },
    { value: 'DEEP_PULLBACK_BREAK_LH_RETEST', label: '深回调突破次级LH后首次回踩' },
    { value: 'OVERHEATED', label: '高位过热（不买）' },
  ],
  TRADING_RANGE: [
    { value: 'RANGE_LOWER_DOUBLE_BOTTOM', label: '下沿双底' },
    { value: 'RANGE_LOWER_THREE_PUSH', label: '下沿三推衰竭' },
    { value: 'RANGE_LOWER_BULL_ENGULF', label: '下沿强阳反包' },
    { value: 'RANGE_FAILED_BREAKDOWN_ZONE', label: '下沿假跌破区' },
    { value: 'RANGE_UPPER_TEST', label: '区间上沿测试' },
    { value: 'RANGE_UPPER_RETEST', label: '突破上沿后的回踩区' },
    { value: 'RANGE_MIDDLE', label: '区间中部（不买）' },
  ],
  DOWN_TREND: [
    { value: 'DOWN_THREE_PUSH_SUPPORT', label: '三推衰竭＋大级别支撑' },
    { value: 'DOWN_BREAK_LH_FIRST_PULLBACK', label: '突破前LH后的首次回调' },
    { value: 'DOWN_BOUNCE_RESISTANCE', label: '普通反弹至压力位（不买）' },
  ],
  UNCLEAR: [{ value: 'NO_SCENARIO', label: '无交易场景（放弃）' }],
};

export const TRADING_SCENARIO_LABELS = Object.values(SCENARIO_OPTIONS)
  .flat()
  .reduce((labels, item) => ({ ...labels, [item.value]: item.label }), {} as Record<TradingScenario, string>);

export const SCENARIO_DESCRIPTIONS: Record<TradingScenario, string> = {
  SHALLOW_PULLBACK: '强趋势中的短促缩量回调，关键结构未破。',
  TWO_LEG_PULLBACK: '普通上涨完成两段回调，禁止H1，只等待H2确认。',
  PLATFORM_CONSOLIDATION: '趋势中的横向压缩，当前仍在平台内，等待上沿放量突破。',
  FIRST_BREAKOUT_RETEST: '已经突破关键位，正在第一次缩量回踩原压力位。',
  DEEP_PULLBACK_DOUBLE_BOTTOM: '深回调接近关键HL后形成双底，两个底均未破坏关键HL。',
  DEEP_PULLBACK_BREAK_LH_RETEST: '深回调后先突破回调内部的次级LH，再进行第一次缩量回踩。',
  OVERHEATED: '连续拉升并远离均线，只做持仓管理。',
  RANGE_LOWER_DOUBLE_BOTTOM: '两个低点位于区间下沿附近，等待突破颈线。',
  RANGE_LOWER_THREE_PUSH: '区间下沿附近连续三次下推，空头动能逐步衰竭。',
  RANGE_LOWER_BULL_ENGULF: '区间下沿出现有力度的阳线反包。',
  RANGE_FAILED_BREAKDOWN_ZONE: '价格短暂跌破区间下沿，正在尝试收回关键位。',
  RANGE_UPPER_TEST: '价格仍在区间内测试上沿，尚未完成有效突破。',
  RANGE_UPPER_RETEST: '已经突破区间上沿，正在缩量回踩原上沿。',
  RANGE_MIDDLE: '区间中部没有边界优势。',
  DOWN_THREE_PUSH_SUPPORT: '下降趋势三次下推到大级别支撑，必须等待明确向上触发。',
  DOWN_BREAK_LH_FIRST_PULLBACK: '先突破前一个关键LH，首次回调低点仍高于前LL，形成候选HL。',
  DOWN_BOUNCE_RESISTANCE: '下降趋势中的普通反弹，仍受前LH或压力位压制。',
  NO_SCENARIO: '没有清晰趋势、区间或可执行场景。',
};

export const ENTRY_TRIGGER_LABELS: Record<EntryTrigger, string> = {
  H1_CONFIRM: 'H1确认',
  H2_CONFIRM: 'H2确认',
  BULL_ENGULF_HIGH_BREAK: '反包K高点突破',
  VOLUME_BREAKOUT: '放量突破',
  RETEST_TURN_STRONG: '回踩确认转强',
  FAILED_BREAKDOWN_CONFIRM: '假跌破收回确认',
  NECKLINE_BREAK: '双底局部颈线突破',
  NONE: '无触发',
};
export const ENTRY_TYPE_LABELS = ENTRY_TRIGGER_LABELS;

export const RISK_HINT_LABELS: Record<RiskHint, string> = {
  none: '无明显风险', overheating: '过热', divergence: '分歧', invalidated: '买点失效',
};
export const DECISION_LABELS: Record<StrategyDecision, string> = {
  BUY: '可买', WATCH: '观察', DO_NOT_BUY: '不买', PASS: '放弃',
};
export const STRATEGY_CONCLUSION_LABELS: Record<StrategyDecision, string> = {
  BUY: '触发成立', WATCH: '等待', DO_NOT_BUY: '不买', PASS: '放弃',
};

const TRIGGER_GUIDES: Record<EntryTrigger, Pick<StrategyOutput, 'stopLossGuide' | 'targetGuide' | 'volumeGuide'>> = {
  H1_CONFIRM: {
    stopLossGuide: '信号K线低点下方',
    targetGuide: '前高或下一压力位',
    volumeGuide: '回调缩量，突破信号K高点时不明显缩量或温和放量',
  },
  H2_CONFIRM: {
    stopLossGuide: '第二次回调低点下方',
    targetGuide: '前高、区间中轴或下一压力位',
    volumeGuide: '两段回调总体缩量，确认突破时不明显缩量或温和放量',
  },
  BULL_ENGULF_HIGH_BREAK: {
    stopLossGuide: '反包K线低点下方',
    targetGuide: '最近压力位或区间中轴',
    volumeGuide: '反包K实体覆盖前阴，突破其高点时成交量有效配合',
  },
  VOLUME_BREAKOUT: {
    stopLossGuide: '平台或区间上沿下方',
    targetGuide: '整理高度等幅目标或下一压力位',
    volumeGuide: '收盘突破关键位，成交量 ≥ 20日均量150%',
  },
  RETEST_TURN_STRONG: {
    stopLossGuide: '首次回踩低点下方',
    targetGuide: '前高或突破结构等幅目标',
    volumeGuide: '突破放量、回踩缩量、重新转强时量能恢复',
  },
  FAILED_BREAKDOWN_CONFIRM: {
    stopLossGuide: '假跌破最低点下方',
    targetGuide: '区间中轴，强势时看区间上沿',
    volumeGuide: '快速收回下沿，并突破收回K高点',
  },
  NECKLINE_BREAK: {
    stopLossGuide: '右底低点下方',
    targetGuide: '双底高度等幅目标或下一压力位',
    volumeGuide: '右底卖压减弱，突破两个底之间的局部反弹高点时成交量放大',
  },
  NONE: { stopLossGuide: '无', targetGuide: '无', volumeGuide: '无可执行触发' },
};

const ALLOWED_TRIGGERS: Record<TradingScenario, EntryTrigger[]> = {
  SHALLOW_PULLBACK: ['H1_CONFIRM', 'H2_CONFIRM'],
  TWO_LEG_PULLBACK: ['H2_CONFIRM'],
  PLATFORM_CONSOLIDATION: ['VOLUME_BREAKOUT'],
  FIRST_BREAKOUT_RETEST: ['RETEST_TURN_STRONG'],
  DEEP_PULLBACK_DOUBLE_BOTTOM: ['NECKLINE_BREAK'],
  DEEP_PULLBACK_BREAK_LH_RETEST: ['RETEST_TURN_STRONG'],
  OVERHEATED: ['NONE'],
  RANGE_LOWER_DOUBLE_BOTTOM: ['NECKLINE_BREAK'],
  RANGE_LOWER_THREE_PUSH: ['H2_CONFIRM'],
  RANGE_LOWER_BULL_ENGULF: ['BULL_ENGULF_HIGH_BREAK'],
  RANGE_FAILED_BREAKDOWN_ZONE: ['FAILED_BREAKDOWN_CONFIRM'],
  RANGE_UPPER_TEST: ['VOLUME_BREAKOUT'],
  RANGE_UPPER_RETEST: ['RETEST_TURN_STRONG'],
  RANGE_MIDDLE: ['NONE'],
  DOWN_THREE_PUSH_SUPPORT: ['H2_CONFIRM'],
  DOWN_BREAK_LH_FIRST_PULLBACK: ['RETEST_TURN_STRONG'],
  DOWN_BOUNCE_RESISTANCE: ['NONE'],
  NO_SCENARIO: ['NONE'],
};

function output(decision: StrategyDecision, input: StrategyInput, note: string, riskHint: RiskHint = 'none'): StrategyOutput {
  return {
    decision,
    riskHint,
    entryType: input.entryTrigger,
    entryOptions: ALLOWED_TRIGGERS[input.tradingScenario],
    note,
    ...TRIGGER_GUIDES[input.entryTrigger],
  };
}

export function evaluateBuyStrategy(input: StrategyInput): StrategyOutput {
  const allowed = ALLOWED_TRIGGERS[input.tradingScenario] || ['NONE'];
  if (input.marketBackground === 'UNCLEAR' || input.tradingScenario === 'NO_SCENARIO') {
    return output('PASS', { ...input, entryTrigger: 'NONE' }, '结构不清，没有可执行场景，直接放弃。');
  }
  if (input.tradingScenario === 'OVERHEATED' || input.tradingScenario === 'RANGE_MIDDLE') {
    return output('DO_NOT_BUY', { ...input, entryTrigger: 'NONE' }, '当前位置没有交易优势，不新开仓。', input.tradingScenario === 'OVERHEATED' ? 'overheating' : 'none');
  }
  if (input.tradingScenario === 'DOWN_BOUNCE_RESISTANCE') {
    return output('PASS', { ...input, entryTrigger: 'NONE' }, '下降趋势普通反弹至压力位，不买。');
  }
  if (!allowed.includes(input.entryTrigger) || input.entryTrigger === 'NONE') {
    return output('DO_NOT_BUY', { ...input, entryTrigger: 'NONE' }, '当前场景没有合法触发，继续等待。');
  }
  if (!input.volumePriceConfirmed) {
    return output('WATCH', input, '场景存在，但触发对应的量价条件尚未确认。');
  }
  const counterTrend = input.marketBackground === 'DOWN_TREND';
  return output('BUY', input, counterTrend
    ? '下降趋势反转场景与触发成立；属于逆势早期交易，必须缩小仓位并严格止损。'
    : '市场环境、交易场景、入场触发与量价条件一致；继续核对三价与盈亏比。',
  );
}

export function getTradingScenarios(background: MarketBackground): Option<TradingScenario>[] {
  return SCENARIO_OPTIONS[background];
}

export function getEntryTriggers(scenario: TradingScenario): Option<EntryTrigger>[] {
  return ALLOWED_TRIGGERS[scenario].map(value => ({ value, label: ENTRY_TRIGGER_LABELS[value] }));
}

export function getStrategySummary(input: StrategyInput, strategy = evaluateBuyStrategy(input)): string {
  return `${MARKET_BACKGROUND_LABELS[input.marketBackground]} + ${TRADING_SCENARIO_LABELS[input.tradingScenario]} + ${ENTRY_TRIGGER_LABELS[input.entryTrigger]} + ${STRATEGY_CONCLUSION_LABELS[strategy.decision]}`;
}

export interface LegacyStrategyFields {
  marketBackground?: string;
  tradingScenario?: string;
  entryTrigger?: string;
  positionPhase?: string;
  concretePattern?: string;
  currentStructure?: string;
  riskState?: string;
  entryType?: string;
  marketStructure?: string;
  trendQuality?: string;
  priceLocation?: string;
  trendJudgment?: string;
  marketState?: string;
  buyStrategy?: string;
  technicalPattern?: string;
  patternRemark?: string;
  legacyTrigger?: string;
}

function mapBackground(value?: string): MarketBackground {
  if (value && value in MARKET_BACKGROUND_LABELS) return value as MarketBackground;
  const text = value || '';
  if (text === 'BEAR_TREND' || text.includes('下降') || text === 'DOWN') return 'DOWN_TREND';
  if (text === 'TRADING_RANGE' || text.includes('区间') || text.includes('震荡')) return 'TRADING_RANGE';
  if (text === 'TRANSITION' || text.includes('转换') || text.includes('不清')) return 'UNCLEAR';
  if (text.includes('强') || text.includes('加速')) return 'STRONG_UP';
  return 'NORMAL_UP';
}

function defaultScenario(background: MarketBackground): TradingScenario {
  if (background === 'STRONG_UP') return 'SHALLOW_PULLBACK';
  if (background === 'NORMAL_UP') return 'TWO_LEG_PULLBACK';
  if (background === 'TRADING_RANGE') return 'RANGE_LOWER_DOUBLE_BOTTOM';
  if (background === 'DOWN_TREND') return 'DOWN_BOUNCE_RESISTANCE';
  return 'NO_SCENARIO';
}

function mapScenario(background: MarketBackground, input: LegacyStrategyFields): TradingScenario {
  if (input.tradingScenario && input.tradingScenario in TRADING_SCENARIO_LABELS) return input.tradingScenario as TradingScenario;
  const text = `${input.positionPhase || ''}${input.currentStructure || ''}${input.priceLocation || ''}${input.buyStrategy || ''}${input.technicalPattern || ''}`;
  if (text.includes('过热') || text.includes('ACCELERATION')) return 'OVERHEATED';
  if (background === 'STRONG_UP') {
    if (text.includes('平台') || text.includes('PLATFORM')) return 'PLATFORM_CONSOLIDATION';
    if (text.includes('回踩') || text.includes('RETEST')) return 'FIRST_BREAKOUT_RETEST';
    return 'SHALLOW_PULLBACK';
  }
  if (background === 'NORMAL_UP') {
    if (text.includes('平台') || text.includes('PLATFORM')) return 'PLATFORM_CONSOLIDATION';
    if (text.includes('回踩') || text.includes('RETEST')) return 'FIRST_BREAKOUT_RETEST';
    if (text.includes('深') || text.includes('DEEP')) {
      return text.includes('双底') ? 'DEEP_PULLBACK_DOUBLE_BOTTOM' : 'DEEP_PULLBACK_BREAK_LH_RETEST';
    }
    return 'TWO_LEG_PULLBACK';
  }
  if (background === 'TRADING_RANGE') {
    if (text.includes('中部') || text.includes('MIDDLE')) return 'RANGE_MIDDLE';
    if (text.includes('假') || text.includes('FAILED')) return 'RANGE_FAILED_BREAKDOWN_ZONE';
    if (text.includes('回踩') || text.includes('RETEST')) return 'RANGE_UPPER_RETEST';
    if (text.includes('上沿') || text.includes('UPPER')) return 'RANGE_UPPER_TEST';
    if (text.includes('三推')) return 'RANGE_LOWER_THREE_PUSH';
    if (text.includes('反包') || text.includes('ENGULF')) return 'RANGE_LOWER_BULL_ENGULF';
    return 'RANGE_LOWER_DOUBLE_BOTTOM';
  }
  return defaultScenario(background);
}

function mapTrigger(scenario: TradingScenario, input: LegacyStrategyFields): EntryTrigger {
  if (input.entryTrigger && input.entryTrigger in ENTRY_TRIGGER_LABELS) return input.entryTrigger as EntryTrigger;
  const text = `${input.concretePattern || ''}${input.entryType || ''}${input.priceLocation || ''}${input.buyStrategy || ''}`.toLowerCase();
  const allowed = ALLOWED_TRIGGERS[scenario];
  let trigger: EntryTrigger = 'NONE';
  if (text.includes('h2')) trigger = 'H2_CONFIRM';
  else if (text.includes('h1')) trigger = 'H1_CONFIRM';
  else if (text.includes('假') || text.includes('failed')) trigger = 'FAILED_BREAKDOWN_CONFIRM';
  else if (text.includes('颈线') || text.includes('双底')) trigger = 'NECKLINE_BREAK';
  else if (text.includes('反包') || text.includes('engulf')) trigger = 'BULL_ENGULF_HIGH_BREAK';
  else if (text.includes('回踩') || text.includes('retest')) trigger = 'RETEST_TURN_STRONG';
  else if (text.includes('突破') || text.includes('breakout')) trigger = 'VOLUME_BREAKOUT';
  return allowed.includes(trigger) ? trigger : allowed[0];
}

export function migrateLegacyStrategy(stock: LegacyStrategyFields): StrategyInput {
  const marketBackground = mapBackground(stock.marketBackground || stock.trendJudgment || stock.marketStructure);
  const tradingScenario = mapScenario(marketBackground, stock);
  const entryTrigger = mapTrigger(tradingScenario, stock);
  return { marketBackground, tradingScenario, entryTrigger, volumePriceConfirmed: false };
}
