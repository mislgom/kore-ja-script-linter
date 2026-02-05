/**
 * MISLGOM 대본 검수 자동 프로그램
 * main.js v4.3 - Vertex AI + Gemini 3 Pro
 * 25가지 오류 유형 검수, 4-패널 레이아웃, 중지 버튼, 수정 개수 표시
 */

console.log('🚀 main.js v4.3 (25 Error Types) 로드됨');

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
    initAnalysisButtons();
    initDownloadButton();
    console.log('✅ main.js v4.3 초기화 완료');
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

// ===================== 파일 업로드 =====================
function initFileUpload() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const fileNameDisplay = document.getElementById('file-name-display');

    dropZone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleFile(file);
            fileNameDisplay.textContent = `📎 ${file.name}`;
        }
    });
}

function initDragAndDrop() {
    const dropZone = document.getElementById('drop-zone');
    const fileNameDisplay = document.getElementById('file-name-display');

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file && file.name.endsWith('.txt')) {
            handleFile(file);
            fileNameDisplay.textContent = `📎 ${file.name}`;
        } else {
            alert('TXT 파일만 업로드 가능합니다.');
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
        }
    });

    console.log('✅ 1차 분석 버튼 연결됨');
    console.log('✅ 2차 분석 버튼 연결됨');
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

    // UI 준비
    const progressContainer = document.getElementById('progress-container');
    const stopBtn = document.getElementById('btn-stop-analysis');
    progressContainer.style.display = 'block';
    stopBtn.disabled = false;
    updateProgress(10, 'AI 분석 준비 중...');

    // AbortController 설정
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

        // 상태 저장
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

// ===================== 프롬프트 생성 =====================
function generatePrompt(scriptText) {
    return `당신은 전문 대본 검수 AI입니다. 아래 대본을 분석하고 JSON 형식으로 결과를 반환하세요.

## 검수 항목 (25가지 오류 유형)

1. 맞춤법 오류
2. 띄어쓰기 오류
3. 문법 오류
4. 어색한 표현
5. 중복 표현
6. 비문(문장 성분 오류)
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
19. 전문용어 과다 사용
20. 어려운 한자어
21. 시니어 부적합 표현
22. 가독성 저해 표현
23. 논리적 비약
24. 맥락 불일치
25. 어투 불일치

## 분석 대상 대본
${scriptText}

## 출력 형식 (반드시 이 JSON 형식으로만 출력)
{
  "analysis": [
    {
      "line": 1,
      "errorType": "오류 유형",
      "original": "원본 텍스트",
      "suggestion": "수정 제안",
      "reason": "수정 이유"
    }
  ],
  "revisedScript": "전체 수정된 대본 텍스트",
  "scores": {
    "overall": 85,
    "grammar": 90,
    "readability": 80,
    "seniorFriendly": 75,
    "bounceRisk": 20
  }
}

## 점수 기준
- overall: 전체 품질 점수 (0-100)
- grammar: 문법 정확도 (0-100)
- readability: 가독성 (0-100)
- seniorFriendly: 시니어 적합도 (0-100)
- bounceRisk: 이탈 위험도 (0-100, 낮을수록 좋음)

반드시 위 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요.`;
}

// ===================== Gemini API 호출 =====================
async function callGeminiAPI(prompt, signal) {
    const apiKey = localStorage.getItem('GEMINI_API_KEY');
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${apiKey}`;

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
                temperature: 0.2,
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

    let jsonStr = responseText;

    // JSON 블록 추출
    const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
        jsonStr = jsonMatch[1];
    } else {
        const braceStart = responseText.indexOf('{');
        const braceEnd = responseText.lastIndexOf('}');
        if (braceStart !== -1 && braceEnd !== -1) {
            jsonStr = responseText.substring(braceStart, braceEnd + 1);
        }
    }

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

    // 분석 결과 테이블 렌더링
    renderAnalysisTable(parsed.analysis, parsed.parseError, stage, analysisContainer);

    // 수정본 렌더링
    const originalScript = stage === 'stage1' ? state.stage1.originalScript : state.stage2.originalScript;
    renderFullScriptWithHighlight(originalScript, parsed.revisedScript, revisedContainer);

    // 수정 개수 표시
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
    html += '<table class="analysis-table"><thead><tr><th>줄</th><th>유형</th><th>원본</th><th>수정</th><th>이유</th></tr></thead><tbody>';

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

    html += '</tbody></table>';
    container.innerHTML = html;
}

// ===================== 클릭 시 해당 위치로 스크롤 =====================
function scrollToHighlight(row) {
    const targetContainerId = row.getAttribute('data-target-container');
    const searchText = row.getAttribute('data-search-text');
    const container = document.getElementById(targetContainerId);

    if (!container) return;

    // 수정된 텍스트가 있는 span 찾기
    const highlights = container.querySelectorAll('.changed-text');
    let targetElement = null;

    // 검색 텍스트와 매칭되는 요소 찾기
    highlights.forEach(el => {
        if (el.textContent.includes(searchText) || searchText.includes(el.textContent)) {
            targetElement = el;
        }
    });

    // 매칭되는 요소가 없으면 첫 번째 하이라이트로
    if (!targetElement && highlights.length > 0) {
        const lineIndex = parseInt(row.getAttribute('data-line')) - 1;
        targetElement = highlights[Math.min(lineIndex, highlights.length - 1)] || highlights[0];
    }

    if (targetElement) {
        // 기존 플래시 효과 제거
        container.querySelectorAll('.highlight-flash').forEach(el => {
            el.classList.remove('highlight-flash');
        });

        // 스크롤 및 플래시 효과
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetElement.classList.add('highlight-flash');

        setTimeout(() => {
            targetElement.classList.remove('highlight-flash');
        }, 1500);
    } else {
        // 컨테이너 상단으로 스크롤
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// ===================== 수정본 렌더링 (변경 부분 하이라이트) =====================
function renderFullScriptWithHighlight(originalScript, revisedScript, container) {
    if (!revisedScript) {
        container.innerHTML = '<p class="placeholder">수정된 내용이 없습니다.</p>';
        return;
    }

    const originalLines = originalScript.split('\n');
    const revisedLines = revisedScript.split('\n');
    let html = '<div class="revised-script">';

    revisedLines.forEach((revisedLine, index) => {
        const originalLine = originalLines[index] || '';

        if (revisedLine !== originalLine && originalLine.trim() !== '') {
            // 변경된 라인 - 변경 부분 하이라이트
            const highlightedLine = highlightChangedParts(originalLine, revisedLine);
            html += `<p class="line-revised" data-line="${index + 1}">${highlightedLine}</p>`;
        } else {
            // 변경되지 않은 라인
            html += `<p class="line-unchanged">${escapeHtml(revisedLine)}</p>`;
        }
    });

    html += '</div>';
    container.innerHTML = html;
}

// ===================== 변경된 부분 하이라이트 =====================
function highlightChangedParts(original, revised) {
    if (original === revised) {
        return escapeHtml(revised);
    }

    // 단어 단위로 비교
    const originalWords = original.split(/(\s+)/);
    const revisedWords = revised.split(/(\s+)/);

    let result = '';

    for (let i = 0; i < revisedWords.length; i++) {
        const origWord = originalWords[i] || '';
        const revWord = revisedWords[i] || '';

        if (origWord !== revWord && revWord.trim() !== '') {
            result += `<span class="changed-text">${escapeHtml(revWord)}</span>`;
        } else {
            result += escapeHtml(revWord);
        }
    }

    return result;
}

// ===================== 점수 렌더링 =====================
function renderScores(scores) {
    const container = document.getElementById('score-display');

    if (!scores || Object.keys(scores).length === 0) {
        container.innerHTML = '<p class="placeholder">점수 정보가 없습니다.</p>';
        return;
    }

    const getScoreClass = (score, isRisk = false) => {
        if (isRisk) {
            if (score <= 30) return 'score-good';
            if (score <= 60) return 'score-warning';
            return 'score-danger';
        }
        if (score >= 80) return 'score-good';
        if (score >= 60) return 'score-warning';
        return 'score-danger';
    };

    let html = '<div class="score-grid">';

    html += `<div class="score-card ${getScoreClass(scores.overall || 0)}">
        <div class="score-value">${scores.overall || 0}</div>
        <div class="score-label">전체 품질</div>
    </div>`;

    html += `<div class="score-card ${getScoreClass(scores.grammar || 0)}">
        <div class="score-value">${scores.grammar || 0}</div>
        <div class="score-label">문법 정확도</div>
    </div>`;

    html += `<div class="score-card ${getScoreClass(scores.readability || 0)}">
        <div class="score-value">${scores.readability || 0}</div>
        <div class="score-label">가독성</div>
    </div>`;

    html += `<div class="score-card ${getScoreClass(scores.seniorFriendly || 0)}">
        <div class="score-value">${scores.seniorFriendly || 0}</div>
        <div class="score-label">시니어 적합도</div>
    </div>`;

    html += `<div class="score-card ${getScoreClass(scores.bounceRisk || 0, true)}">
        <div class="score-value">${scores.bounceRisk || 0}</div>
        <div class="score-label">이탈 위험도</div>
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

// 전역 함수로 노출 (onclick에서 사용)
window.scrollToHighlight = scrollToHighlight;
