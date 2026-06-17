export type StrategyRuleAction = 'buy' | 'avoid' | 'manage';

export interface StrategyRule {
  action: StrategyRuleAction;
  title: string;
  description: string;
  allowedStrategies: string[];
}

export const TREND_STATE_OPTIONS: Record<string, string[]> = {
  上涨趋势: ['强上升', '普通上升', '高位加速', '破位反弹'],
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
      title: '可以激进一点，H1 可用',
      description: '强趋势背景里允许用更紧凑的小回调买点；若连续加速且离 EMA20 过远，应切到高位加速，只做持仓管理。',
      allowedStrategies: ['强趋势小回调H1', 'EMA20附近H2', '突破回踩'],
    };
  }

  if (trend === '上涨趋势' && state === '普通上升') {
    return {
      action: 'buy',
      title: '不能用 H1，等 H2 或突破回踩',
      description: '普通上升的动量不够强，买点要降低追高概率。',
      allowedStrategies: ['EMA20附近H2', '突破回踩'],
    };
  }

  if (trend === '上涨趋势' && state === '高位加速') {
    return {
      action: 'manage',
      title: '不新开仓，只做持仓管理',
      description: '高位加速阶段容易进入情绪化追涨区，新记录默认不通过。',
      allowedStrategies: ['持仓管理'],
    };
  }

  if (trend === '上涨趋势' && state === '破位反弹') {
    return {
      action: 'avoid',
      title: '结构受损，默认不买',
      description: '等重新站回关键位并形成新的有效结构后再评估。',
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
  return ['平台突破', '突破回踩', 'EMA20附近H2', '强趋势小回调H1', '区间下沿假破收回', '强板块回调转强'];
}

export function getStrategyRuleTone(action: StrategyRuleAction): string {
  if (action === 'buy') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (action === 'manage') return 'border-amber-200 bg-amber-50 text-amber-800';
  return 'border-red-200 bg-red-50 text-red-800';
}
