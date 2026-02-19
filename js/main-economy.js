/**
 * MISLGOM 경제 대본 검수 자동 프로그램
 * main-economy.js v1.0 - 경제 전용 분석 로직
 * - 수치·단위 오류, 인과관계 논리, 과장·단정 표현, 투자 리스크, 출처·근거 누락
 * - ENDPOINT: generativelanguage.googleapis.com
 * - TIMEOUT: 300000 ms
 * - MAX_OUTPUT_TOKENS: 65536
 */

console.log('🚀 main-economy.js v1.0 로드됨');

// ============================================================
// 경제 분석 규칙
// ============================================================
var ECONOMY_RULES = {
    // ============================================================
// 공식 데이터 소스 모듈 (대본 생성 엔진과 동일 기준)
// ============================================================
var OFFICIAL_DATA_SOURCES = {
    korea: [
        { id: 'BOK', name: '한국은행', types: ['기준금리', '통화정책', '금융안정보고서', '경제전망'] },
        { id: 'KOSTAT', name: '통계청', types: ['소비자물가', 'CPI', '고용률', '실업률', 'GDP', '가계동향'] },
        { id: 'MOEF', name: '기획재정부', types: ['경제정책', '재정', '세제', '국채'] },
        { id: 'FSC', name: '금융위원회', types: ['금융정책', '규제', '가계부채'] },
        { id: 'FSS', name: '금융감독원', types: ['금융감독', '소비자보호'] },
        { id: 'KDI', name: '한국개발연구원', types: ['경제전망', '정책연구'] },
        { id: 'KOSIS', name: '국가통계포털', types: ['각종 통계'] }
    ],
    usa: [
        { id: 'FED', name: '연준(Fed)', aliases: ['연방준비제도', 'Federal Reserve', 'FOMC'], types: ['기준금리', '연방기금금리', '통화정책', '양적긴축', 'QT', 'QE'] },
        { id: 'BLS', name: '노동통계국(BLS)', types: ['비농업고용', 'NFP', '실업률', 'CPI', 'PPI'] },
        { id: 'BEA', name: '경제분석국(BEA)', types: ['GDP', 'PCE', '개인소득', '무역수지'] },
        { id: 'TREASURY', name: '미국 재무부', types: ['국채', '재정정책', '환율보고서'] },
        { id: 'SEC', name: '증권거래위원회(SEC)', types: ['ETF', '증권규제', '공시'] },
        { id: 'CENSUS', name: '인구조사국', types: ['소매판매', '주택착공', '건설지출'] }
    ],
    international: [
        { id: 'IMF', name: '국제통화기금(IMF)', types: ['세계경제전망(WEO)', '국가보고서', '특별인출권'] },
        { id: 'WB', name: '세계은행(World Bank)', types: ['개발지표', '빈곤통계', '성장전망'] },
        { id: 'OECD', name: 'OECD', types: ['경제전망', '실업률', '교육지표', '생산성'] },
        { id: 'BIS', name: '국제결제은행(BIS)', types: ['글로벌 금융안정', '은행통계'] },
        { id: 'WTO', name: '세계무역기구(WTO)', types: ['무역통계', '무역분쟁'] }
    ],
    othercb: [
        { id: 'ECB', name: '유럽중앙은행(ECB)', types: ['기준금리', '유로존 통화정책'] },
        { id: 'BOJ', name: '일본은행(BOJ)', types: ['금리', '일본 통화정책', 'YCC'] },
        { id: 'PBOC', name: '중국인민은행(PBOC)', types: ['LPR', '지급준비율', '중국 통화정책'] },
        { id: 'BOE', name: '영란은행(BOE)', types: ['기준금리', '영국 통화정책'] }
    ]
};

var DATA_VALIDATION_RULES = {
    timeRequiredPatterns: [
        '금리', '기준금리', '환율', '물가', 'CPI', 'GDP', '성장률', '실업률',
        '고용률', '인플레이션', '주가', '지수', '수출', '수입', '무역수지',
        '가계부채', '국채', '수익률', 'PPI', 'PCE', '소매판매'
    ],
    comparisonRequired: [
        '상승', '하락', '증가', '감소', '개선', '악화', '둔화', '반등',
        '전년 대비', '전월 대비', '전기 대비', '전분기 대비'
    ],
    policyDateKeywords: [
        '발표', '결정', '시행', '적용', '인상', '인하', '동결', '변경'
    ],
    forecastVsActual: [
        { forecast: '전망', actual: '확정' },
        { forecast: '예상', actual: '발표' },
        { forecast: '예측', actual: '집계' },
        { forecast: '관측', actual: '확인' },
        { forecast: '추정', actual: '실적' }
    ]
};

function getOfficialSourceNames() {
    var names = [];
    for (var region in OFFICIAL_DATA_SOURCES) {
        OFFICIAL_DATA_SOURCES[region].forEach(function(src) {
            names.push(src.name);
            if (src.aliases) {
                src.aliases.forEach(function(a) { names.push(a); });
            }
        });
    }
    return names;
}

function getOfficialSourceNamesString() {
    return getOfficialSourceNames().join(', ');
}

    dangerousExpressions: [
        { pattern: '반드시', type: '과장단정', reason: '단정 표현 — 조건부 표현 권장' },
        { pattern: '무조건', type: '과장단정', reason: '단정 표현 — 예외 가능성 명시 필요' },
        { pattern: '100%', type: '과장단정', reason: '확률적 단정 — 불확실성 표현 필요' },
        { pattern: '확정', type: '과장단정', reason: '미래 사건 단정 — 전망/예상으로 변경 권장' },
        { pattern: '절대', type: '과장단정', reason: '단정 표현 — 가능성 언급 필요' },
        { pattern: '무조건 오른다', type: '과장단정', reason: '투자 단정 표현 — 리스크 언급 필요' },
        { pattern: '무조건 내린다', type: '과장단정', reason: '투자 단정 표현 — 리스크 언급 필요' },
        { pattern: '틀림없이', type: '과장단정', reason: '단정 표현 — 개연성 표현 권장' },
        { pattern: '분명히', type: '과장단정', reason: '단정 표현 — 조건부 표현 권장' },
        { pattern: '당연히', type: '과장단정', reason: '단정 표현 — 근거 제시 필요' },
        { pattern: '의심할 여지 없이', type: '과장단정', reason: '단정 표현' },
        { pattern: '장담', type: '과장단정', reason: '보장 불가한 표현' }
    ],
    fearExpressions: [
        { pattern: '폭락', type: '공포조장', reason: '공포 조장 가능 — 하락/조정으로 순화 권장' },
        { pattern: '대폭락', type: '공포조장', reason: '공포 조장 표현' },
        { pattern: '붕괴', type: '공포조장', reason: '공포 조장 가능 — 약세/하락으로 순화 권장' },
        { pattern: '파산', type: '공포조장', reason: '맥락에 따라 공포 조장 가능' },
        { pattern: '휴지조각', type: '공포조장', reason: '자산 가치 공포 표현' },
        { pattern: '거품', type: '공포조장', reason: '맥락 확인 필요 — 과열로 순화 권장' },
        { pattern: '버블', type: '공포조장', reason: '맥락 확인 필요 — 과열로 순화 권장' },
        { pattern: '공포', type: '공포조장', reason: '감정적 표현 — 객관적 서술 권장' },
        { pattern: '패닉', type: '공포조장', reason: '감정적 표현 — 급락/조정으로 순화 권장' },
        { pattern: '지옥', type: '공포조장', reason: '극단적 표현' },
        { pattern: '나락', type: '공포조장', reason: '극단적 표현' }
    ],
    investmentRisk: [
        { pattern: '지금 사야', type: '투자유도', reason: '특정 시점 매수 유도 — 투자 판단은 개인 책임 문구 필요' },
        { pattern: '지금 팔아야', type: '투자유도', reason: '특정 시점 매도 유도' },
        { pattern: '매수 추천', type: '투자유도', reason: '직접 매수 권유 — 투자 참고 자료 문구 권장' },
        { pattern: '매도 추천', type: '투자유도', reason: '직접 매도 권유' },
        { pattern: '수익 보장', type: '투자유도', reason: '수익 보장 불가 — 원금 손실 가능성 명시 필요' },
        { pattern: '원금 보장', type: '투자유도', reason: '원금 보장 불가한 투자에 사용 시 문제' },
        { pattern: '안전한 투자', type: '투자유도', reason: '모든 투자에는 리스크 존재 — 상대적 안정성으로 표현 권장' },
        { pattern: '확실한 수익', type: '투자유도', reason: '수익 확정 불가 — 기대 수익으로 변경 권장' },
        { pattern: '놓치면 후회', type: '투자유도', reason: 'FOMO 유발 표현' },
        { pattern: '마지막 기회', type: '투자유도', reason: 'FOMO 유발 표현' },
        { pattern: '지금 아니면', type: '투자유도', reason: '긴급성 유발 — 조급한 판단 유도' },
        { pattern: '몰빵', type: '투자유도', reason: '집중 투자 유도 — 분산 투자 권장 문구 필요' },
        { pattern: '올인', type: '투자유도', reason: '집중 투자 유도' },
        { pattern: '대박', type: '투자유도', reason: '과도한 수익 기대 유발' }
    ],
    uncitedPatterns: [
        { pattern: '전문가들은', type: '출처누락', reason: '전문가 특정 필요 — 이름/소속/발언 시점 명시 권장' },
        { pattern: '전문가에 따르면', type: '출처누락', reason: '출처 특정 필요' },
        { pattern: '통계에 따르면', type: '출처누락', reason: '통계 출처 명시 필요 — 기관명/조사 시점 필요' },
        { pattern: '조사에 따르면', type: '출처누락', reason: '조사 기관/시점 명시 필요' },
        { pattern: '연구 결과', type: '출처누락', reason: '연구 기관/논문명 명시 필요' },
        { pattern: '보고서에 따르면', type: '출처누락', reason: '보고서 출처 명시 필요' },
        { pattern: '관계자는', type: '출처누락', reason: '관계자 소속/직함 명시 권장' },
        { pattern: '업계에서는', type: '출처누락', reason: '구체적 출처 필요' },
        { pattern: '시장에서는', type: '출처누락', reason: '구체적 근거 제시 필요' },
        { pattern: '알려진 바에 따르면', type: '출처누락', reason: '출처 불명확' },
        { pattern: '소식통에 따르면', type: '출처누락', reason: '소식통 특정 필요' }
    ],
    units: [
        { unit: '%', aliases: ['퍼센트', '프로'], type: '단위' },
        { unit: '원', aliases: ['만원', '억원', '조원'], type: '단위' },
        { unit: '달러', aliases: ['$', 'USD', '미국 달러'], type: '단위' },
        { unit: '엔', aliases: ['¥', 'JPY', '일본 엔'], type: '단위' },
        { unit: '유로', aliases: ['€', 'EUR'], type: '단위' },
        { unit: '위안', aliases: ['CNY', '중국 위안'], type: '단위' }
    ]
};

// ============================================================
// 캐시 타이머
// ============================================================
var cacheTimer = {
    intervalId: null,
    cacheName: null,
    remainingSeconds: 0,
    warningShown: false,
    WARNING_THRESHOLD: 300
};

// ============================================================
// 전역 상태
// ============================================================
var state = {
    stage1: {
        originalScript: '',
        analysis: null,
        revisedScript: '',
        allErrors: [],
        fixedScript: '',
        currentErrorIndex: -1,
        isFixed: false
    },
    finalScript: '',
    changePoints: [],
};

var currentAbortController = null;

var API_CONFIG = {
    TIMEOUT: 300000,
    MODEL: 'gemini-2.5-flash',
    ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models',
    MAX_OUTPUT_TOKENS: 65536
};

// ============================================================
// 초기화
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

function initApp() {
    initDarkMode();
    initApiKeyPanel();
    initTextArea();
    initFileUpload();
    initDragAndDrop();
    initClearButton();
    initDownloadButton();
    initRevertButtons();
    initStage1AnalysisButton();
    initStopButton();
    addStyles();
    addFullViewButtonsToHeaders();
    createFullViewModal();
    initEscKeyHandler();
    initResetCacheButton();
    console.log('📊 경제 규칙 로드됨: 과장단정 ' + ECONOMY_RULES.dangerousExpressions.length + '개, 공포조장 ' + ECONOMY_RULES.fearExpressions.length + '개, 투자유도 ' + ECONOMY_RULES.investmentRisk.length + '개, 출처누락 ' + ECONOMY_RULES.uncitedPatterns.length + '개');
    console.log('⏱️ API 타임아웃: ' + (API_CONFIG.TIMEOUT / 1000) + '초');
    console.log('🤖 모델: ' + API_CONFIG.MODEL);
    console.log('✅ main-economy.js v1.0 초기화 완료');
    console.log('🆕 경제 전용: 수치오류, 인과논리, 과장단정, 투자리스크, 출처누락');
}

// ============================================================
// 유틸리티 함수들
// ============================================================

function initEscKeyHandler() {
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeFullViewModal();
        }
    });
}

function getEconomyRulesString() {
    var rules = [];
    ECONOMY_RULES.dangerousExpressions.forEach(function(r) { rules.push(r.pattern); });
    ECONOMY_RULES.fearExpressions.forEach(function(r) { rules.push(r.pattern); });
    ECONOMY_RULES.investmentRisk.forEach(function(r) { rules.push(r.pattern); });
    ECONOMY_RULES.uncitedPatterns.forEach(function(r) { rules.push(r.pattern); });
    return rules.join(', ');
}

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatTypeText(type) {
    if (!type) return '';
    var typeMap = {
        '수치단위': '수치<br>단위',
        '인과논리': '인과<br>논리',
        '과장단정': '과장<br>단정',
        '공포조장': '공포<br>조장',
        '투자유도': '투자<br>유도',
        '출처누락': '출처<br>누락',
        '숫자불일치': '숫자<br>불일치',
        '데이터검증': '데이터<br>검증'

    };
    return typeMap[type] || type.replace(/(.{2})/g, '$1<br>').replace(/<br>$/, '');
}

function showProgress(message) {
    var container = document.getElementById('progress-container');
    if (container) {
        container.style.display = 'block';
        updateProgress(0, message);
    }
}

function updateProgress(percent, message) {
    var bar = document.getElementById('progress-bar');
    var text = document.getElementById('progress-text');
    if (bar) bar.style.width = percent + '%';
    if (text) text.textContent = message || '';
}

function hideProgress() {
    var container = document.getElementById('progress-container');
    if (container) container.style.display = 'none';
}

// ============================================================
// 스타일 추가
// ============================================================
function addStyles() {
    if (document.getElementById('custom-styles')) return;
    var style = document.createElement('style');
    style.id = 'custom-styles';
    style.textContent =
        '@keyframes blink{0%,100%{opacity:1;background:#69f0ae;}50%{opacity:0.3;background:#ffeb3b;}}' +
        '@keyframes blinkOrange{0%,100%{opacity:1;background:#ff9800;}50%{opacity:0.3;background:#ffeb3b;}}' +
        '.highlight-active{animation:blink 0.4s ease-in-out 4!important;}' +
        '.highlight-active-orange{animation:blinkOrange 0.4s ease-in-out 4!important;}' +
        '.marker-revised{background:#69f0ae;color:#000;padding:2px 4px;border-radius:3px;cursor:pointer;font-weight:bold;}' +
        '.marker-original{background:#ff9800;color:#000;padding:2px 4px;border-radius:3px;cursor:pointer;font-weight:bold;}' +
        '.fullview-modal{display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);z-index:10000;overflow:auto;}' +
        '.fullview-content{display:flex;width:100%;height:100%;padding:20px;box-sizing:border-box;}' +
        '.fullview-panel{flex:1;margin:0 10px;display:flex;flex-direction:column;background:#1e1e1e;border-radius:10px;overflow:hidden;}' +
        '.fullview-header{background:#333;padding:15px;text-align:center;font-weight:bold;color:#fff;border-bottom:1px solid #444;}' +
        '.fullview-body{flex:1;overflow:auto;padding:15px;}' +
        '.fullview-footer{padding:15px;border-top:1px solid #444;text-align:center;display:flex;justify-content:center;gap:10px;flex-wrap:wrap;}' +
        '.fullview-close{position:fixed;top:20px;right:30px;font-size:40px;color:#fff;cursor:pointer;z-index:10001;}' +
        '.fullview-close:hover{color:#ff5555;}' +
        '.btn-fullview{background:#9c27b0;color:white;border:none;padding:8px 16px;border-radius:5px;cursor:pointer;font-weight:bold;font-size:13px;margin-left:10px;}' +
        '.btn-fullview:hover{background:#7b1fa2;}' +
        '.analysis-table{width:100%;border-collapse:collapse;font-size:12px;table-layout:fixed;}' +
        '.analysis-table th{padding:8px 4px;border:1px solid #444;background:#333;font-weight:bold;text-align:center;word-break:keep-all;}' +
        '.analysis-table td{padding:8px 4px;border:1px solid #444;vertical-align:middle;word-wrap:break-word;overflow-wrap:break-word;}' +
        '.analysis-table th:nth-child(1),.analysis-table td:nth-child(1){width:45px;text-align:center;line-height:1.2;}' +
        '.analysis-table th:nth-child(2),.analysis-table td:nth-child(2){width:25%;}' +
        '.analysis-table th:nth-child(3),.analysis-table td:nth-child(3){width:25%;}' +
        '.analysis-table th:nth-child(4),.analysis-table td:nth-child(4){width:calc(50% - 45px);}' +
        '.type-cell{font-size:11px;line-height:1.3;word-break:keep-all;}' +
        '.row-selected{background:#3a3a3a !important;outline:2px solid #69f0ae;}';
    document.head.appendChild(style);
}

// ============================================================
// 다크모드
// ============================================================
function initDarkMode() {
    var btn = document.getElementById('btn-dark-mode');
    if (!btn) return;
    var saved = localStorage.getItem('darkMode');
    if (saved === 'true') {
        document.body.classList.add('dark-mode');
        btn.textContent = '☀️ 라이트모드';
    }
    btn.addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');
        var isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDark);
        btn.textContent = isDark ? '☀️ 라이트모드' : '🌙 다크모드';
    });
}

// ============================================================
// API 키 패널
// ============================================================
function initApiKeyPanel() {
    var btn = document.getElementById('btn-api-settings');
    var panel = document.getElementById('api-key-panel');
    var input = document.getElementById('api-key-input');
    var saveBtn = document.getElementById('btn-save-api-key');
    var closeBtn = document.getElementById('btn-close-api-panel');
    if (!btn || !panel || !input) return;
    var savedKey = localStorage.getItem('GEMINI_API_KEY');
    if (savedKey) input.value = savedKey;
    btn.addEventListener('click', function() {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    });
    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            var key = input.value.trim();
            if (key) {
                localStorage.setItem('GEMINI_API_KEY', key);
                alert('API 키가 저장되었습니다.');
                panel.style.display = 'none';
            } else {
                alert('API 키를 입력해주세요.');
            }
        });
    }
    if (closeBtn) {
        closeBtn.addEventListener('click', function() { panel.style.display = 'none'; });
    }
}

function validateApiKey(apiKey) {
    if (!apiKey) return { valid: false, message: 'API 키가 설정되지 않았습니다.' };
    if (apiKey.length < 20) return { valid: false, message: 'API 키가 너무 짧습니다.' };
    return { valid: true, message: 'OK' };
}

// ============================================================
// 텍스트 입력, 파일 업로드, 드래그앤드롭
// ============================================================
function initTextArea() {
    var textarea = document.getElementById('original-script');
    var charCount = document.getElementById('char-count');
    if (!textarea || !charCount) return;
    textarea.addEventListener('input', function() {
        charCount.textContent = textarea.value.length;
    });
}

function initClearButton() {
    var clearBtn = document.getElementById('btn-clear-script');
    if (!clearBtn) return;
    clearBtn.addEventListener('click', function() {
        resetAllAnalysis();
        document.getElementById('original-script').value = '';
        document.getElementById('char-count').textContent = '0';
        var fileDisplay = document.getElementById('file-name-display');
        if (fileDisplay) fileDisplay.textContent = '';
    });
}

function initFileUpload() {
    var fileInput = document.getElementById('file-input');
    if (!fileInput) return;
    fileInput.addEventListener('change', function(e) {
        var file = e.target.files[0];
        if (file && file.name.endsWith('.txt')) {
            handleFile(file);
            var fileDisplay = document.getElementById('file-name-display');
            if (fileDisplay) fileDisplay.textContent = '📎 ' + file.name;
        } else {
            alert('TXT 파일만 업로드 가능합니다.');
        }
    });
}

function initDragAndDrop() {
    var dropZone = document.getElementById('drop-zone');
    if (!dropZone) return;
    dropZone.addEventListener('dragenter', function(e) { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragover', function(e) { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', function(e) { e.preventDefault(); if (!dropZone.contains(e.relatedTarget)) dropZone.classList.remove('drag-over'); });
    dropZone.addEventListener('drop', function(e) {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        var file = e.dataTransfer.files[0];
        if (file && file.name.endsWith('.txt')) {
            handleFile(file);
            var fileDisplay = document.getElementById('file-name-display');
            if (fileDisplay) fileDisplay.textContent = '📎 ' + file.name;
        } else {
            alert('TXT 파일만 업로드 가능합니다.');
        }
    });
}

function handleFile(file) {
    var reader = new FileReader();
    reader.onload = function(e) {
        resetAllAnalysis();
        document.getElementById('original-script').value = e.target.result;
        document.getElementById('char-count').textContent = e.target.result.length;
    };
    reader.readAsText(file);
}

// ============================================================
// 다운로드
// ============================================================
function initDownloadButton() {
    var btn = document.getElementById('btn-download');
    if (!btn) return;
    btn.addEventListener('click', function() {
        var script = state.stage1.fixedScript || '';
        if (!script || script.trim() === '') {
            alert('다운로드할 수정본이 없습니다.\n"대본 픽스" 버튼을 먼저 눌러주세요.');
            return;
        }
        downloadScript(script);
    });
}

function downloadScript(script) {
    if (!script || script.trim() === '') {
        alert('다운로드할 내용이 없습니다.');
        return;
    }
    var cleanScript = cleanScriptForDownload(script);
    try {
        var blob = new Blob([cleanScript], { type: 'text/plain;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = '경제_수정본_' + new Date().toISOString().slice(0, 10) + '.txt';
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 200);
    } catch (e) {
        alert('다운로드 중 오류가 발생했습니다: ' + e.message);
    }
}

function cleanScriptForDownload(script) {
    if (!script) return '';
    var cleaned = script;
    cleaned = cleaned.replace(/★/g, '');
    cleaned = cleaned.replace(/__DELETE__/g, '');
    cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');
    cleaned = cleaned.split('\n').map(function(line) { return line.trim(); }).join('\n');
    cleaned = cleaned.trim();
    return cleaned;
}

// ============================================================
// 중지 버튼
// ============================================================
function initStopButton() {
    var stopBtn = document.getElementById('btn-stop-analysis');
    if (stopBtn) {
        stopBtn.addEventListener('click', function() {
            if (currentAbortController) {
                currentAbortController.abort();
                currentAbortController = null;
                updateProgress(0, '분석 중지됨');
                stopBtn.disabled = true;
                alert('분석이 중지되었습니다.');
                setTimeout(function() {
                    document.getElementById('progress-container').style.display = 'none';
                }, 1000);
            }
        });
    }
}

// ============================================================
// 수정 전/후 버튼, 픽스 버튼
// ============================================================
function initRevertButtons() {
    var r1 = document.getElementById('revised-stage1');
    if (r1) addRevertButton(r1, 'stage1');
}

function addRevertButton(container, stage) {
    var parent = container.parentElement;
    if (parent.querySelector('.revert-btn-wrapper')) return;
    var wrapper = document.createElement('div');
    wrapper.className = 'revert-btn-wrapper';
    wrapper.style.cssText = 'text-align:center;padding:10px;border-top:1px solid #444;display:flex;justify-content:center;gap:10px;flex-wrap:wrap;';

    var btnBefore = document.createElement('button');
    btnBefore.id = 'btn-revert-before-' + stage;
    btnBefore.innerHTML = '🔄 수정 전';
    btnBefore.style.cssText = 'background:#ff9800;color:white;border:none;padding:8px 16px;border-radius:5px;cursor:pointer;font-weight:bold;font-size:13px;';
    btnBefore.disabled = true;
    btnBefore.addEventListener('click', function() { toggleCurrentErrorOnly(stage, false); });

    var btnAfter = document.createElement('button');
    btnAfter.id = 'btn-revert-after-' + stage;
    btnAfter.innerHTML = '✅ 수정 후';
    btnAfter.style.cssText = 'background:#4CAF50;color:white;border:none;padding:8px 16px;border-radius:5px;cursor:pointer;font-weight:bold;font-size:13px;';
    btnAfter.disabled = true;
    btnAfter.addEventListener('click', function() { toggleCurrentErrorOnly(stage, true); });

    var btnFix = document.createElement('button');
    btnFix.id = 'btn-fix-script-' + stage;
    btnFix.innerHTML = '📌 대본 픽스';
    btnFix.style.cssText = 'background:#2196F3;color:white;border:none;padding:8px 16px;border-radius:5px;cursor:pointer;font-weight:bold;font-size:13px;';
    btnFix.disabled = true;
    btnFix.addEventListener('click', function() { fixScript(stage); });

    wrapper.appendChild(btnBefore);
    wrapper.appendChild(btnAfter);
    wrapper.appendChild(btnFix);
    parent.appendChild(wrapper);
}

// ============================================================
// 모달 — 전체 보기
// ============================================================
function createFullViewModal() {
    if (document.getElementById('fullview-modal')) return;
    var modal = document.createElement('div');
    modal.id = 'fullview-modal';
    modal.className = 'fullview-modal';
    modal.innerHTML =
        '<span class="fullview-close" id="fullview-close">&times;</span>' +
        '<div class="fullview-content">' +
            '<div class="fullview-panel" id="fullview-left">' +
                '<div class="fullview-header" id="fullview-left-header">분석 결과</div>' +
                '<div class="fullview-body" id="fullview-left-body"></div>' +
            '</div>' +
            '<div class="fullview-panel" id="fullview-right">' +
                '<div class="fullview-header" id="fullview-right-header">수정 반영</div>' +
                '<div class="fullview-body" id="fullview-right-body"></div>' +
                '<div class="fullview-footer" id="fullview-footer"></div>' +
            '</div>' +
        '</div>';
    document.body.appendChild(modal);
    document.getElementById('fullview-close').addEventListener('click', closeFullViewModal);
    modal.addEventListener('click', function(e) { if (e.target === modal) closeFullViewModal(); });
}

function openFullViewModal() {
    var modal = document.getElementById('fullview-modal');
    if (!modal) return;

    var analysisBox = document.getElementById('analysis-stage1');
    var revisedBox = document.getElementById('revised-stage1');

    document.getElementById('fullview-left-header').textContent = '분석 결과';
    document.getElementById('fullview-right-header').textContent = '수정 반영';

    var leftBody = document.getElementById('fullview-left-body');
    var rightBody = document.getElementById('fullview-right-body');
    var footer = document.getElementById('fullview-footer');

    if (analysisBox) {
        leftBody.innerHTML = analysisBox.innerHTML;
        leftBody.querySelectorAll('tr[data-marker-id]').forEach(function(row) {
            row.addEventListener('click', function() {
                var markerId = this.getAttribute('data-marker-id');
                var errorIndex = findErrorIndexById('stage1', markerId);
                if (errorIndex >= 0) {
                    setCurrentError('stage1', errorIndex);
                    highlightFullViewRow(leftBody, markerId);
                    scrollToFullViewMarker(rightBody, markerId);
                }
            });
        });
    }

    if (revisedBox) {
        if (state.stage1.fixedScript && state.stage1.fixedScript.trim().length > 0) {
            rightBody.innerHTML = '<div style="white-space:pre-wrap;padding:15px;font-size:14px;line-height:1.8;word-break:break-word;">' + escapeHtml(state.stage1.fixedScript) + '</div>';
        } else {
            rightBody.innerHTML = revisedBox.innerHTML;
        }
    }

    footer.innerHTML = '';

    var btnBefore = document.createElement('button');
    btnBefore.innerHTML = '🔄 수정 전';
    btnBefore.style.cssText = 'background:#ff9800;color:white;border:none;padding:8px 16px;border-radius:5px;cursor:pointer;font-weight:bold;font-size:13px;';
    btnBefore.addEventListener('click', function() {
        toggleCurrentErrorOnly('stage1', false);
        updateFullViewContent(leftBody, rightBody);
    });

    var btnAfter = document.createElement('button');
    btnAfter.innerHTML = '✅ 수정 후';
    btnAfter.style.cssText = 'background:#4CAF50;color:white;border:none;padding:8px 16px;border-radius:5px;cursor:pointer;font-weight:bold;font-size:13px;';
    btnAfter.addEventListener('click', function() {
        toggleCurrentErrorOnly('stage1', true);
        updateFullViewContent(leftBody, rightBody);
    });

    var btnFix = document.createElement('button');
    btnFix.innerHTML = '📌 대본 픽스';
    btnFix.style.cssText = 'background:#2196F3;color:white;border:none;padding:8px 16px;border-radius:5px;cursor:pointer;font-weight:bold;font-size:13px;';
    btnFix.addEventListener('click', function() {
        fixScript('stage1');
        updateFullViewContent(leftBody, rightBody);
    });

    footer.appendChild(btnBefore);
    footer.appendChild(btnAfter);
    footer.appendChild(btnFix);

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';

    // 편집 토글 추가
    setTimeout(function() {
        addFullViewEditToggle();
        fullviewEditState.isEditMode = false;
        var cb = document.getElementById('fullview-edit-checkbox');
        if (cb) cb.checked = false;
    }, 100);
}

function updateFullViewContent(leftBody, rightBody) {
    var analysisBox = document.getElementById('analysis-stage1');
    var revisedBox = document.getElementById('revised-stage1');
    if (analysisBox) {
        leftBody.innerHTML = analysisBox.innerHTML;
        leftBody.querySelectorAll('tr[data-marker-id]').forEach(function(row) {
            row.addEventListener('click', function() {
                var markerId = this.getAttribute('data-marker-id');
                var errorIndex = findErrorIndexById('stage1', markerId);
                if (errorIndex >= 0) {
                    setCurrentError('stage1', errorIndex);
                    highlightFullViewRow(leftBody, markerId);
                    scrollToFullViewMarker(rightBody, markerId);
                }
            });
        });
    }
    if (revisedBox) {
        if (state.stage1.fixedScript && state.stage1.fixedScript.trim().length > 0) {
            rightBody.innerHTML = '<div style="white-space:pre-wrap;padding:15px;font-size:14px;line-height:1.8;word-break:break-word;">' + escapeHtml(state.stage1.fixedScript) + '</div>';
        } else {
            rightBody.innerHTML = revisedBox.innerHTML;
        }
    }
}

function highlightFullViewRow(container, markerId) {
    container.querySelectorAll('tr[data-marker-id]').forEach(function(row) {
        if (row.getAttribute('data-marker-id') === markerId) {
            row.style.background = '#3a3a3a';
            row.style.outline = '2px solid #69f0ae';
        } else {
            row.style.background = '';
            row.style.outline = '';
        }
    });
}

function scrollToFullViewMarker(container, markerId) {
    var marker = container.querySelector('.correction-marker[data-marker-id="' + markerId + '"]');
    if (marker) {
        marker.scrollIntoView({ behavior: 'smooth', block: 'center' });
        var isRevised = marker.classList.contains('marker-revised');
        marker.classList.add(isRevised ? 'highlight-active' : 'highlight-active-orange');
        setTimeout(function() {
            marker.classList.remove('highlight-active');
            marker.classList.remove('highlight-active-orange');
        }, 1600);
    }
}

function closeFullViewModal() {
    var modal = document.getElementById('fullview-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

function addFullViewButtonsToHeaders() {
    setTimeout(function() {
        var revised1Parent = document.getElementById('revised-stage1');
        if (revised1Parent) {
            var parent1 = revised1Parent.parentElement;
            var header1 = parent1.querySelector('h3');
            if (header1 && !header1.querySelector('.btn-fullview')) {
                var btn1 = document.createElement('button');
                btn1.className = 'btn-fullview';
                btn1.innerHTML = '🔍 전체 보기';
                btn1.addEventListener('click', function() { openFullViewModal(); });
                header1.style.display = 'flex';
                header1.style.justifyContent = 'space-between';
                header1.style.alignItems = 'center';
                header1.appendChild(btn1);
            }
        }
    }, 100);
}

// ============================================================
// 캐시 관련 함수
// ============================================================
async function createScriptCache(script, systemInstruction, ttlSeconds) {
    var apiKey = localStorage.getItem('GEMINI_API_KEY');
    if (!apiKey || !script || script.length < 1500) return null;
    if (!ttlSeconds) ttlSeconds = 1800;

    var url = 'https://generativelanguage.googleapis.com/v1beta/cachedContents?key=' + apiKey;
    var requestBody = {
        model: 'models/' + API_CONFIG.MODEL,
        displayName: 'economy-analysis-' + Date.now(),
        contents: [{ role: 'user', parts: [{ text: script }] }],
        ttl: ttlSeconds + 's'
    };
    if (systemInstruction) {
        requestBody.systemInstruction = { parts: [{ text: systemInstruction }] };
    }

    try {
        var response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
        if (!response.ok) return null;
        var data = await response.json();
        return (data && data.name) ? data.name : null;
    } catch (error) {
        console.error('❌ 캐시 생성 실패:', error.message);
        return null;
    }
}

async function deleteScriptCache(cacheName) {
    stopCacheTimer();
    if (!cacheName) return;
    var apiKey = localStorage.getItem('GEMINI_API_KEY');
    if (!apiKey) return;
    try {
        await fetch('https://generativelanguage.googleapis.com/v1beta/' + cacheName + '?key=' + apiKey, { method: 'DELETE' });
    } catch (error) { /* 무시 */ }
}

function startCacheTimer(cacheName, ttlSeconds) {
    stopCacheTimer();
    cacheTimer.cacheName = cacheName;
    cacheTimer.remainingSeconds = ttlSeconds;
    cacheTimer.warningShown = false;
    cacheTimer.intervalId = setInterval(function() {
        cacheTimer.remainingSeconds--;
        if (cacheTimer.remainingSeconds <= 0) { stopCacheTimer(); }
    }, 1000);
}

function stopCacheTimer() {
    if (cacheTimer.intervalId) { clearInterval(cacheTimer.intervalId); cacheTimer.intervalId = null; }
    cacheTimer.cacheName = null;
    cacheTimer.remainingSeconds = 0;
}

function initResetCacheButton() {
    var btn = document.getElementById('btn-reset-cache');
    if (!btn) return;
    btn.addEventListener('click', function() {
        var cacheName = state._cacheName;
        if (!cacheName) { alert('현재 활성화된 캐시가 없습니다.'); return; }
        if (!confirm('캐시를 삭제하시겠습니까?')) return;
        deleteScriptCache(cacheName);
        state._cacheName = null;
        alert('캐시가 삭제되었습니다.');
    });
}

// ============================================================
// 전체 초기화
// ============================================================
function resetAllAnalysis() {
    if (state._cacheName) {
        deleteScriptCache(state._cacheName);
        state._cacheName = null;
    }
    state.stage1 = {
        originalScript: '',
        analysis: null,
        revisedScript: '',
        allErrors: [],
        fixedScript: '',
        currentErrorIndex: -1,
        isFixed: false
    };
    state.finalScript = '';
    state.changePoints = [];

    var stage1Analysis = document.getElementById('analysis-stage1');
    if (stage1Analysis) stage1Analysis.innerHTML = '<p class="placeholder">분석을 시작하면 결과가 표시됩니다.</p>';
    var revisedStage1 = document.getElementById('revised-stage1');
    if (revisedStage1) revisedStage1.innerHTML = '<p class="placeholder">분석 후 수정본이 표시됩니다.</p>';

    var btnNames = ['btn-revert-before-stage1', 'btn-revert-after-stage1', 'btn-fix-script-stage1'];
    btnNames.forEach(function(id) {
        var btn = document.getElementById(id);
        if (btn) btn.disabled = true;
    });

    var downloadBtn = document.getElementById('btn-download');
    if (downloadBtn) downloadBtn.disabled = true;

    hideProgress();
}

// ============================================================
// 1차 분석 시작 버튼
// ============================================================
function initStage1AnalysisButton() {
    var analysisContainer = document.getElementById('analysis-stage1');
    if (!analysisContainer) return;
    var parent = analysisContainer.parentElement;
    var existingBtn = parent.querySelector('.stage1-start-wrapper');
    if (existingBtn) existingBtn.remove();
    var wrapper = document.createElement('div');
    wrapper.className = 'stage1-start-wrapper';
    wrapper.style.cssText = 'text-align:center;padding:15px;';
    var btn = document.createElement('button');
    btn.id = 'btn-start-stage1';
    btn.innerHTML = '🔍 분석 시작';
    btn.style.cssText = 'background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;border:none;padding:15px 40px;border-radius:8px;cursor:pointer;font-weight:bold;font-size:16px;box-shadow:0 4px 15px rgba(102,126,234,0.4);';
    btn.addEventListener('click', startStage1Analysis);
    wrapper.appendChild(btn);
    parent.appendChild(wrapper);
}

// ============================================================
// 오류 토글 함수들
// ============================================================

function toggleCurrentErrorOnly(stage, useRevised) {
    var s = state[stage];
    var errors = s.allErrors || [];
    if (errors.length === 0) return;

    if (s.currentErrorIndex >= 0 && s.currentErrorIndex < errors.length) {
        var err = errors[s.currentErrorIndex];
        err.useRevised = useRevised;
        renderScriptWithMarkers(stage);
    } else {
        alert('수정할 항목을 먼저 선택하세요.\n분석 결과 테이블에서 행을 클릭하면 해당 항목이 선택됩니다.');
    }
}

function setCurrentError(stage, errorIndex) {
    state[stage].currentErrorIndex = errorIndex;
    highlightCurrentRow(stage, errorIndex);
    var errors = state[stage].allErrors || [];
    if (errorIndex >= 0 && errorIndex < errors.length) {
        scrollToMarker(stage, errors[errorIndex].id);
    }
}

function highlightCurrentRow(stage, errorIndex) {
    var tableContainer = document.getElementById('analysis-' + stage);
    if (!tableContainer) return;
    var rows = tableContainer.querySelectorAll('tr[data-marker-id]');
    rows.forEach(function(row) {
        var markerId = row.getAttribute('data-marker-id');
        if (markerId) {
            var rowIndex = findErrorIndexById(stage, markerId);
            if (rowIndex === errorIndex) {
                row.classList.add('row-selected');
                row.style.background = '#3a3a3a';
                row.style.outline = '2px solid #69f0ae';
            } else {
                row.classList.remove('row-selected');
                row.style.background = '';
                row.style.outline = '';
            }
        }
    });
}

function findErrorIndexById(stage, markerId) {
    var errors = state[stage].allErrors || [];
    for (var i = 0; i < errors.length; i++) {
        if (errors[i].id === markerId) return i;
    }
    return -1;
}

function scrollToTableRow(stage, markerId) {
    var tableContainer = document.getElementById('analysis-' + stage);
    if (!tableContainer) return;
    var rows = tableContainer.querySelectorAll('tr[data-marker-id]');
    rows.forEach(function(row) {
        if (row.getAttribute('data-marker-id') === markerId) {
            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            row.style.transition = 'background 0.3s';
            row.style.background = '#ffeb3b';
            setTimeout(function() { row.style.background = '#3a3a3a'; }, 1000);
        }
    });
}

// ============================================================
// cleanRevisedText
// ============================================================
function cleanRevisedText(text) {
    if (!text) return '';

    var deletePatterns = [
        /^\s*\(.*삭제.*\)\s*$/,
        /^\s*\[.*삭제.*\]\s*$/,
        /^\s*삭제\s*$/,
        /^\s*\(.*제거.*\)\s*$/,
        /^\s*제거\s*$/
    ];
    for (var d = 0; d < deletePatterns.length; d++) {
        if (deletePatterns[d].test(text.trim())) {
            return '__DELETE__';
        }
    }

    var cleaned = text;
    cleaned = cleaned.replace(/\s*\([^)]*\)\s*/g, ' ');
    cleaned = cleaned.replace(/\s*\[[^\]]*\]\s*/g, ' ');
    cleaned = cleaned.replace(/\s*\{[^}]*\}\s*/g, ' ');

    if (cleaned.indexOf(' / ') !== -1) {
        cleaned = cleaned.split(' / ')[0].trim();
    }
    if (cleaned.indexOf(' | ') !== -1) {
        cleaned = cleaned.split(' | ')[0].trim();
    }

    cleaned = cleaned.replace(/\s*<[^>]*>\s*/g, ' ');
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    if (!cleaned || cleaned.length === 0) {
        var fallback = text.replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '').replace(/\s+/g, ' ').trim();
        return fallback || text;
    }
    return cleaned;
}

// ============================================================
// 텍스트 매칭 헬퍼
// ============================================================
function findBestMatch(text, searchText) {
    if (!text || !searchText) return { found: false, matchedText: '', position: -1 };

    var exactPos = text.indexOf(searchText);
    if (exactPos !== -1) return { found: true, matchedText: searchText, position: exactPos };

    var normalizedSearch = searchText.replace(/\s+/g, ' ').trim();
    var normalizedPos = text.indexOf(normalizedSearch);
    if (normalizedPos !== -1) return { found: true, matchedText: normalizedSearch, position: normalizedPos };

    var noLineBreakSearch = searchText.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
    var noLineBreakPos = text.indexOf(noLineBreakSearch);
    if (noLineBreakPos !== -1) return { found: true, matchedText: noLineBreakSearch, position: noLineBreakPos };

    if (searchText.length > 30) {
        var frontPart = searchText.substring(0, 30).replace(/[\r\n]+/g, ' ').trim();
        var frontPos = text.indexOf(frontPart);
        if (frontPos !== -1) {
            var endPos = Math.min(frontPos + searchText.length, text.length);
            return { found: true, matchedText: text.substring(frontPos, endPos), position: frontPos };
        }
    }

    var words = searchText.replace(/[\r\n]+/g, ' ').split(/\s+/).filter(function(w) {
        return w.length >= 3;
    });
    if (words.length >= 2) {
        var firstWord = words[0];
        var lastWord = words[words.length - 1];
        var firstPos = text.indexOf(firstWord);
        var lastPos = text.indexOf(lastWord, firstPos);
        if (firstPos !== -1 && lastPos !== -1 && lastPos > firstPos) {
            var matchedText = text.substring(firstPos, lastPos + lastWord.length);
            if (matchedText.length <= searchText.length * 2) {
                return { found: true, matchedText: matchedText, position: firstPos };
            }
        }
    }

    if (words.length > 0) {
        var fwPos = text.indexOf(words[0]);
        if (fwPos !== -1) {
            var estimatedEnd = Math.min(fwPos + searchText.length, text.length);
            return { found: true, matchedText: text.substring(fwPos, estimatedEnd), position: fwPos };
        }
    }

    return { found: false, matchedText: '', position: -1 };
}

// ============================================================
// renderScriptWithMarkers
// ============================================================
function renderScriptWithMarkers(stage) {
    var container = document.getElementById('revised-' + stage);
    if (!container) return;

    var stageData = state[stage];
    if (!stageData) return;

    var originalText = stageData.originalScript || '';
    var errors = stageData.allErrors || [];
    var scrollTop = container.scrollTop;

    if (!originalText || originalText.length === 0) {
        container.innerHTML = '<div style="white-space:pre-wrap;padding:15px;font-size:14px;line-height:1.8;color:#888;">대본을 업로드하고 분석을 시작하세요.</div>';
        return;
    }

    if (!errors || errors.length === 0) {
        container.innerHTML = '<div style="white-space:pre-wrap;padding:15px;font-size:14px;line-height:1.8;word-break:break-word;">' + escapeHtml(originalText) + '</div>';
        return;
    }

    var markers = [];
    for (var i = 0; i < errors.length; i++) {
        var err = errors[i];
        if (!err.original || err.original.trim().length === 0) continue;

        var searchText = err.original.trim();
        var position = -1;
        var matchedLength = 0;
        var matchedText = '';

        position = originalText.indexOf(searchText);
        if (position !== -1) {
            matchedLength = searchText.length;
            matchedText = searchText;
        }

        if (position === -1) {
            var normalized = searchText.replace(/\s+/g, ' ').trim();
            if (normalized.length >= 5) {
                var searchRegex = normalized.split(' ').map(function(w) {
                    return w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                }).join('\\s*');
                try {
                    var regex = new RegExp(searchRegex);
                    var match = originalText.match(regex);
                    if (match && match.index !== undefined) {
                        position = match.index;
                        matchedLength = match[0].length;
                        matchedText = match[0];
                    }
                } catch (e) { /* 무시 */ }
            }
        }

        if (position === -1) {
            var words = searchText.split(/\s+/).filter(function(w) { return w.length >= 5; });
            for (var j = 0; j < words.length && position === -1; j++) {
                var wordPos = originalText.indexOf(words[j]);
                if (wordPos !== -1) {
                    position = wordPos;
                    matchedLength = words[j].length;
                    matchedText = words[j];
                }
            }
        }

        if (position !== -1 && matchedLength > 0) {
            markers.push({ error: err, position: position, length: matchedLength, matchedText: matchedText });
            err.matchedOriginal = matchedText;
        }
    }

    if (markers.length === 0) {
        container.innerHTML = '<div style="white-space:pre-wrap;padding:15px;font-size:14px;line-height:1.8;word-break:break-word;">' + escapeHtml(originalText) + '</div>';
        return;
    }

    markers.sort(function(a, b) { return a.position - b.position; });

    var finalMarkers = [];
    var lastEnd = 0;
    for (var i = 0; i < markers.length; i++) {
        if (markers[i].position >= lastEnd) {
            finalMarkers.push(markers[i]);
            lastEnd = markers[i].position + markers[i].length;
        }
    }

    var html = '';
    var pos = 0;
    for (var i = 0; i < finalMarkers.length; i++) {
        var fm = finalMarkers[i];
        var fErr = fm.error;

        if (fm.position > pos) {
            html += escapeHtml(originalText.substring(pos, fm.position));
        }

        var display = (fErr.useRevised && fErr.revised) ? cleanRevisedText(fErr.revised) : fm.matchedText;
        var cls = (fErr.useRevised && fErr.revised) ? 'marker-revised' : 'marker-original';
        var title = escapeHtml((fErr.original || '').substring(0, 50) + ' → ' + (fErr.revised || '').substring(0, 50));

        if (display === '__DELETE__' && fErr.useRevised) {
            html += '<span class="correction-marker" data-marker-id="' + fErr.id + '" data-stage="' + stage + '" title="' + title + '" style="text-decoration:line-through;color:#ff5555;background:#ff555530;padding:2px 4px;border-radius:3px;cursor:pointer;">' + escapeHtml(fm.matchedText) + ' <span style="font-size:10px;color:#ff9800;font-weight:bold;">[삭제]</span></span>';
        } else {
            html += '<span class="correction-marker ' + cls + '" data-marker-id="' + fErr.id + '" data-stage="' + stage + '" title="' + title + '">' + escapeHtml(display) + '</span>';
        }
        pos = fm.position + fm.length;
    }

    if (pos < originalText.length) {
        html += escapeHtml(originalText.substring(pos));
    }

    container.innerHTML = '<div style="white-space:pre-wrap;padding:15px;font-size:14px;line-height:1.8;word-break:break-word;">' + html + '</div>';
    container.scrollTop = scrollTop;

    container.querySelectorAll('.correction-marker').forEach(function(el) {
        el.addEventListener('click', function() {
            var id = this.getAttribute('data-marker-id');
            var st = this.getAttribute('data-stage');
            var idx = findErrorIndexById(st, id);
            if (idx !== -1) {
                setCurrentError(st, idx);
                scrollToTableRow(st, id);
            }
        });
    });
}

// ============================================================
// scrollToMarker
// ============================================================
function scrollToMarker(stage, markerId) {
    var container = document.getElementById('revised-' + stage);
    if (!container) return;

    var marker = container.querySelector('.correction-marker[data-marker-id="' + markerId + '"]');

    if (!marker) {
        container.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }

    marker.scrollIntoView({ behavior: 'smooth', block: 'center' });
    var isRevised = marker.classList.contains('marker-revised');
    marker.classList.add(isRevised ? 'highlight-active' : 'highlight-active-orange');
    setTimeout(function() {
        marker.classList.remove('highlight-active');
        marker.classList.remove('highlight-active-orange');
    }, 1600);
}

// ============================================================
// fixScript
// ============================================================
function fixScript(stage) {
    var s = state[stage];

    // 편집모드에서 이미 저장한 텍스트가 있으면 그대로 사용
    if (s.fixedScript && s.fixedScript.trim().length > 0 && s.isFixed) {
        state.finalScript = s.fixedScript;

        renderScriptWithMarkers(stage);

        var downloadBtn = document.getElementById('btn-download');
        if (downloadBtn) downloadBtn.disabled = false;

        alert('수정본이 적용되었습니다.');
        return;
    }

    var text = s.originalScript;
    var errors = s.allErrors || [];

    errors.forEach(function(err) {
        if (err.useRevised && err.original && err.revised) {
            var fixedRevised = cleanRevisedText(err.revised);
            var searchText = err.original;

            if (text.indexOf(searchText) !== -1) {
                if (fixedRevised === '__DELETE__') {
                    text = text.split(searchText).join('');
                } else {
                    text = text.split(searchText).join(fixedRevised);
                }
            } else {
                var searchWords = searchText.split(/\s+/).filter(function(w) { return w.length > 0; });
                if (searchWords.length >= 2) {
                    var regexStr = searchWords.map(function(w) {
                        return w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    }).join('\\s+');
                    try {
                        var regex = new RegExp(regexStr);
                        var match = text.match(regex);
                        if (match) {
                            if (fixedRevised === '__DELETE__') {
                                text = text.replace(match[0], '');
                            } else {
                                text = text.replace(match[0], fixedRevised);
                            }
                        }
                    } catch (e) { /* 무시 */ }
                }
            }
        }
    });

    text = text.replace(/\n\s*\n\s*\n/g, '\n\n');
    s.fixedScript = text;
    s.isFixed = true;
    state.finalScript = text;

    renderScriptWithMarkers(stage);

    var downloadBtn = document.getElementById('btn-download');
    if (downloadBtn) downloadBtn.disabled = false;

    alert('수정본이 적용되었습니다.');
}

// ============================================================
// Gemini API 호출
// ============================================================

async function callGeminiAPI(prompt, cacheName) {
    var apiKey = localStorage.getItem('GEMINI_API_KEY');
    var validation = validateApiKey(apiKey);
    if (!validation.valid) throw new Error(validation.message);

    currentAbortController = new AbortController();
    var stopBtn = document.getElementById('btn-stop-analysis');
    if (stopBtn) stopBtn.disabled = false;

    var url = API_CONFIG.ENDPOINT + '/' + API_CONFIG.MODEL + ':generateContent?key=' + apiKey;

    var requestBody = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: 0.4,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: API_CONFIG.MAX_OUTPUT_TOKENS
        }
    };

    if (cacheName) requestBody.cachedContent = cacheName;

    var response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: currentAbortController.signal
    });

    if (!response.ok) {
        var errorData = await response.json().catch(function() { return {}; });
        throw new Error('API 오류: ' + (errorData.error?.message || response.statusText));
    }

    var data = await response.json();
    if (stopBtn) stopBtn.disabled = true;
    currentAbortController = null;

    if (data.usageMetadata) {
        var um = data.usageMetadata;
        var cacheInfo = um.cachedContentTokenCount ? ' (캐시: ' + um.cachedContentTokenCount + '토큰)' : '';
        console.log('📊 토큰: 입력=' + (um.promptTokenCount || 0) + ', 출력=' + (um.candidatesTokenCount || 0) + cacheInfo);
    }

    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text;
    }
    throw new Error('API 응답 형식 오류');
}

async function retryWithDelay(fn, maxRetries, delayMs) {
    if (!maxRetries) maxRetries = 3;
    if (!delayMs) delayMs = 2000;
    for (var attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            if (error.name === 'AbortError') throw error;
            var is429 = error.message && (error.message.indexOf('429') > -1 || error.message.indexOf('Resource has been exhausted') > -1);
            if (is429 && attempt < maxRetries) {
                var waitTime = delayMs * attempt;
                console.log('⏳ 429 에러, ' + (waitTime / 1000) + '초 후 재시도 (' + attempt + '/' + maxRetries + ')');
                await new Promise(function(resolve) { setTimeout(resolve, waitTime); });
            } else {
                throw error;
            }
        }
    }
}

// ============================================================
// API 응답 파싱
// ============================================================
function parseApiResponse(responseText) {
    var jsonText = '';
    var jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
        jsonText = jsonMatch[1];
    } else {
        var jsonStart = responseText.indexOf('{');
        var jsonEnd = responseText.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) jsonText = responseText.substring(jsonStart, jsonEnd + 1);
    }

    if (!jsonText) throw new Error('JSON 파싱 실패');

    try {
        return JSON.parse(jsonText);
    } catch (e1) {
        var result = { errors: [], issues: [] };

        var errorsMatch = jsonText.match(/"errors"\s*:\s*\[([\s\S]*?)\]/);
        if (errorsMatch) {
            try { result.errors = JSON.parse('[' + errorsMatch[1] + ']'); } catch (e) {
                result.errors = extractIndividualObjects(errorsMatch[1]);
            }
        }

        var issuesMatch = jsonText.match(/"issues"\s*:\s*\[([\s\S]*?)\]/);
        if (issuesMatch) {
            try { result.issues = JSON.parse('[' + issuesMatch[1] + ']'); } catch (e) {
                result.issues = extractIndividualObjects(issuesMatch[1]);
            }
        }

        if (result.issues.length > 0 && result.errors.length === 0) result.errors = result.issues;

        return result;
    }
}

function extractIndividualObjects(arrayContent) {
    var objects = [];
    var braceDepth = 0;
    var currentObj = '';
    var inString = false;
    var escapeNext = false;

    for (var i = 0; i < arrayContent.length; i++) {
        var ch = arrayContent[i];
        if (escapeNext) { currentObj += ch; escapeNext = false; continue; }
        if (ch === '\\') { currentObj += ch; escapeNext = true; continue; }
        if (ch === '"' && !escapeNext) { inString = !inString; currentObj += ch; continue; }
        if (!inString) {
            if (ch === '{') { if (braceDepth === 0) currentObj = ''; braceDepth++; currentObj += ch; }
            else if (ch === '}') {
                braceDepth--; currentObj += ch;
                if (braceDepth === 0 && currentObj.trim().length > 2) {
                    try { objects.push(JSON.parse(currentObj)); } catch (e) { /* 무시 */ }
                    currentObj = '';
                }
            } else { if (braceDepth > 0) currentObj += ch; }
        } else { currentObj += ch; }
    }
    return objects;
}

// ============================================================
// 청크 분할
// ============================================================
function splitScriptIntoChunks(script, chunkSize) {
    if (!script || script.length === 0) return [];
    if (!chunkSize) chunkSize = 5000;
    if (script.length <= chunkSize) {
        return [{ text: script, startIndex: 0, endIndex: script.length, chunkNum: 1, totalChunks: 1 }];
    }
    var chunks = [];
    var startIndex = 0;
    while (startIndex < script.length) {
        var endIndex = Math.min(startIndex + chunkSize, script.length);
        if (endIndex < script.length) {
            var lastNewline = script.lastIndexOf('\n', endIndex);
            if (lastNewline > startIndex) endIndex = lastNewline + 1;
        }
        chunks.push({ text: script.substring(startIndex, endIndex), startIndex: startIndex, endIndex: endIndex, chunkNum: chunks.length + 1, totalChunks: 0 });
        startIndex = endIndex;
    }
    for (var i = 0; i < chunks.length; i++) chunks[i].totalChunks = chunks.length;
    return chunks;
}

// ============================================================
// 경제 전용 역할 프롬프트 — 5개 항목, 3개 역할
// ============================================================

function buildRolePrompt(roleId, chunkText, chunkInfo, scriptLength) {
    var header = '당신은 이미 캐시에 제공된 전체 경제 대본을 완전히 읽고 이해한 상태입니다.\n' +
        '전체 대본의 내용, 논리 흐름, 수치 데이터를 모두 파악하고 있습니다.\n' +
        '지금부터 전체 대본 중 아래 구간만 집중 분석하세요.\n' +
        '단, 이 구간 밖의 내용과 모순되는 부분도 반드시 검출하세요.\n\n' +
        '전체 대본 ' + scriptLength + '자 중 ' + chunkInfo + '\n\n' +
        '━━ 분석 대상 구간 ━━\n' + chunkText + '\n━━ 구간 끝 ━━\n\n';

    var footer = '\n\n## ⛔ 중요 원칙\n' +
        '- 문장 리라이팅 금지! 원문 수정하지 마세요.\n' +
        '- 어투 변경 금지!\n' +
        '- "오류 감지 + 제안 출력" 방식만 사용하세요.\n' +
        '- revised에는 수정안 하나만 작성하세요 (/ 또는 () 금지).\n' +
        '- original은 원문에서 문제가 되는 최소 범위만 발췌하세요.\n' +
        '- 확실한 오류만 보고하세요. 추측/의심 수준은 보고하지 마세요.\n\n' +
        '## 📤 응답 형식 (반드시 JSON만):\n' +
        '```json\n{"errors": [\n  {"type": "유형", "original": "원문 그대로", "revised": "수정 제안", "reason": "사유 20자 이내", "severity": "high/medium/low"}\n]}\n```';

    var officialSourceList = getOfficialSourceNamesString();

    var dataValidationGuide = '\n\n## 📋 공식 데이터 검증 기준 (대본 생성 엔진과 동일)\n' +
        '### 허용 공식 기관 목록:\n' + officialSourceList + '\n\n' +
        '### 수치 작성 필수 원칙:\n' +
        '1. 모든 경제 수치에는 반드시 시점(연도/월/분기)이 명시되어야 합니다\n' +
        '2. 전년 대비 / 전월 대비 / 전기 대비 구분이 명확해야 합니다\n' +
        '3. 정책 발표 시점과 시행 시점을 구분해야 합니다\n' +
        '4. 중앙은행 결정(확정)과 시장 전망(예측)을 혼동하면 안 됩니다\n' +
        '5. 예측/전망 데이터와 확정/발표 데이터를 구분해야 합니다\n' +
        '6. 위 허용 기관 외 출처의 수치는 출처 명시가 반드시 필요합니다\n';

    var rulesString = getEconomyRulesString();

    // ============================================================
    // role1: 수치·단위 오류 + 숫자 불일치 + 공식 데이터 검증
    // ============================================================
    if (roleId === 'role1_numbers') {
        return header +
            '## 🎯 당신의 역할: 수치·단위·데이터 검증관\n\n' +
            dataValidationGuide + '\n' +

            '### 검사항목 1: 수치·단위 오류 (분석 강도: 100%)\n' +
            '경제 대본에서 숫자, 단위, 연도 등이 정확한지 검사합니다.\n' +
            '- 금리/환율/물가 등 숫자가 앞뒤에서 다르게 언급된 경우\n' +
            '- 단위 오류 (%, 원, 달러, 조, 억 등 혼동)\n' +
            '- 연도/시점 불일치 (2023년이라 했다가 2024년으로 바뀌는 등)\n' +
            '- 계산 오류 (더하기/비율 등이 맞지 않는 경우)\n' +
            '- 앞에서 말한 수치와 뒤에서 말한 수치가 다른 경우\n\n' +
            'type은 "수치단위"로 표기하세요.\n\n' +

            '### 검사항목 2: 숫자 불일치 (분석 강도: 100%)\n' +
            '같은 대상에 대한 숫자가 앞뒤에서 일치하는지 검사합니다.\n' +
            '⚠️ 서로 다른 시점/대상의 숫자는 비교하지 마세요.\n' +
            'type은 "숫자불일치"로 표기하세요.\n\n' +

            '### 검사항목 3: 공식 데이터 기준 검증 (분석 강도: 100%)\n' +
            '아래 항목을 반드시 검사하세요:\n' +
            '- 경제 수치(금리, GDP, CPI, 실업률 등)에 시점(연도/월)이 빠져 있는 경우 → 오류\n' +
            '- "상승/하락/증가/감소" 표현에 비교 기준(전년 대비/전월 대비)이 없는 경우 → 오류\n' +
            '- 정책 발표일과 시행일이 혼동된 경우 → 오류\n' +
            '- 중앙은행 확정 결정을 "전망/예상"으로 표현하거나, 시장 전망을 "결정/확정"으로 표현한 경우 → 오류\n' +
            '- 실제로 존재하지 않을 가능성이 높은 FOMC/금통위 회의 날짜가 언급된 경우 → 오류\n' +
            '- 허용 공식 기관 외 출처에서 가져온 수치인데 출처가 명시되지 않은 경우 → 오류\n\n' +
            'type은 "데이터검증"으로 표기하세요.\n' +
            footer;
    }

    // ============================================================
    // role2: 인과관계 논리 + 과장·단정 + 공포 조장
    // ============================================================
    if (roleId === 'role2_logic') {
        return header +
            '## 🎯 당신의 역할: 논리·표현 검증관\n\n' +
            dataValidationGuide + '\n' +

            '### 검사항목 1: 인과관계 논리 검증 (분석 강도: 90%)\n' +
            '경제 논리가 타당한지 검사합니다.\n' +
            '- 단정 표현: "A이므로 반드시 B이다" (조건 생략)\n' +
            '- 조건 생략: 중요한 전제 조건이 빠진 논리\n' +
            '- 인과 비약: A와 B 사이에 논리적 연결이 부족한 경우\n' +
            '- 상관관계를 인과관계로 오인한 표현\n\n' +
            '⚠️ 90% 강도: 약간 느슨한 논리는 보고하지 마세요. 명확한 논리 오류만 보고.\n' +
            'type은 "인과논리"로 표기하세요.\n\n' +

            '### 검사항목 2: 과장·단정 표현 감지 (분석 강도: 100%)\n' +
            '아래 단어/표현이 대본에 있으면 검출하세요:\n' +
            '반드시, 무조건, 100%, 확정, 절대, 틀림없이, 분명히, 당연히, 장담\n' +
            'type은 "과장단정"으로 표기하세요.\n\n' +

            '### 검사항목 3: 공포 조장 표현 감지 (분석 강도: 100%)\n' +
            '아래 단어/표현이 대본에 있으면 검출하세요:\n' +
            '폭락, 대폭락, 붕괴, 파산, 휴지조각, 버블, 패닉, 지옥, 나락\n' +
            '맥락상 정당한 사용이면 보고하지 마세요. 과도한 공포 유발만 보고.\n' +
            'type은 "공포조장"으로 표기하세요.\n' +
            footer;
    }

    // ============================================================
    // role3: 투자 리스크 표현 + 출처·근거 누락 + 허용 기관 검증
    // ============================================================
    if (roleId === 'role3_risk') {
        return header +
            '## 🎯 당신의 역할: 투자 리스크·출처 검증관\n\n' +
            dataValidationGuide + '\n' +

            '### 검사항목 1: 투자 리스크 표현 감지 (분석 강도: 100%)\n' +
            '아래와 같은 투자 유도/권유 표현을 검출하세요:\n' +
            '- 특정 종목/자산 매수/매도 유도: "지금 사야", "매수 추천"\n' +
            '- 수익 보장 표현: "수익 보장", "확실한 수익", "원금 보장"\n' +
            '- FOMO 유발: "놓치면 후회", "마지막 기회", "지금 아니면"\n' +
            '- 과도한 집중 투자 유도: "몰빵", "올인"\n' +
            '- 과도한 수익 기대: "대박"\n\n' +
            'type은 "투자유도"로 표기하세요.\n\n' +

            '### 검사항목 2: 출처·근거 누락 확인 (분석 강도: 100%)\n' +
            '아래와 같은 출처 불명확 표현을 검출하세요:\n' +
            '- "전문가들은 말한다" → 어떤 전문가? 이름/소속 필요\n' +
            '- "통계에 따르면" → 어떤 통계? 기관명/시점 필요\n' +
            '- "연구 결과" → 어떤 연구? 기관/논문 필요\n' +
            '- "관계자는" → 소속/직함 필요\n' +
            '- 구체적 수치가 인용되었는데 출처 기관명이 없는 경우\n\n' +
            '### 검사항목 3: 허용 기관 외 출처 검증 (분석 강도: 100%)\n' +
            '아래 공식 기관 목록에 없는 출처에서 가져온 경제 수치가\n' +
            '출처 없이 사용된 경우 오류로 판정하세요:\n' +
            '허용 기관: ' + officialSourceList + '\n\n' +
            '위 기관이 아닌 곳의 수치라도 출처를 명확히 밝혔으면 허용합니다.\n' +
            '출처 없이 수치만 나열된 경우에만 오류로 보고하세요.\n\n' +
            'type은 "출처누락"으로 표기하세요.\n' +
            footer;
    }

    return header + '이 구간에서 경제 대본 오류를 찾아주세요.' + footer;
}

// ============================================================
// 매트릭스 분석 (역할 × 청크 동시 실행)
// ============================================================
async function runMatrixAnalysis(script, roles, cacheName, chunkSize, progressStart, progressEnd, stageLabel) {
    if (!chunkSize) chunkSize = 6500;
    if (!progressStart) progressStart = 10;
    if (!progressEnd) progressEnd = 85;
    if (!stageLabel) stageLabel = '분석';

    var chunks = splitScriptIntoChunks(script, chunkSize);
    var totalCalls = roles.length * chunks.length;

    console.log('📦 매트릭스 분석: ' + roles.length + '역할 × ' + chunks.length + '청크 = ' + totalCalls + '호출');

    var allPromises = [];
    var promiseMeta = [];

    for (var r = 0; r < roles.length; r++) {
        for (var c = 0; c < chunks.length; c++) {
            var chunk = chunks[c];
            var chunkInfo = chunk.startIndex + '~' + chunk.endIndex + '자 (' + (c + 1) + '/' + chunks.length + ')';
            var prompt = buildRolePrompt(roles[r].id, chunk.text, chunkInfo, script.length);

            (function(roleIdx, chunkIdx, roleId, roleName, chunkTextRef, promptRef, cacheNameRef) {
                allPromises.push(
                    retryWithDelay(function() { return callGeminiAPI(promptRef, cacheNameRef); }, 3, 3000)
                );
                promiseMeta.push({ roleIdx: roleIdx, chunkIdx: chunkIdx, roleId: roleId, roleName: roleName, chunkText: chunkTextRef });
            })(r, c, roles[r].id, roles[r].name, chunk.text, prompt, cacheName);
        }
    }

    updateProgress(progressStart + 5, stageLabel + ' 중... (' + totalCalls + '개 동시 호출)');

    var results = await Promise.allSettled(allPromises);

    var allErrors = [];
    var successCount = 0;

    for (var i = 0; i < results.length; i++) {
        var meta = promiseMeta[i];
        var progressPercent = progressStart + Math.round(((i + 1) / results.length) * (progressEnd - progressStart));
        updateProgress(progressPercent, stageLabel + ' 결과 처리 중... (' + (i + 1) + '/' + results.length + ')');

        if (results[i].status === 'fulfilled') {
            successCount++;
            try {
                var parsed = parseApiResponse(results[i].value);
                var errors = parsed.errors || parsed.issues || [];
                for (var e = 0; e < errors.length; e++) {
                    errors[e]._role = meta.roleId;
                    errors[e]._chunkNum = meta.chunkIdx + 1;
                    allErrors.push(errors[e]);
                }
                console.log('   ✅ ' + meta.roleName + ' 청크' + (meta.chunkIdx + 1) + ': ' + errors.length + '개 오류');
            } catch (parseError) {
                console.error('   ⚠️ ' + meta.roleName + ' 청크' + (meta.chunkIdx + 1) + ' 파싱 실패');
            }
        } else {
            console.error('   ❌ ' + meta.roleName + ' 청크' + (meta.chunkIdx + 1) + ' 실패');
        }
    }

    // 중복 제거
    var seen = {};
    var merged = [];
    for (var i = 0; i < allErrors.length; i++) {
        var err = allErrors[i];
        if (!err || !err.original) continue;
        var key = (err.original || '').trim().substring(0, 50);
        if (!seen[key]) { seen[key] = true; merged.push(err); }
    }

    console.log('📊 매트릭스 완료: 성공 ' + successCount + '/' + totalCalls + ', 오류 ' + allErrors.length + ' → 중복 제거 후 ' + merged.length);
    return { errors: merged };
}

// ============================================================
// 1차 분석 실행 (경제 전용: 5개 항목, 3개 역할)
// ============================================================
async function startStage1Analysis() {
    var script = document.getElementById('original-script').value.trim();
    if (!script) { alert('분석할 대본을 입력해주세요.'); return; }
    var apiKey = localStorage.getItem('GEMINI_API_KEY');
    if (!apiKey) { alert('API 키를 먼저 설정해주세요.'); return; }

    showProgress('경제 분석 시작...');
    updateProgress(2, '준비 중...');

    try {
        state.stage1.originalScript = script;
        state.stage1.isFixed = false;
        state.stage1.currentErrorIndex = -1;

        // 캐시 생성
        updateProgress(3, '📦 전체 대본 캐시 생성 중...');

        var systemPrompt = '당신은 경제/금융 대본 전문 검수자입니다. ' +
            '사용자가 제공한 전체 경제 대본을 완전히 이해한 상태에서, ' +
            '요청받은 역할에 따라 집중 분석합니다. ' +
            '전체 대본의 수치, 논리, 출처를 모두 파악하고 있어야 합니다. ' +
            '문장 리라이팅은 절대 하지 마세요. 오류 감지와 제안만 하세요. ' +
            '확실한 오류만 보고하세요. 추측이나 의심 수준은 보고하지 마세요.';

        var cacheName = await createScriptCache(script, systemPrompt, 1800);
        state._cacheName = cacheName;

        if (!cacheName) {
            console.log('⚠️ 캐시 생성 실패');
            alert('캐시 생성에 실패했습니다. 다시 시도해주세요.');
            hideProgress();
            return;
        }

        console.log('✅ 캐시 생성 성공: ' + cacheName);
        startCacheTimer(cacheName, 1800);

        // 매트릭스 분석 (3개 역할 × N개 청크)
        updateProgress(8, '🔍 경제 매트릭스 병렬 분석 시작...');

        var roles = [
            { id: 'role1_numbers', name: '수치단위+숫자불일치' },
            { id: 'role2_logic', name: '인과논리+과장단정+공포조장' },
            { id: 'role3_risk', name: '투자리스크+출처누락' }
        ];

        var matrixResult = await runMatrixAnalysis(script, roles, cacheName, 6500, 10, 85, '경제 분석');
        var mergedErrors = matrixResult.errors;

        console.log('🔍 경제 분석 완료: 총 ' + mergedErrors.length + '개 오류');

        // 결과 저장
        updateProgress(87, '결과 저장 중...');

        state.stage1.allErrors = mergedErrors.map(function(err, idx) {
            return {
                id: 'error-' + idx,
                type: err.type || '기타',
                original: err.original || '',
                revised: err.revised || err.suggestion || '',
                reason: err.reason || '',
                severity: err.severity || 'medium',
                useRevised: true
            };
        });

        updateProgress(90, '결과 표시 중...');
        displayStage1Results();

        // 캐시 정리
        if (state._cacheName) {
            deleteScriptCache(state._cacheName);
            state._cacheName = null;
        }

        updateProgress(100, '경제 분석 완료!');
        setTimeout(hideProgress, 1000);

    } catch (error) {
        if (state._cacheName) { deleteScriptCache(state._cacheName); state._cacheName = null; }
        if (error.name !== 'AbortError') alert('분석 중 오류가 발생했습니다: ' + error.message);
        hideProgress();
    }
}

// ============================================================
// 분석 결과 표시
// ============================================================
function displayStage1Results() {
    var container = document.getElementById('analysis-stage1');
    if (!container) return;
    var errors = state.stage1.allErrors;

    if (!errors || errors.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:30px;color:#69f0ae;font-size:18px;">✅ 오류가 발견되지 않았습니다.</div>';
    } else {
        var html = '<table class="analysis-table"><thead><tr><th>유형</th><th>원문</th><th>제안</th><th>사유</th></tr></thead><tbody>';
        errors.forEach(function(err) {
            var severityColor = err.severity === 'high' ? '#ff5555' : (err.severity === 'medium' ? '#ffaa00' : '#69f0ae');
            html += '<tr data-marker-id="' + err.id + '" style="cursor:pointer;">' +
                '<td class="type-cell" style="color:' + severityColor + ';font-weight:bold;">' + formatTypeText(err.type) + '</td>' +
                '<td style="color:#ff9800;font-size:11px;">' + escapeHtml(err.original) + '</td>' +
                '<td style="color:#69f0ae;font-size:11px;">' + escapeHtml(err.revised) + '</td>' +
                '<td style="color:#aaa;font-size:11px;">' + escapeHtml(err.reason) + '</td></tr>';
        });
        html += '</tbody></table>';
        container.innerHTML = html;

        container.querySelectorAll('tr[data-marker-id]').forEach(function(row) {
            row.addEventListener('click', function() {
                var markerId = this.getAttribute('data-marker-id');
                var errorIndex = findErrorIndexById('stage1', markerId);
                if (errorIndex >= 0) setCurrentError('stage1', errorIndex);
            });
        });
    }

    renderScriptWithMarkers('stage1');

    // 버튼 활성화
    var hasErrors = errors && errors.length > 0;
    var btnBefore = document.getElementById('btn-revert-before-stage1');
    var btnAfter = document.getElementById('btn-revert-after-stage1');
    var btnFix = document.getElementById('btn-fix-script-stage1');
    if (btnBefore) btnBefore.disabled = !hasErrors;
    if (btnAfter) btnAfter.disabled = !hasErrors;
    if (btnFix) btnFix.disabled = false;
}

// ============================================================
// 편집모드 시스템
// ============================================================

var editModeState = {
    isEditMode: false,
    backupText: ''
};

function initEditMode() {
    var checkbox = document.getElementById('edit-mode-checkbox');
    if (!checkbox) return;

    checkbox.addEventListener('change', function() {
        if (this.checked) {
            enterEditMode();
        } else {
            exitEditMode();
        }
    });

    var textarea = document.getElementById('edit-textarea-stage1');
    if (textarea) {
        textarea.addEventListener('input', function() {
            var countEl = document.getElementById('edit-char-num');
            if (countEl) countEl.textContent = textarea.value.length;
        });
    }
}

function enterEditMode() {
    editModeState.isEditMode = true;

    var currentText = '';
    if (state.stage1.fixedScript && state.stage1.fixedScript.trim().length > 0) {
        currentText = state.stage1.fixedScript;
    } else if (state.stage1.originalScript && state.stage1.originalScript.trim().length > 0) {
        currentText = getCurrentRevisedText();
    }

    editModeState.backupText = currentText;

    var textarea = document.getElementById('edit-textarea-stage1');
    if (textarea) {
        textarea.value = currentText;
    }

    var countEl = document.getElementById('edit-char-num');
    if (countEl) countEl.textContent = currentText.length;

    var revisedDiv = document.getElementById('revised-stage1');
    var editDiv = document.getElementById('edit-stage1');
    var charCount = document.getElementById('edit-char-count');
    if (revisedDiv) revisedDiv.style.display = 'none';
    if (editDiv) editDiv.style.display = 'block';
    if (charCount) charCount.style.display = 'block';

    var label = document.getElementById('edit-mode-label');
    if (label) { label.textContent = '편집모드'; label.style.color = '#4CAF50'; }

    updateEditModeButtons(true);
}

function exitEditMode() {
    editModeState.isEditMode = false;

    var revisedDiv = document.getElementById('revised-stage1');
    var editDiv = document.getElementById('edit-stage1');
    var charCount = document.getElementById('edit-char-count');
    if (revisedDiv) revisedDiv.style.display = 'block';
    if (editDiv) editDiv.style.display = 'none';
    if (charCount) charCount.style.display = 'none';

    var label = document.getElementById('edit-mode-label');
    if (label) { label.textContent = '보기모드'; label.style.color = '#aaa'; }

    if (state.stage1.fixedScript && state.stage1.fixedScript.trim().length > 0 && revisedDiv) {
        revisedDiv.innerHTML = '<div style="white-space:pre-wrap;padding:15px;font-size:14px;line-height:1.8;word-break:break-word;">' + escapeHtml(state.stage1.fixedScript) + '</div>';
    }

    updateEditModeButtons(false);
}

function getCurrentRevisedText() {
    var text = state.stage1.originalScript || '';
    var errors = state.stage1.allErrors || [];

    errors.forEach(function(err) {
        if (err.useRevised && err.original && err.revised) {
            var fixedRevised = cleanRevisedText(err.revised);
            if (text.indexOf(err.original) !== -1) {
                if (fixedRevised === '__DELETE__') {
                    text = text.split(err.original).join('');
                } else {
                    text = text.split(err.original).join(fixedRevised);
                }
            }
        }
    });

    return text;
}

function saveEditedText() {
    var textarea = document.getElementById('edit-textarea-stage1');
    if (!textarea) return;

    var editedText = textarea.value;
    if (!editedText || editedText.trim().length === 0) {
        alert('저장할 내용이 없습니다.');
        return;
    }

    state.stage1.fixedScript = editedText;
    state.stage1.isFixed = true;
    state.finalScript = editedText;

    var revisedDiv = document.getElementById('revised-stage1');
    if (revisedDiv) {
        revisedDiv.innerHTML = '<div style="white-space:pre-wrap;padding:15px;font-size:14px;line-height:1.8;word-break:break-word;">' + escapeHtml(editedText) + '</div>';
    }

    var downloadBtn = document.getElementById('btn-download');
    if (downloadBtn) downloadBtn.disabled = false;

    alert('저장되었습니다.');
}

function revertEditedText() {
    if (!editModeState.backupText) {
        alert('되돌릴 내용이 없습니다.');
        return;
    }

    if (!confirm('편집 전 상태로 되돌리시겠습니까?')) return;

    var textarea = document.getElementById('edit-textarea-stage1');
    if (textarea) {
        textarea.value = editModeState.backupText;
        var countEl = document.getElementById('edit-char-num');
        if (countEl) countEl.textContent = editModeState.backupText.length;
    }
}

function updateEditModeButtons(isEdit) {
    var wrapper = document.querySelector('.revert-btn-wrapper');
    if (!wrapper) return;

    var btnBefore = document.getElementById('btn-revert-before-stage1');
    var btnAfter = document.getElementById('btn-revert-after-stage1');
    var btnFix = document.getElementById('btn-fix-script-stage1');

    var existingSave = document.getElementById('btn-edit-save');
    var existingRevert = document.getElementById('btn-edit-revert');
    if (existingSave) existingSave.remove();
    if (existingRevert) existingRevert.remove();

    if (isEdit) {
        if (btnBefore) btnBefore.style.display = 'none';
        if (btnAfter) btnAfter.style.display = 'none';

        var btnSave = document.createElement('button');
        btnSave.id = 'btn-edit-save';
        btnSave.innerHTML = '💾 저장';
        btnSave.style.cssText = 'background:#4CAF50;color:white;border:none;padding:8px 16px;border-radius:5px;cursor:pointer;font-weight:bold;font-size:13px;';
        btnSave.addEventListener('click', saveEditedText);

        var btnRevert = document.createElement('button');
        btnRevert.id = 'btn-edit-revert';
        btnRevert.innerHTML = '↩️ 되돌리기';
        btnRevert.style.cssText = 'background:#ff9800;color:white;border:none;padding:8px 16px;border-radius:5px;cursor:pointer;font-weight:bold;font-size:13px;';
        btnRevert.addEventListener('click', revertEditedText);

        if (btnFix) {
            wrapper.insertBefore(btnRevert, btnFix);
            wrapper.insertBefore(btnSave, btnRevert);
        }
    } else {
        if (btnBefore) btnBefore.style.display = '';
        if (btnAfter) btnAfter.style.display = '';
    }
}

// ============================================================
// 전체보기 모달 편집모드
// ============================================================

var fullviewEditState = {
    isEditMode: false,
    backupText: ''
};

function addFullViewEditToggle() {
    var rightHeader = document.getElementById('fullview-right-header');
    if (!rightHeader || rightHeader.querySelector('.fullview-edit-toggle')) return;

    var toggleHtml = document.createElement('span');
    toggleHtml.className = 'fullview-edit-toggle';
    toggleHtml.style.cssText = 'margin-left:15px;display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:normal;';
    toggleHtml.innerHTML =
        '<span id="fullview-edit-label" style="color:#aaa;">보기</span>' +
        '<label class="edit-toggle-switch">' +
        '<input type="checkbox" id="fullview-edit-checkbox">' +
        '<span class="edit-toggle-slider"></span>' +
        '</label>';
    rightHeader.appendChild(toggleHtml);

    var cb = document.getElementById('fullview-edit-checkbox');
    if (cb) {
        cb.addEventListener('change', function() {
            if (this.checked) {
                enterFullViewEditMode();
            } else {
                exitFullViewEditMode();
            }
        });
    }
}

function enterFullViewEditMode() {
    fullviewEditState.isEditMode = true;

    var rightBody = document.getElementById('fullview-right-body');
    if (!rightBody) return;

    var currentText = '';
    if (state.stage1.fixedScript && state.stage1.fixedScript.trim().length > 0) {
        currentText = state.stage1.fixedScript;
    } else {
        currentText = getCurrentRevisedText();
    }

    fullviewEditState.backupText = currentText;

    rightBody.innerHTML = '<textarea id="fullview-edit-textarea" style="width:100%;height:100%;padding:15px;font-size:17px;line-height:1.8;border:none;resize:none;font-family:inherit;background:#2d2d2d;color:#fff;word-break:break-word;outline:none;">' + escapeHtml(currentText) + '</textarea>';

    var label = document.getElementById('fullview-edit-label');
    if (label) { label.textContent = '편집'; label.style.color = '#4CAF50'; }

    updateFullViewEditButtons(true);
}

function exitFullViewEditMode() {
    fullviewEditState.isEditMode = false;

    var rightBody = document.getElementById('fullview-right-body');
    if (rightBody) {
        if (state.stage1.fixedScript && state.stage1.fixedScript.trim().length > 0) {
            rightBody.innerHTML = '<div style="white-space:pre-wrap;padding:15px;font-size:14px;line-height:1.8;word-break:break-word;">' + escapeHtml(state.stage1.fixedScript) + '</div>';
        } else {
            var revisedBox = document.getElementById('revised-stage1');
            if (revisedBox) {
                rightBody.innerHTML = revisedBox.innerHTML;
            }
        }
    }

    var label = document.getElementById('fullview-edit-label');
    if (label) { label.textContent = '보기'; label.style.color = '#aaa'; }

    updateFullViewEditButtons(false);
}

function saveFullViewEditedText() {
    var textarea = document.getElementById('fullview-edit-textarea');
    if (!textarea) return;

    var editedText = textarea.value;
    if (!editedText || editedText.trim().length === 0) {
        alert('저장할 내용이 없습니다.');
        return;
    }

    state.stage1.fixedScript = editedText;
    state.stage1.isFixed = true;
    state.finalScript = editedText;

    var revisedDiv = document.getElementById('revised-stage1');
    if (revisedDiv) {
        revisedDiv.innerHTML = '<div style="white-space:pre-wrap;padding:15px;font-size:14px;line-height:1.8;word-break:break-word;">' + escapeHtml(editedText) + '</div>';
    }

    var mainTextarea = document.getElementById('edit-textarea-stage1');
    if (mainTextarea) mainTextarea.value = editedText;

    var downloadBtn = document.getElementById('btn-download');
    if (downloadBtn) downloadBtn.disabled = false;

    alert('저장되었습니다.');
}

function revertFullViewEditedText() {
    if (!fullviewEditState.backupText) {
        alert('되돌릴 내용이 없습니다.');
        return;
    }

    if (!confirm('편집 전 상태로 되돌리시겠습니까?')) return;

    var textarea = document.getElementById('fullview-edit-textarea');
    if (textarea) {
        textarea.value = fullviewEditState.backupText;
    }
}

function updateFullViewEditButtons(isEdit) {
    var footer = document.getElementById('fullview-footer');
    if (!footer) return;

    var existingSave = document.getElementById('fullview-btn-save');
    var existingRevert = document.getElementById('fullview-btn-revert');
    if (existingSave) existingSave.remove();
    if (existingRevert) existingRevert.remove();

    var buttons = footer.querySelectorAll('button');

    if (isEdit) {
        buttons.forEach(function(btn, i) {
            if (i < 2) btn.style.display = 'none';
        });

        var btnSave = document.createElement('button');
        btnSave.id = 'fullview-btn-save';
        btnSave.innerHTML = '💾 저장';
        btnSave.style.cssText = 'background:#4CAF50;color:white;border:none;padding:8px 16px;border-radius:5px;cursor:pointer;font-weight:bold;font-size:13px;';
        btnSave.addEventListener('click', saveFullViewEditedText);

        var btnRevert = document.createElement('button');
        btnRevert.id = 'fullview-btn-revert';
        btnRevert.innerHTML = '↩️ 되돌리기';
        btnRevert.style.cssText = 'background:#ff9800;color:white;border:none;padding:8px 16px;border-radius:5px;cursor:pointer;font-weight:bold;font-size:13px;';
        btnRevert.addEventListener('click', revertFullViewEditedText);

        footer.insertBefore(btnSave, footer.firstChild);
        footer.insertBefore(btnRevert, btnSave.nextSibling);
    } else {
        buttons.forEach(function(btn) {
            btn.style.display = '';
        });
    }
}

// ============================================================
// 초기화 — DOMContentLoaded에 편집모드 초기화 추가
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    initEditMode();
});
