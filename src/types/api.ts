// 股票状态
export type StockStatus = 'holding' | 'sold' | 'watching';
export type StockMarketTag = 'A股' | '美股';
export type WatchingOutcome = 'pending' | 'success' | 'failed';
export type EmotionTag = 'FOMO' | '理性' | '犹豫';
export type ReviewDecision = 'pending' | 'approved' | 'rejected';
export type TrendJudgment = '上涨趋势' | '下降趋势' | '区间震荡' | '区间' | '下降' | '上升';
export type TechnicalPattern = string;
export type SellType = 'take_profit' | 'stop_loss';
export type SellExecutionCheck = '是' | '否' | '部分执行';

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
  roicOk?: boolean;
  grossMarginOk?: boolean;
  operatingCashFlowPositiveOk?: boolean;
  assetLiabilityRatioOk?: boolean;
  parentNetProfitGrowthOk?: boolean;
  profitGrowthOk?: boolean;
  /** @deprecated legacy checklist field; new records use parentNetProfitGrowthOk */
  revenueGrowthOk?: boolean;
  riskRewardOk?: boolean;
  weeklyCloseAboveEma20Ok?: boolean;
  weeklyEma20SlopeOk?: boolean;
  forceContinued?: boolean;
  /** @deprecated legacy checklist field; new records use roicOk/grossMarginOk/profitGrowthOk */
  netMarginOk?: boolean;
  /** @deprecated legacy checklist field; new records use roicOk/grossMarginOk/profitGrowthOk */
  debtRatioOk?: boolean;
  priceAboveMa50Ok?: boolean;
  trendJudgment?: TrendJudgment;
  marketState?: string;
  buyStrategy?: string;
  technicalPattern?: TechnicalPattern;
  patternRemark?: string;
  reviewDecision?: ReviewDecision;
  decisionReason?: string;
  stopLossPrice?: number;
  targetPrice?: number;
  takeProfitPrice?: number;
  trackingAnalysis?: string;
  watchingOutcome?: WatchingOutcome;
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
  status: StockStatus;
  createdAt: string;
  updatedAt: string;
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
