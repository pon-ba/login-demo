<script setup lang="ts">
// 引入 Vue 3 的 ref 函數，用來建立響應式狀態 (Reactive State)
import { ref } from 'vue';

// 建立響應式變數 email，初始值為空字串，將與表單的 Email 輸入框雙向綁定 (v-model)
const email = ref('');
// 建立響應式變數 password，初始值為空字串，將與表單的 Password 輸入框雙向綁定 (v-model)
const password = ref('');
// 建立響應式變數 isLoading，用來控制 Email 登入按鈕的 Loading 狀態 (Spinner)
const isLoading = ref(false);
// 建立響應式變數 oauthLoading，用來記錄目前正在進行哪個 OAuth 登入 (例如 'google', 'apple', 'github')，null 代表沒有
const oauthLoading = ref<string | null>(null);
// 建立響應式變數 message，用來顯示登入成功或失敗的提示訊息。包含訊息類型 (type) 與文字內容 (text)
const message = ref<{ type: 'error' | 'success', text: string } | null>(null);

// New refs for custom validation
const emailInput = ref<HTMLInputElement | null>(null);
const passwordInput = ref<HTMLInputElement | null>(null);
const emailError = ref('');
const passwordError = ref('');

const clearEmailError = () => {
  emailError.value = '';
};

const clearPasswordError = () => {
  passwordError.value = '';
};

const handleSubmit = () => {
  let isValid = true;
  
  if (emailInput.value && !emailInput.value.checkValidity()) {
    if (emailInput.value.validity.valueMissing) {
      emailError.value = '請填寫這個欄位。';
    } else if (emailInput.value.validity.typeMismatch) {
      emailError.value = '請輸入有效的電子郵件地址。';
    } else {
      emailError.value = emailInput.value.validationMessage;
    }
    isValid = false;
  } else {
    emailError.value = '';
  }

  if (passwordInput.value && !passwordInput.value.checkValidity()) {
    if (passwordInput.value.validity.valueMissing) {
      passwordError.value = '請填寫這個欄位。';
    } else {
      passwordError.value = passwordInput.value.validationMessage;
    }
    isValid = false;
  } else {
    passwordError.value = '';
  }

  if (!isValid) {
    if (emailError.value && emailInput.value) {
      emailInput.value.focus();
    } else if (passwordError.value && passwordInput.value) {
      passwordInput.value.focus();
    }
    return;
  }

  handleEmailLogin();
};

// 處理 Email/密碼 表單送出的非同步函數
const handleEmailLogin = async () => {
  // 開始登入流程，將 isLoading 設為 true，按鈕會顯示 Spinner 並禁用
  isLoading.value = true;
  // 清除之前的提示訊息
  message.value = null;

  try {
    // 使用 fetch API 向後端 Express 伺服器發送 POST 請求
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      // 設定請求標頭，告知後端我們發送的是 JSON 格式的資料
      headers: { 'Content-Type': 'application/json' },
      // 將 email 和 password 的值轉成 JSON 字串放在請求的 body 中
      body: JSON.stringify({ email: email.value, password: password.value }),
    });

    // 解析後端回傳的 JSON 回應資料
    const data = await response.json();

    // 判斷 HTTP 狀態碼是否為 2xx (response.ok) 且後端回傳的 success 欄位為 true
    if (response.ok && data.success) {
      // 登入成功，設定成功訊息
      message.value = { type: 'success', text: data.message };
    } else {
      // 登入失敗，設定錯誤訊息。如果後端沒有提供 message，則顯示預設的 'Login failed'
      message.value = { type: 'error', text: data.message || 'Login failed' };
    }
  } catch (error) {
    // 捕捉網路錯誤 (例如伺服器未啟動或斷線)，設定錯誤訊息
    message.value = { type: 'error', text: 'Network error. Is the server running?' };
  } finally {
    // 無論登入成功、失敗或發生錯誤，最後都將 isLoading 設回 false，恢復按鈕狀態
    isLoading.value = false;
  }
};

// 處理 OAuth (第三方登入) 按鈕點擊的非同步函數，接收 provider (提供者名稱) 作為參數
const handleOAuthLogin = async (provider: string) => {
  // 開始 OAuth 流程，記錄目前點擊的 provider，對應的按鈕會顯示 Spinner，其他按鈕會被禁用
  oauthLoading.value = provider;
  // 清除之前的提示訊息
  message.value = null;

  try {
    // 向後端請求該 provider 的 OAuth 授權網址 (GET 請求)
    const response = await fetch(`/api/auth/${provider}/url`);
    // 解析後端回傳的 JSON 資料
    const data = await response.json();

    // 如果後端有回傳 url
    if (data.url) {
      // 顯示成功訊息 (在真實應用中，這裡通常會使用 window.location.href = data.url 進行轉址)
      message.value = { type: 'success', text: `Redirecting to ${provider}... (Mocked)` };
    }
  } catch (error) {
    // 捕捉網路錯誤，設定錯誤訊息
    message.value = { type: 'error', text: `Failed to connect to ${provider}` };
  } finally {
    // 無論成功或失敗，最後都將 oauthLoading 設回 null，恢復所有 OAuth 按鈕狀態
    oauthLoading.value = null;
  }
};
</script>

<template>
  <div class="min-h-screen bg-zinc-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <div class="flex justify-center">
        <div class="w-12 h-12 bg-black rounded-xl flex items-center justify-center shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6 text-white"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
      </div>
      <h2 class="mt-6 text-center text-3xl font-bold tracking-tight text-zinc-900">Welcome back</h2>
      <p class="mt-2 text-center text-sm text-zinc-600">Sign in to your account to continue</p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white py-8 px-4 shadow-xl shadow-zinc-200/50 sm:rounded-2xl sm:px-10 border border-zinc-100">

        <div v-if="message" :class="['mb-6 p-4 rounded-xl flex items-start gap-3 text-sm border', message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200']">
          <div class="shrink-0">
            <svg v-if="message.type === 'success'" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 text-emerald-600"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 text-red-600"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
          </div>
          <p class="font-medium">{{ message.text }}</p>
        </div>

        <form @submit.prevent="handleSubmit" novalidate class="space-y-5">
          <div>
            <label for="email" class="block text-sm font-medium text-zinc-700">Email address</label>
            <div class="mt-1 relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5 text-zinc-400"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              </div>
              <input id="email" ref="emailInput" v-model="email" @input="clearEmailError" @blur="clearEmailError" type="email" autocomplete="email" required class="block w-full pl-10 pr-3 py-2.5 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-black focus:border-black sm:text-sm transition-colors" placeholder="you@example.com">
              
              <!-- Custom Tooltip -->
              <div v-if="emailError" class="absolute z-50 left-4 top-full mt-2 flex items-center gap-2 px-3 py-2 bg-[#333333] border border-[#555555] rounded-md shadow-lg text-white text-sm whitespace-nowrap">
                <div class="absolute -top-1.5 left-4 w-2.5 h-2.5 bg-[#333333] border-t border-l border-[#555555] transform rotate-45"></div>
                <div class="flex-shrink-0 w-5 h-5 bg-[#ff9800] rounded-sm flex items-center justify-center font-bold text-white text-sm leading-none">
                  !
                </div>
                <span class="tracking-wide">{{ emailError }}</span>
              </div>
            </div>
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-zinc-700">Password</label>
            <div class="mt-1 relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5 text-zinc-400"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <input id="password" ref="passwordInput" v-model="password" @input="clearPasswordError" @blur="clearPasswordError" type="password" autocomplete="current-password" required class="block w-full pl-10 pr-3 py-2.5 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-black focus:border-black sm:text-sm transition-colors" placeholder="••••••••">
              
              <!-- Custom Tooltip -->
              <div v-if="passwordError" class="absolute z-50 left-4 top-full mt-2 flex items-center gap-2 px-3 py-2 bg-[#333333] border border-[#555555] rounded-md shadow-lg text-white text-sm whitespace-nowrap">
                <div class="absolute -top-1.5 left-4 w-2.5 h-2.5 bg-[#333333] border-t border-l border-[#555555] transform rotate-45"></div>
                <div class="flex-shrink-0 w-5 h-5 bg-[#ff9800] rounded-sm flex items-center justify-center font-bold text-white text-sm leading-none">
                  !
                </div>
                <span class="tracking-wide">{{ passwordError }}</span>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <input id="remember-me" type="checkbox" class="h-4 w-4 text-black focus:ring-black border-zinc-300 rounded">
              <label for="remember-me" class="ml-2 block text-sm text-zinc-700">Remember me</label>
            </div>
            <div class="text-sm">
              <a href="#" class="font-medium text-zinc-600 hover:text-black transition-colors">Forgot password?</a>
            </div>
          </div>

          <div>
            <button type="submit" :disabled="isLoading" class="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-black hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-70 disabled:cursor-not-allowed transition-all">
              <svg v-if="isLoading" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              <span v-else class="flex items-center gap-2">Sign in <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span>
            </button>
          </div>
        </form>

        <div class="mt-8">
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-zinc-200"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-3 bg-white text-zinc-500 font-medium">Or continue with</span>
            </div>
          </div>

          <div class="mt-6 grid grid-cols-3 gap-3">
            <button @click="handleOAuthLogin('google')" :disabled="oauthLoading !== null" class="w-full inline-flex justify-center items-center py-2.5 px-4 border border-zinc-300 rounded-xl shadow-sm bg-white text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 transition-colors">
              <svg v-if="oauthLoading === 'google'" class="w-5 h-5 animate-spin text-zinc-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              <svg v-else viewBox="0 0 24 24" class="w-5 h-5" aria-hidden="true"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            </button>

            <button @click="handleOAuthLogin('apple')" :disabled="oauthLoading !== null" class="w-full inline-flex justify-center items-center py-2.5 px-4 border border-zinc-300 rounded-xl shadow-sm bg-white text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 transition-colors">
              <svg v-if="oauthLoading === 'apple'" class="w-5 h-5 animate-spin text-zinc-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              <svg v-else viewBox="0 0 24 24" class="w-5 h-5" fill="currentColor" aria-hidden="true"><path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.56-1.702z" /></svg>
            </button>

            <button @click="handleOAuthLogin('github')" :disabled="oauthLoading !== null" class="w-full inline-flex justify-center items-center py-2.5 px-4 border border-zinc-300 rounded-xl shadow-sm bg-white text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 transition-colors">
              <svg v-if="oauthLoading === 'github'" class="w-5 h-5 animate-spin text-zinc-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
            </button>
          </div>
        </div>

        <div class="mt-8 text-center text-sm text-zinc-600">
          Don't have an account? <a href="#" class="font-semibold text-black hover:underline">Sign up</a>
        </div>
      </div>

      <div class="mt-8 p-4 bg-indigo-50 rounded-xl border border-indigo-100 text-sm text-indigo-800">
        <h3 class="font-semibold mb-1 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
          API Practice Mode (Vue.js)
        </h3>
        <p class="mb-2">This UI is connected to the Express server in <code>server.ts</code>.</p>
        <ul class="list-disc pl-5 space-y-1 text-indigo-700">
          <li>Try logging in with <strong>test@example.com</strong> and <strong>password</strong></li>
          <li>Check <code>server.ts</code> to modify the API endpoints</li>
          <li>OAuth buttons hit <code>/api/auth/:provider/url</code></li>
        </ul>
      </div>
    </div>
  </div>
</template>
