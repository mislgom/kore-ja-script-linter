/** ======================================================
 * KORE-JA SCRIPT LINTER - MAIN.JS
 * 4-Panel Layout System v2.3
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

console.log('[BOOT] main.js loaded - v2.3 (TSV Table Fix)');

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
   PROMPT GENERATION (TSV 형식 강제)
====================================================== */
function generatePrompt(stage, script) {
    if (stage === 'stage1') {
        return "당신은 한국 시니어 낭독용 대본 1차 검수 전문가입니다.\n\n[필수 검수 항목]\n1) 국가 배경 - 한국 배경에 타국 요소 혼입 여부\n2) 시대 배경 - 시대에 맞지 않는 표현\n3) 인물 설정 일관성 - 이름/나이/외형/성격/말투\n4) 인물 관계 일관성 - 호칭/관계\n\n[중요] analysis 출력 형식\nanalysis 값은 반드시 아래 TSV(탭 구분) 형식으로만 작성하세요.\n첫 줄은 헤더, 둘째 줄부터 데이터입니다.\n각 열은 탭(Tab 문자)으로 구분합니다.\n\nTSV 형식 예시 (오류 발견 시):\n번호\t유형\t위치(대략)\t변경 내용 요약\t검수 포인트\n1\t시간 왜곡\t도입부\t겨울 폭설 → 초가을 새벽 → 한낮 혼용\t시간 연속성\n2\t장소 왜곡\t헛간 이후\t헛간 → 관아 대청 즉시 이동\t공간 전환 누락\n3\t인물 설정 변경\t윤혜린 설명부\t과부 → 30년차 아전\t캐릭터 일관성\n4\t쌩뚱 상황\t궤짝 탈취 직후\t비극 장면에 축제 반응\t톤맥락 붕괴\n5\t대화 붕괴\t나그네 대화\t숙박 요청 → 쌀값 화제\t대사 논리\n6\t쌩뚱 인물\t중반부\t윤철수翁 등장\t인물 관리\n\nTSV 형식 예시 (검수 통과 시):\n번호\t유형\t위치(대략)\t변경 내용 요약\t검수 포인트\n1\t통과\t-\t검수 통과\t-\n\n[출력 형식 - 반드시 JSON만 출력]\n{\"analysis\":\"번호\\t유형\\t위치(대략)\\t변경 내용 요약\\t검수 포인트\\n1\\t...\",\"revised\":\"수정된 대본 전체\"}\n\n주의: JSON 외의 텍스트는 절대 출력하지 마세요.\n\n[대본]\n" + script;
    } else {
        return "당신은 한국 시니어 낭독용 대본 2차 심화 검수 전문가입니다.\n입력 대본은 1차 수정이 완료된 상태입니다.\n\n[필수 검수 항목]\n1) 장소 왜곡 - 같은 장면에서 장소가 갑자기 바뀌는지\n2) 시간 왜곡 - 오전/오후/계절/날짜 흐름이 맞는지\n3) 인물 설정 변경 - 성격/직업/관계/나이가 갑자기 변하는지\n4) 쌩뚱맞는 상황 - 복선 없이 사건이 튀어나오는지\n5) 대화 흐름 붕괴 - 질문-답이 맞지 않는지\n6) 쌩뚱 인물 등장 - 소개 없이 새 인물이 등장하는지\n\n[중요] analysis 출력 형식\nanalysis 값은 반드시 아래 TSV(탭 구분) 형식으로만 작성하세요.\n첫 줄은 헤더, 둘째 줄부터 데이터입니다.\n각 열은 탭(Tab 문자)으로 구분합니다.\n\nTSV 형식 예시 (오류 발견 시):\n번호\t유형\t위치(대략)\t변경 내용 요약\t검수 포인트\n1\t시간 왜곡\t도입부\t겨울 폭설 → 초가을 새벽 → 한낮 혼용\t시간 연속성\n2\t장소 왜곡\t헛간 이후\t헛간 → 관아 대청 즉시 이동\t공간 전환 누락\n3\t인물 설정 변경\t윤혜린 설명부\t과부 → 30년차 아전\t캐릭터 일관성\n4\t쌩뚱 상황\t궤짝 탈취 직후\t비극 장면에 축제 반응\t톤맥락 붕괴\n5\t대화 붕괴\t나그네 대화\t숙박 요청 → 쌀값 화제\t대사 논리\n6\t쌩뚱 인물\t중반부\t윤철수翁 등장\t인물 관리\n\nTSV 형식 예시 (검수 통과 시):\n번호\t유형\t위치(대략)\t변경 내용 요약\t검수 포인트\n1\t통과\t-\t검수 통과\t-\n\n[출력 규칙]\n- 오류 없음: {\"analysis\":\"번호\\t유형\\t...\\n1\\t통과\\t...\",\"revised\":\"최종 대본 전체\"}\n- 오류 발견: {\"analysis\":\"번호\\t유형\\t...\\n1\\t시간 왜곡\\t...\",\"revised\":\"\"}\n\n주의: JSON 외의 텍스트는 절대 출력하지 마세요.\n\n[대본]\n" + script;
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

    if (stage === 'stage1' && tabStates.stage2.status !== 'idle') {
        tabStates.stage2 = {
            status: 'idle', progress: 0, resultText: null,
            revisedScript: null, originalScript: null, errorMessage: null
        };
        updateStageUI('stage2');
        document.getElementById('result-stage2').classList.add('hidden');
        disableButton('btn-stage2', true);
    }

    tab.originalScript = scriptToAnalyze;
    tab.status = 'running';
    tab.progress = 0;
    tab.resultText = null;
    tab.revisedScript = null;
    tab.errorMessage = null;

    updateStageUI(stage);
    disableButton('btn-' + stage, true);
    document.getElementById('result-' + stage).classList.remove('hidden');
    document.getElementById('result-table-' + stage).innerHTML = '<p class="text-blue-400"><i class="fas fa-spinner fa-spin mr-2"></i>분석 진행 중...</p>';
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

    var tableHtml = renderAnalysisTable(tab.resultText);
    document.getElementById('result-table-' + stage).innerHTML = tableHtml;

    var diffHtml = renderDiffHighlight(tab.originalScript, tab.revisedScript);
    document.getElementById('revised-' + stage).innerHTML = diffHtml;
}

function renderAnalysisTable(analysisText) {
    if (!analysisText) {
        return '<p class="text-gray-500">분석 결과 없음</p>';
    }

    // 줄바꿈 처리 (\\n을 실제 줄바꿈으로)
    var text = analysisText.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
    var lines = text.trim().split('\n');
    
    if (lines.length < 1) {
        return '<div class="whitespace-pre-wrap">' + escapeHtml(analysisText) + '</div>';
    }

    // 탭이 있는지 확인
    var hasTab = lines[0].indexOf('\t') !== -1;
    if (!hasTab) {
        return '<div class="whitespace-pre-wrap text-gray-300">' + escapeHtml(analysisText) + '</div>';
    }

    var html = '<div class="overflow-x-auto"><table class="w-full text-xs border-collapse">';

    // 헤더
    html += '<thead><tr class="bg-gray-800">';
    var headers = lines[0].split('\t');
    var widths = ['45px', '85px', '85px', '', '95px'];
    var headerColors = ['text-gray-400', 'text-purple-400', 'text-blue-400', 'text-gray-300', 'text-cyan-400'];
    for (var h = 0; h < 5; h++) {
        var w = widths[h] ? 'width:' + widths[h] + ';' : '';
        html += '<th class="border border-gray-700 px-2 py-2 text-left font-semibold ' + headerColors[h] + '" style="' + w + '">' + escapeHtml(headers[h] || '') + '</th>';
    }
    html += '</tr></thead><tbody>';

    // 데이터 행
    for (var i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        var cols = lines[i].split('\t');
        var typeText = (cols[1] || '').trim();

        // 유형별 색상
        var typeColor = 'text-gray-300';
        if (typeText === '통과') {
            typeColor = 'text-green-400';
        } else if (typeText.indexOf('왜곡') !== -1) {
            typeColor = 'text-yellow-400';
        } else if (typeText.indexOf('붕괴') !== -1) {
            typeColor = 'text-orange-400';
        } else if (typeText.indexOf('변경') !== -1) {
            typeColor = 'text-pink-400';
        } else if (typeText.indexOf('쌩뚱') !== -1) {
            typeColor = 'text-red-400';
        }

        var rowBg = (i % 2 === 0) ? 'bg-gray-900' : 'bg-gray-800/50';
        html += '<tr class="' + rowBg + '">';
        
        for (var c = 0; c < 5; c++) {
            var cellText = cols[c] || '';
            var cellClass = 'text-gray-300';
            
            if (c === 0) cellClass = 'text-gray-500'; // 번호
            if (c === 1) cellClass = typeColor + ' font-medium'; // 유형
            if (c === 2) cellClass = 'text-blue-300'; // 위치
            if (c === 4) cellClass = 'text-cyan-400'; // 검수 포인트
            
            html += '<td class="border border-gray-700 px-2 py-1.5 ' + cellClass + '">' + escapeHtml(cellText) + '</td>';
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
            // 변경된 라인: 연한 초록 배경
            html += '<div class="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 px-1 -mx-1 rounded">' + escapeHtml(revisedLine) + '</div>';
        } else if (revisedLine.trim() === '') {
            // 빈 줄
            html += '<div class="min-h-[1.25rem]">&nbsp;</div>';
        } else {
            // 변경 없는 라인
            html += '<div class="text-gray-700 dark:text-gray-300">' + escapeHtml(revisedLine) + '</div>';
        }
    }

    html += '</div>';
    return html;
}

function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, "&amp;")
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
    if (canDownload) {
        btn.classList.remove('opacity-50', 'cursor-not-allowed');
    } else {
        btn.classList.add('opacity-50', 'cursor-not-allowed');
    }
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

    var sampleBtn = document.getElementById('korea-senior-sample-btn');
    if (sampleBtn) {
        sampleBtn.addEventListener('click', function () {
            textarea.value = '[제 1회 드라마 대본 / 씬1]\n\n나레이션:\n1995년 여름, 서울 강남의 한 아파트 단지.\n오랜만에 가족들이 한자리에 모였다.\n\n[씬 1. 서울 강남 아파트 거실 / 낮]\n\n(거실. 소파에 앉아 있는 할머니(75세, 김순자)와 손녀(20세, 이지은))\n\n지은: 할머니, 오늘 날씨 정말 좋죠?\n순자: 그러게. 이렇게 맑은 날은 오랜만이야.\n\n나레이션:\n두 사람은 따뜻한 햇살 아래에서 옛 이야기를 나누기 시작했다.';
            updateCharCounter();
        });
    }

    var clearBtn = document.getElementById('korea-senior-clear-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', function () {
            textarea.value = '';
            updateCharCounter();
        });
    }

    var btn1 = document.getElementById('btn-stage1');
    if (btn1) {
        btn1.addEventListener('click', function () {
            runAnalysis('stage1');
        });
    }

    var btn2 = document.getElementById('btn-stage2');
    if (btn2) {
        btn2.addEventListener('click', function () {
            runAnalysis('stage2');
        });
    }

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

    if (textarea) {
        textarea.addEventListener('input', updateCharCounter);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    console.log('[BOOT] DOMContentLoaded - v2.3');
    initDarkMode();
    initApiKeyUI();
    initFileUpload();
    initButtons();
});
