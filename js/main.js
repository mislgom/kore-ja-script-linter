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
   AI ANALYSIS (게이지 + 결과 표시)
====================================================== */
function initAIAnalysis() {
  var btn = document.getElementById('korea-ai-analyze-btn');
  var ta = document.getElementById('korea-senior-script');
  var progressContainer = document.getElementById('korea-ai-progress');
  var progressBar = document.getElementById('korea-ai-progress-bar');
  var progressText = document.getElementById('korea-ai-progress-text');
  var progressDone = document.getElementById('korea-ai-progress-done');
  var loadingEl = document.getElementById('korea-ai-loading');
  var resultEl = document.getElementById('korea-ai-result');
  var sectionEl = document.getElementById('korea-ai-analysis');

  if (!btn) {
    console.warn('[AIAnalysis] AI analyze button not found');
    return;
  }

  btn.addEventListener('click', function(e) {
    e.preventDefault();

    if (AppState.isAIAnalyzing) {
      showNotification('AI 분석이 진행 중입니다', 'warning');
      return;
    }

    var script = ta ? ta.value.trim() : '';

    if (!script) {
      showNotification('대본을 입력해주세요', 'warning');
      return;
    }

    if (script.length < 50) {
      showNotification('대본이 너무 짧습니다 (최소 50자)', 'warning');
      return;
    }

    var apiKey = localStorage.getItem('GEMINI_API_KEY');
    if (!apiKey || !apiKey.trim()) {
      showNotification('API 키를 먼저 설정해주세요 (우측 상단 🔑)', 'warning');
      return;
    }

    console.log('[AI ANALYSIS] 시작');

    AppState.isAIAnalyzing = true;
    btn.disabled = true;
    btn.classList.add('opacity-50', 'cursor-not-allowed');

    if (sectionEl) {
      sectionEl.classList.remove('hidden');
    }

    if (progressContainer) {
      progressContainer.classList.remove('hidden');
    }
    if (progressBar) {
      progressBar.style.width = '0%';
    }
    if (progressText) {
      progressText.textContent = '0%';
    }
    if (progressDone) {
      progressDone.classList.add('hidden');
    }
    if (resultEl) {
      resultEl.classList.add('hidden');
    }

    if (loadingEl) {
      loadingEl.classList.remove('hidden');
    }

    showNotification('AI 분석을 시작합니다...', 'info');

    var progress = 0;
    var progressInterval = setInterval(function() {
      if (progress < 90) {
        progress += Math.random() * 3 + 1;
        if (progress > 90) progress = 90;
        if (progressBar) progressBar.style.width = Math.round(progress) + '%';
        if (progressText) progressText.textContent = Math.round(progress) + '%';
      }
    }, 100);

    var analyzePromise;
    if (typeof window.geminiAPI !== 'undefined' && typeof window.geminiAPI.analyzeScript === 'function') {
      analyzePromise = window.geminiAPI.analyzeScript(script, 'comprehensive');
    } else {
      analyzePromise = new Promise(function(resolve) {
        setTimeout(function() {
          resolve({
            summary: '대본 분석이 완료되었습니다. (시뮬레이션)',
            overallScore: 85,
            verdict: '검토',
            topIssues: ['예시 이슈 1', '예시 이슈 2'],
            recommendations: ['예시 추천 1', '예시 추천 2']
          });
        }, 2000);
      });
    }

    analyzePromise
      .then(function(result) {
        console.log('[AI ANALYSIS] 결과:', result);
        AppState.aiAnalysisResult = result;

        clearInterval(progressInterval);
        if (progressBar) progressBar.style.width = '100%';
        if (progressText) progressText.textContent = '100%';

        setTimeout(function() {
          if (progressDone) {
            progressDone.classList.remove('hidden');
          }

          if (result && result.error) {
            showNotification('AI 분석 실패: ' + result.error, 'error');
          } else {
            if (resultEl) {
              resultEl.classList.remove('hidden');
            }

            var summaryEl = document.getElementById('korea-ai-summary');
            if (summaryEl && result && result.summary) {
              summaryEl.textContent = result.summary;
            }

            var overallScoreEl = document.getElementById('korea-ai-overall-score');
            if (overallScoreEl && result && result.overallScore != null) {
              overallScoreEl.textContent = String(result.overallScore);
            }

            var verdictEl = document.getElementById('korea-ai-verdict');
            if (verdictEl && result && result.verdict) {
              verdictEl.textContent = result.verdict;
            }

            if (result && result.koreaBackground) {
              var el1 = document.getElementById('ai-korea-score');
              if (el1) el1.textContent = result.koreaBackground.score || '-';
            }
            if (result && result.characterConsistency) {
              var el2 = document.getElementById('ai-char-score');
              if (el2) el2.textContent = result.characterConsistency.score || '-';
            }
            if (result && result.relationshipConsistency) {
              var el3 = document.getElementById('ai-rel-score');
              if (el3) el3.textContent = result.relationshipConsistency.score || '-';
            }
            if (result && result.storyFlow) {
              var el4 = document.getElementById('ai-flow-score');
              if (el4) el4.textContent = result.storyFlow.score || '-';
            }
            if (result && result.pacingSpeed) {
              var el5 = document.getElementById('ai-pace-score');
              if (el5) el5.textContent = result.pacingSpeed.score || '-';
            }
            if (result && result.entertainment) {
              var el6 = document.getElementById('ai-fun-score');
              if (el6) el6.textContent = result.entertainment.score || '-';
            }

            if (result && result.topIssues && result.topIssues.length > 0) {
              var issuesEl = document.getElementById('korea-ai-issues');
              if (issuesEl) {
                issuesEl.innerHTML = '';
                result.topIssues.forEach(function(item) {
                  var li = document.createElement('li');
                  li.textContent = item;
                  issuesEl.appendChild(li);
                });
              }
            }

            if (result && result.recommendations && result.recommendations.length > 0) {
              var recsEl = document.getElementById('korea-ai-recommendations');
              if (recsEl) {
                recsEl.innerHTML = '';
                result.recommendations.forEach(function(item) {
                  var li = document.createElement('li');
                  li.textContent = item;
                  recsEl.appendChild(li);
                });
              }
            }

            showNotification('AI 분석이 완료되었습니다', 'success');
          }
        }, 300);
      })
      .catch(function(err) {
        console.error('[AI ANALYSIS] 오류:', err);
        clearInterval(progressInterval);

        if (progressBar) progressBar.style.width = '100%';
        if (progressText) progressText.textContent = '100%';
        if (progressDone) progressDone.classList.remove('hidden');

        showNotification('AI 분석 중 오류가 발생했습니다: ' + (err && err.message ? err.message : String(err)), 'error');
      })
      .finally(function() {
        AppState.isAIAnalyzing = false;
        btn.disabled = false;
        btn.classList.remove('opacity-50', 'cursor-not-allowed');
        if (loadingEl) loadingEl.classList.add('hidden');
      });
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
  safeInit('AIAnalysis', initAIAnalysis);

  console.log('[BOOT] All init functions completed');
  console.log('[BOOT] Current tab:', AppState.currentTab);
});
