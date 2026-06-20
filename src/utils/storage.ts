import type { Stock, Stats, ReasonStat } from '@/types/api';
import { isSupabaseConfigured, supabase } from '@/utils/supabase';
import { evaluateBuyStrategy, getStrategySummary, migrateLegacyStrategy } from '@/utils/buyStrategyEngine';

const STORAGE_KEY = 'stock_investment_records';
const CLOUD_TABLE = 'stock_records';

type CloudStockRow = {
  id: string;
  record: Stock;
  created_at: string;
  updated_at: string;
};

function readLegacyLocalStorage(): Stock[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? (JSON.parse(data) as Stock[]) : [];
  } catch (_error) {
    return [];
  }
}

function writeLegacyLocalStorage(stocks: Stock[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stocks));
}

async function getCurrentUser() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}

function normalizeLoadedStock(stock: Stock): Stock {
  // Migrate legacy strategy fields
  const legacyStrategy = migrateLegacyStrategy(stock);
  const strategyOutput = evaluateBuyStrategy({
    ...legacyStrategy,
    volumePriceConfirmed: Boolean(stock.volumePriceConfirmed),
  });

  // Keep the current checklist explicit; old thresholds are not equivalent.
  const normalized: Stock = {
    ...stock,
    revenueGrowthOk: stock.revenueGrowthOk ?? false,
    deductedNetProfitGrowthOk: stock.deductedNetProfitGrowthOk ?? false,
    grossMarginChangeOk: stock.grossMarginChangeOk ?? false,
    roicOk: stock.roicOk ?? false,
    operatingCashFlowPositiveOk: stock.operatingCashFlowPositiveOk ?? false,
    riskRewardOk: stock.riskRewardOk ?? false,
    volumePriceConfirmed: stock.volumePriceConfirmed ?? false,
    weeklyCloseAboveEma20Ok: stock.weeklyCloseAboveEma20Ok ?? false,
    // Strategy fields
    marketBackground: legacyStrategy.marketBackground,
    tradingScenario: legacyStrategy.tradingScenario,
    entryTrigger: legacyStrategy.entryTrigger,
    strategyDecision: strategyOutput.decision,
    entryType: strategyOutput.entryType,
    strategyNote: strategyOutput.note,
  };

  if (stock.status !== 'watching') return normalized;
  return {
    ...normalized,
    status: 'holding',
    reviewDecision: stock.reviewDecision === 'rejected' ? 'rejected' : 'approved',
    watchingOutcome: undefined,
  };
}

async function readCloudStocks(): Promise<Stock[] | null> {
  if (!supabase) return null;
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from(CLOUD_TABLE)
    .select('id, record, created_at, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) throw new Error(`云端读取失败：${error.message}`);
  const stocks = ((data || []) as CloudStockRow[]).map((row) => normalizeLoadedStock(row.record));
  writeLegacyLocalStorage(stocks);
  return stocks;
}

async function writeCloudStocks(stocks: Stock[]): Promise<boolean> {
  if (!supabase) return false;
  const user = await getCurrentUser();
  if (!user) return false;

  const { data: existingRows, error: readError } = await supabase
    .from(CLOUD_TABLE)
    .select('id')
    .eq('user_id', user.id);

  if (readError) throw new Error(`云端同步失败：${readError.message}`);

  const nextIds = new Set(stocks.map((stock) => stock.id));
  const removedIds = ((existingRows || []) as Array<{ id: string }>)
    .map((row) => row.id)
    .filter((id) => !nextIds.has(id));

  if (removedIds.length) {
    const { error } = await supabase.from(CLOUD_TABLE).delete().in('id', removedIds);
    if (error) throw new Error(`云端删除失败：${error.message}`);
  }

  if (stocks.length) {
    const rows = stocks.map((stock) => ({
      id: stock.id,
      user_id: user.id,
      record: stock,
      created_at: stock.createdAt,
      updated_at: stock.updatedAt,
    }));
    const { error } = await supabase.from(CLOUD_TABLE).upsert(rows, { onConflict: 'id' });
    if (error) throw new Error(`云端保存失败：${error.message}`);
  }

  writeLegacyLocalStorage(stocks);
  return true;
}

async function getAll(): Promise<Stock[]> {
  const cloudStocks = await readCloudStocks();
  if (cloudStocks) return cloudStocks;
  return readLegacyLocalStorage().map(normalizeLoadedStock);
}

async function saveAll(stocks: Stock[], _reason = 'manual'): Promise<void> {
  if (await writeCloudStocks(stocks)) return;
  writeLegacyLocalStorage(stocks);
}

export async function seedInitialStocks(stocks: Stock[]): Promise<void> {
  if ((await getAll()).length > 0) return;
  await saveAll(stocks, 'seed');
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function normalizeStockForSave(stock: Partial<Stock> & { name: string; buyPrice: number; buyDate: string }): Stock {
  const legacyStrategy = migrateLegacyStrategy(stock);
  const strategyInput = { ...legacyStrategy, volumePriceConfirmed: Boolean(stock.volumePriceConfirmed) };
  const strategyOutput = evaluateBuyStrategy(strategyInput);

  const trigger = Number(stock.triggerPrice || 0);
  const stop = Number(stock.stopLossPrice || 0);
  const target = Number(stock.targetPrice || 0);
  const riskRewardOk = stop < trigger && trigger < target && (target - trigger) / (trigger - stop) >= 2;

  const now = new Date().toISOString();
  return {
    id: stock.id || generateId(),
    marketTag: stock.marketTag || 'A股',
    name: stock.name,
    buyQuantity: stock.buyQuantity || undefined,
    triggerTime: stock.triggerTime || now,
    triggerPrice: stock.triggerPrice == null ? undefined : Number(stock.triggerPrice),
    buyPrice: Number(stock.buyPrice),
    buyDate: stock.buyDate,
    buyReason: stock.buyReason || '',
    buyPsychology: stock.buyPsychology || '',
    emotionTag: stock.emotionTag || '理性',

    revenueGrowthOk: Boolean(stock.revenueGrowthOk),
    deductedNetProfitGrowthOk: Boolean(stock.deductedNetProfitGrowthOk),
    grossMarginChangeOk: Boolean(stock.grossMarginChangeOk),
    roicOk: Boolean(stock.roicOk),
    operatingCashFlowPositiveOk: Boolean(stock.operatingCashFlowPositiveOk),
    riskRewardOk,
    volumePriceConfirmed: Boolean(stock.volumePriceConfirmed),
    turnoverRate: stock.turnoverRate,
    turnoverDirection: stock.turnoverDirection,
    weeklyCloseAboveEma20Ok: Boolean(stock.weeklyCloseAboveEma20Ok),

    marketBackground: legacyStrategy.marketBackground,
    tradingScenario: legacyStrategy.tradingScenario,
    entryTrigger: legacyStrategy.entryTrigger,
    strategyDecision: strategyOutput.decision,
    entryType: strategyOutput.entryType,
    strategyNote: strategyOutput.note,

    reviewDecision: stock.reviewDecision || 'approved',
    decisionReason: stock.decisionReason?.trim() || '',

    stopLossPrice: stock.stopLossPrice == null ? undefined : Number(stock.stopLossPrice),
    targetPrice: stock.targetPrice == null ? undefined : Number(stock.targetPrice),
    takeProfitPrice: stock.targetPrice == null ? undefined : Number(stock.targetPrice),
    trackingAnalysis: stock.trackingAnalysis || '',
    watchingOutcome: stock.watchingOutcome,

    status: stock.status === 'sold' ? 'sold' : 'holding',
    createdAt: stock.createdAt || now,
    updatedAt: now,
  };
}

export async function getStockList(): Promise<{ data: Stock[] }> {
  await new Promise((resolve) => setTimeout(resolve, 100));
  const stocks = (await getAll()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return { data: stocks };
}

export async function addStock(data: Partial<Stock> & { name: string; buyPrice: number; buyDate: string }): Promise<{ data: Stock }> {
  await new Promise((resolve) => setTimeout(resolve, 100));
  const stocks = await getAll();
  const newStock = normalizeStockForSave(data);
  newStock.id = generateId();
  stocks.push(newStock);
  await saveAll(stocks, 'add');
  return { data: newStock };
}

export async function updateStock(
  id: string,
  data: Partial<Stock> & { name: string; buyPrice: number; buyDate: string }
): Promise<{ data: Stock }> {
  await new Promise((resolve) => setTimeout(resolve, 100));
  const stocks = await getAll();
  const index = stocks.findIndex((s) => s.id === id);
  if (index === -1) throw new Error('股票记录不存在');

  stocks[index] = {
    ...stocks[index],
    ...normalizeStockForSave(data),
    updatedAt: new Date().toISOString(),
  };
  await saveAll(stocks, 'update');
  return { data: stocks[index] };
}

export async function sellStock(
  id: string,
  data: {
    sellPrice: number;
    sellDate: string;
    sellQuantity?: number;
    sellPsychology?: string;
    sellEmotionTag?: Stock['emotionTag'];
    sellType?: Stock['sellType'];
    sellExecutionCheck?: Stock['sellExecutionCheck'];
    patternBroken?: boolean;
    stopLossHit?: boolean;
    takeProfitHit?: boolean;
    reversalCandle?: boolean;
    sellSummary?: string;
  }
): Promise<{ data: Stock; records: Stock[] }> {
  await new Promise((resolve) => setTimeout(resolve, 100));
  const stocks = await getAll();
  const index = stocks.findIndex((s) => s.id === id);
  if (index === -1) throw new Error('股票记录不存在');

  const source = stocks[index];
  const heldQuantity = source.buyQuantity;
  const requestedSellQuantity = data.sellQuantity == null ? undefined : Number(data.sellQuantity);
  if (requestedSellQuantity != null && (!Number.isFinite(requestedSellQuantity) || requestedSellQuantity <= 0)) {
    throw new Error('卖出数量必须大于 0');
  }
  if (heldQuantity != null && requestedSellQuantity != null && requestedSellQuantity > heldQuantity) {
    throw new Error('卖出数量不能大于当前持仓数量');
  }

  const now = new Date().toISOString();
  const isPartialSell = heldQuantity != null && requestedSellQuantity != null && requestedSellQuantity < heldQuantity;

  if (isPartialSell) {
    const soldRecord: Stock = {
      ...source,
      ...data,
      id: generateId(),
      buyQuantity: requestedSellQuantity,
      sellQuantity: requestedSellQuantity,
      status: 'sold',
      createdAt: data.sellDate || now,
      updatedAt: now,
    };
    stocks[index] = {
      ...source,
      buyQuantity: heldQuantity - requestedSellQuantity,
      updatedAt: now,
    };
    stocks.push(soldRecord);
    await saveAll(stocks, 'partial-sell');
    return { data: soldRecord, records: stocks };
  }

  stocks[index] = {
    ...source,
    ...data,
    sellQuantity: requestedSellQuantity ?? heldQuantity,
    status: 'sold',
    updatedAt: now,
  };
  await saveAll(stocks, 'sell');
  return { data: stocks[index], records: stocks };
}

export async function deleteStock(id: string): Promise<{ message: string }> {
  await new Promise((resolve) => setTimeout(resolve, 100));
  const stocks = await getAll();
  const index = stocks.findIndex((s) => s.id === id);
  if (index === -1) throw new Error('股票记录不存在');

  stocks.splice(index, 1);
  await saveAll(stocks, 'delete');
  return { message: '删除成功' };
}

export async function createStockBackup(): Promise<{ backupPath: string } | null> {
  return null;
}

export function isCloudSyncConfigured(): boolean {
  return isSupabaseConfigured;
}

export async function getCurrentUserEmail(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.email || null;
}

export function onCloudAuthChange(callback: (email: string | null) => void): () => void {
  if (!supabase) return () => undefined;
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user.email || null);
  });
  return () => data.subscription.unsubscribe();
}

export async function signInToCloud(email: string, password: string): Promise<void> {
  if (!supabase) throw new Error('Supabase 未配置');
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
}

export async function signUpToCloud(email: string, password: string): Promise<void> {
  if (!supabase) throw new Error('Supabase 未配置');
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) throw new Error(error.message);
}

export async function signOutFromCloud(): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function syncLocalRecordsToCloud(): Promise<number> {
  const localStocks = readLegacyLocalStorage().map(normalizeLoadedStock);
  const cloudStocks = (await readCloudStocks()) || [];
  const merged = new Map<string, Stock>();

  [...cloudStocks, ...localStocks].forEach((stock) => {
    const current = merged.get(stock.id);
    if (!current || new Date(stock.updatedAt).getTime() >= new Date(current.updatedAt).getTime()) {
      merged.set(stock.id, stock);
    }
  });

  const mergedStocks = [...merged.values()];
  await saveAll(mergedStocks, 'local-to-cloud-sync');
  return mergedStocks.length;
}

export async function getStats(): Promise<{ data: Stats }> {
  await new Promise((resolve) => setTimeout(resolve, 100));
  const stocks = await getAll();

  const holdingStocks = stocks.filter((s) => s.status === 'holding');
  const soldStocks = stocks.filter((s) => s.status === 'sold');
  const reviewedStocks = stocks.filter((s) => s.reviewDecision === 'approved' || s.reviewDecision === 'rejected');
  const approvedReviewChecks = reviewedStocks.filter((s) => s.reviewDecision === 'approved').length;
  const reviewPassRate = reviewedStocks.length > 0 ? (approvedReviewChecks / reviewedStocks.length) * 100 : 0;

  const profitableStocks = soldStocks.filter((s) => (s.sellPrice || 0) > s.buyPrice);
  const evaluatedCount = soldStocks.length;
  const successCount = profitableStocks.length;
  const successRate = evaluatedCount > 0 ? (successCount / evaluatedCount) * 100 : 0;

  let maxDrawdown = 0;
  soldStocks.forEach((stock) => {
    const buyPrice = stock.buyPrice;
    const sellPrice = stock.sellPrice || 0;
    const drawdown = ((buyPrice - sellPrice) / buyPrice) * 100;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  });

  const totalBuyCost = [...holdingStocks, ...soldStocks].reduce((sum, s) => sum + s.buyPrice, 0);
  const totalSellValue = soldStocks.reduce((sum, s) => sum + (s.sellPrice || 0), 0);
  const holdingValue = holdingStocks.reduce((sum, s) => sum + s.buyPrice, 0);
  const totalReturn = totalBuyCost > 0 ? ((totalSellValue + holdingValue - totalBuyCost) / totalBuyCost) * 100 : 0;

  const reasonStats: ReasonStat[] = [];
  const reasonGroups = stocks.reduce((acc, stock) => {
    const strategyKey = getStrategySummary(migrateLegacyStrategy(stock));
    if (!acc[strategyKey]) acc[strategyKey] = [];
    acc[strategyKey].push(stock);
    return acc;
  }, {} as Record<string, Stock[]>);

  Object.keys(reasonGroups).forEach((reason) => {
    const group = reasonGroups[reason];
    const soldGroup = group.filter((s) => s.status === 'sold');
    const profitableGroup = soldGroup.filter((s) => (s.sellPrice || 0) > s.buyPrice);
    const avgReturn = soldGroup.length > 0
      ? soldGroup.reduce((sum, s) => sum + (((s.sellPrice || 0) - s.buyPrice) / s.buyPrice) * 100, 0) / soldGroup.length
      : 0;
    const evaluatedGroupCount = soldGroup.length;
    const groupSuccessCount = profitableGroup.length;

    reasonStats.push({
      reason,
      count: group.length,
      successCount: groupSuccessCount,
      successRate: evaluatedGroupCount > 0 ? (groupSuccessCount / evaluatedGroupCount) * 100 : 0,
      avgReturn,
    });
  });

  return {
    data: {
      totalStocks: stocks.length,
      holdingStocks: holdingStocks.length,
      soldStocks: soldStocks.length,
      watchingStocks: 0,
      totalReviewChecks: reviewedStocks.length,
      approvedReviewChecks,
      reviewPassRate,
      successRate,
      maxDrawdown,
      totalReturn,
      reasonStats,
    },
  };
}
