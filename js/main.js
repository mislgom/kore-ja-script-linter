/**
 * 대본 검수 시스템 - Main JavaScript
 * Script Review Pro vNext
 */

// ========================================
// DEBUG BOOTSTRAP
// ========================================
console.log('[BOOT] main.js loaded');
console.log('[BOOT] location=', location.href);
console.log('[BOOT] time=', new Date().toISOString());

window.addEventListener('error', function (e) {
  console.error('[GLOBAL ERROR]', e.message, 'at', (e.filename || '') + ':' + e.lineno + ':' + e.colno);
});

window.addEventListener('unhandledrejection', function (e) {
  console.error('[UNHANDLED REJECTION]', e.reason);
});

// ========================================
// 전역 상태 (단일 선언)
// ========================================
var AppState = window.AppState || (window.AppState = {
  currentTab: 'korea-senior',
  isReviewing: false,
  isAIAnalyzing: false,
  isDarkMode: false,
  analysisResult: null,
  lastReviewResult: null,
  aiAnalysisResult: null,
  issuesProcessed: false,
  tabConfig: {
    'korea-senior': { name: '한국 시니어 낭독', color: 'red', icon: 'fa-book-open' },
    'joseon-yadam': { name: '조선 야담', color: 'amber', icon: 'fa-scroll' },
    'japan-senior': { name: '일본 시니어 낭독', color: 'pink', icon: 'fa-torii-gate' },
    'world-news': { name: '전세계 뉴스', color: 'blue', icon: 'fa-globe' }
  }
});

// ========================================
// 보조 전역
// ========================================
var notificationState = {
  lastMessage: '',
  lastTimestamp: 0,
  dedupeInterval: 2000
};

var buttonThrottle = {
  lastClickTime: {},
  interval: 300
};

function isButtonThrottled(id) {
  var now = Date.now();
  var last = buttonThrottle.lastClickTime[id] || 0;
  if (now - last < buttonThrottle.interval) return true;
  buttonThrottle.lastClickTime[id] = now;
  return false;
}

// ========================================
// safeInit
// ========================================
function safeInit(name, fn) {
  try {
    console.log('[INIT] start', name);
    if (typeof fn !== 'function') {
      console.error('[INIT FAILED]', name, 'is not a function');
      return;
    }
    fn();
    console.log('[INIT] done', name);
  } catch (e) {
    console.error('[INIT FAILED]', name, e);
  }
}

// ========================================
// API KEY UI (단일 정의)
// ========================================
window.isApiKeyUIInitialized = window.isApiKeyUIInitialized || false;

function initApiKeyUI() {
  if (window.isApiKeyUIInitialized) return;

  const STORAGE_KEY = 'GEMINI_API_KEY';
  const container = document.getElementById('api-key-container');
  const toggleBtn = document.getElementById('api-key-toggle-btn');
  const panel = document.getElementById('api-key-panel');
  const closeBtn = document.getElementById('api-key-close-btn');
  const input = document.getElementById('api-key-input');
  const saveBtn = document.getElementById('api-key-save-btn');
  const deleteBtn = document.getElementById('api-key-delete-btn');
  const statusEl = document.getElementById('api-key-status');
  const statusIcon = document.getElementById('api-key-status-icon');
  const statusText = document.getElementById('api-key-status-text');

  if (!container || !toggleBtn || !panel) return;

  function updateStatus(msg, type) {
    type = type || 'info';
    statusText.textContent = msg;
    statusEl.className = 'status-' + type;
  }

  function updateButtonState() {
    var hasKey = !!localStorage.getItem(STORAGE_KEY);
    toggleBtn.classList.toggle('has-key', hasKey);
  }

  function openPanel() { panel.classList.remove('hidden'); }
  function closePanel() { panel.classList.add('hidden'); }

  toggleBtn.addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    panel.classList.toggle('hidden');
  });

  if (closeBtn) closeBtn.addEventListener('click', function (e) {
    e.preventDefault();
    closePanel();
  });

  if (saveBtn) saveBtn.addEventListener('click', function (e) {
    e.preventDefault();
    var key = input.value.trim();
    if (!key) return updateStatus('API 키를 입력해주세요.', 'error');
    localStorage.setItem(STORAGE_KEY, key);
    updateStatus('저장되었습니다.', 'saved');
    updateButtonState();
  });

  if (deleteBtn) deleteBtn.addEventListener('click', function (e) {
    e.preventDefault();
    localStorage.removeItem(STORAGE_KEY);
    input.value = '';
    updateStatus('삭제되었습니다.', 'deleted');
    updateButtonState();
  });

  document.addEventListener('click', function (e) {
    if (!container.contains(e.target)) closePanel();
  });

  var saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    input.value = saved;
    updateStatus('API 키가 저장되어 있습니다.', 'saved');
  } else {
    updateStatus('API 키를 입력해주세요.', 'info');
  }
  updateButtonState();

  window.isApiKeyUIInitialized = true;
}

// ========================================
// DOMContentLoaded (단일)
// ========================================
document.addEventListener('DOMContentLoaded', function () {
  console.log('[BOOT] DOMContentLoaded fired');

  safeInit('initDarkMode', window.initDarkMode);
  safeInit('initTabs', window.initTabs);
  safeInit('initTextareas', initTextareas);
  safeInit('initKoreaSeniorReview', initKoreaSeniorReview);
  safeInit('initAIAnalysis', initAIAnalysis);
  safeInit('initIssuesSystem', window.initIssuesSystem);
  safeInit('initApiKeyUI', initApiKeyUI);
});

// ========================================
// 이하 기존 기능들 (원본 유지)
// ========================================
/* initTextareas, initKoreaSeniorReview, analyzeScript,
   displayAnalysisResult, runFullReview, displayResults,
   processIssuesFromResults, updateResultCard,
   updateOverallSummary, updateOverallStatus,
   resetKoreaSeniorResults, showNotification,
   getSampleScript, initAIAnalysis, runAIAnalysis,
   displayAIAnalysisResult, getScoreColorClass,
   showAIAnalysisSection 등은 기존 코드 그대로 유지 */
