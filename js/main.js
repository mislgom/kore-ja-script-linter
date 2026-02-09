/**
 * MISLGOM 대본 검수 자동 프로그램
 * main.js v4.19 - Vertex AI API 키 + Gemini 2.5 Flash
 * - v4.19: 분석 결과 클릭 시 수정본 해당 위치로 이동 + 하이라이트
 */

console.log('🚀 main.js v4.19 (Vertex AI API 키 + Gemini 2.5 Flash) 로드됨');

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
    stage1: { originalScript: '', analysis: null, revisedScript: '', historicalIssues: [], allErrors: [], revisionCount: 0 },
    stage2: { originalScript: '', analysis: null, revisedScript: '', historicalIssues: [], allErrors: [], revisionCount: 0 }
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
    initAnalysisButtons();
    initDownloadButton();
    initRevertButtons();
    console.log('✅ 고증 DB 로드됨: ' + getTotalHistoricalRules() + '개 규칙');
    console.log('✅ API 타임아웃: ' + (API_CONFIG.TIMEOUT / 1000) + '초');
    console.log('✅ 모델: ' + API_CONFIG.MODEL);
    console.log('✅ main.js v4.19 초기화 완료');
    console.log('📌 v4.19 업데이트: 분석 결과 클릭 시 수정본 해당 위치로 이동 + 하이라이트');
}

function getTotalHistoricalRules() {
    let total = 0;
    for (const category in HISTORICAL_RULES) total += HISTORICAL_RULES[category].length;
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
            console.log('🔑 API 키 저장됨');
            alert('API 키가 저장되었습니다.');
            panel.style.display = 'none';
        } else alert('API 키를 입력해주세요.');
    });
    closeBtn.addEventListener('click', () => panel.style.display = 'none');
}

function validateApiKey(apiKey) {
    if (!apiKey) return { valid: false, message: 'API 키가 설정되지 않았습니다.' };
    console.log('🔑 API 키 검증: ' + apiKey.substring(0, 10) + '...');
    if (apiKey.length < 20) return { valid: false, message: 'API 키가 너무 짧습니다.' };
    console.log('✅ API 키 확인 완료');
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
        console.log('🗑️ 대본 삭제됨');
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
            console.log('📄 드래그 업로드:', file.name);
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

// ===================== 분석 버튼 =====================
function initAnalysisButtons() {
    document.getElementById('btn-analyze-stage1').addEventListener('click', () => startAnalysis('stage1'));
    document.getElementById('btn-analyze-stage2').addEventListener('click', () => startAnalysis('stage2'));
    document.getElementById('btn-stop-analysis').addEventListener('click', () => {
        if (currentAbortController) {
            currentAbortController.abort();
            currentAbortController = null;
            updateProgress(0, '분석 중지됨');
            document.getElementById('btn-stop-analysis').disabled = true;
            alert('분석이 중지되었습니다.');
            setTimeout(() => document.getElementById('progress-container').style.display = 'none', 1000);
        }
    });
    console.log('✅ 1차 분석 버튼 연결됨');
    console.log('✅ 2차 분석 버튼 연결됨');
    console.log('✅ 중지 버튼 연결됨');
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
    wrapper.style.cssText = 'text-align:center;padding:10px;border-top:1px solid #ddd;display:flex;justify-content:center;gap:10px;';

    const btnBefore = document.createElement('button');
    btnBefore.id = 'btn-revert-before-' + stage;
    btnBefore.innerHTML = '🔄 수정 전';
    btnBefore.style.cssText = 'background:#ff9800;color:white;border:none;padding:8px 20px;border-radius:5px;cursor:pointer;font-weight:bold;';
    btnBefore.disabled = true;
    btnBefore.addEventListener('click', () => showOriginal(stage));

    const btnAfter = document.createElement('button');
    btnAfter.id = 'btn-revert-after-' + stage;
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
    renderPlainScript(s.originalScript, document.getElementById('revised-' + stage));
    document.getElementById('btn-revert-before-' + stage).style.opacity = '0.5';
    document.getElementById('btn-revert-after-' + stage).style.opacity = '1';
}

function showRevised(stage) {
    const s = state[stage];
    if (!s.revisedScript) return alert('수정본이 없습니다.');
    renderRevisedWithMarkers(s.revisedScript, s.allErrors, document.getElementById('revised-' + stage), stage);
    document.getElementById('btn-revert-before-' + stage).style.opacity = '1';
    document.getElementById('btn-revert-after-' + stage).style.opacity = '0.5';
}

function renderPlainScript(script, container) {
    if (!script) { container.innerHTML = '<p class="placeholder">내용이 없습니다.</p>'; return; }
    let html = '<div class="script-scroll-wrapper"><div class="revised-script">';
    script.split('\n').forEach(line => html += '<p class="line-unchanged">' + escapeHtml(line) + '</p>');
    html += '</div></div>';
    container.innerHTML = html;
}

// ===================== 고증 검사 =====================
function checkAndFixHistoricalAccuracy(scriptText) {
    console.log('📜 고증 검사 시작');
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
                if (replacement) fixedScript = fixedScript.replace(regex, replacement);
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
    console.log('📜 고증 검사 완료: ' + issues.length + '개 발견');
    return { issues, fixedScript };
}

// ===================== API 호출 =====================
async function callGeminiAPI(prompt, apiKey) {
    const url = API_CONFIG.ENDPOINT + '/' + API_CONFIG.MODEL + ':generateContent?key=' + apiKey;
    console.log('📡 API 호출 시작');
    console.log('   - 모델: ' + API_CONFIG.MODEL);
    console.log('   - 프롬프트: ' + prompt.length + '자');

    currentAbortController = new AbortController();
    const timeoutId = setTimeout(() => { if (currentAbortController) currentAbortController.abort(); }, API_CONFIG.TIMEOUT);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.1, topP: 0.8, topK: 40, maxOutputTokens: API_CONFIG.MAX_OUTPUT_TOKENS }
            }),
            signal: currentAbortController.signal
        });
        clearTimeout(timeoutId);
        console.log('📡 응답: ' + response.status);
        if (!response.ok) throw new Error('API 오류: ' + response.status);
        const data = await response.json();
        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0].text) {
            const text = data.candidates[0].content.parts[0].text;
            console.log('   - 응답 길이: ' + text.length + '자');
            return text;
        }
        throw new Error('응답 형식 오류');
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

// ===================== 분석 시작 =====================
async function startAnalysis(stage) {
    const apiKey = localStorage.getItem('GEMINI_API_KEY');
    const validation = validateApiKey(apiKey);
    if (!validation.valid) return alert(validation.message);

    const textarea = document.getElementById('original-script');
    const scriptText = stage === 'stage1' ? textarea.value.trim() : state.stage1.revisedScript;
    if (!scriptText) return alert(stage === 'stage1' ? '대본을 입력해주세요.' : '1차 분석을 먼저 진행해주세요.');

    console.log('\n' + '='.repeat(50));
    console.log('🔍 ' + (stage === 'stage1' ? '1차' : '2차') + ' 분석 시작 (' + scriptText.length + '자)');
    console.log('='.repeat(50));

    state[stage].originalScript = scriptText;
    const progressContainer = document.getElementById('progress-container');
    const stopBtn = document.getElementById('btn-stop-analysis');
    progressContainer.style.display = 'block';
    stopBtn.disabled = false;

    try {
        updateProgress(10, '준비 중...');
        updateProgress(20, '고증 검사 중...');
        const histResult = checkAndFixHistoricalAccuracy(scriptText);
        state[stage].historicalIssues = histResult.issues;

        updateProgress(40, 'AI 분석 중...');
        const prompt = buildAnalysisPrompt(histResult.fixedScript);
        const response = await callGeminiAPI(prompt, apiKey);

        updateProgress(70, '응답 분석 중...');
        const aiErrors = parseAnalysisResponse(response);

        // 통합 오류 목록
        const allErrors = [];
        let errorIndex = 0;
        
        for (const h of histResult.issues) {
            allErrors.push({
                index: errorIndex++,
                line: '-',
                type: h.type,
                original: h.original,
                corrected: h.corrected,
                reason: h.reason + ' (' + h.count + '회)'
            });
        }
        for (const e of aiErrors) {
            allErrors.push({
                index: errorIndex++,
                line: e.line || '-',
                type: e.type || '기타',
                original: e.original || '',
                corrected: e.corrected || '',
                reason: e.reason || ''
            });
        }

        state[stage].analysis = { errors: aiErrors };
        state[stage].allErrors = allErrors;

        updateProgress(80, '수정본 생성 중...');
        const revisedScript = applyAllCorrections(histResult.fixedScript, aiErrors);
        state[stage].revisedScript = revisedScript;
        state[stage].revisionCount = allErrors.length;

        updateProgress(90, '결과 표시 중...');
        renderAnalysisResult(stage, allErrors);
        renderRevisedWithMarkers(revisedScript, allErrors, document.getElementById('revised-' + stage), stage);

        if (stage === 'stage1') document.getElementById('btn-analyze-stage2').disabled = false;

        // 버튼 활성화
        const btnBefore = document.getElementById('btn-revert-before-' + stage);
        const btnAfter = document.getElementById('btn-revert-after-' + stage);
        if (btnBefore) { btnBefore.disabled = false; btnBefore.style.opacity = '1'; }
        if (btnAfter) { btnAfter.disabled = false; btnAfter.style.opacity = '0.5'; }

        const countEl = document.getElementById('revision-count-' + stage);
        if (countEl) countEl.textContent = '수정: ' + allErrors.length + '건';

        updateProgress(100, '분석 완료!');
        setTimeout(() => progressContainer.style.display = 'none', 1000);
        console.log('✅ ' + stage + ' 분석 완료: ' + allErrors.length + '건');

    } catch (error) {
        console.error('❌ 분석 오류:', error);
        alert('분석 중 오류: ' + error.message);
        setTimeout(() => progressContainer.style.display = 'none', 2000);
    }

    stopBtn.disabled = true;
    currentAbortController = null;
}

// ===================== 프롬프트 =====================
function buildAnalysisPrompt(script) {
    return '당신은 한국어 대본 검수 전문가입니다.\n\n대본에서 오류를 찾아 JSON 배열로만 응답하세요.\n\n[검수 항목]\n오타/맞춤법, 띄어쓰기, 문법, 어색한 표현, 중복 표현, 비문, 주어-서술어 불일치, 시제 불일치, 존댓말/반말 혼용, 조사 오류, 접속사 오용, 문장부호 오류\n\n[출력 형식]\n[{"line":1,"type":"유형","original":"원본","corrected":"수정","reason":"이유"}]\n\n오류 없으면 []\n\n[대본]\n' + script;
}

// ===================== 응답 파싱 =====================
function parseAnalysisResponse(response) {
    console.log('📝 응답 파싱, 길이:', response.length);
    try {
        let jsonStr = response.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
        const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
        if (arrayMatch) jsonStr = arrayMatch[0];

        try {
            const parsed = JSON.parse(jsonStr);
            console.log('✅ JSON 파싱 성공:', parsed.length + '개');
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            console.log('⚠️ JSON 복구 시도...');
        }

        // 정규식으로 추출
        const completeObjects = [];
        const regex = /\{\s*"line"\s*:\s*(\d+|"-?")\s*,\s*"type"\s*:\s*"([^"]*)"\s*,\s*"original"\s*:\s*"([^"]*)"\s*,\s*"corrected"\s*:\s*"([^"]*)"\s*,\s*"reason"\s*:\s*"([^"]*)"\s*\}/g;
        let match;
        while ((match = regex.exec(response)) !== null) {
            completeObjects.push({
                line: isNaN(parseInt(match[1])) ? '-' : parseInt(match[1]),
                type: match[2], original: match[3], corrected: match[4], reason: match[5]
            });
        }
        if (completeObjects.length > 0) {
            console.log('✅ 정규식 추출:', completeObjects.length + '개');
            return completeObjects;
        }
        console.log('❌ 파싱 실패');
        return [];
    } catch (error) {
        console.error('❌ 파싱 오류:', error);
        return [];
    }
}

// ===================== 수정 적용 =====================
function applyAllCorrections(script, aiErrors) {
    if (!aiErrors || aiErrors.length === 0) { console.log('📝 AI 수정 없음'); return script; }
    let result = script;
    let count = 0;
    for (const e of aiErrors) {
        if (e.original && e.corrected && e.original !== e.corrected && result.includes(e.original)) {
            result = result.replace(e.original, e.corrected);
            count++;
            console.log('   ✏️ "' + e.original + '" → "' + e.corrected + '"');
        }
    }
    console.log('📝 수정 적용: ' + count + '/' + aiErrors.length + '건');
    return result;
}

// ===================== 분석 결과 렌더링 (클릭 가능) =====================
function renderAnalysisResult(stage, allErrors) {
    const container = document.getElementById('analysis-' + stage);
    if (!allErrors || allErrors.length === 0) {
        container.innerHTML = '<div class="analysis-result"><p class="no-issues">✅ 발견된 오류가 없습니다.</p></div>';
        return;
    }

    let html = '<div class="analysis-result">';
    html += '<h4>📋 검수 결과 (총 ' + allErrors.length + '건) <small style="color:#888;">- 클릭하면 해당 위치로 이동</small></h4>';
    html += '<div class="error-list-container" style="max-height:400px;overflow-y:auto;">';

    for (const e of allErrors) {
        html += '<div class="error-item" data-stage="' + stage + '" data-index="' + e.index + '" data-corrected="' + escapeHtml(e.corrected) + '" ';
        html += 'style="padding:10px;margin:5px 0;border:1px solid #444;border-radius:5px;cursor:pointer;transition:background 0.2s;" ';
        html += 'onmouseover="this.style.background=\'#2a2a2a\'" onmouseout="this.style.background=\'transparent\'">';
        html += '<div style="display:flex;gap:10px;flex-wrap:wrap;">';
        html += '<span style="background:#666;padding:2px 8px;border-radius:3px;font-size:12px;">' + e.line + '</span>';
        html += '<span style="background:#1976D2;padding:2px 8px;border-radius:3px;font-size:12px;color:white;">' + escapeHtml(e.type) + '</span>';
        html += '</div>';
        html += '<div style="margin-top:8px;">';
        html += '<span style="color:#ff6b6b;text-decoration:line-through;">' + escapeHtml(e.original) + '</span>';
        html += '<span style="margin:0 8px;">→</span>';
        html += '<span style="color:#51cf66;font-weight:bold;">' + escapeHtml(e.corrected) + '</span>';
        html += '</div>';
        html += '<div style="margin-top:5px;font-size:12px;color:#888;">' + escapeHtml(e.reason) + '</div>';
        html += '</div>';
    }

    html += '</div></div>';
    container.innerHTML = html;

    // 클릭 이벤트 추가
    container.querySelectorAll('.error-item').forEach(item => {
        item.addEventListener('click', function() {
            const stg = this.getAttribute('data-stage');
            const idx = parseInt(this.getAttribute('data-index'));
            const corrected = this.getAttribute('data-corrected');
            scrollToErrorInRevised(stg, idx, corrected);
        });
    });
}

// ===================== 수정본 렌더링 (마커 포함) =====================
function renderRevisedWithMarkers(script, allErrors, container, stage) {
    if (!script) { container.innerHTML = '<p class="placeholder">내용이 없습니다.</p>'; return; }

    let markedScript = script;
    const markers = [];

    for (const e of allErrors) {
        if (e.corrected && e.corrected !== '(대체어 없음)' && markedScript.includes(e.corrected)) {
            const placeholder = '%%MARKER' + e.index + '%%';
            markedScript = markedScript.replace(e.corrected, placeholder);
            markers.push({ index: e.index, corrected: e.corrected });
        }
    }

    let html = '<div class="script-scroll-wrapper" id="scroll-wrapper-' + stage + '"><div class="revised-script">';
    const lines = markedScript.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        // 마커를 실제 HTML로 변환
        for (const m of markers) {
            const placeholder = '%%MARKER' + m.index + '%%';
            if (line.includes(placeholder)) {
                const markerHtml = '<mark class="correction-marker" data-index="' + m.index + '" id="marker-' + stage + '-' + m.index + '" style="background:transparent;transition:background 0.3s;padding:2px 0;">' + escapeHtml(m.corrected) + '</mark>';
                line = line.replace(placeholder, markerHtml);
            }
        }
        html += '<p class="line-unchanged" data-line="' + (i + 1) + '">' + (line || '&nbsp;') + '</p>';
    }
    
    html += '</div></div>';
    container.innerHTML = html;
}

// ===================== 클릭 시 해당 위치로 이동 + 하이라이트 =====================
function scrollToErrorInRevised(stage, index, correctedText) {
    console.log('🎯 이동: ' + stage + ', index=' + index + ', text="' + correctedText + '"');

    const scrollWrapper = document.getElementById('scroll-wrapper-' + stage);
    const marker = document.getElementById('marker-' + stage + '-' + index);

    // 기존 하이라이트 제거
    document.querySelectorAll('.correction-marker').forEach(function(m) {
        m.style.background = 'transparent';
    });

    if (marker && scrollWrapper) {
        // 하이라이트 적용
        marker.style.background = '#a8e6cf';
        marker.style.padding = '2px 4px';
        marker.style.borderRadius = '3px';

        // 스크롤 이동
        const markerRect = marker.getBoundingClientRect();
        const wrapperRect = scrollWrapper.getBoundingClientRect();
        const scrollTop = scrollWrapper.scrollTop + (markerRect.top - wrapperRect.top) - (wrapperRect.height / 2);
        
        scrollWrapper.scrollTo({
            top: scrollTop,
            behavior: 'smooth'
        });

        // 3초 후 하이라이트 제거
        setTimeout(function() {
            marker.style.background = 'transparent';
        }, 3000);
    } else {
        // 마커가 없으면 텍스트 검색으로 찾기
        const revisedContainer = document.getElementById('revised-' + stage);
        const paragraphs = revisedContainer.querySelectorAll('p');
        
        for (let i = 0; i < paragraphs.length; i++) {
            const p = paragraphs[i];
            if (p.textContent.includes(correctedText)) {
                const originalBg = p.style.background;
                p.style.background = '#a8e6cf';
                p.style.transition = 'background 0.3s';
                
                p.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                setTimeout(function() {
                    p.style.background = originalBg || 'transparent';
                }, 3000);
                break;
            }
        }
    }
}

// ===================== 유틸리티 =====================
function updateProgress(percent, text) {
    const bar = document.getElementById('progress-bar');
    const txt = document.getElementById('progress-text');
    if (bar) bar.style.width = percent + '%';
    if (txt) txt.textContent = text;
    console.log('📊 ' + percent + '% - ' + text);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===================== 다운로드 =====================
function initDownloadButton() {
    document.getElementById('btn-download').addEventListener('click', function() {
        const script = state.stage2.revisedScript || state.stage1.revisedScript;
        if (!script) return alert('다운로드할 수정본이 없습니다.');
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
