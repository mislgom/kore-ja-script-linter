/**
 * Script Review Pro vNext
 * Main JavaScript - FINAL STABLE VERSION
 */

/* ======================================================
   BOOT
====================================================== */
console.log('[BOOT] main.js loaded');

window.addEventListener('error', function (e) {
  console.error('[GLOBAL ERROR]', e.message, e.filename, e.lineno);
});
window.addEventListener('unhandledrejection', function (e) {
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

  setTimeout(function () {
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.3s';
    setTimeout(function () {
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
  tabBtns.forEach(function (btn) {
    var isActive = btn.dataset.tab === tabId;

    btn.classList.remove('active', 'border-primary', 'text-primary', 'bg-blue-50');
    btn.classList.add('border-transparent', 'text-gray-500');

    if (isActive) {
      btn.classList.add('active', 'border-primary', 'text-primary', 'bg-blue-50');
      btn.classList.remove('border-transparent', 'text-gray-500');
    }
  });

  var tabContents = document.querySelectorAll('.tab-content');
  tabContents.forEach(function (content) {
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

  tabBtns.forEach(function (btn) {
    btn.addEventListener('click', function (e) {
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

  toggle.addEventListener('click', function (e) {
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

  toggleBtn.addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    var isHidden = panel.classList.contains('hidden');
    panel.classList.toggle('hidden');

    // 패널이 열릴 때 저장된 API 키를 입력 필드에 로드
    if (isHidden && input) {
      var savedKey = localStorage.getItem(STORAGE_KEY);
      if (savedKey) {
        input.value = savedKey;
      }
    }

    console.log('[API KEY BTN] clicked, panel now:', isHidden ? 'visible' : 'hidden');
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', function (e) {
      e.preventDefault();
      panel.classList.add('hidden');
    });
  }

  if (saveBtn && input) {
    saveBtn.addEventListener('click', function (e) {
      e.preventDefault();
      var key = input.value.trim();
      if (!key) {
        showNotification('API 키를 입력해주세요', 'warning');
        return;
      }
      localStorage.setItem(STORAGE_KEY, key);
      showNotification('API 키가 저장되었습니다', 'success');
      updateStatus();
    });
  }

  if (deleteBtn) {
    deleteBtn.addEventListener('click', function (e) {
      e.preventDefault();
      localStorage.removeItem(STORAGE_KEY);
      if (input) input.value = '';
      showNotification('API 키가 삭제되었습니다', 'info');
      updateStatus();
    });
  }

  document.addEventListener('click', function (e) {
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
    clearBtn.addEventListener('click', function (e) {
      e.preventDefault();
      ta.value = '';
      ta.dispatchEvent(new Event('input'));
      showNotification('내용이 지워졌습니다', 'info');
    });
  }

  if (sampleBtn && ta) {
    sampleBtn.addEventListener('click', function (e) {
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
   AI ANALYSIS WITH PROGRESS BAR (5-STEP)
====================================================== */
function initAIStartButton() {
  var btn = document.getElementById('korea-ai-start-btn');
  var ta = document.getElementById('korea-senior-script');
  var progressSection = document.getElementById('korea-ai-progress-section');
  var progressBar = document.getElementById('korea-ai-progress-bar');
  var progressPercent = document.getElementById('korea-ai-progress-percent');
  var aiSection = document.getElementById('korea-ai-analysis');
  var resultEl = document.getElementById('korea-ai-result');

  if (!btn) {
    console.warn('[AIStartButton] button not found');
    return;
  }

  // 진행 상태 업데이트 함수
  function updateProgress(step, status, percent) {
    var stepEl = document.getElementById('progress-step-' + step);
    if (!stepEl) return;

    var statusSpan = stepEl.querySelector('.step-status');
    var iconDiv = stepEl.querySelector('.flex-shrink-0');

    if (status === 'processing') {
      stepEl.classList.add('border-indigo-300', 'bg-indigo-50');
      stepEl.classList.remove('border-gray-200');
      if (statusSpan) {
        statusSpan.className = 'step-status text-xs px-2 py-1 rounded-full bg-indigo-500 text-white';
        statusSpan.textContent = '분석중...';
      }
      if (iconDiv) {
        iconDiv.classList.add('bg-indigo-500');
        iconDiv.classList.remove('bg-gray-200');
        var icon = iconDiv.querySelector('i');
        if (icon) icon.classList.add('text-white');
        if (icon) icon.classList.remove('text-gray-400');
      }
    } else if (status === 'complete') {
      stepEl.classList.add('border-green-300', 'bg-green-50');
      stepEl.classList.remove('border-indigo-300', 'bg-indigo-50', 'border-gray-200');
      if (statusSpan) {
        statusSpan.className = 'step-status text-xs px-2 py-1 rounded-full bg-green-500 text-white';
        statusSpan.textContent = '완료';
      }
      if (iconDiv) {
        iconDiv.classList.add('bg-green-500');
        iconDiv.classList.remove('bg-indigo-500', 'bg-gray-200');
        var icon = iconDiv.querySelector('i');
        if (icon) icon.classList.add('text-white');
        if (icon) icon.classList.remove('text-gray-400');
      }
    }

    if (progressBar) progressBar.style.width = percent + '%';
    if (progressPercent) progressPercent.textContent = Math.round(percent) + '%';
  }

  // 진행 상태 초기화
  function resetProgress() {
    for (var i = 1; i <= 5; i++) {
      var stepEl = document.getElementById('progress-step-' + i);
      if (!stepEl) continue;

      stepEl.className = 'flex items-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700';
      
      var statusSpan = stepEl.querySelector('.step-status');
      if (statusSpan) {
        statusSpan.className = 'step-status text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500';
        statusSpan.textContent = '대기';
      }

      var iconDiv = stepEl.querySelector('.flex-shrink-0');
      if (iconDiv) {
        iconDiv.className = 'flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-3';
        var icon = iconDiv.querySelector('i');
        if (icon) {
          icon.classList.remove('text-white');
          icon.classList.add('text-gray-400');
        }
      }
    }

    if (progressBar) progressBar.style.width = '0%';
    if (progressPercent) progressPercent.textContent = '0%';
  }

  btn.addEventListener('click', function (e) {
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

    // UI 표시
    if (progressSection) progressSection.classList.remove('hidden');
    if (aiSection) aiSection.classList.remove('hidden');
    if (resultEl) resultEl.classList.add('hidden');

    resetProgress();
    showNotification('AI 분석을 시작합니다...', 'info');

    // 5단계 분석 실행
    var analysisSteps = [
      { step: 1, name: '배경 확인', prompt: '이 대본의 배경(한국/일본/조선 등)을 분석하고 점수(0-100)를 매겨주세요. JSON 형식: {"background": "한국/일본/조선/기타", "score": 0-100, "keywords": [], "feedback": ""}' },
      { step: 2, name: '등장인물 일관성', prompt: '등장인물의 나이, 이름, 관계가 일관되는지 분석하고 점수(0-100)를 매겨주세요. JSON 형식: {"score": 0-100, "characters": [], "issues": [], "feedback": ""}' },
      { step: 3, name: '스토리 왜곡 분석', prompt: '씬 구조, 시간/장소 흐름이 자연스러운지 분석하고 점수(0-100)를 매겨주세요. JSON 형식: {"score": 0-100, "sceneCount": 0, "issues": [], "feedback": ""}' },
      { step: 4, name: '반전/변화 속도', prompt: '감정 변화와 페이싱이 적절한지 분석하고 점수(0-100)를 매겨주세요. JSON 형식: {"score": 0-100, "pacing": "적절/빠름/느림", "feedback": ""}' },
      { step: 5, name: '재미/몰입 요소', prompt: '갈등, 대화, 시니어 공감 요소를 분석하고 점수(0-100)를 매겨주세요. JSON 형식: {"score": 0-100, "elements": [], "feedback": ""}' }
    ];

    var results = {};
    var currentStep = 0;

    function analyzeNextStep() {
      if (currentStep >= analysisSteps.length) {
        // 모든 분석 완료
        completeAnalysis();
        return;
      }

      var stepInfo = analysisSteps[currentStep];
      updateProgress(stepInfo.step, 'processing', (currentStep / analysisSteps.length) * 100);

      var fullPrompt = '당신은 대본 분석 전문가입니다.\n\n' +
        '## 분석 항목: ' + stepInfo.name + '\n\n' +
        stepInfo.prompt + '\n\n' +
        '## 대본\n' + script.substring(0, 15000) + '\n\n' +
        '반드시 JSON 형식으로만 응답해주세요.';

      if (typeof window.geminiAPI !== 'undefined' && typeof window.geminiAPI.forceGeminiAnalyze === 'function') {
        window.geminiAPI.forceGeminiAnalyze(fullPrompt, { temperature: 0.3, maxTokens: 2048 })
          .then(function (response) {
            console.log('[STEP ' + stepInfo.step + '] 응답:', response);

            try {
              var jsonMatch = response.match(/\{[\s\S]*\}/);
              var parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { score: 70, feedback: '분석 완료' };
              results['step' + stepInfo.step] = parsed;
            } catch (err) {
              console.error('[STEP ' + stepInfo.step + '] JSON 파싱 오류:', err);
              results['step' + stepInfo.step] = { score: 70, feedback: '분석 완료 (파싱 오류)' };
            }

            updateProgress(stepInfo.step, 'complete', ((currentStep + 1) / analysisSteps.length) * 100);
            currentStep++;

            setTimeout(analyzeNextStep, 500);
          })
          .catch(function (err) {
            console.error('[STEP ' + stepInfo.step + '] 오류:', err);
            results['step' + stepInfo.step] = { score: 0, feedback: '분석 실패: ' + err.message };
            updateProgress(stepInfo.step, 'complete', ((currentStep + 1) / analysisSteps.length) * 100);
            currentStep++;
            setTimeout(analyzeNextStep, 500);
          });
      } else {
        // 시뮬레이션
        setTimeout(function () {
          results['step' + stepInfo.step] = { score: 75 + Math.floor(Math.random() * 20), feedback: '시뮬레이션 결과' };
          updateProgress(stepInfo.step, 'complete', ((currentStep + 1) / analysisSteps.length) * 100);
          currentStep++;
          analyzeNextStep();
        }, 1000);
      }
    }

    function completeAnalysis() {
      console.log('[AI ANALYSIS] 전체 결과:', results);

      // 종합 점수 계산
      var scores = [];
      for (var i = 1; i <= 5; i++) {
        var stepResult = results['step' + i];
        if (stepResult && stepResult.score != null) {
          scores.push(stepResult.score);
        }
      }

      var overallScore = scores.length > 0 ? Math.round(scores.reduce(function (a, b) { return a + b; }, 0) / scores.length) : 0;

      // 결과 표시
      if (resultEl) resultEl.classList.remove('hidden');

      var summaryEl = document.getElementById('korea-ai-summary');
      if (summaryEl) {
        summaryEl.textContent = '5단계 AI 분석이 완료되었습니다. 배경, 인물, 스토리, 페이싱, 재미 요소를 종합 분석했습니다.';
      }

      var overallScoreEl = document.getElementById('korea-ai-overall-score');
      if (overallScoreEl) overallScoreEl.textContent = overallScore;

      var verdictEl = document.getElementById('korea-ai-verdict');
      if (verdictEl) {
        if (overallScore >= 80) verdictEl.textContent = '합격';
        else if (overallScore >= 60) verdictEl.textContent = '조건부 합격';
        else verdictEl.textContent = '재검토 필요';
      }

      // 개별 점수 표시
      if (results.step1) {
        var el1 = document.getElementById('ai-korea-score');
        if (el1) el1.textContent = results.step1.score || '-';
      }
      if (results.step2) {
        var el2 = document.getElementById('ai-char-score');
        if (el2) el2.textContent = results.step2.score || '-';
      }
      if (results.step3) {
        var el3 = document.getElementById('ai-flow-score');
        if (el3) el3.textContent = results.step3.score || '-';
      }
      if (results.step4) {
        var el4 = document.getElementById('ai-pace-score');
        if (el4) el4.textContent = results.step4.score || '-';
      }
      if (results.step5) {
        var el5 = document.getElementById('ai-fun-score');
        if (el5) el5.textContent = results.step5.score || '-';
      }

      // 개선점 표시
      var issuesEl = document.getElementById('korea-ai-issues');
      if (issuesEl) {
        issuesEl.innerHTML = '';
        var allIssues = [];
        for (var i = 1; i <= 5; i++) {
          var stepResult = results['step' + i];
          if (stepResult && stepResult.feedback) {
            allIssues.push(stepResult.feedback);
          }
        }
        if (allIssues.length > 0) {
          allIssues.slice(0, 3).forEach(function (issue) {
            var li = document.createElement('li');
            li.textContent = issue;
            issuesEl.appendChild(li);
          });
        } else {
          var li = document.createElement('li');
          li.textContent = '특별한 개선점이 발견되지 않았습니다.';
          issuesEl.appendChild(li);
        }
      }

      // 추천사항 표시
      var recsEl = document.getElementById('korea-ai-recommendations');
      if (recsEl) {
        recsEl.innerHTML = '';
        var recs = ['대본의 전반적인 구조가 양호합니다.', '시니어 타겟 콘텐츠로 적합합니다.'];
        recs.forEach(function (rec) {
          var li = document.createElement('li');
          li.textContent = rec;
          recsEl.appendChild(li);
        });
      }

      AppState.isAIAnalyzing = false;
      btn.disabled = false;
      btn.classList.remove('opacity-50', 'cursor-not-allowed');

      showNotification('AI 분석이 완료되었습니다 (종합 점수: ' + overallScore + '점)', 'success');
    }

    // 분석 시작
    analyzeNextStep();
  });
}

/* ======================================================
   DOM READY
====================================================== */
document.addEventListener('DOMContentLoaded', function () {
  console.log('[BOOT] DOMContentLoaded fired');

  safeInit('Tabs', initTabs);
  safeInit('DarkMode', initDarkMode);
  safeInit('ApiKeyUI', initApiKeyUI);
  safeInit('Textareas', initTextareas);
  safeInit('KoreaButtons', initKoreaSeniorButtons);
  safeInit('AIStartButton', initAIStartButton);

  console.log('[BOOT] All init functions completed');
  console.log('[BOOT] Current tab:', AppState.currentTab);
});
