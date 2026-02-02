// ============================================
// 탭별 분석 시스템 - Tab Analysis System
// ============================================

// 탭별 분석 설정
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
// 탭별 분석 함수
// ============================================
async function analyzeTab(stepNumber) {
    const config = analysisConfig[stepNumber];
    const script = document.getElementById('korea-senior-script').value;

    if (!script || script.trim() === '') {
        alert('대본을 먼저 입력해주세요.');
        return;
    }

    try {
        // Gemini API 호출
        const result = await callGeminiForTabAnalysis(config.prompt, script);

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
        alert('분석 중 오류가 발생했습니다: ' + error.message);
    }
}

// ============================================
// Gemini API 호출 (탭 분석용)
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

    if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
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
// 자동 수정 함수
// ============================================
async function autoFixTab(stepNumber) {
    const config = analysisConfig[stepNumber];
    let script = document.getElementById('korea-senior-script').value;

    if (!script || script.trim() === '') {
        alert('대본을 먼저 입력해주세요.');
        return;
    }

    const confirmFix = confirm(`"${config.name}" 항목을 100점까지 자동 수정하시겠습니까?\n\n수정 기준: ${config.criteria.join(', ')}\n\n※ 이 작업은 시간이 걸릴 수 있습니다.`);

    if (!confirmFix) {
        return;
    }

    let score = 0;
    let iterations = 0;
    const maxIterations = 3; // 최대 3회 반복

    // 로딩 표시
    const button = document.getElementById(`autofix-step-${stepNumber}`);
    const originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>수정 중...';

    try {
        while (score < 100 && iterations < maxIterations) {
            iterations++;

            // 수정 프롬프트
            const fixPrompt = `${config.prompt}\n\n점수가 100점이 되도록 대본을 수정하세요. 수정 기준: ${config.criteria.join(', ')}\n\n수정된 대본 전체를 반환하고, 분석 결과도 함께 제공하세요.`;

            const result = await callGeminiForTabAnalysis(fixPrompt, script);

            // 수정된 대본 추출 (응답에서 대본 부분 찾기)
            if (result.fixedScript) {
                script = result.fixedScript;
            }

            score = result.score || 0;

            // 진행 상황 업데이트
            button.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i>수정 중... (${iterations}/${maxIterations}) - 점수: ${score}/100`;

            // 결과 업데이트
            document.getElementById(`summary-step-${stepNumber}`).textContent = result.summary || '수정 중...';
            document.getElementById(`score-step-${stepNumber}`).textContent = `${score}/100`;
        }

        // 수정 완료된 대본 저장
        window.fixedScripts[stepNumber] = script;

        button.disabled = false;
        button.innerHTML = originalText;

        alert(`수정 완료!\n\n최종 점수: ${score}/100\n반복 횟수: ${iterations}회\n\n"다운로드" 버튼을 클릭하여 수정된 대본을 저장하세요.`);

    } catch (error) {
        console.error('자동 수정 오류:', error);
        button.disabled = false;
        button.innerHTML = originalText;
        alert('자동 수정 중 오류가 발생했습니다: ' + error.message);
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
// 이벤트 리스너 등록
// ============================================
document.addEventListener('DOMContentLoaded', function () {
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

    console.log('탭 분석 시스템 초기화 완료');
});
