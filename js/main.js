/* ======================================================
   DEPENDENCY GUARD - 최상단 실행
====================================================== */
// [PATCH] main.js 로드 확인용 마커
window.__MAIN_JS_LOADED__ = true;

(function () {
    window._DependencyStatus = {
        missing: [],
        loaded: [],
        allLoaded: false
    };

    var checkList = [
        { name: 'GeminiAPI', obj: 'GeminiAPI' }
    ];

    checkList.forEach(function (item) {
        if (typeof window[item.obj] !== 'undefined') {
            window._DependencyStatus.loaded.push(item.name);
        } else {
            window._DependencyStatus.missing.push(item.name);
        }
    });

    if (window._DependencyStatus.missing.length > 0) {
        console.error('[DEPENDENCY] MISSING:', window._DependencyStatus.missing);
    } else {
        window._DependencyStatus.allLoaded = true;
    }
})();

/* ======================================================
   BOOT
====================================================== */
console.log('[BOOT] main.js loaded - 5 Tabs Independent Analysis System v2.0');

window.addEventListener('error', function (e) {
    console.error('[GLOBAL ERROR]', e.message, e.filename, e.lineno);
    try { window.showNotification('GLOBAL ERROR: ' + (e && e.message ? e.message : 'unknown'), 'error'); } catch (_) { }
});
window.addEventListener('unhandledrejection', function (e) {
    console.error('[UNHANDLED REJECTION]', e.reason);
    try {
        var r = e && e.reason ? (e.reason.message || e.reason.toString ? e.reason.toString() : String(e.reason)) : 'unknown';
        window.showNotification('UNHANDLED: ' + String(r).slice(0, 180), 'error');
    } catch (_) { }
});

/* ======================================================
   GLOBAL STATE
====================================================== */
window.AppState = {
    isDarkMode: false,
    currentSelectedTab: null
};

// 5개 탭 정의
var ANALYSIS_TABS = [
    {
        id: 'background',
        title: '한국 배경 확인',
        description: '지명, 장소, 문화 요소 검사',
        promptKey: 'background',
        progress: 0,
        status: 'idle', // idle, running, success, error
        resultText: null,
        revisedScript: null,
        errorMessage: null
    },
    {
        id: 'character',
        title: '인물 설정 일관성 확인',
        description: '이름, 나이, 특성 변경 감지',
        promptKey: 'character',
        progress: 0,
        status: 'idle',
        resultText: null,
        revisedScript: null,
        errorMessage: null
    },
    {
        id: 'relationship',
        title: '인물 관계 일관성 확인',
        description: '가족/사회 관계 변경 감지',
        promptKey: 'relationship',
        progress: 0,
        status: 'idle',
        resultText: null,
        revisedScript: null,
        errorMessage: null
    },
    {
        id: 'distortion',
        title: '이야기 흐름 시간/장소 왜곡 확인',
        description: '씬 구조, 시간/장소 흐름 분석',
        promptKey: 'distortion',
        progress: 0,
        status: 'idle',
        resultText: null,
        revisedScript: null,
        errorMessage: null
    },
    {
        id: 'immersion',
        title: '재미/몰입 요소',
        description: '갈등, 대화, 시니어 공감 분석',
        promptKey: 'immersion',
        progress: 0,
        status: 'idle',
        resultText: null,
        revisedScript: null,
        errorMessage: null
    }
];

// 탭 상태 저장소
var tabStates = {};
ANALYSIS_TABS.forEach(function (tab) {
    tabStates[tab.id] = JSON.parse(JSON.stringify(tab)); // Deep copy
});

/* ======================================================
   HELPERS
====================================================== */
function checkDependencyBeforeAction(actionName) {
    if (!window._DependencyStatus || !window._DependencyStatus.allLoaded) {
        var miss = (window._DependencyStatus && window._DependencyStatus.missing)
            ? window._DependencyStatus.missing.join(', ')
            : 'unknown';

        console.error('[BLOCKED]', actionName, miss);
        showNotification('필수 스크립트 누락: ' + miss, 'error');
        return false;
    }
    return true;
}

function showNotification(message, type) {
    type = type || 'info';
    var colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500'
    };
    var color = colors[type] || colors.info;

    var notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 ' + color + ' text-white px-6 py-3 rounded-lg shadow-lg z-50 max-w-md';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(function () {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s';
        setTimeout(function () {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

/* ======================================================
   PROMPT GENERATION
====================================================== */
function generatePromptForTab(promptKey, script) {
    var prompts = {
        background: `당신은 한국 시니어 낭독용 대본 검수 전문가입니다.

다음 대본에서 "한국 배경 확인"을 수행하세요:
- 지명, 장소가 한국 실제 지명인지 확인
- 한국 문화 요소가 적절한지 확인
- 일본/중국 등 타국 요소가 섞이지 않았는지 확인

대본:
${script}

다음 JSON 형식으로 응답하세요:
{
  "analysis": "분석 결과 텍스트 (문제점 나열)",
  "revised": "수정된 대본 전체 (문제가 없으면 원본 그대로)"
}`,
        character: `당신은 한국 시니어 낭독용 대본 검수 전문가입니다.

다음 대본에서 "인물 설정 일관성 확인"을 수행하세요:
- 등장인물 이름이 중간에 바뀌지 않았는지 확인
- 나이, 직업, 특성이 일관되는지 확인
- 인물 설정 오류 발견 시 지적

대본:
${script}

다음 JSON 형식으로 응답하세요:
{
  "analysis": "분석 결과 텍스트",
  "revised": "수정된 대본 전체"
}`,
        relationship: `당신은 한국 시니어 낭독용 대본 검수 전문가입니다.

다음 대본에서 "인물 관계 일관성 확인"을 수행하세요:
- 가족 관계가 일관되는지 확인 (부모-자식, 형제 등)
- 사회 관계가 일관되는지 확인 (친구, 동료 등)
- 관계 설정 오류 발견 시 지적

대본:
${script}

다음 JSON 형식으로 응답하세요:
{
  "analysis": "분석 결과 텍스트",
  "revised": "수정된 대본 전체"
}`,
        distortion: `당신은 한국 시니어 낭독용 대본 검수 전문가입니다.

다음 대본에서 "이야기 흐름 시간/장소 왜곡 확인"을 수행하세요:
- 씬 구조가 논리적인지 확인
- 시간 흐름이 자연스러운지 확인
- 장소 이동이 합리적인지 확인

대본:
${script}

다음 JSON 형식으로 응답하세요:
{
  "analysis": "분석 결과 텍스트",
  "revised": "수정된 대본 전체"
}`,
        immersion: `당신은 한국 시니어 낭독용 대본 검수 전문가입니다.

다음 대본에서 "재미/몰입 요소"를 분석하세요:
- 갈등 구조가 명확한지 확인
- 대화가 자연스러운지 확인
- 시니어 청취자가 공감할 수 있는지 평가

대본:
${script}

다음 JSON 형식으로 응답하세요:
{
  "analysis": "분석 결과 텍스트",
  "revised": "수정된 대본 전체"
}`
    };

    return prompts[promptKey] || prompts.background;
}

/* ======================================================
   TAB ANALYSIS EXECUTION
====================================================== */
window.runAnalysisForTab = async function (tabId) {
    var tab = tabStates[tabId];

    // 1. 상태 검증
    if (tab.status === 'running') {
        console.warn('[' + tabId + '] 이미 실행 중입니다.');
        showNotification(tab.title + ' 분석이 이미 실행 중입니다.', 'warning');
        return;
    }

    // 2. 대본 확인
    var scriptTextarea = document.getElementById('korea-senior-script');
    if (!scriptTextarea) {
        console.error('[' + tabId + '] 대본 입력 영역을 찾을 수 없습니다.');
        showNotification('대본 입력 영역을 찾을 수 없습니다.', 'error');
        return;
    }

    var script = scriptTextarea.value;
    if (!script.trim()) {
        showNotification('대본을 입력해주세요.', 'warning');
        return;
    }

    // 3. 의존성 체크
    if (!checkDependencyBeforeAction('AI 분석')) {
        return;
    }

    // 4. API 키 확인
    var apiKey = localStorage.getItem('GEMINI_API_KEY');
    if (!apiKey) {
        showNotification('API 키를 먼저 설정해주세요.', 'warning');
        return;
    }

    // 5. 상태 초기화
    tab.status = 'running';
    tab.progress = 0;
    tab.resultText = null;
    tab.revisedScript = null;
    tab.errorMessage = null;

    // 6. UI 업데이트
    updateTabUI(tabId);
    disableTabButton(tabId, true);

    console.log('[' + tabId + '] AI 분석 시작');

    try {
        // 7. 진행도 시뮬레이션 (0% -> 30%)
        updateTabProgress(tabId, 10);
        await sleep(300);
        updateTabProgress(tabId, 30);

        // 8. 프롬프트 생성
        var prompt = generatePromptForTab(tab.promptKey, script);

        // 9. API 호출
        updateTabProgress(tabId, 50);
        var geminiAPI = window.GeminiAPI;
        if (!geminiAPI || !geminiAPI.generateContent) {
            throw new Error('GeminiAPI가 로드되지 않았습니다.');
        }

        var response = await geminiAPI.generateContent(prompt, {
            temperature: 0.3,
            maxOutputTokens: 4096
        });

        updateTabProgress(tabId, 80);

        // 10. 결과 파싱
        var parsed = parseAnalysisResult(response);
        tab.resultText = parsed.analysis || '분석 결과가 없습니다.';
        tab.revisedScript = parsed.revised || script;
        tab.status = 'success';
        tab.progress = 100;

        // 11. UI 업데이트
        updateTabUI(tabId);
        updateTabProgress(tabId, 100);
        showNotification(tab.title + ' 분석 완료', 'success');

        // 12. 결과 표시 (자동으로 해당 탭 선택)
        selectAnalysisTab(tabId);

    } catch (error) {
        // 13. 실패 처리 (자동 재시도 없음)
        console.error('[' + tabId + '] 분석 실패:', error);
        tab.status = 'error';
        tab.errorMessage = error.message || '분석 중 오류가 발생했습니다.';
        tab.progress = 0;

        updateTabUI(tabId);
        showNotification(tab.title + ' 분석 실패: ' + tab.errorMessage, 'error');

    } finally {
        // 14. 버튼 활성화
        disableTabButton(tabId, false);
    }
};

function parseAnalysisResult(responseText) {
    if (!responseText) {
        return { analysis: '응답이 비어있습니다.', revised: null };
    }

    try {
        // JSON 파싱 시도
        var cleaned = String(responseText)
            .replace(/```json/gi, '')
            .replace(/```/g, '')
            .trim();

        var parsed = JSON.parse(cleaned);
        return {
            analysis: parsed.analysis || '분석 결과 없음',
            revised: parsed.revised || null
        };
    } catch (e) {
        // JSON 파싱 실패 시 텍스트 그대로 반환
        console.warn('[PARSE] JSON 파싱 실패, 텍스트로 처리:', e);
        return {
            analysis: responseText,
            revised: null
        };
    }
}

function sleep(ms) {
    return new Promise(function (resolve) {
        setTimeout(resolve, ms);
    });
}

/* ======================================================
   TAB SELECTION & RESULT DISPLAY
====================================================== */
window.selectAnalysisTab = function (tabId) {
    var tab = tabStates[tabId];
    window.AppState.currentSelectedTab = tabId;

    // 탭 카드 하이라이트
    var allCards = document.querySelectorAll('.tab-card');
    allCards.forEach(function (card) {
        card.classList.remove('border-indigo-500', 'dark:border-indigo-400');
        card.classList.add('border-gray-200', 'dark:border-gray-700');
    });

    var selectedCard = document.querySelector('.tab-card[data-tab-id="' + tabId + '"]');
    if (selectedCard) {
        selectedCard.classList.remove('border-gray-200', 'dark:border-gray-700');
        selectedCard.classList.add('border-indigo-500', 'dark:border-indigo-400');
    }

    // 결과 섹션 표시
    var resultSection = document.getElementById('result-section');
    var resultTitle = document.getElementById('result-title');
    var resultText = document.getElementById('result-text');
    var revisedScript = document.getElementById('revised-script');

    if (!resultSection || !resultTitle || !resultText || !revisedScript) {
        console.error('[SELECT TAB] 결과 표시 영역을 찾을 수 없습니다.');
        return;
    }

    resultTitle.textContent = '분석 결과: ' + tab.title;

    if (tab.status === 'success' && tab.resultText) {
        resultText.innerHTML = formatResultText(tab.resultText);
        revisedScript.innerHTML = formatRevisedScript(tab.revisedScript);
        resultSection.classList.remove('hidden');
    } else if (tab.status === 'error') {
        resultText.innerHTML = '<p class="text-red-600 dark:text-red-400">❌ 오류: ' + escapeHtml(tab.errorMessage) + '</p>';
        revisedScript.innerHTML = '<p class="text-gray-500 dark:text-gray-400">수정된 대본이 없습니다.</p>';
        resultSection.classList.remove('hidden');
    } else if (tab.status === 'running') {
        resultText.innerHTML = '<p class="text-blue-600 dark:text-blue-400">⏳ 분석 진행 중...</p>';
        revisedScript.innerHTML = '<p class="text-gray-500 dark:text-gray-400">분석이 완료되면 표시됩니다.</p>';
        resultSection.classList.remove('hidden');
    } else {
        resultText.innerHTML = '<p class="text-gray-500 dark:text-gray-400">아직 분석 결과가 없습니다. "AI 분석 시작" 버튼을 클릭하세요.</p>';
        revisedScript.innerHTML = '<p class="text-gray-500 dark:text-gray-400">분석을 시작해주세요.</p>';
        resultSection.classList.remove('hidden');
    }

    // 다운로드 버튼 상태 업데이트
    updateDownloadButtonState(tabId);
};

function formatResultText(text) {
    if (!text) return '<p class="text-gray-500">결과 없음</p>';
    return '<pre class="whitespace-pre-wrap">' + escapeHtml(text) + '</pre>';
}

function formatRevisedScript(script) {
    if (!script) return '<p class="text-gray-500">수정된 대본 없음</p>';
    return '<pre class="whitespace-pre-wrap">' + escapeHtml(script) + '</pre>';
}

function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/* ======================================================
   UI UPDATE FUNCTIONS
====================================================== */
function updateTabUI(tabId) {
    var tab = tabStates[tabId];
    var statusBadge = document.getElementById('status-' + tabId);
    var progressContainer = document.getElementById('progress-container-' + tabId);

    if (!statusBadge) return;

    // 상태 배지 업데이트
    switch (tab.status) {
        case 'idle':
            statusBadge.textContent = '대기';
            statusBadge.className = 'status-badge bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full';
            break;
        case 'running':
            statusBadge.textContent = '분석 중';
            statusBadge.className = 'status-badge bg-blue-500 text-white text-xs px-2 py-1 rounded-full';
            break;
        case 'success':
            statusBadge.textContent = '완료';
            statusBadge.className = 'status-badge bg-green-500 text-white text-xs px-2 py-1 rounded-full';
            break;
        case 'error':
            statusBadge.textContent = '실패';
            statusBadge.className = 'status-badge bg-red-500 text-white text-xs px-2 py-1 rounded-full';
            break;
    }

    // 진행도 바 표시/숨김
    if (progressContainer) {
        if (tab.status === 'running') {
            progressContainer.classList.remove('hidden');
        } else {
            progressContainer.classList.add('hidden');
        }
    }
}

function updateTabProgress(tabId, percent) {
    var tab = tabStates[tabId];
    tab.progress = percent;

    var progressBar = document.getElementById('progress-bar-' + tabId);
    var progressText = document.getElementById('progress-text-' + tabId);

    if (progressBar) {
        progressBar.style.width = percent + '%';
    }
    if (progressText) {
        progressText.textContent = percent + '%';
    }
}

function disableTabButton(tabId, disabled) {
    var button = document.querySelector('.btn-analyze[data-tab-id="' + tabId + '"]');
    if (!button) return;

    button.disabled = disabled;
    if (disabled) {
        button.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
        button.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}

/* ======================================================
   INITIALIZATION
====================================================== */
function initDarkMode() {
    var darkModeToggle = document.getElementById('dark-mode-toggle');
    if (!darkModeToggle) return;

    // 로컬스토리지에서 다크모드 설정 불러오기
    var isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
        document.documentElement.classList.add('dark');
        window.AppState.isDarkMode = true;
        darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }

    darkModeToggle.addEventListener('click', function () {
        document.documentElement.classList.toggle('dark');
        window.AppState.isDarkMode = !window.AppState.isDarkMode;
        localStorage.setItem('darkMode', window.AppState.isDarkMode);

        if (window.AppState.isDarkMode) {
            darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }
    });
}

function initApiKeyUI() {
    var toggleBtn = document.getElementById('api-key-toggle-btn');
    var panel = document.getElementById('api-key-panel');
    var closeBtn = document.getElementById('api-key-close-btn');
    var saveBtn = document.getElementById('api-key-save-btn');
    var deleteBtn = document.getElementById('api-key-delete-btn');
    var input = document.getElementById('api-key-input');
    var statusText = document.getElementById('api-key-status-text');
    var statusIcon = document.getElementById('api-key-status-icon');

    if (!toggleBtn || !panel) return;

    // API 키 상태 확인
    var apiKey = localStorage.getItem('GEMINI_API_KEY');
    if (apiKey) {
        statusText.textContent = 'API 키 등록됨';
        statusIcon.textContent = '✅';
    }

    toggleBtn.addEventListener('click', function () {
        panel.classList.toggle('hidden');
        if (!panel.classList.contains('hidden')) {
            input.value = localStorage.getItem('GEMINI_API_KEY') || '';
        }
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', function () {
            panel.classList.add('hidden');
        });
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', function () {
            var key = input.value.trim();
            if (key) {
                localStorage.setItem('GEMINI_API_KEY', key);
                statusText.textContent = 'API 키 등록됨';
                statusIcon.textContent = '✅';
                showNotification('API 키가 저장되었습니다.', 'success');
                panel.classList.add('hidden');
            } else {
                showNotification('API 키를 입력해주세요.', 'warning');
            }
        });
    }

    if (deleteBtn) {
        deleteBtn.addEventListener('click', function () {
            localStorage.removeItem('GEMINI_API_KEY');
            input.value = '';
            statusText.textContent = 'API 키 설정';
            statusIcon.textContent = '🔑';
            showNotification('API 키가 삭제되었습니다.', 'info');
            panel.classList.add('hidden');
        });
    }
}

function initScriptButtons() {
    var sampleBtn = document.getElementById('korea-senior-sample-btn');
    var clearBtn = document.getElementById('korea-senior-clear-btn');
    var textarea = document.getElementById('korea-senior-script');
    var charCounter = document.getElementById('korea-char-counter');

    if (sampleBtn && textarea) {
        sampleBtn.addEventListener('click', function () {
            textarea.value = '[제 1회 드라마 대본 / 씬1]\n\n' +
                '나레이션:\n' +
                '1995년 여름, 서울 강남의 한 아파트 단지.\n' +
                '오랜만에 가족들이 한자리에 모였다.\n\n' +
                '[씬 1. 서울 강남 아파트 거실 / 낮]\n\n' +
                '(거실. 소파에 앉아 있는 할머니(75세, 김순자)와 손녀(20세, 이지은))\n\n' +
                '지은: 할머니, 오늘 날씨 정말 좋죠?\n' +
                '순자: 그러게. 이렇게 맑은 날은 오랜만이야.\n\n' +
                '나레이션:\n' +
                '두 사람은 따뜻한 햇살 아래에서 옛 이야기를 나누기 시작했다.';

            if (charCounter) {
                charCounter.textContent = textarea.value.length + '자 / 무제한';
            }
            showNotification('샘플 대본이 로드되었습니다.', 'success');
        });
    }

    if (clearBtn && textarea) {
        clearBtn.addEventListener('click', function () {
            textarea.value = '';
            if (charCounter) {
                charCounter.textContent = '0자 / 무제한';
            }
            showNotification('대본이 지워졌습니다.', 'info');
        });
    }

    if (textarea && charCounter) {
        textarea.addEventListener('input', function () {
            charCounter.textContent = textarea.value.length + '자 / 무제한';
        });
    }
}

/* ======================================================
   DOWNLOAD REVISED SCRIPT
====================================================== */
function initDownloadButton() {
    var downloadBtn = document.getElementById('download-revised-btn');
    if (!downloadBtn) return;

    downloadBtn.addEventListener('click', function () {
        var currentTab = window.AppState.currentSelectedTab;
        if (!currentTab) {
            showNotification('탭을 먼저 선택해주세요.', 'warning');
            return;
        }

        var tab = tabStates[currentTab];
        if (!tab || !tab.revisedScript) {
            showNotification('다운로드할 수정된 대본이 없습니다.', 'warning');
            return;
        }

        downloadRevisedScript(tab.title, tab.revisedScript);
    });
}

function updateDownloadButtonState(tabId) {
    var downloadBtn = document.getElementById('download-revised-btn');
    if (!downloadBtn) return;

    var tab = tabStates[tabId];

    // revisedScript가 있고 성공 상태일 때만 활성화
    if (tab && tab.status === 'success' && tab.revisedScript) {
        downloadBtn.disabled = false;
    } else {
        downloadBtn.disabled = true;
    }
}

function downloadRevisedScript(tabTitle, scriptContent) {
    // 파일명 생성: 탭제목_YYYY-MM-DD.txt
    var today = new Date();
    var dateStr = today.getFullYear() + '-' +
        String(today.getMonth() + 1).padStart(2, '0') + '-' +
        String(today.getDate()).padStart(2, '0');

    // 특수문자 제거 (공백은 언더스코어로)
    var safeTitle = tabTitle.replace(/[^\w\sㄱ-ㅎㅏ-ㅣ가-힣]/g, '').replace(/\s+/g, '_');
    var filename = safeTitle + '_' + dateStr + '.txt';

    // Blob 생성 및 다운로드
    var blob = new Blob([scriptContent], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showNotification('수정된 대본이 다운로드되었습니다: ' + filename, 'success');
}


/* ======================================================
   DOM READY
====================================================== */
document.addEventListener('DOMContentLoaded', function () {
    console.log('[BOOT] DOMContentLoaded fired');

    // 의존성 체크 (경고만, 중단하지 않음)
    var depErrors = [];
    if (typeof GeminiAPI === 'undefined') depErrors.push('GeminiAPI');

    if (depErrors.length > 0) {
        console.warn('[DEPENDENCY] ⚠️ 일부 스크립트 누락:', depErrors.join(', '));
        console.warn('[DEPENDENCY] 기본 UI는 동작하지만, AI 분석 기능이 제한될 수 있습니다.');
    } else {
        console.log('[BOOT] ✅ 필수 의존성 체크 통과');
    }

    // 초기화
    initDarkMode();
    initApiKeyUI();
    initScriptButtons();
    initDownloadButton();

    console.log('[BOOT] ✅ 초기화 완료');
});
document.addEventListener('DOMContentLoaded', function () {
    ...
});
