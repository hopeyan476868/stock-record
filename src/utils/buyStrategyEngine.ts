// ==============================
// 三层价格行为交易策略引擎
// ==============================
// Level 1: 市场背景（趋势方向）
// Level 2: 形态位置（价格在背景中的阶段）
// Level 3: 具体形态（K 线级别的具体结构）
// 系统自动推导：风险提示 + 入场方式 + 最终决策
// ==============================

// --- Level 1 ---
export type MarketBackground = 'BULL_TREND' | 'BEAR_TREND' | 'TRADING_RANGE';

// --- Level 2 ---
// 上涨趋势中的位置
export type BullPosition = 'PULLBACK' | 'CONSOLIDATION' | 'ACCELERATION';
// 下降趋势中的位置
export type BearPosition = 'BOUNCE' | 'REVERSAL_TRY';
// 区间中的位置
export type RangePosition = 'LOWER_EDGE' | 'MIDDLE' | 'UPPER_EDGE' | 'IN_RANGE_CONSOLIDATION';

export type PositionPhase = BullPosition | BearPosition | RangePosition;

// --- Level 3 ---
// 上涨 + 回调中
export type BullPullbackPattern = 'SHALLOW_PULLBACK' | 'EMA21_TOUCH' | 'CHANNEL_PULLBACK' | 'DOUBLE_BOTTOM' | 'DEEP_PULLBACK_HL_INTACT';
// 上涨 + 中继整理
export type BullConsolidationPattern = 'HORIZONTAL_PLATFORM' | 'TRIANGLE_CONTRACTION' | 'CUP_HANDLE' | 'WEDGE';
// 下降 + 反弹中
export type BearBouncePattern = 'BOUNCE_TO_RESISTANCE';
// 下降 + 反转试探
export type BearReversalPattern = 'REVERSAL_BREAKOUT_RETEST' | 'DOUBLE_BOTTOM_CONFIRM';
// 区间 + 下沿
export type RangeLowerPattern = 'DOUBLE_BOTTOM' | 'FAILED_BREAKDOWN_RECLAIM' | 'BULL_ENGULF_LOWER_EDGE';
// 区间 + 上沿
export type RangeUpperPattern = 'VALID_BREAKOUT' | 'BREAKOUT_PULLBACK';
// 区间 + 整理
export type RangeConsolidationPattern = 'HORIZONTAL_PLATFORM' | 'TRIANGLE_CONTRACTION';

export type ConcretePattern =
  | BullPullbackPattern | BullConsolidationPattern
  | BearBouncePattern | BearReversalPattern
  | RangeLowerPattern | RangeUpperPattern | RangeConsolidationPattern
  | 'NONE';

// --- System derived outputs ---
export type RiskHint = 'none' | 'overheating' | 'divergence' | 'invalidated';
export type StrategyDecision = 'BUY' | 'WATCH' | 'DO_NOT_BUY' | 'PASS';
export type EntryType =
  | 'H1' | 'H2' | 'PLATFORM_BREAKOUT' | 'BREAKOUT_PULLBACK' | 'CHANNEL_PULLBACK'
  | 'TRIANGLE_BREAKOUT' | 'CUP_HANDLE_BREAKOUT' | 'DOUBLE_BOTTOM_CONFIRMATION'
  | 'FAILED_BREAKDOWN_RECLAIM' | 'EFFECTIVE_BREAKOUT' | 'DIRECTIONAL_BREAKOUT'
  | 'REVERSAL_BREAKOUT_PULLBACK' | 'LOWER_EDGE_BULL_ENGULF' | 'NONE';

export interface StrategyInput {
  marketBackground: MarketBackground;
  positionPhase: PositionPhase;
  concretePattern: ConcretePattern;
}

export interface StrategyOutput {
  decision: StrategyDecision;
  riskHint: RiskHint;
  entryType: EntryType;
  note: string;
}

// ==============================
// Labels
// ==============================
export const MARKET_BACKGROUND_LABELS: Record<MarketBackground, string> = {
  BULL_TREND: '上涨趋势',
  BEAR_TREND: '下降趋势',
  TRADING_RANGE: '区间震荡',
};
export const MARKET_BACKGROUND_OPTIONS: Array<{ value: MarketBackground; label: string }> = [
  { value: 'BULL_TREND', label: '上涨趋势' },
  { value: 'BEAR_TREND', label: '下降趋势' },
  { value: 'TRADING_RANGE', label: '区间震荡' },
];

// Position Phase labels (depends on background)
export const BULL_POSITIONS: Array<{ value: BullPosition; label: string }> = [
  { value: 'PULLBACK', label: '回调中' },
  { value: 'CONSOLIDATION', label: '中继整理' },
  { value: 'ACCELERATION', label: '高位加速' },
];
export const BEAR_POSITIONS: Array<{ value: BearPosition; label: string }> = [
  { value: 'BOUNCE', label: '反弹中' },
  { value: 'REVERSAL_TRY', label: '反转试探' },
];
export const RANGE_POSITIONS: Array<{ value: RangePosition; label: string }> = [
  { value: 'LOWER_EDGE', label: '下沿' },
  { value: 'MIDDLE', label: '中部' },
  { value: 'UPPER_EDGE', label: '上沿' },
  { value: 'IN_RANGE_CONSOLIDATION', label: '区间内整理' },
];
export const POSITION_PHASE_LABELS: Record<PositionPhase, string> = {
  PULLBACK: '回调中', CONSOLIDATION: '中继整理', ACCELERATION: '高位加速',
  BOUNCE: '反弹中', REVERSAL_TRY: '反转试探',
  LOWER_EDGE: '下沿', MIDDLE: '中部', UPPER_EDGE: '上沿', IN_RANGE_CONSOLIDATION: '区间内整理',
};

// Concrete Pattern labels (depends on position phase)
export const PULLBACK_PATTERNS: Array<{ value: BullPullbackPattern; label: string }> = [
  { value: 'SHALLOW_PULLBACK', label: '浅回调（EMA5附近）' },
  { value: 'EMA21_TOUCH', label: 'EMA21回踩' },
  { value: 'CHANNEL_PULLBACK', label: '通道下轨' },
  { value: 'DOUBLE_BOTTOM', label: '双底' },
  { value: 'DEEP_PULLBACK_HL_INTACT', label: '深回调（未破HL）' },
];
export const CONSOLIDATION_PATTERNS: Array<{ value: BullConsolidationPattern; label: string }> = [
  { value: 'HORIZONTAL_PLATFORM', label: '水平平台' },
  { value: 'TRIANGLE_CONTRACTION', label: '三角收敛' },
  { value: 'CUP_HANDLE', label: '杯柄' },
  { value: 'WEDGE', label: '楔形' },
];
export const BOUNCE_PATTERNS: Array<{ value: BearBouncePattern; label: string }> = [
  { value: 'BOUNCE_TO_RESISTANCE', label: '反弹至压力位' },
];
export const REVERSAL_PATTERNS: Array<{ value: BearReversalPattern; label: string }> = [
  { value: 'REVERSAL_BREAKOUT_RETEST', label: '反转突破后回踩' },
  { value: 'DOUBLE_BOTTOM_CONFIRM', label: '双底确认' },
];
export const LOWER_PATTERNS: Array<{ value: RangeLowerPattern; label: string }> = [
  { value: 'DOUBLE_BOTTOM', label: '双底' },
  { value: 'FAILED_BREAKDOWN_RECLAIM', label: '假跌破收回' },
  { value: 'BULL_ENGULF_LOWER_EDGE', label: '下沿阳线反包' },
];
export const UPPER_PATTERNS: Array<{ value: RangeUpperPattern; label: string }> = [
  { value: 'VALID_BREAKOUT', label: '有效突破' },
  { value: 'BREAKOUT_PULLBACK', label: '突破回踩' },
];
export const RANGE_CONSOLIDATION_PATTERNS: Array<{ value: RangeConsolidationPattern; label: string }> = [
  { value: 'HORIZONTAL_PLATFORM', label: '水平平台' },
  { value: 'TRIANGLE_CONTRACTION', label: '三角收敛' },
];
export const CONCRETE_PATTERN_LABELS: Record<ConcretePattern, string> = {
  SHALLOW_PULLBACK: '浅回调', EMA21_TOUCH: 'EMA21回踩', CHANNEL_PULLBACK: '通道下轨',
  DOUBLE_BOTTOM: '双底', DEEP_PULLBACK_HL_INTACT: '深回调（未破HL）',
  HORIZONTAL_PLATFORM: '水平平台', TRIANGLE_CONTRACTION: '三角收敛', CUP_HANDLE: '杯柄', WEDGE: '楔形',
  BOUNCE_TO_RESISTANCE: '反弹至压力位',
  REVERSAL_BREAKOUT_RETEST: '反转突破后回踩', DOUBLE_BOTTOM_CONFIRM: '双底确认',
  FAILED_BREAKDOWN_RECLAIM: '假跌破收回', BULL_ENGULF_LOWER_EDGE: '下沿阳线反包',
  VALID_BREAKOUT: '有效突破', BREAKOUT_PULLBACK: '突破回踩',
  NONE: '无合适形态',
};
export const RISK_HINT_LABELS: Record<RiskHint, string> = {
  none: '无明显风险',
  overheating: '过热',
  divergence: '分歧',
  invalidated: '买点失效',
};
export const DECISION_LABELS: Record<StrategyDecision, string> = {
  BUY: '可买', WATCH: '观察', DO_NOT_BUY: '不买', PASS: '放弃',
};
export const ENTRY_TYPE_LABELS: Record<EntryType, string> = {
  H1: 'H1', H2: 'H2', PLATFORM_BREAKOUT: '平台突破', BREAKOUT_PULLBACK: '突破回踩',
  CHANNEL_PULLBACK: '通道回踩', TRIANGLE_BREAKOUT: '三角突破', CUP_HANDLE_BREAKOUT: '杯柄突破',
  DOUBLE_BOTTOM_CONFIRMATION: '双底确认', FAILED_BREAKDOWN_RECLAIM: '假跌破收回',
  EFFECTIVE_BREAKOUT: '有效突破', DIRECTIONAL_BREAKOUT: '方向突破',
  REVERSAL_BREAKOUT_PULLBACK: '反转突破回踩', LOWER_EDGE_BULL_ENGULF: '下沿阳线反包', NONE: '无买点',
};

// ==============================
// Engine
// ==============================
const out = (decision: StrategyDecision, entryType: EntryType, riskHint: RiskHint, note: string): StrategyOutput => ({ decision, entryType, riskHint, note });
const noBuy = (note: string) => out('DO_NOT_BUY', 'NONE', 'none', note);
const watch = (entryType: EntryType, riskHint: RiskHint, note: string) => out('WATCH', entryType, riskHint, note);

export function evaluateBuyStrategy(input: StrategyInput): StrategyOutput {
  const { marketBackground: bg, positionPhase: pos, concretePattern: pat } = input;

  // ===================== BULL TREND =====================
  if (bg === 'BULL_TREND') {
    if (pos === 'ACCELERATION') {
      return out('WATCH', 'NONE', 'overheating',
        '高位加速：连续大阳线后远离 EMA21，不新开仓。已有持仓做止盈和移动止损管理。');
    }

    if (pos === 'PULLBACK') {
      if (pat === 'SHALLOW_PULLBACK') {
        return out('BUY', 'H1', 'none',
          '强势上涨中的浅回调，H1 可用。止损设在信号 K 线低点，不扛单。');
      }
      if (pat === 'EMA21_TOUCH') {
        return out('BUY', 'H2', 'none',
          'EMA21 附近获得支撑的 H2。H1 不参与，等二次确认。');
      }
      if (pat === 'CHANNEL_PULLBACK') {
        return out('BUY', 'CHANNEL_PULLBACK', 'none',
          '窄上升通道下轨回调，通道低吸。止损通道下轨下方。');
      }
      if (pat === 'DOUBLE_BOTTOM') {
        return out('BUY', 'DOUBLE_BOTTOM_CONFIRMATION', 'none',
          '上涨趋势中的双底确认，说明回调结束。设第二个底下方止损。');
      }
      if (pat === 'DEEP_PULLBACK_HL_INTACT') {
        return watch('NONE', 'divergence',
          '深回调但最后一个 HL 未被破坏，上涨背景不变。但价格已跌穿 EMA21，不急于左侧抄底。'
          + '等待重新站回 EMA21 或出现底部结构（双底/假破收回）后再入场。');
      }
      return noBuy('回调中的具体形态不合法，请重新选择。');
    }

    if (pos === 'CONSOLIDATION') {
      if (pat === 'HORIZONTAL_PLATFORM') {
        return watch('PLATFORM_BREAKOUT', 'none',
          '水平平台整理。不提前入场，等平台突破或突破回踩确认。');
      }
      if (pat === 'TRIANGLE_CONTRACTION') {
        return watch('TRIANGLE_BREAKOUT', 'none',
          '三角收敛末端，等方向突破或突破回踩确认。不提前赌方向。');
      }
      if (pat === 'CUP_HANDLE') {
        return watch('CUP_HANDLE_BREAKOUT', 'none',
          '杯柄整理形态。等杯柄突破或突破回踩确认。');
      }
      if (pat === 'WEDGE') {
        return watch('NONE', 'divergence',
          '楔形整理：通常是动量衰竭信号。不急于入场，等向下突破或楔形转为平台再评估。');
      }
      return noBuy('整理形态不合法。');
    }
  }

  // ===================== BEAR TREND =====================
  if (bg === 'BEAR_TREND') {
    if (pos === 'BOUNCE') {
      return noBuy('下降趋势反弹不买。反弹不改变趋势，不接飞刀。');
    }

    if (pos === 'REVERSAL_TRY') {
      if (pat === 'REVERSAL_BREAKOUT_RETEST') {
        return watch('REVERSAL_BREAKOUT_PULLBACK', 'none',
          '下降背景唯一例外：已出现反转突破（突破关键压力位），等回踩确认不破后再评估。'
          + '确认标准：回踩不破突破 K 线低点或 EMA21。');
      }
      if (pat === 'DOUBLE_BOTTOM_CONFIRM') {
        return watch('DOUBLE_BOTTOM_CONFIRMATION', 'none',
          '双底确认是潜在趋势反转信号，但下降背景的胜率低于上涨背景。'
          + '等右侧确认（突破颈线或回踩不破）后再评估。');
      }
      return noBuy('反转试探形态不合法。');
    }
  }

  // ===================== TRADING RANGE =====================
  if (bg === 'TRADING_RANGE') {
    if (pos === 'MIDDLE') {
      return noBuy('区间中部不买。不上不下没有优势，等价格靠近边界再评估。');
    }

    if (pos === 'LOWER_EDGE') {
      if (pat === 'DOUBLE_BOTTOM') {
        return watch('DOUBLE_BOTTOM_CONFIRMATION', 'none',
          '区间底部出现双底。等右侧确认后再入场，不要提前赌双底。');
      }
      if (pat === 'FAILED_BREAKDOWN_RECLAIM') {
        return watch('FAILED_BREAKDOWN_RECLAIM', 'none',
          '假跌破区间下沿后快速收回，这是多头陷阱失效的信号。等收回确认。');
      }
      if (pat === 'BULL_ENGULF_LOWER_EDGE') {
        return out('BUY', 'LOWER_EDGE_BULL_ENGULF', 'none',
          '区间底部阳线反包，短期多头占优。止损设反包 K 线低点。区间底部不追涨，低吸为主。');
      }
      return noBuy('下沿形态不合法。');
    }

    if (pos === 'UPPER_EDGE') {
      if (pat === 'VALID_BREAKOUT') {
        return watch('EFFECTIVE_BREAKOUT', 'none',
          '区间上方有效突破。不追，等突破后回踩确认不破再介入。');
      }
      if (pat === 'BREAKOUT_PULLBACK') {
        return out('BUY', 'BREAKOUT_PULLBACK', 'none',
          '突破后回踩原压力位不破，重新转强。这是区间突破的标准入场点。');
      }
      return noBuy('上沿不追买，等有效突破信号。');
    }

    if (pos === 'IN_RANGE_CONSOLIDATION') {
      if (pat === 'HORIZONTAL_PLATFORM') {
        return watch('DIRECTIONAL_BREAKOUT', 'none',
          '区间内窄幅平台整理，等方向突破确认。');
      }
      if (pat === 'TRIANGLE_CONTRACTION') {
        return watch('DIRECTIONAL_BREAKOUT', 'none',
          '区间内三角收敛，等方向选择。不提前押注。');
      }
      return noBuy('区间整理形态不合法。');
    }
  }

  return noBuy('当前组合不合法，请重新选择。');
}

// ==============================
// Helpers
// ==============================
export function getPositionPhases(bg: MarketBackground): Array<{ value: PositionPhase; label: string }> {
  if (bg === 'BULL_TREND') return BULL_POSITIONS;
  if (bg === 'BEAR_TREND') return BEAR_POSITIONS;
  return RANGE_POSITIONS;
}

export function getConcretePatterns(pos: PositionPhase): Array<{ value: ConcretePattern; label: string }> {
  const map: Record<PositionPhase, Array<{ value: ConcretePattern; label: string }>> = {
    PULLBACK: PULLBACK_PATTERNS,
    CONSOLIDATION: CONSOLIDATION_PATTERNS,
    ACCELERATION: [],
    BOUNCE: BOUNCE_PATTERNS,
    REVERSAL_TRY: REVERSAL_PATTERNS,
    LOWER_EDGE: LOWER_PATTERNS,
    MIDDLE: [],
    UPPER_EDGE: UPPER_PATTERNS,
    IN_RANGE_CONSOLIDATION: RANGE_CONSOLIDATION_PATTERNS,
  };
  return map[pos] || [];
}

export function getStrategySummary(input: StrategyInput, strategy = evaluateBuyStrategy(input)): string {
  const bg = MARKET_BACKGROUND_LABELS[input.marketBackground];
  const phase = POSITION_PHASE_LABELS[input.positionPhase];
  const pat = CONCRETE_PATTERN_LABELS[input.concretePattern];
  const risk = RISK_HINT_LABELS[strategy.riskHint];
  const dec = DECISION_LABELS[strategy.decision];
  return `${bg} + ${phase} + ${pat} + ${risk} + ${dec}`;
}

// ==============================
// Legacy migration (backward compat for old localStorage records)
// ==============================
export interface LegacyStrategyFields {
  marketBackground?: string;
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

function mapLegacyBackground(v: string | undefined): MarketBackground {
  if (!v) return 'BULL_TREND';
  if (v === 'DOWN' || v === 'BEAR_TREND' || v.includes('下降') || v === 'BEAR') return 'BEAR_TREND';
  if (v === 'RANGE' || v === 'TRADING_RANGE' || v.includes('区间') || v.includes('震荡')) return 'TRADING_RANGE';
  return 'BULL_TREND';
}

function mapLegacyPhase(_bg: MarketBackground, input: LegacyStrategyFields): PositionPhase {
  const pos = (input.priceLocation || input.buyStrategy || '').toLowerCase();
  const state = (input.marketState || '').toLowerCase();
  if (input.riskState === 'OVERHEATED' || state.includes('高位') || state.includes('加速')) return 'ACCELERATION';
  if (pos.includes('平台') || pos.includes('整理') || pos.includes('杯柄') || pos.includes('三角')) {
    if (_bg === 'TRADING_RANGE') return 'IN_RANGE_CONSOLIDATION';
    return 'CONSOLIDATION';
  }
  if (state.includes('下沿') || pos.includes('下沿')) return 'LOWER_EDGE';
  if (state.includes('上沿') || pos.includes('上沿')) return 'UPPER_EDGE';
  if (state.includes('中部') || pos.includes('中部')) return 'MIDDLE';
  if (_bg === 'BEAR_TREND') return 'REVERSAL_TRY';
  return 'PULLBACK';
}

function mapLegacyPattern(_bg: MarketBackground, _pos: PositionPhase, input: LegacyStrategyFields): ConcretePattern {
  const pos = (input.priceLocation || input.buyStrategy || '').toLowerCase();
  const pat = (input.technicalPattern || '').toLowerCase();
  if (pos.includes('ema21') || pos.includes('ema20') || pos.includes('h2')) return 'EMA21_TOUCH';
  if (pos.includes('浅') || pos.includes('h1') || pos.includes('小回调')) return 'SHALLOW_PULLBACK';
  if (pos.includes('双底')) return 'DOUBLE_BOTTOM';
  if (pos.includes('通道') || pos.includes('channel')) return 'CHANNEL_PULLBACK';
  if (pat.includes('平台') || pos.includes('平台')) return 'HORIZONTAL_PLATFORM';
  if (pat.includes('三角') || pos.includes('三角')) return 'TRIANGLE_CONTRACTION';
  if (pat.includes('杯柄') || pos.includes('杯柄')) return 'CUP_HANDLE';
  if (pos.includes('楔形') || pat.includes('楔形')) return 'WEDGE';
  if (pos.includes('假破') || pos.includes('收回')) return 'FAILED_BREAKDOWN_RECLAIM';
  if (pos.includes('反弹')) return 'BOUNCE_TO_RESISTANCE';
  if (pos.includes('突破回踩') || pos.includes('回踩')) return 'BREAKOUT_PULLBACK';
  if (pos.includes('突破')) return 'VALID_BREAKOUT';
  if (pos.includes('反包')) return 'BULL_ENGULF_LOWER_EDGE';
  if (_bg === 'BEAR_TREND') return 'REVERSAL_BREAKOUT_RETEST';
  return 'SHALLOW_PULLBACK';
}

export function migrateLegacyStrategy(stock: LegacyStrategyFields): StrategyInput {
  const bg = mapLegacyBackground(stock.marketBackground || stock.trendJudgment || stock.marketStructure);
  const phase = mapLegacyPhase(bg, stock);
  const pattern = mapLegacyPattern(bg, phase, stock);
  return { marketBackground: bg, positionPhase: phase, concretePattern: pattern };
}
