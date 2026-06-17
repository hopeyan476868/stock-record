export type StrategyRuleAction = 'buy' | 'avoid' | 'manage';

export interface StrategyRule {
  action: StrategyRuleAction;
  title: string;
  description: string;
  allowedStrategies: string[];
}

export const TREND_STATE_OPTIONS: Record<string, string[]> = {
  上涨趋势: ['强上升', '普通上升', '上涨回调', '高位加速', '高位震荡', '破位反弹'],
  下降趋势: ['反弹', '震荡区间'],
  区间震荡: ['区间中部', '区间下沿', '区间上沿', '上沿突破'],
};

export const PATTERN_REMARK_OPTIONS = ['平台整理', '三角整理', '杯柄', '双底', '头肩顶', '楔形三推', '窄通道'];

const defaultRule: StrategyRule = {
  action: 'buy',
  title: '可按计划评估',
  description: '当前组合没有硬性禁止规则，按形态、风控和基本面检查继续。',
  allowedStrategies: [],
};

function normalizeTrend(value?: string): string {
  if (value === '上升') return '上涨趋势';
  if (value === '下降') return '下降趋势';
  if (value === '区间') return '区间震荡';
  return value || '';
}

function normalizeState(value?: string): string {
  if (value === '下降反弹') return '反弹';
  return value || '';
}

export function getStrategyRule(trendValue?: string, stateValue?: string): StrategyRule {
  const trend = normalizeTrend(trendValue);
  const state = normalizeState(stateValue);

  if (trend === '上涨趋势' && state === '强上升') {
    return {
      action: 'buy',
      title: '强上升：可以激进一点，H1 可用',
      description: '连续推升、回调浅，说明主动买盘仍强。买入建议：优先强趋势小回调 H1；次选 EMA20 附近 H2 或突破回踩。若价格离 EMA20 过远，应切到高位加速，只做持仓管理。',
      allowedStrategies: ['强趋势小回调H1', 'EMA20附近H2', '突破回踩'],
    };
  }

  if (trend === '上涨趋势' && state === '普通上升') {
    return {
      action: 'buy',
      title: '普通上升：不能用 H1，等 H2 或突破回踩',
      description: '正常上升但动量不算极强，H1 容易买早。买入建议：等 EMA20 附近 H2、前高/平台突破后的回踩确认，或突破回踩后再介入。',
      allowedStrategies: ['EMA20附近H2', '前高回踩', '突破回踩'],
    };
  }

  if (trend === '上涨趋势' && state === '上涨回调') {
    return {
      action: 'buy',
      title: '上涨回调：趋势未坏，等回调结束信号',
      description: '价格从上升段回落，但尚未破坏关键低点或趋势均线。买入建议：不在下跌过程中提前接，等回调低位 H2、EMA20 附近 H2、前高回踩不破，或强板块回调转强。',
      allowedStrategies: ['回调低位H2', 'EMA20附近H2', '前高回踩', '强板块回调转强'],
    };
  }

  if (trend === '上涨趋势' && state === '高位加速') {
    return {
      action: 'manage',
      title: '高位加速：不新开仓，只做持仓管理',
      description: '连续加速上涨后，风险收益比通常变差，容易进入情绪化追涨区。买入建议：不新开仓；已有持仓只做止盈、移动止损和仓位管理。',
      allowedStrategies: ['持仓管理'],
    };
  }

  if (trend === '上涨趋势' && state === '高位震荡') {
    return {
      action: 'buy',
      title: '高位震荡：上涨后横盘，等边界信号',
      description: '大背景仍是上涨，但价格在高位横盘整理，例如 20 根 K 线平台。买入建议：不在区间中部买；等平台突破、突破回踩，或区间下沿假破收回/区间下沿 H2。',
      allowedStrategies: ['平台突破', '突破回踩', '区间下沿假破收回', '区间下沿H2'],
    };
  }

  if (trend === '上涨趋势' && state === '破位反弹') {
    return {
      action: 'avoid',
      title: '破位反弹：结构受损，默认不买',
      description: '上涨结构已经被破坏，当前反弹可能只是反抽。买入建议：默认不买；至少等重新站回关键位，并重新形成有效上升结构后再评估。',
      allowedStrategies: ['不买', '等重新站回关键位'],
    };
  }

  if (trend === '下降趋势' && state === '反弹') {
    return {
      action: 'avoid',
      title: '下降趋势反弹不买',
      description: '反弹不等于趋势扭转，避免把反抽当反转。',
      allowedStrategies: ['不买'],
    };
  }

  if (trend === '下降趋势' && state === '震荡区间') {
    return {
      action: 'avoid',
      title: '下降趋势里的震荡区间只观察',
      description: '这可能是下跌中继、底部构筑或趋势转换早期；先不买，等假破收回或重新转为区间/上涨结构。',
      allowedStrategies: ['不买', '只观察', '假破收回观察'],
    };
  }

  if (trend === '区间震荡' && state === '区间中部') {
    return {
      action: 'avoid',
      title: '区间中部不买',
      description: '中部位置优势不清晰，等待靠近边界。',
      allowedStrategies: ['不买', '只观察'],
    };
  }

  if (trend === '区间震荡' && state === '区间下沿') {
    return {
      action: 'buy',
      title: '等假破收回或双底',
      description: '区间下沿只接受确认型低吸，不提前赌反转。',
      allowedStrategies: ['区间下沿假破收回', '双底右侧确认'],
    };
  }

  if (trend === '区间震荡' && state === '区间上沿') {
    return {
      action: 'avoid',
      title: '区间上沿不追买',
      description: '上沿本身是压力位，先等待有效突破，或突破后回踩不破。',
      allowedStrategies: ['不买', '等待突破'],
    };
  }

  if (trend === '区间震荡' && state === '上沿突破') {
    return {
      action: 'buy',
      title: '等平台突破或突破回踩',
      description: '区间上沿要看到有效突破，或者突破后的回踩确认。',
      allowedStrategies: ['平台突破', '突破回踩'],
    };
  }

  return defaultRule;
}

export function getStateOptionsForTrend(trendValue?: string): string[] {
  return TREND_STATE_OPTIONS[normalizeTrend(trendValue)] || [];
}

export function getBuyPositionOptions(trendValue?: string, stateValue?: string): string[] {
  const rule = getStrategyRule(trendValue, stateValue);
  if (rule.allowedStrategies.length > 0) return rule.allowedStrategies;
  if (rule.action === 'avoid') return ['不买'];
  if (rule.action === 'manage') return ['持仓管理'];
  return ['平台突破', '突破回踩', 'EMA20附近H2', '强趋势小回调H1', '回调低位H2', '前高回踩', '区间下沿假破收回', '区间下沿H2', '强板块回调转强'];
}

export function getStrategyRuleTone(action: StrategyRuleAction): string {
  if (action === 'buy') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (action === 'manage') return 'border-amber-200 bg-amber-50 text-amber-800';
  return 'border-red-200 bg-red-50 text-red-800';
}
