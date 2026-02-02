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

// 전역 카테고리 상태 (HTML onclick에서 접근 가능)
var analysisByCategory = {};
var selectedCategory = 'background';
var categoryRequirements = {
  background: { name: "배경확인", required: 100, type: "필수" },
  character: { name: "등장인물 일관성", required: 100, type: "필수" },
  distortion: { name: "스토리 왜곡 분석", required: 100, type: "필수" },
  twistPace: { name: "반전/변화 속도", required: 100, type: "권장" },
  immersion: { name: "재미/몰입 요소", required: 100, type: "권장" }
};

// API 호출 상태 관리
var apiCallState = {
  isProcessing: false,
  lastCallTime: 0
};


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
   CATEGORY TAB SELECTION (GLOBAL)
====================================================== */
function selectCategory(category) {
  console.log('[CATEGORY CLICK] 카테고리 선택:', category);
  console.log('[CATEGORY CLICK] analysisByCategory 상태:', analysisByCategory);

  // 전역 변수 접근
  if (typeof analysisByCategory === 'undefined') {
    console.error('[CATEGORY CLICK] analysisByCategory가 정의되지 않음!');
    return;
  }

  if (!analysisByCategory[category]) {
    console.warn('[CATEGORY CLICK] 데이터 없음:', category);
    console.warn('[CATEGORY CLICK] 사용 가능한 카테고리:', Object.keys(analysisByCategory));
    return;
  }

  selectedCategory = category;
  console.log('[CATEGORY CLICK] selectedCategory 업데이트:', selectedCategory);

  // 모든 카드에서 active 제거
  document.querySelectorAll('.score-card').forEach(function (card) {
    card.classList.remove('active', 'border-indigo-500', 'bg-indigo-50');
  });

  // 선택된 카드에 active 추가
  var selectedCard = document.querySelector('[data-category="' + category + '"]');
  if (selectedCard) {
    selectedCard.classList.add('active', 'border-indigo-500', 'bg-indigo-50');
    console.log('[CATEGORY CLICK] 카드 active 스타일 적용 완료');
  } else {
    console.error('[CATEGORY CLICK] 카드를 찾을 수 없음:', category);
  }

  // 피드백 영역 업데이트
  updateCategoryFeedback(category);
}

function updateCategoryFeedback(category) {
  console.log('[CATEGORY FEEDBACK] 피드백 업데이트 시작:', category);
  var data = analysisByCategory[category];
  if (!data) {
    console.error('[CATEGORY FEEDBACK] 데이터 없음:', category);
    return;
  }

  // 제목 업데이트
  var issuesTitle = document.getElementById('category-issues-title');
  var fixesTitle = document.getElementById('category-fixes-title');
  if (issuesTitle) issuesTitle.textContent = data.name + ' - 분석 결과';
  if (fixesTitle) fixesTitle.textContent = data.name + ' - 수정 반영';

  // 분석 결과 (빨강)
  var issuesList = document.getElementById('category-issues-list');
  if (issuesList) {
    issuesList.innerHTML = '';
    if (data.issues && data.issues.length > 0) {
      data.issues.forEach(function (issue) {
        var li = document.createElement('li');
        li.innerHTML = '<strong>' + issue.text + '</strong> - ' + issue.reason;
        issuesList.appendChild(li);
      });
      console.log('[CATEGORY FEEDBACK] issues 표시 완료:', data.issues.length + '개');
    } else {
      issuesList.innerHTML = '<li>발견된 문제가 없습니다.</li>';
      console.log('[CATEGORY FEEDBACK] issues 없음');
    }
  }

  // 수정 반영 (초록)
  var fixesList = document.getElementById('category-fixes-list');
  if (fixesList) {
    fixesList.innerHTML = '';
    if (data.fixes && data.fixes.length > 0) {
      data.fixes.forEach(function (fix) {
        var li = document.createElement('li');
        li.innerHTML = '<span class="line-through">' + fix.before + '</span> → <strong>' + fix.after + '</strong> (' + fix.reason + ')';
        fixesList.appendChild(li);
      });
      console.log('[CATEGORY FEEDBACK] fixes 표시 완료:', data.fixes.length + '개');
    } else {
      fixesList.innerHTML = '<li>수정 사항이 없습니다.</li>';
      console.log('[CATEGORY FEEDBACK] fixes 없음');
    }
  }

  console.log('[CATEGORY FEEDBACK] 피드백 업데이트 완료');
}

// 전역 스코프에 노출 (HTML onclick에서 접근 가능)
window.selectCategory = selectCategory;
window.updateCategoryFeedback = updateCategoryFeedback;

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

    // Step 0 + 5단계 분석 실행 (총 6단계)
    var analysisSteps = [
      {
        step: 0,
        name: '대본 파악/숙지',
        category: 'comprehension',
        prompt: '당신은 대본 분석 전문가입니다. 먼저 아래 대본을 끝까지 읽고 완전히 이해하세요.\n\n대본:\n{SCRIPT}\n\n위 대본을 읽고 다음 정보를 파악하세요:\n1. 주요 등장인물과 관계\n2. 시간적/공간적 배경\n3. 핵심 플롯과 갈등\n4. 전체 스토리 흐름\n\nJSON 형식으로 응답:\n{\n  "comprehended": true,\n  "summary": "대본 핵심 요약 (2-3문장, 결말 노출 금지)",\n  "characters": ["인물1", "인물2"],\n  "setting": "배경 정보",\n  "plotPoints": ["주요 사건1", "주요 사건2"]\n}'
      },
      {
        step: 1,
        name: '배경확인',
        category: 'background',
        prompt: '[대본 파악 완료] 이제 배경을 분석합니다.\n\n이 대본의 배경(한국/일본/조선 등)을 분석하고 점수(0-100)를 매겨주세요.\n\nJSON 형식:\n{\n  "score": 0-100,\n  "issues": [\n    {"text": "문제 설명", "reason": "근거/발췌", "type": "배경충돌"}\n  ],\n  "fixes": [\n    {"before": "수정 전", "after": "수정 후", "reason": "수정 이유"}\n  ]\n}'
      },
      {
        step: 2,
        name: '등장인물 일관성',
        category: 'character',
        prompt: '등장인물의 나이, 이름, 관계가 일관되는지 분석하고 점수(0-100)를 매겨주세요.\n\nJSON 형식:\n{\n  "score": 0-100,\n  "issues": [\n    {"text": "문제 설명", "reason": "근거/발췌", "type": "인물명 불일치"}\n  ],\n  "fixes": [\n    {"before": "수정 전", "after": "수정 후", "reason": "수정 이유"}\n  ]\n}'
      },
      {
        step: 3,
        name: '스토리 왜곡 분석',
        category: 'distortion',
        prompt: '씬 구조, 시간/장소 흐름이 자연스러운지 분석하고 점수(0-100)를 매겨주세요.\n\nJSON 형식:\n{\n  "score": 0-100,\n  "issues": [\n    {"text": "문제 설명", "reason": "근거/발췌", "type": "시간흐름 단절"}\n  ],\n  "fixes": [\n    {"before": "수정 전", "after": "수정 후", "reason": "수정 이유"}\n  ]\n}'
      },
      {
        step: 4,
        name: '반전/변화 속도',
        category: 'twistPace',
        prompt: '감정 변화와 페이싱이 적절한지 분석하고 점수(0-100)를 매겨주세요.\n\nJSON 형식:\n{\n  "score": 0-100,\n  "issues": [\n    {"text": "문제 설명", "reason": "근거/발췌", "type": "페이싱 급변"}\n  ],\n  "fixes": [\n    {"before": "수정 전", "after": "수정 후", "reason": "수정 이유"}\n  ]\n}'
      },
      {
        step: 5,
        name: '재미/몰입 요소',
        category: 'immersion',
        prompt: '갈등, 대화, 시니어 공감 요소를 분석하고 점수(0-100)를 매겨주세요.\n\nJSON 형식:\n{\n  "score": 0-100,\n  "issues": [\n    {"text": "문제 설명", "reason": "근거/발췌", "type": "몰입 저하"}\n  ],\n  "fixes": [\n    {"before": "수정 전", "after": "수정 후", "reason": "수정 이유"}\n  ]\n}'
      }
    ];

    var results = {};
    var comprehensionResult = null;
    var currentStep = 0;

    function analyzeNextStep() {
      if (currentStep >= analysisSteps.length) {
        // 모든 분석 완료
        completeAnalysis();
        return;
      }

      var stepInfo = analysisSteps[currentStep];
      updateProgress(stepInfo.step, 'processing', (currentStep / analysisSteps.length) * 100);

      var prompt = stepInfo.prompt.replace('{SCRIPT}', script.substring(0, 30000));

      if (stepInfo.step > 0 && comprehensionResult) {
        var context = "## 대본 파악 정보 (참고용):\n" + JSON.stringify(comprehensionResult, null, 2) + "\n\n";
        prompt = context + prompt;
      }

      console.log('[STEP ' + stepInfo.step + '] 요청 시작');

      callGeminiWithRetry(prompt)
        .then(function (responseText) {
          console.log('[STEP ' + stepInfo.step + '] 응답:', responseText);
          try {
            // JSON 파싱 (마크다운 코드 블록 제거)
            var jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            var result = JSON.parse(jsonStr);

            if (stepInfo.step === 0) {
              comprehensionResult = result;
            } else {
              results['step' + stepInfo.step] = result;
            }
            updateProgress(stepInfo.step, 'complete', ((currentStep + 1) / analysisSteps.length) * 100);
            currentStep++;
            setTimeout(analyzeNextStep, 4000); // 다음 단계 전 4초 대기
          } catch (e) {
            console.error('[STEP ' + stepInfo.step + '] JSON Parse Error:', e);
            throw new Error('응답 처리 실패 (JSON 파싱 오류)');
          }
        })
        .catch(function (err) {
          console.error('[STEP ' + stepInfo.step + '] 오류:', err);
          updateProgress(stepInfo.step, 'error', ((currentStep) / analysisSteps.length) * 100);
          showNotification('분석 중 오류 발생: ' + err.message, 'error');
          AppState.isAIAnalyzing = false;
          btn.disabled = false;
          btn.classList.remove('opacity-50', 'cursor-not-allowed');
        });
    }

    // 카테고리 상태는 이제 전역 변수로 관리됨 (파일 상단 참조)

    function completeAnalysis() {
      console.log('[AI ANALYSIS] 전체 결과:', results);

      // 기존 results를 analysisByCategory로 변환
      analysisByCategory = {
        background: parseStepResult(results.step1, "배경확인"),
        character: parseStepResult(results.step2, "등장인물 일관성"),
        distortion: parseStepResult(results.step3, "스토리 왜곡 분석"),
        twistPace: parseStepResult(results.step4, "반전/변화 속도"),
        immersion: parseStepResult(results.step5, "재미/몰입 요소")
      };

      // 점수 표시 (5개 항목)
      var categories = ['background', 'character', 'distortion', 'twistPace', 'immersion'];
      var ids = ['ai-background-score', 'ai-character-score', 'ai-distortion-score', 'ai-twistPace-score', 'ai-immersion-score'];

      categories.forEach(function (cat, idx) {
        if (analysisByCategory[cat]) {
          var el = document.getElementById(ids[idx]);
          if (el) el.textContent = analysisByCategory[cat].score || 0;
        }
      });

      // 합격/불합격 판정
      var passed = calculateOverallVerdict();

      // 기본 카테고리 선택
      selectCategory('background');

      // 결과 표시
      if (resultEl) resultEl.classList.remove('hidden');

      var summaryEl = document.getElementById('korea-ai-summary');
      if (summaryEl) {
        if (comprehensionResult && comprehensionResult.summary) {
          summaryEl.textContent = '[대본 파악] ' + comprehensionResult.summary;
        } else {
          summaryEl.textContent = passed
            ? '모든 항목이 기준을 충족했습니다. 대본이 승인되었습니다.'
            : '일부 항목이 기준에 미달했습니다. 수정이 필요합니다.';
        }
      }

      // 종합 점수 계산
      var scores = [];
      for (var i = 1; i <= 5; i++) {
        var stepResult = results['step' + i];
        if (stepResult && stepResult.score != null) {
          scores.push(stepResult.score);
        }
      }
      var overallScore = scores.length > 0 ? Math.round(scores.reduce(function (a, b) { return a + b; }, 0) / scores.length) : 0;

      var overallScoreEl = document.getElementById('korea-ai-overall-score');
      if (overallScoreEl) overallScoreEl.textContent = overallScore;

      var verdictEl = document.getElementById('korea-ai-verdict');
      if (verdictEl) {
        if (overallScore >= 80) verdictEl.textContent = '합격';
        else if (overallScore >= 60) verdictEl.textContent = '조건부 합격';
        else verdictEl.textContent = '재검토 필요';
      }

      AppState.isAIAnalyzing = false;
      btn.disabled = false;
      btn.classList.remove('opacity-50', 'cursor-not-allowed');

      var message = passed
        ? 'AI 분석 완료: 합격 ✓'
        : 'AI 분석 완료: 실패 - 수정 필요';
      showNotification(message, passed ? 'success' : 'warning');
    }

    function parseStepResult(stepData, categoryName) {
      if (!stepData) {
        return {
          name: categoryName,
          score: 0,
          issues: [],
          fixes: []
        };
      }

      // feedback을 issues로 변환
      var issues = [];
      var fixes = [];

      if (stepData.feedback) {
        issues.push({
          text: stepData.feedback,
          reason: "AI 분석 결과"
        });
      }

      return {
        name: categoryName,
        score: stepData.score || 0,
        issues: issues,
        fixes: fixes
      };
    }

    function calculateOverallVerdict() {
      var failedCategories = [];
      var allPassed = true;

      Object.keys(categoryRequirements).forEach(function (key) {
        var req = categoryRequirements[key];
        var category = analysisByCategory[key];
        var score = category ? category.score : 0;

        if (score < req.required) {
          allPassed = false;
          failedCategories.push({
            name: req.name,
            score: score,
            required: req.required,
            type: req.type
          });
        }

        // 점수 카드에 아이콘 표시
        updateScoreCardStatus(key, score, req.required);
      });

      // 종합 판정 배너 표시
      showVerdictBanner(allPassed, failedCategories);

      return allPassed;
    }

    function updateScoreCardStatus(category, score, required) {
      var card = document.querySelector('[data-category="' + category + '"]');
      if (!card) return;

      var icon = card.querySelector('.score-status-icon');
      if (!icon) return;

      icon.classList.remove('hidden', 'fa-check-circle', 'fa-times-circle', 'text-green-600', 'text-red-600');

      if (score >= required) {
        // 합격
        icon.classList.add('fa-check-circle', 'text-green-600');
        icon.classList.remove('hidden');
        card.classList.add('border-green-500');
        card.classList.remove('border-red-500');
      } else {
        // 불합격
        icon.classList.add('fa-times-circle', 'text-red-600');
        icon.classList.remove('hidden');
        card.classList.add('border-red-500');
        card.classList.remove('border-green-500');
      }
    }

    function showVerdictBanner(passed, failedCategories) {
      var banner = document.getElementById('overall-verdict-banner');
      var passDiv = document.getElementById('verdict-pass');
      var failDiv = document.getElementById('verdict-fail');

      if (!banner || !passDiv || !failDiv) return;

      banner.classList.remove('hidden');

      if (passed) {
        // 합격
        passDiv.classList.remove('hidden');
        failDiv.classList.add('hidden');
        banner.classList.add('bg-green-50', 'border-green-500');
        banner.classList.remove('bg-red-50', 'border-red-500');
      } else {
        // 불합격
        passDiv.classList.add('hidden');
        failDiv.classList.remove('hidden');
        banner.classList.add('bg-red-50', 'border-red-500');
        banner.classList.remove('bg-green-50', 'border-green-500');

        // 실패 이유 표시
        var failReason = document.getElementById('fail-reason');
        if (failReason && failedCategories.length > 0) {
          var reasons = failedCategories.map(function (cat) {
            return cat.name + ': ' + cat.score + '점 (' + cat.type + ' ' + cat.required + '점)';
          }).join(', ');
          failReason.textContent = '미달 항목: ' + reasons;
        }
      }
    }

    // 분석 시작
    analyzeNextStep();
  });
}



/* ======================================================
   FULL SCRIPT AUTO-FIX
====================================================== */
/* ======================================================
   FULL SCRIPT AUTO-FIX & API UTILS
====================================================== */

// API 호출 유틸리티 (레이트 리밋 및 재시도)
async function callGeminiWithRetry(prompt, isJson = true, retries = 2) {
  if (apiCallState.isProcessing) {
    throw new Error('API 호출이 진행 중입니다. 잠시만 기다려주세요.');
  }

  // 최소 호출 간격 (4초)
  var now = Date.now();
  var timeSinceLastCall = now - apiCallState.lastCallTime;
  if (timeSinceLastCall < 4000) {
    await new Promise(resolve => setTimeout(resolve, 4000 - timeSinceLastCall));
  }

  apiCallState.isProcessing = true;
  apiCallState.lastCallTime = Date.now();

  var apiKey = localStorage.getItem('GEMINI_API_KEY');
  if (!apiKey) {
    apiCallState.isProcessing = false;
    throw new Error('API 키가 없습니다.');
  }

  var url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=' + apiKey;

  for (var i = 0; i <= retries; i++) {
    try {
      var bodyConfig = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 8192
        }
      };

      if (isJson) {
        bodyConfig.generationConfig.responseMimeType = "application/json";
      }

      var response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyConfig)
      });

      if (response.status === 429) {
        console.warn('[API] Rate limit exceeded. Waiting...');
        await new Promise(resolve => setTimeout(resolve, 40000)); // 40초 대기
        continue;
      }

      if (!response.ok) {
        throw new Error('API Error: ' + response.status);
      }

      var data = await response.json();
      apiCallState.isProcessing = false;

      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Invalid API response format');
      }

      return data.candidates[0].content.parts[0].text;

    } catch (err) {
      console.error('[API] Attempt ' + (i + 1) + ' failed:', err);
      if (i === retries) {
        apiCallState.isProcessing = false;
        throw err;
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

function initAutoFixAllButton() {
  var btn = document.getElementById('auto-fix-all-btn');
  if (!btn) {
    console.warn('[AUTO-FIX-ALL] 버튼 없음');
    return;
  }

  btn.addEventListener('click', async function (e) {
    e.preventDefault();

    var originalScript = document.getElementById('korea-senior-script');
    if (!originalScript || !originalScript.value.trim()) {
      alert('대본을 먼저 입력해주세요.');
      return;
    }

    var scriptText = originalScript.value.trim();

    if (btn.disabled) {
      alert('이미 수정 작업이 진행 중입니다.');
      return;
    }

    // analysisByCategory 확인
    if (typeof analysisByCategory === 'undefined' || Object.keys(analysisByCategory).length === 0) {
      alert('먼저 AI 분석을 실행해주세요.');
      return;
    }

    // 모든 카테고리의 fixes 병합
    var allFixes = [];
    Object.keys(analysisByCategory).forEach(function (key) {
      var category = analysisByCategory[key];
      if (category.fixes && category.fixes.length > 0) {
        // 카테고리 정보 추가
        var fixesWithCat = category.fixes.map(function (f) {
          f.category = key;
          return f;
        });
        allFixes = allFixes.concat(fixesWithCat);
      }
    });

    if (allFixes.length === 0) {
      alert('수정할 항목이 없습니다.');
      return;
    }

    // 중복 제거 및 우선순위 정렬
    var mergedFixes = deduplicateAndPrioritizeFixes(allFixes);

    var confirmMsg = '총 ' + mergedFixes.length + '개의 수정 사항(중복 제거됨)을 반영하여 전체 대본을 100점으로 자동 수정하시겠습니까?\n\n수정 후 TXT 파일로 다운로드됩니다.';
    if (!confirm(confirmMsg)) return;

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>100점 반영 수정 중...';

    try {
      // 수정 사항 요약 생성
      var fixSummary = mergedFixes.map(function (fix, idx) {
        return (idx + 1) + '. [' + fix.category + '] "' + fix.before + '" → "' + fix.after + '" (' + fix.reason + ')';
      }).join('\n');

      var prompt = '다음 대본을 아래 수정 사항에 따라 전체적으로 수정하여 100점짜리 대본으로 만드세요.\n\n' +
        '## 수정 사항:\n' + fixSummary + '\n\n' +
        '## 중요:\n' +
        '1. 수정된 전체 대본만 반환하세요.\n' +
        '2. 설명이나 주석 없이 대본 텍스트만 출력하세요.\n' +
        '3. 원본의 형식을 유지하세요.\n\n' +
        '## 원본 대본:\n' + scriptText;

      // API 호출 (JSON 아님, 텍스트 반환)
      var fixedScript = await callGeminiWithRetry(prompt, false);

      // 다운로드
      downloadScript(fixedScript);

      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-magic mr-2"></i>전체 100점 반영 자동 수정';
      showNotification('100점 반영 수정이 완료되어 다운로드되었습니다.', 'success');

    } catch (error) {
      console.error('[AUTO-FIX-ALL] 오류:', error);
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-magic mr-2"></i>전체 100점 반영 자동 수정';
      alert('수정 중 오류가 발생했습니다:\n' + error.message);
    }
  });
}

function deduplicateAndPrioritizeFixes(fixes) {
  // 중복 제거 (before 텍스트 기준)
  var seen = {};
  var unique = [];

  fixes.forEach(function (fix) {
    // 공백 제거 후 비교
    var key = fix.before ? fix.before.trim() : '';
    if (key && !seen[key]) {
      seen[key] = true;
      unique.push(fix);
    }
  });

  // 우선순위 정렬: character > distortion > twistPace > immersion > background
  var priority = {
    'character': 1,
    'distortion': 2,
    'twistPace': 3,
    'immersion': 4,
    'background': 5
  };

  unique.sort(function (a, b) {
    var aPriority = priority[a.category] || 999;
    var bPriority = priority[b.category] || 999;
    return aPriority - bPriority;
  });
