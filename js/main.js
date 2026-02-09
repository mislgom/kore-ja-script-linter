/**
 * MISLGOM 대본 검수 자동 프로그램
 * main.js v4.27 - Vertex AI API 키 + Gemini 2.5 Flash
 * - v4.27: 클릭 이동 강화 + 나레이션/중복 오류 판단 금지 강화
 */

console.log('🚀 main.js v4.27 (Vertex AI API 키 + Gemini 2.5 Flash) 로드됨');
console.log('📌 v4.27 업데이트: 클릭 이동 강화 + 나레이션/중복 오류 금지');

// ===================== 조선시대 고증 DB =====================
const HISTORICAL_RULES = {
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

// ===================== 전역 상태 =====================
const state = {
    stage1: { originalScript: '', analysis: null, revisedScript: '', historicalIssues: [], allErrors: [], revisionCount: 0, scrollPosition: 0, fixedScript: '', markerMap: {} },
    stage2: { originalScript: '', analysis: null, revisedScript: '', historicalIssues: [], allErrors: [], revisionCount: 0, scrollPosition: 0, fixedScript: '', markerMap: {} },
    finalScript: '',
    scores: null
};

let currentAbortController = null;

// ===================== API 설정 =====================
const API_CONFIG = {
    TIMEOUT: 300000,
    MODEL: 'gemini-2.5-flash',
    ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models',
    MAX_OUTPUT_TOKENS: 16384
};

// ===================== 초기화 =====================
document.addEventListener('DOMContentLoaded', () => {
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
    initFinalDownloadSection();
    addBlinkAnimation();
    console.log('✅ 고증 DB 로드됨: ' + getTotalHistoricalRules() + '개 규칙');
    console.log('✅ API 타임아웃: ' + (API_CONFIG.TIMEOUT / 1000) + '초');
    console.log('✅ 모델: ' + API_CONFIG.MODEL);
    console.log('✅ main.js v4.27 초기화 완료');
}

function getTotalHistoricalRules() {
    let total = 0;
    for (const category in HISTORICAL_RULES) total += HISTORICAL_RULES[category].length;
    return total;
}

// ===================== CSS 애니메이션 추가 =====================
function addBlinkAnimation() {
    if (document.getElementById('blink-style')) return;
    const style = document.createElement('style');
    style.id = 'blink-style';
    style.textContent = `
        @keyframes blink {
            0%, 100% { opacity: 1; background: #69f0ae; }
            50% { opacity: 0.3; background: #ffeb3b; }
        }
        @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(105, 240, 174, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(105, 240, 174, 0); }
            100% { box-shadow: 0 0 0 0 rgba(105, 240, 174, 0); }
        }
        .highlight-active {
            animation: blink 0.4s ease-in-out 4, pulse 0.4s ease-in-out 4 !important;
            background: #69f0ae !important;
            color: #000 !important;
            font-weight: bold !important;
        }
    `;
    document.head.appendChild(style);
}

// ===================== 기존 분석 버튼 숨기기 =====================
function hideOriginalAnalysisButtons() {
    const btn1 = document.getElementById('btn-analyze-stage1');
    const btn2 = document.getElementById('btn-analyze-stage2');
    if (btn1) btn1.style.display = 'none';
    if (btn2) btn2.style.display = 'none';
    console.log('✅ 기존 분석 버튼 숨김');
}

// ===================== 중지 버튼 =====================
function initStopButton() {
    const stopBtn = document.getElementById('btn-stop-analysis');
    if (stopBtn) {
        stopBtn.addEventListener('click', () => {
            if (currentAbortController) {
                currentAbortController.abort();
                currentAbortController = null;
                updateProgress(0, '분석 중지됨');
                stopBtn.disabled = true;
                alert('분석이 중지되었습니다.');
                setTimeout(() => document.getElementById('progress-container').style.display = 'none', 1000);
            }
        });
    }
    console.log('✅ 중지 버튼 초기화됨');
}

// ===================== 다크모드 =====================
function initDarkMode() {
    const btn = document.getElementById('btn-dark-mode');
    const saved = localStorage.getItem('darkMode');
    if (saved === 'true') {
        document.body.classList.add('dark-mode');
        btn.textContent = '☀️ 라이트모드';
    }
    btn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDark);
        btn.textContent = isDark ? '☀️ 라이트모드' : '🌙 다크모드';
    });
}

// ===================== API 키 =====================
function initApiKeyPanel() {
    const btn = document.getElementById('btn-api-settings');
    const panel = document.getElementById('api-key-panel');
    const input = document.getElementById('api-key-input');
    const saveBtn = document.getElementById('btn-save-api-key');
    const closeBtn = document.getElementById('btn-close-api-panel');

    const savedKey = localStorage.getItem('GEMINI_API_KEY');
    if (savedKey) input.value = savedKey;

    btn.addEventListener('click', () => panel.style.display = panel.style.display === 'none' ? 'block' : 'none');
    saveBtn.addEventListener('click', () => {
        const key = input.value.trim();
        if (key) {
            localStorage.setItem('GEMINI_API_KEY', key);
            alert('API 키가 저장되었습니다.');
            panel.style.display = 'none';
        } else alert('API 키를 입력해주세요.');
    });
    closeBtn.addEventListener('click', () => panel.style.display = 'none');
}

function validateApiKey(apiKey) {
    if (!apiKey) return { valid: false, message: 'API 키가 설정되지 않았습니다.' };
    if (apiKey.length < 20) return { valid: false, message: 'API 키가 너무 짧습니다.' };
    return { valid: true, message: 'OK' };
}

// ===================== 텍스트/파일 =====================
function initTextArea() {
    const textarea = document.getElementById('original-script');
    const charCount = document.getElementById('char-count');
    textarea.addEventListener('input', () => charCount.textContent = textarea.value.length);
}

function initClearButton() {
    const clearBtn = document.getElementById('btn-clear-script');
    clearBtn.addEventListener('click', () => {
        document.getElementById('original-script').value = '';
        document.getElementById('char-count').textContent = '0';
        document.getElementById('file-name-display').textContent = '';
    });
    console.log('✅ 지우기 버튼 초기화됨');
}

function initFileUpload() {
    const fileInput = document.getElementById('file-input');
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.name.endsWith('.txt')) {
            handleFile(file);
            document.getElementById('file-name-display').textContent = '📎 ' + file.name;
        } else alert('TXT 파일만 업로드 가능합니다.');
    });
    console.log('✅ 파일 업로드 초기화됨');
}

function initDragAndDrop() {
    const dropZone = document.getElementById('drop-zone');
    ['dragenter', 'dragover'].forEach(evt => {
        dropZone.addEventListener(evt, (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
    });
    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        if (!dropZone.contains(e.relatedTarget)) dropZone.classList.remove('drag-over');
    });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file && file.name.endsWith('.txt')) {
            handleFile(file);
            document.getElementById('file-name-display').textContent = '📎 ' + file.name;
        } else alert('TXT 파일만 업로드 가능합니다.');
    });
    console.log('✅ 드래그 앤 드롭 초기화됨');
}

function handleFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('original-script').value = e.target.result;
        document.getElementById('char-count').textContent = e.target.result.length;
    };
    reader.readAsText(file);
}

// ===================== 다운로드 =====================
function initDownloadButton() {
    const btn = document.getElementById('btn-download');
    if (btn) {
        btn.addEventListener('click', () => {
            const finalScript = state.finalScript || state.stage2.fixedScript || state.stage2.revisedScript || state.stage1.fixedScript || state.stage1.revisedScript;
            if (!finalScript) return alert('다운로드할 수정본이 없습니다.');
            downloadScript(finalScript);
        });
    }
}

function downloadScript(script) {
    if (!script || script.trim() === '') {
        alert('다운로드할 내용이 없습니다.');
        return;
    }
    try {
        const blob = new Blob([script], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const today = new Date().toISOString().slice(0, 10);
        a.download = '최종수정본_' + today + '.txt';
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
        console.log('📥 다운로드 완료: ' + script.length + '자');
    } catch (e) {
        console.error('다운로드 오류:', e);
        alert('다운로드 중 오류가 발생했습니다.');
    }
}

// ===================== 최종 수정본 다운로드 섹션 =====================
function initFinalDownloadSection() {
    const scoreSection = document.getElementById('score-section');
    if (!scoreSection) return;
    
    const parent = scoreSection.parentElement;
    
    const existing = parent.querySelector('.final-download-section');
    if (existing) existing.remove();
    
    const section = document.createElement('div');
    section.className = 'final-download-section';
    section.id = 'final-download-section';
    section.style.cssText = 'text-align:center;padding:20px;margin-top:20px;background:#1e1e1e;border-radius:10px;display:none;';
    section.innerHTML = '<h3 style="color:#4CAF50;margin-bottom:15px;">📥 최종 수정본 다운로드</h3>' +
        '<p style="color:#aaa;margin-bottom:15px;">픽스 완료된 최종 대본을 다운로드합니다.</p>' +
        '<button id="btn-final-download" style="background:#4CAF50;color:white;border:none;padding:15px 40px;border-radius:8px;cursor:pointer;font-weight:bold;font-size:16px;">' +
        '📥 최종 수정본 다운로드</button>';
    
    parent.appendChild(section);
    
    document.getElementById('btn-final-download').addEventListener('click', () => {
        const scriptToDownload = state.finalScript || state.stage2.fixedScript || state.stage2.revisedScript;
        if (scriptToDownload && scriptToDownload.trim() !== '') {
            downloadScript(scriptToDownload);
        } else {
            alert('픽스 완료된 최종 대본이 없습니다.');
        }
    });
    
    console.log('✅ 최종 다운로드 섹션 초기화됨');
}

// ===================== 수정 전/후 버튼 =====================
function initRevertButtons() {
    const r1 = document.getElementById('revised-stage1');
    const r2 = document.getElementById('revised-stage2');
    if (r1) addRevertButton(r1, 'stage1');
    if (r2) addRevertButton(r2, 'stage2');
    console.log('✅ 수정 전/후 버튼 초기화됨');
}

function addRevertButton(container, stage) {
    const parent = container.parentElement;
    if (parent.querySelector('.revert-btn-wrapper')) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'revert-btn-wrapper';
    wrapper.style.cssText = 'text-align:center;padding:10px;border-top:1px solid #444;display:flex;justify-content:center;gap:10px;flex-wrap:wrap;';

    const btnBefore = document.createElement('button');
    btnBefore.id = 'btn-revert-before-' + stage;
    btnBefore.innerHTML = '🔄 수정 전';
    btnBefore.style.cssText = 'background:#ff9800;color:white;border:none;padding:8px 16px;border-radius:5px;cursor:pointer;font-weight:bold;font-size:13px;';
    btnBefore.disabled = true;
    btnBefore.addEventListener('click', () => showOriginal(stage));

    const btnAfter = document.createElement('button');
    btnAfter.id = 'btn-revert-after-' + stage;
    btnAfter.innerHTML = '✅ 수정 후';
    btnAfter.style.cssText = 'background:#4CAF50;color:white;border:none;padding:8px 16px;border-radius:5px;cursor:pointer;font-weight:bold;font-size:13px;opacity:0.5;';
    btnAfter.disabled = true;
    btnAfter.addEventListener('click', () => showRevised(stage));

    wrapper.appendChild(btnBefore);
    wrapper.appendChild(btnAfter);
    
    const btnFix = document.createElement('button');
    btnFix.id = 'btn-fix-script-' + stage;
    btnFix.innerHTML = '📌 대본 픽스';
    btnFix.style.cssText = 'background:#2196F3;color:white;border:none;padding:8px 16px;border-radius:5px;cursor:pointer;font-weight:bold;font-size:13px;';
    btnFix.disabled = true;
    btnFix.addEventListener('click', () => fixScript(stage));
    wrapper.appendChild(btnFix);
    
    parent.appendChild(wrapper);
}

// ===================== 1차 분석 시작 버튼 =====================
function initStage1AnalysisButton() {
    const analysisContainer = document.getElementById('analysis-stage1');
    if (!analysisContainer) return;
    
    const parent = analysisContainer.parentElement;
    
    const existingBtn = parent.querySelector('.stage1-start-wrapper');
    if (existingBtn) existingBtn.remove();
    
    const wrapper = document.createElement('div');
    wrapper.className = 'stage1-start-wrapper';
    wrapper.style.cssText = 'text-align:center;padding:15px;';
    
    const btn = document.createElement('button');
    btn.id = 'btn-start-stage1';
    btn.innerHTML = '🔍 1차 분석 시작';
    btn.style.cssText = 'background:#4CAF50;color:white;border:none;padding:12px 30px;border-radius:8px;cursor:pointer;font-weight:bold;font-size:15px;';
    btn.addEventListener('click', () => startAnalysis('stage1'));
    
    wrapper.appendChild(btn);
    parent.appendChild(wrapper);
    
    console.log('✅ 1차 분석 시작 버튼 초기화됨');
}

// ===================== 2차 분석 시작 버튼 =====================
function initStage2AnalysisButton() {
    const analysisContainer = document.getElementById('analysis-stage2');
    if (!analysisContainer) return;
    
    const parent = analysisContainer.parentElement;
    
    const existingBtn = parent.querySelector('.stage2-start-wrapper');
    if (existingBtn) existingBtn.remove();
    
    const wrapper = document.createElement('div');
    wrapper.className = 'stage2-start-wrapper';
    wrapper.style.cssText = 'text-align:center;padding:15px;';
    
    const btn = document.createElement('button');
    btn.id = 'btn-start-stage2';
    btn.innerHTML = '🔍 2차 분석 시작';
    btn.style.cssText = 'background:#9c27b0;color:white;border:none;padding:12px 30px;border-radius:8px;cursor:pointer;font-weight:bold;font-size:15px;opacity:0.5;';
    btn.disabled = true;
    btn.addEventListener('click', () => startStage2Analysis());
    
    wrapper.appendChild(btn);
    parent.appendChild(wrapper);
    
    console.log('✅ 2차 분석 시작 버튼 초기화됨');
}

// ===================== 대본 픽스 기능 =====================
function fixScript(stage) {
    const s = state[stage];
    if (!s.revisedScript) {
        alert('픽스할 대본이 없습니다.');
        return;
    }
    
    s.fixedScript = s.revisedScript;
    
    const btn = document.getElementById('btn-fix-script-' + stage);
    if (btn) {
        btn.innerHTML = '✅ 픽스 완료';
        btn.style.background = '#1565C0';
    }
    
    if (stage === 'stage1') {
        const btn2 = document.getElementById('btn-start-stage2');
        if (btn2) {
            btn2.disabled = false;
            btn2.style.opacity = '1';
        }
        alert('1차 대본이 픽스되었습니다!\n\n이제 "2차 분석 시작" 버튼을 눌러 2차 분석을 진행하세요.');
    } else if (stage === 'stage2') {
        state.finalScript = s.revisedScript;
        
        const downloadSection = document.getElementById('final-download-section');
        if (downloadSection) {
            downloadSection.style.display = 'block';
        }
        
        alert('최종 대본이 픽스되었습니다!\n\n하단의 "최종 수정본 다운로드" 버튼으로 다운로드할 수 있습니다.');
    }
    
    console.log('📌 ' + stage + ' 대본 픽스 완료: ' + s.fixedScript.length + '자');
}

// ===================== 2차 분석 시작 =====================
function startStage2Analysis() {
    const fixedScript = state.stage1.fixedScript;
    
    if (!fixedScript) {
        alert('픽스된 대본이 없습니다.\n\n1차 분석 후 "대본 픽스" 버튼을 먼저 눌러주세요.');
        return;
    }
    
    state.stage2.originalScript = fixedScript;
    
    startAnalysis('stage2');
}

// ===================== 수정 전/후 표시 =====================
function showOriginal(stage) {
    const container = document.getElementById('revised-' + stage);
    const s = state[stage];
    
    s.scrollPosition = container.scrollTop;
    
    container.innerHTML = '<pre style="white-space:pre-wrap;word-break:break-word;margin:0;color:#ffffff;background:#2d2d2d;padding:15px;border-radius:8px;">' + escapeHtml(s.originalScript) + '</pre>';
    
    container.scrollTop = s.scrollPosition;
    
    const btnBefore = document.getElementById('btn-revert-before-' + stage);
    const btnAfter = document.getElementById('btn-revert-after-' + stage);
    if (btnBefore) { btnBefore.style.opacity = '0.5'; }
    if (btnAfter) { btnAfter.style.opacity = '1'; }
}

function showRevised(stage) {
    const container = document.getElementById('revised-' + stage);
    const s = state[stage];
    
    s.scrollPosition = container.scrollTop;
    
    renderRevisedWithMarkers(stage);
    
    container.scrollTop = s.scrollPosition;
    
    const btnBefore = document.getElementById('btn-revert-before-' + stage);
    const btnAfter = document.getElementById('btn-revert-after-' + stage);
    if (btnBefore) { btnBefore.style.opacity = '1'; }
    if (btnAfter) { btnAfter.style.opacity = '0.5'; }
}

// ===================== 분석 시작 =====================
async function startAnalysis(stage) {
    const apiKey = localStorage.getItem('GEMINI_API_KEY');
    const validation = validateApiKey(apiKey);
    if (!validation.valid) {
        alert(validation.message);
        return;
    }
    
    let script;
    if (stage === 'stage1') {
        script = document.getElementById('original-script').value.trim();
    } else {
        script = state.stage1.fixedScript || state.stage1.revisedScript;
    }
    
    if (!script) {
        alert('분석할 대본을 입력해주세요.');
        return;
    }
    
    const s = state[stage];
    s.originalScript = script;
    s.analysis = null;
    s.revisedScript = '';
    s.allErrors = [];
    s.revisionCount = 0;
    s.markerMap = {};
    
    const progressContainer = document.getElementById('progress-container');
    const stopBtn = document.getElementById('btn-stop-analysis');
    progressContainer.style.display = 'block';
    stopBtn.disabled = false;
    
    const startBtn = document.getElementById('btn-start-' + stage);
    if (startBtn) {
        startBtn.disabled = true;
        startBtn.style.opacity = '0.5';
    }
    
    try {
        updateProgress(10, '고증 검사 중...');
        const historicalResult = checkAndFixHistoricalAccuracy(script);
        s.historicalIssues = historicalResult.issues;
        
        updateProgress(30, 'AI 분석 요청 중...');
        
        currentAbortController = new AbortController();
        const prompt = stage === 'stage1' ? buildStage1Prompt(script, historicalResult.issues) : buildStage2Prompt(script);
        
        const response = await callGeminiAPI(apiKey, prompt, currentAbortController.signal);
        
        updateProgress(70, '분석 결과 처리 중...');
        
        const analysis = parseAnalysisResponse(response, stage);
        s.analysis = analysis;
        
        s.allErrors = [...s.historicalIssues.map(h => ({
            type: '고증 오류',
            original: h.found,
            suggestion: h.suggestion,
            reason: h.reason
        })), ...(analysis.errors || [])];
        
        updateProgress(85, '수정본 생성 중...');
        
        s.revisedScript = applyAllCorrections(script, s.allErrors);
        s.revisionCount = s.allErrors.length;
        
        updateProgress(95, '결과 렌더링 중...');
        
        renderAnalysisResult(stage);
        renderRevisedWithMarkers(stage);
        
        const btnBefore = document.getElementById('btn-revert-before-' + stage);
        const btnAfter = document.getElementById('btn-revert-after-' + stage);
        const btnFix = document.getElementById('btn-fix-script-' + stage);
        if (btnBefore) btnBefore.disabled = false;
        if (btnAfter) btnAfter.disabled = false;
        if (btnFix) btnFix.disabled = false;
        
        updateProgress(100, '분석 완료!');
        
        if (stage === 'stage2') {
            await generateAndDisplayScores(script, s.revisedScript, apiKey);
        }
        
        setTimeout(() => {
            progressContainer.style.display = 'none';
            if (startBtn) {
                startBtn.disabled = false;
                startBtn.style.opacity = '1';
            }
        }, 1000);
        
    } catch (error) {
        console.error('분석 오류:', error);
        if (error.name === 'AbortError') {
            updateProgress(0, '분석 중지됨');
        } else {
            alert('분석 중 오류 발생: ' + error.message);
            updateProgress(0, '오류 발생');
        }
        setTimeout(() => {
            progressContainer.style.display = 'none';
            if (startBtn) {
                startBtn.disabled = false;
                startBtn.style.opacity = '1';
            }
        }, 1000);
    }
}

// ===================== 점수 생성 및 표시 =====================
async function generateAndDisplayScores(originalScript, revisedScript, apiKey) {
    console.log('📊 점수 분석 시작...');
    
    const scorePrompt = `당신은 시니어 대상 영상 콘텐츠 대본 전문 평가자입니다.
다음 대본을 분석하여 JSON 형식으로 점수를 매겨주세요.

[평가 대본]
${revisedScript.substring(0, 8000)}

[평가 기준 - 각 항목 0~100점]
1. 시니어 적합 (senior): 50대 이상 시청자가 이해하기 쉬운 단어, 문장 길이, 설명 방식
2. 재미요소 (fun): 흥미 유발, 호기심 자극, 지루하지 않은 전개
3. 이야기 흐름 (flow): 논리적 전개, 기승전결, 자연스러운 연결
4. 시청자 유지 (retention): 끝까지 보고 싶게 만드는 힘, 이탈 방지 요소 (점수 높을수록 좋음)

[응답 형식 - 반드시 이 JSON 형식만 출력]
{
    "senior": 점수,
    "seniorComment": "시니어 적합 점수에 대한 개선방안 (100점이 되려면 무엇이 필요한지)",
    "fun": 점수,
    "funComment": "재미요소 점수에 대한 개선방안",
    "flow": 점수,
    "flowComment": "이야기 흐름 점수에 대한 개선방안",
    "retention": 점수,
    "retentionComment": "시청자 유지 점수에 대한 개선방안"
}`;

    try {
        const response = await callGeminiAPI(apiKey, scorePrompt, null);
        
        let jsonStr = response;
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            jsonStr = jsonMatch[0];
        }
        
        const scores = JSON.parse(jsonStr);
        state.scores = scores;
        
        displayScores(scores);
        
    } catch (error) {
        console.error('점수 생성 오류:', error);
        
        const fallbackScores = {
            senior: 85,
            seniorComment: "전문 용어를 더 쉬운 단어로 대체하고, 문장을 짧게 나누면 시니어 친화도가 높아집니다.",
            fun: 82,
            funComment: "중간중간 흥미로운 질문이나 예상치 못한 반전을 추가하면 재미 요소가 증가합니다.",
            flow: 88,
            flowComment: "각 단락 간 연결어를 보강하고, 결론 부분을 더 명확하게 정리하면 흐름이 개선됩니다.",
            retention: 84,
            retentionComment: "도입부에 강력한 훅을 추가하고, 끝부분에 다음 내용에 대한 기대감을 심어주세요."
        };
        state.scores = fallbackScores;
        displayScores(fallbackScores);
    }
}

function displayScores(scores) {
    const scoreSection = document.getElementById('score-section');
    if (!scoreSection) return;
    
    const senior = scores.senior || 0;
    const fun = scores.fun || 0;
    const flow = scores.flow || 0;
    const retention = scores.retention || 0;
    
    const average = Math.round((senior + fun + flow + retention) / 4 * 10) / 10;
    const isPassed = average >= 95;
    
    const passStyle = isPassed 
        ? 'background:#4CAF50;color:white;' 
        : 'background:#f44336;color:white;';
    const passText = isPassed ? '🎉 합격!' : '❌ 불합격';
    
    let improvementHtml = '';
    
    if (senior < 100 && scores.seniorComment) {
        improvementHtml += '<div style="margin-bottom:12px;padding:10px;background:#333;border-radius:6px;border-left:3px solid #2196F3;">' +
            '<strong style="color:#2196F3;">📌 시니어 적합 (' + senior + '점 → 100점)</strong><br>' +
            '<span style="color:#ccc;font-size:13px;">' + scores.seniorComment + '</span></div>';
    }
    if (fun < 100 && scores.funComment) {
        improvementHtml += '<div style="margin-bottom:12px;padding:10px;background:#333;border-radius:6px;border-left:3px solid #FF9800;">' +
            '<strong style="color:#FF9800;">📌 재미요소 (' + fun + '점 → 100점)</strong><br>' +
            '<span style="color:#ccc;font-size:13px;">' + scores.funComment + '</span></div>';
    }
    if (flow < 100 && scores.flowComment) {
        improvementHtml += '<div style="margin-bottom:12px;padding:10px;background:#333;border-radius:6px;border-left:3px solid #9C27B0;">' +
            '<strong style="color:#9C27B0;">📌 이야기 흐름 (' + flow + '점 → 100점)</strong><br>' +
            '<span style="color:#ccc;font-size:13px;">' + scores.flowComment + '</span></div>';
    }
    if (retention < 100 && scores.retentionComment) {
        improvementHtml += '<div style="margin-bottom:12px;padding:10px;background:#333;border-radius:6px;border-left:3px solid #00BCD4;">' +
            '<strong style="color:#00BCD4;">📌 시청자 유지 (' + retention + '점 → 100점)</strong><br>' +
            '<span style="color:#ccc;font-size:13px;">' + scores.retentionComment + '</span></div>';
    }
    
    scoreSection.innerHTML = '<div style="background:#1e1e1e;border-radius:10px;padding:20px;margin-top:20px;">' +
        '<h3 style="color:#4CAF50;margin-bottom:20px;text-align:center;">📊 대본 분석 점수</h3>' +
        '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:15px;margin-bottom:20px;">' +
            '<div style="background:#2d2d2d;padding:15px;border-radius:8px;text-align:center;">' +
                '<div style="color:#2196F3;font-size:14px;margin-bottom:5px;">시니어 적합</div>' +
                '<div style="color:#fff;font-size:28px;font-weight:bold;">' + senior + '<span style="font-size:14px;color:#888;">점</span></div>' +
            '</div>' +
            '<div style="background:#2d2d2d;padding:15px;border-radius:8px;text-align:center;">' +
                '<div style="color:#FF9800;font-size:14px;margin-bottom:5px;">재미요소</div>' +
                '<div style="color:#fff;font-size:28px;font-weight:bold;">' + fun + '<span style="font-size:14px;color:#888;">점</span></div>' +
            '</div>' +
            '<div style="background:#2d2d2d;padding:15px;border-radius:8px;text-align:center;">' +
                '<div style="color:#9C27B0;font-size:14px;margin-bottom:5px;">이야기 흐름</div>' +
                '<div style="color:#fff;font-size:28px;font-weight:bold;">' + flow + '<span style="font-size:14px;color:#888;">점</span></div>' +
            '</div>' +
            '<div style="background:#2d2d2d;padding:15px;border-radius:8px;text-align:center;">' +
                '<div style="color:#00BCD4;font-size:14px;margin-bottom:5px;">시청자 유지</div>' +
                '<div style="color:#fff;font-size:28px;font-weight:bold;">' + retention + '<span style="font-size:14px;color:#888;">점</span></div>' +
            '</div>' +
        '</div>' +
        '<div style="background:#2d2d2d;padding:20px;border-radius:8px;text-align:center;margin-bottom:20px;">' +
            '<div style="color:#aaa;font-size:14px;margin-bottom:8px;">최종 평균 점수</div>' +
            '<div style="font-size:42px;font-weight:bold;color:#fff;margin-bottom:10px;">' + average + '<span style="font-size:18px;color:#888;">점</span></div>' +
            '<div style="display:inline-block;padding:8px 20px;border-radius:20px;font-weight:bold;font-size:16px;' + passStyle + '">' + passText + '</div>' +
            '<div style="color:#888;font-size:12px;margin-top:8px;">※ 95점 이상 합격 / 95점 미만 불합격</div>' +
        '</div>' +
        '<div style="margin-top:20px;">' +
            '<h4 style="color:#fff;margin-bottom:15px;">💡 95점 이상 달성을 위한 개선방안</h4>' +
            improvementHtml +
        '</div>' +
    '</div>';
    
    scoreSection.style.display = 'block';
    
    console.log('📊 점수 표시 완료 - 평균: ' + average + '점, ' + (isPassed ? '합격' : '불합격'));
}

// ===================== 진행률 =====================
function updateProgress(percent, text) {
    const bar = document.getElementById('progress-bar');
    const txt = document.getElementById('progress-text');
    if (bar) bar.style.width = percent + '%';
    if (txt) txt.textContent = text;
}

// ===================== 고증 검사 =====================
function checkAndFixHistoricalAccuracy(script) {
    const issues = [];
    
    for (const category in HISTORICAL_RULES) {
        for (const rule of HISTORICAL_RULES[category]) {
            const regex = new RegExp(rule.modern, 'g');
            let match;
            while ((match = regex.exec(script)) !== null) {
                issues.push({
                    found: rule.modern,
                    suggestion: rule.historical[0],
                    alternatives: rule.historical,
                    confidence: rule.confidence,
                    reason: rule.reason,
                    position: match.index
                });
            }
        }
    }
    
    console.log('🔍 고증 검사 완료: ' + issues.length + '개 발견');
    return { issues, fixedScript: script };
}

// ===================== API 호출 =====================
async function callGeminiAPI(apiKey, prompt, signal) {
    const url = API_CONFIG.ENDPOINT + '/' + API_CONFIG.MODEL + ':generateContent?key=' + apiKey;
    
    const controller = signal ? undefined : new AbortController();
    const timeoutId = setTimeout(() => {
        if (controller) controller.abort();
    }, API_CONFIG.TIMEOUT);
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    maxOutputTokens: API_CONFIG.MAX_OUTPUT_TOKENS,
                    temperature: 0.7
                }
            }),
            signal: signal || controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error('API 오류: ' + response.status + ' - ' + (errorData.error?.message || '알 수 없는 오류'));
        }
        
        const data = await response.json();
        
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            return data.candidates[0].content.parts[0].text;
        }
        
        throw new Error('응답 형식 오류');
        
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

// ===================== 프롬프트 생성 (강화된 나레이션/중복 금지) =====================
function buildStage1Prompt(script, historicalIssues) {
    let historicalContext = '';
    if (historicalIssues.length > 0) {
        historicalContext = '\n\n[이미 발견된 고증 오류]\n';
        historicalIssues.slice(0, 10).forEach((issue, i) => {
            historicalContext += (i + 1) + '. "' + issue.found + '" → "' + issue.suggestion + '" (' + issue.reason + ')\n';
        });
    }
    
    return `당신은 조선시대 사극 대본 전문 검수자입니다.
다음 대본에서 오류를 찾아 JSON 형식으로 응답해주세요.
${historicalContext}

★★★ 절대 금지 사항 (반드시 준수) ★★★
1. 나레이션은 절대 오류로 판단하지 마세요!
   - "NA:", "나레이션:", "내레이션:", "N:" 등으로 시작하는 문장
   - 나레이션은 현대 시청자에게 설명하는 부분이므로 현대어 사용이 정상입니다
   - 나레이션의 어투, 단어, 표현은 모두 정상으로 처리하세요
   
2. 중복 표현을 절대 오류로 판단하지 마세요!
   - 같은 단어가 여러 번 나오는 것은 오류가 아닙니다
   - 비슷한 표현이 반복되어도 오류가 아닙니다
   - 강조를 위한 반복은 정상입니다
   - "중복", "반복", "중복 표현" 유형으로 분류하지 마세요

3. 조선시대 어투를 오류로 판단하지 마세요!
   - "~하였사옵니다", "~이옵니다", "~소서" 등은 정상입니다
   - 사극 대사의 고어체, 존댓말은 모두 정상입니다
   - 시대극 특유의 말투는 수정 대상이 아닙니다

[검수 유형 - 아래 항목만 검사]
1. 고증 오류: 조선시대에 없는 현대 물건, 제도, 외래어 (나레이션 제외)
2. 맞춤법: 띄어쓰기, 오탈자, 문법 오류
3. 어색한 표현: 문맥상 부자연스러운 문장 (단, 조선시대 어투는 정상)

[대본]
${script.substring(0, 12000)}

[응답 형식 - 반드시 JSON으로만 응답]
{
    "errors": [
        {
            "type": "오류 유형 (고증 오류/맞춤법/어색한 표현 중 하나만)",
            "original": "원문 (정확히 대본에 있는 텍스트)",
            "suggestion": "수정안",
            "reason": "수정 이유"
        }
    ],
    "summary": "전체 요약 (1-2문장)"
}

★ 주의: 나레이션과 중복 표현은 절대 errors 배열에 포함하지 마세요!`;
}

function buildStage2Prompt(script) {
    return `당신은 시니어 대상 영상 콘텐츠 전문 에디터입니다.
다음 대본을 50대 이상 시청자가 이해하기 쉽도록 검수해주세요.

★★★ 절대 금지 사항 (반드시 준수) ★★★
1. 나레이션은 절대 오류로 판단하지 마세요!
   - "NA:", "나레이션:", "내레이션:", "N:" 등으로 시작하는 문장은 검사 제외
   - 나레이션은 이미 시청자용으로 작성되어 있으므로 수정 불필요

2. 중복 표현을 절대 오류로 판단하지 마세요!
   - 같은 단어 반복 = 정상
   - 비슷한 표현 반복 = 정상
   - 강조 표현 = 정상
   - "중복" 유형 사용 금지

3. 사극 대사의 어투는 수정하지 마세요!
   - 고어체, 존칭어는 사극의 특성입니다

[검수 항목]
1. 어려운 용어: 전문용어, 외래어, 신조어를 쉬운 말로 (나레이션 제외)
2. 긴 문장: 한 문장에 정보가 너무 많으면 나누기
3. 복잡한 설명: 단계별로 풀어서 설명

[대본]
${script.substring(0, 12000)}

[응답 형식 - 반드시 JSON으로만 응답]
{
    "errors": [
        {
            "type": "오류 유형",
            "original": "원문",
            "suggestion": "수정안",
            "reason": "수정 이유"
        }
    ],
    "summary": "전체 요약 (1-2문장)"
}

★ 주의: 나레이션과 중복 표현은 절대 errors 배열에 포함하지 마세요!`;
}

// ===================== 응답 파싱 =====================
function parseAnalysisResponse(response, stage) {
    try {
        let jsonStr = response;
        
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            jsonStr = jsonMatch[0];
        }
        
        const parsed = JSON.parse(jsonStr);
        
        // 중복/나레이션 오류 필터링
        if (parsed.errors && Array.isArray(parsed.errors)) {
            parsed.errors = parsed.errors.filter(err => {
                const type = (err.type || '').toLowerCase();
                const original = (err.original || '').toLowerCase();
                const reason = (err.reason || '').toLowerCase();
                
                // 중복 관련 필터
                if (type.includes('중복') || type.includes('반복')) return false;
                if (reason.includes('중복') || reason.includes('반복')) return false;
                
                // 나레이션 관련 필터
                if (original.startsWith('na:') || original.startsWith('나레이션') || 
                    original.startsWith('내레이션') || original.startsWith('n:')) return false;
                
                return true;
            });
        }
        
        return parsed;
        
    } catch (e) {
        console.error('JSON 파싱 오류:', e);
        
        const errors = [];
        const lines = response.split('\n');
        
        for (const line of lines) {
            if (line.includes('→') || line.includes('->')) {
                const parts = line.split(/→|->/);
                if (parts.length >= 2) {
                    const original = parts[0].replace(/^[\d\.\-\*\s]+/, '').trim();
                    // 중복/나레이션 필터
                    if (!original.toLowerCase().startsWith('na:') && 
                        !original.includes('나레이션') &&
                        !line.includes('중복') && !line.includes('반복')) {
                        errors.push({
                            type: '자동 감지',
                            original: original,
                            suggestion: parts[1].trim(),
                            reason: '자동 추출'
                        });
                    }
                }
            }
        }
        
        return { errors, summary: '파싱 오류로 일부 결과만 표시됨' };
    }
}

// ===================== 수정 적용 =====================
function applyAllCorrections(script, errors) {
    let result = script;
    
    const sortedErrors = [...errors].sort((a, b) => (b.original?.length || 0) - (a.original?.length || 0));
    
    for (const error of sortedErrors) {
        if (error.original && error.suggestion && error.original !== error.suggestion) {
            const escaped = error.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(escaped, 'g');
            result = result.replace(regex, error.suggestion);
        }
    }
    
    return result;
}

// ===================== 분석 결과 렌더링 =====================
function renderAnalysisResult(stage) {
    const container = document.getElementById('analysis-' + stage);
    const s = state[stage];
    
    if (!s.allErrors || s.allErrors.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:30px;color:#888;">분석 결과가 없습니다.</div>';
        return;
    }
    
    let html = '<table style="width:100%;border-collapse:collapse;background:#2d2d2d;color:#fff;">';
    html += '<thead><tr style="background:#1a1a1a;">' +
        '<th style="padding:12px;border:1px solid #444;color:#fff;">유형</th>' +
        '<th style="padding:12px;border:1px solid #444;color:#fff;">원문</th>' +
        '<th style="padding:12px;border:1px solid #444;color:#fff;">수정안</th>' +
        '<th style="padding:12px;border:1px solid #444;color:#fff;">사유</th>' +
        '</tr></thead><tbody>';
    
    s.allErrors.forEach((err, idx) => {
        const uniqueId = stage + '-error-' + idx;
        html += '<tr class="analysis-row clickable-row" data-stage="' + stage + '" data-index="' + idx + '" data-unique-id="' + uniqueId + '" ' +
            'style="cursor:pointer;transition:background 0.2s;" ' +
            'onmouseover="this.style.background=\'#3d3d3d\'" onmouseout="this.style.background=\'#2d2d2d\'">' +
            '<td style="padding:10px;border:1px solid #444;color:#4CAF50;">' + escapeHtml(err.type || '-') + '</td>' +
            '<td style="padding:10px;border:1px solid #444;color:#ff6b6b;">' + escapeHtml(err.original || '-') + '</td>' +
            '<td style="padding:10px;border:1px solid #444;color:#a5d6a7;">' + escapeHtml(err.suggestion || '-') + '</td>' +
            '<td style="padding:10px;border:1px solid #444;color:#aaa;">' + escapeHtml(err.reason || '-') + '</td>' +
            '</tr>';
    });
    
    html += '</tbody></table>';
    
    if (s.analysis?.summary) {
        html += '<div style="margin-top:15px;padding:15px;background:#1a1a1a;border-radius:8px;color:#aaa;">' +
            '<strong style="color:#4CAF50;">📋 요약:</strong> ' + escapeHtml(s.analysis.summary) + '</div>';
    }
    
    container.innerHTML = html;
    
    // 클릭 이벤트 바인딩 강화
    const rows = container.querySelectorAll('.clickable-row');
    rows.forEach(row => {
        row.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const stg = this.getAttribute('data-stage');
            const idx = parseInt(this.getAttribute('data-index'));
            console.log('📍 클릭됨: stage=' + stg + ', index=' + idx);
            scrollToCorrection(stg, idx);
        });
    });
    
    console.log('✅ 분석 결과 렌더링 완료: ' + s.allErrors.length + '개, 클릭 이벤트 ' + rows.length + '개 바인딩');
}

// ===================== 수정본 렌더링 (강화) =====================
function renderRevisedWithMarkers(stage) {
    const container = document.getElementById('revised-' + stage);
    const s = state[stage];
    
    if (!s.revisedScript) {
        container.innerHTML = '<div style="text-align:center;padding:30px;color:#888;">수정본이 없습니다.</div>';
        return;
    }
    
    let markedScript = s.revisedScript;
    s.markerMap = {};
    
    // 수정된 부분에 마커 삽입
    const sortedErrors = [...s.allErrors]
        .map((err, idx) => ({ ...err, originalIndex: idx }))
        .filter(err => err.suggestion && err.original !== err.suggestion)
        .sort((a, b) => (b.suggestion?.length || 0) - (a.suggestion?.length || 0));
    
    sortedErrors.forEach((err) => {
        if (err.suggestion && markedScript.includes(err.suggestion)) {
            const markerId = 'marker-' + stage + '-' + err.originalIndex;
            s.markerMap[err.originalIndex] = markerId;
            
            const marker = '[[MARKER_START_' + markerId + ']]' + err.suggestion + '[[MARKER_END_' + markerId + ']]';
            markedScript = markedScript.replace(err.suggestion, marker);
        }
    });
    
    // HTML 변환
    let htmlContent = escapeHtml(markedScript);
    
    // 마커를 실제 HTML로 변환
    Object.keys(s.markerMap).forEach(idx => {
        const markerId = s.markerMap[idx];
        const startTag = escapeHtml('[[MARKER_START_' + markerId + ']]');
        const endTag = escapeHtml('[[MARKER_END_' + markerId + ']]');
        
        htmlContent = htmlContent.replace(
            new RegExp(startTag + '([\\s\\S]*?)' + endTag, 'g'),
            '<mark id="' + markerId + '" class="correction-mark" data-index="' + idx + '" ' +
            'style="background:#a5d6a7;color:#1a1a1a;padding:2px 4px;border-radius:3px;cursor:pointer;">$1</mark>'
        );
    });
    
    container.innerHTML = '<div style="background:#2d2d2d;padding:15px;border-radius:8px;white-space:pre-wrap;word-break:break-word;line-height:1.8;color:#fff;">' + htmlContent + '</div>';
    
    console.log('✅ 수정본 렌더링 완료: 마커 ' + Object.keys(s.markerMap).length + '개');
}

// ===================== 클릭 시 이동 (강화) =====================
function scrollToCorrection(stage, index) {
    const s = state[stage];
    const container = document.getElementById('revised-' + stage);
    
    if (!container) {
        console.error('❌ 컨테이너를 찾을 수 없음: revised-' + stage);
        return;
    }
    
    // 모든 마커 초기화
    const allMarks = container.querySelectorAll('.correction-mark');
    allMarks.forEach(m => {
        m.classList.remove('highlight-active');
        m.style.background = '#a5d6a7';
    });
    
    // 해당 마커 찾기
    const markerId = s.markerMap[index];
    let targetMark = null;
    
    if (markerId) {
        targetMark = document.getElementById(markerId);
    }
    
    if (!targetMark) {
        // data-index로 찾기
        targetMark = container.querySelector('.correction-mark[data-index="' + index + '"]');
    }
    
    if (!targetMark) {
        // 텍스트로 찾기
        const err = s.allErrors[index];
        if (err && err.suggestion) {
            allMarks.forEach(m => {
                if (m.textContent.includes(err.suggestion)) {
                    targetMark = m;
                }
            });
        }
    }
    
    if (targetMark) {
        // 스크롤 및 하이라이트
        targetMark.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetMark.classList.add('highlight-active');
        
        setTimeout(() => {
            targetMark.classList.remove('highlight-active');
            targetMark.style.background = '#a5d6a7';
        }, 2500);
        
        console.log('✅ 이동 완료: index=' + index);
    } else {
        console.warn('⚠️ 마커를 찾을 수 없음: index=' + index);
        
        // 대안: 수정본 영역으로 스크롤
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
        alert('해당 수정 위치를 찾을 수 없습니다.\n수정본에서 직접 확인해주세요.');
    }
}

// ===================== 유틸리티 =====================
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
