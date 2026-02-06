/**
 * MISLGOM 대본 검수 자동 프로그램
 * main.js v4.9 - Vertex AI + Gemini 3 Flash
 * 25가지 오류 유형 검수, 4-패널 레이아웃, 새 점수 체계
 * + 3차 분석 (숏츠 제작) 추가
 */

console.log('🚀 main.js v4.9 (Vertex AI + Gemini 3 Flash + 숏츠 제작) 로드됨');

// ===================== 전역 상태 =====================
const state = {
    stage1: {
        originalScript: '',
        analysis: null,
        revisedScript: '',
        scores: null,
        revisionCount: 0
    },
    stage2: {
        originalScript: '',
        analysis: null,
        revisedScript: '',
        scores: null,
        revisionCount: 0
    },
    stage3: {
        originalScript: '',
        analysis: null,
        shortsScript: '',
        videoPrompts: [],
        revisionCount: 0
    }
};

let currentAbortController = null;

// ===================== DOM 로드 후 초기화 =====================
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOMContentLoaded 발생');
    initApp();
});

function initApp() {
    console.log('🎬 앱 초기화 시작');
    initDarkMode();
    initApiKeyPanel();
    initTextArea();
    initFileUpload();
    initDragAndDrop();
    initClearButton();
    initAnalysisButtons();
    initDownloadButton();
    initStage3UI();
    initStage3Button();
    console.log('✅ main.js v4.9 초기화 완료');
}

// ===================== 다크모드 =====================
function initDarkMode() {
    const btn = document.getElementById('btn-dark-mode');
    const saved = localStorage.getItem('darkMode');
    if (saved === 'true') {
        document.body.classList.add('dark-mode');
        btn.textContent = '☀️ 라이트모드';
    }
    btn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDark);
        btn.textContent = isDark ? '☀️ 라이트모드' : '🌙 다크모드';
    });
}

// ===================== API 키 관리 =====================
function initApiKeyPanel() {
    const btn = document.getElementById('btn-api-settings');
    const panel = document.getElementById('api-key-panel');
    const input = document.getElementById('api-key-input');
    const saveBtn = document.getElementById('btn-save-api-key');
    const closeBtn = document.getElementById('btn-close-api-panel');

    const savedKey = localStorage.getItem('GEMINI_API_KEY');
    if (savedKey) {
        input.value = savedKey;
    }

    btn.addEventListener('click', () => {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    });

    saveBtn.addEventListener('click', () => {
        const key = input.value.trim();
        if (key) {
            localStorage.setItem('GEMINI_API_KEY', key);
            alert('API 키가 저장되었습니다.');
            panel.style.display = 'none';
        } else {
            alert('API 키를 입력해주세요.');
        }
    });

    closeBtn.addEventListener('click', () => {
        panel.style.display = 'none';
    });
}

// ===================== 텍스트 영역 =====================
function initTextArea() {
    const textarea = document.getElementById('original-script');
    const charCount = document.getElementById('char-count');

    textarea.addEventListener('input', () => {
        charCount.textContent = textarea.value.length;
    });
}

// ===================== 지우기 버튼 =====================
function initClearButton() {
    const clearBtn = document.getElementById('btn-clear-script');
    const textarea = document.getElementById('original-script');
    const charCount = document.getElementById('char-count');
    const fileNameDisplay = document.getElementById('file-name-display');

    clearBtn.addEventListener('click', () => {
        textarea.value = '';
        charCount.textContent = '0';
        fileNameDisplay.textContent = '';
        console.log('🗑️ 대본 내용 삭제됨');
    });

    console.log('✅ 지우기 버튼 초기화됨');
}

// ===================== 파일 업로드 =====================
function initFileUpload() {
    const fileInput = document.getElementById('file-input');
    const fileNameDisplay = document.getElementById('file-name-display');

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.name.endsWith('.txt')) {
                handleFile(file);
                fileNameDisplay.textContent = `📎 ${file.name}`;
            } else {
                alert('TXT 파일만 업로드 가능합니다.');
            }
        }
    });

    console.log('✅ 파일 업로드 초기화됨');
}

// ===================== 드래그 앤 드롭 =====================
function initDragAndDrop() {
    const dropZone = document.getElementById('drop-zone');
    const fileNameDisplay = document.getElementById('file-name-display');

    dropZone.addEventListener('dragenter', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!dropZone.contains(e.relatedTarget)) {
            dropZone.classList.remove('drag-over');
        }
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('drag-over');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (file.name.endsWith('.txt')) {
                handleFile(file);
                fileNameDisplay.textContent = `📎 ${file.name}`;
                console.log('📄 드래그로 파일 업로드됨:', file.name);
            } else {
                alert('TXT 파일만 업로드 가능합니다.');
            }
        }
    });

    console.log('✅ 드래그 앤 드롭 초기화됨');
}

function handleFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const textarea = document.getElementById('original-script');
        textarea.value = e.target.result;
        document.getElementById('char-count').textContent = textarea.value.length;
    };
    reader.readAsText(file);
}

// ===================== 분석 버튼 =====================
function initAnalysisButtons() {
    const btn1 = document.getElementById('btn-analyze-stage1');
    const btn2 = document.getElementById('btn-analyze-stage2');
    const stopBtn = document.getElementById('btn-stop-analysis');

    btn1.addEventListener('click', () => startAnalysis('stage1'));
    btn2.addEventListener('click', () => startAnalysis('stage2'));

    stopBtn.addEventListener('click', () => {
        if (currentAbortController) {
            currentAbortController.abort();
            currentAbortController = null;
            updateProgress(0, '분석이 중지되었습니다.');
            stopBtn.disabled = true;
            alert('분석이 중지되었습니다.');
            
            setTimeout(() => {
                document.getElementById('progress-container').style.display = 'none';
            }, 1000);
        }
    });

    console.log('✅ 1차 분석 버튼 연결됨');
    console.log('✅ 2차 분석 버튼 연결됨');
    console.log('✅ 중지 버튼 연결됨');
}

// ===================== 분석 실행 (1차, 2차) =====================
async function startAnalysis(stage) {
    console.log(`🔍 ${stage} 분석 시작`);

    const apiKey = localStorage.getItem('GEMINI_API_KEY');
    if (!apiKey) {
        alert('API 키를 먼저 설정해주세요.');
        return;
    }

    let scriptText;
    if (stage === 'stage1') {
        scriptText = document.getElementById('original-script').value.trim();
        if (!scriptText) {
            alert('분석할 대본을 입력해주세요.');
            return;
        }
        state.stage1.originalScript = scriptText;
    } else {
        scriptText = state.stage1.revisedScript;
        if (!scriptText) {
            alert('1차 분석을 먼저 완료해주세요.');
            return;
        }
        state.stage2.originalScript = scriptText;
    }

    const progressContainer = document.getElementById('progress-container');
    const stopBtn = document.getElementById('btn-stop-analysis');
    progressContainer.style.display = 'block';
    stopBtn.disabled = false;
    updateProgress(10, 'AI 분석 준비 중...');

    currentAbortController = new AbortController();
    const signal = currentAbortController.signal;

    try {
        updateProgress(20, '프롬프트 생성 중...');
        const prompt = generatePrompt(scriptText);
        console.log('📤 프롬프트 생성 완료, 길이:', prompt.length);

        updateProgress(40, 'AI 분석 중... (최대 2분 소요)');
        const response = await callGeminiAPI(prompt, signal);
        console.log('📥 API 응답 수신');

        updateProgress(70, '결과 파싱 중...');
        const parsed = parseAnalysisResult(response);
        console.log('✅ 파싱 완료');

        const verified = verifyAndApplyCorrections(parsed);

        updateProgress(90, '결과 렌더링 중...');
        renderResults(verified, stage);

        if (stage === 'stage1') {
            state.stage1.analysis = verified.analysis;
            state.stage1.revisedScript = verified.revisedScript;
            state.stage1.scores = verified.scores;
            state.stage1.revisionCount = verified.analysis ? verified.analysis.length : 0;
            document.getElementById('btn-analyze-stage2').disabled = false;
        } else {
            state.stage2.analysis = verified.analysis;
            state.stage2.revisedScript = verified.revisedScript;
            state.stage2.scores = verified.scores;
            state.stage2.revisionCount = verified.analysis ? verified.analysis.length : 0;
            document.getElementById('btn-download').disabled = false;
            renderScores(verified.scores);
            
            // 2차 분석 완료 시 3차 분석 버튼 활성화
            const btn3 = document.getElementById('btn-analyze-stage3');
            if (btn3) {
                btn3.disabled = false;
            }
        }

        updateProgress(100, '분석 완료!');
        console.log(`✅ ${stage} 분석 완료`);

    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('⏹ 분석이 사용자에 의해 중지됨');
            updateProgress(0, '분석이 중지되었습니다.');
        } else {
            console.error('❌ 분석 오류:', error);
            alert('분석 중 오류가 발생했습니다: ' + error.message);
            updateProgress(0, '오류 발생');
        }
    } finally {
        stopBtn.disabled = true;
        currentAbortController = null;
        setTimeout(() => {
            progressContainer.style.display = 'none';
        }, 2000);
    }
}

// ===================== 진행률 업데이트 =====================
function updateProgress(percent, text) {
    const bar = document.getElementById('progress-bar');
    const textEl = document.getElementById('progress-text');
    bar.style.width = percent + '%';
    textEl.textContent = text;
}

// ===================== 프롬프트 생성 (1차, 2차용) =====================
function generatePrompt(scriptText) {
    return `당신은 한국어 대본 검수 전문가입니다. 아래 규칙을 정확히 따라 분석하세요.

[규칙 1] 시대배경 검사
대본에 조선시대/사극 표현(~하옵니다, ~소서, 전하, 마마, 나리 등)이 있으면 시대극입니다.
시대극에서 다음 현대어는 반드시 오류로 처리:
- 펜 → 붓
- 노트 → 서책
- 회사 → 상단
- 학교 → 서당
- 선생님 → 훈장
- 경찰 → 포졸
- 병원 → 의원
- 의사 → 의원

[규칙 2] 필수 검사 항목 (모든 대본)
- 맞춤법 오류
- 띄어쓰기 오류
- 문장부호 오류 (마침표, 쉼표 누락)
- 어색한 표현
- 중복 표현

[규칙 3] 수정 반영 필수
analysis의 모든 original → suggestion 변경사항은 revisedScript에 100% 반영해야 합니다.
절대로 누락하지 마세요.

[규칙 4] 줄맞춤
revisedScript의 각 줄은 공백 포함 17자 이내로 작성하세요.

[규칙 5] 전체 대본 포함
revisedScript에는 전체 대본을 포함하세요. 생략 금지.

[대본]
${scriptText}

[출력 형식]
반드시 아래 형식의 유효한 JSON으로만 응답하세요:
{"analysis":[{"line":1,"errorType":"오류유형","original":"원본","suggestion":"수정","reason":"이유"}],"revisedScript":"수정된 전체 대본","scores":{"entertainment":85,"seniorTarget":90,"storyFlow":80,"bounceRate":15}}`;
}

// ===================== Gemini API 호출 =====================
async function callGeminiAPI(prompt, signal) {
    const apiKey = localStorage.getItem('GEMINI_API_KEY');
    
    const endpoint = `https://aiplatform.googleapis.com/v1/projects/gen-lang-client-0624453722/locations/global/publishers/google/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{
                role: 'user',
                parts: [{ text: prompt }]
            }],
            generationConfig: {
                temperature: 0,
                topP: 1,
                topK: 1,
                maxOutputTokens: 65536
            }
        }),
        signal: signal
    });

    if (!response.ok) {
        let errorMsg = 'API 오류: ' + response.status;
        try {
            const errData = await response.json();
            errorMsg = errData.error?.message || errorMsg;
        } catch (e) {}
        throw new Error(errorMsg);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
        throw new Error('API 응답이 비어있습니다.');
    }

    return text;
}

// ===================== 결과 파싱 =====================
function parseAnalysisResult(responseText) {
    console.log('📝 파싱 시작, 원본 길이:', responseText.length);

    let jsonStr = responseText.trim();
    jsonStr = jsonStr.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

    if (!jsonStr.startsWith('{')) {
        const firstBrace = jsonStr.indexOf('{');
        if (firstBrace !== -1) {
            jsonStr = jsonStr.substring(firstBrace);
        } else if (jsonStr.startsWith('"analysis"')) {
            jsonStr = '{' + jsonStr;
        }
    }

    const lastBrace = jsonStr.lastIndexOf('}');
    if (lastBrace !== -1) {
        jsonStr = jsonStr.substring(0, lastBrace + 1);
    }

    let openBraces = (jsonStr.match(/{/g) || []).length;
    let closeBraces = (jsonStr.match(/}/g) || []).length;
    while (openBraces > closeBraces) {
        jsonStr += '}';
        closeBraces++;
    }

    let openBrackets = (jsonStr.match(/\[/g) || []).length;
    let closeBrackets = (jsonStr.match(/\]/g) || []).length;
    while (openBrackets > closeBrackets) {
        const lastBraceIdx = jsonStr.lastIndexOf('}');
        jsonStr = jsonStr.substring(0, lastBraceIdx) + ']' + jsonStr.substring(lastBraceIdx);
        closeBrackets++;
    }

    jsonStr = jsonStr.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');

    try {
        const parsed = JSON.parse(jsonStr);
        console.log('✅ JSON 파싱 성공');
        return {
            analysis: parsed.analysis || [],
            revisedScript: parsed.revisedScript || '',
            scores: parsed.scores || {},
            parseError: null
        };
    } catch (e) {
        console.error('❌ JSON 파싱 실패:', e.message);
        return extractPartialData(jsonStr, responseText);
    }
}

// ===================== 부분 데이터 추출 =====================
function extractPartialData(jsonStr, originalText) {
    let analysis = [];
    let revisedScript = '';
    let scores = {};

    try {
        const analysisMatch = jsonStr.match(/"analysis"\s*:\s*\[([\s\S]*?)\](?=\s*,?\s*"revisedScript")/);
        if (analysisMatch) {
            analysis = JSON.parse('[' + analysisMatch[1] + ']');
            console.log('✅ analysis 추출 성공:', analysis.length);
        }
    } catch (e) {}

    try {
        const scriptMatch = jsonStr.match(/"revisedScript"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"scores"|"\s*})/);
        if (scriptMatch) {
            revisedScript = scriptMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
            console.log('✅ revisedScript 추출 성공:', revisedScript.length);
        }
    } catch (e) {}

    try {
        const scoresMatch = jsonStr.match(/"scores"\s*:\s*(\{[^}]+\})/);
        if (scoresMatch) {
            scores = JSON.parse(scoresMatch[1]);
            console.log('✅ scores 추출 성공');
        }
    } catch (e) {}

    if (analysis.length > 0 || revisedScript.length > 0) {
        return { analysis, revisedScript, scores, parseError: null };
    }

    return { analysis: [], revisedScript: originalText, scores: {}, parseError: '파싱 실패' };
}

// ===================== 수정 반영 검증 및 강제 적용 =====================
function verifyAndApplyCorrections(parsed) {
    if (!parsed.analysis || parsed.analysis.length === 0) {
        return parsed;
    }

    let revisedScript = parsed.revisedScript;
    let appliedCount = 0;
    let missingCount = 0;

    parsed.analysis.forEach((item, index) => {
        if (item.original && item.suggestion) {
            if (revisedScript.includes(item.suggestion)) {
                appliedCount++;
            } else if (revisedScript.includes(item.original)) {
                revisedScript = revisedScript.replace(item.original, item.suggestion);
                appliedCount++;
                missingCount++;
                console.log(`⚠️ 누락된 수정 강제 적용: "${item.original}" → "${item.suggestion}"`);
            }
        }
    });

    console.log(`✅ 수정 반영 검증: ${appliedCount}/${parsed.analysis.length}건 적용, ${missingCount}건 강제 적용`);

    return {
        analysis: parsed.analysis,
        revisedScript: revisedScript,
        scores: parsed.scores,
        parseError: parsed.parseError
    };
}

// ===================== 결과 렌더링 =====================
function renderResults(parsed, stage) {
    const analysisContainer = document.getElementById(`analysis-${stage}`);
    const revisedContainer = document.getElementById(`revised-${stage}`);
    const countSpan = document.getElementById(`revision-count-${stage}`);

    renderAnalysisTable(parsed.analysis, parsed.parseError, stage, analysisContainer);
    renderFullScriptWithHighlight(parsed.revisedScript, parsed.analysis, revisedContainer);

    const revisionCount = parsed.analysis ? parsed.analysis.length : 0;
    countSpan.textContent = revisionCount > 0 ? `(${revisionCount}건 수정)` : '';
}

// ===================== 분석 테이블 렌더링 =====================
function renderAnalysisTable(analysis, parseError, stage, container) {
    if (parseError) {
        container.innerHTML = `<p class="error">파싱 오류: ${parseError}</p>`;
        return;
    }

    if (!analysis || analysis.length === 0) {
        container.innerHTML = '<p class="success">✅ 발견된 오류가 없습니다.</p>';
        return;
    }

    const targetContainerId = stage === 'stage1' ? 'revised-stage1' : 'revised-stage2';

    let html = '<p class="click-hint">💡 각 행을 클릭하면 수정된 부분으로 이동합니다</p>';
    html += '<div class="table-scroll-wrapper"><table class="analysis-table"><thead><tr><th>줄</th><th>유형</th><th>원본</th><th>수정</th><th>이유</th></tr></thead><tbody>';

    analysis.forEach((item, index) => {
        html += `<tr class="clickable-row" 
            data-target-container="${targetContainerId}" 
            data-search-text="${escapeHtml(item.suggestion || item.original)}"
            data-line="${item.line}"
            onclick="scrollToHighlight(this)">
            <td>${item.line || '-'}</td>
            <td>${escapeHtml(item.errorType || '-')}</td>
            <td>${escapeHtml(item.original || '-')}</td>
            <td>${escapeHtml(item.suggestion || '-')}</td>
            <td>${escapeHtml(item.reason || '-')}</td>
        </tr>`;
    });

    html += '</tbody></table></div>';
    container.innerHTML = html;
}

// ===================== 클릭 시 해당 위치로 스크롤 =====================
function scrollToHighlight(row) {
    const targetContainerId = row.getAttribute('data-target-container');
    const searchText = row.getAttribute('data-search-text');
    const container = document.getElementById(targetContainerId);

    if (!container) return;

    const scrollWrapper = container.querySelector('.script-scroll-wrapper');
    const highlights = container.querySelectorAll('.changed-text');
    let targetElement = null;

    highlights.forEach(el => {
        if (el.textContent.includes(searchText) || searchText.includes(el.textContent)) {
            targetElement = el;
        }
    });

    if (!targetElement && highlights.length > 0) {
        const lineIndex = parseInt(row.getAttribute('data-line')) - 1;
        targetElement = highlights[Math.min(lineIndex, highlights.length - 1)] || highlights[0];
    }

    if (targetElement) {
        container.querySelectorAll('.highlight-flash').forEach(el => {
            el.classList.remove('highlight-flash');
        });

        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetElement.classList.add('highlight-flash');

        setTimeout(() => {
            targetElement.classList.remove('highlight-flash');
        }, 1500);
    } else if (scrollWrapper) {
        scrollWrapper.scrollTop = 0;
    }
}

// ===================== 수정본 렌더링 =====================
function renderFullScriptWithHighlight(revisedScript, analysis, container) {
    if (!revisedScript) {
        container.innerHTML = '<p class="placeholder">수정된 내용이 없습니다.</p>';
        return;
    }

    const suggestions = new Set();
    if (analysis && analysis.length > 0) {
        analysis.forEach(item => {
            if (item.suggestion && item.suggestion.trim()) {
                suggestions.add(item.suggestion.trim());
            }
        });
    }

    const lines = revisedScript.split('\n');
    let html = '<div class="script-scroll-wrapper"><div class="revised-script">';

    lines.forEach((line, index) => {
        let processedLine = escapeHtml(line);
        let hasHighlight = false;

        suggestions.forEach(suggestion => {
            const escapedSuggestion = escapeHtml(suggestion);
            if (processedLine.includes(escapedSuggestion)) {
                processedLine = processedLine.replace(
                    escapedSuggestion,
                    `<span class="changed-text">${escapedSuggestion}</span>`
                );
                hasHighlight = true;
            }
        });

        if (hasHighlight) {
            html += `<p class="line-revised" data-line="${index + 1}">${processedLine}</p>`;
        } else {
            html += `<p class="line-unchanged">${processedLine || '&nbsp;'}</p>`;
        }
    });

    html += '</div></div>';
    container.innerHTML = html;
}

// ===================== 점수 렌더링 =====================
function renderScores(scores) {
    const container = document.getElementById('score-display');

    if (!scores || Object.keys(scores).length === 0) {
        container.innerHTML = '<p class="placeholder">점수 정보가 없습니다.</p>';
        return;
    }

    const entertainment = scores.entertainment || 0;
    const seniorTarget = scores.seniorTarget || 0;
    const storyFlow = scores.storyFlow || 0;
    const bounceRate = scores.bounceRate || 0;
    
    const bounceScore = 100 - bounceRate;
    const average = Math.round((entertainment + seniorTarget + storyFlow + bounceScore) / 4);
    const isPass = average >= 95;

    const getScoreClass = (score) => {
        if (score >= 95) return 'score-good';
        if (score >= 80) return 'score-warning';
        return 'score-danger';
    };

    let html = '<div class="score-grid">';

    html += `<div class="score-card ${getScoreClass(entertainment)}">
        <div class="score-value">${entertainment}</div>
        <div class="score-label">재미요소</div>
    </div>`;

    html += `<div class="score-card ${getScoreClass(seniorTarget)}">
        <div class="score-value">${seniorTarget}</div>
        <div class="score-label">시니어 타겟</div>
    </div>`;

    html += `<div class="score-card ${getScoreClass(storyFlow)}">
        <div class="score-value">${storyFlow}</div>
        <div class="score-label">이야기 흐름</div>
    </div>`;

    html += `<div class="score-card ${getScoreClass(bounceScore)}">
        <div class="score-value">${bounceScore}</div>
        <div class="score-label">시청자 이탈</div>
    </div>`;

    html += `<div class="score-card final-score ${isPass ? '' : 'fail'}">
        <div class="score-value">${average}</div>
        <div class="score-label">최종 점수</div>
        <div class="pass-badge ${isPass ? 'pass' : 'fail'}">${isPass ? '✅ 합격' : '❌ 불합격'}</div>
    </div>`;

    html += '</div>';
    container.innerHTML = html;
}

// ===================== 다운로드 =====================
function initDownloadButton() {
    const btn = document.getElementById('btn-download');
    btn.addEventListener('click', () => {
        const finalScript = state.stage2.revisedScript || state.stage1.revisedScript;
        if (!finalScript) {
            alert('다운로드할 수정본이 없습니다.');
            return;
        }

        const blob = new Blob([finalScript], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'MISLGOM_최종수정본.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
}

// ===================== 3차 분석 UI 초기화 =====================
function initStage3UI() {
    const scoreDisplay = document.getElementById('score-display');
    if (!scoreDisplay) {
        console.log('⚠️ score-display 요소를 찾을 수 없음');
        return;
    }

    // 3차 분석 섹션이 이미 있는지 확인
    if (document.getElementById('stage3-section')) {
        console.log('✅ 3차 분석 UI 이미 존재');
        return;
    }

    // 3차 분석 섹션 HTML 생성
    const stage3HTML = `
    <div id="stage3-section" class="stage3-section" style="margin-top: 30px; display: none;">
        <div style="text-align: center; margin-bottom: 20px;">
            <button id="btn-analyze-stage3" class="btn btn-primary" disabled style="background: linear-gradient(135deg, #ff6b6b, #ee5a24); padding: 12px 30px; font-size: 16px; font-weight: bold;">
                🎬 3차 분석 (숏츠 제작) 시작
            </button>
        </div>
        
        <div id="stage3-progress" style="display: none; margin-bottom: 20px;">
            <div class="progress-container">
                <div id="stage3-progress-bar" class="progress-bar" style="width: 0%;"></div>
            </div>
            <p id="stage3-progress-text" style="text-align: center; margin-top: 10px;">준비 중...</p>
        </div>

        <div id="stage3-results" style="display: none;">
            <!-- 숏츠 대본 영역 -->
            <div class="panel" style="margin-bottom: 20px;">
                <div class="panel-header">
                    <span>🎬 숏츠 대본 (1분 미만)</span>
                </div>
                <div id="shorts-script-container" class="panel-content" style="min-height: 150px; max-height: 400px; overflow-y: auto; padding: 15px; background: #1a1a2e; border-radius: 8px;">
                    <p class="placeholder">3차 분석을 시작하면 숏츠 대본이 표시됩니다.</p>
                </div>
            </div>

            <!-- 영상화 프롬프트 영역 -->
            <div class="panel">
                <div class="panel-header">
                    <span>🎥 영상화 프롬프트 (컷 단위)</span>
                </div>
                <div id="video-prompts-container" class="panel-content" style="min-height: 200px; max-height: 600px; overflow-y: auto; padding: 15px; background: #1a1a2e; border-radius: 8px;">
                    <p class="placeholder">3차 분석을 시작하면 영상화 프롬프트가 표시됩니다.</p>
                </div>
            </div>
        </div>
    </div>
    `;

    // score-display 바로 다음에 삽입
    scoreDisplay.insertAdjacentHTML('afterend', stage3HTML);
    console.log('✅ 3차 분석 UI 생성 완료');
}

// ===================== 3차 분석 버튼 초기화 =====================
function initStage3Button() {
    // DOM이 준비된 후 버튼 이벤트 연결
    setTimeout(() => {
        const btn3 = document.getElementById('btn-analyze-stage3');
        if (btn3) {
            btn3.addEventListener('click', () => startStage3Analysis());
            console.log('✅ 3차 분석 버튼 연결됨');
        }
    }, 100);
}

// ===================== 3차 분석 실행 =====================
async function startStage3Analysis() {
    console.log('🎬 3차 분석 (숏츠 제작) 시작');

    const apiKey = localStorage.getItem('GEMINI_API_KEY');
    if (!apiKey) {
        alert('API 키를 먼저 설정해주세요.');
        return;
    }

    // 2차 분석 결과 확인
    const finalScript = state.stage2.revisedScript;
    if (!finalScript) {
        alert('2차 분석을 먼저 완료해주세요.');
        return;
    }

    state.stage3.originalScript = finalScript;

    // UI 표시
    const stage3Section = document.getElementById('stage3-section');
    const stage3Progress = document.getElementById('stage3-progress');
    const stage3Results = document.getElementById('stage3-results');
    
    stage3Section.style.display = 'block';
    stage3Progress.style.display = 'block';
    stage3Results.style.display = 'none';

    updateStage3Progress(10, '숏츠 제작 준비 중...');

    currentAbortController = new AbortController();
    const signal = currentAbortController.signal;

    try {
        updateStage3Progress(20, '숏츠 대본 프롬프트 생성 중...');
        const prompt = generateStage3Prompt(finalScript);
        console.log('📤 3차 프롬프트 생성 완료, 길이:', prompt.length);

        updateStage3Progress(40, 'AI 숏츠 제작 중... (최대 2분 소요)');
        const response = await callGeminiAPI(prompt, signal);
        console.log('📥 3차 API 응답 수신');

        updateStage3Progress(70, '결과 파싱 중...');
        const parsed = parseStage3Result(response);
        console.log('✅ 3차 파싱 완료');

        updateStage3Progress(90, '결과 렌더링 중...');
        renderStage3Results(parsed);

        state.stage3.analysis = parsed.analysis;
        state.stage3.shortsScript = parsed.shorts_script;
        state.stage3.videoPrompts = parsed.video_prompts;

        updateStage3Progress(100, '숏츠 제작 완료!');
        console.log('✅ 3차 분석 완료');

        setTimeout(() => {
            stage3Progress.style.display = 'none';
            stage3Results.style.display = 'block';
        }, 1000);

    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('⏹ 3차 분석이 중지됨');
            updateStage3Progress(0, '분석이 중지되었습니다.');
        } else {
            console.error('❌ 3차 분석 오류:', error);
            alert('3차 분석 중 오류가 발생했습니다: ' + error.message);
            updateStage3Progress(0, '오류 발생');
        }
    } finally {
        currentAbortController = null;
    }
}

// ===================== 3차 분석 진행률 업데이트 =====================
function updateStage3Progress(percent, text) {
    const bar = document.getElementById('stage3-progress-bar');
    const textEl = document.getElementById('stage3-progress-text');
    if (bar) bar.style.width = percent + '%';
    if (textEl) textEl.textContent = text;
}

// ===================== 3차 분석 프롬프트 생성 =====================
function generateStage3Prompt(scriptText) {
    return `당신은 두 가지 역할을 수행합니다:

[역할 1] 20년차 영화·드라마 홍보 마케터
- 목표: 웹/유튜브 트렌드 기반 숏츠용 대본 제작
- 조건:
  - 영상 길이 1분 미만 (약 150~200자)
  - 도입 3초 이내 강한 후킹 필수
  - 불필요한 설명 제거, 감정/사건 중심 압축
  - 어그로 극대화, 클릭 유도 문구 포함

[역할 2] 20년차 영화·드라마 영상 기획 및 전문 제작자
- 사용 툴: grok 기반 이미지→영상 생성
- 출력: 9:16 세로 영상 (숏츠/릴스/틱톡)
- 각 컷마다 3가지 프롬프트 버전 제공 (영문/한글 쌍)

[원본 대본]
${scriptText}

[출력 형식]
반드시 아래 JSON 형식으로만 응답하세요:
{
  "analysis": "숏츠 후킹 포인트 요약 및 컷 구성 기준 설명",
  "shorts_script": "1분 미만 숏츠 대본 전체 (줄바꿈으로 구분)",
  "video_prompts": [
    {
      "cut": 1,
      "description": "이 컷의 장면 설명",
      "mood": "분위기 (예: dramatic, suspenseful, romantic)",
      "voice": "말소리/음성 톤 설명",
      "bgm": "배경음악 추천",
      "sfx": "효과음 추천",
      "prompts": {
        "v1_en": "Grok prompt version 1 in English, 9:16 vertical, cinematic, short-form video style",
        "v1_ko": "Grok 프롬프트 버전 1 한글, 9:16 세로, 시네마틱, 숏폼 영상 스타일",
        "v2_en": "Grok prompt version 2 in English, different angle or mood",
        "v2_ko": "Grok 프롬프트 버전 2 한글, 다른 각도나 분위기",
        "v3_en": "Grok prompt version 3 in English, creative variation",
        "v3_ko": "Grok 프롬프트 버전 3 한글, 창의적 변형"
      }
    }
  ]
}

[중요]
- 컷 수는 숏츠 대본 분량에 따라 3~6개로 자동 산정
- 각 프롬프트는 grok 영상 생성에 최적화
- 9:16, cinematic, short-form 키워드 필수 포함
- mood는 대본 감정 분석 기반으로 설정`;
}

// ===================== 3차 분석 결과 파싱 =====================
function parseStage3Result(responseText) {
    console.log('📝 3차 파싱 시작, 원본 길이:', responseText.length);

    let jsonStr = responseText.trim();
    jsonStr = jsonStr.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

    if (!jsonStr.startsWith('{')) {
        const firstBrace = jsonStr.indexOf('{');
        if (firstBrace !== -1) {
            jsonStr = jsonStr.substring(firstBrace);
        }
    }

    const lastBrace = jsonStr.lastIndexOf('}');
    if (lastBrace !== -1) {
        jsonStr = jsonStr.substring(0, lastBrace + 1);
    }

    // 괄호 균형 맞추기
    let openBraces = (jsonStr.match(/{/g) || []).length;
    let closeBraces = (jsonStr.match(/}/g) || []).length;
    while (openBraces > closeBraces) {
        jsonStr += '}';
        closeBraces++;
    }

    let openBrackets = (jsonStr.match(/\[/g) || []).length;
    let closeBrackets = (jsonStr.match(/\]/g) || []).length;
    while (openBrackets > closeBrackets) {
        const lastBraceIdx = jsonStr.lastIndexOf('}');
        jsonStr = jsonStr.substring(0, lastBraceIdx) + ']' + jsonStr.substring(lastBraceIdx);
        closeBrackets++;
    }

    jsonStr = jsonStr.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');

    try {
        const parsed = JSON.parse(jsonStr);
        console.log('✅ 3차 JSON 파싱 성공');
        return {
            analysis: parsed.analysis || '',
            shorts_script: parsed.shorts_script || '',
            video_prompts: parsed.video_prompts || [],
            parseError: null
        };
    } catch (e) {
        console.error('❌ 3차 JSON 파싱 실패:', e.message);
        
        // 부분 추출 시도
        let analysis = '';
        let shorts_script = '';
        let video_prompts = [];

        try {
            const analysisMatch = jsonStr.match(/"analysis"\s*:\s*"([^"]+)"/);
            if (analysisMatch) analysis = analysisMatch[1];
        } catch (e) {}

        try {
            const scriptMatch = jsonStr.match(/"shorts_script"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"video_prompts"|"\s*})/);
            if (scriptMatch) shorts_script = scriptMatch[1].replace(/\\n/g, '\n');
        } catch (e) {}

        return {
            analysis: analysis,
            shorts_script: shorts_script,
            video_prompts: video_prompts,
            parseError: e.message
        };
    }
}

// ===================== 3차 분석 결과 렌더링 =====================
function renderStage3Results(parsed) {
    // 숏츠 대본 렌더링
    const shortsContainer = document.getElementById('shorts-script-container');
    if (shortsContainer) {
        if (parsed.shorts_script) {
            const lines = parsed.shorts_script.split('\n');
            let html = '<div class="shorts-script">';
            lines.forEach((line, index) => {
                if (line.trim()) {
                    html += `<p style="margin: 8px 0; padding: 8px; background: #252542; border-radius: 4px; border-left: 3px solid #ff6b6b;">${escapeHtml(line)}</p>`;
                }
            });
            html += '</div>';
            
            if (parsed.analysis) {
                html += `<div style="margin-top: 15px; padding: 10px; background: #1e1e3f; border-radius: 6px; border: 1px solid #444;">
                    <strong style="color: #ffd700;">📊 분석:</strong>
                    <p style="margin-top: 8px; color: #ccc;">${escapeHtml(parsed.analysis)}</p>
                </div>`;
            }
            
            shortsContainer.innerHTML = html;
        } else {
            shortsContainer.innerHTML = '<p class="error">숏츠 대본 생성에 실패했습니다.</p>';
        }
    }

    // 영상화 프롬프트 렌더링
    const promptsContainer = document.getElementById('video-prompts-container');
    if (promptsContainer) {
        if (parsed.video_prompts && parsed.video_prompts.length > 0) {
            let html = '';
            
            parsed.video_prompts.forEach((cut, index) => {
                html += `
                <div class="cut-section" style="margin-bottom: 25px; padding: 15px; background: #252542; border-radius: 8px; border: 1px solid #444;">
                    <h4 style="color: #ff6b6b; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #444;">
                        🎬 컷 ${cut.cut || index + 1} ${cut.description ? '- ' + cut.description : ''}
                    </h4>
                    
                    <div style="display: grid; gap: 10px; margin-bottom: 15px;">
                        <div style="padding: 8px; background: #1a1a2e; border-radius: 4px;">
                            <strong style="color: #ffd700;">🎭 분위기:</strong> <span style="color: #fff;">${escapeHtml(cut.mood || '-')}</span>
                        </div>
                        <div style="padding: 8px; background: #1a1a2e; border-radius: 4px;">
                            <strong style="color: #ffd700;">🎤 말소리/음성 톤:</strong> <span style="color: #fff;">${escapeHtml(cut.voice || '-')}</span>
                        </div>
                        <div style="padding: 8px; background: #1a1a2e; border-radius: 4px;">
                            <strong style="color: #ffd700;">🎵 배경음악(BGM):</strong> <span style="color: #fff;">${escapeHtml(cut.bgm || '-')}</span>
                        </div>
                        <div style="padding: 8px; background: #1a1a2e; border-radius: 4px;">
                            <strong style="color: #ffd700;">🔊 효과음(SFX):</strong> <span style="color: #fff;">${escapeHtml(cut.sfx || '-')}</span>
                        </div>
                    </div>
                    
                    <div class="prompts-grid" style="display: grid; gap: 15px;">
                        ${renderPromptVersions(cut.prompts)}
                    </div>
                </div>
                `;
            });
            
            promptsContainer.innerHTML = html;
        } else {
            promptsContainer.innerHTML = '<p class="error">영상화 프롬프트 생성에 실패했습니다.</p>';
        }
    }
}

// ===================== 프롬프트 버전 렌더링 =====================
function renderPromptVersions(prompts) {
    if (!prompts) return '<p>프롬프트 없음</p>';
    
    let html = '';
    
    // 1안
    html += `
    <div style="padding: 12px; background: #1e1e3f; border-radius: 6px; border-left: 4px solid #4ecdc4;">
        <strong style="color: #4ecdc4;">📝 1안</strong>
        <div style="margin-top: 8px;">
            <p style="margin: 5px 0; color: #aaa; font-size: 12px;">English:</p>
            <p style="margin: 5px 0; padding: 8px; background: #252542; border-radius: 4px; color: #fff; font-size: 13px;">${escapeHtml(prompts.v1_en || '-')}</p>
            <p style="margin: 5px 0; color: #aaa; font-size: 12px;">한글:</p>
            <p style="margin: 5px 0; padding: 8px; background: #252542; border-radius: 4px; color: #fff; font-size: 13px;">${escapeHtml(prompts.v1_ko || '-')}</p>
        </div>
    </div>
    `;
    
    // 2안
    html += `
    <div style="padding: 12px; background: #1e1e3f; border-radius: 6px; border-left: 4px solid #ff6b6b;">
        <strong style="color: #ff6b6b;">📝 2안</strong>
        <div style="margin-top: 8px;">
            <p style="margin: 5px 0; color: #aaa; font-size: 12px;">English:</p>
            <p style="margin: 5px 0; padding: 8px; background: #252542; border-radius: 4px; color: #fff; font-size: 13px;">${escapeHtml(prompts.v2_en || '-')}</p>
            <p style="margin: 5px 0; color: #aaa; font-size: 12px;">한글:</p>
            <p style="margin: 5px 0; padding: 8px; background: #252542; border-radius: 4px; color: #fff; font-size: 13px;">${escapeHtml(prompts.v2_ko || '-')}</p>
        </div>
    </div>
    `;
    
    // 3안
    html += `
    <div style="padding: 12px; background: #1e1e3f; border-radius: 6px; border-left: 4px solid #ffd700;">
        <strong style="color: #ffd700;">📝 3안</strong>
        <div style="margin-top: 8px;">
            <p style="margin: 5px 0; color: #aaa; font-size: 12px;">English:</p>
            <p style="margin: 5px 0; padding: 8px; background: #252542; border-radius: 4px; color: #fff; font-size: 13px;">${escapeHtml(prompts.v3_en || '-')}</p>
            <p style="margin: 5px 0; color: #aaa; font-size: 12px;">한글:</p>
            <p style="margin: 5px 0; padding: 8px; background: #252542; border-radius: 4px; color: #fff; font-size: 13px;">${escapeHtml(prompts.v3_ko || '-')}</p>
        </div>
    </div>
    `;
    
    return html;
}

// ===================== 유틸리티 =====================
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

window.scrollToHighlight = scrollToHighlight;
