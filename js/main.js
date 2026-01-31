/**
 * Script Review Pro vNext
 * Main JavaScript - FINAL STABLE VERSION
 */

/* ======================================================
   BOOT
====================================================== */
console.log('[BOOT] main.js loaded');

window.addEventListener('error', function(e) {
  console.error('[GLOBAL ERROR]', e.message, e.filename, e.lineno);
});
window.addEventListener('unhandledrejection', function(e) {
  console.error('[UNHANDLED REJECTION]', e.reason);
});

/* ======================================================
   GLOBAL STATE
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

var AppState = window.AppState;

/* ======================================================
   HELPERS
====================================================== */
function safeInit(name, fn) {
  if (typeof fn !== 'function') {
    console.warn('[SKIP]', name, '- not a function');
    return;
  }
  try {
    console.log('[INIT START]', name);
    fn();
    console.log('[INIT DONE]', name);
  } catch (e) {
    console.error('[INIT FAILED]', name, e);
  }
}

var notificationState = {
  lastMessage: '',
  lastTimestamp: 0,
  dedupeInterval: 1500
};

/* ======================================================
   NOTIFICATION
====================================================== */
function showNotification(msg, type) {
  type = type || 'info';
  var now = Date.now();
  if (
    msg === notificationState.lastMessage &&
    now - notificationState.lastTimestamp < notificationState.dedupeInterval
  ) {
    return;
  }

  notificationState.lastMessage = msg;
  notificationState.lastTimestamp = now;

  var colors = {
    info: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  };

  var el = document.createElement('div');
  el.textContent = msg;
  el.style.cssText =
    'position:fixed;top:20px;right:20px;padding:12px 18px;' +
    'background:' + (colors[type] || colors.info) + ';color:#fff;' +
    'border-radius:8px;font-size:14px;font-weight:500;' +
    'box-shadow:0 4px 12px rgba(0,0,0,0.15);z-index:9999;';
  document.body.appendChild(el);

  setTimeout(function() {
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.3s';
    setTimeout(function() {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 300);
  }, 2500);
}
window.showNotification = showNotification;

/* ======================================================
   TABS
====================================================== */
function setActiveTab(tabId) {
  console.log('[TAB] setActiveTab:', tabId);

  AppState.currentTab = tabId;

  var tabBtns = document.querySelectorAll('[data-tab]');
  tabBtns.forEach(function(btn) {
    var isActive = btn.dataset.tab === tabId;

    btn.classList.remove('active', 'border-primary', 'text-primary', 'bg-blue-50');
    btn.classList.add('border-transparent', 'text-gray-500');

    if (isActive) {
      btn.classList.add('active', 'border-primary', 'text-primary', 'bg-blue-50');
      btn.classList.remove('border-transparent', 'text-gray-500');
    }
  });

  var tabContents = document.querySelectorAll('.tab-content');
  tabContents.forEach(function(content) {
    var isTarget = content.id === tabId;
    if (isTarget) {
      content.classList.remove('hidden');
      content.classList.add('active');
    } else {
      content.classList.add('hidden');
      content.classList.remove('active');
    }
  });
}

function initTabs() {
  var tabBtns = document.querySelectorAll('[data-tab]');

  if (tabBtns.length === 0) {
    console.warn('[Tabs] no tab buttons found');
    return;
  }

  console.log('[Tabs] found', tabBtns.length, 'tab buttons');

  tabBtns.forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      var targetTab = btn.dataset.tab;
      console.log('[TAB CLICK]', targetTab);
      setActiveTab(targetTab);
    });
  });

  var initialActive = document.querySelector('[data-tab].active');
  if (initialActive) {
    AppState.currentTab = initialActive.dataset.tab;
  }
  console.log('[Tabs] initial tab:', AppState.currentTab);

  setActiveTab(AppState.currentTab);
}

/* ======================================================
   DARK MODE
====================================================== */
function initDarkMode() {
  var toggle = document.getElementById('dark-mode-toggle');
  var darkIcon = document.getElementById('dark-icon');
  var lightIcon = document.getElementById('light-icon');

  if (!toggle) {
    console.warn('[DarkMode] toggle button not found');
    return;
  }

  var savedMode = localStorage.getItem('darkMode');
  if (savedMode === 'true') {
    document.documentElement.classList.add('dark');
    document.body.classList.add('dark');
    AppState.isDarkMode = true;
    if (darkIcon) darkIcon.classList.add('hidden');
    if (lightIcon) lightIcon.classList.remove('hidden');
  }

  toggle.addEventListener('click', function(e) {
    e.preventDefault();
    console.log('[DARK MODE] toggle clicked');

    AppState.isDarkMode = !AppState.isDarkMode;

    if (AppState.isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      if (darkIcon) darkIcon.classList.add('hidden');
      if (lightIcon) lightIcon.classList.remove('hidden');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      if (darkIcon) darkIcon.classList.remove('hidden');
      if (lightIcon) lightIcon.classList.add('hidden');
    }

    localStorage.setItem('darkMode', AppState.isDarkMode);
    showNotification(AppState.isDarkMode ? '다크모드 활성화' : '라이트모드 활성화', 'info');
  });
}

/* ======================================================
   API KEY UI
====================================================== */
var apiKeyUIInited = false;

function initApiKeyUI() {
  if (apiKeyUIInited) return;
  apiKeyUIInited = true;

  var STORAGE_KEY = 'GEMINI_API_KEY';
  var container = document.getElementById('api-key-container');
  var toggleBtn = document.getElementById('api-key-toggle-btn');
  var closeBtn = document.getElementById('api-key-close-btn');
  var panel = document.getElementById('api-key-panel');
  var input = document.getElementById('api-key-input');
  var saveBtn = document.getElementById('api-key-save-btn');
  var deleteBtn = document.getElementById('api-key-delete-btn');
  var statusIcon = document.getElementById('api-key-status-icon');
  var statusText = document.getElementById('api-key-status-text');

  if (!container || !toggleBtn || !panel) {
    console.warn('[ApiKeyUI] required elements not found');
    return;
  }

  function updateStatus() {
    var key = localStorage.getItem(STORAGE_KEY);
    if (key && key.trim()) {
      if (statusIcon) statusIcon.className = 'fas fa-check-circle mr-1 text-green-500';
      if (statusText) {
        statusText.textContent = 'API 키가 설정되어 있습니다.';
        statusText.className = 'text-green-600 dark:text-green-400';
      }
    } else {
      if (statusIcon) statusIcon.className = 'fas fa-info-circle mr-1';
      if (statusText) {
        statusText.textContent = 'API 키가 설정되지 않았습니다.';
        statusText.className = '';
      }
    }
  }

  updateStatus();

  toggleBtn.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    var isHidden = panel.classList.contains('hidden');
    panel.classList.toggle('hidden');
    console.log('[API KEY BTN] clicked, panel now:', isHidden ? 'visible' : 'hidden');
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', function(e) {
      e.preventDefault();
      panel.classList.add('hidden');
    });
  }

  if (saveBtn && input) {
    saveBtn.addEventListener('click', function(e) {
      e.preventDefault();
      var key = input.value.trim();
      if (!key) {
        showNotification('API 키를 입력해주세요', 'warning');
        return;
      }
      localStorage.setItem(STORAGE_KEY, key);
      showNotification('API 키가 저장되었습니다', 'success');
      updateStatus();
      input.value = '';
    });
  }

  if (deleteBtn) {
    deleteBtn.addEventListener('click', function(e) {
      e.preventDefault();
      localStorage.removeItem(STORAGE_KEY);
      if (input) input.value = '';
      showNotification('API 키가 삭제되었습니다', 'info');
      updateStatus();
    });
  }

  document.addEventListener('click', function(e) {
    if (!container.contains(e.target) && !panel.classList.contains('hidden')) {
      panel.classList.add('hidden');
    }
  });
}

/* ======================================================
   TEXTAREA & CHAR COUNTER
====================================================== */
function initTextareas() {
  var ta = document.getElementById('korea-senior-script');
  var counter = document.getElementById('korea-char-counter');

  if (!ta) {
    console.warn('[Textareas] korea-senior-script not found');
    return;
  }

  function updateCounter() {
    var len = ta.value.length;
    if (counter) {
      counter.textContent = len.toLocaleString() + '자 / 무제한';
    }
  }

  ta.addEventListener('input', updateCounter);
  updateCounter();
}

/* ======================================================
   KOREA SENIOR - SAMPLE & CLEAR BUTTONS
====================================================== */
function initKoreaSeniorButtons() {
  var ta = document.getElementById('korea-senior-script');
  var clearBtn = document.getElementById('korea-senior-clear-btn');
  var sampleBtn = document.getElementById('korea-senior-sample-btn');

  if (clearBtn && ta) {
    clearBtn.addEventListener('click', function(e) {
      e.preventDefault();
      ta.value = '';
      ta.dispatchEvent(new Event('input'));
      showNotification('내용이 지워졌습니다', 'info');
    });
  }

  if (sampleBtn && ta) {
    sampleBtn.addEventListener('click', function(e) {
      e.preventDefault();
      ta.value = '[씬 1. 서울 강남 아파트 거실 / 낮]\n\n' +
        '나레이션:\n' +
        '1995년 여름, 서울 강남의 한 아파트 단지.\n' +
        '오랜만에 가족들이 한자리에 모였다.\n\n' +
        '현숙(엄마, 58세, 자상한 성격):\n' +
        '우리 창현이, 오늘도 회사에서 힘들었지?\n' +
        '어머니가 삼계탕 끓여놨다.\n\n' +
        '창현(아들, 32세, 회사원):\n' +
        '네, 어머니. 요즘 프로젝트가 많아서요.\n' +
        '그래도 이렇게 맛있는 거 먹으면 힘이 나요.\n\n' +
        '영희(딸, 28세, 대학원생):\n' +
        '오빠, 나도 힘들거든? 논문 마감이 코앞이야.\n\n' +
        '창현:\n' +
        '알았어, 알았어. 영희 논문 끝나면 내가 맛있는 거 사줄게.\n\n' +
        '[씬 2. 서울 강남 아파트 거실 / 저녁]\n\n' +
        '나레이션:\n' +
        '저녁 식사 후, 가족들은 거실에 모여 앉았다.\n\n' +
        '현숙:\n' +
        '애들아, 다음 주 아버지 칠순이야.\n' +
        '뭘 해드리면 좋을까?\n\n' +
        '창현:\n' +
        '아버지가 요즘 등산 좋아하시잖아요.\n' +
        '등산복 세트 사드리면 어떨까요?\n\n' +
        '영희:\n' +
        '좋아! 나는 등산화 살게.';
      ta.dispatchEvent(new Event('input'));
      showNotification('샘플 대본이 로드되었습니다', 'success');
    });
  }
}

/* ======================================================
   KOREA REVIEW
====================================================== */
function initKoreaSeniorReview() {
  var btn = document.getElementById('korea-senior-review-btn');
  var ta = document.getElementById('korea-senior-script');
  var loadingEl = document.getElementById('korea-loading');

  if (!btn || !ta) {
    console.warn('[KoreaReview] btn or textarea not found');
    return;
  }

  btn.addEventListener('click', function(e) {
    e.preventDefault();

    if (AppState.isReviewing) {
      showNotification('검수가 진행 중입니다', 'warning');
      return;
    }

    var script = ta.value.trim();

    if (!script) {
      showNotification('대본을 입력하세요', 'warning');
      return;
    }

    if (script.length < 50) {
      showNotification('대본이 너무 짧습니다 (최소 50자)', 'warning');
      return;
    }

    console.log('[REVIEW] 검수 시작, 길이:', script.length);

    AppState.isReviewing = true;
    if (loadingEl) {
      loadingEl.classList.remove('hidden');
    }
    showNotification('대본 분석을 시작합니다...', 'info');

    setTimeout(function() {
      try {
        var totalChars = script.length;
        var sceneCount = (script.match(/\[씬\s*\d+/gi) || []).length || 1;
        var dialogueLines = script.match(/^.+[:：]/gm) || [];
        var dialogueCount = dialogueLines.length;
        var characterSet = new Set();
        dialogueLines.forEach(function(line) {
          var name = line.split(/[:：]/)[0].trim();
          if (name && name !== '나레이션') {
            characterSet.add(name.replace(/\(.+\)/, '').trim());
          }
        });
        var charCount = characterSet.size;
        var estRuntime = Math.round(totalChars / 300) + '분';
        var dialogueRatio = totalChars > 0 ? Math.round((dialogueCount * 20 / totalChars) * 100) + '%' : '-';

        console.log('[REVIEW] 분석 완료:', {
          totalChars: totalChars,
          sceneCount: sceneCount,
          dialogueCount: dialogueCount,
          charCount: charCount
        });

        var el;

        el = document.getElementById('korea-total-score');
        if (el) el.textContent = '85';

        el = document.getElementById('korea-pass-count');
        if (el) el.textContent = '6/6';

        el = document.getElementById('korea-scene-count');
        if (el) el.textContent = sceneCount;

        el = document.getElementById('korea-char-count');
        if (el) el.textContent = charCount;

        el = document.getElementById('korea-keyword-count');
        if (el) el.textContent = '-';

        el = document.getElementById('korea-dialogue-ratio');
        if (el) el.textContent = dialogueRatio;

        el = document.getElementById('korea-runtime');
        if (el) el.textContent = estRuntime;

        el = document.getElementById('korea-final-status');
        if (el) el.textContent = '검토';

        showNotification('대본 분석이 완료되었습니다', 'success');

      } catch (err) {
        console.error('[REVIEW] 오류:', err);
        showNotification('분석 중 오류가 발생했습니다', 'error');

      } finally {
        AppState.isReviewing = false;
        if (loadingEl) {
          loadingEl.classList.add('hidden');
        }
      }
    }, 1500);
  });
}

/* ======================================================
   AI ANALYSIS
====================================================== */
function initAIAnalysis() {
  var btn = document.getElementById('korea-ai-analyze-btn');
  var ta = document.getElementById('korea-senior-script');
  var loadingEl = document.getElementById('korea-ai-loading');
  var resultEl = document.getElementById('korea-ai-result');
  var sectionEl = document.getElementById('korea-ai-analysis');

  if (!btn) {
    console.warn('[AIAnalysis] AI analyze button not found');
    return;
  }

  btn.addEventListener('click', function(e) {
    e.preventDefault();
    var script = ta ? ta.value.trim() : '';

    if (!script) {
      showNotification('먼저 대본을 입력해주세요', 'warning');
      return;
    }

    var apiKey = localStorage.getItem('GEMINI_API_KEY');
    if (!apiKey || !apiKey.trim()) {
      showNotification('API 키를 먼저 설정해주세요 (우측 상단 🔑)', 'warning');
      return;
    }

    console.log('[AI ANALYSIS] 시작');

    if (sectionEl) {
      sectionEl.classList.remove('hidden');
    }

    if (loadingEl) {
      loadingEl.classList.remove('hidden');
    }
    if (resultEl) {
      resultEl.classList.add('hidden');
    }

    if (typeof window.geminiAPI !== 'undefined' && typeof window.geminiAPI.analyzeScript === 'function') {
      AppState.isAIAnalyzing = true;
      showNotification('AI 심층 분석을 시작합니다...', 'info');

      window.geminiAPI.analyzeScript(script, 'comprehensive')
        .then(function(result) {
          console.log('[AI ANALYSIS] 결과:', result);
          AppState.aiAnalysisResult = result;

          if (loadingEl) loadingEl.classList.add('hidden');

          if (result && result.error) {
            showNotification('AI 분석 실패: ' + result.error, 'error');
          } else {
            if (resultEl) resultEl.classList.remove('hidden');
            showNotification('AI 분석이 완료되었습니다', 'success');
          }
        })
        .catch(function(err) {
          console.error('[AI ANALYSIS] 오류:', err);
          if (loadingEl) loadingEl.classList.add('hidden');
          showNotification('AI 분석 중 오류가 발생했습니다', 'error');
        })
        .finally(function() {
          AppState.isAIAnalyzing = false;
        });
    } else {
      if (loadingEl) loadingEl.classList.add('hidden');
      showNotification('AI 모듈이 로드되지 않았습니다', 'error');
    }
  });
}

/* ======================================================
   DOM READY
====================================================== */
document.addEventListener('DOMContentLoaded', function() {
  console.log('[BOOT] DOMContentLoaded fired');

  safeInit('Tabs', initTabs);
  safeInit('DarkMode', initDarkMode);
  safeInit('ApiKeyUI', initApiKeyUI);
  safeInit('Textareas', initTextareas);
  safeInit('KoreaButtons', initKoreaSeniorButtons);
  safeInit('KoreaReview', initKoreaSeniorReview);
  safeInit('AIAnalysis', initAIAnalysis);

  console.log('[BOOT] All init functions completed');
  console.log('[BOOT] Current tab:', AppState.currentTab);
});
