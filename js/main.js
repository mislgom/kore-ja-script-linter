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
// ========== 프롬프트 생성 ==========
function generatePrompt(stage, script) {
    if (stage === 'stage1') {
        return '당신은 한국 시니어 낭독용 대본의 **설정 일관성 검수** 전문가입니다.\n\n' +
            '## 분석 대상 대본:\n' + script + '\n\n' +
            '## 🔍 1차 분석 항목 (반드시 순서대로 검수)\n\n' +
            '### 1. 국가 배경 확인\n' +
            '- 대본의 국가 배경이 일관되게 유지되는지 확인\n' +
            '- 도시명, 지명, 화폐 단위, 문화적 요소가 해당 국가에 맞는지 분석\n' +
            '- 예: 한국 배경인데 갑자기 일본/중국 지명이 나오면 오류\n' +
            '- 예: 조선시대인데 "원화", "달러" 등 현대 화폐 언급 시 오류\n\n' +
            '### 2. 시대 배경 분석\n' +
            '- 대본의 시대 배경을 파악 (조선시대/일제시대/현대/70-90년대 등)\n' +
            '- 해당 시대에 맞지 않는 사물, 기술, 문화, 언어 사용 시 오류\n' +
            '- 예: 조선시대에 스마트폰, 와이파이, 배달앱, 경찰 제복 등장 → 시대착오\n' +
            '- 예: 70년대 배경에 카카오톡, 인스타그램 언급 → 시대착오\n' +
            '- 예: 일제시대에 "조선 후기"라는 표현 → 시대 혼동\n\n' +
            '### 3. 등장인물 설정 분석\n' +
            '- 등장인물이 처음부터 끝까지 동일한 설정으로 유지되는지 확인\n' +
            '- 검수 항목: 이름, 나이, 외형, 성격, 직업, 신분\n' +
            '- 예: "과부"라 했는데 → "남편이 어제 다녀감" → 설정 모순\n' +
            '- 예: "상주(제단지기)"라 했는데 → "관아 서리" → 직업 변경\n' +
            '- 예: "서른 즈음 사내"라 했는데 → "노인" → 나이 변경\n' +
            '- 예: "윤해린"이라 했는데 → "윤혜린" → 이름 오타/변경\n\n' +
            '### 4. 등장인물 관계 분석\n' +
            '- 등장인물 간의 관계가 처음부터 끝까지 일관되게 유지되는지 확인\n' +
            '- 검수 항목: 가족, 친척, 이웃, 적대관계, 상하관계 등\n' +
            '- 예: "원수"라 했는데 → "친아버지라 절을 올림" → 관계 모순\n' +
            '- 예: "처음 만난 사이"라 했는데 → "오랜 친구처럼 대화" → 관계 오류\n' +
            '- 예: "백도식이 악인"이라 했는데 → "윤해린의 친아버지" → 관계 변경\n\n' +
            '## 출력 형식 (반드시 JSON으로만 응답):\n' +
            '{\n' +
            '  "analysis": "번호\\t오류 유형\\t오류 대본\\t변경 대본\\t검수 포인트\\n' +
            '1\\t시대착오\\t윤해린의 품에서 진동이 울렸습니다. 유리판 같은 물건이 불빛을 내며...\\t(해당 문장 삭제)\\t조선시대에 스마트폰 등장 - 시대 배경 불일치\\n' +
            '2\\t인물 설정 모순\\t윤해린은 남편을 잃은 과부라 했지만, 남편은 어제 다녀감\\t(해당 문장 삭제)\\t과부 설정인데 남편 생존 언급 - 인물 설정 불일치",\n' +
            '  "revised": "모든 오류를 수정/삭제한 전체 대본"\n' +
            '}\n\n' +
            '## 중요 규칙:\n' +
            '1. 위 4가지 항목을 **반드시 모두 검수**하세요\n' +
            '2. 오류 대본: 문제가 있는 문장 전체를 그대로 기입\n' +
            '3. 변경 대본: 수정된 문장 또는 "(해당 문장 삭제)"로 표기\n' +
            '4. 검수 포인트: 어떤 오류인지 + 왜 오류인지 구체적 설명\n' +
            '5. 발견된 모든 오류를 빠짐없이 기록 (최소 5개 이상)\n' +
            '6. revised에는 오류를 모두 수정/삭제한 완전한 대본 작성\n' +
            '7. 반드시 완전한 JSON으로 응답 마무리\n' +
            '8. JSON 외 다른 텍스트 절대 금지';
    } else {
        return '당신은 한국 시니어 낭독용 대본의 **스토리 흐름 및 품질 검수** 전문가입니다.\n\n' +
            '## 1차 검수 완료된 대본:\n' + script + '\n\n' +
            '## 🔍 2차 분석 항목 (반드시 순서대로 검수)\n\n' +
            '### 1. 시간 흐름 왜곡 분석\n' +
            '- 이야기 진행 중 시간 흐름이 논리적으로 맞는지 확인\n' +
            '- 검수 항목: 아침/점심/저녁, 오전/오후, 4계절, 구체적 시간\n' +
            '- 예: "자정에 만나자" → 갑자기 "다음 해 봄 아침" → 시간 점프\n' +
            '- 예: "겨울 폭설" → "장마철 후덥지근" → 계절 왜곡\n' +
            '- 예: "점심 직후" → "새벽닭이 울기 전" → 시간 모순\n\n' +
            '### 2. 장소 흐름 왜곡 분석\n' +
            '- 이야기 진행 중 장소 이동이 논리적으로 맞는지 확인\n' +
            '- 예: "산골 마을" → 갑자기 "항구/모래사장" → 장소 점프\n' +
            '- 예: "대문을 열었는데" → "관창 안쪽 방에 서 있음" → 공간 왜곡\n' +
            '- 예: "눈밭 위에서" → "벚꽃잎이 흩날림" → 배경 충돌\n\n' +
            '### 3. 시니어 채널 적합성 분석\n' +
            '- 시니어(50-70대) 청취자에게 적합한 콘텐츠인지 확인\n' +
            '- 검수 항목:\n' +
            '  * 이야기 전개 속도가 너무 빠르지 않은지\n' +
            '  * 등장인물이 너무 많아 혼란스럽지 않은지\n' +
            '  * 감정선이 자연스럽게 연결되는지\n' +
            '  * 몰입을 방해하는 요소가 없는지\n' +
            '  * 청취자 이탈을 유발하는 지루한 구간이 없는지\n' +
            '- 예: 갑작스러운 장면 전환 → 시니어 청취자 혼란 유발\n' +
            '- 예: 복잡한 관계도 → 이해하기 어려움\n\n' +
            '### 4. 1차 검수 재확인\n' +
            '- 1차에서 놓친 오류가 없는지 다시 한번 확인\n' +
            '- 국가 배경, 시대 배경, 인물 설정, 인물 관계 재검수\n' +
            '- 1차 수정본에 새로운 오류가 생기지 않았는지 확인\n\n' +
            '## 출력 형식 (반드시 JSON으로만 응답):\n' +
            '{\n' +
            '  "analysis": "번호\\t오류 유형\\t오류 대본\\t변경 대본\\t검수 포인트\\n' +
            '1\\t시간 왜곡\\t자정쯤이라던 약속은 어제 일처럼 멀어졌고, 다음 해 봄 아침이 되어 있었습니다\\t(해당 문장 삭제)\\t자정에서 갑자기 다음 해 봄으로 시간 점프 - 흐름 왜곡\\n' +
            '2\\t장소 왜곡\\t고개를 들자 눈 대신 모래사장이 펼쳐져 있었고, 파도가 관창 담을 두드리고 있었지요\\t(해당 문장 삭제)\\t산골 마을에서 갑자기 해변으로 장소 점프",\n' +
            '  "revised": "최종 수정된 완전한 대본"\n' +
            '}\n\n' +
            '## 중요 규칙:\n' +
            '1. 위 4가지 항목을 **반드시 모두 검수**하세요\n' +
            '2. 시간/장소 왜곡을 최우선으로 검출\n' +
            '3. 시니어 청취자 관점에서 몰입 방해 요소 검출\n' +
            '4. 1차에서 놓친 오류 재검수\n' +
            '5. 발견된 모든 오류를 빠짐없이 기록\n' +
            '6. revised에는 최종 완성된 대본 작성\n' +
            '7. 반드시 완전한 JSON으로 응답 마무리\n' +
            '8. JSON 외 다른 텍스트 절대 금지';
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
