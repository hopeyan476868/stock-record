const TREND_OPTIONS_KEY = 'stock_record_trend_options';
const MARKET_STATE_OPTIONS_KEY = 'stock_record_market_state_options';
const BUY_STRATEGY_OPTIONS_KEY = 'stock_record_buy_strategy_options';
const PATTERN_REMARK_OPTIONS_KEY = 'stock_record_pattern_remark_options';

export const DEFAULT_TREND_OPTIONS = ['上涨趋势', '下降趋势', '区间震荡'];
export const DEFAULT_MARKET_STATE_OPTIONS = ['强上升', '普通上升', '高位加速', '破位反弹', '反弹', '震荡区间', '区间中部', '区间下沿', '区间上沿', '上沿突破'];
export const DEFAULT_BUY_STRATEGY_OPTIONS = ['强趋势小回调H1', 'EMA20附近H2', '突破回踩', '平台突破', '区间下沿假破收回', '双底右侧确认', '不买', '只观察', '假破收回观察', '等待突破', '等重新站回关键位', '持仓管理'];
export const DEFAULT_PATTERN_REMARK_OPTIONS = ['平台整理', '三角整理', '杯柄', '双底', '头肩顶', '楔形三推', '窄通道'];
export const DEFAULT_TECHNICAL_PATTERNS = DEFAULT_BUY_STRATEGY_OPTIONS;

function normalizeOptions(options: unknown, defaults = DEFAULT_TECHNICAL_PATTERNS): string[] {
  if (!Array.isArray(options)) return [...defaults];
  const cleaned = options
    .map((item) => String(item || '').trim())
    .filter(Boolean);
  const unique = Array.from(new Set(cleaned));
  return unique.length ? unique : [...defaults];
}

export function loadStockOptions(key: string, defaults: string[]): string[] {
  if (typeof window === 'undefined') return [...defaults];
  try {
    const raw = window.localStorage.getItem(key);
    const stored = normalizeOptions(raw ? JSON.parse(raw) : defaults, defaults);
    return normalizeOptions([...defaults, ...stored], defaults);
  } catch (_error) {
    return [...defaults];
  }
}

export function saveStockOptions(key: string, options: string[], defaults: string[]): string[] {
  const normalized = normalizeOptions(options, defaults);
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(key, JSON.stringify(normalized));
  }
  return normalized;
}

export function loadTrendOptions(): string[] {
  return loadStockOptions(TREND_OPTIONS_KEY, DEFAULT_TREND_OPTIONS);
}

export function saveTrendOptions(options: string[]): string[] {
  return saveStockOptions(TREND_OPTIONS_KEY, options, DEFAULT_TREND_OPTIONS);
}

export function loadMarketStateOptions(): string[] {
  return loadStockOptions(MARKET_STATE_OPTIONS_KEY, DEFAULT_MARKET_STATE_OPTIONS);
}

export function saveMarketStateOptions(options: string[]): string[] {
  return saveStockOptions(MARKET_STATE_OPTIONS_KEY, options, DEFAULT_MARKET_STATE_OPTIONS);
}

export function loadBuyStrategyOptions(): string[] {
  return loadStockOptions(BUY_STRATEGY_OPTIONS_KEY, DEFAULT_BUY_STRATEGY_OPTIONS);
}

export function saveBuyStrategyOptions(options: string[]): string[] {
  return saveStockOptions(BUY_STRATEGY_OPTIONS_KEY, options, DEFAULT_BUY_STRATEGY_OPTIONS);
}

export function loadPatternRemarkOptions(): string[] {
  return loadStockOptions(PATTERN_REMARK_OPTIONS_KEY, DEFAULT_PATTERN_REMARK_OPTIONS);
}

export function savePatternRemarkOptions(options: string[]): string[] {
  return saveStockOptions(PATTERN_REMARK_OPTIONS_KEY, options, DEFAULT_PATTERN_REMARK_OPTIONS);
}

export function loadTechnicalPatternOptions(): string[] {
  return loadBuyStrategyOptions();
}

export function saveTechnicalPatternOptions(options: string[]): string[] {
  return saveBuyStrategyOptions(options);
}
