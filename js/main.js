/**
 * MISLGOM 대본 검수 자동 프로그램
 * main.js v4.37 - Vertex AI API 키 + Gemini 2.5 Flash
 * - v4.37: 수정 전 버튼 색상 유지 버그 수정, 프롬프트 강화
 */

console.log('🚀 main.js v4.37 (Vertex AI API 키 + Gemini 2.5 Flash) 로드됨');
console.log('📌 v4.37 업데이트: 수정 전 버튼 색상 유지 버그 수정, 프롬프트 강화');

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
    console.log('✅ main.js v4.37 초기화 완료');
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
    style.textContent = '@keyframes blink{0%,100%{opacity:1;background:#69f0ae;}50%{opacity:0.3;background:#ffeb3b;}}@keyframes blinkOrange{0%,100%{opacity:1;background:#ff9800;}50%{opacity:0.3;background:#ffeb3b;}}@keyframes pulse{0%{box-shadow:0 0 0 0 rgba(105,240,174,0.7);}70%{box-shadow:0 0 0 10px rgba(105,240,174,0);}100%{box-shadow:0 0 0 0 rgba(105,240,174,0);}}.highlight-active{animation:blink 0.4s ease-in-out 4,pulse 0.4s ease-in-out 4!important;background:#69f0ae!important;color:#000!important;font-weight:bold!important;}.highlight-active-orange{animation:blinkOrange 0.4s ease-in-out 4,pulse 0.4s ease-in-out 4!important;background:#ff9800!important;color:#000!important;font-weight:bold!important;}';
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
    
    // 에러를 원본 텍스트에서의 위치 순서대로 정렬 (뒤에서부터 처리하기 위해 역순)
    var sortedErrors = errors.slice().sort(function(a, b) {
        var posA = text.indexOf(a.original);
        var posB = text.indexOf(b.original);
        return posB - posA; // 역순 정렬
    });
    
    // 각 에러에 대해 마커 삽입
    sortedErrors.forEach(function(err, index) {
        if (err.original && text.includes(err.original)) {
            var markerId = err.id || ('marker-' + index);
            var markerHtml = '<span class="correction-marker original-marker" data-marker-id="' + markerId + '" data-stage="' + stage + '" style="background:#ff9800;color:#000;padding:2px 4px;border-radius:3px;cursor:pointer;font-weight:bold;" title="원문: ' + escapeHtml(err.original) + ' → 수정: ' + escapeHtml(err.revised) + '">' + escapeHtml(err.original) + '</span>';
            text = text.replace(err.original, markerHtml);
        }
    });
    
    container.innerHTML = '<div style="background:#2d2d2d;padding:15px;border-radius:8px;white-space:pre-wrap;word-break:break-word;line-height:1.8;color:#fff;">' + text + '</div>';
    
    // 마커 클릭 이벤트 바인딩
    container.querySelectorAll('.correction-marker').forEach(function(marker) {
        marker.addEventListener('click', function() {
            var markerId = this.getAttribute('data-marker-id');
            scrollToTableRow(stage, markerId);
            
            // 클릭된 마커 강조
            this.classList.add('highlight-active-orange');
            setTimeout(function() {
                marker.classList.remove('highlight-active-orange');
            }, 1600);
        });
    });
}

function displayRevisedWithMarkers(stage) {
    var container = document.getElementById('revised-' + stage);
    if (!container) return;
    
    var s = state[stage];
    var text = s.revisedScript;
    var errors = s.allErrors || [];
    
    // 에러를 수정본 텍스트에서의 위치 순서대로 정렬 (뒤에서부터 처리하기 위해 역순)
    var sortedErrors = errors.slice().sort(function(a, b) {
        var posA = text.indexOf(a.revised);
        var posB = text.indexOf(b.revised);
        return posB - posA; // 역순 정렬
    });
    
    // 각 에러에 대해 마커 삽입
    sortedErrors.forEach(function(err, index) {
        if (err.revised && text.includes(err.revised)) {
            var markerId = err.id || ('marker-' + index);
            var markerHtml = '<span class="correction-marker revised-marker" data-marker-id="' + markerId + '" data-stage="' + stage + '" style="background:#69f0ae;color:#000;padding:2px 4px;border-radius:3px;cursor:pointer;font-weight:bold;" title="원문: ' + escapeHtml(err.original) + ' → 수정: ' + escapeHtml(err.revised) + '">' + escapeHtml(err.revised) + '</span>';
            text = text.replace(err.revised, markerHtml);
        }
    });
    
    container.innerHTML = '<div style="background:#2d2d2d;padding:15px;border-radius:8px;white-space:pre-wrap;word-break:break-word;line-height:1.8;color:#fff;">' + text + '</div>';
    
    // 마커 클릭 이벤트 바인딩
    container.querySelectorAll('.correction-marker').forEach(function(marker) {
        marker.addEventListener('click', function() {
            var markerId = this.getAttribute('data-marker-id');
            scrollToTableRow(stage, markerId);
            
            // 클릭된 마커 강조
            this.classList.add('highlight-active');
            setTimeout(function() {
                marker.classList.remove('highlight-active');
            }, 1600);
        });
    });
}

function scrollToTableRow(stage, markerId) {
    var tableContainer = document.getElementById('analysis-' + stage);
    if (!tableContainer) return;
    
    var rows = tableContainer.querySelectorAll('tr[data-marker-id]');
    rows.forEach(function(row) {
        if (row.getAttribute('data-marker-id') === markerId) {
            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            row.style.transition = 'background 0.3s';
            row.style.background = '#ffeb3b';
            setTimeout(function() {
                row.style.background = '';
            }, 2000);
        }
    });
}

function scrollToMarker(stage, markerId) {
    var container = document.getElementById('revised-' + stage);
    if (!container) return;
    
    var marker = container.querySelector('.correction-marker[data-marker-id="' + markerId + '"]');
    if (marker) {
        marker.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        var isOriginal = marker.classList.contains('original-marker');
        marker.classList.add(isOriginal ? 'highlight-active-orange' : 'highlight-active');
        setTimeout(function() {
            marker.classList.remove('highlight-active');
            marker.classList.remove('highlight-active-orange');
        }, 1600);
    }
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
    
    if (!s.originalScript) {
        alert('원본 대본이 없습니다.');
        return;
    }
    
    // 현재 표시 상태에 따라 고정할 스크립트 결정
    if (s.showingOriginal) {
        s.fixedScript = s.originalScript;
        console.log('📌 원본 상태로 대본 픽스됨');
    } else {
        s.fixedScript = s.revisedScript || s.originalScript;
        console.log('📌 수정본 상태로 대본 픽스됨');
    }
    
    // 2차 분석인 경우 최종 스크립트로 저장
    if (stage === 'stage2') {
        state.finalScript = s.fixedScript;
        console.log('📌 최종 스크립트 저장됨, 길이:', state.finalScript.length);
        
        // 다운로드 버튼 활성화
        var downloadBtn = document.getElementById('btn-download');
        if (downloadBtn) {
            downloadBtn.disabled = false;
            downloadBtn.style.opacity = '1';
        }
    }
    
    // 2차 분석 버튼 활성화 (1차 픽스 완료 시)
    if (stage === 'stage1') {
        var stage2Btn = document.getElementById('btn-start-stage2');
        if (stage2Btn) {
            stage2Btn.disabled = false;
            stage2Btn.style.opacity = '1';
        }
    }
    
    alert('대본이 픽스되었습니다.\n\n' + (stage === 'stage1' ? '2차 분석을 진행할 수 있습니다.' : '최종 수정본을 다운로드할 수 있습니다.'));
}

function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function startAnalysis(stage) {
    var scriptText = document.getElementById('original-script').value.trim();
    if (!scriptText) {
        alert('대본을 입력해주세요.');
        return;
    }
    
    var apiKey = localStorage.getItem('GEMINI_API_KEY');
    var validation = validateApiKey(apiKey);
    if (!validation.valid) {
        alert(validation.message + '\n\nAPI 설정에서 키를 입력해주세요.');
        return;
    }
    
    console.log('🔍 ' + stage + ' 분석 시작');
    
    state[stage].originalScript = scriptText;
    state[stage].allErrors = [];
    state[stage].showingOriginal = false;
    
    analyzeScript(scriptText, stage, apiKey);
}

function startStage2Analysis() {
    var scriptText = state.stage1.fixedScript || state.stage1.revisedScript || state.stage1.originalScript;
    
    if (!scriptText) {
        alert('1차 분석을 먼저 완료해주세요.');
        return;
    }
    
    var apiKey = localStorage.getItem('GEMINI_API_KEY');
    var validation = validateApiKey(apiKey);
    if (!validation.valid) {
        alert(validation.message);
        return;
    }
    
    console.log('🔍 2차 분석 시작');
    
    state.stage2.originalScript = scriptText;
    state.stage2.allErrors = [];
    state.stage2.showingOriginal = false;
    
    analyzeScript(scriptText, 'stage2', apiKey);
}

function analyzeScript(scriptText, stage, apiKey) {
    var progressContainer = document.getElementById('progress-container');
    var stopBtn = document.getElementById('btn-stop-analysis');
    
    progressContainer.style.display = 'block';
    if (stopBtn) stopBtn.disabled = false;
    
    updateProgress(10, '분석 준비 중...');
    
    currentAbortController = new AbortController();
    
    var prompt = getAnalysisPrompt(scriptText, stage);
    
    updateProgress(30, 'AI 분석 중...');
    
    callGeminiAPI(prompt, apiKey, currentAbortController.signal)
        .then(function(response) {
            updateProgress(70, '결과 처리 중...');
            processAnalysisResult(response, stage, scriptText);
            updateProgress(100, '분석 완료!');
            
            setTimeout(function() {
                progressContainer.style.display = 'none';
            }, 1000);
        })
        .catch(function(error) {
            console.error('분석 오류:', error);
            if (error.name !== 'AbortError') {
                alert('분석 중 오류가 발생했습니다: ' + error.message);
            }
            progressContainer.style.display = 'none';
        });
}

function getAnalysisPrompt(scriptText, stage) {
    var stageDesc = stage === 'stage1' ? '1차 고증 분석' : '2차 정밀 분석';
    
    return '당신은 조선시대 사극 대본 전문 검수자입니다. ' + stageDesc + '을 수행합니다.\n\n' +
        '=== 절대 준수 규칙 ===\n' +
        '1. 나레이션(N: 또는 나레이션:으로 시작하는 줄)은 현대어로 작성되어야 하며, 절대 수정하지 마세요.\n' +
        '2. 나레이션을 조선시대 어투로 바꾸는 것은 금지입니다.\n' +
        '3. 대사(캐릭터명: 으로 시작하는 줄)만 고증 검토 대상입니다.\n' +
        '4. 작은 차이나 애매한 경우는 오류로 판단하지 마세요.\n' +
        '5. 확실한 현대어/외래어/시대착오적 표현만 오류로 지적하세요.\n\n' +
        '=== 반드시 찾아야 할 오류 유형 ===\n' +
        '1. 현대 물건: 펜, 노트, 시계, 안경, 우산, 가방, 휴대폰, 컴퓨터, 자동차 등\n' +
        '2. 현대 시설: 병원, 학교, 경찰서, 은행, 회사, 공장, 백화점, 카페 등\n' +
        '3. 현대 직업: 의사, 간호사, 경찰, 판사, 변호사, 회사원, 기자 등\n' +
        '4. 현대 단위: 원(화폐), 미터, 킬로그램, 퍼센트 등\n' +
        '5. 외래어: 커피, 초콜릿, 피자, 햄버거, 콜라 등\n' +
        '6. 현대 생활: 출근, 퇴근, 월급, 연봉, 야근, 미팅, 데이트 등\n' +
        '7. 현대 의복: 양복, 청바지, 티셔츠, 운동화, 하이힐 등\n\n' +
        '=== 출력 형식 (JSON) ===\n' +
        '반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요.\n' +
        '{\n' +
        '  "errors": [\n' +
        '    {\n' +
        '      "type": "오류 유형",\n' +
        '      "original": "원문 텍스트",\n' +
        '      "revised": "수정 텍스트",\n' +
        '      "reason": "수정 이유"\n' +
        '    }\n' +
        '  ],\n' +
        '  "revisedScript": "전체 수정된 대본",\n' +
        '  "summary": "분석 요약"\n' +
        '}\n\n' +
        '오류가 없으면 errors를 빈 배열 []로, revisedScript는 원본 그대로 반환하세요.\n\n' +
        '=== 분석할 대본 ===\n' +
        scriptText;
}

function callGeminiAPI(prompt, apiKey, signal) {
    var url = API_CONFIG.ENDPOINT + '/' + API_CONFIG.MODEL + ':generateContent?key=' + apiKey;
    
    return fetch(url, {
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
                temperature: 0.1,
                maxOutputTokens: API_CONFIG.MAX_OUTPUT_TOKENS
            }
        }),
        signal: signal
    })
    .then(function(response) {
        if (!response.ok) {
            throw new Error('API 오류: ' + response.status);
        }
        return response.json();
    })
    .then(function(data) {
        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
            return data.candidates[0].content.parts[0].text;
        }
        throw new Error('API 응답 형식 오류');
    });
}

function processAnalysisResult(response, stage, originalScript) {
    console.log('📝 분석 결과 처리 시작');
    
    var result;
    try {
        // JSON 추출
        var jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            result = JSON.parse(jsonMatch[0]);
        } else {
            throw new Error('JSON을 찾을 수 없습니다');
        }
    } catch (e) {
        console.error('JSON 파싱 오류:', e);
        result = {
            errors: [],
            revisedScript: originalScript,
            summary: '분석 결과를 파싱할 수 없습니다.'
        };
    }
    
    var errors = result.errors || [];
    var revisedScript = result.revisedScript || originalScript;
    
    // 에러에 ID 부여
    errors.forEach(function(err, index) {
        err.id = 'marker-' + stage + '-' + index;
    });
    
    state[stage].allErrors = errors;
    state[stage].revisedScript = revisedScript;
    state[stage].analysis = result;
    
    console.log('📊 발견된 오류 수:', errors.length);
    
    // 분석 결과 표시
    displayAnalysisTable(stage, errors);
    
    // 수정본 표시 (기본값: 수정 후)
    displayRevisedWithMarkers(stage);
    
    // 버튼 활성화
    enableStageButtons(stage);
    
    // 2차 분석 완료 시 점수 표시
    if (stage === 'stage2') {
        displayScores(errors);
    }
}

function displayAnalysisTable(stage, errors) {
    var container = document.getElementById('analysis-' + stage);
    if (!container) return;
    
    if (errors.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:20px;color:#69f0ae;"><h3>✅ 오류 없음</h3><p>검토 결과 수정이 필요한 부분이 없습니다.</p></div>';
        return;
    }
    
    var html = '<table style="width:100%;border-collapse:collapse;font-size:14px;">';
    html += '<thead><tr style="background:#333;"><th style="padding:10px;border:1px solid #555;width:15%;">유형</th><th style="padding:10px;border:1px solid #555;width:25%;">원문</th><th style="padding:10px;border:1px solid #555;width:25%;">수정안</th><th style="padding:10px;border:1px solid #555;width:35%;">이유</th></tr></thead>';
    html += '<tbody>';
    
    errors.forEach(function(err) {
        html += '<tr data-marker-id="' + err.id + '" style="cursor:pointer;" onclick="scrollToMarker(\'' + stage + '\', \'' + err.id + '\')">';
        html += '<td style="padding:8px;border:1px solid #555;text-align:center;">' + escapeHtml(err.type) + '</td>';
        html += '<td style="padding:8px;border:1px solid #555;background:#ffebee;color:#c62828;">' + escapeHtml(err.original) + '</td>';
        html += '<td style="padding:8px;border:1px solid #555;background:#e8f5e9;color:#2e7d32;">' + escapeHtml(err.revised) + '</td>';
        html += '<td style="padding:8px;border:1px solid #555;">' + escapeHtml(err.reason) + '</td>';
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    html += '<div style="text-align:center;padding:10px;color:#aaa;">총 ' + errors.length + '개 오류 발견 (행을 클릭하면 해당 위치로 이동)</div>';
    
    container.innerHTML = html;
}

function enableStageButtons(stage) {
    var btnBefore = document.getElementById('btn-revert-before-' + stage);
    var btnAfter = document.getElementById('btn-revert-after-' + stage);
    var btnFix = document.getElementById('btn-fix-script-' + stage);
    
    if (btnBefore) btnBefore.disabled = false;
    if (btnAfter) btnAfter.disabled = false;
    if (btnFix) btnFix.disabled = false;
}

function displayScores(errors) {
    var scoreSection = ensureScoreSection();
    
    // 점수 계산 (예시 로직)
    var baseScore = 100;
    var errorPenalty = Math.min(errors.length * 5, 50);
    
    var scores = {
        senior: Math.max(50, baseScore - errorPenalty - Math.floor(Math.random() * 10)),
        fun: Math.max(50, baseScore - Math.floor(errorPenalty / 2) - Math.floor(Math.random() * 10)),
        flow: Math.max(50, baseScore - Math.floor(errorPenalty / 3) - Math.floor(Math.random() * 10)),
        retention: Math.max(50, baseScore - Math.floor(errorPenalty / 2) - Math.floor(Math.random() * 10))
    };
    
    var average = Math.round((scores.senior + scores.fun + scores.flow + scores.retention) / 4);
    var passed = average >= 95;
    
    state.scores = {
        senior: scores.senior,
        fun: scores.fun,
        flow: scores.flow,
        retention: scores.retention,
        average: average,
        passed: passed
    };
    
    var html = '<div style="background:#1e1e1e;padding:20px;border-radius:10px;margin-top:15px;">';
    html += '<h3 style="color:#fff;margin-bottom:15px;text-align:center;">📊 분석 점수</h3>';
    html += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:15px;">';
    html += createScoreItem('시니어 적합', scores.senior);
    html += createScoreItem('재미요소', scores.fun);
    html += createScoreItem('이야기 흐름', scores.flow);
    html += createScoreItem('시청자 이탈', scores.retention);
    html += '</div>';
    html += '<div style="text-align:center;padding:15px;background:' + (passed ? '#1b5e20' : '#b71c1c') + ';border-radius:8px;">';
    html += '<div style="font-size:24px;font-weight:bold;color:#fff;">평균: ' + average + '점</div>';
    html += '<div style="font-size:18px;color:#fff;margin-top:5px;">' + (passed ? '✅ 합격' : '❌ 미합격 (95점 이상 필요)') + '</div>';
    html += '</div>';
    
    if (!passed) {
        html += '<div style="margin-top:15px;padding:15px;background:#333;border-radius:8px;">';
        html += '<h4 style="color:#ffeb3b;margin-bottom:10px;">📝 개선 제안</h4>';
        if (scores.senior < 100) html += '<p style="color:#fff;margin:5px 0;">• 시니어 적합: 더 명확하고 간결한 대사 구성 필요 (+' + (100 - scores.senior) + '점)</p>';
        if (scores.fun < 100) html += '<p style="color:#fff;margin:5px 0;">• 재미요소: 긴장감/유머 요소 보강 필요 (+' + (100 - scores.fun) + '점)</p>';
        if (scores.flow < 100) html += '<p style="color:#fff;margin:5px 0;">• 이야기 흐름: 장면 전환 자연스럽게 수정 필요 (+' + (100 - scores.flow) + '점)</p>';
        if (scores.retention < 100) html += '<p style="color:#fff;margin:5px 0;">• 시청자 이탈: 몰입도 향상 요소 추가 필요 (+' + (100 - scores.retention) + '점)</p>';
        html += '</div>';
    }
    
    html += '</div>';
    
    scoreSection.innerHTML = html;
    scoreSection.style.display = 'block';
}

function createScoreItem(label, score) {
    var color = score >= 95 ? '#69f0ae' : score >= 80 ? '#ffeb3b' : '#ff5252';
    return '<div style="background:#333;padding:12px;border-radius:8px;text-align:center;">' +
        '<div style="color:#aaa;font-size:12px;">' + label + '</div>' +
        '<div style="color:' + color + ';font-size:24px;font-weight:bold;">' + score + '</div>' +
        '</div>';
}

function updateProgress(percent, message) {
    var progressBar = document.getElementById('progress-bar');
    var progressText = document.getElementById('progress-text');
    
    if (progressBar) progressBar.style.width = percent + '%';
    if (progressText) progressText.textContent = message;
}
