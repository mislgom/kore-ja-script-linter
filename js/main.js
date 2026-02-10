/**
 * MISLGOM 대본 검수 자동 프로그램
 * main.js v4.47 - Vertex AI API 키 + Gemini 2.5 Flash
 * - v4.47: 페이지 로드 시 품질 평가 + 100점 수정 대본 박스 즉시 표시
 * - v4.46: 품질 평가 + 100점 수정 대본 좌우 분할
 * - ENDPOINT: generativelanguage.googleapis.com
 * - TIMEOUT: 300000 ms
 * - MAX_OUTPUT_TOKENS: 16384
 */

console.log('🚀 main.js v4.47 로드됨');
console.log('📌 v4.47: 페이지 로드 시 품질 평가 + 100점 수정 대본 박스 즉시 표시');

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
    initEscKeyHandler();
    console.log('📊 총 ' + getTotalRulesCount() + '개 시대고증 규칙 로드됨');
    console.log('⏱️ API 타임아웃: ' + (API_CONFIG.TIMEOUT / 1000) + '초');
    console.log('🤖 모델: ' + API_CONFIG.MODEL);
    console.log('✅ main.js v4.47 초기화 완료');
}

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
        '.score-panel{flex:1;background:#1e1e1e;border-radius:10px;padding:20px;min-height:400px;border:1px solid #333;}' +
        '.perfect-panel{flex:1;background:#1e1e1e;border-radius:10px;padding:20px;min-height:400px;border:1px solid #333;}' +
        '.panel-title{font-size:16px;font-weight:bold;color:#69f0ae;margin-bottom:15px;padding-bottom:10px;border-bottom:1px solid #444;}' +
        '.perfect-script-content{background:#2d2d2d;padding:15px;border-radius:8px;white-space:pre-wrap;word-break:break-word;line-height:1.8;color:#69f0ae;max-height:500px;overflow-y:auto;}' +
        '.score-item{display:flex;justify-content:space-between;align-items:center;padding:12px;margin-bottom:10px;background:#2d2d2d;border-radius:8px;}' +
        '.score-label{font-size:14px;color:#fff;}' +
        '.score-value{font-size:18px;font-weight:bold;}' +
        '.score-value.pass{color:#69f0ae;}' +
        '.score-value.fail{color:#ff5252;}' +
        '.score-avg{margin-top:15px;padding:15px;background:#333;border-radius:8px;text-align:center;}' +
        '.score-avg-label{font-size:14px;color:#aaa;margin-bottom:5px;}' +
        '.score-avg-value{font-size:24px;font-weight:bold;}' +
        '.improvement-section{margin-top:15px;padding:15px;background:#2d2d2d;border-radius:8px;}' +
        '.improvement-title{font-size:14px;font-weight:bold;color:#ffd740;margin-bottom:10px;}' +
        '.improvement-content{font-size:13px;color:#ccc;line-height:1.6;}' +
        '.waiting-message{color:#888;font-size:14px;text-align:center;padding:50px 20px;}';
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

function openFullViewModal(stage) {
    var modal = document.getElementById('fullview-modal');
    if (!modal) return;
    
    var stageNum = stage === 'stage1' ? '1차' : '2차';
    var analysisBox = document.getElementById('analysis-' + stage);
    var revisedBox = document.getElementById('revised-' + stage);
    
    document.getElementById('fullview-left-header').textContent = stageNum + ' 분석 결과';
    document.getElementById('fullview-right-header').textContent = stage === 'stage1' ? '1차 수정 반영' : '최종 수정 반영';
    
    var leftBody = document.getElementById('fullview-left-body');
    var rightBody = document.getElementById('fullview-right-body');
    var footer = document.getElementById('fullview-footer');
    
    if (analysisBox) {
        leftBody.innerHTML = analysisBox.innerHTML;
        leftBody.querySelectorAll('tr[data-marker-id]').forEach(function(row) {
            row.addEventListener('click', function() {
                var markerId = this.getAttribute('data-marker-id');
                var errorIndex = findErrorIndexById(stage, markerId);
                if (errorIndex >= 0) {
                    setCurrentError(stage, errorIndex);
                    highlightFullViewRow(leftBody, markerId);
                    scrollToFullViewMarker(rightBody, markerId, stage);
                }
            });
        });
    }
    
    if (revisedBox) {
        rightBody.innerHTML = revisedBox.innerHTML;
        rightBody.querySelectorAll('.correction-marker').forEach(function(marker) {
            marker.addEventListener('click', function() {
                var markerId = this.getAttribute('data-marker-id');
                var errorIndex = findErrorIndexById(stage, markerId);
                if (errorIndex >= 0) {
                    setCurrentError(stage, errorIndex);
                    highlightFullViewRow(leftBody, markerId);
                }
            });
        });
    }
    
    footer.innerHTML = '';
    
    var btnBefore = document.createElement('button');
    btnBefore.innerHTML = '🔄 수정 전';
    btnBefore.style.cssText = 'background:#ff9800;color:white;border:none;padding:8px 16px;border-radius:5px;cursor:pointer;font-weight:bold;font-size:13px;';
    btnBefore.addEventListener('click', function() {
        toggleCurrentError(stage, false);
        updateFullViewContent(stage, leftBody, rightBody);
    });
    
    var btnAfter = document.createElement('button');
    btnAfter.innerHTML = '✅ 수정 후';
    btnAfter.style.cssText = 'background:#4CAF50;color:white;border:none;padding:8px 16px;border-radius:5px;cursor:pointer;font-weight:bold;font-size:13px;';
    btnAfter.addEventListener('click', function() {
        toggleCurrentError(stage, true);
        updateFullViewContent(stage, leftBody, rightBody);
    });
    
    var btnFix = document.createElement('button');
    btnFix.innerHTML = '📌 대본 픽스';
    btnFix.style.cssText = 'background:#2196F3;color:white;border:none;padding:8px 16px;border-radius:5px;cursor:pointer;font-weight:bold;font-size:13px;';
    btnFix.addEventListener('click', function() {
        fixScript(stage);
        updateFullViewContent(stage, leftBody, rightBody);
    });
    
    footer.appendChild(btnBefore);
    footer.appendChild(btnAfter);
    footer.appendChild(btnFix);
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function updateFullViewContent(stage, leftBody, rightBody) {
    var analysisBox = document.getElementById('analysis-' + stage);
    var revisedBox = document.getElementById('revised-' + stage);
    
    if (analysisBox) {
        leftBody.innerHTML = analysisBox.innerHTML;
        leftBody.querySelectorAll('tr[data-marker-id]').forEach(function(row) {
            row.addEventListener('click', function() {
                var markerId = this.getAttribute('data-marker-id');
                var errorIndex = findErrorIndexById(stage, markerId);
                if (errorIndex >= 0) {
                    setCurrentError(stage, errorIndex);
                    highlightFullViewRow(leftBody, markerId);
                    scrollToFullViewMarker(rightBody, markerId, stage);
                }
            });
        });
    }
    
    if (revisedBox) {
        rightBody.innerHTML = revisedBox.innerHTML;
        rightBody.querySelectorAll('.correction-marker').forEach(function(marker) {
            marker.addEventListener('click', function() {
                var markerId = this.getAttribute('data-marker-id');
                var errorIndex = findErrorIndexById(stage, markerId);
                if (errorIndex >= 0) {
                    setCurrentError(stage, errorIndex);
                    highlightFullViewRow(leftBody, markerId);
                }
            });
        });
    }
}

function highlightFullViewRow(container, markerId) {
    var rows = container.querySelectorAll('tr[data-marker-id]');
    rows.forEach(function(row) {
        if (row.getAttribute('data-marker-id') === markerId) {
            row.style.background = '#3a3a3a';
            row.style.outline = '2px solid #69f0ae';
        } else {
            row.style.background = '';
            row.style.outline = '';
        }
    });
}

function scrollToFullViewMarker(container, markerId, stage) {
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
        var revised2Parent = document.getElementById('revised-stage2');
        
        if (revised1Parent) {
            var parent1 = revised1Parent.parentElement;
            var header1 = parent1.querySelector('.section-header, .panel-title, h3, h4');
            if (!header1) {
                var allDivs = parent1.querySelectorAll('div');
                for (var i = 0; i < allDivs.length; i++) {
                    if (allDivs[i].textContent.includes('1차 수정 반영') && !allDivs[i].querySelector('button')) {
                        header1 = allDivs[i];
                        break;
                    }
                }
            }
            if (header1 && !header1.querySelector('.btn-fullview')) {
                var btn1 = document.createElement('button');
                btn1.className = 'btn-fullview';
                btn1.innerHTML = '🔍 전체 보기';
                btn1.addEventListener('click', function() {
                    openFullViewModal('stage1');
                });
                header1.style.display = 'flex';
                header1.style.justifyContent = 'space-between';
                header1.style.alignItems = 'center';
                header1.appendChild(btn1);
            }
        }
        
        if (revised2Parent) {
            var parent2 = revised2Parent.parentElement;
            var header2 = parent2.querySelector('.section-header, .panel-title, h3, h4');
            if (!header2) {
                var allDivs2 = parent2.querySelectorAll('div');
                for (var j = 0; j < allDivs2.length; j++) {
                    if (allDivs2[j].textContent.includes('최종 수정 반영') && !allDivs2[j].querySelector('button')) {
                        header2 = allDivs2[j];
                        break;
                    }
                }
            }
            if (header2 && !header2.querySelector('.btn-fullview')) {
                var btn2 = document.createElement('button');
                btn2.className = 'btn-fullview';
                btn2.innerHTML = '🔍 전체 보기';
                btn2.addEventListener('click', function() {
                    openFullViewModal('stage2');
                });
                header2.style.display = 'flex';
                header2.style.justifyContent = 'space-between';
                header2.style.alignItems = 'center';
                header2.appendChild(btn2);
            }
        }
    }, 500);
}

function ensureScoreSection() {
    if (document.getElementById('score-perfect-section')) return;
    
    var revisedStage2 = document.getElementById('revised-stage2');
    var insertTarget = null;
    
    if (revisedStage2) {
        insertTarget = revisedStage2.parentElement;
        while (insertTarget && !insertTarget.classList.contains('section') && !insertTarget.classList.contains('panel') && !insertTarget.classList.contains('card')) {
            if (insertTarget.parentElement && insertTarget.parentElement.tagName !== 'BODY' && insertTarget.parentElement.tagName !== 'MAIN') {
                insertTarget = insertTarget.parentElement;
            } else {
                break;
            }
        }
    }
    
    if (!insertTarget) {
        insertTarget = document.querySelector('.results-section') || 
                       document.querySelector('.analysis-results') || 
                       document.querySelector('main') ||
                       document.body;
    }
    
    var section = document.createElement('div');
    section.id = 'score-perfect-section';
    section.style.cssText = 'margin-top:30px;padding:20px;';
    
    section.innerHTML = 
        '<div class="score-perfect-container">' +
            '<div class="score-panel" id="score-panel">' +
                '<div class="panel-title">📊 품질 평가 점수</div>' +
                '<div id="score-content">' +
                    '<div class="waiting-message">2차 분석 완료 후 점수가 표시됩니다</div>' +
                '</div>' +
            '</div>' +
            '<div class="perfect-panel" id="perfect-panel">' +
                '<div class="panel-title">✨ 100점 수정 대본</div>' +
                '<div id="perfect-content">' +
                    '<div class="waiting-message">2차 분석 완료 후 수정 대본이 표시됩니다</div>' +
                '</div>' +
            '</div>' +
        '</div>';
    
    if (insertTarget && insertTarget !== document.body) {
        insertTarget.parentNode.insertBefore(section, insertTarget.nextSibling);
    } else {
        insertTarget.appendChild(section);
    }
    
    console.log('✅ 품질 평가 + 100점 수정 대본 박스 생성 완료');
}

function displayScoresAndPerfectScript(scores, perfectScript, improvement) {
    var scoreContent = document.getElementById('score-content');
    var perfectContent = document.getElementById('perfect-content');
    
    if (!scoreContent || !perfectContent) {
        ensureScoreSection();
        scoreContent = document.getElementById('score-content');
        perfectContent = document.getElementById('perfect-content');
    }
    
    if (scoreContent && scores) {
        var avg = Math.round((scores.senior + scores.fun + scores.flow + scores.retention) / 4);
        var passClass = avg >= 95 ? 'pass' : 'fail';
        
        var scoreHtml = 
            '<div class="score-item">' +
                '<span class="score-label">👴 시니어 적합도</span>' +
                '<span class="score-value ' + (scores.senior >= 95 ? 'pass' : 'fail') + '">' + scores.senior + '점</span>' +
            '</div>' +
            '<div class="score-item">' +
                '<span class="score-label">😄 재미요소</span>' +
                '<span class="score-value ' + (scores.fun >= 95 ? 'pass' : 'fail') + '">' + scores.fun + '점</span>' +
            '</div>' +
            '<div class="score-item">' +
                '<span class="score-label">📖 이야기 흐름</span>' +
                '<span class="score-value ' + (scores.flow >= 95 ? 'pass' : 'fail') + '">' + scores.flow + '점</span>' +
            '</div>' +
            '<div class="score-item">' +
                '<span class="score-label">🎯 시청자 이탈 방지</span>' +
                '<span class="score-value ' + (scores.retention >= 95 ? 'pass' : 'fail') + '">' + scores.retention + '점</span>' +
            '</div>' +
            '<div class="score-avg">' +
                '<div class="score-avg-label">평균 점수</div>' +
                '<div class="score-avg-value ' + passClass + '">' + avg + '점 ' + (avg >= 95 ? '✅ 합격' : '❌ 불합격') + '</div>' +
            '</div>';
        
        if (improvement) {
            scoreHtml += 
                '<div class="improvement-section">' +
                    '<div class="improvement-title">💡 개선 제안</div>' +
                    '<div class="improvement-content">' + improvement + '</div>' +
                '</div>';
        }
        
        scoreContent.innerHTML = scoreHtml;
    }
    
    if (perfectContent && perfectScript) {
        perfectContent.innerHTML = '<div class="perfect-script-content">' + escapeHtml(perfectScript) + '</div>';
    }
    
    state.scores = scores;
    state.perfectScript = perfectScript;
}

function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function initDarkMode() {
    var toggle = document.getElementById('dark-mode-toggle');
    if (toggle) {
        var isDark = localStorage.getItem('darkMode') !== 'false';
        document.body.classList.toggle('dark-mode', isDark);
        toggle.checked = isDark;
        toggle.addEventListener('change', function() {
            document.body.classList.toggle('dark-mode', this.checked);
            localStorage.setItem('darkMode', this.checked);
        });
    }
}

function initApiKeyPanel() {
    var apiKeyInput = document.getElementById('api-key');
    var saveBtn = document.getElementById('save-api-key');
    var statusEl = document.getElementById('api-key-status');
    
    if (apiKeyInput) {
        var savedKey = localStorage.getItem('geminiApiKey');
        if (savedKey) {
            apiKeyInput.value = savedKey;
            if (statusEl) statusEl.textContent = '✅ API 키 저장됨';
        }
    }
    
    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            var key = apiKeyInput.value.trim();
            if (key) {
                localStorage.setItem('geminiApiKey', key);
                if (statusEl) statusEl.textContent = '✅ API 키 저장됨';
            } else {
                localStorage.removeItem('geminiApiKey');
                if (statusEl) statusEl.textContent = '❌ API 키를 입력하세요';
            }
        });
    }
}

function initTextArea() {
    var textarea = document.getElementById('script-input');
    if (textarea) {
        textarea.addEventListener('input', function() {
            updateCharCount();
        });
    }
}

function updateCharCount() {
    var textarea = document.getElementById('script-input');
    var counter = document.getElementById('char-count');
    if (textarea && counter) {
        counter.textContent = textarea.value.length + '자';
    }
}

function initFileUpload() {
    var fileInput = document.getElementById('file-input');
    var uploadBtn = document.getElementById('upload-btn');
    
    if (uploadBtn && fileInput) {
        uploadBtn.addEventListener('click', function() {
            fileInput.click();
        });
        
        fileInput.addEventListener('change', function(e) {
            handleFileSelect(e.target.files);
        });
    }
}

function initDragAndDrop() {
    var dropZone = document.getElementById('script-input');
    if (dropZone) {
        dropZone.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('drag-over');
        });
        
        dropZone.addEventListener('dragleave', function() {
            this.classList.remove('drag-over');
        });
        
        dropZone.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('drag-over');
            handleFileSelect(e.dataTransfer.files);
        });
    }
}

function handleFileSelect(files) {
    if (files.length === 0) return;
    
    var file = files[0];
    var reader = new FileReader();
    
    reader.onload = function(e) {
        var textarea = document.getElementById('script-input');
        if (textarea) {
            textarea.value = e.target.result;
            updateCharCount();
        }
    };
    
    if (file.name.endsWith('.txt') || file.type === 'text/plain') {
        reader.readAsText(file, 'UTF-8');
    } else {
        alert('텍스트 파일(.txt)만 지원됩니다.');
    }
}

function initClearButton() {
    var clearBtn = document.getElementById('clear-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            var textarea = document.getElementById('script-input');
            if (textarea) {
                textarea.value = '';
                updateCharCount();
            }
            resetState();
        });
    }
}

function resetState() {
    state.stage1 = {
        originalScript: '',
        analysis: null,
        revisedScript: '',
        allErrors: [],
        fixedScript: '',
        currentErrorIndex: -1,
        isFixed: false
    };
    state.stage2 = {
        originalScript: '',
        analysis: null,
        revisedScript: '',
        allErrors: [],
        fixedScript: '',
        currentErrorIndex: -1,
        isFixed: false
    };
    state.finalScript = '';
    state.perfectScript = '';
    state.scores = null;
    
    var analysis1 = document.getElementById('analysis-stage1');
    var revised1 = document.getElementById('revised-stage1');
    var analysis2 = document.getElementById('analysis-stage2');
    var revised2 = document.getElementById('revised-stage2');
    
    if (analysis1) analysis1.innerHTML = '';
    if (revised1) revised1.innerHTML = '';
    if (analysis2) analysis2.innerHTML = '';
    if (revised2) revised2.innerHTML = '';
    
    var scoreContent = document.getElementById('score-content');
    var perfectContent = document.getElementById('perfect-content');
    if (scoreContent) scoreContent.innerHTML = '<div class="waiting-message">2차 분석 완료 후 점수가 표시됩니다</div>';
    if (perfectContent) perfectContent.innerHTML = '<div class="waiting-message">2차 분석 완료 후 수정 대본이 표시됩니다</div>';
}

function hideOriginalAnalysisButtons() {
    var originalBtns = document.querySelectorAll('.analyze-btn-original');
    originalBtns.forEach(function(btn) {
        btn.style.display = 'none';
    });
}

function initDownloadButton() {
    var downloadBtn = document.getElementById('download-btn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadScript);
    }
}

function downloadScript() {
    var content = state.finalScript || state.stage2.fixedScript || state.stage1.fixedScript || '';
    if (!content) {
        alert('다운로드할 대본이 없습니다.');
        return;
    }
    
    var blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = '수정된_대본_' + new Date().toISOString().slice(0,10) + '.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function initRevertButtons() {
    var revert1 = document.getElementById('revert-stage1');
    var revert2 = document.getElementById('revert-stage2');
    
    if (revert1) {
        revert1.addEventListener('click', function() {
            revertScript('stage1');
        });
    }
    
    if (revert2) {
        revert2.addEventListener('click', function() {
            revertScript('stage2');
        });
    }
}

function revertScript(stage) {
    var stateObj = state[stage];
    if (stateObj.originalScript) {
        var revisedBox = document.getElementById('revised-' + stage);
        if (revisedBox) {
            revisedBox.innerHTML = '<pre style="white-space:pre-wrap;word-break:break-word;">' + escapeHtml(stateObj.originalScript) + '</pre>';
        }
        stateObj.isFixed = false;
        stateObj.currentErrorIndex = -1;
    }
}

function initStage1AnalysisButton() {
    var btn = document.getElementById('analyze-stage1');
    if (btn) {
        btn.addEventListener('click', function() {
            runStage1Analysis();
        });
    }
}

function initStage2AnalysisButton() {
    var btn = document.getElementById('analyze-stage2');
    if (btn) {
        btn.addEventListener('click', function() {
            runStage2Analysis();
        });
    }
}

function initStopButton() {
    var btn = document.getElementById('stop-analysis');
    if (btn) {
        btn.addEventListener('click', function() {
            if (currentAbortController) {
                currentAbortController.abort();
                currentAbortController = null;
                setAnalyzing(false);
            }
        });
    }
}

function setAnalyzing(isAnalyzing) {
    var stage1Btn = document.getElementById('analyze-stage1');
    var stage2Btn = document.getElementById('analyze-stage2');
    var stopBtn = document.getElementById('stop-analysis');
    
    if (stage1Btn) stage1Btn.disabled = isAnalyzing;
    if (stage2Btn) stage2Btn.disabled = isAnalyzing;
    if (stopBtn) stopBtn.style.display = isAnalyzing ? 'inline-block' : 'none';
}

async function runStage1Analysis() {
    var textarea = document.getElementById('script-input');
    if (!textarea || !textarea.value.trim()) {
        alert('대본을 입력해주세요.');
        return;
    }
    
    var apiKey = localStorage.getItem('geminiApiKey');
    if (!apiKey) {
        alert('API 키를 먼저 저장해주세요.');
        return;
    }
    
    setAnalyzing(true);
    state.stage1.originalScript = textarea.value.trim();
    
    var analysisBox = document.getElementById('analysis-stage1');
    var revisedBox = document.getElementById('revised-stage1');
    
    if (analysisBox) analysisBox.innerHTML = '<div class="loading">1차 분석 중...</div>';
    if (revisedBox) revisedBox.innerHTML = '';
    
    try {
        currentAbortController = new AbortController();
        var result = await analyzeScript(state.stage1.originalScript, 'stage1', currentAbortController.signal);
        
        if (result) {
            state.stage1.analysis = result.errors || [];
            state.stage1.allErrors = result.errors || [];
            state.stage1.revisedScript = result.revisedScript || state.stage1.originalScript;
            
            displayAnalysisResult('stage1', state.stage1.analysis);
            displayRevisedScript('stage1', state.stage1.revisedScript, state.stage1.allErrors);
        }
    } catch (error) {
        if (error.name !== 'AbortError') {
            console.error('1차 분석 오류:', error);
            if (analysisBox) analysisBox.innerHTML = '<div class="error">분석 중 오류 발생: ' + error.message + '</div>';
        }
    } finally {
        setAnalyzing(false);
        currentAbortController = null;
    }
}

async function runStage2Analysis() {
    var sourceScript = state.stage1.fixedScript || state.stage1.revisedScript || state.stage1.originalScript;
    
    if (!sourceScript) {
        alert('1차 분석을 먼저 실행해주세요.');
        return;
    }
    
    var apiKey = localStorage.getItem('geminiApiKey');
    if (!apiKey) {
        alert('API 키를 먼저 저장해주세요.');
        return;
    }
    
    setAnalyzing(true);
    state.stage2.originalScript = sourceScript;
    
    var analysisBox = document.getElementById('analysis-stage2');
    var revisedBox = document.getElementById('revised-stage2');
    
    if (analysisBox) analysisBox.innerHTML = '<div class="loading">2차 분석 중...</div>';
    if (revisedBox) revisedBox.innerHTML = '';
    
    try {
        currentAbortController = new AbortController();
        var result = await analyzeScript(state.stage2.originalScript, 'stage2', currentAbortController.signal);
        
        if (result) {
            state.stage2.analysis = result.errors || [];
            state.stage2.allErrors = result.errors || [];
            state.stage2.revisedScript = result.revisedScript || state.stage2.originalScript;
            
            displayAnalysisResult('stage2', state.stage2.analysis);
            displayRevisedScript('stage2', state.stage2.revisedScript, state.stage2.allErrors);
            
            if (result.scores) {
                displayScoresAndPerfectScript(result.scores, result.perfectScript, result.improvement);
            }
        }
    } catch (error) {
        if (error.name !== 'AbortError') {
            console.error('2차 분석 오류:', error);
            if (analysisBox) analysisBox.innerHTML = '<div class="error">분석 중 오류 발생: ' + error.message + '</div>';
        }
    } finally {
        setAnalyzing(false);
        currentAbortController = null;
    }
}

async function analyzeScript(script, stage, signal) {
    var apiKey = localStorage.getItem('geminiApiKey');
    var url = API_CONFIG.ENDPOINT + '/' + API_CONFIG.MODEL + ':generateContent?key=' + apiKey;
    
    var historicalContext = buildHistoricalContext();
    
    var prompt = '';
    if (stage === 'stage1') {
        prompt = build1stStagePrompt(script, historicalContext);
    } else {
        prompt = build2ndStagePrompt(script, historicalContext);
    }
    
    var requestBody = {
        contents: [{
            parts: [{
                text: prompt
            }]
        }],
        generationConfig: {
            temperature: 0.3,
            maxOutputTokens: API_CONFIG.MAX_OUTPUT_TOKENS
        }
    };
    
    var response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: signal
    }, API_CONFIG.TIMEOUT);
    
    if (!response.ok) {
        var errorText = await response.text();
        throw new Error('API 오류: ' + response.status + ' - ' + errorText);
    }
    
    var data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        var text = data.candidates[0].content.parts[0].text;
        return parseAnalysisResponse(text, stage);
    }
    
    throw new Error('응답 파싱 실패');
}

async function fetchWithTimeout(url, options, timeout) {
    var controller = new AbortController();
    var id = setTimeout(function() { controller.abort(); }, timeout);
    
    var mergedSignal = options.signal;
    
    try {
        var response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        if (mergedSignal && mergedSignal.aborted) {
            throw new DOMException('Aborted', 'AbortError');
        }
        throw error;
    }
}

function buildHistoricalContext() {
    var context = '시대고증 규칙:\n';
    for (var category in HISTORICAL_RULES) {
        var rules = HISTORICAL_RULES[category];
        for (var i = 0; i < rules.length; i++) {
            var rule = rules[i];
            context += '- ' + rule.modern + ' → ' + rule.historical.join('/') + ' (' + rule.reason + ')\n';
        }
    }
    return context;
}

function build1stStagePrompt(script, historicalContext) {
    return '당신은 사극 대본 전문 검수자입니다.\n\n' +
        historicalContext + '\n\n' +
        '다음 대본을 분석하여 시대착오적 표현과 오류를 찾아주세요.\n\n' +
        '분석 항목:\n' +
        '1. 시대착오 - 현대적 용어/물건이 사용된 경우\n' +
        '2. 인물설정 - 인물의 신분/지위에 맞지 않는 표현\n' +
        '3. 역사적사실 - 역사적 사실과 다른 내용\n\n' +
        '응답 형식 (JSON):\n' +
        '```json\n' +
        '{\n' +
        '  "errors": [\n' +
        '    {\n' +
        '      "type": "오류유형",\n' +
        '      "original": "원문",\n' +
        '      "suggestion": "수정제안",\n' +
        '      "reason": "수정이유"\n' +
        '    }\n' +
        '  ],\n' +
        '  "revisedScript": "수정된 전체 대본"\n' +
        '}\n' +
        '```\n\n' +
        '대본:\n' + script;
}

function build2ndStagePrompt(script, historicalContext) {
    return '당신은 사극 대본 전문 검수자입니다.\n\n' +
        historicalContext + '\n\n' +
        '다음 대본을 분석하여 이야기 흐름, 캐릭터 일관성, 대사 자연스러움 등을 검토해주세요.\n\n' +
        '분석 항목:\n' +
        '1. 이야기흐름 - 스토리 전개의 자연스러움\n' +
        '2. 캐릭터일관성 - 인물의 성격/말투 일관성\n' +
        '3. 장면연결성 - 장면 간 연결의 매끄러움\n' +
        '4. 쌩뚱맞은표현 - 맥락에 맞지 않는 표현\n' +
        '5. 시간왜곡 - 시간 순서의 오류\n\n' +
        '또한 다음 4가지 항목에 대해 100점 만점으로 점수를 매겨주세요:\n' +
        '- 시니어적합도: 60대 이상 시청자가 이해하기 쉬운가\n' +
        '- 재미요소: 흥미롭고 몰입되는가\n' +
        '- 이야기흐름: 스토리가 자연스럽게 전개되는가\n' +
        '- 시청자이탈방지: 지루하지 않고 계속 보고 싶은가\n\n' +
        '평균 95점 이상이면 합격입니다.\n\n' +
        '응답 형식 (JSON):\n' +
        '```json\n' +
        '{\n' +
        '  "errors": [\n' +
        '    {\n' +
        '      "type": "오류유형",\n' +
        '      "original": "원문",\n' +
        '      "suggestion": "수정제안",\n' +
        '      "reason": "수정이유"\n' +
        '    }\n' +
        '  ],\n' +
        '  "revisedScript": "수정된 전체 대본",\n' +
        '  "scores": {\n' +
        '    "senior": 점수,\n' +
        '    "fun": 점수,\n' +
        '    "flow": 점수,\n' +
        '    "retention": 점수\n' +
        '  },\n' +
        '  "improvement": "개선 제안 내용",\n' +
        '  "perfectScript": "100점 기준으로 완벽하게 수정된 대본"\n' +
        '}\n' +
        '```\n\n' +
        '대본:\n' + script;
}

function parseAnalysisResponse(text, stage) {
    try {
        var jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
            var jsonStr = jsonMatch[1];
            var result = JSON.parse(jsonStr);
            
            if (result.errors) {
                result.errors = result.errors.map(function(err, idx) {
                    return {
                        ...err,
                        id: stage + '-error-' + idx,
                        isRevised: true
                    };
                });
            }
            
            return result;
        }
        
        var directParse = JSON.parse(text);
        return directParse;
    } catch (e) {
        console.error('JSON 파싱 오류:', e);
        return {
            errors: [],
            revisedScript: text
        };
    }
}

function displayAnalysisResult(stage, errors) {
    var analysisBox = document.getElementById('analysis-' + stage);
    if (!analysisBox) return;
    
    if (!errors || errors.length === 0) {
        analysisBox.innerHTML = '<div class="no-errors">발견된 오류가 없습니다. ✅</div>';
        return;
    }
    
    var html = '<table class="analysis-table">' +
        '<thead><tr>' +
        '<th>유형</th>' +
        '<th>원문</th>' +
        '<th>수정제안</th>' +
        '<th>사유</th>' +
        '</tr></thead><tbody>';
    
    for (var i = 0; i < errors.length; i++) {
        var err = errors[i];
        var markerId = err.id || (stage + '-error-' + i);
        html += '<tr data-marker-id="' + markerId + '" style="cursor:pointer;">' +
            '<td class="type-cell">' + formatTypeText(err.type) + '</td>' +
            '<td>' + escapeHtml(err.original) + '</td>' +
            '<td>' + escapeHtml(err.suggestion) + '</td>' +
            '<td>' + escapeHtml(err.reason) + '</td>' +
            '</tr>';
    }
    
    html += '</tbody></table>';
    analysisBox.innerHTML = html;
    
    analysisBox.querySelectorAll('tr[data-marker-id]').forEach(function(row) {
        row.addEventListener('click', function() {
            var markerId = this.getAttribute('data-marker-id');
            var errorIndex = findErrorIndexById(stage, markerId);
            if (errorIndex >= 0) {
                setCurrentError(stage, errorIndex);
                scrollToMarker(stage, markerId);
            }
        });
    });
}

function displayRevisedScript(stage, script, errors) {
    var revisedBox = document.getElementById('revised-' + stage);
    if (!revisedBox) return;
    
    var markedScript = script;
    
    if (errors && errors.length > 0) {
        for (var i = errors.length - 1; i >= 0; i--) {
            var err = errors[i];
            var markerId = err.id || (stage + '-error-' + i);
            
            if (err.isRevised && err.suggestion) {
                var marker = '<span class="correction-marker marker-revised" data-marker-id="' + markerId + '" data-original="' + escapeAttr(err.original) + '" data-suggestion="' + escapeAttr(err.suggestion) + '">' + escapeHtml(err.suggestion) + '</span>';
                markedScript = markedScript.split(err.suggestion).join(marker);
            }
        }
    }
    
    revisedBox.innerHTML = '<div style="white-space:pre-wrap;word-break:break-word;line-height:1.8;">' + markedScript + '</div>';
    
    revisedBox.querySelectorAll('.correction-marker').forEach(function(marker) {
        marker.addEventListener('click', function() {
            var markerId = this.getAttribute('data-marker-id');
            var errorIndex = findErrorIndexById(stage, markerId);
            if (errorIndex >= 0) {
                toggleMarker(this, stage, errorIndex);
            }
        });
    });
}

function escapeAttr(text) {
    if (!text) return '';
    return text.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function findErrorIndexById(stage, markerId) {
    var errors = state[stage].allErrors;
    for (var i = 0; i < errors.length; i++) {
        if (errors[i].id === markerId) {
            return i;
        }
    }
    return -1;
}

function setCurrentError(stage, index) {
    state[stage].currentErrorIndex = index;
}

function toggleMarker(markerEl, stage, errorIndex) {
    var err = state[stage].allErrors[errorIndex];
    if (!err) return;
    
    var isCurrentlyRevised = markerEl.classList.contains('marker-revised');
    
    if (isCurrentlyRevised) {
        markerEl.textContent = err.original;
        markerEl.classList.remove('marker-revised');
        markerEl.classList.add('marker-original');
        err.isRevised = false;
    } else {
        markerEl.textContent = err.suggestion;
        markerEl.classList.remove('marker-original');
        markerEl.classList.add('marker-revised');
        err.isRevised = true;
    }
}

function toggleCurrentError(stage, toRevised) {
    var index = state[stage].currentErrorIndex;
    if (index < 0) return;
    
    var err = state[stage].allErrors[index];
    if (!err) return;
    
    err.isRevised = toRevised;
    
    var revisedBox = document.getElementById('revised-' + stage);
    if (revisedBox) {
        var marker = revisedBox.querySelector('.correction-marker[data-marker-id="' + err.id + '"]');
        if (marker) {
            if (toRevised) {
                marker.textContent = err.suggestion;
                marker.classList.remove('marker-original');
                marker.classList.add('marker-revised');
            } else {
                marker.textContent = err.original;
                marker.classList.remove('marker-revised');
                marker.classList.add('marker-original');
            }
        }
    }
}

function scrollToMarker(stage, markerId) {
    var revisedBox = document.getElementById('revised-' + stage);
    if (!revisedBox) return;
    
    var marker = revisedBox.querySelector('.correction-marker[data-marker-id="' + markerId + '"]');
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

function fixScript(stage) {
    var stateObj = state[stage];
    var revisedBox = document.getElementById('revised-' + stage);
    
    if (!revisedBox) return;
    
    var content = revisedBox.innerText || revisedBox.textContent;
    stateObj.fixedScript = content;
    stateObj.isFixed = true;
    
    if (stage === 'stage2') {
        state.finalScript = content;
    }
    
    alert((stage === 'stage1' ? '1차' : '2차') + ' 대본이 픽스되었습니다.');
}
