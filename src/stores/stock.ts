import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Stock, Stats } from '@/types/api';
import {
  getStockList,
  addStock,
  sellStock,
  deleteStock,
  getStats,
  seedInitialStocks,
  updateStock,
  createStockBackup,
  getCurrentUserEmail,
  isCloudSyncConfigured,
  onCloudAuthChange,
  signInToCloud,
  signOutFromCloud,
  signUpToCloud,
  syncLocalRecordsToCloud,
} from '@/utils/storage';
import { providedStocks } from '@/data/providedStocks';

export const useStockStore = defineStore('stock', () => {
  // 状态
  const stocks = ref<Stock[]>([]);
  const stats = ref<Stats | null>(null);
  const loading = ref(false);
  const bootstrapping = ref(true);
  const error = ref<string | null>(null);
  const userEmail = ref<string | null>(null);
  const cloudConfigured = ref(isCloudSyncConfigured());
  let unsubscribeAuth: (() => void) | null = null;

  // 计算属性
  const holdingStocks = computed(() => stocks.value.filter(s => s.status === 'holding'));
  const soldStocks = computed(() => stocks.value.filter(s => s.status === 'sold'));
  const watchingStocks = computed(() => stocks.value.filter(s => s.status === 'watching'));

  // 初始化
  async function init() {
    bootstrapping.value = true;
    error.value = null;

    try {
      userEmail.value = await getCurrentUserEmail();
      if (!unsubscribeAuth) {
        unsubscribeAuth = onCloudAuthChange(async (email) => {
          userEmail.value = email;
          await Promise.all([fetchStocks(), fetchStats()]);
        });
      }
      await seedInitialStocks(providedStocks);
      await Promise.all([fetchStocks(), fetchStats()]);
    } finally {
      bootstrapping.value = false;
    }
  }

  // 获取股票列表
  async function fetchStocks() {
    loading.value = true;
    error.value = null;
    try {
      const res = await getStockList();
      stocks.value = res.data;
    } catch (e) {
      error.value = e instanceof Error ? e.message : '获取数据失败';
    } finally {
      loading.value = false;
    }
  }

  // 获取统计数据
  async function fetchStats() {
    try {
      const res = await getStats();
      stats.value = res.data;
    } catch (e) {
      error.value = e instanceof Error ? e.message : '获取统计数据失败';
    }
  }

  // 添加股票
  async function createStock(data: Omit<Stock, 'id' | 'createdAt' | 'updatedAt'>) {
    loading.value = true;
    error.value = null;
    try {
      const res = await addStock(data);
      stocks.value.unshift(res.data);
      await fetchStats();
      return res.data;
    } catch (e) {
      error.value = e instanceof Error ? e.message : '添加失败';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  // 卖出股票
  async function closeStock(id: string, data: {
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
  }) {
    loading.value = true;
    error.value = null;
    try {
      const res = await sellStock(id, {
        sellPrice: data.sellPrice,
        sellDate: data.sellDate,
        sellQuantity: data.sellQuantity,
        sellPsychology: data.sellPsychology,
        sellEmotionTag: data.sellEmotionTag,
        sellType: data.sellType,
        sellExecutionCheck: data.sellExecutionCheck,
        patternBroken: data.patternBroken,
        stopLossHit: data.stopLossHit,
        takeProfitHit: data.takeProfitHit,
        reversalCandle: data.reversalCandle,
        sellSummary: data.sellSummary,
      });
      await Promise.all([fetchStocks(), fetchStats()]);
      return res.data;
    } catch (e) {
      error.value = e instanceof Error ? e.message : '卖出失败';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function editStock(id: string, data: Omit<Stock, 'id' | 'createdAt' | 'updatedAt'>) {
    loading.value = true;
    error.value = null;
    try {
      const res = await updateStock(id, data);
      const index = stocks.value.findIndex(s => s.id === id);
      if (index !== -1) {
        stocks.value[index] = res.data;
      }
      await fetchStats();
      return res.data;
    } catch (e) {
      error.value = e instanceof Error ? e.message : '修改失败';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  // 删除记录
  async function removeStock(id: string) {
    loading.value = true;
    error.value = null;
    try {
      await deleteStock(id);
      stocks.value = stocks.value.filter(s => s.id !== id);
      await fetchStats();
    } catch (e) {
      error.value = e instanceof Error ? e.message : '删除失败';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function backupStocks() {
    loading.value = true;
    error.value = null;
    try {
      const result = await createStockBackup();
      return result;
    } catch (e) {
      error.value = e instanceof Error ? e.message : '备份失败';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function login(email: string, password: string) {
    loading.value = true;
    error.value = null;
    try {
      await signInToCloud(email, password);
      userEmail.value = await getCurrentUserEmail();
      await Promise.all([fetchStocks(), fetchStats()]);
    } catch (e) {
      error.value = e instanceof Error ? e.message : '登录失败';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function signup(email: string, password: string) {
    loading.value = true;
    error.value = null;
    try {
      await signUpToCloud(email, password);
      userEmail.value = await getCurrentUserEmail();
      await Promise.all([fetchStocks(), fetchStats()]);
    } catch (e) {
      error.value = e instanceof Error ? e.message : '注册失败';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function logout() {
    loading.value = true;
    error.value = null;
    try {
      await signOutFromCloud();
      userEmail.value = null;
      await Promise.all([fetchStocks(), fetchStats()]);
    } catch (e) {
      error.value = e instanceof Error ? e.message : '退出失败';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function syncLocalToCloud() {
    loading.value = true;
    error.value = null;
    try {
      await syncLocalRecordsToCloud();
      await Promise.all([fetchStocks(), fetchStats()]);
    } catch (e) {
      error.value = e instanceof Error ? e.message : '同步失败';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  return {
    stocks,
    stats,
    loading,
    bootstrapping,
    error,
    userEmail,
    cloudConfigured,
    holdingStocks,
    soldStocks,
    watchingStocks,
    init,
    fetchStocks,
    fetchStats,
    createStock,
    editStock,
    closeStock,
    removeStock,
    backupStocks,
    login,
    signup,
    logout,
    syncLocalToCloud,
  };
});
