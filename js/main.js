/** ======================================================
 * KORE-JA SCRIPT LINTER - MAIN.JS
 * 2-Stage Pipeline Analysis System v3.2
 * Features: TSV Table + Diff Highlight (Fixed)
 * ====================================================== */

console.log('🚀 main.js v3.2 (TSV Table + Diff Fixed) 로드됨');

// ========== 전역 상태 ==========
const tabStates = {
    stage1: {
        originalScript: '',
        revisedScript: '',
        analysisResult: '',
        isAnalyzing: false,
        isComplete: false
    },
    stage2: {
        originalScript: '',
        revisedScript: '',
        analysisResult: '',
        isAnalyzing: false,
        isComplete: false
    }
};

let currentFileName = 'script';

// ========== 초기화 ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOMContentLoaded 발생');
    initializeApp();
});

function initializeApp() {
    console.log('🎬 앱 초기화 시작');
    
    initDarkMode();
    initApiKeyPanel();
    initTextarea();
    initDragAndDrop();
    initTabs();
    initAnalysisButtons();
    initDownloadButtons();
    initCharCounter();
    
    console.log('✅ 앱 초기화 완료');
}

// ========== 다크모드 ==========
function initDarkMode() {
    const toggle = document.getElementById('dark-mode-toggle');
    if (!toggle) return;
    
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
        document.documentElement.classList.add('dark');
    }
    updateDarkModeIcon(isDark);
    
    toggle.addEventListener('click', function() {
        const nowDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('darkMode', nowDark);
        updateDarkModeIcon(nowDark);
    });
}

function updateDarkModeIcon(isDark) {
    const icon = document.querySelector('#dark-mode-toggle i');
    if (icon) {
        icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// ========== API 키 관리 ==========
function initApiKeyPanel() {
    const toggleBtn = document.getElementById('api-key-toggle');
    const panel = document.getElementById('api-key-panel');
    const saveBtn = document.getElementById('save-api-key');
    const deleteBtn = document.getElementById('delete-api-key');
    const input = document.getElementById('gemini-api-key');
    const statusDot = document.getElementById('api-status-dot');
    
    // 상태 표시 업데이트
    function updateStatus() {
        const hasKey = localStorage.getItem('GEMINI_API_KEY');
        if (statusDot) {
            statusDot.className = hasKey 
                ? 'w-2 h-2 rounded-full bg-green-500' 
                : 'w-2 h-2 rounded-full bg-red-500';
        }
    }
    
    updateStatus();
    
    if (toggleBtn && panel) {
        toggleBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            panel.classList.toggle('hidden');
            if (!panel.classList.contains('hidden') && input) {
                input.value = localStorage.getItem('GEMINI_API_KEY') || '';
            }
        });
        
        // 패널 외부 클릭 시 닫기
        document.addEventListener('click', function(e) {
            if (!panel.contains(e.target) && e.target !== toggleBtn) {
                panel.classList.add('hidden');
            }
        });
    }
    
    if (saveBtn && input) {
        saveBtn.addEventListener('click', function() {
            const key = input.value.trim();
            if (key) {
                localStorage.setItem('GEMINI_API_KEY', key);
                alert('API 키가 저장되었습니다.');
                updateStatus();
                panel.classList.add('hidden');
            } else {
                alert('API 키를 입력해주세요.');
            }
        });
    }
    
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function() {
            localStorage.removeItem('GEMINI_API_KEY');
            if (input) input.value = '';
            alert('API 키가 삭제되었습니다.');
            updateStatus();
        });
    }
}

// ========== 텍스트 영역 ==========
function initTextarea() {
    const textarea = document.getElementById('korea-senior-script');
    const sampleBtn = document.getElementById('sample-btn');
    const clearBtn = document.getElementById('clear-btn');
    
    if (sampleBtn) {
        sampleBtn.addEventListener('click', loadSampleScript);
    }
    
    if (clearBtn && textarea) {
        clearBtn.addEventListener('click', function() {
            textarea.value = '';
            updateCharCounter();
        });
    }
}

function loadSampleScript() {
    const textarea = document.getElementById('korea-senior-script');
    if (!textarea) return;
    
    const sample = `[낭독 대본 - 따뜻한 겨울 이야기]

제1장: 첫 만남

찾아와 주셔서 고맙습니다.
오늘은 제가 겪었던 특별한 겨울 이야기를 들려드릴게요.

그해 겨울은 유난히 추웠습니다.
눈이 펑펑 내리는 어느 날, 저는 작은 카페에서 따뜻한 코코아를 마시고 있었어요.

[※ 테스트용 의도적 오류 삽입]
그때 문이 열리며 한 할머니께서 들어오셨습니다.
할머니는 추위에 떨고 계셨고, 저는 자리를 양보해 드렸습니다.

"고마워요, 젊은이."
할머니의 미소가 참 따뜻했습니다.

우리는 그렇게 처음 만낫습니다.
서로의 이야기를 나누며, 시간 가는 줄 몰랐어요.

할머니께서는 옛날 이야기를 들려주셨습니다.
전쟁 때 헤어진 가족을 찾아 평생을 헤맸다고 하셨어요.

저는 그 이야기에 깊이 감동받았습니다.
인생이란 참으로 기구하기도 하고, 아름답기도 하다는 걸 깨달았어요.`;

    textarea.value = sample;
    updateCharCounter();
    console.log('📝 샘플 대본 로드됨');
}

// ========== 글자 수 카운터 ==========
function initCharCounter() {
    const textarea = document.getElementById('korea-senior-script');
    if (textarea) {
        textarea.addEventListener('input', updateCharCounter);
        updateCharCounter();
    }
}

function updateCharCounter() {
    const textarea = document.getElementById('korea-senior-script');
    const counter = document.getElementById('korea-char-counter');
    if (textarea && counter) {
        counter.textContent = `${textarea.value.length}자 / 무제한`;
    }
}

// ========== 드래그 앤 드롭 ==========
function initDragAndDrop() {
    const textarea = document.getElementById('korea-senior-script');
    if (!textarea) return;
    
    textarea.addEventListener('dragover', function(e) {
        e.preventDefault();
        textarea.classList.add('border-blue-500', 'bg-blue-50');
    });
    
    textarea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        textarea.classList.remove('border-blue-500', 'bg-blue-50');
    });
    
    textarea.addEventListener('drop', function(e) {
        e.preventDefault();
        textarea.classList.remove('border-blue-500', 'bg-blue-50');
        
        const file = e.dataTransfer.files[0];
        if (file && file.type === 'text/plain') {
            currentFileName = file.name.replace('.txt', '');
            const reader = new FileReader();
            reader.onload = function(event) {
                textarea.value = event.target.result;
                updateCharCounter();
                console.log('📂 파일 로드됨:', file.name);
            };
            reader.readAsText(file);
        } else {
            alert('텍스트 파일(.txt)만 지원합니다.');
        }
    });
}

// ========== 탭 관리 ==========
function initTabs() {
    const tab1 = document.getElementById('tab-stage1');
    const tab2 = document.getElementById('tab-stage2');
    const content1 = document.getElementById('stage1-content');
    const content2 = document.getElementById('stage2-content');
    
    if (tab1) {
        tab1.addEventListener('click', function() {
            setActiveTab('stage1');
        });
    }
    
    if (tab2) {
        tab2.addEventListener('click', function() {
            setActiveTab('stage2');
        });
    }
}

function setActiveTab(stage) {
    const tab1 = document.getElementById('tab-stage1');
    const tab2 = document.getElementById('tab-stage2');
    const content1 = document.getElementById('stage1-content');
    const content2 = document.getElementById('stage2-content');
    
    if (stage === 'stage1') {
        tab1?.classList.add('border-blue-500', 'text-blue-600');
        tab1?.classList.remove('border-transparent', 'text-gray-500');
        tab2?.classList.remove('border-blue-500', 'text-blue-600');
        tab2?.classList.add('border-transparent', 'text-gray-500');
        content1?.classList.remove('hidden');
        content2?.classList.add('hidden');
    } else {
        tab2?.classList.add('border-blue-500', 'text-blue-600');
        tab2?.classList.remove('border-transparent', 'text-gray-500');
        tab1?.classList.remove('border-blue-500', 'text-blue-600');
        tab1?.classList.add('border-transparent', 'text-gray-500');
        content2?.classList.remove('hidden');
        content1?.classList.add('hidden');
    }
}

// ========== 분석 버튼 ==========
function initAnalysisButtons() {
    const btn1 = document.getElementById('start-stage1');
    const btn2 = document.getElementById('start-stage2');
    
    if (btn1) {
        btn1.addEventListener('click', function() {
            startAnalysis('stage1');
        });
    }
    
    if (btn2) {
        btn2.addEventListener('click', function() {
            startAnalysis('stage2');
        });
    }
}

async function startAnalysis(stage) {
    console.log(`🔍 ${stage} 분석 시작`);
    
    // API 키 확인
    const apiKey = localStorage.getItem('GEMINI_API_KEY');
    if (!apiKey) {
        alert('API 키를 먼저 설정해주세요.');
        return;
    }
    
    // 입력 텍스트 가져오기
    let inputScript = '';
    if (stage === 'stage1') {
        const textarea = document.getElementById('korea-senior-script');
        inputScript = textarea?.value?.trim() || '';
        if (!inputScript) {
            alert('분석할 대본을 입력해주세요.');
            return;
        }
        tabStates.stage1.originalScript = inputScript;
    } else {
        // 2차 분석은 1차 수정본을 사용
        if (!tabStates.stage1.revisedScript) {
            alert('1차 분석을 먼저 완료해주세요.');
            return;
        }
        inputScript = tabStates.stage1.revisedScript;
        tabStates.stage2.originalScript = inputScript;
    }
    
    // UI 상태 변경
    const btn = document.getElementById(`start-${stage}`);
    const progressBar = document.getElementById(`${stage}-progress`);
    
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>분석 중...';
    }
    if (progressBar) {
        progressBar.classList.remove('hidden');
    }
    
    tabStates[stage].isAnalyzing = true;
    
    try {
        // 프롬프트 생성
        const prompt = generatePrompt(stage, inputScript);
        console.log('📤 프롬프트 생성 완료');
        
        // API 호출
        const result = await callGeminiAPI(prompt);
        console.log('📥 API 응답 수신');
        
        // 결과 렌더링
        renderResults(stage, result);
        
        tabStates[stage].isComplete = true;
        console.log(`✅ ${stage} 분석 완료`);
        
    } catch (error) {
        console.error(`❌ ${stage} 분석 실패:`, error);
        alert(`분석 중 오류가 발생했습니다: ${error.message}`);
    } finally {
        // UI 복원
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = stage === 'stage1' 
                ? '<i class="fas fa-play mr-2"></i>1차 분석 시작'
                : '<i class="fas fa-play mr-2"></i>2차 분석 시작';
        }
        if (progressBar) {
            progressBar.classList.add('hidden');
        }
        tabStates[stage].isAnalyzing = false;
    }
}

// ========== 프롬프트 생성 ==========
function generatePrompt(stage, script) {
    if (stage === 'stage1') {
        return `당신은 한국 시니어 낭독용 대본 검수 전문가입니다.

## 분석 대상 대본:
${script}

## 검수 항목:
1. 맞춤법/문법 오류 (예: 오타, 띄어쓰기, 조사 오류)
2. 어색한 표현/문장 (예: 부자연스러운 어순, 중복 표현)
3. 시니어 낭독에 부적절한 표현 (예: 너무 빠른 전개, 어려운 단어)
4. 문장 흐름/연결 문제 (예: 갑작스러운 전환)
5. 기타 개선 필요 사항

## 출력 형식 (반드시 JSON으로만 응답):
{
  "analysis": "번호\t유형\t위치\t변경 내용\t검수 포인트\n1\t맞춤법\t15번째 줄\t'만낫습니다' → '만났습니다'\t받침 오류 수정",
  "revised": "(분석에서 지적한 오류를 모두 수정한 전체 대본)"
}

## 중요 규칙:
1. analysis: 탭(\\t)으로 구분된 TSV 형식. 첫 줄은 헤더, 이후 발견된 각 문제를 한 줄씩 작성
2. revised: analysis에서 지적한 모든 문제를 실제로 수정 적용한 전체 대본
3. 수정할 내용이 없으면 analysis는 "번호\\t유형\\t위치\\t변경 내용\\t검수 포인트\\n(검수 결과 수정 필요 없음)"으로 작성
4. revised는 반드시 수정사항을 반영해야 함. 절대 원본을 그대로 복사하지 마세요
5. JSON 형식 외 다른 텍스트(설명, 인사말 등)는 절대 포함하지 마세요`;
    } else {
        return `당신은 한국 시니어 낭독용 대본 2차 심화 검수 전문가입니다.

## 1차 검수 완료된 대본:
${script}

## 2차 심화 검수 항목:
1. 1차에서 놓친 맞춤법/문법 오류
2. 문장의 자연스러움 및 가독성
3. 시니어 청취자를 위한 표현 최적화
4. 전체적인 흐름과 완성도
5. 낭독 시 호흡 단위 적절성

## 출력 형식 (반드시 JSON으로만 응답):
{
  "analysis": "번호\t유형\t위치\t변경 내용\t검수 포인트\n1\t표현\t5번째 줄\t'깨달았어요' → '깨달았습니다'\t어미 통일",
  "revised": "(2차 검수에서 지적한 오류를 모두 수정한 최종 대본)"
}

## 중요 규칙:
1. analysis: 탭(\\t)으로 구분된 TSV 형식
2. revised: 2차 검수 결과를 반영한 최종 대본
3. 더 이상 수정할 내용이 없으면 analysis에 "(2차 검수 결과 추가 수정 필요 없음)" 작성
4. JSON 형식만 출력하세요`;
    }
}

// ========== Gemini API 호출 ==========
async function callGeminiAPI(prompt) {
    const apiKey = localStorage.getItem('GEMINI_API_KEY');
    if (!apiKey) {
        throw new Error('API 키가 설정되지 않았습니다.');
    }
    
    const endpoint = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 8192
            }
        })
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API 오류: ${response.status}`);
    }
    
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
        throw new Error('API 응답이 비어있습니다.');
    }
    
    return text;
}

// ========== 결과 파싱 ==========
function parseAnalysisResult(rawText) {
    console.log('📝 파싱 시작, 원본 길이:', rawText?.length);
    
    if (!rawText || typeof rawText !== 'string') {
        console.warn('⚠️ 빈 응답');
        return { analysis: '', revised: '', parseError: true };
    }
    
    // JSON 블록 추출
    let jsonStr = rawText;
    
    // ```json ... ``` 형식 처리
    const jsonBlockMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch) {
        jsonStr = jsonBlockMatch[1];
        console.log('📦 JSON 블록 추출됨');
    }
    
    // { } 블록만 추출
    const braceMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (braceMatch) {
        jsonStr = braceMatch[0];
    }
    
    try {
        const parsed = JSON.parse(jsonStr);
        console.log('✅ JSON 파싱 성공');
        console.log('📊 analysis 길이:', parsed.analysis?.length || 0);
        console.log('📝 revised 길이:', parsed.revised?.length || 0);
        
        return {
            analysis: parsed.analysis || '',
            revised: parsed.revised || '',
            parseError: false
        };
    } catch (e) {
        console.error('❌ JSON 파싱 실패:', e.message);
        console.log('📄 파싱 시도한 텍스트 앞부분:', jsonStr.substring(0, 300));
        
        return {
            analysis: rawText,
            revised: '',
            parseError: true
        };
    }
}

// ========== 결과 렌더링 ==========
function renderResults(stage, result) {
    console.log(`🎨 renderResults 호출: ${stage}`);
    
    const parsed = parseAnalysisResult(result);
    
    // 상태 저장
    if (stage === 'stage1') {
        tabStates.stage1.analysisResult = parsed.analysis;
        tabStates.stage1.revisedScript = parsed.revised;
        
        console.log('=== Stage1 원본 ===');
        console.log(tabStates.stage1.originalScript?.substring(0, 200) + '...');
        console.log('=== Stage1 수정본 ===');
        console.log(tabStates.stage1.revisedScript?.substring(0, 200) + '...');
        console.log('=== 동일 여부 ===', tabStates.stage1.originalScript === tabStates.stage1.revisedScript);
    } else {
        tabStates.stage2.analysisResult = parsed.analysis;
        tabStates.stage2.revisedScript = parsed.revised;
        
        console.log('=== Stage2 원본 (Stage1 수정본) ===');
        console.log(tabStates.stage2.originalScript?.substring(0, 200) + '...');
        console.log('=== Stage2 수정본 ===');
        console.log(tabStates.stage2.revisedScript?.substring(0, 200) + '...');
    }
    
    // 좌측: 분석 결과 표
    const analysisContainer = document.getElementById(`${stage}-analysis-result`);
    if (analysisContainer) {
        analysisContainer.innerHTML = renderAnalysisTable(parsed.analysis, parsed.parseError);
    }
    
    // 우측: 수정 반영 대본
    const revisedContainer = document.getElementById(`${stage}-revised-script`);
    if (revisedContainer) {
        const original = stage === 'stage1' 
            ? tabStates.stage1.originalScript 
            : tabStates.stage1.revisedScript;
        const revised = parsed.revised;
        
        if (revised && revised.trim() !== original.trim()) {
            revisedContainer.innerHTML = renderDiffHighlight(original, revised);
            console.log('✅ 차이점 하이라이트 적용됨');
        } else if (revised) {
            revisedContainer.innerHTML = `
                <div class="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p class="text-yellow-700 font-medium mb-2">⚠️ 수정사항 없음</p>
                    <p class="text-yellow-600 text-sm mb-3">AI가 원본과 동일한 텍스트를 반환했거나, 수정이 필요 없다고 판단했습니다.</p>
                    <div class="bg-white p-3 rounded border border-yellow-100">
                        <pre class="whitespace-pre-wrap text-gray-700 text-sm">${escapeHtml(revised)}</pre>
                    </div>
                </div>`;
        } else {
            revisedContainer.innerHTML = `
                <div class="p-4 text-gray-500 text-center">
                    <i class="fas fa-info-circle mr-2"></i>수정본이 생성되지 않았습니다.
                </div>`;
        }
    }
    
    // 2차 분석 다운로드 버튼 표시
    if (stage === 'stage2' && parsed.revised) {
        const downloadArea = document.getElementById('stage2-download-area');
        if (downloadArea) {
            downloadArea.classList.remove('hidden');
        }
    }
}

// ========== 분석 결과 테이블 렌더링 ==========
function renderAnalysisTable(analysisText, isParseError) {
    if (!analysisText || typeof analysisText !== 'string') {
        return '<div class="p-4 text-gray-500 text-center"><i class="fas fa-info-circle mr-2"></i>분석 결과가 없습니다.</div>';
    }
    
    // 파싱 에러인 경우 원본 텍스트 표시
    if (isParseError) {
        return `
            <div class="p-4">
                <div class="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3">
                    <p class="text-orange-700 text-sm"><i class="fas fa-exclamation-triangle mr-2"></i>JSON 파싱 실패 - 원본 응답 표시</p>
                </div>
                <pre class="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-3 rounded">${escapeHtml(analysisText)}</pre>
            </div>`;
    }
    
    // 이스케이프된 문자 복원
    let text = analysisText
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t');
    
    const lines = text.trim().split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
        return '<div class="p-4 text-gray-500 text-center"><i class="fas fa-check-circle mr-2 text-green-500"></i>분석 결과가 없습니다.</div>';
    }
    
    // TSV 형식 확인
    const hasTabs = lines.some(line => line.includes('\t'));
    
    if (!hasTabs) {
        return `
            <div class="p-4">
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                    <p class="text-blue-700 text-sm"><i class="fas fa-clipboard-list mr-2"></i>분석 결과</p>
                </div>
                <pre class="whitespace-pre-wrap text-sm text-gray-700">${escapeHtml(text)}</pre>
            </div>`;
    }
    
    // TSV를 테이블로 변환
    let html = `
        <div class="overflow-x-auto p-2">
            <table class="w-full text-sm border-collapse bg-white">
                <thead>
                    <tr class="bg-gray-100">
                        <th class="border border-gray-300 px-3 py-2 text-left font-medium text-gray-700">번호</th>
                        <th class="border border-gray-300 px-3 py-2 text-left font-medium text-gray-700">유형</th>
                        <th class="border border-gray-300 px-3 py-2 text-left font-medium text-gray-700">위치</th>
                        <th class="border border-gray-300 px-3 py-2 text-left font-medium text-gray-700">변경 내용</th>
                        <th class="border border-gray-300 px-3 py-2 text-left font-medium text-gray-700">검수 포인트</th>
                    </tr>
                </thead>
                <tbody>`;
    
    // 첫 줄이 헤더인지 확인
    const firstCols = lines[0].split('\t');
    const isHeader = firstCols[0] === '번호' || firstCols[0].includes('번호');
    const startIdx = isHeader ? 1 : 0;
    
    let rowCount = 0;
    for (let i = startIdx; i < lines.length; i++) {
        const cols = lines[i].split('\t');
        if (cols.length < 2) continue; // 최소 2개 컬럼 필요
        
        rowCount++;
        html += '<tr class="hover:bg-gray-50">';
        for (let j = 0; j < 5; j++) {
            const cellContent = (cols[j] || '').trim();
            html += `<td class="border border-gray-300 px-3 py-2 text-gray-700">${escapeHtml(cellContent)}</td>`;
        }
        html += '</tr>';
    }
    
    if (rowCount === 0) {
        return `
            <div class="p-4 text-center">
                <i class="fas fa-check-circle text-green-500 text-2xl mb-2"></i>
                <p class="text-gray-600">검수 결과 수정이 필요한 항목이 없습니다.</p>
            </div>`;
    }
    
    html += '</tbody></table></div>';
    
    return html;
}

// ========== Diff 하이라이트 렌더링 ==========
function renderDiffHighlight(original, revised) {
    if (!original || !revised) {
        return '<div class="p-4 text-gray-500">비교할 텍스트가 없습니다.</div>';
    }
    
    const originalLines = original.split('\n');
    const revisedLines = revised.split('\n');
    
    let html = '<div class="p-4 space-y-1 font-mono text-sm">';
    
    const maxLines = Math.max(originalLines.length, revisedLines.length);
    let changeCount = 0;
    
    for (let i = 0; i < maxLines; i++) {
        const origLine = (originalLines[i] || '').trim();
        const revLine = (revisedLines[i] || '').trim();
        
        if (origLine !== revLine) {
            changeCount++;
            // 변경된 라인 - 연한 초록색 배경
            html += `
                <div class="bg-green-50 border-l-4 border-green-400 pl-3 py-1 rounded-r">
                    <span class="text-green-800">${escapeHtml(revisedLines[i] || '') || '<span class="italic text-green-600">(삭제됨)</span>'}</span>
                </div>`;
        } else {
            // 동일한 라인
            html += `
                <div class="pl-4 py-1">
                    <span class="text-gray-700">${escapeHtml(revisedLines[i] || '')}</span>
                </div>`;
        }
    }
    
    html += '</div>';
    
    // 변경 요약 추가
    const summary = `
        <div class="bg-blue-50 border-b border-blue-200 px-4 py-2">
            <span class="text-blue-700 text-sm font-medium">
                <i class="fas fa-edit mr-2"></i>총 ${changeCount}개 라인 수정됨
            </span>
        </div>`;
    
    return summary + html;
}

// ========== 다운로드 ==========
function initDownloadButtons() {
    const downloadBtn = document.getElementById('download-final');
    const downloadVrewBtn = document.getElementById('download-vrew');
    
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
            downloadScript('txt');
        });
    }
    
    if (downloadVrewBtn) {
        downloadVrewBtn.addEventListener('click', function() {
            downloadScript('vrew');
        });
    }
}

function downloadScript(format) {
    const script = tabStates.stage2.revisedScript || tabStates.stage1.revisedScript;
    
    if (!script) {
        alert('다운로드할 수정본이 없습니다.');
        return;
    }
    
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    let filename, content;
    
    if (format === 'vrew') {
        filename = `${currentFileName}_vrew_${date}.txt`;
        content = formatForVrew(script);
    } else {
        filename = `${currentFileName}_reviewed_${date}.txt`;
        content = script;
    }
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log('📥 다운로드 완료:', filename);
}

function formatForVrew(script) {
    // Vrew 형식: 각 문장을 개별 라인으로
    return script
        .split(/(?<=[.!?])\s+/)
        .map(line => line.trim())
        .filter(line => line)
        .join('\n');
}

// ========== 유틸리티 ==========
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========== 전역 노출 ==========
window.MAIN_JS_LOADED = true;
window.tabStates = tabStates;

console.log('✅ main.js v3.2 초기화 준비 완료');
