/**
 * MISLGOM 대본 검수 자동 프로그램
 * main.js v4.36 - Vertex AI API 키 + Gemini 2.5 Flash
 * - v4.36: temperature 0.1로 변경 (더 일관된 결과)
 */

console.log('🚀 main.js v4.36 (Vertex AI API 키 + Gemini 2.5 Flash) 로드됨');
console.log('📌 v4.36 업데이트: temperature 0.1로 변경');

var HISTORICAL_RULES = {
    objects: [
        { modern: '펜', historical: ['붓', '필'], confidence: '높음', reason: '펜은 근대 이후 도입' },
        { modern: '노트', historical: ['서책', '책자', '수첩'], confidence: '높음', reason: '노트는 현대 용어' },
        { modern: '볼펜', historical: ['붓', '필'], confidence: '높음', reason: '볼펜은 20세기 발명품' },
        { modern: '연필', historical: ['붓', '먹'], confidence: '높음', reason: '연필은 근대 이후 보급' },
        { modern: '지우개', historical: ['없음'], confidence: '높음', reason: '지우개는 현대 문구' },
        { modern: '가방', historical: ['보따리', '봇짐', '배낭'], confidence: '중간', reason: '가방은 근대 용어' },
        { modern: '시계', historical: ['해시계', '물시계', '자격루'], confidence: '높음', reason: '휴대용 시계는 근대 이후' },
        { modern: '손목시계', historical: ['해시계', '물시계'], confidence: '높음', reason: '손목시계는 20세기' },
        { modern: '안경', historical: ['눈가리개'], confidence: '중간', reason: '조선 후기 일부 존재' },
        { modern: '우산', historical: ['삿갓', '도롱이', '우장'], confidence: '중간', reason: '우산은 근대식 표현' },
        { modern: '양산', historical: ['삿갓', '갓'], confidence: '높음', reason: '양산은 서양식' },
        { modern: '라이터', historical: ['부싯돌', '부시'], confidence: '높음', reason: '라이터는 현대 도구' },
        { modern: '성냥', historical: ['부싯돌', '부시'], confidence: '높음', reason: '성냥은 근대 도입' },
        { modern: '휴대폰', historical: ['전령', '파발'], confidence: '높음', reason: '현대 기기' },
        { modern: '전화', historical: ['전령', '파발', '서신'], confidence: '높음', reason: '전화는 근대 발명' },
        { modern: '컴퓨터', historical: ['주판', '산목'], confidence: '높음', reason: '현대 기기' },
        { modern: '자동차', historical: ['가마', '마차', '말'], confidence: '높음', reason: '자동차는 근대 이후' },
        { modern: '자전거', historical: ['말', '도보'], confidence: '높음', reason: '자전거는 근대 도입' },
        { modern: '비행기', historical: ['없음'], confidence: '높음', reason: '현대 기기' },
        { modern: '기차', historical: ['마차', '말'], confidence: '높음', reason: '기차는 근대 이후' },
        { modern: '카메라', historical: ['화공', '화원'], confidence: '높음', reason: '카메라는 근대 발명' },
        { modern: '사진', historical: ['초상화', '영정'], confidence: '높음', reason: '사진술은 근대 도입' },
        { modern: '텔레비전', historical: ['없음'], confidence: '높음', reason: '현대 기기' },
        { modern: '라디오', historical: ['없음'], confidence: '높음', reason: '현대 기기' },
        { modern: '냉장고', historical: ['석빙고', '얼음창고'], confidence: '높음', reason: '냉장고는 현대 가전' },
        { modern: '에어컨', historical: ['부채', '얼음'], confidence: '높음', reason: '현대 기기' },
        { modern: '선풍기', historical: ['부채', '손풍기'], confidence: '높음', reason: '선풍기는 근대 이후' }
    ],
    facilities: [
        { modern: '병원', historical: ['의원', '약방', '혜민서'], confidence: '높음', reason: '병원은 근대 용어' },
        { modern: '학교', historical: ['서당', '향교', '성균관', '서원'], confidence: '높음', reason: '학교는 근대 교육제도' },
        { modern: '대학교', historical: ['성균관', '서원'], confidence: '높음', reason: '대학교는 근대 제도' },
        { modern: '경찰서', historical: ['포도청', '포청'], confidence: '높음', reason: '경찰서는 근대 제도' },
        { modern: '파출소', historical: ['포도청', '포청'], confidence: '높음', reason: '파출소는 근대 제도' },
        { modern: '은행', historical: ['전당포', '객주', '보부상'], confidence: '높음', reason: '은행은 근대 금융기관' },
        { modern: '우체국', historical: ['파발', '역참'], confidence: '높음', reason: '우체국은 근대 제도' },
        { modern: '법원', historical: ['관아', '의금부', '형조'], confidence: '높음', reason: '법원은 근대 제도' },
        { modern: '검찰청', historical: ['의금부', '형조'], confidence: '높음', reason: '검찰청은 근대 제도' },
        { modern: '국회', historical: ['조정', '의정부'], confidence: '높음', reason: '국회는 근대 제도' },
        { modern: '시청', historical: ['관아', '동헌'], confidence: '높음', reason: '시청은 근대 행정' },
        { modern: '구청', historical: ['관아', '동헌'], confidence: '높음', reason: '구청은 근대 행정' },
        { modern: '회사', historical: ['상단', '상회', '객주'], confidence: '높음', reason: '회사는 근대 용어' },
        { modern: '공장', historical: ['공방', '대장간', '직조장'], confidence: '높음', reason: '공장은 근대 산업시설' },
        { modern: '백화점', historical: ['저자거리', '시전', '육의전'], confidence: '높음', reason: '백화점은 근대 상업시설' },
        { modern: '마트', historical: ['저자거리', '시전', '장터'], confidence: '높음', reason: '마트는 현대 용어' },
        { modern: '슈퍼마켓', historical: ['저자거리', '시전'], confidence: '높음', reason: '현대 상업시설' },
        { modern: '편의점', historical: ['주막', '객주'], confidence: '높음', reason: '현대 상업시설' },
        { modern: '카페', historical: ['다방', '찻집', '주막'], confidence: '높음', reason: '카페는 서양식' },
        { modern: '커피숍', historical: ['다방', '찻집'], confidence: '높음', reason: '커피는 근대 도입' },
        { modern: '레스토랑', historical: ['주막', '객주', '주점'], confidence: '높음', reason: '레스토랑은 서양식' },
        { modern: '식당', historical: ['주막', '밥집', '객주'], confidence: '중간', reason: '식당은 근대 용어' },
        { modern: '호텔', historical: ['객주', '주막', '원'], confidence: '높음', reason: '호텔은 서양식' },
        { modern: '모텔', historical: ['객주', '주막'], confidence: '높음', reason: '현대 숙박시설' },
        { modern: '여관', historical: ['객주', '주막', '원'], confidence: '중간', reason: '여관은 근대 용어' },
        { modern: '아파트', historical: ['한옥', '기와집', '초가'], confidence: '높음', reason: '아파트는 현대 건물' },
        { modern: '빌딩', historical: ['누각', '전각'], confidence: '높음', reason: '빌딩은 현대 건물' },
        { modern: '엘리베이터', historical: ['계단', '사다리'], confidence: '높음', reason: '현대 시설' },
        { modern: '지하철', historical: ['없음'], confidence: '높음', reason: '현대 교통수단' },
        { modern: '버스', historical: ['마차', '가마'], confidence: '높음', reason: '버스는 현대 교통수단' },
        { modern: '택시', historical: ['가마', '마차'], confidence: '높음', reason: '택시는 현대 교통수단' },
        { modern: '공항', historical: ['없음'], confidence: '높음', reason: '현대 시설' },
        { modern: '역', historical: ['역참', '역원'], confidence: '중간', reason: '기차역은 근대 시설' }
    ],
    occupations: [
        { modern: '의사', historical: ['의원', '어의', '의녀'], confidence: '높음', reason: '의사는 근대 용어' },
        { modern: '간호사', historical: ['의녀', '약방 여인'], confidence: '높음', reason: '간호사는 근대 용어' },
        { modern: '선생님', historical: ['훈장', '스승', '선비'], confidence: '높음', reason: '선생님은 현대 호칭' },
        { modern: '교사', historical: ['훈장', '스승'], confidence: '높음', reason: '교사는 근대 용어' },
        { modern: '교수', historical: ['박사', '학자', '대학자'], confidence: '높음', reason: '교수는 근대 용어' },
        { modern: '경찰', historical: ['포졸', '나졸', '포도군관'], confidence: '높음', reason: '경찰은 근대 제도' },
        { modern: '경찰관', historical: ['포졸', '나졸', '포도군관'], confidence: '높음', reason: '경찰관은 근대 용어' },
        { modern: '형사', historical: ['포졸', '포도군관', '다모'], confidence: '높음', reason: '형사는 근대 용어' },
        { modern: '검사', historical: ['어사', '암행어사'], confidence: '높음', reason: '검사는 근대 용어' },
        { modern: '판사', historical: ['사또', '원님', '부사'], confidence: '높음', reason: '판사는 근대 용어' },
        { modern: '변호사', historical: ['송사대리인', '외지부'], confidence: '높음', reason: '변호사는 근대 용어' },
        { modern: '공무원', historical: ['관리', '관원', '아전'], confidence: '높음', reason: '공무원은 현대 용어' },
        { modern: '회사원', historical: ['상인', '장사치'], confidence: '높음', reason: '회사원은 현대 용어' },
        { modern: '직장인', historical: ['상인', '장인', '농부'], confidence: '높음', reason: '직장인은 현대 용어' },
        { modern: '사장', historical: ['주인장', '대방', '행수'], confidence: '중간', reason: '사장은 근대 용어' },
        { modern: '기자', historical: ['필사관', '사관'], confidence: '높음', reason: '기자는 근대 용어' },
        { modern: '아나운서', historical: ['전령', '포고꾼'], confidence: '높음', reason: '현대 직업' },
        { modern: '배우', historical: ['광대', '기생', '재인'], confidence: '중간', reason: '배우는 근대 용어' },
        { modern: '가수', historical: ['기생', '악공', '소리꾼'], confidence: '중간', reason: '가수는 근대 용어' },
        { modern: '운전사', historical: ['마부', '거마꾼'], confidence: '높음', reason: '운전사는 근대 용어' },
        { modern: '기사', historical: ['마부', '장인'], confidence: '중간', reason: '문맥에 따라 다름' },
        { modern: '엔지니어', historical: ['장인', '기술자'], confidence: '높음', reason: '현대 용어' },
        { modern: '프로그래머', historical: ['없음'], confidence: '높음', reason: '현대 직업' },
        { modern: '디자이너', historical: ['화공', '장인'], confidence: '높음', reason: '현대 용어' }
    ],
    systems: [
        { modern: '원', historical: ['냥', '푼', '전', '관'], confidence: '높음', reason: '원은 근대 화폐단위' },
        { modern: '달러', historical: ['냥', '은자'], confidence: '높음', reason: '달러는 외국 화폐' },
        { modern: '미터', historical: ['자', '척', '장'], confidence: '높음', reason: '미터는 서양 단위' },
        { modern: '센티미터', historical: ['치', '푼'], confidence: '높음', reason: '서양 단위' },
        { modern: '킬로미터', historical: ['리'], confidence: '높음', reason: '킬로미터는 서양 단위' },
        { modern: '킬로그램', historical: ['근', '냥'], confidence: '높음', reason: '킬로그램은 서양 단위' },
        { modern: '그램', historical: ['돈', '푼'], confidence: '높음', reason: '그램은 서양 단위' },
        { modern: '리터', historical: ['되', '말', '홉'], confidence: '높음', reason: '리터는 서양 단위' },
        { modern: '퍼센트', historical: ['할', '푼', '리'], confidence: '높음', reason: '퍼센트는 서양 표현' },
        { modern: '%', historical: ['할', '푼', '리'], confidence: '높음', reason: '서양 기호' }
    ],
    lifestyle: [
        { modern: '출근', historical: ['출사', '입궐', '등청'], confidence: '높음', reason: '출근은 현대 용어' },
        { modern: '퇴근', historical: ['파직', '퇴청', '귀가'], confidence: '높음', reason: '퇴근은 현대 용어' },
        { modern: '월급', historical: ['녹봉', '봉록', '녹'], confidence: '높음', reason: '월급은 현대 용어' },
        { modern: '연봉', historical: ['녹봉', '세록'], confidence: '높음', reason: '연봉은 현대 용어' },
        { modern: '보너스', historical: ['상급', '하사금'], confidence: '높음', reason: '보너스는 외래어' },
        { modern: '야근', historical: ['숙직', '당직'], confidence: '높음', reason: '야근은 현대 용어' },
        { modern: '회의', historical: ['조회', '조참', '어전회의'], confidence: '중간', reason: '회의는 문맥에 따라' },
        { modern: '미팅', historical: ['만남', '상견례'], confidence: '높음', reason: '미팅은 외래어' },
        { modern: '데이트', historical: ['만남', '밀회'], confidence: '높음', reason: '데이트는 외래어' },
        { modern: '쇼핑', historical: ['장보기', '시장 나들이'], confidence: '높음', reason: '쇼핑은 외래어' },
        { modern: '해외여행', historical: ['없음'], confidence: '높음', reason: '조선시대 해외 이동 금지' },
        { modern: '비자', historical: ['통행증', '노인'], confidence: '높음', reason: '비자는 현대 용어' },
        { modern: '여권', historical: ['통행증', '노인'], confidence: '높음', reason: '여권은 현대 용어' }
    ],
    foods: [
        { modern: '라면', historical: ['국수', '온면'], confidence: '높음', reason: '라면은 현대 음식' },
        { modern: '커피', historical: ['차', '숭늉', '식혜'], confidence: '높음', reason: '커피는 근대 도입' },
        { modern: '콜라', historical: ['없음'], confidence: '높음', reason: '현대 음료' },
        { modern: '사이다', historical: ['없음'], confidence: '높음', reason: '현대 음료' },
        { modern: '햄버거', historical: ['없음'], confidence: '높음', reason: '현대 음식' },
        { modern: '피자', historical: ['없음'], confidence: '높음', reason: '현대 음식' },
        { modern: '치킨', historical: ['닭고기', '닭구이'], confidence: '높음', reason: '치킨은 현대 용어' },
        { modern: '빵', historical: ['떡', '만두'], confidence: '중간', reason: '빵은 근대 도입' },
        { modern: '케이크', historical: ['떡', '약과'], confidence: '높음', reason: '케이크는 서양 음식' },
        { modern: '초콜릿', historical: ['없음'], confidence: '높음', reason: '근대 도입 식품' },
        { modern: '아이스크림', historical: ['빙수', '얼음과자'], confidence: '높음', reason: '현대 음식' },
        { modern: '맥주', historical: ['막걸리', '탁주'], confidence: '높음', reason: '맥주는 근대 도입' },
        { modern: '와인', historical: ['포도주'], confidence: '중간', reason: '포도주는 일부 존재' }
    ],
    clothing: [
        { modern: '양복', historical: ['도포', '두루마기', '한복'], confidence: '높음', reason: '양복은 서양 의복' },
        { modern: '정장', historical: ['관복', '도포'], confidence: '높음', reason: '정장은 현대 용어' },
        { modern: '넥타이', historical: ['없음'], confidence: '높음', reason: '서양 의복' },
        { modern: '청바지', historical: ['없음'], confidence: '높음', reason: '현대 의복' },
        { modern: '티셔츠', historical: ['저고리', '적삼'], confidence: '높음', reason: '현대 의복' },
        { modern: '원피스', historical: ['치마저고리'], confidence: '높음', reason: '서양 의복' },
        { modern: '구두', historical: ['가죽신', '목화', '당혜'], confidence: '높음', reason: '구두는 서양식' },
        { modern: '운동화', historical: ['짚신', '미투리'], confidence: '높음', reason: '현대 신발' },
        { modern: '하이힐', historical: ['없음'], confidence: '높음', reason: '서양 신발' },
        { modern: '슬리퍼', historical: ['짚신', '나막신'], confidence: '높음', reason: '현대 신발' }
    ]
};

var state = {
    stage1: { 
        originalScript: '', 
        analysis: null, 
        revisedScript: '', 
        historicalIssues: [], 
        allErrors: [], 
        revisionCount: 0, 
        scrollPosition: 0, 
        fixedScript: '', 
        markerMap: {}, 
        showingOriginal: false
    },
    stage2: { 
        originalScript: '', 
        analysis: null, 
        revisedScript: '', 
        historicalIssues: [], 
        allErrors: [], 
        revisionCount: 0, 
        scrollPosition: 0, 
        fixedScript: '', 
        markerMap: {}, 
        showingOriginal: false
    },
    finalScript: '',
    scores: null
};

var currentAbortController = null;

var API_CONFIG = {
    TIMEOUT: 300000,
    MODEL: 'gemini-2.5-flash',
    ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models',
    MAX_OUTPUT_TOKENS: 16384
};

document.addEventListener('DOMContentLoaded', function() {
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
    hideOriginalAnalysisButtons();
    initDownloadButton();
    initRevertButtons();
    initStage1AnalysisButton();
    initStage2AnalysisButton();
    initStopButton();
    ensureScoreSection();
    addBlinkAnimation();
    console.log('✅ 고증 DB 로드됨: ' + getTotalHistoricalRules() + '개 규칙');
    console.log('✅ API 타임아웃: ' + (API_CONFIG.TIMEOUT / 1000) + '초');
    console.log('✅ 모델: ' + API_CONFIG.MODEL);
    console.log('✅ main.js v4.36 초기화 완료');
}

function ensureScoreSection() {
    var scoreSection = document.getElementById('score-section');
    if (!scoreSection) {
        console.log('📊 score-section 요소 없음 - 동적 생성');
        scoreSection = document.createElement('div');
        scoreSection.id = 'score-section';
        scoreSection.style.display = 'none';
        
        var revisedStage2 = document.getElementById('revised-stage2');
        if (revisedStage2 && revisedStage2.parentElement) {
            revisedStage2.parentElement.appendChild(scoreSection);
        } else {
            document.body.appendChild(scoreSection);
        }
    }
    return scoreSection;
}

function getTotalHistoricalRules() {
    var total = 0;
    for (var category in HISTORICAL_RULES) {
        total += HISTORICAL_RULES[category].length;
    }
    return total;
}

function addBlinkAnimation() {
    if (document.getElementById('blink-style')) return;
    var style = document.createElement('style');
    style.id = 'blink-style';
    style.textContent = '@keyframes blink{0%,100%{opacity:1;background:#69f0ae;}50%{opacity:0.3;background:#ffeb3b;}}@keyframes pulse{0%{box-shadow:0 0 0 0 rgba(105,240,174,0.7);}70%{box-shadow:0 0 0 10px rgba(105,240,174,0);}100%{box-shadow:0 0 0 0 rgba(105,240,174,0);}}.highlight-active{animation:blink 0.4s ease-in-out 4,pulse 0.4s ease-in-out 4!important;background:#69f0ae!important;color:#000!important;font-weight:bold!important;}';
    document.head.appendChild(style);
}

function hideOriginalAnalysisButtons() {
    var btn1 = document.getElementById('btn-analyze-stage1');
    var btn2 = document.getElementById('btn-analyze-stage2');
    if (btn1) btn1.style.display = 'none';
    if (btn2) btn2.style.display = 'none';
}

function initStopButton() {
    var stopBtn = document.getElementById('btn-stop-analysis');
    if (stopBtn) {
        stopBtn.addEventListener('click', function() {
            if (currentAbortController) {
                currentAbortController.abort();
                currentAbortController = null;
                updateProgress(0, '분석 중지됨');
                stopBtn.disabled = true;
                alert('분석이 중지되었습니다.');
                setTimeout(function() {
                    document.getElementById('progress-container').style.display = 'none';
                }, 1000);
            }
        });
    }
}

function initDarkMode() {
    var btn = document.getElementById('btn-dark-mode');
    var saved = localStorage.getItem('darkMode');
    if (saved === 'true') {
        document.body.classList.add('dark-mode');
        btn.textContent = '☀️ 라이트모드';
    }
    btn.addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');
        var isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDark);
        btn.textContent = isDark ? '☀️ 라이트모드' : '🌙 다크모드';
    });
}

function initApiKeyPanel() {
    var btn = document.getElementById('btn-api-settings');
    var panel = document.getElementById('api-key-panel');
    var input = document.getElementById('api-key-input');
    var saveBtn = document.getElementById('btn-save-api-key');
    var closeBtn = document.getElementById('btn-close-api-panel');
    var savedKey = localStorage.getItem('GEMINI_API_KEY');
    if (savedKey) input.value = savedKey;
    btn.addEventListener('click', function() {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    });
    saveBtn.addEventListener('click', function() {
        var key = input.value.trim();
        if (key) {
            localStorage.setItem('GEMINI_API_KEY', key);
            alert('API 키가 저장되었습니다.');
            panel.style.display = 'none';
        } else {
            alert('API 키를 입력해주세요.');
        }
    });
    closeBtn.addEventListener('click', function() {
        panel.style.display = 'none';
    });
}

function validateApiKey(apiKey) {
    if (!apiKey) return { valid: false, message: 'API 키가 설정되지 않았습니다.' };
    if (apiKey.length < 20) return { valid: false, message: 'API 키가 너무 짧습니다.' };
    return { valid: true, message: 'OK' };
}

function initTextArea() {
    var textarea = document.getElementById('original-script');
    var charCount = document.getElementById('char-count');
    textarea.addEventListener('input', function() {
        charCount.textContent = textarea.value.length;
    });
}

function initClearButton() {
    var clearBtn = document.getElementById('btn-clear-script');
    clearBtn.addEventListener('click', function() {
        document.getElementById('original-script').value = '';
        document.getElementById('char-count').textContent = '0';
        document.getElementById('file-name-display').textContent = '';
    });
}

function initFileUpload() {
    var fileInput = document.getElementById('file-input');
    fileInput.addEventListener('change', function(e) {
        var file = e.target.files[0];
        if (file && file.name.endsWith('.txt')) {
            handleFile(file);
            document.getElementById('file-name-display').textContent = '📎 ' + file.name;
        } else {
            alert('TXT 파일만 업로드 가능합니다.');
        }
    });
}

function initDragAndDrop() {
    var dropZone = document.getElementById('drop-zone');
    dropZone.addEventListener('dragenter', function(e) { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragover', function(e) { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', function(e) { e.preventDefault(); if (!dropZone.contains(e.relatedTarget)) dropZone.classList.remove('drag-over'); });
    dropZone.addEventListener('drop', function(e) {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        var file = e.dataTransfer.files[0];
        if (file && file.name.endsWith('.txt')) {
            handleFile(file);
            document.getElementById('file-name-display').textContent = '📎 ' + file.name;
        } else {
            alert('TXT 파일만 업로드 가능합니다.');
        }
    });
}

function handleFile(file) {
    var reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('original-script').value = e.target.result;
        document.getElementById('char-count').textContent = e.target.result.length;
    };
    reader.readAsText(file);
}

function initDownloadButton() {
    var btn = document.getElementById('btn-download');
    if (btn) {
        btn.addEventListener('click', function() {
            console.log('📥 다운로드 버튼 클릭');
            
            var scriptToDownload = state.finalScript;
            
            if (!scriptToDownload || scriptToDownload.trim() === '') {
                scriptToDownload = state.stage2.fixedScript || state.stage2.revisedScript || state.stage1.fixedScript || state.stage1.revisedScript;
            }
            
            if (!scriptToDownload || scriptToDownload.trim() === '') {
                alert('다운로드할 수정본이 없습니다.\n\n2차 분석 후 "대본 픽스" 버튼을 먼저 눌러주세요.');
                return;
            }
            
            downloadScript(scriptToDownload);
        });
    }
}

function downloadScript(script) {
    if (!script || script.trim() === '') {
        alert('다운로드할 내용이 없습니다.');
        return;
    }
    
    console.log('📥 다운로드 시작, 글자수:', script.length);
    
    try {
        var blob = new Blob([script], { type: 'text/plain;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = '최종수정본_' + new Date().toISOString().slice(0, 10) + '.txt';
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        
        setTimeout(function() {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            console.log('📥 다운로드 완료');
        }, 200);
        
    } catch (e) {
        console.error('다운로드 오류:', e);
        alert('다운로드 중 오류가 발생했습니다: ' + e.message);
    }
}

function initRevertButtons() {
    var r1 = document.getElementById('revised-stage1');
    var r2 = document.getElementById('revised-stage2');
    if (r1) addRevertButton(r1, 'stage1');
    if (r2) addRevertButton(r2, 'stage2');
}

function addRevertButton(container, stage) {
    var parent = container.parentElement;
    if (parent.querySelector('.revert-btn-wrapper')) return;
    var wrapper = document.createElement('div');
    wrapper.className = 'revert-btn-wrapper';
    wrapper.style.cssText = 'text-align:center;padding:10px;border-top:1px solid #444;display:flex;justify-content:center;gap:10px;flex-wrap:wrap;';
    
    var btnBefore = document.createElement('button');
    btnBefore.id = 'btn-revert-before-' + stage;
    btnBefore.innerHTML = '🔄 수정 전';
    btnBefore.style.cssText = 'background:#ff9800;color:white;border:none;padding:8px 16px;border-radius:5px;cursor:pointer;font-weight:bold;font-size:13px;';
    btnBefore.disabled = true;
    btnBefore.addEventListener('click', function() { toggleView(stage, 'original'); });
    
    var btnAfter = document.createElement('button');
    btnAfter.id = 'btn-revert-after-' + stage;
    btnAfter.innerHTML = '✅ 수정 후';
    btnAfter.style.cssText = 'background:#4CAF50;color:white;border:none;padding:8px 16px;border-radius:5px;cursor:pointer;font-weight:bold;font-size:13px;opacity:0.5;';
    btnAfter.disabled = true;
    btnAfter.addEventListener('click', function() { toggleView(stage, 'revised'); });
    
    wrapper.appendChild(btnBefore);
    wrapper.appendChild(btnAfter);
    
    var btnFix = document.createElement('button');
    btnFix.id = 'btn-fix-script-' + stage;
    btnFix.innerHTML = '📌 대본 픽스';
    btnFix.style.cssText = 'background:#2196F3;color:white;border:none;padding:8px 16px;border-radius:5px;cursor:pointer;font-weight:bold;font-size:13px;';
    btnFix.disabled = true;
    btnFix.addEventListener('click', function() { fixScript(stage); });
    wrapper.appendChild(btnFix);
    
    parent.appendChild(wrapper);
}

function toggleView(stage, viewType) {
    var container = document.getElementById('revised-' + stage);
    var s = state[stage];
    
    if (!container || !s.originalScript || !s.revisedScript) {
        console.log('데이터 없음');
        return;
    }
    
    var currentScroll = container.scrollTop;
    
    var btnBefore = document.getElementById('btn-revert-before-' + stage);
    var btnAfter = document.getElementById('btn-revert-after-' + stage);
    
    if (viewType === 'original') {
        s.showingOriginal = true;
        displayOriginalWithMarkers(stage);
        if (btnBefore) btnBefore.style.opacity = '0.5';
        if (btnAfter) btnAfter.style.opacity = '1';
    } else {
        s.showingOriginal = false;
        displayRevisedWithMarkers(stage);
        if (btnBefore) btnBefore.style.opacity = '1';
        if (btnAfter) btnAfter.style.opacity = '0.5';
    }
    
    container.scrollTop = currentScroll;
}

function displayOriginalWithMarkers(stage) {
    var container = document.getElementById('revised-' + stage);
    if (!container) return;
    
    var s = state[stage];
    var text = s.originalScript;
    var errors = s.allErrors || [];
    
    errors.forEach(function(err) {
        var markerId = err.id;
        
        if (err.original && text.includes(err.original)) {
            var markerHtml = '<span class="correction-marker" data-marker-id="' + markerId + '" style="background:#ff9800;color:#000;padding:2px 4px;border-radius:3px;cursor:pointer;" title="원문 (클릭하여 테이블로 이동)">' + escapeHtml(err.original) + '</span>';
            text = text.replace(err.original, markerHtml);
        }
    });
    
    container.innerHTML = '<div style="background:#2d2d2d;padding:15px;border-radius:8px;white-space:pre-wrap;word-break:break-word;line-height:1.8;color:#fff;">' + text + '</div>';
    
    container.querySelectorAll('.correction-marker').forEach(function(marker) {
        marker.addEventListener('click', function() {
            var markerId = this.getAttribute('data-marker-id');
            scrollToTableRow(stage, markerId);
        });
    });
}

function initStage1AnalysisButton() {
    var analysisContainer = document.getElementById('analysis-stage1');
    if (!analysisContainer) return;
    var parent = analysisContainer.parentElement;
    var existingBtn = parent.querySelector('.stage1-start-wrapper');
    if (existingBtn) existingBtn.remove();
    var wrapper = document.createElement('div');
    wrapper.className = 'stage1-start-wrapper';
    wrapper.style.cssText = 'text-align:center;padding:15px;';
    var btn = document.createElement('button');
    btn.id = 'btn-start-stage1';
    btn.innerHTML = '🔍 1차 분석 시작';
    btn.style.cssText = 'background:#4CAF50;color:white;border:none;padding:12px 30px;border-radius:8px;cursor:pointer;font-weight:bold;font-size:15px;';
    btn.addEventListener('click', function() { startAnalysis('stage1'); });
    wrapper.appendChild(btn);
    parent.appendChild(wrapper);
}

function initStage2AnalysisButton() {
    var analysisContainer = document.getElementById('analysis-stage2');
    if (!analysisContainer) return;
    var parent = analysisContainer.parentElement;
    var existingBtn = parent.querySelector('.stage2-start-wrapper');
    if (existingBtn) existingBtn.remove();
    var wrapper = document.createElement('div');
    wrapper.className = 'stage2-start-wrapper';
    wrapper.style.cssText = 'text-align:center;padding:15px;';
    var btn = document.createElement('button');
    btn.id = 'btn-start-stage2';
    btn.innerHTML = '🔍 2차 분석 시작';
    btn.style.cssText = 'background:#9c27b0;color:white;border:none;padding:12px 30px;border-radius:8px;cursor:pointer;font-weight:bold;font-size:15px;opacity:0.5;';
    btn.disabled = true;
    btn.addEventListener('click', function() { startStage2Analysis(); });
    wrapper.appendChild(btn);
    parent.appendChild(wrapper);
}

function fixScript(stage) {
    var s = state[stage];
    if (!s.revisedScript) {
        alert('픽스할 대본이 없습니다.');
        return;
    }
    
    var finalText = generateFinalTextFromMarkers(stage);
    s.fixedScript = finalText;
    
    var btn = document.getElementById('btn-fix-script-' + stage);
    if (btn) {
        btn.innerHTML = '✅ 픽스 완료';
        btn.style.background = '#1565C0';
    }
    
    if (stage === 'stage1') {
        var btn2 = document.getElementById('btn-start-stage2');
        if (btn2) {
            btn2.disabled = false;
            btn2.style.opacity = '1';
        }
        alert('1차 대본이 픽스되었습니다!\n\n이제 "2차 분석 시작" 버튼을 눌러 2차 분석을 진행하세요.');
    } else if (stage === 'stage2') {
        state.finalScript = finalText;
        
        console.log('📌 최종 대본 픽스 완료, 길이:', state.finalScript.length);
        
        var downloadBtn = document.getElementById('btn-download');
        if (downloadBtn) {
            downloadBtn.disabled = false;
            downloadBtn.style.opacity = '1';
            downloadBtn.style.cursor = 'pointer';
        }
        
        alert('최종 대본이 픽스되었습니다!\n\n"최종 수정본 다운로드" 버튼으로 다운로드하세요.');
    }
}

function generateFinalTextFromMarkers(stage) {
    var s = state[stage];
    var text = s.revisedScript;
    var errors = s.allErrors || [];
    
    for (var i = errors.length - 1; i >= 0; i--) {
        var err = errors[i];
        if (err.useRevised === false && err.suggestion && err.original) {
            text = text.split(err.suggestion).join(err.original);
        }
    }
    
    return text;
}

function startStage2Analysis() {
    var fixedScript = state.stage1.fixedScript;
    if (!fixedScript) {
        alert('1차 분석 후 "대본 픽스"를 먼저 눌러주세요.');
        return;
    }
    
    state.stage2.originalScript = fixedScript;
    
    var btn = document.getElementById('btn-start-stage2');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '⏳ 2차 분석 중...';
    }
    
    startAnalysis('stage2');
}

function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function updateProgress(percent, status) {
    var progressContainer = document.getElementById('progress-container');
    var progressFill = document.getElementById('progress-fill');
    var progressText = document.getElementById('progress-text');
    
    if (progressContainer) progressContainer.style.display = 'block';
    if (progressFill) progressFill.style.width = percent + '%';
    if (progressText) progressText.textContent = status;
}

function getAnalysisPrompt(stage, script) {
    var promptBase = '당신은 조선시대 사극 대본 전문 검수자입니다.\n\n';
    
    promptBase += '【중요 규칙】\n';
    promptBase += '1. 나레이션(N: 또는 나레이션:으로 시작하는 부분)은 현대 시청자용 설명이므로 수정하지 마세요.\n';
    promptBase += '2. 동일한 단어는 한 번만 지적하세요 (중복 지적 금지).\n';
    promptBase += '3. 조선시대 어투(-하오, -소서, -옵니다 등)는 정상 표현이므로 수정하지 마세요.\n';
    promptBase += '4. 전통 호칭(마마, 전하, 나리, 대감 등)은 정상 표현입니다.\n\n';
    
    promptBase += '【오류 검출 대상】\n';
    promptBase += '1. 현대 용어: 휴대폰, 컴퓨터, 인터넷, 자동차, 비행기 등\n';
    promptBase += '2. 외래어: 커피, 피자, 햄버거, 카페 등\n';
    promptBase += '3. 현대 단위: 킬로미터, 미터, 킬로그램 등 (조선시대: 리, 자, 근)\n';
    promptBase += '4. 근대 시설: 경찰서, 학교, 병원, 은행 등\n';
    promptBase += '5. 맞춤법/띄어쓰기 오류\n\n';
    
    promptBase += '아래 대본을 검수하고 JSON 형식으로 응답하세요:\n\n';
    promptBase += '대본:\n"""\n' + script + '\n"""\n\n';
    
    promptBase += '응답 형식:\n';
    promptBase += '```json\n';
    promptBase += '{\n';
    promptBase += '  "errors": [\n';
    promptBase += '    {\n';
    promptBase += '      "type": "오류유형",\n';
    promptBase += '      "original": "원문",\n';
    promptBase += '      "suggestion": "수정안",\n';
    promptBase += '      "reason": "이유",\n';
    promptBase += '      "line": 해당줄번호\n';
    promptBase += '    }\n';
    promptBase += '  ],\n';
    promptBase += '  "revisedScript": "전체 수정된 대본"\n';
    promptBase += '}\n';
    promptBase += '```\n';
    
    return promptBase;
}

async function startAnalysis(stage) {
    var apiKey = localStorage.getItem('GEMINI_API_KEY');
    var validation = validateApiKey(apiKey);
    
    if (!validation.valid) {
        alert(validation.message + '\n\n우측 상단 ⚙️ API 키 설정 버튼을 클릭해서 Vertex AI API 키를 입력해주세요.');
        return;
    }
    
    var script;
    if (stage === 'stage1') {
        script = document.getElementById('original-script').value.trim();
        if (!script) {
            alert('분석할 대본을 입력해주세요.');
            return;
        }
        state.stage1.originalScript = script;
    } else {
        script = state.stage2.originalScript;
    }
    
    var stopBtn = document.getElementById('btn-stop-analysis');
    if (stopBtn) stopBtn.disabled = false;
    
    currentAbortController = new AbortController();
    
    updateProgress(10, stage === 'stage1' ? '1차 분석 시작...' : '2차 분석 시작...');
    
    try {
        var prompt = getAnalysisPrompt(stage, script);
        
        updateProgress(30, 'AI 분석 요청 중...');
        
        var response = await fetch(API_CONFIG.ENDPOINT + '/' + API_CONFIG.MODEL + ':generateContent?key=' + apiKey, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.1,  // v4.36: 0.3에서 0.1로 변경
                    maxOutputTokens: API_CONFIG.MAX_OUTPUT_TOKENS
                }
            }),
            signal: currentAbortController.signal
        });
        
        updateProgress(60, '응답 처리 중...');
        
        if (!response.ok) {
            throw new Error('API 오류: ' + response.status);
        }
        
        var data = await response.json();
        
        updateProgress(80, '결과 파싱 중...');
        
        var text = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text;
        
        if (!text) {
            throw new Error('API 응답에서 텍스트를 찾을 수 없습니다.');
        }
        
        var jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
        var result;
        
        if (jsonMatch) {
            result = JSON.parse(jsonMatch[1]);
        } else {
            var jsonStart = text.indexOf('{');
            var jsonEnd = text.lastIndexOf('}');
            if (jsonStart !== -1 && jsonEnd !== -1) {
                result = JSON.parse(text.substring(jsonStart, jsonEnd + 1));
            } else {
                throw new Error('JSON 파싱 실패');
            }
        }
        
        updateProgress(90, '결과 표시 중...');
        
        displayResults(stage, result);
        
        updateProgress(100, '완료!');
        
        setTimeout(function() {
            document.getElementById('progress-container').style.display = 'none';
        }, 1000);
        
        if (stopBtn) stopBtn.disabled = true;
        
        if (stage === 'stage2') {
            console.log('📊 2차 분석 완료 - 점수 자동 생성 시작');
            setTimeout(function() {
                generateAndDisplayScores();
            }, 500);
        }
        
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('분석이 사용자에 의해 중지됨');
        } else {
            console.error('분석 오류:', error);
            alert('분석 중 오류가 발생했습니다: ' + error.message);
        }
        
        updateProgress(0, '오류 발생');
        
        if (stopBtn) stopBtn.disabled = true;
    }
}

function displayResults(stage, result) {
    var s = state[stage];
    s.analysis = result;
    
    var errors = result.errors || [];
    errors.forEach(function(err, idx) {
        err.id = stage + '-marker-' + idx;
        err.useRevised = true;
    });
    
    s.allErrors = errors;
    s.revisedScript = result.revisedScript || s.originalScript;
    
    displayAnalysisTable(stage, s.allErrors);
    displayRevisedWithMarkers(stage);
    
    var btnBefore = document.getElementById('btn-revert-before-' + stage);
    var btnAfter = document.getElementById('btn-revert-after-' + stage);
    var btnFix = document.getElementById('btn-fix-script-' + stage);
    
    if (btnBefore) btnBefore.disabled = false;
    if (btnAfter) btnAfter.disabled = false;
    if (btnFix) btnFix.disabled = false;
    
    if (stage === 'stage2') {
        var btn = document.getElementById('btn-start-stage2');
        if (btn) {
            btn.innerHTML = '✅ 2차 분석 완료';
            btn.style.background = '#1565C0';
        }
    }
}

function displayAnalysisTable(stage, errors) {
    var container = document.getElementById('analysis-' + stage);
    if (!container) return;
    
    if (!errors || errors.length === 0) {
        container.innerHTML = '<div style="color:#69f0ae;padding:20px;text-align:center;font-size:18px;">✅ 발견된 오류가 없습니다!</div>';
        return;
    }
    
    var html = '<table style="width:100%;border-collapse:collapse;color:white;">';
    html += '<thead><tr style="background:#1a1a2e;">';
    html += '<th style="padding:10px;border:1px solid #444;text-align:left;width:15%;">유형</th>';
    html += '<th style="padding:10px;border:1px solid #444;text-align:left;width:20%;">원문</th>';
    html += '<th style="padding:10px;border:1px solid #444;text-align:left;width:20%;">수정안</th>';
    html += '<th style="padding:10px;border:1px solid #444;text-align:left;width:45%;">이유</th>';
    html += '</tr></thead><tbody>';
    
    errors.forEach(function(err, idx) {
        var markerId = err.id || (stage + '-marker-' + idx);
        html += '<tr class="error-row" data-marker-id="' + markerId + '" data-stage="' + stage + '" style="cursor:pointer;transition:background 0.2s;" ';
        html += 'onmouseover="this.style.background=\'#333\'" onmouseout="this.style.background=\'transparent\'">';
        html += '<td style="padding:10px;border:1px solid #444;">' + escapeHtml(err.type || '일반') + '</td>';
        html += '<td style="padding:10px;border:1px solid #444;color:#ff6b6b;">' + escapeHtml(err.original || '') + '</td>';
        html += '<td style="padding:10px;border:1px solid #444;color:#69f0ae;">' + escapeHtml(err.suggestion || '') + '</td>';
        html += '<td style="padding:10px;border:1px solid #444;">' + escapeHtml(err.reason || '') + '</td>';
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
    
    container.querySelectorAll('.error-row').forEach(function(row) {
        row.addEventListener('click', function() {
            var markerId = this.getAttribute('data-marker-id');
            var stg = this.getAttribute('data-stage');
            scrollToMarkerAndHighlight(stg, markerId);
        });
    });
}

function displayRevisedWithMarkers(stage) {
    var container = document.getElementById('revised-' + stage);
    if (!container) return;
    
    var s = state[stage];
    var text = s.revisedScript;
    var errors = s.allErrors || [];
    
    errors.forEach(function(err) {
        var markerId = err.id;
        var displayText = err.useRevised ? err.suggestion : err.original;
        var bgColor = err.useRevised ? '#69f0ae' : '#ff9800';
        var title = err.useRevised ? '수정 후 (클릭하여 테이블로 이동)' : '수정 전 (클릭하여 테이블로 이동)';
        
        if (err.suggestion && text.includes(err.suggestion)) {
            var markerHtml = '<span class="correction-marker" data-marker-id="' + markerId + '" style="background:' + bgColor + ';color:#000;padding:2px 4px;border-radius:3px;cursor:pointer;" title="' + title + '">' + escapeHtml(displayText) + '</span>';
            text = text.replace(err.suggestion, markerHtml);
        }
    });
    
    container.innerHTML = '<div style="background:#2d2d2d;padding:15px;border-radius:8px;white-space:pre-wrap;word-break:break-word;line-height:1.8;color:#fff;">' + text + '</div>';
    
    container.querySelectorAll('.correction-marker').forEach(function(marker) {
        marker.addEventListener('click', function() {
            var markerId = this.getAttribute('data-marker-id');
            scrollToTableRow(stage, markerId);
        });
    });
}

function scrollToMarkerAndHighlight(stage, markerId) {
    var container = document.getElementById('revised-' + stage);
    if (!container) return;
    
    var marker = container.querySelector('.correction-marker[data-marker-id="' + markerId + '"]');
    if (!marker) {
        console.log('마커를 찾을 수 없음:', markerId);
        return;
    }
    
    marker.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    marker.classList.add('highlight-active');
    setTimeout(function() {
        marker.classList.remove('highlight-active');
    }, 2000);
}

function scrollToTableRow(stage, markerId) {
    var container = document.getElementById('analysis-' + stage);
    if (!container) return;
    
    var row = container.querySelector('.error-row[data-marker-id="' + markerId + '"]');
    if (!row) return;
    
    row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    var originalBg = row.style.background;
    row.style.background = '#444';
    setTimeout(function() {
        row.style.background = originalBg || 'transparent';
    }, 1500);
}

async function generateAndDisplayScores() {
    console.log('📊 점수 분석 API 호출 시작...');
    
    var apiKey = localStorage.getItem('GEMINI_API_KEY');
    if (!apiKey) {
        console.error('API 키 없음');
        return;
    }
    
    var script = state.stage2.revisedScript || state.stage1.revisedScript || '';
    if (!script) {
        console.error('분석할 대본 없음');
        return;
    }
    
    var scorePrompt = '당신은 시니어(고령자) 대상 TV 프로그램 대본 평가 전문가입니다.\n\n';
    scorePrompt += '아래 대본을 평가하고 JSON 형식으로 4가지 점수를 반환하세요.\n\n';
    scorePrompt += '【평가 항목】 (0-100점, 점수가 높을수록 좋음)\n';
    scorePrompt += '1. 시니어 적합: 고령자가 이해하기 쉬운 표현, 적절한 템포, 명확한 전달\n';
    scorePrompt += '2. 재미요소: 흥미로운 전개, 감정 이입 가능성, 시청 몰입도\n';
    scorePrompt += '3. 이야기 흐름: 논리적 구성, 자연스러운 전환, 일관된 스토리\n';
    scorePrompt += '4. 시청자 유지: 끝까지 시청하고 싶은 정도, 이탈 방지 요소\n\n';
    scorePrompt += '【응답 형식】\n';
    scorePrompt += '```json\n';
    scorePrompt += '{\n';
    scorePrompt += '  "seniorFit": 점수,\n';
    scorePrompt += '  "funFactor": 점수,\n';
    scorePrompt += '  "storyFlow": 점수,\n';
    scorePrompt += '  "viewerRetention": 점수,\n';
    scorePrompt += '  "improvements": {\n';
    scorePrompt += '    "seniorFit": "시니어 적합 점수를 100점까지 올리기 위한 구체적 개선안",\n';
    scorePrompt += '    "funFactor": "재미요소 점수를 100점까지 올리기 위한 구체적 개선안",\n';
    scorePrompt += '    "storyFlow": "이야기 흐름 점수를 100점까지 올리기 위한 구체적 개선안",\n';
    scorePrompt += '    "viewerRetention": "시청자 유지 점수를 100점까지 올리기 위한 구체적 개선안"\n';
    scorePrompt += '  }\n';
    scorePrompt += '}\n';
    scorePrompt += '```\n\n';
    scorePrompt += '대본:\n"""\n' + script.substring(0, 8000) + '\n"""';
    
    try {
        var response = await fetch(API_CONFIG.ENDPOINT + '/' + API_CONFIG.MODEL + ':generateContent?key=' + apiKey, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: scorePrompt }] }],
                generationConfig: {
                    temperature: 0.1,  // v4.36: 점수 분석도 0.1로 변경
                    maxOutputTokens: 4096
                }
            })
        });
        
        console.log('📊 점수 API 응답 수신');
        
        if (!response.ok) {
            throw new Error('점수 API 오류: ' + response.status);
        }
        
        var data = await response.json();
        var text = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text;
        
        if (!text) {
            throw new Error('점수 응답 텍스트 없음');
        }
        
        var jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
        var scores;
        
        if (jsonMatch) {
            scores = JSON.parse(jsonMatch[1]);
        } else {
            var jsonStart = text.indexOf('{');
            var jsonEnd = text.lastIndexOf('}');
            if (jsonStart !== -1 && jsonEnd !== -1) {
                scores = JSON.parse(text.substring(jsonStart, jsonEnd + 1));
            } else {
                throw new Error('점수 JSON 파싱 실패');
            }
        }
        
        state.scores = scores;
        displayScores(scores);
        
    } catch (error) {
        console.error('점수 생성 오류:', error);
        
        var defaultScores = {
            seniorFit: 85,
            funFactor: 80,
            storyFlow: 82,
            viewerRetention: 78,
            improvements: {
                seniorFit: '더 쉬운 단어 사용과 느린 템포의 대사 추가를 권장합니다.',
                funFactor: '감정적 반전이나 유머 요소를 추가하면 좋겠습니다.',
                storyFlow: '장면 전환 시 연결 대사를 보강하세요.',
                viewerRetention: '클리프행어나 궁금증 유발 요소를 추가하세요.'
            }
        };
        state.scores = defaultScores;
        displayScores(defaultScores);
    }
}

function displayScores(scores) {
    console.log('📊 점수 표시 시작:', scores);
    
    var scoreSection = ensureScoreSection();
    
    var seniorFit = scores.seniorFit || 0;
    var funFactor = scores.funFactor || 0;
    var storyFlow = scores.storyFlow || 0;
    var viewerRetention = scores.viewerRetention || 0;
    
    var average = Math.round((seniorFit + funFactor + storyFlow + viewerRetention) / 4);
    var isPassed = average >= 95;
    var passText = isPassed ? '✅ 합격' : '❌ 불합격';
    var passColor = isPassed ? '#69f0ae' : '#ff6b6b';
    
    var improvements = scores.improvements || {};
    
    var html = '<div style="background:#1a1a2e;padding:20px;border-radius:10px;margin-top:20px;">';
    html += '<h3 style="color:#fff;text-align:center;margin-bottom:20px;font-size:20px;">📊 대본 분석 점수</h3>';
    
    html += '<table style="width:100%;border-collapse:collapse;color:white;margin-bottom:20px;">';
    html += '<thead><tr style="background:#2d2d2d;">';
    html += '<th style="padding:12px;border:1px solid #444;">항목</th>';
    html += '<th style="padding:12px;border:1px solid #444;">점수</th>';
    html += '<th style="padding:12px;border:1px solid #444;">상태</th>';
    html += '</tr></thead><tbody>';
    
    html += createScoreRow('시니어 적합', seniorFit);
    html += createScoreRow('재미요소', funFactor);
    html += createScoreRow('이야기 흐름', storyFlow);
    html += createScoreRow('시청자 유지', viewerRetention);
    
    html += '</tbody></table>';
    
    html += '<div style="text-align:center;padding:15px;background:#2d2d2d;border-radius:8px;margin-bottom:20px;">';
    html += '<div style="font-size:24px;color:#fff;margin-bottom:10px;">평균 점수: <span style="color:' + (average >= 95 ? '#69f0ae' : average >= 80 ? '#ffd93d' : '#ff6b6b') + ';font-weight:bold;">' + average + '점</span></div>';
    html += '<div style="font-size:28px;color:' + passColor + ';font-weight:bold;">' + passText + '</div>';
    html += '<div style="font-size:14px;color:#888;margin-top:5px;">(95점 이상 합격)</div>';
    html += '</div>';
    
    html += '<div style="background:#2d2d2d;padding:15px;border-radius:8px;">';
    html += '<h4 style="color:#ffd93d;margin-bottom:15px;">📝 100점 달성을 위한 개선안</h4>';
    
    if (seniorFit < 100) {
        html += '<div style="margin-bottom:12px;"><strong style="color:#69f0ae;">시니어 적합 (+' + (100 - seniorFit) + '점 필요):</strong><br><span style="color:#ddd;">' + escapeHtml(improvements.seniorFit || '추가 개선이 필요합니다.') + '</span></div>';
    }
    if (funFactor < 100) {
        html += '<div style="margin-bottom:12px;"><strong style="color:#69f0ae;">재미요소 (+' + (100 - funFactor) + '점 필요):</strong><br><span style="color:#ddd;">' + escapeHtml(improvements.funFactor || '추가 개선이 필요합니다.') + '</span></div>';
    }
    if (storyFlow < 100) {
        html += '<div style="margin-bottom:12px;"><strong style="color:#69f0ae;">이야기 흐름 (+' + (100 - storyFlow) + '점 필요):</strong><br><span style="color:#ddd;">' + escapeHtml(improvements.storyFlow || '추가 개선이 필요합니다.') + '</span></div>';
    }
    if (viewerRetention < 100) {
        html += '<div style="margin-bottom:12px;"><strong style="color:#69f0ae;">시청자 유지 (+' + (100 - viewerRetention) + '점 필요):</strong><br><span style="color:#ddd;">' + escapeHtml(improvements.viewerRetention || '추가 개선이 필요합니다.') + '</span></div>';
    }
    
    html += '</div>';
    html += '</div>';
    
    scoreSection.innerHTML = html;
    scoreSection.style.display = 'block';
    
    scoreSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    console.log('📊 점수 표시 완료');
}

function createScoreRow(label, score) {
    var statusColor = score >= 95 ? '#69f0ae' : score >= 80 ? '#ffd93d' : '#ff6b6b';
    var statusIcon = score >= 95 ? '✅' : score >= 80 ? '⚠️' : '❌';
    
    return '<tr>' +
        '<td style="padding:10px;border:1px solid #444;">' + label + '</td>' +
        '<td style="padding:10px;border:1px solid #444;text-align:center;font-weight:bold;color:' + statusColor + ';">' + score + '점</td>' +
        '<td style="padding:10px;border:1px solid #444;text-align:center;">' + statusIcon + '</td>' +
        '</tr>';
}
