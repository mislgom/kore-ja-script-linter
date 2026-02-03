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
@@ -61,6 +316,11 @@ var apiCallState = {
selectedModel: null    // 선택된 모델 ID
};

/* ======================================================
   [2] apiCallState 시간 필드 통일 - REMOVED (Legacy cleanup)
====================================================== */
// delete apiCallState.lastCallAt; // Handled directly by removing usage if any, but simply removing the block suffices.


/* ======================================================
  HELPERS
@@ -885,19 +1145,21 @@ function initAIStartButton() {

console.log('[STEP ' + stepInfo.step + '] 요청 시작 (시도 ' + (stepRetryCount[stepKey] + 1) + '회)');

            // [FIX] Step 1 강제 통과 (원인 파악용)
            console.log('[STEP ' + stepInfo.step + '] 요청 시작 (시도 ' + (stepRetryCount[stepKey] + 1) + '회)');

            // [FIX] Step 1 강제 통과 제거
            /*
           if (stepInfo.step === 1) {
                console.warn('[DEBUG] Step 1 강제 통과 (API 호출 생략)');
                var dummyResult = { score: 100, issues: [], fixes: [] };
                results['step1'] = dummyResult;
                updateProgress(1, 'complete', ((1 + 1) / analysisSteps.length) * 100);
                currentStep++;
                setTimeout(analyzeNextStep, 1000); // 1초 후 다음 단계
                return;
              ... removed ...
           }
            */

// [Update] Step 2 올인원 옵션 적용
            var callOptions = {};
            var callOptions = {
                stepNo: stepInfo.step, // 새로운 callGeminiWithRetry에 stepNo 전달
                isJson: true,
                retries: 2 // 기존 retries 값
            };
if (stepInfo.step === 2) {
console.warn('[DEBUG] Step 2 올인원 패치 적용 (Tag=STEP2, ForceText=ON)');
callOptions.forceText = true;
@@ -986,7 +1248,7 @@ function initAIStartButton() {
repairPrompt = context + repairPrompt;
}

                            callGeminiWithRetry(repairPrompt)
                            callGeminiWithRetry(repairPrompt, true, 2, { stepNo: stepInfo.step })
.then(function (repairResponse) {
try {
var repairResult = safeParseJsonResponse(repairResponse);
@@ -1051,22 +1313,11 @@ function initAIStartButton() {
return;
}

            // [FIX] Step 2 실패 시 Soft Fail (건너뛰기)
            if (stepInfo.step === 2) {
                console.warn('[Step 2] 최종 실패 -> 건너뛰기 처리 (Soft Fail)');
                showNotification('Step 2 분석 실패(건너뜀): ' + (error ? error.message : 'Unknown'), 'warning');

                // 더미 결과 주입 (빈 결과)
                results['step2'] = { score: 0, issues: [], fixes: [], error: 'Skipped due to repeated errors' };

                updateProgress(stepInfo.step, 'complete', ((currentStep + 1) / analysisSteps.length) * 100);
                currentStep++;
                setTimeout(analyzeNextStep, 2000);
                return;
            }


            // [FIX] 'Force Complete' / 'Soft Fail' Logic REMOVED per User Request [4]

            /* ======================================================
                ROBUST FAILURE HANDLING (Restored from Orphaned Block)
            ====================================================== */
console.error('[FINAL FAILURE] Step ' + stepInfo.step + ' 모든 재시도 실패');
updateProgress(stepInfo.step, 'error', (currentStep / analysisSteps.length) * 100);

@@ -1126,10 +1377,16 @@ function initAIStartButton() {

// 상태 복구 (필수)
AppState.isAIAnalyzing = false;
            btn.disabled = false;
            btn.classList.remove('opacity-50', 'cursor-not-allowed');
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
@@ -1325,6 +1582,11 @@ function initAIStartButton() {
});
}

// Ensure global exposure (moved from inside)
if (typeof initAIStartButton === 'function') {
    // Already defined above
}



/* ======================================================
@@ -1427,208 +1689,188 @@ async function listAvailableModels(apiKey) {
}

// API 호출 유틸리티 (레이트 리밋 및 재시도) - [FIX] All-in-One Fallback (2단 호출)
// API 호출 유틸리티 (레이트 리밋 및 재시도) - [FIX] Model ID Validation (No Hardcoding)
/* =========================
   3) [REPLACE] callGeminiWithRetry() 내부 429/404/빈응답 처리 강화
   - 기존 함수 시그니처는 최대한 유지하되,
     (options.stepNo) 또는 (options.stepIndex) 또는 (options.step) 같은 값이 있으면 활용
   - 아래 구현을 기존 callGeminiWithRetry 함수 "전체"로 교체 권장
========================= */
async function callGeminiWithRetry(prompt, isJson = true, retries = 2, options = {}) {
    // [HOTFIX] 동시 API 호출 시 에러 throw 하지 말고 대기 처리 (영구 잠금 방지)
    if (apiCallState.isProcessing) {
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
        while (apiCallState.isProcessing) {
        while (window.apiCallState.isProcessing) {
if (Date.now() - waitStart > 45000) {
                console.warn('[API LOCK] isProcessing stuck >45s. force unlock.');
                apiCallState.isProcessing = false;
                console.warn('[LOCK] force unlock (stuck >45s)');
                window.apiCallState.isProcessing = false;
break;
}
            await new Promise(function (r) { setTimeout(r, 200); });
            await sleep(200);
}
}

    // 최소 호출 간격 (4초)
    var now = Date.now();
    var timeSinceLastCall = now - apiCallState.lastCallTime;
    if (timeSinceLastCall < 4000) {
        await new Promise(resolve => setTimeout(resolve, 4000 - timeSinceLastCall));
    // 호출 전 모델 검증(404 재발 방지) - [E] REMOVED (Excessive calls)
    /*
    if (window.apiCallState && typeof listAvailableModels === 'function') {
        ... removed ...
   }
    */

    apiCallState.isProcessing = true;
    apiCallState.lastCallTime = Date.now();
    let lastErr = null;

    // === 내부 호출 함수 (실제 fetch 수행) ===
    async function _doCall(callPrompt, callIsJson, callOptions) {
        var apiKey = localStorage.getItem('GEMINI_API_KEY');
        if (!apiKey) throw new Error('API 키가 없습니다.');
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

        // [FIX] 모델 ID 결정 (Hardcoding 제거, Strict Validation)
        var modelId = apiCallState.selectedModel;
        var availModels = apiCallState.availableModels || [];
                // 개발자: _callGeminiOnce가 없다면, 여기서 throw해서 "연결 필요"를 즉시 알리게 합니다.
                throw new Error('[PATCH] _callGeminiOnce 연결 필요: 기존 fetch 단발 호출 코드를 _callGeminiOnce(prompt, options)로 분리하거나, 기존 fetch 코드에 maxOutputTokens 주입만 반영하세요.');
            })();

        // 1. Override 확인 (검증 필수)
        if (callOptions.modelOverride) {
            var overrideCandidate = callOptions.modelOverride.replace(/^models\//, '');
            var isValid = availModels.some(function (m) {
                return m.name.endsWith(overrideCandidate);
            });
            if (window.apiCallState) window.apiCallState.isProcessing = false;

            if (isValid) {
                modelId = overrideCandidate;
                // console.log('[API DEBUG] Using Valid Override:', modelId);
            } else {
                console.warn('[API WARNING] Invalid modelOverride:', callOptions.modelOverride, '-> Ignoring. Using selected:', modelId);
            if (isEmptyAiText(resultText)) {
                throw Object.assign(new Error('빈 응답/무의미 응답 감지'), { status: 204 });
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
            return resultText;
        } catch (err) {
            if (window.apiCallState) window.apiCallState.isProcessing = false;
            lastErr = err;

        var apiVersion = 'v1beta';
        var endpoint = 'generateContent';
        var baseUrl = 'https://generativelanguage.googleapis.com';
        var path = '/' + apiVersion + '/models/' + modelId + ':' + endpoint;
        var url = baseUrl + path + '?key=' + apiKey;
            const status = normalizeHttpStatus(err);
            const msg = (err && (err.message || err.toString())) ? (err.message || err.toString()) : 'unknown error';

        var tag = callOptions.tag ? ('[' + callOptions.tag + '] ') : '';
        console.log(tag + 'API CALL START -> ' + modelId + ' (JSON=' + callIsJson + ', ForceText=' + !!callOptions.forceText + ')');
            console.warn(`[AI] attempt ${attempt}/${maxRetries} failed`, { status, msg });

        var bodyConfig = {
            contents: [{ parts: [{ text: callPrompt }] }],
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 8192
            // 404: 모델/엔드포인트 문제 가능성 → 모델 재조회 후 1회 더 시도
            if (status === 404) {
                try {
                    if (window.apiCallState && typeof listAvailableModels === 'function') {
                        await ensureUsableModelOrFallback(listAvailableModels, window.apiCallState);
                    }
                } catch (_) { }
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
                    await new Promise(resolve => setTimeout(resolve, 10000));
                    throw new Error('429 Rate Limit');
                }

                var msg = 'HTTP ' + response.status + ' ' + response.statusText +
                    ' | model=' + modelId +
                    ' | body=' + (errorText ? errorText.replace(/\s+/g, ' ').slice(0, 400) : '(empty)');
                throw new Error(msg);
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
            // 5xx/네트워크/타임아웃도 짧게 백오프로 재시도(성공률↑)
            if (status && status >= 500 && status <= 599) {
                const w = jitter(3000 + attempt * 2000);
                await sleep(w);
                continue;
}

            if (String(text).trim() === '{}' || String(text).trim() === '[]') {
                throw new Error('의미 없는 빈 JSON 응답({}/[])');
            // 빈 응답 등(204로 normalize한 케이스 포함): 짧게 쉬고 재시도
            if (status === 204) {
                const w = jitter(2000 + attempt * 1500);
                await sleep(w);
                continue;
}

            return text;

        } catch (err) {
            clearTimeout(timeoutId);
            if (err.name === 'AbortError') throw new Error('TIMEOUT 40s | model=' + modelId);
            throw err;
        }
    } // end _doCall

    // === 메인 실행 로직 (2단 Fallback) ===
    try {
        for (var i = 0; i <= retries; i++) {
            try {
                // 1차 시도
                var result = await _doCall(prompt, isJson, options);
                return result;
            } catch (err) {
                console.warn('[API RETRY] 시도 ' + (i + 1) + '/' + (retries + 1) + ' 실패:', err.message);

                // 마지막 시도이거나, 명확한 빈 응답 에러인 경우 -> 2차 Fallback 시도 후 종료
                if (i === retries || err.message.includes('비어있습니다') || err.message.includes('빈 JSON')) {
                    console.warn('[API FALLBACK] 2차 자동 우회(Fallback) 실행...');

                    // Fallback 옵션: ForceText + ModelSwitch (검증된 모델로)
                    var fallbackOptions = Object.assign({}, options, { forceText: true, tag: (options.tag || '') + '-FB' });

                    // [FIX] 하드코딩된 'gemini-1.5-flash' 제거.
                    // 대신 현재 모델이 아닌 다른 모델이 있다면 시도해볼 수 있겠지만,
                    // 안전하게는 그냥 모델 변경 없이 ForceText로만 재시도하거나,
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
                    delete fallbackOptions.modelOverride;

                    try {
                        var fbResult = await _doCall(prompt, isJson, fallbackOptions);
                        console.log('[API FALLBACK] 2차 우회 성공!');
                        return fbResult;
                    } catch (fbErr) {
                        console.error('[API FALLBACK] 2차 우회도 실패:', fbErr);
                        throw fbErr; // 최종 실패
                    }
                    delete fbOptions.modelOverride;
                    // Don't sleep too long for this specific fallback
                    await sleep(1000);
                    // Modify options for the next iteration if loop continues, or for the final attempt
                    options.forceText = true;
                    options.tag = (options.tag || '') + '-FB';
                    continue;
}

                // 일반 재시도 대기
                await new Promise(resolve => setTimeout(resolve, 2000));
}

            // 기타: 더 재시도 가치 없으면 break
            if (attempt >= maxRetries) break;
            await sleep(jitter(1000 + attempt * 1000));
}
    } finally {
        // [FIX] 핵심: 어떤 상황에서도(성공/실패/에러) 처리 상태 해제 보장
        apiCallState.isProcessing = false;
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
