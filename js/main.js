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
