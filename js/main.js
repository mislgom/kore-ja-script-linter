/**
 * Script Review Pro vNext
 * Main JavaScript - API DEBUG VERSION
 */

/* ======================================================
   FIX: 글씨 깨짐(UTF-8 인코딩) 근본 복구
   - UI 텍스트를 유니코드 이스케이프로 강제 설정
====================================================== */
(function () {
    function setText(sel, txt) {
        const el = document.querySelector(sel);
        if (el) el.textContent = txt;
    }
    function setTabLabel(tabId, txt) {
        const btn = document.querySelector('.tab-btn[data-tab="' + tabId + '"]');
        if (!btn) return;
        const spans = btn.querySelectorAll('span');
        if (spans && spans.length) spans[spans.length - 1].textContent = txt;
    }

    function applyUiTextFix() {
        // title
        document.title = '\uC2A4\uD06C\uB9BD\uD2B8 \uB9AC\uBDF0 \uD504\uB85C | Script Review Pro';

        // header title (상단 좌측)
        const headerTitle =
            document.querySelector('header h1') ||
            document.querySelector('.text-xl.font-bold');
        if (headerTitle) headerTitle.textContent = '\uC2A4\uD06C\uB9BD\uD2B8 \uB9AC\uBDF0 \uD504\uB85C';

        // tab labels
        setTabLabel('korea-senior', '\uD55C\uAD6D \uC2DC\uB2C8\uC5B4 \uB0AD\uB3C5');
        setTabLabel('joseon-yadam', '\uC870\uC120 \uC57C\uB2F4');
        setTabLabel('japan-senior', '\uC77C\uBCF8 \uC2DC\uB2C8\uC5B4 \uB0AD\uB3C5');
        setTabLabel('world-news', '\uC804\uC138\uACC4 \uB274\uC2A4');

        // 주요 버튼/라벨 (존재하는 경우에만)
        setText('#korea-ai-analyze-btn', '\uD83E\uDD16 AI \uBD84\uC11D \uC2DC\uC791');
        setText('.analysis-header-title', '\uD83E\uDD16 AI \uBD84\uC11D \uC9C4\uD589 \uC911');
    }

    document.addEventListener('DOMContentLoaded', applyUiTextFix);
    window.applyUiTextFix = applyUiTextFix; // 디버그용
})();

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
    DEFAULT_MAX_OUTPUT_TOKENS: 2048,
    // Step별 추가 쿨다운 (연속 호출이 쌓여 Step2/4에서 터지는 현상 완화)
    STEP_COOLDOWN_MS: {
        // [HOTFIX] Step 1 쿨다운 제거
        2: 15000,
        4: 30000,
    },
    // 429 지수 백오프 (20→40→80→120초 cap) + 약간의 지터
    BACKOFF_BASE_MS: 20000,
    BACKOFF_CAP_MS: 120000,
    // 호출 간 최소 간격(기존 4초가 있다면 더 큰 값으로 올리지 말고 유지)
    MIN_CALL_INTERVAL_MS: 4000,
};

/* ======================================================
   [429 Infinite Retry Helpers]
====================================================== */
window.Step429State = window.Step429State || {
    counts: {},
