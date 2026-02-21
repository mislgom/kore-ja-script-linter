/**
 * MISLGOM 대본 검수 자동 프로그램
 * main.js v5.0 - 1차 분석 통합 + 점수 산출 분리
 * - v5.0: 8개 항목 1차 분석 통합, 2차 분석 제거, 점수 산출 별도 버튼
 * - ENDPOINT: generativelanguage.googleapis.com
 * - TIMEOUT: 300000 ms
 * - MAX_OUTPUT_TOKENS: 65536
 */

console.log('🚀 main.js v5.0 로드됨');

// ============================================================
// 시대고증 규칙 (기존 유지)
// ============================================================
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
    ],
    concepts: [
        { modern: '민주주의', historical: ['없음'], confidence: '높음', reason: '근대 정치 개념' },
        { modern: '자유', historical: ['없음'], confidence: '높음', reason: '근대 개념' },
        { modern: '평등', historical: ['없음'], confidence: '높음', reason: '근대 개념' },
        { modern: '인권', historical: ['없음'], confidence: '높음', reason: '근대 개념' },
        { modern: '투표', historical: ['없음'], confidence: '높음', reason: '근대 제도' },
        { modern: '선거', historical: ['없음'], confidence: '높음', reason: '근대 제도' }
    ],
    expressions: [
        { modern: '오케이', historical: ['알겠소', '그리하리다'], confidence: '높음', reason: '영어 표현' },
        { modern: 'OK', historical: ['알겠소', '그리하리다'], confidence: '높음', reason: '영어 표현' },
        { modern: '파이팅', historical: ['힘내시오', '분발하시오'], confidence: '높음', reason: '외래어' },
        { modern: '스트레스', historical: ['심화', '울화'], confidence: '높음', reason: '외래어' },
        { modern: '멘탈', historical: ['정신', '마음'], confidence: '높음', reason: '외래어' }
    ]
};

// ============================================================
// 캐시 타이머
// ============================================================
var cacheTimer = {
    intervalId: null,
    cacheName: null,
    remainingSeconds: 0,
    warningShown: false,
    WARNING_THRESHOLD: 300
};

// ============================================================
// 전역 상태 (v5.0: stage2 제거, stage1만 사용)
// ============================================================
var state = {
    stage1: {
        originalScript: '',
        analysis: null,
        revisedScript: '',
        allErrors: [],
        fixedScript: '',
        currentErrorIndex: -1,
        isFixed: false
    },
    finalScript: '',
    changePoints: [],
};

var currentAbortController = null;

var API_CONFIG = {
    TIMEOUT: 300000,
    MODEL: 'gemini-2.5-flash',
    ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models',
    MAX_OUTPUT_TOKENS: 65536
};

// ============================================================
// 초기화
// ============================================================
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
    initDownloadButton();
    initRevertButtons();
    initStage1AnalysisButton();
    initStopButton();
    addStyles();
    addFullViewButtonsToHeaders();
    createFullViewModal();
    initEscKeyHandler();
    initResetCacheButton();
    console.log('📊 총 ' + getTotalRulesCount() + '개 시대고증 규칙 로드됨');
    console.log('⏱️ API 타임아웃: ' + (API_CONFIG.TIMEOUT / 1000) + '초');
    console.log('🤖 모델: ' + API_CONFIG.MODEL);
    console.log('✅ main.js v5.0 초기화 완료');
    console.log('🆕 v5.0: 8개 항목 통합 분석 + 점수 산출 분리');
}
// ============================================================
// 유틸리티 함수들
// ============================================================

function initEscKeyHandler() {
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeFullViewModal();
        }
    });
}

function getTotalRulesCount() {
    var count = 0;
    for (var key in HISTORICAL_RULES) {
        count += HISTORICAL_RULES[key].length;
    }
    return count;
}

function getHistoricalRulesString() {
    var rules = [];
    for (var category in HISTORICAL_RULES) {
        HISTORICAL_RULES[category].forEach(function(rule) {
            rules.push(rule.modern + ' → ' + rule.historical.join('/'));
        });
    }
    return rules.join(', ');
}

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatTypeText(type) {
    if (!type) return '';
    var typeMap = {
        '시대착오': '시대<br>착오',
        '시대고증': '시대<br>고증',
        '인물설정': '인물<br>설정',
        '시간왜곡': '시간<br>왜곡',
        '이야기흐름': '이야기<br>흐름',
        '쌩뚱맞은표현': '쌩뚱<br>표현',
        '캐릭터일관성': '캐릭터<br>일관성',
        '역사적사실': '역사<br>사실',
        '숫자불일치': '숫자<br>불일치'
    };
    return typeMap[type] || type.replace(/(.{2})/g, '$1<br>').replace(/<br>$/, '');
}

function showProgress(message) {
    var container = document.getElementById('progress-container');
    if (container) {
        container.style.display = 'block';
        updateProgress(0, message);
    }
}

function updateProgress(percent, message) {
    var bar = document.getElementById('progress-bar');
    var text = document.getElementById('progress-text');
    if (bar) bar.style.width = percent + '%';
    if (text) text.textContent = message || '';
}

function hideProgress() {
    var container = document.getElementById('progress-container');
    if (container) container.style.display = 'none';
}

// ============================================================
// 스타일 추가
// ============================================================
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
        '.fullview-modal{display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);z-index:10000;overflow:auto;}' +
        '.fullview-content{display:flex;width:100%;height:100%;padding:20px;box-sizing:border-box;}' +
        '.fullview-panel{flex:1;margin:0 10px;display:flex;flex-direction:column;background:#1e1e1e;border-radius:10px;overflow:hidden;}' +
        '.fullview-header{background:#333;padding:15px;text-align:center;font-weight:bold;color:#fff;border-bottom:1px solid #444;}' +
        '.fullview-body{flex:1;overflow:auto;padding:15px;}' +
        '.fullview-footer{padding:15px;border-top:1px solid #444;text-align:center;display:flex;justify-content:center;gap:10px;flex-wrap:wrap;}' +
        '.fullview-close{position:fixed;top:20px;right:30px;font-size:40px;color:#fff;cursor:pointer;z-index:10001;}' +
        '.fullview-close:hover{color:#ff5555;}' +
        '.btn-fullview{background:#9c27b0;color:white;border:none;padding:8px 16px;border-radius:5px;cursor:pointer;font-weight:bold;font-size:13px;margin-left:10px;}' +
        '.btn-fullview:hover{background:#7b1fa2;}' +
        '.analysis-table{width:100%;border-collapse:collapse;font-size:12px;table-layout:fixed;}' +
        '.analysis-table th{padding:8px 4px;border:1px solid #444;background:#333;font-weight:bold;text-align:center;word-break:keep-all;}' +
        '.analysis-table td{padding:8px 4px;border:1px solid #444;vertical-align:middle;word-wrap:break-word;overflow-wrap:break-word;}' +
        '.analysis-table th:nth-child(1),.analysis-table td:nth-child(1){width:45px;text-align:center;line-height:1.2;}' +
        '.analysis-table th:nth-child(2),.analysis-table td:nth-child(2){width:25%;}' +
        '.analysis-table th:nth-child(3),.analysis-table td:nth-child(3){width:25%;}' +
        '.analysis-table th:nth-child(4),.analysis-table td:nth-child(4){width:calc(50% - 45px);}' +
        '.type-cell{font-size:11px;line-height:1.3;word-break:keep-all;}' +
        '.perfect-script-content{background:#2d2d2d;padding:15px;border-radius:8px;white-space:pre-wrap;word-break:break-word;line-height:1.8;color:#fff;max-height:500px;overflow-y:auto;}' +
        '.compare-modal{display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.95);z-index:10000;overflow:auto;}' +
        '.compare-content{display:flex;flex-direction:column;width:100%;height:100%;padding:20px;box-sizing:border-box;}' +
        '.compare-panels{display:flex;flex:1;gap:20px;min-height:0;}' +
        '.compare-panel{flex:1;display:flex;flex-direction:column;background:#1e1e1e;border-radius:10px;overflow:hidden;}' +
        '.compare-header{background:#333;padding:15px;text-align:center;font-weight:bold;color:#fff;border-bottom:1px solid #444;}' +
        '.compare-body{flex:1;overflow:auto;padding:15px;background:#2d2d2d;white-space:pre-wrap;word-break:break-word;line-height:1.8;color:#fff;}' +
        '.compare-close{position:fixed;top:20px;right:30px;font-size:40px;color:#fff;cursor:pointer;z-index:10001;}' +
        '.compare-close:hover{color:#ff5555;}' +
        '.marker-deep-revised{background:#FFD700;color:#000;padding:2px 4px;border-radius:3px;cursor:pointer;font-weight:bold;border-bottom:2px solid #FF416C;}' +
        '.marker-deep-original{background:#FF416C40;color:#FF416C;padding:2px 4px;border-radius:3px;cursor:pointer;font-weight:bold;border-bottom:2px dashed #FF416C;}' +
        '.row-selected{background:#3a3a3a !important;outline:2px solid #69f0ae;}';
    document.head.appendChild(style);
}

// ============================================================
// 다크모드
// ============================================================
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

// ============================================================
// API 키 패널
// ============================================================
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
        closeBtn.addEventListener('click', function() { panel.style.display = 'none'; });
    }
}

function validateApiKey(apiKey) {
    if (!apiKey) return { valid: false, message: 'API 키가 설정되지 않았습니다.' };
    if (apiKey.length < 20) return { valid: false, message: 'API 키가 너무 짧습니다.' };
    return { valid: true, message: 'OK' };
}

// ============================================================
// 텍스트 입력, 파일 업로드, 드래그앤드롭
// ============================================================
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
        resetAllAnalysis();
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
        resetAllAnalysis();
        document.getElementById('original-script').value = e.target.result;
        document.getElementById('char-count').textContent = e.target.result.length;
    };
    reader.readAsText(file);
}

// ============================================================
// 다운로드
// ============================================================
function initDownloadButton() {
    var btn = document.getElementById('btn-download');
    if (!btn) return;
    btn.addEventListener('click', function() {
        var script = state.stage1.fixedScript || '';
        if (!script || script.trim() === '') {
            alert('다운로드할 수정본이 없습니다.\n"대본 픽스" 버튼을 먼저 눌러주세요.');
            return;
        }
        downloadScript(script);
    });
}

function downloadScript(script) {
    if (!script || script.trim() === '') {
        alert('다운로드할 내용이 없습니다.');
        return;
    }
    var cleanScript = cleanScriptForDownload(script);
    try {
        var blob = new Blob([cleanScript], { type: 'text/plain;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = '수정본_' + new Date().toISOString().slice(0, 10) + '.txt';
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

function downloadPerfectScript() {
    var script = state.perfectScript;
    if (!script || script.trim() === '') {
        alert('다운로드할 100점 대본이 없습니다.');
        return;
    }
    var cleanScript = cleanScriptForDownload(script);
    try {
        var blob = new Blob([cleanScript], { type: 'text/plain;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = '100점수정본_' + new Date().toISOString().slice(0, 10) + '.txt';
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

function cleanScriptForDownload(script) {
    if (!script) return '';
    var cleaned = script;

    // 태그 제거 (내용 유지)
    cleaned = cleaned.replace(/\[DEL\][\s\S]*?\[\/DEL\]/g, '');
    cleaned = cleaned.replace(/\[SENIOR\+?\]|\[\/SENIOR\+?\]/g, '');
    cleaned = cleaned.replace(/\[FUN\+?\]|\[\/FUN\+?\]/g, '');
    cleaned = cleaned.replace(/\[FLOW\+?\]|\[\/FLOW\+?\]/g, '');
    cleaned = cleaned.replace(/\[RETAIN\+?\]|\[\/RETAIN\+?\]/g, '');
    cleaned = cleaned.replace(/★/g, '');
    cleaned = cleaned.replace(/__DELETE__/g, '');

    // 연속 빈 줄 정리
    cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');
    cleaned = cleaned.split('\n').map(function(line) { return line.trim(); }).join('\n');
    cleaned = cleaned.trim();

    return cleaned;
}

// ============================================================
// 중지 버튼
// ============================================================
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

// ============================================================
// 수정 전/후 버튼, 픽스 버튼
// ============================================================
function initRevertButtons() {
    var r1 = document.getElementById('revised-stage1');
    if (r1) addRevertButton(r1, 'stage1');
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
    btnBefore.addEventListener('click', function() { toggleCurrentErrorOnly(stage, false); });

    var btnAfter = document.createElement('button');
    btnAfter.id = 'btn-revert-after-' + stage;
    btnAfter.innerHTML = '✅ 수정 후';
    btnAfter.style.cssText = 'background:#4CAF50;color:white;border:none;padding:8px 16px;border-radius:5px;cursor:pointer;font-weight:bold;font-size:13px;';
    btnAfter.disabled = true;
    btnAfter.addEventListener('click', function() { toggleCurrentErrorOnly(stage, true); });

    var btnFix = document.createElement('button');
    btnFix.id = 'btn-fix-script-' + stage;
    btnFix.innerHTML = '📌 대본 픽스';
    btnFix.style.cssText = 'background:#2196F3;color:white;border:none;padding:8px 16px;border-radius:5px;cursor:pointer;font-weight:bold;font-size:13px;';
    btnFix.disabled = true;
    btnFix.addEventListener('click', function() { fixScript(stage); });

    wrapper.appendChild(btnBefore);
    wrapper.appendChild(btnAfter);
    wrapper.appendChild(btnFix);
    parent.appendChild(wrapper);
}

// ============================================================
// 점수 산출 버튼 (v5.0 신규)
// ============================================================
function initScoreButton() {
    var scoreSection = document.getElementById('score-section');
    if (!scoreSection) return;

    var existingBtn = document.getElementById('btn-calculate-score');
    if (existingBtn) return;

    var wrapper = document.createElement('div');
    wrapper.style.cssText = 'text-align:center;padding:15px;';

    var btn = document.createElement('button');
    btn.id = 'btn-calculate-score';
    btn.innerHTML = '📊 점수 산출';
    btn.style.cssText = 'background:linear-gradient(135deg,#FF6B6B 0%,#ee5a24 100%);color:white;border:none;padding:15px 40px;border-radius:8px;cursor:pointer;font-weight:bold;font-size:16px;box-shadow:0 4px 15px rgba(238,90,36,0.4);';
    btn.addEventListener('click', calculateAndDisplayScores);

    wrapper.appendChild(btn);
    scoreSection.insertBefore(wrapper, document.getElementById('score-display'));
}

// ============================================================
// 모달 — 전체 보기
// ============================================================
function createFullViewModal() {
    if (document.getElementById('fullview-modal')) return;
    var modal = document.createElement('div');
    modal.id = 'fullview-modal';
    modal.className = 'fullview-modal';
    modal.innerHTML =
        '<span class="fullview-close" id="fullview-close">&times;</span>' +
        '<div class="fullview-content">' +
            '<div class="fullview-panel" id="fullview-left">' +
                '<div class="fullview-header" id="fullview-left-header">분석 결과</div>' +
                '<div class="fullview-body" id="fullview-left-body"></div>' +
            '</div>' +
            '<div class="fullview-panel" id="fullview-right">' +
                '<div class="fullview-header" id="fullview-right-header">수정 반영</div>' +
                '<div class="fullview-body" id="fullview-right-body"></div>' +
                '<div class="fullview-footer" id="fullview-footer"></div>' +
            '</div>' +
        '</div>';
    document.body.appendChild(modal);
    document.getElementById('fullview-close').addEventListener('click', closeFullViewModal);
    modal.addEventListener('click', function(e) { if (e.target === modal) closeFullViewModal(); });
}

function openFullViewModal() {
    var modal = document.getElementById('fullview-modal');
    if (!modal) return;

    var analysisBox = document.getElementById('analysis-stage1');
    var revisedBox = document.getElementById('revised-stage1');

    document.getElementById('fullview-left-header').textContent = '분석 결과';
    document.getElementById('fullview-right-header').textContent = '수정 반영';

    var leftBody = document.getElementById('fullview-left-body');
    var rightBody = document.getElementById('fullview-right-body');
    var footer = document.getElementById('fullview-footer');

    if (analysisBox) {
        leftBody.innerHTML = analysisBox.innerHTML;
        leftBody.querySelectorAll('tr[data-marker-id]').forEach(function(row) {
            row.addEventListener('click', function() {
                var markerId = this.getAttribute('data-marker-id');
                var errorIndex = findErrorIndexById('stage1', markerId);
                if (errorIndex >= 0) {
                    setCurrentError('stage1', errorIndex);
                    highlightFullViewRow(leftBody, markerId);
                    scrollToFullViewMarker(rightBody, markerId);
                }
            });
        });
    }

    if (revisedBox) {
        rightBody.innerHTML = revisedBox.innerHTML;
    }

    footer.innerHTML = '';

    var btnBefore = document.createElement('button');
    btnBefore.innerHTML = '🔄 수정 전';
    btnBefore.style.cssText = 'background:#ff9800;color:white;border:none;padding:8px 16px;border-radius:5px;cursor:pointer;font-weight:bold;font-size:13px;';
    btnBefore.addEventListener('click', function() {
        toggleCurrentErrorOnly('stage1', false);
        updateFullViewContent(leftBody, rightBody);
    });

    var btnAfter = document.createElement('button');
    btnAfter.innerHTML = '✅ 수정 후';
    btnAfter.style.cssText = 'background:#4CAF50;color:white;border:none;padding:8px 16px;border-radius:5px;cursor:pointer;font-weight:bold;font-size:13px;';
    btnAfter.addEventListener('click', function() {
        toggleCurrentErrorOnly('stage1', true);
        updateFullViewContent(leftBody, rightBody);
    });

    var btnFix = document.createElement('button');
    btnFix.innerHTML = '📌 대본 픽스';
    btnFix.style.cssText = 'background:#2196F3;color:white;border:none;padding:8px 16px;border-radius:5px;cursor:pointer;font-weight:bold;font-size:13px;';
    btnFix.addEventListener('click', function() {
        fixScript('stage1');
        updateFullViewContent(leftBody, rightBody);
    });

    footer.appendChild(btnBefore);
    footer.appendChild(btnAfter);
    footer.appendChild(btnFix);

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function updateFullViewContent(leftBody, rightBody) {
    var analysisBox = document.getElementById('analysis-stage1');
    var revisedBox = document.getElementById('revised-stage1');
    if (analysisBox) {
        leftBody.innerHTML = analysisBox.innerHTML;
        leftBody.querySelectorAll('tr[data-marker-id]').forEach(function(row) {
            row.addEventListener('click', function() {
                var markerId = this.getAttribute('data-marker-id');
                var errorIndex = findErrorIndexById('stage1', markerId);
                if (errorIndex >= 0) {
                    setCurrentError('stage1', errorIndex);
                    highlightFullViewRow(leftBody, markerId);
                    scrollToFullViewMarker(rightBody, markerId);
                }
            });
        });
    }
    if (revisedBox) rightBody.innerHTML = revisedBox.innerHTML;
}

function highlightFullViewRow(container, markerId) {
    container.querySelectorAll('tr[data-marker-id]').forEach(function(row) {
        if (row.getAttribute('data-marker-id') === markerId) {
            row.style.background = '#3a3a3a';
            row.style.outline = '2px solid #69f0ae';
        } else {
            row.style.background = '';
            row.style.outline = '';
        }
    });
}

function scrollToFullViewMarker(container, markerId) {
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

function closeFullViewModal() {
    var modal = document.getElementById('fullview-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

function addFullViewButtonsToHeaders() {
    setTimeout(function() {
        var revised1Parent = document.getElementById('revised-stage1');
        if (revised1Parent) {
            var parent1 = revised1Parent.parentElement;
            var header1 = parent1.querySelector('h3');
            if (header1 && !header1.querySelector('.btn-fullview')) {
                var btn1 = document.createElement('button');
                btn1.className = 'btn-fullview';
                btn1.innerHTML = '🔍 전체 보기';
                btn1.addEventListener('click', function() { openFullViewModal(); });
                header1.style.display = 'flex';
                header1.style.justifyContent = 'space-between';
                header1.style.alignItems = 'center';
                header1.appendChild(btn1);
            }
        }
    }, 100);
}

// ============================================================
// 모달 — 대본 비교
// ============================================================
function createCompareModal() {
    if (document.getElementById('compare-modal')) return;
    var modal = document.createElement('div');
    modal.id = 'compare-modal';
    modal.className = 'compare-modal';
    modal.innerHTML =
        '<span class="compare-close" id="compare-close">&times;</span>' +
        '<div class="compare-content">' +
            '<div class="compare-panels">' +
                '<div class="compare-panel">' +
                    '<div class="compare-header">✅ 수정 반영 대본</div>' +
                    '<div class="compare-body" id="compare-left-body"></div>' +
                '</div>' +
                '<div class="compare-panel">' +
                    '<div class="compare-header">💯 100점 수정 대본</div>' +
                    '<div class="compare-body" id="compare-right-body"></div>' +
                '</div>' +
            '</div>' +
        '</div>';
    document.body.appendChild(modal);
    document.getElementById('compare-close').addEventListener('click', closeCompareModal);
    modal.addEventListener('click', function(e) { if (e.target === modal) closeCompareModal(); });
}

function openCompareModal() {
    var modal = document.getElementById('compare-modal');
    if (!modal) return;
    var finalScript = state.stage1.fixedScript || '';
    var perfectScript = state.perfectScript || '';
    if (!finalScript || !perfectScript) {
        alert('비교할 대본이 없습니다.');
        return;
    }
    document.getElementById('compare-left-body').innerHTML = escapeHtml(finalScript);
    document.getElementById('compare-right-body').innerHTML = escapeHtml(perfectScript);
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeCompareModal() {
    var modal = document.getElementById('compare-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

// ============================================================
// 100점 대본 섹션
// ============================================================
function initPerfectScriptSection() {
    var generateBtn = document.getElementById('btn-generate-perfect');
    if (generateBtn) {
        generateBtn.addEventListener('click', generatePerfectScriptFromScores);
    }
    var downloadPerfectBtn = document.getElementById('btn-download-perfect');
    if (downloadPerfectBtn) {
        downloadPerfectBtn.addEventListener('click', downloadPerfectScript);
    }
    var compareBtn = document.getElementById('btn-compare-scripts');
    if (compareBtn) {
        compareBtn.addEventListener('click', openCompareModal);
    }
}

function showPerfectScriptSection() {
    var section = document.getElementById('perfect-script-section');
    if (section) section.style.display = 'block';
}

// ============================================================
// 캐시 초기화 버튼
// ============================================================
function initResetCacheButton() {
    var btn = document.getElementById('btn-reset-cache');
    if (!btn) return;
    btn.addEventListener('click', function() {
        var cacheName = state._cacheName;
        if (!cacheName) { alert('현재 활성화된 캐시가 없습니다.'); return; }
        if (!confirm('캐시를 삭제하시겠습니까?')) return;
        deleteScriptCache(cacheName);
        state._cacheName = null;
        alert('캐시가 삭제되었습니다.');
    });
}

// ============================================================
// 전체 초기화
// ============================================================
function resetAllAnalysis() {
    if (state._cacheName) {
        deleteScriptCache(state._cacheName);
        state._cacheName = null;
    }
    state.stage1 = {
        originalScript: '',
        analysis: null,
        revisedScript: '',
        allErrors: [],
        fixedScript: '',
        currentErrorIndex: -1,
        isFixed: false
    };
    state.finalScript = '';
    state.changePoints = [];

    var stage1Analysis = document.getElementById('analysis-stage1');
    if (stage1Analysis) stage1Analysis.innerHTML = '<p class="placeholder">분석을 시작하면 결과가 표시됩니다.</p>';
    var revisedStage1 = document.getElementById('revised-stage1');
    if (revisedStage1) revisedStage1.innerHTML = '<p class="placeholder">분석 후 수정본이 표시됩니다.</p>';

    var btnNames = ['btn-revert-before-stage1', 'btn-revert-after-stage1', 'btn-fix-script-stage1'];
    btnNames.forEach(function(id) {
        var btn = document.getElementById(id);
        if (btn) btn.disabled = true;
    });

    var downloadBtn = document.getElementById('btn-download');
    if (downloadBtn) downloadBtn.disabled = true;

    hideProgress();
}

// ============================================================
// 1차 분석 시작 버튼
// ============================================================
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
    btn.innerHTML = '🔍 분석 시작';
    btn.style.cssText = 'background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;border:none;padding:15px 40px;border-radius:8px;cursor:pointer;font-weight:bold;font-size:16px;box-shadow:0 4px 15px rgba(102,126,234,0.4);';
    btn.addEventListener('click', startStage1Analysis);
    wrapper.appendChild(btn);
    parent.appendChild(wrapper);
}
// ============================================================
// 오류 토글 함수들
// ============================================================

function toggleCurrentErrorOnly(stage, useRevised) {
    var s = state[stage];
    var errors = s.allErrors || [];
    if (errors.length === 0) return;

    if (s.currentErrorIndex >= 0 && s.currentErrorIndex < errors.length) {
        var err = errors[s.currentErrorIndex];
        err.useRevised = useRevised;
        renderScriptWithMarkers(stage);
    } else {
        alert('수정할 항목을 먼저 선택하세요.\n분석 결과 테이블에서 행을 클릭하면 해당 항목이 선택됩니다.');
    }
}

function setCurrentError(stage, errorIndex) {
    state[stage].currentErrorIndex = errorIndex;
    highlightCurrentRow(stage, errorIndex);
    var errors = state[stage].allErrors || [];
    if (errorIndex >= 0 && errorIndex < errors.length) {
        scrollToMarker(stage, errors[errorIndex].id);
    }
}

function highlightCurrentRow(stage, errorIndex) {
    var tableContainer = document.getElementById('analysis-' + stage);
    if (!tableContainer) return;
    var rows = tableContainer.querySelectorAll('tr[data-marker-id]');
    rows.forEach(function(row) {
        var markerId = row.getAttribute('data-marker-id');
        if (markerId) {
            var rowIndex = findErrorIndexById(stage, markerId);
            if (rowIndex === errorIndex) {
                row.classList.add('row-selected');
                row.style.background = '#3a3a3a';
                row.style.outline = '2px solid #69f0ae';
            } else {
                row.classList.remove('row-selected');
                row.style.background = '';
                row.style.outline = '';
            }
        }
    });
}

function findErrorIndexById(stage, markerId) {
    var errors = state[stage].allErrors || [];
    for (var i = 0; i < errors.length; i++) {
        if (errors[i].id === markerId) return i;
    }
    return -1;
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
            setTimeout(function() { row.style.background = '#3a3a3a'; }, 1000);
        }
    });
}

// ============================================================
// cleanRevisedText — 수정안 정제
// ============================================================
function cleanRevisedText(text) {
    if (!text) return '';

    // 삭제 지시문 감지
    var deletePatterns = [
        /^\s*\(.*삭제.*\)\s*$/,
        /^\s*\[.*삭제.*\]\s*$/,
        /^\s*삭제\s*$/,
        /^\s*\(.*제거.*\)\s*$/,
        /^\s*제거\s*$/
    ];
    for (var d = 0; d < deletePatterns.length; d++) {
        if (deletePatterns[d].test(text.trim())) {
            return '__DELETE__';
        }
    }

    var cleaned = text;
    cleaned = cleaned.replace(/\s*\([^)]*\)\s*/g, ' ');
    cleaned = cleaned.replace(/\s*\[[^\]]*\]\s*/g, ' ');
    cleaned = cleaned.replace(/\s*\{[^}]*\}\s*/g, ' ');

    if (cleaned.indexOf(' / ') !== -1) {
        cleaned = cleaned.split(' / ')[0].trim();
    }
    if (cleaned.indexOf(' | ') !== -1) {
        cleaned = cleaned.split(' | ')[0].trim();
    }

    cleaned = cleaned.replace(/\s*<[^>]*>\s*/g, ' ');
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    if (!cleaned || cleaned.length === 0) {
        var fallback = text.replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '').replace(/\s+/g, ' ').trim();
        return fallback || text;
    }
    return cleaned;
}

// ============================================================
// 텍스트 매칭 헬퍼
// ============================================================
function findBestMatch(text, searchText) {
    if (!text || !searchText) return { found: false, matchedText: '', position: -1 };

    // 1. 정확한 매칭
    var exactPos = text.indexOf(searchText);
    if (exactPos !== -1) return { found: true, matchedText: searchText, position: exactPos };

    // 2. 공백 정규화
    var normalizedSearch = searchText.replace(/\s+/g, ' ').trim();
    var normalizedPos = text.indexOf(normalizedSearch);
    if (normalizedPos !== -1) return { found: true, matchedText: normalizedSearch, position: normalizedPos };

    // 3. 줄바꿈 제거
    var noLineBreakSearch = searchText.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
    var noLineBreakPos = text.indexOf(noLineBreakSearch);
    if (noLineBreakPos !== -1) return { found: true, matchedText: noLineBreakSearch, position: noLineBreakPos };

    // 4. 인물명:대사 형식에서 대사만 추출
    var dialogueMatch = searchText.match(/^([가-힣a-zA-Z]{2,10})\s*[:：]\s*([\s\S]+)/);
    if (dialogueMatch) {
        var dialogueOnly = dialogueMatch[2].replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
        var dialoguePos = text.indexOf(dialogueOnly);
        if (dialoguePos !== -1) return { found: true, matchedText: dialogueOnly, position: dialoguePos };

        var firstSentence = dialogueOnly.split(/[.!?。]/)[0].trim();
        if (firstSentence.length >= 8) {
            var fsPos = text.indexOf(firstSentence);
            if (fsPos !== -1) {
                var endPos = Math.min(fsPos + dialogueOnly.length, text.length);
                return { found: true, matchedText: text.substring(fsPos, endPos), position: fsPos };
            }
        }
    }

    // 5. 부분 문자열 (앞 30자)
    if (searchText.length > 30) {
        var frontPart = searchText.substring(0, 30).replace(/[\r\n]+/g, ' ').trim();
        var frontPos = text.indexOf(frontPart);
        if (frontPos !== -1) {
            var endPos = Math.min(frontPos + searchText.length, text.length);
            return { found: true, matchedText: text.substring(frontPos, endPos), position: frontPos };
        }
    }

    // 6. 핵심 단어 기반
    var words = searchText.replace(/[\r\n]+/g, ' ').split(/\s+/).filter(function(w) {
        return w.length >= 3 && !w.match(/^[가-힣]{2,4}[:：]$/);
    });
    if (words.length >= 2) {
        var firstWord = words[0];
        var lastWord = words[words.length - 1];
        var firstPos = text.indexOf(firstWord);
        var lastPos = text.indexOf(lastWord, firstPos);
        if (firstPos !== -1 && lastPos !== -1 && lastPos > firstPos) {
            var matchedText = text.substring(firstPos, lastPos + lastWord.length);
            if (matchedText.length <= searchText.length * 2) {
                return { found: true, matchedText: matchedText, position: firstPos };
            }
        }
    }

    // 7. 첫 의미있는 구절 (8자 이상)
    var phrases = searchText.replace(/[\r\n]+/g, ' ').replace(/^[가-힣]{2,4}\s*[:：]\s*/g, '').split(/[,，.。!?;；]/).filter(function(p) {
        return p.trim().length >= 8;
    });
    if (phrases.length > 0) {
        var phrase = phrases[0].trim();
        var phrasePos = text.indexOf(phrase);
        if (phrasePos !== -1) {
            var endPos = Math.min(phrasePos + searchText.length, text.length);
            return { found: true, matchedText: text.substring(phrasePos, endPos), position: phrasePos };
        }
    }

    // 8. 첫 단어로 위치 추정
    if (words.length > 0) {
        var fwPos = text.indexOf(words[0]);
        if (fwPos !== -1) {
            var estimatedEnd = Math.min(fwPos + searchText.length, text.length);
            return { found: true, matchedText: text.substring(fwPos, estimatedEnd), position: fwPos };
        }
    }

    return { found: false, matchedText: '', position: -1 };
}

// ============================================================
// renderScriptWithMarkers — 수정 반영 영역 마커 렌더링
// ============================================================
function renderScriptWithMarkers(stage) {
    var container = document.getElementById('revised-' + stage);
    if (!container) return;

    var stageData = state[stage];
    if (!stageData) return;

    var originalText = stageData.originalScript || '';
    var errors = stageData.allErrors || [];
    var scrollTop = container.scrollTop;

    if (!originalText || originalText.length === 0) {
        container.innerHTML = '<div style="white-space:pre-wrap;padding:15px;font-size:14px;line-height:1.8;color:#888;">대본을 업로드하고 분석을 시작하세요.</div>';
        return;
    }

    if (!errors || errors.length === 0) {
        container.innerHTML = '<div style="white-space:pre-wrap;padding:15px;font-size:14px;line-height:1.8;word-break:break-word;">' + escapeHtml(originalText) + '</div>';
        return;
    }

    // 1단계: 유효한 마커 위치 찾기
    var markers = [];
    for (var i = 0; i < errors.length; i++) {
        var err = errors[i];
        if (!err.original || err.original.trim().length === 0) continue;

        var searchText = err.original.trim();
        var position = -1;
        var matchedLength = 0;
        var matchedText = '';

        // 정확한 매칭
        position = originalText.indexOf(searchText);
        if (position !== -1) {
            matchedLength = searchText.length;
            matchedText = searchText;
        }

        // 공백 정규화 매칭
        if (position === -1) {
            var normalized = searchText.replace(/\s+/g, ' ').trim();
            if (normalized.length >= 5) {
                var searchRegex = normalized.split(' ').map(function(w) {
                    return w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                }).join('\\s*');
                try {
                    var regex = new RegExp(searchRegex);
                    var match = originalText.match(regex);
                    if (match && match.index !== undefined) {
                        position = match.index;
                        matchedLength = match[0].length;
                        matchedText = match[0];
                    }
                } catch (e) { /* 무시 */ }
            }
        }

        // 키워드 매칭 (5글자 이상 단어)
        if (position === -1) {
            var words = searchText.split(/\s+/).filter(function(w) { return w.length >= 5; });
            for (var j = 0; j < words.length && position === -1; j++) {
                var wordPos = originalText.indexOf(words[j]);
                if (wordPos !== -1) {
                    position = wordPos;
                    matchedLength = words[j].length;
                    matchedText = words[j];
                }
            }
        }

        if (position !== -1 && matchedLength > 0) {
            markers.push({ error: err, position: position, length: matchedLength, matchedText: matchedText });
            err.matchedOriginal = matchedText;
        }
    }

    if (markers.length === 0) {
        container.innerHTML = '<div style="white-space:pre-wrap;padding:15px;font-size:14px;line-height:1.8;word-break:break-word;">' + escapeHtml(originalText) + '</div>';
        return;
    }

    // 2단계: 범위 확장 (수정안과 원문 중복 꼬리 흡수)
    for (var mi = 0; mi < markers.length; mi++) {
        var m = markers[mi];
        var mErr = m.error;
        if (!mErr.useRevised || !mErr.revised) continue;

        var revisedClean = cleanRevisedText(mErr.revised);
        if (!revisedClean || revisedClean === '__DELETE__') continue;

        var originalLength = m.length; // 확장 전 길이 저장
        var markerEnd = m.position + m.length;
        var afterMarkerText = originalText.substring(markerEnd, Math.min(markerEnd + 200, originalText.length));

        var revisedWords = revisedClean.split(/\s+/).filter(function(w) { return w.length >= 2; });
        if (revisedWords.length >= 3) {
            for (var tailLen = Math.min(revisedClean.length, 80); tailLen >= 8; tailLen -= 4) {
                var revisedTail = revisedClean.substring(revisedClean.length - tailLen).trim();
                var tailPos = afterMarkerText.indexOf(revisedTail);
                if (tailPos !== -1 && tailPos <= 5) {
                    var extendLength = tailPos + revisedTail.length;
                    m.length += extendLength;
                    m.matchedText = originalText.substring(m.position, m.position + m.length);
                    break;
                }
            }

            // 문장 단위 중복 확인 (확장 전 길이와 비교)
            if (m.length === originalLength) {
                var revisedSentences = revisedClean.split(/(?<=[.?!。])\s*/).filter(function(s) { return s.trim().length >= 5; });
                if (revisedSentences.length >= 2) {
                    var lastSentence = revisedSentences[revisedSentences.length - 1].trim();
                    var dupPos = afterMarkerText.indexOf(lastSentence);
                    if (dupPos !== -1 && dupPos <= 10) {
                        var extLen = dupPos + lastSentence.length;
                        m.length += extLen;
                        m.matchedText = originalText.substring(m.position, m.position + m.length);
                    }
                }
            }
        }
    }

    // 3단계: 위치순 정렬
    markers.sort(function(a, b) { return a.position - b.position; });

    // 4단계: 겹치는 마커 제거
    var finalMarkers = [];
    var lastEnd = 0;
    for (var i = 0; i < markers.length; i++) {
        if (markers[i].position >= lastEnd) {
            finalMarkers.push(markers[i]);
            lastEnd = markers[i].position + markers[i].length;
        }
    }

    // 5단계: HTML 조립
    var html = '';
    var pos = 0;
    for (var i = 0; i < finalMarkers.length; i++) {
        var fm = finalMarkers[i];
        var fErr = fm.error;

        if (fm.position > pos) {
            html += escapeHtml(originalText.substring(pos, fm.position));
        }

        var display = (fErr.useRevised && fErr.revised) ? cleanRevisedText(fErr.revised) : fm.matchedText;
        var cls = '';
if (fErr.category === 'deep') {
    cls = (fErr.useRevised && fErr.revised) ? 'marker-deep-revised' : 'marker-deep-original';
} else {
    cls = (fErr.useRevised && fErr.revised) ? 'marker-revised' : 'marker-original';
}

        var title = escapeHtml((fErr.original || '').substring(0, 50) + ' → ' + (fErr.revised || '').substring(0, 50));

        if (display === '__DELETE__' && fErr.useRevised) {
            html += '<span class="correction-marker" data-marker-id="' + fErr.id + '" data-stage="' + stage + '" title="' + title + '" style="text-decoration:line-through;color:#ff5555;background:#ff555530;padding:2px 4px;border-radius:3px;cursor:pointer;">' + escapeHtml(fm.matchedText) + ' <span style="font-size:10px;color:#ff9800;font-weight:bold;">[삭제]</span></span>';
        } else {
            html += '<span class="correction-marker ' + cls + '" data-marker-id="' + fErr.id + '" data-stage="' + stage + '" title="' + title + '">' + escapeHtml(display) + '</span>';
        }
        pos = fm.position + fm.length;
    }

    if (pos < originalText.length) {
        html += escapeHtml(originalText.substring(pos));
    }

    // 6단계: 렌더링
    container.innerHTML = '<div style="white-space:pre-wrap;padding:15px;font-size:14px;line-height:1.8;word-break:break-word;">' + html + '</div>';
    container.scrollTop = scrollTop;

    // 7단계: 클릭 이벤트
    container.querySelectorAll('.correction-marker').forEach(function(el) {
        el.addEventListener('click', function() {
            var id = this.getAttribute('data-marker-id');
            var st = this.getAttribute('data-stage');
            var idx = findErrorIndexById(st, id);
            if (idx !== -1) {
                setCurrentError(st, idx);
                scrollToTableRow(st, id);
            }
        });
    });
}

// ============================================================
// scrollToMarker — 수정 반영 영역에서 마커로 스크롤
// ============================================================
function scrollToMarker(stage, markerId) {
    var container = document.getElementById('revised-' + stage);
    if (!container) return;

    var errors = state[stage].allErrors || [];
    var targetError = null;
    for (var i = 0; i < errors.length; i++) {
        if (errors[i].id === markerId) { targetError = errors[i]; break; }
    }

    // 방법 1: data-marker-id로 마커 찾기
    var marker = container.querySelector('.correction-marker[data-marker-id="' + markerId + '"]');

    // 방법 2: 텍스트 검색으로 마커 찾기
    if (!marker && targetError) {
        var allMarkers = container.querySelectorAll('.correction-marker');
        var searchTexts = [];

        if (targetError.original) {
            searchTexts.push(targetError.original);
            searchTexts.push(targetError.original.split(/[\r\n]/)[0].trim());
            var words = targetError.original.split(/\s+/).filter(function(w) { return w.length >= 3; });
            if (words.length >= 2) searchTexts.push(words[0]);
        }
        if (targetError.matchedOriginal) {
            searchTexts.push(targetError.matchedOriginal);
        }
        if (targetError.revised) {
            var cleanRev = cleanRevisedText(targetError.revised);
            if (cleanRev && cleanRev !== '__DELETE__') {
                searchTexts.push(cleanRev);
            }
        }

        for (var j = 0; j < allMarkers.length && !marker; j++) {
            var markerText = allMarkers[j].textContent || '';
            for (var k = 0; k < searchTexts.length; k++) {
                var st = searchTexts[k];
                if (!st || st.length < 3) continue;
                if (markerText === st || markerText.indexOf(st) !== -1 || st.indexOf(markerText) !== -1) {
                    marker = allMarkers[j];
                    break;
                }
                if (st.length > 10 && markerText.indexOf(st.substring(0, 10)) !== -1) {
                    marker = allMarkers[j];
                    break;
                }
            }
        }
    }

    // 방법 3: 컨테이너 전체 텍스트에서 위치 찾아 스크롤
    if (!marker && targetError) {
        var containerText = container.innerText || container.textContent || '';
        var searchCandidates = [];

        if (targetError.original) {
            searchCandidates.push(targetError.original);
            searchCandidates.push(targetError.original.replace(/[\r\n]+/g, ' ').trim());
            searchCandidates.push(targetError.original.split(/[\r\n]/)[0].trim());
            // 핵심 구절 추출 (첫 문장)
            var firstSentence = targetError.original.split(/[.!?。]/)[0].trim();
            if (firstSentence.length >= 5) searchCandidates.push(firstSentence);
            // 핵심 단어 조합
            var keyWords = targetError.original.replace(/[\r\n]+/g, ' ').split(/\s+/).filter(function(w) { return w.length >= 3; });
            if (keyWords.length >= 2) searchCandidates.push(keyWords[0] + ' ' + keyWords[1]);
            if (keyWords.length >= 1) searchCandidates.push(keyWords[0]);
        }
        if (targetError.matchedOriginal) {
            searchCandidates.push(targetError.matchedOriginal);
        }
        if (targetError.revised) {
            var cleanRev = cleanRevisedText(targetError.revised);
            if (cleanRev && cleanRev !== '__DELETE__') {
                searchCandidates.push(cleanRev);
                var revFirstSentence = cleanRev.split(/[.!?。]/)[0].trim();
                if (revFirstSentence.length >= 5) searchCandidates.push(revFirstSentence);
            }
        }

        var foundIndex = -1;
        for (var s = 0; s < searchCandidates.length && foundIndex === -1; s++) {
            var candidate = searchCandidates[s];
            if (!candidate || candidate.length < 3) continue;
            foundIndex = containerText.indexOf(candidate);
            if (foundIndex === -1 && candidate.length > 10) {
                foundIndex = containerText.indexOf(candidate.substring(0, 10));
            }
            if (foundIndex === -1 && candidate.length > 5) {
                foundIndex = containerText.indexOf(candidate.substring(0, 5));
            }
        }

        if (foundIndex !== -1 && containerText.length > 0) {
            var scrollRatio = foundIndex / containerText.length;
            var targetScroll = Math.max(0, container.scrollHeight * scrollRatio - 100);
            container.scrollTo({ top: targetScroll, behavior: 'smooth' });

            // 해당 위치 근처 텍스트 노드에 임시 하이라이트
            setTimeout(function() {
                var allNodes = container.querySelectorAll('span, p, div');
                for (var n = 0; n < allNodes.length; n++) {
                    var nodeText = allNodes[n].textContent || '';
                    var checkText = searchCandidates[0] || '';
                    if (checkText.length >= 5 && nodeText.indexOf(checkText.substring(0, Math.min(15, checkText.length))) !== -1) {
                        allNodes[n].style.transition = 'background 0.3s';
                        allNodes[n].style.background = '#ffeb3b';
                        allNodes[n].style.borderRadius = '3px';
                        (function(node) {
                            setTimeout(function() {
                                node.style.background = '';
                            }, 2000);
                        })(allNodes[n]);
                        break;
                    }
                }
            }, 500);
            return;
        }

        container.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }

    if (!marker) {
        container.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }

    // 마커 찾음
    marker.scrollIntoView({ behavior: 'smooth', block: 'center' });
    var isRevised = marker.classList.contains('marker-revised');
    marker.classList.add(isRevised ? 'highlight-active' : 'highlight-active-orange');
    setTimeout(function() {
        marker.classList.remove('highlight-active');
        marker.classList.remove('highlight-active-orange');
    }, 1600);
}

// ============================================================
// fixScript — 대본 픽스
// ============================================================
function fixScript(stage) {
    var s = state[stage];

    // 편집모드에서 이미 저장한 텍스트가 있으면 그대로 사용
    if (s.fixedScript && s.fixedScript.trim().length > 0 && s.isFixed) {
        state.finalScript = s.fixedScript;

        renderScriptWithMarkers(stage);

        var downloadBtn = document.getElementById('btn-download');
        if (downloadBtn) downloadBtn.disabled = false;

        alert('수정본이 적용되었습니다.');
        return;
    }

    var text = s.originalScript;
    var errors = s.allErrors || [];

    errors.forEach(function(err) {
        if (err.useRevised && err.original && err.revised) {
            var fixedRevised = cleanRevisedText(err.revised);
            var searchText = err.original;

            if (text.indexOf(searchText) !== -1) {
                if (fixedRevised === '__DELETE__') {
                    text = text.split(searchText).join('');
                } else {
                    text = text.split(searchText).join(fixedRevised);
                }
            } else {
                var searchWords = searchText.split(/\s+/).filter(function(w) { return w.length > 0; });
                if (searchWords.length >= 2) {
                    var regexStr = searchWords.map(function(w) {
                        return w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    }).join('\\s+');
                    try {
                        var regex = new RegExp(regexStr);
                        var match = text.match(regex);
                        if (match) {
                            if (fixedRevised === '__DELETE__') {
                                text = text.replace(match[0], '');
                            } else {
                                text = text.replace(match[0], fixedRevised);
                            }
                        }
                    } catch (e) { /* 무시 */ }
                }
            }
        }
    });

    text = text.replace(/\n\s*\n\s*\n/g, '\n\n');
    s.fixedScript = text;
    s.isFixed = true;
    state.finalScript = text;

    renderScriptWithMarkers(stage);

    var downloadBtn = document.getElementById('btn-download');
    if (downloadBtn) downloadBtn.disabled = false;

    alert('수정본이 적용되었습니다.');
}

// ============================================================
// buildFixedScript — findBestMatch 기반 수정본 생성
// ============================================================
function buildFixedScript(stage) {
    var originalText = state[stage].originalScript || '';
    var errors = state[stage].allErrors || [];

    if (!originalText || !errors || errors.length === 0) return originalText;

    var replacements = [];
    for (var i = 0; i < errors.length; i++) {
        var err = errors[i];
        if (!err.useRevised || !err.original || !err.revised) continue;

        var searchText = err.original.trim();
        if (searchText.length === 0) continue;

        var revisedText = cleanRevisedText(err.revised);
        if (!revisedText || revisedText.length === 0) continue;

        var match = findBestMatch(originalText, searchText);
        if (match.found && match.position !== -1 && match.matchedText.length > 0) {
            replacements.push({
                position: match.position,
                length: match.matchedText.length,
                revisedText: revisedText
            });
        }
    }

    replacements.sort(function(a, b) { return a.position - b.position; });

    var finalReplacements = [];
    var lastEnd = 0;
    for (var i = 0; i < replacements.length; i++) {
        if (replacements[i].position >= lastEnd) {
            finalReplacements.push(replacements[i]);
            lastEnd = replacements[i].position + replacements[i].length;
        }
    }

    var result = '';
    var pos = 0;
    for (var i = 0; i < finalReplacements.length; i++) {
        var r = finalReplacements[i];
        if (r.position > pos) result += originalText.substring(pos, r.position);
        if (r.revisedText !== '__DELETE__') result += r.revisedText;
        pos = r.position + r.length;
    }
    if (pos < originalText.length) result += originalText.substring(pos);

    return result;
}
// ============================================================
// Gemini API 호출
// ============================================================

async function callGeminiAPI(prompt, cacheName, useCreativeMode) {
    var apiKey = localStorage.getItem('GEMINI_API_KEY');
    var validation = validateApiKey(apiKey);
    if (!validation.valid) throw new Error(validation.message);

    currentAbortController = new AbortController();
    var stopBtn = document.getElementById('btn-stop-analysis');
    if (stopBtn) stopBtn.disabled = false;

    var url = API_CONFIG.ENDPOINT + '/' + API_CONFIG.MODEL + ':generateContent?key=' + apiKey;

    // 분석 = 0.0 (항상 동일한 결과), 전면 수정 = 0.4 (창의적 리라이팅)
    var temp = useCreativeMode ? 0.4 : 0.0;
    var topP = useCreativeMode ? 0.95 : 0.1;

    var requestBody = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: temp,
            topK: 40,
            topP: topP,
            maxOutputTokens: API_CONFIG.MAX_OUTPUT_TOKENS
        }
    };

    if (cacheName) requestBody.cachedContent = cacheName;

    var response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: currentAbortController.signal
    });

    if (!response.ok) {
        var errorData = await response.json().catch(function() { return {}; });
        throw new Error('API 오류: ' + (errorData.error?.message || response.statusText));
    }

    var data = await response.json();
    if (stopBtn) stopBtn.disabled = true;
    currentAbortController = null;

    if (data.usageMetadata) {
        var um = data.usageMetadata;
        var cacheInfo = um.cachedContentTokenCount ? ' (캐시: ' + um.cachedContentTokenCount + '토큰)' : '';
        console.log('📊 토큰: 입력=' + (um.promptTokenCount || 0) + ', 출력=' + (um.candidatesTokenCount || 0) + cacheInfo);
    }

    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text;
    }
    throw new Error('API 응답 형식 오류');
}

async function retryWithDelay(fn, maxRetries, delayMs) {
    if (!maxRetries) maxRetries = 3;
    if (!delayMs) delayMs = 2000;
    for (var attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            if (error.name === 'AbortError') throw error;
            var is429 = error.message && (error.message.indexOf('429') > -1 || error.message.indexOf('Resource has been exhausted') > -1);
            if (is429 && attempt < maxRetries) {
                var waitTime = delayMs * attempt;
                console.log('⏳ 429 에러, ' + (waitTime / 1000) + '초 후 재시도 (' + attempt + '/' + maxRetries + ')');
                await new Promise(function(resolve) { setTimeout(resolve, waitTime); });
            } else {
                throw error;
            }
        }
    }
}

// ============================================================
// API 응답 파싱
// ============================================================
function parseApiResponse(responseText) {
    var jsonText = '';
    var jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
        jsonText = jsonMatch[1];
    } else {
        var jsonStart = responseText.indexOf('{');
        var jsonEnd = responseText.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) jsonText = responseText.substring(jsonStart, jsonEnd + 1);
    }

    if (!jsonText) throw new Error('JSON 파싱 실패');

    try {
        return JSON.parse(jsonText);
    } catch (e1) {
        // 부분 추출 시도
        var result = { errors: [], issues: [], scores: null };

        var errorsMatch = jsonText.match(/"errors"\s*:\s*\[([\s\S]*?)\]/);
        if (errorsMatch) {
            try { result.errors = JSON.parse('[' + errorsMatch[1] + ']'); } catch (e) {
                result.errors = extractIndividualObjects(errorsMatch[1]);
            }
        }

        var issuesMatch = jsonText.match(/"issues"\s*:\s*\[([\s\S]*?)\]/);
        if (issuesMatch) {
            try { result.issues = JSON.parse('[' + issuesMatch[1] + ']'); } catch (e) {
                result.issues = extractIndividualObjects(issuesMatch[1]);
            }
        }

        if (result.issues.length > 0 && result.errors.length === 0) result.errors = result.issues;

        var scoresMatch = jsonText.match(/"scores"\s*:\s*\{([^}]+)\}/);
        if (scoresMatch) {
            try { result.scores = JSON.parse('{' + scoresMatch[1] + '}'); } catch (e) { /* 무시 */ }
        }

        return result;
    }
}

function extractIndividualObjects(arrayContent) {
    var objects = [];
    var braceDepth = 0;
    var currentObj = '';
    var inString = false;
    var escapeNext = false;

    for (var i = 0; i < arrayContent.length; i++) {
        var ch = arrayContent[i];
        if (escapeNext) { currentObj += ch; escapeNext = false; continue; }
        if (ch === '\\') { currentObj += ch; escapeNext = true; continue; }
        if (ch === '"' && !escapeNext) { inString = !inString; currentObj += ch; continue; }
        if (!inString) {
            if (ch === '{') { if (braceDepth === 0) currentObj = ''; braceDepth++; currentObj += ch; }
            else if (ch === '}') {
                braceDepth--; currentObj += ch;
                if (braceDepth === 0 && currentObj.trim().length > 2) {
                    try { objects.push(JSON.parse(currentObj)); } catch (e) { /* 무시 */ }
                    currentObj = '';
                }
            } else { if (braceDepth > 0) currentObj += ch; }
        } else { currentObj += ch; }
    }
    return objects;
}

// ============================================================
// 나레이션 오류 필터
// ============================================================
function filterNarrationErrors(errors, script) {
    if (!errors || errors.length === 0 || !script) return errors || [];

    var narrationPatterns = [/^나레이션\s*:/im, /^NA\s*:/im, /^N\s*:/im, /^내레이션\s*:/im];
    var lines = script.split('\n');

    return errors.filter(function(err) {
        if (!err || !err.original) return true;
        for (var i = 0; i < lines.length; i++) {
            if (lines[i].indexOf(err.original) !== -1) {
                for (var j = 0; j < narrationPatterns.length; j++) {
                    if (narrationPatterns[j].test(lines[i])) return false;
                }
            }
        }
        return true;
    });
}

// ============================================================
// 캐시 관련 함수
// ============================================================
async function createScriptCache(script, systemInstruction, ttlSeconds) {
    var apiKey = localStorage.getItem('GEMINI_API_KEY');
    if (!apiKey || !script || script.length < 1500) return null;
    if (!ttlSeconds) ttlSeconds = 1800;

    var url = 'https://generativelanguage.googleapis.com/v1beta/cachedContents?key=' + apiKey;
    var requestBody = {
        model: 'models/' + API_CONFIG.MODEL,
        displayName: 'script-analysis-' + Date.now(),
        contents: [{ role: 'user', parts: [{ text: script }] }],
        ttl: ttlSeconds + 's'
    };
    if (systemInstruction) {
        requestBody.systemInstruction = { parts: [{ text: systemInstruction }] };
    }

    try {
        var response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
        if (!response.ok) return null;
        var data = await response.json();
        return (data && data.name) ? data.name : null;
    } catch (error) {
        console.error('❌ 캐시 생성 실패:', error.message);
        return null;
    }
}

async function deleteScriptCache(cacheName) {
    stopCacheTimer();
    if (!cacheName) return;
    var apiKey = localStorage.getItem('GEMINI_API_KEY');
    if (!apiKey) return;
    try {
        await fetch('https://generativelanguage.googleapis.com/v1beta/' + cacheName + '?key=' + apiKey, { method: 'DELETE' });
    } catch (error) { /* 무시 */ }
}

function startCacheTimer(cacheName, ttlSeconds) {
    stopCacheTimer();
    cacheTimer.cacheName = cacheName;
    cacheTimer.remainingSeconds = ttlSeconds;
    cacheTimer.warningShown = false;
    cacheTimer.intervalId = setInterval(function() {
        cacheTimer.remainingSeconds--;
        if (cacheTimer.remainingSeconds <= 0) { stopCacheTimer(); }
    }, 1000);
}

function stopCacheTimer() {
    if (cacheTimer.intervalId) { clearInterval(cacheTimer.intervalId); cacheTimer.intervalId = null; }
    cacheTimer.cacheName = null;
    cacheTimer.remainingSeconds = 0;
}

// ============================================================
// 청크 분할
// ============================================================
function splitScriptIntoChunks(script, chunkSize) {
    if (!script || script.length === 0) return [];
    if (!chunkSize) chunkSize = 5000;
    if (script.length <= chunkSize) {
        return [{ text: script, startIndex: 0, endIndex: script.length, chunkNum: 1, totalChunks: 1 }];
    }
    var chunks = [];
    var startIndex = 0;
    while (startIndex < script.length) {
        var endIndex = Math.min(startIndex + chunkSize, script.length);
        if (endIndex < script.length) {
            var lastNewline = script.lastIndexOf('\n', endIndex);
            if (lastNewline > startIndex) endIndex = lastNewline + 1;
        }
        chunks.push({ text: script.substring(startIndex, endIndex), startIndex: startIndex, endIndex: endIndex, chunkNum: chunks.length + 1, totalChunks: 0 });
        startIndex = endIndex;
    }
    for (var i = 0; i < chunks.length; i++) chunks[i].totalChunks = chunks.length;
    return chunks;
}

// ============================================================
// v5.0 역할 프롬프트 — 8개 항목, 4개 역할
// ============================================================

function buildRolePrompt(roleId, chunkText, chunkInfo, scriptLength) {
    var header = '당신은 이미 캐시에 제공된 전체 대본을 완전히 읽고 이해한 상태입니다.\n' +
        '전체 대본의 줄거리, 인물, 시간 흐름을 모두 파악하고 있습니다.\n' +
        '지금부터 전체 대본 중 아래 구간만 집중 분석하세요.\n' +
        '단, 이 구간 밖의 내용과 모순되는 부분도 반드시 검출하세요.\n\n' +
        '전체 대본 ' + scriptLength + '자 중 ' + chunkInfo + '\n\n' +
        '━━ 분석 대상 구간 ━━\n' + chunkText + '\n━━ 구간 끝 ━━\n\n';

    var footer = '\n\n## ⛔ 오류로 판정하지 말 것\n' +
        '- 나레이션 (나레이션:, NA:, N: 등으로 시작하는 줄)\n' +
        '- 나레이션의 조선어투/문어체 (허용됨)\n' +
        '- 지문/설명 (괄호 안의 행동 묘사)\n' +
        '- 음향효과 ([SE], [BGM] 등)\n\n' +
        '## 🚨 필수 응답 규칙\n' +
        '1. revised에 / 또는 () 넣지 마세요! 수정안 하나만!\n' +
        '2. original과 revised는 변경된 최소 범위만! 문장 전체 금지!\n' +
        '3. 확실한 오류만 보고하세요. 추측/의심 수준은 보고하지 마세요.\n\n' +
        '## 📤 응답 형식 (반드시 JSON만):\n' +
        '```json\n{"errors": [\n  {"type": "유형", "original": "원문 그대로", "revised": "수정안 하나만", "reason": "사유 15자 이내", "severity": "high/medium/low"}\n]}\n```';

    var rulesString = getHistoricalRulesString();

    // ============================================================
    // role1: 시대고증(100%) + 역사적 사실(90%)
    // ============================================================
    if (roleId === 'role1_historical') {
        return header +
            '## 🎯 당신의 역할: 시대고증 + 역사적 사실 검증관\n\n' +

            '### 검사항목 1: 시대고증 (분석 강도: 100% — 모든 오류 검출)\n' +
            '현대 물건/표현이 조선시대 대사에 사용되었는지 검사합니다.\n' +
            '아래 현대 단어가 대사에 있으면 무조건 오류입니다:\n\n' +
            '**필기구**: 펜, 볼펜, 연필, 지우개, 노트 → 붓, 먹, 서책\n' +
            '**조명**: 전등, 전구, 형광등, 손전등 → 촛불, 등잔, 횃불\n' +
            '**통신**: 전화, 휴대폰, 문자 → 전령, 파발, 서신\n' +
            '**교통**: 자동차, 기차, 버스, 택시, 비행기 → 가마, 마차, 말\n' +
            '**가전**: 냉장고, 에어컨, 선풍기, TV, 컴퓨터 → 석빙고, 부채\n' +
            '**음식**: 커피, 라면, 콜라, 햄버거, 피자 → 차, 국수, 닭고기\n' +
            '**의복**: 양복, 청바지, 티셔츠, 구두 → 도포, 한복, 짚신\n' +
            '**시설**: 병원, 학교, 경찰서, 은행, 카페 → 의원, 서당, 포도청\n' +
            '**직업**: 의사, 경찰, 선생님, 회사원 → 의원, 포졸, 훈장, 상인\n' +
            '**단위**: 미터, 킬로그램, 퍼센트, 원 → 자, 근, 할, 냥\n' +
            '**외래어**: OK, 오케이, 파이팅, 스트레스 → 조선식 표현\n\n' +
            '📋 전체 목록: ' + rulesString + '\n\n' +
            'type은 "시대고증"으로 표기하세요.\n\n' +

            '### 검사항목 2: 역사적 사실 (분석 강도: 90% — 확실한 오류만)\n' +
            '실제 그 시대의 문화/배경이 정확한지 검사합니다.\n' +
            '- 실존 인물의 행적과 다른 묘사\n' +
            '- 실존 사건의 시기/장소/결과가 틀린 경우\n' +
            '- 당시 존재하지 않던 제도/관직 언급\n' +
            '- 당시 문화/풍습과 맞지 않는 묘사\n\n' +
            '⚠️ 90% 강도: 애매하거나 해석이 갈리는 것은 보고하지 마세요.\n' +
            'type은 "역사적사실"로 표기하세요.\n' +
            footer;
    }

    // ============================================================
    // role2: 인물 설정(100%) + 시간 왜곡(100%) + 숫자/수량 불일치(100%)
    // ============================================================
    if (roleId === 'role2_person_time') {
        return header +
            '## 🎯 당신의 역할: 인물·시간·숫자 검증관\n\n' +

            '### 검사항목 1: 인물 설정 (분석 강도: 100% — 모든 오류 검출)\n' +
            '등장인물의 외형/성격/나이/이름/성별 등이 처음부터 끝까지 일관성 있게 유지되는지 검사합니다.\n' +
            '- 같은 인물의 나이가 장면마다 다르게 표기된 경우\n' +
            '- 인물의 외형 묘사가 앞뒤 불일치 (예: 앞에서 키가 작다 → 뒤에서 장신)\n' +
            '- 인물의 성격이 설명 없이 바뀐 경우\n' +
            '- 이름/성별이 혼동된 경우\n\n' +
            'type은 "인물설정"으로 표기하세요.\n\n' +

            '### 검사항목 2: 시간 왜곡 (분석 강도: 100% — 모든 오류 검출)\n' +
            '이야기 흐름상 계절/월(1~12월)/시간/요일/아침·점심·저녁·오전·오후 등 시간적 흐름의 왜곡 오류를 검사합니다.\n' +
            '- 같은 사건에 대해 다른 시간 언급 (예: "일 년 전" vs "칠 년도 더 되었다")\n' +
            '- 시간 순서 역전 (아침 → 저녁 → 다시 아침, 같은 날인데)\n' +
            '- 계절 불일치 (봄이라고 했는데 눈이 내림)\n' +
            '- 요일/날짜 모순\n\n' +
            '⚠️ 이 구간 밖의 시간 표현(캐시의 전체 대본)과도 반드시 비교하세요!\n' +
            'type은 "시간왜곡"으로 표기하세요.\n\n' +

            '### 검사항목 3: 숫자/수량 불일치 (분석 강도: 100%)\n' +
            '아라비안 숫자(1,2,3...) 및 한자 수사(일,이,삼,사,오,육,칠,팔,구,십,백,천,만)의 수량이 앞뒤에서 일치하는지만 검사합니다.\n' +
            '- 예: "군사 삼천 명" → 뒤에서 "오천 명의 군사" → 오류\n' +
            '- 예: "3명이 왔다" → 뒤에서 "5명이 모였다" (같은 상황인데) → 오류\n\n' +
            '⚠️ 아라비안 숫자(0~9)와 한자 수사(일~만) 이외의 숫자 표현은 검사하지 마세요.\n' +
            '⚠️ 서로 다른 상황의 숫자는 비교하지 마세요.\n' +
            'type은 "숫자불일치"로 표기하세요.\n' +
            footer;
    }

    // ============================================================
    // role3: 이야기 흐름(90%) + 쌩뚱맞은 표현(100%)
    // ============================================================
    if (roleId === 'role3_structure') {
        return header +
            '## 🎯 당신의 역할: 이야기 흐름 + 표현 검증관\n\n' +

            '### 검사항목 1: 이야기 흐름 (분석 강도: 90% — 확실한 오류만)\n' +
            '이야기 전개가 자연스럽게 진행되는지 검사합니다.\n' +
            '- 앞 장면과 전혀 연결이 안 되는 갑작스러운 전개\n' +
            '- 인과관계 없이 갑자기 결론으로 점프\n' +
            '- 설명 없이 새로운 상황이 갑자기 등장\n\n' +
            '⚠️ 90% 강도: 약간 어색한 정도는 보고하지 마세요. 명확히 연결이 끊긴 경우만 보고하세요.\n' +
            '⚠️ 작가의 의도적인 장면 전환(씬 전환)은 오류가 아닙니다.\n' +
            'type은 "이야기흐름"으로 표기하세요.\n\n' +

            '### 검사항목 2: 쌩뚱맞은 표현 (분석 강도: 100% — 모든 오류 검출)\n' +
            '갑자기 다른 인물 또는 이야기 흐름에 맞지 않는 대사/상황이 등장하는지 검사합니다.\n' +
            '- 상황과 전혀 맞지 않는 대사\n' +
            '- 분위기를 깨는 부적절한 표현\n' +
            '- 문맥에 맞지 않는 엉뚱한 말\n' +
            '- 해당 인물이 할 수 없는 말이나 행동\n\n' +
            'type은 "쌩뚱맞은표현"으로 표기하세요.\n' +
            footer;
    }

    // ============================================================
    // role4: 캐릭터 일관성(100%)
    // ============================================================
    if (roleId === 'role4_character') {
        return header +
            '## 🎯 당신의 역할: 캐릭터 일관성 검증관\n\n' +

            '### 검사항목: 캐릭터 일관성 (분석 강도: 100% — 모든 오류 검출)\n' +
            '등장인물 간의 관계가 처음부터 끝까지 일관되게 유지되는지 검사합니다.\n\n' +
            '- 인물 간 호칭이 일관되지 않는 경우 (예: "아버지" → 갑자기 "아빠")\n' +
            '- 인물 간 관계 설정이 앞뒤 모순 (예: 형제라고 했는데 나중에 친구)\n' +
            '- 같은 인물이 장면마다 다른 성격으로 말하는 경우 (설명 없이)\n' +
            '- 말투가 갑자기 바뀌는 경우 (존댓말↔반말, 설명 없이)\n' +
            '- 신분에 맞지 않는 호칭/말투 사용\n\n' +
            '⚠️ 이 구간 밖의 인물 관계(캐시의 전체 대본)와도 반드시 비교하세요!\n' +
            '⚠️ 의도적인 성격 변화(사건으로 인한 변화 등)는 오류가 아닙니다.\n' +
            'type은 "캐릭터일관성"으로 표기하세요.\n' +
            footer;
    }

    return header + '이 구간에서 오류를 찾아주세요.' + footer;
}

// ============================================================
// 매트릭스 분석 (역할 × 청크 동시 실행)
// ============================================================
async function runMatrixAnalysis(script, roles, cacheName, chunkSize, progressStart, progressEnd, stageLabel) {
    if (!chunkSize) chunkSize = 6500;
    if (!progressStart) progressStart = 10;
    if (!progressEnd) progressEnd = 85;
    if (!stageLabel) stageLabel = '분석';

    var chunks = splitScriptIntoChunks(script, chunkSize);
    var totalCalls = roles.length * chunks.length;

    console.log('📦 매트릭스 분석: ' + roles.length + '역할 × ' + chunks.length + '청크 = ' + totalCalls + '호출');

    var allPromises = [];
    var promiseMeta = [];

    for (var r = 0; r < roles.length; r++) {
        for (var c = 0; c < chunks.length; c++) {
            var chunk = chunks[c];
            var chunkInfo = chunk.startIndex + '~' + chunk.endIndex + '자 (' + (c + 1) + '/' + chunks.length + ')';
            var prompt = buildRolePrompt(roles[r].id, chunk.text, chunkInfo, script.length);

            (function(roleIdx, chunkIdx, roleId, roleName, chunkTextRef, promptRef, cacheNameRef) {
                allPromises.push(
                    retryWithDelay(function() { return callGeminiAPI(promptRef, cacheNameRef); }, 3, 3000)
                );
                promiseMeta.push({ roleIdx: roleIdx, chunkIdx: chunkIdx, roleId: roleId, roleName: roleName, chunkText: chunkTextRef });
            })(r, c, roles[r].id, roles[r].name, chunk.text, prompt, cacheName);
        }
    }

    updateProgress(progressStart + 5, stageLabel + ' 중... (' + totalCalls + '개 동시 호출)');

    var results = await Promise.allSettled(allPromises);

    var allErrors = [];
    var successCount = 0;

    for (var i = 0; i < results.length; i++) {
        var meta = promiseMeta[i];
        var progressPercent = progressStart + Math.round(((i + 1) / results.length) * (progressEnd - progressStart));
        updateProgress(progressPercent, stageLabel + ' 결과 처리 중... (' + (i + 1) + '/' + results.length + ')');

        if (results[i].status === 'fulfilled') {
            successCount++;
            try {
                var parsed = parseApiResponse(results[i].value);
                var errors = parsed.errors || parsed.issues || [];
                errors = filterNarrationErrors(errors, meta.chunkText);
                for (var e = 0; e < errors.length; e++) {
                    errors[e]._role = meta.roleId;
                    errors[e]._chunkNum = meta.chunkIdx + 1;
                    allErrors.push(errors[e]);
                }
                console.log('   ✅ ' + meta.roleName + ' 청크' + (meta.chunkIdx + 1) + ': ' + errors.length + '개 오류');
            } catch (parseError) {
                console.error('   ⚠️ ' + meta.roleName + ' 청크' + (meta.chunkIdx + 1) + ' 파싱 실패');
            }
        } else {
            console.error('   ❌ ' + meta.roleName + ' 청크' + (meta.chunkIdx + 1) + ' 실패');
        }
    }

    // 중복 제거
    var seen = {};
    var merged = [];
    for (var i = 0; i < allErrors.length; i++) {
        var err = allErrors[i];
        if (!err || !err.original) continue;
        var key = (err.original || '').trim().substring(0, 50);
        if (!seen[key]) { seen[key] = true; merged.push(err); }
    }

    console.log('📊 매트릭스 완료: 성공 ' + successCount + '/' + totalCalls + ', 오류 ' + allErrors.length + ' → 중복 제거 후 ' + merged.length);
    return { errors: merged };
}

// ============================================================
// 1차 분석 실행 (v5.2: 오류 검출 + 심층 분석 통합)
// ============================================================
// ============================================================
// 심층 분석 프롬프트 생성
// ============================================================
// ============================================================
// 심층 분석 프롬프트 생성 (v5.3: 초반 후킹 강화)
// ============================================================
function buildDeepAnalysisPrompt(scriptText, scriptLength) {
    return '당신은 20년 경력의 시니어 타깃 유튜브 사극 콘텐츠 총괄 PD입니다.\n' +
        '캐시에 제공된 전체 대본(' + scriptLength + '자)을 완전히 읽고 분석한 상태입니다.\n\n' +

        '아래 체크리스트 기준으로 대본을 심층 분석하세요.\n' +
        '문제가 있는 항목만 보고하세요. 문제 없는 항목은 보고하지 마세요.\n\n' +

        '## 🔥🔥🔥 초반 후킹 분석 (최우선 — 가장 중요)\n\n' +
        '초반 후킹은 이 대본의 성패를 결정합니다. 아래 7개 항목을 반드시 전부 검사하세요.\n\n' +

        '### H-1. 첫 문장 검사 (severity: 반드시 high)\n' +
        '첫 문장이 아래 4가지 중 하나인가?\n' +
        '① 생명 위협 ② 강한 감정 충돌 ③ 충격적 발언 ④ 즉각적 위험 사건\n' +
        '→ 배경 설명, 날씨 묘사, 시간 설명으로 시작하면 무조건 오류\n' +
        '→ 첫 문장은 독자가 "무슨 일이야?"라고 느껴야 합니다.\n\n' +

        '### H-2. 초반 30초 긴장 밀도 (약 150~200자)\n' +
        '처음 200자 안에 아래 긴장 요소가 2개 이상 있는가?\n' +
        '- 위협 / 충돌 / 비정상 상황 / 감정 폭발 / 죽음·처벌 위험\n' +
        '→ 1개 이하이면 오류 (severity: high)\n\n' +

        '### H-3. 궁금증 3개 생성 (약 500~700자 이내)\n' +
        '1~2분 분량 안에 아래 3가지 궁금증이 자연스럽게 생기는가?\n' +
        '❶ 왜 이런 일이 벌어졌는가?\n' +
        '❷ 누가 숨기고 있는가?\n' +
        '❸ 과거에 무슨 일이 있었는가?\n' +
        '→ 2개 이하이면 오류\n\n' +

        '### H-4. 초반 감정 동시 삽입\n' +
        '초반 사건에 감정이 함께 있는가?\n' +
        '(죄책감/두려움/원망/배신/절망/보호 본능 중 최소 2개)\n' +
        '→ 사건만 있고 감정이 없으면 오류 (severity: high)\n\n' +

        '### H-5. 초반 속도 위반\n' +
        '초반 500자 안에서 설명이 30%를 넘는가?\n' +
        '사건→반응→궁금증→설명 순서를 지키는가?\n' +
        '→ 설명이 먼저 나오거나 설명이 30% 초과하면 오류\n\n' +

        '### H-6. 후킹 유형 부재\n' +
        '아래 5가지 후킹 유형 중 최소 1개가 있는가?\n' +
        '① 고발형 ② 죽음 암시형 ③ 과거 폭로형 ④ 처벌 위기형 ⑤ 기억 폭로형\n' +
        '→ 하나도 없으면 오류\n\n' +

        '### H-7. 초반 종합 판정\n' +
        '위 H-1~H-6을 종합했을 때, 초반 2분 안에 시청자가 이탈할 가능성이 있는가?\n' +
        '→ 있으면 severity: high로 구체적 수정안 제시\n\n' +

        '## 😰 감정 삽입 검사\n' +
        '4. 주요 사건마다 감정이 함께 있는가? (사건만 있고 감정 없으면 오류)\n' +
        '5. 중반 이후 감정 반전 포인트가 1회 이상 있는가?\n\n' +

        '## ⚡ 긴장·흐름 검사\n' +
        '6. 긴장 상승 곡선 유지되는가? (중간 긴장 하락 구간 있으면 오류)\n' +
        '7. 장면 전환마다 오해/갈등/위험/의심/감정충돌 중 하나가 있는가?\n' +
        '8. 실마리 점진 공개 곡선을 따르는가?\n' +
        '9. 5파트 구조를 갖추고 있는가? (강후킹→갈등확대→위기심화→진실조각→강한여운)\n\n' +

        '## 🌙 엔딩·몰입 검사\n' +
        '10. 엔딩이 완전 해설형이면 오류\n' +
        '11. 시청자 몰입 장치가 있는가? (반복 단서/기억되는 물건/상징 행동)\n' +
        '12. 중반 처짐 구간이 있으면 오류\n' +
        '13. 클리프행어가 있는가?\n\n' +

        '## 📤 응답 형식 (반드시 JSON만)\n' +
        '```json\n' +
        '{"issues": [\n' +
        '  {\n' +
        '    "deepType": "초반후킹",\n' +
        '    "type": "심층분석",\n' +
        '    "checkNum": 1,\n' +
        '    "severity": "high",\n' +
        '    "original": "해당 구간의 원문 텍스트 (최소 20자, 최대 100자)",\n' +
        '    "revised": "수정안 (구체적으로 대체할 텍스트)",\n' +
        '    "reason": "구체적 분석 사유",\n' +
        '    "location": "초반"\n' +
        '  }\n' +
        ']}\n' +
        '```\n\n' +
        '## 🚨 필수 규칙\n' +
        '1. original은 대본에서 실제 존재하는 텍스트를 그대로 복사 (20자 이상)\n' +
        '2. revised는 수정안 하나만 (/ 금지, () 설명 금지)\n' +
        '3. 문제 없는 항목은 보고하지 마세요\n' +
        '4. deepType: 초반후킹 / 감정삽입 / 긴장흐름 / 엔딩몰입 중 하나\n' +
        '5. location: 초반 / 중반 / 후반 / 엔딩 중 하나\n' +
        '6. 초반후킹 항목은 severity를 반드시 high로 설정\n';
}

// ============================================================
// 심층 분석 실행
// ============================================================
async function runDeepAnalysis(script, cacheName) {
    var prompt = buildDeepAnalysisPrompt(script, script.length);

    try {
        var response = await retryWithDelay(function() {
            return callGeminiAPI(prompt, cacheName);
        }, 3, 3000);

        var parsed = parseApiResponse(response);
        var issues = parsed.issues || parsed.errors || [];

        // 유효성 검증
        var validated = [];
        issues.forEach(function(item) {
            if (!item.original || item.original.trim().length < 5) return;
            if (!item.reason) return;

            // original이 실제 대본에 존재하는지 확인
            var found = findBestMatch(script, item.original.trim());

            validated.push({
                deepType: item.deepType || '심층분석',
                type: '심층분석',
                checkNum: item.checkNum || 0,
                severity: item.severity || 'medium',
                original: found.found ? found.matchedText : item.original.trim(),
                revised: item.revised || '',
                reason: item.reason || '',
                location: item.location || '',
                _matchPosition: found.found ? found.position : -1
            });
        });

        // 위치순 정렬
        validated.sort(function(a, b) {
            return (a._matchPosition || 0) - (b._matchPosition || 0);
        });

        return validated;

    } catch (error) {
        console.error('❌ 심층 분석 실패:', error.message);
        return [];
    }
}

async function startStage1Analysis() {
    var script = document.getElementById('original-script').value.trim();
    if (!script) { alert('분석할 대본을 입력해주세요.'); return; }
    var apiKey = localStorage.getItem('GEMINI_API_KEY');
    if (!apiKey) { alert('API 키를 먼저 설정해주세요.'); return; }

    showProgress('분석 시작...');
    updateProgress(2, '준비 중...');

    try {
        state.stage1.originalScript = script;
        state.stage1.isFixed = false;
        state.stage1.currentErrorIndex = -1;

        // 캐시 생성
        updateProgress(3, '📦 전체 대본 캐시 생성 중...');

        var systemPrompt = '당신은 조선시대 사극 대본 전문 검수자입니다. ' +
            '사용자가 제공한 전체 대본을 완전히 이해한 상태에서, ' +
            '요청받은 역할에 따라 집중 분석합니다. ' +
            '전체 대본의 인물, 시간, 장소, 관계를 모두 파악하고 있어야 합니다. ' +
            '확실한 오류만 보고하세요. 추측이나 의심 수준은 보고하지 마세요.';

        var cacheName = await createScriptCache(script, systemPrompt, 1800);
        state._cacheName = cacheName;

        if (!cacheName) {
            console.log('⚠️ 캐시 생성 실패');
            alert('캐시 생성에 실패했습니다. 다시 시도해주세요.');
            hideProgress();
            return;
        }

        console.log('✅ 캐시 생성 성공: ' + cacheName);
        startCacheTimer(cacheName, 1800);

        // ── Phase 1: 기존 오류 검출 (4역할) ──
        updateProgress(8, '🔍 오류 검출 분석 시작...');

        var roles = [
            { id: 'role1_historical', name: '시대고증+역사적사실' },
            { id: 'role2_person_time', name: '인물+시간+숫자' },
            { id: 'role3_structure', name: '이야기흐름+쌩뚱표현' },
            { id: 'role4_character', name: '캐릭터일관성' }
        ];

        var matrixResult = await runMatrixAnalysis(script, roles, cacheName, 6500, 10, 60, '오류 검출');
        var mergedErrors = matrixResult.errors;

        console.log('🔍 오류 검출 완료: ' + mergedErrors.length + '개');

        // ── Phase 2: 심층 분석 (프롬프트 기반) ──
        updateProgress(62, '🧠 심층 분석 시작...');

        var deepAnalysisResult = await runDeepAnalysis(script, cacheName);

        console.log('🧠 심층 분석 완료: ' + deepAnalysisResult.length + '개 항목');

        // ── 결과 통합 저장 ──
        updateProgress(87, '결과 저장 중...');

        var allItems = [];
        var idx = 0;

        // 오류 검출 결과
        mergedErrors.forEach(function(err) {
            allItems.push({
                id: 'error-' + idx,
                type: err.type || '기타',
                category: 'error',
                original: err.original || '',
                revised: err.revised || err.suggestion || '',
                reason: err.reason || '',
                severity: err.severity || 'medium',
                useRevised: true
            });
            idx++;
        });

        // 심층 분석 결과
        deepAnalysisResult.forEach(function(item) {
            allItems.push({
                id: 'deep-' + idx,
                type: item.type || '심층분석',
                category: 'deep',
                original: item.original || '',
                revised: item.revised || '',
                reason: item.reason || '',
                severity: item.severity || 'medium',
                useRevised: true,
                deepType: item.deepType || '',
                location: item.location || ''
            });
            idx++;
        });

        state.stage1.allErrors = allItems;

        updateProgress(90, '결과 표시 중...');
        displayStage1Results();

        // 캐시 정리
        if (state._cacheName) {
            deleteScriptCache(state._cacheName);
            state._cacheName = null;
        }

        updateProgress(100, '분석 완료!');
        setTimeout(hideProgress, 1000);

    } catch (error) {
        if (state._cacheName) { deleteScriptCache(state._cacheName); state._cacheName = null; }
        if (error.name !== 'AbortError') alert('분석 중 오류가 발생했습니다: ' + error.message);
        hideProgress();
    }
}

// ============================================================
// 분석 결과 표시 (v5.2: 오류 검출 + 심층 분석 통합 테이블)
// ============================================================
function displayStage1Results() {
    var container = document.getElementById('analysis-stage1');
    if (!container) return;
    var allItems = state.stage1.allErrors;

    if (!allItems || allItems.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:30px;color:#69f0ae;font-size:18px;">✅ 오류가 발견되지 않았습니다.</div>';
    } else {
        // 오류 검출과 심층 분석 분리
        var errorItems = allItems.filter(function(item) { return item.category === 'error'; });
        var deepItems = allItems.filter(function(item) { return item.category === 'deep'; });

        var html = '';

        // ── 오류 검출 섹션 ──
        if (errorItems.length > 0) {
            html += '<div style="padding:8px 12px;background:#ff555520;border-left:4px solid #ff5555;margin-bottom:8px;border-radius:4px;">' +
                '<span style="font-weight:bold;color:#ff5555;">🔍 오류 검출</span>' +
                '<span style="color:#aaa;font-size:12px;margin-left:8px;">' + errorItems.length + '건</span></div>';

            html += '<table class="analysis-table"><thead><tr>' +
                '<th>유형</th><th>원문</th><th>수정</th><th>사유</th>' +
                '</tr></thead><tbody>';

            errorItems.forEach(function(err) {
                var severityColor = err.severity === 'high' ? '#ff5555' : (err.severity === 'medium' ? '#ffaa00' : '#69f0ae');
                html += '<tr data-marker-id="' + err.id + '" style="cursor:pointer;">' +
                    '<td class="type-cell" style="color:' + severityColor + ';font-weight:bold;">' + formatTypeText(err.type) + '</td>' +
                    '<td style="color:#ff9800;font-size:11px;">' + escapeHtml(err.original) + '</td>' +
                    '<td style="color:#69f0ae;font-size:11px;">' + escapeHtml(err.revised) + '</td>' +
                    '<td style="color:#aaa;font-size:11px;">' + escapeHtml(err.reason) + '</td></tr>';
            });

            html += '</tbody></table>';
        }

        // ── 심층 분석 섹션 ──
        if (deepItems.length > 0) {
            html += '<div style="padding:8px 12px;background:#FFD70020;border-left:4px solid #FFD700;margin:12px 0 8px 0;border-radius:4px;">' +
                '<span style="font-weight:bold;color:#FFD700;">🧠 심층 분석</span>' +
                '<span style="color:#aaa;font-size:12px;margin-left:8px;">' + deepItems.length + '건</span></div>';

            html += '<table class="analysis-table"><thead><tr>' +
                '<th style="width:55px;">항목</th><th>해당 구간</th><th>수정안</th><th>분석 내용</th>' +
                '</tr></thead><tbody>';

            // deepType별 색상/아이콘
            var deepTypeStyle = {
                '초반후킹': { color: '#FF416C', icon: '🔥', label: '초반\n후킹' },
                '감정삽입': { color: '#E040FB', icon: '😰', label: '감정\n삽입' },
                '긴장흐름': { color: '#FF9800', icon: '⚡', label: '긴장\n흐름' },
                '문체구성': { color: '#42A5F5', icon: '🎭', label: '문체\n구성' },
                '엔딩몰입': { color: '#66BB6A', icon: '🌙', label: '엔딩\n몰입' }
            };

            deepItems.forEach(function(item) {
                var style = deepTypeStyle[item.deepType] || { color: '#FFD700', icon: '🧠', label: item.deepType || '심층' };
                var severityBadge = '';
                if (item.severity === 'high') {
                    severityBadge = '<span style="display:inline-block;background:#ff5555;color:#fff;font-size:9px;padding:1px 4px;border-radius:3px;margin-top:2px;">긴급</span>';
                } else if (item.severity === 'medium') {
                    severityBadge = '<span style="display:inline-block;background:#ffaa00;color:#000;font-size:9px;padding:1px 4px;border-radius:3px;margin-top:2px;">권장</span>';
                }

                var locationBadge = '';
                if (item.location) {
                    locationBadge = '<span style="display:inline-block;background:#ffffff15;color:#aaa;font-size:9px;padding:1px 4px;border-radius:3px;margin-top:2px;">' + item.location + '</span>';
                }

                html += '<tr data-marker-id="' + item.id + '" style="cursor:pointer;border-left:3px solid ' + style.color + ';">' +
                    '<td class="type-cell" style="text-align:center;">' +
                        '<span style="font-size:14px;">' + style.icon + '</span><br>' +
                        '<span style="font-size:10px;color:' + style.color + ';font-weight:bold;line-height:1.2;white-space:pre-line;">' + style.label + '</span><br>' +
                        severityBadge + '<br>' + locationBadge +
                    '</td>' +
                    '<td style="color:#ff9800;font-size:11px;">' + escapeHtml(item.original) + '</td>' +
                    '<td style="color:#69f0ae;font-size:11px;">' + escapeHtml(item.revised) + '</td>' +
                    '<td style="color:#ccc;font-size:11px;">' + escapeHtml(item.reason) + '</td></tr>';
            });

            html += '</tbody></table>';
        }

        container.innerHTML = html;

        // ── 모든 행 클릭 이벤트 ──
        container.querySelectorAll('tr[data-marker-id]').forEach(function(row) {
            row.addEventListener('click', function() {
                var markerId = this.getAttribute('data-marker-id');
                var errorIndex = findErrorIndexById('stage1', markerId);
                if (errorIndex >= 0) {
                    setCurrentError('stage1', errorIndex);
                }
            });
        });
    }

    renderScriptWithMarkers('stage1');

    // 버튼 활성화
    var hasItems = allItems && allItems.length > 0;
    var btnBefore = document.getElementById('btn-revert-before-stage1');
    var btnAfter = document.getElementById('btn-revert-after-stage1');
    var btnFix = document.getElementById('btn-fix-script-stage1');
    if (btnBefore) btnBefore.disabled = !hasItems;
    if (btnAfter) btnAfter.disabled = !hasItems;
    if (btnFix) btnFix.disabled = false;
}

async function calculateAndDisplayScores() {
    var fixedScript = state.stage1.fixedScript || state.finalScript || '';

    if (!fixedScript || fixedScript.trim().length < 50) {
        alert('점수를 산출하려면 먼저 분석 후 "대본 픽스"를 완료해주세요.');
        return;
    }

    var apiKey = localStorage.getItem('GEMINI_API_KEY');
    if (!apiKey) { alert('API 키를 먼저 설정해주세요.'); return; }

    var scoreBtn = document.getElementById('btn-calculate-score');
    if (scoreBtn) { scoreBtn.disabled = true; scoreBtn.textContent = '⏳ 점수 산출 중...'; }

    showProgress('📊 점수 산출 중...');
    updateProgress(10, 'AI 점수 분석 중...');

    try {
        // 캐시 생성
        var cacheName = await createScriptCache(fixedScript, '당신은 사극 드라마 품질 평가 전문가입니다.', 600);

        var scorePrompt = '당신은 사극 드라마 품질 평가 전문가입니다.\n' +
            '아래 대본(캐시에 제공됨)을 4가지 관점에서 평가하세요.\n\n' +
            '## 📊 점수 산출 기준 (100점 시작, 감점 방식)\n\n' +
            '### 시니어 적합도 (대사 전달력):\n' +
            '- 50자 초과 대사 1개당: -5점 (최대 -25점)\n' +
            '- 30~50자 대사 1개당: -2점 (최대 -14점)\n' +
            '- 불명확한 대명사(그가/그녀가) 1개당(3개 초과분): -3점 (최대 -18점)\n' +
            '- 어려운 한자어/전문용어 1개당: -2점 (최대 -12점)\n' +
            '- 문어체 대사 1개당: -3점 (최대 -15점)\n\n' +
            '### 재미 요소 (극적 흡인력):\n' +
            '- 갈등/대립 구조 부재: -15점\n' +
            '- 반전/의외성 부족: -10점\n' +
            '- 감정 표현 부족(3개 미만): -8점\n' +
            '- 긴장/이완 리듬 부재: -10점\n' +
            '- 인물 간 관계 변화 부재: -7점\n\n' +
            '### 이야기 흐름 (서사 구조 완성도):\n' +
            '- 장면 전환 설명 부족: -5~-10점\n' +
            '- 인과관계 표현 부족: -7점\n' +
            '- 시간 순서 혼란: -10점\n' +
            '- 복선 미회수: -8점\n\n' +
            '### 시청자 이탈 방지 (연출 활용도):\n' +
            '- 초반 훅 부재: -12점\n' +
            '- 클리프행어 부재: -8점\n' +
            '- 중반 처짐 구간: -10점\n' +
            '- 지문/무대지시 부족: -5점\n' +
            '- 감각적 묘사 부족: -5점\n\n' +
            '## 📤 응답 형식 (반드시 JSON만):\n' +
            '```json\n{\n' +
            '  "scores": { "senior": 75, "fun": 70, "flow": 80, "retention": 72 },\n' +
            '  "scoreDetails": {\n' +
            '    "senior": ["감점 사유1 (-N점)", "감점 사유2 (-N점)"],\n' +
            '    "fun": ["감점 사유1 (-N점)"],\n' +
            '    "flow": ["감점 사유1 (-N점)"],\n' +
            '    "retention": ["감점 사유1 (-N점)"]\n' +
            '  }\n' +
            '}\n```';

        updateProgress(30, 'AI 응답 대기 중...');

        var response = await callGeminiAPI(scorePrompt, cacheName);
        var parsed = parseApiResponse(response);

        // 캐시 정리
        if (cacheName) deleteScriptCache(cacheName);

        updateProgress(60, '로컬 점수 계산 중...');

        var aiScores = parsed.scores || { senior: 75, fun: 75, flow: 75, retention: 75 };
        var aiDetails = parsed.scoreDetails || {};

        // 로컬 계산으로 보정
        var localResult = calculateScoresLocally(fixedScript);

        // AI + 로컬 평균
        var finalScores = {
            senior: Math.round((aiScores.senior + localResult.scores.senior) / 2),
            fun: Math.round((aiScores.fun + localResult.scores.fun) / 2),
            flow: Math.round((aiScores.flow + localResult.scores.flow) / 2),
            retention: Math.round((aiScores.retention + localResult.scores.retention) / 2)
        };

        // 감점 사항 통합 (AI 우선, 로컬 보충)
        var finalDeductions = {
            senior: (aiDetails.senior && aiDetails.senior.length > 0) ? aiDetails.senior : localResult.deductions.senior,
            fun: (aiDetails.fun && aiDetails.fun.length > 0) ? aiDetails.fun : localResult.deductions.fun,
            flow: (aiDetails.flow && aiDetails.flow.length > 0) ? aiDetails.flow : localResult.deductions.flow,
            retention: (aiDetails.retention && aiDetails.retention.length > 0) ? aiDetails.retention : localResult.deductions.retention
        };

        state.scores = { finalScores: finalScores, deductions: finalDeductions };

        updateProgress(90, '결과 표시 중...');
        displayScores(finalScores, finalDeductions);
        showPerfectScriptSection();

        updateProgress(100, '점수 산출 완료!');
        setTimeout(hideProgress, 1000);

    } catch (error) {
        if (error.name !== 'AbortError') alert('점수 산출 중 오류: ' + error.message);
        hideProgress();
    } finally {
        if (scoreBtn) { scoreBtn.disabled = false; scoreBtn.textContent = '📊 점수 산출'; }
    }
}

// ============================================================
// 로컬 점수 계산
// ============================================================
function calculateScoresLocally(script) {
    var lines = script.split('\n');

    // 시니어 적합도
    var seniorScore = 100;
    var seniorDeductions = [];

    var veryLongCount = 0;
    var longCount = 0;
    lines.forEach(function(line) {
        var len = line.trim().length;
        if (len > 50) veryLongCount++;
        else if (len > 30) longCount++;
    });
    if (veryLongCount > 0) { var d = Math.min(veryLongCount * 5, 25); seniorScore -= d; seniorDeductions.push('50자 초과 대사 ' + veryLongCount + '개 (-' + d + '점)'); }
    if (longCount > 0) { var d = Math.min(longCount * 2, 14); seniorScore -= d; seniorDeductions.push('30~50자 대사 ' + longCount + '개 (-' + d + '점)'); }

    var pronouns = (script.match(/그가|그녀가|그는|그녀는|그들이/g) || []).length;
    if (pronouns > 3) { var d = Math.min((pronouns - 3) * 3, 18); seniorScore -= d; seniorDeductions.push('불명확 대명사 ' + pronouns + '개 (-' + d + '점)'); }

    var literary = 0;
    lines.forEach(function(line) {
        if (line.match(/^[가-힣]{2,4}\s*[:：]/) && !line.match(/^나레이션|^NA|^N:/i)) {
                   // 문체 검사 비활성화
        }
    });
        // 문체 감점 비활성화

    // 재미 요소
    var funScore = 100;
    var funDeductions = [];

    var conflictKw = ['갈등', '다투', '싸우', '대립', '충돌', '반대', '거부', '분노', '배신', '의심'];
    if (!conflictKw.some(function(kw) { return script.includes(kw); })) { funScore -= 15; funDeductions.push('갈등/대립 구조 부재 (-15점)'); }

    var twistKw = ['그런데', '하지만', '그러나', '뜻밖에', '갑자기', '알고 보니', '사실은'];
    var twistCount = twistKw.reduce(function(c, kw) { return c + (script.match(new RegExp(kw, 'g')) || []).length; }, 0);
    if (twistCount < 2) { funScore -= 10; funDeductions.push('반전/의외성 부족 (-10점)'); }

    var emotionKw = ['기뻐', '슬퍼', '화가', '두려', '설레', '미안', '사랑', '눈물'];
    var emotionCount = emotionKw.reduce(function(c, kw) { return c + (script.match(new RegExp(kw, 'g')) || []).length; }, 0);
    if (emotionCount < 3) { funScore -= 8; funDeductions.push('감정 표현 부족 (-8점)'); }

    // 이야기 흐름
    var flowScore = 100;
    var flowDeductions = [];

    var transKw = ['그때', '한편', '다음 날', '며칠 후', '잠시 후', '이튿날'];
    var transCount = transKw.reduce(function(c, kw) { return c + (script.match(new RegExp(kw, 'g')) || []).length; }, 0);
    if (transCount < 2) { flowScore -= 10; flowDeductions.push('장면 전환 설명 부족 (-10점)'); }

    var causalKw = ['때문에', '그래서', '따라서', '덕분에', '결국', '탓에'];
    var causalCount = causalKw.reduce(function(c, kw) { return c + (script.match(new RegExp(kw, 'g')) || []).length; }, 0);
    if (causalCount < 2) { flowScore -= 7; flowDeductions.push('인과관계 표현 부족 (-7점)'); }

    // 시청자 이탈 방지
    var retentionScore = 100;
    var retentionDeductions = [];

    var firstPart = script.substring(0, Math.min(500, script.length));
    var hookKw = ['비밀', '충격', '놀라운', '사건', '변사체', '피', '비명', '급보'];
    if (!hookKw.some(function(kw) { return firstPart.includes(kw); })) { retentionScore -= 12; retentionDeductions.push('초반 훅 부재 (-12점)'); }

    var lastPart = script.substring(Math.max(0, script.length - 500));
    var cliffKw = ['과연', '어떻게', '설마', '아니', '그럴 리가'];
    if (!cliffKw.some(function(kw) { return lastPart.includes(kw); })) { retentionScore -= 8; retentionDeductions.push('클리프행어 부재 (-8점)'); }

    var stageDir = (script.match(/\([^)]+\)/g) || []).length;
    if (stageDir / Math.max(lines.length, 1) < 0.1) { retentionScore -= 5; retentionDeductions.push('지문/무대지시 부족 (-5점)'); }

    return {
        scores: {
            senior: Math.max(30, Math.min(100, seniorScore)),
            fun: Math.max(30, Math.min(100, funScore)),
            flow: Math.max(30, Math.min(100, flowScore)),
            retention: Math.max(30, Math.min(100, retentionScore))
        },
        deductions: {
            senior: seniorDeductions,
            fun: funDeductions,
            flow: flowDeductions,
            retention: retentionDeductions
        }
    };
}

// ============================================================
// 점수 표시
// ============================================================
function displayScores(scores, deductions) {
    var scoreDisplay = document.getElementById('score-display');
    if (!scoreDisplay) return;

    var avgScore = Math.round((scores.senior + scores.fun + scores.flow + scores.retention) / 4);
    var passText = avgScore >= 80 ? '합격' : '재검토 필요';

    var html = '<div style="padding:20px;">' +
        '<div style="text-align:center;margin-bottom:20px;">' +
        '<span style="font-size:24px;font-weight:bold;color:' + (avgScore >= 80 ? '#69f0ae' : '#ff5555') + ';">' +
        '평균: ' + avgScore + '점 (' + passText + ')' +
        '</span></div>' +
        '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:15px;">' +
        createScoreCard('시니어 적합도', scores.senior, deductions.senior) +
        createScoreCard('재미 요소', scores.fun, deductions.fun) +
        createScoreCard('이야기 흐름', scores.flow, deductions.flow) +
        createScoreCard('시청자 이탈 방지', scores.retention, deductions.retention) +
        '</div></div>';

    scoreDisplay.innerHTML = html;
}

function createScoreCard(label, score, deductions) {
    var scoreColor = score >= 90 ? '#69f0ae' : score >= 70 ? '#ffaa00' : '#ff5555';

    var deductionHtml = '';
    if (deductions && deductions.length > 0) {
        deductions.slice(0, 5).forEach(function(d) {
            deductionHtml += '<div style="font-size:11px;color:#ccc;line-height:1.6;">• ' + d + '</div>';
        });
    } else {
        deductionHtml = '<div style="font-size:11px;color:#69f0ae;line-height:1.6;">• 감점 사항 없음</div>';
    }

    return '<div class="score-card" style="padding:15px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">' +
        '<span style="font-size:13px;color:#aaa;font-weight:bold;">' + label + '</span>' +
        '<span style="font-size:28px;font-weight:bold;color:' + scoreColor + ';">' + score + '점</span>' +
        '</div>' +
        '<div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:8px;">' +
        '<div style="font-size:11px;color:#ffaa00;font-weight:bold;margin-bottom:4px;">📋 감점 사항</div>' +
        deductionHtml +
        '</div></div>';
}

// ============================================================
// 100점 대본 생성
// ============================================================
async function generatePerfectScriptFromScores() {
    var finalScript = state.stage1.fixedScript || state.finalScript || '';
    if (!finalScript || finalScript.trim().length < 50) {
        alert('점수 산출을 먼저 완료해주세요.');
        return;
    }

    var scores = state.scores ? state.scores.finalScores : null;
    var deductions = state.scores ? state.scores.deductions : null;
    if (!scores) { alert('점수 정보가 없습니다.\n점수 산출을 먼저 완료해주세요.'); return; }

    var apiKey = localStorage.getItem('GEMINI_API_KEY');
    if (!apiKey) { alert('API 키를 먼저 설정해주세요.'); return; }

    var generateBtn = document.getElementById('btn-generate-perfect');
    if (generateBtn) { generateBtn.disabled = true; generateBtn.textContent = '⏳ 100점 대본 생성 중...'; }

    var display = document.getElementById('perfect-script-display');
    if (display) {
        display.innerHTML = '<div style="text-align:center;padding:30px;color:#ffaa00;">⏳ 4명의 전문가가 대본을 개선하고 있습니다...<br><span style="font-size:12px;color:#aaa;">약 2~4분 소요됩니다.</span></div>';
    }

    showProgress('💯 100점 대본 생성 중...');
    state._perfectAborted = false;

    try {
        // 캐시 생성
        updateProgress(2, '📦 캐시 생성 중...');
        var perfectCacheName = await createScriptCache(finalScript, '당신은 대한민국 최고의 사극 시나리오 작가입니다.', 1800);
        state._cacheName = perfectCacheName;

        var currentScript = finalScript;

        var freeEditRule = '## 자유 수정 권한\n' +
            '100점 달성을 위해 나레이션, 대사, 지문, 감정 표현 자유롭게 추가/삭제/수정 가능합니다.\n' +
            '단, 핵심 줄거리와 등장인물은 유지하세요.\n\n';

        var tagRule = '## 수정 표시 규칙\n' +
            '- 수정: [SENIOR]내용[/SENIOR] 또는 [FUN] [FLOW] [RETAIN]\n' +
            '- 추가: [SENIOR+]내용[/SENIOR+] 또는 [FUN+] [FLOW+] [RETAIN+]\n' +
            '- 삭제: [DEL]내용[/DEL]\n' +
            '- 수정하지 않은 부분은 태그 없이 원본 그대로!\n\n';

        var outputRule = '## 출력 규칙\n1. 대본 전문을 처음부터 끝까지 모두 출력\n2. 설명/주석/코드블록 없이 대본만\n3. JSON 아닌 대본 텍스트만\n';

        var scriptSection = perfectCacheName ?
            '\n\n## 수정 대상 대본\n캐시에 제공된 전체 대본을 사용하세요.\n' :
            '\n\n## 수정 대상 대본:\n\n' + currentScript;

        // 페르소나 ① 시니어 대사 전문가
        if (scores.senior < 100 && deductions.senior && deductions.senior.length > 0 && !state._perfectAborted) {
            updateProgress(10, '💯 ① 시니어 대사 전문가 작업 중...');
            var seniorDed = '';
            deductions.senior.forEach(function(d) { seniorDed += '- ' + d + '\n'; });

            var p1 = '당신은 시니어 타깃 사극 대사 전문가입니다.\n\n' +
                '## 현재 시니어 적합도: ' + scores.senior + '점 (목표: 100점)\n## 감점 사항:\n' + seniorDed + '\n' +
                freeEditRule + '## 담당 태그: [SENIOR] [SENIOR+]\n\n' + tagRule + outputRule + scriptSection;

            var r1 = await callGeminiAPI(p1, perfectCacheName);
            r1 = r1.replace(/```[a-z]*\n?/g, '').replace(/```/g, '').trim();
            if (r1.length > currentScript.length * 0.3) currentScript = r1;
        }

        // 페르소나 ② 극작 연출가
        if (scores.fun < 100 && deductions.fun && deductions.fun.length > 0 && !state._perfectAborted) {
            updateProgress(30, '💯 ② 극작 연출가 작업 중...');
            var funDed = '';
            deductions.fun.forEach(function(d) { funDed += '- ' + d + '\n'; });

            var p2Input = (currentScript !== finalScript) ? '\n\n## 수정 대상 대본 (이전 전문가 수정본):\n\n' + currentScript : scriptSection;
            var p2 = '당신은 사극 극작 연출가입니다.\n\n' +
                '## 현재 재미 요소: ' + scores.fun + '점 (목표: 100점)\n## 감점 사항:\n' + funDed + '\n' +
                freeEditRule + '## 담당 태그: [FUN] [FUN+]\n## 이전 태그 [SENIOR] [SENIOR+]는 그대로 유지!\n\n' + tagRule + outputRule + p2Input;

            var r2 = await callGeminiAPI(p2, perfectCacheName);
            r2 = r2.replace(/```[a-z]*\n?/g, '').replace(/```/g, '').trim();
            if (r2.length > currentScript.length * 0.3) currentScript = r2;
        }

        // 페르소나 ③ 서사 편집자
        if (scores.flow < 100 && deductions.flow && deductions.flow.length > 0 && !state._perfectAborted) {
            updateProgress(55, '💯 ③ 서사 편집자 작업 중...');
            var flowDed = '';
            deductions.flow.forEach(function(d) { flowDed += '- ' + d + '\n'; });

            var p3Input = (currentScript !== finalScript) ? '\n\n## 수정 대상 대본 (이전 전문가들 수정본):\n\n' + currentScript : scriptSection;
            var p3 = '당신은 사극 서사 구조 편집자입니다.\n\n' +
                '## 현재 이야기 흐름: ' + scores.flow + '점 (목표: 100점)\n## 감점 사항:\n' + flowDed + '\n' +
                freeEditRule + '## 담당 태그: [FLOW] [FLOW+]\n## 이전 태그 [SENIOR] [SENIOR+] [FUN] [FUN+]는 그대로 유지!\n\n' + tagRule + outputRule + p3Input;

            var r3 = await callGeminiAPI(p3, perfectCacheName);
            r3 = r3.replace(/```[a-z]*\n?/g, '').replace(/```/g, '').trim();
            if (r3.length > currentScript.length * 0.3) currentScript = r3;
        }

        // 페르소나 ④ 시청률 PD
        if (scores.retention < 100 && deductions.retention && deductions.retention.length > 0 && !state._perfectAborted) {
            updateProgress(80, '💯 ④ 시청률 PD 작업 중...');
            var retDed = '';
            deductions.retention.forEach(function(d) { retDed += '- ' + d + '\n'; });

            var p4Input = (currentScript !== finalScript) ? '\n\n## 수정 대상 대본 (이전 전문가들 수정본):\n\n' + currentScript : scriptSection;
            var p4 = '당신은 사극 시청률 전문 PD입니다.\n\n' +
                '## 현재 시청자 이탈 방지: ' + scores.retention + '점 (목표: 100점)\n## 감점 사항:\n' + retDed + '\n' +
                freeEditRule + '## 담당 태그: [RETAIN] [RETAIN+]\n## 이전 태그 모두 그대로 유지!\n\n' + tagRule + outputRule + p4Input;

            var r4 = await callGeminiAPI(p4, perfectCacheName);
            r4 = r4.replace(/```[a-z]*\n?/g, '').replace(/```/g, '').trim();
            if (r4.length > currentScript.length * 0.3) currentScript = r4;
        }

        // 결과 저장
        if (!currentScript || currentScript.length < 100) {
            throw new Error('100점 대본 생성 결과가 너무 짧습니다.');
        }

        state.perfectScript = currentScript;
        displayPerfectScriptResult(currentScript);

        if (perfectCacheName) { deleteScriptCache(perfectCacheName); state._cacheName = null; }

        updateProgress(100, '💯 100점 대본 생성 완료!');
        setTimeout(hideProgress, 1000);

    } catch (error) {
        if (state._cacheName) { deleteScriptCache(state._cacheName); state._cacheName = null; }
        if (error.name === 'AbortError') {
            if (display) display.innerHTML = '<div style="text-align:center;padding:30px;color:#ffaa00;">⏹️ 생성이 중지되었습니다.</div>';
        } else {
            if (display) display.innerHTML = '<div style="text-align:center;padding:30px;color:#ff5555;">❌ 생성 실패: ' + error.message + '</div>';
            alert('100점 대본 생성 중 오류: ' + error.message);
        }
        hideProgress();
    } finally {
        if (generateBtn) { generateBtn.disabled = false; generateBtn.textContent = '💯 100점 대본 생성'; }
    }
}

// ============================================================
// 100점 대본 결과 표시
// ============================================================
function displayPerfectScriptResult(perfectText) {
    var display = document.getElementById('perfect-script-display');
    if (!display) return;

    var htmlContent = escapeHtml(perfectText);

    // 태그별 색상 변환
    htmlContent = htmlContent.replace(/\[SENIOR\+\]([\s\S]*?)\[\/SENIOR\+\]/g, '<span style="background:#4CAF5040;color:#69f0ae;border-left:3px solid #4CAF50;padding:1px 4px;border-radius:2px;text-decoration:underline;" title="➕ 시니어 적합도 추가">$1</span>');
    htmlContent = htmlContent.replace(/\[FUN\+\]([\s\S]*?)\[\/FUN\+\]/g, '<span style="background:#FF980040;color:#FFB74D;border-left:3px solid #FF9800;padding:1px 4px;border-radius:2px;text-decoration:underline;" title="➕ 재미 요소 추가">$1</span>');
    htmlContent = htmlContent.replace(/\[FLOW\+\]([\s\S]*?)\[\/FLOW\+\]/g, '<span style="background:#2196F340;color:#64B5F6;border-left:3px solid #2196F3;padding:1px 4px;border-radius:2px;text-decoration:underline;" title="➕ 이야기 흐름 추가">$1</span>');
    htmlContent = htmlContent.replace(/\[RETAIN\+\]([\s\S]*?)\[\/RETAIN\+\]/g, '<span style="background:#9C27B040;color:#CE93D8;border-left:3px solid #9C27B0;padding:1px 4px;border-radius:2px;text-decoration:underline;" title="➕ 시청자 이탈 방지 추가">$1</span>');
    htmlContent = htmlContent.replace(/\[SENIOR\]([\s\S]*?)\[\/SENIOR\]/g, '<span style="background:#4CAF5040;color:#69f0ae;border-left:3px solid #4CAF50;padding:1px 4px;border-radius:2px;" title="✏️ 시니어 적합도 수정">$1</span>');
    htmlContent = htmlContent.replace(/\[FUN\]([\s\S]*?)\[\/FUN\]/g, '<span style="background:#FF980040;color:#FFB74D;border-left:3px solid #FF9800;padding:1px 4px;border-radius:2px;" title="✏️ 재미 요소 수정">$1</span>');
    htmlContent = htmlContent.replace(/\[FLOW\]([\s\S]*?)\[\/FLOW\]/g, '<span style="background:#2196F340;color:#64B5F6;border-left:3px solid #2196F3;padding:1px 4px;border-radius:2px;" title="✏️ 이야기 흐름 수정">$1</span>');
    htmlContent = htmlContent.replace(/\[RETAIN\]([\s\S]*?)\[\/RETAIN\]/g, '<span style="background:#9C27B040;color:#CE93D8;border-left:3px solid #9C27B0;padding:1px 4px;border-radius:2px;" title="✏️ 시청자 이탈 방지 수정">$1</span>');
    htmlContent = htmlContent.replace(/\[DEL\]([\s\S]*?)\[\/DEL\]/g, '<span style="text-decoration:line-through;color:#ff5555;background:#ff555520;padding:1px 4px;border-radius:2px;" title="🗑️ 삭제">$1</span>');

    // 카운트
    var seniorEdit = (perfectText.match(/\[SENIOR\][^\+]/g) || []).length;
    var seniorAdd = (perfectText.match(/\[SENIOR\+\]/g) || []).length;
    var funEdit = (perfectText.match(/\[FUN\][^\+]/g) || []).length;
    var funAdd = (perfectText.match(/\[FUN\+\]/g) || []).length;
    var flowEdit = (perfectText.match(/\[FLOW\][^\+]/g) || []).length;
    var flowAdd = (perfectText.match(/\[FLOW\+\]/g) || []).length;
    var retainEdit = (perfectText.match(/\[RETAIN\][^\+]/g) || []).length;
    var retainAdd = (perfectText.match(/\[RETAIN\+\]/g) || []).length;
    var delCount = (perfectText.match(/\[DEL\]/g) || []).length;

    var html = '<div style="padding:15px;">' +
        '<div style="text-align:center;margin-bottom:15px;">' +
        '<span style="font-size:16px;font-weight:bold;color:#FFD700;">💯 100점 대본 생성 완료</span></div>' +

        '<div style="margin-bottom:15px;padding:12px;background:#1e1e1e;border-radius:8px;">' +
        '<div style="display:flex;justify-content:center;gap:20px;flex-wrap:wrap;margin-bottom:8px;">' +
        '<span style="font-size:12px;color:#aaa;">✏️ 수정 = 배경색</span>' +
        '<span style="font-size:12px;color:#aaa;">➕ 추가 = 배경색 + <u>밑줄</u></span>' +
        '<span style="font-size:12px;color:#aaa;">🗑️ 삭제 = <span style="text-decoration:line-through;color:#ff5555;">취소선</span></span></div>' +
        '<div style="display:flex;justify-content:center;gap:12px;flex-wrap:wrap;">' +
        '<span style="font-size:11px;color:#69f0ae;">● 시니어: ✏️' + seniorEdit + ' ➕' + seniorAdd + '</span>' +
        '<span style="font-size:11px;color:#FFB74D;">● 재미: ✏️' + funEdit + ' ➕' + funAdd + '</span>' +
        '<span style="font-size:11px;color:#64B5F6;">● 흐름: ✏️' + flowEdit + ' ➕' + flowAdd + '</span>' +
        '<span style="font-size:11px;color:#CE93D8;">● 이탈방지: ✏️' + retainEdit + ' ➕' + retainAdd + '</span>' +
        '<span style="font-size:11px;color:#ff5555;">● 삭제: ' + delCount + '</span></div></div>' +

        '<div class="perfect-script-content">' + htmlContent + '</div></div>';

    display.innerHTML = html;

    var buttons = document.getElementById('perfect-script-buttons');
    if (buttons) buttons.style.display = 'flex';
}
// ============================================================
// 편집모드 시스템 (신규 추가)
// ============================================================

var editModeState = {
    isEditMode: false,
    backupText: ''
};

function initEditMode() {
    var checkbox = document.getElementById('edit-mode-checkbox');
    if (!checkbox) return;

    checkbox.addEventListener('change', function() {
        if (this.checked) {
            enterEditMode();
        } else {
            exitEditMode();
        }
    });

    var textarea = document.getElementById('edit-textarea-stage1');
    if (textarea) {
        textarea.addEventListener('input', function() {
            var countEl = document.getElementById('edit-char-num');
            if (countEl) countEl.textContent = textarea.value.length;
        });
    }
}

function enterEditMode() {
    editModeState.isEditMode = true;

    // 현재 텍스트 가져오기
    var currentText = '';
    if (state.stage1.fixedScript && state.stage1.fixedScript.trim().length > 0) {
        currentText = state.stage1.fixedScript;
    } else if (state.stage1.originalScript && state.stage1.originalScript.trim().length > 0) {
        currentText = getCurrentRevisedText();
    }

    editModeState.backupText = currentText;

    // textarea에 텍스트 설정
    var textarea = document.getElementById('edit-textarea-stage1');
    if (textarea) {
        textarea.value = currentText;
    }

    // 글자수 표시
    var countEl = document.getElementById('edit-char-num');
    if (countEl) countEl.textContent = currentText.length;

    // 보기모드 숨기고 편집모드 표시
    var revisedDiv = document.getElementById('revised-stage1');
    var editDiv = document.getElementById('edit-stage1');
    var charCount = document.getElementById('edit-char-count');
    if (revisedDiv) revisedDiv.style.display = 'none';
    if (editDiv) editDiv.style.display = 'block';
    if (charCount) charCount.style.display = 'block';

    // 라벨 변경
    var label = document.getElementById('edit-mode-label');
    if (label) { label.textContent = '편집모드'; label.style.color = '#4CAF50'; }

    // 버튼 교체
    updateEditModeButtons(true);
}

function exitEditMode() {
    editModeState.isEditMode = false;

    // 편집모드 숨기고 보기모드 표시
    var revisedDiv = document.getElementById('revised-stage1');
    var editDiv = document.getElementById('edit-stage1');
    var charCount = document.getElementById('edit-char-count');
    if (revisedDiv) revisedDiv.style.display = 'block';
    if (editDiv) editDiv.style.display = 'none';
    if (charCount) charCount.style.display = 'none';

    // 라벨 변경
    var label = document.getElementById('edit-mode-label');
    if (label) { label.textContent = '보기모드'; label.style.color = '#aaa'; }

    // 저장된 fixedScript가 있으면 보기모드 영역을 편집된 텍스트로 갱신
    if (state.stage1.fixedScript && state.stage1.fixedScript.trim().length > 0 && revisedDiv) {
        revisedDiv.innerHTML = '<div style="white-space:pre-wrap;padding:15px;font-size:14px;line-height:1.8;word-break:break-word;">' + escapeHtml(state.stage1.fixedScript) + '</div>';
    }

    // 버튼 교체
    updateEditModeButtons(false);
}

function getCurrentRevisedText() {
    var text = state.stage1.originalScript || '';
    var errors = state.stage1.allErrors || [];

    errors.forEach(function(err) {
        if (err.useRevised && err.original && err.revised) {
            var fixedRevised = cleanRevisedText(err.revised);
            if (text.indexOf(err.original) !== -1) {
                if (fixedRevised === '__DELETE__') {
                    text = text.split(err.original).join('');
                } else {
                    text = text.split(err.original).join(fixedRevised);
                }
            }
        }
    });

    return text;
}

function saveEditedText() {
    var textarea = document.getElementById('edit-textarea-stage1');
    if (!textarea) return;

    var editedText = textarea.value;
    if (!editedText || editedText.trim().length === 0) {
        alert('저장할 내용이 없습니다.');
        return;
    }

    state.stage1.fixedScript = editedText;
    state.stage1.isFixed = true;
    state.finalScript = editedText;

    // 보기모드 영역도 즉시 갱신
    var revisedDiv = document.getElementById('revised-stage1');
    if (revisedDiv) {
        revisedDiv.innerHTML = '<div style="white-space:pre-wrap;padding:15px;font-size:14px;line-height:1.8;word-break:break-word;">' + escapeHtml(editedText) + '</div>';
    }

    // 다운로드 버튼 활성화
    var downloadBtn = document.getElementById('btn-download');
    if (downloadBtn) downloadBtn.disabled = false;

    alert('저장되었습니다.');
}

function revertEditedText() {
    if (!editModeState.backupText) {
        alert('되돌릴 내용이 없습니다.');
        return;
    }

    if (!confirm('편집 전 상태로 되돌리시겠습니까?')) return;

    var textarea = document.getElementById('edit-textarea-stage1');
    if (textarea) {
        textarea.value = editModeState.backupText;
        var countEl = document.getElementById('edit-char-num');
        if (countEl) countEl.textContent = editModeState.backupText.length;
    }
}

function updateEditModeButtons(isEdit) {
    var wrapper = document.querySelector('.revert-btn-wrapper');
    if (!wrapper) return;

    var btnBefore = document.getElementById('btn-revert-before-stage1');
    var btnAfter = document.getElementById('btn-revert-after-stage1');
    var btnFix = document.getElementById('btn-fix-script-stage1');

    // 기존 편집 버튼 제거
    var existingSave = document.getElementById('btn-edit-save');
    var existingRevert = document.getElementById('btn-edit-revert');
    if (existingSave) existingSave.remove();
    if (existingRevert) existingRevert.remove();

    if (isEdit) {
        // 보기모드 버튼 숨기기
        if (btnBefore) btnBefore.style.display = 'none';
        if (btnAfter) btnAfter.style.display = 'none';

        // 편집모드 버튼 추가
        var btnSave = document.createElement('button');
        btnSave.id = 'btn-edit-save';
        btnSave.innerHTML = '💾 저장';
        btnSave.style.cssText = 'background:#4CAF50;color:white;border:none;padding:8px 16px;border-radius:5px;cursor:pointer;font-weight:bold;font-size:13px;';
        btnSave.addEventListener('click', saveEditedText);

        var btnRevert = document.createElement('button');
        btnRevert.id = 'btn-edit-revert';
        btnRevert.innerHTML = '↩️ 되돌리기';
        btnRevert.style.cssText = 'background:#ff9800;color:white;border:none;padding:8px 16px;border-radius:5px;cursor:pointer;font-weight:bold;font-size:13px;';
        btnRevert.addEventListener('click', revertEditedText);

        // 픽스 버튼 앞에 삽입
        if (btnFix) {
            wrapper.insertBefore(btnRevert, btnFix);
            wrapper.insertBefore(btnSave, btnRevert);
        }
    } else {
        // 보기모드 버튼 복원
        if (btnBefore) btnBefore.style.display = '';
        if (btnAfter) btnAfter.style.display = '';
    }
}

// ============================================================
// 전체보기 모달 편집모드 (신규 추가)
// ============================================================

var fullviewEditState = {
    isEditMode: false,
    backupText: ''
};

function addFullViewEditToggle() {
    var rightHeader = document.getElementById('fullview-right-header');
    if (!rightHeader || rightHeader.querySelector('.fullview-edit-toggle')) return;

    var toggleHtml = document.createElement('span');
    toggleHtml.className = 'fullview-edit-toggle';
    toggleHtml.style.cssText = 'margin-left:15px;display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:normal;';
    toggleHtml.innerHTML =
        '<span id="fullview-edit-label" style="color:#aaa;">보기</span>' +
        '<label class="edit-toggle-switch">' +
        '<input type="checkbox" id="fullview-edit-checkbox">' +
        '<span class="edit-toggle-slider"></span>' +
        '</label>';
    rightHeader.appendChild(toggleHtml);

    var cb = document.getElementById('fullview-edit-checkbox');
    if (cb) {
        cb.addEventListener('change', function() {
            if (this.checked) {
                enterFullViewEditMode();
            } else {
                exitFullViewEditMode();
            }
        });
    }
}

function enterFullViewEditMode() {
    fullviewEditState.isEditMode = true;

    var rightBody = document.getElementById('fullview-right-body');
    if (!rightBody) return;

    // 현재 텍스트 가져오기
    var currentText = '';
    if (state.stage1.fixedScript && state.stage1.fixedScript.trim().length > 0) {
        currentText = state.stage1.fixedScript;
    } else {
        currentText = getCurrentRevisedText();
    }

    fullviewEditState.backupText = currentText;

    // textarea로 교체
    rightBody.innerHTML = '<textarea id="fullview-edit-textarea" style="width:100%;height:100%;padding:15px;font-size:17px;line-height:1.8;border:none;resize:none;font-family:inherit;background:#2d2d2d;color:#fff;word-break:break-word;outline:none;">' + escapeHtml(currentText) + '</textarea>';

    // 라벨 변경
    var label = document.getElementById('fullview-edit-label');
    if (label) { label.textContent = '편집'; label.style.color = '#4CAF50'; }

    // 하단 버튼 교체
    updateFullViewEditButtons(true);
}

function exitFullViewEditMode() {
    fullviewEditState.isEditMode = false;

    // 보기모드로 복원 — 저장된 fixedScript가 있으면 그걸 표시
    var rightBody = document.getElementById('fullview-right-body');
    if (rightBody) {
        if (state.stage1.fixedScript && state.stage1.fixedScript.trim().length > 0) {
            rightBody.innerHTML = '<div style="white-space:pre-wrap;padding:15px;font-size:14px;line-height:1.8;word-break:break-word;">' + escapeHtml(state.stage1.fixedScript) + '</div>';
        } else {
            var revisedBox = document.getElementById('revised-stage1');
            if (revisedBox) {
                rightBody.innerHTML = revisedBox.innerHTML;
            }
        }
    }

    // 라벨 변경
    var label = document.getElementById('fullview-edit-label');
    if (label) { label.textContent = '보기'; label.style.color = '#aaa'; }

    // 하단 버튼 복원
    updateFullViewEditButtons(false);
}

function saveFullViewEditedText() {
    var textarea = document.getElementById('fullview-edit-textarea');
    if (!textarea) return;

    var editedText = textarea.value;
    if (!editedText || editedText.trim().length === 0) {
        alert('저장할 내용이 없습니다.');
        return;
    }

    state.stage1.fixedScript = editedText;
    state.stage1.isFixed = true;
    state.finalScript = editedText;

    // 메인 페이지 보기모드 영역도 즉시 갱신
    var revisedDiv = document.getElementById('revised-stage1');
    if (revisedDiv) {
        revisedDiv.innerHTML = '<div style="white-space:pre-wrap;padding:15px;font-size:14px;line-height:1.8;word-break:break-word;">' + escapeHtml(editedText) + '</div>';
    }

    // 메인 페이지 편집 textarea도 동기화
    var mainTextarea = document.getElementById('edit-textarea-stage1');
    if (mainTextarea) mainTextarea.value = editedText;

    // 다운로드 버튼 활성화
    var downloadBtn = document.getElementById('btn-download');
    if (downloadBtn) downloadBtn.disabled = false;

    alert('저장되었습니다.');
}

function revertFullViewEditedText() {
    if (!fullviewEditState.backupText) {
        alert('되돌릴 내용이 없습니다.');
        return;
    }

    if (!confirm('편집 전 상태로 되돌리시겠습니까?')) return;

    var textarea = document.getElementById('fullview-edit-textarea');
    if (textarea) {
        textarea.value = fullviewEditState.backupText;
    }
}

function updateFullViewEditButtons(isEdit) {
    var footer = document.getElementById('fullview-footer');
    if (!footer) return;

    // 기존 편집 버튼 제거
    var existingSave = document.getElementById('fullview-btn-save');
    var existingRevert = document.getElementById('fullview-btn-revert');
    if (existingSave) existingSave.remove();
    if (existingRevert) existingRevert.remove();

    // 기존 보기모드 버튼들 찾기
    var buttons = footer.querySelectorAll('button');

    if (isEdit) {
        // 기존 버튼 숨기기 (수정 전, 수정 후)
        buttons.forEach(function(btn, i) {
            if (i < 2) btn.style.display = 'none'; // 수정 전, 수정 후만 숨김
        });

        // 편집 버튼 추가
        var btnSave = document.createElement('button');
        btnSave.id = 'fullview-btn-save';
        btnSave.innerHTML = '💾 저장';
        btnSave.style.cssText = 'background:#4CAF50;color:white;border:none;padding:8px 16px;border-radius:5px;cursor:pointer;font-weight:bold;font-size:13px;';
        btnSave.addEventListener('click', saveFullViewEditedText);

        var btnRevert = document.createElement('button');
        btnRevert.id = 'fullview-btn-revert';
        btnRevert.innerHTML = '↩️ 되돌리기';
        btnRevert.style.cssText = 'background:#ff9800;color:white;border:none;padding:8px 16px;border-radius:5px;cursor:pointer;font-weight:bold;font-size:13px;';
        btnRevert.addEventListener('click', revertFullViewEditedText);

        footer.insertBefore(btnSave, footer.firstChild);
        footer.insertBefore(btnRevert, btnSave.nextSibling);
    } else {
        // 기존 버튼 복원
        buttons.forEach(function(btn) {
            btn.style.display = '';
        });
    }
}

// ============================================================
// 기존 openFullViewModal 확장 — 편집 토글 추가
// ============================================================

var _originalOpenFullViewModal = openFullViewModal;
openFullViewModal = function() {
    _originalOpenFullViewModal();
    // 편집 토글 추가
    setTimeout(function() {
        addFullViewEditToggle();
        // 편집모드 상태 초기화
        fullviewEditState.isEditMode = false;
        var cb = document.getElementById('fullview-edit-checkbox');
        if (cb) cb.checked = false;
    }, 100);
};

// ============================================================
// 초기화 — DOMContentLoaded에 편집모드 초기화 추가
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    initEditMode();
});

// ============================================================
// 대본 전면 수정 시스템 (v5.1 신규)
// - 분석 완료 후 시니어 야담 작가 프롬프트 기반 전면 리라이팅
// - 수정 결과를 "수정 반영" 칸에 표시
// ============================================================

var REWRITE_CONFIG = {
    CHUNK_SIZE: 4000,       // 청크당 글자수
    OVERLAP: 200,           // 청크 간 겹침 (문맥 유지)
    MAX_CONCURRENT: 2       // 동시 API 호출 수 (429 방지)
};

// ============================================================
// 시니어 야담 작가 시스템 프롬프트
// ============================================================
function getRewriteSystemPrompt() {
    return '당신은 20년 이상 라디오 연속극·오디오북·시니어 매거진 연재 경력을 가진 ' +
        '시니어 전문 장편 야담 작가입니다.\n\n' +
        '전문 분야:\n' +
        '- 조선 후기 배경 야담·기담·미스터리 장편 서사 제작\n' +
        '- 할머니가 손주에게 들려주듯 따뜻한 구술체 유지\n' +
        '- 초반부터 끝까지 궁금증 유지\n\n' +
        '이 대본은 문학 작품이 아니라 유튜브 시니어 완주율 최적화 설계물입니다.';
}

// ============================================================
// 전면 수정용 역할 프롬프트 생성
// ============================================================
function buildRewritePrompt(chunkText, chunkInfo, totalLength, analysisErrors, isFirstChunk, isLastChunk) {

    // 이 청크에 해당하는 분석 오류 추출
    var relevantErrors = '';
    if (analysisErrors && analysisErrors.length > 0) {
        var matched = analysisErrors.filter(function(err) {
            if (!err.original) return false;
            var snippet = err.original.substring(0, 30);
            return chunkText.indexOf(snippet) !== -1;
        });
        if (matched.length > 0) {
            relevantErrors = '\n\n## 📋 이 구간에서 발견된 분석 오류 (반드시 수정 반영)\n';
            matched.forEach(function(err, idx) {
                relevantErrors += (idx + 1) + '. [' + (err.type || '기타') + '] ' +
                    '"' + (err.original || '').substring(0, 60) + '" → "' + (err.revised || '').substring(0, 60) + '"\n' +
                    '   사유: ' + (err.reason || '') + '\n';
            });
        }
    }

    var positionGuide = '';
    if (isFirstChunk) {
        positionGuide = '\n\n## 🔥 이 구간은 대본의 시작부입니다. 초반 후킹 규칙을 적용하세요.\n' +
            '- 첫 문장: 생명 위협 / 강한 감정 충돌 / 충격적 발언 / 즉각적 위험 사건 중 택1\n' +
            '- 설명으로 시작 절대 금지\n' +
            '- 초반 30초 내 긴장 요소 2개 이상\n' +
            '- 1~2분 내 궁금증 3개 자연 생성 (왜? 누가? 과거에 무슨 일?)\n' +
            '- 설명 30% 이하, 사건→반응→궁금증→설명 순서\n';
    } else if (isLastChunk) {
        positionGuide = '\n\n## 🌙 이 구간은 대본의 마무리입니다. 엔딩 규칙을 적용하세요.\n' +
            '- 감정 여운 / 인과 깨달음 / 희생 의미 / 운명의 아이러니 중 택1\n' +
            '- 완전 해설형 엔딩 금지\n' +
            '- 감정 파동: 충격 → 이해 → 여운\n';
    } else {
        positionGuide = '\n\n## ⚡ 이 구간은 대본의 중반부입니다.\n' +
            '- 장면 전환마다: 오해/갈등 확대/위험 신호/새로운 의심/감정 충돌 중 하나 삽입\n' +
            '- 긴장 상승 곡선 유지 (중간 긴장 하락 금지)\n' +
            '- 실마리 점진 공개 ("알 것 같지만 모르는 상태" 유지)\n';
    }

    return '## 📌 작업 지시\n' +
        '전체 대본 ' + totalLength + '자 중 ' + chunkInfo + '\n' +
        '아래 구간을 전면 수정(리라이팅)하세요.\n\n' +

        '## ⛔ 절대 규칙\n' +
        '- 작가 소개, 제목, 회차 번호, 소제목, 메타 설명 금지\n' +
        '- 스토리 본문만 출력\n' +
        '- 조선 후기 고증 준수 (현대 단어, 현대 제도, 외래어 금지)\n' +
        '- 화폐: 냥/전/푼/관 | 시간: 자시/삼경/동틀 무렵 | 장소: 관아/포졸/주막/장터/암자\n' +
        '- 과도한 잔혹 묘사 금지\n' +
        '- 서술 80~85%, 대사 10~15%, 대사는 짧게\n\n' +

        '## 🎭 문체 규칙\n' +
        '- 할머니가 손주에게 들려주는 따뜻한 구술체\n' +
        '- 특정 종결어미 30% 이하 (기계적 반복 금지)\n' +
        '- 연결형 문장 60% 이상\n' +
        '- 보고서체 금지\n\n' +

        '## 😰 감정 규칙\n' +
        '- 사건마다 감정 반드시 삽입 (죄책감/두려움/원망/배신/절망/보호 본능)\n' +
        '- 사건만 있고 감정 없으면 실패\n' +
        '- 감정 파동: 불안→희망→절망→의심→충격→이해→여운\n\n' +

        '## 🔗 시청자 몰입 유지 장치\n' +
        '- 반복 단서, 기억되는 물건, 상징 행동, 약속/맹세\n' +
        '- 중반 이후 감정 반전 1회 이상 (배신/숨겨진 관계/희생의 진실/오해의 이유)\n\n' +

        positionGuide +
        relevantErrors +

        '\n\n## 📤 출력 규칙\n' +
        '1. 수정된 대본 본문만 출력 (설명/주석/코드블록 금지)\n' +
        '2. JSON 아닌 순수 텍스트만\n' +
        '3. 이 구간의 내용을 빠짐없이 수정하여 전문 출력\n' +
        '4. 핵심 줄거리와 등장인물은 반드시 유지\n\n' +

        '━━ 수정 대상 구간 ━━\n' + chunkText + '\n━━ 구간 끝 ━━';
}
// ============================================================
// 심층 분석 결과를 요약 텍스트로 변환
// ============================================================
function buildDeepAnalysisSummary(deepItems) {
    if (!deepItems || deepItems.length === 0) return '';

    var summary = '';

    // 카테고리별 분류
    var categories = {
        '초반후킹': [],
        '감정삽입': [],
        '긴장흐름': [],
        '문체구성': [],
        '엔딩몰입': []
    };

    deepItems.forEach(function(item) {
        var key = item.deepType || '기타';
        if (!categories[key]) categories[key] = [];
        categories[key].push(item);
    });

    var categoryLabels = {
        '초반후킹': '🔥 초반 후킹 문제',
        '감정삽입': '😰 감정 삽입 문제',
        '긴장흐름': '⚡ 긴장/흐름 문제',
        '문체구성': '🎭 문체/구성 문제',
        '엔딩몰입': '🌙 엔딩/몰입 문제'
    };

    for (var cat in categories) {
        var items = categories[cat];
        if (items.length === 0) continue;

        summary += '\n### ' + (categoryLabels[cat] || cat) + ' (' + items.length + '건)\n';
        items.forEach(function(item, idx) {
            summary += (idx + 1) + '. [' + (item.severity === 'high' ? '긴급' : '권장') + '] ' + item.reason + '\n';
            if (item.original) {
                summary += '   해당 구간: "' + item.original.substring(0, 80) + '"\n';
            }
            if (item.revised) {
                summary += '   수정 방향: "' + item.revised.substring(0, 80) + '"\n';
            }
        });
    }

    return summary;
}

// ============================================================
// 전면 수정용 프롬프트 (v5.3: 초반 후킹 강화 + 종결어미 규칙)
// ============================================================
function buildRewritePromptWithDeepAnalysis(chunkText, chunkInfo, totalLength, errorItems, deepItems, deepAnalysisSummary, isFirstChunk, isLastChunk) {

    // 이 청크에 해당하는 오류 검출 결과
    var relevantErrors = '';
    if (errorItems && errorItems.length > 0) {
        var matched = errorItems.filter(function(err) {
            if (!err.original) return false;
            var snippet = err.original.substring(0, 30);
            return chunkText.indexOf(snippet) !== -1;
        });
        if (matched.length > 0) {
            relevantErrors = '\n\n## 📋 이 구간의 오류 검출 결과 (반드시 수정 반영)\n';
            matched.forEach(function(err, idx) {
                relevantErrors += (idx + 1) + '. [' + (err.type || '기타') + '] ' +
                    '"' + (err.original || '').substring(0, 60) + '" → "' + (err.revised || '').substring(0, 60) + '"\n' +
                    '   사유: ' + (err.reason || '') + '\n';
            });
        }
    }

    // 이 청크에 해당하는 심층 분석 결과
    var relevantDeep = '';
    if (deepItems && deepItems.length > 0) {
        var chunkLocation = '';
        if (isFirstChunk) chunkLocation = '초반';
        else if (isLastChunk) chunkLocation = '엔딩';
        else chunkLocation = '중반';

        var matchedDeep = deepItems.filter(function(item) {
            if (item.location === chunkLocation) return true;
            if (item.location === '후반' && isLastChunk) return true;
            if (!item.original) return false;
            var snippet = item.original.substring(0, 30);
            return chunkText.indexOf(snippet) !== -1;
        });

        if (matchedDeep.length > 0) {
            relevantDeep = '\n\n## 🧠 이 구간의 심층 분석 결과 (반드시 수정 반영)\n';
            matchedDeep.forEach(function(item, idx) {
                var urgency = item.severity === 'high' ? '⚠️ 긴급' : '권장';
                relevantDeep += (idx + 1) + '. [' + urgency + '] [' + (item.deepType || '') + '] ' + item.reason + '\n';
                if (item.original) {
                    relevantDeep += '   문제 구간: "' + item.original.substring(0, 80) + '"\n';
                }
                if (item.revised) {
                    relevantDeep += '   수정 방향: "' + item.revised.substring(0, 80) + '"\n';
                }
            });
        }
    }

    // 전체 심층 분석 요약
    var globalDeepContext = '';
    if (deepAnalysisSummary && deepAnalysisSummary.length > 0) {
        globalDeepContext = '\n\n## 📊 전체 대본 심층 분석 요약 (전체 맥락 참고)\n' +
            deepAnalysisSummary;
    }

    // 위치별 가이드
    var positionGuide = '';
    if (isFirstChunk) {
        positionGuide = '\n\n## 🔥🔥🔥 이 구간은 대본의 시작부입니다. 초반 후킹이 가장 중요합니다!\n\n' +
            '### 첫 문장 절대 규칙\n' +
            '- 첫 문장은 반드시: 생명 위협 / 강한 감정 충돌 / 충격적 발언 / 즉각적 위험 사건\n' +
            '- 배경 설명, 날씨, 시간 묘사로 시작하면 절대 안 됨\n' +
            '- 독자가 첫 문장에서 "무슨 일이야?"라고 느껴야 함\n\n' +
            '### 초반 30초 (200자 이내)\n' +
            '- 긴장 요소 2개 이상 삽입\n' +
            '- 감정 2개 이상 동시 삽입 (두려움/죄책감/원망/배신/절망/보호 본능)\n\n' +
            '### 초반 1~2분 (700자 이내)\n' +
            '- 궁금증 3개 자연 생성: ❶왜? ❷누가 숨기나? ❸과거에 무슨 일?\n' +
            '- 설명 30% 이하\n' +
            '- 순서: 사건→반응→궁금증→설명\n\n' +
            '### 후킹 유형 (최소 1개)\n' +
            '① 고발형 ② 죽음 암시형 ③ 과거 폭로형 ④ 처벌 위기형 ⑤ 기억 폭로형\n\n' +
            '⚠️ 심층 분석에서 초반 후킹 문제가 지적되었다면, 이 부분을 완전히 새로 작성하세요.\n' +
            '기존 초반을 살짝 고치는 수준이 아니라, 강력한 후킹으로 전면 교체하세요.\n';
    } else if (isLastChunk) {
        positionGuide = '\n\n## 🌙 이 구간은 대본의 마무리입니다.\n' +
            '- 감정 여운 / 인과 깨달음 / 희생 의미 / 운명의 아이러니 중 택1\n' +
            '- 완전 해설형 엔딩 금지\n' +
            '- 감정 파동: 충격 → 이해 → 여운\n' +
            '- 시청자 몰입 장치 마무리 (반복 단서 회수, 약속 결말)\n';
    } else {
        positionGuide = '\n\n## ⚡ 이 구간은 대본의 중반부입니다.\n' +
            '- 장면 전환마다: 오해/갈등 확대/위험 신호/새로운 의심/감정 충돌 중 하나 삽입\n' +
            '- 긴장 상승 곡선 유지 (중간 긴장 하락 금지)\n' +
            '- 실마리 점진 공개 ("알 것 같지만 모르는 상태" 유지)\n' +
            '- 감정 반전 포인트 삽입\n';
    }

    return '## 📌 작업 지시\n' +
        '전체 대본 ' + totalLength + '자 중 ' + chunkInfo + '\n' +
        '아래 구간을 전면 수정(리라이팅)하세요.\n\n' +

        '⚠️ 중요: "오류 검출 결과"와 "심층 분석 결과"에 나온 문제점을 반드시 수정에 반영하세요.\n' +
        '특히 초반후킹 관련 지적은 최우선으로 반영하세요.\n\n' +

        '## ⛔ 절대 규칙\n' +
        '- 작가 소개, 제목, 회차 번호, 소제목, 메타 설명 금지\n' +
        '- 스토리 본문만 출력\n' +
        '- 조선 후기 고증 준수 (현대 단어, 현대 제도, 외래어 금지)\n' +
        '- 화폐: 냥/전/푼/관 | 시간: 자시/삼경/동틀 무렵\n' +
        '- 과도한 잔혹 묘사 금지\n' +
        '- 서술 80~85%, 대사 10~15%, 대사는 짧게\n\n' +

        '## ✍️ 종결어미 규칙 (매우 중요 — 반드시 준수)\n' +
        '서술문의 종결어미를 아래 두 그룹으로 나누어 50:50 비율로 사용하세요.\n\n' +
        '### A그룹 (50%) — 구술체 어미\n' +
        '- ~했지요, ~하였지요\n' +
        '- ~이었지요, ~되었지요\n' +
        '- ~인 것이지요, ~한 것이지요\n' +
        '- ~더랍니다, ~더군요\n\n' +
        '### B그룹 (50%) — 서술체 어미\n' +
        '- ~했습니다, ~하였습니다\n' +
        '- ~그랬습니다, ~되었습니다\n' +
        '- ~인 것입니다, ~한 것입니다\n' +
        '- ~이었습니다, ~있었습니다\n\n' +
        '### ⛔ 사용 금지 어미\n' +
        '- ~있었다, ~했다, ~되었다, ~하였다 (딱딱한 문어체 — 절대 금지)\n' +
        '- ~거든요, ~잖아요 (현대 구어체 — 절대 금지)\n' +
        '- ~어요, ~했어요, ~이에요 (현대 구어체 — 절대 금지)\n\n' +
        '### 예시\n' +
        '❌ "그날 밤, 촛불이 꺼졌다." → 금지\n' +
        '✅ "그날 밤, 촛불이 꺼졌지요." (A그룹)\n' +
        '✅ "그날 밤, 촛불이 꺼졌습니다." (B그룹)\n\n' +
        '❌ "아이가 울고 있었다." → 금지\n' +
        '✅ "아이가 울고 있었지요." (A그룹)\n' +
        '✅ "아이가 울고 있었습니다." (B그룹)\n\n' +

        '## 🎭 문체 규칙\n' +
        '- 할머니가 손주에게 들려주는 따뜻한 구술체\n' +
        '- 같은 종결어미 연속 2회 초과 금지 (A-B-A-B 또는 A-A-B-B-A 식으로 섞기)\n' +
        '- 연결형 문장 60% 이상\n' +
        '- 보고서체 금지\n\n' +

        '## 😰 감정 규칙\n' +
        '- 사건마다 감정 반드시 삽입 (죄책감/두려움/원망/배신/절망/보호 본능)\n' +
        '- 사건만 있고 감정 없으면 실패\n' +
        '- 감정 파동: 불안→희망→절망→의심→충격→이해→여운\n\n' +

        '## 🔗 시청자 몰입 유지\n' +
        '- 반복 단서, 기억되는 물건, 상징 행동, 약속/맹세\n\n' +

        positionGuide +
        relevantErrors +
        relevantDeep +
        globalDeepContext +

        '\n\n## 📤 출력 규칙\n' +
        '1. 수정된 대본 본문만 출력 (설명/주석/코드블록 금지)\n' +
        '2. JSON 아닌 순수 텍스트만\n' +
        '3. 이 구간의 내용을 빠짐없이 수정하여 전문 출력\n' +
        '4. 핵심 줄거리와 등장인물은 반드시 유지\n' +
        '5. 종결어미 A그룹:B그룹 = 50:50 반드시 준수\n\n' +

        '━━ 수정 대상 구간 ━━\n' + chunkText + '\n━━ 구간 끝 ━━';
}

// ============================================================
// 전면 수정용 청크 분할 (겹침 포함)
// ============================================================
function splitForRewrite(script) {
    if (!script || script.length === 0) return [];

    var chunkSize = REWRITE_CONFIG.CHUNK_SIZE;
    var overlap = REWRITE_CONFIG.OVERLAP;

    if (script.length <= chunkSize) {
        return [{ text: script, start: 0, end: script.length, num: 1, total: 1 }];
    }

    var chunks = [];
    var pos = 0;

    while (pos < script.length) {
        var end = Math.min(pos + chunkSize, script.length);

        // 문장 경계에서 자르기
        if (end < script.length) {
            var cutSearch = script.substring(Math.max(end - 100, pos), end);
            var lastPeriod = cutSearch.lastIndexOf('.');
            var lastNewline = cutSearch.lastIndexOf('\n');
            var cutPoint = Math.max(lastPeriod, lastNewline);
            if (cutPoint > 0) {
                end = Math.max(end - 100, pos) + cutPoint + 1;
            }
        }

        chunks.push({
            text: script.substring(pos, end),
            start: pos,
            end: end,
            num: chunks.length + 1,
            total: 0
        });

        // 다음 시작점 (겹침 적용)
        pos = Math.max(end - overlap, pos + 1);
        if (pos >= script.length) break;
    }

    for (var i = 0; i < chunks.length; i++) {
        chunks[i].total = chunks.length;
    }

    return chunks;
}

// ============================================================
// 겹침 구간 병합
// ============================================================
function mergeRewrittenChunks(chunks, rewrittenTexts, originalScript) {
    if (rewrittenTexts.length === 1) return rewrittenTexts[0];

    var result = '';

    for (var i = 0; i < rewrittenTexts.length; i++) {
        var text = rewrittenTexts[i];
        if (!text || text.trim().length === 0) {
            // 실패한 청크는 원본으로 대체
            text = chunks[i].text;
        }

        if (i === 0) {
            result = text;
        } else {
            // 겹침 구간 처리: 이전 결과의 마지막 부분과 현재 텍스트의 첫 부분에서 공통점 찾기
            var overlapLen = REWRITE_CONFIG.OVERLAP;
            var prevTail = result.substring(Math.max(0, result.length - overlapLen * 3));
            var currHead = text.substring(0, overlapLen * 3);

            var bestOverlap = 0;
            // 문장 단위로 겹침 찾기
            var prevSentences = prevTail.split(/(?<=[.!?。\n])\s*/);
            var currSentences = currHead.split(/(?<=[.!?。\n])\s*/);

            for (var p = prevSentences.length - 1; p >= 0; p--) {
                var prevSent = prevSentences[p].trim();
                if (prevSent.length < 5) continue;

                for (var c = 0; c < Math.min(currSentences.length, 5); c++) {
                    var currSent = currSentences[c].trim();
                    if (currSent.length < 5) continue;

                    // 유사도 체크 (첫 10글자 비교)
                    var checkLen = Math.min(10, prevSent.length, currSent.length);
                    if (prevSent.substring(0, checkLen) === currSent.substring(0, checkLen)) {
                        // 겹침 발견 — 현재 텍스트에서 이 문장부터 사용
                        var cutPos = text.indexOf(currSent);
                        if (cutPos > 0) {
                            bestOverlap = cutPos;
                        }
                        break;
                    }
                }
                if (bestOverlap > 0) break;
            }

            if (bestOverlap > 0) {
                result += '\n' + text.substring(bestOverlap);
            } else {
                result += '\n\n' + text;
            }
        }
    }

    return result;
}

// ============================================================
// 전면 수정 실행
// ============================================================
// ============================================================
// 전면 수정 실행 (v5.2: 오류 검출 + 심층 분석 결과 통합 반영)
// ============================================================
async function startFullRewrite() {
    var errors = state.stage1.allErrors || [];
    var baseScript = state.stage1.fixedScript || state.stage1.originalScript || '';

    if (!baseScript || baseScript.trim().length < 50) {
        alert('수정할 대본이 없습니다.\n대본을 입력하고 분석을 먼저 실행해주세요.');
        return;
    }

    var apiKey = localStorage.getItem('GEMINI_API_KEY');
    if (!apiKey) {
        alert('API 키를 먼저 설정해주세요.');
        return;
    }

    // 오류 검출 항목과 심층 분석 항목 분리
    var errorItems = errors.filter(function(e) { return e.category === 'error'; });
    var deepItems = errors.filter(function(e) { return e.category === 'deep'; });

    if (errorItems.length === 0 && deepItems.length === 0) {
        alert('분석 결과가 없습니다.\n"분석 시작"을 먼저 실행해주세요.');
        return;
    }

    // 버튼 비활성화
    var rewriteBtn = document.getElementById('btn-full-rewrite');
    if (rewriteBtn) {
        rewriteBtn.disabled = true;
        rewriteBtn.textContent = '⏳ 전면 수정 중...';
    }

    showProgress('🔥 대본 전면 수정 시작...');
    updateProgress(2, '캐시 생성 중...');

    try {
        // 캐시 생성
        var systemPrompt = getRewriteSystemPrompt();
        var cacheName = await createScriptCache(baseScript, systemPrompt, 1800);
        state._rewriteCacheName = cacheName;

        if (!cacheName) {
            console.log('⚠️ 캐시 없이 진행');
        } else {
            console.log('✅ 전면 수정 캐시: ' + cacheName);
            startCacheTimer(cacheName, 1800);
        }

        // 심층 분석 결과를 텍스트로 변환
        var deepAnalysisSummary = buildDeepAnalysisSummary(deepItems);

        // 청크 분할
        var chunks = splitForRewrite(baseScript);
        console.log('📦 전면 수정: ' + chunks.length + '개 청크');

        updateProgress(5, '📝 ' + chunks.length + '개 구간 수정 시작...');

        var rewrittenTexts = new Array(chunks.length).fill('');
        var maxConcurrent = REWRITE_CONFIG.MAX_CONCURRENT;

        // 순차적 배치 처리
        for (var batchStart = 0; batchStart < chunks.length; batchStart += maxConcurrent) {
            var batchEnd = Math.min(batchStart + maxConcurrent, chunks.length);
            var batchPromises = [];

            for (var ci = batchStart; ci < batchEnd; ci++) {
                var chunk = chunks[ci];
                var chunkInfo = chunk.start + '~' + chunk.end + '자 (' + chunk.num + '/' + chunk.total + ')';
                var isFirst = (ci === 0);
                var isLast = (ci === chunks.length - 1);

                var prompt = buildRewritePromptWithDeepAnalysis(
                    chunk.text, chunkInfo, baseScript.length,
                    errorItems, deepItems, deepAnalysisSummary,
                    isFirst, isLast
                );

                (function(index, promptRef, cacheRef) {
                     batchPromises.push(
                        retryWithDelay(function() {
                            return callGeminiAPI(promptRef, cacheRef, true);
                        }, 3, 3000)

                        .then(function(response) {
                            var cleaned = response
                                .replace(/```[a-z]*\n?/g, '')
                                .replace(/```/g, '')
                                .trim();
                            rewrittenTexts[index] = cleaned;
                            console.log('   ✅ 청크 ' + (index + 1) + ' 수정 완료 (' + cleaned.length + '자)');
                        })
                        .catch(function(err) {
                            console.error('   ❌ 청크 ' + (index + 1) + ' 실패: ' + err.message);
                            rewrittenTexts[index] = '';
                        })
                    );
                })(ci, prompt, cacheName);
            }

            await Promise.all(batchPromises);

            var progress = 5 + Math.round((batchEnd / chunks.length) * 80);
            updateProgress(progress, '📝 수정 중... (' + batchEnd + '/' + chunks.length + ')');

            if (batchEnd < chunks.length) {
                await new Promise(function(resolve) { setTimeout(resolve, 1500); });
            }
        }

        // 청크 병합
        updateProgress(88, '📎 수정 결과 병합 중...');
        var fullRewrittenScript = mergeRewrittenChunks(chunks, rewrittenTexts, baseScript);

        if (!fullRewrittenScript || fullRewrittenScript.trim().length < baseScript.length * 0.3) {
            throw new Error('수정 결과가 너무 짧습니다. 원본 대비 30% 미만입니다.');
        }

        // 상태 저장
        state.stage1.rewrittenScript = fullRewrittenScript;
        state.stage1.fixedScript = fullRewrittenScript;
        state.stage1.isFixed = true;
        state.finalScript = fullRewrittenScript;

        // 수정 반영 칸에 표시
        updateProgress(92, '결과 표시 중...');
        displayRewrittenResult(fullRewrittenScript, baseScript);

        // 캐시 정리
        if (state._rewriteCacheName) {
            deleteScriptCache(state._rewriteCacheName);
            state._rewriteCacheName = null;
        }

        var downloadBtn = document.getElementById('btn-download');
        if (downloadBtn) downloadBtn.disabled = false;

        updateProgress(100, '🔥 전면 수정 완료!');
        setTimeout(hideProgress, 1500);

    } catch (error) {
        if (state._rewriteCacheName) {
            deleteScriptCache(state._rewriteCacheName);
            state._rewriteCacheName = null;
        }
        if (error.name !== 'AbortError') {
            alert('전면 수정 중 오류: ' + error.message);
        }
        hideProgress();
    } finally {
        if (rewriteBtn) {
            rewriteBtn.disabled = false;
            rewriteBtn.innerHTML = '🔥 대본 전면 수정';
        }
    }
}

// ============================================================
// 수정 결과를 "수정 반영" 칸에 표시
// ============================================================
function displayRewrittenResult(rewrittenScript, originalScript) {
    var container = document.getElementById('revised-stage1');
    if (!container) return;

    // 변경 통계 계산
    var origLen = originalScript.length;
    var newLen = rewrittenScript.length;
    var lenDiff = newLen - origLen;
    var lenDiffStr = (lenDiff >= 0 ? '+' : '') + lenDiff;
    var changeRate = Math.round(Math.abs(lenDiff) / origLen * 100);

    // 간단한 diff 하이라이트 (줄 단위 비교)
    var origLines = originalScript.split('\n');
    var newLines = rewrittenScript.split('\n');

    var htmlContent = '';
    var addedCount = 0;
    var removedCount = 0;
    var modifiedCount = 0;

    // 줄 단위 비교용 Set
    var origLineSet = {};
    origLines.forEach(function(line) {
        var trimmed = line.trim();
        if (trimmed.length > 0) origLineSet[trimmed] = true;
    });

    newLines.forEach(function(line) {
        var trimmed = line.trim();
        if (trimmed.length === 0) {
            htmlContent += '\n';
            return;
        }

        if (origLineSet[trimmed]) {
            // 원본과 동일한 줄
            htmlContent += escapeHtml(line) + '\n';
        } else {
            // 새로 추가되거나 수정된 줄
            // 원본에 유사한 줄이 있는지 확인
            var isSimilar = false;
            for (var i = 0; i < origLines.length; i++) {
                var origTrimmed = origLines[i].trim();
                if (origTrimmed.length < 5) continue;
                // 첫 10글자 비교로 유사도 판단
                var checkLen = Math.min(10, trimmed.length, origTrimmed.length);
                if (trimmed.substring(0, checkLen) === origTrimmed.substring(0, checkLen)) {
                    isSimilar = true;
                    break;
                }
            }

            if (isSimilar) {
                // 수정된 줄 (노란색)
                htmlContent += '<span style="background:#FFD70030;border-left:3px solid #FFD700;padding-left:4px;" title="수정됨">' + escapeHtml(line) + '</span>\n';
                modifiedCount++;
            } else {
                // 새로 추가된 줄 (초록색)
                htmlContent += '<span style="background:#4CAF5030;border-left:3px solid #4CAF50;padding-left:4px;" title="추가됨">' + escapeHtml(line) + '</span>\n';
                addedCount++;
            }
        }
    });

    // 삭제된 줄 수 계산
    var newLineSet = {};
    newLines.forEach(function(line) {
        var trimmed = line.trim();
        if (trimmed.length > 0) newLineSet[trimmed] = true;
    });
    origLines.forEach(function(line) {
        var trimmed = line.trim();
        if (trimmed.length > 0 && !newLineSet[trimmed]) removedCount++;
    });

    // 상단 통계 바
    var statsHtml = '<div style="background:#1a1a2e;padding:12px 15px;border-radius:8px;margin-bottom:10px;' +
        'display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">' +
        '<span style="font-size:13px;font-weight:bold;color:#FFD700;">🔥 전면 수정 완료</span>' +
        '<div style="display:flex;gap:12px;flex-wrap:wrap;">' +
        '<span style="font-size:11px;color:#aaa;">원본: ' + origLen + '자</span>' +
        '<span style="font-size:11px;color:#aaa;">수정본: ' + newLen + '자 (' + lenDiffStr + ')</span>' +
        '<span style="font-size:11px;color:#4CAF50;">추가: ' + addedCount + '줄</span>' +
        '<span style="font-size:11px;color:#FFD700;">수정: ' + modifiedCount + '줄</span>' +
        '<span style="font-size:11px;color:#ff5555;">삭제: ' + removedCount + '줄</span>' +
        '</div>' +
        '<div style="display:flex;gap:6px;">' +
        '<span style="font-size:10px;padding:2px 6px;background:#4CAF5030;border-left:2px solid #4CAF50;color:#4CAF50;">추가</span>' +
        '<span style="font-size:10px;padding:2px 6px;background:#FFD70030;border-left:2px solid #FFD700;color:#FFD700;">수정</span>' +
        '</div></div>';

    container.innerHTML = statsHtml +
        '<div style="white-space:pre-wrap;padding:15px;font-size:14px;line-height:1.8;word-break:break-word;">' +
        htmlContent + '</div>';

    // 편집모드 textarea도 동기화
    var editTextarea = document.getElementById('edit-textarea-stage1');
    if (editTextarea) editTextarea.value = rewrittenScript;
}

// ============================================================
// 전면 수정 버튼 초기화 (분석 완료 후 호출)
// ============================================================
function initRewriteButton() {
    var container = document.getElementById('revised-stage1');
    if (!container) return;

    var parent = container.parentElement;
    var wrapper = parent.querySelector('.revert-btn-wrapper');
    if (!wrapper) return;

    // 이미 있으면 스킵
    if (document.getElementById('btn-full-rewrite')) return;

    var btn = document.createElement('button');
    btn.id = 'btn-full-rewrite';
    btn.innerHTML = '🔥 대본 전면 수정';
    btn.style.cssText = 'background:linear-gradient(135deg,#FF416C 0%,#FF4B2B 100%);' +
        'color:white;border:none;padding:8px 16px;border-radius:5px;cursor:pointer;' +
        'font-weight:bold;font-size:13px;box-shadow:0 2px 8px rgba(255,65,108,0.4);';
    btn.addEventListener('click', startFullRewrite);

    wrapper.appendChild(btn);
}

// ============================================================
// 기존 displayStage1Results 확장 — 전면 수정 버튼 추가
// ============================================================
var _originalDisplayStage1Results = displayStage1Results;
displayStage1Results = function() {
    _originalDisplayStage1Results();

    // 전면 수정 버튼 추가
    setTimeout(function() {
        initRewriteButton();
    }, 200);
};
