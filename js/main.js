/**
 * 대본 검수 시스템 - Main JavaScript
 * Script Review Pro vNext
 *
 * 완전 자동화 검수 시스템 + AI 분석 + Issues 관리 + 인라인 편집
 */

// ========================================
// 전역 상태 관리 (AppState는 1회만 선언)  ✅ 중복 선언 금지
// ========================================
const AppState = {
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
};

// ========================================
// STEP 3 추가 전역 상태 (AppState 밖에 선언)
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

function isButtonThrottled(buttonId) {
  var now = Date.now();
  var lastTime = buttonThrottle.lastClickTime[buttonId] || 0;
  if (now - lastTime < buttonThrottle.interval) return true;
  buttonThrottle.lastClickTime[buttonId] = now;
  return false;
}

// ========================================
// DEBUG BOOTSTRAP (TEMP)
// ========================================
console.log('[BOOT] main.js loaded');
console.log('[BOOT] location=', location.href);
console.log('[BOOT] time=', new Date().toISOString());

// ========================================
// CLICK / LOAD PROBE (TEMP)  ✅ 전체 버튼 무반응 원인 분리용
// ========================================
(function () {
  document.addEventListener(
    'click',
    function (e) {
      try {
        var t = e.target;
        console.log('[CLICK PROBE] captured click on:', t && (t.id ? ('#' + t.id) : t.tagName), t);

        if (typeof e.clientX === 'number' && typeof e.clientY === 'number') {
          var topEl = document.elementFromPoint(e.clientX, e.clientY);
          console.log('[CLICK PROBE] elementFromPoint:', topEl && (topEl.id ? ('#' + topEl.id) : topEl.tagName), topEl);
        }
      } catch (err) {
        console.error('[CLICK PROBE ERROR]', err);
      }
    },
    true
  );

  document.addEventListener('DOMContentLoaded', function () {
    console.log('[BOOT] DOMContentLoaded fired (probe)');
  });

  console.log('[BOOT] readyState at load =', document.readyState);
  document.addEventListener('readystatechange', function () {
    console.log('[BOOT] readyState changed =', document.readyState);
  });
})();

window.addEventListener('error', function (e) {
  console.error('[GLOBAL ERROR]', e.message, 'at', (e.filename || '') + ':' + e.lineno + ':' + e.colno);
});

window.addEventListener('unhandledrejection', function (e) {
  console.error('[UNHANDLED REJECTION]', e.reason);
});

// ========================================
// safeInit
// ========================================
function safeInit(name, fn) {
  try {
    console.log('[INIT] start', name);
    if (typeof fn !== 'function') {
      console.error('[INIT FAILED]', name, 'is not a function:', fn);
      return;
    }
    fn();
    console.log('[INIT] done', name);
  } catch (e) {
    console.error('[INIT FAILED]', name, e);
  }
}

// ========================================
// API 키 UI 초기화 및 관리 (정식 1개만 유지)  ✅ 중복 정의 금지
// ========================================
let isApiKeyUIInitialized = false;

function initApiKeyUI() {
  if (isApiKeyUIInitialized) {
    console.warn('⚠️ API 키 UI가 이미 초기화되었습니다.');
    return;
  }

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

  if (!container) { console.warn('⚠️ API 키 UI: #api-key-container 요소를 찾을 수 없습니다.'); return; }
  if (!toggleBtn) { console.warn('⚠️ API 키 UI: #api-key-toggle-btn 요소를 찾을 수 없습니다.'); return; }
  if (!panel) { console.warn('⚠️ API 키 UI: #api-key-panel 요소를 찾을 수 없습니다.'); return; }
  if (!closeBtn) { console.warn('⚠️ API 키 UI: #api-key-close-btn 요소를 찾을 수 없습니다.'); return; }
  if (!input) { console.warn('⚠️ API 키 UI: #api-key-input 요소를 찾을 수 없습니다.'); return; }
  if (!saveBtn) { console.warn('⚠️ API 키 UI: #api-key-save-btn 요소를 찾을 수 없습니다.'); return; }
  if (!deleteBtn) { console.warn('⚠️ API 키 UI: #api-key-delete-btn 요소를 찾을 수 없습니다.'); return; }
  if (!statusEl) { console.warn('⚠️ API 키 UI: #api-key-status 요소를 찾을 수 없습니다.'); return; }
  if (!statusIcon) { console.warn('⚠️ API 키 UI: #api-key-status-icon 요소를 찾을 수 없습니다.'); return; }
  if (!statusText) { console.warn('⚠️ API 키 UI: #api-key-status-text 요소를 찾을 수 없습니다.'); return; }

  function updateStatus(message, type) {
    type = type || 'info';

    var icons = {
      info: 'fa-info-circle',
      saved: 'fa-check-circle',
      deleted: 'fa-trash-alt',
      error: 'fa-exclamation-triangle'
    };

    statusEl.classList.remove('status-info', 'status-saved', 'status-deleted', 'status-error');
    statusEl.classList.add('status-' + type);

    statusIcon.classList.remove('fa-info-circle', 'fa-check-circle', 'fa-trash-alt', 'fa-exclamation-triangle');
    statusIcon.classList.add(icons[type] || icons.info);

    statusText.textContent = message;
  }

  function updateButtonState() {
    var hasKey = !!localStorage.getItem(STORAGE_KEY);
    if (hasKey) {
      toggleBtn.classList.add('has-key');
      toggleBtn.title = 'API 키 설정됨';
    } else {
      toggleBtn.classList.remove('has-key');
      toggleBtn.title = 'API 키 설정';
    }
  }

  function openPanel() {
    panel.classList.remove('hidden', 'closing');
    input.focus();
  }

  function closePanel() {
    panel.classList.add('closing');
    setTimeout(function () {
      panel.classList.add('hidden');
      panel.classList.remove('closing');
    }, 150);
  }

  function togglePanel(e) {
    e.preventDefault();
    e.stopPropagation();
    if (panel.classList.contains('hidden')) openPanel();
    else closePanel();
  }

  function handlePanelClick(e) {
    e.stopPropagation();
  }

  function loadSavedKey() {
    var savedKey = localStorage.getItem(STORAGE_KEY);
    if (savedKey) {
      input.value = savedKey;
      updateStatus('API 키가 저장되어 있습니다.', 'saved');
    } else {
      input.value = '';
      updateStatus('API 키가 설정되지 않았습니다.', 'info');
    }
    updateButtonState();
  }

  function handleSave(e) {
    e.preventDefault();
    e.stopPropagation();

    var keyValue = input.value.trim();

    if (!keyValue) {
      updateStatus('API 키를 입력해주세요.', 'error');
      input.focus();
      return;
    }

    if (!keyValue.startsWith('AIza')) {
      updateStatus('올바른 API 키 형식이 아닙니다. (AIza...)', 'error');
      input.focus();
      return;
    }

    localStorage.setItem(STORAGE_KEY, keyValue);
    updateStatus('저장 완료! API 키가 저장되었습니다.', 'saved');
    updateButtonState();
    console.log('✅ Gemini API 키 저장 완료');
  }

  function handleDelete(e) {
    e.preventDefault();
    e.stopPropagation();

    localStorage.removeItem(STORAGE_KEY);
    input.value = '';
    updateStatus('삭제 완료! API 키가 제거되었습니다.', 'deleted');
    updateButtonState();
    console.log('🗑️ Gemini API 키 삭제 완료');
  }

  function handleClose(e) {
    e.preventDefault();
    e.stopPropagation();
    closePanel();
  }

  function handleOutsideClick(e) {
    if (panel.classList.contains('hidden')) return;
    if (container.contains(e.target)) return;
    closePanel();
  }

  function handleEscKey(e) {
    if (e.key === 'Escape' && !panel.classList.contains('hidden')) closePanel();
  }

  function handleInputKeydown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave(e);
    }
  }

  toggleBtn.addEventListener('click', togglePanel);
  panel.addEventListener('click', handlePanelClick);
  closeBtn.addEventListener('click', handleClose);
  saveBtn.addEventListener('click', handleSave);
  deleteBtn.addEventListener('click', handleDelete);
  input.addEventListener('keydown', handleInputKeydown);
  document.addEventListener('click', handleOutsideClick);
  document.addEventListener('keydown', handleEscKey);

  loadSavedKey();

  isApiKeyUIInitialized = true;
  console.log('✅ API 키 UI 초기화 완료');
}

// ✅ 기존 호출부가 window.initApiKeyUI를 쓰고 있으므로 연결(호환 유지)
window.initApiKeyUI = initApiKeyUI;

// ========================================
// DOMContentLoaded (포함해서 교체)
// ========================================
document.addEventListener('DOMContentLoaded', function () {
  console.log('[BOOT] DOMContentLoaded fired');

  safeInit('initDarkMode', initDarkMode);
  safeInit('initTabs', initTabs);
  safeInit('initTextareas', initTextareas);
  safeInit('initKoreaSeniorReview', initKoreaSeniorReview);
  safeInit('initAIAnalysis', initAIAnalysis);
  safeInit('initIssuesSystem', initIssuesSystem);
  safeInit('initApiKeyUI', window.initApiKeyUI);
});
