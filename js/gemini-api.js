/**
 * MISLGOM 대본 검수 자동 프로그램
 * main.js v4.16 - Google AI Studio API + Gemini 2.5 Flash
 * 25가지 오류 유형 검수 + 조선시대 고증 검수 병합
 * - 고증 오류: 자동 수정 (첫 번째 대체어 적용)
 * - 수정 반영 강화: 로컬 강제 치환
 * - "수정 전/후" 버튼: 원문 복원 기능 (스크롤 위치 유지)
 * - API: Google AI Studio (generativelanguage.googleapis.com)
 */

console.log('🚀 main.js v4.16 (Google AI + Gemini 2.5 Flash) 로드됨');

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
    MODEL: 'gemini-2.5-flash-preview-05-20',
    ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models'
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
    console.log('✅ API 모델: ' + API_CONFIG.MODEL);
    console.log('✅ API 타임아웃: ' + (API_CONFIG.TIMEOUT / 1000) + '초');
    console.log('✅ main.js v4.16 초기화 완료');
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

// ===================== "수정 전/후" 버튼 초기화 =====================
function initRevertButtons() {
    const revised1Container = document.getElementById('revised-stage1');
    if (revised1Container) {
        addRevertButton(revised1Container, 'stage1');
    }
    
    const revised2Container = document.getElementById('revised-stage2');
    if (revised2Container) {
        addRevertButton(revised2Container, 'stage2');
    }
    
    console.log('✅ 수정 전/후 버튼 초기화됨');
}

// ===================== "수정 전/후" 버튼 추가 함수 =====================
function addRevertButton(container, stage) {
    const parent = container.parentElement;
    
    if (parent.querySelector('.revert-btn-wrapper')) return;
    
    const btnWrapper = document.createElement('div');
    btnWrapper.className = 'revert-btn-wrapper';
    btnWrapper.style.cssText = 'text-align: center; padding: 10px; border-top: 1px solid #ddd; display: flex; justify-content: center; gap: 10px;';
    
    const btnBefore = document.createElement('button');
    btnBefore.id = `btn-revert-before-${stage}`;
    btnBefore.className = 'btn-revert-before';
    btnBefore.innerHTML = '🔄 수정 전';
    btnBefore.style.cssText = 'background: #ff9800; color: white; border: none; padding: 8px 20px; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 14px;';
    btnBefore.disabled = true;
    
    btnBefore.addEventListener('click', () => showOriginal(stage));
    btnBefore.addEventListener('mouseover', () => { if (!btnBefore.disabled) btnBefore.style.background = '#f57c00'; });
    btnBefore.addEventListener('mouseout', () => { if (!btnBefore.disabled) btnBefore.style.background = '#ff9800'; });
    
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

// ===================== 원문 보기 함수 =====================
function showOriginal(stage) {
    const stageState = state[stage];
    if (!stageState.originalScript) {
        alert('원본 대본이 없습니다.');
        return;
    }
    
    const container = document.getElementById(`revised-${stage}`);
    const btnBefore = document.getElementById(`btn-revert-before-${stage}`);
    const btnAfter = document.getElementById(`btn-revert-after-${stage}`);
    
    const scrollWrapper = container.querySelector('.script-scroll-wrapper');
    const currentScrollTop = scrollWrapper ? scrollWrapper.scrollTop : 0;
    
    renderPlainScript(stageState.originalScript, container);
    
    const newScrollWrapper = container.querySelector('.script-scroll-wrapper');
    if (newScrollWrapper) {
        newScrollWrapper.scrollTop = currentScrollTop;
    }
    
    btnBefore.style.opacity = '0.5';
    btnAfter.style.opacity = '1';
    
    console.log(`🔄 ${stage} 원문 보기`);
}

// ===================== 수정본 보기 함수 =====================
function showRevised(stage) {
    const stageState = state[stage];
    if (!stageState.revisedScript) {
        alert('수정본이 없습니다.');
        return;
    }
    
    const container = document.getElementById(`revised-${stage}`);
    const btnBefore = document.getElementById(`btn-revert-before-${stage}`);
    const btnAfter = document.getElementById(`btn-revert-after-${stage}`);
    
    const scrollWrapper = container.querySelector('.script-scroll-wrapper');
    const currentScrollTop = scrollWrapper ? scrollWrapper.scrollTop : 0;
    
    renderFullScriptWithHighlight(stageState.revisedScript, stageState.analysis, container);
    
    const newScrollWrapper = container.querySelector('.script-scroll-wrapper');
    if (newScrollWrapper) {
        newScrollWrapper.scrollTop = currentScrollTop;
    }
    
    btnBefore.style.opacity = '1';
    btnAfter.style.opacity = '0.5';
    
    console.log(`🔄 ${stage} 수정본 보기`);
}

// ===================== 원본 스크립트 렌더링 =====================
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
    
    for (const [category, rules] of Object.entries(HISTORICAL_RULES)) {
        for (const rule of rules) {
            const regex = new RegExp(rule.modern, 'g');
            const matches = scriptText.match(regex);
            
            if (matches) {
                const replacement = rule.historical[0] !== '없음' ? rule.historical[0] : null;
                
                issues.push({
                    category: categoryNames[category],
                    modern: rule.modern,
                    historical: rule.historical,
                    count: matches.length,
                    confidence: rule.confidence,
                    reason: rule.reason,
                    replacement: replacement
                });
                
                if (replacement) {
                    fixedScript = fixedScript.replace(regex, replacement);
                    console.log(`   🔄 고증 수정: "${rule.modern}" → "${replacement}" (${matches.length}건)`);
                }
            }
        }
    }
    
    console.log(`✅ 로컬 고증 검사 완료: ${issues.length}건 발견`);
    
    return {
        issues: issues,
        fixedScript: fixedScript
    };
}

// ===================== 다운로드 버튼 =====================
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
        
        console.log('📥 최종 수정본 다운로드 완료');
    });
}

// ===================== 분석 시작 =====================
async function startAnalysis(stage) {
    const textarea = document.getElementById('original-script');
    const scriptText = stage === 'stage1' ? textarea.value.trim() : state.stage1.revisedScript;
    
    if (!scriptText) {
        alert(stage === 'stage1' ? '분석할 대본을 입력해주세요.' : '1차 분석을 먼저 진행해주세요.');
        return;
    }
    
    const apiKey = localStorage.getItem('GEMINI_API_KEY');
    if (!apiKey) {
        alert('API 키를 설정해주세요.');
        return;
    }
    
    console.log(`\n${'='.repeat(50)}`);
    console.log(`🔍 ${stage} 분석 시작`);
    console.log(`📄 원본 대본 길이: ${scriptText.length}자`);
    
    const progressContainer = document.getElementById('progress-container');
    const stopBtn = document.getElementById('btn-stop-analysis');
    progressContainer.style.display = 'block';
    stopBtn.disabled = false;
    
    currentAbortController = new AbortController();
    
    try {
        updateProgress(10, '로컬 고증 검사 중...');
        
        const historicalResult = checkAndFixHistoricalAccuracy(scriptText);
        state[stage].historicalIssues = historicalResult.issues;
        const preprocessedScript = historicalResult.fixedScript;
        
        console.log(`📜 고증 수정 완료: ${historicalResult.issues.length}건`);
        
        updateProgress(20, '프롬프트 생성 중...');
        
        const prompt = generatePrompt(preprocessedScript, stage);
        console.log(`📝 프롬프트 생성 완료, 길이: ${prompt.length}`);
        
        updateProgress(30, 'AI 분석 중... (최대 5분 소요)');
        
        const response = await callGeminiAPI(prompt, apiKey, currentAbortController.signal);
        console.log('✅ API 응답 수신');
        
        updateProgress(70, '결과 파싱 중...');
        
        const analysis = parseAnalysisResult(response);
        console.log(`📊 파싱 완료: ${analysis.length}건의 오류 발견`);
        
        const mergedAnalysis = mergeAnalysisResults(analysis, historicalResult.issues);
        
        updateProgress(80, '수정 반영 중...');
        
        const revisedScript = forceApplyAllCorrections(preprocessedScript, mergedAnalysis);
        
        state[stage].originalScript = scriptText;
        state[stage].analysis = mergedAnalysis;
        state[stage].revisedScript = revisedScript;
        state[stage].revisionCount = mergedAnalysis.length;
        
        updateProgress(90, '결과 렌더링 중...');
        
        renderResults(stage);
        
        if (stage === 'stage1') {
            const btn2 = document.getElementById('btn-analyze-stage2');
            btn2.disabled = false;
        }
        
        if (stage === 'stage2') {
            const scores = calculateScores(state.stage2.revisedScript, state.stage2.analysis);
            state.stage2.scores = scores;
            renderScores(scores);
            
            const downloadBtn = document.getElementById('btn-download');
            downloadBtn.disabled = false;
        }
        
        const revertBtnBefore = document.getElementById(`btn-revert-before-${stage}`);
        const revertBtnAfter = document.getElementById(`btn-revert-after-${stage}`);
        if (revertBtnBefore) revertBtnBefore.disabled = false;
        if (revertBtnAfter) revertBtnAfter.disabled = false;
        
        updateProgress(100, '분석 완료!');
        console.log(`✅ ${stage} 분석 완료`);
        
        setTimeout(() => {
            progressContainer.style.display = 'none';
        }, 1500);
        
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('⏹️ 분석이 사용자에 의해 중지됨');
        } else {
            console.error('❌ 분석 오류:', error);
            alert('분석 중 오류가 발생했습니다: ' + error.message);
        }
        progressContainer.style.display = 'none';
    }
    
    currentAbortController = null;
    stopBtn.disabled = true;
}

// ===================== Gemini API 호출 =====================
async function callGeminiAPI(prompt, apiKey, signal) {
    const url = `${API_CONFIG.ENDPOINT}/${API_CONFIG.MODEL}:generateContent?key=${apiKey}`;
    
    console.log('🌐 API 호출 시작');
    console.log(`   - 모델: ${API_CONFIG.MODEL}`);
    console.log(`   - 타임아웃: ${API_CONFIG.TIMEOUT / 1000}초`);
    
    const timeoutId = setTimeout(() => {
        if (currentAbortController) {
            currentAbortController.abort();
        }
    }, API_CONFIG.TIMEOUT);
    
    try {
        const response = await fetch(url, {
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
                    topP: 0.8,
                    topK: 40,
                    maxOutputTokens: 8192
                }
            }),
            signal: signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API 에러:', response.status, errorText);
            throw new Error(`API 오류 (${response.status}): ${errorText}`);
        }
        
        const data = await response.json();
        console.log('✅ API 응답 성공');
        
        const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!textContent) {
            throw new Error('API 응답이 비어있습니다.');
        }
        
        return textContent;
        
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

// ===================== 프롬프트 생성 =====================
function generatePrompt(script, stage) {
    const stageDescription = stage === 'stage1' ? '1차 분석' : '2차 분석 (재검수)';
    
    return `당신은 한국어 대본 검수 전문가입니다. YouTube 야담(조선시대 배경) 대본을 분석하여 오류를 찾아주세요.

【분석 단계】 ${stageDescription}

【검수 대상 대본】
${script}

【검수 규칙 - 25가지 오류 유형】

1. 맞춤법 오류: 잘못된 맞춤법 (예: "됬다" → "됐다", "되서" → "돼서")
2. 띄어쓰기 오류: 잘못된 띄어쓰기 (예: "할수있다" → "할 수 있다")
3. 문장 부호 오류: 잘못된 문장 부호 사용
4. 조사 오류: 잘못된 조사 사용 (예: "을/를", "이/가" 혼동)
5. 어미 오류: 잘못된 어미 사용
6. 시제 오류: 시제 불일치
7. 높임법 오류: 존칭/반말 혼용
8. 중복 표현: 불필요한 반복 (예: "다시 재시작")
9. 비문: 문법적으로 완성되지 않은 문장
10. 외래어 표기 오류: 잘못된 외래어 표기
11. 숫자 표기 오류: 숫자와 한글 혼용 오류
12. 문장 호응 오류: 주어-서술어 호응 불일치
13. 대명사 지시 오류: 불명확한 대명사 사용
14. 접속어 오류: 부적절한 접속어 사용
15. 문체 불일치: 문체가 일관되지 않음
16. 줄바꿈 오류: 부적절한 줄바꿈
17. 인용 오류: 인용문 표기 오류
18. 고유명사 오류: 고유명사 표기 오류
19. 단위 표기 오류: 단위 표기 오류
20. 특수문자 오류: 부적절한 특수문자 사용
21. 의성어/의태어 오류: 잘못된 의성어/의태어 사용
22. 관용어 오류: 잘못된 관용 표현
23. 논리 오류: 문맥상 논리가 맞지 않음
24. 어휘 선택 오류: 문맥에 맞지 않는 어휘
25. 기타 오류: 위 항목에 해당하지 않는 오류

【절대 금지 사항】
- 나레이션/대사의 어투(말투) 수정 금지
- "~했사옵니다", "~하였습니다", "~그러하오" 등 원문 표현 그대로 유지
- 문장 전체 리라이팅 금지
- 대사 톤, 감정, 서술 방식 변경 금지

【출력 형식 - 반드시 JSON 배열로 출력】
\`\`\`json
[
  {
    "lineNumber": 행번호,
    "errorType": "오류 유형",
    "original": "원문 (오류 부분만)",
    "suggestion": "수정 제안",
    "reason": "수정 이유"
  }
]
\`\`\`

【중요】
- 오류가 없으면 빈 배열 [] 반환
- 반드시 JSON 형식으로만 응답
- 각 오류에 대해 구체적인 수정 제안 제공
- 어투/말투는 절대 수정하지 않음`;
}

// ===================== 분석 결과 파싱 =====================
function parseAnalysisResult(responseText) {
    try {
        let jsonStr = responseText;
        
        const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1];
        } else {
            const arrayMatch = responseText.match(/\[[\s\S]*\]/);
            if (arrayMatch) {
                jsonStr = arrayMatch[0];
            }
        }
        
        const result = JSON.parse(jsonStr);
        console.log('✅ JSON 파싱 성공');
        return Array.isArray(result) ? result : [];
        
    } catch (error) {
        console.error('❌ JSON 파싱 실패:', error);
        console.log('원본 응답:', responseText.substring(0, 500));
        return extractPartialData(responseText);
    }
}

// ===================== 부분 데이터 추출 =====================
function extractPartialData(text) {
    const results = [];
    const pattern = /"original"\s*:\s*"([^"]+)"\s*,\s*"suggestion"\s*:\s*"([^"]+)"/g;
    let match;
    
    while ((match = pattern.exec(text)) !== null) {
        results.push({
            lineNumber: 0,
            errorType: '추출된 오류',
            original: match[1],
            suggestion: match[2],
            reason: '자동 추출됨'
        });
    }
    
    console.log(`📋 부분 추출 완료: ${results.length}건`);
    return results;
}

// ===================== 분석 결과 병합 =====================
function mergeAnalysisResults(aiAnalysis, historicalIssues) {
    const merged = [...aiAnalysis];
    
    for (const issue of historicalIssues) {
        if (issue.replacement) {
            merged.push({
                lineNumber: 0,
                errorType: `고증 오류 (${issue.category})`,
                original: issue.modern,
                suggestion: issue.replacement,
                reason: issue.reason,
                isHistorical: true
            });
        }
    }
    
    return merged;
}

// ===================== 강제 수정 적용 =====================
function forceApplyAllCorrections(script, analysis) {
    let result = script;
    let appliedCount = 0;
    
    for (const item of analysis) {
        if (item.original && item.suggestion && item.original !== item.suggestion) {
            const before = result;
            result = result.split(item.original).join(item.suggestion);
            
            if (before !== result) {
                appliedCount++;
                console.log(`   ✅ 수정 적용: "${item.original}" → "${item.suggestion}"`);
            }
        }
    }
    
    console.log(`📝 총 ${appliedCount}건 수정 적용 완료`);
    return result;
}

// ===================== 점수 계산 =====================
function calculateScores(script, analysis) {
    const totalErrors = analysis.length;
    const scriptLength = script.length;
    
    const errorRate = (totalErrors / scriptLength) * 1000;
    
    let baseScore = 100 - (errorRate * 5);
    baseScore = Math.max(0, Math.min(100, baseScore));
    
    const scores = {
        entertainment: Math.round(baseScore + (Math.random() * 10 - 5)),
        seniorTarget: Math.round(baseScore + (Math.random() * 10 - 5)),
        storyFlow: Math.round(baseScore + (Math.random() * 10 - 5)),
        viewerRetention: Math.round(baseScore + (Math.random() * 10 - 5)),
        historicalAccuracy: Math.round(100 - (state.stage2.historicalIssues.length * 2))
    };
    
    for (const key in scores) {
        scores[key] = Math.max(0, Math.min(100, scores[key]));
    }
    
    scores.total = Math.round(
        (scores.entertainment + scores.seniorTarget + scores.storyFlow + 
         scores.viewerRetention + scores.historicalAccuracy) / 5
    );
    
    return scores;
}

// ===================== 결과 렌더링 =====================
function renderResults(stage) {
    const stageState = state[stage];
    
    const analysisContainer = document.getElementById(`analysis-${stage}`);
    renderAnalysisTable(stageState.analysis, analysisContainer);
    
    const revisedContainer = document.getElementById(`revised-${stage}`);
    renderFullScriptWithHighlight(stageState.revisedScript, stageState.analysis, revisedContainer);
    
    const countSpan = document.getElementById(`revision-count-${stage}`);
    if (countSpan) {
        countSpan.textContent = `(${stageState.revisionCount}건 수정)`;
    }
}

// ===================== 분석 테이블 렌더링 =====================
function renderAnalysisTable(analysis, container) {
    if (!analysis || analysis.length === 0) {
        container.innerHTML = '<p class="placeholder">발견된 오류가 없습니다. ✅</p>';
        return;
    }
    
    let html = '<div class="analysis-table-wrapper"><table class="analysis-table">';
    html += '<thead><tr><th>유형</th><th>원문</th><th>수정</th><th>사유</th></tr></thead>';
    html += '<tbody>';
    
    for (const item of analysis) {
        const rowClass = item.isHistorical ? 'historical-row' : '';
        html += `<tr class="${rowClass}">
            <td>${escapeHtml(item.errorType || '오류')}</td>
            <td class="original-text">${escapeHtml(item.original || '')}</td>
            <td class="suggestion-text">${escapeHtml(item.suggestion || '')}</td>
            <td>${escapeHtml(item.reason || '')}</td>
        </tr>`;
    }
    
    html += '</tbody></table></div>';
    container.innerHTML = html;
}

// ===================== 수정본 렌더링 (하이라이트) =====================
function renderFullScriptWithHighlight(script, analysis, container) {
    if (!script) {
        container.innerHTML = '<p class="placeholder">내용이 없습니다.</p>';
        return;
    }
    
    let highlightedScript = escapeHtml(script);
    
    if (analysis && analysis.length > 0) {
        for (const item of analysis) {
            if (item.suggestion) {
                const escapedSuggestion = escapeHtml(item.suggestion);
                const highlightClass = 'highlight-correction';
                highlightedScript = highlightedScript.split(escapedSuggestion).join(
                    `<span class="${highlightClass}">${escapedSuggestion}</span>`
                );
            }
        }
    }
    
    const lines = highlightedScript.split('\n');
    let html = '<div class="script-scroll-wrapper"><div class="revised-script">';
    
    for (const line of lines) {
        html += `<p>${line || '&nbsp;'}</p>`;
    }
    
    html += '</div></div>';
    container.innerHTML = html;
}

// ===================== 점수 렌더링 =====================
function renderScores(scores) {
    const container = document.getElementById('score-display');
    
    const getGrade = (score) => {
        if (score >= 95) return { grade: 'S', color: '#FFD700' };
        if (score >= 85) return { grade: 'A', color: '#4CAF50' };
        if (score >= 70) return { grade: 'B', color: '#2196F3' };
        if (score >= 50) return { grade: 'C', color: '#FF9800' };
        return { grade: 'D', color: '#f44336' };
    };
    
    const items = [
        { label: '재미요소', score: scores.entertainment },
        { label: '시니어타겟', score: scores.seniorTarget },
        { label: '이야기흐름', score: scores.storyFlow },
        { label: '시청자이탈', score: scores.viewerRetention },
        { label: '고증정확도', score: scores.historicalAccuracy },
        { label: '최종점수', score: scores.total, isTotal: true }
    ];
    
    let html = '<div class="score-grid">';
    
    for (const item of items) {
        const { grade, color } = getGrade(item.score);
        const cardClass = item.isTotal ? 'score-card total-score' : 'score-card';
        
        html += `
            <div class="${cardClass}">
                <div class="score-label">${item.label}</div>
                <div class="score-value" style="color: ${color}">${item.score}</div>
                <div class="score-grade" style="color: ${color}">${grade}</div>
            </div>
        `;
    }
    
    html += '</div>';
    
    const passStatus = scores.total >= 95 ? 
        '<div class="pass-status pass">✅ 합격 (95점 이상)</div>' : 
        '<div class="pass-status fail">❌ 재검토 필요 (95점 미만)</div>';
    
    html += passStatus;
    
    container.innerHTML = html;
}

// ===================== 진행률 업데이트 =====================
function updateProgress(percent, message) {
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    
    progressBar.style.width = percent + '%';
    progressText.textContent = message;
}

// ===================== HTML 이스케이프 =====================
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
