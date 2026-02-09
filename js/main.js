/**
 * MISLGOM 대본 검수 자동 프로그램
 * main.js v4.25 - Vertex AI API 키 + Gemini 2.5 Flash
 * - v4.25: 대본 분석 점수 + 최종 픽스 + 다운로드 기능
 */

console.log('🚀 main.js v4.25 (Vertex AI API 키 + Gemini 2.5 Flash) 로드됨');

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
    stage1: { originalScript: '', analysis: null, revisedScript: '', historicalIssues: [], allErrors: [], revisionCount: 0, scrollPosition: 0, fixedScript: '' },
    stage2: { originalScript: '', analysis: null, revisedScript: '', historicalIssues: [], allErrors: [], revisionCount: 0, scrollPosition: 0, fixedScript: '' },
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
    console.log('✅ 고증 DB 로드됨: ' + getTotalHistoricalRules() + '개 규칙');
    console.log('✅ API 타임아웃: ' + (API_CONFIG.TIMEOUT / 1000) + '초');
    console.log('✅ 모델: ' + API_CONFIG.MODEL);
    console.log('✅ main.js v4.25 초기화 완료');
}

function getTotalHistoricalRules() {
    let total = 0;
    for (const category in HISTORICAL_RULES) total += HISTORICAL_RULES[category].length;
    return total;
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

// ===================== 다운로드 (기존) =====================
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
    const blob = new Blob([script], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const today = new Date().toISOString().slice(0, 10);
    a.download = '최종수정본_' + today + '.txt';
    a.click();
    URL.revokeObjectURL(url);
}

// ===================== 최종 수정본 다운로드 섹션 =====================
function initFinalDownloadSection() {
    const scoreSection = document.getElementById('score-section');
    if (!scoreSection) return;
    
    const parent = scoreSection.parentElement;
    
    // 기존 다운로드 섹션 제거
    const existing = parent.querySelector('.final-download-section');
    if (existing) existing.remove();
    
    const section = document.createElement('div');
    section.className = 'final-download-section';
    section.style.cssText = 'text-align:center;padding:20px;margin-top:20px;background:#1e1e1e;border-radius:10px;display:none;';
    section.innerHTML = `
        <h3 style="color:#4CAF50;margin-bottom:15px;">📥 최종 수정본 다운로드</h3>
        <p style="color:#aaa;margin-bottom:15px;">픽스 완료된 최종 대본을 다운로드합니다.</p>
        <button id="btn-final-download" style="background:#4CAF50;color:white;border:none;padding:15px 40px;border-radius:8px;cursor:pointer;font-weight:bold;font-size:16px;">
            📥 최종 수정본 다운로드
        </button>
    `;
    
    parent.appendChild(section);
    
    document.getElementById('btn-final-download').addEventListener('click', () => {
        if (state.finalScript) {
            downloadScript(state.finalScript);
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
    
    // 대본 픽스 버튼 추가
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
        // 2차 분석 시작 버튼 활성화
        const btn2 = document.getElementById('btn-start-stage2');
        if (btn2) {
            btn2.disabled = false;
            btn2.style.opacity = '1';
        }
        alert('1차 대본이 픽스되었습니다!\n\n이제 "2차 분석 시작" 버튼을 눌러 2차 분석을 진행하세요.');
    } else if (stage === 'stage2') {
        // 최종 픽스
        state.finalScript = s.revisedScript;
        
        // 최종 다운로드 섹션 표시
        const downloadSection = document.querySelector('.final-download-section');
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
    
    console.log('🔍 2차 분석 시작 (픽스된 대본 사용): ' + fixedScript.length + '자');
    startAnalysis('stage2', fixedScript);
}

function showOriginal(stage) {
    const s = state[stage];
    if (!s.originalScript) return alert('원본이 없습니다.');
    
    const container = document.getElementById('revised-' + stage);
    const scrollWrapper = container.querySelector('.script-scroll-wrapper');
    if (scrollWrapper) s.scrollPosition = scrollWrapper.scrollTop;
    
    renderPlainScript(s.originalScript, container, s.allErrors, 'original');
    
    setTimeout(() => {
        const newWrapper = container.querySelector('.script-scroll-wrapper');
        if (newWrapper && s.scrollPosition) newWrapper.scrollTop = s.scrollPosition;
    }, 10);
    
    document.getElementById('btn-revert-before-' + stage).style.opacity = '0.5';
    document.getElementById('btn-revert-after-' + stage).style.opacity = '1';
}

function showRevised(stage) {
    const s = state[stage];
    if (!s.revisedScript) return alert('수정본이 없습니다.');
    
    const container = document.getElementById('revised-' + stage);
    const scrollWrapper = container.querySelector('.script-scroll-wrapper');
    if (scrollWrapper) s.scrollPosition = scrollWrapper.scrollTop;
    
    renderRevisedWithMarkers(s.revisedScript, s.allErrors, container, stage);
    
    setTimeout(() => {
        const newWrapper = container.querySelector('.script-scroll-wrapper');
        if (newWrapper && s.scrollPosition) newWrapper.scrollTop = s.scrollPosition;
    }, 10);
    
    document.getElementById('btn-revert-before-' + stage).style.opacity = '1';
    document.getElementById('btn-revert-after-' + stage).style.opacity = '0.5';
}

function renderPlainScript(script, container, allErrors, mode) {
    if (!script) { container.innerHTML = '<p style="color:#888;text-align:center;padding:20px;">내용이 없습니다.</p>'; return; }
    
    let html = '<div class="script-scroll-wrapper" style="max-height:400px;overflow-y:auto;padding:15px;background:#2d2d2d;border-radius:8px;">';
    html += '<div class="revised-script" style="color:#ffffff;font-size:14px;line-height:1.8;">';
    
    let content = script;
    if (mode === 'original' && allErrors && allErrors.length > 0) {
        for (const err of allErrors) {
            if (err.original && err.original.trim()) {
                const regex = new RegExp(escapeRegex(err.original), 'g');
                content = content.replace(regex, '<<<ERR_' + err.index + '>>>' + err.original + '<<</ERR>>>');
            }
        }
    }
    
    content = escapeHtml(content);
    content = content.replace(/&lt;&lt;&lt;ERR_(\d+)&gt;&gt;&gt;(.*?)&lt;&lt;&lt;\/ERR&gt;&gt;&gt;/g, '<mark class="error-original" data-error-index="$1" style="background:#ffcdd2;color:#b71c1c;padding:1px 4px;border-radius:3px;cursor:pointer;">$2</mark>');
    
    content.split('\n').forEach(line => {
        html += '<p style="margin:5px 0;">' + (line || '&nbsp;') + '</p>';
    });
    
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
            const regex = new RegExp(escapeRegex(rule.modern), 'g');
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
    console.log('📜 고증 검사 완료: ' + issues.length + '개 발견');
    return { issues, fixedScript };
}

// ===================== API 호출 =====================
async function callGeminiAPI(prompt, apiKey) {
    const url = API_CONFIG.ENDPOINT + '/' + API_CONFIG.MODEL + ':generateContent?key=' + apiKey;
    console.log('📡 API 호출 시작');

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
        if (!response.ok) throw new Error('API 오류: ' + response.status);
        const data = await response.json();
        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0].text) {
            return data.candidates[0].content.parts[0].text;
        }
        throw new Error('응답 형식 오류');
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

// ===================== 프롬프트 생성 =====================
function buildAnalysisPrompt(scriptText) {
    return `당신은 한국어 대본 교정 전문가입니다. 아래 대본에서 오류를 찾아 JSON 배열로만 응답하세요.

검사 항목:
1. 맞춤법 오류
2. 띄어쓰기 오류  
3. 문장부호 누락/오류
4. 어색한 표현
5. 문법 오류

출력 형식 (JSON 배열만, 다른 텍스트 없이):
[{"line":"1","type":"띄어쓰기","original":"오류텍스트","corrected":"수정텍스트","reason":"이유"}]

오류가 없으면: []

대본:
${scriptText}`;
}

// ===================== 점수 분석 프롬프트 =====================
function buildScorePrompt(scriptText) {
    return `당신은 시니어 대상 오디오 드라마 대본 평가 전문가입니다. 아래 대본을 분석하여 JSON 형식으로만 응답하세요.

평가 기준 (각 항목 0~100점):
1. 시니어 적합성: 시니어가 이해하기 쉬운 단어, 적절한 문장 길이, 명확한 표현
2. 재미요소: 흥미로운 전개, 유머, 감동, 반전 요소
3. 이야기 흐름: 논리적 전개, 자연스러운 장면 전환, 일관성
4. 시청자 유지: 몰입도, 지루하지 않은 전개, 긴장감 유지

출력 형식 (JSON만, 다른 텍스트 없이):
{
  "senior": 점수,
  "fun": 점수,
  "flow": 점수,
  "retention": 점수,
  "seniorComment": "시니어 적합성 개선점",
  "funComment": "재미요소 개선점",
  "flowComment": "이야기 흐름 개선점",
  "retentionComment": "시청자 유지 개선점"
}

대본:
${scriptText}`;
}

// ===================== 응답 파싱 =====================
function parseAnalysisResponse(response) {
    try {
        let jsonStr = '';
        const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (codeBlockMatch) {
            jsonStr = codeBlockMatch[1].trim();
        } else {
            const arrayMatch = response.match(/\[[\s\S]*?\]/);
            if (arrayMatch) jsonStr = arrayMatch[0];
        }
        
        if (!jsonStr) return [];
        
        try {
            const parsed = JSON.parse(jsonStr);
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            const objects = [];
            const regex = /\{[^{}]*"original"\s*:\s*"([^"]+)"[^{}]*"corrected"\s*:\s*"([^"]+)"[^{}]*\}/g;
            let match;
            while ((match = regex.exec(response)) !== null) {
                try { objects.push(JSON.parse(match[0])); } catch (e2) {}
            }
            return objects;
        }
    } catch (error) {
        return [];
    }
}

function parseScoreResponse(response) {
    try {
        let jsonStr = '';
        const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (codeBlockMatch) {
            jsonStr = codeBlockMatch[1].trim();
        } else {
            const objMatch = response.match(/\{[\s\S]*\}/);
            if (objMatch) jsonStr = objMatch[0];
        }
        
        if (!jsonStr) return null;
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error('점수 파싱 오류:', error);
        return null;
    }
}

// ===================== 분석 시작 =====================
async function startAnalysis(stage, customScript) {
    const apiKey = localStorage.getItem('GEMINI_API_KEY');
    const validation = validateApiKey(apiKey);
    if (!validation.valid) return alert(validation.message);

    let scriptText;
    if (customScript) {
        scriptText = customScript;
    } else if (stage === 'stage1') {
        scriptText = document.getElementById('original-script').value.trim();
    } else {
        scriptText = state.stage1.fixedScript || state.stage1.revisedScript;
    }
    
    if (!scriptText) {
        return alert(stage === 'stage1' ? '대본을 입력해주세요.' : '1차 분석 후 대본 픽스를 먼저 진행해주세요.');
    }

    console.log('🔍 ' + (stage === 'stage1' ? '1차' : '2차') + ' 분석 시작 (' + scriptText.length + '자)');

    state[stage].originalScript = scriptText;
    const progressContainer = document.getElementById('progress-container');
    const stopBtn = document.getElementById('btn-stop-analysis');
    progressContainer.style.display = 'block';
    if (stopBtn) stopBtn.disabled = false;

    try {
        updateProgress(10, '준비 중...');
        
        updateProgress(20, '고증 검사 중...');
        const histResult = checkAndFixHistoricalAccuracy(scriptText);
        state[stage].historicalIssues = histResult.issues;

        updateProgress(40, 'AI 분석 중... (최대 5분)');
        const prompt = buildAnalysisPrompt(histResult.fixedScript);
        const response = await callGeminiAPI(prompt, apiKey);

        updateProgress(70, '응답 분석 중...');
        const aiErrors = parseAnalysisResponse(response);

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
            if (e.original && e.corrected && e.original !== e.corrected) {
                allErrors.push({
                    index: errorIndex++,
                    line: e.line || '-',
                    type: e.type || '기타',
                    original: e.original,
                    corrected: e.corrected,
                    reason: e.reason || ''
                });
            }
        }

        state[stage].analysis = { errors: aiErrors };
        state[stage].allErrors = allErrors;

        updateProgress(80, '수정본 생성 중...');
        let revisedScript = histResult.fixedScript;
        
        for (const err of aiErrors) {
            if (err.original && err.corrected && err.original !== err.corrected) {
                const regex = new RegExp(escapeRegex(err.original), 'g');
                revisedScript = revisedScript.replace(regex, err.corrected);
            }
        }
        
        state[stage].revisedScript = revisedScript;
        state[stage].revisionCount = allErrors.length;

        updateProgress(90, '결과 표시 중...');
        renderAnalysisResult(stage, allErrors);
        renderRevisedWithMarkers(revisedScript, allErrors, document.getElementById('revised-' + stage), stage);

        // 버튼 활성화
        const btnBefore = document.getElementById('btn-revert-before-' + stage);
        const btnAfter = document.getElementById('btn-revert-after-' + stage);
        const btnFix = document.getElementById('btn-fix-script-' + stage);
        if (btnBefore) { btnBefore.disabled = false; btnBefore.style.opacity = '1'; }
        if (btnAfter) { btnAfter.disabled = false; btnAfter.style.opacity = '0.5'; }
        if (btnFix) { btnFix.disabled = false; }

        // 2차 분석 완료 시 점수 분석
        if (stage === 'stage2') {
            updateProgress(95, '대본 점수 분석 중...');
            await analyzeScore(revisedScript, apiKey);
        }

        updateProgress(100, '분석 완료!');
        setTimeout(() => progressContainer.style.display = 'none', 1500);
        console.log('✅ ' + stage + ' 분석 완료!');

    } catch (error) {
        console.error('❌ 분석 오류:', error);
        alert(error.name === 'AbortError' ? '분석이 중지되었습니다.' : '분석 중 오류: ' + error.message);
        progressContainer.style.display = 'none';
    }

    if (stopBtn) stopBtn.disabled = true;
    currentAbortController = null;
}

// ===================== 점수 분석 =====================
async function analyzeScore(scriptText, apiKey) {
    try {
        console.log('📊 점수 분석 시작');
        const prompt = buildScorePrompt(scriptText);
        const response = await callGeminiAPI(prompt, apiKey);
        const scores = parseScoreResponse(response);
        
        if (scores) {
            state.scores = scores;
            renderScoreResult(scores);
            console.log('📊 점수 분석 완료');
        } else {
            console.log('⚠️ 점수 파싱 실패');
            renderScoreResult(null);
        }
    } catch (error) {
        console.error('점수 분석 오류:', error);
        renderScoreResult(null);
    }
}

// ===================== 점수 결과 렌더링 =====================
function renderScoreResult(scores) {
    const container = document.getElementById('score-section');
    if (!container) return;
    
    if (!scores) {
        container.innerHTML = '<div style="text-align:center;padding:20px;color:#ff9800;">⚠️ 점수 분석에 실패했습니다. 다시 시도해주세요.</div>';
        return;
    }
    
    const senior = scores.senior || 0;
    const fun = scores.fun || 0;
    const flow = scores.flow || 0;
    const retention = scores.retention || 0;
    const average = Math.round((senior + fun + flow + retention) / 4);
    const passed = average >= 95;
    
    let html = '<div style="background:#2d2d2d;border-radius:10px;padding:20px;">';
    
    // 최종 판정
    html += '<div style="text-align:center;margin-bottom:20px;">';
    html += '<div style="font-size:48px;font-weight:bold;color:' + (passed ? '#4CAF50' : '#f44336') + ';">' + average + '점</div>';
    html += '<div style="font-size:24px;font-weight:bold;color:' + (passed ? '#4CAF50' : '#f44336') + ';margin-top:10px;">';
    html += passed ? '🎉 합격!' : '❌ 불합격';
    html += '</div>';
    html += '<div style="color:#888;margin-top:5px;">(95점 이상 합격)</div>';
    html += '</div>';
    
    // 개별 점수
    html += '<div style="display:grid;grid-template-columns:repeat(2, 1fr);gap:15px;margin-bottom:20px;">';
    
    html += renderScoreItem('👴 시니어 적합', senior);
    html += renderScoreItem('🎭 재미요소', fun);
    html += renderScoreItem('📖 이야기 흐름', flow);
    html += renderScoreItem('👀 시청자 유지', retention);
    
    html += '</div>';
    
    // 개선방안
    html += '<div style="background:#1e1e1e;border-radius:8px;padding:15px;margin-top:20px;">';
    html += '<h4 style="color:#ffeb3b;margin-bottom:15px;">📝 95점 달성을 위한 개선방안</h4>';
    
    if (senior < 95) {
        html += '<div style="margin-bottom:12px;padding:10px;background:#2d2d2d;border-radius:5px;border-left:3px solid #ce93d8;">';
        html += '<strong style="color:#ce93d8;">시니어 적합 (' + senior + '점 → 95점)</strong>';
        html += '<p style="color:#ccc;margin-top:5px;font-size:13px;">' + (scores.seniorComment || '시니어가 이해하기 쉬운 단어와 짧은 문장을 사용하세요.') + '</p>';
        html += '</div>';
    }
    
    if (fun < 95) {
        html += '<div style="margin-bottom:12px;padding:10px;background:#2d2d2d;border-radius:5px;border-left:3px solid #90caf9;">';
        html += '<strong style="color:#90caf9;">재미요소 (' + fun + '점 → 95점)</strong>';
        html += '<p style="color:#ccc;margin-top:5px;font-size:13px;">' + (scores.funComment || '유머, 반전, 감동 요소를 추가하여 흥미를 높이세요.') + '</p>';
        html += '</div>';
    }
    
    if (flow < 95) {
        html += '<div style="margin-bottom:12px;padding:10px;background:#2d2d2d;border-radius:5px;border-left:3px solid #a5d6a7;">';
        html += '<strong style="color:#a5d6a7;">이야기 흐름 (' + flow + '점 → 95점)</strong>';
        html += '<p style="color:#ccc;margin-top:5px;font-size:13px;">' + (scores.flowComment || '장면 전환을 자연스럽게 하고 논리적 일관성을 유지하세요.') + '</p>';
        html += '</div>';
    }
    
    if (retention < 95) {
        html += '<div style="margin-bottom:12px;padding:10px;background:#2d2d2d;border-radius:5px;border-left:3px solid #ffcc80;">';
        html += '<strong style="color:#ffcc80;">시청자 유지 (' + retention + '점 → 95점)</strong>';
        html += '<p style="color:#ccc;margin-top:5px;font-size:13px;">' + (scores.retentionComment || '긴장감과 궁금증을 유발하는 전개로 몰입도를 높이세요.') + '</p>';
        html += '</div>';
    }
    
    if (average >= 95) {
        html += '<div style="text-align:center;padding:15px;color:#4CAF50;font-weight:bold;">';
        html += '🎉 훌륭합니다! 모든 항목이 우수한 수준입니다.';
        html += '</div>';
    }
    
    html += '</div>';
    html += '</div>';
    
    container.innerHTML = html;
}

function renderScoreItem(label, score) {
    const color = score >= 95 ? '#4CAF50' : score >= 80 ? '#ffeb3b' : '#f44336';
    return `
        <div style="background:#1e1e1e;border-radius:8px;padding:15px;text-align:center;">
            <div style="font-size:14px;color:#aaa;margin-bottom:8px;">${label}</div>
            <div style="font-size:28px;font-weight:bold;color:${color};">${score}점</div>
            <div style="background:#444;height:6px;border-radius:3px;margin-top:10px;overflow:hidden;">
                <div style="background:${color};height:100%;width:${score}%;transition:width 0.5s;"></div>
            </div>
        </div>
    `;
}

// ===================== 분석 결과 렌더링 =====================
function renderAnalysisResult(stage, allErrors) {
    const container = document.getElementById('analysis-' + stage);
    if (!container) return;
    
    if (!allErrors || allErrors.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:20px;color:#4CAF50;font-weight:bold;background:#2d2d2d;border-radius:8px;">✅ 발견된 오류가 없습니다!</div>';
        return;
    }
    
    let html = '<div class="analysis-result" style="background:#2d2d2d;border-radius:8px;overflow:hidden;">';
    html += '<div style="background:#1e1e1e;color:#ffffff;padding:12px 15px;font-weight:bold;font-size:14px;border-bottom:1px solid #444;">';
    html += '📋 검수 결과: 총 ' + allErrors.length + '건 <span style="font-size:11px;font-weight:normal;color:#aaa;">(클릭 시 해당 위치로 이동)</span>';
    html += '</div>';
    
    html += '<div style="max-height:280px;overflow-y:auto;">';
    html += '<table style="width:100%;border-collapse:collapse;font-size:13px;color:#ffffff;">';
    html += '<thead style="background:#1e1e1e;position:sticky;top:0;">';
    html += '<tr>';
    html += '<th style="padding:10px 8px;border-bottom:1px solid #444;width:45px;color:#aaa;">번호</th>';
    html += '<th style="padding:10px 8px;border-bottom:1px solid #444;width:90px;color:#aaa;">유형</th>';
    html += '<th style="padding:10px 8px;border-bottom:1px solid #444;color:#aaa;">수정 전</th>';
    html += '<th style="padding:10px 8px;border-bottom:1px solid #444;color:#aaa;">수정 후</th>';
    html += '<th style="padding:10px 8px;border-bottom:1px solid #444;color:#aaa;">사유</th>';
    html += '</tr>';
    html += '</thead>';
    html += '<tbody>';
    
    allErrors.forEach((err, idx) => {
        const rowBg = idx % 2 === 0 ? '#2d2d2d' : '#333333';
        html += '<tr class="clickable-error-row" data-stage="' + stage + '" data-index="' + err.index + '" data-corrected="' + escapeAttr(err.corrected) + '" style="cursor:pointer;background:' + rowBg + ';" onmouseover="this.style.background=\'#404040\'" onmouseout="this.style.background=\'' + rowBg + '\'">';
        html += '<td style="padding:10px 8px;border-bottom:1px solid #444;text-align:center;color:#888;">' + (idx + 1) + '</td>';
        html += '<td style="padding:10px 8px;border-bottom:1px solid #444;text-align:center;color:' + getTypeTextColor(err.type) + ';font-weight:bold;font-size:12px;">' + escapeHtml(err.type) + '</td>';
        html += '<td style="padding:10px 8px;border-bottom:1px solid #444;color:#ff8a80;">' + escapeHtml(err.original) + '</td>';
        html += '<td style="padding:10px 8px;border-bottom:1px solid #444;color:#b9f6ca;">' + escapeHtml(err.corrected) + '</td>';
        html += '<td style="padding:10px 8px;border-bottom:1px solid #444;color:#888;font-size:12px;">' + escapeHtml(err.reason) + '</td>';
        html += '</tr>';
    });
    
    html += '</tbody></table></div></div>';
    
    container.innerHTML = html;
    
    container.querySelectorAll('.clickable-error-row').forEach(row => {
        row.addEventListener('click', function() {
            const stg = this.getAttribute('data-stage');
            const idx = parseInt(this.getAttribute('data-index'));
            const corrected = this.getAttribute('data-corrected');
            scrollToErrorInRevised(stg, idx, corrected);
        });
    });
}

function getTypeTextColor(type) {
    const colors = {
        '시대적 고증 오류': '#ce93d8',
        '맞춤법': '#ef9a9a',
        '띄어쓰기': '#90caf9',
        '문장부호': '#ffcc80',
        '문법': '#f48fb1',
        '어색한 표현': '#bcaaa4'
    };
    return colors[type] || '#b0bec5';
}

// ===================== 수정본 렌더링 =====================
function renderRevisedWithMarkers(script, allErrors, container, stage) {
    if (!script) { 
        container.innerHTML = '<p style="color:#888;text-align:center;padding:20px;">수정본이 없습니다.</p>'; 
        return; 
    }
    
    let html = '<div class="script-scroll-wrapper" style="max-height:400px;overflow-y:auto;padding:15px;background:#2d2d2d;border-radius:8px;">';
    html += '<div class="revised-script" style="color:#ffffff;font-size:14px;line-height:1.8;">';
    
    let content = script;
    
    if (allErrors && allErrors.length > 0) {
        const sortedErrors = [...allErrors].sort((a, b) => (b.corrected?.length || 0) - (a.corrected?.length || 0));
        
        for (const err of sortedErrors) {
            if (err.corrected && err.corrected.trim() && err.corrected !== '(대체어 없음)') {
                const marker = '<<<OK_' + err.index + '>>>' + err.corrected + '<<</OK>>>';
                const regex = new RegExp(escapeRegex(err.corrected), 'g');
                if (!content.includes(marker)) {
                    content = content.replace(regex, marker);
                }
            }
        }
    }
    
    content = escapeHtml(content);
    content = content.replace(/&lt;&lt;&lt;OK_(\d+)&gt;&gt;&gt;(.*?)&lt;&lt;&lt;\/OK&gt;&gt;&gt;/g, '<mark class="corrected-mark" data-error-index="$1" style="background:#a5d6a7;color:#1b5e20;padding:1px 4px;border-radius:3px;cursor:pointer;">$2</mark>');
    
    content.split('\n').forEach(line => {
        html += '<p style="margin:5px 0;">' + (line || '&nbsp;') + '</p>';
    });
    
    html += '</div></div>';
    container.innerHTML = html;
}

// ===================== 클릭 시 수정본으로 이동 =====================
function scrollToErrorInRevised(stage, errorIndex, correctedText) {
    const revisedContainer = document.getElementById('revised-' + stage);
    if (!revisedContainer) return;
    
    const s = state[stage];
    
    if (s.revisedScript) {
        renderRevisedWithMarkers(s.revisedScript, s.allErrors, revisedContainer, stage);
        const btnBefore = document.getElementById('btn-revert-before-' + stage);
        const btnAfter = document.getElementById('btn-revert-after-' + stage);
        if (btnBefore) btnBefore.style.opacity = '1';
        if (btnAfter) btnAfter.style.opacity = '0.5';
    }
    
    setTimeout(() => {
        let marks = revisedContainer.querySelectorAll('.corrected-mark[data-error-index="' + errorIndex + '"]');
        
        if (marks.length === 0 && correctedText) {
            const allMarks = revisedContainer.querySelectorAll('.corrected-mark');
            for (const m of allMarks) {
                if (m.textContent === correctedText) {
                    marks = [m];
                    break;
                }
            }
        }
        
        if (marks.length > 0) {
            const mark = marks[0];
            
            revisedContainer.querySelectorAll('.corrected-mark').forEach(m => {
                m.style.background = '#a5d6a7';
                m.style.color = '#1b5e20';
                m.style.boxShadow = 'none';
            });
            
            mark.style.background = '#69f0ae';
            mark.style.color = '#004d40';
            mark.style.boxShadow = '0 0 10px rgba(105, 240, 174, 0.8)';
            
            const wrapper = revisedContainer.querySelector('.script-scroll-wrapper');
            if (wrapper) {
                const markRect = mark.getBoundingClientRect();
                const wrapperRect = wrapper.getBoundingClientRect();
                const scrollTop = wrapper.scrollTop + (markRect.top - wrapperRect.top) - (wrapper.clientHeight / 2) + (mark.clientHeight / 2);
                wrapper.scrollTo({ top: Math.max(0, scrollTop), behavior: 'smooth' });
            }
            
            let blink = 0;
            const blinkInterval = setInterval(() => {
                mark.style.background = blink % 2 === 0 ? '#ffff00' : '#69f0ae';
                blink++;
                if (blink > 5) {
                    clearInterval(blinkInterval);
                    mark.style.background = '#69f0ae';
                }
            }, 200);
        }
    }, 150);
}

// ===================== 진행률 업데이트 =====================
function updateProgress(percent, message) {
    const bar = document.getElementById('progress-bar');
    const msg = document.getElementById('progress-message');
    if (bar) bar.style.width = percent + '%';
    if (msg) msg.textContent = message;
}

// ===================== 유틸리티 =====================
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function escapeAttr(text) {
    if (!text) return '';
    return text.replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeRegex(str) {
    if (!str) return '';
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
