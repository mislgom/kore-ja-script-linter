// ============================================
// 탭별 분석 시스템 - Tab Analysis System
// API 레이트 리밋 최적화 버전
// ============================================

// ============================================
// API 호출 상태 관리
// ============================================
const apiCallState = {
    isProcessing: false,           // 현재 API 호출 중인지
    activeTab: null,                // 현재 처리 중인 탭
    lastCallTime: 0,                // 마지막 API 호출 시간
    minInterval: 4000,              // 최소 호출 간격 (4초)
    requestCount: 0                 // 총 API 호출 횟수 (디버깅용)
};

// ============================================
// 유틸리티 함수
// ============================================

// 대기 함수
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 현재 시간 포맷팅
function getTimestamp() {
    return new Date().toISOString().slice(11, 19);
}

// ============================================
// 탭별 분석 설정
// ============================================
const analysisConfig = {
    1: {
        name: '배경 확인',
        prompt: `대본의 배경(한국/일본/조선)을 분석하고 일관성을 평가하세요.
        
평가 기준:
- 지명과 장소의 일관성
- 문화적 요소의 적절성
- 시대적 배경의 정확성

다음 형식으로 JSON 응답:
{
    "summary": "분석 요약 (2-3문장)",
    "issues": [
        {"text": "문제 문장/구간", "reason": "문제 이유"}
    ],
    "score": 85
}`,
        criteria: ['지명', '장소', '문화 요소', '시대적 배경']
    },
    2: {
        name: '등장인물 일관성',
        prompt: `등장인물의 이름, 나이, 관계 일관성을 평가하세요.
        
평가 기준:
- 이름의 일관성 (동일 인물이 다른 이름으로 불리는지)
- 나이 설정의 일관성
- 인물 간 관계의 일관성

다음 형식으로 JSON 응답:
{
    "summary": "분석 요약 (2-3문장)",
    "issues": [
        {"text": "문제 문장/구간", "reason": "문제 이유"}
    ],
    "score": 85
}`,
        criteria: ['이름', '나이', '관계']
    },
    3: {
        name: '스토리 왜곡 분석',
        prompt: `스토리의 씬 구조와 시간/장소 흐름을 분석하세요.
        
평가 기준:
- 씬 전환의 자연스러움
- 시간 흐름의 일관성
- 장소 이동의 논리성

다음 형식으로 JSON 응답:
{
    "summary": "분석 요약 (2-3문장)",
    "issues": [
        {"text": "문제 문장/구간", "reason": "문제 이유"}
    ],
    "score": 85
}`,
        criteria: ['씬 구조', '시간 흐름', '장소 이동']
    },
    4: {
        name: '반전/변화 속도',
        prompt: `감정 변화와 페이싱을 분석하세요.
        
평가 기준:
- 감정 변화의 자연스러움
- 스토리 전개 속도의 적절성
- 반전의 효과성

다음 형식으로 JSON 응답:
{
    "summary": "분석 요약 (2-3문장)",
    "issues": [
        {"text": "문제 문장/구간", "reason": "문제 이유"}
    ],
    "score": 85
}`,
        criteria: ['감정 변화', '페이싱', '반전']
    },
    5: {
        name: '재미/몰입 요소',
        prompt: `갈등, 대화, 시니어 공감 요소를 분석하세요.
        
평가 기준:
- 갈등 구조의 명확성
- 대화의 자연스러움
- 시니어 타겟 공감 요소

다음 형식으로 JSON 응답:
{
    "summary": "분석 요약 (2-3문장)",
    "issues": [
        {"text": "문제 문장/구간", "reason": "문제 이유"}
    ],
    "score": 85
}`,
        criteria: ['갈등', '대화', '시니어 공감']
    }
};

// 수정된 대본 저장소
window.fixedScripts = {};

// ============================================
// 탭 전환 함수
// ============================================
function showTabResult(stepNumber) {
    // 탭 결과 컨테이너 표시
    const container = document.getElementById('tab-results-container');
    if (container) {
        container.classList.remove('hidden');
    }

    // 모든 결과 영역 숨기기
    for (let i = 1; i <= 5; i++) {
        const resultDiv = document.getElementById(`result-step-${i}`);
        if (resultDiv) {
            resultDiv.classList.add('hidden');
        }
    }

    // 선택한 탭 결과 영역 표시
    const selectedResult = document.getElementById(`result-step-${stepNumber}`);
    if (selectedResult) {
        selectedResult.classList.remove('hidden');
    }

    // 스크롤 이동
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ============================================
// API 호출 래퍼 (레이트 리밋 관리)
// ============================================
async function callGeminiAPI(prompt, script, tabNumber) {
    // 중복 호출 방지
    if (apiCallState.isProcessing) {
        console.warn(`[API BLOCKED] Tab ${tabNumber} - Already processing Tab ${apiCallState.activeTab}`);
        throw new Error('이미 다른 분석이 진행 중입니다. 잠시 후 다시 시도해주세요.');
    }

    // 최소 호출 간격 보장
    const now = Date.now();
    const timeSinceLastCall = now - apiCallState.lastCallTime;
    if (timeSinceLastCall < apiCallState.minInterval) {
        const waitTime = apiCallState.minInterval - timeSinceLastCall;
        console.log(`[API THROTTLE] Waiting ${Math.ceil(waitTime / 1000)}s before next call...`);
        await sleep(waitTime);
    }

    // 상태 업데이트
    apiCallState.isProcessing = true;
    apiCallState.activeTab = tabNumber;
    apiCallState.lastCallTime = Date.now();
    apiCallState.requestCount++;

    console.log(`[API CALL #${apiCallState.requestCount}] Tab ${tabNumber} - ${getTimestamp()}`);

    try {
        const result = await callGeminiForTabAnalysis(prompt, script);
        console.log(`[API SUCCESS] Tab ${tabNumber} - Score: ${result.score}/100`);
        return result;
    } catch (error) {
        console.error(`[API ERROR] Tab ${tabNumber} - ${error.message}`);
        throw error;
    } finally {
        // 상태 초기화
        apiCallState.isProcessing = false;
        apiCallState.activeTab = null;
    }
}

// ============================================
// Gemini API 호출 (실제 네트워크 요청)
// ============================================
async function callGeminiForTabAnalysis(prompt, script) {
    const apiKey = localStorage.getItem('gemini_api_key');

    if (!apiKey) {
        throw new Error('API 키가 설정되지 않았습니다. 먼저 API 키를 설정해주세요.');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;

    const requestBody = {
        contents: [{
            parts: [{
                text: `${prompt}\n\n대본:\n${script}`
            }]
        }],
        generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
        }
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
    });

    // 레이트 리밋 오류 처리
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Retry-After 헤더 확인
        const retryAfter = response.headers.get('Retry-After');

        if (response.status === 429) {
            const waitTime = retryAfter ? parseInt(retryAfter) : 60;
            const error = new Error(`API 호출 제한 초과. ${waitTime}초 후 다시 시도해주세요.`);
            error.retryAfter = waitTime;
            error.isRateLimit = true;
            throw error;
        }

        throw new Error(`API 호출 실패: ${response.status} ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;

    // JSON 파싱 시도
    try {
        // JSON 코드 블록 제거
        const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(jsonText);
    } catch (e) {
        // JSON 파싱 실패 시 기본 구조 반환
        return {
            summary: text.substring(0, 200) + '...',
            issues: [{ text: '파싱 오류', reason: 'JSON 형식으로 응답을 받지 못했습니다.' }],
            score: 50
        };
    }
}

// ============================================
// 재시도 로직이 포함된 API 호출
// ============================================
async function callGeminiWithRetry(prompt, script, tabNumber, maxRetries = 2) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await callGeminiAPI(prompt, script, tabNumber);
        } catch (error) {
            // 레이트 리밋 오류이고 재시도 가능한 경우
            if (error.isRateLimit && attempt < maxRetries) {
                const waitTime = Math.max(error.retryAfter * 1000, 40000); // 최소 40초
                console.log(`[RETRY ${attempt + 1}/${maxRetries}] Waiting ${waitTime / 1000}s before retry...`);

                // 사용자에게 알림
                alert(`API 호출 제한에 도달했습니다.\n${Math.ceil(waitTime / 1000)}초 후 자동으로 재시도합니다.`);

                await sleep(waitTime);
                continue;
            }

            // 재시도 불가능하거나 최대 재시도 횟수 초과
            throw error;
        }
    }
}

// ============================================
// 탭별 분석 함수
// ============================================
async function analyzeTab(stepNumber) {
    const config = analysisConfig[stepNumber];
    const script = document.getElementById('korea-senior-script').value;

    if (!script || script.trim() === '') {
        alert('대본을 먼저 입력해주세요.');
        return;
    }

    // 중복 실행 방지
    if (apiCallState.isProcessing) {
        alert(`현재 탭 ${apiCallState.activeTab} 분석이 진행 중입니다.\n잠시 후 다시 시도해주세요.`);
        return;
    }

    try {
        // 재시도 로직이 포함된 API 호출
        const result = await callGeminiWithRetry(config.prompt, script, stepNumber);

        // 결과 표시
        document.getElementById(`summary-step-${stepNumber}`).textContent = result.summary || '분석 결과를 가져올 수 없습니다.';
        document.getElementById(`score-step-${stepNumber}`).textContent = `${result.score || 0}/100`;

        // 오류 목록 표시
        const issuesList = document.getElementById(`issues-step-${stepNumber}`);
        if (result.issues && result.issues.length > 0) {
            issuesList.innerHTML = result.issues.map(issue =>
                `<li><strong>${issue.text}</strong> - ${issue.reason}</li>`
            ).join('');
        } else {
            issuesList.innerHTML = '<li>발견된 문제가 없습니다.</li>';
        }

        return result;
    } catch (error) {
        console.error('분석 오류:', error);
        alert('분석 중 오류가 발생했습니다:\n' + error.message);
    }
}

// ============================================
// 자동 수정 함수 (단일 API 호출)
// ============================================
async function autoFixTab(stepNumber) {
    const config = analysisConfig[stepNumber];
    const script = document.getElementById('korea-senior-script').value;

    if (!script || script.trim() === '') {
        alert('대본을 먼저 입력해주세요.');
        return;
    }

    // 중복 실행 방지
    if (apiCallState.isProcessing) {
        alert(`현재 탭 ${apiCallState.activeTab} 작업이 진행 중입니다.\n잠시 후 다시 시도해주세요.`);
        return;
    }

    const confirmFix = confirm(`"${config.name}" 항목을 자동 수정하시겠습니까?\n\n수정 기준: ${config.criteria.join(', ')}\n\n※ 1회 API 호출로 분석 및 수정을 진행합니다.`);

    if (!confirmFix) {
        return;
    }

    // 로딩 표시
    const button = document.getElementById(`autofix-step-${stepNumber}`);
    const originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>수정 중...';

    try {
        // 단일 API 호출로 분석 + 수정 + 평가
        const fixPrompt = `다음 대본을 "${config.name}" 기준으로 분석하고 100점이 되도록 수정하세요.

평가 기준: ${config.criteria.join(', ')}

응답 형식 (JSON):
{
    "summary": "분석 요약 (수정 전 문제점과 수정 내용 포함)",
    "issues": [
        {"text": "수정된 부분", "reason": "수정 이유"}
    ],
    "fixedScript": "수정된 전체 대본 (원본 형식 유지)",
    "score": 100
}

중요: fixedScript에는 반드시 수정된 전체 대본을 포함해야 합니다.

대본:
${script}`;

        console.log(`[AUTO-FIX] Tab ${stepNumber} - Starting single-call fix`);

        const result = await callGeminiWithRetry(fixPrompt, script, stepNumber);

        // 수정된 대본 저장
        if (result.fixedScript && result.fixedScript.trim() !== '') {
            window.fixedScripts[stepNumber] = result.fixedScript;
            console.log(`[AUTO-FIX] Tab ${stepNumber} - Fixed script saved (${result.fixedScript.length} chars)`);
        } else {
            // fixedScript가 없으면 원본 유지
            window.fixedScripts[stepNumber] = script;
            console.warn(`[AUTO-FIX] Tab ${stepNumber} - No fixedScript in response, using original`);
        }

        // 결과 업데이트
        document.getElementById(`summary-step-${stepNumber}`).textContent = result.summary || '수정 완료';
        document.getElementById(`score-step-${stepNumber}`).textContent = `${result.score || 0}/100`;

        // 수정 내역 표시
        const issuesList = document.getElementById(`issues-step-${stepNumber}`);
        if (result.issues && result.issues.length > 0) {
            issuesList.innerHTML = result.issues.map(issue =>
                `<li><strong>${issue.text}</strong> - ${issue.reason}</li>`
            ).join('');
        } else {
            issuesList.innerHTML = '<li>수정 사항이 없습니다.</li>';
        }

        button.disabled = false;
        button.innerHTML = originalText;

        alert(`수정 완료!\n\n최종 점수: ${result.score || 0}/100\n\n"다운로드" 버튼을 클릭하여 수정된 대본을 저장하세요.`);

    } catch (error) {
        console.error('자동 수정 오류:', error);
        button.disabled = false;
        button.innerHTML = originalText;
        alert('자동 수정 중 오류가 발생했습니다:\n' + error.message);
    }
}

// ============================================
// 다운로드 함수
// ============================================
function downloadTab(stepNumber) {
    const config = analysisConfig[stepNumber];
    const script = window.fixedScripts[stepNumber] || document.getElementById('korea-senior-script').value;

    if (!script || script.trim() === '') {
        alert('다운로드할 대본이 없습니다.');
        return;
    }

    // 파일 생성
    const blob = new Blob([script], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    // 다운로드 링크 생성
    const a = document.createElement('a');
    a.href = url;
    const date = new Date().toISOString().slice(0, 10);
    a.download = `대본_${config.name}_수정완료_${date}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);

    alert(`"${config.name}" 대본이 다운로드되었습니다.`);
}

// ============================================
// 이벤트 리스너 등록 (중복 방지)
// ============================================
let eventListenersRegistered = false;

function registerEventListeners() {
    // 중복 등록 방지
    if (eventListenersRegistered) {
        console.log('[TAB-ANALYSIS] Event listeners already registered, skipping');
        return;
    }

    // 자동 수정 버튼 이벤트
    for (let i = 1; i <= 5; i++) {
        const autofixBtn = document.getElementById(`autofix-step-${i}`);
        if (autofixBtn) {
            autofixBtn.addEventListener('click', () => autoFixTab(i));
        }

        const downloadBtn = document.getElementById(`download-step-${i}`);
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => downloadTab(i));
        }
    }

    eventListenersRegistered = true;
    console.log('[TAB-ANALYSIS] Event listeners registered successfully');
}

// ============================================
// 초기화
// ============================================
document.addEventListener('DOMContentLoaded', function () {
    registerEventListeners();
    console.log('[TAB-ANALYSIS] System initialized');
    console.log(`[TAB-ANALYSIS] API call interval: ${apiCallState.minInterval / 1000}s`);
});
