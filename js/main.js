/**
 * KORE-JA SCRIPT LINTER - MAIN.JS
 * 4-Panel + Score System v3.8
 */

console.log('🚀 main.js v3.8 (4-Panel + Score) 로드됨');

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
        scores: null,
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
    
    console.log('✅ main.js v3.8 초기화 완료');
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
        if (statusText) statusText.textContent = hasKey ? 'API 키 설정됨' : 'API 키 설정';
        if (statusIcon) statusIcon.textContent = hasKey ? '✅' : '🔑';
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
        '[※ 테스트용 의도적 오류]\n' +
        '그때 문이 열리며 한 할머니께서 들어오셨습니다.\n' +
        '할머니는 추위에 떨고 계셨고, 저는 자리를 양보해 드렸습니다.\n\n' +
        '"고마워요, 젊은이."\n' +
        '할머니의 미소가 참 따뜻했습니다.\n\n' +
        '우리는 그렇게 처음 만낫습니다.\n' +
        '서로의 이야기를 나누며, 시간 가는 줄 몰랐어요.';

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
        if (!tabStates.stage1.revisedScript) {
            alert('1차 분석을 먼저 완료해주세요.');
            return;
        }
        inputScript = tabStates.stage1.revisedScript;
        tabStates.stage2.originalScript = inputScript;
    }
    
    var btn = document.getElementById('btn-' + stage);
    var statusBadge = document.getElementById('status-' + stage);
    var progressContainer = document.getElementById('progress-container');
    var progressBar = document.getElementById('progress-bar');
    var progressText = document.getElementById('progress-text');
    
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> 분석 중...';
        btn.className = 'btn-analyze px-4 py-2 bg-gray-400 text-white text-sm rounded-lg cursor-not-allowed';
    }
    
    if (statusBadge) {
        statusBadge.textContent = '분석 중';
        statusBadge.className = 'status-badge bg-yellow-200 text-yellow-700 text-xs px-2 py-1 rounded-full';
    }
    
    if (progressContainer) progressContainer.classList.remove('hidden');
    
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
        
        renderResults(stage, result);
        
        tabStates[stage].isComplete = true;
        
        if (statusBadge) {
            statusBadge.textContent = '완료';
            statusBadge.className = 'status-badge bg-green-200 text-green-700 text-xs px-2 py-1 rounded-full';
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
            if (downloadBtn) downloadBtn.disabled = false;
        }
        
        console.log('✅ ' + stage + ' 분석 완료');
        
    } catch (error) {
        console.error('❌ ' + stage + ' 분석 실패:', error);
        clearInterval(progressInterval);
        
        if (statusBadge) {
            statusBadge.textContent = '오류';
            statusBadge.className = 'status-badge bg-red-200 text-red-700 text-xs px-2 py-1 rounded-full';
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
        
        setTimeout(function() {
            if (progressContainer) progressContainer.classList.add('hidden');
        }, 1000);
        
        tabStates[stage].isAnalyzing = false;
    }
}

// ========== 프롬프트 생성 ==========
function generatePrompt(stage, script) {
    if (stage === 'stage1') {
        return '당신은 한국 시니어 낭독용 대본의 **설정 일관성 검수** 전문가입니다.\n\n' +
            '## 분석 대상 대본:\n' + script + '\n\n' +
            '## 🔍 1차 분석 항목\n\n' +
            '### 1. 국가 배경 확인\n' +
            '- 도시명, 지명, 화폐 단위, 문화적 요소가 해당 국가에 맞는지\n\n' +
            '### 2. 시대 배경 분석\n' +
            '- 해당 시대에 맞지 않는 사물, 기술, 문화, 언어 사용 시 오류\n\n' +
            '### 3. 등장인물 설정 분석\n' +
            '- 이름, 나이, 외형, 성격, 직업이 처음부터 끝까지 동일한지\n\n' +
            '### 4. 등장인물 관계 분석\n' +
            '- 인물 간 관계가 처음부터 끝까지 일관되게 유지되는지\n\n' +
            '## 출력 형식 (반드시 JSON으로만 응답):\n' +
            '```json\n' +
            '{\n' +
            '  "analysis": "번호\\t오류 유형\\t오류 대본\\t변경 대본\\t검수 포인트\\n1\\t시대착오\\t오류 문장\\t수정 문장\\t설명",\n' +
            '  "revised": "모든 오류를 수정한 전체 대본"\n' +
            '}\n' +
            '```\n\n' +
            '## 중요 규칙:\n' +
            '1. 오류가 없으면 analysis에 "오류 없음" 기재\n' +
            '2. revised에는 수정된 완전한 대본 작성\n' +
            '3. 반드시 완전한 JSON으로 응답\n' +
            '4. JSON 외 다른 텍스트 금지';
    } else {
        return '당신은 한국 시니어 낭독용 대본의 **스토리 흐름 및 품질 검수** 전문가입니다.\n\n' +
            '## 1차 검수 완료된 대본:\n' + script + '\n\n' +
            '## 🔍 2차 분석 항목\n\n' +
            '### 1. 시간 흐름 왜곡\n' +
            '- 아침/점심/저녁, 계절, 시간 순서가 논리적인지\n\n' +
            '### 2. 장소 흐름 왜곡\n' +
            '- 장소 이동이 논리적인지\n\n' +
            '### 3. 시니어 적합성\n' +
            '- 50-70대 청취자에게 적합한 콘텐츠인지\n\n' +
            '### 4. 1차 검수 재확인\n' +
            '- 놓친 오류가 없는지 확인\n\n' +
            '## 출력 형식 (반드시 JSON으로만 응답):\n' +
            '```json\n' +
            '{\n' +
            '  "analysis": "번호\\t오류 유형\\t오류 대본\\t변경 대본\\t검수 포인트\\n1\\t시간 왜곡\\t오류 문장\\t수정 문장\\t설명",\n' +
            '  "revised": "최종 수정된 완전한 대본",\n' +
            '  "scores": {\n' +
            '    "fun": 85,\n' +
            '    "flow": 90,\n' +
            '    "senior": 88,\n' +
            '    "retention": 82\n' +
            '  }\n' +
            '}\n' +
            '```\n\n' +
            '## 점수 평가 기준 (0-100점):\n' +
            '- **fun (재미요소)**: 이야기의 흥미도, 몰입감, 감동 요소\n' +
            '- **flow (대본 흐름)**: 시간/장소/상황 전개의 자연스러움\n' +
            '- **senior (시니어 적합성)**: 50-70대 청취자 타겟 적합도\n' +
            '- **retention (시청 이탈율 방지)**: 끝까지 듣고 싶은 정도 (높을수록 좋음)\n\n' +
            '## 중요 규칙:\n' +
            '1. scores는 반드시 0-100 사이의 정수로 평가\n' +
            '2. revised에는 최종 완성된 대본 작성\n' +
            '3. 반드시 완전한 JSON으로 응답\n' +
            '4. JSON 외 다른 텍스트 금지';
    }
}

// ========== Gemini API 호출 ==========
async function callGeminiAPI(prompt) {
    var apiKey = localStorage.getItem('GEMINI_API_KEY');
    if (!apiKey) throw new Error('API 키가 설정되지 않았습니다.');
    
    var endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + apiKey;
    
    var response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
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
    
    if (!text) throw new Error('API 응답이 비어있습니다.');
    
    return text;
}

// ========== 결과 파싱 ==========
function parseAnalysisResult(rawText) {
    console.log('📝 파싱 시작, 원본 길이:', rawText ? rawText.length : 0);
    
    if (!rawText || typeof rawText !== 'string') {
        return { analysis: '', revised: '', scores: null, parseError: true };
    }
    
    var jsonStr = rawText.trim();
    jsonStr = jsonStr.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
    
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
            scores: parsed.scores || null,
            parseError: false
        };
    } catch (e) {
        console.error('❌ JSON 파싱 실패:', e.message);
        
        var analysis = '';
        var revised = '';
        
        var analysisMatch = rawText.match(/"analysis"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"revised"|"\s*})/);
        if (analysisMatch) {
            analysis = analysisMatch[1].replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\"/g, '"');
        }
        
        var revisedMatch = rawText.match(/"revised"\s*:\s*"([\s\S]*?)"\s*[,}]/);
        if (revisedMatch) {
            revised = revisedMatch[1].replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\"/g, '"');
        }
        
        if (analysis || revised) {
            return { analysis: analysis, revised: revised, scores: null, parseError: false };
        }
        
        return { analysis: rawText, revised: '', scores: null, parseError: true };
    }
}

// ========== 결과 렌더링 ==========
function renderResults(stage, result) {
    console.log('🎨 renderResults 호출: ' + stage);
    
    var parsed = parseAnalysisResult(result);
    
    tabStates[stage].analysisResult = parsed.analysis;
    tabStates[stage].revisedScript = parsed.revised;
    if (parsed.scores) {
        tabStates[stage].scores = parsed.scores;
    }
    
    var tableContainer = document.getElementById('result-table-' + stage);
    if (tableContainer) {
        tableContainer.innerHTML = renderAnalysisTable(parsed.analysis, parsed.parseError);
    }
    
    var revisedContainer = document.getElementById('revised-' + stage);
    if (revisedContainer) {
        var original = stage === 'stage1' ? tabStates.stage1.originalScript : tabStates.stage1.revisedScript;
        var revised = parsed.revised;
        
        if (revised) {
            revisedContainer.innerHTML = renderFullScriptWithHighlight(original, revised);
        } else {
            revisedContainer.innerHTML = '<div class="p-4 text-gray-500 text-center"><i class="fas fa-info-circle mr-2"></i>수정본이 생성되지 않았습니다.</div>';
        }
    }
    
    // 2차 분석일 때 점수 표시
    if (stage === 'stage2' && parsed.scores) {
        renderScores(parsed.scores);
    }
}

// ========== 점수 렌더링 ==========
function renderScores(scores) {
    console.log('📊 점수 렌더링:', scores);
    
    var funEl = document.getElementById('score-fun');
    var flowEl = document.getElementById('score-flow');
    var seniorEl = document.getElementById('score-senior');
    var retentionEl = document.getElementById('score-retention');
    var totalEl = document.getElementById('score-total');
    var verdictEl = document.getElementById('score-verdict');
    var badgeEl = document.getElementById('score-result-badge');
    
    var fun = parseInt(scores.fun) || 0;
    var flow = parseInt(scores.flow) || 0;
    var senior = parseInt(scores.senior) || 0;
    var retention = parseInt(scores.retention) || 0;
    var total = Math.round((fun + flow + senior + retention) / 4);
    
    if (funEl) funEl.textContent = fun + '점';
    if (flowEl) flowEl.textContent = flow + '점';
    if (seniorEl) seniorEl.textContent = senior + '점';
    if (retentionEl) retentionEl.textContent = retention + '점';
    if (totalEl) totalEl.textContent = total + '점';
    
    var isPass = total >= 98;
    
    if (verdictEl) {
        if (isPass) {
            verdictEl.innerHTML = '<div class="text-center"><i class="fas fa-check-circle text-green-400 text-xl mb-1"></i><p class="text-green-400 font-bold text-sm">통과</p></div>';
            verdictEl.className = 'bg-green-500/20 border border-green-500/50 rounded-lg p-2 text-center flex items-center justify-center';
        } else {
            verdictEl.innerHTML = '<div class="text-center"><i class="fas fa-times-circle text-red-400 text-xl mb-1"></i><p class="text-red-400 font-bold text-sm">재검토 필요</p></div>';
            verdictEl.className = 'bg-red-500/20 border border-red-500/50 rounded-lg p-2 text-center flex items-center justify-center';
        }
    }
    
    if (badgeEl) {
        if (isPass) {
            badgeEl.textContent = '통과 (' + total + '점)';
            badgeEl.className = 'px-3 py-1 rounded-full text-xs font-bold bg-green-500 text-white';
        } else {
            badgeEl.textContent = '재검토 (' + total + '점)';
            badgeEl.className = 'px-3 py-1 rounded-full text-xs font-bold bg-red-500 text-white';
        }
    }
}

// ========== 분석 결과 테이블 렌더링 ==========
function renderAnalysisTable(analysisText, isParseError) {
    if (!analysisText || typeof analysisText !== 'string') {
        return '<div class="p-4 text-gray-400 text-center"><i class="fas fa-info-circle mr-2"></i>분석 결과가 없습니다.</div>';
    }
    
    if (isParseError) {
        return '<div class="p-3"><div class="bg-orange-900/30 border border-orange-700 rounded-lg p-3 mb-3">' +
            '<p class="text-orange-300 text-sm"><i class="fas fa-exclamation-triangle mr-2"></i>JSON 파싱 실패</p></div>' +
            '<pre class="whitespace-pre-wrap text-xs text-gray-300 bg-gray-800 p-3 rounded">' + escapeHtml(analysisText) + '</pre></div>';
    }
    
    var text = analysisText.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
    var lines = text.trim().split('\n').filter(function(line) { return line.trim(); });
    
    if (lines.length === 0 || text.indexOf('오류 없음') !== -1) {
        return '<div class="p-4 text-center"><i class="fas fa-check-circle text-green-400 text-2xl mb-2"></i><p class="text-green-400">오류 없음</p></div>';
    }
    
    var hasTabs = lines.some(function(line) { return line.indexOf('\t') !== -1; });
    
    if (!hasTabs) {
        return '<div class="p-3"><pre class="whitespace-pre-wrap text-xs text-gray-300">' + escapeHtml(text) + '</pre></div>';
    }
    
    var html = '<div class="overflow-x-auto"><table class="w-full text-xs border-collapse">' +
        '<thead><tr class="bg-gray-700">' +
        '<th class="border border-gray-600 px-1 py-1 text-left text-gray-200 w-6">No</th>' +
        '<th class="border border-gray-600 px-1 py-1 text-left text-gray-200 w-14">유형</th>' +
        '<th class="border border-gray-600 px-1 py-1 text-left text-gray-200">오류 대본</th>' +
        '<th class="border border-gray-600 px-1 py-1 text-left text-gray-200">변경 대본</th>' +
        '<th class="border border-gray-600 px-1 py-1 text-left text-gray-200">검수 포인트</th>' +
        '</tr></thead><tbody>';
    
    var firstCols = lines[0].split('\t');
    var isHeader = firstCols[0] === '번호' || firstCols[0].indexOf('번호') !== -1;
    var startIdx = isHeader ? 1 : 0;
    
    for (var i = startIdx; i < lines.length; i++) {
        var cols = lines[i].split('\t');
        if (cols.length < 2) continue;
        
        html += '<tr class="hover:bg-gray-700/50">';
        html += '<td class="border border-gray-600 px-1 py-1 text-gray-300 text-center">' + escapeHtml(cols[0] || '') + '</td>';
        html += '<td class="border border-gray-600 px-1 py-1 text-gray-300">' + escapeHtml(cols[1] || '') + '</td>';
        html += '<td class="border border-gray-600 px-1 py-1 bg-red-900/30 text-red-300">' + escapeHtml(cols[2] || '') + '</td>';
        html += '<td class="border border-gray-600 px-1 py-1 bg-green-900/30 text-green-300">' + escapeHtml(cols[3] || '') + '</td>';
        html += '<td class="border border-gray-600 px-1 py-1 text-gray-300">' + escapeHtml(cols[4] || '') + '</td>';
        html += '</tr>';
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
        return '<div class="p-3 text-sm"><pre class="whitespace-pre-wrap text-gray-700 dark:text-gray-300">' + escapeHtml(revised) + '</pre></div>';
    }
    
    var originalLines = original.split('\n');
    var revisedLines = revised.split('\n');
    
    var originalSet = {};
    for (var i = 0; i < originalLines.length; i++) {
        var trimmed = originalLines[i].trim();
        if (trimmed) originalSet[trimmed] = true;
    }
    
    var changeCount = 0;
    var html = '<div class="space-y-0.5 text-xs">';
    
    for (var j = 0; j < revisedLines.length; j++) {
        var revLine = revisedLines[j];
        var revTrimmed = revLine.trim();
        
        if (!revTrimmed) {
            html += '<div class="py-0.5 text-gray-400">&nbsp;</div>';
            continue;
        }
        
        var isOriginal = originalSet[revTrimmed] === true;
        
        if (!isOriginal) {
            changeCount++;
            html += '<div class="bg-green-100 dark:bg-green-900/40 border-l-2 border-green-500 pl-2 py-0.5">' +
                '<span class="text-green-800 dark:text-green-200">' + escapeHtml(revLine) + '</span></div>';
        } else {
            html += '<div class="pl-2 py-0.5"><span class="text-gray-700 dark:text-gray-300">' + escapeHtml(revLine) + '</span></div>';
        }
    }
    
    html += '</div>';
    
    var summary = '<div class="bg-blue-50 dark:bg-blue-900/30 border-b border-blue-200 dark:border-blue-700 px-2 py-1 mb-2">' +
        '<span class="text-blue-700 dark:text-blue-300 text-xs font-medium">' +
        '<i class="fas fa-edit mr-1"></i>' + changeCount + '개 라인 수정됨</span></div>';
    
    return summary + html;
}

// ========== 다운로드 ==========
function initDownloadButtons() {
    var downloadBtn = document.getElementById('download-revised-btn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadScript);
    }
}

function downloadScript() {
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

console.log('✅ main.js v3.8 초기화 준비 완료');
