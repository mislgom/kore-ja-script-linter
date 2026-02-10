/**
 * MISLGOM 대본 검수 자동 프로그램
 * main.js v4.50 - Vertex AI API 키 + Gemini 2.5 Flash
 * - v4.50: 1차 분석 프롬프트 수정 (reason 분리, 나레이션 조선어투 허용)
 * - v4.49: 100점 수정 대본 개선 (구체적 프롬프트 + 녹색 하이라이트)
 * - v4.48: 대본 비교하기 기능 추가
 * - ENDPOINT: generativelanguage.googleapis.com
 * - TIMEOUT: 300000 ms
 * - MAX_OUTPUT_TOKENS: 16384
 */

console.log('🚀 main.js v4.50 로드됨');
console.log('📌 v4.50: 1차 분석 프롬프트 수정 - reason 분리 + 나레이션 조선어투 허용');

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
        currentErrorIndex: -1,
        isFixed: false
    },
    stage2: {
        originalScript: '',
        analysis: null,
        revisedScript: '',
        allErrors: [],
        fixedScript: '',
        currentErrorIndex: -1,
        isFixed: false
    },
    finalScript: '',
    perfectScript: '',
    changePoints: [],
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
    addFullViewButtonsToHeaders();
    createFullViewModal();
    createCompareModal();
    initEscKeyHandler();
    console.log('📊 총 ' + getTotalRulesCount() + '개 시대고증 규칙 로드됨');
    console.log('⏱️ API 타임아웃: ' + (API_CONFIG.TIMEOUT / 1000) + '초');
    console.log('🤖 모델: ' + API_CONFIG.MODEL);
    console.log('✅ main.js v4.50 초기화 완료');
}

function initEscKeyHandler() {
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeFullViewModal();
            closeCompareModal();
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
        '.score-perfect-container{display:flex;gap:20px;margin-top:20px;}' +
        '.score-panel,.perfect-panel{flex:1;background:#1e1e1e;border-radius:10px;padding:20px;min-height:400px;}' +
        '.perfect-script-content{background:#2d2d2d;padding:15px;border-radius:8px;white-space:pre-wrap;word-break:break-word;line-height:1.8;color:#fff;max-height:500px;overflow-y:auto;}' +
        '.perfect-modified{color:#69f0ae;font-weight:bold;}' +
        '.change-points-section{margin-top:15px;padding:15px;background:#2d2d2d;border-radius:8px;max-height:200px;overflow-y:auto;}' +
        '.change-points-title{color:#ffaa00;font-weight:bold;margin-bottom:10px;font-size:14px;}' +
        '.change-point-item{display:block;background:#1e1e1e;color:#69f0ae;padding:8px 12px;margin:5px 0;border-radius:5px;cursor:pointer;font-size:12px;border-left:3px solid #69f0ae;transition:all 0.2s;}' +
        '.change-point-item:hover{background:#333;padding-left:15px;}' +
        '.compare-modal{display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.95);z-index:10000;overflow:auto;}' +
        '.compare-content{display:flex;flex-direction:column;width:100%;height:100%;padding:20px;box-sizing:border-box;}' +
        '.compare-panels{display:flex;flex:1;gap:20px;min-height:0;}' +
        '.compare-panel{flex:1;display:flex;flex-direction:column;background:#1e1e1e;border-radius:10px;overflow:hidden;}' +
        '.compare-header{background:#333;padding:15px;text-align:center;font-weight:bold;color:#fff;border-bottom:1px solid #444;}' +
        '.compare-body{flex:1;overflow:auto;padding:15px;background:#2d2d2d;white-space:pre-wrap;word-break:break-word;line-height:1.8;color:#fff;}' +
        '.compare-diff-section{margin-top:20px;background:#1e1e1e;border-radius:10px;padding:15px;max-height:200px;overflow-y:auto;}' +
        '.compare-diff-title{color:#ffaa00;font-weight:bold;margin-bottom:10px;font-size:14px;}' +
        '.compare-diff-item{display:inline-block;background:#2d2d2d;color:#69f0ae;padding:6px 12px;margin:4px;border-radius:5px;cursor:pointer;font-size:12px;border:1px solid #444;transition:all 0.2s;}' +
        '.compare-diff-item:hover{background:#3d3d3d;border-color:#69f0ae;}' +
        '.compare-close{position:fixed;top:20px;right:30px;font-size:40px;color:#fff;cursor:pointer;z-index:10001;}' +
        '.compare-close:hover{color:#ff5555;}' +
        '.diff-highlight{background:#69f0ae33;border-radius:3px;padding:2px 4px;}' +
        '.waiting-message{text-align:center;padding:50px 20px;color:#888;font-size:14px;}';
    document.head.appendChild(style);
}

function formatTypeText(type) {
    if (!type) return '';
    var typeMap = {
        '시대착오': '시대<br>착오',
        '인물설정': '인물<br>설정',
        '시간왜곡': '시간<br>왜곡',
        '이야기흐름': '이야기<br>흐름',
        '쌩뚱맞은표현': '쌩뚱<br>표현',
        '캐릭터일관성': '캐릭터<br>일관성',
        '장면연결성': '장면<br>연결',
        '대사자연스러움': '대사<br>자연',
        '호칭일관성': '호칭<br>일관',
        '감정선연결': '감정선<br>연결',
        '복선회수': '복선<br>회수',
        '역사적사실': '역사<br>사실'
    };
    return typeMap[type] || type.replace(/(.{2})/g, '$1<br>').replace(/<br>$/, '');
}

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
    modal.addEventListener('click', function(e) {
        if (e.target === modal) closeFullViewModal();
    });
}

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
                    '<div class="compare-header">✅ 최종 수정 반영 대본</div>' +
                    '<div class="compare-body" id="compare-left-body"></div>' +
                '</div>' +
                '<div class="compare-panel">' +
                    '<div class="compare-header">💯 100점 수정 대본</div>' +
                    '<div class="compare-body" id="compare-right-body"></div>' +
                '</div>' +
            '</div>' +
            '<div class="compare-diff-section">' +
                '<div class="compare-diff-title">📍 수정된 부분 (클릭하면 해당 위치로 이동)</div>' +
                '<div id="compare-diff-list"></div>' +
            '</div>' +
        '</div>';
    document.body.appendChild(modal);
    
    document.getElementById('compare-close').addEventListener('click', closeCompareModal);
    modal.addEventListener('click', function(e) {
        if (e.target === modal) closeCompareModal();
    });
}

function openCompareModal() {
    var modal = document.getElementById('compare-modal');
    if (!modal) return;
    
    var finalScript = state.stage2.fixedScript || state.stage1.fixedScript || state.stage2.originalScript || state.stage1.originalScript || '';
    var perfectScript = state.perfectScript || '';
    
    if (!finalScript || !perfectScript) {
        alert('비교할 대본이 없습니다.\n2차 분석을 먼저 완료해주세요.');
        return;
    }
    
    var leftBody = document.getElementById('compare-left-body');
    var rightBody = document.getElementById('compare-right-body');
    var diffList = document.getElementById('compare-diff-list');
    
    var differences = findDifferences(finalScript, perfectScript);
    
    var leftHtml = escapeHtml(finalScript);
    differences.forEach(function(diff, idx) {
        if (diff.original) {
            var marker = '<span class="diff-highlight" data-diff-id="diff-left-' + idx + '">' + escapeHtml(diff.original) + '</span>';
            leftHtml = leftHtml.replace(escapeHtml(diff.original), marker);
        }
    });
    leftBody.innerHTML = leftHtml;
    
    var rightHtml = escapeHtml(perfectScript);
    differences.forEach(function(diff, idx) {
        if (diff.modified) {
            var marker = '<span class="diff-highlight" data-diff-id="diff-right-' + idx + '">' + escapeHtml(diff.modified) + '</span>';
            rightHtml = rightHtml.replace(escapeHtml(diff.modified), marker);
        }
    });
    rightBody.innerHTML = rightHtml;
    
    diffList.innerHTML = '';
    if (differences.length === 0) {
        diffList.innerHTML = '<div style="color:#888;padding:10px;">차이점이 없습니다.</div>';
    } else {
        differences.forEach(function(diff, idx) {
            var item = document.createElement('span');
            item.className = 'compare-diff-item';
            item.setAttribute('data-diff-index', idx);
            item.textContent = (idx + 1) + '. ' + (diff.original ? diff.original.substring(0, 20) : '추가됨') + (diff.original && diff.original.length > 20 ? '...' : '');
            item.addEventListener('click', function() {
                scrollToDiff(idx);
            });
            diffList.appendChild(item);
        });
    }
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function findDifferences(text1, text2) {
    var differences = [];
    
    var sentences1 = text1.split(/(?<=[.!?。])\s*/);
    var sentences2 = text2.split(/(?<=[.!?。])\s*/);
    
    var maxLen = Math.max(sentences1.length, sentences2.length);
    
    for (var i = 0; i < maxLen; i++) {
        var s1 = sentences1[i] || '';
        var s2 = sentences2[i] || '';
        
        if (s1.trim() !== s2.trim() && (s1.trim() || s2.trim())) {
            var words1 = s1.split(/\s+/);
            var words2 = s2.split(/\s+/);
            
            for (var j = 0; j < Math.max(words1.length, words2.length); j++) {
                var w1 = words1[j] || '';
                var w2 = words2[j] || '';
                if (w1 !== w2 && (w1 || w2)) {
                    differences.push({
                        original: w1,
                        modified: w2,
                        sentenceIndex: i
                    });
                }
            }
        }
    }
    
    return differences.slice(0, 50);
}

function scrollToDiff(index) {
    var leftMarker = document.querySelector('[data-diff-id="diff-left-' + index + '"]');
    var rightMarker = document.querySelector('[data-diff-id="diff-right-' + index + '"]');
    
    if (leftMarker) {
        leftMarker.scrollIntoView({ behavior: 'smooth', block: 'center' });
        leftMarker.style.background = '#ffeb3b';
        setTimeout(function() {
            leftMarker.style.background = '';
        }, 2000);
    }
    
    if (rightMarker) {
        rightMarker.scrollIntoView({ behavior: 'smooth', block: 'center' });
        rightMarker.style.background = '#ffeb3b';
        setTimeout(function() {
            rightMarker.style.background = '';
        }, 2000);
    }
}

function closeCompareModal() {
    var modal = document.getElementById('compare-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
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
    var headers = [
        { selector: '#analysis-result-stage1', stage: 'stage1', type: 'analysis' },
        { selector: '#revised-stage1', stage: 'stage1', type: 'revised' },
        { selector: '#analysis-result-stage2', stage: 'stage2', type: 'analysis' },
        { selector: '#revised-stage2', stage: 'stage2', type: 'revised' }
    ];
    
    headers.forEach(function(h) {
        var container = document.querySelector(h.selector);
        if (container) {
            var header = container.querySelector('h3');
            if (header && !header.querySelector('.btn-fullview')) {
                var btn = document.createElement('button');
                btn.className = 'btn-fullview';
                btn.textContent = '전체보기';
                btn.setAttribute('data-stage', h.stage);
                btn.setAttribute('data-type', h.type);
                btn.addEventListener('click', function() {
                    openFullViewModal(h.stage);
                });
                header.appendChild(btn);
            }
        }
    });
}

function openFullViewModal(stage) {
    var modal = document.getElementById('fullview-modal');
    if (!modal) return;
    
    var leftHeader = document.getElementById('fullview-left-header');
    var leftBody = document.getElementById('fullview-left-body');
    var rightHeader = document.getElementById('fullview-right-header');
    var rightBody = document.getElementById('fullview-right-body');
    var footer = document.getElementById('fullview-footer');
    
    var stageNum = stage === 'stage1' ? '1차' : '2차';
    var stageData = state[stage];
    
    leftHeader.textContent = stageNum + ' 분석 결과';
    rightHeader.textContent = stageNum + ' 수정 반영' + (stageData.isFixed ? ' (대본 픽스 완료)' : '');
    
    if (stageData.allErrors && stageData.allErrors.length > 0) {
        var tableHtml = '<table class="analysis-table"><thead><tr>' +
            '<th>유형</th><th>원문</th><th>수정안</th><th>사유</th></tr></thead><tbody>';
        stageData.allErrors.forEach(function(err, idx) {
            tableHtml += '<tr data-error-index="' + idx + '" style="cursor:pointer;">' +
                '<td class="type-cell">' + formatTypeText(err.type || '') + '</td>' +
                '<td>' + escapeHtml(err.original || '') + '</td>' +
                '<td>' + escapeHtml(err.revised || '') + '</td>' +
                '<td>' + escapeHtml(err.reason || '') + '</td></tr>';
        });
        tableHtml += '</tbody></table>';
        leftBody.innerHTML = tableHtml;
        
        leftBody.querySelectorAll('tr[data-error-index]').forEach(function(row) {
            row.addEventListener('click', function() {
                var idx = parseInt(this.getAttribute('data-error-index'));
                highlightErrorInFullView(stage, idx);
            });
        });
    } else {
        leftBody.innerHTML = '<p style="text-align:center;color:#888;padding:20px;">분석 결과가 없습니다.</p>';
    }
    
    var scriptToShow = stageData.isFixed ? stageData.fixedScript : stageData.revisedScript;
    if (scriptToShow) {
        var highlightedScript = highlightAllErrors(scriptToShow, stageData.allErrors);
        rightBody.innerHTML = '<pre style="white-space:pre-wrap;word-break:break-word;margin:0;font-family:inherit;line-height:1.8;">' + highlightedScript + '</pre>';
    } else {
        rightBody.innerHTML = '<p style="text-align:center;color:#888;padding:20px;">수정된 대본이 없습니다.</p>';
    }
    
    footer.innerHTML = '';
    
    var toggleBtn = document.createElement('button');
    toggleBtn.className = 'btn-fullview';
    toggleBtn.style.background = stageData.isFixed ? '#ff9800' : '#4caf50';
    toggleBtn.textContent = stageData.isFixed ? '수정 전 보기' : '수정 후 보기';
    toggleBtn.addEventListener('click', function() {
        toggleFullViewScript(stage);
    });
    footer.appendChild(toggleBtn);
    
    if (!stageData.isFixed) {
        var fixBtn = document.createElement('button');
        fixBtn.className = 'btn-fullview';
        fixBtn.style.background = '#f44336';
        fixBtn.textContent = '대본 픽스';
        fixBtn.addEventListener('click', function() {
            fixScriptInFullView(stage);
        });
        footer.appendChild(fixBtn);
    }
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function toggleFullViewScript(stage) {
    var stageData = state[stage];
    var rightBody = document.getElementById('fullview-right-body');
    var rightHeader = document.getElementById('fullview-right-header');
    var footer = document.getElementById('fullview-footer');
    var toggleBtn = footer.querySelector('button');
    
    var stageNum = stage === 'stage1' ? '1차' : '2차';
    
    if (toggleBtn.textContent === '수정 전 보기') {
        rightHeader.textContent = stageNum + ' 원본 대본';
        rightBody.innerHTML = '<pre style="white-space:pre-wrap;word-break:break-word;margin:0;font-family:inherit;line-height:1.8;">' + escapeHtml(stageData.originalScript || '') + '</pre>';
        toggleBtn.textContent = '수정 후 보기';
        toggleBtn.style.background = '#4caf50';
    } else {
        var scriptToShow = stageData.isFixed ? stageData.fixedScript : stageData.revisedScript;
        rightHeader.textContent = stageNum + ' 수정 반영' + (stageData.isFixed ? ' (대본 픽스 완료)' : '');
        var highlightedScript = highlightAllErrors(scriptToShow, stageData.allErrors);
        rightBody.innerHTML = '<pre style="white-space:pre-wrap;word-break:break-word;margin:0;font-family:inherit;line-height:1.8;">' + highlightedScript + '</pre>';
        toggleBtn.textContent = '수정 전 보기';
        toggleBtn.style.background = '#ff9800';
    }
}

function fixScriptInFullView(stage) {
    var stageData = state[stage];
    stageData.isFixed = true;
    stageData.fixedScript = stageData.revisedScript;
    
    var rightHeader = document.getElementById('fullview-right-header');
    var footer = document.getElementById('fullview-footer');
    var stageNum = stage === 'stage1' ? '1차' : '2차';
    
    rightHeader.textContent = stageNum + ' 수정 반영 (대본 픽스 완료)';
    
    var fixBtn = footer.querySelector('button:nth-child(2)');
    if (fixBtn) fixBtn.remove();
    
    var revisedContainer = document.getElementById('revised-' + stage);
    if (revisedContainer) {
        var fixBtnInPage = revisedContainer.querySelector('.fix-btn');
        if (fixBtnInPage) fixBtnInPage.style.display = 'none';
    }
    
    if (stage === 'stage2') {
        state.finalScript = stageData.fixedScript;
    }
    
    alert('대본이 픽스되었습니다!');
}

function highlightErrorInFullView(stage, errorIndex) {
    var stageData = state[stage];
    var error = stageData.allErrors[errorIndex];
    if (!error) return;
    
    var rightBody = document.getElementById('fullview-right-body');
    var pre = rightBody.querySelector('pre');
    if (!pre) return;
    
    var scriptToShow = stageData.isFixed ? stageData.fixedScript : stageData.revisedScript;
    var highlightedScript = highlightAllErrors(scriptToShow, stageData.allErrors, errorIndex);
    pre.innerHTML = highlightedScript;
    
    setTimeout(function() {
        var activeMarker = pre.querySelector('.highlight-active, .highlight-active-orange');
        if (activeMarker) {
            activeMarker.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, 100);
}

function highlightAllErrors(script, errors, activeIndex) {
    if (!script || !errors || errors.length === 0) return escapeHtml(script || '');
    
    var result = escapeHtml(script);
    
    errors.forEach(function(err, idx) {
        if (err.revised) {
            var escapedRevised = escapeHtml(err.revised);
            var markerClass = idx === activeIndex ? 'marker-revised highlight-active' : 'marker-revised';
            var marker = '<span class="' + markerClass + '" data-error-index="' + idx + '">[' + (idx + 1) + ']</span>';
            result = result.replace(escapedRevised, marker + escapedRevised);
        }
    });
    
    return result;
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function initDarkMode() {
    document.body.classList.add('dark-mode');
}

function initApiKeyPanel() {
    var apiKeyInput = document.getElementById('apiKeyInput');
    var saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
    var apiStatus = document.getElementById('apiStatus');
    
    var savedKey = localStorage.getItem('GEMINI_API_KEY');
    if (savedKey) {
        apiKeyInput.value = savedKey;
        apiStatus.textContent = 'API 키가 저장되어 있습니다.';
        apiStatus.style.color = '#69f0ae';
    }
    
    saveApiKeyBtn.addEventListener('click', function() {
        var key = apiKeyInput.value.trim();
        if (key) {
            localStorage.setItem('GEMINI_API_KEY', key);
            apiStatus.textContent = 'API 키가 저장되었습니다!';
            apiStatus.style.color = '#69f0ae';
        } else {
            apiStatus.textContent = 'API 키를 입력해주세요.';
            apiStatus.style.color = '#ff5555';
        }
    });
}

function initTextArea() {
    var textarea = document.getElementById('scriptInput');
    if (textarea) {
        textarea.addEventListener('input', function() {
            autoResizeTextarea(this);
        });
    }
}

function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 500) + 'px';
}

function initFileUpload() {
    var fileInput = document.getElementById('fileInput');
    var uploadBtn = document.getElementById('uploadBtn');
    
    if (uploadBtn && fileInput) {
        uploadBtn.addEventListener('click', function() {
            fileInput.click();
        });
        
        fileInput.addEventListener('change', function(e) {
            handleFileUpload(e.target.files[0]);
        });
    }
}

function initDragAndDrop() {
    var dropZone = document.getElementById('scriptInput');
    if (!dropZone) return;
    
    dropZone.addEventListener('dragover', function(e) {
        e.preventDefault();
        dropZone.style.borderColor = '#69f0ae';
    });
    
    dropZone.addEventListener('dragleave', function(e) {
        e.preventDefault();
        dropZone.style.borderColor = '#444';
    });
    
    dropZone.addEventListener('drop', function(e) {
        e.preventDefault();
        dropZone.style.borderColor = '#444';
        var file = e.dataTransfer.files[0];
        if (file) handleFileUpload(file);
    });
}

function handleFileUpload(file) {
    if (!file) return;
    
    var validTypes = ['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.txt') && !file.name.endsWith('.hwp')) {
        alert('지원되는 파일 형식: TXT, PDF, DOCX, HWP');
        return;
    }
    
    if (file.name.endsWith('.txt') || file.type === 'text/plain') {
        var reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('scriptInput').value = e.target.result;
            autoResizeTextarea(document.getElementById('scriptInput'));
        };
        reader.readAsText(file, 'UTF-8');
    } else {
        alert('현재 TXT 파일만 직접 로드 가능합니다.\nPDF/DOCX/HWP는 텍스트를 복사하여 붙여넣기 해주세요.');
    }
}

function initClearButton() {
    var clearBtn = document.getElementById('clearBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            if (confirm('입력된 내용을 모두 지우시겠습니까?')) {
                document.getElementById('scriptInput').value = '';
                clearAllResults();
            }
        });
    }
}

function clearAllResults() {
    state.stage1 = { originalScript: '', analysis: null, revisedScript: '', allErrors: [], fixedScript: '', currentErrorIndex: -1, isFixed: false };
    state.stage2 = { originalScript: '', analysis: null, revisedScript: '', allErrors: [], fixedScript: '', currentErrorIndex: -1, isFixed: false };
    state.finalScript = '';
    state.perfectScript = '';
    state.changePoints = [];
    state.scores = null;
    
    var containers = ['analysis-result-stage1', 'revised-stage1', 'analysis-result-stage2', 'revised-stage2'];
    containers.forEach(function(id) {
        var container = document.getElementById(id);
        if (container) {
            var content = container.querySelector('.result-content, .revised-content');
            if (content) content.innerHTML = '';
        }
    });
    
    var scoreDisplay = document.getElementById('score-display');
    if (scoreDisplay) {
        scoreDisplay.innerHTML = '<div class="score-perfect-container">' +
            '<div class="score-panel"><h3 style="color:#fff;margin-bottom:15px;text-align:center;">📊 품질 평가 점수</h3>' +
            '<div class="waiting-message">2차 분석 완료 후 점수가 표시됩니다</div></div>' +
            '<div class="perfect-panel"><h3 style="color:#69f0ae;margin-bottom:15px;text-align:center;">💯 100점 수정 대본</h3>' +
            '<div class="waiting-message">2차 분석 완료 후 수정 대본이 표시됩니다</div></div></div>';
    }
}

function hideOriginalAnalysisButtons() {
    var originalBtns = document.querySelectorAll('.analyze-btn:not(#stage1AnalyzeBtn):not(#stage2AnalyzeBtn)');
    originalBtns.forEach(function(btn) {
        btn.style.display = 'none';
    });
}

function initDownloadButton() {
    var downloadBtn = document.getElementById('downloadBtn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
            downloadFinalScript();
        });
    }
}

function downloadFinalScript() {
    var finalScript = state.stage2.fixedScript || state.stage2.revisedScript || 
                      state.stage1.fixedScript || state.stage1.revisedScript || 
                      document.getElementById('scriptInput').value;
    
    if (!finalScript) {
        alert('다운로드할 대본이 없습니다.');
        return;
    }
    
    var cleanScript = finalScript.replace(/★/g, '');
    
    var blob = new Blob([cleanScript], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = '수정된_대본_' + new Date().toISOString().slice(0, 10) + '.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function initRevertButtons() {
    var revertBtns = document.querySelectorAll('.revert-btn');
    revertBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            var stage = this.closest('[id*="stage1"]') ? 'stage1' : 'stage2';
            revertToOriginal(stage);
        });
    });
}

function revertToOriginal(stage) {
    if (confirm('원본 대본으로 되돌리시겠습니까? 수정 내용이 모두 사라집니다.')) {
        var stageData = state[stage];
        stageData.revisedScript = stageData.originalScript;
        stageData.fixedScript = '';
        stageData.isFixed = false;
        stageData.currentErrorIndex = -1;
        
        updateRevisedDisplay(stage);
        alert('원본으로 되돌렸습니다.');
    }
}

function initStage1AnalysisButton() {
    var btn = document.getElementById('stage1AnalyzeBtn');
    if (btn) {
        btn.addEventListener('click', function() {
            runStage1Analysis();
        });
    }
}

function initStage2AnalysisButton() {
    var btn = document.getElementById('stage2AnalyzeBtn');
    if (btn) {
        btn.addEventListener('click', function() {
            runStage2Analysis();
        });
    }
}

function initStopButton() {
    var stopBtn = document.getElementById('stopBtn');
    if (stopBtn) {
        stopBtn.addEventListener('click', function() {
            if (currentAbortController) {
                currentAbortController.abort();
                currentAbortController = null;
                hideLoading();
                alert('분석이 중단되었습니다.');
            }
        });
    }
}

function showLoading(message) {
    var overlay = document.getElementById('loadingOverlay');
    var text = document.getElementById('loadingText');
    if (overlay && text) {
        text.textContent = message || '분석 중...';
        overlay.style.display = 'flex';
    }
}

function hideLoading() {
    var overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

function updateLoadingText(message) {
    var text = document.getElementById('loadingText');
    if (text) {
        text.textContent = message;
    }
}

function ensureScoreSection() {
    var scoreDisplay = document.getElementById('score-display');
    if (scoreDisplay) {
        if (!scoreDisplay.querySelector('.score-perfect-container')) {
            scoreDisplay.innerHTML = '<div class="score-perfect-container">' +
                '<div class="score-panel">' +
                '<h3 style="color:#fff;margin-bottom:15px;text-align:center;">📊 품질 평가 점수</h3>' +
                '<div class="waiting-message">2차 분석 완료 후 점수가 표시됩니다</div>' +
                '</div>' +
                '<div class="perfect-panel">' +
                '<h3 style="color:#69f0ae;margin-bottom:15px;text-align:center;">💯 100점 수정 대본</h3>' +
                '<div class="waiting-message">2차 분석 완료 후 수정 대본이 표시됩니다</div>' +
                '</div></div>';
        }
    }
    console.log('📦 품질 평가 박스 + 100점 수정 대본 박스 표시됨');
}

async function runStage1Analysis() {
    var scriptInput = document.getElementById('scriptInput');
    var script = scriptInput.value.trim();
    
    if (!script) {
        alert('대본을 입력해주세요.');
        return;
    }
    
    var apiKey = localStorage.getItem('GEMINI_API_KEY');
    if (!apiKey) {
        alert('API 키를 먼저 저장해주세요.');
        return;
    }
    
    state.stage1.originalScript = script;
    
    showLoading('1차 분석 중... (시대고증 오류 검사)');
    
    try {
        currentAbortController = new AbortController();
        var prompt = buildStage1Prompt(script);
        var result = await callGeminiAPI(prompt, apiKey);
        
        state.stage1.analysis = result;
        state.stage1.allErrors = result.errors || [];
        state.stage1.revisedScript = applyRevisionsToScript(script, state.stage1.allErrors);
        
        displayStage1Results();
        hideLoading();
        
    } catch (error) {
        hideLoading();
        if (error.name === 'AbortError') {
            console.log('1차 분석이 중단되었습니다.');
        } else {
            console.error('1차 분석 오류:', error);
            alert('1차 분석 중 오류가 발생했습니다: ' + error.message);
        }
    }
}

async function runStage2Analysis() {
    var baseScript = state.stage1.fixedScript || state.stage1.revisedScript || state.stage1.originalScript;
    
    if (!baseScript) {
        alert('먼저 1차 분석을 완료해주세요.');
        return;
    }
    
    var apiKey = localStorage.getItem('GEMINI_API_KEY');
    if (!apiKey) {
        alert('API 키를 먼저 저장해주세요.');
        return;
    }
    
    state.stage2.originalScript = baseScript;
    
    showLoading('2차 분석 중... (흐름/재미/시니어 분석 및 100점 대본 생성)');
    
    try {
        currentAbortController = new AbortController();
        var prompt = buildStage2Prompt(baseScript);
        var result = await callGeminiAPI(prompt, apiKey);
        
        state.stage2.analysis = result;
        state.stage2.allErrors = result.errors || [];
        state.stage2.revisedScript = applyRevisionsToScript(baseScript, state.stage2.allErrors);
        
        state.scores = result.scores || null;
        state.perfectScript = result.perfectScript || '';
        state.changePoints = result.changePoints || [];
        
        displayStage2Results();
        displayScoresAndPerfectScript();
        hideLoading();
        
    } catch (error) {
        hideLoading();
        if (error.name === 'AbortError') {
            console.log('2차 분석이 중단되었습니다.');
        } else {
            console.error('2차 분석 오류:', error);
            alert('2차 분석 중 오류가 발생했습니다: ' + error.message);
        }
    }
}

function buildStage1Prompt(script) {
    var rulesText = '';
    for (var category in HISTORICAL_RULES) {
        HISTORICAL_RULES[category].forEach(function(rule) {
            rulesText += rule.modern + ' → ' + rule.historical.join('/') + '\n';
        });
    }
    
    // v4.50: 1차 분석 프롬프트 개선 - reason 분리 + 나레이션 조선어투 허용
    return `당신은 조선시대 사극 대본 시대고증 전문가입니다.
아래 대본에서 시대에 맞지 않는 표현을 찾아 수정해주세요.

## 핵심 규칙 (반드시 준수)

### 1. 나레이션 처리 규칙 (매우 중요!)
- "나레이션:", "NA:", "N:", "내레이션:", "(나레이션)" 등으로 시작하는 줄은 **나레이션**입니다.
- **나레이션은 조선시대 어투로 작성해도 정상입니다. 오류가 아닙니다!**
- 나레이션에서 "~하였느니라", "~이니라", "~하느니라", "~로다", "~하였도다" 등의 고어체/사극체는 **정상 표현**입니다.
- 나레이션은 시대착오적 현대 용어(예: 컴퓨터, 스마트폰, 인터넷)만 오류로 판정하세요.
- 나레이션의 문체나 어투 자체는 절대 오류로 판정하지 마세요.

### 2. 대사 처리 규칙
- 등장인물의 대사에서 현대적 용어나 시대에 맞지 않는 물건/시설/직업 등을 찾으세요.
- 대사의 고어체 어투("~하오", "~하시오", "~이옵니다" 등)는 정상입니다.

### 3. 분석 대상
- 시대착오적 물건 (예: 시계 → 해시계, 볼펜 → 붓)
- 시대착오적 시설 (예: 병원 → 의원, 학교 → 서당)
- 시대착오적 직업명 (예: 의사 → 의원, 경찰 → 포졸)
- 시대착오적 단위 (예: 미터 → 자, 킬로그램 → 근)
- 시대착오적 개념 (예: 민주주의, 인권 등 근대 개념)

### 4. 오류가 아닌 것 (분석 제외)
- 나레이션의 고어체/사극체 문체
- 대사의 존대말, 반말, 높임법 등 자연스러운 대화체
- 조선시대에 실제 존재했던 물건/개념
- 한자어 사용 (조선시대는 한자 문화권)

## 시대 고증 참고 자료
${rulesText}

## 응답 형식 (JSON)
\`\`\`json
{
  "errors": [
    {
      "type": "시대착오",
      "original": "원문에서 문제가 되는 정확한 대사 또는 표현",
      "revised": "수정된 대사만 (사유 없이 대사만)",
      "reason": "15자 이내 간단한 사유"
    }
  ]
}
\`\`\`

## 중요 주의사항
1. **revised 필드에는 수정된 대사만 작성하세요. 사유나 설명을 포함하지 마세요!**
2. **나레이션의 고어체 어투는 절대 오류로 판정하지 마세요!**
3. **original과 revised는 대사 텍스트만 포함하세요.**
4. **reason은 별도 필드에 15자 이내로 작성하세요.**
5. 확실한 오류만 지적하세요. 애매한 것은 오류로 판정하지 마세요.

## 분석할 대본
${script}`;
}

function buildStage2Prompt(script) {
    // v4.50: 2차 분석 프롬프트 - 100점 대본 생성 개선
    return `당신은 조선시대 사극 대본 전문 작가이자 품질 평가 전문가입니다.
아래 대본을 분석하여 품질 점수를 매기고, 100점짜리 완벽한 대본을 작성해주세요.

## 분석 항목 (각 100점 만점)

### 1. 시니어적합도 (100점)
- 문장 길이: 한 문장 30자 이내 권장
- 어휘 난이도: 어려운 한자어, 전문용어 최소화
- 맥락 명확성: 대명사 남용 금지, 주어 명확화
- 글자 크기 고려한 간결한 표현

### 2. 재미요소 (100점)
- 반전, 위트, 유머 포함 여부
- 감정 고조 장면의 적절성
- 대사의 매력도와 인상적인 대사 유무
- 지루하지 않은 전개

### 3. 이야기흐름 (100점)
- 장면 간 자연스러운 연결
- 인과관계의 명확성
- 복선과 회수의 적절성
- 갑작스러운 전개 없이 자연스러운 흐름

### 4. 시청자이탈방지 (100점)
- 후킹 요소: 궁금증 유발, 다음 장면 기대감
- 긴장감 유지
- 클리프행어 적절한 사용
- 몰입도 유지

## 응답 형식 (JSON)
\`\`\`json
{
  "errors": [
    {
      "type": "이야기흐름",
      "original": "문제가 되는 원문",
      "revised": "수정된 대사만 (사유 제외)",
      "reason": "15자 이내 간단한 사유"
    }
  ],
  "scores": {
    "시니어적합도": 85,
    "재미요소": 78,
    "이야기흐름": 82,
    "시청자이탈방지": 80
  },
  "improvements": {
    "시니어적합도": "구체적 개선안",
    "재미요소": "구체적 개선안",
    "이야기흐름": "구체적 개선안",
    "시청자이탈방지": "구체적 개선안"
  },
  "perfectScript": "모든 개선사항을 반영한 100점짜리 전체 대본. 수정/추가된 대사는 앞에 ★ 표시. 전체 대본을 처음부터 끝까지 작성.",
  "changePoints": [
    {
      "location": "S#3 15번째 줄",
      "type": "수정",
      "description": "대사 수정 내용 요약"
    }
  ]
}
\`\`\`

## 100점 수정 대본 작성 규칙 (필수!)

### 절대 금지
- 소리 효과 추가 금지 (말발굽 소리, 문 여닫는 소리 등 추가 X)
- 과도한 감정 지시어 금지 (격앙되어, 비통하게 등 추가 X)
- 과도한 감탄사 추가 금지 (아!, 오!, 허! 등 남발 X)

### 허용 범위
- 고풍스러운 어휘: 전체 대사의 20~30%까지만
- 대사 추가: 장면당 1~2문장 이내
- 분위기 보강: 자연스러운 대사 내에서만

### 수정 표기법
- 수정된 대사: 줄 앞에 ★ 표시
- 추가된 대사: 줄 앞에 ★ 표시
- 삭제는 하지 않고 수정으로 대체

### 필수 준수
1. **revised 필드에는 수정된 대사만! 사유나 괄호 설명 절대 포함 금지!**
2. 전체 대본을 처음부터 끝까지 출력
3. 수정하지 않은 부분도 그대로 포함
4. changePoints에 모든 변경사항 기록

## 분석할 대본
${script}`;
}

async function callGeminiAPI(prompt, apiKey) {
    var url = API_CONFIG.ENDPOINT + '/' + API_CONFIG.MODEL + ':generateContent?key=' + apiKey;
    
    var response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: API_CONFIG.MAX_OUTPUT_TOKENS
            }
        }),
        signal: currentAbortController ? currentAbortController.signal : undefined
    });
    
    if (!response.ok) {
        var errorText = await response.text();
        throw new Error('API 오류: ' + response.status + ' - ' + errorText);
    }
    
    var data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('API 응답 형식 오류');
    }
    
    var text = data.candidates[0].content.parts[0].text;
    
    var jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
        try {
            return JSON.parse(jsonMatch[1]);
        } catch (e) {
            console.error('JSON 파싱 오류:', e);
            return { errors: [] };
        }
    }
    
    try {
        return JSON.parse(text);
    } catch (e) {
        console.error('응답 파싱 오류:', e);
        return { errors: [] };
    }
}

function applyRevisionsToScript(script, errors) {
    if (!errors || errors.length === 0) return script;
    
    var result = script;
    errors.forEach(function(err) {
        if (err.original && err.revised) {
            // v4.50: revised에서 괄호로 된 사유 제거 (혹시 포함되어 있을 경우)
            var cleanRevised = err.revised
                .replace(/\s*\([^)]*사유[^)]*\)/g, '')
                .replace(/\s*\([^)]*이유[^)]*\)/g, '')
                .replace(/\s*\[[^\]]*사유[^\]]*\]/g, '')
                .replace(/\s*\[[^\]]*이유[^\]]*\]/g, '')
                .replace(/\s*[-–—]\s*[^,.\n]*(?:때문|이므로|이라서|해서|하여)[^,.\n]*$/g, '')
                .trim();
            
            result = result.replace(err.original, cleanRevised);
        }
    });
    
    return result;
}

function displayStage1Results() {
    var analysisContainer = document.getElementById('analysis-result-stage1');
    var revisedContainer = document.getElementById('revised-stage1');
    
    if (analysisContainer) {
        var content = analysisContainer.querySelector('.result-content');
        if (content) {
            if (state.stage1.allErrors.length > 0) {
                content.innerHTML = buildAnalysisTable(state.stage1.allErrors, 'stage1');
            } else {
                content.innerHTML = '<p style="text-align:center;color:#69f0ae;padding:20px;">✅ 시대고증 오류가 발견되지 않았습니다.</p>';
            }
        }
    }
    
    updateRevisedDisplay('stage1');
}

function displayStage2Results() {
    var analysisContainer = document.getElementById('analysis-result-stage2');
    var revisedContainer = document.getElementById('revised-stage2');
    
    if (analysisContainer) {
        var content = analysisContainer.querySelector('.result-content');
        if (content) {
            if (state.stage2.allErrors.length > 0) {
                content.innerHTML = buildAnalysisTable(state.stage2.allErrors, 'stage2');
            } else {
                content.innerHTML = '<p style="text-align:center;color:#69f0ae;padding:20px;">✅ 추가 개선 사항이 발견되지 않았습니다.</p>';
            }
        }
    }
    
    updateRevisedDisplay('stage2');
}

function buildAnalysisTable(errors, stage) {
    var html = '<table class="analysis-table"><thead><tr>' +
        '<th>유형</th><th>원문</th><th>수정안</th><th>사유</th></tr></thead><tbody>';
    
    errors.forEach(function(err, idx) {
        html += '<tr data-error-index="' + idx + '" data-stage="' + stage + '" style="cursor:pointer;">' +
            '<td class="type-cell">' + formatTypeText(err.type || '') + '</td>' +
            '<td>' + escapeHtml(err.original || '') + '</td>' +
            '<td>' + escapeHtml(err.revised || '') + '</td>' +
            '<td>' + escapeHtml(err.reason || '') + '</td></tr>';
    });
    
    html += '</tbody></table>';
    return html;
}

function updateRevisedDisplay(stage) {
    var container = document.getElementById('revised-' + stage);
    if (!container) return;
    
    var content = container.querySelector('.revised-content');
    if (!content) return;
    
    var stageData = state[stage];
    var scriptToShow = stageData.isFixed ? stageData.fixedScript : stageData.revisedScript;
    
    if (scriptToShow) {
        var highlighted = highlightAllErrors(scriptToShow, stageData.allErrors);
        content.innerHTML = '<pre style="white-space:pre-wrap;word-break:break-word;margin:0;font-family:inherit;line-height:1.8;">' + highlighted + '</pre>';
    }
    
    var fixBtn = container.querySelector('.fix-btn');
    if (fixBtn) {
        fixBtn.style.display = stageData.isFixed ? 'none' : 'inline-block';
        if (!fixBtn.hasAttribute('data-initialized')) {
            fixBtn.setAttribute('data-initialized', 'true');
            fixBtn.addEventListener('click', function() {
                fixScript(stage);
            });
        }
    }
}

function fixScript(stage) {
    var stageData = state[stage];
    stageData.isFixed = true;
    stageData.fixedScript = stageData.revisedScript;
    
    if (stage === 'stage2') {
        state.finalScript = stageData.fixedScript;
    }
    
    updateRevisedDisplay(stage);
    alert('대본이 픽스되었습니다!');
}

function displayScoresAndPerfectScript() {
    var scoreDisplay = document.getElementById('score-display');
    if (!scoreDisplay) return;
    
    var scoresHtml = '';
    if (state.scores) {
        var total = 0;
        var count = 0;
        
        scoresHtml = '<div style="margin-bottom:20px;">';
        for (var key in state.scores) {
            var score = state.scores[key];
            total += score;
            count++;
            var color = score >= 90 ? '#69f0ae' : score >= 70 ? '#ffeb3b' : '#ff5555';
            scoresHtml += '<div style="display:flex;justify-content:space-between;align-items:center;margin:10px 0;padding:10px;background:#2d2d2d;border-radius:8px;">' +
                '<span style="color:#fff;">' + key + '</span>' +
                '<span style="color:' + color + ';font-weight:bold;font-size:18px;">' + score + '점</span></div>';
        }
        
        var avg = Math.round(total / count);
        var avgColor = avg >= 95 ? '#69f0ae' : avg >= 80 ? '#ffeb3b' : '#ff5555';
        var passText = avg >= 95 ? '✅ 합격' : '❌ 불합격 (95점 이상 필요)';
        
        scoresHtml += '<div style="margin-top:20px;padding:15px;background:' + avgColor + '22;border:2px solid ' + avgColor + ';border-radius:10px;text-align:center;">' +
            '<div style="font-size:24px;font-weight:bold;color:' + avgColor + ';">평균 ' + avg + '점</div>' +
            '<div style="margin-top:5px;color:' + avgColor + ';">' + passText + '</div></div>';
        scoresHtml += '</div>';
        
        if (state.stage2.analysis && state.stage2.analysis.improvements) {
            scoresHtml += '<div style="margin-top:20px;"><h4 style="color:#ffaa00;margin-bottom:10px;">💡 개선 제안</h4>';
            for (var impKey in state.stage2.analysis.improvements) {
                scoresHtml += '<div style="background:#2d2d2d;padding:10px;margin:5px 0;border-radius:5px;border-left:3px solid #ffaa00;">' +
                    '<strong style="color:#fff;">' + impKey + ':</strong> <span style="color:#ccc;">' + state.stage2.analysis.improvements[impKey] + '</span></div>';
            }
            scoresHtml += '</div>';
        }
    } else {
        scoresHtml = '<div class="waiting-message">2차 분석 완료 후 점수가 표시됩니다</div>';
    }
    
    var perfectHtml = '';
    if (state.perfectScript) {
        perfectHtml = '<div class="perfect-script-content" id="perfect-script-content">' + formatPerfectScript(state.perfectScript) + '</div>';
        
        if (state.changePoints && state.changePoints.length > 0) {
            perfectHtml += '<div class="change-points-section"><div class="change-points-title">📍 변경 포인트 (클릭하면 해당 위치로 이동)</div>';
            state.changePoints.forEach(function(point, idx) {
                perfectHtml += '<span class="change-point-item" data-point-index="' + idx + '">' +
                    (point.location || '') + ' - ' + (point.type || '') + ': ' + (point.description || '') + '</span>';
            });
            perfectHtml += '</div>';
        }
        
        perfectHtml += '<div style="margin-top:15px;display:flex;gap:10px;flex-wrap:wrap;">' +
            '<button class="btn-fullview" id="download-perfect-btn" style="background:#4caf50;">💾 100점 대본 다운로드</button>' +
            '<button class="btn-fullview" id="compare-scripts-btn" style="background:#2196f3;">🔄 대본 비교하기</button></div>';
    } else {
        perfectHtml = '<div class="waiting-message">2차 분석 완료 후 수정 대본이 표시됩니다</div>';
    }
    
    scoreDisplay.innerHTML = '<div class="score-perfect-container">' +
        '<div class="score-panel"><h3 style="color:#fff;margin-bottom:15px;text-align:center;">📊 품질 평가 점수</h3>' + scoresHtml + '</div>' +
        '<div class="perfect-panel"><h3 style="color:#69f0ae;margin-bottom:15px;text-align:center;">💯 100점 수정 대본</h3>' + perfectHtml + '</div></div>';
    
    var downloadPerfectBtn = document.getElementById('download-perfect-btn');
    if (downloadPerfectBtn) {
        downloadPerfectBtn.addEventListener('click', downloadPerfectScript);
    }
    
    var compareBtn = document.getElementById('compare-scripts-btn');
    if (compareBtn) {
        compareBtn.addEventListener('click', openCompareModal);
    }
    
    var changePointItems = scoreDisplay.querySelectorAll('.change-point-item');
    changePointItems.forEach(function(item) {
        item.addEventListener('click', function() {
            var idx = parseInt(this.getAttribute('data-point-index'));
            scrollToPerfectScriptChange(idx);
        });
    });
}

function formatPerfectScript(script) {
    if (!script) return '';
    
    var lines = script.split('\n');
    var formattedLines = lines.map(function(line) {
        if (line.trim().startsWith('★')) {
            return '<span class="perfect-modified">' + escapeHtml(line) + '</span>';
        }
        return escapeHtml(line);
    });
    
    return formattedLines.join('\n');
}

function scrollToPerfectScriptChange(index) {
    var content = document.getElementById('perfect-script-content');
    if (!content) return;
    
    var modifiedLines = content.querySelectorAll('.perfect-modified');
    if (modifiedLines[index]) {
        modifiedLines[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
        modifiedLines[index].style.background = '#ffeb3b';
        modifiedLines[index].style.color = '#000';
        setTimeout(function() {
            modifiedLines[index].style.background = '';
            modifiedLines[index].style.color = '';
        }, 2000);
    }
}

function downloadPerfectScript() {
    if (!state.perfectScript) {
        alert('100점 수정 대본이 없습니다.');
        return;
    }
    
    var cleanScript = state.perfectScript.replace(/★/g, '');
    
    var blob = new Blob([cleanScript], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = '100점_수정_대본_' + new Date().toISOString().slice(0, 10) + '.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
