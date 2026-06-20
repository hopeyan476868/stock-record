import { z } from 'zod';

export const BuyStockSchema = z.object({
  status: z.literal('holding'),
  marketTag: z.enum(['A股', '美股']).optional(),
  name: z.string().min(1, '股票名称不能为空'),
  buyQuantity: z.number().int().positive('买入数量必须为正数').optional(),
  triggerTime: z.string().optional(),
  triggerPrice: z.number().min(0).optional(),
  buyPrice: z.number().positive('买入价格必须为正数'),
  buyDate: z.string().min(1, '买入日期不能为空'),
  buyReason: z.string().min(1, '买入策略不能为空'),
  buyPsychology: z.string().optional(),
  emotionTag: z.enum(['FOMO', '理性', '犹豫']).optional(),

  // 基本面检查
  parentNetProfitGrowthOk: z.boolean().optional(),
  grossMarginOk: z.boolean().optional(),
  netProfitMarginOk: z.boolean().optional(),
  assetLiabilityRatioOk: z.boolean().optional(),
  riskRewardOk: z.boolean().optional(),

  // 换手率（用户填数字，>15% 时需确认方向）
  turnoverRate: z.number().min(0).optional(),
  turnoverDirection: z.enum(['net_inflow', 'net_outflow']).optional(),

  weeklyCloseAboveEma20Ok: z.boolean().optional(),

  // 价格行为策略
  marketBackground: z.enum(['BULL_TREND', 'BEAR_TREND', 'TRADING_RANGE']).optional(),
  positionPhase: z.enum(['PULLBACK', 'CONSOLIDATION', 'ACCELERATION', 'BOUNCE', 'REVERSAL_TRY', 'LOWER_EDGE', 'MIDDLE', 'UPPER_EDGE', 'IN_RANGE_CONSOLIDATION']).optional(),
  concretePattern: z.enum([
    'SHALLOW_PULLBACK', 'EMA21_TOUCH', 'CHANNEL_PULLBACK', 'DOUBLE_BOTTOM', 'DEEP_PULLBACK_HL_INTACT',
    'HORIZONTAL_PLATFORM', 'TRIANGLE_CONTRACTION', 'CUP_HANDLE', 'WEDGE',
    'BOUNCE_TO_RESISTANCE',
    'FAILED_BREAKDOWN_RECLAIM', 'BULL_ENGULF_LOWER_EDGE',
    'VALID_BREAKOUT', 'BREAKOUT_PULLBACK',
    'REVERSAL_BREAKOUT_RETEST', 'DOUBLE_BOTTOM_CONFIRM',
    'NONE'
  ]).optional(),

  // 推导结果（系统填充）
  strategyDecision: z.enum(['BUY', 'WATCH', 'DO_NOT_BUY', 'PASS']).optional(),
  entryType: z.string().optional(),
  strategyNote: z.string().optional(),

  // 交易计划
  stopLossPrice: z.number().min(0).optional(),
  targetPrice: z.number().min(0).optional(),
  takeProfitPrice: z.number().min(0).optional(),
  reviewDecision: z.enum(['pending', 'approved', 'rejected']).optional(),
  decisionReason: z.string().optional(),
  trackingAnalysis: z.string().optional(),
  watchingOutcome: z.enum(['pending', 'success', 'failed']).optional(),
});

export const SellStockSchema = z.object({
  sellPrice: z.number().positive('卖出价格必须为正数'),
  sellDate: z.string().min(1, '卖出日期不能为空'),
  sellQuantity: z.number().int().positive('卖出数量必须为正数').optional(),
  sellEmotionTag: z.enum(['FOMO', '理性', '犹豫']).optional(),
  sellType: z.enum(['take_profit', 'stop_loss']).optional(),
  sellPsychology: z.string().optional(),
  sellExecutionCheck: z.enum(['是', '否', '部分执行']).optional(),
  patternBroken: z.boolean().optional(),
  stopLossHit: z.boolean().optional(),
  takeProfitHit: z.boolean().optional(),
  reversalCandle: z.boolean().optional(),
  sellSummary: z.string().optional(),
});

export type BuyStockInput = z.infer<typeof BuyStockSchema>;
export type SellStockInput = z.infer<typeof SellStockSchema>;
