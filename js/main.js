/**
 * MISLGOM 대본 검수 자동 프로그램 - MAIN.JS
 * 4-Panel + Score System v4.1
 * Vertex AI + Gemini 3 Pro
 * 25가지 오류 유형 검수
 */

console.log('🚀 main.js v4.1 (Vertex AI + Gemini 3 Pro) 로드됨');

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
    
    console.log('✅ main.js v4.1 초기화 완료');
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
            hideLoadedFilename();
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
        '그때 문이 열리며 한 할머니께서 들어오셨습니다.\n' +
        '할머니는 추위에 떨고 계셨고, 저는 자리를 양보해 드렸습니다.\n\n' +
        '"고마워요, 젊은이."\n' +
        '할머니의 미소가 참 따뜻했습니다.\n\n' +
        '우리는 그렇게 처음 만낫습니다.\n' +
        '서로의 이야기를 나누며, 시간 가는 줄 몰랐어요.\n\n' +
        '할머니는 올해 일흔다섯이라고 하셨어요.\n' +
        '그런데 이야기 중간에 갑자기 "나는 예순살인데..." 라고 말씀하셨습니다.\n\n' +
        '밖은 한겨울 눈보라가 치는데, 할머니는 "이 여름 더위는 정말 힘들구나" 라고 하셨어요.\n\n' +
        '할머니는 우산을 들고 카페를 나서셨습니다.\n' +
        '그런데 밖에서 비를 흠뻑 맞으며 걸어가고 계셨어요.\n\n' +
        '"사장님, 커피 한 잔 주세요."\n' +
        '다음 날 할머니가 오셔서 "오빠, 아메리카노!" 라고 하셨습니다.\n\n' +
        '나는 집으로 돌아왔다.\n' +
        '그는 너무 피곤했다.\n\n' +
        '삼만 원을 드렸는데, 할머니는 오만 원을 받았다며 거스름돈을 주셨어요.';

    textarea.value = sample;
    updateCharCounter();
    hideLoadedFilename();
    console.log('📝 샘플 대본 로드됨 (다양한 오류 포함)');
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
                    showLoadedFilename(file.name);
                    console.log('📂 파일 로드됨:', file.name);
                };
                reader.readAsText(file, 'UTF-8');
            }
        });
    }
}

// ========== 파일명 표시 ==========
function showLoadedFilename(filename) {
    var container = document.getElementById('loaded-filename');
    var text = document.getElementById('filename-text');
    if (container && text) {
        text.textContent = filename;
        container.classList.remove('hidden');
    }
}

function hideLoadedFilename() {
    var container = document.getElementById('loaded-filename');
    if (container) {
        container.classList.add('hidden');
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
                showLoadedFilename(file.name);
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
        console.log('📤 프롬프트 생성 완료, 길이:', prompt.length);
        
        var result = await callGeminiAPI(prompt);
        console.log('📥 API 응답 수신');
        console.log('📄 응답 길이:', result.length);
        
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

// ========== 프롬프트 생성 (25가지 오류 유형) ==========
function generatePrompt(stage, script) {
    if (stage === 'stage1') {
        return '당신은 한국 시니어 낭독용 대본의 **정밀 검수 전문가**입니다.\n\n' +
            '## 📋 분석 대상 대본:\n"""\n' + script + '\n"""\n\n' +
            '## 🔍 1차 분석: 아래 25가지 오류 유형을 모두 꼼꼼히 검수하세요\n\n' +
            '### [기본 검수 항목]\n\n' +
            '(1) 맞춤법/문법/오타\n' +
            '- 모든 오타, 띄어쓰기, 문법 오류\n' +
            '- 예: "만낫습니다" → "만났습니다"\n\n' +
            '(2) 인물 설정 일관성\n' +
            '- 나이, 이름, 외모, 직업이 중간에 바뀌는지\n' +
            '- 예: 75세 → 60세 (나이 불일치)\n\n' +
            '(3) 시간/계절 일관성\n' +
            '- 계절이나 시간대가 갑자기 바뀌는지\n' +
            '- 예: 겨울 → 여름 (계절 불일치)\n\n' +
            '(4) 장소 일관성\n' +
            '- 장소 설정이 갑자기 바뀌는지\n' +
            '- 예: 부산 → 서울 (장소 점프)\n\n' +
            '(5) 시대/문화 일관성\n' +
            '- 시대에 맞지 않는 물건이나 표현\n' +
            '- 예: 조선시대에 스마트폰\n\n' +
            '### [추가 검수 항목]\n\n' +
            '(6) 인물 호칭/존댓말 불일치\n' +
            '- 관계/연령/상황에 맞지 않는 반말·존댓말·호칭 혼선\n' +
            '- 예: "사장님" → "오빠" (호칭 급변)\n\n' +
            '(7) 화자/대사 주체 혼선\n' +
            '- 누가 말했는지 대사 귀속이 뒤바뀌는 오류\n\n' +
            '(8) 지시어/대상 불명확\n' +
            '- "이것/그것/저기/그 사람"이 무엇인지 추적 불가\n\n' +
            '(9) 물리/현실 불가능 동작\n' +
            '- 현실적으로 불가능한 동작, 동선, 거리\n\n' +
            '(10) 소지품/의상/상태 연속성 오류\n' +
            '- 물건/옷/부상 상태가 설명 없이 변화\n' +
            '- 예: "우산을 들었다" → "비를 맞았다"\n\n' +
            '(11) 금액/수치/횟수/인원 불일치\n' +
            '- 나이·돈·거리·시간·인원 등이 앞뒤 상충\n\n' +
            '(12) 지명/기관/브랜드 혼입\n' +
            '- 한국 배경에 해외 행정/통화/기관 섞임\n\n' +
            '(13) 시대물 금지 요소\n' +
            '- 시대에 없는 기기/앱/유행어/제도\n\n' +
            '(14) 감각/환경 설정 충돌\n' +
            '- 같은 장면에서 온도/날씨/조명/소음 비논리적 변화\n\n' +
            '(15) 사건 원인-결과 단절\n' +
            '- 원인 없이 결과, 또는 결과가 원인과 무관\n\n' +
            '(16) 정보 중복/되풀이\n' +
            '- 같은 설명을 반복해 템포/몰입 저하\n\n' +
            '(17) 과도한 전문용어/외래어/약어\n' +
            '- 시니어에게 어려운 용어\n\n' +
            '(18) 지나친 폭력/자극/공포 묘사\n' +
            '- 시니어 낭독 부적합한 과도한 표현\n\n' +
            '(19) 시점/서술 관점 혼선\n' +
            '- 같은 문단에서 1인칭/3인칭 뒤섞임\n\n' +
            '(20) 이름 표기 불일치\n' +
            '- 동일 인물 다른 이름/별명 난립\n\n' +
            '## ⚠️ 필수 규칙:\n' +
            '1. 발견한 오류는 **모두** analysis에 기록\n' +
            '2. revised에는 **오류를 수정한 전체 대본** 작성\n' +
            '3. 오류가 없어도 revised에 원본 전체를 그대로 작성\n\n' +
            '## 📤 출력 형식 (정확히 이 JSON 형식으로만 응답):\n' +
            '```json\n' +
            '{\n' +
            '  "analysis": "번호\\t오류유형\\t오류내용\\t수정내용\\t설명\\n1\\t맞춤법\\t만낫습니다\\t만났습니다\\t오타",\n' +
            '  "revised": "전체 수정 대본"\n' +
            '}\n' +
            '```\n\n' +
            '## 🚨 주의:\n' +
            '- JSON 형식 외 다른 텍스트 금지\n' +
            '- revised는 절대 비워두지 마세요';
    } else {
        return '당신은 한국 시니어 낭독용 대본의 **품질 평가 전문가**입니다.\n\n' +
            '## 📋 1차 검수 완료된 대본:\n"""\n' + script + '\n"""\n\n' +
            '## 🔍 2차 분석 항목\n\n' +
            '(1) 스토리 흐름 자연스러움\n' +
            '(2) 시간 순서 논리성\n' +
            '(3) 감정선 연결\n' +
            '(4) 시니어 청취자 적합성\n' +
            '(5) 대화의 목적 상실\n' +
            '(6) 장소/시간 표식 누락\n' +
            '(7) 관계/가족 호칭 충돌\n' +
            '(8) 감정선 급변\n' +
            '(9) VREW 규칙 확인 (1줄=1클립)\n\n' +
            '## ⚠️ 필수 규칙:\n' +
            '1. 발견한 오류는 **모두** analysis에 기록\n' +
            '2. revised에는 **최종 수정된 전체 대본** 작성\n' +
            '3. scores는 **revised(최종 대본) 기준**으로 평가\n\n' +
            '## 📤 출력 형식:\n' +
            '```json\n' +
            '{\n' +
            '  "analysis": "번호\\t오류유형\\t오류내용\\t수정내용\\t설명",\n' +
            '  "revised": "최종 수정된 전체 대본",\n' +
            '  "scores": {\n' +
            '    "fun": 85,\n' +
            '    "flow": 90,\n' +
            '    "senior": 88,\n' +
            '    "retention": 82\n' +
            '  }\n' +
            '}\n' +
            '```\n\n' +
            '## 📊 점수 기준 (0-100점):\n' +
            '- **fun**: 흥미도, 몰입감\n' +
            '- **flow**: 전개의 자연스러움\n' +
            '- **senior**: 50-70대 적합도\n' +
            '- **retention**: 끝까지 듣고 싶은 정도\n\n' +
            '## 🚨 주의:\n' +
            '- scores 반드시 포함\n' +
            '- JSON 형식 외 텍스트 금지';
    }
}

// ========== Gemini API 호출 (Vertex AI + Gemini 3 Pro) ==========
async function callGeminiAPI(prompt) {
    var apiKey = localStorage.getItem('GEMINI_API_KEY');
    if (!apiKey) throw new Error('API 키가 설정되지 않았습니다.');
    
    var endpoint = 'https://aiplatform.googleapis.com/v1/publishers/google/models/gemini-3-pro-preview:generateContent?key=' + apiKey;
    
    console.log('🌐 Vertex AI 엔드포인트 호출: gemini-3-pro-preview');
    
    var response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                role: 'user',
                parts: [{ text: prompt }]
            }],
            generationConfig: {
                temperature: 0.2,
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
    jsonStr = jsonStr.replace(/^```json\s*/i, '');
    jsonStr = jsonStr.replace(/^```\s*/i, '');
    jsonStr = jsonStr.replace(/\s*```$/i, '');
    jsonStr = jsonStr.trim();
    
    var braceStart = jsonStr.indexOf('{');
    var braceEnd = jsonStr.lastIndexOf('}');
    if (braceStart !== -1 && braceEnd !== -1 && braceEnd > braceStart) {
        jsonStr = jsonStr.substring(braceStart, braceEnd + 1);
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
        var scores = null;
        
        var analysisMatch = rawText.match(/"analysis"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"revised"|"\s*,\s*"scores"|"\s*})/);
        if (analysisMatch) {
            analysis = analysisMatch[1].replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\"/g, '"');
        }
        
        var revisedMatch = rawText.match(/"revised"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"scores"|"\s*})/);
        if (revisedMatch) {
            revised = revisedMatch[1].replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\"/g, '"');
        }
        
        var scoresMatch = rawText.match(/"scores"\s*:\s*(\{[\s\S]*?\})/);
        if (scoresMatch) {
            try { scores = JSON.parse(scoresMatch[1]); } catch (se) {}
        }
        
        if (analysis || revised) {
            return { analysis: analysis, revised: revised, scores: scores, parseError: false };
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
        
        if (revised && revised.length > 0) {
            revisedContainer.innerHTML = renderFullScriptWithHighlight(original, revised);
        } else {
            revisedContainer.innerHTML = '<div class="p-4 text-red-400 text-center"><i class="fas fa-exclamation-triangle mr-2"></i>수정본이 생성되지 않았습니다.</div>';
        }
    }
    
    if (stage === 'stage2') {
        if (parsed.scores) {
            renderScores(parsed.scores);
        } else {
            renderScores({ fun: 0, flow: 0, senior: 0, retention: 0 });
        }
    }
}

// ========== 점수 렌더링 ==========
function renderScores(scores) {
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
        if (total === 0) {
            verdictEl.innerHTML = '<div class="text-center"><i class="fas fa-question-circle text-gray-400 text-xl mb-1"></i><p class="text-gray-400 font-bold text-sm">평가 실패</p></div>';
            verdictEl.className = 'bg-gray-500/20 border border-gray-500/50 rounded-lg p-2 text-center flex items-center justify-center';
        } else if (isPass) {
            verdictEl.innerHTML = '<div class="text-center"><i class="fas fa-check-circle text-green-400 text-xl mb-1"></i><p class="text-green-400 font-bold text-sm">통과</p></div>';
            verdictEl.className = 'bg-green-500/20 border border-green-500/50 rounded-lg p-2 text-center flex items-center justify-center';
        } else {
            verdictEl.innerHTML = '<div class="text-center"><i class="fas fa-times-circle text-red-400 text-xl mb-1"></i><p class="text-red-400 font-bold text-sm">재검토 필요</p></div>';
            verdictEl.className = 'bg-red-500/20 border border-red-500/50 rounded-lg p-2 text-center flex items-center justify-center';
        }
    }
    
    if (badgeEl) {
        if (total === 0) {
            badgeEl.textContent = '평가 실패';
            badgeEl.className = 'px-3 py-1 rounded-full text-xs font-bold bg-gray-500 text-white';
        } else if (isPass) {
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
            '<p class="text-orange-300 text-sm"><i class="fas fa-exclamation-triangle mr-2"></i>JSON 파싱 실패 - 원본 응답:</p></div>' +
            '<pre class="whitespace-pre-wrap text-xs text-gray-300 bg-gray-800 p-3 rounded max-h-60 overflow-y-auto">' + escapeHtml(analysisText) + '</pre></div>';
    }
    
    var text = analysisText.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
    var lines = text.trim().split('\n').filter(function(line) { return line.trim(); });
    
    if (lines.length === 0 || text.indexOf('오류 없음') !== -1 || text.indexOf('오류없음') !== -1) {
        return '<div class="p-4 text-center"><div class="inline-flex items-center justify-center w-12 h-12 bg-green-500/20 rounded-full mb-2">' +
            '<i class="fas fa-check text-green-400 text-xl"></i></div>' +
            '<p class="text-green-400 font-medium">오류가 발견되지 않았습니다</p></div>';
    }
    
    var html = '<div class="overflow-x-auto"><table class="w-full text-xs">' +
        '<thead><tr class="bg-gray-700/50">' +
        '<th class="px-2 py-1 text-left text-gray-300 font-medium">번호</th>' +
        '<th class="px-2 py-1 text-left text-gray-300 font-medium">오류유형</th>' +
        '<th class="px-2 py-1 text-left text-gray-300 font-medium">오류내용</th>' +
        '<th class="px-2 py-1 text-left text-gray-300 font-medium">수정내용</th>' +
        '<th class="px-2 py-1 text-left text-gray-300 font-medium">설명</th>' +
        '</tr></thead><tbody>';
    
    var rowCount = 0;
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        if (!line) continue;
        
        var cols = line.split('\t');
        if (cols.length >= 2) {
            rowCount++;
            var rowClass = rowCount % 2 === 0 ? 'bg-gray-800/30' : 'bg-gray-800/10';
            html += '<tr class="' + rowClass + ' hover:bg-gray-700/30 transition-colors">';
            
            for (var j = 0; j < 5; j++) {
                var content = cols[j] ? escapeHtml(cols[j]) : '-';
                if (j === 2) {
                    html += '<td class="px-2 py-1 text-red-300">' + content + '</td>';
                } else if (j === 3) {
                    html += '<td class="px-2 py-1 text-green-300">' + content + '</td>';
                } else {
                    html += '<td class="px-2 py-1 text-gray-300">' + content + '</td>';
                }
            }
            html += '</tr>';
        }
    }
    
    html += '</tbody></table></div>';
    
    if (rowCount === 0) {
        return '<div class="p-4 text-center"><div class="inline-flex items-center justify-center w-12 h-12 bg-green-500/20 rounded-full mb-2">' +
            '<i class="fas fa-check text-green-400 text-xl"></i></div>' +
            '<p class="text-green-400 font-medium">오류가 발견되지 않았습니다</p></div>';
    }
    
    html = '<div class="p-2 bg-gray-700/30 border-b border-gray-600 flex items-center justify-between">' +
        '<span class="text-xs text-gray-400">발견된 오류: <span class="text-red-400 font-bold">' + rowCount + '개</span></span></div>' + html;
    
    return html;
}

// ========== 수정 대본 렌더링 ==========
function renderFullScriptWithHighlight(original, revised) {
    if (!revised) return '<div class="p-4 text-gray-400 text-center">수정된 대본이 없습니다.</div>';
    
    var escapedRevised = escapeHtml(revised);
    var lines = escapedRevised.split('\n');
    var html = '<div class="p-3 space-y-1 text-sm leading-relaxed">';
    
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (line.trim() === '') {
            html += '<div class="h-2"></div>';
        } else {
            html += '<div class="text-gray-200">' + line + '</div>';
        }
    }
    
    html += '</div>';
    return html;
}

// ========== 유틸리티 ==========
function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========== 다운로드 버튼 ==========
function initDownloadButtons() {
    var downloadBtn = document.getElementById('download-revised-btn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
            downloadScript();
        });
    }
}

function downloadScript() {
    var script = tabStates.stage2.revisedScript || tabStates.stage1.revisedScript;
    if (!script) {
        alert('다운로드할 수정 대본이 없습니다.');
        return;
    }
    
    var blob = new Blob([script], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = currentFileName + '_수정완료.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('📥 다운로드 완료:', currentFileName + '_수정완료.txt');
}

// ========== 부팅 확인 ==========
window.__MAIN_JS_LOADED__ = true;
console.log('[BOOT] main.js v4.1 로드 완료');
