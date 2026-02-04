/** ======================================================
 * KORE-JA SCRIPT LINTER - MAIN.JS
 * 2-Stage Pipeline Analysis System v3.3
 * Features: TSV Table + Diff Highlight (ID Fixed)
 * ====================================================== */

console.log('🚀 main.js v3.3 (ID Fixed) 로드됨');

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
    initFileUpload();
    initDragAndDrop();
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
    const toggleBtn = document.getElementById('api-key-toggle-btn');
    const panel = document.getElementById('api-key-panel');
    const closeBtn = document.getElementById('api-key-close-btn');
    const saveBtn = document.getElementById('api-key-save-btn');
    const deleteBtn = document.getElementById('api-key-delete-btn');
    const input = document.getElementById('api-key-input');
    const statusText = document.getElementById('api-key-status-text');
    const statusIcon = document.getElementById('api-key-status-icon');
    
    function updateApiKeyStatus() {
        const hasKey = localStorage.getItem('GEMINI_API_KEY');
        if (statusText) {
            statusText.textContent = hasKey ? 'API 키 설정됨' : 'API 키 설정';
        }
        if (statusIcon) {
            statusIcon.textContent = hasKey ? '✅' : '🔑';
        }
    }
    
    updateApiKeyStatus();
    
    if (toggleBtn && panel) {
        toggleBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            panel.classList.toggle('hidden');
            if (!panel.classList.contains('hidden') && input) {
                input.value = localStorage.getItem('GEMINI_API_KEY') || '';
            }
        });
    }
    
    if (closeBtn && panel) {
        closeBtn.addEventListener('click', function() {
            panel.classList.add('hidden');
        });
    }
    
    if (saveBtn && input) {
        saveBtn.addEventListener('click', function() {
            const key = input.value.trim();
            if (key) {
                localStorage.setItem('GEMINI_API_KEY', key);
                alert('API 키가 저장되었습니다.');
                updateApiKeyStatus();
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
            updateApiKeyStatus();
        });
    }
    
    // 외부 클릭 시 닫기
    document.addEventListener('click', function(e) {
        if (panel && toggleBtn && !panel.contains(e.target) && !toggleBtn.contains(e.target)) {
            panel.classList.add('hidden');
        }
    });
}

// ========== 텍스트 영역 ==========
function initTextarea() {
    const sampleBtn = document.getElementById('korea-senior-sample-btn');
    const clearBtn = document.getElementById('korea-senior-clear-btn');
    const textarea = document.getElementById('korea-senior-script');
    
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

// ========== 파일 업로드 ==========
function initFileUpload() {
    const uploadBtn = document.getElementById('btn-upload-file');
    const fileInput = document.getElementById('file-upload-input');
    const textarea = document.getElementById('korea-senior-script');
    
    if (uploadBtn && fileInput) {
        uploadBtn.addEventListener('click', function() {
            fileInput.click();
        });
        
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file && textarea) {
                currentFileName = file.name.replace('.txt', '');
                const reader = new FileReader();
                reader.onload = function(event) {
                    textarea.value = event.target.result;
                    updateCharCounter();
                    console.log('📂 파일 로드됨:', file.name);
                };
                reader.readAsText(file);
            }
        });
    }
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
    const dropZone = document.getElementById('drop-zone');
    const dropOverlay = document.getElementById('drop-overlay');
    const textarea = document.getElementById('korea-senior-script');
    
    if (!dropZone || !textarea) return;
    
    dropZone.addEventListener('dragover', function(e) {
        e.preventDefault();
        if (dropOverlay) dropOverlay.classList.remove('hidden');
    });
    
    dropZone.addEventListener('dragleave', function(e) {
        e.preventDefault();
        if (dropOverlay) dropOverlay.classList.add('hidden');
    });
    
    dropZone.addEventListener('drop', function(e) {
        e.preventDefault();
        if (dropOverlay) dropOverlay.classList.add('hidden');
        
        const file = e.dataTransfer.files[0];
        if (file && file.type === 'text/plain') {
            currentFileName = file.name.replace('.txt', '');
            const reader = new FileReader();
            reader.onload = function(event) {
                textarea.value = event.target.result;
                updateCharCounter();
                console.log('📂 드래그 파일 로드됨:', file.name);
            };
            reader.readAsText(file);
        } else {
            alert('텍스트 파일(.txt)만 지원합니다.');
        }
    });
}

// ========== 분석 버튼 ==========
function initAnalysisButtons() {
    const btn1 = document.getElementById('btn-stage1');
    const btn2 = document.getElementById('btn-stage2');
    
    if (btn1) {
        btn1.addEventListener('click', function() {
            startAnalysis('stage1');
        });
        console.log('✅ 1차 분석 버튼 연결됨');
    } else {
        console.error('❌ btn-stage1 버튼을 찾을 수 없음');
    }
    
    if (btn2) {
        btn2.addEventListener('click', function() {
            startAnalysis('stage2');
        });
        console.log('✅ 2차 분석 버튼 연결됨');
    }
}

async function startAnalysis(stage) {
    console.log(`🔍 ${stage} 분석 시작`);
    
    // API 키 확인
    const apiKey = localStorage.getItem('GEMINI_API_KEY');
    if (!apiKey) {
        alert('API 키를 먼저 설정해주세요.\n우측 상단의 "API 키 설정" 버튼을 클릭하세요.');
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
        if (!tabStates.stage1.revisedScript && !tabStates.stage1.originalScript) {
            alert('1차 분석을 먼저 완료해주세요.');
            return;
        }
        inputScript = tabStates.stage1.revisedScript || tabStates.stage1.originalScript;
        tabStates.stage2.originalScript = inputScript;
    }
    
    // UI 상태 변경
    const btn = document.getElementById(`btn-${stage}`);
    const statusBadge = document.getElementById(`status-${stage}`);
    const progressContainer = document.getElementById(`progress-container-${stage}`);
    const progressBar = document.getElementById(`progress-bar-${stage}`);
    const progressText = document.getElementById(`progress-text-${stage}`);
    const resultContainer = document.getElementById(`result-${stage}`);
    
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> 분석 중...';
        btn.classList.remove('bg-indigo-500', 'hover:bg-indigo-600', 'bg-purple-500', 'hover:bg-purple-600');
        btn.classList.add('bg-gray-400', 'cursor-not-allowed');
    }
    
    if (statusBadge) {
        statusBadge.textContent = '분석 중';
        statusBadge.classList.remove('bg-gray-200', 'text-gray-600', 'bg-green-200', 'text-green-700');
        statusBadge.classList.add('bg-yellow-200', 'text-yellow-700');
    }
    
    if (progressContainer) {
        progressContainer.classList.remove('hidden');
    }
    
    // 프로그레스 시뮬레이션
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 90) progress = 90;
        if (progressBar) progressBar.style.width = `${progress}%`;
        if (progressText) progressText.textContent = `${Math.round(progress)}%`;
    }, 500);
    
    tabStates[stage].isAnalyzing = true;
    
    try {
        const prompt = generatePrompt(stage, inputScript);
        console.log('📤 프롬프트 생성 완료');
        
        const result = await callGeminiAPI(prompt);
        console.log('📥 API 응답 수신');
        
        // 프로그레스 완료
        clearInterval(progressInterval);
        if (progressBar) progressBar.style.width = '100%';
        if (progressText) progressText.textContent = '100%';
        
        // 결과 표시
        if (resultContainer) {
            resultContainer.classList.remove('hidden');
        }
        
        renderResults(stage, result);
        
        tabStates[stage].isComplete = true;
        
        // 상태 업데이트
        if (statusBadge) {
            statusBadge.textContent = '완료';
            statusBadge.classList.remove('bg-yellow-200', 'text-yellow-700');
            statusBadge.classList.add('bg-green-200', 'text-green-700');
        }
        
        // 1차 완료 시 2차 버튼 활성화
        if (stage === 'stage1') {
            const btn2 = document.getElementById('btn-stage2');
            if (btn2) {
                btn2.disabled = false;
                btn2.classList.remove('bg-gray-400', 'cursor-not-allowed');
                btn2.classList.add('bg-purple-500', 'hover:bg-purple-600');
            }
        }
        
        // 2차 완료 시 다운로드 버튼 활성화
        if (stage === 'stage2') {
            const downloadBtn = document.getElementById('download-revised-btn');
            if (downloadBtn) {
                downloadBtn.disabled = false;
            }
        }
        
        console.log(`✅ ${stage} 분석 완료`);
        
    } catch (error) {
        console.error(`❌ ${stage} 분석 실패:`, error);
        clearInterval(progressInterval);
        
        if (statusBadge) {
            statusBadge.textContent = '오류';
            statusBadge.classList.remove('bg-yellow-200', 'text-yellow-700');
            statusBadge.classList.add('bg-red-200', 'text-red-700');
        }
        
        alert(`분석 중 오류가 발생했습니다:\n${error.message}`);
    } finally {
        // 버튼 복원
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = stage === 'stage1' 
                ? '<i class="fas fa-play mr-1"></i> 1차 분석 시작'
                : '<i class="fas fa-play mr-1"></i> 2차 분석 시작';
            btn.classList.remove('bg-gray-400', 'cursor-not-allowed');
            if (stage === 'stage1') {
                btn.classList.add('bg-indigo-500', 'hover:bg-indigo-600');
            } else {
                btn.classList.add('bg-purple-500', 'hover:bg-purple-600');
            }
        }
        
        if (progressContainer) {
            setTimeout(() => {
                progressContainer.classList.add('hidden');
            }, 1000);
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
  "analysis": "번호\\t유형\\t위치\\t변경 내용\\t검수 포인트\\n1\\t맞춤법\\t15번째 줄\\t'만낫습니다' → '만났습니다'\\t받침 오류 수정",
  "revised": "(분석에서 지적한 오류를 모두 수정한 전체 대본)"
}

## 중요 규칙:
1. analysis: 탭(\\t)으로 구분된 TSV 형식. 첫 줄은 헤더, 이후 발견된 각 문제를 한 줄씩 작성
2. revised: analysis에서 지적한 모든 문제를 실제로 수정 적용한 전체 대본
3. 수정할 내용이 없으면 analysis는 "번호\\t유형\\t위치\\t변경 내용\\t검수 포인트\\n(검수 결과 수정 필요 없음)"으로 작성
4. revised는 반드시 수정사항을 반영해야 함. 절대 원본을 그대로 복사하지 마세요
5. JSON 형식 외 다른 텍스트(설명, 인사말 등)는 절대 포함하지 마세요
6. analysis는 최대 10개 항목까지만 작성하세요
7. 반드시 완전한 JSON 형식으로 응답을 마무리하세요`;
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
  "analysis": "번호\\t유형\\t위치\\t변경 내용\\t검수 포인트\\n1\\t표현\\t5번째 줄\\t'깨달았어요' → '깨달았습니다'\\t어미 통일",
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
    
const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;


    
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
    maxOutputTokens: 65536
}

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
    
    let jsonStr = rawText.trim();
    
    // ```json 또는 ``` 제거 (여러 형식 대응)
    jsonStr = jsonStr.replace(/^```json\s*/i, '');
    jsonStr = jsonStr.replace(/^```\s*/i, '');
    jsonStr = jsonStr.replace(/\s*```$/i, '');
    jsonStr = jsonStr.trim();
    
    // { } 블록만 추출
    const braceMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (braceMatch) {
        jsonStr = braceMatch[0];
        console.log('📦 JSON 블록 추출됨');
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
        console.log('📄 파싱 시도한 텍스트:', jsonStr.substring(0, 500));
        
        // 폴백: analysis와 revised를 수동 추출 시도
        let analysis = '';
        let revised = '';
        
        const analysisMatch = rawText.match(/"analysis"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"revised"|"\s*})/);
        if (analysisMatch) {
            analysis = analysisMatch[1].replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\"/g, '"');
            console.log('🔧 analysis 수동 추출 성공');
        }
        
        const revisedMatch = rawText.match(/"revised"\s*:\s*"([\s\S]*?)"\s*}/);
        if (revisedMatch) {
            revised = revisedMatch[1].replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\"/g, '"');
            console.log('🔧 revised 수동 추출 성공');
        }
        
        if (analysis || revised) {
            return {
                analysis: analysis,
                revised: revised,
                parseError: false
            };
        }
        
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
        
        console.log('=== Stage2 원본 ===');
        console.log(tabStates.stage2.originalScript?.substring(0, 200) + '...');
        console.log('=== Stage2 수정본 ===');
        console.log(tabStates.stage2.revisedScript?.substring(0, 200) + '...');
    }
    
    // 좌측: 분석 결과 표
    const tableContainer = document.getElementById(`result-table-${stage}`);
    if (tableContainer) {
        tableContainer.innerHTML = renderAnalysisTable(parsed.analysis, parsed.parseError);
    }
    
    // 우측: 수정 반영 대본
    const revisedContainer = document.getElementById(`revised-${stage}`);
    if (revisedContainer) {
        const original = stage === 'stage1' 
            ? tabStates.stage1.originalScript 
            : tabStates.stage1.revisedScript;
        const revised = parsed.revised;
        
        if (revised && revised.trim() !== original?.trim()) {
            revisedContainer.innerHTML = renderDiffHighlight(original, revised);
            console.log('✅ 차이점 하이라이트 적용됨');
        } else if (revised) {
            revisedContainer.innerHTML = `
                <div class="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                    <p class="text-yellow-700 dark:text-yellow-300 font-medium mb-2 text-sm">⚠️ 수정사항 없음</p>
                    <p class="text-yellow-600 dark:text-yellow-400 text-xs mb-3">AI가 원본과 동일한 텍스트를 반환했거나, 수정이 필요 없다고 판단했습니다.</p>
                    <div class="bg-white dark:bg-gray-800 p-3 rounded border border-yellow-100 dark:border-yellow-800">
                        <pre class="whitespace-pre-wrap text-gray-700 dark:text-gray-300 text-sm">${escapeHtml(revised)}</pre>
                    </div>
                </div>`;
        } else {
            revisedContainer.innerHTML = `
                <div class="p-4 text-gray-500 text-center">
                    <i class="fas fa-info-circle mr-2"></i>수정본이 생성되지 않았습니다.
                </div>`;
        }
    }
}

// ========== 분석 결과 테이블 렌더링 ==========
function renderAnalysisTable(analysisText, isParseError) {
    if (!analysisText || typeof analysisText !== 'string') {
        return '<div class="p-4 text-gray-400 text-center"><i class="fas fa-info-circle mr-2"></i>분석 결과가 없습니다.</div>';
    }
    
    if (isParseError) {
        return `
            <div class="p-3">
                <div class="bg-orange-900/30 border border-orange-700 rounded-lg p-3 mb-3">
                    <p class="text-orange-300 text-sm"><i class="fas fa-exclamation-triangle mr-2"></i>JSON 파싱 실패 - 원본 응답 표시</p>
                </div>
                <pre class="whitespace-pre-wrap text-sm text-gray-300 bg-gray-800 p-3 rounded">${escapeHtml(analysisText)}</pre>
            </div>`;
    }
    
    // 이스케이프된 문자 복원
    let text = analysisText
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t');
    
    const lines = text.trim().split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
        return '<div class="p-4 text-gray-400 text-center"><i class="fas fa-check-circle mr-2 text-green-400"></i>분석 결과가 없습니다.</div>';
    }
    
    const hasTabs = lines.some(line => line.includes('\t'));
    
    if (!hasTabs) {
        return `
            <div class="p-3">
                <div class="bg-blue-900/30 border border-blue-700 rounded-lg p-3 mb-3">
                    <p class="text-blue-300 text-sm"><i class="fas fa-clipboard-list mr-2"></i>분석 결과</p>
                </div>
                <pre class="whitespace-pre-wrap text-sm text-gray-300">${escapeHtml(text)}</pre>
            </div>`;
    }
    
    // TSV를 테이블로 변환
    let html = `
        <div class="overflow-x-auto p-2">
            <table class="w-full text-xs border-collapse">
                <thead>
                    <tr class="bg-gray-700">
                        <th class="border border-gray-600 px-2 py-1.5 text-left font-medium text-gray-200">번호</th>
                        <th class="border border-gray-600 px-2 py-1.5 text-left font-medium text-gray-200">유형</th>
                        <th class="border border-gray-600 px-2 py-1.5 text-left font-medium text-gray-200">위치</th>
                        <th class="border border-gray-600 px-2 py-1.5 text-left font-medium text-gray-200">변경 내용</th>
                        <th class="border border-gray-600 px-2 py-1.5 text-left font-medium text-gray-200">검수 포인트</th>
                    </tr>
                </thead>
                <tbody>`;
    
    const firstCols = lines[0].split('\t');
    const isHeader = firstCols[0] === '번호' || firstCols[0].includes('번호');
    const startIdx = isHeader ? 1 : 0;
    
    let rowCount = 0;
    for (let i = startIdx; i < lines.length; i++) {
        const cols = lines[i].split('\t');
        if (cols.length < 2) continue;
        
        rowCount++;
        html += '<tr class="hover:bg-gray-700/50">';
        for (let j = 0; j < 5; j++) {
            const cellContent = (cols[j] || '').trim();
            html += `<td class="border border-gray-600 px-2 py-1.5 text-gray-300">${escapeHtml(cellContent)}</td>`;
        }
        html += '</tr>';
    }
    
    if (rowCount === 0) {
        return `
            <div class="p-4 text-center">
                <i class="fas fa-check-circle text-green-400 text-2xl mb-2"></i>
                <p class="text-gray-400">검수 결과 수정이 필요한 항목이 없습니다.</p>
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
    
    let html = '<div class="p-3 space-y-0.5 text-sm">';
    
    const maxLines = Math.max(originalLines.length, revisedLines.length);
    let changeCount = 0;
    
    for (let i = 0; i < maxLines; i++) {
        const origLine = (originalLines[i] || '').trim();
        const revLine = (revisedLines[i] || '').trim();
        
        if (origLine !== revLine) {
            changeCount++;
            html += `
                <div class="bg-green-50 dark:bg-green-900/30 border-l-4 border-green-400 pl-3 py-1 rounded-r">
                    <span class="text-green-800 dark:text-green-300">${escapeHtml(revisedLines[i] || '') || '<span class="italic text-green-600">(삭제됨)</span>'}</span>
                </div>`;
        } else {
            html += `
                <div class="pl-4 py-0.5">
                    <span class="text-gray-700 dark:text-gray-300">${escapeHtml(revisedLines[i] || '')}</span>
                </div>`;
        }
    }
    
    html += '</div>';
    
    const summary = `
        <div class="bg-blue-50 dark:bg-blue-900/30 border-b border-blue-200 dark:border-blue-700 px-3 py-2">
            <span class="text-blue-700 dark:text-blue-300 text-sm font-medium">
                <i class="fas fa-edit mr-2"></i>총 ${changeCount}개 라인 수정됨
            </span>
        </div>`;
    
    return summary + html;
}

// ========== 다운로드 ==========
function initDownloadButtons() {
    const downloadBtn = document.getElementById('download-revised-btn');
    
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
            downloadScript('txt');
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
    const filename = `${currentFileName}_reviewed_${date}.txt`;
    
    const blob = new Blob([script], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log('📥 다운로드 완료:', filename);
}

// ========== 유틸리티 ==========
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========== 전역 노출 ==========
window.__MAIN_JS_LOADED__ = true;
window.MAIN_JS_LOADED = true;
window.tabStates = tabStates;

console.log('✅ main.js v3.3 초기화 준비 완료');
