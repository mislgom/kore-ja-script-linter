/**
 * Script Review Pro vNext
 * Main JavaScript (FIXED – SINGLE STATE / SINGLE INIT / NO DUPLICATES)
 */

/* ======================================================
   BOOT
====================================================== */
console.log('[BOOT] main.js loaded');

window.addEventListener('error', e =>
  console.error('[GLOBAL ERROR]', e.message, e.filename, e.lineno)
);
window.addEventListener('unhandledrejection', e =>
  console.error('[UNHANDLED REJECTION]', e.reason)
);

/* ======================================================
   GLOBAL STATE (★ 단 1회 선언 ★)
====================================================== */
window.AppState = {
  currentTab: 'korea-senior',
  isReviewing: false,
  isAIAnalyzing: false,
  isDarkMode: false,
  analysisResult: null,
  lastReviewResult: null,
  aiAnalysisResult: null,
  issuesProcessed: false,
  tabConfig: {
    'korea-senior': { name: '한국 시니어 낭독', color: 'red' },
    'joseon-yadam': { name: '조선 야담', color: 'amber' },
    'japan-senior': { name: '일본 시니어 낭독', color: 'pink' },
    'world-news': { name: '전세계 뉴스', color: 'blue' }
  }
};

/* ======================================================
   HELPERS
====================================================== */
function safeInit(name, fn) {
  if (typeof fn !== 'function') {
    console.warn('[SKIP]', name);
    return;
  }
  try {
    console.log('[INIT]', name);
    fn();
  } catch (e) {
    console.error('[INIT FAILED]', name, e);
  }
}

const notificationState = {
  lastMessage: '',
  lastTimestamp: 0,
  dedupeInterval: 1500
};

/* ======================================================
   NOTIFICATION
====================================================== */
function showNotification(msg, type = 'info') {
  const now = Date.now();
  if (
    msg === notificationState.lastMessage &&
    now - notificationState.lastTimestamp < notificationState.dedupeInterval
  ) return;

  notificationState.lastMessage = msg;
  notificationState.lastTimestamp = now;

  const el = document.createElement('div');
  el.textContent = msg;
  el.style.cssText =
    'position:fixed;top:20px;right:20px;padding:10px 14px;background:#333;color:#fff;z-index:9999';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}

/* ======================================================
   API KEY UI (★ 단 1개 ★)
====================================================== */
let apiKeyUIInited = false;

function initApiKeyUI() {
  if (apiKeyUIInited) return;
  apiKeyUIInited = true;

  const STORAGE_KEY = 'GEMINI_API_KEY';
  const container = document.getElementById('api-key-container');
  const toggleBtn = document.getElementById('api-key-toggle-btn');
  const panel = document.getElementById('api-key-panel');
  const input = document.getElementById('api-key-input');
  const saveBtn = document.getElementById('api-key-save-btn');
  const deleteBtn = document.getElementById('api-key-delete-btn');

  if (!container || !toggleBtn || !panel) return;

  toggleBtn.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    panel.classList.toggle('hidden');
    console.log('[API KEY BTN] clicked');
  });

  if (saveBtn)
    saveBtn.addEventListener('click', e => {
      e.preventDefault();
      const key = input.value.trim();
      if (!key) return showNotification('API 키 입력 필요');
      localStorage.setItem(STORAGE_KEY, key);
      showNotification('API 키 저장 완료');
    });

  if (deleteBtn)
    deleteBtn.addEventListener('click', e => {
      e.preventDefault();
      localStorage.removeItem(STORAGE_KEY);
      input.value = '';
      showNotification('API 키 삭제');
    });

  document.addEventListener('click', e => {
    if (!container.contains(e.target)) panel.classList.add('hidden');
  });
}

/* ======================================================
   TABS
====================================================== */
function initTabs() {
  document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      AppState.currentTab = btn.dataset.tab;
      console.log('[TAB]', AppState.currentTab);
    });
  });
}

/* ======================================================
   TEXTAREA
====================================================== */
function initTextareas() {
  const ta = document.getElementById('korea-senior-script');
  if (!ta) return;
  ta.addEventListener('input', () => {});
}

/* ======================================================
   KOREA REVIEW
====================================================== */
function initKoreaSeniorReview() {
  const btn = document.getElementById('korea-senior-review-btn');
  const ta = document.getElementById('korea-senior-script');
  if (!btn || !ta) return;

  btn.addEventListener('click', () => {
    if (!ta.value.trim()) {
      showNotification('대본을 입력하세요');
      return;
    }
    showNotification('검수 시작');
  });
}

/* ======================================================
   AI
====================================================== */
function initAIAnalysis() {
  const btn = document.getElementById('korea-ai-analyze-btn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    showNotification('AI 분석 실행');
  });
}

/* ======================================================
   DOM READY (★ 단 1개 ★)
====================================================== */
document.addEventListener('DOMContentLoaded', () => {
  console.log('[BOOT] DOMContentLoaded');

  safeInit('Tabs', initTabs);
  safeInit('Textareas', initTextareas);
  safeInit('KoreaReview', initKoreaSeniorReview);
  safeInit('AI', initAIAnalysis);
  safeInit('ApiKeyUI', initApiKeyUI);
});
