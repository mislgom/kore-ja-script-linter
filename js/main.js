/**
 * MISLGOM 대본 검수 자동 프로그램
 * main.js v4.15 - Vertex AI + Gemini 3 Flash
 * 25가지 오류 유형 검수 + 조선시대 고증 검수 병합
 * - 고증 오류: 자동 수정 (첫 번째 대체어 적용)
 * - 수정 반영 강화: 로컬 강제 치환
 * - "수정 전/후" 버튼: 원문 복원 기능 (스크롤 위치 유지)
 * - API 키 검증 + 5분 타임아웃 + 디버깅 로그 강화
 */

console.log('🚀 main.js v4.15 (Vertex AI + Gemini 3 Flash + API 디버깅 강화) 로드됨');

// ===================== 조선시대 고증 DB =====================
const HISTORICAL_RULES = {
    // 물건/도구
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
    
    // 시설/공간
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
    
    // 직업/직책
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
    
    // 제도/단위/화폐
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
    
    // 생활용어
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
    
    // 음식
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
    
    // 의복
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
    stage1: {
        originalScript: '',
        analysis: null,
        revisedScript: '',
        historicalIssues: [],
        scores: null,
        revisionCount: 0
    },
    stage2: {
        originalScript: '',
        analysis: null,
        revisedScript: '',
        historicalIssues: [],
        scores: null,
        revisionCount: 0
    }
};

let currentAbortController = null;

// ===================== API 설정 =====================
const API_CONFIG = {
    TIMEOUT: 300000, // 5분 (300초)
    ENDPOINT: 'https://aiplatform.googleapis.com/v1/projects/gen-lang-client-0624453722/locations/global/publishers/google/models/gemini-3-flash-preview:generateContent'
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
    console.log('✅ main.js v4.15 초기화 완료');
}

// ===================== 고증 DB 규칙 수 계산 =====================
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
    if (savedKey) {
        input.value = savedKey;
    }

    btn.addEventListener('click', () => {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    });

    saveBtn.addEventListener('click', () => {
        const key = input.value.trim();
        if (key) {
            localStorage.setItem('GEMINI_API_KEY', key);
            console.log('🔑 API 키 저장됨, 키 시작: ' + key.substring(0, 10) + '...');
            alert('API 키가 저장되었습니다.');
            panel.style.display = 'none';
        } else {
            alert('API 키를 입력해주세요.');
        }
    });

    closeBtn.addEventListener('click', () => {
        panel.style.display = 'none';
    });
}

// ===================== API 키 검증 =====================
function validateApiKey(apiKey) {
    if (!apiKey) {
        console.error('❌ API 키가 없습니다.');
        return { valid: false, message: 'API 키가 설정되지 않았습니다.' };
    }
    
    console.log('🔑 API 키 검증 중...');
    console.log('   - 키 길이: ' + apiKey.length + '자');
    console.log('   - 키 시작: ' + apiKey.substring(0, 10) + '...');
    console.log('   - 키 끝: ...' + apiKey.substring(apiKey.length - 5));
    
    // Google Cloud API 키는 보통 AIza로 시작하지만, 다른 형식도 있을 수 있음
    if (apiKey.length < 20) {
        console.warn('⚠️ API 키가 너무 짧습니다.');
        return { valid: false, message: 'API 키가 너무 짧습니다. 올바른 키인지 확인해주세요.' };
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
        if (file) {
            if (file.name.endsWith('.txt')) {
                handleFile(file);
                fileNameDisplay.textContent = `📎 ${file.name}`;
            } else {
                alert('TXT 파일만 업로드 가능합니다.');
            }
        }
    });

    console.log('✅ 파일 업로드 초기화됨');
}

// ===================== 드래그 앤 드롭 =====================
function initDragAndDrop() {
    const dropZone = document.getElementById('drop-zone');
    const fileNameDisplay = document.getElementById('file-name-display');

    dropZone.addEventListener('dragenter', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('drag-over');
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

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (file.name.endsWith('.txt')) {
                handleFile(file);
                fileNameDisplay.textContent = `📎 ${file.name}`;
                console.log('📄 드래그로 파일 업로드됨:', file.name);
            } else {
                alert('TXT 파일만 업로드 가능합니다.');
            }
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
            console.log('⏹️ 사용자가 분석을 중지했습니다.');
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

// ===================== "수정 전" 버튼 초기화 =====================
function initRevertButtons() {
    // 1차 수정 반영 칸에 버튼 추가
    const revised1Container = document.getElementById('revised-stage1');
    if (revised1Container) {
        addRevertButton(revised1Container, 'stage1');
    }
    
    // 최종 수정 반영 칸에 버튼 추가
    const revised2Container = document.getElementById('revised-stage2');
    if (revised2Container) {
        addRevertButton(revised2Container, 'stage2');
    }
    
    console.log('✅ 수정 전/후 버튼 초기화됨');
}

// ===================== "수정 전/후" 버튼 추가 함수 =====================
function addRevertButton(container, stage) {
    const parent = container.parentElement;
    
    // 이미 버튼이 있으면 추가하지 않음
    if (parent.querySelector('.revert-btn-wrapper')) return;
    
    const btnWrapper = document.createElement('div');
    btnWrapper.className = 'revert-btn-wrapper';
    btnWrapper.style.cssText = 'text-align: center; padding: 10px; border-top: 1px solid #ddd; display: flex; justify-content: center; gap: 10px;';
    
    // 수정 전 버튼
    const btnBefore = document.createElement('button');
    btnBefore.id = `btn-revert-before-${stage}`;
    btnBefore.className = 'btn-revert-before';
    btnBefore.innerHTML = '🔄 수정 전';
    btnBefore.style.cssText = 'background: #ff9800; color: white; border: none; padding: 8px 20px; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 14px;';
    btnBefore.disabled = true;
    
    btnBefore.addEventListener('click', () => showOriginal(stage));
    btnBefore.addEventListener('mouseover', () => { if (!btnBefore.disabled) btnBefore.style.background = '#f57c00'; });
    btnBefore.addEventListener('mouseout', () => { if (!btnBefore.disabled) btnBefore.style.background = '#ff9800'; });
    
    // 수정 후 버튼
    const btnAfter = document.createElement('button');
    btnAfter.id = `btn-revert-after-${stage}`;
    btnAfter.className = 'btn-revert-after';
    btnAfter.innerHTML = '✅ 수정 후';
    btnAfter.style.cssText = 'background: #4CAF50; color: white; border: none; padding: 8px 20px; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 14px; opacity: 0.5;';
    btnAfter.disabled = true;
    
    btnAfter.addEventListener('click', () => showRevised(stage));
    btnAfter.addEventListener('mouseover', () => { if (!btnAfter.disabled) btnAfter.style.background = '#388E3C'; });
    btnAfter.addEventListener('mouseout', () => { if (!btnAfter.disabled) btnAfter.style.background = '#4CAF50'; });
    
    btnWrapper.appendChild(btnBefore);
    btnWrapper.appendChild(btnAfter);
    parent.appendChild(btnWrapper);
}

// ===================== 원문 보기 함수 (스크롤 위치 유지) =====================
function showOriginal(stage) {
    const stageState = state[stage];
    if (!stageState.originalScript) {
        alert('원본 대본이 없습니다.');
        return;
    }
    
    const container = document.getElementById(`revised-${stage}`);
    const btnBefore = document.getElementById(`btn-revert-before-${stage}`);
    const btnAfter = document.getElementById(`btn-revert-after-${stage}`);
    
    // 현재 스크롤 위치 저장
    const scrollWrapper = container.querySelector('.script-scroll-wrapper');
    const currentScrollTop = scrollWrapper ? scrollWrapper.scrollTop : 0;
    
    // 원본 표시
    renderPlainScript(stageState.originalScript, container);
    
    // 스크롤 위치 복원
    const newScrollWrapper = container.querySelector('.script-scroll-wrapper');
    if (newScrollWrapper) {
        newScrollWrapper.scrollTop = currentScrollTop;
    }
    
    // 버튼 상태 변경
    btnBefore.style.opacity = '0.5';
    btnAfter.style.opacity = '1';
    
    console.log(`🔄 ${stage} 원문 보기`);
}

// ===================== 수정본 보기 함수 (스크롤 위치 유지) =====================
function showRevised(stage) {
    const stageState = state[stage];
    if (!stageState.revisedScript) {
        alert('수정본이 없습니다.');
        return;
    }
    
    const container = document.getElementById(`revised-${stage}`);
    const btnBefore = document.getElementById(`btn-revert-before-${stage}`);
    const btnAfter = document.getElementById(`btn-revert-after-${stage}`);
    
    // 현재 스크롤 위치 저장
    const scrollWrapper = container.querySelector('.script-scroll-wrapper');
    const currentScrollTop = scrollWrapper ? scrollWrapper.scrollTop : 0;
    
    // 수정본 표시
    renderFullScriptWithHighlight(stageState.revisedScript, stageState.analysis, container);
    
    // 스크롤 위치 복원
    const newScrollWrapper = container.querySelector('.script-scroll-wrapper');
    if (newScrollWrapper) {
        newScrollWrapper.scrollTop = currentScrollTop;
    }
    
    // 버튼 상태 변경
    btnBefore.style.opacity = '1';
    btnAfter.style.opacity = '0.5';
    
    console.log(`🔄 ${stage} 수정본 보기`);
}

// ===================== 원본 스크립트 렌더링 (하이라이트 없이) =====================
function renderPlainScript(script, container) {
    if (!script) {
        container.innerHTML = '<p class="placeholder">내용이 없습니다.</p>';
        return;
    }
    
    const lines = script.split('\n');
    let html = '<div class="script-scroll-wrapper"><div class="revised-script">';
    
    lines.forEach((line, index) => {
        html += `<p class="line-unchanged">${escapeHtml(line) || '&nbsp;'}</p>`;
    });
    
    html += '</div></div>';
    container.innerHTML = html;
}

// ===================== 로컬 고증 검사 + 자동 수정 =====================
function checkAndFixHistoricalAccuracy(scriptText) {
    console.log('📜 로컬 고증 검사 및 자동 수정 시작');
    const issues = [];
    let fixedScript = scriptText;
    
    const categoryNames = {
        objects: '물건/도구',
        facilities: '시설/공간',
        occupations: '직업/직책',
        systems: '제도/단위',
        lifestyle: '생활용어',
        foods: '음식',
        clothing: '의복'
    };
    
    const lines = scriptText.split('\n');
    
    for (const category in HISTORICAL_RULES) {
        HISTORICAL_RULES[category].forEach(rule => {
            // "없음"인 경우 수정하지 않음
            if (rule.historical[0] === '없음') return;
            
            const regex = new RegExp(rule.modern, 'g');
            let match;
            let tempScript = fixedScript;
            
            while ((match = regex.exec(scriptText)) !== null) {
                // 줄 번호 찾기
                let charCount = 0;
                let lineNum = 1;
                for (let i = 0; i < lines.length; i++) {
                    charCount += lines[i].length + 1;
                    if (match.index < charCount) {
                        lineNum = i + 1;
                        break;
                    }
                }
                
                const replacement = rule.historical[0]; // 첫 번째 대체어 사용
                
                issues.push({
                    line: lineNum,
                    original: rule.modern,
                    suggestion: replacement,
                    errorType: `고증-${categoryNames[category]}`,
                    confidence: rule.confidence,
                    reason: rule.reason,
                    isHistorical: true
                });
            }
            
            // 실제 수정 적용
            fixedScript = fixedScript.replace(regex, rule.historical[0]);
        });
    }
    
    // 중복 제거 (같은 줄, 같은 원본)
    const uniqueIssues = [];
    const seen = new Set();
    issues.forEach(issue => {
        const key = `${issue.line}-${issue.original}`;
        if (!seen.has(key)) {
            seen.add(key);
            uniqueIssues.push(issue);
        }
    });
    
    console.log(`📜 로컬 고증 검사 완료: ${uniqueIssues.length}건 발견 및 자동 수정`);
    return { issues: uniqueIssues, fixedScript };
}

// ===================== 분석 실행 (1차, 2차) =====================
async function startAnalysis(stage) {
    console.log(`🔍 ${stage} 분석 시작`);
    console.log('='.repeat(50));

    const apiKey = localStorage.getItem('GEMINI_API_KEY');
    
    // API 키 검증
    const keyValidation = validateApiKey(apiKey);
    if (!keyValidation.valid) {
        alert(keyValidation.message);
        return;
    }

    let scriptText;
    if (stage === 'stage1') {
        scriptText = document.getElementById('original-script').value.trim();
        if (!scriptText) {
            alert('분석할 대본을 입력해주세요.');
            return;
        }
        state.stage1.originalScript = scriptText;
        console.log('📝 원본 대본 길이: ' + scriptText.length + '자');
    } else {
        scriptText = state.stage1.revisedScript;
        if (!scriptText) {
            alert('1차 분석을 먼저 완료해주세요.');
            return;
        }
        state.stage2.originalScript = scriptText;
        console.log('📝 1차 수정본 길이: ' + scriptText.length + '자');
    }

    const progressContainer = document.getElementById('progress-container');
    const stopBtn = document.getElementById('btn-stop-analysis');
    progressContainer.style.display = 'block';
    stopBtn.disabled = false;
    updateProgress(5, '로컬 고증 검사 및 자동 수정 중...');

    // 1단계: 로컬 고증 검사 + 자동 수정 (100% 일관성)
    const historicalResult = checkAndFixHistoricalAccuracy(scriptText);
    const historicalIssues = historicalResult.issues;
    let processedScript = historicalResult.fixedScript;
    
    updateProgress(15, 'AI 분석 준비 중...');

    currentAbortController = new AbortController();
    const signal = currentAbortController.signal;

    try {
        updateProgress(25, '프롬프트 생성 중...');
        const prompt = generatePrompt(processedScript);
        console.log('📤 프롬프트 생성 완료, 길이: ' + prompt.length + '자');

        updateProgress(45, 'AI 분석 중... (최대 5분 소요)');
        console.log('🌐 API 호출 시작...');
        console.log('   - 엔드포인트: ' + API_CONFIG.ENDPOINT);
        console.log('   - 타임아웃: ' + (API_CONFIG.TIMEOUT / 1000) + '초');
        
        const response = await callGeminiAPI(prompt, signal);
        console.log('📥 API 응답 수신 완료');
        console.log('   - 응답 길이: ' + response.length + '자');

        updateProgress(70, '결과 파싱 중...');
        const parsed = parseAnalysisResult(response);
        console.log('✅ 파싱 완료');

        // 수정 반영 강화: 로컬에서 강제 치환
        updateProgress(80, '수정 사항 강제 반영 중...');
        const verified = forceApplyAllCorrections(parsed, processedScript);

        updateProgress(90, '결과 렌더링 중...');
        
        // 고증 오류와 일반 오류 병합
        const mergedAnalysis = mergeAnalysisResults(verified.analysis, historicalIssues);
        
        renderResults({
            analysis: mergedAnalysis,
            revisedScript: verified.revisedScript,
            historicalIssues: historicalIssues,
            scores: verified.scores,
            parseError: verified.parseError
        }, stage);

        if (stage === 'stage1') {
            state.stage1.analysis = mergedAnalysis;
            state.stage1.revisedScript = verified.revisedScript;
            state.stage1.historicalIssues = historicalIssues;
            state.stage1.scores = verified.scores;
            state.stage1.revisionCount = mergedAnalysis ? mergedAnalysis.length : 0;
            document.getElementById('btn-analyze-stage2').disabled = false;
            
            // 수정 전/후 버튼 활성화
            const revertBtnBefore1 = document.getElementById('btn-revert-before-stage1');
            const revertBtnAfter1 = document.getElementById('btn-revert-after-stage1');
            if (revertBtnBefore1) revertBtnBefore1.disabled = false;
            if (revertBtnAfter1) revertBtnAfter1.disabled = false;
        } else {
            state.stage2.analysis = mergedAnalysis;
            state.stage2.revisedScript = verified.revisedScript;
            state.stage2.historicalIssues = historicalIssues;
            state.stage2.scores = verified.scores;
            state.stage2.revisionCount = mergedAnalysis ? mergedAnalysis.length : 0;
            document.getElementById('btn-download').disabled = false;
            renderScores(verified.scores, historicalIssues.length);
            
            // 수정 전/후 버튼 활성화
            const revertBtnBefore2 = document.getElementById('btn-revert-before-stage2');
            const revertBtnAfter2 = document.getElementById('btn-revert-after-stage2');
            if (revertBtnBefore2) revertBtnBefore2.disabled = false;
            if (revertBtnAfter2) revertBtnAfter2.disabled = false;
        }

        updateProgress(100, '분석 완료!');
        console.log('='.repeat(50));
        console.log(`✅ ${stage} 분석 완료 (일반: ${verified.analysis?.length || 0}건, 고증: ${historicalIssues.length}건)`);

    } catch (error) {
        console.log('='.repeat(50));
        if (error.name === 'AbortError') {
            console.log('⏹️ 분석이 사용자에 의해 중지됨');
            updateProgress(0, '분석이 중지되었습니다.');
        } else if (error.message.includes('timeout')) {
            console.error('⏰ API 타임아웃 발생 (5분 초과)');
            alert('API 응답 시간이 초과되었습니다 (5분). 다시 시도해주세요.');
            updateProgress(0, '타임아웃 발생');
        } else {
            console.error('❌ 분석 오류:', error);
            console.error('   - 오류 메시지:', error.message);
            console.error('   - 오류 스택:', error.stack);
            alert('분석 중 오류가 발생했습니다: ' + error.message);
            updateProgress(0, '오류 발생');
        }
    } finally {
        stopBtn.disabled = true;
        currentAbortController = null;
        setTimeout(() => {
            progressContainer.style.display = 'none';
        }, 2000);
    }
}

// ===================== 수정 사항 강제 반영 (강화된 버전) =====================
function forceApplyAllCorrections(parsed, baseScript) {
    let revisedScript = baseScript;
    let appliedCount = 0;
    let forcedCount = 0;
    
    if (!parsed.analysis || parsed.analysis.length === 0) {
        return {
            ...parsed,
            revisedScript: revisedScript
        };
    }
    
    // AI가 제공한 revisedScript가 있으면 그것을 기반으로
    if (parsed.revisedScript && parsed.revisedScript.trim().length > 0) {
        revisedScript = parsed.revisedScript;
    }
    
    // 모든 분석 항목에 대해 강제 치환
    parsed.analysis.forEach((item, index) => {
        if (item.original && item.suggestion && item.original !== item.suggestion) {
            // 이미 수정되어 있는지 확인
            if (revisedScript.includes(item.suggestion)) {
                appliedCount++;
            } else if (revisedScript.includes(item.original)) {
                // 강제로 치환
                revisedScript = revisedScript.split(item.original).join(item.suggestion);
                appliedCount++;
                forcedCount++;
                console.log(`⚠️ 강제 수정 적용 [${index + 1}]: "${item.original}" → "${item.suggestion}"`);
            }
        }
    });
    
    console.log(`✅ 수정 반영 완료: 총 ${appliedCount}건 (강제 적용: ${forcedCount}건)`);
    
    return {
        analysis: parsed.analysis,
        revisedScript: revisedScript,
        scores: parsed.scores,
        parseError: parsed.parseError
    };
}

// ===================== 분석 결과 병합 =====================
function mergeAnalysisResults(aiAnalysis, historicalIssues) {
    const merged = [];
    
    // AI 분석 결과 추가 (일반 오류)
    if (aiAnalysis && aiAnalysis.length > 0) {
        aiAnalysis.forEach(item => {
            merged.push({
                ...item,
                isHistorical: false
            });
        });
    }
    
    // 고증 오류 추가
    if (historicalIssues && historicalIssues.length > 0) {
        historicalIssues.forEach(item => {
            merged.push(item);
        });
    }
    
    // 줄 번호 기준 정렬
    merged.sort((a, b) => (a.line || 0) - (b.line || 0));
    
    return merged;
}

// ===================== 진행률 업데이트 =====================
function updateProgress(percent, text) {
    const bar = document.getElementById('progress-bar');
    const textEl = document.getElementById('progress-text');
    bar.style.width = percent + '%';
    textEl.textContent = text;
}

// ===================== 프롬프트 생성 (1차, 2차용) =====================
function generatePrompt(scriptText) {
    return `당신은 한국어 대본 검수 전문가입니다. 아래 규칙을 정확히 따라 분석하세요.

[중요] 검수 범위 제한
- 맞춤법, 띄어쓰기, 문장부호, 어색한 표현, 중복 표현만 검수
- 조선시대 고증 오류는 이미 별도 시스템에서 처리 완료됨
- 어투/말투/존대법은 절대 수정하지 마세요 (원문 그대로 유지)

[규칙 1] 필수 검사 항목
- 맞춤법 오류 (예: 되서→돼서, 됬→됐, 않된다→안 된다)
- 띄어쓰기 오류 (예: 할수있다→할 수 있다)
- 문장부호 오류 (마침표, 쉼표 누락)
- 어색한 표현 (문맥상 부자연스러운 표현)
- 중복 표현 (같은 의미 반복)

[규칙 2] 절대 금지
- 어투 변경 금지 (하였습니다→하였소 변경 금지)
- 말투 변경 금지 (존대/반말 변경 금지)
- 문장 구조 변경 금지
- 내용 추가/삭제 금지

[규칙 3] 수정 반영 필수 (가장 중요!)
- analysis에 있는 모든 original → suggestion 변경사항은 revisedScript에 100% 반영
- 단 하나도 누락하지 마세요
- original 텍스트가 revisedScript에 남아있으면 안 됨

[규칙 4] 줄맞춤
revisedScript의 각 줄은 공백 포함 17자 이내로 작성하세요.

[규칙 5] 전체 대본 포함
revisedScript에는 전체 대본을 포함하세요. 생략 금지.

[대본]
${scriptText}

[출력 형식]
반드시 아래 형식의 유효한 JSON으로만 응답하세요:
{"analysis":[{"line":1,"errorType":"오류유형","original":"원본","suggestion":"수정","reason":"이유"}],"revisedScript":"수정된 전체 대본","scores":{"entertainment":85,"seniorTarget":90,"storyFlow":80,"bounceRate":15}}`;
}

// ===================== Gemini API 호출 (5분 타임아웃 + 디버깅 강화) =====================
async function callGeminiAPI(prompt, signal) {
    const apiKey = localStorage.getItem('GEMINI_API_KEY');
    
    const endpoint = `${API_CONFIG.ENDPOINT}?key=${apiKey}`;
    
    console.log('🌐 API 요청 전송 중...');
    const startTime = Date.now();

    // 타임아웃 설정 (5분)
    const timeoutId = setTimeout(() => {
        if (currentAbortController) {
            currentAbortController.abort();
            console.error('⏰ API 타임아웃: 5분 초과');
        }
    }, API_CONFIG.TIMEOUT);

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    role: 'user',
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0,
                    topP: 1,
                    topK: 1,
                    maxOutputTokens: 65536
                }
            }),
            signal: signal
        });

        clearTimeout(timeoutId);
        
        const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`⏱️ API 응답 시간: ${elapsedTime}초`);
        console.log(`📊 HTTP 상태: ${response.status} ${response.statusText}`);

        if (!response.ok) {
            let errorMsg = 'API 오류: ' + response.status;
            try {
                const errData = await response.json();
                console.error('❌ API 에러 응답:', errData);
                errorMsg = errData.error?.message || errorMsg;
            } catch (e) {
                console.error('❌ 에러 응답 파싱 실패');
            }
            throw new Error(errorMsg);
        }

        const data = await response.json();
        console.log('✅ API 응답 JSON 파싱 성공');
        
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            console.error('❌ API 응답에 텍스트가 없습니다.');
            console.error('   응답 구조:', JSON.stringify(data, null, 2).substring(0, 500));
            throw new Error('API 응답이 비어있습니다.');
        }

        console.log('✅ API 텍스트 추출 성공, 길이: ' + text.length + '자');
        return text;
        
    } catch (error) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
            const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
            if (elapsedTime >= (API_CONFIG.TIMEOUT / 1000)) {
                throw new Error('timeout: API 응답 시간 초과 (5분)');
            }
            throw error;
        }
        
        console.error('❌ API 호출 실패:', error.message);
        throw error;
    }
}

// ===================== 결과 파싱 =====================
function parseAnalysisResult(responseText) {
    console.log('📝 파싱 시작, 원본 길이:', responseText.length);

    let jsonStr = responseText.trim();
    jsonStr = jsonStr.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

    if (!jsonStr.startsWith('{')) {
        const firstBrace = jsonStr.indexOf('{');
        if (firstBrace !== -1) {
            jsonStr = jsonStr.substring(firstBrace);
        } else if (jsonStr.startsWith('"analysis"')) {
            jsonStr = '{' + jsonStr;
        }
    }

    const lastBrace = jsonStr.lastIndexOf('}');
    if (lastBrace !== -1) {
        jsonStr = jsonStr.substring(0, lastBrace + 1);
    }

    let openBraces = (jsonStr.match(/{/g) || []).length;
    let closeBraces = (jsonStr.match(/}/g) || []).length;
    while (openBraces > closeBraces) {
        jsonStr += '}';
        closeBraces++;
    }

    let openBrackets = (jsonStr.match(/\[/g) || []).length;
    let closeBrackets = (jsonStr.match(/\]/g) || []).length;
    while (openBrackets > closeBrackets) {
        const lastBraceIdx = jsonStr.lastIndexOf('}');
        jsonStr = jsonStr.substring(0, lastBraceIdx) + ']' + jsonStr.substring(lastBraceIdx);
        closeBrackets++;
    }

    jsonStr = jsonStr.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');

    try {
        const parsed = JSON.parse(jsonStr);
        console.log('✅ JSON 파싱 성공');
        return {
            analysis: parsed.analysis || [],
            revisedScript: parsed.revisedScript || '',
            scores: parsed.scores || {},
            parseError: null
        };
    } catch (e) {
        console.error('❌ JSON 파싱 실패:', e.message);
        return extractPartialData(jsonStr, responseText);
    }
}

// ===================== 부분 데이터 추출 =====================
function extractPartialData(jsonStr, originalText) {
    let analysis = [];
    let revisedScript = '';
    let scores = {};

    try {
        const analysisMatch = jsonStr.match(/"analysis"\s*:\s*\[([\s\S]*?)\](?=\s*,?\s*"revisedScript")/);
        if (analysisMatch) {
            analysis = JSON.parse('[' + analysisMatch[1] + ']');
            console.log('✅ analysis 추출 성공:', analysis.length);
        }
    } catch (e) {}

    try {
        const scriptMatch = jsonStr.match(/"revisedScript"\s*:\s*"([\s\S]*?)(?:"\s*,\s*"scores"|"\s*})/);
        if (scriptMatch) {
            revisedScript = scriptMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
            console.log('✅ revisedScript 추출 성공:', revisedScript.length);
        }
    } catch (e) {}

    try {
        const scoresMatch = jsonStr.match(/"scores"\s*:\s*(\{[^}]+\})/);
        if (scoresMatch) {
            scores = JSON.parse(scoresMatch[1]);
            console.log('✅ scores 추출 성공');
        }
    } catch (e) {}

    if (analysis.length > 0 || revisedScript.length > 0) {
        return { analysis, revisedScript, scores, parseError: null };
    }

    return { analysis: [], revisedScript: originalText, scores: {}, parseError: '파싱 실패' };
}

// ===================== 결과 렌더링 =====================
function renderResults(parsed, stage) {
    const analysisContainer = document.getElementById(`analysis-${stage}`);
    const revisedContainer = document.getElementById(`revised-${stage}`);
    const countSpan = document.getElementById(`revision-count-${stage}`);

    renderAnalysisTable(parsed.analysis, parsed.parseError, stage, analysisContainer);
    renderFullScriptWithHighlight(parsed.revisedScript, parsed.analysis, revisedContainer);

    const generalCount = parsed.analysis ? parsed.analysis.filter(a => !a.isHistorical).length : 0;
    const historicalCount = parsed.analysis ? parsed.analysis.filter(a => a.isHistorical).length : 0;
    const totalCount = generalCount + historicalCount;
    
    if (totalCount > 0) {
        countSpan.innerHTML = `<span style="color:#4CAF50;">(일반 ${generalCount}건)</span> <span style="color:#ff9800;">(고증 ${historicalCount}건)</span>`;
    } else {
        countSpan.textContent = '';
    }
}

// ===================== 분석 테이블 렌더링 (스타일 통일) =====================
function renderAnalysisTable(analysis, parseError, stage, container) {
    if (parseError) {
        container.innerHTML = `<p class="error">파싱 오류: ${parseError}</p>`;
        return;
    }

    if (!analysis || analysis.length === 0) {
        container.innerHTML = '<p class="success">✅ 발견된 오류가 없습니다.</p>';
        return;
    }

    const targetContainerId = stage === 'stage1' ? 'revised-stage1' : 'revised-stage2';

    let html = '<p class="click-hint">💡 각 행을 클릭하면 수정된 부분으로 이동합니다</p>';
    
    html += '<div class="table-scroll-wrapper"><table class="analysis-table"><thead><tr><th>줄</th><th>유형</th><th>원본</th><th>수정</th><th>확신도</th><th>이유</th></tr></thead><tbody>';

    analysis.forEach((item, index) => {
        // 확신도 표시
        let confidenceDisplay = '-';
        if (item.confidence) {
            const confidenceColor = item.confidence === '높음' ? '#4CAF50' : 
                                   item.confidence === '중간' ? '#ff9800' : '#9e9e9e';
            confidenceDisplay = `<span style="color: ${confidenceColor}; font-weight: bold;">${item.confidence}</span>`;
        }
        
        html += `<tr class="clickable-row"
            data-target-container="${targetContainerId}" 
            data-search-text="${escapeHtml(item.suggestion || item.original)}"
            data-line="${item.line}"
            onclick="scrollToHighlight(this)">
            <td>${item.line || '-'}</td>
            <td>${escapeHtml(item.errorType || '-')}</td>
            <td>${escapeHtml(item.original || '-')}</td>
            <td>${escapeHtml(item.suggestion || '-')}</td>
            <td>${confidenceDisplay}</td>
            <td>${escapeHtml(item.reason || '-')}</td>
        </tr>`;
    });

    html += '</tbody></table></div>';
    container.innerHTML = html;
}

// ===================== 클릭 시 해당 위치로 스크롤 =====================
function scrollToHighlight(row) {
    const targetContainerId = row.getAttribute('data-target-container');
    const searchText = row.getAttribute('data-search-text');
    const container = document.getElementById(targetContainerId);

    if (!container) return;

    const scrollWrapper = container.querySelector('.script-scroll-wrapper');
    const highlights = container.querySelectorAll('.changed-text');
    let targetElement = null;

    highlights.forEach(el => {
        if (el.textContent.includes(searchText) || searchText.includes(el.textContent)) {
            targetElement = el;
        }
    });

    if (!targetElement && highlights.length > 0) {
        const lineIndex = parseInt(row.getAttribute('data-line')) - 1;
        targetElement = highlights[Math.min(lineIndex, highlights.length - 1)] || highlights[0];
    }

    if (targetElement) {
        container.querySelectorAll('.highlight-flash').forEach(el => {
            el.classList.remove('highlight-flash');
        });

        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetElement.classList.add('highlight-flash');

        setTimeout(() => {
            targetElement.classList.remove('highlight-flash');
        }, 1500);
    } else if (scrollWrapper) {
        scrollWrapper.scrollTop = 0;
    }
}

// ===================== 수정본 렌더링 (스타일 통일) =====================
function renderFullScriptWithHighlight(revisedScript, analysis, container) {
    if (!revisedScript) {
        container.innerHTML = '<p class="placeholder">수정된 내용이 없습니다.</p>';
        return;
    }

    // 모든 수정 사항 (일반 + 고증 통합)
    const allSuggestions = new Set();
    
    if (analysis && analysis.length > 0) {
        analysis.forEach(item => {
            if (item.suggestion && item.suggestion.trim()) {
                allSuggestions.add(item.suggestion.trim());
            }
        });
    }

    const lines = revisedScript.split('\n');
    let html = '<div class="script-scroll-wrapper"><div class="revised-script">';

    lines.forEach((line, index) => {
        let processedLine = escapeHtml(line);
        let hasHighlight = false;

        // 모든 수정 사항 하이라이트 (녹색 통일)
        allSuggestions.forEach(suggestion => {
            const escapedSuggestion = escapeHtml(suggestion);
            if (processedLine.includes(escapedSuggestion)) {
                processedLine = processedLine.replace(
                    new RegExp(escapeRegExp(escapedSuggestion), 'g'),
                    `<span class="changed-text">${escapedSuggestion}</span>`
                );
                hasHighlight = true;
            }
        });

        if (hasHighlight) {
            html += `<p class="line-revised" data-line="${index + 1}">${processedLine}</p>`;
        } else {
            html += `<p class="line-unchanged">${processedLine || '&nbsp;'}</p>`;
        }
    });

    html += '</div></div>';
    container.innerHTML = html;
}

// ===================== 정규식 이스케이프 =====================
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ===================== 점수 렌더링 =====================
function renderScores(scores, historicalIssueCount) {
    const container = document.getElementById('score-display');

    if (!scores || Object.keys(scores).length === 0) {
        container.innerHTML = '<p class="placeholder">점수 정보가 없습니다.</p>';
        return;
    }

    const entertainment = scores.entertainment || 0;
    const seniorTarget = scores.seniorTarget || 0;
    const storyFlow = scores.storyFlow || 0;
    const bounceRate = scores.bounceRate || 0;
    
    const bounceScore = 100 - bounceRate;
    
    // 고증 정확도 (수정 완료 후이므로 100%)
    const historicalAccuracy = 100;
    
    const average = Math.round((entertainment + seniorTarget + storyFlow + bounceScore + historicalAccuracy) / 5);
    const isPass = average >= 90;

    const getScoreClass = (score) => {
        if (score >= 95) return 'score-good';
        if (score >= 80) return 'score-warning';
        return 'score-danger';
    };

    let html = '<div class="score-grid">';

    html += `<div class="score-card ${getScoreClass(entertainment)}">
        <div class="score-value">${entertainment}</div>
        <div class="score-label">재미요소</div>
    </div>`;

    html += `<div class="score-card ${getScoreClass(seniorTarget)}">
        <div class="score-value">${seniorTarget}</div>
        <div class="score-label">시니어 타겟</div>
    </div>`;

    html += `<div class="score-card ${getScoreClass(storyFlow)}">
        <div class="score-value">${storyFlow}</div>
        <div class="score-label">이야기 흐름</div>
    </div>`;

    html += `<div class="score-card ${getScoreClass(bounceScore)}">
        <div class="score-value">${bounceScore}</div>
        <div class="score-label">시청자 이탈</div>
    </div>`;
    
    html += `<div class="score-card ${getScoreClass(historicalAccuracy)}" style="border: 2px solid #ff9800;">
        <div class="score-value" style="color: #4CAF50;">${historicalAccuracy}</div>
        <div class="score-label">고증 정확도</div>
        <div style="font-size: 11px; color: #888;">(${historicalIssueCount}건 수정됨)</div>
    </div>`;

    html += `<div class="score-card final-score ${isPass ? '' : 'fail'}">
        <div class="score-value">${average}</div>
        <div class="score-label">최종 점수</div>
        <div class="pass-badge ${isPass ? 'pass' : 'fail'}">${isPass ? '✅ 합격' : '❌ 불합격'}</div>
    </div>`;

    html += '</div>';
    container.innerHTML = html;
}

// ===================== 다운로드 =====================
function initDownloadButton() {
    const btn = document.getElementById('btn-download');
    btn.addEventListener('click', () => {
        const finalScript = state.stage2.revisedScript || state.stage1.revisedScript;
        if (!finalScript) {
            alert('다운로드할 수정본이 없습니다.');
            return;
        }

        const blob = new Blob([finalScript], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'MISLGOM_최종수정본.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
}

// ===================== HTML 이스케이프 =====================
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
