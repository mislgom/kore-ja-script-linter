/** ======================================================
 * KORE-JA SCRIPT LINTER - MAIN.JS
 * 2-Stage Pipeline Analysis System v3.0
 * Features: Pipeline Execution, Error Highlighting, Drag & Drop
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
        errorMessage: null
    };
});

/* ======================================================
   BOOT & ERROR HANDLING
====================================================== */
console.log('[BOOT] main.js loaded - v3.0 (Pipeline)');

/* [User Request] 내부 런타임 오류는 사용자에게 팝업으로 표시하지 않고 콘솔에만 기록 */
window.addEventListener('error', function (e) {
    // 주의: handleScriptError과 중복되지 않도록 단순 로깅만 수행
    console.warn('[RUNTIME WARN] JS 내부 오류 감지 (팝업 표시 안 함):', e.message);
    // e.preventDefault(); // 필요 시 기본 동작 방지 가능하나, 디버깅 위해 남김
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
        // 의존성 로드 실패는 명확한 조치가 필요하므로 예외적으로 알림
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

    // 1. Drag & Drop Events
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

    // 2. Button & File Input Events
    if (uploadBtn && fileInput) {
        uploadBtn.addEventListener('click', function () {
            fileInput.click();
        });

        fileInput.addEventListener('change', function (e) {
            handleFiles(this.files);
            this.value = '';
        });
    }

    // 3. File Processing Logic
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
   PROMPT GENERATION (MERGED)
====================================================== */
function generatePromptForTab(promptKey, script) {
    if (promptKey === 'stage1') {
        return `너는 “한국 시니어 낭독용 대본 1차 검수 전문가”다.
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

[analysis 작성 규칙]
- 항목별로 구분해 작성
- 문제 라인은 반드시 아래 토큰 중 하나 포함:
  오류:, 불일치:, 주의:, 경고:, ❌
- 문제 없으면 “문제 없음” 명시

[출력(JSON만)]
{"analysis":"...","revised":"..."}

[대본]
${script}`;
    } else if (promptKey === 'stage2') {
        return `너는 “한국 시니어 낭독용 대본 2차 심화 검수 전문가”다.
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

[analysis 작성 규칙]
- 섹션:
  (1) 시간/장소 왜곡
  (2) 몰입/이탈 리스크
  (3) 핵심 수정 요약
- 문제 라인은 오류/불일치/주의/경고/❌ 중 하나 포함

[출력(JSON만)]
{"analysis":"...","revised":"..."}

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

    // 1. 상태 검증
    if (tab.status === 'running') {
        showNotification(tab.title + ' 분석이 이미 실행 중입니다.', 'warning');
        return;
    }

    // 2. 대본 확인 (Stage 1인 경우 Textarea에서, Stage 2는 Stage 1 결과에서)
    var scriptToAnalyze = null;
    if (tabId === 'stage1') {
        var scriptTextarea = document.getElementById('korea-senior-script');
        if (!scriptTextarea || !scriptTextarea.value.trim()) {
            showNotification('대본을 입력해주세요.', 'warning');
            return;
        }
        scriptToAnalyze = scriptTextarea.value;
    } else if (tabId === 'stage2') {
        // Stage 2: Stage 1의 결과물(revisedScript)이 존재하는지 확인
        var stage1Tab = tabStates['stage1'];
        if (stage1Tab.status !== 'success' || !stage1Tab.revisedScript) {
            showNotification('1차 분석을 먼저 완료해야 합니다.', 'warning');
            return;
        }
        scriptToAnalyze = stage1Tab.revisedScript;
    }

    // 3. 의존성/키 체크
    if (!checkDependencyBeforeAction('AI 분석')) return;
    var apiKey = localStorage.getItem('GEMINI_API_KEY');
    if (!apiKey) {
        showNotification('API 키를 먼저 설정해주세요.', 'warning');
        return;
    }

    // --- PIPELINE START ---
    console.log('[PIPELINE] Starting Analysis: ' + tabId);

    // [New Feature] 1차 재분석 시 2차 결과 초기화 로직
    if (tabId === 'stage1') {
        var stage2Tab = tabStates['stage2'];
        if (stage2Tab.status !== 'idle') {
            console.log('[PIPELINE] 1차 재분석으로 인한 2차 결과 초기화');
            stage2Tab.status = 'idle';
            stage2Tab.resultText = null;
            stage2Tab.revisedScript = null;
            stage2Tab.errorMessage = null;
            stage2Tab.progress = 0;
            updateTabUI('stage2');
            disableTabButton('stage2', true); // 2차 버튼 다시 비활성화

            // 결과창도 초기화
            var resultSection = document.getElementById('result-section');
            if (resultSection) resultSection.classList.add('hidden');
        }
    }

    executePipelineNode(tabId, scriptToAnalyze);
};

// 파이프라인 노드 실행 함수
function executePipelineNode(tabId, inputScript) {
    var tab = tabStates[tabId];

    // 상태 초기화
    tab.status = 'running';
    tab.progress = 0;
    tab.resultText = null;
    tab.revisedScript = null;
    tab.errorMessage = null;

    updateTabUI(tabId);
    disableTabButton(tabId, true); // 실행 중 버튼 비활성

    // [UX Improvement] 분석 시작 시 결과창에 '진행 중' 표시
    selectAnalysisTab(tabId);

    // 진행도 시뮬레이션
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
            maxOutputTokens: 4096
        })
            .then(function (response) {
                updateTabProgress(tabId, 80);

                // 결과 파싱
                var parsed = parseAnalysisResult(response);
                tab.resultText = parsed.analysis || '분석 결과가 없습니다.';
                tab.revisedScript = parsed.revised || inputScript; // 수정본 없으면 원본 유지
                tab.status = 'success';
                tab.progress = 100;

                updateTabUI(tabId);
                updateTabProgress(tabId, 100);

                // 결과 표시
                selectAnalysisTab(tabId);
                showNotification(tab.title + ' 완료', 'success');

                // --- PIPELINE LOGIC UPDATE (Manual Trigger) ---
                if (tabId === 'stage1') {
                    // [Change] 1차 완료 시 2차 자동 실행 제거 -> 2차 버튼 활성화
                    console.log('[PIPELINE] Stage 1 Complete. Enabling Stage 2 Button.');

                    disableTabButton('stage1', false); // 1차 버튼 다시 활성화 (재분석 가능)

                    // 2차 버튼 활성화 (이제 클릭 가능)
                    disableTabButton('stage2', false);
                    showNotification('1차 분석 완료. 2차 분석을 시작할 수 있습니다.', 'info');

                } else if (tabId === 'stage2') {
                    // 2차 완료
                    console.log('[PIPELINE] Stage 2 Complete.');
                    showNotification('모든 분석이 완료되었습니다.', 'success');
                    disableTabButton('stage2', false); // 2차 버튼 다시 활성화 (재분석 가능)
                }

            })
            .catch(function (error) {
                handleAnalysisError(tabId, error);
                // 실패 시 버튼 다시 활성화
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

    // 파이프라인 중단됨 (자동 재시도 없음)
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
   TAB SELECTION & RESULT DISPLAY (HIGHLIGHTING)
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

    // 결과 섹션
    var resultSection = document.getElementById('result-section');
    var resultTitle = document.getElementById('result-title');
    var resultText = document.getElementById('result-text');
    var revisedScript = document.getElementById('revised-script');
    var revisedTitle = document.getElementById('revised-title');

    if (!resultSection) return;

    if (resultTitle) resultTitle.textContent = '분석 결과: ' + tab.title;
    if (revisedTitle) revisedTitle.textContent = (tabId === 'stage1') ? '수정된 대본 (1차 미리보기)' : '최종 수정 대본';

    var contentHtml = '';
    var revisedHtml = '';

    if (tab.status === 'success' && tab.resultText) {
        contentHtml = formatResultTextWithHighlight(tab.resultText);
        revisedHtml = formatResultTextWithHighlight(tab.revisedScript || '수정본 없음'); // 대본은 하이라이트 없이 포맷팅만 사용하거나 동일 로직 사용 가능. 보통 대본은 하이라이트 안함.
        if (tab.revisedScript) revisedHtml = formatRevisedScript(tab.revisedScript);

        resultSection.classList.remove('hidden');
    } else if (tab.status === 'error') {
        contentHtml = '<p class="text-red-600">❌ 오류: ' + escapeHtml(tab.errorMessage) + '</p>';
        revisedHtml = '<p class="text-gray-500">중단됨</p>';
        resultSection.classList.remove('hidden');
    } else if (tab.status === 'running') {
        contentHtml = '<p class="text-blue-600">⏳ 분석 진행 중...</p>';
        revisedHtml = '<p class="text-gray-500">분석 중입니다.</p>';
        resultSection.classList.remove('hidden');
    } else {
        contentHtml = '<p class="text-gray-500">분석 대기 중</p>';
        revisedHtml = '<p class="text-gray-500">대기 중</p>';
        resultSection.classList.remove('hidden');
    }

    if (resultText) resultText.innerHTML = contentHtml;
    if (revisedScript) revisedScript.innerHTML = revisedHtml;

    updateDownloadButtonState(tabId);
};

// [오류 강조 기능]
function formatResultTextWithHighlight(text) {
    if (!text) return '<p class="text-gray-500">내용 없음</p>';

    var safeText = escapeHtml(text);
    var lines = safeText.split('\n');
    var html = '';

    // 키워드 정규식
    var errorRegex = /(오류|불일치|수정|삭제|주의|경고|❌|Problem|Error|Warning)/;

    lines.forEach(function (line) {
        if (errorRegex.test(line)) {
            // 키워드가 있는 라인 전체 강조
            html += '<div class="mb-1 p-1 rounded bg-red-50 dark:bg-red-900/30 text-xs sm:text-sm text-red-700 dark:text-red-300 font-semibold border-l-4 border-red-500">' + line + '</div>';
        } else {
            // 일반 텍스트
            html += '<div class="min-h-[1rem]">' + line + '</div>';
        }
    });

    return html;
}

function formatRevisedScript(script) {
    if (!script) return '<p class="text-gray-500">수정본 없음</p>';
    return '<div class="whitespace-pre-wrap font-mono text-sm leading-relaxed">' + escapeHtml(script) + '</div>';
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
function updateTabUI(tabId) {
    var tab = tabStates[tabId];
    var statusBadge = document.getElementById('status-' + tabId);
    var progressContainer = document.getElementById('progress-container-' + tabId);

    if (!statusBadge) return;

    // Badge
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

    // Progress
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
    if (disabled) btn.classList.add('opacity-50', 'cursor-not-allowed');
    else btn.classList.remove('opacity-50', 'cursor-not-allowed');
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

    toggle.addEventListener('click', function () { panel.classList.toggle('hidden'); if (!panel.classList.contains('hidden')) input.value = localStorage.getItem('GEMINI_API_KEY') || ''; });
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
        clear.addEventListener('click', function () { text.value = ''; text.dispatchEvent(new Event('input')); });
    }
}

function initDownloadButton() {
    var btn = document.getElementById('download-revised-btn');
    if (!btn) return;
    btn.addEventListener('click', function () {
        var id = window.AppState.currentSelectedTab;
        if (!id) return;
        var tab = tabStates[id];
        if (tab && tab.revisedScript) {
            var blob = new Blob([tab.revisedScript], { type: 'text/plain;charset=utf-8' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = tab.title.replace(/\s/g, '_') + '_' + new Date().toISOString().slice(0, 10) + '.txt';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    });
}

function updateDownloadButtonState(tabId) {
    var btn = document.getElementById('download-revised-btn');
    var tab = tabStates[tabId];
    if (btn && tab) btn.disabled = !(tab.status === 'success' && tab.revisedScript);
}

document.addEventListener('DOMContentLoaded', function () {
    console.log('[BOOT] DOMContentLoaded');
    initDarkMode();
    initApiKeyUI();
    initScriptButtons();
    initFileUpload();
    initDownloadButton();
});
