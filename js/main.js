/** ======================================================
 * KORE-JA SCRIPT LINTER - MAIN.JS
 * 2-Stage Pipeline Analysis System v3.5
 * Features: New Table Columns + Full Script Diff
 * ====================================================== */

console.log('🚀 main.js v3.5 로드됨');

// ========== 전역 상태 ==========
var tabStates = {
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

var currentFileName = 'script';

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
    var toggle = document.getElementById('dark-mode-toggle');
    if (!toggle) return;
    
    var isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
        document.documentElement.classList.add('dark');
    }
    updateDarkModeIcon(isDark);
    
    toggle.addEventListener('click', function() {
        var nowDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('darkMode', nowDark);
        updateDarkModeIcon(nowDark);
    });
}

function updateDarkModeIcon(isDark) {
    var icon = document.querySelector('#dark-mode-toggle i');
    if (icon) {
        icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// ========== API 키 관리 ==========
function initApiKeyPanel() {
    var toggleBtn = document.getElementById('api-key-toggle-btn');
    var panel = document.getElementById('api-key-panel');
    var closeBtn = document.getElementById('api-key-close-btn');
    var saveBtn = document.getElementById('api-key-save-btn');
    var deleteBtn = document.getElementById('api-key-delete-btn');
    var input = document.getElementById('api-key-input');
    var statusText = document.getElementById('api-key-status-text');
    var statusIcon = document.getElementById('api-key-status-icon');
    
    function updateApiKeyStatus() {
        var hasKey = localStorage.getItem('GEMINI_API_KEY');
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
            var key = input.value.trim();
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
    
    document.addEventListener('click', function(e) {
        if (panel && toggleBtn && !panel.contains(e.target) && !toggleBtn.contains(e.target)) {
            panel.classList.add('hidden');
        }
    });
}

// ========== 텍스트 영역 ==========
function initTextarea() {
    var sampleBtn = document.getElementById('korea-senior-sample-btn');
    var clearBtn = document.getElementById('korea-senior-clear-btn');
    var textarea = document.getElementById('korea-senior-script');
    
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
    var textarea = document.getElementById('korea-senior-script');
    if (!textarea) return;
    
    var sample = '[낭독 대본 - 따뜻한 겨울 이야기]\n\n' +
        '제1장: 첫 만남\n\n' +
        '찾아와 주셔서 고맙습니다.\n' +
        '오늘은 제가 겪었던 특별한 겨울 이야기를 들려드릴게요.\n\n' +
        '그해 겨울은 유난히 추웠습니다.\n' +
        '눈이 펑펑 내리는 어느 날, 저는 작은 카페에서 따뜻한 코코아를 마시고 있었어요.\n\n' +
        '[※ 테스트용 의도적 오류 삽입]\n' +
        '그때 문이 열리며 한 할머니께서 들어오셨습니다.\n' +
        '할머니는 추위에 떨고 계셨고, 저는 자리를 양보해 드렸습니다.\n\n' +
        '"고마워요, 젊은이."\n' +
        '할머니의 미소가 참 따뜻했습니다.\n\n' +
        '우리는 그렇게 처음 만낫습니다.\n' +
        '서로의 이야기를 나누며, 시간 가는 줄 몰랐어요.\n\n' +
        '할머니께서는 옛날 이야기를 들려주셨습니다.\n' +
        '전쟁 때 헤어진 가족을 찾아 평생을 헤맸다고 하셨어요.\n\n' +
        '저는 그 이야기에 깊이 감동받았습니다.\n' +
        '인생이란 참으로 기구하기도 하고, 아름답기도 하다는 걸 깨달았어요.';

    textarea.value = sample;
    updateCharCounter();
    console.log('📝 샘플 대본 로드됨');
}

// ========== 파일 업로드 ==========
function initFileUpload() {
    var uploadBtn = document.getElementById('btn-upload-file');
    var fileInput = document.getElementById('file-upload-input');
    var textarea = document.getElementById('korea-senior-script');
    
    if (uploadBtn && fileInput) {
        uploadBtn.addEventListener('click', function() {
            fileInput.click();
        });
        
        fileInput.addEventListener('change', function(e) {
            var file = e.target.files[0];
            if (file && textarea) {
                currentFileName = file.name.replace(/\.txt$/i, '');
                var reader = new FileReader();
                reader.onload = function(event) {
                    textarea.value = event.target.result;
                    updateCharCounter();
                    console.log('📂 파일 로드됨:', file.name);
                };
                reader.readAsText(file, 'UTF-8');
            }
        });
    }
}

// ========== 글자 수 카운터 ==========
function initCharCounter() {
    var textarea = document.getElementById('korea-senior-script');
    if (textarea) {
        textarea.addEventListener('input', updateCharCounter);
        updateCharCounter();
    }
}

function updateCharCounter() {
    var textarea = document.getElementById('korea-senior-script');
    var counter = document.getElementById('korea-char-counter');
    if (textarea && counter) {
        counter.textContent = textarea.value.length + '자 / 무제한';
    }
}

// ========== 드래그 앤 드롭 ==========
function initDragAndDrop() {
    var dropZone = document.getElementById('drop-zone');
    var dropOverlay = document.getElementById('drop-overlay');
    var textarea = document.getElementById('korea-senior-script');
    
    if (!dropZone || !textarea) {
        console.warn('⚠️ 드래그 앤 드롭: 요소를 찾을 수 없음');
        return;
    }
    
    console.log('✅ 드래그 앤 드롭 초기화됨');
    
    function handleFile(file) {
        if (!file) return;
        
        console.log('📁 파일 감지:', file.name);
        
        var isTextFile = file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt');
        
        if (isTextFile) {
            currentFileName = file.name.replace(/\.txt$/i, '');
            var reader = new FileReader();
            reader.onload = function(event) {
                textarea.value = event.target.result;
                updateCharCounter();
                console.log('📂 드래그 파일 로드 완료:', file.name);
            };
            reader.readAsText(file, 'UTF-8');
        } else {
            alert('텍스트 파일(.txt)만 지원합니다.');
        }
    }
    
    dropZone.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (dropOverlay) dropOverlay.classList.remove('hidden');
    });
    
    dropZone.addEventListener('dragleave', function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (dropOverlay) dropOverlay.classList.add('hidden');
    });
    
    dropZone.addEventListener('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (dropOverlay) dropOverlay.classList.add('hidden');
        handleFile(e.dataTransfer.files[0]);
    });
    
    textarea.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
    });
    
    textarea.addEventListener('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        handleFile(e.dataTransfer.files[0]);
    });
}

// ========== 분석 버튼 ==========
function initAnalysisButtons() {
    var btn1 = document.getElementById('btn-stage1');
    var btn2 = document.getElementById('btn-stage2');
    
    if (btn1) {
        btn1.addEventListener('click', function() {
            startAnalysis('stage1');
        });
        console.log('✅ 1차 분석 버튼 연결됨');
    }
    
    if (btn2) {
        btn2.addEventListener('click', function() {
            startAnalysis('stage2');
        });
        console.log('✅ 2차 분석 버튼 연결됨');
    }
}

async function startAnalysis(stage) {
    console.log('🔍 ' + stage + ' 분석 시작');
    
    var apiKey = localStorage.getItem('GEMINI_API_KEY');
    if (!apiKey) {
        alert('API 키를 먼저 설정해주세요.');
        return;
    }
    
    var inputScript = '';
    if (stage === 'stage1') {
        var textarea = document.getElementById('korea-senior-script');
        inputScript = textarea ? textarea.value.trim() : '';
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
    
    var btn = document.getElementById('btn-' + stage);
    var statusBadge = document.getElementById('status-' + stage);
    var progressContainer = document.getElementById('progress-container-' + stage);
    var progressBar = document.getElementById('progress-bar-' + stage);
    var progressText = document.getElementById('progress-text-' + stage);
    var resultContainer = document.getElementById('result-' + stage);
    
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> 분석 중...';
        btn.className = 'btn-analyze px-4 py-2 bg-gray-400 text-white text-sm rounded-lg cursor-not-allowed';
    }
    
    if (statusBadge) {
        statusBadge.textContent = '분석 중';
        statusBadge.className = 'ml-2 status-badge bg-yellow-200 text-yellow-700 text-xs px-2 py-1 rounded-full';
    }
    
    if (progressContainer) {
        progressContainer.classList.remove('hidden');
    }
    
    var progress = 0;
    var progressInterval = setInterval(function() {
        progress += Math.random() * 15;
        if (progress > 90) progress = 90;
        if (progressBar) progressBar.style.width = progress + '%';
        if (progressText) progressText.textContent = Math.round(progress) + '%';
    }, 500);
    
    tabStates[stage].isAnalyzing = true;
    
    try {
        var prompt = generatePrompt(stage, inputScript);
        console.log('📤 프롬프트 생성 완료');
        
        var result = await callGeminiAPI(prompt);
        console.log('📥 API 응답 수신');
        
        clearInterval(progressInterval);
        if (progressBar) progressBar.style.width = '100%';
        if (progressText) progressText.textContent = '100%';
        
        if (resultContainer) {
            resultContainer.classList.remove('hidden');
        }
        
        renderResults(stage, result);
        
        tabStates[stage].isComplete = true;
        
        if (statusBadge) {
            statusBadge.textContent = '완료';
            statusBadge.className = 'ml-2 status-badge bg-green-200 text-green-700 text-xs px-2 py-1 rounded-full';
        }
        
        if (stage === 'stage1') {
            var btn2 = document.getElementById('btn-stage2');
            if (btn2) {
                btn2.disabled = false;
                btn2.className = 'btn-analyze px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm rounded-lg transition-colors shadow-sm';
            }
        }
        
        if (stage === 'stage2') {
            var downloadBtn = document.getElementById('download-revised-btn');
            if (downloadBtn) {
                downloadBtn.disabled = false;
            }
        }
        
        console.log('✅ ' + stage + ' 분석 완료');
        
    } catch (error) {
        console.error('❌ ' + stage + ' 분석 실패:', error);
        clearInterval(progressInterval);
        
        if (statusBadge) {
            statusBadge.textContent = '오류';
            statusBadge.className = 'ml-2 status-badge bg-red-200 text-red-700 text-xs px-2 py-1 rounded-full';
        }
        
        alert('분석 중 오류가 발생했습니다:\n' + error.message);
    } finally {
        if (btn) {
            btn.disabled = false;
            if (stage === 'stage1') {
                btn.innerHTML = '<i class="fas fa-play mr-1"></i> 1차 분석 시작';
                btn.className = 'btn-analyze px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm rounded-lg transition-colors shadow-sm';
            } else {
                btn.innerHTML = '<i class="fas fa-play mr-1"></i> 2차 분석 시작';
                btn.className = 'btn-analyze px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm rounded-lg transition-colors shadow-sm';
            }
        }
        
        if (progressContainer) {
            setTimeout(function() {
                progressContainer.classList.add('hidden');
            }, 1000);
        }
        
        tabStates[stage].isAnalyzing = false;
    }
}

// ========== 프롬프트 생성 ==========
function generatePrompt(stage, script) {
    if (stage === 'stage1') {
        return '당신은 한국 시니어 낭독용 대본 검수 전문가입니다.\n\n' +
            '## 분석 대상 대본:\n' + script + '\n\n' +
            '## 검수 항목:\n' +
            '1. 맞춤법/문법 오류\n' +
            '2. 어색한 표현/문장\n' +
            '3. 시니어 낭독에 부적절한 표현\n' +
            '4. 문장 흐름/연결 문제\n\n' +
            '## 출력 형식 (반드시 JSON으로만 응답):\n' +
            '{\n' +
            '  "analysis": "번호\\t유형\\t오류 대본\\t변경 대본\\t검수 포인트\\n1\\t맞춤법\\t만낫습니다\\t만났습니다\\t받침 오류 수정",\n' +
            '  "revised": "전체 수정된 대본 내용"\n' +
            '}\n\n' +
            '## 중요 규칙:\n' +
            '1. analysis: TSV 형식 (탭으로 구분)\n' +
            '   - 번호: 순번\n' +
            '   - 유형: 맞춤법/표현/흐름 등\n' +
            '   - 오류 대본: 원본에서 문제가 있는 부분 (해당 문장이나 구절)\n' +
            '   - 변경 대본: 수정된 내용\n' +
            '   - 검수 포인트: 수정 이유 설명\n' +
            '2. revised: 모든 오류를 수정한 전체 대본\n' +
            '3. 최대 10개 항목까지만 작성\n' +
            '4. 반드시 완전한 JSON으로 응답 마무리\n' +
            '5. JSON 외 다른 텍스트 금지';
    } else {
        return '당신은 한국 시니어 낭독용 대본 2차 심화 검수 전문가입니다.\n\n' +
            '## 1차 검수 완료된 대본:\n' + script + '\n\n' +
            '## 2차 검수 항목:\n' +
            '1. 1차에서 놓친 오류\n' +
            '2. 문장 자연스러움\n' +
            '3. 시니어 표현 최적화\n\n' +
            '## 출력 형식 (반드시 JSON으로만 응답):\n' +
            '{\n' +
            '  "analysis": "번호\\t유형\\t오류 대본\\t변경 대본\\t검수 포인트\\n1\\t표현\\t원본 문장\\t수정 문장\\t설명",\n' +
            '  "revised": "최종 수정 대본"\n' +
            '}\n\n' +
            '## 중요 규칙:\n' +
            '1. 반드시 완전한 JSON으로 응답\n' +
            '2. JSON 외 다른 텍스트 금지';
    }
}

// ========== Gemini API 호출 ==========
async function callGeminiAPI(prompt) {
    var apiKey = localStorage.getItem('GEMINI_API_KEY');
    if (!apiKey) {
        throw new Error('API 키가 설정되지 않았습니다.');
    }
    
    var endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + apiKey;
    
    var response = await fetch(endpoint, {
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
        })
    });
    
    if (!response.ok) {
        var errorData = await response.json().catch(function() { return {}; });
        throw new Error(errorData.error?.message || 'API 오류: ' + response.status);
    }
    
    var data = await response.json();
    var text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
        throw new Error('API 응답이 비어있습니다.');
    }
    
    return text;
}

// ========== 결과 파싱 ==========
function parseAnalysisResult(rawText) {
    console.log('📝 파싱 시작, 원본 길이:', rawText ? rawText.length : 0);
    
    if (!rawText || typeof rawText !== 'string') {
        return { analysis: '', revised: '', parseError: true };
    }
    
    var jsonStr = rawText.trim();
    
    jsonStr = jsonStr.replace(/^```json\s*/i, '');
    jsonStr = jsonStr.replace(/^```\s*/i, '');
    jsonStr = jsonStr.replace(/\s*```$/i, '');
    jsonStr = jsonStr.trim();
    
    var braceMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (braceMatch) {
        jsonStr = braceMatch[0];
        console.log('📦 JSON 블록 추출됨');
    }
    
    try {
        var parsed = JSON.parse(jsonStr);
        console.log('✅ JSON 파싱 성공');
        return {
            analysis: parsed.analysis || '',
            revised: parsed.revised || '',
            parseError: false
        };
    } catch (e) {
        console.error('❌ JSON 파싱 실패:', e.message);
        
        var analysis = '';
        var revised = '';
        
        var analysisMatch = rawText.match(/"analysis"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"revised"|"\s*})/);
        if (analysisMatch) {
            analysis = analysisMatch[1].replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\"/g, '"');
            console.log('🔧 analysis 수동 추출 성공');
        }
        
        var revisedMatch = rawText.match(/"revised"\s*:\s*"([\s\S]*?)"\s*}/);
        if (revisedMatch) {
            revised = revisedMatch[1].replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\"/g, '"');
            console.log('🔧 revised 수동 추출 성공');
        }
        
        if (analysis || revised) {
            return { analysis: analysis, revised: revised, parseError: false };
        }
        
        return { analysis: rawText, revised: '', parseError: true };
    }
}

// ========== 결과 렌더링 ==========
function renderResults(stage, result) {
    console.log('🎨 renderResults 호출: ' + stage);
    
    var parsed = parseAnalysisResult(result);
    
    if (stage === 'stage1') {
        tabStates.stage1.analysisResult = parsed.analysis;
        tabStates.stage1.revisedScript = parsed.revised;
        console.log('=== Stage1 원본 ===');
        console.log(tabStates.stage1.originalScript ? tabStates.stage1.originalScript.substring(0, 200) + '...' : '');
        console.log('=== Stage1 수정본 ===');
        console.log(tabStates.stage1.revisedScript ? tabStates.stage1.revisedScript.substring(0, 200) + '...' : '');
        console.log('=== 동일 여부 ===', tabStates.stage1.originalScript === tabStates.stage1.revisedScript);
    } else {
        tabStates.stage2.analysisResult = parsed.analysis;
        tabStates.stage2.revisedScript = parsed.revised;
    }
    
    // 좌측: 분석 결과 표
    var tableContainer = document.getElementById('result-table-' + stage);
    if (tableContainer) {
        tableContainer.innerHTML = renderAnalysisTable(parsed.analysis, parsed.parseError);
    }
    
    // 우측: 전체 대본 + 수정된 부분만 하이라이트
    var revisedContainer = document.getElementById('revised-' + stage);
    if (revisedContainer) {
        var original = stage === 'stage1' ? tabStates.stage1.originalScript : tabStates.stage1.revisedScript;
        var revised = parsed.revised;
        
        if (revised) {
            revisedContainer.innerHTML = renderFullScriptWithHighlight(original, revised);
            console.log('✅ 전체 대본 + 하이라이트 적용됨');
        } else {
            revisedContainer.innerHTML = '<div class="p-4 text-gray-500 text-center"><i class="fas fa-info-circle mr-2"></i>수정본이 생성되지 않았습니다.</div>';
        }
    }
}

// ========== 분석 결과 테이블 렌더링 (새 컬럼) ==========
function renderAnalysisTable(analysisText, isParseError) {
    if (!analysisText || typeof analysisText !== 'string') {
        return '<div class="p-4 text-gray-400 text-center"><i class="fas fa-info-circle mr-2"></i>분석 결과가 없습니다.</div>';
    }
    
    if (isParseError) {
        return '<div class="p-3"><div class="bg-orange-900/30 border border-orange-700 rounded-lg p-3 mb-3">' +
            '<p class="text-orange-300 text-sm"><i class="fas fa-exclamation-triangle mr-2"></i>JSON 파싱 실패 - 원본 응답 표시</p></div>' +
            '<pre class="whitespace-pre-wrap text-sm text-gray-300 bg-gray-800 p-3 rounded">' + escapeHtml(analysisText) + '</pre></div>';
    }
    
    var text = analysisText.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
    var lines = text.trim().split('\n').filter(function(line) { return line.trim(); });
    
    if (lines.length === 0) {
        return '<div class="p-4 text-gray-400 text-center"><i class="fas fa-check-circle mr-2 text-green-400"></i>수정이 필요한 항목이 없습니다.</div>';
    }
    
    var hasTabs = lines.some(function(line) { return line.indexOf('\t') !== -1; });
    
    if (!hasTabs) {
        return '<div class="p-3"><pre class="whitespace-pre-wrap text-sm text-gray-300">' + escapeHtml(text) + '</pre></div>';
    }
    
    // 새 컬럼: 번호 | 유형 | 오류 대본 | 변경 대본 | 검수 포인트
    var html = '<div class="overflow-x-auto p-2"><table class="w-full text-xs border-collapse">' +
        '<thead><tr class="bg-gray-700">' +
        '<th class="border border-gray-600 px-2 py-1.5 text-left font-medium text-gray-200 w-12">번호</th>' +
        '<th class="border border-gray-600 px-2 py-1.5 text-left font-medium text-gray-200 w-16">유형</th>' +
        '<th class="border border-gray-600 px-2 py-1.5 text-left font-medium text-gray-200">오류 대본</th>' +
        '<th class="border border-gray-600 px-2 py-1.5 text-left font-medium text-gray-200">변경 대본</th>' +
        '<th class="border border-gray-600 px-2 py-1.5 text-left font-medium text-gray-200">검수 포인트</th>' +
        '</tr></thead><tbody>';
    
    var firstCols = lines[0].split('\t');
    var isHeader = firstCols[0] === '번호' || firstCols[0].indexOf('번호') !== -1;
    var startIdx = isHeader ? 1 : 0;
    
    var rowCount = 0;
    for (var i = startIdx; i < lines.length; i++) {
        var cols = lines[i].split('\t');
        if (cols.length < 2) continue;
        
        rowCount++;
        html += '<tr class="hover:bg-gray-700/50">';
        
        // 번호
        html += '<td class="border border-gray-600 px-2 py-1.5 text-gray-300 text-center">' + escapeHtml(cols[0] || '') + '</td>';
        // 유형
        html += '<td class="border border-gray-600 px-2 py-1.5 text-gray-300">' + escapeHtml(cols[1] || '') + '</td>';
        // 오류 대본 (빨간색 배경)
        html += '<td class="border border-gray-600 px-2 py-1.5 bg-red-900/30 text-red-300">' + escapeHtml(cols[2] || '') + '</td>';
        // 변경 대본 (초록색 배경)
        html += '<td class="border border-gray-600 px-2 py-1.5 bg-green-900/30 text-green-300">' + escapeHtml(cols[3] || '') + '</td>';
        // 검수 포인트
        html += '<td class="border border-gray-600 px-2 py-1.5 text-gray-300">' + escapeHtml(cols[4] || '') + '</td>';
        
        html += '</tr>';
    }
    
    if (rowCount === 0) {
        return '<div class="p-4 text-center"><i class="fas fa-check-circle text-green-400 text-2xl mb-2"></i>' +
            '<p class="text-gray-400">검수 결과 수정이 필요한 항목이 없습니다.</p></div>';
    }
    
    html += '</tbody></table></div>';
    return html;
}

// ========== 전체 대본 + 수정된 부분만 하이라이트 ==========
function renderFullScriptWithHighlight(original, revised) {
    if (!revised) {
        return '<div class="p-4 text-gray-500">수정본이 없습니다.</div>';
    }
    
    if (!original) {
        // 원본이 없으면 전체 수정본 표시
        return '<div class="p-3 text-sm"><pre class="whitespace-pre-wrap text-gray-700 dark:text-gray-300">' + escapeHtml(revised) + '</pre></div>';
    }
    
    var originalLines = original.split('\n');
    var revisedLines = revised.split('\n');
    
    var changeCount = 0;
    var html = '<div class="p-3 space-y-0.5 text-sm">';
    
    var maxLines = Math.max(originalLines.length, revisedLines.length);
    
    for (var i = 0; i < maxLines; i++) {
        var origLine = originalLines[i] || '';
        var revLine = revisedLines[i] || '';
        
        // 원본과 수정본이 다르면 하이라이트
        if (origLine.trim() !== revLine.trim()) {
            changeCount++;
            html += '<div class="bg-green-100 dark:bg-green-900/40 border-l-4 border-green-500 pl-3 py-1 rounded-r">' +
                '<span class="text-green-800 dark:text-green-200">' + escapeHtml(revLine) + '</span></div>';
        } else {
            // 동일한 라인은 일반 표시
            html += '<div class="pl-4 py-0.5">' +
                '<span class="text-gray-700 dark:text-gray-300">' + escapeHtml(revLine) + '</span></div>';
        }
    }
    
    html += '</div>';
    
    // 상단 요약
    var summary = '<div class="bg-blue-50 dark:bg-blue-900/30 border-b border-blue-200 dark:border-blue-700 px-3 py-2 sticky top-0">' +
        '<span class="text-blue-700 dark:text-blue-300 text-sm font-medium">' +
        '<i class="fas fa-edit mr-2"></i>총 ' + changeCount + '개 라인 수정됨 (연한 초록색 = 수정된 부분)</span></div>';
    
    return summary + html;
}

// ========== 다운로드 ==========
function initDownloadButtons() {
    var downloadBtn = document.getElementById('download-revised-btn');
    
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
            downloadScript('txt');
        });
    }
}

function downloadScript(format) {
    var script = tabStates.stage2.revisedScript || tabStates.stage1.revisedScript;
    
    if (!script) {
        alert('다운로드할 수정본이 없습니다.');
        return;
    }
    
    var date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    var filename = currentFileName + '_reviewed_' + date + '.txt';
    
    var blob = new Blob([script], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log('📥 다운로드 완료:', filename);
}

// ========== 유틸리티 ==========
function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========== 전역 노출 ==========
window.__MAIN_JS_LOADED__ = true;
window.MAIN_JS_LOADED = true;
window.tabStates = tabStates;

console.log('✅ main.js v3.5 초기화 준비 완료');
