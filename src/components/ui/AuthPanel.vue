<script setup lang="ts">
import { computed, ref } from 'vue';

const props = defineProps<{
  cloudEnabled: boolean;
  userEmail?: string | null;
  loading?: boolean;
}>();

const emit = defineEmits<{
  login: [email: string, password: string];
  signup: [email: string, password: string];
  logout: [];
  syncLocal: [];
}>();

const email = ref('');
const password = ref('');
const mode = ref<'login' | 'signup'>('login');

const isSignedIn = computed(() => Boolean(props.userEmail));

function submit() {
  if (!email.value.trim() || !password.value) return;
  if (mode.value === 'login') {
    emit('login', email.value.trim(), password.value);
  } else {
    emit('signup', email.value.trim(), password.value);
  }
}
</script>

<template>
  <section class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
    <div v-if="!cloudEnabled" class="text-sm text-amber-700">
      云同步未配置，当前使用本地存储。
    </div>

    <div v-else-if="isSignedIn" class="flex flex-col gap-3">
      <div class="flex items-start justify-between gap-3">
        <div>
          <div class="text-sm font-semibold text-slate-900">云端同步已开启</div>
          <div class="mt-1 text-xs text-slate-500">{{ userEmail }}</div>
        </div>
        <button type="button" class="btn-secondary px-3 py-2 text-sm" :disabled="loading" @click="emit('logout')">
          退出
        </button>
      </div>
      <button type="button" class="btn-primary w-full" :disabled="loading" @click="emit('syncLocal')">
        {{ loading ? '同步中...' : '同步本机记录到云端' }}
      </button>
    </div>

    <form v-else class="space-y-3" @submit.prevent="submit">
      <div>
        <div class="text-sm font-semibold text-slate-900">登录后云端同步</div>
        <div class="mt-1 text-xs text-slate-500">同一账号下，多台设备可读取同一份股票记录。</div>
      </div>
      <input v-model="email" type="email" autocomplete="email" placeholder="邮箱" class="input-field" />
      <input
        v-model="password"
        type="password"
        autocomplete="current-password"
        placeholder="密码"
        class="input-field"
      />
      <div class="grid grid-cols-2 gap-2">
        <button
          type="submit"
          class="btn-primary"
          :disabled="loading"
          @click="mode = 'login'"
        >
          登录
        </button>
        <button
          type="submit"
          class="btn-secondary"
          :disabled="loading"
          @click="mode = 'signup'"
        >
          注册
        </button>
      </div>
    </form>
  </section>
</template>
