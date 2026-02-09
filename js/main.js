/**
 * MISLGOM 대본 검수 자동 프로그램
 * main.js v4.18 - Vertex AI API 키 + Gemini 2.5 Flash
 * 25가지 오류 유형 검수 + 조선시대 고증 검수 병합
 * - v4.18: JSON 복구 강화 + 고증/AI 오류 통합 + maxOutputTokens 증가
 */

console.log('🚀 main.js v4.18 (Vertex AI API 키 + Gemini 2.5 Flash) 로드됨');

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
    stage1: { originalScript: '', analysis: null, revisedScript: '', historicalIssues: [], scores: null, revisionCount: 0 },
    stage2: { originalScript: '', analysis: null, revisedScript: '', historicalIssues: [], scores: null, revisionCount: 0 }
};

let currentAbortController = null;

// ===================== API 설정 (v4.18) =====================
const API_CONFIG = {
    TIMEOUT: 300000,
    MODEL: 'gemini-2.5-flash',
    ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models',
    MAX_OUTPUT_TOKENS: 16384
};

// ===================== DOM 로드 후 초기화 =====================
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
    initAnalysisButtons();
    initDownloadButton();
    initRevertButtons();
    console.log('✅ 고증 DB 로드됨: ' + getTotalHistoricalRules() + '개 규칙');
    console.log('✅ API 타임아웃: ' + (API_CONFIG.TIMEOUT / 1000) + '초');
    console.log('✅ 모델: ' + API_CONFIG.MODEL);
    console.log('✅ main.js v4.18 초기화 완료');
}

function getTotalHistoricalRules() {
    let total = 0;
    for (const category in HISTORICAL_RULES) {
        total += HISTORICAL_RULES[category].length;
    }
    return total;
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

// ===================== API 키 관리 =====================
function initApiKeyPanel() {
    const btn = document.getElementById('btn-api-settings');
    const panel = document.getElementById('api-key-panel');
    const input = document.getElementById('api-key-input');
    const saveBtn = document.getElementById('btn-save-api-key');
    const closeBtn = document.getElementById('btn-close-api-panel');

    const savedKey = localStorage.getItem('GEMINI_API_KEY');
    if (savedKey) input.value = savedKey;

    btn.addEventListener('click', () => {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    });

    saveBtn.addEventListener('click', () => {
        const key = input.value.trim();
        if (key) {
            localStorage.setItem('GEMINI_API_KEY', key);
            console.log('🔑 API 키 저장됨');
            alert('API 키가 저장되었습니다.');
            panel.style.display = 'none';
        } else {
            alert('API 키를 입력해주세요.');
        }
    });

    closeBtn.addEventListener('click', () => panel.style.display = 'none');
}

function validateApiKey(apiKey) {
    if (!apiKey) {
        console.error('❌ API 키가 없습니다.');
        return { valid: false, message: 'API 키가 설정되지 않았습니다.' };
    }
    console.log('🔑 API 키 검증 중...');
    console.log('   - 키 길이: ' + apiKey.length + '자');
    console.log('   - 키 시작: ' + apiKey.substring(0, 10) + '...');
    if (apiKey.length < 20) {
        return { valid: false, message: 'API 키가 너무 짧습니다.' };
    }
    console.log('✅ API 키 형식 확인 완료');
    return { valid: true, message: 'OK' };
}

// ===================== 텍스트 영역 =====================
function initTextArea() {
    const textarea = document.getElementById('original-script');
    const charCount = document.getElementById('char-count');
    textarea.addEventListener('input', () => {
        charCount.textContent = textarea.value.length;
    });
}

// ===================== 지우기 버튼 =====================
function initClearButton() {
    const clearBtn = document.getElementById('btn-clear-script');
    const textarea = document.getElementById('original-script');
    const charCount = document.getElementById('char-count');
    const fileNameDisplay = document.getElementById('file-name-display');

    clearBtn.addEventListener('click', () => {
        textarea.value = '';
        charCount.textContent = '0';
        fileNameDisplay.textContent = '';
        console.log('🗑️ 대본 내용 삭제됨');
    });
    console.log('✅ 지우기 버튼 초기화됨');
}

// ===================== 파일 업로드 =====================
function initFileUpload() {
    const fileInput = document.getElementById('file-input');
    const fileNameDisplay = document.getElementById('file-name-display');

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.name.endsWith('.txt')) {
            handleFile(file);
            fileNameDisplay.textContent = `📎 ${file.name}`;
        } else {
            alert('TXT 파일만 업로드 가능합니다.');
        }
    });
    console.log('✅ 파일 업로드 초기화됨');
}

// ===================== 드래그 앤 드롭 =====================
function initDragAndDrop() {
    const dropZone = document.getElementById('drop-zone');
    const fileNameDisplay = document.getElementById('file-name-display');

    ['dragenter', 'dragover'].forEach(evt => {
        dropZone.addEventListener(evt, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.add('drag-over');
        });
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!dropZone.contains(e.relatedTarget)) {
            dropZone.classList.remove('drag-over');
        }
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file && file.name.endsWith('.txt')) {
            handleFile(file);
            fileNameDisplay.textContent = `📎 ${file.name}`;
            console.log('📄 드래그로 파일 업로드됨:', file.name);
        } else {
            alert('TXT 파일만 업로드 가능합니다.');
        }
    });
    console.log('✅ 드래그 앤 드롭 초기화됨');
}

function handleFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const textarea = document.getElementById('original-script');
        textarea.value = e.target.result;
        document.getElementById('char-count').textContent = textarea.value.length;
    };
    reader.readAsText(file);
}

// ===================== 분석 버튼 =====================
function initAnalysisButtons() {
    const btn1 = document.getElementById('btn-analyze-stage1');
    const btn2 = document.getElementById('btn-analyze-stage2');
    const stopBtn = document.getElementById('btn-stop-analysis');

    btn1.addEventListener('click', () => startAnalysis('stage1'));
    btn2.addEventListener('click', () => startAnalysis('stage2'));

    stopBtn.addEventListener('click', () => {
        if (currentAbortController) {
            currentAbortController.abort();
            currentAbortController = null;
            updateProgress(0, '분석이 중지되었습니다.');
            stopBtn.disabled = true;
            console.log('⏹️ 분석 중지됨');
            alert('분석이 중지되었습니다.');
            setTimeout(() => {
                document.getElementById('progress-container').style.display = 'none';
            }, 1000);
        }
    });

    console.log('✅ 1차 분석 버튼 연결됨');
    console.log('✅ 2차 분석 버튼 연결됨');
    console.log('✅ 중지 버튼 연결됨');
}

// ===================== 수정 전/후 버튼 =====================
function initRevertButtons() {
    const revised1 = document.getElementById('revised-stage1');
    const revised2 = document.getElementById('revised-stage2');
    if (revised1) addRevertButton(revised1, 'stage1');
    if (revised2) addRevertButton(revised2, 'stage2');
    console.log('✅ 수정 전/후 버튼 초기화됨');
}

function addRevertButton(container, stage) {
    const parent = container.parentElement;
    if (parent.querySelector('.revert-btn-wrapper')) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'revert-btn-wrapper';
    wrapper.style.cssText = 'text-align:center;padding:10px;border-top:1px solid #ddd;display:flex;justify-content:center;gap:10px;';

    const btnBefore = document.createElement('button');
    btnBefore.id = `btn-revert-before-${stage}`;
    btnBefore.innerHTML = '🔄 수정 전';
    btnBefore.style.cssText = 'background:#ff9800;color:white;border:none;padding:8px 20px;border-radius:5px;cursor:pointer;font-weight:bold;';
    btnBefore.disabled = true;
    btnBefore.addEventListener('click', () => showOriginal(stage));

    const btnAfter = document.createElement('button');
    btnAfter.id = `btn-revert-after-${stage}`;
    btnAfter.innerHTML = '✅ 수정 후';
    btnAfter.style.cssText = 'background:#4CAF50;color:white;border:none;padding:8px 20px;border-radius:5px;cursor:pointer;font-weight:bold;opacity:0.5;';
    btnAfter.disabled = true;
    btnAfter.addEventListener('click', () => showRevised(stage));

    wrapper.appendChild(btnBefore);
    wrapper.appendChild(btnAfter);
    parent.appendChild(wrapper);
}

function showOriginal(stage) {
    const s = state[stage];
    if (!s.originalScript) return alert('원본이 없습니다.');
    const container = document.getElementById(`revised-${stage}`);
    renderPlainScript(s.originalScript, container);
    document.getElementById(`btn-revert-before-${stage}`).style.opacity = '0.5';
    document.getElementById(`btn-revert-after-${stage}`).style.opacity = '1';
}

function showRevised(stage) {
    const s = state[stage];
    if (!s.revisedScript) return alert('수정본이 없습니다.');
    const container = document.getElementById(`revised-${stage}`);
    renderFullScriptWithHighlight(s.revisedScript, s.allErrors, container);
    document.getElementById(`btn-revert-before-${stage}`).style.opacity = '1';
    document.getElementById(`btn-revert-after-${stage}`).style.opacity = '0.5';
}

function renderPlainScript(script, container) {
    if (!script) {
        container.innerHTML = '<p class="placeholder">내용이 없습니다.</p>';
        return;
    }
    const lines = script.split('\n');
    let html = '<div class="script-scroll-wrapper"><div class="revised-script">';
    lines.forEach(line => {
        html += `<p class="line-unchanged">${escapeHtml(line) || '&nbsp;'}</p>`;
    });
    html += '</div></div>';
    container.innerHTML = html;
}

// ===================== 고증 검사 =====================
function checkAndFixHistoricalAccuracy(scriptText) {
    console.log('📜 로컬 고증 검사 시작');
    const issues = [];
    let fixedScript = scriptText;

    const categoryNames = {
        objects: '물건/도구', facilities: '시설/공간', occupations: '직업/직책',
        systems: '제도/단위', lifestyle: '생활용어', foods: '음식', clothing: '의복'
    };

    for (const category in HISTORICAL_RULES) {
        for (const rule of HISTORICAL_RULES[category]) {
            const regex = new RegExp(rule.modern, 'g');
            const matches = scriptText.match(regex);
            if (matches) {
                const replacement = rule.historical[0] !== '없음' ? rule.historical[0] : null;
                if (replacement) {
                    fixedScript = fixedScript.replace(regex, replacement);
                }
                issues.push({
                    type: '시대적 고증 오류',
                    category: categoryNames[category],
                    original: rule.modern,
                    corrected: replacement || '(대체어 없음)',
                    reason: rule.reason,
                    count: matches.length,
                    autoFixed: replacement !== null
                });
            }
        }
    }

    console.log(`📜 고증 검사 완료: ${issues.length}개 문제 발견`);
    return { issues, fixedScript };
}

// ===================== API 호출 =====================
async function callGeminiAPI(prompt, apiKey) {
    const url = `${API_CONFIG.ENDPOINT}/${API_CONFIG.MODEL}:generateContent?key=${apiKey}`;

    console.log('📡 API 호출 시작');
    console.log('   - 모델: ' + API_CONFIG.MODEL);
    console.log('   - 프롬프트 길이: ' + prompt.length + '자');

    currentAbortController = new AbortController();
    const timeoutId = setTimeout(() => {
        if (currentAbortController) {
            currentAbortController.abort();
            console.error('⏰ API 타임아웃');
        }
    }, API_CONFIG.TIMEOUT);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.1,
                    topP: 0.8,
                    topK: 40,
                    maxOutputTokens: API_CONFIG.MAX_OUTPUT_TOKENS
                }
            }),
            signal: currentAbortController.signal
        });

        clearTimeout(timeoutId);
        console.log('📡 API 응답: ' + response.status);

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`API 오류: ${response.status} - ${errText}`);
        }

        const data = await response.json();
        if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
            const text = data.candidates[0].content.parts[0].text;
            console.log('   - 응답 길이: ' + text.length + '자');
            return text;
        }
        throw new Error('응답 형식 오류');
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') throw new Error('요청 중단됨');
        throw error;
    }
}

// ===================== 분석 시작 =====================
async function startAnalysis(stage) {
    const apiKey = localStorage.getItem('GEMINI_API_KEY');
    const validation = validateApiKey(apiKey);
    if (!validation.valid) {
        alert(validation.message + '\n\n⚙️ API 키 설정에서 키를 입력해주세요.');
        return;
    }

    const textarea = document.getElementById('original-script');
    const scriptText = stage === 'stage1' ? textarea.value.trim() : state.stage1.revisedScript;
    if (!scriptText) {
        alert(stage === 'stage1' ? '대본을 입력해주세요.' : '1차 분석을 먼저 진행해주세요.');
        return;
    }

    console.log(`\n${'='.repeat(50)}`);
    console.log(`🔍 ${stage === 'stage1' ? '1차' : '2차'} 분석 시작 (${scriptText.length}자)`);
    console.log('='.repeat(50));

    state[stage].originalScript = scriptText;

    const progressContainer = document.getElementById('progress-container');
    const stopBtn = document.getElementById('btn-stop-analysis');
    progressContainer.style.display = 'block';
    stopBtn.disabled = false;

    try {
        updateProgress(10, '분석 준비 중...');

        // 고증 검사
        updateProgress(20, '고증 검사 중...');
        const histResult = checkAndFixHistoricalAccuracy(scriptText);
        state[stage].historicalIssues = histResult.issues;

        // AI 분석
        updateProgress(40, 'AI 분석 중... (최대 5분)');
        const prompt = buildAnalysisPrompt(histResult.fixedScript);
        const response = await callGeminiAPI(prompt, apiKey);

        updateProgress(70, '응답 분석 중...');
        const aiErrors = parseAnalysisResponse(response);

        // 통합 오류 목록 생성
        const allErrors = [];
        
        // 고증 오류 추가
        for (const h of histResult.issues) {
            allErrors.push({
                line: '-',
                type: h.type,
                original: h.original,
                corrected: h.corrected,
                reason: h.reason + ` (${h.count}회)`
            });
        }
        
        // AI 오류 추가
        for (const e of aiErrors) {
            allErrors.push({
                line: e.line || '-',
                type: e.type || '기타',
                original: e.original || '',
                corrected: e.corrected || '',
                reason: e.reason || ''
            });
        }

        state[stage].analysis = { errors: aiErrors };
        state[stage].allErrors = allErrors;

        // 수정본 생성
        updateProgress(80, '수정본 생성 중...');
        const revisedScript = applyAllCorrections(histResult.fixedScript, aiErrors);
        state[stage].revisedScript = revisedScript;
        state[stage].revisionCount = allErrors.length;

        // 렌더링
        updateProgress(90, '결과 표시 중...');
        renderAnalysisResult(stage, allErrors);
        renderRevisedScript(stage, allErrors);

        if (stage === 'stage1') {
            document.getElementById('btn-analyze-stage2').disabled = false;
        }

        updateProgress(100, '분석 완료!');
        setTimeout(() => progressContainer.style.display = 'none', 1000);
        console.log(`✅ ${stage} 분석 완료: ${allErrors.length}건`);

    } catch (error) {
        console.error('❌ 분석 오류:', error);
        alert('분석 중 오류: ' + error.message);
        setTimeout(() => progressContainer.style.display = 'none', 2000);
    }

    stopBtn.disabled = true;
    currentAbortController = null;
}

// ===================== 프롬프트 생성 =====================
function buildAnalysisPrompt(script) {
    return `당신은 한국어 대본 검수 전문가입니다.

아래 대본에서 오류를 찾아 JSON 배열로만 응답하세요.
다른 텍스트 없이 순수 JSON만 출력하세요.

[검수 항목]
1. 오타/맞춤법, 2. 띄어쓰기, 3. 문법, 4. 어색한 표현, 5. 중복 표현,
6. 비문, 7. 주어-서술어 불일치, 8. 시제 불일치, 9. 존댓말/반말 혼용,
10. 조사 오류, 11. 접속사 오용, 12. 문장부호 오류

[출력 형식 - 순수 JSON 배열만]
[
  {"line":1,"type":"오류유형","original":"원본","corrected":"수정","reason":"이유"},
  {"line":2,"type":"오류유형","original":"원본","corrected":"수정","reason":"이유"}
]

오류가 없으면 빈 배열 [] 을 출력하세요.

[대본]
${script}`;
}

// ===================== 응답 파싱 (v4.18 강화) =====================
function parseAnalysisResponse(response) {
    console.log('📝 응답 파싱 시작, 길이:', response.length);
    
    try {
        // 코드 블록 제거
        let jsonStr = response
            .replace(/```json\s*/gi, '')
            .replace(/```\s*/gi, '')
            .trim();

        // 배열 추출 시도
        const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
            jsonStr = arrayMatch[0];
        }

        // 첫 번째 파싱 시도
        try {
            const parsed = JSON.parse(jsonStr);
            console.log('✅ JSON 파싱 성공:', parsed.length + '개 오류');
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            console.log('⚠️ JSON 복구 시도...');
        }

        // 복구 시도: 불완전한 JSON 수정
        // 1. 끝 쉼표 제거
        jsonStr = jsonStr.replace(/,\s*]/g, ']').replace(/,\s*}/g, '}');
        
        // 2. 완전한 객체만 추출
        const completeObjects = [];
        const objectRegex = /\{\s*"line"\s*:\s*(\d+|-|"-")\s*,\s*"type"\s*:\s*"([^"]*)"\s*,\s*"original"\s*:\s*"([^"]*)"\s*,\s*"corrected"\s*:\s*"([^"]*)"\s*,\s*"reason"\s*:\s*"([^"]*)"\s*\}/g;
        
        let match;
        while ((match = objectRegex.exec(response)) !== null) {
            completeObjects.push({
                line: match[1] === '-' || match[1] === '"-"' ? '-' : parseInt(match[1]),
                type: match[2],
                original: match[3],
                corrected: match[4],
                reason: match[5]
            });
        }

        if (completeObjects.length > 0) {
            console.log('✅ 정규식으로 ' + completeObjects.length + '개 오류 추출');
            return completeObjects;
        }

        // 3. 부분 복구: 괄호 맞추기
        const openBrackets = (jsonStr.match(/\[/g) || []).length;
        const closeBrackets = (jsonStr.match(/\]/g) || []).length;
        const openBraces = (jsonStr.match(/\{/g) || []).length;
        const closeBraces = (jsonStr.match(/\}/g) || []).length;

        // 누락된 닫는 괄호 추가
        for (let i = 0; i < openBraces - closeBraces; i++) jsonStr += '}';
        for (let i = 0; i < openBrackets - closeBrackets; i++) jsonStr += ']';
        
        // 불완전한 마지막 객체 제거
        jsonStr = jsonStr.replace(/,\s*\{[^}]*$/g, '');
        jsonStr = jsonStr.replace(/,\s*]/g, ']');

        try {
            const parsed = JSON.parse(jsonStr);
            console.log('✅ 복구 성공:', (Array.isArray(parsed) ? parsed.length : 0) + '개 오류');
            return Array.isArray(parsed) ? parsed : [];
        } catch (e2) {
            console.log('❌ 복구 실패, 빈 배열 반환');
            return [];
        }

    } catch (error) {
        console.error('❌ 파싱 오류:', error);
        return [];
    }
}

// ===================== 수정 적용 =====================
function applyAllCorrections(script, aiErrors) {
    if (!aiErrors || aiErrors.length === 0) {
        console.log('📝 AI 수정 사항 없음');
        return script;
    }

    let result = script;
    let appliedCount = 0;

    for (const error of aiErrors) {
        if (error.original && error.corrected && error.original !== error.corrected) {
            if (result.includes(error.original)) {
                result = result.replace(error.original, error.corrected);
                appliedCount++;
                console.log(`   ✏️ "${error.original}" → "${error.corrected}"`);
            }
        }
    }

    console.log(`📝 수정 적용: ${appliedCount}/${aiErrors.length}건`);
    return result;
}

// ===================== 결과 렌더링 =====================
function renderAnalysisResult(stage, allErrors) {
    const container = document.getElementById(`analysis-${stage}`);

    if (!allErrors || allErrors.length === 0) {
        container.innerHTML = '<div class="analysis-result"><p class="no-issues">✅ 발견된 오류가 없습니다.</p></div>';
        return;
    }

    let html = '<div class="analysis-result">';
    html += `<h4>📋 검수 결과 (총 ${allErrors.length}건)</h4>`;
    html += '<table class="result-table"><thead><tr>';
    html += '<th>줄</th><th>유형</th><th>원본</th><th>수정</th><th>사유</th>';
    html += '</tr></thead><tbody>';

    for (const e of allErrors) {
        html += `<tr>
            <td>${e.line}</td>
            <td>${escapeHtml(e.type)}</td>
            <td><span class="error-text">${escapeHtml(e.original)}</span></td>
            <td><span class="corrected-text">${escapeHtml(e.corrected)}</span></td>
            <td>${escapeHtml(e.reason)}</td>
        </tr>`;
    }

    html += '</tbody></table></div>';
    container.innerHTML = html;
}

function renderRevisedScript(stage, allErrors) {
    const container = document.getElementById(`revised-${stage}`);
    const s = state[stage];

    renderFullScriptWithHighlight(s.revisedScript, allErrors, container);

    const countEl = document.getElementById(`revision-count-${stage}`);
    if (countEl) countEl.textContent = `수정: ${allErrors.length}건`;

    const btnBefore = document.getElementById(`btn-revert-before-${stage}`);
    const btnAfter = document.getElementById(`btn-revert-after-${stage}`);
    if (btnBefore) { btnBefore.disabled = false; btnBefore.style.opacity = '1'; }
    if (btnAfter) { btnAfter.disabled = false; btnAfter.style.opacity = '0.5'; }
}

function renderFullScriptWithHighlight(script, allErrors, container) {
    if (!script) {
        container.innerHTML = '<p class="placeholder">내용이 없습니다.</p>';
        return;
    }

    const lines = script.split('\n');
    const errorLines = new Set();
    
    if (allErrors) {
        for (const e of allErrors) {
            if (e.line && e.line !== '-') errorLines.add(parseInt(e.line));
        }
    }

    let html = '<div class="script-scroll-wrapper"><div class="revised-script">';
    lines.forEach((line, idx) => {
        const lineNum = idx + 1;
        const cls = errorLines.has(lineNum) ? 'line-modified' : 'line-unchanged';
        html += `<p class="${cls}">${escapeHtml(line) || '&nbsp;'}</p>`;
    });
    html += '</div></div>';
    container.innerHTML = html;
}

// ===================== 유틸리티 =====================
function updateProgress(percent, text) {
    const bar = document.getElementById('progress-bar');
    const txt = document.getElementById('progress-text');
    if (bar) bar.style.width = percent + '%';
    if (txt) txt.textContent = text;
    console.log(`📊 ${percent}% - ${text}`);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===================== 다운로드 =====================
function initDownloadButton() {
    const btn = document.getElementById('btn-download');
    btn.addEventListener('click', () => {
        const script = state.stage2.revisedScript || state.stage1.revisedScript;
        if (!script) {
            alert('다운로드할 수정본이 없습니다.');
            return;
        }
        const blob = new Blob([script], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '수정본_' + new Date().toISOString().slice(0, 10) + '.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log('📥 다운로드 완료');
    });
}
