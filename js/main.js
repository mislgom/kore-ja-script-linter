/** ======================================================
 * KORE-JA SCRIPT LINTER - MAIN.JS
 * 4-Panel Layout System v2.4
 * ====================================================== */

window.__MAIN_JS_LOADED__ = true;

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

console.log('[BOOT] main.js loaded - v2.4');

window.addEventListener('error', function (e) {
    console.warn('[RUNTIME WARN]', e.message);
});

window.addEventListener('unhandledrejection', function (e) {
    console.warn('[RUNTIME WARN]', e.reason);
});

function showNotification(message, type) {
    type = type || 'info';
    var colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500'
    };
    var notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 ' + (colors[type] || colors.info) + ' text-white px-4 py-2 rounded-lg shadow-lg z-50 max-w-sm text-sm';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(function () {
        notification.style.opacity = '0';
        setTimeout(function () {
            if (notification.parentNode) notification.parentNode.removeChild(notification);
        }, 300);
    }, 3000);
}

function initFileUpload() {
    var dropZone = document.getElementById('drop-zone');
    var dropOverlay = document.getElementById('drop-overlay');
    var fileInput = document.getElementById('file-upload-input');
    var uploadBtn = document.getElementById('btn-upload-file');
    var textarea = document.getElementById('korea-senior-script');

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
        var files = e.dataTransfer.files;
        if (files && files.length > 0) {
            var file = files[0];
            if (file.name.endsWith('.txt')) {
                var reader = new FileReader();
                reader.onload = function (ev) {
                    textarea.value = ev.target.result;
                    updateCharCounter();
                    showNotification('파일 로드 완료', 'success');
                };
                reader.readAsText(file, 'UTF-8');
            } else {
                showNotification('TXT 파일만 가능합니다.', 'error');
            }
        }
    });

    if (uploadBtn && fileInput) {
        uploadBtn.addEventListener('click', function () { fileInput.click(); });
        fileInput.addEventListener('change', function () {
            if (this.files && this.files.length > 0) {
                var file = this.files[0];
                var reader = new FileReader();
                reader.onload = function (ev) {
                    textarea.value = ev.target.result;
                    updateCharCounter();
                    showNotification('파일 로드 완료', 'success');
                };
                reader.readAsText(file, 'UTF-8');
            }
            this.value = '';
        });
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
   프롬프트 생성 (TSV 형식 강제)
====================================================== */
function generatePrompt(stage, script) {
    var stage1Prompt = '당신은 한국 시니어 낭독용 대본 검수 전문가입니다.\n\n';
    stage1Prompt += '아래 대본을 검수하고, 발견된 오류를 수정하세요.\n\n';
    stage1Prompt += '[검수 항목]\n';
    stage1Prompt += '1. 국가/시대 배경 오류\n';
    stage1Prompt += '2. 인물 설정 불일치 (이름, 나이, 성격)\n';
    stage1Prompt += '3. 인물 관계 불일치 (호칭, 관계)\n';
    stage1Prompt += '4. 시간/장소 흐름 오류\n\n';
    stage1Prompt += '[출력 형식] 반드시 아래 JSON 형식으로만 출력하세요:\n';
    stage1Prompt += '{\n';
    stage1Prompt += '  "analysis": "번호\\t유형\\t위치\\t변경내용\\t검수포인트\\n1\\t유형명\\t위치명\\t변경설명\\t포인트명",\n';
    stage1Prompt += '  "revised": "수정된 전체 대본"\n';
    stage1Prompt += '}\n\n';
    stage1Prompt += '[analysis 작성 규칙]\n';
    stage1Prompt += '- 반드시 TSV(탭 구분) 형식으로 작성\n';
    stage1Prompt += '- 첫 줄: 번호\\t유형\\t위치\\t변경내용\\t검수포인트 (헤더)\n';
    stage1Prompt += '- 둘째 줄부터: 1\\t시간왜곡\\t도입부\\t아침→저녁 수정\\t시간연속성\n';
    stage1Prompt += '- 오류가 없으면: 1\\t통과\\t-\\t검수통과\\t-\n';
    stage1Prompt += '- 각 열은 탭(Tab)으로 구분, 각 행은 줄바꿈(\\n)으로 구분\n\n';
    stage1Prompt += '[revised 작성 규칙]\n';
    stage1Prompt += '- 오류가 있으면 수정된 전체 대본 작성\n';
    stage1Prompt += '- 오류가 없으면 원본 그대로 작성\n\n';
    stage1Prompt += '[대본]\n' + script;

    var stage2Prompt = '당신은 한국 시니어 낭독용 대본 2차 심화 검수 전문가입니다.\n';
    stage2Prompt += '아래 대본은 1차 검수가 완료된 상태입니다.\n\n';
    stage2Prompt += '[검수 항목]\n';
    stage2Prompt += '1. 장소 왜곡 - 장면 연속성\n';
    stage2Prompt += '2. 시간 왜곡 - 시간 흐름 논리성\n';
    stage2Prompt += '3. 인물 설정 급변 - 성격/직업 변화\n';
    stage2Prompt += '4. 쌩뚱맞은 상황 - 복선 없는 사건\n';
    stage2Prompt += '5. 대화 흐름 붕괴 - 질문-답변 불일치\n';
    stage2Prompt += '6. 쌩뚱 인물 등장 - 소개 없는 인물\n\n';
    stage2Prompt += '[출력 형식] 반드시 아래 JSON 형식으로만 출력하세요:\n';
    stage2Prompt += '{\n';
    stage2Prompt += '  "analysis": "번호\\t유형\\t위치\\t변경내용\\t검수포인트\\n1\\t유형명\\t위치명\\t변경설명\\t포인트명",\n';
    stage2Prompt += '  "revised": "수정된 전체 대본"\n';
    stage2Prompt += '}\n\n';
    stage2Prompt += '[analysis 작성 규칙]\n';
    stage2Prompt += '- 반드시 TSV(탭 구분) 형식으로 작성\n';
    stage2Prompt += '- 첫 줄: 번호\\t유형\\t위치\\t변경내용\\t검수포인트 (헤더)\n';
    stage2Prompt += '- 둘째 줄부터: 1\\t대화붕괴\\t중반부\\t질문과 답변 수정\\t대사논리\n';
    stage2Prompt += '- 오류가 없으면: 1\\t통과\\t-\\t검수통과\\t-\n\n';
    stage2Prompt += '[대본]\n' + script;

    return (stage === 'stage1') ? stage1Prompt : stage2Prompt;
}

/* ======================================================
   분석 실행
====================================================== */
function runAnalysis(stage) {
    var tab = tabStates[stage];

    if (tab.status === 'running') {
        showNotification('분석이 이미 실행 중입니다.', 'warning');
        return;
    }

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
        tabStates.stage2 = { status: 'idle', progress: 0, resultText: null, revisedScript: null, originalScript: null, errorMessage: null };
        updateStageUI('stage2');
        document.getElementById('result-stage2').classList.add('hidden');
        disableButton('btn-stage2', true);
    }

    tab.originalScript = scriptToAnalyze;
    tab.status = 'running';
    tab.progress = 0;
    updateStageUI(stage);
    disableButton('btn-' + stage, true);

    document.getElementById('result-' + stage).classList.remove('hidden');
    document.getElementById('result-table-' + stage).innerHTML = '<p class="text-blue-400"><i class="fas fa-spinner fa-spin mr-2"></i>AI 분석 중...</p>';
    document.getElementById('revised-' + stage).innerHTML = '<p class="text-gray-400">분석 진행 중...</p>';

    updateProgress(stage, 20);

    setTimeout(function () {
        updateProgress(stage, 40);

        var prompt = generatePrompt(stage, scriptToAnalyze);

        window.GeminiAPI.generateContent(prompt, { temperature: 0.2, maxOutputTokens: 8192 })
        .then(function (response) {
            updateProgress(stage, 80);

            var parsed = parseGeminiResponse(response, scriptToAnalyze);
            tab.resultText = parsed.analysis;
            tab.revisedScript = parsed.revised;
            tab.status = 'success';
            tab.progress = 100;

            updateStageUI(stage);
            updateProgress(stage, 100);
            renderResults(stage);
            disableButton('btn-' + stage, false);

            if (stage === 'stage1') {
                disableButton('btn-stage2', false);
                showNotification('1차 분석 완료!', 'success');
            } else {
                updateDownloadButton();
                showNotification('2차 분석 완료!', 'success');
            }
        })
        .catch(function (error) {
            tab.status = 'error';
            tab.errorMessage = error.message;
            updateStageUI(stage);
            document.getElementById('result-table-' + stage).innerHTML = '<p class="text-red-400">오류: ' + escapeHtml(error.message) + '</p>';
            disableButton('btn-' + stage, false);
            showNotification('분석 실패', 'error');
        });
    }, 300);
}

/* ======================================================
   Gemini 응답 파싱
====================================================== */
function parseGeminiResponse(responseText, originalScript) {
    if (!responseText) {
        return { analysis: '응답 없음', revised: originalScript };
    }

    var cleaned = String(responseText).replace(/```json/gi, '').replace(/```/g, '').trim();

    // JSON 파싱 시도
    try {
        var json = JSON.parse(cleaned);
        var analysis = json.analysis || '';
        var revised = json.revised || originalScript;

        // analysis가 문자열인지 확인
        if (typeof analysis === 'string') {
            // 이스케이프된 탭/줄바꿈 복원
            analysis = analysis.replace(/\\t/g, '\t').replace(/\\n/g, '\n');
        }

        return { analysis: analysis, revised: revised };
    } catch (e) {
        console.warn('[PARSE] JSON 파싱 실패, 대체 파싱 시도');

        // JSON 파싱 실패 시 텍스트에서 추출 시도
        var analysisMatch = cleaned.match(/"analysis"\s*:\s*"([^"]*)"/);
        var revisedMatch = cleaned.match(/"revised"\s*:\s*"([\s\S]*?)"\s*}/);

        var analysis = analysisMatch ? analysisMatch[1].replace(/\\t/g, '\t').replace(/\\n/g, '\n') : cleaned;
        var revised = revisedMatch ? revisedMatch[1].replace(/\\n/g, '\n') : originalScript;

        return { analysis: analysis, revised: revised };
    }
}

/* ======================================================
   결과 렌더링
====================================================== */
function renderResults(stage) {
    var tab = tabStates[stage];

    // 좌측: 분석 결과 표
    var tableHtml = renderAnalysisTable(tab.resultText);
    document.getElementById('result-table-' + stage).innerHTML = tableHtml;

    // 우측: 수정 반영 (diff 하이라이트)
    var diffHtml = renderDiffHighlight(tab.originalScript, tab.revisedScript);
    document.getElementById('revised-' + stage).innerHTML = diffHtml;
}

function renderAnalysisTable(analysisText) {
    if (!analysisText || analysisText.trim() === '') {
        return '<p class="text-gray-500">분석 결과 없음</p>';
    }

    var text = String(analysisText);
    var lines = text.split('\n').filter(function(line) { return line.trim() !== ''; });

    if (lines.length === 0) {
        return '<p class="text-gray-500">분석 결과 없음</p>';
    }

    // 탭이 있는지 확인
    var hasTab = lines[0].indexOf('\t') !== -1;

    if (!hasTab) {
        // TSV 형식이 아니면 일반 텍스트로 보기 좋게 표시
        return '<div class="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">' + escapeHtml(analysisText) + '</div>';
    }

    // TSV → 테이블 변환
    var html = '<table class="w-full text-xs border-collapse">';
    html += '<thead><tr class="bg-gray-800">';

    var headers = lines[0].split('\t');
    var headerNames = ['번호', '유형', '위치(대략)', '변경 내용 요약', '검수 포인트'];
    var widths = ['40px', '80px', '80px', '', '90px'];
    var headerColors = ['text-gray-400', 'text-purple-400', 'text-blue-400', 'text-gray-300', 'text-cyan-400'];

    for (var h = 0; h < 5; h++) {
        var headerText = (headers[h] && headers[h].trim()) ? headers[h] : headerNames[h];
        var style = widths[h] ? 'width:' + widths[h] + ';' : '';
        html += '<th class="border border-gray-700 px-2 py-2 text-left ' + headerColors[h] + '" style="' + style + '">' + escapeHtml(headerText) + '</th>';
    }
    html += '</tr></thead><tbody>';

    for (var i = 1; i < lines.length; i++) {
        var cols = lines[i].split('\t');
        var typeText = (cols[1] || '').trim();

        // 유형별 색상
        var typeColor = 'text-gray-300';
        if (typeText === '통과') typeColor = 'text-green-400';
        else if (typeText.indexOf('왜곡') !== -1) typeColor = 'text-yellow-400';
        else if (typeText.indexOf('붕괴') !== -1) typeColor = 'text-orange-400';
        else if (typeText.indexOf('변경') !== -1 || typeText.indexOf('불일치') !== -1) typeColor = 'text-pink-400';
        else if (typeText.indexOf('쌩뚱') !== -1) typeColor = 'text-red-400';

        var rowBg = (i % 2 === 0) ? 'bg-gray-900' : 'bg-gray-800/50';
        html += '<tr class="' + rowBg + '">';

        for (var c = 0; c < 5; c++) {
            var cellText = (cols[c] || '').trim() || '-';
            var cellClass = 'text-gray-300';
            if (c === 0) cellClass = 'text-gray-500';
            if (c === 1) cellClass = typeColor + ' font-medium';
            if (c === 2) cellClass = 'text-blue-300';
            if (c === 4) cellClass = 'text-cyan-400';
            html += '<td class="border border-gray-700 px-2 py-1.5 ' + cellClass + '">' + escapeHtml(cellText) + '</td>';
        }
        html += '</tr>';
    }

    html += '</tbody></table>';
    return html;
}

function renderDiffHighlight(originalScript, revisedScript) {
    if (!revisedScript || revisedScript.trim() === '') {
        return '<p class="text-gray-500">수정본 없음</p>';
    }

    var originalLines = (originalScript || '').split('\n');
    var revisedLines = revisedScript.split('\n');

    var html = '<div class="font-mono text-sm leading-relaxed space-y-0">';

    for (var i = 0; i < revisedLines.length; i++) {
        var revisedLine = revisedLines[i];
        var originalLine = (i < originalLines.length) ? originalLines[i] : '';

        // 변경 여부 확인
        var isDifferent = (originalLine !== revisedLine);

        if (revisedLine.trim() === '') {
            // 빈 줄
            html += '<div class="h-5">&nbsp;</div>';
        } else if (isDifferent) {
            // 변경된 라인 - 연한 초록 배경
            html += '<div class="bg-green-200 dark:bg-green-800/60 text-green-900 dark:text-green-100 px-2 py-0.5 rounded">' + escapeHtml(revisedLine) + '</div>';
        } else {
            // 동일한 라인
            html += '<div class="text-gray-700 dark:text-gray-300 px-2">' + escapeHtml(revisedLine) + '</div>';
        }
    }

    html += '</div>';
    return html;
}

function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/* ======================================================
   UI 업데이트
====================================================== */
function updateStageUI(stage) {
    var tab = tabStates[stage];
    var badge = document.getElementById('status-' + stage);
    if (!badge) return;

    var statusMap = {
        idle: { text: '대기', class: 'bg-gray-200 text-gray-600' },
        running: { text: '분석중', class: 'bg-blue-500 text-white' },
        success: { text: '완료', class: 'bg-green-500 text-white' },
        error: { text: '실패', class: 'bg-red-500 text-white' }
    };

    var s = statusMap[tab.status] || statusMap.idle;
    badge.textContent = s.text;
    badge.className = 'ml-2 text-xs px-2 py-1 rounded-full ' + s.class;

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
   초기화
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
        if (status) status.textContent = '설정됨';
        if (icon) icon.textContent = '✅';
    }

    toggle.addEventListener('click', function () {
        panel.classList.toggle('hidden');
        if (!panel.classList.contains('hidden') && input) {
            input.value = localStorage.getItem('GEMINI_API_KEY') || '';
        }
    });

    if (close) close.addEventListener('click', function () { panel.classList.add('hidden'); });

    if (save) save.addEventListener('click', function () {
        if (input && input.value.trim()) {
            localStorage.setItem('GEMINI_API_KEY', input.value.trim());
            if (status) status.textContent = '설정됨';
            if (icon) icon.textContent = '✅';
            panel.classList.add('hidden');
            showNotification('API 키 저장됨', 'success');
        }
    });

    if (del) del.addEventListener('click', function () {
        localStorage.removeItem('GEMINI_API_KEY');
        if (status) status.textContent = 'API 키 설정';
        if (icon) icon.textContent = '🔑';
        if (input) input.value = '';
        panel.classList.add('hidden');
        showNotification('API 키 삭제됨', 'info');
    });
}

function initButtons() {
    var textarea = document.getElementById('korea-senior-script');

    var sampleBtn = document.getElementById('korea-senior-sample-btn');
    if (sampleBtn) {
        sampleBtn.addEventListener('click', function () {
            if (textarea) {
                textarea.value = '[제 1회 드라마 대본 / 씬1]\n\n나레이션:\n1995년 여름, 서울 강남의 한 아파트 단지.\n오랜만에 가족들이 한자리에 모였다.\n\n[씬 1. 서울 강남 아파트 거실 / 낮]\n\n(거실. 소파에 앉아 있는 할머니(75세, 김순자)와 손녀(20세, 이지은))\n\n지은: 할머니, 오늘 날씨 정말 좋죠?\n순자: 그러게. 이렇게 맑은 날은 오랜만이야.\n\n나레이션:\n두 사람은 따뜻한 햇살 아래에서 옛 이야기를 나누기 시작했다.';
                updateCharCounter();
            }
        });
    }

    var clearBtn = document.getElementById('korea-senior-clear-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', function () {
            if (textarea) {
                textarea.value = '';
                updateCharCounter();
            }
        });
    }

    var btn1 = document.getElementById('btn-stage1');
    if (btn1) btn1.addEventListener('click', function () { runAnalysis('stage1'); });

    var btn2 = document.getElementById('btn-stage2');
    if (btn2) btn2.addEventListener('click', function () { runAnalysis('stage2'); });

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

    if (textarea) textarea.addEventListener('input', updateCharCounter);
}

document.addEventListener('DOMContentLoaded', function () {
    console.log('[BOOT] DOMContentLoaded - v2.4');
    initDarkMode();
    initApiKeyUI();
    initFileUpload();
    initButtons();
});
