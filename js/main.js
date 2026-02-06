/**
 * MISLGOM 대본 검수 자동 프로그램
 * main.js v4.8 - Vertex AI + Gemini 3 Flash
 * 25가지 오류 유형 검수, 4-패널 레이아웃, 새 점수 체계
 */

console.log('🚀 main.js v4.8 (Vertex AI + Gemini 3 Flash) 로드됨');

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
    console.log('✅ main.js v4.8 초기화 완료');
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

// ===================== 분석 실행 =====================
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

        updateProgress(90, '결과 렌더링 중...');
        renderResults(parsed, stage);

        if (stage === 'stage1') {
            state.stage1.analysis = parsed.analysis;
            state.stage1.revisedScript = parsed.revisedScript;
            state.stage1.scores = parsed.scores;
            state.stage1.revisionCount = parsed.analysis ? parsed.analysis.length : 0;
            document.getElementById('btn-analyze-stage2').disabled = false;
        } else {
            state.stage2.analysis = parsed.analysis;
            state.stage2.revisedScript = parsed.revisedScript;
            state.stage2.scores = parsed.scores;
            state.stage2.revisionCount = parsed.analysis ? parsed.analysis.length : 0;
            document.getElementById('btn-download').disabled = false;
            renderScores(parsed.scores);
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

// ===================== 프롬프트 생성 (초강력 버전 + 시대배경 분석 + JSON 형식 강화) =====================
function generatePrompt(scriptText) {
    return `당신은 세계 최고 수준의 한국어 대본 검수 전문가이자 역사 고증 전문가입니다.

## 절대 필수 규칙

### 규칙 1: 시대배경 부적합 단어 검출 (최우선)
대본의 시대배경을 먼저 파악하세요. 조선시대/사극 배경인 경우 다음 단어들은 반드시 오류로 잡아야 합니다:

현대 외래어 (발견 즉시 오류): 펜, 볼펜, 노트, 컴퓨터, 핸드폰, 폰, 인터넷, TV, 카메라, 버스, 택시, 자동차, 기차, 비행기, 에어컨, 냉장고, 마이크

현대 용어 (발견 즉시 오류): 회사, 직장, 출근, 퇴근, 월급, 데이트, SNS, 카톡, 문자, 이메일, 카페, 커피, 햄버거, 피자, 치킨, 라면

시대별 대체어:
- 펜 → 붓
- 노트 → 서책, 책자
- 회사 → 상단, 포목점

### 규칙 2: 100% 수정 반영
analysis의 모든 suggestion은 revisedScript에 반드시 100% 반영되어야 합니다.
단 하나라도 빠지면 실패입니다.

### 규칙 3: 전체 대본 포함
revisedScript에는 전체 대본을 포함해야 합니다. 생략 금지.

### 규칙 4: 줄맞춤
각 줄은 공백 포함 최대 17자. 초과 시 줄바꿈.

## 검수 항목 (26가지)
0. 시대배경 부적합 표현
1. 맞춤법 오류
2. 띄어쓰기 오류
3. 문법 오류
4. 어색한 표현
5. 중복 표현
6. 비문
7. 주술 호응 오류
8. 시제 불일치
9. 높임법 오류
10. 조사 오류
11. 외래어 표기 오류
12. 숫자 표기 오류
13. 문장 부호 오류
14. 접속어 오류
15. 지시어 오류
16. 의미 중복
17. 불필요한 수식어
18. 문장 길이 과다
19. 전문용어 과다
20. 어려운 한자어
21. 시니어 부적합 표현
22. 가독성 저해
23. 논리적 비약
24. 맥락 불일치
25. 어투 불일치

## 분석 대상 대본
${scriptText}

## 출력 형식
반드시 아래 JSON 형식으로만 출력하세요. 다른 텍스트 없이 JSON만 출력하세요.
revisedScript 내의 줄바꿈은 \\n으로 표현하세요.

{"analysis":[{"line":1,"errorType":"오류유형","original":"원본텍스트","suggestion":"수정텍스트","reason":"수정이유"}],"revisedScript":"전체수정대본","scores":{"entertainment":85,"seniorTarget":90,"storyFlow":80,"bounceRate":15}}`;
}

// ===================== Gemini API 호출 (Vertex AI + Gemini 3 Flash) =====================
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
                temperature: 0.05,
                maxOutputTokens: 65536,
                responseMimeType: "application/json"
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

// ===================== 결과 파싱 (강화된 버전) =====================
function parseAnalysisResult(responseText) {
    console.log('📝 파싱 시작, 원본 길이:', responseText.length);

    let jsonStr = responseText.trim();

    // 1. ```json ... ``` 블록 추출
    const jsonBlockMatch = jsonStr.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch) {
        jsonStr = jsonBlockMatch[1].trim();
    }

    // 2. ``` ... ``` 블록 추출 (json 키워드 없는 경우)
    if (jsonStr.startsWith('```')) {
        const plainBlockMatch = jsonStr.match(/```\s*([\s\S]*?)\s*```/);
        if (plainBlockMatch) {
            jsonStr = plainBlockMatch[1].trim();
        }
    }

    // 3. { } 추출
    const firstBrace = jsonStr.indexOf('{');
    const lastBrace = jsonStr.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
    }

    // 4. JSON 문자열 정리
    jsonStr = jsonStr
        .replace(/,\s*}/g, '}')  // 마지막 콤마 제거
        .replace(/,\s*]/g, ']')  // 배열 마지막 콤마 제거
        .replace(/[\x00-\x1F\x7F]/g, (char) => {
            if (char === '\n') return '\\n';
            if (char === '\r') return '\\r';
            if (char === '\t') return '\\t';
            return '';
        });

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
        console.error('❌ JSON 파싱 실패:', e);
        console.log('📄 파싱 시도한 문자열:', jsonStr.substring(0, 500));
        
        // 5. 부분 추출 시도
        let analysis = [];
        let revisedScript = '';
        let scores = {};

        // analysis 배열 추출
        const analysisMatch = jsonStr.match(/"analysis"\s*:\s*\[([\s\S]*?)\]/);
        if (analysisMatch) {
            try {
                analysis = JSON.parse('[' + analysisMatch[1] + ']');
            } catch (e2) {
                console.log('analysis 부분 파싱 실패');
            }
        }

        // revisedScript 추출
        const scriptMatch = jsonStr.match(/"revisedScript"\s*:\s*"([\s\S]*?)(?:","scores"|"}$)/);
        if (scriptMatch) {
            revisedScript = scriptMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
        }

        // scores 추출
        const scoresMatch = jsonStr.match(/"scores"\s*:\s*\{([^}]+)\}/);
        if (scoresMatch) {
            try {
                scores = JSON.parse('{' + scoresMatch[1] + '}');
            } catch (e3) {
                console.log('scores 부분 파싱 실패');
            }
        }

        if (analysis.length > 0 || revisedScript) {
            console.log('⚠️ 부분 파싱으로 복구 성공');
            return {
                analysis: analysis,
                revisedScript: revisedScript,
                scores: scores,
                parseError: null
            };
        }

        return {
            analysis: [],
            revisedScript: responseText,
            scores: {},
            parseError: e.message
        };
    }
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

// ===================== 수정본 렌더링 (전체 대본, 오류 부분만 하이라이트) =====================
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

// ===================== 유틸리티 =====================
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

window.scrollToHighlight = scrollToHighlight;
