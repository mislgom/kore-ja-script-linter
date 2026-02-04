/** ======================================================
 * KORE-JA SCRIPT LINTER - MAIN.JS
 * 2-Stage Pipeline Analysis System v3.1
 * Features: Pipeline Execution, TSV Table, Diff Highlight
 * ====================================================== */

// [CRITICAL] main.js 로드 확인 마커 (실패 방지용 필수 플래그)
window.__MAIN_JS_LOADED__ = true;

/* ======================================================
   GLOBAL STATE INITIALIZATION
====================================================== */
window.AppState = {
    isDarkMode: false,
    currentSelectedTab: null
};

// 2단계 분석 탭 정의
var ANALYSIS_TABS = [
    {
        id: 'stage1',
        title: '1차 분석 (기본 점검)',
        description: '한국 배경, 인물 설정, 인물 관계 일관성',
        promptKey: 'stage1'
    },
    {
        id: 'stage2',
        title: '2차 분석 (심화 점검)',
        description: '이야기 흐름 왜곡, 재미/몰입 요소',
        promptKey: 'stage2'
    }
];

// 탭 상태 저장소
var tabStates = {};
ANALYSIS_TABS.forEach(function (tab) {
    tabStates[tab.id] = {
        id: tab.id,
        title: tab.title,
        description: tab.description,
        promptKey: tab.promptKey,
        progress: 0,
        status: 'idle', // idle, running, success, error
        resultText: null,
        revisedScript: null,
        originalScript: null, // 비교용 원본 저장
        errorMessage: null
    };
});

/* ======================================================
   BOOT & ERROR HANDLING
====================================================== */
console.log('[BOOT] main.js loaded - v3.1 (TSV Table + Diff Highlight)');

window.addEventListener('error', function (e) {
    console.warn('[RUNTIME WARN] JS 내부 오류 감지 (팝업 표시 안 함):', e.message);
});

window.addEventListener('unhandledrejection', function (e) {
    console.warn('[RUNTIME WARN] Unhandled Promise Rejection (팝업 표시 안 함):', e.reason);
});

/* ======================================================
   DEPENDENCY CHECK
====================================================== */
function checkDependencyBeforeAction(actionName) {
    if (typeof window.GeminiAPI === 'undefined') {
        console.error('[DEPENDENCY] GeminiAPI not loaded for action:', actionName);
        showNotification('GeminiAPI가 로드되지 않았습니다. gemini-api.js를 확인하세요.', 'error');
        return false;
    }
    return true;
}

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
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    dropZone.addEventListener('dragenter', function () {
        if (dropOverlay) dropOverlay.classList.remove('hidden');
        dropZone.classList.add('border-primary');
    });

    dropZone.addEventListener('dragleave', function (e) {
        if (e.relatedTarget && !dropZone.contains(e.relatedTarget)) {
            if (dropOverlay) dropOverlay.classList.add('hidden');
            dropZone.classList.remove('border-primary');
        }
    });

    dropZone.addEventListener('drop', function (e) {
        if (dropOverlay) dropOverlay.classList.add('hidden');
        dropZone.classList.remove('border-primary');

        var dt = e.dataTransfer;
        var files = dt.files;
        handleFiles(files);
    });

    if (uploadBtn && fileInput) {
        uploadBtn.addEventListener('click', function () {
            fileInput.click();
        });

        fileInput.addEventListener('change', function (e) {
            handleFiles(this.files);
            this.value = '';
        });
    }

    function handleFiles(files) {
        if (!files || files.length === 0) return;

        var file = files[0];
        if (file.type !== 'text/plain' && !file.name.endsWith('.txt')) {
            showNotification('TXT 파일만 업로드 가능합니다.', 'error');
            return;
        }

        var reader = new FileReader();
        reader.onload = function (e) {
            textarea.value = e.target.result;
            if (charCounter) {
                charCounter.textContent = textarea.value.length + '자 / 무제한';
            }
            showNotification('파일이 로드되었습니다: ' + file.name, 'success');
        };
        reader.onerror = function () {
            showNotification('파일 읽기 실패', 'error');
        };
        reader.readAsText(file, 'UTF-8');
    }
}

/* ======================================================
   PROMPT GENERATION (TSV 형식 강제)
====================================================== */
function generatePromptForTab(promptKey, script) {
    if (promptKey === 'stage1') {
        return `너는 "한국 시니어 낭독용 대본 1차 검수 전문가"다.
입력 대본을 분석하고 즉시 수정본을 만든다.

[검수 항목]
1) 국가 배경 검증
- 도시/지명/화폐/문화 요소가 국가와 일치하는지
- 한국 배경 기준에서 타국 요소 혼입 여부

2) 시대 배경 검증
- 조선/일제/현대/70·80·90년대 단서 분석
- 시대에 맞지 않는 사물·문화·표현 수정

3) 등장인물 설정 일관성
- 이름/나이/외형/성격/말투가 처음부터 끝까지 동일한지
- 충돌 시 최초 등장 설정을 기준으로 하나로 통일

4) 등장인물 관계 일관성
- 가족/친족/이웃/사회적 관계 및 호칭 일관성
- 가장 자연스러운 관계 1개로 고정

5) 즉시 반영
- 위 문제를 모두 반영해 1차 수정 대본 생성

[analysis 작성 규칙 - TSV 형식 필수]
analysis는 반드시 아래 TSV(탭 구분) 형식으로만 작성:
- 첫 줄은 헤더: 번호\\t유형\\t위치(대략)\\t변경 내용 요약\\t검수 포인트
- 둘째 줄부터 데이터 행

검수 통과 시(문제 없음):
번호\\t유형\\t위치(대략)\\t변경 내용 요약\\t검수 포인트
1\\t통과\\t-\\t검수 통과\\t-

오류 발견 시(예시):
번호\\t유형\\t위치(대략)\\t변경 내용 요약\\t검수 포인트
1\\t시간 왜곡\\t도입부\\t겨울 폭설 → 초가을 새벽 → 한낮 혼용\\t시간 연속성
2\\t장소 왜곡\\t헛간 이후\\t헛간 → 관아 대청 즉시 이동\\t공간 전환 누락
3\\t인물 설정 변경\\t윤혜린 설명부\\t과부 → 30년차 아전\\t캐릭터 일관성

[출력(JSON만)]
{"analysis":"(TSV 형식 문자열)","revised":"(수정된 대본)"}

[대본]
${script}`;
    } else if (promptKey === 'stage2') {
        return `너는 "한국 시니어 낭독용 대본 2차 심화 검수 전문가"다.
입력 대본은 1차 수정이 완료된 상태다.

[검수 항목]
1) 이야기 시간·장소 흐름 왜곡
- 아침/점심/저녁, 오전/오후, 계절, 날짜 흐름
- 장소 이동의 논리성 점검

2) 재미/몰입 요소 분석
- 시니어 낭독 채널 기준으로 공감·몰입·이탈 리스크 점검
- 웹 검색 언급 금지
- 채널 정보 부족 시 일반적인 시니어 낭독 기준으로 판단

3) 최종 수정 대본 생성
- 1차 수정본을 바탕으로 최종 수정 대본 작성
- VREW 1줄=1클립 규칙 동일 적용

[오류 판정 항목]
(1) 장소 왜곡: 같은 장면/연속 흐름인데 갑자기 장소가 바뀐 것처럼 이어지는지
(2) 시간 왜곡: 오전/오후/계절/날짜가 앞뒤 맥락과 맞지 않게 점프하는지
(3) 등장인물 설정 변경: 성격/직업/관계/나이/말투가 갑자기 변하는지
(4) 쌩뚱맞는 상황: 복선/맥락 없이 사건/행동이 갑자기 튀어나오는지
(5) 대화 흐름 붕괴: 질문-답이 맞지 않거나, 대화가 갑자기 다른 주제로 튀는지
(6) 쌩뚱 인물 등장: 소개/복선 없이 새 인물이 불쑥 끼어드는지

[이중 검수]
- 1차에서 이미 검수되었음을 전제로, 동일 기준으로 2차에서 다시 한 번 검수한다.

[analysis 작성 규칙 - TSV 형식 필수]
analysis는 반드시 아래 TSV(탭 구분) 형식으로만 작성:
- 첫 줄은 헤더: 번호\\t유형\\t위치(대략)\\t변경 내용 요약\\t검수 포인트
- 둘째 줄부터 데이터 행

검수 통과 시:
번호\\t유형\\t위치(대략)\\t변경 내용 요약\\t검수 포인트
1\\t통과\\t-\\t검수 통과\\t-

오류 발견 시(예시):
번호\\t유형\\t위치(대략)\\t변경 내용 요약\\t검수 포인트
1\\t시간 왜곡\\t도입부\\t겨울 폭설 → 초가을 새벽 → 한낮 혼용\\t시간 연속성
2\\t장소 왜곡\\t헛간 이후\\t헛간 → 관아 대청 즉시 이동\\t공간 전환 누락

[출력 규칙(JSON 고정, 키 2개 유지)]
- 오류 없음(검수 통과)일 때:
  {"analysis":"(TSV 형식)","revised":"(최종 대본. 1줄=1클립, 빈줄 금지)"}

- 오류 발견 시(단 1개라도 발견):
  {"analysis":"(TSV 형식으로 발견된 오류들)","revised":""}

[추가 제한]
- 자동 재분석/재시도 로직 추가 금지
- JSON 구조/키 변경 금지
- 2차 입력은 1차 JSON의 revised만 사용(기존 규칙 유지)

[대본]
${script}`;
    }
    return '';
}

/* ======================================================
   TAB ANALYSIS EXECUTION (PIPELINE)
====================================================== */
window.runAnalysisForTab = function (tabId) {
    var tab = tabStates[tabId];

    if (tab.status === 'running') {
        showNotification(tab.title + ' 분석이 이미 실행 중입니다.', 'warning');
        return;
    }

    var scriptToAnalyze = null;
    if (tabId === 'stage1') {
        var scriptTextarea = document.getElementById('korea-senior-script');
        if (!scriptTextarea || !scriptTextarea.value.trim()) {
            showNotification('대본을 입력해주세요.', 'warning');
            return;
        }
        scriptToAnalyze = scriptTextarea.value;
    } else if (tabId === 'stage2') {
        var stage1Tab = tabStates['stage1'];
        if (stage1Tab.status !== 'success' || !stage1Tab.revisedScript) {
            showNotification('1차 분석을 먼저 완료해야 합니다.', 'warning');
            return;
        }
        scriptToAnalyze = stage1Tab.revisedScript;
    }

    if (!checkDependencyBeforeAction('AI 분석')) return;
    var apiKey = localStorage.getItem('GEMINI_API_KEY');
    if (!apiKey) {
        showNotification('API 키를 먼저 설정해주세요.', 'warning');
        return;
    }

    console.log('[PIPELINE] Starting Analysis: ' + tabId);

    if (tabId === 'stage1') {
        var stage2Tab = tabStates['stage2'];
        if (stage2Tab.status !== 'idle') {
            console.log('[PIPELINE] 1차 재분석으로 인한 2차 결과 초기화');
            stage2Tab.status = 'idle';
            stage2Tab.resultText = null;
            stage2Tab.revisedScript = null;
            stage2Tab.originalScript = null;
            stage2Tab.errorMessage = null;
            stage2Tab.progress = 0;
            updateTabUI('stage2');
            disableTabButton('stage2', true);

            var resultSection = document.getElementById('result-section');
            if (resultSection) resultSection.classList.add('hidden');
        }
    }

    executePipelineNode(tabId, scriptToAnalyze);
};

function executePipelineNode(tabId, inputScript) {
    var tab = tabStates[tabId];

    // 원본 저장 (diff 비교용)
    tab.originalScript = inputScript;

    tab.status = 'running';
    tab.progress = 0;
    tab.resultText = null;
    tab.revisedScript = null;
    tab.errorMessage = null;

    updateTabUI(tabId);
    disableTabButton(tabId, true);

    selectAnalysisTab(tabId);

    updateTabProgress(tabId, 10);

    setTimeout(function () {
        updateTabProgress(tabId, 30);
        var prompt = generatePromptForTab(tab.promptKey, inputScript);

        var geminiAPI = window.GeminiAPI;
        if (!geminiAPI || !geminiAPI.generateContent) {
            handleAnalysisError(tabId, new Error('GeminiAPI Not Loaded'));
            return;
        }

        updateTabProgress(tabId, 50);

        geminiAPI.generateContent(prompt, {
            temperature: 0.3,
            maxOutputTokens: 8192
        })
            .then(function (response) {
                updateTabProgress(tabId, 80);

                var parsed = parseAnalysisResult(response);
                tab.resultText = parsed.analysis || '분석 결과가 없습니다.';
                tab.revisedScript = parsed.revised || inputScript;
                tab.status = 'success';
                tab.progress = 100;

                updateTabUI(tabId);
                updateTabProgress(tabId, 100);

                selectAnalysisTab(tabId);
                showNotification(tab.title + ' 완료', 'success');

                if (tabId === 'stage1') {
                    console.log('[PIPELINE] Stage 1 Complete. Enabling Stage 2 Button.');
                    disableTabButton('stage1', false);
                    disableTabButton('stage2', false);
                    showNotification('1차 분석 완료. 2차 분석을 시작할 수 있습니다.', 'info');
                } else if (tabId === 'stage2') {
                    console.log('[PIPELINE] Stage 2 Complete.');
                    showNotification('모든 분석이 완료되었습니다.', 'success');
                    disableTabButton('stage2', false);
                }

            })
            .catch(function (error) {
                handleAnalysisError(tabId, error);
                disableTabButton(tabId, false);
            });

    }, 500);
}

function handleAnalysisError(tabId, error) {
    var tab = tabStates[tabId];
    console.error('[' + tabId + '] 분석 실패:', error);
    tab.status = 'error';
    tab.errorMessage = error.message || '오류 발생';
    tab.progress = 0;

    updateTabUI(tabId);
    showNotification(tab.title + ' 실패: ' + tab.errorMessage, 'error');
}

function parseAnalysisResult(responseText) {
    if (!responseText) return { analysis: '응답 없음', revised: null };

    var cleaned = String(responseText)
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

    try {
        return JSON.parse(cleaned);
    } catch (e) {
        console.warn('[PARSE] JSON 파싱 실패, 텍스트 반환');
        return { analysis: responseText, revised: null };
    }
}

/* ======================================================
   TSV → HTML TABLE 렌더링 (좌측: 분석 결과)
====================================================== */
function renderAnalysisTable(analysisText) {
    if (!analysisText) {
        return '<p class="text-gray-500 dark:text-gray-400">분석 결과가 없습니다.</p>';
    }

    var lines = analysisText.trim().split('\n');
    if (lines.length < 1) {
        return '<p class="text-gray-500 dark:text-gray-400">' + escapeHtml(analysisText) + '</p>';
    }

    // TSV 형식 확인 (탭이 포함되어 있는지)
    var hasTab = lines[0].indexOf('\t') !== -1;
    if (!hasTab) {
        // TSV 형식이 아니면 기존 텍스트 그대로 표시
        return '<div class="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">' + escapeHtml(analysisText) + '</div>';
    }

    var html = '<div class="overflow-x-auto"><table class="w-full text-xs border-collapse">';
    
    // 헤더
    html += '<thead><tr class="bg-gray-800 text-gray-200">';
    var headers = lines[0].split('\t');
    for (var h = 0; h < 5; h++) {
        var headerText = headers[h] || '';
        var width = '';
        if (h === 0) width = 'width: 50px;';
        else if (h === 1) width = 'width: 80px;';
        else if (h === 2) width = 'width: 90px;';
        else if (h === 4) width = 'width: 100px;';
        html += '<th class="border border-gray-600 px-2 py-2 text-left font-medium" style="' + width + '">' + escapeHtml(headerText) + '</th>';
    }
    html += '</tr></thead>';

    // 데이터 행
    html += '<tbody>';
    for (var i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        var cols = lines[i].split('\t');
        var rowClass = (i % 2 === 0) ? 'bg-gray-900' : 'bg-gray-850';
        
        // 유형에 따른 색상
        var typeText = (cols[1] || '').trim();
        var typeColorClass = 'text-gray-300';
        if (typeText === '통과') {
            typeColorClass = 'text-green-400';
        } else if (typeText.indexOf('왜곡') !== -1 || typeText.indexOf('붕괴') !== -1) {
            typeColorClass = 'text-yellow-400';
        } else if (typeText.indexOf('변경') !== -1 || typeText.indexOf('쌩뚱') !== -1) {
            typeColorClass = 'text-pink-400';
        }

        html += '<tr class="' + rowClass + ' text-gray-300">';
        for (var c = 0; c < 5; c++) {
            var cellText = cols[c] || '';
            var cellClass = '';
            if (c === 1) cellClass = typeColorClass + ' font-medium';
            if (c === 4) cellClass = 'text-cyan-400';
            html += '<td class="border border-gray-700 px-2 py-1.5 ' + cellClass + '">' + escapeHtml(cellText) + '</td>';
        }
        html += '</tr>';
    }
    html += '</tbody></table></div>';

    return html;
}

/* ======================================================
   DIFF 하이라이트 렌더링 (우측: 수정 반영)
====================================================== */
function renderRevisedWithDiff(originalScript, revisedScript) {
    if (!revisedScript) {
        return '<p class="text-gray-500 dark:text-gray-400">수정본 없음</p>';
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
            html += '<div class="bg-green-100 dark:bg-green-900/40 px-1 -mx-1 rounded">' + escapeHtml(revisedLine) + '</div>';
        } else if (revisedLine.trim() === '') {
            // 빈 줄
            html += '<div class="min-h-[1.25rem]">&nbsp;</div>';
        } else {
            // 변경 없는 라인
            html += '<div>' + escapeHtml(revisedLine) + '</div>';
        }
    }

    html += '</div>';
    return html;
}

/* ======================================================
   TAB SELECTION & RESULT DISPLAY
====================================================== */
window.selectAnalysisTab = function (tabId) {
    var tab = tabStates[tabId];
    window.AppState.currentSelectedTab = tabId;

    // 탭 하이라이트
    document.querySelectorAll('.tab-card').forEach(function (card) {
        card.classList.remove('border-indigo-500', 'dark:border-indigo-400');
        card.classList.add('border-gray-200', 'dark:border-gray-700');
    });
    var selectedCard = document.querySelector('.tab-card[data-tab-id="' + tabId + '"]');
    if (selectedCard) {
        selectedCard.classList.remove('border-gray-200', 'dark:border-gray-700');
        selectedCard.classList.add('border-indigo-500', 'dark:border-indigo-400');
    }

    var resultSection = document.getElementById('result-section');
    var resultTitle = document.getElementById('result-title');
    var resultText = document.getElementById('result-text');
    var revisedScript = document.getElementById('revised-script');
    var revisedTitle = document.getElementById('revised-title');

    if (!resultSection) return;

    if (resultTitle) resultTitle.textContent = '분석 결과: ' + tab.title;
    if (revisedTitle) revisedTitle.textContent = (tabId === 'stage1') ? '수정된 대본 (1차)' : '최종 수정 대본';

    var contentHtml = '';
    var revisedHtml = '';

    if (tab.status === 'success' && tab.resultText) {
        // 좌측: TSV 테이블로 렌더링
        contentHtml = renderAnalysisTable(tab.resultText);
        
        // 우측: diff 하이라이트로 렌더링
        revisedHtml = renderRevisedWithDiff(tab.originalScript, tab.revisedScript);

        resultSection.classList.remove('hidden');
    } else if (tab.status === 'error') {
        contentHtml = '<p class="text-red-500">오류: ' + escapeHtml(tab.errorMessage) + '</p>';
        revisedHtml = '<p class="text-gray-500">중단됨</p>';
        resultSection.classList.remove('hidden');
    } else if (tab.status === 'running') {
        contentHtml = '<p class="text-blue-500">분석 진행 중...</p>';
        revisedHtml = '<p class="text-gray-500">분석 중입니다.</p>';
        resultSection.classList.remove('hidden');
    } else {
        contentHtml = '<p class="text-gray-500 dark:text-gray-400">분석 대기 중</p>';
        revisedHtml = '<p class="text-gray-500 dark:text-gray-400">대기 중</p>';
        resultSection.classList.remove('hidden');
    }

    if (resultText) resultText.innerHTML = contentHtml;
    if (revisedScript) revisedScript.innerHTML = revisedHtml;

    updateDownloadButtonState(tabId);
};

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
function updateTabUI(tabId) {
    var tab = tabStates[tabId];
    var statusBadge = document.getElementById('status-' + tabId);
    var progressContainer = document.getElementById('progress-container-' + tabId);

    if (!statusBadge) return;

    if (tab.status === 'idle') {
        statusBadge.textContent = '대기';
        statusBadge.className = 'status-badge bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full';
    } else if (tab.status === 'running') {
        statusBadge.textContent = '분석중';
        statusBadge.className = 'status-badge bg-blue-500 text-white text-xs px-2 py-1 rounded-full';
    } else if (tab.status === 'success') {
        statusBadge.textContent = '완료';
        statusBadge.className = 'status-badge bg-green-500 text-white text-xs px-2 py-1 rounded-full';
    } else if (tab.status === 'error') {
        statusBadge.textContent = '실패';
        statusBadge.className = 'status-badge bg-red-500 text-white text-xs px-2 py-1 rounded-full';
    }

    if (progressContainer) {
        progressContainer.classList.toggle('hidden', tab.status !== 'running');
    }
}

function updateTabProgress(tabId, percent) {
    var tab = tabStates[tabId];
    tab.progress = percent;
    var bar = document.getElementById('progress-bar-' + tabId);
    var text = document.getElementById('progress-text-' + tabId);
    if (bar) bar.style.width = percent + '%';
    if (text) text.textContent = percent + '%';
}

function disableTabButton(tabId, disabled) {
    var btn = document.querySelector('.btn-analyze[data-tab-id="' + tabId + '"]');
    if (!btn) return;
    btn.disabled = disabled;
    if (disabled) {
        btn.classList.add('opacity-50', 'cursor-not-allowed');
        btn.classList.remove('bg-indigo-500', 'hover:bg-indigo-600');
        btn.classList.add('bg-gray-400');
    } else {
        btn.classList.remove('opacity-50', 'cursor-not-allowed');
        btn.classList.remove('bg-gray-400');
        btn.classList.add('bg-indigo-500', 'hover:bg-indigo-600');
    }
}

/* ======================================================
   OTHERS (Dark Mode, API Key, Download, Boot)
====================================================== */
function initDarkMode() {
    var toggle = document.getElementById('dark-mode-toggle');
    if (!toggle) return;
    var isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) document.documentElement.classList.add('dark');
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
    
    if (save) save.addEventListener('click', function () {
        if (input.value.trim()) {
            localStorage.setItem('GEMINI_API_KEY', input.value.trim());
            status.textContent = '설정됨';
            icon.textContent = '✅';
            panel.classList.add('hidden');
        }
    });
    
    if (del) del.addEventListener('click', function () {
        localStorage.removeItem('GEMINI_API_KEY');
        status.textContent = 'API 키 설정';
        icon.textContent = '🔑';
        panel.classList.add('hidden');
    });
}

function initScriptButtons() {
    var sample = document.getElementById('korea-senior-sample-btn');
    var clear = document.getElementById('korea-senior-clear-btn');
    var text = document.getElementById('korea-senior-script');

    if (sample && text) {
        sample.addEventListener('click', function () {
            text.value = '[제 1회 드라마 대본 / 씬1]\n\n나레이션:\n1995년 여름, 서울 강남의 한 아파트 단지.\n오랜만에 가족들이 한자리에 모였다.\n\n[씬 1. 서울 강남 아파트 거실 / 낮]\n\n(거실. 소파에 앉아 있는 할머니(75세, 김순자)와 손녀(20세, 이지은))\n\n지은: 할머니, 오늘 날씨 정말 좋죠?\n순자: 그러게. 이렇게 맑은 날은 오랜만이야.\n\n나레이션:\n두 사람은 따뜻한 햇살 아래에서 옛 이야기를 나누기 시작했다.';
            text.dispatchEvent(new Event('input'));
        });
    }
    if (clear && text) {
        clear.addEventListener('click', function () { 
            text.value = ''; 
            text.dispatchEvent(new Event('input')); 
        });
    }
}

function initDownloadButton() {
    var btn = document.getElementById('download-revised-btn');
    if (!btn) return;
    btn.addEventListener('click', function () {
        // stage2 결과만 다운로드 가능
        var tab = tabStates['stage2'];
        if (tab && tab.status === 'success' && tab.revisedScript) {
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
        } else {
            showNotification('2차 분석 완료 후 다운로드 가능합니다.', 'warning');
        }
    });
}

function updateDownloadButtonState(tabId) {
    var btn = document.getElementById('download-revised-btn');
    if (!btn) return;
    
    // stage2가 성공이고 revisedScript가 있을 때만 활성화
    var stage2Tab = tabStates['stage2'];
    var canDownload = (stage2Tab.status === 'success' && stage2Tab.revisedScript);
    
    btn.disabled = !canDownload;
    if (canDownload) {
        btn.classList.remove('opacity-50', 'cursor-not-allowed');
    } else {
        btn.classList.add('opacity-50', 'cursor-not-allowed');
    }
}

function initCharCounter() {
    var textarea = document.getElementById('korea-senior-script');
    var counter = document.getElementById('korea-char-counter');
    
    if (textarea && counter) {
        textarea.addEventListener('input', function () {
            var length = textarea.value.length;
            counter.textContent = length.toLocaleString() + '자 / 무제한';
        });
    }
}

document.addEventListener('DOMContentLoaded', function () {
    console.log('[BOOT] DOMContentLoaded');
    initDarkMode();
    initApiKeyUI();
    initScriptButtons();
    initFileUpload();
    initDownloadButton();
    initCharCounter();
});
