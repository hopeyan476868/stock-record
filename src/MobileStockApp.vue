<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import BuyModal from '@/components/ui/BuyModal.vue';
import EditStockModal from '@/components/ui/EditStockModal.vue';
import SellModal from '@/components/ui/SellModal.vue';
import AuthPanel from '@/components/ui/AuthPanel.vue';
import { useStockStore } from '@/stores/stock';
import type { BuyStockInput, SellStockInput } from '@/schemas/stock';
import type { Stock, StockStatus } from '@/types/api';
import { getStrategySummary, migrateLegacyStrategy } from '@/utils/buyStrategyEngine';

const store = useStockStore();

const showBuyModal = ref(false);
const showEditModal = ref(false);
const showSellModal = ref(false);
const showUserMenu = ref(false);
const selectedStock = ref<Stock | null>(null);
const statusFilter = ref<'all' | StockStatus>('all');

const statusTabs: Array<{ key: 'all' | Extract<StockStatus, 'holding' | 'sold'>; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'holding', label: '持仓' },
  { key: 'sold', label: '已卖' },
];

type AnalysisRow = {
  key: string;
  total: number;
  wins: number;
  losses: number;
  winRate: number;
  lossRate: number;
  avgWin: number;
  avgLoss: number;
};

const holdingBuckets = [
  { key: '1天', min: 1, max: 1 },
  { key: '1-3天', min: 2, max: 3 },
  { key: '3-5天', min: 4, max: 5 },
  { key: '5-10天', min: 6, max: 10 },
  { key: '10-20天', min: 11, max: 20 },
  { key: '20天以上', min: 21, max: Number.POSITIVE_INFINITY },
];

const userInitial = computed(() => {
  const email = store.userEmail || '';
  return email.trim().charAt(0).toUpperCase() || 'U';
});

onMounted(() => {
  store.init();
});

const sortedStocks = computed(() =>
  [...store.stocks].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
);

const filteredStocks = computed(() => {
  if (statusFilter.value === 'all') return sortedStocks.value;
  return sortedStocks.value.filter((stock) => stock.status === statusFilter.value);
});

const totalCost = computed(() =>
  store.holdingStocks.reduce((sum, stock) => sum + stock.buyPrice * (stock.buyQuantity || 1), 0)
);

const soldReturn = computed(() =>
  store.soldStocks.reduce((sum, stock) => {
    const value = calcReturnValue(stock);
    return value == null ? sum : sum + value;
  }, 0)
);

function calcReturnValue(stock: Stock): number | null {
  if (stock.status !== 'sold' || stock.sellPrice == null || stock.buyPrice <= 0) return null;
  return ((stock.sellPrice - stock.buyPrice) / stock.buyPrice) * 100;
}

function calcHoldingDays(stock: Stock): number | null {
  if (stock.status !== 'sold' || !stock.buyDate || !stock.sellDate) return null;
  const buy = new Date(stock.buyDate);
  const sell = new Date(stock.sellDate);
  if (Number.isNaN(buy.getTime()) || Number.isNaN(sell.getTime())) return null;
  const diff = Math.floor((sell.getTime() - buy.getTime()) / (24 * 60 * 60 * 1000));
  return Math.max(1, diff);
}

function createAnalysisRow(key: string, values: number[]): AnalysisRow {
  const wins = values.filter((value) => value > 0);
  const losses = values.filter((value) => value <= 0);
  return {
    key,
    total: values.length,
    wins: wins.length,
    losses: losses.length,
    winRate: values.length ? (wins.length / values.length) * 100 : 0,
    lossRate: values.length ? (losses.length / values.length) * 100 : 0,
    avgWin: wins.length ? wins.reduce((sum, value) => sum + value, 0) / wins.length : 0,
    avgLoss: losses.length ? losses.reduce((sum, value) => sum + value, 0) / losses.length : 0,
  };
}

const strategyAnalysis = computed(() => {
  const groups = new Map<string, number[]>();
  for (const stock of store.soldStocks) {
    const value = calcReturnValue(stock);
    if (value == null) continue;
    const key = getStrategySummary(migrateLegacyStrategy(stock));
    groups.set(key, [...(groups.get(key) || []), value]);
  }
  return [...groups.entries()]
    .map(([key, values]) => createAnalysisRow(key, values))
    .sort((a, b) => b.total - a.total || b.winRate - a.winRate);
});

const holdingDaysAnalysis = computed(() => {
  const groups = new Map(holdingBuckets.map((bucket) => [bucket.key, [] as number[]]));
  for (const stock of store.soldStocks) {
    const value = calcReturnValue(stock);
    const days = calcHoldingDays(stock);
    if (value == null || days == null) continue;
    const bucket = holdingBuckets.find((item) => days >= item.min && days <= item.max);
    if (!bucket) continue;
    groups.get(bucket.key)?.push(value);
  }
  return holdingBuckets
    .map((bucket) => createAnalysisRow(bucket.key, groups.get(bucket.key) || []))
    .filter((row) => row.total > 0);
});

function formatMoney(value?: number): string {
  if (value == null || !Number.isFinite(value)) return '--';
  return value.toFixed(2);
}

function formatPercent(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

function formatDate(value?: string): string {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function formatReturn(stock: Stock): string {
  const value = calcReturnValue(stock);
  return value == null ? '--' : `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

function statusLabel(status: StockStatus): string {
  if (status === 'holding') return '持仓';
  return '已卖';
}

function statusClass(status: StockStatus): string {
  if (status === 'holding') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  return 'bg-slate-100 text-slate-600 border-slate-200';
}

function returnClass(stock: Stock): string {
  if (stock.status !== 'sold' || stock.sellPrice == null) return 'text-slate-500';
  return stock.sellPrice >= stock.buyPrice ? 'text-emerald-600' : 'text-red-600';
}

async function handleBuySubmit(data: BuyStockInput) {
  await store.createStock(data);
  showBuyModal.value = false;
}

function handleEdit(stock: Stock) {
  selectedStock.value = stock;
  showEditModal.value = true;
}

async function handleEditSubmit(data: Omit<Stock, 'id' | 'createdAt' | 'updatedAt'>) {
  if (!selectedStock.value) return;
  await store.editStock(selectedStock.value.id, data);
  showEditModal.value = false;
  selectedStock.value = null;
}

function handleSell(stock: Stock) {
  selectedStock.value = stock;
  showSellModal.value = true;
}

async function handleSellSubmit(data: SellStockInput) {
  if (!selectedStock.value) return;
  await store.closeStock(selectedStock.value.id, data);
  showSellModal.value = false;
  selectedStock.value = null;
}

async function handleDelete(stock: Stock) {
  if (!confirm(`确定要删除 ${stock.name} 的记录吗？`)) return;
  await store.removeStock(stock.id);
}

async function handleLogin(email: string, password: string) {
  await store.login(email, password);
}

async function handleSignup(email: string, password: string) {
  await store.signup(email, password);
}

async function handleSyncLocal() {
  await store.syncLocalToCloud();
  showUserMenu.value = false;
}

async function handleLogout() {
  await store.logout();
  showUserMenu.value = false;
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 pb-24 text-slate-900">
    <header class="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div class="relative mx-auto grid max-w-xl grid-cols-[3.25rem_1fr_3.25rem] items-center gap-3 px-4 py-3">
        <div class="relative">
          <button
            v-if="store.userEmail"
            type="button"
            class="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-bold text-blue-700 shadow-sm"
            aria-label="账号菜单"
            @click="showUserMenu = !showUserMenu"
            @mouseenter="showUserMenu = true"
          >
            {{ userInitial }}
          </button>
          <div v-else class="h-11 w-11"></div>

          <div
            v-if="store.userEmail && showUserMenu"
            class="absolute left-0 top-12 z-50 max-h-[78vh] w-[22rem] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-lg border border-slate-200 bg-white p-2 shadow-xl"
            @mouseleave="showUserMenu = false"
          >
            <div class="border-b border-slate-100 px-3 py-2">
              <div class="text-sm font-semibold text-slate-900">云端同步已开启</div>
              <div class="mt-1 truncate text-xs text-slate-500">{{ store.userEmail }}</div>
            </div>
            <button
              type="button"
              class="mt-2 flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
              :disabled="store.loading"
              @click="handleSyncLocal"
            >
              <span>{{ store.loading ? '同步中...' : '同步数据' }}</span>
              <svg class="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v6h6M20 20v-6h-6M5 19a9 9 0 0014-3M19 5A9 9 0 005 8" />
              </svg>
            </button>
            <button
              type="button"
              class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
              :disabled="store.loading"
              @click="handleLogout"
            >
              <span>退出</span>
              <svg class="h-4 w-4 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12H3m12 0l-4-4m4 4l-4 4M21 4v16" />
              </svg>
            </button>

            <div class="mt-3 border-t border-slate-100 pt-3">
              <div class="px-3 text-sm font-bold text-slate-900">策略分析</div>
              <div v-if="strategyAnalysis.length" class="mt-2 space-y-2">
                <div
                  v-for="row in strategyAnalysis"
                  :key="row.key"
                  class="rounded-lg bg-slate-50 px-3 py-2"
                >
                  <div class="flex items-center justify-between gap-2">
                    <div class="truncate text-xs font-semibold text-slate-800">{{ row.key }}</div>
                    <div class="number-font text-xs text-slate-400">{{ row.total }}笔</div>
                  </div>
                  <div class="mt-2 grid grid-cols-4 gap-2 text-xs">
                    <div>
                      <div class="text-slate-400">成功</div>
                      <div class="number-font font-semibold text-emerald-600">{{ row.winRate.toFixed(0) }}%</div>
                    </div>
                    <div>
                      <div class="text-slate-400">失败</div>
                      <div class="number-font font-semibold text-red-600">{{ row.lossRate.toFixed(0) }}%</div>
                    </div>
                    <div>
                      <div class="text-slate-400">盈利比</div>
                      <div class="number-font font-semibold text-emerald-600">{{ formatPercent(row.avgWin) }}</div>
                    </div>
                    <div>
                      <div class="text-slate-400">亏损比</div>
                      <div class="number-font font-semibold text-red-600">{{ formatPercent(row.avgLoss) }}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="mt-2 px-3 py-2 text-xs text-slate-400">暂无已卖出样本</div>
            </div>

            <div class="mt-3 border-t border-slate-100 pt-3">
              <div class="px-3 text-sm font-bold text-slate-900">持有天数分析</div>
              <div v-if="holdingDaysAnalysis.length" class="mt-2 space-y-2">
                <div
                  v-for="row in holdingDaysAnalysis"
                  :key="row.key"
                  class="rounded-lg bg-slate-50 px-3 py-2"
                >
                  <div class="flex items-center justify-between gap-2">
                    <div class="text-xs font-semibold text-slate-800">{{ row.key }}</div>
                    <div class="number-font text-xs text-slate-400">{{ row.total }}笔</div>
                  </div>
                  <div class="mt-2 grid grid-cols-4 gap-2 text-xs">
                    <div>
                      <div class="text-slate-400">成功</div>
                      <div class="number-font font-semibold text-emerald-600">{{ row.winRate.toFixed(0) }}%</div>
                    </div>
                    <div>
                      <div class="text-slate-400">失败</div>
                      <div class="number-font font-semibold text-red-600">{{ row.lossRate.toFixed(0) }}%</div>
                    </div>
                    <div>
                      <div class="text-slate-400">盈利比</div>
                      <div class="number-font font-semibold text-emerald-600">{{ formatPercent(row.avgWin) }}</div>
                    </div>
                    <div>
                      <div class="text-slate-400">亏损比</div>
                      <div class="number-font font-semibold text-red-600">{{ formatPercent(row.avgLoss) }}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="mt-2 px-3 py-2 text-xs text-slate-400">暂无已卖出样本</div>
            </div>
          </div>
        </div>

        <div class="min-w-0 text-center">
          <h1 class="text-lg font-bold">股票记录</h1>
          <p class="number-font mt-0.5 text-xs text-slate-500">{{ sortedStocks.length }} 条记录</p>
        </div>
        <button
          type="button"
          class="inline-flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm"
          aria-label="添加记录"
          @click="showBuyModal = true"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v14m7-7H5" />
          </svg>
        </button>
      </div>
    </header>

    <main class="mx-auto max-w-xl space-y-4 px-4 py-4">
      <div v-if="store.error" class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
        {{ store.error }}
      </div>

      <AuthPanel
        v-if="!store.userEmail"
        :cloud-enabled="store.cloudConfigured"
        :user-email="store.userEmail"
        :loading="store.loading"
        @login="handleLogin"
        @signup="handleSignup"
      />

      <section class="grid grid-cols-3 gap-2">
        <div class="rounded-lg border border-slate-200 bg-white px-3 py-3 shadow-sm">
          <div class="text-xs text-slate-500">持仓</div>
          <div class="number-font mt-1 text-xl font-bold text-slate-900">{{ store.bootstrapping ? '--' : store.holdingStocks.length }}</div>
        </div>
        <div class="rounded-lg border border-slate-200 bg-white px-3 py-3 shadow-sm">
          <div class="text-xs text-slate-500">成本</div>
          <div class="number-font mt-1 text-xl font-bold text-slate-900">{{ store.bootstrapping ? '--' : formatMoney(totalCost) }}</div>
        </div>
        <div class="rounded-lg border border-slate-200 bg-white px-3 py-3 shadow-sm">
          <div class="text-xs text-slate-500">已卖收益</div>
          <div class="number-font mt-1 text-xl font-bold" :class="soldReturn >= 0 ? 'text-emerald-600' : 'text-red-600'">
            {{ store.bootstrapping ? '--' : `${soldReturn >= 0 ? '+' : ''}${soldReturn.toFixed(1)}%` }}
          </div>
        </div>
      </section>

      <section class="flex gap-2 overflow-x-auto pb-1">
        <button
          v-for="tab in statusTabs"
          :key="tab.key"
          type="button"
          class="shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition"
          :class="statusFilter === tab.key ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-600'"
          @click="statusFilter = tab.key"
        >
          {{ tab.label }}
        </button>
      </section>

      <section v-if="store.bootstrapping" class="rounded-lg border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
        正在读取记录
      </section>

      <section v-else-if="!filteredStocks.length" class="rounded-lg border border-slate-200 bg-white px-4 py-10 text-center">
        <div class="text-sm font-semibold text-slate-800">暂无记录</div>
        <button type="button" class="btn-primary mt-4" @click="showBuyModal = true">添加记录</button>
      </section>

      <section v-else class="space-y-3">
        <article
          v-for="stock in filteredStocks"
          :key="stock.id"
          class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <h2 class="truncate text-base font-bold text-slate-900">{{ stock.name }}</h2>
                <span class="rounded-full border px-2 py-0.5 text-xs font-semibold" :class="statusClass(stock.status)">
                  {{ statusLabel(stock.status) }}
                </span>
                <span class="rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                  {{ stock.marketTag || 'A股' }}
                </span>
              </div>
              <div class="mt-1 text-xs text-slate-500">
                {{ formatDate(stock.buyDate) }} 买入 · {{ stock.status === 'sold' ? stock.sellQuantity || stock.buyQuantity || 1 : stock.buyQuantity || 1 }} 股
              </div>
            </div>
            <div class="text-right">
              <div class="number-font text-sm font-bold text-slate-900">{{ formatMoney(stock.buyPrice) }}</div>
              <div class="number-font text-xs font-semibold" :class="returnClass(stock)">{{ formatReturn(stock) }}</div>
            </div>
          </div>

          <div class="mt-4 grid grid-cols-3 gap-2 text-xs">
            <div>
              <div class="text-slate-400">触发</div>
              <div class="number-font mt-1 font-semibold text-slate-700">{{ formatMoney(stock.triggerPrice) }}</div>
            </div>
            <div>
              <div class="text-slate-400">止损</div>
              <div class="number-font mt-1 font-semibold text-red-600">{{ formatMoney(stock.stopLossPrice) }}</div>
            </div>
            <div>
              <div class="text-slate-400">目标</div>
              <div class="number-font mt-1 font-semibold text-emerald-600">{{ formatMoney(stock.targetPrice || stock.takeProfitPrice) }}</div>
            </div>
          </div>

          <div class="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
            {{ getStrategySummary(migrateLegacyStrategy(stock)) }}
          </div>

          <div class="mt-4 flex items-center justify-end gap-2">
            <button type="button" class="btn-edit-outline px-3 py-2" @click="handleEdit(stock)">编辑</button>
            <button
              v-if="stock.status === 'holding'"
              type="button"
              class="btn-sell px-3 py-2"
              @click="handleSell(stock)"
            >
              卖出
            </button>
            <button type="button" class="btn-danger-outline px-3 py-2" @click="handleDelete(stock)">删除</button>
          </div>
        </article>
      </section>
    </main>

    <BuyModal
      :open="showBuyModal"
      :loading="store.loading"
      @close="showBuyModal = false"
      @submit="handleBuySubmit"
    />

    <EditStockModal
      :open="showEditModal"
      :stock="selectedStock"
      :loading="store.loading"
      @close="showEditModal = false; selectedStock = null"
      @submit="handleEditSubmit"
    />

    <SellModal
      :open="showSellModal"
      :stock="selectedStock"
      :loading="store.loading"
      @close="showSellModal = false"
      @submit="handleSellSubmit"
    />
  </div>
</template>
