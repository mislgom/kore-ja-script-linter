/**
 * Script Review Pro vNext
 * Main JavaScript - API DEBUG VERSION
 */

/* ======================================================
   BOOT
====================================================== */
console.log('[BOOT] main.js loaded - API Debug Version vNEXT-ERRTRACE-001');

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
   PATCH: 429/404/빈응답 안정화 (지수 백오프 + Step별 쿨다운 + maxOutputTokens 축소 + 모델검증 강화)
   - UI/디자인/탭/UX 변경 없음
   - 기존 코드 삭제/이동 최소화(가능하면 추가로 해결)
   - 적용 전 main.js.bak 또는 git commit/tag로 백업 권장
====================================================== */

/* ======================================================
   [1] 중복 callGeminiWithRetry 정의 제거 가드 - REMOVED (Unnecessary)
====================================================== */

/* =========================
   1) [ADD] 공통 유틸/레이트리밋/토큰 설정
   - main.js 상단(전역 설정/유틸 영역) 아무 곳에나 추가
========================= */
window.ApiStability = window.ApiStability || {
    // 토큰 부담 완화: 기본 8192 등 큰 값이면 4096(또는 2048)로 낮추기
    DEFAULT_MAX_OUTPUT_TOKENS: 4096,
    // Step별 추가 쿨다운 (연속 호출이 쌓여 Step2/4에서 터지는 현상 완화)
    STEP_COOLDOWN_MS: {
        2: 15000,
        4: 30000,
    },
    // 429 지수 백오프 (20→40→80→120초 cap) + 약간의 지터
    BACKOFF_BASE_MS: 20000,
    BACKOFF_CAP_MS: 120000,
    // 호출 간 최소 간격(기존 4초가 있다면 더 큰 값으로 올리지 말고 유지)
    MIN_CALL_INTERVAL_MS: 4000,
};

function sleep(ms) {
    return new Promise((res) => setTimeout(res, ms));
}
function jitter(ms) {
    const j = Math.floor(ms * 0.1); // ±10%
    return ms + Math.floor((Math.random() * 2 - 1) * j);
}
function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
}
function normalizeHttpStatus(err) {
    const msg = (err && (err.message || err.toString())) ? (err.message || err.toString()) : '';
    const m = msg.match(/\b(4\d\d|5\d\d)\b/);
    const statusFromMsg = m ? parseInt(m[1], 10) : null;
    const status = err && typeof err.status === 'number' ? err.status : statusFromMsg;
    return status || null;
}
function isEmptyAiText(txt) {
    if (!txt) return true;
    const t = String(txt).trim();
    if (!t) return true;
    if (t === '{}' || t === '[]') return true;
    // 모델이 가끔 "null" 같은 텍스트로 주는 케이스 방지
    if (t.toLowerCase() === 'null' || t.toLowerCase() === 'undefined') return true;
    return false;
}

/* =========================
   2) [ADD/REPLACE] 모델 선택/검증 강화
   - 기존 ListModels 프리플라이트 이후 selectedModel 세팅 부분을 아래 로직으로 교체
   - 목적: 404 재발 방지 (generateContent 지원 모델만 선택)
========================= */
function pickFirstGenerateContentModel(models) {
    if (!Array.isArray(models)) return null;

    // Google ListModels 응답에서 보통 model.name, supportedGenerationMethods 등이 존재
    const canGenerate = (m) => {
        const methods = m && m.supportedGenerationMethods;
        if (!methods) return true; // 필드가 없으면 보수적으로 통과(기존 호환)
        return Array.isArray(methods) && methods.includes('generateContent');
    };

    // 우선순위: flash 계열 → pro 계열 → 그 외
    const prefer = [
        /flash/i,
        /pro/i,
        /gemini/i,
    ];

    const filtered = models.filter((m) => m && m.name && canGenerate(m));
    if (!filtered.length) return null;

    for (const rx of prefer) {
        const hit = filtered.find((m) => rx.test(m.name));
        if (hit) return hit.name;
    }
    return filtered[0].name;
}

/* 예시: 기존 listModels 성공 후
   apiCallState.selectedModel = ...
   이 부분을 아래처럼 바꿔주세요.
*/
async function ensureUsableModelOrFallback(listModelsFn, apiCallState) {
    try {
        const models = await listModelsFn(); // 기존 ListModels 함수 그대로 사용
        const picked = pickFirstGenerateContentModel(models);
        if (picked) {
            // models/ prefix 제거
            apiCallState.selectedModel = picked.replace(/^models\//, '');
            return apiCallState.selectedModel;
        }
    } catch (e) {
        // listModels 실패해도 기존 selectedModel 유지(UX 변화 없음)
        console.warn('[MODEL] ensureUsableModelOrFallback failed:', e);
    }
    return apiCallState.selectedModel;
}

/* =========================
   4) [ADD] 단발 호출 래퍼(_callGeminiOnce) 추가 (권장)
   - 목적: callGeminiWithRetry()는 안정화 로직만 담당하고,
           기존 fetch/파싱/타임아웃 코드는 그대로 유지하면서 "maxOutputTokens만 주입"하기 쉽게 분리
   - 기존 callGeminiWithRetry 안에 있던 fetch 부분을 그대로 옮겨오면 됩니다.
========================= */
window._callGeminiOnce = async function _callGeminiOnce(callPrompt, callOptions = {}) {
    // === 내부 호출 함수 (실제 fetch 수행) ===
    var apiKey = localStorage.getItem('GEMINI_API_KEY');
    if (!apiKey) throw new Error('API 키가 없습니다.');

    // [FIX] 모델 ID 결정 (Hardcoding 제거, Strict Validation)
    var modelId = apiCallState.selectedModel;
    var availModels = apiCallState.availableModels || [];

    // 1. Override 확인 (검증 필수)
    if (callOptions.modelOverride) {
        var overrideCandidate = callOptions.modelOverride.replace(/^models\//, '');
        var isValid = availModels.some(function (m) {
            return m.name.endsWith(overrideCandidate);
        });

        if (isValid) {
            modelId = overrideCandidate;
            // console.log('[API DEBUG] Using Valid Override:', modelId);
        } else {
            console.warn('[API WARNING] Invalid modelOverride:', callOptions.modelOverride, '-> Ignoring. Using selected:', modelId);
        }
    }

    // 2. Fallback: selectedModel도 없으면 availableModels[0] 사용
    if (!modelId) {
        if (availModels.length > 0) {
            modelId = availModels[0].name.replace(/^models\//, '');
            console.warn('[API WARNING] No selectedModel. Auto-selecting first available:', modelId);
        } else {
            // [CRITICAL] 호출 가능한 모델이 없음 -> 즉시 에러
            console.error('[API FATAL] No model selected and no available models found.');
            throw new Error('INVALID MODEL ID: 유효한 모델을 찾을 수 없습니다. (ListModels 실패 혹은 빈 목록)');
        }
    }

    // JSON 강제 여부 확인
    var callIsJson = callOptions.isJson !== undefined ? callOptions.isJson : true;

    var apiVersion = 'v1beta';
    var endpoint = 'generateContent';
    var baseUrl = 'https://generativelanguage.googleapis.com';
    var path = '/' + apiVersion + '/models/' + modelId + ':' + endpoint;
    var url = baseUrl + path + '?key=' + apiKey;

    var tag = callOptions.tag ? ('[' + callOptions.tag + '] ') : '';
    console.log(tag + 'API CALL START -> ' + modelId + ' (JSON=' + callIsJson + ', ForceText=' + !!callOptions.forceText + ')');

    var bodyConfig = {
        contents: [{ parts: [{ text: callPrompt }] }],
        generationConfig: {
            temperature: 0.3,
            // [PATCH POINT] maxOutputTokens 주입
            maxOutputTokens: callOptions.maxOutputTokens || window.ApiStability.DEFAULT_MAX_OUTPUT_TOKENS
        }
    };

    if (callIsJson && (!callOptions || !callOptions.forceText)) {
        bodyConfig.generationConfig.responseMimeType = "application/json";
    }

    var controller = new AbortController();
    var timeoutId = setTimeout(function () { controller.abort(); }, 40000); // 40초 타임아웃

    try {
        var response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyConfig),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            var errorText = await response.text().catch(function () { return ''; });

            if (response.status === 404) {
                console.error('[API FATAL] 404 Model Not Found:', modelId);
                throw new Error('MODEL NOT FOUND (404): ' + modelId + ' is invalid.');
            }

            if (response.status === 429) {
                console.warn('[API DEBUG] 429 Rate Limit - 10초 대기');
                // 내부에서 대기하지 않고 에러를 던져서 상위 retry 로직이 처리하게 함
                // await new Promise(resolve => setTimeout(resolve, 10000));
                throw new Error('429 Rate Limit');
            }

            var msg = 'HTTP ' + response.status + ' ' + response.statusText +
                ' | model=' + modelId +
                ' | body=' + (errorText ? errorText.replace(/\s+/g, ' ').slice(0, 400) : '(empty)');
            throw new Error(msg);
        }

        var data = await response.json();

        // ===== 응답 검증(강화) =====
        if (!data) {
            throw new Error('응답 JSON 자체가 없습니다. (Empty JSON)');
        }
        if (!data.candidates || data.candidates.length === 0) {
            var fb = '';
            try { fb = JSON.stringify(data.promptFeedback || data, null, 2); } catch (_) { }
            console.error('[API DEBUG] NO CANDIDATES. promptFeedback dump:', (fb || '').slice(0, 2000));
            throw new Error('candidates가 없습니다 (차단/쿼터/빈응답). promptFeedback=' + (fb ? fb.replace(/\s+/g, ' ').slice(0, 400) : '(none)'));
        }
        var candidate = data.candidates[0];

        // 텍스트 추출
        var textParts = [];
        if (candidate && candidate.content && Array.isArray(candidate.content.parts)) {
            candidate.content.parts.forEach(function (p) {
                if (!p) return;
                if (typeof p.text === 'string') textParts.push(p.text);
            });
        }
        var text = textParts.join('');

        if (!text || !String(text).trim()) {
            var reason = candidate.finishReason || 'unknown';
            console.error(tag + '[API DEBUG] EMPTY TEXT. finishReason=' + reason);
            try { console.log(tag + '[DEBUG DUMP]', JSON.stringify(candidate, null, 2)); } catch (_) { }
            throw new Error('응답 텍스트가 비어있습니다. (' + reason + ') promptFeedback=' +
                (candidate && candidate.promptFeedback ? JSON.stringify(candidate.promptFeedback).replace(/\s+/g, ' ').slice(0, 300) :
                    (data && data.promptFeedback ? JSON.stringify(data.promptFeedback).replace(/\s+/g, ' ').slice(0, 300) : '(none)')));
        }

        if (String(text).trim() === '{}' || String(text).trim() === '[]') {
            throw new Error('의미 없는 빈 JSON 응답({}/[])');
        }

        return text;

    } catch (err) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') throw new Error('TIMEOUT 40s | model=' + modelId);
        throw err;
    }
};

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
    lastCallTime: 0,
    availableModels: null, // ListModels 결과 캐시
    selectedModel: null    // 선택된 모델 ID
};

/* ======================================================
   [2] apiCallState 시간 필드 통일 - REMOVED (Legacy cleanup)
====================================================== */
// delete apiCallState.lastCallAt; // Handled directly by removing usage if any, but simply removing the block suffices.


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

// JSON 안전 파서 (3단계 폴백) - 배열 지원 + head/tail 프리뷰
function safeParseJsonResponse(responseText) {
    if (!responseText) throw new Error('빈 응답입니다.');

    var cleaned = String(responseText)
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

    // 1차: 정상 JSON 파싱 시도
    try {
        return JSON.parse(cleaned);
    } catch (e1) {
        console.warn('[JSON PARSE] 1차 시도 실패, 2차 시도 중...');
    }

    // [B) 보강] 2차: 첫 JSON 시작({ 또는 [) ~ 마지막 JSON 끝(} 또는 ]) 범위 추출
    var firstBrace = cleaned.indexOf('{');
    var firstBracket = cleaned.indexOf('[');
    var lastBrace = cleaned.lastIndexOf('}');
    var lastBracket = cleaned.lastIndexOf(']');

    // JSON 시작 위치 결정 (더 앞에 있는 것)
    var startPos = -1;
    var endPos = -1;
    var startChar = '';
    var endChar = '';

    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
        startPos = firstBrace;
        endPos = lastBrace;
        startChar = '{';
        endChar = '}';
    } else if (firstBracket !== -1) {
        startPos = firstBracket;
        endPos = lastBracket;
        startChar = '[';
        endChar = ']';
    }

    if (startPos !== -1 && endPos !== -1 && endPos > startPos) {
        try {
            var extracted = cleaned.slice(startPos, endPos + 1);
            console.log('[JSON PARSE] 2차 추출:', startChar + '...' + endChar, '길이:', extracted.length);
            return JSON.parse(extracted);
        } catch (e2) {
            console.warn('[JSON PARSE] 2차 시도 실패, 3차 시도 중...');
        }
    }

    // [C) 추가] 3차: 실패 - head/tail 프리뷰 포함 에러
    var err = new Error('응답 처리 실패 (JSON 파싱 오류)');
    err._fullLength = cleaned.length;
    err._head = cleaned.slice(0, 400); // 앞 400자
    err._tail = cleaned.slice(-400);   // 뒤 400자
    err._preview = cleaned.slice(0, 800); // 호환성 유지
    throw err;
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
    console.log('[AIStartButton] 초기화 시작');

    var btn = document.getElementById('korea-ai-start-btn');
    var ta = document.getElementById('korea-senior-script');
    var progressSection = document.getElementById('korea-ai-progress-section');
    var progressBar = document.getElementById('korea-ai-progress-bar');
    var progressPercent = document.getElementById('korea-ai-progress-percent');
    var aiSection = document.getElementById('korea-ai-analysis');
    var resultEl = document.getElementById('korea-ai-result');

    console.log('[AIStartButton] 버튼 엘리먼트:', btn);
    console.log('[AIStartButton] 텍스트 영역:', ta);

    if (!btn) {
        console.error('[AIStartButton] ❌ 버튼을 찾을 수 없습니다! ID: korea-ai-start-btn');
        return;
    }

    console.log('[AIStartButton] ✅ 버튼 바인딩 성공');

    // 진행 상태 업데이트 함수
    function updateProgress(step, status, percent) {
        // [A) 개선] 전체 진행바는 스텝 요소 존재 여부와 무관하게 항상 업데이트
        if (progressBar) progressBar.style.width = percent + '%';
        if (progressPercent) progressPercent.textContent = Math.round(percent) + '%';

        var stepEl = document.getElementById('progress-step-' + step);
        if (!stepEl) {
            // Step 0 등 UI가 없는 단계도 로그는 남김
            if (step === 0 && status === 'processing') {
                console.log('[Step 0] UI 요소 없음 - 백그라운드 처리 중');
            }
            return;
        }

        var statusSpan = stepEl.querySelector('.step-status');
        var iconDiv = stepEl.querySelector('.flex-shrink-0');

        if (status === 'processing') {
            stepEl.classList.add('border-indigo-300', 'bg-indigo-50');
            stepEl.classList.remove('border-gray-200', 'border-green-300', 'bg-green-50', 'border-red-300', 'bg-red-50');
            if (statusSpan) {
                statusSpan.className = 'step-status text-xs px-2 py-1 rounded-full bg-indigo-500 text-white';
                statusSpan.textContent = '분석중...';
            }
            if (iconDiv) {
                iconDiv.classList.add('bg-indigo-500');
                iconDiv.classList.remove('bg-gray-200', 'bg-green-500', 'bg-red-500');
                var icon = iconDiv.querySelector('i');
                if (icon) icon.classList.add('text-white');
                if (icon) icon.classList.remove('text-gray-400');
            }
        } else if (status === 'complete') {
            stepEl.classList.add('border-green-300', 'bg-green-50');
            stepEl.classList.remove('border-indigo-300', 'bg-indigo-50', 'border-gray-200', 'border-red-300', 'bg-red-50');
            if (statusSpan) {
                statusSpan.className = 'step-status text-xs px-2 py-1 rounded-full bg-green-500 text-white';
                statusSpan.textContent = '완료';
            }
            if (iconDiv) {
                iconDiv.classList.add('bg-green-500');
                iconDiv.classList.remove('bg-indigo-500', 'bg-gray-200', 'bg-red-500');
                var icon = iconDiv.querySelector('i');
                if (icon) icon.classList.add('text-white');
                if (icon) icon.classList.remove('text-gray-400');
            }
        } else if (status === 'error') {
            // [A) 추가] error 상태 처리 - 실패 UI 표시
            stepEl.classList.add('border-red-300', 'bg-red-50');
            stepEl.classList.remove('border-indigo-300', 'bg-indigo-50', 'border-gray-200', 'border-green-300', 'bg-green-50');
            if (statusSpan) {
                statusSpan.className = 'step-status text-xs px-2 py-1 rounded-full bg-red-500 text-white';
                statusSpan.textContent = '실패';
            }
            if (iconDiv) {
                iconDiv.classList.add('bg-red-500');
                iconDiv.classList.remove('bg-indigo-500', 'bg-gray-200', 'bg-green-500');
                var icon = iconDiv.querySelector('i');
                if (icon) {
                    // [C) 개선] 아이콘 class 강제 교체 대신 색상만 변경
                    icon.classList.add('text-white');
                    icon.classList.remove('text-gray-400', 'text-indigo-500', 'text-green-500');
                }
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
        console.log('[AIStartButton] 🖱️ 버튼 클릭 감지!');
        console.log('[AIStartButton] AppState.isAIAnalyzing:', AppState.isAIAnalyzing);

        if (AppState.isAIAnalyzing) {
            console.warn('[AIStartButton] 이미 분석 중');
            showNotification('AI 분석이 진행 중입니다', 'warning');
            return;
        }

        var script = ta ? ta.value.trim() : '';
        console.log('[AIStartButton] 대본 길이:', script.length);

        if (!script) {
            console.warn('[AIStartButton] 대본 없음');
            showNotification('대본을 입력해주세요', 'warning');
            return;
        }

        if (script.length < 50) {
            console.warn('[AIStartButton] 대본 너무 짧음:', script.length);
            showNotification('대본이 너무 짧습니다 (최소 50자)', 'warning');
            return;
        }

        var apiKey = localStorage.getItem('GEMINI_API_KEY');
        console.log('[AIStartButton] API 키 존재:', !!apiKey);

        if (!apiKey || !apiKey.trim()) {
            console.warn('[AIStartButton] API 키 없음');
            showNotification('API 키를 먼저 설정해주세요 (우측 상단 🔑)', 'warning');
            return;
        }

        console.log('[AI ANALYSIS] ✅ 시작!');

        AppState.isAIAnalyzing = true;
        btn.disabled = true;
        btn.classList.add('opacity-50', 'cursor-not-allowed');

        // UI 표시
        if (progressSection) progressSection.classList.remove('hidden');
        if (aiSection) aiSection.classList.remove('hidden');
        if (resultEl) resultEl.classList.add('hidden');

        resetProgress();
        showNotification('AI 분석을 시작합니다...', 'info');

        // [FIX] Watchdog: 20초간 0%면 강제 리셋 (무한 대기 방지)
        // [FIX] Watchdog: 20초간 0%면 강제 리셋 (Step 0은 시간 오래 걸리므로 제외)
        setTimeout(function () {
            // 사용자 요청 5: Watchdog 조건에서 Step 0 완전 제외 (currentStep > 0 일 때만 체크)
            if (AppState.isAIAnalyzing && currentStep > 0 && (!progressBar || progressBar.style.width === '0%' || progressBar.style.width === '')) {
                console.warn('[Watchdog] 분석 시작 후 20초간 반응 없음 - 강제 리셋');
                AppState.isAIAnalyzing = false;
                btn.disabled = false;
                btn.classList.remove('opacity-50', 'cursor-not-allowed');
                showNotification('서버 응답이 늦어지고 있습니다. 잠시 후 다시 시도해주세요.', 'warning');
            }
        }, 20000);

        // Step 0 + 5단계 분석 실행 (총 6단계)
        var analysisSteps = [
            {
                step: 0,
                name: '대본 파악/숙지',
                category: 'comprehension',
                prompt: '중요: 반드시 JSON만 출력. 코드블록(```)·설명·주석·추가 텍스트 금지.\\n\\n당신은 대본 분석 전문가입니다. 먼저 아래 대본을 끝까지 읽고 완전히 이해하세요.\\n\\n대본:\\n{SCRIPT}\\n\\n위 대본을 읽고 다음 정보를 파악하세요:\\n1. 주요 등장인물과 관계\\n2. 시간적/공간적 배경\\n3. 핵심 플롯과 갈등\\n4. 전체 스토리 흐름\\n\\nJSON 형식으로 응답:\\n{\\n  \\"comprehended\\": true,\\n  \\"summary\\": \\"대본 핵심 요약 (2-3문장, 결말 노출 금지)\\",\\n  \\"characters\\": [\\"인물1\\", \\"인물2\\"],\\n  \\"setting\\": \\"배경 정보\\",\\n  \\"plotPoints\\": [\\"주요 사건1\\", \\"주요 사건2\\"]\\n}'
            },
            {
                step: 1,
                name: '배경확인',
                category: 'background',
                prompt: '중요: 반드시 JSON만 출력. 코드블록(```)·설명·주석·추가 텍스트 금지.\\n\\n[대본 파악 완료] 이제 배경을 분석합니다.\\n\\n이 대본의 배경(한국/일본/조선 등)을 분석하고 점수(0-100)를 매겨주세요.\\n\\nJSON 형식:\\n{\\n  \\"score\\": 0-100,\\n  \\"issues\\": [\\n    {\\"text\\": \\"문제 설명\\", \\"reason\\": \\"근거/발췌\\", \\"type\\": \\"배경충돌\\"}\\n  ],\\n  \\"fixes\\": [\\n    {\\"before\\": \\"수정 전\\", \\"after\\": \\"수정 후\\", \\"reason\\": \\"수정 이유\\"}\\n  ]\\n}'
            },
            {
                step: 2,
                name: '등장인물 일관성',
                category: 'character',
                prompt: '중요: 반드시 JSON만 출력. 코드블록(```)·설명·주석·추가 텍스트 금지.\\n\\n등장인물의 나이, 이름, 관계가 일관되는지 분석하고 점수(0-100)를 매겨주세요.\\n\\nJSON 형식:\\n{\\n  \\"score\\": 0-100,\\n  \\"issues\\": [\\n    {\\"text\\": \\"문제 설명\\", \\"reason\\": \\"근거/발췌\\", \\"type\\": \\"인물명 불일치\\"}\\n  ],\\n  \\"fixes\\": [\\n    {\\"before\\": \\"수정 전\\", \\"after\\": \\"수정 후\\", \\"reason\\": \\"수정 이유\\"}\\n  ]\\n}'
            },
            {
                step: 3,
                name: '스토리 왜곡 분석',
                category: 'distortion',
                prompt: '중요: 반드시 JSON만 출력. 코드블록(```)·설명·주석·추가 텍스트 금지.\\n\\n씬 구조, 시간/장소 흐름이 자연스러운지 분석하고 점수(0-100)를 매겨주세요.\\n\\nJSON 형식:\\n{\\n  \\"score\\": 0-100,\\n  \\"issues\\": [\\n    {\\"text\\": \\"문제 설명\\", \\"reason\\": \\"근거/발췌\\", \\"type\\": \\"시간흐름 단절\\"}\\n  ],\\n  \\"fixes\\": [\\n    {\\"before\\": \\"수정 전\\", \\"after\\": \\"수정 후\\", \\"reason\\": \\"수정 이유\\"}\\n  ]\\n}'
            },
            {
                step: 4,
                name: '반전/변화 속도',
                category: 'twistPace',
                prompt: '중요: 반드시 JSON만 출력. 코드블록(```)·설명·주석·추가 텍스트 금지.\\n\\n감정 변화와 페이싱이 적절한지 분석하고 점수(0-100)를 매겨주세요.\\n\\nJSON 형식:\\n{\\n  \\"score\\": 0-100,\\n  \\"issues\\": [\\n    {\\"text\\": \\"문제 설명\\", \\"reason\\": \\"근거/발췌\\", \\"type\\": \\"페이싱 급변\\"}\\n  ],\\n  \\"fixes\\": [\\n    {\\"before\\": \\"수정 전\\", \\"after\\": \\"수정 후\\", \\"reason\\": \\"수정 이유\\"}\\n  ]\\n}'
            },
            {
                step: 5,
                name: '재미/몰입 요소',
                category: 'immersion',
                prompt: '중요: 반드시 JSON만 출력. 코드블록(```)·설명·주석·추가 텍스트 금지.\\n\\n갈등, 대화, 시니어 공감 요소를 분석하고 점수(0-100)를 매겨주세요.\\n\\nJSON 형식:\\n{\\n  \\"score\\": 0-100,\\n  \\"issues\\": [\\n    {\\"text\\": \\"문제 설명\\", \\"reason\\": \\"근거/발췌\\", \\"type\\": \\"몰입 저하\\"}\\n  ],\\n  \\"fixes\\": [\\n    {\\"before\\": \\"수정 전\\", \\"after\\": \\"수정 후\\", \\"reason\\": \\"수정 이유\\"}\\n  ]\\n}'
            }
        ]

            ;

        var results = {};
        var comprehensionResult = null;
        var currentStep = 0;
        var stepRetryCount = {}; // 스텝별 재시도 횟수 추적
        var step0TimeoutId = null; // [FIX] Step 0 전용 타임아웃 ID

        // [FIX] Step 0 강제 완료 (타임아웃/실패 시)
        function forceStep0Completion(reason) {
            if (currentStep !== 0) return; // 이미 지나갔으면 무시
            console.warn('[Step 0] 강제 완료 진행 (' + reason + ')');

            if (step0TimeoutId) clearTimeout(step0TimeoutId);

            // 기본값 세팅
            comprehensionResult = {
                comprehended: true,
                summary: "대본 파악 단계를 건너뛰었습니다. (사유: " + reason + ")",
                characters: ["분석 생략"],
                setting: "분석 생략",
                plotPoints: ["분석 생략"]
            };

            // 사용자 요청 4: 10% 이상 + complete
            updateProgress(0, 'complete', 10);
            currentStep++;

            // 즉시 다음 단계
            analyzeNextStep();
        }

        // [필수 수정 2] ListModels 프리플라이트 (1회만 실행)
        console.log('[AI ANALYSIS] ListModels 프리플라이트 시작...');
        listAvailableModels(apiKey)
            .then(function (models) {
                if (models && models.length > 0) {
                    console.log('[AI ANALYSIS] ListModels 완료 - 모델 선택됨:', apiCallState.selectedModel);
                } else {
                    console.warn('[AI ANALYSIS] ListModels 실패 - 폴백 모델 사용');
                }
                // ListModels 완료 후 분석 시작
                updateProgress(0, 'processing', 5); // [FIX] Step 0 시작 시 5% (Watchdog 회피)
                analyzeNextStep();
            })
            .catch(function (err) {
                console.error('[AI ANALYSIS] ListModels 오류:', err);
                console.warn('[AI ANALYSIS] 폴백 모델로 계속 진행');
                // 오류가 있어도 폴백 모델로 계속 진행
                updateProgress(0, 'processing', 5); // [FIX] Step 0 시작 시 5%
                analyzeNextStep();
            });

        function analyzeNextStep() {
            if (currentStep >= analysisSteps.length) {
                // 모든 분석 완료
                completeAnalysis();
                return;
            }

            var stepInfo = analysisSteps[currentStep];
            var stepKey = 'step' + stepInfo.step;

            // 재시도 횟수 초기화
            if (!stepRetryCount[stepKey]) {
                stepRetryCount[stepKey] = 0;
            }

            // [FIX] 사용자 요청 1: Step 0일 경우 percent를 항상 5 이상으로 고정
            var percent = (currentStep / analysisSteps.length) * 100;
            if (stepInfo.step === 0) {
                percent = Math.max(5, percent);
                // [FIX] 60초 하드 타임아웃 설정 (누락분 수정)
                if (!step0TimeoutId) {
                    step0TimeoutId = setTimeout(function () {
                        forceStep0Completion('시간 초과 (60초)');
                    }, 60000);
                }
            }

            updateProgress(stepInfo.step, 'processing', percent);

            var prompt = stepInfo.prompt.replace('{SCRIPT}', script.substring(0, 30000));

            if (stepInfo.step > 0 && comprehensionResult) {
                // [HOTFIX] 컨텍스트 과다(토큰/길이)로 응답이 비는 케이스 방지: 요약만 전달
                var ctxObj = {
                    comprehended: !!comprehensionResult.comprehended,
                    summary: (comprehensionResult.summary || '').slice(0, 800),
                    characters: Array.isArray(comprehensionResult.characters) ? comprehensionResult.characters.slice(0, 20) : [],
                    setting: (comprehensionResult.setting || '').slice(0, 300),
                    plotPoints: Array.isArray(comprehensionResult.plotPoints) ? comprehensionResult.plotPoints.slice(0, 12) : []
                };
                var context = "## 대본 파악 정보(요약):\n" + JSON.stringify(ctxObj, null, 2) + "\n\n";
                prompt = context + prompt;
            }

            console.log('[STEP ' + stepInfo.step + '] 요청 시작 (시도 ' + (stepRetryCount[stepKey] + 1) + '회)');

            console.log('[STEP ' + stepInfo.step + '] 요청 시작 (시도 ' + (stepRetryCount[stepKey] + 1) + '회)');

            // [FIX] Step 1 강제 통과 제거
            /*
            if (stepInfo.step === 1) {
              ... removed ...
            }
            */

            // [Update] Step 2 올인원 옵션 적용
            var callOptions = {
                stepNo: stepInfo.step, // 새로운 callGeminiWithRetry에 stepNo 전달
                isJson: true,
                retries: 2 // 기존 retries 값
            };
            if (stepInfo.step === 2) {
                console.warn('[DEBUG] Step 2 올인원 패치 적용 (Tag=STEP2, ForceText=ON)');
                callOptions.forceText = true;
                callOptions.tag = 'STEP2';
            }

            callGeminiWithRetry(prompt, true, 2, callOptions)
                .then(function (responseText) {
                    // [FIX] 사용자 요청 4: null/undefined 응답 시 에러 던져서 재시도 유도
                    if (responseText == null || !String(responseText).trim()) {
                        console.error('[STEP ' + stepInfo.step + '] EMPTY responseText (null/blank).');
                        throw new Error('응답이 비어있습니다 (Step ' + stepInfo.step + ' 재시도 필요)');
                    }

                    // [FIX] 사용자 요청 4: 응답 수신 직후 8%
                    if (stepInfo.step === 0) updateProgress(0, 'processing', 8);

                    console.log('[STEP ' + stepInfo.step + '] 응답 길이:', responseText.length, '자');
                    console.log('[STEP ' + stepInfo.step + '] 응답 마지막 200자:', responseText.slice(-200));

                    try {
                        // 강건한 JSON 파싱 (3단계 폴백)
                        var result = safeParseJsonResponse(responseText);

                        // 파싱 성공 - 재시도 카운터 리셋
                        stepRetryCount[stepKey] = 0;
                        // [FIX] 성공 시 타임아웃 해제
                        if (stepInfo.step === 0 && step0TimeoutId) clearTimeout(step0TimeoutId);

                        if (stepInfo.step === 0) {
                            comprehensionResult = result;
                        } else {
                            results['step' + stepInfo.step] = result;
                        }
                        updateProgress(stepInfo.step, 'complete', ((currentStep + 1) / analysisSteps.length) * 100);
                        currentStep++;

                        // [FIX] 사용자 요청 2: Step 0 성공 시 즉시 다음 단계 이동 (지연 없음)
                        if (stepInfo.step === 0) {
                            console.log('[Step 0] 완료 - 즉시 다음 단계로 이동');
                            analyzeNextStep();
                        } else {
                            setTimeout(analyzeNextStep, 4000); // 그 외 단계는 4초 대기
                        }

                    } catch (e) {
                        console.error('[STEP ' + stepInfo.step + '] JSON Parse Error (시도 ' + (stepRetryCount[stepKey] + 1) + '회):', e);

                        // [C) 추가] head/tail 프리뷰 출력 (앞뒤 400자씩)
                        if (e._fullLength) {
                            console.error('[RESPONSE FULL LENGTH]', e._fullLength, '자');
                        }
                        if (e._head) {
                            console.error('[RESPONSE HEAD 400]', e._head);
                        }
                        if (e._tail) {
                            console.error('[RESPONSE TAIL 400]', e._tail);
                        }
                        // 호환성: 기존 preview도 출력
                        if (e._preview) {
                            console.error('[JSON PARSE PREVIEW 800]', e._preview);
                        }

                        stepRetryCount[stepKey]++;

                        // 재시도 로직
                        if (stepRetryCount[stepKey] <= 2) {
                            // 1~2회 실패: 자동 재시도
                            console.warn('[AUTO RETRY] Step ' + stepInfo.step + ' 자동 재시도 중... (' + stepRetryCount[stepKey] + '/2)');
                            setTimeout(analyzeNextStep, 2000); // 2초 후 재시도
                            return; // catch 블록 종료 (에러 토스트 표시 안 함)

                        } else if (stepRetryCount[stepKey] === 3) {
                            // 3회 실패: Repair Prompt 시도
                            console.warn('[REPAIR PROMPT] Step ' + stepInfo.step + ' Repair Prompt 시도 중...');

                            var repairPrompt = '중요: 아래 내용을 순수 JSON만 출력하세요. 코드블록(```)·설명·주석·추가 텍스트 절대 금지. JSON 외 출력 시 오류 처리됨.\\n\\n';
                            if (stepInfo.step === 2) {
                                repairPrompt += '반드시 {"score":..., "issues":[...]} 형태의 JSON 객체여야 합니다.\\n';
                            }
                            repairPrompt += stepInfo.prompt.replace('{SCRIPT}', script.substring(0, 30000));
                            repairPrompt += '\\n\\n참고: 직전 응답이 형식 오류였습니다. 반드시 올바른 JSON만 출력하세요.';

                            if (stepInfo.step > 0 && comprehensionResult) {
                                var context = "## 대본 파악 정보 (참고용):\\n" + JSON.stringify(comprehensionResult, null, 2) + "\\n\\n";
                                repairPrompt = context + repairPrompt;
                            }

                            callGeminiWithRetry(repairPrompt, true, 2, { stepNo: stepInfo.step })
                                .then(function (repairResponse) {
                                    try {
                                        var repairResult = safeParseJsonResponse(repairResponse);

                                        // Repair 성공
                                        console.log('[REPAIR SUCCESS] Step ' + stepInfo.step + ' Repair Prompt 성공!');
                                        stepRetryCount[stepKey] = 0;
                                        // [FIX] 성공 시 타임아웃 해제
                                        if (stepInfo.step === 0 && step0TimeoutId) clearTimeout(step0TimeoutId);

                                        if (stepInfo.step === 0) {
                                            comprehensionResult = repairResult;
                                        } else {
                                            results['step' + stepInfo.step] = repairResult;
                                        }
                                        updateProgress(stepInfo.step, 'complete', ((currentStep + 1) / analysisSteps.length) * 100);
                                        currentStep++;
                                        setTimeout(analyzeNextStep, 4000);

                                    } catch (repairError) {
                                        // Repair도 실패 - 최종 실패
                                        console.error('[REPAIR FAILED] Step ' + stepInfo.step + ' 최종 실패');
                                        handleFinalFailure(stepInfo, repairError);
                                    }
                                })
                                .catch(function (repairErr) {
                                    console.error('[REPAIR ERROR] Step ' + stepInfo.step + ' Repair API 오류:', repairErr);
                                    handleFinalFailure(stepInfo, repairErr);
                                });

                            return; // Repair 시도 중이므로 여기서 종료

                        } else {
                            // 4회 이상 실패: 최종 실패
                            handleFinalFailure(stepInfo, e);
                        }
                    }
                })
                .catch(function (err) {
                    console.error('[STEP ' + stepInfo.step + '] API 오류:', err);

                    // API 오류도 재시도
                    stepRetryCount[stepKey]++;

                    if (stepRetryCount[stepKey] <= 2) {
                        console.warn('[AUTO RETRY] Step ' + stepInfo.step + ' API 오류 재시도 중... (' + stepRetryCount[stepKey] + '/2)');
                        setTimeout(analyzeNextStep, 3000);
                        return;
                    } else {
                        // 최종 실패
                        handleFinalFailure(stepInfo, err);
                    }
                });
        }

        // 최종 실패 처리 함수
        function handleFinalFailure(stepInfo, error) {
            // [FIX] Step 0 실패 시 강제 완료로 전환 (오판/무한대기 방지)
            if (stepInfo.step === 0) {
                console.warn('[Step 0] 최종 실패 감지 -> 강제 완료로 전환');
                forceStep0Completion(error ? error.message : '최종 실패');
                return;
            }

            // [FIX] 'Force Complete' / 'Soft Fail' Logic REMOVED per User Request [4]

            /* ======================================================
                ROBUST FAILURE HANDLING (Restored from Orphaned Block)
            ====================================================== */
            console.error('[FINAL FAILURE] Step ' + stepInfo.step + ' 모든 재시도 실패');
            updateProgress(stepInfo.step, 'error', (currentStep / analysisSteps.length) * 100);

            // [B) 개선] 에러 원인 정밀 분석 (사용자 요청 반영)
            var failReason = '알 수 없는 오류';
            var errStr = '';

            // error 객체/문자열/기타를 사람이 읽을 수 있는 문자열로 정규화
            try {
                if (typeof error === 'string') {
                    errStr = error;
                } else if (error && typeof error.message === 'string' && error.message.trim()) {
                    errStr = error.message;
                } else if (error && typeof error.toString === 'function') {
                    errStr = error.toString();
                } else {
                    errStr = JSON.stringify(error);
                }
            } catch (e) {
                errStr = 'Error stringify failed';
            }

            // 브라우저별 TypeError/Load failed 케이스를 네트워크로 분류
            if (errStr && (errStr.includes('TypeError') || errStr.includes('Load failed'))) {
                failReason = '네트워크/CORS(fetch) 오류';
            }

            // 1. 타임아웃/Abort (최우선 확인)
            if (error.name === 'AbortError' || errStr.includes('AbortError') || errStr.includes('timeout') || errStr.includes('시간 초과')) {
                failReason = '서버 응답 시간 초과';
            }
            // 2. 네트워크/Fetch/CORS
            else if (errStr.includes('Failed to fetch') || errStr.includes('NetworkError') || errStr.includes('fetch')) {
                failReason = '네트워크/CORS(fetch) 오류';
            }
            // 3. 기존 분류 유지
            else if (errStr.includes('JSON')) failReason = '형식 오류 (JSON)';
            else if (errStr.includes('429')) failReason = '사용량 초과 (429)';
            else if (errStr.includes('401') || errStr.includes('key')) failReason = 'API 키 인증 실패';
            else if (errStr.includes('403')) failReason = '권한 없음 (403)';
            else if (errStr.includes('Safety') || errStr.includes('blocked')) failReason = '안전 필터 차단';
            else if (errStr.includes('finishReason')) failReason = '응답 중단됨';
            else if (errStr.includes('500') || errStr.includes('503')) failReason = '서버 오류 (5xx)';
            else if (errStr.includes('비어있음') || errStr.includes('Empty')) failReason = '빈 응답';

            // [FIX] 에러 메시지 토스트 상세 출력 (길이 확장 240)
            var errShort = (errStr || '').replace(/\s+/g, ' ').slice(0, 240);
            var displayMsg = '❌ Step ' + stepInfo.step + ' 분석 실패 [' + failReason + '] ' + (errShort ? ('- ' + errShort) : '');

            showNotification(displayMsg, 'error');

            console.error('[FINAL FAIL REASON]', failReason);
            console.error('[ORIGINAL ERROR]', errStr);
            if (error.stack) {
                console.error('[ERROR STACK]', error.stack);
            }

            // 상태 복구 (필수)
            AppState.isAIAnalyzing = false;
            if (window.apiCallState) window.apiCallState.isProcessing = false;
            if (typeof btn !== 'undefined' && btn) {
                btn.disabled = false;
                btn.classList.remove('opacity-50', 'cursor-not-allowed');
            }
        }

        // [2] handleFinalFailure 전역 노출 보장
        window.handleFinalFailure = handleFinalFailure;

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

            // [FIX] issues/fixes 누락 문제 해결
            var issues = Array.isArray(stepData.issues) ? stepData.issues : [];
            var fixes = Array.isArray(stepData.fixes) ? stepData.fixes : [];

            // 호환성: feedback만 있는 구버전 데이터 처리
            if (issues.length === 0 && stepData.feedback) {
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

        // [필수 수정 1] 중복 호출 제거 - ListModels 완료 후에만 analyzeNextStep() 실행됨
    });
}

// Ensure global exposure (moved from inside)
if (typeof initAIStartButton === 'function') {
    // Already defined above
}



/* ======================================================
   FULL SCRIPT AUTO-FIX & API UTILS
====================================================== */

// ListModels API - 사용 가능한 모델 목록 가져오기 (1회만 실행)
async function listAvailableModels(apiKey) {
    // 이미 캐시된 결과가 있으면 재사용
    if (apiCallState.availableModels) {
        console.log('[LIST MODELS] 캐시된 모델 목록 사용:', apiCallState.availableModels);
        return apiCallState.availableModels;
    }

    var baseUrl = 'https://generativelanguage.googleapis.com';
    var apiVersion = 'v1beta';
    var url = baseUrl + '/' + apiVersion + '/models?key=' + apiKey;

    console.group('[LIST MODELS] 사용 가능한 모델 조회');
    console.log('URL:', baseUrl + '/' + apiVersion + '/models');
    console.groupEnd();

    try {
        // [FIX] 10초 타임아웃 추가
        var controller = new AbortController();
        var timeoutId = setTimeout(function () { controller.abort(); }, 10000);

        var response = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            console.error('[LIST MODELS] 오류:', response.status, response.statusText);
            return null;
        }

        var data = await response.json();

        if (!data.models || data.models.length === 0) {
            console.warn('[LIST MODELS] 사용 가능한 모델이 없습니다.');
            return null;
        }

        // generateContent를 지원하는 모델만 필터링
        var generativeModels = data.models.filter(function (model) {
            return model.supportedGenerationMethods &&
                model.supportedGenerationMethods.includes('generateContent');
        });

        console.group('[LIST MODELS] 결과');
        console.log('전체 모델 수:', data.models.length);
        console.log('generateContent 지원 모델 수:', generativeModels.length);
        console.log('사용 가능한 모델 목록:');
        generativeModels.forEach(function (model) {
            console.log('  -', model.name, '(' + model.displayName + ')');
        });
        console.groupEnd();

        // 캐시 저장
        apiCallState.availableModels = generativeModels;

        // 우선순위: gemini-2.0 > gemini-1.5 > 기타
        var preferredModel = null;

        // 1순위: gemini-2.0-flash-exp
        preferredModel = generativeModels.find(function (m) {
            return m.name.includes('gemini-2.0-flash-exp');
        });

        // 2순위: gemini-2.5-flash
        if (!preferredModel) {
            preferredModel = generativeModels.find(function (m) {
                return m.name.includes('gemini-2.5-flash') && !m.name.includes('lite');
            });
        }



        // 4순위: 첫 번째 사용 가능한 모델
        if (!preferredModel && generativeModels.length > 0) {
            preferredModel = generativeModels[0];
        }

        if (preferredModel) {
            // "models/" 접두사 제거
            var modelId = preferredModel.name.replace('models/', '');
            apiCallState.selectedModel = modelId;
            console.log('[LIST MODELS] 선택된 모델:', modelId, '(' + preferredModel.displayName + ')');
        }

        return generativeModels;

    } catch (error) {
        console.error('[LIST MODELS] 예외 발생:', error);
        return null;
    }
}

// API 호출 유틸리티 (레이트 리밋 및 재시도) - [FIX] All-in-One Fallback (2단 호출)
/* =========================
   3) [REPLACE] callGeminiWithRetry() 내부 429/404/빈응답 처리 강화
   - 기존 함수 시그니처는 최대한 유지하되,
     (options.stepNo) 또는 (options.stepIndex) 또는 (options.step) 같은 값이 있으면 활용
   - 아래 구현을 기존 callGeminiWithRetry 함수 "전체"로 교체 권장
========================= */
async function callGeminiWithRetry(prompt, isJson = true, retries = 2, options = {}) {
    // ====== 기존 전역 상태 사용(이름이 다르면 프로젝트 변수명에 맞춰 연결) ======
    // apiCallState.selectedModel, apiCallState.lastCallAt, isProcessing, showToast 등 기존 그대로 사용

    // options와 인자 매핑
    options.isJson = isJson; // _callGeminiOnce에서 사용

    const stepNo =
        typeof options.stepNo === 'number' ? options.stepNo :
            typeof options.stepIndex === 'number' ? options.stepIndex :
                typeof options.step === 'number' ? options.step :
                    null;

    // [D] Retry count standardized
    const maxRetries = typeof options.maxRetries === 'number'
        ? options.maxRetries
        : (typeof retries === 'number' ? retries : 2);

    // 토큰은 step별로 더 줄이고 싶으면 options.maxOutputTokens로 override 가능
    const maxOutputTokens =
        typeof options.maxOutputTokens === 'number'
            ? options.maxOutputTokens
            : window.ApiStability.DEFAULT_MAX_OUTPUT_TOKENS;

    // Step별 쿨다운 적용(해당 step에서만 더 쉬어감)
    if (stepNo != null && window.ApiStability.STEP_COOLDOWN_MS[stepNo]) {
        const cd = window.ApiStability.STEP_COOLDOWN_MS[stepNo];
        console.log(`[RATE] Step ${stepNo} cooldown ${cd}ms`);
        try { window.showNotification && window.showNotification(`Step ${stepNo} 대기 중...`); } catch (_) { }
        await sleep(cd);
    }

    // 최소 호출 간격(기존 로직이 있으면 중복되어도 안전)
    const now = Date.now();
    if (window.apiCallState && window.apiCallState.lastCallTime) {
        const delta = now - window.apiCallState.lastCallTime;
        // MIN_CALL_INTERVAL_MS 사용
        const need = window.ApiStability.MIN_CALL_INTERVAL_MS - delta;
        if (need > 0) {
            console.log(`[RATE] min-interval wait ${need}ms`);
            await sleep(need);
        }
    }

    // isProcessing 잠금 해제 보호(기존에 있던 로직 유지/호환)
    if (window.apiCallState && window.apiCallState.isProcessing) {
        // 기존 로직: while loop로 대기
        var waitStart = Date.now();
        while (window.apiCallState.isProcessing) {
            if (Date.now() - waitStart > 45000) {
                console.warn('[LOCK] force unlock (stuck >45s)');
                window.apiCallState.isProcessing = false;
                break;
            }
            await sleep(200);
        }
    }

    // 호출 전 모델 검증(404 재발 방지) - [E] REMOVED (Excessive calls)
    /*
    if (window.apiCallState && typeof listAvailableModels === 'function') {
        ... removed ...
    }
    */

    let lastErr = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            if (window.apiCallState) window.apiCallState.lastCallTime = Date.now();
            // if (window.apiCallState) window.apiCallState.processingSince = Date.now(); // 기존 코드에 processingSince는 없음
            if (window.apiCallState) window.apiCallState.isProcessing = true;

            // ====== [PATCH POINT] 기존 요청 바디 작성 직후 아래 한 줄만 추가 ======
            // body.generationConfig = body.generationConfig || {};
            // body.generationConfig.maxOutputTokens = maxOutputTokens;

            const resultText = await (async () => {
                // ====== 여기서는 기존 함수가 있다고 가정하고 호출 예시만 둡니다 ======
                if (typeof window._callGeminiOnce === 'function') {
                    // 개발자: 기존 단발 호출 함수를 _callGeminiOnce로 래핑해두면 가장 안전합니다.
                    // options에 maxOutputTokens 전달
                    var currentOptions = Object.assign({}, options, { maxOutputTokens: maxOutputTokens });
                    return await window._callGeminiOnce(prompt, currentOptions);
                }

                // 개발자: _callGeminiOnce가 없다면, 여기서 throw해서 "연결 필요"를 즉시 알리게 합니다.
                throw new Error('[PATCH] _callGeminiOnce 연결 필요: 기존 fetch 단발 호출 코드를 _callGeminiOnce(prompt, options)로 분리하거나, 기존 fetch 코드에 maxOutputTokens 주입만 반영하세요.');
            })();

            if (window.apiCallState) window.apiCallState.isProcessing = false;

            if (isEmptyAiText(resultText)) {
                throw Object.assign(new Error('빈 응답/무의미 응답 감지'), { status: 204 });
            }

            return resultText;
        } catch (err) {
            if (window.apiCallState) window.apiCallState.isProcessing = false;
            lastErr = err;

            const status = normalizeHttpStatus(err);
            const msg = (err && (err.message || err.toString())) ? (err.message || err.toString()) : 'unknown error';

            console.warn(`[AI] attempt ${attempt}/${maxRetries} failed`, { status, msg });

            // 404: 모델/엔드포인트 문제 가능성 → 모델 재조회 후 1회 더 시도
            if (status === 404) {
                try {
                    if (window.apiCallState && typeof listAvailableModels === 'function') {
                        await ensureUsableModelOrFallback(listAvailableModels, window.apiCallState);
                    }
                } catch (_) { }
            }

            // 429: 지수 백오프(20→40→80→120 cap) 후 재시도
            if (status === 429) {
                const base = window.ApiStability.BACKOFF_BASE_MS;
                const cap = window.ApiStability.BACKOFF_CAP_MS;
                const wait = clamp(base * Math.pow(2, attempt), base, cap);
                const w = jitter(wait);
                try { window.showNotification && window.showNotification(`요청 제한(429) 대기 ${Math.round(w / 1000)}초 후 재시도...`); } catch (_) { }
                await sleep(w);
                continue;
            }

            // 5xx/네트워크/타임아웃도 짧게 백오프로 재시도(성공률↑)
            if (status && status >= 500 && status <= 599) {
                const w = jitter(3000 + attempt * 2000);
                await sleep(w);
                continue;
            }

            // 빈 응답 등(204로 normalize한 케이스 포함): 짧게 쉬고 재시도
            if (status === 204) {
                const w = jitter(2000 + attempt * 1500);
                await sleep(w);
                continue;
            }

            // 2-Stage Fallback logic from previous patch (Integrated)
            // 이전 패치에서 구현했던 '빈 응답 시 fallbackModel로 재시도' 로직은 
            // 위 loop 안에서 이미 retry 되고 있음.
            // 다만, 이전 패치의 "ForceText"와 "FB" 태그 로직을 살리고 싶다면:
            if (attempt === maxRetries || msg.includes('비어있습니다') || msg.includes('빈 JSON')) {
                // 마지막 시도에서 Fallback (ForceText)
                if (!options.forceText) {
                    console.warn('[API FALLBACK] ForceText Retry...');
                    var fbOptions = Object.assign({}, options, { forceText: true, tag: (options.tag || '') + '-FB' });
                    // 모델 변경 로직은 ensureUsableModelOrFallback가 이미 처리했거나, 사용자가 원치 않음(이전 패치에서 제거됨).
                    // availableModels[0]으로 명시적 리셋.
                    // 여기서는 "검증되지 않은 모델 ID 사용 금지" 원칙에 따라 override 제거
                    delete fbOptions.modelOverride;
                    // Don't sleep too long for this specific fallback
                    await sleep(1000);
                    // Modify options for the next iteration if loop continues, or for the final attempt
                    options.forceText = true;
                    options.tag = (options.tag || '') + '-FB';
                    continue;
                }
            }

            // 기타: 더 재시도 가치 없으면 break
            if (attempt >= maxRetries) break;
            await sleep(jitter(1000 + attempt * 1000));
        }
    }

    // 최종 실패: 기존 handleFinalFailure 사용(UX 변화 없음)
    /* ======================================================
       [3] callGeminiWithRetry 최종 실패 처리 단순화
    ====================================================== */
    if (typeof window.handleFinalFailure === 'function') {
        window.handleFinalFailure({ step: stepNo }, lastErr);
    }
    throw lastErr;
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

        var confirmMsg = '총 ' + mergedFixes.length + '개의 수정 사항(중복 제거됨)을 반영하여 전체 대본을 100점으로 자동 수정하시겠습니까?\\n\\n수정 후 TXT 파일로 다운로드됩니다.';
        if (!confirm(confirmMsg)) return;

        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>100점 반영 수정 중...';

        try {
            // 수정 사항 요약 생성
            var fixSummary = mergedFixes.map(function (fix, idx) {
                return (idx + 1) + '. [' + fix.category + '] "' + fix.before + '" → "' + fix.after + '" (' + fix.reason + ')';
            }).join('\\n');

            var prompt = '다음 대본을 아래 수정 사항에 따라 전체적으로 수정하여 100점짜리 대본으로 만드세요.\\n\\n' +
                '## 수정 사항:\\n' + fixSummary + '\\n\\n' +
                '## 중요:\\n' +
                '1. 수정된 전체 대본만 반환하세요.\\n' +
                '2. 설명이나 주석 없이 대본 텍스트만 출력하세요.\\n' +
                '3. 원본의 형식을 유지하세요.\\n\\n' +
                '## 원본 대본:\\n' + scriptText;

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
            alert('수정 중 오류가 발생했습니다:\\n' + error.message);
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

    return unique;
}

function downloadScript(content) {
    var blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    var date = new Date().toISOString().slice(0, 10);
    a.download = 'revised_script_100_' + date + '.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
    safeInit('AutoFixAllButton', initAutoFixAllButton);

    console.log('[BOOT] All init functions completed');
    console.log('[BOOT] Current tab:', AppState.currentTab);
});
