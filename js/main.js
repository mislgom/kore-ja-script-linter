/** ======================================================
 * KORE-JA SCRIPT LINTER - MAIN.JS
 * 4-Panel Layout System v2.2
 * Features: Separate Result Panels, TSV Table, Diff Highlight
 * ====================================================== */

window.__MAIN_JS_LOADED__ = true;

/* ======================================================
   GLOBAL STATE
====================================================== */
var tabStates = {
    stage1: {
        status: 'idle',
        progress: 0,
        resultText: null,
        revisedScript: null,
        originalScript: null,
        errorMessage: null
    },
    stage2: {
        status: 'idle',
        progress: 0,
        resultText: null,
        revisedScript: null,
        originalScript: null,
        errorMessage: null
    }
};

console.log('[BOOT] main.js loaded - v2.2 (4-Panel Layout)');

/* ======================================================
   ERROR HANDLING
====================================================== */
window.addEventListener('error', function (e) {
    console.warn('[RUNTIME WARN] JS 오류:', e.message);
});

window.addEventListener('unhandledrejection', function (e) {
    console.warn('[RUNTIME WARN] Promise Rejection:', e.reason);
});

/* ======================================================
   NOTIFICATION
====================================================== */
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
    notification.className = 'fixed top-4 right-4 ' + color + ' text-white px-4 py-2 rounded-lg shadow-lg z-50 max-w-sm text-sm transition-opacity duration-300';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(function () {
        notification.style.opacity = '0';
        setTimeout(function () {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

/* ======================================================
   FILE UPLOAD & DRAG DROP
====================================================== */
function initFileUpload() {
    var dropZone = document.getElementById('drop-zone');
    var dropOverlay = document.getElementById('drop-overlay');
    var fileInput = document.getElementById('file-upload-input');
    var uploadBtn = document.getElementById('btn-upload-file');
    var textarea = document.getElementById('korea-senior-script');
    var charCounter = document.getElementById('korea-char-counter');

    if (!dropZone || !textarea) return;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(function (eventName) {
        dropZone.addEventListener(eventName, function (e) {
            e.preventDefault();
            e.stopPropagation();
        }, false);
    });

    dropZone.addEventListener('dragenter', function () {
        if (dropOverlay) dropOverlay.classList.remove('hidden');
    });

    dropZone.addEventListener('dragleave', function (e) {
        if (e.relatedTarget && !dropZone.contains(e.relatedTarget)) {
            if (dropOverlay) dropOverlay.classList.add('hidden');
        }
    });

    dropZone.addEventListener('drop', function (e) {
        if (dropOverlay) dropOverlay.classList.add('hidden');
        handleFiles(e.dataTransfer.files);
    });

    if (uploadBtn && fileInput) {
        uploadBtn.addEventListener('click', function () {
            fileInput.click();
        });
        fileInput.addEventListener('change', function () {
            handleFiles(this.files);
            this.value = '';
        });
    }

    function handleFiles(files) {
        if (!files || files.length === 0) return;
        var file = files[0];
        if (!file.name.endsWith('.txt')) {
            showNotification('TXT 파일만 업로드 가능합니다.', 'error');
            return;
        }
        var reader = new FileReader();
        reader.onload = function (e) {
            textarea.value = e.target.result;
            updateCharCounter();
            showNotification('파일 로드 완료: ' + file.name, 'success');
        };
        reader.readAsText(file, 'UTF-8');
    }
}

function updateCharCounter() {
    var textarea = document.getElementById('korea-senior-script');
    var counter = document.getElementById('korea-char-counter');
    if (textarea && counter) {
        counter.textContent = textarea.value.length.toLocaleString() + '자 / 무제한';
    }
}

/* ======================================================
   PROMPT GENERATION (TSV 형식)
====================================================== */
function generatePrompt(stage, script) {
    if (stage === 'stage1') {
        return `당신은 한국 시니어 낭독용 대본 1차 검수 전문가입니다.

[필수 검수 항목]
1) 국가 배경 - 한국 배경에 타국 요소 혼입 여부
2) 시대 배경 - 시대에 맞지 않는 표현
3) 인물 설정 일관성 - 이름/나이/외형/성격/말투
4) 인물 관계 일관성 - 호칭/관계

[중요] analysis 출력 형식
analysis 값은 반드시 아래 TSV(탭 구분) 형식으로만 작성하세요.
첫 줄은 헤더, 둘째 줄부터 데이터입니다.
각 열은 탭(\\t)으로 구분합니다.

TSV 형식 예시 (오류 발견 시):
번호	유형	위치(대략)	변경 내용 요약	검수 포인트
1	시간 왜곡	도입부	겨울 폭설 → 초가을 새벽 → 한낮 혼용	시간 연속성
2	장소 왜곡	헛간 이후	헛간 → 관아 대청 즉시 이동	공간 전환 누락
3	인물 설정 변경	윤혜린 설명부	과부 → 30년차 아전	캐릭터 일관성
4	쌩뚱 상황	궤짝 탈취 직후	비극 장면에 축제 반응	톤맥락 붕괴
5	대화 붕괴	나그네 대화	숙박 요청 → 쌀값 화제	대사 논리
6	쌩뚱 인물	중반부	윤철수翁 등장	인물 관리

TSV 형식 예시 (검수 통과 시):
번호	유형	위치(대략)	변경 내용 요약	검수 포인트
1	통과	-	검수 통과	-

[출력 형식 - 반드시 JSON만 출력]
{"analysis":"번호\\t유형\\t위치(대략)\\t변경 내용 요약\\t검수 포인트\\n1\\t...","revised":"수정된 대본 전체"}

주의: analysis 안에 줄바꿈은 \\n으로, 탭은 \\t로 작성하세요.
JSON 외의 텍스트는 절대 출력하지 마세요.

[대본]
${script}`;
    } else {
        return `당신은 한국 시니어 낭독용 대본 2차 심화 검수 전문가입니다.
입력 대본은 1차 수정이 완료된 상태입니다.

[필수 검수 항목]
1) 장소 왜곡 - 같은 장면에서 장소가 갑자기 바뀌는지
2) 시간 왜곡 - 오전/오후/계절/날짜 흐름이 맞는지
3) 인물 설정 변경 - 성격/직업/관계/나이가 갑자기 변하는지
4) 쌩뚱맞는 상황 - 복선 없이 사건이 튀어나오는지
5) 대화 흐름 붕괴 - 질문-답이 맞지 않는지
6) 쌩뚱 인물 등장 - 소개 없이 새 인물이 등장하는지

[중요] analysis 출력 형식
analysis 값은 반드시 아래 TSV(탭 구분) 형식으로만 작성하세요.
첫 줄은 헤더, 둘째 줄부터 데이터입니다.
각 열은 탭(\\t)으로 구분합니다.

TSV 형식 예시 (오류 발견 시):
번호	유형	위치(대략)	변경 내용 요약	검수 포인트
1	시간 왜곡	도입부	겨울 폭설 → 초가을 새벽 → 한낮 혼용	시간 연속성
2	장소 왜곡	헛간 이후	헛간 → 관아 대청 즉시 이동	공간 전환 누락
3	인물 설정 변경	윤혜린 설명부	과부 → 30년차 아전	캐릭터 일관성
4	쌩뚱 상황	궤짝 탈취 직후	비극 장면에 축제 반응	톤맥락 붕괴
5	대화 붕괴	나그네 대화	숙박 요청 → 쌀값 화제	대사 논리
6	쌩뚱 인물	중반부	윤철수翁 등장	인물 관리

TSV 형식 예시 (검수 통과 시):
번호	유형	위치(대략)	변경 내용 요약	검수 포인트
1	통과	-	검수 통과	-

[출력 규칙]
- 오류 없음: {"analysis":"번호\\t유형\\t...\\n1\\t통과\\t...","revised":"최종 대본 전체"}
- 오류 발견: {"analysis":"번호\\t유형\\t...\\n1\\t시간 왜곡\\t...","revised":""}

주의: analysis 안에 줄바꿈은 \\n으로, 탭은 \\t로 작성하세요.
JSON 외의 텍스트는 절대 출력하지 마세요.

[대본]
${script}`;
    }
}

/* ======================================================
   ANALYSIS EXECUTION
====================================================== */
function runAnalysis(stage) {
    var tab = tabStates[stage];

    if (tab.status === 'running') {
        showNotification('분석이 이미 실행 중입니다.', 'warning');
        return;
    }

    // 입력 스크립트 결정
    var scriptToAnalyze = null;
    if (stage === 'stage1') {
        var textarea = document.getElementById('korea-senior-script');
        if (!textarea || !textarea.value.trim()) {
            showNotification('대본을 입력해주세요.', 'warning');
            return;
        }
        scriptToAnalyze = textarea.value;
    } else {
        if (tabStates.stage1.status !== 'success' || !tabStates.stage1.revisedScript) {
            showNotification('1차 분석을 먼저 완료해주세요.', 'warning');
            return;
        }
        scriptToAnalyze = tabStates.stage1.revisedScript;
    }

    // API 키 확인
    if (!window.GeminiAPI) {
        showNotification('GeminiAPI가 로드되지 않았습니다.', 'error');
        return;
    }
    if (!localStorage.getItem('GEMINI_API_KEY')) {
        showNotification('API 키를 설정해주세요.', 'warning');
        return;
    }

    // 1차 재분석 시 2차 초기화
    if (stage === 'stage1' && tabStates.stage2.status !== 'idle') {
        tabStates.stage2 = {
            status: 'idle', progress: 0, resultText: null,
            revisedScript: null, originalScript: null, errorMessage: null
        };
        updateStageUI('stage2');
        document.getElementById('result-stage2').classList.add('hidden');
        disableButton('btn-stage2', true);
    }

    // 원본 저장 및 상태 초기화
    tab.originalScript = scriptToAnalyze;
    tab.status = 'running';
    tab.progress = 0;
    tab.resultText = null;
    tab.revisedScript = null;
    tab.errorMessage = null;

    updateStageUI(stage);
    disableButton('btn-' + stage, true);
    document.getElementById('result-' + stage).classList.remove('hidden');
    document.getElementById('result-table-' + stage).innerHTML = '<p class="text-blue-400">분석 진행 중...</p>';
    document.getElementById('revised-' + stage).innerHTML = '<p class="text-gray-500">분석 진행 중...</p>';

    updateProgress(stage, 10);

    setTimeout(function () {
        updateProgress(stage, 30);

        var prompt = generatePrompt(stage, scriptToAnalyze);

        window.GeminiAPI.generateContent(prompt, {
            temperature: 0.3,
            maxOutputTokens: 8192
        })
        .then(function (response) {
            updateProgress(stage, 80);

            var parsed = parseResult(response);
            tab.resultText = parsed.analysis || '분석 결과 없음';
            tab.revisedScript = parsed.revised || scriptToAnalyze;
            tab.status = 'success';
            tab.progress = 100;

            updateStageUI(stage);
            updateProgress(stage, 100);
            renderResults(stage);

            disableButton('btn-' + stage, false);

            if (stage === 'stage1') {
                disableButton('btn-stage2', false);
                showNotification('1차 분석 완료. 2차 분석 가능합니다.', 'success');
            } else {
                updateDownloadButton();
                showNotification('2차 분석 완료!', 'success');
            }
        })
        .catch(function (error) {
            tab.status = 'error';
            tab.errorMessage = error.message;
            tab.progress = 0;
            updateStageUI(stage);
            document.getElementById('result-table-' + stage).innerHTML = '<p class="text-red-400">오류: ' + escapeHtml(error.message) + '</p>';
            document.getElementById('revised-' + stage).innerHTML = '<p class="text-gray-500">분석 실패</p>';
            disableButton('btn-' + stage, false);
            showNotification('분석 실패: ' + error.message, 'error');
        });
    }, 500);
}

function parseResult(responseText) {
    if (!responseText) return { analysis: '응답 없음', revised: null };

    var cleaned = String(responseText)
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

    try {
        return JSON.parse(cleaned);
    } catch (e) {
        console.warn('[PARSE] JSON 파싱 실패');
        return { analysis: responseText, revised: null };
    }
}

/* ======================================================
   RENDER FUNCTIONS
====================================================== */
function renderResults(stage) {
    var tab = tabStates[stage];

    // 좌측: TSV 테이블
    var tableHtml = renderAnalysisTable(tab.resultText);
    document.getElementById('result-table-' + stage).innerHTML = tableHtml;

    // 우측: Diff 하이라이트
    var diffHtml = renderDiffHighlight(tab.originalScript, tab.revisedScript);
    document.getElementById('revised-' + stage).innerHTML = diffHtml;
}

function renderAnalysisTable(analysisText) {
    if (!analysisText) {
        return '<p class="text-gray-500">분석 결과 없음</p>';
    }

    var lines = analysisText.trim().split('\n');
    if (lines.length < 1 || lines[0].indexOf('\t') === -1) {
        return '<div class="whitespace-pre-wrap">' + escapeHtml(analysisText) + '</div>';
    }

    var html = '<div class="overflow-x-auto"><table class="w-full text-xs border-collapse">';

    // 헤더
    html += '<thead><tr class="bg-gray-800 text-gray-200">';
    var headers = lines[0].split('\t');
    var widths = ['50px', '90px', '90px', '', '100px'];
    for (var h = 0; h < 5; h++) {
        var w = widths[h] ? 'style="width:' + widths[h] + '"' : '';
        html += '<th class="border border-gray-600 px-2 py-2 text-left" ' + w + '>' + escapeHtml(headers[h] || '') + '</th>';
    }
    html += '</tr></thead><tbody>';

    // 데이터
    for (var i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        var cols = lines[i].split('\t');
        var typeText = (cols[1] || '').trim();

        // 유형별 색상
        var typeColor = 'text-gray-300';
        if (typeText === '통과') typeColor = 'text-green-400';
        else if (typeText.indexOf('왜곡') !== -1) typeColor = 'text-yellow-400';
        else if (typeText.indexOf('붕괴') !== -1) typeColor = 'text-orange-400';
        else if (typeText.indexOf('변경') !== -1 || typeText.indexOf('쌩뚱') !== -1) typeColor = 'text-pink-400';

        var rowBg = (i % 2 === 0) ? 'bg-gray-800' : 'bg-gray-850';
        html += '<tr class="' + rowBg + ' text-gray-300">';
        for (var c = 0; c < 5; c++) {
            var cellClass = (c === 1) ? typeColor + ' font-medium' : '';
            if (c === 4) cellClass = 'text-cyan-400';
            html += '<td class="border border-gray-700 px-2 py-1.5 ' + cellClass + '">' + escapeHtml(cols[c] || '') + '</td>';
        }
        html += '</tr>';
    }

    html += '</tbody></table></div>';
    return html;
}

function renderDiffHighlight(originalScript, revisedScript) {
    if (!revisedScript) {
        return '<p class="text-gray-500">수정본 없음</p>';
    }

    var originalLines = (originalScript || '').split('\n');
    var revisedLines = revisedScript.split('\n');
    var html = '<div class="font-mono text-sm leading-relaxed">';

    for (var i = 0; i < revisedLines.length; i++) {
        var revisedLine = revisedLines[i];
        var originalLine = (i < originalLines.length) ? originalLines[i] : null;
        var isDifferent = (originalLine === null) || (originalLine !== revisedLine);

        if (isDifferent && revisedLine.trim() !== '') {
            html += '<div class="bg-green-100 dark:bg-green-900/40 px-1 rounded">' + escapeHtml(revisedLine) + '</div>';
        } else if (revisedLine.trim() === '') {
            html += '<div class="min-h-[1.25rem]">&nbsp;</div>';
        } else {
            html += '<div>' + escapeHtml(revisedLine) + '</div>';
        }
    }

    html += '</div>';
    return html;
}

function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* ======================================================
   UI UPDATE FUNCTIONS
====================================================== */
function updateStageUI(stage) {
    var tab = tabStates[stage];
    var badge = document.getElementById('status-' + stage);

    if (!badge) return;

    if (tab.status === 'idle') {
        badge.textContent = '대기';
        badge.className = 'ml-2 status-badge bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full';
    } else if (tab.status === 'running') {
        badge.textContent = '분석중';
        badge.className = 'ml-2 status-badge bg-blue-500 text-white text-xs px-2 py-1 rounded-full';
    } else if (tab.status === 'success') {
        badge.textContent = '완료';
        badge.className = 'ml-2 status-badge bg-green-500 text-white text-xs px-2 py-1 rounded-full';
    } else if (tab.status === 'error') {
        badge.textContent = '실패';
        badge.className = 'ml-2 status-badge bg-red-500 text-white text-xs px-2 py-1 rounded-full';
    }

    var progressContainer = document.getElementById('progress-container-' + stage);
    if (progressContainer) {
        progressContainer.classList.toggle('hidden', tab.status !== 'running');
    }
}

function updateProgress(stage, percent) {
    tabStates[stage].progress = percent;
    var bar = document.getElementById('progress-bar-' + stage);
    var text = document.getElementById('progress-text-' + stage);
    if (bar) bar.style.width = percent + '%';
    if (text) text.textContent = percent + '%';
}

function disableButton(btnId, disabled) {
    var btn = document.getElementById(btnId);
    if (!btn) return;
    btn.disabled = disabled;
    if (disabled) {
        btn.classList.add('opacity-50', 'cursor-not-allowed', 'bg-gray-400');
        btn.classList.remove('bg-indigo-500', 'hover:bg-indigo-600', 'bg-purple-500', 'hover:bg-purple-600');
    } else {
        btn.classList.remove('opacity-50', 'cursor-not-allowed', 'bg-gray-400');
        if (btnId === 'btn-stage1') {
            btn.classList.add('bg-indigo-500', 'hover:bg-indigo-600');
        } else {
            btn.classList.add('bg-purple-500', 'hover:bg-purple-600');
        }
    }
}

function updateDownloadButton() {
    var btn = document.getElementById('download-revised-btn');
    if (!btn) return;
    var canDownload = (tabStates.stage2.status === 'success' && tabStates.stage2.revisedScript);
    btn.disabled = !canDownload;
}

/* ======================================================
   INITIALIZATION
====================================================== */
function initDarkMode() {
    var toggle = document.getElementById('dark-mode-toggle');
    if (!toggle) return;
    if (localStorage.getItem('darkMode') === 'true') {
        document.documentElement.classList.add('dark');
    }
    toggle.addEventListener('click', function () {
        document.documentElement.classList.toggle('dark');
        localStorage.setItem('darkMode', document.documentElement.classList.contains('dark'));
    });
}

function initApiKeyUI() {
    var toggle = document.getElementById('api-key-toggle-btn');
    var panel = document.getElementById('api-key-panel');
    var save = document.getElementById('api-key-save-btn');
    var del = document.getElementById('api-key-delete-btn');
    var close = document.getElementById('api-key-close-btn');
    var input = document.getElementById('api-key-input');
    var status = document.getElementById('api-key-status-text');
    var icon = document.getElementById('api-key-status-icon');

    if (!toggle || !panel) return;

    if (localStorage.getItem('GEMINI_API_KEY')) {
        status.textContent = '설정됨';
        icon.textContent = '✅';
    }

    toggle.addEventListener('click', function () {
        panel.classList.toggle('hidden');
        if (!panel.classList.contains('hidden')) {
            input.value = localStorage.getItem('GEMINI_API_KEY') || '';
        }
    });

    if (close) {
        close.addEventListener('click', function () {
            panel.classList.add('hidden');
        });
    }

    if (save) {
        save.addEventListener('click', function () {
            if (input.value.trim()) {
                localStorage.setItem('GEMINI_API_KEY', input.value.trim());
                status.textContent = '설정됨';
                icon.textContent = '✅';
                panel.classList.add('hidden');
                showNotification('API 키 저장됨', 'success');
            }
        });
    }

    if (del) {
        del.addEventListener('click', function () {
            localStorage.removeItem('GEMINI_API_KEY');
            status.textContent = 'API 키 설정';
            icon.textContent = '🔑';
            input.value = '';
            panel.classList.add('hidden');
            showNotification('API 키 삭제됨', 'info');
        });
    }
}

function initButtons() {
    var textarea = document.getElementById('korea-senior-script');

    // 샘플 버튼
    var sampleBtn = document.getElementById('korea-senior-sample-btn');
    if (sampleBtn) {
        sampleBtn.addEventListener('click', function () {
            textarea.value = '[제 1회 드라마 대본 / 씬1]\n\n나레이션:\n1995년 여름, 서울 강남의 한 아파트 단지.\n오랜만에 가족들이 한자리에 모였다.\n\n[씬 1. 서울 강남 아파트 거실 / 낮]\n\n(거실. 소파에 앉아 있는 할머니(75세, 김순자)와 손녀(20세, 이지은))\n\n지은: 할머니, 오늘 날씨 정말 좋죠?\n순자: 그러게. 이렇게 맑은 날은 오랜만이야.\n\n나레이션:\n두 사람은 따뜻한 햇살 아래에서 옛 이야기를 나누기 시작했다.';
            updateCharCounter();
        });
    }

    // 지우기 버튼
    var clearBtn = document.getElementById('korea-senior-clear-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', function () {
            textarea.value = '';
            updateCharCounter();
        });
    }

    // 1차 분석 버튼
    var btn1 = document.getElementById('btn-stage1');
    if (btn1) {
        btn1.addEventListener('click', function () {
            runAnalysis('stage1');
        });
    }

    // 2차 분석 버튼
    var btn2 = document.getElementById('btn-stage2');
    if (btn2) {
        btn2.addEventListener('click', function () {
            runAnalysis('stage2');
        });
    }

    // 다운로드 버튼
    var downloadBtn = document.getElementById('download-revised-btn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function () {
            var tab = tabStates.stage2;
            if (tab.status === 'success' && tab.revisedScript) {
                var blob = new Blob([tab.revisedScript], { type: 'text/plain;charset=utf-8' });
                var url = URL.createObjectURL(blob);
                var a = document.createElement('a');
                a.href = url;
                a.download = '최종_수정_대본_' + new Date().toISOString().slice(0, 10) + '.txt';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                showNotification('다운로드 완료', 'success');
            }
        });
    }

    // 글자수 카운터
    if (textarea) {
        textarea.addEventListener('input', updateCharCounter);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    console.log('[BOOT] DOMContentLoaded');
    initDarkMode();
    initApiKeyUI();
    initFileUpload();
    initButtons();
});
