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
  revenueGrowthOk: z.boolean().optional(),
  deductedNetProfitGrowthOk: z.boolean().optional(),
  grossMarginChangeOk: z.boolean().optional(),
  roicOk: z.boolean().optional(),
  operatingCashFlowPositiveOk: z.boolean().optional(),
  riskRewardOk: z.boolean().optional(),

  // 换手率（用户填数字，>15% 时需确认方向）
  turnoverRate: z.number().min(0).optional(),
  turnoverDirection: z.enum(['net_inflow', 'net_outflow']).optional(),

  weeklyCloseAboveEma20Ok: z.boolean().optional(),

  // 价格行为策略
  marketBackground: z.enum(['STRONG_UP', 'NORMAL_UP', 'TRADING_RANGE', 'DOWN_TREND', 'UNCLEAR']).optional(),
  tradingScenario: z.enum([
    'SHALLOW_PULLBACK', 'TWO_LEG_PULLBACK', 'PLATFORM_CONSOLIDATION', 'FIRST_BREAKOUT_RETEST',
    'DEEP_PULLBACK_DOUBLE_BOTTOM', 'DEEP_PULLBACK_BREAK_LH_RETEST', 'OVERHEATED',
    'RANGE_LOWER_DOUBLE_BOTTOM', 'RANGE_LOWER_THREE_PUSH', 'RANGE_LOWER_BULL_ENGULF',
    'RANGE_FAILED_BREAKDOWN_ZONE', 'RANGE_UPPER_TEST', 'RANGE_UPPER_RETEST', 'RANGE_MIDDLE',
    'DOWN_THREE_PUSH_SUPPORT', 'DOWN_BREAK_LH_FIRST_PULLBACK', 'DOWN_BOUNCE_RESISTANCE', 'NO_SCENARIO'
  ]).optional(),
  entryTrigger: z.enum([
    'H1_CONFIRM', 'H2_CONFIRM', 'BULL_ENGULF_HIGH_BREAK', 'VOLUME_BREAKOUT',
    'RETEST_TURN_STRONG', 'FAILED_BREAKDOWN_CONFIRM', 'NECKLINE_BREAK', 'NONE'
  ]).optional(),
  volumePriceConfirmed: z.boolean().optional(),

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
