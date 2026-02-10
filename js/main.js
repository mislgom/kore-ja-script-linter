/**
 * MISLGOM 대본 검수 자동 프로그램
 * main.js v4.52 - Vertex AI API 키 + Gemini 2.5 Flash
 * - v4.52: 최종 수정 반영 칸 표시 문제 완전 해결
 * - v4.51: 나레이션 조선어투 허용 강화
 * - v4.50: 클릭 이동/버튼 수정
 * - v4.49: 100점 수정 대본 개선 (구체적 프롬프트 + 녹색 하이라이트)
 * - v4.48: 대본 비교하기 기능 추가
 * - ENDPOINT: generativelanguage.googleapis.com
 * - TIMEOUT: 300000 ms
 * - MAX_OUTPUT_TOKENS: 16384
 */

console.log('🚀 main.js v4.52 로드됨');
console.log('📌 v4.52: 최종 수정 반영 칸 표시 문제 완전 해결');

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
    expressions: [
        { modern: '구독', historical: ['없음'], confidence: '높음', reason: '현대 인터넷 용어' },
        { modern: '좋아요', historical: ['없음'], confidence: '높음', reason: '현대 인터넷 용어' },
        { modern: '알림설정', historical: ['없음'], confidence: '높음', reason: '현대 인터넷 용어' },
        { modern: '댓글', historical: ['없음'], confidence: '높음', reason: '현대 인터넷 용어' },
        { modern: '공유', historical: ['없음'], confidence: '높음', reason: '현대 인터넷 용어' },
        { modern: '고맙습니다', historical: ['고맙소', '감사하오'], confidence: '높음', reason: '현대식 표현' },
        { modern: '감사합니다', historical: ['감사하오', '고맙소'], confidence: '높음', reason: '현대식 표현' },
        { modern: '안녕하세요', historical: ['안녕하시오', '평안하시오'], confidence: '높음', reason: '현대식 인사' }
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
    console.log('✅ main.js v4.52 초기화 완료');
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
        '.row-selected{background:#3a3a3a !important;outline:2px solid #69f0ae;}' +
        '.revised-content{white-space:pre-wrap;word-break:break-word;line-height:1.8;color:#fff;padding:10px;}' +
        '.revised-marker{background:#69f0ae;color:#000;padding:2px 6px;border-radius:3px;font-weight:bold;cursor:pointer;margin:0 2px;}' +
        '.revised-marker:hover{background:#4caf50;}';
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
        
        if (s1.trim() !== s2.trim() && s1.trim() && s2.trim()) {
            differences.push({
                index: i,
                original: s1.trim(),
                modified: s2.trim()
            });
        }
    }
    
    return differences;
}

function scrollToDiff(idx) {
    var leftMarker = document.querySelector('[data-diff-id="diff-left-' + idx + '"]');
    var rightMarker = document.querySelector('[data-diff-id="diff-right-' + idx + '"]');
    
    if (leftMarker) {
        leftMarker.scrollIntoView({ behavior: 'smooth', block: 'center' });
        leftMarker.classList.add('highlight-active');
        setTimeout(function() { leftMarker.classList.remove('highlight-active'); }, 2000);
    }
    
    if (rightMarker) {
        rightMarker.scrollIntoView({ behavior: 'smooth', block: 'center' });
        rightMarker.classList.add('highlight-active');
        setTimeout(function() { rightMarker.classList.remove('highlight-active'); }, 2000);
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

function openFullViewModal(stage, type) {
    var modal = document.getElementById('fullview-modal');
    if (!modal) return;
    
    var leftHeader = document.getElementById('fullview-left-header');
    var leftBody = document.getElementById('fullview-left-body');
    var rightHeader = document.getElementById('fullview-right-header');
    var rightBody = document.getElementById('fullview-right-body');
    var footer = document.getElementById('fullview-footer');
    
    var stageData = stage === 1 ? state.stage1 : state.stage2;
    var stageLabel = stage === 1 ? '1차' : '2차';
    
    leftHeader.textContent = stageLabel + ' 분석 결과';
    rightHeader.textContent = stageLabel + ' 수정 반영';
    
    // 분석 결과 테이블 생성
    if (stageData.allErrors && stageData.allErrors.length > 0) {
        var tableHtml = '<table class="analysis-table">' +
            '<thead><tr><th>유형</th><th>원문</th><th>수정</th><th>사유</th></tr></thead><tbody>';
        
        stageData.allErrors.forEach(function(error, idx) {
            tableHtml += '<tr data-error-index="' + idx + '" class="analysis-row" style="cursor:pointer;">' +
                '<td class="type-cell">' + formatTypeText(error.type || '기타') + '</td>' +
                '<td style="color:#ff6b6b;">' + escapeHtml(error.original || '') + '</td>' +
                '<td style="color:#69f0ae;">' + escapeHtml(error.revised || '') + '</td>' +
                '<td>' + escapeHtml(error.reason || '') + '</td>' +
                '</tr>';
        });
        
        tableHtml += '</tbody></table>';
        leftBody.innerHTML = tableHtml;
        
        // 분석 결과 행 클릭 이벤트
        leftBody.querySelectorAll('.analysis-row').forEach(function(row) {
            row.addEventListener('click', function() {
                var errorIndex = parseInt(this.getAttribute('data-error-index'));
                highlightErrorInRevised(stage, errorIndex);
                
                leftBody.querySelectorAll('.analysis-row').forEach(function(r) {
                    r.classList.remove('row-selected');
                });
                this.classList.add('row-selected');
            });
        });
    } else {
        leftBody.innerHTML = '<div style="text-align:center;color:#888;padding:50px;">분석 결과가 없습니다.</div>';
    }
    
    // 수정 반영 대본 표시
    displayRevisedScriptInModal(stage, rightBody);
    
    // 버튼 생성
    footer.innerHTML = '';
    
    var btnPrev = document.createElement('button');
    btnPrev.textContent = '◀ 이전 수정';
    btnPrev.className = 'btn-fullview';
    btnPrev.style.background = '#ff9800';
    btnPrev.addEventListener('click', function() { navigateError(stage, -1); });
    
    var btnNext = document.createElement('button');
    btnNext.textContent = '다음 수정 ▶';
    btnNext.className = 'btn-fullview';
    btnNext.style.background = '#4caf50';
    btnNext.addEventListener('click', function() { navigateError(stage, 1); });
    
    var btnApplyAll = document.createElement('button');
    btnApplyAll.textContent = '✅ 전체 수정 적용';
    btnApplyAll.className = 'btn-fullview';
    btnApplyAll.style.background = '#2196f3';
    btnApplyAll.addEventListener('click', function() { applyAllRevisions(stage); });
    
    footer.appendChild(btnPrev);
    footer.appendChild(btnNext);
    footer.appendChild(btnApplyAll);
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function displayRevisedScriptInModal(stage, container) {
    var stageData = stage === 1 ? state.stage1 : state.stage2;
    var script = stageData.fixedScript || stageData.originalScript || '';
    var errors = stageData.allErrors || [];
    
    if (!script) {
        container.innerHTML = '<div style="text-align:center;color:#888;padding:50px;">수정된 대본이 없습니다.</div>';
        return;
    }
    
    var html = escapeHtml(script);
    
    // 수정된 부분에 마커 추가
    errors.forEach(function(error, idx) {
        if (error.revised && error.revised.trim()) {
            var revisedText = cleanRevisedText(error.revised);
            var escapedRevised = escapeHtml(revisedText);
            var marker = '<span class="revised-marker" data-error-index="' + idx + '" title="' + escapeHtml(error.reason || '') + '">' + escapedRevised + '</span>';
            html = html.replace(escapedRevised, marker);
        }
    });
    
    container.innerHTML = '<div class="revised-content">' + html + '</div>';
    
    // 마커 클릭 이벤트
    container.querySelectorAll('.revised-marker').forEach(function(marker) {
        marker.addEventListener('click', function() {
            var errorIndex = parseInt(this.getAttribute('data-error-index'));
            var leftBody = document.getElementById('fullview-left-body');
            var targetRow = leftBody.querySelector('[data-error-index="' + errorIndex + '"]');
            if (targetRow) {
                leftBody.querySelectorAll('.analysis-row').forEach(function(r) {
                    r.classList.remove('row-selected');
                });
                targetRow.classList.add('row-selected');
                targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
    });
}

function highlightErrorInRevised(stage, errorIndex) {
    var rightBody = document.getElementById('fullview-right-body');
    var marker = rightBody.querySelector('[data-error-index="' + errorIndex + '"]');
    
    if (marker) {
        marker.scrollIntoView({ behavior: 'smooth', block: 'center' });
        marker.classList.add('highlight-active');
        setTimeout(function() { marker.classList.remove('highlight-active'); }, 2000);
    }
}

function navigateError(stage, direction) {
    var stageData = stage === 1 ? state.stage1 : state.stage2;
    var errors = stageData.allErrors || [];
    
    if (errors.length === 0) return;
    
    stageData.currentErrorIndex += direction;
    
    if (stageData.currentErrorIndex < 0) {
        stageData.currentErrorIndex = errors.length - 1;
    } else if (stageData.currentErrorIndex >= errors.length) {
        stageData.currentErrorIndex = 0;
    }
    
    var leftBody = document.getElementById('fullview-left-body');
    var targetRow = leftBody.querySelector('[data-error-index="' + stageData.currentErrorIndex + '"]');
    
    if (targetRow) {
        leftBody.querySelectorAll('.analysis-row').forEach(function(r) {
            r.classList.remove('row-selected');
        });
        targetRow.classList.add('row-selected');
        targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        highlightErrorInRevised(stage, stageData.currentErrorIndex);
    }
}

function applyAllRevisions(stage) {
    var stageData = stage === 1 ? state.stage1 : state.stage2;
    
    if (stageData.fixedScript) {
        alert('✅ 전체 수정이 이미 적용되었습니다.');
    } else {
        applyRevisionsToScript(stage);
        displayRevisedScriptInModal(stage, document.getElementById('fullview-right-body'));
        alert('✅ 전체 수정이 적용되었습니다.');
    }
}

function addFullViewButtonsToHeaders() {
    var sections = [
        { id: 'analysis-stage1', stage: 1, type: 'analysis' },
        { id: 'revised-stage1', stage: 1, type: 'revised' },
        { id: 'analysis-stage2', stage: 2, type: 'analysis' },
        { id: 'revised-stage2', stage: 2, type: 'revised' }
    ];
    
    sections.forEach(function(section) {
        var element = document.getElementById(section.id);
        if (element) {
            var header = element.querySelector('h3') || element.querySelector('.section-header');
            if (header && !header.querySelector('.btn-fullview')) {
                var btn = document.createElement('button');
                btn.className = 'btn-fullview';
                btn.textContent = '전체보기';
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    openFullViewModal(section.stage, section.type);
                });
                header.appendChild(btn);
            }
        }
    });
}

function initDarkMode() {
    var btn = document.getElementById('btn-dark-mode');
    if (!btn) return;
    
    var isDark = localStorage.getItem('darkMode') !== 'false';
    document.body.classList.toggle('dark-mode', isDark);
    updateDarkModeButton(btn, isDark);
    
    btn.addEventListener('click', function() {
        var isDark = document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', isDark);
        updateDarkModeButton(btn, isDark);
    });
}

function updateDarkModeButton(btn, isDark) {
    btn.innerHTML = isDark ? '☀️ 라이트 모드' : '🌙 다크 모드';
}

function initApiKeyPanel() {
    var btnSettings = document.getElementById('btn-api-settings');
    var panel = document.getElementById('api-key-panel');
    var input = document.getElementById('api-key-input');
    var btnSave = document.getElementById('btn-save-api-key');
    var btnClose = document.getElementById('btn-close-api-panel');
    
    if (!btnSettings || !panel || !input || !btnSave) {
        console.warn('API 키 패널 요소를 찾을 수 없습니다.');
        return;
    }
    
    var savedKey = localStorage.getItem('GEMINI_API_KEY') || '';
    input.value = savedKey;
    
    btnSettings.addEventListener('click', function() {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    });
    
    btnSave.addEventListener('click', function() {
        var key = input.value.trim();
        if (key) {
            localStorage.setItem('GEMINI_API_KEY', key);
            alert('API 키가 저장되었습니다.');
            panel.style.display = 'none';
        } else {
            alert('API 키를 입력해주세요.');
        }
    });
    
    if (btnClose) {
        btnClose.addEventListener('click', function() {
            panel.style.display = 'none';
        });
    }
}

function initTextArea() {
    var textarea = document.getElementById('original-script');
    var charCount = document.getElementById('char-count');
    
    if (!textarea) return;
    
    textarea.addEventListener('input', function() {
        if (charCount) {
            charCount.textContent = textarea.value.length + '자';
        }
        state.stage1.originalScript = textarea.value;
    });
}

function initFileUpload() {
    var fileInput = document.getElementById('file-input');
    var fileNameDisplay = document.getElementById('file-name-display');
    
    if (!fileInput) return;
    
    fileInput.addEventListener('change', function(e) {
        var file = e.target.files[0];
        if (file) {
            if (fileNameDisplay) {
                fileNameDisplay.textContent = file.name;
            }
            readFile(file);
        }
    });
}

function readFile(file) {
    var reader = new FileReader();
    
    reader.onload = function(e) {
        var content = e.target.result;
        var textarea = document.getElementById('original-script');
        
        if (textarea) {
            textarea.value = content;
            textarea.dispatchEvent(new Event('input'));
        }
    };
    
    reader.onerror = function() {
        alert('파일을 읽는 중 오류가 발생했습니다.');
    };
    
    if (file.name.endsWith('.txt') || file.type === 'text/plain') {
        reader.readAsText(file, 'UTF-8');
    } else {
        alert('텍스트 파일(.txt)만 지원합니다.');
    }
}

function initDragAndDrop() {
    var dropZone = document.getElementById('drop-zone');
    
    if (!dropZone) return;
    
    dropZone.addEventListener('dragover', function(e) {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });
    
    dropZone.addEventListener('dragleave', function() {
        dropZone.classList.remove('drag-over');
    });
    
    dropZone.addEventListener('drop', function(e) {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        
        var file = e.dataTransfer.files[0];
        if (file) {
            var fileNameDisplay = document.getElementById('file-name-display');
            if (fileNameDisplay) {
                fileNameDisplay.textContent = file.name;
            }
            readFile(file);
        }
    });
}

function initClearButton() {
    var btn = document.getElementById('btn-clear-script');
    
    if (!btn) return;
    
    btn.addEventListener('click', function() {
        var textarea = document.getElementById('original-script');
        var fileNameDisplay = document.getElementById('file-name-display');
        var charCount = document.getElementById('char-count');
        
        if (textarea) {
            textarea.value = '';
        }
        if (fileNameDisplay) {
            fileNameDisplay.textContent = '';
        }
        if (charCount) {
            charCount.textContent = '0자';
        }
        
        resetState();
        clearAllDisplays();
    });
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
    state.changePoints = [];
    state.scores = null;
}

function clearAllDisplays() {
    var ids = ['analysis-stage1', 'revised-stage1', 'analysis-stage2', 'revised-stage2'];
    
    ids.forEach(function(id) {
        var element = document.getElementById(id);
        if (element) {
            var content = element.querySelector('.analysis-content') || element.querySelector('.revised-content') || element.querySelector('.content');
            if (content) {
                content.innerHTML = '<div style="text-align:center;color:#888;padding:20px;">분석 대기 중...</div>';
            }
        }
    });
    
    var scoreDisplay = document.getElementById('score-display');
    if (scoreDisplay) {
        scoreDisplay.innerHTML = '<div style="text-align:center;color:#888;padding:50px;">분석 완료 후 점수가 표시됩니다.</div>';
    }
}

function hideOriginalAnalysisButtons() {
    var btns = document.querySelectorAll('[id^="btn-original-"]');
    btns.forEach(function(btn) {
        btn.style.display = 'none';
    });
}

function initDownloadButton() {
    var btn = document.getElementById('btn-download');
    
    if (!btn) return;
    
    btn.addEventListener('click', function() {
        downloadScript();
    });
}

function downloadScript() {
    var script = state.perfectScript || state.stage2.fixedScript || state.stage1.fixedScript || state.stage1.originalScript;
    
    if (!script) {
        alert('다운로드할 대본이 없습니다.');
        return;
    }
    
    var blob = new Blob([script], { type: 'text/plain;charset=utf-8' });
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
    var btn1 = document.getElementById('btn-revert-stage1');
    var btn2 = document.getElementById('btn-revert-stage2');
    
    if (btn1) {
        btn1.addEventListener('click', function() {
            revertStage(1);
        });
    }
    
    if (btn2) {
        btn2.addEventListener('click', function() {
            revertStage(2);
        });
    }
}

function revertStage(stage) {
    var stageData = stage === 1 ? state.stage1 : state.stage2;
    stageData.fixedScript = '';
    stageData.isFixed = false;
    
    var revisedId = stage === 1 ? 'revised-stage1' : 'revised-stage2';
    displayRevisedScript(stage, revisedId);
    
    alert(stage + '차 수정이 되돌려졌습니다.');
}

function initStage1AnalysisButton() {
    var btn = document.getElementById('btn-stage1-analysis') || document.querySelector('[data-action="stage1-analysis"]');
    
    if (!btn) {
        var analysisSection = document.querySelector('.analysis-section') || document.querySelector('.btn-section');
        if (analysisSection) {
            btn = analysisSection.querySelector('button');
        }
    }
    
    if (btn) {
        btn.addEventListener('click', function() {
            startStage1Analysis();
        });
    }
}

function initStage2AnalysisButton() {
    var btn = document.getElementById('btn-stage2-analysis') || document.querySelector('[data-action="stage2-analysis"]');
    
    if (btn) {
        btn.addEventListener('click', function() {
            startStage2Analysis();
        });
    }
}

function initStopButton() {
    var btn = document.getElementById('btn-stop-analysis');
    
    if (btn) {
        btn.addEventListener('click', function() {
            stopAnalysis();
        });
    }
}

function stopAnalysis() {
    if (currentAbortController) {
        currentAbortController.abort();
        currentAbortController = null;
    }
    hideProgress();
    alert('분석이 중지되었습니다.');
}

function ensureScoreSection() {
    var scoreDisplay = document.getElementById('score-display');
    if (!scoreDisplay) {
        var main = document.querySelector('main') || document.body;
        var section = document.createElement('section');
        section.id = 'score-section';
        section.innerHTML = '<h2>📊 대본 분석 점수</h2><div id="score-display"><div style="text-align:center;color:#888;padding:50px;">분석 완료 후 점수가 표시됩니다.</div></div>';
        main.appendChild(section);
    }
}

function showProgress(text) {
    var container = document.getElementById('progress-container');
    var progressText = document.getElementById('progress-text');
    var progressBar = document.getElementById('progress-bar');
    
    if (container) {
        container.style.display = 'block';
    }
    if (progressText) {
        progressText.textContent = text || '분석 중...';
    }
    if (progressBar) {
        progressBar.style.width = '0%';
    }
}

function updateProgress(percent, text) {
    var progressText = document.getElementById('progress-text');
    var progressBar = document.getElementById('progress-bar');
    
    if (progressText && text) {
        progressText.textContent = text;
    }
    if (progressBar) {
        progressBar.style.width = percent + '%';
    }
}

function hideProgress() {
    var container = document.getElementById('progress-container');
    if (container) {
        container.style.display = 'none';
    }
}

function getApiKey() {
    return localStorage.getItem('GEMINI_API_KEY') || '';
}

async function startStage1Analysis() {
    var script = document.getElementById('original-script');
    if (!script || !script.value.trim()) {
        alert('대본을 입력해주세요.');
        return;
    }
    
    var apiKey = getApiKey();
    if (!apiKey) {
        alert('API 키를 먼저 설정해주세요.');
        return;
    }
    
    state.stage1.originalScript = script.value.trim();
    
    showProgress('1차 분석 시작...');
    updateProgress(10, '1차 분석 중... (시대착오/인물설정/시간왜곡 검사)');
    
    try {
        currentAbortController = new AbortController();
        
        var prompt = buildStage1Prompt(state.stage1.originalScript);
        var response = await callGeminiAPI(prompt, apiKey);
        var parsed = parseApiResponse(response);
        
        state.stage1.analysis = parsed;
        state.stage1.allErrors = parsed.errors || [];
        
        updateProgress(50, '1차 분석 완료. 결과 표시 중...');
        
        displayAnalysisResult(1, 'analysis-stage1', parsed);
        
        // ★★★ 핵심 수정: 수정 적용 및 표시 ★★★
        applyRevisionsToScript(1);
        displayRevisedScript(1, 'revised-stage1');
        
        updateProgress(100, '1차 분석 완료!');
        
        setTimeout(function() {
            hideProgress();
        }, 1000);
        
        console.log('✅ 1차 분석 완료: ' + state.stage1.allErrors.length + '개 오류 발견');
        
    } catch (error) {
        hideProgress();
        if (error.name === 'AbortError') {
            console.log('1차 분석이 중지되었습니다.');
        } else {
            console.error('1차 분석 오류:', error);
            alert('1차 분석 중 오류가 발생했습니다.\n' + error.message);
        }
    }
}

async function startStage2Analysis() {
    var script = state.stage1.fixedScript || state.stage1.originalScript;
    
    if (!script) {
        alert('1차 분석을 먼저 진행해주세요.');
        return;
    }
    
    var apiKey = getApiKey();
    if (!apiKey) {
        alert('API 키를 먼저 설정해주세요.');
        return;
    }
    
    state.stage2.originalScript = script;
    
    showProgress('2차 분석 시작...');
    updateProgress(10, '2차 분석 중... (이야기흐름/캐릭터일관성/감정선 검사)');
    
    try {
        currentAbortController = new AbortController();
        
        var prompt = buildStage2Prompt(state.stage2.originalScript);
        var response = await callGeminiAPI(prompt, apiKey);
        var parsed = parseApiResponse(response);
        
        state.stage2.analysis = parsed;
        state.stage2.allErrors = parsed.errors || [];
        state.scores = parsed.scores || null;
        state.perfectScript = parsed.perfectScript || '';
        state.changePoints = parsed.changePoints || [];
        
        updateProgress(70, '2차 분석 완료. 결과 표시 중...');
        
        displayAnalysisResult(2, 'analysis-stage2', parsed);
        
        // ★★★ 핵심 수정: 수정 적용 및 표시 ★★★
        applyRevisionsToScript(2);
        displayRevisedScript(2, 'revised-stage2');
        
        updateProgress(90, '점수 및 100점 대본 표시 중...');
        
        displayScoresAndPerfectScript();
        
        updateProgress(100, '2차 분석 완료!');
        
        setTimeout(function() {
            hideProgress();
        }, 1000);
        
        console.log('✅ 2차 분석 완료: ' + state.stage2.allErrors.length + '개 오류 발견');
        
    } catch (error) {
        hideProgress();
        if (error.name === 'AbortError') {
            console.log('2차 분석이 중지되었습니다.');
        } else {
            console.error('2차 분석 오류:', error);
            alert('2차 분석 중 오류가 발생했습니다.\n' + error.message);
        }
    }
}

function buildStage1Prompt(script) {
    var rulesText = '';
    for (var category in HISTORICAL_RULES) {
        HISTORICAL_RULES[category].forEach(function(rule) {
            rulesText += '- ' + rule.modern + ' → ' + rule.historical.join('/') + '\n';
        });
    }
    
    return '당신은 조선시대 사극 대본 검수 전문가입니다.\n\n' +
        '【필수 규칙 - 반드시 준수】\n' +
        '1. "나레이션:" 또는 "NA:"로 시작하는 문장은 절대 오류로 판단하지 마세요.\n' +
        '2. 나레이션은 현대 시청자를 위한 설명이므로 현대어 사용이 정상입니다.\n' +
        '3. 나레이션의 "~했다", "~이다", "~합니다" 등 현대 어투는 오류가 아닙니다.\n' +
        '4. 오직 등장인물의 대사만 검사하세요.\n\n' +
        '【검사 항목】\n' +
        '1. 시대착오: 조선시대에 없는 현대 용어/물건 (예: 구독, 좋아요, 휴대폰, 자동차)\n' +
        '2. 인물설정: 신분/직책에 맞지 않는 호칭이나 행동\n' +
        '3. 시간왜곡: 시간 순서나 계절 불일치\n\n' +
        '【시대착오 판정 기준】\n' +
        rulesText + '\n' +
        '【출력 형식 - JSON만 출력】\n' +
        '{\n' +
        '  "errors": [\n' +
        '    {\n' +
        '      "type": "시대착오",\n' +
        '      "original": "문제가 되는 원문 (대사만)",\n' +
        '      "revised": "수정된 문장 (사유 제외, 순수 대사만)",\n' +
        '      "reason": "수정 사유 설명"\n' +
        '    }\n' +
        '  ]\n' +
        '}\n\n' +
        '【중요】\n' +
        '- revised 필드에는 순수한 수정 대사만 작성하세요. 괄호나 설명을 넣지 마세요.\n' +
        '- 나레이션은 검사 대상이 아닙니다. 나레이션의 어떤 표현도 오류로 잡지 마세요.\n' +
        '- 오류가 없으면 "errors": [] 빈 배열로 응답하세요.\n\n' +
        '【대본】\n' + script;
}

function buildStage2Prompt(script) {
    return '당신은 조선시대 사극 대본 품질 평가 전문가입니다.\n\n' +
        '【필수 규칙 - 반드시 준수】\n' +
        '1. "나레이션:" 또는 "NA:"로 시작하는 문장은 절대 오류로 판단하지 마세요.\n' +
        '2. 나레이션은 현대 시청자를 위한 설명이므로 현대어 사용이 정상입니다.\n' +
        '3. 나레이션의 조선어투("~하였느니라", "~이니라" 등)도 오류가 아닙니다. 이는 분위기 연출입니다.\n' +
        '4. 오직 등장인물의 대사만 검사하세요.\n\n' +
        '【검사 항목】\n' +
        '1. 이야기흐름: 전개의 자연스러움\n' +
        '2. 캐릭터일관성: 인물 성격/말투 일관성\n' +
        '3. 감정선연결: 감정 변화의 자연스러움\n' +
        '4. 대사자연스러움: 대사의 어색함 여부\n' +
        '5. 시대착오: 현대 용어/물건 (구독, 좋아요, 휴대폰 등)\n\n' +
        '【출력 형식 - JSON만 출력】\n' +
        '{\n' +
        '  "errors": [\n' +
        '    {\n' +
        '      "type": "오류유형",\n' +
        '      "original": "원문",\n' +
        '      "revised": "수정문 (순수 대사만, 괄호/설명 제외)",\n' +
        '      "reason": "사유"\n' +
        '    }\n' +
        '  ],\n' +
        '  "scores": {\n' +
        '    "시니어적합도": 85,\n' +
        '    "이야기흐름": 80,\n' +
        '    "재미요소": 75,\n' +
        '    "시청자이탈방지": 78,\n' +
        '    "개선제안": "구체적인 개선 제안 내용"\n' +
        '  },\n' +
        '  "perfectScript": "모든 오류가 수정된 100점짜리 완벽한 대본 전문",\n' +
        '  "changePoints": [\n' +
        '    {"original": "원래 표현", "modified": "수정된 표현"}\n' +
        '  ]\n' +
        '}\n\n' +
        '【중요】\n' +
        '- revised와 perfectScript에는 순수한 대사만 작성하세요.\n' +
        '- 나레이션은 검사 대상이 아닙니다.\n' +
        '- 나레이션의 조선어투는 오류가 아니라 연출입니다.\n' +
        '- perfectScript는 원본 대본의 구조를 유지하되, 오류만 수정하세요.\n' +
        '- changePoints에 수정된 모든 부분을 나열하세요.\n\n' +
        '【대본】\n' + script;
}

async function callGeminiAPI(prompt, apiKey) {
    var url = API_CONFIG.ENDPOINT + '/' + API_CONFIG.MODEL + ':generateContent?key=' + apiKey;
    
    var body = {
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
    
    var response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
        signal: currentAbortController ? currentAbortController.signal : undefined
    });
    
    if (!response.ok) {
        var errorText = await response.text();
        throw new Error('API 오류 (' + response.status + '): ' + errorText);
    }
    
    var data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
        return data.candidates[0].content.parts[0].text;
    }
    
    throw new Error('API 응답 형식이 올바르지 않습니다.');
}

function parseApiResponse(responseText) {
    console.log('📥 API 응답 파싱 시작...');
    
    try {
        // 1. JSON 블록 추출 시도
        var jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
            try {
                var parsed = JSON.parse(jsonMatch[1]);
                console.log('✅ JSON 블록에서 파싱 성공');
                return normalizeResponse(parsed);
            } catch (e) {
                console.log('JSON 블록 파싱 실패, 다른 방법 시도...');
            }
        }
        
        // 2. 중괄호로 시작하는 JSON 추출 시도
        var jsonStart = responseText.indexOf('{');
        var jsonEnd = responseText.lastIndexOf('}');
        
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
            var jsonStr = responseText.substring(jsonStart, jsonEnd + 1);
            
            // 잘못된 이스케이프 수정
            jsonStr = jsonStr.replace(/\n/g, '\\n');
            jsonStr = jsonStr.replace(/\r/g, '\\r');
            jsonStr = jsonStr.replace(/\t/g, '\\t');
            
            try {
                var parsed = JSON.parse(jsonStr);
                console.log('✅ JSON 객체 파싱 성공');
                return normalizeResponse(parsed);
            } catch (e) {
                console.log('JSON 객체 파싱 실패: ' + e.message);
                
                // 3. 불완전한 JSON 복구 시도
                try {
                    var fixed = fixIncompleteJson(jsonStr);
                    var parsed = JSON.parse(fixed);
                    console.log('✅ JSON 복구 후 파싱 성공');
                    return normalizeResponse(parsed);
                } catch (e2) {
                    console.log('JSON 복구 실패: ' + e2.message);
                }
            }
        }
        
        // 4. 부분 추출 시도
        console.log('부분 데이터 추출 시도...');
        return extractPartialData(responseText);
        
    } catch (error) {
        console.error('파싱 오류:', error);
        return { errors: [], scores: null, perfectScript: '', changePoints: [] };
    }
}

function fixIncompleteJson(jsonStr) {
    var fixed = jsonStr;
    
    // 배열 닫기
    var openBrackets = (fixed.match(/\[/g) || []).length;
    var closeBrackets = (fixed.match(/\]/g) || []).length;
    while (closeBrackets < openBrackets) {
        fixed += ']';
        closeBrackets++;
    }
    
    // 객체 닫기
    var openBraces = (fixed.match(/\{/g) || []).length;
    var closeBraces = (fixed.match(/\}/g) || []).length;
    while (closeBraces < openBraces) {
        fixed += '}';
        closeBraces++;
    }
    
    // 끝나지 않은 문자열 처리
    fixed = fixed.replace(/,\s*([}\]])/g, '$1');
    fixed = fixed.replace(/:\s*([}\]])/g, ': ""$1');
    
    return fixed;
}

function extractPartialData(text) {
    var result = {
        errors: [],
        scores: null,
        perfectScript: '',
        changePoints: []
    };
    
    // errors 배열 추출
    var errorsMatch = text.match(/"errors"\s*:\s*\[([\s\S]*?)\]/);
    if (errorsMatch) {
        try {
            var errorsStr = '[' + errorsMatch[1] + ']';
            errorsStr = errorsStr.replace(/,\s*\]/g, ']');
            result.errors = JSON.parse(errorsStr);
        } catch (e) {
            console.log('errors 추출 실패');
        }
    }
    
    // scores 추출
    var scoresMatch = text.match(/"scores"\s*:\s*\{([\s\S]*?)\}/);
    if (scoresMatch) {
        try {
            result.scores = JSON.parse('{' + scoresMatch[1] + '}');
        } catch (e) {
            console.log('scores 추출 실패');
        }
    }
    
    // perfectScript 추출
    var perfectMatch = text.match(/"perfectScript"\s*:\s*"([\s\S]*?)(?:"|$)/);
    if (perfectMatch) {
        result.perfectScript = perfectMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
    }
    
    return result;
}

function normalizeResponse(parsed) {
    return {
        errors: Array.isArray(parsed.errors) ? parsed.errors : [],
        scores: parsed.scores || null,
        perfectScript: parsed.perfectScript || '',
        changePoints: Array.isArray(parsed.changePoints) ? parsed.changePoints : []
    };
}

function displayAnalysisResult(stage, containerId, data) {
    var container = document.getElementById(containerId);
    if (!container) return;
    
    var content = container.querySelector('.analysis-content') || container.querySelector('.content');
    if (!content) {
        content = document.createElement('div');
        content.className = 'analysis-content';
        container.appendChild(content);
    }
    
    var errors = data.errors || [];
    
    if (errors.length === 0) {
        content.innerHTML = '<div style="text-align:center;color:#69f0ae;padding:30px;font-size:16px;">✅ 오류가 발견되지 않았습니다!</div>';
        return;
    }
    
    var html = '<table class="analysis-table">' +
        '<thead><tr><th>유형</th><th>원문</th><th>수정</th><th>사유</th></tr></thead><tbody>';
    
    errors.forEach(function(error, idx) {
        html += '<tr class="analysis-row" data-error-index="' + idx + '" style="cursor:pointer;">' +
            '<td class="type-cell">' + formatTypeText(error.type || '기타') + '</td>' +
            '<td style="color:#ff6b6b;">' + escapeHtml(error.original || '') + '</td>' +
            '<td style="color:#69f0ae;">' + escapeHtml(cleanRevisedText(error.revised || '')) + '</td>' +
            '<td>' + escapeHtml(error.reason || '') + '</td>' +
            '</tr>';
    });
    
    html += '</tbody></table>';
    content.innerHTML = html;
    
    // 행 클릭 이벤트 - 해당 수정 위치로 이동
    content.querySelectorAll('.analysis-row').forEach(function(row) {
        row.addEventListener('click', function() {
            var errorIndex = parseInt(this.getAttribute('data-error-index'));
            var revisedId = stage === 1 ? 'revised-stage1' : 'revised-stage2';
            scrollToRevisedMarker(revisedId, errorIndex);
        });
    });
}

function scrollToRevisedMarker(containerId, errorIndex) {
    var container = document.getElementById(containerId);
    if (!container) return;
    
    var marker = container.querySelector('[data-error-index="' + errorIndex + '"]');
    if (marker) {
        marker.scrollIntoView({ behavior: 'smooth', block: 'center' });
        marker.classList.add('highlight-active');
        setTimeout(function() {
            marker.classList.remove('highlight-active');
        }, 2000);
    }
}

// ★★★ 핵심 함수: 수정 적용 ★★★
function applyRevisionsToScript(stage) {
    var stageData = stage === 1 ? state.stage1 : state.stage2;
    var script = stageData.originalScript || '';
    var errors = stageData.allErrors || [];
    
    console.log('📝 수정 적용 시작 (Stage ' + stage + '): ' + errors.length + '개 오류');
    
    if (!script || errors.length === 0) {
        stageData.fixedScript = script;
        stageData.isFixed = true;
        return;
    }
    
    var fixedScript = script;
    
    errors.forEach(function(error, idx) {
        if (error.original && error.revised) {
            var originalText = error.original.trim();
            var revisedText = cleanRevisedText(error.revised);
            
            if (originalText && revisedText && fixedScript.indexOf(originalText) !== -1) {
                fixedScript = fixedScript.replace(originalText, revisedText);
                console.log('  ✓ 수정 적용 [' + (idx + 1) + ']: "' + originalText.substring(0, 20) + '..." → "' + revisedText.substring(0, 20) + '..."');
            }
        }
    });
    
    stageData.fixedScript = fixedScript;
    stageData.isFixed = true;
    
    console.log('✅ 수정 적용 완료 (Stage ' + stage + ')');
}

// ★★★ 핵심 함수: 수정된 대본 표시 ★★★
function displayRevisedScript(stage, containerId) {
    var container = document.getElementById(containerId);
    if (!container) {
        console.warn('컨테이너를 찾을 수 없습니다: ' + containerId);
        return;
    }
    
    var content = container.querySelector('.revised-content') || container.querySelector('.content');
    if (!content) {
        content = document.createElement('div');
        content.className = 'revised-content';
        container.appendChild(content);
    }
    
    var stageData = stage === 1 ? state.stage1 : state.stage2;
    var script = stageData.fixedScript || stageData.originalScript || '';
    var errors = stageData.allErrors || [];
    
    console.log('📺 수정 대본 표시 (Stage ' + stage + '): 스크립트 길이=' + script.length + ', 오류 수=' + errors.length);
    
    if (!script) {
        content.innerHTML = '<div style="text-align:center;color:#888;padding:30px;">수정된 대본이 없습니다.</div>';
        return;
    }
    
    // HTML 이스케이프
    var html = escapeHtml(script);
    
    // 수정된 부분에 녹색 마커 추가
    var markerCount = 0;
    errors.forEach(function(error, idx) {
        if (error.revised && error.revised.trim()) {
            var revisedText = cleanRevisedText(error.revised);
            var escapedRevised = escapeHtml(revisedText);
            
            if (html.indexOf(escapedRevised) !== -1) {
                var marker = '<span class="marker-revised" data-error-index="' + idx + '" title="원문: ' + escapeHtml(error.original || '') + '\n사유: ' + escapeHtml(error.reason || '') + '">' + escapedRevised + '</span>';
                html = html.replace(escapedRevised, marker);
                markerCount++;
            }
        }
    });
    
    console.log('  → 마커 추가: ' + markerCount + '개');
    
    // 줄바꿈 처리
    html = html.replace(/\n/g, '<br>');
    
    content.innerHTML = '<div style="white-space:pre-wrap;line-height:1.8;padding:10px;">' + html + '</div>';
    
    // 마커 클릭 이벤트
    content.querySelectorAll('.marker-revised').forEach(function(marker) {
        marker.addEventListener('click', function() {
            var errorIndex = parseInt(this.getAttribute('data-error-index'));
            var analysisId = stage === 1 ? 'analysis-stage1' : 'analysis-stage2';
            highlightAnalysisRow(analysisId, errorIndex);
        });
    });
}

function highlightAnalysisRow(containerId, errorIndex) {
    var container = document.getElementById(containerId);
    if (!container) return;
    
    var row = container.querySelector('[data-error-index="' + errorIndex + '"]');
    if (row) {
        container.querySelectorAll('.analysis-row').forEach(function(r) {
            r.classList.remove('row-selected');
        });
        row.classList.add('row-selected');
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// 수정문에서 괄호/사유 제거
function cleanRevisedText(text) {
    if (!text) return '';
    
    var cleaned = text.trim();
    
    // 괄호 안의 내용 제거
    cleaned = cleaned.replace(/\s*\([^)]*\)\s*/g, '');
    cleaned = cleaned.replace(/\s*\[[^\]]*\]\s*/g, '');
    cleaned = cleaned.replace(/\s*\{[^}]*\}\s*/g, '');
    
    // "→ 사유:" 이후 제거
    cleaned = cleaned.replace(/\s*→.*$/g, '');
    
    // "// 사유" 이후 제거
    cleaned = cleaned.replace(/\s*\/\/.*$/g, '');
    
    // 앞뒤 공백 정리
    cleaned = cleaned.trim();
    
    return cleaned;
}

function displayScoresAndPerfectScript() {
    var scoreDisplay = document.getElementById('score-display');
    if (!scoreDisplay) return;
    
    var scores = state.scores;
    var perfectScript = state.perfectScript || '';
    var changePoints = state.changePoints || [];
    
    var html = '<div class="score-perfect-container">';
    
    // 왼쪽: 점수 패널
    html += '<div class="score-panel">';
    html += '<h3 style="color:#ffaa00;margin-bottom:15px;">📊 품질 평가 점수</h3>';
    
    if (scores) {
        html += '<div style="background:#2d2d2d;padding:15px;border-radius:8px;">';
        
        var scoreItems = [
            { key: '시니어적합도', icon: '👴', color: '#69f0ae' },
            { key: '이야기흐름', icon: '📖', color: '#4fc3f7' },
            { key: '재미요소', icon: '🎭', color: '#ffb74d' },
            { key: '시청자이탈방지', icon: '📺', color: '#f06292' }
        ];
        
        scoreItems.forEach(function(item) {
            var value = scores[item.key] || 0;
            html += '<div style="margin:10px 0;">';
            html += '<div style="display:flex;justify-content:space-between;margin-bottom:5px;">';
            html += '<span>' + item.icon + ' ' + item.key + '</span>';
            html += '<span style="color:' + item.color + ';font-weight:bold;">' + value + '점</span>';
            html += '</div>';
            html += '<div style="background:#444;border-radius:5px;height:10px;overflow:hidden;">';
            html += '<div style="background:' + item.color + ';height:100%;width:' + value + '%;transition:width 0.5s;"></div>';
            html += '</div></div>';
        });
        
        if (scores['개선제안']) {
            html += '<div style="margin-top:15px;padding:10px;background:#1e1e1e;border-radius:5px;border-left:3px solid #ffaa00;">';
            html += '<div style="color:#ffaa00;font-weight:bold;margin-bottom:5px;">💡 개선 제안</div>';
            html += '<div style="color:#ccc;font-size:13px;">' + escapeHtml(scores['개선제안']) + '</div>';
            html += '</div>';
        }
        
        html += '</div>';
    } else {
        html += '<div style="text-align:center;color:#888;padding:30px;">점수 정보가 없습니다.</div>';
    }
    
    html += '</div>';
    
    // 오른쪽: 100점 대본 패널
    html += '<div class="perfect-panel">';
    html += '<h3 style="color:#69f0ae;margin-bottom:15px;">💯 100점 수정 대본</h3>';
    
    if (perfectScript) {
        var formattedScript = formatPerfectScript(perfectScript, changePoints);
        html += '<div class="perfect-script-content" id="perfect-script-content">' + formattedScript + '</div>';
        
        // 변경 포인트 섹션
        if (changePoints.length > 0) {
            html += '<div class="change-points-section">';
            html += '<div class="change-points-title">📍 수정된 부분 (' + changePoints.length + '개)</div>';
            
            changePoints.forEach(function(point, idx) {
                html += '<span class="change-point-item" data-change-index="' + idx + '">';
                html += (idx + 1) + '. ' + escapeHtml((point.original || '').substring(0, 15)) + ' → ' + escapeHtml((point.modified || '').substring(0, 15));
                html += '</span>';
            });
            
            html += '</div>';
        }
        
        // 대본 비교 버튼
        html += '<div style="margin-top:15px;text-align:center;">';
        html += '<button id="btn-compare-scripts" class="btn-fullview" style="background:#e91e63;">📋 대본 비교하기</button>';
        html += '</div>';
    } else {
        html += '<div style="text-align:center;color:#888;padding:30px;">100점 대본이 생성되지 않았습니다.</div>';
    }
    
    html += '</div>';
    html += '</div>';
    
    scoreDisplay.innerHTML = html;
    
    // 대본 비교 버튼 이벤트
    var compareBtn = document.getElementById('btn-compare-scripts');
    if (compareBtn) {
        compareBtn.addEventListener('click', openCompareModal);
    }
    
    // 변경 포인트 클릭 이벤트
    scoreDisplay.querySelectorAll('.change-point-item').forEach(function(item) {
        item.addEventListener('click', function() {
            var idx = parseInt(this.getAttribute('data-change-index'));
            scrollToChangePoint(idx);
        });
    });
}

function formatPerfectScript(script, changePoints) {
    if (!script) return '';
    
    var html = escapeHtml(script);
    
    // 변경 포인트에 녹색 하이라이트 적용
    if (changePoints && changePoints.length > 0) {
        changePoints.forEach(function(point, idx) {
            if (point.modified) {
                var escapedModified = escapeHtml(point.modified);
                var marker = '<span class="perfect-modified" data-change-id="change-' + idx + '">' + escapedModified + '</span>';
                html = html.replace(escapedModified, marker);
            }
        });
    }
    
    return html;
}

function scrollToChangePoint(idx) {
    var marker = document.querySelector('[data-change-id="change-' + idx + '"]');
    if (marker) {
        marker.scrollIntoView({ behavior: 'smooth', block: 'center' });
        marker.classList.add('highlight-active');
        setTimeout(function() {
            marker.classList.remove('highlight-active');
        }, 2000);
    }
}

function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
