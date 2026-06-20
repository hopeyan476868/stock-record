import type { MarketBackground, TradingScenario, EntryTrigger, StrategyDecision } from '../utils/buyStrategyEngine';

// 股票状态
export type StockStatus = 'holding' | 'sold' | 'watching';
export type StockMarketTag = 'A股' | '美股';
export type WatchingOutcome = 'pending' | 'success' | 'failed';
export type EmotionTag = 'FOMO' | '理性' | '犹豫';
export type ReviewDecision = 'pending' | 'approved' | 'rejected';
export type SellType = 'take_profit' | 'stop_loss';
export type SellExecutionCheck = '是' | '否' | '部分执行';
export type TurnoverDirection = 'net_inflow' | 'net_outflow';

export interface Stock {
  id: string;
  name: string;
  marketTag?: StockMarketTag;
  buyQuantity?: number;
  triggerTime?: string;
  triggerPrice?: number;
  buyPrice: number;
  buyDate: string;
  buyReason: string;
  buyPsychology?: string;
  emotionTag?: EmotionTag;
  // 基本面检查
  revenueGrowthOk?: boolean;                    // 营业总收入同比 ≥15%
  deductedNetProfitGrowthOk?: boolean;          // 扣非净利润同比 ≥15%
  grossMarginChangeOk?: boolean;                // 毛利率同比 ≥-3个百分点
  roicOk?: boolean;                             // ROIC（TTM）≥8%
  operatingCashFlowPositiveOk?: boolean;        // 经营现金流 >0
  // 系统根据触发价、止损价、目标价计算
  riskRewardOk?: boolean;
  // 换手率（用户填数字，>15% 时需确认方向）
  turnoverRate?: number;
  turnoverDirection?: TurnoverDirection;
  // 周线趋势
  weeklyCloseAboveEma20Ok?: boolean;
  // 价格行为策略
  marketBackground?: MarketBackground;
  tradingScenario?: TradingScenario;
  entryTrigger?: EntryTrigger;
  volumePriceConfirmed?: boolean;
  // 系统推导
  strategyDecision?: StrategyDecision;
  entryType?: string;
  strategyNote?: string;
  // review
  reviewDecision?: ReviewDecision;
  decisionReason?: string;
  // 交易计划
  stopLossPrice?: number;
  targetPrice?: number;
  takeProfitPrice?: number;
  // 卖出
  sellPrice?: number;
  sellDate?: string;
  sellQuantity?: number;
  sellPsychology?: string;
  sellEmotionTag?: EmotionTag;
  sellType?: SellType;
  sellExecutionCheck?: SellExecutionCheck;
  patternBroken?: boolean;
  stopLossHit?: boolean;
  takeProfitHit?: boolean;
  reversalCandle?: boolean;
  sellSummary?: string;
  // 状态
  status: StockStatus;
  trackingAnalysis?: string;
  watchingOutcome?: WatchingOutcome;
  createdAt: string;
  updatedAt: string;
  /** @deprecated legacy fields — kept for reading old localStorage records only */
  parentNetProfitGrowthOk?: boolean; grossMarginOk?: boolean; netProfitMarginOk?: boolean;
  assetLiabilityRatioOk?: boolean; profitGrowthOk?: boolean;
  riskRewardRatio?: string; turnoverRateOk?: boolean; tradingAmountOk?: boolean;
  superLargeNetInflowOk?: boolean; superLargeNetInflowRatioOk?: boolean;
  weeklyEma20SlopeOk?: boolean; forceContinued?: boolean; netMarginOk?: boolean;
  debtRatioOk?: boolean; priceAboveMa50Ok?: boolean; trendJudgment?: string;
  marketState?: string; buyStrategy?: string; technicalPattern?: string;
  patternRemark?: string; marketStructure?: string; trendQuality?: string;
  priceLocation?: string; currentStructure?: string; riskState?: string;
  positionPhase?: string; concretePattern?: string;
  entryTypes?: string[]; entryOptions?: string[];
  legacyTrigger?: string;
}

export interface Stats {
  totalStocks: number;
  holdingStocks: number;
  soldStocks: number;
  watchingStocks: number;
  totalReviewChecks: number;
  approvedReviewChecks: number;
  reviewPassRate: number;
  successRate: number;
  maxDrawdown: number;
  totalReturn: number;
  reasonStats: ReasonStat[];
}

export interface ReasonStat {
  reason: string;
  count: number;
  successCount: number;
  successRate: number;
  avgReturn: number;
}

// API 响应类型
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}
