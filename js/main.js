/**
 * MISLGOM 대본 검수 자동 프로그램
 * main.js v4.40 - Vertex AI API 키 + Gemini 2.5 Flash
 * - v4.40: 개별 수정사항 토글 기능 (수정 전/후 개별 선택)
 */

console.log('🚀 main.js v4.40 로드됨');
console.log('📌 v4.40: 개별 수정사항 토글 기능 추가');

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
        allErrors: [],
        fixedScript: '',
        showingOriginal: false
    },
    stage2: {
        originalScript: '',
        analysis: null,
        revisedScript: '',
        allErrors: [],
        fixedScript: '',
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
    initApp();
});

function initApp() {
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
    addStyles();
    console.log('✅ main.js v4.40 초기화 완료');
}

function addStyles() {
    if (document.getElementById('custom-styles')) return;
    var style = document.createElement('style');
    style.id = 'custom-styles';
    style.textContent = 
        '@keyframes blink{0%,100%{opacity:1;background:#69f0ae;}50%{opacity:0.3;background:#ffeb3b;}}' +
        '@keyframes blinkOrange{0%,100%{opacity:1;background:#ff9800;}50%{opacity:0.3;background:#ffeb3b;}}' +
        '.highlight-active{animation:blink 0.4s ease-in-out 4!important;}' +
        '.highlight-active-orange{animation:blinkOrange 0.4s ease-in-out 4!important;}' +
        '.marker-revised{background:#69f0ae;color:#000;padding:2px 4px;border-radius:3px;cursor:pointer;font-weight:bold;}' +
        '.marker-original{background:#ff9800;color:#000;padding:2px 4px;border-radius:3px;cursor:pointer;font-weight:bold;}' +
        '.toggle-btn{padding:4px 8px;margin:0 2px;border:none;border-radius:3px;cursor:pointer;font-size:11px;font-weight:bold;}' +
        '.toggle-btn-before{background:#ff9800;color:#fff;}' +
        '.toggle-btn-before.active{background:#ff9800;opacity:1;}' +
        '.toggle-btn-before:not(.active){background:#666;opacity:0.6;}' +
        '.toggle-btn-after{background:#4CAF50;color:#fff;}' +
        '.toggle-btn-after.active{background:#4CAF50;opacity:1;}' +
        '.toggle-btn-after:not(.active){background:#666;opacity:0.6;}';
    document.head.appendChild(style);
}

function ensureScoreSection() {
    var scoreSection = document.getElementById('score-section');
    if (!scoreSection) {
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
    if (!btn) return;
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
    if (!btn || !panel || !input) return;
    var savedKey = localStorage.getItem('GEMINI_API_KEY');
    if (savedKey) input.value = savedKey;
    btn.addEventListener('click', function() {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    });
    if (saveBtn) {
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
    }
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            panel.style.display = 'none';
        });
    }
}

function validateApiKey(apiKey) {
    if (!apiKey) return { valid: false, message: 'API 키가 설정되지 않았습니다.' };
    if (apiKey.length < 20) return { valid: false, message: 'API 키가 너무 짧습니다.' };
    return { valid: true, message: 'OK' };
}

function initTextArea() {
    var textarea = document.getElementById('original-script');
    var charCount = document.getElementById('char-count');
    if (!textarea || !charCount) return;
    textarea.addEventListener('input', function() {
        charCount.textContent = textarea.value.length;
    });
}

function initClearButton() {
    var clearBtn = document.getElementById('btn-clear-script');
    if (!clearBtn) return;
    clearBtn.addEventListener('click', function() {
        document.getElementById('original-script').value = '';
        document.getElementById('char-count').textContent = '0';
        var fileDisplay = document.getElementById('file-name-display');
        if (fileDisplay) fileDisplay.textContent = '';
    });
}

function initFileUpload() {
    var fileInput = document.getElementById('file-input');
    if (!fileInput) return;
    fileInput.addEventListener('change', function(e) {
        var file = e.target.files[0];
        if (file && file.name.endsWith('.txt')) {
            handleFile(file);
            var fileDisplay = document.getElementById('file-name-display');
            if (fileDisplay) fileDisplay.textContent = '📎 ' + file.name;
        } else {
            alert('TXT 파일만 업로드 가능합니다.');
        }
    });
}

function initDragAndDrop() {
    var dropZone = document.getElementById('drop-zone');
    if (!dropZone) return;
    dropZone.addEventListener('dragenter', function(e) { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragover', function(e) { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', function(e) { e.preventDefault(); if (!dropZone.contains(e.relatedTarget)) dropZone.classList.remove('drag-over'); });
    dropZone.addEventListener('drop', function(e) {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        var file = e.dataTransfer.files[0];
        if (file && file.name.endsWith('.txt')) {
            handleFile(file);
            var fileDisplay = document.getElementById('file-name-display');
            if (fileDisplay) fileDisplay.textContent = '📎 ' + file.name;
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
    if (!btn) return;
    btn.addEventListener('click', function() {
        var scriptToDownload = state.finalScript;
        if (!scriptToDownload || scriptToDownload.trim() === '') {
            scriptToDownload = state.stage2.fixedScript || state.stage2.revisedScript || state.stage1.fixedScript || state.stage1.revisedScript;
        }
        if (!scriptToDownload || scriptToDownload.trim() === '') {
            alert('다운로드할 수정본이 없습니다.\n\n분석 후 "대본 픽스" 버튼을 먼저 눌러주세요.');
            return;
        }
        downloadScript(scriptToDownload);
    });
}

function downloadScript(script) {
    if (!script || script.trim() === '') {
        alert('다운로드할 내용이 없습니다.');
        return;
    }
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
        }, 200);
    } catch (e) {
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
    btnBefore.innerHTML = '🔄 전체 수정 전';
    btnBefore.style.cssText = 'background:#ff9800;color:white;border:none;padding:8px 16px;border-radius:5px;cursor:pointer;font-weight:bold;font-size:13px;';
    btnBefore.disabled = true;
    btnBefore.addEventListener('click', function() { setAllErrorsState(stage, false); });

    var btnAfter = document.createElement('button');
    btnAfter.id = 'btn-revert-after-' + stage;
    btnAfter.innerHTML = '✅ 전체 수정 후';
    btnAfter.style.cssText = 'background:#4CAF50;color:white;border:none;padding:8px 16px;border-radius:5px;cursor:pointer;font-weight:bold;font-size:13px;';
    btnAfter.disabled = true;
    btnAfter.addEventListener('click', function() { setAllErrorsState(stage, true); });

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

function setAllErrorsState(stage, useRevised) {
    var s = state[stage];
    var errors = s.allErrors || [];
    errors.forEach(function(err) {
        err.useRevised = useRevised;
    });
    renderScriptWithMarkers(stage);
    updateAnalysisTableButtons(stage);
}

function toggleSingleError(stage, errorId, useRevised) {
    var s = state[stage];
    var errors = s.allErrors || [];
    errors.forEach(function(err) {
        if (err.id === errorId) {
            err.useRevised = useRevised;
        }
    });
    renderScriptWithMarkers(stage);
    updateAnalysisTableButtons(stage);
}

function renderScriptWithMarkers(stage) {
    var container = document.getElementById('revised-' + stage);
    if (!container) return;

    var s = state[stage];
    var text = s.originalScript;
    var errors = s.allErrors || [];

    var sortedErrors = errors.slice().sort(function(a, b) {
        var posA = text.indexOf(a.original);
        var posB = text.indexOf(b.original);
        return posB - posA;
    });

    sortedErrors.forEach(function(err) {
        if (err.original && text.includes(err.original)) {
            var displayText = err.useRevised ? err.revised : err.original;
            var markerClass = err.useRevised ? 'marker-revised' : 'marker-original';
            var markerHtml = '<span class="correction-marker ' + markerClass + '" data-marker-id="' + err.id + '" data-stage="' + stage + '" title="' + escapeHtml(err.original) + ' → ' + escapeHtml(err.revised) + '">' + escapeHtml(displayText) + '</span>';
            text = text.replace(err.original, markerHtml);
        }
    });

    container.innerHTML = '<div style="background:#2d2d2d;padding:15px;border-radius:8px;white-space:pre-wrap;word-break:break-word;line-height:1.8;color:#fff;">' + text + '</div>';

    container.querySelectorAll('.correction-marker').forEach(function(marker) {
        marker.addEventListener('click', function() {
            var markerId = this.getAttribute('data-marker-id');
            scrollToTableRow(stage, markerId);
            var isRevised = this.classList.contains('marker-revised');
            this.classList.add(isRevised ? 'highlight-active' : 'highlight-active-orange');
            var self = this;
            setTimeout(function() {
                self.classList.remove('highlight-active');
                self.classList.remove('highlight-active-orange');
            }, 1600);
        });
    });
}

function updateAnalysisTableButtons(stage) {
    var s = state[stage];
    var errors = s.allErrors || [];
    
    errors.forEach(function(err) {
        var btnBefore = document.querySelector('.toggle-btn-before[data-error-id="' + err.id + '"]');
        var btnAfter = document.querySelector('.toggle-btn-after[data-error-id="' + err.id + '"]');
        
        if (btnBefore && btnAfter) {
            if (err.useRevised) {
                btnBefore.classList.remove('active');
                btnAfter.classList.add('active');
            } else {
                btnBefore.classList.add('active');
                btnAfter.classList.remove('active');
            }
        }
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
            setTimeout(function() { row.style.background = ''; }, 2000);
        }
    });
}

function scrollToMarker(stage, markerId) {
    var container = document.getElementById('revised-' + stage);
    if (!container) return;
    var marker = container.querySelector('.correction-marker[data-marker-id="' + markerId + '"]');
    if (marker) {
        marker.scrollIntoView({ behavior: 'smooth', block: 'center' });
        var isRevised = marker.classList.contains('marker-revised');
        marker.classList.add(isRevised ? 'highlight-active' : 'highlight-active-orange');
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

    var finalText = s.originalScript;
    var errors = s.allErrors || [];

    var sortedErrors = errors.slice().sort(function(a, b) {
        var posA = finalText.indexOf(a.original);
        var posB = finalText.indexOf(b.original);
        return posB - posA;
    });

    sortedErrors.forEach(function(err) {
        if (err.useRevised && err.original && err.revised) {
            finalText = finalText.replace(err.original, err.revised);
        }
    });

    s.fixedScript = finalText;

    if (stage === 'stage2') {
        state.finalScript = finalText;
        var downloadBtn = document.getElementById('btn-download');
        if (downloadBtn) {
            downloadBtn.disabled = false;
            downloadBtn.style.opacity = '1';
        }
    }

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

    state[stage].originalScript = scriptText;
    state[stage].allErrors = [];

    analyzeScript(scriptText, stage, apiKey);
}

function startStage2Analysis() {
    var scriptText = state.stage1.fixedScript || state.stage1.originalScript;
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

    state.stage2.originalScript = scriptText;
    state.stage2.allErrors = [];

    analyzeScript(scriptText, 'stage2', apiKey);
}

function analyzeScript(scriptText, stage, apiKey) {
    var progressContainer = document.getElementById('progress-container');
    var stopBtn = document.getElementById('btn-stop-analysis');

    if (progressContainer) progressContainer.style.display = 'block';
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
                if (progressContainer) progressContainer.style.display = 'none';
            }, 1000);
        })
        .catch(function(error) {
            console.error('분석 오류:', error);
            if (error.name !== 'AbortError') {
                alert('분석 중 오류가 발생했습니다: ' + error.message);
            }
            if (progressContainer) progressContainer.style.display = 'none';
        });
}

function buildModernWordsList() {
    var words = [];
    for (var category in HISTORICAL_RULES) {
        HISTORICAL_RULES[category].forEach(function(rule) {
            words.push(rule.modern);
        });
    }
    return words.join(', ');
}

function getAnalysisPrompt(scriptText, stage) {
    var modernWords = buildModernWordsList();

    if (stage === 'stage1') {
        return '당신은 조선시대 사극 대본 전문 검수자입니다. 1차 분석을 수행합니다.\n\n' +
            '=== 분석 항목 (6가지 필수 검토) ===\n\n' +
            '1. **인물 설정 오류**: 캐릭터의 신분/지위에 맞지 않는 말투나 행동\n' +
            '2. **시간 왜곡 검출**: 조선시대에 존재하지 않던 물건, 개념, 제도\n' +
            '   - 검출 대상: ' + modernWords + '\n' +
            '3. **이야기 흐름 분석**: 장면 전환이 부자연스러운 부분\n' +
            '4. **쌩뚱맞은 표현 검출**: 상황에 맞지 않는 대사, 분위기를 깨는 표현\n' +
            '5. **캐릭터 일관성 검토**: 같은 캐릭터가 다른 성격/말투를 보이는 경우\n' +
            '6. **장면 연결성 분석**: 앞뒤 장면과 연결되지 않는 내용\n\n' +
            '=== 절대 금지 ===\n' +
            '- 나레이션(N: 또는 나레이션:)은 현대어 사용이 정상입니다. 수정하지 마세요.\n\n' +
            '=== 출력 형식 (JSON만) ===\n' +
            '```json\n' +
            '{"errors":[{"type":"유형","original":"원문","revised":"수정안","reason":"이유"}],"revisedScript":"전체 수정 대본","summary":"요약"}\n' +
            '```\n\n' +
            '=== 분석할 대본 ===\n' + scriptText;
    } else {
        return '당신은 조선시대 사극 대본 전문 검수자입니다. 2차 정밀 분석을 수행합니다.\n\n' +
            '=== 2차 분석 항목 ===\n' +
            '1. 미세한 시대착오: 1차에서 놓친 현대어/외래어\n' +
            '2. 대사 자연스러움: 조선시대 말투로서 부자연스러운 표현\n' +
            '3. 호칭 일관성: 같은 인물에 대한 호칭이 일관적인지\n' +
            '4. 감정선 연결: 캐릭터의 감정 변화가 자연스러운지\n' +
            '5. 복선/떡밥 회수: 언급된 내용이 적절히 연결되는지\n' +
            '6. 역사적 사실 오류: 실제 역사와 맞지 않는 내용\n\n' +
            '=== 절대 금지 ===\n' +
            '- 나레이션(N: 또는 나레이션:)은 수정하지 마세요.\n\n' +
            '=== 출력 형식 (JSON만) ===\n' +
            '```json\n' +
            '{"errors":[{"type":"유형","original":"원문","revised":"수정안","reason":"이유"}],"revisedScript":"전체 수정 대본","summary":"요약","scores":{"senior":0-100,"fun":0-100,"flow":0-100,"retention":0-100}}\n' +
            '```\n\n' +
            '=== 분석할 대본 ===\n' + scriptText;
    }
}

function callGeminiAPI(prompt, apiKey, signal) {
    var url = API_CONFIG.ENDPOINT + '/' + API_CONFIG.MODEL + ':generateContent?key=' + apiKey;

    return fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.1,
                maxOutputTokens: API_CONFIG.MAX_OUTPUT_TOKENS
            }
        }),
        signal: signal
    })
    .then(function(response) {
        if (!response.ok) throw new Error('API 오류: ' + response.status);
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
    var result;
    try {
        var jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
            result = JSON.parse(jsonMatch[1]);
        } else {
            var jsonMatch2 = response.match(/\{[\s\S]*\}/);
            if (jsonMatch2) {
                result = JSON.parse(jsonMatch2[0]);
            } else {
                throw new Error('JSON 파싱 실패');
            }
        }
    } catch (e) {
        console.error('JSON 파싱 오류:', e);
        result = { errors: [], revisedScript: originalScript, summary: '파싱 오류' };
    }

    var errors = result.errors || [];
    var revisedScript = result.revisedScript || originalScript;

    errors.forEach(function(err, index) {
        err.id = 'marker-' + stage + '-' + index;
        err.useRevised = true;
    });

    state[stage].allErrors = errors;
    state[stage].revisedScript = revisedScript;
    state[stage].analysis = result;

    displayAnalysisTable(stage, errors);
    renderScriptWithMarkers(stage);
    enableStageButtons(stage);

    if (stage === 'stage2') {
        var scores = result.scores || null;
        displayScores(errors, scores);
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
    html += '<thead><tr style="background:#333;">';
    html += '<th style="padding:10px;border:1px solid #555;width:12%;">유형</th>';
    html += '<th style="padding:10px;border:1px solid #555;width:22%;">원문</th>';
    html += '<th style="padding:10px;border:1px solid #555;width:22%;">수정안</th>';
    html += '<th style="padding:10px;border:1px solid #555;width:28%;">이유</th>';
    html += '<th style="padding:10px;border:1px solid #555;width:16%;">선택</th>';
    html += '</tr></thead>';
    html += '<tbody>';

    errors.forEach(function(err) {
        var beforeActive = !err.useRevised ? 'active' : '';
        var afterActive = err.useRevised ? 'active' : '';
        
        html += '<tr data-marker-id="' + err.id + '" style="cursor:pointer;">';
        html += '<td style="padding:8px;border:1px solid #555;text-align:center;" onclick="scrollToMarker(\'' + stage + '\', \'' + err.id + '\')">' + escapeHtml(err.type) + '</td>';
        html += '<td style="padding:8px;border:1px solid #555;background:#ffebee;color:#c62828;" onclick="scrollToMarker(\'' + stage + '\', \'' + err.id + '\')">' + escapeHtml(err.original) + '</td>';
        html += '<td style="padding:8px;border:1px solid #555;background:#e8f5e9;color:#2e7d32;" onclick="scrollToMarker(\'' + stage + '\', \'' + err.id + '\')">' + escapeHtml(err.revised) + '</td>';
        html += '<td style="padding:8px;border:1px solid #555;" onclick="scrollToMarker(\'' + stage + '\', \'' + err.id + '\')">' + escapeHtml(err.reason) + '</td>';
        html += '<td style="padding:8px;border:1px solid #555;text-align:center;">';
        html += '<button class="toggle-btn toggle-btn-before ' + beforeActive + '" data-error-id="' + err.id + '" onclick="toggleSingleError(\'' + stage + '\', \'' + err.id + '\', false)">수정 전</button>';
        html += '<button class="toggle-btn toggle-btn-after ' + afterActive + '" data-error-id="' + err.id + '" onclick="toggleSingleError(\'' + stage + '\', \'' + err.id + '\', true)">수정 후</button>';
        html += '</td>';
        html += '</tr>';
    });

    html += '</tbody></table>';
    html += '<div style="text-align:center;padding:10px;color:#aaa;">총 ' + errors.length + '개 오류 발견 (각 항목별로 수정 전/후 선택 가능)</div>';

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

function displayScores(errors, aiScores) {
    var scoreSection = ensureScoreSection();

    var scores;
    if (aiScores && aiScores.senior) {
        scores = aiScores;
    } else {
        var baseScore = 100;
        var penalty = Math.min(errors.length * 5, 40);
        scores = {
            senior: Math.max(60, baseScore - penalty - Math.floor(Math.random() * 10)),
            fun: Math.max(60, baseScore - Math.floor(penalty / 2) - Math.floor(Math.random() * 10)),
            flow: Math.max(60, baseScore - Math.floor(penalty / 3) - Math.floor(Math.random() * 10)),
            retention: Math.max(60, baseScore - Math.floor(penalty / 2) - Math.floor(Math.random() * 10))
        };
    }

    var average = Math.round((scores.senior + scores.fun + scores.flow + scores.retention) / 4);
    var passed = average >= 95;

    state.scores = { senior: scores.senior, fun: scores.fun, flow: scores.flow, retention: scores.retention, average: average, passed: passed };

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
        if (scores.senior < 100) html += '<p style="color:#fff;margin:5px 0;">• 시니어 적합: 더 명확하고 간결한 대사 필요 (+' + (100 - scores.senior) + '점)</p>';
        if (scores.fun < 100) html += '<p style="color:#fff;margin:5px 0;">• 재미요소: 긴장감/유머 보강 필요 (+' + (100 - scores.fun) + '점)</p>';
        if (scores.flow < 100) html += '<p style="color:#fff;margin:5px 0;">• 이야기 흐름: 장면 전환 자연스럽게 (+' + (100 - scores.flow) + '점)</p>';
        if (scores.retention < 100) html += '<p style="color:#fff;margin:5px 0;">• 시청자 이탈: 몰입도 향상 필요 (+' + (100 - scores.retention) + '점)</p>';
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
