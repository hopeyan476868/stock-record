<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import BuyModal from '@/components/ui/BuyModal.vue';
import EditStockModal from '@/components/ui/EditStockModal.vue';
import SellModal from '@/components/ui/SellModal.vue';
import { useStockStore } from '@/stores/stock';
import type { BuyStockInput, SellStockInput } from '@/schemas/stock';
import type { Stock, StockStatus } from '@/types/api';

const store = useStockStore();

const showBuyModal = ref(false);
const showEditModal = ref(false);
const showSellModal = ref(false);
const selectedStock = ref<Stock | null>(null);
const statusFilter = ref<'all' | StockStatus>('all');

const statusTabs: Array<{ key: 'all' | Extract<StockStatus, 'holding' | 'sold'>; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'holding', label: '持仓' },
  { key: 'sold', label: '已卖' },
];

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
    if (stock.sellPrice == null) return sum;
    return sum + ((stock.sellPrice - stock.buyPrice) / stock.buyPrice) * 100;
  }, 0)
);

function formatMoney(value?: number): string {
  if (value == null || !Number.isFinite(value)) return '--';
  return value.toFixed(2);
}

function formatDate(value?: string): string {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function formatReturn(stock: Stock): string {
  if (stock.status !== 'sold' || stock.sellPrice == null || stock.buyPrice <= 0) return '--';
  const value = ((stock.sellPrice - stock.buyPrice) / stock.buyPrice) * 100;
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
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
</script>

<template>
  <div class="min-h-screen bg-slate-50 pb-24 text-slate-900">
    <header class="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div class="mx-auto flex max-w-xl items-center justify-between gap-3 px-4 py-3">
        <div>
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
            {{ stock.trendJudgment || '未判断' }} · {{ stock.marketState || '未识别' }} · {{ stock.buyStrategy || stock.technicalPattern || '未标记' }} · {{ stock.patternRemark || '未标形态' }}
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
