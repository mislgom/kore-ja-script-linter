/**
 * MISLGOM 대본 검수 자동 프로그램
 * main.js v4.53 - Vertex AI API 키 + Gemini 2.5 Flash
 * - v4.53: 2차 분석 테이블 클릭 → 최종 수정 반영 스크롤 이동 + 개별 오류 독립 토글
 * - v4.52: 개별 수정 전/후 토글 + 나레이션 오류 제외 강화
 * - v4.51: 1차/2차 분석 프롬프트 강화 (오류 검출 정확도 향상)
 * - v4.50: 나레이션 조선어투 허용 강화 + 클릭 이동/버튼 수정
 * - v4.49: 100점 수정 대본 개선 (구체적 프롬프트 + 녹색 하이라이트)
 * - v4.48: 대본 비교하기 기능 추가
 * - ENDPOINT: generativelanguage.googleapis.com
 * - TIMEOUT: 300000 ms
 * - MAX_OUTPUT_TOKENS: 16384
 */

console.log('🚀 main.js v4.53 로드됨');
console.log('📌 v4.53: 2차 분석 테이블 클릭 → 최종 수정 반영 스크롤 이동 + 개별 오류 독립 토글');

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
    scores: null,
    scriptSummary: ''
};

var currentAbortController = null;

var API_CONFIG = {
    TIMEOUT: 300000,
    MODEL: 'gemini-2.5-flash',
    ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models',
    MAX_OUTPUT_TOKENS: 65536
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
    initResetCacheButton();
    initPerfectScriptSection();
    console.log('📊 총 ' + getTotalRulesCount() + '개 시대고증 규칙 로드됨');
    console.log('⏱️ API 타임아웃: ' + (API_CONFIG.TIMEOUT / 1000) + '초');
    console.log('🤖 모델: ' + API_CONFIG.MODEL);
    console.log('✅ main.js v4.53 초기화 완료');
    console.log('🆕 v4.53 신규 기능: 테이블 클릭 → 대본 스크롤 이동, 개별 오류 독립 토글');
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
        '.row-selected{background:#3a3a3a !important;outline:2px solid #69f0ae;}';
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
    
    // ============================================================
    // 왼쪽: 최종 수정 반영 대본 (일반 텍스트)
    // ============================================================
    leftBody.innerHTML = escapeHtml(finalScript);
    
    // ============================================================
    // 오른쪽: 100점 대본 (태그별 색상 표시 - 메인 페이지와 동일)
    // ============================================================
    var rightHtml = escapeHtml(perfectScript);
    
    // [SENIOR+]...[/SENIOR+] → 녹색 + 밑줄 (시니어 적합도 추가)
    rightHtml = rightHtml.replace(/\[SENIOR\+\]([\s\S]*?)\[\/SENIOR\+\]/g, '<span class="compare-tag compare-tag-senior-add" style="background:#4CAF5040;color:#69f0ae;border-left:3px solid #4CAF50;padding:1px 4px;border-radius:2px;text-decoration:underline;text-decoration-color:#4CAF50;text-underline-offset:3px;cursor:pointer;" title="➕ 시니어 적합도 추가" data-compare-type="senior-add">$1</span>');
    
    // [FUN+]...[/FUN+] → 주황색 + 밑줄 (재미 요소 추가)
    rightHtml = rightHtml.replace(/\[FUN\+\]([\s\S]*?)\[\/FUN\+\]/g, '<span class="compare-tag compare-tag-fun-add" style="background:#FF980040;color:#FFB74D;border-left:3px solid #FF9800;padding:1px 4px;border-radius:2px;text-decoration:underline;text-decoration-color:#FF9800;text-underline-offset:3px;cursor:pointer;" title="➕ 재미 요소 추가" data-compare-type="fun-add">$1</span>');
    
    // [FLOW+]...[/FLOW+] → 파란색 + 밑줄 (이야기 흐름 추가)
    rightHtml = rightHtml.replace(/\[FLOW\+\]([\s\S]*?)\[\/FLOW\+\]/g, '<span class="compare-tag compare-tag-flow-add" style="background:#2196F340;color:#64B5F6;border-left:3px solid #2196F3;padding:1px 4px;border-radius:2px;text-decoration:underline;text-decoration-color:#2196F3;text-underline-offset:3px;cursor:pointer;" title="➕ 이야기 흐름 추가" data-compare-type="flow-add">$1</span>');
    
    // [RETAIN+]...[/RETAIN+] → 보라색 + 밑줄 (시청자 이탈 방지 추가)
    rightHtml = rightHtml.replace(/\[RETAIN\+\]([\s\S]*?)\[\/RETAIN\+\]/g, '<span class="compare-tag compare-tag-retain-add" style="background:#9C27B040;color:#CE93D8;border-left:3px solid #9C27B0;padding:1px 4px;border-radius:2px;text-decoration:underline;text-decoration-color:#9C27B0;text-underline-offset:3px;cursor:pointer;" title="➕ 시청자 이탈 방지 추가" data-compare-type="retain-add">$1</span>');
    
    // [SENIOR]...[/SENIOR] → 녹색 (시니어 적합도 수정)
    rightHtml = rightHtml.replace(/\[SENIOR\]([\s\S]*?)\[\/SENIOR\]/g, '<span class="compare-tag compare-tag-senior" style="background:#4CAF5040;color:#69f0ae;border-left:3px solid #4CAF50;padding:1px 4px;border-radius:2px;cursor:pointer;" title="✏️ 시니어 적합도 수정" data-compare-type="senior">$1</span>');
    
    // [FUN]...[/FUN] → 주황색 (재미 요소 수정)
    rightHtml = rightHtml.replace(/\[FUN\]([\s\S]*?)\[\/FUN\]/g, '<span class="compare-tag compare-tag-fun" style="background:#FF980040;color:#FFB74D;border-left:3px solid #FF9800;padding:1px 4px;border-radius:2px;cursor:pointer;" title="✏️ 재미 요소 수정" data-compare-type="fun">$1</span>');
    
    // [FLOW]...[/FLOW] → 파란색 (이야기 흐름 수정)
    rightHtml = rightHtml.replace(/\[FLOW\]([\s\S]*?)\[\/FLOW\]/g, '<span class="compare-tag compare-tag-flow" style="background:#2196F340;color:#64B5F6;border-left:3px solid #2196F3;padding:1px 4px;border-radius:2px;cursor:pointer;" title="✏️ 이야기 흐름 수정" data-compare-type="flow">$1</span>');
    
    // [RETAIN]...[/RETAIN] → 보라색 (시청자 이탈 방지 수정)
    rightHtml = rightHtml.replace(/\[RETAIN\]([\s\S]*?)\[\/RETAIN\]/g, '<span class="compare-tag compare-tag-retain" style="background:#9C27B040;color:#CE93D8;border-left:3px solid #9C27B0;padding:1px 4px;border-radius:2px;cursor:pointer;" title="✏️ 시청자 이탈 방지 수정" data-compare-type="retain">$1</span>');
    
    // [DEL]...[/DEL] → 빨간색 취소선 (삭제)
    rightHtml = rightHtml.replace(/\[DEL\]([\s\S]*?)\[\/DEL\]/g, '<span class="compare-tag compare-tag-del" style="text-decoration:line-through;color:#ff5555;background:#ff555520;padding:1px 4px;border-radius:2px;cursor:pointer;" title="🗑️ 삭제된 부분" data-compare-type="del">$1</span>');
    
    // ★...★ 호환 (이전 버전)
    rightHtml = rightHtml.replace(/★([^★]+)★/g, '<span class="compare-tag" style="background:#FFD70040;color:#FFD700;padding:1px 4px;border-radius:2px;cursor:pointer;">$1</span>');
    
    rightBody.innerHTML = rightHtml;
    
    // ============================================================
    // 수정/추가/삭제 카운트
    // ============================================================
    var seniorEditCount = (perfectScript.match(/\[SENIOR\][^\+\[]/g) || []).length;
    var seniorAddCount = (perfectScript.match(/\[SENIOR\+\]/g) || []).length;
    var funEditCount = (perfectScript.match(/\[FUN\][^\+\[]/g) || []).length;
    var funAddCount = (perfectScript.match(/\[FUN\+\]/g) || []).length;
    var flowEditCount = (perfectScript.match(/\[FLOW\][^\+\[]/g) || []).length;
    var flowAddCount = (perfectScript.match(/\[FLOW\+\]/g) || []).length;
    var retainEditCount = (perfectScript.match(/\[RETAIN\][^\+\[]/g) || []).length;
    var retainAddCount = (perfectScript.match(/\[RETAIN\+\]/g) || []).length;
    var delCount = (perfectScript.match(/\[DEL\]/g) || []).length;
    
    // ============================================================
    // 하단 영역: 범례 + 카운트 + 수정 목록
    // ============================================================
    diffList.innerHTML = '';
    
    // 범례 + 카운트 영역
    var legendHtml = '<div style="margin-bottom:15px;padding:12px;background:#1e1e1e;border-radius:8px;">' +
        '<div style="display:flex;justify-content:center;gap:20px;flex-wrap:wrap;margin-bottom:8px;">' +
        '<span style="font-size:12px;font-weight:bold;color:#aaa;">✏️ 수정 = 배경색</span>' +
        '<span style="font-size:12px;font-weight:bold;color:#aaa;">➕ 추가 = 배경색 + <u>밑줄</u></span>' +
        '<span style="font-size:12px;font-weight:bold;color:#aaa;">🗑️ 삭제 = <span style="text-decoration:line-through;color:#ff5555;">취소선</span></span>' +
        '</div>' +
        '<div style="display:flex;justify-content:center;gap:12px;flex-wrap:wrap;">' +
        '<span style="font-size:11px;color:#69f0ae;">● 시니어 적합도: ✏️' + seniorEditCount + ' / ➕' + seniorAddCount + '</span>' +
        '<span style="font-size:11px;color:#FFB74D;">● 재미 요소: ✏️' + funEditCount + ' / ➕' + funAddCount + '</span>' +
        '<span style="font-size:11px;color:#64B5F6;">● 이야기 흐름: ✏️' + flowEditCount + ' / ➕' + flowAddCount + '</span>' +
        '<span style="font-size:11px;color:#CE93D8;">● 시청자 이탈 방지: ✏️' + retainEditCount + ' / ➕' + retainAddCount + '</span>' +
        '<span style="font-size:11px;color:#ff5555;">● 삭제: 🗑️' + delCount + '</span>' +
        '</div>' +
        '</div>';
    
    var legendDiv = document.createElement('div');
    legendDiv.innerHTML = legendHtml;
    diffList.appendChild(legendDiv);
    
    // ============================================================
    // 100점 대본 태그 클릭 → 최종 수정 반영 대본 해당 위치 이동
    // ============================================================
    rightBody.querySelectorAll('.compare-tag').forEach(function(tag) {
        tag.addEventListener('click', function() {
            var tagText = this.textContent || '';
            if (!tagText || tagText.trim().length < 3) return;
            
            // 클릭된 태그 깜빡임 효과
            var originalBg = this.style.background;
            this.style.background = '#ffffff40';
            var self = this;
            setTimeout(function() { self.style.background = originalBg; }, 300);
            setTimeout(function() { self.style.background = '#ffffff40'; }, 600);
            setTimeout(function() { self.style.background = originalBg; }, 900);
            
            // 최종 수정 반영 대본에서 해당 텍스트 위치 찾기
            var searchText = tagText.trim();
            var leftText = leftBody.textContent || leftBody.innerText || '';
            
            // 검색 후보 생성
            var searchCandidates = [searchText];
            
            // 첫 줄만
            var firstLine = searchText.split('\n')[0].trim();
            if (firstLine.length >= 5 && firstLine !== searchText) {
                searchCandidates.push(firstLine);
            }
            
            // 앞 20자
            if (searchText.length > 20) {
                searchCandidates.push(searchText.substring(0, 20));
            }
            
            // 앞 10자
            if (searchText.length > 10) {
                searchCandidates.push(searchText.substring(0, 10));
            }
            
            // 핵심 단어 (3자 이상)
            var words = searchText.split(/\s+/).filter(function(w) { return w.length >= 3; });
            if (words.length > 0) {
                searchCandidates.push(words[0]);
            }
            
            var foundIndex = -1;
            var foundCandidate = '';
            
            for (var s = 0; s < searchCandidates.length; s++) {
                var candidate = searchCandidates[s];
                if (!candidate || candidate.length < 3) continue;
                foundIndex = leftText.indexOf(candidate);
                if (foundIndex !== -1) {
                    foundCandidate = candidate;
                    break;
                }
            }
            
            if (foundIndex !== -1 && leftText.length > 0) {
                // 비율 기반 스크롤
                var scrollRatio = foundIndex / leftText.length;
                var scrollTarget = leftBody.scrollHeight * scrollRatio;
                
                leftBody.scrollTo({
                    top: Math.max(0, scrollTarget - 80),
                    behavior: 'smooth'
                });
                
                // 텍스트 노드에서 하이라이트 시도
                var textNodes = [];
                var walker = document.createTreeWalker(leftBody, NodeFilter.SHOW_TEXT, null, false);
                var node;
                while (node = walker.nextNode()) {
                    textNodes.push(node);
                }
                
                var highlighted = false;
                for (var t = 0; t < textNodes.length && !highlighted; t++) {
                    var textNode = textNodes[t];
                    var nodeText = textNode.nodeValue || '';
                    var idx = nodeText.indexOf(foundCandidate);
                    
                    if (idx !== -1) {
                        try {
                            var range = document.createRange();
                            var matchEnd = Math.min(idx + foundCandidate.length, nodeText.length);
                            range.setStart(textNode, idx);
                            range.setEnd(textNode, matchEnd);
                            
                            var highlight = document.createElement('span');
                            highlight.style.cssText = 'background:#ffeb3b;color:#000;padding:2px 4px;border-radius:3px;transition:background 0.5s;';
                            range.surroundContents(highlight);
                            
                            highlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            
                            highlighted = true;
                            
                            setTimeout(function() {
                                if (highlight) highlight.style.background = '#ffeb3b80';
                            }, 1500);
                            
                            setTimeout(function() {
                                if (highlight && highlight.parentNode) {
                                    var parent = highlight.parentNode;
                                    parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
                                    parent.normalize();
                                }
                            }, 4000);
                        } catch (e) {
                            console.log('⚠️ 하이라이트 생성 실패:', e.message);
                        }
                    }
                }
                
                console.log('✅ 비교 모달: "' + foundCandidate.substring(0, 20) + '..." → 최종 수정본 이동');
            } else {
                console.log('⚠️ 비교 모달: 최종 수정본에서 해당 텍스트를 찾지 못함');
            }
        });
    });
    
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
                    var isDuplicate = differences.some(function(d) {
                        return d.original === w1 && d.modified === w2;
                    });
                    
                    if (!isDuplicate && w1.length > 1 && w2.length > 1) {
                        differences.push({
                            original: w1,
                            modified: w2,
                            index: i
                        });
                    }
                }
            }
        }
    }
    
    return differences.slice(0, 30);
}

function scrollToDiff(index) {
    var leftBody = document.getElementById('compare-left-body');
    var rightBody = document.getElementById('compare-right-body');
    
    var leftHighlight = leftBody.querySelector('[data-diff-id="diff-left-' + index + '"]');
    var rightHighlight = rightBody.querySelector('[data-diff-id="diff-right-' + index + '"]');
    
    if (leftHighlight) {
        leftHighlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
        leftHighlight.style.background = '#69f0ae';
        leftHighlight.style.color = '#000';
        setTimeout(function() {
            leftHighlight.style.background = '#69f0ae33';
            leftHighlight.style.color = '';
        }, 2000);
    }
    
    if (rightHighlight) {
        rightHighlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
        rightHighlight.style.background = '#69f0ae';
        rightHighlight.style.color = '#000';
        setTimeout(function() {
            rightHighlight.style.background = '#69f0ae33';
            rightHighlight.style.color = '';
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
        toggleCurrentErrorOnly(stage, false);
        updateFullViewContent(stage, leftBody, rightBody);
    });
    
    var btnAfter = document.createElement('button');
    btnAfter.innerHTML = '✅ 수정 후';
    btnAfter.style.cssText = 'background:#4CAF50;color:white;border:none;padding:8px 16px;border-radius:5px;cursor:pointer;font-weight:bold;font-size:13px;';
    btnAfter.addEventListener('click', function() {
        toggleCurrentErrorOnly(stage, true);
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
    }, 100);
}

function ensureScoreSection() {
    var scoreDisplay = document.getElementById('score-display');
    if (!scoreDisplay) return null;
    return scoreDisplay;
}
    
function hideOriginalAnalysisButtons() {
    var btn1 = document.getElementById('btn-analyze-stage1');
    var btn2 = document.getElementById('btn-analyze-stage2');
    if (btn1) btn1.style.display = 'none';
    if (btn2) btn2.style.display = 'none';
}

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
        closeBtn.addEventListener('click', function() {
            panel.style.display = 'none';
        });
    }
}

function validateApiKey(apiKey) {
    if (!apiKey) return { valid: false, message: 'API 키가 설정되지 않았습니다.' };
    if (apiKey.length < 20) return { valid: false, message: 'API 키가 너무 짧습니다.' };
    return { valid: true, message: 'OK' };
}

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

function initDownloadButton() {
    var btn = document.getElementById('btn-download');
    if (!btn) return;
    btn.style.display = 'none';
}

function downloadScript(script) {
    if (!script || script.trim() === '') {
        alert('다운로드할 내용이 없습니다.');
        return;
    }
    // v4.54: 다운로드 전 __DELETE__ 잔여 텍스트 및 삭제 관련 괄호 표현 정리
    var cleanScript = cleanScriptForDownload(script);
    try {
        var blob = new Blob([cleanScript], { type: 'text/plain;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = '최종수정본_' + new Date().toISOString().slice(0, 10) + '.txt';
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
        alert('다운로드할 100점 대본이 없습니다.\n2차 분석을 먼저 완료해주세요.');
        return;
    }
    
    // v4.54: 다운로드 전 __DELETE__ 잔여 텍스트 및 삭제 관련 괄호 표현 정리
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

// ============================================================
// cleanScriptForDownload - 다운로드용 대본 정리 (v4.54 추가)
// __DELETE__ 마커 및 삭제 관련 괄호 표현을 완전히 제거
// ============================================================
function cleanScriptForDownload(script) {
    if (!script) return '';
    
    var cleaned = script;
    
    // 1. [DEL]...[/DEL] 삭제 부분 완전 제거
    cleaned = cleaned.replace(/\[DEL\][\s\S]*?\[\/DEL\]/g, '');
    
    // 2. 모든 태그 제거 (내용은 유지)
    cleaned = cleaned.replace(/\[SENIOR\+\]/g, '');
    cleaned = cleaned.replace(/\[\/SENIOR\+\]/g, '');
    cleaned = cleaned.replace(/\[FUN\+\]/g, '');
    cleaned = cleaned.replace(/\[\/FUN\+\]/g, '');
    cleaned = cleaned.replace(/\[FLOW\+\]/g, '');
    cleaned = cleaned.replace(/\[\/FLOW\+\]/g, '');
    cleaned = cleaned.replace(/\[RETAIN\+\]/g, '');
    cleaned = cleaned.replace(/\[\/RETAIN\+\]/g, '');
    cleaned = cleaned.replace(/\[SENIOR\]/g, '');
    cleaned = cleaned.replace(/\[\/SENIOR\]/g, '');
    cleaned = cleaned.replace(/\[FUN\]/g, '');
    cleaned = cleaned.replace(/\[\/FUN\]/g, '');
    cleaned = cleaned.replace(/\[FLOW\]/g, '');
    cleaned = cleaned.replace(/\[\/FLOW\]/g, '');
    cleaned = cleaned.replace(/\[RETAIN\]/g, '');
    cleaned = cleaned.replace(/\[\/RETAIN\]/g, '');
    
    // 3. ★ 태그 제거 (이전 버전 호환)
    cleaned = cleaned.replace(/★/g, '');
    
    // 4. __DELETE__ 마커 제거
    cleaned = cleaned.replace(/__DELETE__/g, '');
    
    // 5. 삭제 지시 괄호 표현 제거
    cleaned = cleaned.replace(/\(해당\s*장면은?\s*삭제[^)]*\)/g, '');
    cleaned = cleaned.replace(/\(이\s*부분\s*삭제[^)]*\)/g, '');
    cleaned = cleaned.replace(/\(해당\s*대사\s*삭제[^)]*\)/g, '');
    cleaned = cleaned.replace(/\(삭제\s*필요[^)]*\)/g, '');
    cleaned = cleaned.replace(/\(삭제되어야[^)]*\)/g, '');
    cleaned = cleaned.replace(/\(삭제[^)]*\)/g, '');
    cleaned = cleaned.replace(/\(제거[^)]*\)/g, '');
    cleaned = cleaned.replace(/\[해당\s*장면은?\s*삭제[^\]]*\]/g, '');
    cleaned = cleaned.replace(/\[삭제[^\]]*\]/g, '');
    cleaned = cleaned.replace(/\[제거[^\]]*\]/g, '');
    
    // 6. 대괄호 [] 와 내용 모두 제거 (씬 헤더 등은 유지하지 않음)
    cleaned = cleaned.replace(/\[[^\]]*\]/g, '');
    
    // 7. 소괄호 () 와 내용 모두 제거 (지문 괄호 포함)
    cleaned = cleaned.replace(/\([^)]*\)/g, '');
    
    // 8. 중괄호 {} 와 내용 모두 제거
    cleaned = cleaned.replace(/\{[^}]*\}/g, '');
    
    // 9. 홑화살괄호 <> 와 내용 제거
    cleaned = cleaned.replace(/<[^>]*>/g, '');
    
    // 10. 자막에 불필요한 특수문자 제거 (! ? . , ; 는 유지)
    // 유지할 문자: 한글, 영문, 숫자, 공백, 줄바꿈, ! ? . , ; 
    // 그 외 특수문자 모두 제거
    cleaned = cleaned.replace(/[^\uAC00-\uD7AF\u3131-\u3163\u1100-\u11FF가-힣a-zA-Z0-9\s!?.,;~\-]/g, '');
    
    // 11. 연속 공백 정리 (줄바꿈은 유지)
    cleaned = cleaned.replace(/[^\S\n]+/g, ' ');
    
    // 12. 연속 빈 줄 정리 (3줄 이상 → 2줄로)
    cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    // 13. 각 줄 앞뒤 공백 정리
    cleaned = cleaned.split('\n').map(function(line) {
        return line.trim();
    }).join('\n');
    
    // 14. 앞뒤 공백 정리
    cleaned = cleaned.trim();
    
    console.log('📄 cleanScriptForDownload: ' + script.length + '자 → ' + cleaned.length + '자');
    
    return cleaned;
}

function initRevertButtons() {
    var r1 = document.getElementById('revised-stage1');
    var r2 = document.getElementById('revised-stage2');
    if (r1) addRevertButton(r1, 'stage1');
    if (r2) addRevertButton(r2, 'stage2');
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
    btnBefore.addEventListener('click', function() { 
        toggleCurrentErrorOnly(stage, false);
    });

    var btnAfter = document.createElement('button');
    btnAfter.id = 'btn-revert-after-' + stage;
    btnAfter.innerHTML = '✅ 수정 후';
    btnAfter.style.cssText = 'background:#4CAF50;color:white;border:none;padding:8px 16px;border-radius:5px;cursor:pointer;font-weight:bold;font-size:13px;';
    btnAfter.disabled = true;
    btnAfter.addEventListener('click', function() { 
        toggleCurrentErrorOnly(stage, true);
    });

    wrapper.appendChild(btnBefore);
    wrapper.appendChild(btnAfter);

    var btnFix = document.createElement('button');
    btnFix.id = 'btn-fix-script-' + stage;
    btnFix.innerHTML = '📌 대본 픽스';
    btnFix.style.cssText = 'background:#2196F3;color:white;border:none;padding:8px 16px;border-radius:5px;cursor:pointer;font-weight:bold;font-size:13px;';
    btnFix.disabled = true;
    btnFix.addEventListener('click', function() { fixScript(stage); });
    wrapper.appendChild(btnFix);

    // stage2(최종 수정 반영)에만 다운로드 버튼 추가
    if (stage === 'stage2') {
        var btnDownload = document.createElement('button');
        btnDownload.id = 'btn-download-final-inline';
        btnDownload.innerHTML = '💾 최종 수정본 다운로드';
        btnDownload.style.cssText = 'background:#9C27B0;color:white;border:none;padding:8px 16px;border-radius:5px;cursor:pointer;font-weight:bold;font-size:13px;';
        btnDownload.addEventListener('click', function() {
            var scriptToDownload = state.stage2.fixedScript || state.stage1.fixedScript || state.finalScript || '';
            if (!scriptToDownload || scriptToDownload.trim() === '') {
                alert('다운로드할 수정본이 없습니다.\n"대본 픽스" 버튼을 먼저 눌러주세요.');
                return;
            }
            downloadScript(scriptToDownload);
        });
        wrapper.appendChild(btnDownload);
    }

    parent.appendChild(wrapper);
}

function toggleCurrentErrorOnly(stage, useRevised) {
    var s = state[stage];
    var errors = s.allErrors || [];
    
    if (errors.length === 0) {
        console.log('⚠️ 수정할 항목이 없습니다.');
        return;
    }
    
    if (s.currentErrorIndex >= 0 && s.currentErrorIndex < errors.length) {
        var err = errors[s.currentErrorIndex];
        err.useRevised = useRevised;
        console.log('🔄 개별 오류 토글: [' + s.currentErrorIndex + '] ' + err.original + ' → ' + (useRevised ? '수정 후' : '수정 전'));
        renderScriptWithMarkers(stage);
    } else {
        console.log('⚠️ 선택된 오류가 없습니다. 테이블에서 항목을 먼저 클릭하세요.');
        alert('수정할 항목을 먼저 선택하세요.\n분석 결과 테이블에서 행을 클릭하면 해당 항목이 선택됩니다.');
    }
}

function toggleSelectedOrAllErrors(stage, useRevised) {
    var s = state[stage];
    var errors = s.allErrors || [];
    
    if (errors.length === 0) {
        alert('수정할 항목이 없습니다.');
        return;
    }
    
    if (s.currentErrorIndex >= 0 && s.currentErrorIndex < errors.length) {
        var err = errors[s.currentErrorIndex];
        err.useRevised = useRevised;
        renderScriptWithMarkers(stage);
    } else {
        errors.forEach(function(err) {
            err.useRevised = useRevised;
        });
        renderScriptWithMarkers(stage);
        alert('모든 항목을 ' + (useRevised ? '수정 후(수정안)' : '수정 전(원본)') + '으로 변경했습니다.');
    }
}

function applyAllOriginal(stage) {
    var s = state[stage];
    var errors = s.allErrors || [];
    
    if (errors.length === 0) {
        alert('수정할 항목이 없습니다.');
        return;
    }
    
    errors.forEach(function(err) {
        err.useRevised = false;
    });
    
    renderScriptWithMarkers(stage);
    alert('모든 항목을 수정 전(원본)으로 변경했습니다.');
}

function applyAllRevised(stage) {
    var s = state[stage];
    var errors = s.allErrors || [];
    
    if (errors.length === 0) {
        alert('수정할 항목이 없습니다.');
        return;
    }
    
    errors.forEach(function(err) {
        err.useRevised = true;
    });
    
    renderScriptWithMarkers(stage);
    alert('모든 항목을 수정 후(수정안)로 변경했습니다.');
}

function toggleCurrentError(stage, useRevised) {
    var s = state[stage];
    var errors = s.allErrors || [];
    
    if (s.currentErrorIndex < 0 || s.currentErrorIndex >= errors.length) {
        if (useRevised) {
            applyAllRevised(stage);
        } else {
            applyAllOriginal(stage);
        }
        return;
    }
    
    var err = errors[s.currentErrorIndex];
    err.useRevised = useRevised;
    
    renderScriptWithMarkers(stage);
}

function setCurrentError(stage, errorIndex) {
    state[stage].currentErrorIndex = errorIndex;
    console.log('📍 현재 선택된 오류: [' + stage + '] index=' + errorIndex);
    highlightCurrentRow(stage, errorIndex);
    
    var errors = state[stage].allErrors || [];
    if (errorIndex >= 0 && errorIndex < errors.length) {
        var err = errors[errorIndex];
        scrollToMarker(stage, err.id);
    }
}

function highlightCurrentRow(stage, errorIndex) {
    var tableContainer = document.getElementById('analysis-' + stage);
    if (!tableContainer) return;
    
    var rows = tableContainer.querySelectorAll('tbody tr, tr[data-marker-id]');
    rows.forEach(function(row, idx) {
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

// ============================================================
// renderScriptWithMarkers - 부분 매칭 강화 버전 (v4.53)
// ============================================================

/**
 * 텍스트 내에서 검색어의 위치를 찾는 헬퍼 함수
 * @param {string} text - 전체 텍스트
 * @param {string} searchText - 찾을 텍스트
 * @returns {number} - 위치 (못 찾으면 -1)
 */
function findTextPosition(text, searchText) {
    if (!text || !searchText) return -1;
    
    // 1. 정확한 매칭
    var exactPos = text.indexOf(searchText);
    if (exactPos !== -1) return exactPos;
    
    // 2. 공백 정규화 후 매칭
    var normalizedText = text.replace(/\s+/g, ' ');
    var normalizedSearch = searchText.replace(/\s+/g, ' ');
    var normalizedPos = normalizedText.indexOf(normalizedSearch);
    if (normalizedPos !== -1) return normalizedPos;
    
    // 3. 핵심 단어로 매칭
    var words = searchText.split(/\s+/).filter(function(w) { return w.length > 2; });
    if (words.length > 0) {
        var firstWordPos = text.indexOf(words[0]);
        if (firstWordPos !== -1) return firstWordPos;
    }
    
    return -1;
}

/**
 * 부분 매칭을 포함한 최적 매칭을 찾는 헬퍼 함수
 * @param {string} text - 전체 텍스트
 * @param {string} searchText - 찾을 텍스트
 * @returns {Object} - { found: boolean, matchedText: string, position: number }
 */
function findBestMatch(text, searchText) {
    if (!text || !searchText) {
        return { found: false, matchedText: '', position: -1 };
    }
    
    // 1. 정확한 매칭
    var exactPos = text.indexOf(searchText);
    if (exactPos !== -1) {
        return { found: true, matchedText: searchText, position: exactPos };
    }
    
    // 2. 공백 정규화 후 매칭
    var normalizedSearch = searchText.replace(/\s+/g, ' ').trim();
    var normalizedPos = text.indexOf(normalizedSearch);
    if (normalizedPos !== -1) {
        return { found: true, matchedText: normalizedSearch, position: normalizedPos };
    }
    
    // 3. 줄바꿈 제거 후 매칭
    var noLineBreakSearch = searchText.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
    var noLineBreakPos = text.indexOf(noLineBreakSearch);
    if (noLineBreakPos !== -1) {
        return { found: true, matchedText: noLineBreakSearch, position: noLineBreakPos };
    }
    
    // 4. 인물명: 대사 형식에서 대사 부분만 추출하여 매칭
    var dialogueMatch = searchText.match(/^([가-힣a-zA-Z]{2,10})\s*[:：]\s*([\s\S]+)/);
    if (dialogueMatch) {
        var dialogueOnly = dialogueMatch[2].replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
        // 대사 전체 매칭
        var dialoguePos = text.indexOf(dialogueOnly);
        if (dialoguePos !== -1) {
            return { found: true, matchedText: dialogueOnly, position: dialoguePos };
        }
        // 대사 첫 문장만 매칭
        var firstSentence = dialogueOnly.split(/[.!?。]/)[0].trim();
        if (firstSentence.length >= 8) {
            var firstSentencePos = text.indexOf(firstSentence);
            if (firstSentencePos !== -1) {
                var endPos = Math.min(firstSentencePos + dialogueOnly.length, text.length);
                return { found: true, matchedText: text.substring(firstSentencePos, endPos), position: firstSentencePos };
            }
        }
    }
    
    // 5. 여러 줄 대사 처리 (인물명:\n인물명: 패턴)
    var multiDialogue = searchText.match(/^([가-힣]{2,4})\s*[:：]\s*/gm);
    if (multiDialogue && multiDialogue.length >= 2) {
        var firstLine = searchText.split(/[\r\n]+/)[0].trim();
        var firstLineClean = firstLine.replace(/^[가-힣]{2,4}\s*[:：]\s*/, '').trim();
        if (firstLineClean.length >= 8) {
            var firstLinePos = text.indexOf(firstLineClean);
            if (firstLinePos !== -1) {
                return { found: true, matchedText: firstLineClean, position: firstLinePos };
            }
        }
    }
    
    // 6. 부분 문자열 매칭 (앞 30자, 뒤 30자)
    if (searchText.length > 30) {
        var frontPart = searchText.substring(0, 30).replace(/[\r\n]+/g, ' ').trim();
        var frontPos = text.indexOf(frontPart);
        if (frontPos !== -1) {
            var endPos = Math.min(frontPos + searchText.length, text.length);
            var matchedText = text.substring(frontPos, endPos);
            return { found: true, matchedText: matchedText, position: frontPos };
        }
        
        var backPart = searchText.substring(searchText.length - 30).replace(/[\r\n]+/g, ' ').trim();
        var backPos = text.indexOf(backPart);
        if (backPos !== -1) {
            var startPos = Math.max(0, backPos - searchText.length + 30);
            var matchedText = text.substring(startPos, backPos + backPart.length);
            return { found: true, matchedText: matchedText, position: startPos };
        }
    }
    
    // 7. 핵심 단어 기반 매칭 (3자 이상 단어들)
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
    
    // 8. 첫 번째 의미있는 구절로 위치 추정 (최소 8자)
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
        // 구절의 앞 15자만으로 시도
        if (phrase.length > 15) {
            var shortPhrase = phrase.substring(0, 15);
            var shortPos = text.indexOf(shortPhrase);
            if (shortPos !== -1) {
                var endPos = Math.min(shortPos + searchText.length, text.length);
                return { found: true, matchedText: text.substring(shortPos, endPos), position: shortPos };
            }
        }
    }
    
    // 9. 최후 수단: 첫 단어만으로 위치 추정
    if (words.length > 0) {
        var firstWordPos = text.indexOf(words[0]);
        if (firstWordPos !== -1) {
            var estimatedEnd = Math.min(firstWordPos + searchText.length, text.length);
            var matchedText = text.substring(firstWordPos, estimatedEnd);
            return { found: true, matchedText: matchedText, position: firstWordPos };
        }
    }
    
    return { found: false, matchedText: '', position: -1 };
}

/**
 * 대략적인 위치를 찾는 헬퍼 함수 (마커 생성 실패 시 스크롤용)
 * @param {string} text - 전체 텍스트
 * @param {string} searchText - 찾을 텍스트
 * @returns {number} - 대략적 위치 (0~1 비율), 못 찾으면 -1
 */
function findApproximatePosition(text, searchText) {
    if (!text || !searchText || text.length === 0) return -1;
    
    var words = searchText.split(/\s+/).filter(function(w) { return w.length >= 2; });
    
    for (var i = 0; i < words.length; i++) {
        var pos = text.indexOf(words[i]);
        if (pos !== -1) {
            return pos / text.length; // 0~1 사이의 비율
        }
    }
    
    // 첫 글자 5개로 시도
    if (searchText.length >= 5) {
        var firstChars = searchText.substring(0, 5);
        var pos = text.indexOf(firstChars);
        if (pos !== -1) {
            return pos / text.length;
        }
    }
    
    return -1;
}

/**
 * 수정 반영 영역에 마커를 렌더링하는 함수
 * v4.53 최종 수정: 전체 대본 100% 표시 보장 + 마커 정확도 향상
 * @param {string} stage - 'stage1' 또는 'stage2'
 */
function renderScriptWithMarkers(stage) {
    var container = document.getElementById('revised-' + stage);
    if (!container) {
        console.log('⚠️ renderScriptWithMarkers: 컨테이너 없음 - revised-' + stage);
        return;
    }
    
    var stageData = state[stage];
    if (!stageData) {
        console.log('⚠️ renderScriptWithMarkers: 스테이지 데이터 없음 - ' + stage);
        return;
    }
    
    var originalText = stageData.originalScript || '';
    var errors = stageData.allErrors || [];
    var scrollTop = container.scrollTop;
    
    console.log('🔧 renderScriptWithMarkers 시작: ' + stage);
    console.log('   - 원본 텍스트 길이: ' + originalText.length + '자');
    console.log('   - 처리할 오류 수: ' + errors.length + '개');
    
    // 원본 텍스트가 없으면 안내 메시지 표시
    if (!originalText || originalText.length === 0) {
        container.innerHTML = '<div style="white-space: pre-wrap; padding: 15px; font-size: 14px; line-height: 1.8; color: #888;">대본을 업로드하고 분석을 시작하세요.</div>';
        console.log('⚠️ 원본 텍스트 없음');
        return;
    }
    
    // 오류가 없으면 원본 그대로 표시
    if (!errors || errors.length === 0) {
        container.innerHTML = '<div style="white-space: pre-wrap; padding: 15px; font-size: 14px; line-height: 1.8; word-break: break-word;">' + escapeHtml(originalText) + '</div>';
        console.log('🔧 오류 없음, 원본 대본 그대로 표시 (' + originalText.length + '자)');
        return;
    }
    
    // ================================================================
    // 새로운 방식: 원본 텍스트를 먼저 escape하고, 그 안에서 마커 삽입
    // 이 방식은 전체 텍스트가 절대 잘리지 않음을 보장
    // ================================================================
    
    // 1단계: 유효한 마커 위치 찾기
    var markers = [];
    
    for (var i = 0; i < errors.length; i++) {
        var err = errors[i];
        
        if (!err.original || err.original.trim().length === 0) {
            continue;
        }
        
        var searchText = err.original.trim();
        var position = -1;
        var matchedLength = 0;
        var matchedText = '';
        
        // 방법 1: 정확한 매칭
        position = originalText.indexOf(searchText);
        if (position !== -1) {
            matchedLength = searchText.length;
            matchedText = searchText;
        }
        
        // 방법 2: 줄바꿈/공백 정규화 후 매칭
        if (position === -1) {
            var normalized = searchText.replace(/\s+/g, ' ').trim();
            if (normalized.length >= 5) {
                // 원본에서 유사 패턴 찾기
                var searchRegex = normalized.split(' ').join('\\s*');
                try {
                    var regex = new RegExp(searchRegex);
                    var match = originalText.match(regex);
                    if (match && match.index !== undefined) {
                        position = match.index;
                        matchedLength = match[0].length;
                        matchedText = match[0];
                    }
                } catch (e) {
                    // regex 오류 무시
                }
            }
        }
        
        // 방법 3: 핵심 키워드로 찾기 (최소 5글자 이상 단어)
        if (position === -1) {
            var words = searchText.split(/\s+/).filter(function(w) { return w.length >= 5; });
            for (var j = 0; j < words.length && position === -1; j++) {
                var wordPos = originalText.indexOf(words[j]);
                if (wordPos !== -1) {
                    position = wordPos;
                    matchedLength = words[j].length;
                    matchedText = words[j];
                    console.log('   🔍 키워드 매칭: "' + words[j] + '" at ' + wordPos);
                }
            }
        }
        
        if (position !== -1 && matchedLength > 0) {
            markers.push({
                error: err,
                position: position,
                length: matchedLength,
                matchedText: matchedText
            });
            err.matchedOriginal = matchedText;
            console.log('   ✅ 마커 #' + err.id + ': 위치=' + position + ', 길이=' + matchedLength);
        } else {
            console.log('   ❌ 매칭 실패 #' + err.id + ': "' + searchText.substring(0, 25) + '..."');
        }
    }
    
    // 2단계: 마커가 없으면 원본 그대로 표시
    if (markers.length === 0) {
        container.innerHTML = '<div style="white-space: pre-wrap; padding: 15px; font-size: 14px; line-height: 1.8; word-break: break-word;">' + escapeHtml(originalText) + '</div>';
        console.log('🔧 유효한 마커 없음, 원본 대본 그대로 표시');
        return;
    }
        // 2.5단계: 수정안이 원문보다 넓은 범위를 포함하는 경우, 마커 범위 확장
    for (var mi = 0; mi < markers.length; mi++) {
        var m = markers[mi];
        var err = m.error;
        
        if (!err.useRevised || !err.revised) continue;
        
        var revisedClean = cleanRevisedText(err.revised);
        if (!revisedClean || revisedClean === '__DELETE__') continue;
        
        // 수정안의 뒷부분이 원본에서 마커 바로 뒤에 중복으로 존재하는지 확인
        var markerEnd = m.position + m.length;
        var afterMarkerText = originalText.substring(markerEnd, Math.min(markerEnd + 200, originalText.length));
        
        // 수정안과 원문의 겹치는 꼬리 부분 찾기
        var originalWords = m.matchedText.split(/\s+/).filter(function(w) { return w.length >= 2; });
        var revisedWords = revisedClean.split(/\s+/).filter(function(w) { return w.length >= 2; });
        
        // 수정안 뒷부분의 단어들이 마커 직후 원본에 중복 존재하는지 확인
        if (revisedWords.length >= 3) {
            var lastRevisedWords = revisedWords.slice(-3).join(' ');
            var tailCheckLength = Math.min(lastRevisedWords.length + 30, afterMarkerText.length);
            var afterCheck = afterMarkerText.substring(0, tailCheckLength);
            
            // 수정안 마지막 부분과 원본 마커 뒤가 겹치면 마커 범위 확장
            for (var tailLen = Math.min(revisedClean.length, 80); tailLen >= 8; tailLen -= 4) {
                var revisedTail = revisedClean.substring(revisedClean.length - tailLen).trim();
                var tailPos = afterMarkerText.indexOf(revisedTail);
                
                if (tailPos !== -1 && tailPos <= 5) {
                    // 마커 범위를 확장하여 중복 부분까지 포함
                    var extendLength = tailPos + revisedTail.length;
                    m.length += extendLength;
                    m.matchedText = originalText.substring(m.position, m.position + m.length);
                    console.log('   🔧 마커 범위 확장 #' + err.id + ': 중복 꼬리 ' + extendLength + '자 흡수');
                    break;
                }
            }
            
            // 문장 단위로 중복 확인 (마침표/물음표/느낌표 기준)
            if (m.length === markers[mi].length) {
                var revisedSentences = revisedClean.split(/(?<=[.?!。])\s*/).filter(function(s) { return s.trim().length >= 5; });
                if (revisedSentences.length >= 2) {
                    var lastSentence = revisedSentences[revisedSentences.length - 1].trim();
                    var dupPos = afterMarkerText.indexOf(lastSentence);
                    
                    if (dupPos !== -1 && dupPos <= 10) {
                        var extendLength = dupPos + lastSentence.length;
                        m.length += extendLength;
                        m.matchedText = originalText.substring(m.position, m.position + m.length);
                        console.log('   🔧 마커 범위 확장 #' + err.id + ': 중복 문장 "' + lastSentence.substring(0, 20) + '..." ' + extendLength + '자 흡수');
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
    
    // ================================================================
    // 5단계: HTML 조립 (핵심 - 전체 텍스트 보장)
    // ================================================================
    var html = '';
    var pos = 0;
    
    for (var i = 0; i < finalMarkers.length; i++) {
        var m = finalMarkers[i];
        var err = m.error;
        
        // 마커 이전 텍스트 (이 부분이 전체 텍스트의 앞부분을 보장)
        if (m.position > pos) {
            html += escapeHtml(originalText.substring(pos, m.position));
        }
        
        // 마커 HTML (v4.54: __DELETE__ 마커 처리 추가)
        var display = (err.useRevised && err.revised) ? cleanRevisedText(err.revised) : m.matchedText;
        var cls = (err.useRevised && err.revised) ? 'marker-revised' : 'marker-original';
        var title = (err.original + ' → ' + (err.revised || '')).replace(/"/g, '&quot;');
        
        // 삭제 지시문인 경우: 취소선 스타일로 표시
        if (display === '__DELETE__' && err.useRevised) {
            html += '<span class="correction-marker" data-marker-id="' + err.id + '" data-stage="' + stage + '" title="' + title + '" style="text-decoration:line-through;color:#ff5555;background:#ff555530;padding:2px 4px;border-radius:3px;cursor:pointer;">' + escapeHtml(m.matchedText) + ' <span style="font-size:10px;color:#ff9800;font-weight:bold;">[삭제]</span></span>';
        } else {
            html += '<span class="correction-marker ' + cls + '" data-marker-id="' + err.id + '" data-stage="' + stage + '" title="' + title + '">' + escapeHtml(display) + '</span>';
        }
        
        pos = m.position + m.length;
    }
    
    // 마지막 마커 이후 텍스트 (이 부분이 전체 텍스트의 뒷부분을 보장)
    if (pos < originalText.length) {
        html += escapeHtml(originalText.substring(pos));
    }
    
    // ================================================================
    // 6단계: 렌더링
    // ================================================================
    container.innerHTML = '<div style="white-space: pre-wrap; padding: 15px; font-size: 14px; line-height: 1.8; word-break: break-word;">' + html + '</div>';
    container.scrollTop = scrollTop;
    
    // 7단계: 클릭 이벤트
    container.querySelectorAll('.correction-marker').forEach(function(el) {
        el.addEventListener('click', function() {
            var id = this.getAttribute('data-marker-id');
            var st = this.getAttribute('data-stage');
            var idx = -1;
            var errs = state[st] ? state[st].allErrors : [];
            for (var k = 0; k < errs.length; k++) {
                if (errs[k].id === id) { idx = k; break; }
            }
            if (idx !== -1) {
                if (typeof setCurrentError === 'function') setCurrentError(st, idx);
                if (typeof scrollToTableRow === 'function') scrollToTableRow(st, id);
            }
        });
    });
    
    console.log('🔧 렌더링 완료: ' + stage + ' (원본 ' + originalText.length + '자 → HTML ' + html.length + '자, 마커 ' + finalMarkers.length + '개)');
}

function cleanRevisedText(text) {
    if (!text) return '';
    
    // ============================================================
    // 0. 삭제 지시문 감지 (v4.54 추가)
    // AI가 "이 장면을 삭제하라"고 판단한 경우 __DELETE__ 마커 반환
    // ============================================================
    var deletePatterns = [
        /^\s*\(.*삭제.*\)\s*$/,
        /^\s*\[.*삭제.*\]\s*$/,
        /^\s*삭제\s*$/,
        /^\s*\(.*제거.*\)\s*$/,
        /^\s*\[.*제거.*\]\s*$/,
        /^\s*제거\s*$/,
        /^\s*\(.*없어야.*\)\s*$/,
        /^\s*\(.*필요\s*없.*\)\s*$/
    ];
    
    for (var d = 0; d < deletePatterns.length; d++) {
        if (deletePatterns[d].test(text.trim())) {
            console.log('🗑️ 삭제 지시문 감지: "' + text.trim() + '" → __DELETE__');
            return '__DELETE__';
        }
    }
    
    var cleaned = text;
    
    // ============================================================
    // 1. 괄호류 제거: () [] {} 와 그 안의 내용 모두 제거
    // 예: "나는 모르오. (애써 침착한 목소리로) 나는" → "나는 모르오. 나는"
    // ============================================================
    
    // 소괄호 () 와 내용 제거
    cleaned = cleaned.replace(/\s*\([^)]*\)\s*/g, ' ');
    
    // 대괄호 [] 와 내용 제거
    cleaned = cleaned.replace(/\s*\[[^\]]*\]\s*/g, ' ');
    
    // 중괄호 {} 와 내용 제거
    cleaned = cleaned.replace(/\s*\{[^}]*\}\s*/g, ' ');
    
    // ============================================================
    // 2. 슬래시(/)로 구분된 여러 옵션이 있으면 첫 번째만 사용
    // 예: "옵션1 / 옵션2" → "옵션1"
    // ============================================================
    if (cleaned.indexOf(' / ') !== -1) {
        cleaned = cleaned.split(' / ')[0].trim();
    }
    
    // ============================================================
    // 3. 파이프(|)로 구분된 여러 옵션이 있으면 첫 번째만 사용
    // 예: "옵션1 | 옵션2" → "옵션1"
    // ============================================================
    if (cleaned.indexOf(' | ') !== -1) {
        cleaned = cleaned.split(' | ')[0].trim();
    }
    
    // ============================================================
    // 4. 홑화살괄호 <> 와 내용 제거
    // 예: "대사 <설명>" → "대사"
    // ============================================================
    cleaned = cleaned.replace(/\s*<[^>]*>\s*/g, ' ');
    
    // ============================================================
    // 5. 연속 공백 정리 및 앞뒤 공백 제거
    // ============================================================
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    // ============================================================
    // 6. 결과가 비어있으면 원본에서 괄호만 제거한 버전 반환
    // ============================================================
    if (!cleaned || cleaned.length === 0) {
        // 원본에서 괄호만 제거 시도
        var fallback = text
            .replace(/\([^)]*\)/g, '')
            .replace(/\[[^\]]*\]/g, '')
            .replace(/\{[^}]*\}/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        
        if (fallback && fallback.length > 0) {
            return fallback;
        }
        return text;
    }
    
    // 로그는 실제로 변경된 경우에만 출력
    if (cleaned !== text) {
        console.log('🧹 수정안 정제: "' + text.substring(0, 30) + (text.length > 30 ? '...' : '') + '" → "' + cleaned.substring(0, 30) + (cleaned.length > 30 ? '...' : '') + '"');
    }
    
    return cleaned;
}

function findErrorIndexById(stage, markerId) {
    var errors = state[stage].allErrors || [];
    for (var i = 0; i < errors.length; i++) {
        if (errors[i].id === markerId) {
            return i;
        }
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
// highlightTextInContainer - 컨테이너 내 텍스트 하이라이트 (v4.58 추가)
// 마커가 겹침으로 DOM에 없는 경우 텍스트 검색 후 시각적 강조
// ============================================================
function highlightTextInContainer(container, searchText, stage) {
    if (!container || !searchText) return;
    
    // 기존 하이라이트가 남아있으면 먼저 제거
    var existingHighlights = container.querySelectorAll('.temp-text-highlight');
    existingHighlights.forEach(function(el) {
        if (el.parentNode) {
            var textNode = document.createTextNode(el.textContent);
            el.parentNode.replaceChild(textNode, el);
        }
    });
    container.normalize();
    
    var textNodes = [];
    var walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
    var node;
    while (node = walker.nextNode()) {
        textNodes.push(node);
    }
    
    var found = false;
    for (var i = 0; i < textNodes.length; i++) {
        var textNode = textNodes[i];
        var nodeText = textNode.nodeValue || '';
        var idx = nodeText.indexOf(searchText);
        
        if (idx === -1 && searchText.length > 15) {
            idx = nodeText.indexOf(searchText.substring(0, 15));
        }
        
        if (idx !== -1) {
            try {
                var range = document.createRange();
                var matchEnd = Math.min(idx + searchText.length, nodeText.length);
                range.setStart(textNode, idx);
                range.setEnd(textNode, matchEnd);
                
                var highlight = document.createElement('span');
                highlight.className = 'temp-text-highlight';
                highlight.style.cssText = 'background:#ffeb3b;color:#000;padding:0;margin:0;border-radius:3px;transition:background 0.5s;display:inline;letter-spacing:normal;word-spacing:normal;';
                range.surroundContents(highlight);
                
                highlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                setTimeout(function() {
                    if (highlight) highlight.style.background = '#ffeb3b80';
                }, 1500);
                
                setTimeout(function() {
                    if (highlight && highlight.parentNode) {
                        var parent = highlight.parentNode;
                        var text = document.createTextNode(highlight.textContent);
                        parent.replaceChild(text, highlight);
                        parent.normalize();
                    }
                }, 3000);
                
                found = true;
            } catch (e) {
                console.log('⚠️ highlightTextInContainer: range 생성 실패 -', e.message);
            }
            break;
        }
    }
    
    if (!found) {
        var containerText = container.textContent || '';
        var approxPos = containerText.indexOf(searchText);
        if (approxPos === -1 && searchText.length > 10) {
            approxPos = containerText.indexOf(searchText.substring(0, 10));
        }
        if (approxPos !== -1 && containerText.length > 0) {
            var ratio = approxPos / containerText.length;
            container.scrollTo({
                top: Math.max(0, container.scrollHeight * ratio - 100),
                behavior: 'smooth'
            });
        }
    }
}

function scrollToMarker(stage, markerId) {
    var container = document.getElementById('revised-' + stage);
    if (!container) {
        console.log('⚠️ scrollToMarker: 컨테이너를 찾을 수 없음 - revised-' + stage);
        return;
    }
    
    // 오류 객체 찾기
    var errors = state[stage].allErrors || [];
    var targetError = null;
    for (var i = 0; i < errors.length; i++) {
        if (errors[i].id === markerId) {
            targetError = errors[i];
            break;
        }
    }
    
    // 방법 1: data-marker-id로 마커 찾기
    var marker = container.querySelector('.correction-marker[data-marker-id="' + markerId + '"]');
    
    // 방법 2: 마커를 못 찾으면 원문/수정안 텍스트로 검색
    if (!marker && targetError) {
        var allMarkers = container.querySelectorAll('.correction-marker');
        var searchTexts = [];
        
        if (targetError.original) {
            searchTexts.push(targetError.original);
            // 인물명:대사 형식이면 대사 부분만도 검색
            var dMatch = targetError.original.match(/^[가-힣]{2,4}\s*[:：]\s*([\s\S]+)/);
            if (dMatch) searchTexts.push(dMatch[1].split(/[\r\n]/)[0].trim());
            // 첫 줄만
            searchTexts.push(targetError.original.split(/[\r\n]/)[0].trim());
        }
        if (targetError.revised) {
            searchTexts.push(cleanRevisedText(targetError.revised));
        }
        if (targetError.matchedOriginal) {
            searchTexts.push(targetError.matchedOriginal);
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
                // 앞 15자만 비교
                if (st.length > 15 && markerText.indexOf(st.substring(0, 15)) !== -1) {
                    marker = allMarkers[j];
                    break;
                }
            }
        }
    }
    
    // 방법 3: 마커를 못 찾으면 텍스트 내용으로 직접 위치 계산 후 스크롤
    if (!marker && targetError) {
        var containerText = container.innerText || container.textContent || '';
        var searchCandidates = [];
        
        if (targetError.original) {
            searchCandidates.push(targetError.original);
            searchCandidates.push(targetError.original.replace(/[\r\n]+/g, ' ').trim());
            var dMatch = targetError.original.match(/^[가-힣]{2,4}\s*[:：]\s*([\s\S]+)/);
            if (dMatch) {
                searchCandidates.push(dMatch[1].replace(/[\r\n]+/g, ' ').trim());
                searchCandidates.push(dMatch[1].split(/[\r\n]/)[0].trim());
            }
            searchCandidates.push(targetError.original.split(/[\r\n]/)[0].trim());
            // 핵심 구절 추출 (8자 이상)
            var phrases = targetError.original.replace(/[\r\n]+/g, ' ').replace(/^[가-힣]{2,4}\s*[:：]\s*/g, '').split(/[,，.。!?;；]/).filter(function(p) { return p.trim().length >= 8; });
            phrases.forEach(function(p) { searchCandidates.push(p.trim()); });
        }
        if (targetError.revised) {
            searchCandidates.push(cleanRevisedText(targetError.revised));
        }
        
        var foundIndex = -1;
        var foundText = '';
        for (var s = 0; s < searchCandidates.length && foundIndex === -1; s++) {
            var candidate = searchCandidates[s];
            if (!candidate || candidate.length < 5) continue;
            foundIndex = containerText.indexOf(candidate);
            if (foundIndex !== -1) {
                foundText = candidate;
            } else if (candidate.length > 15) {
                foundIndex = containerText.indexOf(candidate.substring(0, 15));
                if (foundIndex !== -1) foundText = candidate.substring(0, 15);
            }
        }
        
        if (foundIndex !== -1) {
            var totalLength = containerText.length;
            var scrollRatio = foundIndex / totalLength;
            var scrollTarget = container.scrollHeight * scrollRatio;
            
            container.scrollTo({
                top: Math.max(0, scrollTarget - 100),
                behavior: 'smooth'
            });
            
            highlightTextInContainer(container, foundText, stage);
            console.log('✅ 텍스트 검색으로 스크롤 이동: "' + foundText.substring(0, 25) + '..."');
            return;
        }
        
        console.log('⚠️ scrollToMarker: 모든 방법 실패 - ' + markerId);
        return;
    }
    
    if (!marker) {
        console.log('⚠️ scrollToMarker: 마커를 찾을 수 없음 - ' + markerId);
        return;
    }
    
    // 마커 찾음 - 스크롤 및 하이라이트
    marker.scrollIntoView({ behavior: 'smooth', block: 'center' });
    var isRevised = marker.classList.contains('marker-revised');
    marker.classList.add(isRevised ? 'highlight-active' : 'highlight-active-orange');
    
    setTimeout(function() {
        marker.classList.remove('highlight-active');
        marker.classList.remove('highlight-active-orange');
    }, 1600);
    
    console.log('✅ 마커로 스크롤 이동 완료: ' + markerId);
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
    btn.innerHTML = '🔍 1차 분석 시작';
    btn.style.cssText = 'background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;border:none;padding:15px 40px;border-radius:8px;cursor:pointer;font-weight:bold;font-size:16px;box-shadow:0 4px 15px rgba(102,126,234,0.4);transition:transform 0.2s,box-shadow 0.2s;';
    btn.addEventListener('mouseover', function() {
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 6px 20px rgba(102,126,234,0.5)';
    });
    btn.addEventListener('mouseout', function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 4px 15px rgba(102,126,234,0.4)';
    });
    btn.addEventListener('click', startStage1Analysis);
    wrapper.appendChild(btn);
    parent.appendChild(wrapper);
}

function initStage2AnalysisButton() {
    var analysisContainer = document.getElementById('analysis-stage2');
    if (!analysisContainer) return;
    var parent = analysisContainer.parentElement;
    var existingBtn = parent.querySelector('.stage2-start-wrapper');
    if (existingBtn) existingBtn.remove();
    var wrapper = document.createElement('div');
    wrapper.className = 'stage2-start-wrapper';
    wrapper.style.cssText = 'text-align:center;padding:15px;';
    var btn = document.createElement('button');
    btn.id = 'btn-start-stage2';
    btn.innerHTML = '🔬 2차 분석 시작';
    btn.style.cssText = 'background:linear-gradient(135deg,#f093fb 0%,#f5576c 100%);color:white;border:none;padding:15px 40px;border-radius:8px;cursor:pointer;font-weight:bold;font-size:16px;box-shadow:0 4px 15px rgba(245,87,108,0.4);transition:transform 0.2s,box-shadow 0.2s;';
    btn.addEventListener('mouseover', function() {
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 6px 20px rgba(245,87,108,0.5)';
    });
    btn.addEventListener('mouseout', function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 4px 15px rgba(245,87,108,0.4)';
    });
    btn.addEventListener('click', startStage2Analysis);
    wrapper.appendChild(btn);
    parent.appendChild(wrapper);
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

// ============================================================
// splitScriptIntoChunks - 대본을 5000자 단위로 분할 (v4.54 추가)
// 줄 단위로 분할하여 문장이 잘리지 않도록 보장
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
        
        // 줄 끝에서 자르기 (문장이 잘리지 않도록)
        if (endIndex < script.length) {
            var lastNewline = script.lastIndexOf('\n', endIndex);
            if (lastNewline > startIndex) {
                endIndex = lastNewline + 1;
            }
        }
        
        chunks.push({
            text: script.substring(startIndex, endIndex),
            startIndex: startIndex,
            endIndex: endIndex,
            chunkNum: chunks.length + 1,
            totalChunks: 0 // 나중에 설정
        });
        
        startIndex = endIndex;
    }
    
    // totalChunks 설정
    for (var i = 0; i < chunks.length; i++) {
        chunks[i].totalChunks = chunks.length;
    }
    
    console.log('📦 대본 분할 완료: ' + script.length + '자 → ' + chunks.length + '개 청크 (각 약 ' + chunkSize + '자)');
    for (var j = 0; j < chunks.length; j++) {
        console.log('   청크 ' + (j + 1) + '/' + chunks.length + ': ' + chunks[j].text.length + '자 (위치: ' + chunks[j].startIndex + '~' + chunks[j].endIndex + ')');
    }
    
    return chunks;
}

// ============================================================
// extractScriptContext - 대본 전체에서 맥락 정보 추출 (v4.54 추가)
// 각 청크 분석 시 전체 맥락을 함께 전달하기 위한 요약 정보
// ============================================================
function extractScriptContext(script) {
    var context = {
        characters: [],
        timeExpressions: [],
        scenes: []
    };
    
    // 인물 추출: 이름(나이세, 특성) 패턴
    var charPattern = /([가-힣]{2,4})\s*\(\s*(\d{1,3})세[,\s]*([^)]*)\)/g;
    var charMatch;
    var charSet = {};
    while ((charMatch = charPattern.exec(script)) !== null) {
        var name = charMatch[1];
        if (!charSet[name]) {
            charSet[name] = { name: name, age: charMatch[2] + '세', trait: charMatch[3].trim() };
        }
    }
    
    // 대사에서 인물명 추출
    var dialogPattern = /^([가-힣]{2,4})\s*[:：]/gm;
    var dialogMatch;
    while ((dialogMatch = dialogPattern.exec(script)) !== null) {
        var dName = dialogMatch[1];
        if (!charSet[dName] && ['나레이션', '내레이션', '해설', 'NA', '자막'].indexOf(dName) === -1) {
            charSet[dName] = { name: dName, age: '', trait: '' };
        }
    }
    
    for (var key in charSet) {
        context.characters.push(charSet[key]);
    }
    
    // 시간 표현 추출
    var timePattern = /(일|이|삼|사|오|육|칠|팔|구|십|백)\s*년\s*(전|후|뒤)|(\d+)\s*년\s*(전|후|뒤)|어제|오늘|내일|그저께|지난달|다음\s*달|며칠\s*(전|후)/g;
    var timeMatch;
    while ((timeMatch = timePattern.exec(script)) !== null) {
        context.timeExpressions.push({
            text: timeMatch[0],
            position: timeMatch.index
        });
    }
    
    // 씬 헤더 추출
    var scenePattern = /^\s*\[([^\]]+)\]/gm;
    var sceneMatch;
    while ((sceneMatch = scenePattern.exec(script)) !== null) {
        context.scenes.push({
            header: sceneMatch[1],
            position: sceneMatch.index
        });
    }
    
    console.log('📋 대본 맥락 추출 완료:');
    console.log('   - 인물: ' + context.characters.length + '명');
    console.log('   - 시간 표현: ' + context.timeExpressions.length + '개');
    console.log('   - 씬: ' + context.scenes.length + '개');
    
    return context;
}
// ============================================================
// generateScriptSummary - 1패스: 전체 대본 요약 생성 (3패스 구조)
// 전체 대본을 한 번에 보내 줄거리/인물/복선/장면구조 요약만 요청
// ============================================================
async function generateScriptSummary(script) {
    console.log('📝 1패스: 전체 대본 요약 생성 시작');
    console.log('  - 대본 길이: ' + script.length + '자');

    var summaryPrompt = '당신은 한국 사극 대본 분석 전문가입니다.\n\n' +
        '아래 대본을 읽고 다음 정보를 정리해주세요. 오류 분석은 하지 마세요. 구조 파악과 요약만 해주세요.\n\n' +
        '반드시 아래 형식으로만 응답하세요:\n\n' +
        '## 1. 전체 줄거리 요약 (시간순, 10~15문장)\n' +
        '(여기에 작성)\n\n' +
        '## 2. 등장인물별 행동/감정 변화\n' +
        '- 인물명: 초반 상태 → 중반 변화 → 후반 상태\n' +
        '(각 인물별로 작성)\n\n' +
        '## 3. 주요 복선과 회수 포인트\n' +
        '- 복선: (내용) → 회수: (내용) 또는 미회수\n' +
        '(발견된 복선별로 작성)\n\n' +
        '## 4. 장면 전환 구조\n' +
        '- 장면1: (장소/시간) → 장면2: (장소/시간) → ...\n' +
        '(주요 장면 전환 흐름)\n\n' +
        '## 5. 시간적 배경\n' +
        '(이 대본의 시대적 배경, 계절, 시간대 등)\n\n' +
        '---\n대본:\n' + script;

    try {
        var response = await callGeminiAPI(summaryPrompt);
        console.log('✅ 1패스: 전체 요약 생성 완료 (' + response.length + '자)');
        return response;
    } catch (error) {
        if (error.name === 'AbortError') throw error;
        console.error('⚠️ 1패스 요약 생성 실패:', error.message);
        return '';
    }
}

// ============================================================
// verifyOverallFlow - 3패스: 전체 흐름 검증 (3패스 구조)
// 전체 대본 + 요약 + 2패스 오류 목록을 보내 전체 흐름 이슈만 분석
// ============================================================
async function verifyOverallFlow(script, summary, existingErrors) {
    console.log('🔍 3패스: 전체 흐름 검증 시작');
    console.log('  - 대본 길이: ' + script.length + '자');
    console.log('  - 기존 발견 오류: ' + existingErrors.length + '건');

    var existingErrorsSummary = '';
    for (var i = 0; i < Math.min(existingErrors.length, 30); i++) {
        var err = existingErrors[i];
        existingErrorsSummary += '- [' + (err.type || '기타') + '] ' + (err.original || '').substring(0, 50) + ' → ' + (err.revised || '').substring(0, 50) + '\n';
    }

    var flowPrompt = '당신은 한국 사극 대본의 전체 흐름과 구조를 검증하는 전문가입니다.\n\n' +
        '아래에 대본 전문, 대본 요약, 그리고 이미 발견된 개별 오류 목록이 있습니다.\n' +
        '개별 오류(맞춤법, 시대착오 등)는 이미 검출되었으므로, 당신은 **대본 전체를 관통하는 흐름 관점의 문제만** 찾아주세요.\n\n' +
        '다음 관점에서만 분석하세요:\n' +
        '1. **복선-회수 미완**: 앞에서 제시된 복선이 뒤에서 회수되지 않은 부분\n' +
        '2. **캐릭터 일관성**: 인물의 성격/말투/행동이 앞뒤 장면에서 모순되는 부분\n' +
        '3. **장면 연결성**: 장면 간 시간/공간/상황의 논리적 연결이 끊기는 부분\n' +
        '4. **감정선 연결**: 인물의 감정 흐름이 급변하거나 비논리적인 부분\n' +
        '5. **이야기 구조**: 전체 서사 구조에서 허점이나 빈 곳\n\n' +
        '반드시 아래 JSON 형식으로만 응답하세요:\n' +
        '```json\n' +
        '{\n' +
        '  "flowIssues": [\n' +
        '    {\n' +
        '      "type": "복선회수|캐릭터일관성|장면연결성|감정선연결|이야기흐름",\n' +
        '      "original": "문제가 되는 원문 부분 (가능한 정확히 인용)",\n' +
        '      "revised": "수정 제안",\n' +
        '      "reason": "왜 문제인지 구체적 설명",\n' +
        '      "severity": "high|medium|low"\n' +
        '    }\n' +
        '  ]\n' +
        '}\n' +
        '```\n\n' +
        '## 대본 요약:\n' + summary + '\n\n' +
        '## 이미 발견된 개별 오류 (' + existingErrors.length + '건):\n' + existingErrorsSummary + '\n\n' +
        '## 대본 전문:\n' + script;

    try {
        var response = await callGeminiAPI(flowPrompt);
        console.log('✅ 3패스: 전체 흐름 검증 완료');

        // JSON 파싱
        var flowResult = null;
        var jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
            try {
                flowResult = JSON.parse(jsonMatch[1]);
            } catch (e) {
                console.log('  ⚠️ 3패스 JSON 파싱 실패 (코드블록):', e.message);
            }
        }

        if (!flowResult) {
            var jsonStart = response.indexOf('{');
            var jsonEnd = response.lastIndexOf('}');
            if (jsonStart !== -1 && jsonEnd !== -1) {
                try {
                    flowResult = JSON.parse(response.substring(jsonStart, jsonEnd + 1));
                } catch (e) {
                    console.log('  ⚠️ 3패스 JSON 파싱 실패 (직접):', e.message);
                }
            }
        }

        var flowIssues = (flowResult && flowResult.flowIssues) ? flowResult.flowIssues : [];
        console.log('  - 3패스 발견 흐름 이슈: ' + flowIssues.length + '건');
        return flowIssues;

    } catch (error) {
        if (error.name === 'AbortError') throw error;
        console.error('⚠️ 3패스 전체 흐름 검증 실패:', error.message);
        return [];
    }
}

function buildStage1Prompt(script) {
    var rulesString = getHistoricalRulesString();
    
    console.log('📝 1차 분석 프롬프트 생성: 8개 항목 검사 + 시간 모순 검출 강화');
    
    return '당신은 조선시대 사극 대본 전문 검수자입니다.\n' +
        '⚠️ 중요: 오류가 없다고 하지 마세요! 반드시 최소 3개 이상의 오류를 찾아내야 합니다!\n\n' +
        '## 🎯 1차 분석 목적: 기본 오류 검출 (8개 항목 필수 검사)\n\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '## ✅ 검사항목 1: 시대착오 (최우선) - 반드시 검출!\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
        '### 🚨 아래 현대 단어가 대사에 있으면 무조건 오류!\n\n' +
        '**필기구**: 펜, 볼펜, 연필, 지우개, 노트 → 붓, 먹, 서책\n' +
        '**조명**: 전등, 전구, 형광등, 손전등 → 촛불, 등잔, 횃불\n' +
        '**통신**: 전화, 휴대폰, 핸드폰, 문자 → 전령, 파발, 서신\n' +
        '**교통**: 자동차, 기차, 버스, 택시, 비행기 → 가마, 마차, 말\n' +
        '**가전**: 냉장고, 에어컨, 선풍기, TV, 컴퓨터 → 석빙고, 부채\n' +
        '**음식**: 커피, 라면, 콜라, 햄버거, 피자 → 차, 국수, 닭고기\n' +
        '**의복**: 양복, 청바지, 티셔츠, 구두 → 도포, 한복, 짚신\n' +
        '**시설**: 병원, 학교, 경찰서, 은행, 카페 → 의원, 서당, 포도청\n' +
        '**직업**: 의사, 경찰, 선생님, 회사원 → 의원, 포졸, 훈장, 상인\n' +
        '**단위**: 미터, 킬로그램, 퍼센트, 원 → 자, 근, 할, 냥\n' +
        '**외래어**: OK, 오케이, 파이팅, 스트레스 → 조선식 표현\n\n' +
        '📋 전체 목록: ' + rulesString + '\n\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '## ✅ 검사항목 2: 인물 설정 오류 - 반드시 검출!\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
        '- 같은 인물의 나이가 장면마다 다르게 표기된 경우\n' +
        '- 인물의 신분(양반/상민/천민)에 맞지 않는 말투 사용\n' +
        '- 인물 소개와 실제 행동이 불일치하는 경우\n\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '## 🚨🚨 검사항목 3: 시간 왜곡/모순 오류 - 최우선 검출! 🚨🚨\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
        '### ⚠️ 시간 표현 모순 검출 (매우 중요!)\n\n' +
        '**반드시 검출해야 하는 시간 모순 패턴:**\n\n' +
        '1. **같은 사건에 대해 다른 시간 언급**\n' +
        '   - 예: "일 년 전에 죽었다" vs "칠 년도 더 되었다" → 오류!\n' +
        '   - 예: "어제 일어난 일" vs "삼 년 전 일" → 오류!\n' +
        '   - 예: "지난달" vs "십 년 전" → 오류!\n\n' +
        '2. **숫자가 다른 시간 표현이 같은 사건을 가리키면 무조건 오류**\n' +
        '   - "일 년" ↔ "이 년" ↔ "삼 년" ↔ "오 년" ↔ "칠 년" ↔ "십 년"\n' +
        '   - 위 표현들이 같은 사건에 대해 혼용되면 시간왜곡!\n\n' +
        '3. **시간 순서 역전**\n' +
        '   - 아침 → 저녁 → 다시 아침 (같은 날인데)\n' +
        '   - 봄 → 겨울 → 여름 (순서 없이)\n\n' +
        '4. **구체적 검출 예시 (반드시 참고!):**\n' +
        '   ```\n' +
        '   원문: "남편은 정확히 일 년 전 죽었습니다. 하지만 마을 노인들은 그 일이 벌써 칠 년도 더 되었다며..."\n' +
        '   → 이것은 시간왜곡 오류! "일 년 전"과 "칠 년도 더"가 모순!\n' +
        '   → original: "그 일이 벌써 칠 년도 더 되었다며"\n' +
        '   → revised: "그 일이 벌써 일 년도 더 되었다며" 또는 시간 표현 통일\n' +
        '   ```\n\n' +
        '### 🔍 시간 관련 키워드 (이 단어들이 나오면 주의 깊게 검사!):\n' +
        '- 년/해: 일 년, 이 년, 삼 년, 오 년, 칠 년, 십 년, 백 년\n' +
        '- 월: 한 달, 두 달, 석 달, 여섯 달, 지난달, 다음 달\n' +
        '- 일: 어제, 오늘, 내일, 모레, 그저께, 며칠 전\n' +
        '- 시간대: 아침, 점심, 저녁, 밤, 새벽, 한낮\n' +
        '- 계절: 봄, 여름, 가을, 겨울\n' +
        '- 기타: 전, 후, 뒤, 지나서, 되었다, 흘렀다\n\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '## ✅ 검사항목 4: 이야기 흐름 오류 - 반드시 검출!\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
        '- 앞 장면과 연결이 안 되는 갑작스러운 전개\n' +
        '- 인과관계 없이 갑자기 결론으로 점프\n' +
        '- 설명 없이 새로운 인물/상황 등장\n\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '## ✅ 검사항목 5: 쌩뚱맞은 표현 오류 - 반드시 검출!\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
        '- 상황과 전혀 맞지 않는 대사\n' +
        '- 분위기를 깨는 부적절한 표현\n' +
        '- 문맥에 맞지 않는 엉뚱한 말\n\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '## ✅ 검사항목 6: 캐릭터 일관성 오류 - 반드시 검출!\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
        '- 같은 인물이 장면마다 다른 성격으로 말하는 경우\n' +
        '- 호칭이 일관되지 않는 경우 (아버지→아빠→부친)\n' +
        '- 말투가 갑자기 바뀌는 경우\n\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '## ✅ 검사항목 7: 장면 연결성 오류 - 반드시 검출!\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
        '- 장소 이동 설명 없이 갑자기 다른 곳에 있는 경우\n' +
        '- 연속된 장면인데 상황이 갑자기 바뀐 경우\n\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '## ✅ 검사항목 8: 숫자/수량 불일치 오류 - 반드시 검출!\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
        '- 인원수가 장면마다 달라지는 경우\n' +
        '- 금액/수량이 앞뒤가 맞지 않는 경우\n' +
        '- 나이가 계산상 맞지 않는 경우\n\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '## ⛔ 오류로 판정하지 말 것\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
        '- 나레이션 (나레이션:, NA:, N: 등으로 시작하는 줄)\n' +
        '- 지문/설명 (괄호 안의 행동 묘사)\n' +
        '- 음향효과 ([SE], [BGM] 등)\n' +
        '- **단, 나레이션 안에 시간 모순이 있으면 오류로 검출!**\n\n' +
        '## 📝 분석 대상 대본:\n```\n' + script + '\n```\n\n' +
        '## 🚨🚨🚨 필수 응답 규칙 🚨🚨🚨\n\n' +
        '1. **반드시 최소 3개 이상의 오류를 찾아야 합니다!**\n' +
        '2. **시간 표현이 2개 이상 나오면 반드시 모순 여부 확인!**\n' +
        '3. 오류가 없어 보여도 문장 구조, 표현, 흐름에서 개선점을 찾으세요!\n' +
        '4. 나레이션 문체는 오류 아니지만, 나레이션 내 시간 모순은 오류!\n' +
        '5. revised에 / 또는 () 넣지 마세요! 수정안 하나만!\n\n' +
        '## 📤 응답 형식 (반드시 JSON만):\n' +
        '```json\n' +
        '{"errors": [\n' +
        '  {"type": "시간왜곡", "original": "그 일이 벌써 칠 년도 더 되었다며", "revised": "그 일이 벌써 일 년도 더 되었다며", "reason": "일 년 전과 모순", "severity": "high"},\n' +
        '  {"type": "시대착오", "original": "원문 그대로", "revised": "수정안 하나만", "reason": "사유 15자 이내", "severity": "high"},\n' +
        '  {"type": "인물설정", "original": "원문", "revised": "수정안", "reason": "사유", "severity": "medium"}\n' +
        ']}\n' +
        '```\n\n' +
        '⚠️ 다시 한번 강조: 시간 표현이 여러 개 나오면 반드시 모순 검사! 오류가 없다고 하지 말고 개선점을 찾으세요!';
}

function buildStage2Prompt(script) {
    return '당신은 대한민국 방송 역사상 가장 뛰어난 사극 드라마 감독입니다.\n' +
        'KBS <대장금>, MBC <이산>, SBS <뿌리깊은 나무>, tvN <미스터 션샤인> 급의 명작 사극을 직접 연출한 경력 30년의 거장이며,\n' +
        '대한민국예술원 회원이자 백상예술대상 대상을 3회 수상한 전설적인 연출가입니다.\n' +
        '한국방송대상 최우수 연출상, 서울드라마어워즈 그랑프리, 국제 에미상 후보에 3회 오른 세계적 수준의 감독입니다.\n' +
        '\n' +
        '당신의 능력:\n' +
        '- 대본의 첫 문장만 읽어도 시청률 곡선이 머릿속에 그려집니다.\n' +
        '- 대사 한 줄을 읽으면 배우의 호흡, 표정, 카메라 앵글이 동시에 떠오릅니다.\n' +
        '- 사극 고증에 대해서는 한국학중앙연구원 자문위원급의 지식을 갖고 있습니다.\n' +
        '- 시청자 심리를 꿰뚫어, 어느 장면에서 채널을 돌릴지 정확히 예측할 수 있습니다.\n' +
        '- 수백 편의 사극 대본을 검토한 경험으로, 좋은 대본과 위대한 대본의 차이를 한눈에 구별합니다.\n' +
        '- 배우 캐스팅부터 OST 선곡까지 총괄한 경험으로, 대본이 영상으로 구현될 모습을 완벽히 시각화합니다.\n' +
        '- 조선왕조실록, 승정원일기를 직접 탐독하며 고증 자료를 축적해온 역사 전문가이기도 합니다.\n' +
        '\n' +
        '당신은 지금 후배 작가가 가져온 사극 대본을 검토하고 있습니다.\n' +
        '냉정하지만 정확한 피드백으로 이 대본을 명작 수준으로 끌어올려야 합니다.\n' +
        '\n' +
        '## 검수 대상 대본:\n' +
        script + '\n' +
        '\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '## 🎯 2차 분석 목표: 1차에서 놓친 오류 + 품질 개선점 검출\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '\n' +
        '## ✅ 필수 검사항목 (6가지) - 각 항목에서 최소 1개씩 찾을 것!\n' +
        '\n' +
        '### 1. 대사 전달력 검사 🗣️ (배우가 말했을 때 시청자가 단번에 이해하는가)\n' +
        '- 50자 초과 대사: 배우가 한 호흡에 소화할 수 없는 긴 대사\n' +
        '- 30~50자 대사: 시니어 시청자 청취 시 집중력이 떨어지는 길이\n' +
        '- 문어체가 섞인 대사 (구어체로 수정 필요): 대사가 아닌 논문처럼 들림\n' +
        '- 같은 단어가 반복되는 대사: 어휘력 부족으로 보임\n' +
        '- 불명확한 대명사 (그가/그녀가): 누구를 가리키는지 시청자가 혼란\n' +
        '- 어려운 한자어/전문용어: 시니어 시청자가 즉시 이해 불가\n' +
        '**감독의 눈**: "이 대사를 배우에게 주면 자연스럽게 말할 수 있는가?"\n' +
        '\n' +
        '### 2. 극적 흡인력 검사 🎭 (시청자가 리모컨을 내려놓고 다음 장면을 기다리는가)\n' +
        '- 갈등/대립 구조 부재: 드라마의 엔진이 없음\n' +
        '- 반전/의외성 부재: 예측 가능한 전개는 지루함\n' +
        '- 감정 키워드 3개 미만: 감정의 파도가 없으면 시청자가 이입 불가\n' +
        '- 긴장과 이완의 리듬 부재: 계속 긴장만 또는 이완만은 피로유발\n' +
        '- 인물 간 관계 변화 부재: 정적인 관계는 드라마가 아님\n' +
        '**감독의 눈**: "이 장면을 보고 시청자가 SNS에 올릴 만큼 반응할 것인가?"\n' +
        '\n' +
        '### 3. 호칭 일관성 검사 👤\n' +
        '- 같은 인물을 다르게 부르는 경우 (아버지/아빠/부친)\n' +
        '- "그가", "그녀가" 등 불명확한 대명사 사용\n' +
        '- 신분에 맞지 않는 호칭\n' +
        '**예시**: "그가 말했다" → "영감님이 말했다"\n' +
        '\n' +
        '### 4. 서사 구조 완성도 검사 📖 (처음부터 끝까지 이야기에 허점이 없는가)\n' +
        '- 장면 전환 설명 부족: 시청자가 "어? 갑자기 여기가 어디지?" 하게 됨\n' +
        '- 인과관계 표현 부족: 사건과 사건 사이 연결 고리가 없음\n' +
        '- 시간 순서 혼란: 시간대가 뒤섞여 시청자 혼란 유발\n' +
        '- 복선 제시 후 미회수: 기대를 만들어 놓고 해소하지 않으면 실망\n' +
        '- 후반부에 설명 없이 새 인물 등장: 누군지 모르는 인물이 갑자기 등장\n' +
        '**감독의 눈**: "편집실에서 이 대본대로 편집하면 매끄러운 흐름이 나오는가?"\n' +
        '\n' +
        '### 5. 연출 활용도 검사 🎬 (이 대본이 감독으로서 연출 욕구를 자극하는가)\n' +
        '- 초반 3분 내 훅 부재: 시청자가 채널 고정할 이유가 없음\n' +
        '- 회차 끝 클리프행어 부재: 다음 회를 기다릴 이유가 없음\n' +
        '- 중반 긴장 이완 구간: 중간에 처지면 시청자가 이탈함\n' +
        '- 지문/무대지시 부족: 감독이 상상할 여지가 없음\n' +
        '- 감각적 묘사 부족: 영상미를 만들 단서가 대본에 없음\n' +
        '**감독의 눈**: "이 대본을 받았을 때 즉시 콘티를 그리고 싶어지는가?"\n' +
        '\n' +
        '### 6. 감정선 연결 검사 💭\n' +
        '- 인물의 감정 변화가 급작스러운 경우\n' +
        '- 감정 표현이 부족한 대사\n' +
        '- 상황에 맞지 않는 감정 반응\n' +
        '**예시**: "알겠습니다" → "알겠습니다... (눈시울을 붉히며)"\n' +
        '\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '## ⛔ 오류로 판정하지 말 것\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '- 나레이션 (나레이션:, NA:, N: 으로 시작하는 줄)\n' +
        '- 나레이션의 조선어투/문어체 (허용됨)\n' +
        '- 지문/설명 (괄호 안의 행동 묘사)\n' +
        '- 음향효과 ([SE], [BGM] 등)\n' +
        '\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '## 📊 점수 산출 기준 (30년 경력 거장 감독의 관점)\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '\n' +
        '### 시니어 적합도 (100점 시작, = 대사 전달력):\n' +
        '- 50자 초과 대사 1개당: -5점 (최대 -25점)\n' +
        '- 30~50자 대사 1개당: -2점 (최대 -14점)\n' +
        '- 불명확한 대명사 1개당(3개 초과분): -3점 (최대 -18점)\n' +
        '- 어려운 한자어/전문용어 1개당: -2점 (최대 -12점)\n' +
        '- 과도 반복 단어(10회 이상) 1종당: -3점 (최대 -9점)\n' +
        '- 문어체 대사 1개당: -3점 (최대 -15점)\n' +
        '\n' +
        '### 재미 요소 (100점 시작, = 극적 흡인력):\n' +
        '- 갈등/대립 구조 부재: -15점\n' +
        '- 반전/의외성 부족: -10점\n' +
        '- 감정 표현 부족 (3개 미만): -8점\n' +
        '- 긴장/이완 리듬 부재: -10점\n' +
        '- 인물 간 관계 변화 부재: -7점\n' +
        '\n' +
        '### 이야기 흐름 (100점 시작, = 서사 구조 완성도):\n' +
        '- 장면 전환 설명 부족: -5~-10점\n' +
        '- 인과관계 표현 부족: -7점\n' +
        '- 시간 순서 혼란: -10점\n' +
        '- 복선 미회수: -8점\n' +
        '- 후반부 신규 등장 인물: -5점/명 (최대 -15점)\n' +
        '\n' +
        '### 시청자 이탈 방지 (100점 시작, = 연출 활용도):\n' +
        '- 초반 훅 부재: -12점\n' +
        '- 클리프행어 부재: -8점\n' +
        '- 중반 긴장 이완 구간: -10점\n' +
        '- 지문/무대지시 부족: -5점\n' +
        '- 감각적 묘사 부족: -5점\n' +
        '\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '## 🚨🚨🚨 필수 응답 규칙 🚨🚨🚨\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '\n' +
        '1. **반드시 최소 5개 이상의 issues를 찾아야 합니다!**\n' +
        '2. 오류가 없어 보여도 개선할 수 있는 부분을 찾으세요!\n' +
        '3. 나레이션은 절대 오류로 넣지 마세요!\n' +
        '4. suggestion에 / 또는 () 넣지 마세요! 수정안 하나만!\n' +
        '5. perfectScript는 모든 issues를 반영한 완전한 대본!\n' +
        '6. 30년 경력 거장 감독의 냉철하고 정확한 눈으로 판단하세요!\n' +
        '\n' +
        '## 📤 응답 형식 (반드시 JSON만):\n' +
        '```json\n' +
        '{\n' +
        '    "issues": [\n' +
        '        {\n' +
        '            "type": "대사자연스러움",\n' +
        '            "original": "원문 그대로 복사",\n' +
        '            "suggestion": "수정안 하나만 (슬래시 금지)",\n' +
        '            "reason": "수정 이유 15자 이내",\n' +
        '            "severity": "high/medium/low"\n' +
        '        },\n' +
        '        {\n' +
        '            "type": "호칭일관성",\n' +
        '            "original": "원문",\n' +
        '            "suggestion": "수정안",\n' +
        '            "reason": "사유",\n' +
        '            "severity": "medium"\n' +
        '        },\n' +
        '        {\n' +
        '            "type": "장면연결성",\n' +
        '            "original": "원문",\n' +
        '            "suggestion": "수정안",\n' +
        '            "reason": "사유",\n' +
        '            "severity": "medium"\n' +
        '        },\n' +
        '        {\n' +
        '            "type": "감정선연결",\n' +
        '            "original": "원문",\n' +
        '            "suggestion": "수정안",\n' +
        '            "reason": "사유",\n' +
        '            "severity": "low"\n' +
        '        },\n' +
        '        {\n' +
        '            "type": "문장구조",\n' +
        '            "original": "원문",\n' +
        '            "suggestion": "수정안",\n' +
        '            "reason": "사유",\n' +
        '            "severity": "medium"\n' +
        '        }\n' +
        '    ],\n' +
        '    "scores": {\n' +
        '        "senior": 75,\n' +
        '        "fun": 70,\n' +
        '        "flow": 80,\n' +
        '        "retention": 72\n' +
        '    },\n' +
        '    "scoreDetails": {\n' +
        '        "senior": ["50자 초과 대사 3개 (-15점)", "불명확 대명사 2개 (-6점)"],\n' +
        '        "fun": ["갈등 구조 부재 (-15점)", "반전 부족 (-10점)"],\n' +
        '        "flow": ["장면 전환 설명 부족 2건 (-10점)"],\n' +
        '        "retention": ["초반 훅 부재 (-12점)", "클리프행어 부재 (-8점)"]\n' +
        '    },\n' +
        '    "perfectScript": "모든 issues를 수정 반영한 완전한 대본 전문을 여기에 작성"\n' +
        '}\n' +
        '```\n' +
        '\n' +
        '⚠️ 다시 한번 강조: "추가 오류가 없습니다"라고 하지 말고, 반드시 개선점을 찾아주세요!';
}

function calculateScoresFromAnalysis(script, aiScores, scoreDetails) {
    console.log('📊 점수 검증 및 보정 시작 (v4.55 사극 감독 페르소나)...');
    
    var lines = script.split('\n');
    var totalChars = script.length;
    
    // ============================================================
    // 1. 시니어 적합도 점수 계산 (6개 감점 항목)
    // ============================================================
    var seniorScore = 100;
    var seniorDeductions = [];
    
    // 1-1. 50자 초과 대사 (-5점/개, 최대 -25점)
    var veryLongSentences = 0;
    lines.forEach(function(line) {
        if (line.trim().length > 50) {
            veryLongSentences++;
        }
    });
    if (veryLongSentences > 0) {
        var deduct = Math.min(veryLongSentences * 5, 25);
        seniorScore -= deduct;
        seniorDeductions.push('50자 초과 대사 ' + veryLongSentences + '개 (-' + deduct + '점)');
    }
    
    // 1-2. 30~50자 대사 (-2점/개, 최대 -14점)
    var longSentences = 0;
    lines.forEach(function(line) {
        var len = line.trim().length;
        if (len > 30 && len <= 50) {
            longSentences++;
        }
    });
    if (longSentences > 0) {
        var deduct = Math.min(longSentences * 2, 14);
        seniorScore -= deduct;
        seniorDeductions.push('30~50자 대사 ' + longSentences + '개 (-' + deduct + '점)');
    }
    
    // 1-3. 불명확한 대명사 (-3점/개, 3개 초과분부터, 최대 -18점)
    var unclearPronouns = (script.match(/그가|그녀가|그는|그녀는|그들이/g) || []).length;
    if (unclearPronouns > 3) {
        var deduct = Math.min((unclearPronouns - 3) * 3, 18);
        seniorScore -= deduct;
        seniorDeductions.push('불명확한 대명사 ' + unclearPronouns + '개 (-' + deduct + '점)');
    }
    
    // 1-4. 어려운 한자어/전문용어 (-2점/개, 최대 -12점)
    var difficultWords = (script.match(/운명적|필연적|불가피|가히|차마|진실로|참으로|마땅히|응당|결단코|단연코|가령|비록|설령|하물며/g) || []).length;
    if (difficultWords > 0) {
        var deduct = Math.min(difficultWords * 2, 12);
        seniorScore -= deduct;
        seniorDeductions.push('어려운 한자어/전문용어 ' + difficultWords + '개 (-' + deduct + '점)');
    }
    
    // 1-5. 같은 단어 3회 이상 반복 (-3점, 최대 -9점)
    var wordCounts = {};
    var words = script.replace(/[^가-힣\s]/g, '').split(/\s+/);
    words.forEach(function(w) {
        if (w.length >= 2) {
            wordCounts[w] = (wordCounts[w] || 0) + 1;
        }
    });
    var repeatedWords = 0;
    for (var w in wordCounts) {
        if (wordCounts[w] >= 10) {
            repeatedWords++;
        }
    }
    if (repeatedWords > 0) {
        var deduct = Math.min(repeatedWords * 3, 9);
        seniorScore -= deduct;
        seniorDeductions.push('과도 반복 단어 ' + repeatedWords + '종 (-' + deduct + '점)');
    }
    
    // 1-6. 문어체 섞인 대사 (-3점/개, 최대 -15점)
    var literaryInDialog = 0;
    lines.forEach(function(line) {
        var trimmed = line.trim();
        if (trimmed.match(/^[가-힣]{2,4}\s*[:：]/) && !trimmed.match(/^나레이션|^NA|^N:/i)) {
            if (trimmed.match(/하였다|되었다|있었다|하였으며|되었으며|것이다|바이다|함이라/)) {
                literaryInDialog++;
            }
        }
    });
    if (literaryInDialog > 0) {
        var deduct = Math.min(literaryInDialog * 3, 15);
        seniorScore -= deduct;
        seniorDeductions.push('문어체 대사 ' + literaryInDialog + '개 (-' + deduct + '점)');
    }
    
    // ============================================================
    // 2. 재미 요소 점수 계산 (5개 감점 항목)
    // ============================================================
    var funScore = 100;
    var funDeductions = [];
    
    // 2-1. 갈등/대립 구조 부재 (-15점)
    var conflictKeywords = ['갈등', '다투', '싸우', '대립', '충돌', '반대', '거부', '분노', '화가', '원망', '배신', '의심', '질투', '시기'];
    var hasConflict = conflictKeywords.some(function(kw) { return script.includes(kw); });
    if (!hasConflict) {
        funScore -= 15;
        funDeductions.push('갈등/대립 구조 부재 (-15점)');
    }
    
    // 2-2. 반전/의외성 부재 (-10점)
    var twistKeywords = ['그런데', '하지만', '그러나', '뜻밖에', '갑자기', '놀랍게도', '반전', '알고 보니', '사실은', '비밀', '숨기'];
    var twistCount = twistKeywords.reduce(function(count, kw) {
        return count + (script.match(new RegExp(kw, 'g')) || []).length;
    }, 0);
    if (twistCount < 2) {
        funScore -= 10;
        funDeductions.push('반전/의외성 부족 (-10점)');
    }
    
    // 2-3. 감정 표현 부족 (-8점)
    var emotionKeywords = ['기뻐', '슬퍼', '화가', '두려', '설레', '그리워', '미안', '고마워', '사랑', '눈물', '울먹', '떨리', '가슴이'];
    var emotionCount = emotionKeywords.reduce(function(count, kw) {
        return count + (script.match(new RegExp(kw, 'g')) || []).length;
    }, 0);
    if (emotionCount < 3) {
        funScore -= 8;
        funDeductions.push('감정 표현 부족 (-8점)');
    }
    
    // 2-4. 긴장과 이완의 리듬 부재 (-10점)
    var tensionKeywords = ['긴박', '위기', '급히', '서둘러', '다급', '절체절명', '위험', '목숨'];
    var relaxKeywords = ['웃음', '미소', '평화', '고요', '편안', '따뜻', '포근', '한가로'];
    var hasTension = tensionKeywords.some(function(kw) { return script.includes(kw); });
    var hasRelax = relaxKeywords.some(function(kw) { return script.includes(kw); });
    if (!hasTension || !hasRelax) {
        funScore -= 10;
        funDeductions.push('긴장/이완 리듬 부재 (-10점)');
    }
    
    // 2-5. 인물 간 관계 변화 부재 (-7점)
    var relationKeywords = ['용서', '화해', '결별', '재회', '약속', '맹세', '다짐', '변심', '마음이 변'];
    var hasRelationChange = relationKeywords.some(function(kw) { return script.includes(kw); });
    if (!hasRelationChange) {
        funScore -= 7;
        funDeductions.push('인물 간 관계 변화 부재 (-7점)');
    }
    
    // ============================================================
    // 3. 이야기 흐름 점수 계산 (5개 감점 항목)
    // ============================================================
    var flowScore = 100;
    var flowDeductions = [];
    
    // 3-1. 장면 전환 설명 부족 (-5점, 전환 표현 2개 미만)
    var sceneTransitions = ['그때', '한편', '다음 날', '며칠 후', '그 후', '잠시 후', '얼마 뒤', '이튿날', '그날 밤', '새벽녘', '해 질 무렵'];
    var transitionCount = sceneTransitions.reduce(function(count, kw) {
        return count + (script.match(new RegExp(kw, 'g')) || []).length;
    }, 0);
    if (transitionCount < 2) {
        flowScore -= 10;
        flowDeductions.push('장면 전환 설명 부족 (-10점)');
    } else if (transitionCount < 4) {
        flowScore -= 5;
        flowDeductions.push('장면 전환 설명 다소 부족 (-5점)');
    }
    
    // 3-2. 인과관계 미약 (-7점)
    var causalKeywords = ['때문에', '그래서', '따라서', '덕분에', '결국', '그 결과', '그러므로', '탓에', '바람에', '까닭에'];
    var causalCount = causalKeywords.reduce(function(count, kw) {
        return count + (script.match(new RegExp(kw, 'g')) || []).length;
    }, 0);
    if (causalCount < 2) {
        flowScore -= 7;
        flowDeductions.push('인과관계 표현 부족 (-7점)');
    }
    
        // 3-3. 시간 순서 혼란 (-10점)
    // 시간 역전 표현이 과도하면 감점
    var timeConfusion = (script.match(/그제서야|뒤늦게/g) || []).length;

    if (timeConfusion > 3) {
        flowScore -= 10;
        flowDeductions.push('시간 순서 혼란 의심 (-10점)');
    }
    
    // 3-4. 복선 미회수 (-8점) — 복선 키워드 대비 회수 키워드 비율로 추정
    var foreshadowKeywords = ['언젠가', '반드시', '두고 보자', '잊지 않겠', '기억해', '약속', '맹세'];
    var payoffKeywords = ['드디어', '마침내', '결국', '그때 그', '약속대로', '맹세대로'];
    var foreshadowCount = foreshadowKeywords.reduce(function(count, kw) {
        return count + (script.match(new RegExp(kw, 'g')) || []).length;
    }, 0);
    var payoffCount = payoffKeywords.reduce(function(count, kw) {
        return count + (script.match(new RegExp(kw, 'g')) || []).length;
    }, 0);
    if (foreshadowCount > 0 && payoffCount === 0) {
        flowScore -= 8;
        flowDeductions.push('복선 ' + foreshadowCount + '건 제시, 회수 0건 (-8점)');
    }
    
    // 3-5. 새 인물/요소 설명 없이 등장 (-5점) — 대사 화자가 맥락 없이 첫 등장하는 경우 추정
    var speakerPattern = /^([가-힣]{2,4})\s*[:：]/gm;
    var speakerMatch;
    var speakerFirstAppear = {};
    var lineNum = 0;
    var scriptLines = script.split('\n');
    for (var li = 0; li < scriptLines.length; li++) {
        var spMatch = scriptLines[li].match(/^([가-힣]{2,4})\s*[:：]/);
        if (spMatch) {
            var spName = spMatch[1];
            if (!speakerFirstAppear[spName] && ['나레이션', '내레이션', '해설'].indexOf(spName) === -1) {
                speakerFirstAppear[spName] = li;
            }
        }
    }
    // 인물 소개 없이 중반 이후 첫 등장하는 인물 수 체크
    var totalLines = scriptLines.length;
    var lateIntroCount = 0;
    for (var sp in speakerFirstAppear) {
        if (speakerFirstAppear[sp] > totalLines * 0.5) {
            lateIntroCount++;
        }
    }
    if (lateIntroCount > 1) {
        var deduct = Math.min(lateIntroCount * 5, 15);
        flowScore -= deduct;
        flowDeductions.push('후반부 신규 등장 인물 ' + lateIntroCount + '명 (-' + deduct + '점)');
    }
    
    // ============================================================
    // 4. 시청자 이탈 방지 점수 계산 (5개 감점 항목)
    // ============================================================
    var retentionScore = 100;
    var retentionDeductions = [];
    
    // 4-1. 초반 3분 내 훅 부재 (-12점)
    var firstPart = script.substring(0, Math.min(500, script.length));
    var hookKeywords = ['비밀', '충격', '놀라운', '믿기 힘든', '알려지지 않은', '숨겨진', '사건', '변사체', '피', '비명', '급보', '파발'];
    var hasHook = hookKeywords.some(function(kw) { return firstPart.includes(kw); });
    if (!hasHook) {
        retentionScore -= 12;
        retentionDeductions.push('초반 훅 부재 (-12점)');
    }
    
    // 4-2. 회차 끝 클리프행어 부재 (-8점)
    var lastPart = script.substring(Math.max(0, script.length - 500));
    var cliffhangerKeywords = ['과연', '어떻게 될까', '다음에', '계속', '기대', '궁금', '설마', '아니', '그럴 리가', '이게 무슨'];
    var hasCliffhanger = cliffhangerKeywords.some(function(kw) { return lastPart.includes(kw); });
    if (!hasCliffhanger) {
        retentionScore -= 8;
        retentionDeductions.push('클리프행어 부재 (-8점)');
    }
    
    // 4-3. 중반 긴장 이완 구간 (-10점) — 중간 30% 구간에 사건 키워드 부재
    var midStart = Math.floor(script.length * 0.35);
    var midEnd = Math.floor(script.length * 0.65);
    var midPart = script.substring(midStart, midEnd);
    var midEventKeywords = ['갑자기', '그때', '놀라', '급히', '비명', '충격', '발견', '들이닥', '나타나'];
    var hasMidEvent = midEventKeywords.some(function(kw) { return midPart.includes(kw); });
    if (!hasMidEvent) {
        retentionScore -= 10;
        retentionDeductions.push('중반 긴장 이완 구간 (-10점)');
    }
    
    // 4-4. 지문/무대지시 부족 (-5점)
    var stageDirections = (script.match(/\([^)]+\)/g) || []).length;
    var stageDirectionRatio = stageDirections / Math.max(lines.length, 1);
    if (stageDirectionRatio < 0.1) {
        retentionScore -= 5;
        retentionDeductions.push('지문/무대지시 부족 (-5점)');
    }
    
    // 4-5. 감각적 묘사 부족 (-5점)
    var sensoryKeywords = ['빛', '어둠', '소리', '냄새', '바람', '차가운', '뜨거운', '축축', '거친', '부드러', '향기', '악취', '고요', '시끄러'];
    var sensoryCount = sensoryKeywords.reduce(function(count, kw) {
        return count + (script.match(new RegExp(kw, 'g')) || []).length;
    }, 0);
    if (sensoryCount < 3) {
        retentionScore -= 5;
        retentionDeductions.push('감각적 묘사 부족 (-5점)');
    }
    
    // ============================================================
    // 점수 범위 제한 (30-100)
    // ============================================================
    seniorScore = Math.max(30, Math.min(100, seniorScore));
    funScore = Math.max(30, Math.min(100, funScore));
    flowScore = Math.max(30, Math.min(100, flowScore));
    retentionScore = Math.max(30, Math.min(100, retentionScore));
    
    var localScores = {
        senior: seniorScore,
        fun: funScore,
        flow: flowScore,
        retention: retentionScore
    };
    
    // ============================================================
    // AI 점수와 로컬 점수 보정
    // ============================================================
    var finalScores = {};
    var categories = ['senior', 'fun', 'flow', 'retention'];
    
    categories.forEach(function(cat) {
        var ai = aiScores[cat] || 70;
        var local = localScores[cat];
        
        if (ai === 100 && local < 90) {
            finalScores[cat] = local;
        } else if (ai === 100 && local >= 90) {
            finalScores[cat] = Math.round((ai + local) / 2);
        } else {
            finalScores[cat] = Math.round((ai + local) / 2);
        }
    });
    
    console.log('📊 로컬 점수:', localScores);
    console.log('📊 AI 점수:', aiScores);
    console.log('📊 최종 점수:', finalScores);
    
    return {
        localScores: localScores,
        finalScores: finalScores,
        deductions: {
            senior: seniorDeductions,
            fun: funDeductions,
            flow: flowDeductions,
            retention: retentionDeductions
        }
    };
}

function filterNarrationErrors(errors, script) {
    if (!errors || errors.length === 0) {
        return [];
    }
    
    if (!script || typeof script !== 'string') {
        console.log('⚠️ filterNarrationErrors: script가 없어서 필터링 생략');
        return errors;
    }
    
    var narrationPatterns = [
        /^나레이션\s*:/im,
        /^NA\s*:/im,
        /^N\s*:/im,
        /^내레이션\s*:/im,
        /^\(나레이션\)/im,
        /^\(NA\)/im
    ];
    
    var lines = script.split('\n');
    
    return errors.filter(function(err) {
        if (!err || !err.original) return true;
        
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            if (line.indexOf(err.original) !== -1) {
                for (var j = 0; j < narrationPatterns.length; j++) {
                    if (narrationPatterns[j].test(line)) {
                        console.log('🚫 나레이션 오류 제외:', err.original);
                        return false;
                    }
                }
            }
        }
        return true;
    });
}

// ============================================================
// Context Caching 함수들 (v4.56 추가)
// 전체 대본을 Google 서버에 캐시하여 파트별 분석 시 전체 문맥 참조
// ============================================================

async function createScriptCache(script, systemInstruction, ttlSeconds) {
    var apiKey = localStorage.getItem('GEMINI_API_KEY');
    var validation = validateApiKey(apiKey);
    if (!validation.valid) {
        console.error('❌ createScriptCache: API 키 오류 -', validation.message);
        return null;
    }
    if (!ttlSeconds) ttlSeconds = 1800;
    if (!script || script.length < 1500) {
        console.log('⚠️ createScriptCache: 대본이 짧아 캐시 생성 생략 (' + (script ? script.length : 0) + '자)');
        return null;
    }
    var url = 'https://generativelanguage.googleapis.com/v1beta/cachedContents?key=' + apiKey;
    var requestBody = {
        model: 'models/' + API_CONFIG.MODEL,
        displayName: 'script-analysis-' + Date.now(),
        contents: [
            {
                role: 'user',
                parts: [{ text: script }]
            }
        ],
        ttl: ttlSeconds + 's'
    };
    if (systemInstruction && systemInstruction.trim().length > 0) {
        requestBody.systemInstruction = {
            parts: [{ text: systemInstruction }]
        };
    }
    console.log('📦 캐시 생성 요청...');
    console.log('   - 대본 길이: ' + script.length + '자');
    console.log('   - TTL: ' + ttlSeconds + '초');
    console.log('   - 모델: ' + API_CONFIG.MODEL);
    try {
        var response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
        if (!response.ok) {
            var errorData = await response.json().catch(function() { return {}; });
            var errorMsg = errorData.error ? errorData.error.message : response.statusText;
            console.error('❌ 캐시 생성 실패: ' + errorMsg);
            console.error('   HTTP 상태: ' + response.status);
            return null;
        }
        var data = await response.json();
        if (data && data.name) {
            console.log('✅ 캐시 생성 성공!');
            console.log('   - 캐시 ID: ' + data.name);
            console.log('   - 토큰 수: ' + (data.usageMetadata ? data.usageMetadata.totalTokenCount : '알 수 없음'));
            return data.name;
        } else {
            console.error('❌ 캐시 생성 응답에 name 없음:', data);
            return null;
        }
    } catch (error) {
        console.error('❌ 캐시 생성 중 예외:', error.message);
        return null;
    }
}

async function deleteScriptCache(cacheName) {
    stopCacheTimer();
    if (!cacheName) return;
    var apiKey = localStorage.getItem('GEMINI_API_KEY');
    if (!apiKey) return;
    var url = 'https://generativelanguage.googleapis.com/v1beta/' + cacheName + '?key=' + apiKey;
    try {
        var response = await fetch(url, { method: 'DELETE' });
        if (response.ok) {
            console.log('🗑️ 캐시 삭제 완료: ' + cacheName);
        } else {
            console.log('⚠️ 캐시 삭제 실패 (자동 만료됨): ' + cacheName);
        }
    } catch (error) {
        console.log('⚠️ 캐시 삭제 중 오류 (무시 가능): ' + error.message);
    }
}

async function retryWithDelay(fn, maxRetries, delayMs) {
    if (!maxRetries) maxRetries = 3;
    if (!delayMs) delayMs = 2000;
    for (var attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            if (error.name === 'AbortError') throw error;
            var is429 = error.message && error.message.indexOf('429') > -1;
            var isRateLimit = error.message && (error.message.indexOf('Resource has been exhausted') > -1 || error.message.indexOf('rate limit') > -1);
            if ((is429 || isRateLimit) && attempt < maxRetries) {
                var waitTime = delayMs * attempt;
                console.log('⏳ 429 에러, ' + (waitTime / 1000) + '초 후 재시도 (' + attempt + '/' + maxRetries + ')');
                await new Promise(function(resolve) { setTimeout(resolve, waitTime); });
            } else {
                throw error;
            }
        }
    }
}

function buildRolePrompt(roleId, chunkText, chunkInfo, scriptLength) {
    // ============================================================
    // v4.54: 캐시에 전체 대본이 있으므로 프롬프트에는 청크만 포함
    // role6_audience는 전체 대본 평가이므로 청크 없이 캐시만 참조
    // ============================================================

    var header;
    if (roleId === 'role6_audience') {
        header = '당신은 이미 캐시에 제공된 전체 대본을 완전히 읽고 이해한 상태입니다.\n' +
            '전체 대본의 줄거리, 인물, 복선, 감정선, 시간 흐름을 모두 파악하고 있습니다.\n' +
            '전체 대본을 시청자 몰입도 관점에서 종합 평가하세요.\n\n';
    } else {
        header = '당신은 이미 캐시에 제공된 전체 대본을 완전히 읽고 이해한 상태입니다.\n' +
            '전체 대본의 줄거리, 인물, 복선, 감정선, 시간 흐름을 모두 파악하고 있습니다.\n' +
            '지금부터 전체 대본 중 아래 구간만 집중 분석하세요.\n' +
            '단, 이 구간 밖의 내용과 모순되거나 연결이 안 되는 부분도 반드시 검출하세요.\n\n' +
            '전체 대본 ' + scriptLength + '자 중 ' + chunkInfo + '\n\n' +
            '━━ 분석 대상 구간 ━━\n' + chunkText + '\n━━ 구간 끝 ━━\n\n';
    }

    var footer = '\n\n## ⛔ 오류로 판정하지 말 것\n' +
        '- 나레이션 (나레이션:, NA:, N: 등으로 시작하는 줄)\n' +
        '- 나레이션의 조선어투/문어체 (허용됨)\n' +
        '- 지문/설명 (괄호 안의 행동 묘사)\n' +
        '- 음향효과 ([SE], [BGM] 등)\n\n' +
        '## 🚨 필수 응답 규칙\n' +
        '1. 반드시 최소 2개 이상의 오류를 찾아야 합니다!\n' +
        '2. revised에 / 또는 () 넣지 마세요! 수정안 하나만!\n' +
        '3. 이 구간에 해당하는 오류만 보고하세요.\n' +
        '4. 이 구간 밖의 내용(캐시의 전체 대본)과 모순되는 부분도 반드시 검출하세요.\n\n' +
        '## 📤 응답 형식 (반드시 JSON만):\n' +
        '```json\n{"errors": [\n  {"type": "유형", "original": "원문 그대로", "revised": "수정안 하나만", "reason": "사유 15자 이내", "severity": "high/medium/low"}\n]}\n```';

    var rulesString = getHistoricalRulesString();

    if (roleId === 'role1_historical') {
        return header +
            '## 🎯 당신의 역할: 시대고증 전문관\n' +
            '한국학중앙연구원 자문위원급의 사극 고증 전문가입니다.\n' +
            '이 구간에서 시대에 맞지 않는 표현만 집중적으로 찾으세요.\n\n' +
            '## ✅ 검사항목 (2가지만 집중)\n\n' +
            '### 1. 시대착오 (최우선)\n' +
            '아래 현대 단어가 대사에 있으면 무조건 오류입니다:\n' +
            '**필기구**: 펜, 볼펜, 연필, 지우개, 노트 → 붓, 먹, 서책\n' +
            '**조명**: 전등, 전구, 형광등, 손전등 → 촛불, 등잔, 횃불\n' +
            '**통신**: 전화, 휴대폰, 핸드폰, 문자 → 전령, 파발, 서신\n' +
            '**교통**: 자동차, 기차, 버스, 택시, 비행기 → 가마, 마차, 말\n' +
            '**가전**: 냉장고, 에어컨, 선풍기, TV, 컴퓨터 → 석빙고, 부채\n' +
            '**음식**: 커피, 라면, 콜라, 햄버거, 피자 → 차, 국수, 닭고기\n' +
            '**의복**: 양복, 청바지, 티셔츠, 구두 → 도포, 한복, 짚신\n' +
            '**시설**: 병원, 학교, 경찰서, 은행, 카페 → 의원, 서당, 포도청\n' +
            '**직업**: 의사, 경찰, 선생님, 회사원 → 의원, 포졸, 훈장, 상인\n' +
            '**단위**: 미터, 킬로그램, 퍼센트, 원 → 자, 근, 할, 냥\n' +
            '**외래어**: OK, 오케이, 파이팅, 스트레스 → 조선식 표현\n\n' +
            '📋 전체 목록: ' + rulesString + '\n\n' +
            '### 2. 역사적 사실 오류\n' +
            '- 실존 인물의 행적과 다른 묘사\n' +
            '- 실존 사건의 시기/장소/결과가 틀린 경우\n' +
            '- 당시 존재하지 않던 제도/관직 언급\n' +
            footer;
    }

    if (roleId === 'role2_person_time') {
        return header +
            '## 🎯 당신의 역할: 인물·시간 검증관\n' +
            '사극 드라마 스크립터(연속성 담당)입니다.\n' +
            '이 구간에서 인물 정보와 시간 표현의 모순만 찾으세요.\n' +
            '캐시에 있는 전체 대본의 다른 구간에서 언급된 정보와도 비교하세요.\n\n' +
            '## ✅ 검사항목 (3가지만 집중)\n\n' +
            '### 1. 인물 설정 오류\n' +
            '- 같은 인물의 나이가 장면마다 다르게 표기된 경우\n' +
            '- 인물의 신분(양반/상민/천민)에 맞지 않는 말투 사용\n' +
            '- 인물 소개와 실제 행동이 불일치하는 경우\n\n' +
            '### 2. 시간 왜곡/모순 오류 (매우 중요!)\n' +
            '**반드시 검출해야 하는 시간 모순 패턴:**\n' +
            '- 같은 사건에 대해 다른 시간 언급 (예: "일 년 전" vs "칠 년도 더 되었다")\n' +
            '- 숫자가 다른 시간 표현이 같은 사건을 가리키면 무조건 오류\n' +
            '- 시간 순서 역전 (아침→저녁→다시 아침)\n' +
            '- 계절 불일치 (봄이라고 했는데 눈이 내림)\n\n' +
            '⚠️ 이 구간 밖의 시간 표현(캐시의 전체 대본)과도 반드시 비교하세요!\n\n' +
            '### 3. 숫자/수량 불일치\n' +
            '- 인원수가 장면마다 달라지는 경우\n' +
            '- 금액/수량이 앞뒤가 맞지 않는 경우\n' +
            '- 나이가 계산상 맞지 않는 경우\n' +
            footer;
    }

    if (roleId === 'role3_structure') {
        return header +
            '## 🎯 당신의 역할: 서사 구조 편집자\n' +
            '방송작가협회 수석 편집위원입니다.\n' +
            '이 구간의 이야기 구조와 장면 연결만 집중 검사하세요.\n' +
            '캐시에 있는 전체 대본의 흐름 속에서 이 구간의 위치를 고려하세요.\n\n' +
            '## ✅ 검사항목 (3가지만 집중)\n\n' +
            '### 1. 이야기 흐름 오류\n' +
            '- 앞 장면과 연결이 안 되는 갑작스러운 전개\n' +
            '- 인과관계 없이 갑자기 결론으로 점프\n' +
            '- 설명 없이 새로운 인물/상황 등장\n\n' +
            '### 2. 장면 연결성 오류\n' +
            '- 장소 이동 설명 없이 갑자기 다른 곳에 있는 경우\n' +
            '- 연속된 장면인데 상황이 갑자기 바뀐 경우\n' +
            '- 시간대 전환이 불명확한 경우\n\n' +
            '### 3. 복선/떡밥 회수\n' +
            '- 앞에서 제시된 복선이 뒤에서 회수되지 않은 부분\n' +
            '- 제시 없이 갑자기 해소되는 이야기\n' +
            '- 잊혀진 떡밥\n' +
            footer;
    }

    if (roleId === 'role4_character') {
        return header +
            '## 🎯 당신의 역할: 캐릭터·감정선 감독\n' +
            '배우 출신 연기 지도 감독입니다.\n' +
            '이 구간에서 인물의 성격/말투/감정 일관성만 집중 검사하세요.\n' +
            '캐시에 있는 전체 대본에서 해당 인물이 어떻게 행동했는지 참고하세요.\n\n' +
            '## ✅ 검사항목 (3가지만 집중)\n\n' +
            '### 1. 캐릭터 일관성 오류\n' +
            '- 같은 인물이 장면마다 다른 성격으로 말하는 경우\n' +
            '- 말투가 갑자기 바뀌는 경우 (존댓말↔반말)\n' +
            '- 인물 소개의 성격과 실제 행동이 다른 경우\n\n' +
            '### 2. 호칭 일관성 오류\n' +
            '- 같은 인물을 다르게 부르는 경우 (아버지/아빠/부친)\n' +
            '- 신분에 맞지 않는 호칭 사용\n' +
            '- "그가", "그녀가" 등 불명확한 대명사 사용\n\n' +
            '### 3. 감정선 연결 오류\n' +
            '- 인물의 감정 변화가 급작스러운 경우\n' +
            '- 상황에 맞지 않는 감정 반응\n' +
            '- 감정 표현이 부족하여 공감이 안 되는 대사\n' +
            footer;
    }

    if (roleId === 'role5_dialogue') {
        return header +
            '## 🎯 당신의 역할: 대사 품질 검수관\n' +
            '시니어 타깃 드라마 전문 작가입니다.\n' +
            '이 구간의 대사 하나하나를 시청자 입장에서 검사하세요.\n\n' +
            '## ✅ 검사항목 (3가지만 집중)\n\n' +
            '### 1. 대사 자연스러움\n' +
            '- 50자 초과 대사: 배우가 한 호흡에 소화할 수 없음 → 분리 필요\n' +
            '- 30~50자 대사: 시니어 시청자 청취 시 집중력 저하\n' +
            '- 문어체가 섞인 대사: "~하였다", "~되었으며" 등\n' +
            '- 같은 단어가 반복되는 대사\n\n' +
            '### 2. 쌩뚱맞은 표현\n' +
            '- 상황과 전혀 맞지 않는 대사\n' +
            '- 분위기를 깨는 부적절한 표현\n' +
            '- 문맥에 맞지 않는 엉뚱한 말\n\n' +
            '### 3. 시니어 적합도\n' +
            '- 어려운 한자어/전문용어\n' +
            '- 불명확한 대명사 (그가/그녀가 → 구체적 이름)\n' +
            '- 과도하게 긴 문장\n' +
            footer;
    }

    if (roleId === 'role6_audience') {
        return header +
            '## 🎯 당신의 역할: 시청자 몰입도 PD\n' +
            '시청률 분석 + 편성 전략 PD입니다. 30년 경력의 거장 감독 관점으로 평가하세요.\n\n' +
            '## ✅ 검사항목 (3가지)\n\n' +
            '### 1. 극적 흡인력\n' +
            '- 갈등/대립 구조가 있는가?\n' +
            '- 반전/의외성이 있는가?\n' +
            '- 감정 표현이 충분한가? (3개 미만이면 부족)\n' +
            '- 긴장과 이완의 리듬이 있는가?\n' +
            '- 인물 간 관계 변화가 있는가?\n\n' +
            '### 2. 연출 활용도\n' +
            '- 초반 3분 내 훅(호기심 유발)이 있는가?\n' +
            '- 회차 끝 클리프행어가 있는가?\n' +
            '- 중반에 처지는 구간이 있는가?\n' +
            '- 지문/무대지시가 충분한가?\n' +
            '- 감각적 묘사(빛, 소리, 냄새 등)가 있는가?\n\n' +
            '### 3. 시청자 이탈 위험 구간\n' +
            '- 채널을 돌릴 만한 지루한 구간이 있는가?\n' +
            '- 시청자가 혼란을 느낄 구간이 있는가?\n\n' +
            '## ⛔ 오류로 판정하지 말 것\n' +
            '- 나레이션, 지문, 음향효과\n\n' +
            '## 📤 응답 형식 (반드시 JSON만):\n' +
            '```json\n{\n' +
            '  "issues": [\n' +
            '    {"type": "극적흡인력|연출활용도|이탈위험", "original": "해당 원문", "revised": "수정 제안", "reason": "사유 15자 이내", "severity": "high/medium/low"}\n' +
            '  ],\n' +
            '  "scores": {\n' +
            '    "senior": 75,\n' +
            '    "fun": 70,\n' +
            '    "flow": 80,\n' +
            '    "retention": 72\n' +
            '  },\n' +
            '  "scoreDetails": {\n' +
            '    "senior": ["감점 사유1", "감점 사유2"],\n' +
            '    "fun": ["감점 사유1"],\n' +
            '    "flow": ["감점 사유1"],\n' +
            '    "retention": ["감점 사유1", "감점 사유2"]\n' +
            '  }\n' +
            '}\n```\n\n' +
            '## 📊 점수 산출 기준 (100점 시작)\n\n' +
            '### 시니어 적합도:\n' +
            '- 50자 초과 대사 1개당 -5점 (최대 -25점)\n' +
            '- 30~50자 대사 1개당 -2점 (최대 -14점)\n' +
            '- 불명확 대명사 1개당(3개 초과분) -3점 (최대 -18점)\n' +
            '- 어려운 한자어 1개당 -2점 (최대 -12점)\n' +
            '- 반복 단어(10회 이상) 1종당 -3점 (최대 -9점)\n' +
            '- 문어체 대사 1개당 -3점 (최대 -15점)\n\n' +
            '### 재미 요소:\n' +
            '- 갈등/대립 부재 -15점\n' +
            '- 반전/의외성 부족 -10점\n' +
            '- 감정 표현 부족(3개 미만) -8점\n' +
            '- 긴장/이완 리듬 부재 -10점\n' +
            '- 인물 간 관계 변화 부재 -7점\n\n' +
            '### 이야기 흐름:\n' +
            '- 장면 전환 설명 부족 -5~-10점\n' +
            '- 인과관계 부족 -7점\n' +
            '- 시간 순서 혼란 -10점\n' +
            '- 복선 미회수 -8점\n' +
            '- 후반부 신규 인물 -5점/명 (최대 -15점)\n\n' +
            '### 시청자 이탈 방지:\n' +
            '- 초반 훅 부재 -12점\n' +
            '- 클리프행어 부재 -8점\n' +
            '- 중반 처짐 -10점\n' +
            '- 지문/무대지시 부족 -5점\n' +
            '- 감각 묘사 부족 -5점';
    }

    // 알 수 없는 역할 ID에 대한 폴백
    return header + '이 구간에서 오류를 찾아주세요.' + footer;
}

async function runRoleAnalysis(roleId, roleName, chunks, cacheName, scriptLength) {
    console.log('🎭 역할 [' + roleName + '] 분석 시작 (' + chunks.length + '개 청크)');
    var roleErrors = [];

    for (var i = 0; i < chunks.length; i++) {
        var chunk = chunks[i];
        var chunkInfo = chunk.startIndex + '~' + chunk.endIndex + '자 (' + (i + 1) + '/' + chunks.length + ' 구간)';

        console.log('   📦 청크 ' + (i + 1) + '/' + chunks.length + ' (' + chunk.text.length + '자)');

        try {
            var prompt = buildRolePrompt(roleId, chunk.text, chunkInfo, scriptLength);

            var result = await retryWithDelay(function() {
                return callGeminiAPI(prompt, cacheName);
            }, 3, 2000);

            var parsed = parseApiResponse(result);
            var errors = parsed.errors || parsed.issues || [];
            errors = filterNarrationErrors(errors, chunk.text);

            for (var e = 0; e < errors.length; e++) {
                errors[e]._chunkNum = i + 1;
                errors[e]._role = roleId;
                roleErrors.push(errors[e]);
            }

            console.log('   ✅ 청크 ' + (i + 1) + ' 완료: ' + errors.length + '개 오류');

        } catch (chunkError) {
            if (chunkError.name === 'AbortError') throw chunkError;
            console.error('   ❌ 청크 ' + (i + 1) + ' 실패: ' + chunkError.message);
        }

        if (i < chunks.length - 1) {
            await new Promise(function(resolve) { setTimeout(resolve, 500); });
        }
    }

    console.log('🎭 역할 [' + roleName + '] 완료: 총 ' + roleErrors.length + '개 오류');
    return roleErrors;
}

async function runRole6Audience(cacheName, existingErrors) {
    console.log('🎭 역할 [시청자 몰입도 PD] 분석 시작 (전체 대본)');

    var existingErrorsSummary = '';
    for (var i = 0; i < Math.min(existingErrors.length, 30); i++) {
        var err = existingErrors[i];
        existingErrorsSummary += '- [' + (err.type || '기타') + '] ' + (err.original || '').substring(0, 40) + '\n';
    }

    var prompt = buildRolePrompt('role6_audience', '', '', 0);
    prompt += '\n\n## 📋 기존 발견 오류 (' + existingErrors.length + '건, 참고용):\n' + existingErrorsSummary;

    try {
        var result = await retryWithDelay(function() {
            return callGeminiAPI(prompt, cacheName);
        }, 3, 2000);

        var parsed = parseApiResponse(result);
        console.log('🎭 역할 [시청자 몰입도 PD] 완료');

        return {
            issues: parsed.issues || parsed.errors || [],
            scores: parsed.scores || null,
            scoreDetails: parsed.scoreDetails || null
        };
    } catch (error) {
        if (error.name === 'AbortError') throw error;
        console.error('❌ 역할6 실패:', error.message);
        return { issues: [], scores: null, scoreDetails: null };
    }
}
// ============================================================
// runMatrixAnalysis - 역할 × 청크 매트릭스 병렬 분석 (v4.54)
// 캐시에 전체 대본이 있으므로 프롬프트에는 청크만 포함
// 모든 (역할 × 청크) 조합을 동시 호출하여 시간 단축 + 세밀도 향상
// ============================================================
async function runMatrixAnalysis(script, roles, cacheName, chunkSize, progressStart, progressEnd, stageLabel) {
    if (!chunkSize) chunkSize = 6500;
    if (!progressStart) progressStart = 10;
    if (!progressEnd) progressEnd = 75;
    if (!stageLabel) stageLabel = '분석';

    var chunks = splitScriptIntoChunks(script, chunkSize);
    var totalCalls = roles.length * chunks.length;

    console.log('📦 매트릭스 분석 시작');
    console.log('   - 역할: ' + roles.length + '개 (' + roles.map(function(r) { return r.name; }).join(', ') + ')');
    console.log('   - 청크: ' + chunks.length + '개 (각 약 ' + chunkSize + '자)');
    console.log('   - 총 호출: ' + totalCalls + '개 (동시 발사)');
    console.log('   - 캐시: ' + (cacheName ? '사용' : '미사용'));

    var allPromises = [];
    var promiseMeta = [];

    for (var r = 0; r < roles.length; r++) {
        for (var c = 0; c < chunks.length; c++) {
            var chunk = chunks[c];
            var chunkInfo = chunk.startIndex + '~' + chunk.endIndex + '자 (' + (c + 1) + '/' + chunks.length + ')';
            var prompt = buildRolePrompt(roles[r].id, chunk.text, chunkInfo, script.length);

            (function(roleIdx, chunkIdx, roleId, roleName, chunkTextRef, promptRef, cacheNameRef) {
                allPromises.push(
                    retryWithDelay(function() {
                        return callGeminiAPI(promptRef, cacheNameRef);
                    }, 3, 3000)
                );
                promiseMeta.push({
                    roleIdx: roleIdx,
                    chunkIdx: chunkIdx,
                    roleId: roleId,
                    roleName: roleName,
                    chunkText: chunkTextRef
                });
            })(r, c, roles[r].id, roles[r].name, chunk.text, prompt, cacheName);
        }
    }

    updateProgress(progressStart + 5, stageLabel + ' 중... (' + totalCalls + '개 동시 호출)');

    var results = await Promise.allSettled(allPromises);

    var allErrors = [];
    var successCount = 0;
    var failCount = 0;
    var role6Data = { scores: null, scoreDetails: null };

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

                if (meta.roleId === 'role6_audience') {
                    if (parsed.scores) role6Data.scores = parsed.scores;
                    if (parsed.scoreDetails) role6Data.scoreDetails = parsed.scoreDetails;
                }

                console.log('   ✅ ' + meta.roleName + ' 청크' + (meta.chunkIdx + 1) + ': ' + errors.length + '개 오류');
            } catch (parseError) {
                console.error('   ⚠️ ' + meta.roleName + ' 청크' + (meta.chunkIdx + 1) + ' 파싱 실패:', parseError.message);
            }
        } else {
            failCount++;
            var reason = results[i].reason ? results[i].reason.message : '알 수 없는 오류';
            console.error('   ❌ ' + meta.roleName + ' 청크' + (meta.chunkIdx + 1) + ' 실패:', reason);
        }
    }

    var merged = mergeRoleResults(allErrors);

    console.log('📊 매트릭스 완료:');
    console.log('   - 성공: ' + successCount + '/' + totalCalls);
    console.log('   - 실패: ' + failCount + '/' + totalCalls);
    console.log('   - 원본 오류: ' + allErrors.length + '개');
    console.log('   - 중복 제거 후: ' + merged.length + '개');

    return {
        errors: merged,
        role6Data: role6Data
    };
}

function mergeRoleResults(allRoleErrors) {
    var seen = {};
    var merged = [];

    for (var i = 0; i < allRoleErrors.length; i++) {
        var err = allRoleErrors[i];
        if (!err || !err.original) continue;

        var key = (err.original || '').trim().substring(0, 50);
        if (seen[key]) {
            continue;
        }
        seen[key] = true;
        merged.push(err);
    }

    console.log('🔀 결과 통합: ' + allRoleErrors.length + '개 → 중복 제거 후 ' + merged.length + '개');
    return merged;
}

async function callGeminiAPI(prompt, cacheName) {
    var apiKey = localStorage.getItem('GEMINI_API_KEY');
    var validation = validateApiKey(apiKey);
    if (!validation.valid) {
        throw new Error(validation.message);
    }

    currentAbortController = new AbortController();
    var stopBtn = document.getElementById('btn-stop-analysis');
    if (stopBtn) stopBtn.disabled = false;

    var url = API_CONFIG.ENDPOINT + '/' + API_CONFIG.MODEL + ':generateContent?key=' + apiKey;

    var requestBody = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: 0.1,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: API_CONFIG.MAX_OUTPUT_TOKENS
        }
    };

    if (cacheName) {
        requestBody.cachedContent = cacheName;
    }

    var response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: currentAbortController.signal
    });

    if (!response.ok) {
        var errorData = await response.json().catch(function() { return {}; });
        var errorMsg = 'API 오류: ' + (errorData.error?.message || response.statusText);
        if (cacheName && (response.status === 404 || response.status === 400)) {
            console.error('❌ 캐시 참조 오류 (캐시 만료 또는 잘못된 ID): ' + cacheName);
        }
        throw new Error(errorMsg);
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

function parseApiResponse(responseText) {
    console.log('📥 API 응답 파싱 시작...');
    
    var jsonText = '';
    
    var jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
        jsonText = jsonMatch[1];
        console.log('✅ JSON 블록 발견');
    } else {
        var jsonStart = responseText.indexOf('{');
        var jsonEnd = responseText.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
            jsonText = responseText.substring(jsonStart, jsonEnd + 1);
            console.log('✅ JSON 객체 발견');
        }
    }
    
    if (!jsonText) {
        console.error('❌ JSON을 찾을 수 없음');
        throw new Error('JSON 파싱 실패: JSON 형식을 찾을 수 없습니다.');
    }
    
    try {
        return JSON.parse(jsonText);
    } catch (e1) {
        console.warn('⚠️ 1차 파싱 실패, 복구 시도 중...', e1.message);
        
        try {
            var fixedJson = jsonText
                .replace(/\n/g, '\\n')
                .replace(/\r/g, '\\r')
                .replace(/\t/g, '\\t')
                .replace(/([^\\])"/g, '$1\\"')
                .replace(/^"/g, '\\"')
                .replace(/\\"{/g, '{"')
                .replace(/}\\"/g, '}"')
                .replace(/\\":}/g, '":}')
                .replace(/\\"\[/g, '"[')
                .replace(/\]\\"/g, ']"')
                .replace(/,\\"/g, ',"')
                .replace(/\\":/g, '":')
                .replace(/:\\"/g, ':"')
                .replace(/\\"}/g, '"}')
                .replace(/{\\":/g, '{"');
            
            return JSON.parse(fixedJson);
        } catch (e2) {
            console.warn('⚠️ 2차 파싱 실패, 부분 추출 시도...', e2.message);
            
            try {
                var result = { errors: [], issues: [], scores: null, perfectScript: '', changePoints: [] };
                
                // v4.54 강화: errors 배열 추출 (개별 객체 단위 복구)
                var errorsMatch = jsonText.match(/"errors"\s*:\s*\[([\s\S]*?)\]/);
                if (errorsMatch) {
                    try {
                        result.errors = JSON.parse('[' + errorsMatch[1] + ']');
                        console.log('✅ errors 배열 파싱 성공: ' + result.errors.length + '개');
                    } catch (e) {
                        console.warn('⚠️ errors 배열 일괄 파싱 실패, 개별 객체 복구 시도...');
                        result.errors = extractIndividualObjects(errorsMatch[1]);
                        console.log('✅ errors 개별 복구: ' + result.errors.length + '개');
                    }
                }
                
                // v4.54 강화: issues 배열 추출 (개별 객체 단위 복구)
                var issuesMatch = jsonText.match(/"issues"\s*:\s*\[([\s\S]*?)\]/);
                if (issuesMatch) {
                    try {
                        result.issues = JSON.parse('[' + issuesMatch[1] + ']');
                        console.log('✅ issues 배열 파싱 성공: ' + result.issues.length + '개');
                    } catch (e) {
                        console.warn('⚠️ issues 배열 일괄 파싱 실패, 개별 객체 복구 시도...');
                        result.issues = extractIndividualObjects(issuesMatch[1]);
                        console.log('✅ issues 개별 복구: ' + result.issues.length + '개');
                    }
                }
                
                // issues가 있고 errors가 없으면 issues를 errors로 복사
                if (result.issues.length > 0 && result.errors.length === 0) {
                    result.errors = result.issues;
                    console.log('✅ issues → errors 복사: ' + result.errors.length + '개');
                }
                
                var scoresMatch = jsonText.match(/"scores"\s*:\s*\{([^}]+)\}/);
                if (scoresMatch) {
                    try {
                        result.scores = JSON.parse('{' + scoresMatch[1] + '}');
                    } catch (e) {
                        var seniorMatch = jsonText.match(/"senior"\s*:\s*(\d+)/);
                        var funMatch = jsonText.match(/"fun"\s*:\s*(\d+)/);
                        var flowMatch = jsonText.match(/"flow"\s*:\s*(\d+)/);
                        var retentionMatch = jsonText.match(/"retention"\s*:\s*(\d+)/);
                        
                        if (seniorMatch || funMatch || flowMatch || retentionMatch) {
                            result.scores = {
                                senior: seniorMatch ? parseInt(seniorMatch[1]) : 70,
                                fun: funMatch ? parseInt(funMatch[1]) : 70,
                                flow: flowMatch ? parseInt(flowMatch[1]) : 70,
                                retention: retentionMatch ? parseInt(retentionMatch[1]) : 70
                            };
                        }
                    }
                }
                
                // v4.54 강화: scoreDetails 추출
                var scoreDetailsMatch = jsonText.match(/"scoreDetails"\s*:\s*\{([\s\S]*?)\}\s*[,}]/);
                if (scoreDetailsMatch) {
                    try {
                        result.scoreDetails = JSON.parse('{' + scoreDetailsMatch[1] + '}');
                    } catch (e) {
                        // scoreDetails 파싱 실패해도 무시
                    }
                }
                
                var perfectMatch = jsonText.match(/"perfectScript"\s*:\s*"([\s\S]*?)(?:"\s*[,}]|"$)/);
                if (perfectMatch) {
                    result.perfectScript = perfectMatch[1]
                        .replace(/\\n/g, '\n')
                        .replace(/\\r/g, '')
                        .replace(/\\t/g, '\t')
                        .replace(/\\"/g, '"');
                }
                
                console.log('✅ 부분 추출 성공:', result);
                console.log('   - errors: ' + result.errors.length + '개');
                console.log('   - issues: ' + result.issues.length + '개');
                console.log('   - scores: ' + (result.scores ? '있음' : '없음'));
                console.log('   - perfectScript: ' + (result.perfectScript ? result.perfectScript.length + '자' : '없음'));
                return result;
                
            } catch (e3) {
                console.error('❌ 모든 파싱 시도 실패');
                
                // v4.54 강화: 최후의 수단 - 정규식으로 개별 오류 객체 직접 추출
                var lastResortErrors = extractErrorsFromRawText(jsonText);
                if (lastResortErrors.length > 0) {
                    console.log('✅ 최후 수단 복구 성공: ' + lastResortErrors.length + '개 오류 추출');
                    return {
                        errors: lastResortErrors,
                        issues: lastResortErrors,
                        scores: { senior: 70, fun: 70, flow: 70, retention: 70 },
                        perfectScript: '',
                        changePoints: []
                    };
                }
                
                return {
                    errors: [],
                    issues: [],
                    scores: { senior: 70, fun: 70, flow: 70, retention: 70 },
                    perfectScript: '⚠️ AI 응답 파싱 실패. 다시 분석해주세요.',
                    changePoints: []
                };
            }
        }
    }
}

// ============================================================
// extractIndividualObjects - 깨진 JSON 배열에서 개별 객체 복구 (v4.54 추가)
// ============================================================
function extractIndividualObjects(arrayContent) {
    var objects = [];
    var braceDepth = 0;
    var currentObj = '';
    var inString = false;
    var escapeNext = false;
    
    for (var i = 0; i < arrayContent.length; i++) {
        var ch = arrayContent[i];
        
        if (escapeNext) {
            currentObj += ch;
            escapeNext = false;
            continue;
        }
        
        if (ch === '\\') {
            currentObj += ch;
            escapeNext = true;
            continue;
        }
        
        if (ch === '"' && !escapeNext) {
            inString = !inString;
            currentObj += ch;
            continue;
        }
        
        if (!inString) {
            if (ch === '{') {
                if (braceDepth === 0) {
                    currentObj = '';
                }
                braceDepth++;
                currentObj += ch;
            } else if (ch === '}') {
                braceDepth--;
                currentObj += ch;
                if (braceDepth === 0 && currentObj.trim().length > 2) {
                    try {
                        var parsed = JSON.parse(currentObj);
                        objects.push(parsed);
                    } catch (e) {
                        // 개별 객체 파싱 실패 시 정규식으로 필드 추출 시도
                        var recovered = recoverObjectFromText(currentObj);
                        if (recovered) {
                            objects.push(recovered);
                        }
                    }
                    currentObj = '';
                }
            } else {
                if (braceDepth > 0) {
                    currentObj += ch;
                }
            }
        } else {
            currentObj += ch;
        }
    }
    
    return objects;
}

// ============================================================
// recoverObjectFromText - 깨진 개별 객체에서 필드값 복구 (v4.54 추가)
// ============================================================
function recoverObjectFromText(text) {
    var typeMatch = text.match(/"type"\s*:\s*"([^"]+)"/);
    var originalMatch = text.match(/"original"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    var revisedMatch = text.match(/"revised"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    var suggestionMatch = text.match(/"suggestion"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    var reasonMatch = text.match(/"reason"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    var severityMatch = text.match(/"severity"\s*:\s*"([^"]+)"/);
    
    if (originalMatch && (revisedMatch || suggestionMatch)) {
        var obj = {
            type: typeMatch ? typeMatch[1] : '기타',
            original: originalMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n'),
            revised: revisedMatch ? revisedMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n') : '',
            suggestion: suggestionMatch ? suggestionMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n') : '',
            reason: reasonMatch ? reasonMatch[1].replace(/\\"/g, '"') : '',
            severity: severityMatch ? severityMatch[1] : 'medium'
        };
        
        // suggestion이 있고 revised가 없으면 suggestion을 revised로 복사
        if (!obj.revised && obj.suggestion) {
            obj.revised = obj.suggestion;
        }
        
        console.log('   🔧 객체 복구: type=' + obj.type + ', original="' + obj.original.substring(0, 20) + '..."');
        return obj;
    }
    
    return null;
}

// ============================================================
// extractErrorsFromRawText - 원시 텍스트에서 오류 객체 직접 추출 (v4.54 추가)
// 최후의 수단: JSON 구조가 완전히 깨졌을 때 사용
// ============================================================
function extractErrorsFromRawText(text) {
    var errors = [];
    
    // "original" : "..." 패턴과 "revised"/"suggestion" : "..." 패턴을 쌍으로 찾기
    var pattern = /"type"\s*:\s*"([^"]+)"[\s\S]*?"original"\s*:\s*"((?:[^"\\]|\\.)*)"[\s\S]*?(?:"revised"|"suggestion")\s*:\s*"((?:[^"\\]|\\.)*)"/g;
    var match;
    
    while ((match = pattern.exec(text)) !== null) {
        var reasonMatch = text.substring(match.index, match.index + match[0].length + 200).match(/"reason"\s*:\s*"((?:[^"\\]|\\.)*)"/);
        var severityMatch = text.substring(match.index, match.index + match[0].length + 200).match(/"severity"\s*:\s*"([^"]+)"/);
        
        errors.push({
            type: match[1],
            original: match[2].replace(/\\"/g, '"').replace(/\\n/g, '\n'),
            revised: match[3].replace(/\\"/g, '"').replace(/\\n/g, '\n'),
            suggestion: match[3].replace(/\\"/g, '"').replace(/\\n/g, '\n'),
            reason: reasonMatch ? reasonMatch[1].replace(/\\"/g, '"') : '',
            severity: severityMatch ? severityMatch[1] : 'medium'
        });
    }
    
    return errors;
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

async function startStage1Analysis() {
    var script = document.getElementById('original-script').value.trim();
    if (!script) { alert('분석할 대본을 입력해주세요.'); return; }
    var apiKey = localStorage.getItem('GEMINI_API_KEY');
    if (!apiKey) { alert('API 키를 먼저 설정해주세요.'); return; }

    showProgress('1차 분석 시작...');
    updateProgress(2, '준비 중...');

    try {
        state.stage1.originalScript = script;
        state.stage1.isFixed = false;
        state.stage1.currentErrorIndex = -1;

        // ============================================================
        // STEP 0: 캐시 생성 (전체 대본을 1회만 저장)
        // ============================================================
        updateProgress(3, '📦 전체 대본 캐시 생성 중...');

        var systemPrompt = '당신은 조선시대 사극 대본 전문 검수자입니다. ' +
            '사용자가 제공한 전체 대본을 완전히 이해한 상태에서, ' +
            '요청받은 역할에 따라 집중 분석합니다. ' +
            '전체 대본의 인물, 시간, 장소, 복선, 감정선을 모두 파악하고 있어야 합니다.';

        var cacheName = await createScriptCache(script, systemPrompt, 1800);
        state._cacheName = cacheName;

        if (!cacheName) {
            console.log('⚠️ 캐시 생성 실패, 기존 방식으로 폴백');
            await startStage1AnalysisFallback(script);
            return;
        }

        console.log('✅ 캐시 생성 성공: ' + cacheName);
        startCacheTimer(cacheName, 1800);

        // ============================================================
        // STEP 1: 역할 × 청크 매트릭스 병렬 분석
        // 캐시에 전체 대본 → 프롬프트에는 청크만 포함
        // ============================================================
        updateProgress(8, '🔍 매트릭스 병렬 분석 시작...');

        var roles = [
            { id: 'role1_historical', name: '시대고증' },
            { id: 'role2_person_time', name: '인물·시간' },
            { id: 'role3_structure', name: '서사구조' },
            { id: 'role4_character', name: '캐릭터·감정' }
        ];

        var matrixResult = await runMatrixAnalysis(script, roles, cacheName, 6500, 10, 80, '1차 분석');
        var mergedErrors = matrixResult.errors;

        console.log('🔍 1차 분석 완료: 총 ' + mergedErrors.length + '개 오류');

        // ============================================================
        // STEP 2: 결과 저장 및 표시
        // ============================================================
        updateProgress(82, '결과 저장 중...');

        state.stage1.analysis = [];
        state.stage1.allErrors = mergedErrors.map(function(err, idx) {
            return {
                id: 'stage1-error-' + idx,
                type: err.type || '기타',
                original: err.original || '',
                revised: err.revised || err.suggestion || '',
                reason: err.reason || '',
                severity: err.severity || 'medium',
                useRevised: true
            };
        });

        updateProgress(85, '결과 표시 중...');
        displayStage1Results();

        var revisedText = buildStage1FixedScript();
        state.stage1.revisedScript = revisedText;
        state.stage1.fixedScript = revisedText;
        console.log('📝 1차 수정본 저장 완료: ' + revisedText.length + '자');

        updateProgress(100, '1차 분석 완료!');
        setTimeout(hideProgress, 1000);

    } catch (error) {
        if (error.name !== 'AbortError') { alert('분석 중 오류가 발생했습니다: ' + error.message); }
        hideProgress();
    }
}

async function startStage1AnalysisFallback(script) {
    console.log('⚠️ 폴백 모드: 기존 방식(요약+청크)으로 1차 분석');

    try {
        updateProgress(3, '📝 1패스: 전체 대본 구조 파악 중...');
        var scriptSummary = await generateScriptSummary(script);
        state.scriptSummary = scriptSummary;

        updateProgress(5, '📋 2패스: 청크별 오류 분석 준비 중...');
        var chunks = splitScriptIntoChunks(script, 6500);
        var scriptContext = extractScriptContext(script);
        var allErrors = [];
        var allAnalysis = [];

        for (var i = 0; i < chunks.length; i++) {
            var chunk = chunks[i];
            var progressPercent = 10 + Math.round((i / chunks.length) * 70);
            updateProgress(progressPercent, '1차 분석 중... (' + (i + 1) + '/' + chunks.length + ' 청크)');

            var contextInfo = '\n\n## 📌 대본 전체 맥락 정보\n';
            contextInfo += '현재 분석 구간: 전체 ' + script.length + '자 중 ' + chunk.startIndex + '~' + chunk.endIndex + '자 (' + (i + 1) + '/' + chunks.length + ' 구간)\n\n';

            if (state.scriptSummary) {
                contextInfo += '### 📖 전체 대본 요약 (참고용):\n' + state.scriptSummary + '\n\n';
            }

            if (scriptContext.characters.length > 0) {
                contextInfo += '### 등장인물 목록:\n';
                for (var c = 0; c < scriptContext.characters.length; c++) {
                    var ch = scriptContext.characters[c];
                    contextInfo += '- ' + ch.name + (ch.age ? ' (' + ch.age + ')' : '') + (ch.trait ? ' - ' + ch.trait : '') + '\n';
                }
                contextInfo += '\n';
            }

            if (scriptContext.timeExpressions.length > 0) {
                contextInfo += '### 대본 전체에 등장하는 시간 표현:\n';
                for (var t = 0; t < scriptContext.timeExpressions.length; t++) {
                    contextInfo += '- "' + scriptContext.timeExpressions[t].text + '" (위치: ' + scriptContext.timeExpressions[t].position + ')\n';
                }
                contextInfo += '\n';
            }

            var prompt = buildStage1Prompt(chunk.text + contextInfo);

            try {
                var response = await callGeminiAPI(prompt);
                var result = parseApiResponse(response);
                allAnalysis.push(result);

                var chunkErrors = filterNarrationErrors(result.errors || [], chunk.text);
                for (var e = 0; e < chunkErrors.length; e++) {
                    chunkErrors[e]._chunkNum = i + 1;
                    allErrors.push(chunkErrors[e]);
                }
            } catch (chunkError) {
                if (chunkError.name === 'AbortError') throw chunkError;
                console.error('   ❌ 청크 ' + (i + 1) + ' 분석 실패: ' + chunkError.message);
            }
        }

        state.stage1.analysis = allAnalysis;
        state.stage1.allErrors = allErrors.map(function(err, idx) {
            return { id: 'stage1-error-' + idx, type: err.type, original: err.original, revised: err.revised, reason: err.reason, severity: err.severity, useRevised: true };
        });

        updateProgress(90, '결과 표시 중...');
        displayStage1Results();

        var revisedText = buildStage1FixedScript();
        state.stage1.revisedScript = revisedText;
        state.stage1.fixedScript = revisedText;

        updateProgress(100, '1차 분석 완료! (폴백 모드)');
        setTimeout(hideProgress, 1000);

    } catch (error) {
        if (error.name !== 'AbortError') { alert('분석 중 오류가 발생했습니다: ' + error.message); }
        hideProgress();
    }
}

// ============================================================
// startStage2Analysis - 2차 분석 실행 (v4.53 최종 수정)
// 핵심: 1차 수정 반영 대본 → 2차 분석 → 최종 수정 반영 → 100점 대본
// ============================================================
async function startStage2Analysis() {
    console.log('🔬 ========================================');
    console.log('🔬 2차 분석 시작 (매트릭스 병렬 방식)');
    console.log('🔬 ========================================');

    var stage1Original = state.stage1 ? state.stage1.originalScript : '';
    var stage1Errors = state.stage1 ? state.stage1.allErrors : [];

    if (!stage1Original || stage1Original.trim().length === 0) {
        alert('1차 분석을 먼저 완료해주세요.');
        return;
    }

    // ============================================================
    // 1차 수정본 생성
    // ============================================================
    var stage1FixedScript = buildStage1FixedScript();

    var stage1AppliedCount = 0;
    var stage1AppliedList = [];
    var stage1ErrorsForList = state.stage1.allErrors || [];

    for (var i = 0; i < stage1ErrorsForList.length; i++) {
        var errForList = stage1ErrorsForList[i];
        if (errForList.useRevised && errForList.original && errForList.revised) {
            var revisedTextForList = cleanRevisedText(errForList.revised);
            if (stage1FixedScript.indexOf(revisedTextForList) !== -1) {
                stage1AppliedCount++;
                stage1AppliedList.push({
                    index: i,
                    original: errForList.original.substring(0, 30),
                    revised: revisedTextForList.substring(0, 30)
                });
            }
        }
    }

    console.log('📄 1차 수정 적용: ' + stage1AppliedCount + '개, 수정본: ' + stage1FixedScript.length + '자');
    state.stage1.revisedScript = stage1FixedScript;
    state.stage1.fixedScript = stage1FixedScript;

    if (stage1FixedScript.trim().length < 10) {
        alert('대본 내용이 너무 짧습니다.');
        return;
    }

    showProgress('2차 정밀 분석 중...');
    updateProgress(2, '준비 중...');

    try {
        // ============================================================
        // STEP 0: 2차 분석용 캐시 생성 (1차 수정본 기반)
        // ============================================================
        updateProgress(3, '📦 2차 분석용 캐시 생성 중...');

        if (state._cacheName) {
            deleteScriptCache(state._cacheName);
            state._cacheName = null;
        }

        var systemPrompt2 = '당신은 대한민국 방송 역사상 가장 뛰어난 사극 드라마 감독입니다.\n' +
            'KBS <대장금>, MBC <이산>, SBS <뿌리깊은 나무>, tvN <미스터 션샤인> 급의 명작 사극을 직접 연출한 경력 30년의 거장입니다.\n' +
            '사용자가 제공한 전체 대본을 완전히 이해한 상태에서, 요청받은 역할에 따라 집중 분석합니다.\n' +
            '냉정하지만 정확한 피드백으로 이 대본을 명작 수준으로 끌어올려야 합니다.';

        var cacheName2 = await createScriptCache(stage1FixedScript, systemPrompt2, 1800);
        state._cacheName = cacheName2;

        if (!cacheName2) {
            console.log('⚠️ 2차 캐시 생성 실패, 기존 방식으로 폴백');
            await startStage2AnalysisFallback(stage1FixedScript, stage1Original, stage1AppliedList, stage1AppliedCount);
            return;
        }

        console.log('✅ 2차 캐시 생성 성공: ' + cacheName2);
        startCacheTimer(cacheName2, 1800);

        // ============================================================
        // STEP 1: 역할 × 청크 매트릭스 병렬 분석
        // 4개 역할 × N개 청크 + role6(점수) 별도 1개 = 동시 실행
        // ============================================================
        updateProgress(8, '🔍 매트릭스 병렬 분석 시작...');

        var chunkRoles = [
            { id: 'role2_person_time', name: '인물·시간' },
            { id: 'role3_structure', name: '서사구조' },
            { id: 'role4_character', name: '캐릭터·감정' },
            { id: 'role5_dialogue', name: '대사품질' }
        ];

        // role6(점수 평가)는 청크 없이 캐시만 참조 → 별도 호출
        var role6Promise = retryWithDelay(function() {
            var role6Prompt = buildRolePrompt('role6_audience', '', '', stage1FixedScript.length);
            return callGeminiAPI(role6Prompt, cacheName2);
        }, 3, 3000);

        // 4개 역할 × N개 청크 매트릭스 분석
        var matrixPromise = runMatrixAnalysis(stage1FixedScript, chunkRoles, cacheName2, 6500, 10, 65, '2차 분석');

        // 매트릭스 + role6 동시 실행
        var allResults = await Promise.allSettled([matrixPromise, role6Promise]);

        updateProgress(70, '🔀 결과 통합 중...');

        // ============================================================
        // 매트릭스 결과 처리
        // ============================================================
        var matrixResult = { errors: [], role6Data: { scores: null, scoreDetails: null } };
        if (allResults[0].status === 'fulfilled') {
            matrixResult = allResults[0].value;
            console.log('   ✅ 매트릭스 분석: ' + matrixResult.errors.length + '개 오류');
        } else {
            console.error('   ❌ 매트릭스 분석 실패:', allResults[0].reason ? allResults[0].reason.message : '알 수 없는 오류');
        }

        // ============================================================
        // role6 결과 처리 (점수 + 추가 오류)
        // ============================================================
        var role6Scores = null;
        var role6ScoreDetails = null;
        var role6Errors = [];
        if (allResults[1].status === 'fulfilled') {
            try {
                var role6Parsed = parseApiResponse(allResults[1].value);
                role6Errors = role6Parsed.errors || role6Parsed.issues || [];
                role6Errors = filterNarrationErrors(role6Errors, stage1FixedScript);
                for (var re = 0; re < role6Errors.length; re++) {
                    role6Errors[re]._role = 'role6_audience';
                }
                role6Scores = role6Parsed.scores || null;
                role6ScoreDetails = role6Parsed.scoreDetails || null;
                console.log('   ✅ 시청자 몰입도 PD: ' + role6Errors.length + '개 오류, 점수: ' + (role6Scores ? '있음' : '없음'));
            } catch (r6Error) {
                console.error('   ⚠️ role6 파싱 실패:', r6Error.message);
            }
        } else {
            console.error('   ❌ 시청자 몰입도 PD 실패:', allResults[1].reason ? allResults[1].reason.message : '알 수 없는 오류');
        }

        // ============================================================
        // 전체 결과 통합
        // ============================================================
        var allRoleErrors = matrixResult.errors.concat(role6Errors);
        var mergedErrors = mergeRoleResults(allRoleErrors);

        console.log('🔬 2차 분석 결과 요약:');
        console.log('   - 매트릭스: ' + matrixResult.errors.length + '개');
        console.log('   - 시청자 몰입: ' + role6Errors.length + '개');
        console.log('   - 통합 후: ' + mergedErrors.length + '개');

        updateProgress(75, '결과 저장 중...');

        // ============================================================
        // state.stage2 저장
        // ============================================================
        state.stage2 = {
            originalScript: stage1FixedScript,
            analysis: [],
            allErrors: mergedErrors.map(function(err, idx) {
                return {
                    id: 'stage2-error-' + idx,
                    type: err.type || '기타',
                    original: err.original || '',
                    revised: err.revised || err.suggestion || '',
                    reason: err.reason || '',
                    severity: err.severity || 'medium',
                    useRevised: true,
                    _role: err._role || ''
                };
            }),
            fixedScript: '',
            currentErrorIndex: -1,
            isFixed: false
        };

                // 최종 수정 반영 대본 생성 (공백/줄바꿈 차이 허용 매칭)
        var finalFixedScript = stage1FixedScript;
        state.stage2.allErrors.forEach(function(err) {
            if (err.useRevised && err.original && err.revised) {
                var fixedRevised = cleanRevisedText(err.revised);
                var searchText = err.original;
                
                // 1차: 정확한 매칭
                if (finalFixedScript.indexOf(searchText) !== -1) {
                    if (fixedRevised === '__DELETE__') {
                        finalFixedScript = finalFixedScript.split(searchText).join('');
                    } else {
                        finalFixedScript = finalFixedScript.split(searchText).join(fixedRevised);
                    }
                } else {
                    // 2차: 공백/줄바꿈 차이 허용 매칭
                    var searchWords = searchText.split(/\s+/).filter(function(w) { return w.length > 0; });
                    if (searchWords.length >= 2) {
                        var regexStr = searchWords.map(function(w) {
                            return w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                        }).join('\\s+');
                        try {
                            var regex = new RegExp(regexStr);
                            var match = finalFixedScript.match(regex);
                            if (match) {
                                if (fixedRevised === '__DELETE__') {
                                    finalFixedScript = finalFixedScript.replace(match[0], '');
                                } else {
                                    finalFixedScript = finalFixedScript.replace(match[0], fixedRevised);
                                }
                            }
                        } catch (e) {
                            // regex 오류 무시
                        }
                    }
                }
            }
        });
        finalFixedScript = finalFixedScript.replace(/\n\s*\n\s*\n/g, '\n\n');

        state.stage2.fixedScript = finalFixedScript;
        state.finalScript = finalFixedScript;

        updateProgress(80, '점수 계산 중...');

        // ============================================================
        // 점수 계산
        // ============================================================
        var aiScores = role6Scores || { senior: 75, fun: 75, flow: 75, retention: 75 };
        var scoreDetails = role6ScoreDetails || {};

        var scoreResult = null;
        try {
            scoreResult = calculateScoresFromAnalysis(finalFixedScript, aiScores, scoreDetails);
            state.scores = scoreResult;
        } catch (scoreError) {
            console.error('⚠️ 점수 계산 오류:', scoreError);
            scoreResult = {
                finalScores: aiScores,
                deductions: { senior: [], fun: [], flow: [], retention: [] }
            };
            state.scores = scoreResult;
        }

        var improvements = [];

        updateProgress(85, '결과 정리 중...');

        // ============================================================
        // 100점 대본 (2차 수정본을 기본값으로)
        // ============================================================
        state.perfectScript = finalFixedScript;

        state.changePoints = [];
        try {
            var changes = findDifferences(stage1Original, state.perfectScript);
            state.changePoints = changes.slice(0, 10);
        } catch (diffError) {
            state.changePoints = [];
        }

        updateProgress(90, '결과 표시 중...');

        // ============================================================
        // 결과 표시
        // ============================================================
        displayStage2Results(mergedErrors);
        displayScoresAndPerfectScript(scoreResult.finalScores, scoreResult.deductions, improvements);

        // 캐시 정리
        if (state._cacheName) {
            deleteScriptCache(state._cacheName);
            state._cacheName = null;
        }
                // 캐시 정리
        if (state._cacheName) {
            deleteScriptCache(state._cacheName);
            state._cacheName = null;
        }
        updateProgress(100, '2차 분석 완료!');

        var avgScore = Math.round((scoreResult.finalScores.senior + scoreResult.finalScores.fun + scoreResult.finalScores.flow + scoreResult.finalScores.retention) / 4);
        console.log('🔬 ========================================');
        console.log('🔬 2차 분석 완료! 평균: ' + avgScore + '점');
        console.log('🔬 ========================================');

        setTimeout(hideProgress, 1000);

    } catch (error) {
        console.error('❌ 2차 분석 오류:', error);
        if (state._cacheName) {
            deleteScriptCache(state._cacheName);
            state._cacheName = null;
        }
        hideProgress();
        if (error.name !== 'AbortError') {
            alert('2차 분석 중 오류가 발생했습니다: ' + error.message);
        }
    }
}

async function startStage2AnalysisFallback(stage1FixedScript, stage1Original, stage1AppliedList, stage1AppliedCount) {
    console.log('⚠️ 폴백 모드: 기존 방식(요약+청크)으로 2차 분석');

    try {
        var chunks = splitScriptIntoChunks(stage1FixedScript, 6500);
        var scriptContext = extractScriptContext(stage1FixedScript);
        var allIssues = [];
        var allAnalysisResults = [];

        for (var ci = 0; ci < chunks.length; ci++) {
            var chunk = chunks[ci];
            var progressPercent = 10 + Math.round((ci / chunks.length) * 50);
            updateProgress(progressPercent, '2차 분석 중... (' + (ci + 1) + '/' + chunks.length + ' 청크)');

            var contextInfo = '\n\n## 📌 대본 전체 맥락 정보\n';
            contextInfo += '현재 분석 구간: 전체 ' + stage1FixedScript.length + '자 중 ' + chunk.startIndex + '~' + chunk.endIndex + '자 (' + (ci + 1) + '/' + chunks.length + ' 구간)\n\n';

            if (state.scriptSummary) {
                contextInfo += '### 📖 전체 대본 요약:\n' + state.scriptSummary + '\n\n';
            }

            if (scriptContext.characters.length > 0) {
                contextInfo += '### 등장인물 목록:\n';
                for (var cc = 0; cc < scriptContext.characters.length; cc++) {
                    var ch = scriptContext.characters[cc];
                    contextInfo += '- ' + ch.name + (ch.age ? ' (' + ch.age + ')' : '') + (ch.trait ? ' - ' + ch.trait : '') + '\n';
                }
                contextInfo += '\n';
            }

            if (scriptContext.timeExpressions.length > 0) {
                contextInfo += '### 시간 표현:\n';
                for (var tt = 0; tt < scriptContext.timeExpressions.length; tt++) {
                    contextInfo += '- "' + scriptContext.timeExpressions[tt].text + '"\n';
                }
                contextInfo += '\n';
            }

            var prompt = buildStage2Prompt(chunk.text + contextInfo);

            try {
                var response = await callGeminiAPI(prompt);
                var chunkResult = parseApiResponse(response);
                allAnalysisResults.push(chunkResult);

                var chunkIssues = chunkResult.issues || chunkResult.errors || [];
                chunkIssues = filterNarrationErrors(chunkIssues, chunk.text);

                for (var ei = 0; ei < chunkIssues.length; ei++) {
                    chunkIssues[ei]._chunkNum = ci + 1;
                    allIssues.push(chunkIssues[ei]);
                }
            } catch (chunkError) {
                if (chunkError.name === 'AbortError') throw chunkError;
                console.error('   ❌ 청크 ' + (ci + 1) + ' 실패: ' + chunkError.message);
            }
        }

        updateProgress(62, '🔍 3패스: 전체 흐름 검증 중...');
        var flowIssues = await verifyOverallFlow(stage1FixedScript, state.scriptSummary || '', allIssues);
        if (flowIssues.length > 0) {
            for (var fi = 0; fi < flowIssues.length; fi++) {
                flowIssues[fi]._from3rdPass = true;
                allIssues.push(flowIssues[fi]);
            }
        }

        var filteredIssues = allIssues;
        updateProgress(68, '결과 저장 중...');

        state.stage2 = {
            originalScript: stage1FixedScript,
            analysis: allAnalysisResults,
            allErrors: filteredIssues.map(function(err, idx) {
                return {
                    id: 'stage2-error-' + idx,
                    type: err.type || '기타',
                    original: err.original || '',
                    revised: err.revised || err.suggestion || '',
                    reason: err.reason || '',
                    severity: err.severity || 'medium',
                    useRevised: true,
                    _from3rdPass: err._from3rdPass || false
                };
            }),
            fixedScript: '',
            currentErrorIndex: -1,
            isFixed: false
        };

        var finalFixedScript = stage1FixedScript;
        state.stage2.allErrors.forEach(function(err) {
            if (err.useRevised && err.original && err.revised) {
                var fixedRevised = cleanRevisedText(err.revised);
                if (fixedRevised === '__DELETE__') {
                    finalFixedScript = finalFixedScript.split(err.original).join('');
                } else {
                    finalFixedScript = finalFixedScript.split(err.original).join(fixedRevised);
                }
            }
        });
        finalFixedScript = finalFixedScript.replace(/\n\s*\n\s*\n/g, '\n\n');
        state.stage2.fixedScript = finalFixedScript;
        state.finalScript = finalFixedScript;

        updateProgress(75, '점수 계산 중...');

        var aiScores = { senior: 0, fun: 0, flow: 0, retention: 0 };
        var scoreDetails = {};
        var scoreCount = 0;
        for (var si = 0; si < allAnalysisResults.length; si++) {
            if (allAnalysisResults[si].scores) {
                var s = allAnalysisResults[si].scores;
                aiScores.senior += (s.senior || 0);
                aiScores.fun += (s.fun || 0);
                aiScores.flow += (s.flow || 0);
                aiScores.retention += (s.retention || 0);
                scoreCount++;
            }
            if (allAnalysisResults[si].scoreDetails) {
                scoreDetails = allAnalysisResults[si].scoreDetails;
            }
        }
        if (scoreCount > 0) {
            aiScores.senior = Math.round(aiScores.senior / scoreCount);
            aiScores.fun = Math.round(aiScores.fun / scoreCount);
            aiScores.flow = Math.round(aiScores.flow / scoreCount);
            aiScores.retention = Math.round(aiScores.retention / scoreCount);
        } else {
            aiScores = { senior: 75, fun: 75, flow: 75, retention: 75 };
        }

        var scoreResult = null;
        try {
            scoreResult = calculateScoresFromAnalysis(finalFixedScript, aiScores, scoreDetails);
            state.scores = scoreResult;
        } catch (scoreError) {
            scoreResult = {
                finalScores: aiScores,
                deductions: { senior: [], fun: [], flow: [], retention: [] }
            };
            state.scores = scoreResult;
        }

        var improvements = [];
        for (var ii = 0; ii < allAnalysisResults.length; ii++) {
            if (allAnalysisResults[ii].improvements) {
                improvements = improvements.concat(allAnalysisResults[ii].improvements);
            }
        }

        updateProgress(85, '100점 대본 생성 중...');

        var aiPerfectScript = '';
        for (var pi = 0; pi < allAnalysisResults.length; pi++) {
            if (allAnalysisResults[pi].perfectScript && allAnalysisResults[pi].perfectScript.length > aiPerfectScript.length) {
                aiPerfectScript = allAnalysisResults[pi].perfectScript;
            }
        }

        var usePerfectFromAI = false;
        if (aiPerfectScript && aiPerfectScript.trim().length > 100) {
            var stage1ReflectedInAI = true;
            for (var k = 0; k < stage1AppliedList.length && k < 3; k++) {
                if (aiPerfectScript.indexOf(stage1AppliedList[k].revised) === -1) {
                    stage1ReflectedInAI = false;
                    break;
                }
            }
            if (stage1ReflectedInAI) usePerfectFromAI = true;
        }

        state.perfectScript = usePerfectFromAI ? aiPerfectScript : finalFixedScript;

        state.changePoints = [];
        try {
            var changes = findDifferences(stage1Original, state.perfectScript);
            state.changePoints = changes.slice(0, 10);
        } catch (diffError) {
            state.changePoints = [];
        }

        updateProgress(95, '결과 표시 중...');
        displayStage2Results(filteredIssues);
        displayScoresAndPerfectScript(scoreResult.finalScores, scoreResult.deductions, improvements);

        updateProgress(100, '2차 분석 완료! (폴백 모드)');
        setTimeout(hideProgress, 1000);

    } catch (error) {
        console.error('❌ 2차 분석 폴백 오류:', error);
        hideProgress();
        if (error.name !== 'AbortError') {
            alert('2차 분석 중 오류가 발생했습니다: ' + error.message);
        }
    }
}

function displayStage1Results() {
    var container = document.getElementById('analysis-stage1');
    if (!container) return;
    var errors = state.stage1.allErrors;
    if (!errors || errors.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:30px;color:#69f0ae;font-size:18px;">✅ 오류가 발견되지 않았습니다.</div>';
    } else {
        var html = '<table class="analysis-table"><thead><tr><th>유형</th><th>원문</th><th>수정</th><th>사유</th></tr></thead><tbody>';
        errors.forEach(function(err) {
            var severityColor = err.severity === 'high' ? '#ff5555' : (err.severity === 'medium' ? '#ffaa00' : '#69f0ae');
            html += '<tr data-marker-id="' + err.id + '" style="cursor:pointer;">' +
                '<td class="type-cell" style="color:' + severityColor + ';font-weight:bold;">' + formatTypeText(err.type) + '</td>' +
                '<td style="color:#ff9800;font-size:11px;">' + escapeHtml(err.original) + '</td>' +
                '<td style="color:#69f0ae;font-size:11px;">' + escapeHtml(err.revised) + '</td>' +
                '<td style="color:#aaa;font-size:11px;">' + escapeHtml(err.reason) + '</td></tr>';
        });
        html += '</tbody></table>';
        container.innerHTML = html;
        
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
    enableStage1Buttons(errors && errors.length > 0);
}

function displayStage2Results() {
    var container = document.getElementById('analysis-stage2');
    if (!container) return;
    
        // ============================================================
    // v4.54 핵심 수정: state.stage2.originalScript가 1차 수정본인지 확인
    // 만약 원본과 같다면 buildStage1FixedScript()로 강제 교체
    // ============================================================
    var stage1Original = state.stage1 ? state.stage1.originalScript : '';
    var stage1Fixed = state.stage1 ? (state.stage1.fixedScript || state.stage1.revisedScript) : '';
    
    // stage1Fixed가 없거나 원본과 같으면 buildStage1FixedScript()로 재생성
    if (!stage1Fixed || stage1Fixed.trim() === stage1Original.trim()) {
        console.log('⚠️ displayStage2Results: 1차 수정본이 없거나 원본과 동일, buildStage1FixedScript()로 재생성');
        stage1Fixed = buildStage1FixedScript();
        state.stage1.fixedScript = stage1Fixed;
        state.stage1.revisedScript = stage1Fixed;
    }
    
    // state.stage2.originalScript가 원본과 같으면 1차 수정본으로 교체
    if (state.stage2.originalScript.trim() === stage1Original.trim() && stage1Fixed && stage1Fixed.trim() !== stage1Original.trim()) {
        console.log('⚠️ displayStage2Results: stage2.originalScript가 원본임, 1차 수정본으로 교체');
        state.stage2.originalScript = stage1Fixed;
        console.log('✅ stage2.originalScript 교체 완료: ' + stage1Fixed.length + '자');
    }
    
    console.log('📊 displayStage2Results 시작');
    console.log('   - stage2.originalScript 길이: ' + (state.stage2.originalScript ? state.stage2.originalScript.length : 0) + '자');
    
    var errors = state.stage2.allErrors;
    if (!errors || errors.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:30px;color:#69f0ae;font-size:18px;">✅ 추가 오류가 발견되지 않았습니다.</div>';
    } else {
        var html = '<table class="analysis-table"><thead><tr><th>유형</th><th>원문</th><th>수정</th><th>사유</th></tr></thead><tbody>';
        errors.forEach(function(err) {
            var severityColor = err.severity === 'high' ? '#ff5555' : (err.severity === 'medium' ? '#ffaa00' : '#69f0ae');
            html += '<tr data-marker-id="' + err.id + '" style="cursor:pointer;">' +
                '<td class="type-cell" style="color:' + severityColor + ';font-weight:bold;">' + formatTypeText(err.type) + '</td>' +
                '<td style="color:#ff9800;font-size:11px;">' + escapeHtml(err.original) + '</td>' +
                '<td style="color:#69f0ae;font-size:11px;">' + escapeHtml(err.revised) + '</td>' +
                '<td style="color:#aaa;font-size:11px;">' + escapeHtml(err.reason) + '</td></tr>';
        });
        html += '</tbody></table>';
        container.innerHTML = html;
        
        container.querySelectorAll('tr[data-marker-id]').forEach(function(row) {
            row.addEventListener('click', function() {
                var markerId = this.getAttribute('data-marker-id');
                var errorIndex = findErrorIndexById('stage2', markerId);
                if (errorIndex >= 0) { 
                    setCurrentError('stage2', errorIndex); 
                    console.log('🎯 2차 분석 테이블 클릭: 최종 수정 반영으로 스크롤 이동');
                }
            });
        });
    }
    
    renderScriptWithMarkers('stage2');
    enableStage2Buttons(true);
    
    console.log('📊 2차 분석 결과 표시 완료: 오류 ' + (errors ? errors.length : 0) + '개');
}

function getCategoryColor(category) {
    var colors = {
        '시니어적합도': '#4CAF50',
        '재미요소': '#FF9800',
        '이야기흐름': '#2196F3',
        '시청자이탈방지': '#9C27B0',
        '시대착오': '#f44336',
        '인물설정': '#00BCD4',
        '캐릭터일관성': '#FFEB3B',
        '장면연결성': '#E91E63'
    };
    return colors[category] || '#69f0ae';
}

function displayScoresAndPerfectScript(scores, deductions, improvements) {
    var scoreSection = document.getElementById('score-display');
    if (!scoreSection) {
        console.error('❌ score-display 요소를 찾을 수 없습니다');
        return;
    }
    
    var avgScore = Math.round((scores.senior + scores.fun + scores.flow + scores.retention) / 4);
    var passClass = avgScore >= 80 ? 'pass' : 'fail';
    var passText = avgScore >= 80 ? '합격' : '재검토 필요';
    
    var html = '<div style="padding:20px;">' +
        '<div style="text-align:center;margin-bottom:20px;">' +
        '<span style="font-size:24px;font-weight:bold;color:' + (avgScore >= 80 ? '#69f0ae' : '#ff5555') + ';">' +
        '평균: ' + avgScore + '점 (' + passText + ')' +
        '</span></div>' +
        '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:15px;margin-bottom:20px;">' +
        createScoreCard('시니어 적합도', scores.senior, deductions.senior) +
        createScoreCard('재미 요소', scores.fun, deductions.fun) +
        createScoreCard('이야기 흐름', scores.flow, deductions.flow) +
        createScoreCard('시청자 이탈 방지', scores.retention, deductions.retention) +
        '</div>' +
        '</div>';
    
    scoreSection.innerHTML = html;
    
    var downloadBtn = document.getElementById('btn-download');
    if (downloadBtn) downloadBtn.disabled = false;
    
    console.log('📊 점수 표시 완료 - 평균:', avgScore);
    showPerfectScriptSection();
}

// ============================================================
// 100점 대본 실제 반영 내용 추출 및 정확한 위치 이동 시스템
// v4.53 강화 버전 - 실제 텍스트 매칭 보장
// ============================================================

/**
 * 100점 대본에서 실제 변경된 내용을 추출
 * 원본 대본과 100점 대본을 비교하여 실제 차이점을 찾음
 */
function extractPerfectScriptExamples(perfectScript, scores) {
    console.log('🔍 extractPerfectScriptExamples 시작');
    
    var examples = {
        '시니어 적합도': '',
        '재미 요소': '',
        '이야기 흐름': '',
        '시청자 이탈 방지': ''
    };
    
    // 각 카테고리별 실제 텍스트 저장 (클릭 시 이동용)
    var exampleTexts = {
        '시니어 적합도': '',
        '재미 요소': '',
        '이야기 흐름': '',
        '시청자 이탈 방지': ''
    };
    
    if (!perfectScript || perfectScript.length < 10) {
        console.log('⚠️ perfectScript가 없거나 너무 짧음');
        return examples;
    }
    
    // 100점 대본을 줄 단위로 분리
    var lines = perfectScript.split('\n').filter(function(line) {
        var trimmed = line.trim();
        return trimmed.length > 5 && 
               !trimmed.startsWith('나레이션') && 
               !trimmed.startsWith('NA:') && 
               !trimmed.startsWith('N:');
    });
    
    console.log('📄 100점 대본 줄 수: ' + lines.length);
    
    // ========== 시니어 적합도: 짧고 명확한 문장 (15~35자) ==========
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        if (line.length >= 15 && line.length <= 35) {
            examples['시니어 적합도'] = '"' + line + '"';
            exampleTexts['시니어 적합도'] = line;
            console.log('✅ 시니어 적합도 예시 찾음: ' + line.substring(0, 30));
            break;
        }
    }
    // 못 찾으면 가장 짧은 줄 사용
    if (!examples['시니어 적합도']) {
        var shortestLine = '';
        var shortestLen = 9999;
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (line.length >= 10 && line.length < shortestLen) {
                shortestLen = line.length;
                shortestLine = line;
            }
        }
        if (shortestLine) {
            examples['시니어 적합도'] = '"' + shortestLine.substring(0, 40) + (shortestLine.length > 40 ? '...' : '') + '"';
            exampleTexts['시니어 적합도'] = shortestLine;
            console.log('✅ 시니어 적합도 예시 (대체): ' + shortestLine.substring(0, 30));
        }
    }
    
    // ========== 재미 요소: 감정/갈등 표현 문장 ==========
    var funKeywords = ['!', '그런데', '하지만', '놀라', '화가', '슬퍼', '기뻐', '두려', '분노', '갈등', '충격', '반전', '위기'];
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        for (var j = 0; j < funKeywords.length; j++) {
            if (line.includes(funKeywords[j])) {
                examples['재미 요소'] = '"' + line.substring(0, 45) + (line.length > 45 ? '...' : '') + '"';
                exampleTexts['재미 요소'] = line;
                console.log('✅ 재미 요소 예시 찾음: ' + line.substring(0, 30));
                break;
            }
        }
        if (examples['재미 요소']) break;
    }
    // 못 찾으면 물음표나 느낌표 있는 줄
    if (!examples['재미 요소']) {
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (line.includes('?') || line.includes('!')) {
                examples['재미 요소'] = '"' + line.substring(0, 45) + (line.length > 45 ? '...' : '') + '"';
                exampleTexts['재미 요소'] = line;
                console.log('✅ 재미 요소 예시 (대체): ' + line.substring(0, 30));
                break;
            }
        }
    }
    
    // ========== 이야기 흐름: 전환 표현 문장 ==========
    var flowKeywords = ['그때', '한편', '잠시 후', '다음 날', '그러자', '그래서', '때문에', '그 후', '얼마 뒤', '이윽고', '드디어', '결국'];
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        for (var j = 0; j < flowKeywords.length; j++) {
            if (line.includes(flowKeywords[j])) {
                examples['이야기 흐름'] = '"' + line.substring(0, 45) + (line.length > 45 ? '...' : '') + '"';
                exampleTexts['이야기 흐름'] = line;
                console.log('✅ 이야기 흐름 예시 찾음: ' + line.substring(0, 30));
                break;
            }
        }
        if (examples['이야기 흐름']) break;
    }
    // 못 찾으면 중간 부분에서 아무 줄이나
    if (!examples['이야기 흐름'] && lines.length > 2) {
        var midIndex = Math.floor(lines.length / 2);
        var line = lines[midIndex].trim();
        examples['이야기 흐름'] = '"' + line.substring(0, 45) + (line.length > 45 ? '...' : '') + '"';
        exampleTexts['이야기 흐름'] = line;
        console.log('✅ 이야기 흐름 예시 (대체): ' + line.substring(0, 30));
    }
    
    // ========== 시청자 이탈 방지: 호기심 유발 문장 (끝부분에서) ==========
    var hookKeywords = ['과연', '어떻게', '궁금', '비밀', '알 수 없', '다음', '계속', '기대', '무엇', '왜'];
    // 뒤에서부터 검색
    for (var i = lines.length - 1; i >= Math.max(0, lines.length - 20); i--) {
        var line = lines[i].trim();
        for (var j = 0; j < hookKeywords.length; j++) {
            if (line.includes(hookKeywords[j])) {
                examples['시청자 이탈 방지'] = '"' + line.substring(0, 45) + (line.length > 45 ? '...' : '') + '"';
                exampleTexts['시청자 이탈 방지'] = line;
                console.log('✅ 시청자 이탈 방지 예시 찾음: ' + line.substring(0, 30));
                break;
            }
        }
        if (examples['시청자 이탈 방지']) break;
    }
    // 못 찾으면 마지막 줄 사용
    if (!examples['시청자 이탈 방지'] && lines.length > 0) {
        var lastLine = lines[lines.length - 1].trim();
        examples['시청자 이탈 방지'] = '"' + lastLine.substring(0, 45) + (lastLine.length > 45 ? '...' : '') + '"';
        exampleTexts['시청자 이탈 방지'] = lastLine;
        console.log('✅ 시청자 이탈 방지 예시 (대체): ' + lastLine.substring(0, 30));
    }
    
    // 전역으로 실제 텍스트 저장 (클릭 이벤트에서 사용)
    window._perfectScriptExampleTexts = exampleTexts;
    
    console.log('🔍 extractPerfectScriptExamples 완료');
    console.log('   시니어 적합도: ' + (examples['시니어 적합도'] ? '있음' : '없음'));
    console.log('   재미 요소: ' + (examples['재미 요소'] ? '있음' : '없음'));
    console.log('   이야기 흐름: ' + (examples['이야기 흐름'] ? '있음' : '없음'));
    console.log('   시청자 이탈 방지: ' + (examples['시청자 이탈 방지'] ? '있음' : '없음'));
    
    return examples;
}

/**
 * 개선방안 테이블 행 클릭 시 100점 대본에서 해당 텍스트로 이동
 */
function scrollToImprovementInScript(category, categoryKeywords) {
    console.log('🎯 scrollToImprovementInScript 호출: ' + category);
    
    var scriptContent = document.getElementById('perfect-script-content');
    if (!scriptContent) {
        console.log('⚠️ perfect-script-content 요소를 찾을 수 없음');
        return;
    }
    
    if (!state.perfectScript) {
        console.log('⚠️ state.perfectScript가 없음');
        return;
    }
    
    // 전역에 저장된 실제 텍스트 가져오기
    var exampleTexts = window._perfectScriptExampleTexts || {};
    var exactText = exampleTexts[category] || '';
    
    console.log('📌 찾을 텍스트: "' + exactText.substring(0, 30) + '..."');
    
    if (!exactText) {
        console.log('⚠️ 해당 카테고리의 예시 텍스트가 없음, 키워드 검색 시도');
        // 키워드로 검색
        var keywords = categoryKeywords[category] || [];
        for (var i = 0; i < keywords.length; i++) {
            if (state.perfectScript.includes(keywords[i])) {
                exactText = keywords[i];
                break;
            }
        }
    }
    
    if (!exactText) {
        console.log('⚠️ 검색할 텍스트가 없음, 비율 기반 스크롤');
        var categoryPositions = {
            '시니어 적합도': 0.1,
            '재미 요소': 0.3,
            '이야기 흐름': 0.5,
            '시청자 이탈 방지': 0.8
        };
        var ratio = categoryPositions[category] || 0.5;
        scriptContent.scrollTop = scriptContent.scrollHeight * ratio;
        return;
    }
    
    // 100점 대본 내에서 정확한 텍스트 위치 찾기
    var perfectText = state.perfectScript;
    var searchText = exactText.trim();
    
    // 1. 정확한 매칭 시도
    var foundPosition = perfectText.indexOf(searchText);
    
    // 2. 못 찾으면 앞부분 20자로 검색
    if (foundPosition === -1 && searchText.length > 20) {
        var partialSearch = searchText.substring(0, 20);
        foundPosition = perfectText.indexOf(partialSearch);
        if (foundPosition !== -1) {
            searchText = partialSearch;
            console.log('📌 부분 매칭 성공: "' + partialSearch + '"');
        }
    }
    
    // 3. 그래도 못 찾으면 첫 10자로 검색
    if (foundPosition === -1 && searchText.length > 10) {
        var shortSearch = searchText.substring(0, 10);
        foundPosition = perfectText.indexOf(shortSearch);
        if (foundPosition !== -1) {
            searchText = shortSearch;
            console.log('📌 짧은 매칭 성공: "' + shortSearch + '"');
        }
    }
    
    if (foundPosition === -1) {
        console.log('⚠️ 텍스트를 찾을 수 없음, 비율 기반 스크롤');
        var categoryPositions = {
            '시니어 적합도': 0.1,
            '재미 요소': 0.3,
            '이야기 흐름': 0.5,
            '시청자 이탈 방지': 0.8
        };
        var ratio = categoryPositions[category] || 0.5;
        scriptContent.scrollTop = scriptContent.scrollHeight * ratio;
        return;
    }
    
    console.log('✅ 텍스트 위치 찾음: position=' + foundPosition);
    
    // HTML로 렌더링된 내용에서 하이라이트
    highlightExactTextInPerfectScript(scriptContent, searchText, category);
}

/**
 * 100점 대본 내에서 정확한 텍스트를 하이라이트하고 스크롤
 */
function highlightExactTextInPerfectScript(container, searchText, category) {
    console.log('🖍️ highlightExactTextInPerfectScript 시작: "' + searchText.substring(0, 20) + '..."');
    
    // 원본 HTML 저장 (나중에 복원용)
    if (!container._originalHtml) {
        container._originalHtml = container.innerHTML;
    }
    
    // 기존 하이라이트 제거하고 원본으로 복원
    container.innerHTML = escapeHtml(state.perfectScript);
    
    var escapedSearch = escapeHtml(searchText);
    var containerHtml = container.innerHTML;
    
    var textIndex = containerHtml.indexOf(escapedSearch);
    if (textIndex === -1) {
        console.log('⚠️ HTML에서 텍스트를 찾을 수 없음');
        // 비율 기반 스크롤
        var categoryPositions = {
            '시니어 적합도': 0.1,
            '재미 요소': 0.3,
            '이야기 흐름': 0.5,
            '시청자 이탈 방지': 0.8
        };
        var ratio = categoryPositions[category] || 0.5;
        container.scrollTop = container.scrollHeight * ratio;
        return;
    }
    
    // 해당 줄 전체를 찾기 위해 줄 경계 탐색
    var lineStart = containerHtml.lastIndexOf('\n', textIndex);
    if (lineStart === -1) lineStart = 0;
    else lineStart += 1;
    
    var lineEnd = containerHtml.indexOf('\n', textIndex);
    if (lineEnd === -1) lineEnd = containerHtml.length;
    
    var lineText = containerHtml.substring(lineStart, lineEnd);
    var highlightId = 'exact-highlight-' + Date.now();
    
    var before = containerHtml.substring(0, lineStart);
    var after = containerHtml.substring(lineEnd);
    
    // 카테고리별 색상
    var colors = {
        '시니어 적합도': '#4CAF50',
        '재미 요소': '#FF9800',
        '이야기 흐름': '#2196F3',
        '시청자 이탈 방지': '#9C27B0'
    };
    var color = colors[category] || '#69f0ae';
    
    container.innerHTML = before + 
        '<span id="' + highlightId + '" style="background:' + color + '40;border-left:4px solid ' + color + ';padding:4px 8px;display:inline;border-radius:4px;transition:all 0.3s;">' + 
        lineText + '</span>' + after;
    
    var highlightEl = document.getElementById(highlightId);
    if (highlightEl) {
        // 스크롤 이동
        highlightEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        console.log('✅ 하이라이트 적용 및 스크롤 완료');
        
        // 깜빡임 효과
        setTimeout(function() {
            if (highlightEl) {
                highlightEl.style.background = color + '80';
            }
        }, 300);
        
        setTimeout(function() {
            if (highlightEl) {
                highlightEl.style.background = color + '40';
            }
        }, 600);
        
        setTimeout(function() {
            if (highlightEl) {
                highlightEl.style.background = color + '80';
            }
        }, 900);
        
        // 3초 후 하이라이트 약하게
        setTimeout(function() {
            if (highlightEl) {
                highlightEl.style.background = color + '20';
            }
        }, 3000);
        
        // 6초 후 하이라이트 제거 (원본 텍스트로 복원)
        setTimeout(function() {
            if (highlightEl && highlightEl.parentNode) {
                highlightEl.outerHTML = lineText;
            }
        }, 6000);
    }
}
    
function formatPerfectScript(script) {
    if (!script) return '';
    
    var escaped = escapeHtml(script);
    var formatted = escaped;
    
    return formatted;
}

function scrollToPerfectScriptChange(index, changePoints) {
    if (!changePoints || !changePoints[index]) return;
    
    var point = changePoints[index];
    var scriptContent = document.querySelector('.perfect-script-content');
    if (!scriptContent) return;
    
    var originalHtml = scriptContent.innerHTML;
    var searchTexts = [
        point.location,
        point.description.substring(0, 15),
        point.description.split(' ')[0]
    ];
    
    var found = false;
    
    for (var i = 0; i < searchTexts.length && !found; i++) {
        var searchText = searchTexts[i];
        if (!searchText || searchText.length < 2) continue;
        
        var escapedSearch = escapeHtml(searchText);
        var startIdx = originalHtml.indexOf(escapedSearch);
        
        if (startIdx !== -1) {
            found = true;
            var highlightId = 'temp-highlight-' + index + '-' + Date.now();
            var before = originalHtml.substring(0, startIdx);
            var match = originalHtml.substring(startIdx, startIdx + escapedSearch.length);
            var after = originalHtml.substring(startIdx + escapedSearch.length);
            
            scriptContent.innerHTML = before + 
                '<span id="' + highlightId + '" style="background:#69f0ae80;color:#000;padding:2px 6px;border-radius:4px;border:2px solid #69f0ae;transition:all 0.3s;">' + 
                match + '</span>' + after;
            
            var highlightEl = document.getElementById(highlightId);
            if (highlightEl) {
                highlightEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                setTimeout(function() {
                    if (highlightEl && highlightEl.parentNode) {
                        highlightEl.style.background = '#69f0ae40';
                        highlightEl.style.border = '1px solid #69f0ae';
                    }
                }, 2000);
                
                setTimeout(function() {
                    if (highlightEl && highlightEl.parentNode) {
                        highlightEl.outerHTML = match;
                    }
                }, 5000);
            }
            
            console.log('📍 변경 포인트 이동: [' + point.location + '] ' + point.category + ' - "' + searchText + '" 찾음');
        }
    }
    
    if (!found) {
        scriptContent.scrollTop = 0;
        console.log('⚠️ 변경 포인트 위치 찾기 실패: ' + point.location);
    }
}

function createScoreCard(label, score, deductions) {
    var scoreColor = score >= 90 ? '#69f0ae' : score >= 70 ? '#ffaa00' : '#ff5555';
    
    // 카테고리 키 매핑
    var catKey = '';
    if (label.indexOf('시니어') > -1) catKey = 'senior';
    else if (label.indexOf('재미') > -1) catKey = 'fun';
    else if (label.indexOf('흐름') > -1) catKey = 'flow';
    else if (label.indexOf('이탈') > -1) catKey = 'retention';
    
    // 감점 사항: 항상 5줄 고정 (빈 줄은 &nbsp;)
    var deductionLines = [];
    if (deductions && deductions.length > 0) {
        deductions.slice(0, 5).forEach(function(d) {
            deductionLines.push('• ' + d);
        });
    } else {
        deductionLines.push('• 감점 사항 없음');
    }
    while (deductionLines.length < 5) {
        deductionLines.push('&nbsp;');
    }
    var deductionHtml = '';
    deductionLines.forEach(function(line) {
        deductionHtml += '<div style="font-size:11px;color:#ccc;line-height:1.6;min-height:18px;">' + line + '</div>';
    });
    
    // 개선방안: 항상 3줄 고정
    var improvementLines = [];
    if (score >= 100) {
        improvementLines.push('✅ 만점! 수정 불필요');
    } else {
        var tips = getSpecificImprovementTips(catKey, score, deductions);
        var splitTips = tips.split('<br>');
        splitTips.forEach(function(t) {
            if (t.trim()) improvementLines.push(t.trim());
        });
    }
    while (improvementLines.length < 3) {
        improvementLines.push('&nbsp;');
    }
    var improvementHtml = '';
    improvementLines.slice(0, 3).forEach(function(line) {
        var color = (line.indexOf('✅') > -1) ? '#69f0ae' : '#ccc';
        improvementHtml += '<div style="font-size:11px;color:' + color + ';line-height:1.6;min-height:18px;">' + line + '</div>';
    });
    
    var borderColor = 'rgba(255,255,255,0.08)';
    
    return '<div class="score-card" style="padding:0;overflow:hidden;">' +
        '<table style="width:100%;border-collapse:collapse;table-layout:fixed;">' +
        
        '<!-- 상단 행: 카테고리명 | 문제점 | 점수 -->' +
        '<tr>' +
            '<td style="width:28%;padding:12px 10px;vertical-align:top;border-right:1px solid ' + borderColor + ';border-bottom:1px solid ' + borderColor + ';height:120px;">' +
                '<div style="font-size:13px;color:#aaa;font-weight:bold;">' + label + '</div>' +
            '</td>' +
            '<td style="width:47%;padding:12px 10px;vertical-align:top;border-right:1px solid ' + borderColor + ';border-bottom:1px solid ' + borderColor + ';height:120px;">' +
                '<div style="font-size:11px;color:#ffaa00;font-weight:bold;margin-bottom:6px;">📋 문제점</div>' +
                deductionHtml +
            '</td>' +
            '<td style="width:25%;padding:12px 10px;text-align:center;vertical-align:middle;border-bottom:1px solid ' + borderColor + ';height:120px;">' +
                '<div style="font-size:32px;font-weight:bold;color:' + scoreColor + ';">' + score + '점</div>' +
            '</td>' +
        '</tr>' +
        
        '<!-- 하단 행: 개선방안 | 개선 내용 -->' +
        '<tr>' +
            '<td style="padding:10px;vertical-align:top;border-right:1px solid ' + borderColor + ';height:70px;">' +
                '<div style="font-size:11px;color:#69f0ae;font-weight:bold;">💡 개선방안</div>' +
            '</td>' +
            '<td colspan="2" style="padding:10px;vertical-align:top;height:70px;">' +
                improvementHtml +
            '</td>' +
        '</tr>' +
        
        '</table>' +
        '</div>';
}

function getSpecificImprovementTips(catKey, score, deductions) {
    var tips = [];
    
    if (!deductions || deductions.length === 0) {
        var generalTip = getImprovementTips(catKey, score);
        return generalTip;
    }
    
    deductions.forEach(function(d) {
        if (d.indexOf('50자 초과') > -1) {
            tips.push('긴 대사를 2~3문장으로 분리하세요');
        } else if (d.indexOf('30~50자') > -1 || d.indexOf('30자') > -1) {
            tips.push('문장을 더 짧고 간결하게 다듬으세요');
        } else if (d.indexOf('대명사') > -1 || d.indexOf('호칭') > -1) {
            tips.push('대명사를 구체적 이름/관계로 바꾸세요');
        } else if (d.indexOf('한자어') > -1 || d.indexOf('전문용어') > -1) {
            tips.push('어려운 용어를 쉬운 말로 풀어쓰세요');
        } else if (d.indexOf('반복') > -1) {
            tips.push('반복 단어를 유의어로 교체하세요');
        } else if (d.indexOf('문어체') > -1) {
            tips.push('문어체를 자연스러운 구어체로 수정하세요');
        } else if (d.indexOf('갈등') > -1 || d.indexOf('대립') > -1) {
            tips.push('인물 간 갈등/대립 구조를 추가하세요');
        } else if (d.indexOf('반전') > -1 || d.indexOf('의외') > -1) {
            tips.push('예상을 깨는 전개를 삽입하세요');
        } else if (d.indexOf('감정') > -1) {
            tips.push('감정 표현을 더 구체적으로 추가하세요');
        } else if (d.indexOf('긴장') > -1 || d.indexOf('이완') > -1) {
            tips.push('긴장/이완 리듬을 조절하세요');
        } else if (d.indexOf('관계 변화') > -1) {
            tips.push('인물 관계에 변화 포인트를 만드세요');
        } else if (d.indexOf('장면 전환') > -1) {
            tips.push('장면 전환 시 연결 설명을 추가하세요');
        } else if (d.indexOf('인과') > -1) {
            tips.push('사건 간 인과관계를 명확히 하세요');
        } else if (d.indexOf('시간') > -1) {
            tips.push('시간 흐름 표현을 명확히 하세요');
        } else if (d.indexOf('복선') > -1) {
            tips.push('심어둔 복선을 회수하세요');
        } else if (d.indexOf('등장') > -1) {
            tips.push('후반부 신규 인물 도입을 자제하세요');
        } else if (d.indexOf('초반') > -1 || d.indexOf('훅') > -1) {
            tips.push('도입부에 강렬한 훅을 추가하세요');
        } else if (d.indexOf('클리프') > -1) {
            tips.push('끝에 궁금증 유발 장치를 넣으세요');
        } else if (d.indexOf('지문') > -1 || d.indexOf('무대지시') > -1) {
            tips.push('지문/무대지시를 보강하세요');
        } else if (d.indexOf('감각') > -1 || d.indexOf('묘사') > -1) {
            tips.push('감각적 묘사를 추가하세요');
        }
    });
    
    if (tips.length === 0) {
        return getImprovementTips(catKey, score);
    }
    
    // 중복 제거 후 최대 3개
    var uniqueTips = [];
    tips.forEach(function(t) {
        if (uniqueTips.indexOf(t) === -1) uniqueTips.push(t);
    });
    
    return uniqueTips.slice(0, 3).join('<br>');
}

function getSpecificImprovementTips(catKey, score, deductions) {
    var tips = [];
    
    if (!deductions || deductions.length === 0) {
        var generalTip = getImprovementTips(catKey, score);
        return generalTip;
    }
    
    deductions.forEach(function(d) {
        if (d.indexOf('50자 초과') > -1) {
            tips.push('긴 대사를 2~3문장으로 분리하세요');
        } else if (d.indexOf('30~50자') > -1 || d.indexOf('30자') > -1) {
            tips.push('문장을 더 짧고 간결하게 다듬으세요');
        } else if (d.indexOf('대명사') > -1 || d.indexOf('호칭') > -1) {
            tips.push('대명사를 구체적 이름/관계로 바꾸세요');
        } else if (d.indexOf('한자어') > -1 || d.indexOf('전문용어') > -1) {
            tips.push('어려운 용어를 쉬운 말로 풀어쓰세요');
        } else if (d.indexOf('반복') > -1) {
            tips.push('반복 단어를 유의어로 교체하세요');
        } else if (d.indexOf('문어체') > -1) {
            tips.push('문어체를 자연스러운 구어체로 수정하세요');
        } else if (d.indexOf('갈등') > -1 || d.indexOf('대립') > -1) {
            tips.push('인물 간 갈등/대립 구조를 추가하세요');
        } else if (d.indexOf('반전') > -1 || d.indexOf('의외') > -1) {
            tips.push('예상을 깨는 전개를 삽입하세요');
        } else if (d.indexOf('감정') > -1) {
            tips.push('감정 표현을 더 구체적으로 추가하세요');
        } else if (d.indexOf('긴장') > -1 || d.indexOf('이완') > -1) {
            tips.push('긴장/이완 리듬을 조절하세요');
        } else if (d.indexOf('관계 변화') > -1) {
            tips.push('인물 관계에 변화 포인트를 만드세요');
        } else if (d.indexOf('장면 전환') > -1) {
            tips.push('장면 전환 시 연결 설명을 추가하세요');
        } else if (d.indexOf('인과') > -1) {
            tips.push('사건 간 인과관계를 명확히 하세요');
        } else if (d.indexOf('시간') > -1) {
            tips.push('시간 흐름 표현을 명확히 하세요');
        } else if (d.indexOf('복선') > -1) {
            tips.push('심어둔 복선을 회수하세요');
        } else if (d.indexOf('등장') > -1) {
            tips.push('후반부 신규 인물 도입을 자제하세요');
        } else if (d.indexOf('초반') > -1 || d.indexOf('훅') > -1) {
            tips.push('도입부에 강렬한 훅을 추가하세요');
        } else if (d.indexOf('클리프') > -1) {
            tips.push('끝에 궁금증 유발 장치를 넣으세요');
        } else if (d.indexOf('지문') > -1 || d.indexOf('무대지시') > -1) {
            tips.push('지문/무대지시를 보강하세요');
        } else if (d.indexOf('감각') > -1 || d.indexOf('묘사') > -1) {
            tips.push('감각적 묘사를 추가하세요');
        }
    });
    
    if (tips.length === 0) {
        return getImprovementTips(catKey, score);
    }
    
    // 중복 제거 후 최대 3개
    var uniqueTips = [];
    tips.forEach(function(t) {
        if (uniqueTips.indexOf(t) === -1) uniqueTips.push(t);
    });
    
    return uniqueTips.slice(0, 3).join('<br>');
}

function getImprovementTips(category, score) {
    var tips = {
        senior: {
            high: '시니어 친화도가 우수합니다.',
            medium: '일부 문장이 길거나 호칭이 불명확합니다.',
            low: '긴 문장과 불명확한 호칭이 많습니다.'
        },
        fun: {
            high: '재미 요소가 충분합니다.',
            medium: '갈등이나 반전 요소를 보강하세요.',
            low: '갈등, 반전, 감정 표현이 부족합니다.'
        },
        flow: {
            high: '이야기 흐름이 자연스럽습니다.',
            medium: '장면 전환 설명을 보완하세요.',
            low: '장면 연결과 인과관계가 부족합니다.'
        },
        retention: {
            high: '시청자 이탈 방지 요소가 좋습니다.',
            medium: '초반 훅이나 클리프행어를 추가하세요.',
            low: '초반 훅과 클리프행어가 부족합니다.'
        }
    };
    
    var level = score >= 90 ? 'high' : score >= 70 ? 'medium' : 'low';
    return tips[category] ? tips[category][level] : '분석 정보 없음';
}

function buildImprovementsFromDeductions(deductions, scores) {
    var improvements = [];
    
    var categoryMap = {
        senior: '시니어 적합도',
        fun: '재미 요소',
        flow: '이야기 흐름',
        retention: '시청자 이탈 방지'
    };
    
    var solutionMap = {
        '50자 초과': '긴 문장을 2-3개로 나누세요',
        '30자 초과': '문장을 더 짧고 간결하게 수정하세요',
        '불명확한 호칭': '대명사를 구체적인 이름이나 관계로 바꾸세요',
        '갈등 요소': '인물 간 갈등이나 내적 갈등을 추가하세요',
        '반전': '예상을 깨는 전개나 의외의 사실을 추가하세요',
        '감정 표현': '인물의 감정을 더 구체적으로 표현하세요',
        '장면 전환': '"그때", "한편" 등 전환 표현을 추가하세요',
        '인과관계': '"때문에", "그래서" 등 인과 표현을 추가하세요',
        '초반 훅': '첫 부분에 호기심을 유발하는 요소를 추가하세요',
        '클리프행어': '끝부분에 궁금증을 유발하는 요소를 추가하세요'
    };
    
    Object.keys(categoryMap).forEach(function(cat) {
        var catDeductions = deductions[cat] || [];
        var issues = [];
        
        catDeductions.forEach(function(d) {
            var solution = '개선이 필요합니다';
            Object.keys(solutionMap).forEach(function(key) {
                if (d.includes(key)) {
                    solution = solutionMap[key];
                }
            });
            issues.push({
                problem: d,
                solution: solution
            });
        });
        
        if (issues.length === 0) {
            issues.push({
                problem: '감점 사항 없음',
                solution: '현재 상태 유지'
            });
        }
        
        improvements.push({
            category: categoryMap[cat],
            currentScore: scores[cat] || 70,
            targetScore: 100,
            issues: issues
        });
    });
    
    return improvements;
}

function getImprovementDetail(category, score, improvements) {
    if (improvements && improvements.length > 0) {
        for (var i = 0; i < improvements.length; i++) {
            var imp = improvements[i];
            if (imp.category && imp.category.replace(/\s/g, '').indexOf(category.replace(/\s/g, '')) !== -1) {
                if (imp.issues && imp.issues.length > 0) {
                    var solutions = imp.issues.map(function(issue) {
                        return issue.solution || issue.problem || '';
                    }).filter(function(s) { return s; });
                    if (solutions.length > 0) {
                        return solutions.slice(0, 2).join(' / ');
                    }
                }
                if (imp.suggestion) {
                    return imp.suggestion;
                }
            }
        }
    }
    
    if (score >= 100) {
        return '✅ 100점 달성 - 개선 불필요';
    }
    
    var defaultImprovements = {
        '시니어적합도': '문장 길이 단축 / 호칭 명확화 / 관계 설명 추가',
        '시니어 적합도': '문장 길이 단축 / 호칭 명확화 / 관계 설명 추가',
        '이야기흐름': '장면 연결어 추가 / 시간 순서 명시 / 인과관계 강화',
        '이야기 흐름': '장면 연결어 추가 / 시간 순서 명시 / 인과관계 강화',
        '재미요소': '갈등 심화 / 반전 요소 추가 / 감정 대사 강화',
        '재미 요소': '갈등 심화 / 반전 요소 추가 / 감정 대사 강화',
        '시청자이탈방지': '초반 호기심 유발 / 장면 끝 궁금증 추가 / 지루한 부분 압축',
        '시청자 이탈 방지': '초반 호기심 유발 / 장면 끝 궁금증 추가 / 지루한 부분 압축'
    };
    
    return defaultImprovements[category] || '구체적 개선사항은 AI 분석 결과를 확인하세요';
}

function enableStage1Buttons(hasErrors) {
    var btnBefore = document.getElementById('btn-revert-before-stage1');
    var btnAfter = document.getElementById('btn-revert-after-stage1');
    var btnFix = document.getElementById('btn-fix-script-stage1');
    if (btnBefore) btnBefore.disabled = !hasErrors;
    if (btnAfter) btnAfter.disabled = !hasErrors;
    if (btnFix) btnFix.disabled = false;
}

function enableStage2Buttons(hasErrors) {
    var btnBefore = document.getElementById('btn-revert-before-stage2');
    var btnAfter = document.getElementById('btn-revert-after-stage2');
    var btnFix = document.getElementById('btn-fix-script-stage2');
    if (btnBefore) btnBefore.disabled = !hasErrors;
    if (btnAfter) btnAfter.disabled = !hasErrors;
    if (btnFix) btnFix.disabled = false;
}
// ============================================================
// buildStage1FixedScript - 1차 수정본 확정 생성 (v4.54)
// renderScriptWithMarkers와 동일한 findBestMatch 매칭 로직 사용
// ============================================================
function buildStage1FixedScript() {
    var originalText = state.stage1.originalScript || '';
    var errors = state.stage1.allErrors || [];
    
    if (!originalText || originalText.length === 0) {
        console.log('⚠️ buildStage1FixedScript: 원본 텍스트 없음');
        return originalText;
    }
    
    if (!errors || errors.length === 0) {
        console.log('⚠️ buildStage1FixedScript: 오류 없음, 원본 반환');
        return originalText;
    }
    
    console.log('🔧 buildStage1FixedScript 시작');
    console.log('   - 원본 길이: ' + originalText.length + '자');
    console.log('   - 오류 수: ' + errors.length + '개');
    
    // 1단계: useRevised=true인 오류만 필터링하고 매칭 위치 찾기
    var replacements = [];
    
    for (var i = 0; i < errors.length; i++) {
        var err = errors[i];
        
        if (!err.useRevised || !err.original || !err.revised) {
            continue;
        }
        
        var searchText = err.original.trim();
        if (searchText.length === 0) continue;
        
        var revisedText = cleanRevisedText(err.revised);
        if (!revisedText || revisedText.length === 0) continue;
        
        // findBestMatch 사용 (renderScriptWithMarkers와 동일한 로직)
        var match = findBestMatch(originalText, searchText);
        
        if (match.found && match.position !== -1 && match.matchedText.length > 0) {
            replacements.push({
                position: match.position,
                length: match.matchedText.length,
                matchedText: match.matchedText,
                revisedText: revisedText,
                errorId: err.id
            });
            console.log('   ✅ 매칭 성공 [' + err.id + ']: "' + match.matchedText.substring(0, 25) + '..." → "' + revisedText.substring(0, 25) + '..."');
        } else {
            console.log('   ❌ 매칭 실패 [' + err.id + ']: "' + searchText.substring(0, 25) + '..."');
        }
    }
        // 1.5단계: 수정안이 원문보다 넓은 범위를 포함하는 경우, 치환 범위 확장
    for (var ri = 0; ri < replacements.length; ri++) {
        var r = replacements[ri];
        var revisedText = r.revisedText;
        
        if (!revisedText || revisedText === '__DELETE__') continue;
        
        var replEnd = r.position + r.length;
        var afterReplText = originalText.substring(replEnd, Math.min(replEnd + 200, originalText.length));
        
        var revisedWords = revisedText.split(/\s+/).filter(function(w) { return w.length >= 2; });
        
        if (revisedWords.length >= 3) {
            for (var tailLen = Math.min(revisedText.length, 80); tailLen >= 8; tailLen -= 4) {
                var revisedTail = revisedText.substring(revisedText.length - tailLen).trim();
                var tailPos = afterReplText.indexOf(revisedTail);
                
                if (tailPos !== -1 && tailPos <= 5) {
                    var extendLength = tailPos + revisedTail.length;
                    r.length += extendLength;
                    r.matchedText = originalText.substring(r.position, r.position + r.length);
                    console.log('   🔧 치환 범위 확장 [' + r.errorId + ']: 중복 꼬리 ' + extendLength + '자 흡수');
                    break;
                }
            }
            
            if (r.length === replacements[ri].length) {
                var revisedSentences = revisedText.split(/(?<=[.?!。])\s*/).filter(function(s) { return s.trim().length >= 5; });
                if (revisedSentences.length >= 2) {
                    var lastSentence = revisedSentences[revisedSentences.length - 1].trim();
                    var dupPos = afterReplText.indexOf(lastSentence);
                    
                    if (dupPos !== -1 && dupPos <= 10) {
                        var extendLength = dupPos + lastSentence.length;
                        r.length += extendLength;
                        r.matchedText = originalText.substring(r.position, r.position + r.length);
                        console.log('   🔧 치환 범위 확장 [' + r.errorId + ']: 중복 문장 ' + extendLength + '자 흡수');
                    }
                }
            }
        }
    }

    // 2단계: 위치순 정렬
    replacements.sort(function(a, b) { return a.position - b.position; });
    
    // 3단계: 겹치는 치환 제거
    var finalReplacements = [];
    var lastEnd = 0;
    for (var i = 0; i < replacements.length; i++) {
        if (replacements[i].position >= lastEnd) {
            finalReplacements.push(replacements[i]);
            lastEnd = replacements[i].position + replacements[i].length;
        }
    }
    
    // 4단계: 텍스트 조립 (앞에서부터 순서대로)
    var result = '';
    var pos = 0;
    
    for (var i = 0; i < finalReplacements.length; i++) {
        var r = finalReplacements[i];
        
        // 치환 위치 이전 텍스트 그대로 유지
        if (r.position > pos) {
            result += originalText.substring(pos, r.position);
        }
        
        // 수정안 삽입 (v4.54: __DELETE__이면 해당 구간 제거)
        if (r.revisedText === '__DELETE__') {
            // 삭제 지시: 아무것도 삽입하지 않음 (해당 원본 텍스트 제거)
            console.log('   🗑️ 삭제 적용 [' + r.errorId + ']: "' + r.matchedText.substring(0, 25) + '..." 제거됨');
        } else {
            result += r.revisedText;
        }
        
        pos = r.position + r.length;
    }
    
    // 마지막 치환 이후 텍스트 그대로 유지
    if (pos < originalText.length) {
        result += originalText.substring(pos);
    }
    
    console.log('🔧 buildStage1FixedScript 완료');
    console.log('   - 적용된 수정: ' + finalReplacements.length + '개');
    console.log('   - 결과 길이: ' + result.length + '자');
    console.log('   - 원본과 다른가: ' + (result !== originalText ? '예' : '아니오'));
    
    return result;
}

function fixScript(stage) {
    var s = state[stage];
    var text = s.originalScript;
    var errors = s.allErrors || [];
    errors.forEach(function(err) {
        if (err.useRevised && err.original && err.revised) {
            var fixedRevised = cleanRevisedText(err.revised);
            var searchText = err.original;
            
            // 1차: 정확한 매칭
            if (text.indexOf(searchText) !== -1) {
                if (fixedRevised === '__DELETE__') {
                    text = text.split(searchText).join('');
                } else {
                    text = text.split(searchText).join(fixedRevised);
                }
            } else {
                // 2차: 공백/줄바꿈 차이 허용 매칭
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
                    } catch (e) {
                        // regex 오류 무시
                    }
                }
            }
        }
    });
    // 삭제로 인한 연속 빈 줄 정리
    text = text.replace(/\n\s*\n\s*\n/g, '\n\n');
    s.fixedScript = text;
    s.isFixed = true;
    if (stage === 'stage2') state.finalScript = text;
    renderScriptWithMarkers(stage);
    alert((stage === 'stage1' ? '1차' : (stage === 'stage2' ? '최종' : '재분석')) + ' 수정본이 적용되었습니다.');
}

function startCacheTimer(cacheName, ttlSeconds) {
    stopCacheTimer();
    cacheTimer.cacheName = cacheName;
    cacheTimer.remainingSeconds = ttlSeconds;
    cacheTimer.warningShown = false;
    console.log('⏱️ 캐시 타이머 시작: ' + ttlSeconds + '초 (' + cacheName + ')');
    cacheTimer.intervalId = setInterval(function() {
        cacheTimer.remainingSeconds--;
        if (cacheTimer.warningShown) {
            updateCacheWarningCountdown();
        }
        if (cacheTimer.remainingSeconds <= cacheTimer.WARNING_THRESHOLD && !cacheTimer.warningShown) {
            cacheTimer.warningShown = true;
            showCacheWarning();
            playCacheWarningSound();
            console.log('⚠️ 캐시 만료 경고: ' + cacheTimer.remainingSeconds + '초 남음');
        }
        if (cacheTimer.remainingSeconds <= 0) {
            console.log('❌ 캐시 만료됨');
            stopCacheTimer();
            updateCacheWarningExpired();
        }
    }, 1000);
}

function stopCacheTimer() {
    if (cacheTimer.intervalId) {
        clearInterval(cacheTimer.intervalId);
        cacheTimer.intervalId = null;
    }
    cacheTimer.cacheName = null;
    cacheTimer.remainingSeconds = 0;
    cacheTimer.warningShown = false;
    hideCacheWarning();
}

function showCacheWarning() {
    var existing = document.getElementById('cache-warning-bar');
    if (existing) existing.remove();
    var bar = document.createElement('div');
    bar.id = 'cache-warning-bar';
    bar.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:linear-gradient(135deg,#d32f2f,#f44336);color:white;padding:12px 20px;display:flex;align-items:center;justify-content:center;gap:15px;font-size:14px;font-weight:bold;box-shadow:0 4px 15px rgba(244,67,54,0.5);';
    var minutes = Math.floor(cacheTimer.remainingSeconds / 60);
    var seconds = cacheTimer.remainingSeconds % 60;
    var timeStr = minutes + '분 ' + (seconds < 10 ? '0' : '') + seconds + '초';
    bar.innerHTML =
        '<span style="font-size:18px;">⚠️</span>' +
        '<span id="cache-warning-text">캐시 만료까지 <span id="cache-warning-countdown" style="color:#ffeb3b;font-size:16px;">' + timeStr + '</span> 남았습니다</span>' +
        '<button id="btn-extend-cache" onclick="extendCacheTTL()" style="background:#fff;color:#d32f2f;border:none;padding:8px 20px;border-radius:5px;cursor:pointer;font-weight:bold;font-size:13px;transition:transform 0.2s;">15분 연장</button>' +
        '<button id="btn-dismiss-cache-warning" onclick="hideCacheWarning()" style="background:transparent;color:white;border:1px solid rgba(255,255,255,0.5);padding:6px 12px;border-radius:5px;cursor:pointer;font-size:12px;">무시</button>';
    document.body.appendChild(bar);
    document.body.style.paddingTop = (bar.offsetHeight) + 'px';
}

function hideCacheWarning() {
    var bar = document.getElementById('cache-warning-bar');
    if (bar) {
        bar.remove();
        document.body.style.paddingTop = '';
    }
}

function updateCacheWarningCountdown() {
    var countdown = document.getElementById('cache-warning-countdown');
    if (!countdown) return;
    var minutes = Math.floor(cacheTimer.remainingSeconds / 60);
    var seconds = cacheTimer.remainingSeconds % 60;
    countdown.textContent = minutes + '분 ' + (seconds < 10 ? '0' : '') + seconds + '초';
    if (cacheTimer.remainingSeconds <= 60) {
        countdown.style.color = '#ff0000';
        countdown.style.fontSize = '18px';
    }
}

function updateCacheWarningExpired() {
    var bar = document.getElementById('cache-warning-bar');
    if (!bar) return;
    bar.style.background = 'linear-gradient(135deg,#333,#555)';
    bar.innerHTML =
        '<span style="font-size:18px;">❌</span>' +
        '<span>캐시가 만료되었습니다. 분석이 실패할 수 있습니다.</span>' +
        '<button onclick="hideCacheWarning()" style="background:transparent;color:white;border:1px solid rgba(255,255,255,0.5);padding:6px 12px;border-radius:5px;cursor:pointer;font-size:12px;">닫기</button>';
    setTimeout(function() { hideCacheWarning(); }, 10000);
}

function playCacheWarningSound() {
    try {
        var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        var oscillator = audioCtx.createOscillator();
        var gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.value = 0.3;
        oscillator.start();
        setTimeout(function() {
            oscillator.stop();
            audioCtx.close();
        }, 300);
        setTimeout(function() {
            var audioCtx2 = new (window.AudioContext || window.webkitAudioContext)();
            var osc2 = audioCtx2.createOscillator();
            var gain2 = audioCtx2.createGain();
            osc2.connect(gain2);
            gain2.connect(audioCtx2.destination);
            osc2.frequency.value = 1000;
            osc2.type = 'sine';
            gain2.gain.value = 0.3;
            osc2.start();
            setTimeout(function() {
                osc2.stop();
                audioCtx2.close();
            }, 300);
        }, 400);
    } catch (e) {
        console.log('⚠️ 알림음 재생 실패 (브라우저 제한)');
    }
}

async function extendCacheTTL() {
    var btn = document.getElementById('btn-extend-cache');
    if (btn) {
        btn.disabled = true;
        btn.textContent = '연장 중...';
    }
    var cacheName = cacheTimer.cacheName || state._cacheName;
    if (!cacheName) {
        alert('연장할 캐시가 없습니다.');
        if (btn) { btn.disabled = false; btn.textContent = '15분 연장'; }
        return;
    }
    var apiKey = localStorage.getItem('GEMINI_API_KEY');
    if (!apiKey) {
        alert('API 키가 설정되지 않았습니다.');
        if (btn) { btn.disabled = false; btn.textContent = '15분 연장'; }
        return;
    }
    var url = 'https://generativelanguage.googleapis.com/v1beta/' + cacheName + '?updateMask=ttl&key=' + apiKey;
    try {
        var response = await fetch(url, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ttl: '900s' })
        });
        if (!response.ok) {
            var errorData = await response.json().catch(function() { return {}; });
            throw new Error(errorData.error ? errorData.error.message : response.statusText);
        }
        console.log('✅ 캐시 TTL 연장 성공: +15분');
        cacheTimer.remainingSeconds += 900;
        cacheTimer.warningShown = false;
        showCacheExtendedSuccess();
    } catch (error) {
        console.error('❌ 캐시 TTL 연장 실패:', error.message);
        alert('캐시 연장에 실패했습니다: ' + error.message);
        if (btn) { btn.disabled = false; btn.textContent = '15분 연장'; }
    }
}

function showCacheExtendedSuccess() {
    var bar = document.getElementById('cache-warning-bar');
    if (!bar) return;
    bar.style.background = 'linear-gradient(135deg,#2e7d32,#4CAF50)';
    bar.innerHTML =
        '<span style="font-size:18px;">✅</span>' +
        '<span>캐시가 15분 연장되었습니다! (남은 시간: ' + Math.floor(cacheTimer.remainingSeconds / 60) + '분)</span>';
    setTimeout(function() { hideCacheWarning(); }, 3000);
}
// ============================================================
// 캐시 초기화 버튼 (v4.57 추가)
// ============================================================
// ============================================================
// 100점 대본 생성 시스템 (v4.58 추가)
// 최종 수정 반영 대본 + 점수별 개선방안을 AI에게 보내 100점 대본 생성
// ============================================================

function initPerfectScriptSection() {
    var generateBtn = document.getElementById('btn-generate-perfect');
    if (generateBtn) {
        generateBtn.addEventListener('click', generatePerfectScriptFromScores);
    }
    
    var downloadPerfectBtn = document.getElementById('btn-download-perfect');
    if (downloadPerfectBtn) {
        downloadPerfectBtn.addEventListener('click', function() {
            downloadPerfectScript();
        });
    }
    
    var compareBtn = document.getElementById('btn-compare-scripts');
    if (compareBtn) {
        compareBtn.addEventListener('click', function() {
            openCompareModal();
        });
    }
    
    // 재분석 영역은 100점 대본 생성 완료 후 동적으로 생성됨
}

// ============================================================
// createReanalysisSection - 100점 대본 재분석 영역 동적 생성 (v4.55)
// ============================================================
function createReanalysisSection() {
    if (document.getElementById('reanalysis-section')) return;
    
    var perfectSection = document.getElementById('perfect-script-section');
    if (!perfectSection) return;
    
    var section = document.createElement('section');
    section.id = 'reanalysis-section';
    section.style.cssText = 'margin-top:30px;display:none;';
    
    section.innerHTML = 
        '<h2 style="color:#FFD700;font-size:20px;margin-bottom:20px;text-align:center;">🔄 100점 대본 재분석</h2>' +
        
        '<!-- 재분석 시작 버튼 -->' +
        '<div style="text-align:center;margin-bottom:20px;">' +
            '<button id="btn-start-reanalysis" style="background:linear-gradient(135deg,#FFD700 0%,#FFA000 100%);color:#000;border:none;padding:15px 40px;border-radius:8px;cursor:pointer;font-weight:bold;font-size:16px;box-shadow:0 4px 15px rgba(255,215,0,0.4);">🔄 100점 대본 재분석 시작</button>' +
        '</div>' +
        
        '<!-- 4개 박스 -->' +
        '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:15px;margin-bottom:20px;">' +
            
            '<!-- 재분석 1차 결과 -->' +
            '<div style="background:#1e1e1e;border-radius:10px;overflow:hidden;">' +
                '<div style="background:#333;padding:10px 15px;font-weight:bold;color:#fff;border-bottom:1px solid #444;">📊 1차 재분석 결과</div>' +
                '<div id="analysis-re-stage1" style="padding:10px;max-height:400px;overflow-y:auto;font-size:12px;">' +
                    '<p style="color:#888;text-align:center;">재분석을 시작하면 결과가 표시됩니다.</p>' +
                '</div>' +
            '</div>' +
            
            '<!-- 재분석 1차 수정 반영 -->' +
            '<div style="background:#1e1e1e;border-radius:10px;overflow:hidden;">' +
                '<div style="background:#333;padding:10px 15px;font-weight:bold;color:#fff;border-bottom:1px solid #444;display:flex;justify-content:space-between;align-items:center;">' +
                    '<span>✏️ 1차 재수정 반영</span>' +
                '</div>' +
                '<div id="revised-re-stage1" style="padding:10px;max-height:400px;overflow-y:auto;font-size:12px;">' +
                    '<p style="color:#888;text-align:center;">재분석 후 수정본이 표시됩니다.</p>' +
                '</div>' +
                '<div class="revert-btn-wrapper" style="text-align:center;padding:10px;border-top:1px solid #444;display:flex;justify-content:center;gap:10px;flex-wrap:wrap;">' +
                    '<button id="btn-revert-before-re-stage1" disabled style="background:#ff9800;color:white;border:none;padding:8px 16px;border-radius:5px;cursor:pointer;font-weight:bold;font-size:13px;">🔄 수정 전</button>' +
                    '<button id="btn-revert-after-re-stage1" disabled style="background:#4CAF50;color:white;border:none;padding:8px 16px;border-radius:5px;cursor:pointer;font-weight:bold;font-size:13px;">✅ 수정 후</button>' +
                    '<button id="btn-fix-script-re-stage1" disabled style="background:#2196F3;color:white;border:none;padding:8px 16px;border-radius:5px;cursor:pointer;font-weight:bold;font-size:13px;">📌 대본 픽스</button>' +
                '</div>' +
            '</div>' +
            
            '<!-- 재분석 2차 결과 -->' +
            '<div style="background:#1e1e1e;border-radius:10px;overflow:hidden;">' +
                '<div style="background:#333;padding:10px 15px;font-weight:bold;color:#fff;border-bottom:1px solid #444;">📋 2차 재분석 결과</div>' +
                '<div id="analysis-re-stage2" style="padding:10px;max-height:400px;overflow-y:auto;font-size:12px;">' +
                    '<p style="color:#888;text-align:center;">2차 재분석을 시작하면 결과가 표시됩니다.</p>' +
                '</div>' +
                '<div style="text-align:center;padding:15px;">' +
                    '<button id="btn-start-re-stage2" style="background:linear-gradient(135deg,#f093fb 0%,#f5576c 100%);color:white;border:none;padding:12px 30px;border-radius:8px;cursor:pointer;font-weight:bold;font-size:14px;">🔬 2차 재분석 시작</button>' +
                '</div>' +
            '</div>' +
            
            '<!-- 재분석 최종 수정 반영 -->' +
            '<div style="background:#1e1e1e;border-radius:10px;overflow:hidden;">' +
                '<div style="background:#333;padding:10px 15px;font-weight:bold;color:#fff;border-bottom:1px solid #444;display:flex;justify-content:space-between;align-items:center;">' +
                    '<span>✅ 최종 재수정 반영</span>' +
                '</div>' +
                '<div id="revised-re-stage2" style="padding:10px;max-height:400px;overflow-y:auto;font-size:12px;">' +
                    '<p style="color:#888;text-align:center;">2차 재분석 후 최종본이 표시됩니다.</p>' +
                '</div>' +
                '<div class="revert-btn-wrapper" style="text-align:center;padding:10px;border-top:1px solid #444;display:flex;justify-content:center;gap:10px;flex-wrap:wrap;">' +
                    '<button id="btn-revert-before-re-stage2" disabled style="background:#ff9800;color:white;border:none;padding:8px 16px;border-radius:5px;cursor:pointer;font-weight:bold;font-size:13px;">🔄 수정 전</button>' +
                    '<button id="btn-revert-after-re-stage2" disabled style="background:#4CAF50;color:white;border:none;padding:8px 16px;border-radius:5px;cursor:pointer;font-weight:bold;font-size:13px;">✅ 수정 후</button>' +
                    '<button id="btn-fix-script-re-stage2" disabled style="background:#2196F3;color:white;border:none;padding:8px 16px;border-radius:5px;cursor:pointer;font-weight:bold;font-size:13px;">📌 대본 픽스</button>' +
                    '<button id="btn-download-re-final" style="background:#9C27B0;color:white;border:none;padding:8px 16px;border-radius:5px;cursor:pointer;font-weight:bold;font-size:13px;">💾 최종본 다운로드</button>' +
                '</div>' +
            '</div>' +
            
        '</div>' +
        
        '<!-- 재분석 점수 -->' +
        '<div id="re-score-display" style="background:#1e1e1e;border-radius:10px;padding:20px;margin-top:20px;">' +
            '<h3 style="color:#FFD700;margin-bottom:15px;text-align:center;">🔄 재분석 점수</h3>' +
            '<p style="color:#888;text-align:center;">재분석 완료 후 점수가 표시됩니다.</p>' +
        '</div>';
    
    perfectSection.parentElement.insertBefore(section, perfectSection.nextElementSibling);
    
    // 버튼 이벤트 연결
    document.getElementById('btn-start-reanalysis').addEventListener('click', startReanalysisStage1);
    document.getElementById('btn-start-re-stage2').addEventListener('click', startReanalysisStage2);
    
    document.getElementById('btn-revert-before-re-stage1').addEventListener('click', function() { toggleCurrentErrorOnly('re_stage1', false); });
    document.getElementById('btn-revert-after-re-stage1').addEventListener('click', function() { toggleCurrentErrorOnly('re_stage1', true); });
    document.getElementById('btn-fix-script-re-stage1').addEventListener('click', function() { fixScript('re_stage1'); });
    
    document.getElementById('btn-revert-before-re-stage2').addEventListener('click', function() { toggleCurrentErrorOnly('re_stage2', false); });
    document.getElementById('btn-revert-after-re-stage2').addEventListener('click', function() { toggleCurrentErrorOnly('re_stage2', true); });
    document.getElementById('btn-fix-script-re-stage2').addEventListener('click', function() { fixScript('re_stage2'); });
    
    document.getElementById('btn-download-re-final').addEventListener('click', function() {
        var script = state.re_stage2.fixedScript || state.re_stage1.fixedScript || '';
        if (!script || script.trim() === '') {
            alert('다운로드할 수정본이 없습니다.\n"대본 픽스" 버튼을 먼저 눌러주세요.');
            return;
        }
        downloadScript(script);
    });
    
    console.log('✅ 재분석 섹션 생성 완료');
}
// ============================================================
// state에 재분석용 데이터 추가
// ============================================================
state.re_stage1 = {
    originalScript: '',
    analysis: null,
    revisedScript: '',
    allErrors: [],
    fixedScript: '',
    currentErrorIndex: -1,
    isFixed: false
};
state.re_stage2 = {
    originalScript: '',
    analysis: null,
    revisedScript: '',
    allErrors: [],
    fixedScript: '',
    currentErrorIndex: -1,
    isFixed: false
};
state.reScores = null;

// ============================================================
// buildReStage1FixedScript - 재분석 1차 수정본 생성
// buildStage1FixedScript와 동일한 로직, re_stage1 데이터 사용
// ============================================================
function buildReStage1FixedScript() {
    var originalText = state.re_stage1.originalScript || '';
    var errors = state.re_stage1.allErrors || [];
    
    if (!originalText || originalText.length === 0) return originalText;
    if (!errors || errors.length === 0) return originalText;
    
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
                matchedText: match.matchedText,
                revisedText: revisedText,
                errorId: err.id
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
        if (r.position > pos) {
            result += originalText.substring(pos, r.position);
        }
        if (r.revisedText === '__DELETE__') {
            // 삭제
        } else {
            result += r.revisedText;
        }
        pos = r.position + r.length;
    }
    
    if (pos < originalText.length) {
        result += originalText.substring(pos);
    }
    
    return result;
}

// ============================================================
// startReanalysisStage1 - 100점 대본 1차 재분석
// ============================================================
async function startReanalysisStage1() {
    var perfectScript = state.perfectScript || '';
    
    if (!perfectScript || perfectScript.trim().length < 50) {
        alert('100점 대본이 없습니다.\n100점 대본을 먼저 생성해주세요.');
        return;
    }
    
    var apiKey = localStorage.getItem('GEMINI_API_KEY');
    if (!apiKey) { alert('API 키를 먼저 설정해주세요.'); return; }
    
    // 태그 제거한 순수 텍스트로 변환
    var cleanPerfect = cleanScriptForDownload(perfectScript);
    
    showProgress('🔄 100점 대본 1차 재분석 시작...');
    updateProgress(2, '준비 중...');
    
    try {
        state.re_stage1.originalScript = cleanPerfect;
        state.re_stage1.isFixed = false;
        state.re_stage1.currentErrorIndex = -1;
        state.re_stage1.allErrors = [];
        
        // 캐시 생성
        updateProgress(3, '📦 재분석용 캐시 생성 중...');
        
        if (state._cacheName) {
            deleteScriptCache(state._cacheName);
            state._cacheName = null;
        }
        
        var systemPrompt = '당신은 조선시대 사극 대본 전문 검수자입니다. ' +
            '사용자가 제공한 전체 대본을 완전히 이해한 상태에서, ' +
            '요청받은 역할에 따라 집중 분석합니다. ' +
            '전체 대본의 인물, 시간, 장소, 복선, 감정선을 모두 파악하고 있어야 합니다.';
        
        var cacheName = await createScriptCache(cleanPerfect, systemPrompt, 1800);
        state._cacheName = cacheName;
        
        if (!cacheName) {
            alert('캐시 생성에 실패했습니다. 다시 시도해주세요.');
            hideProgress();
            return;
        }
        
        console.log('✅ 재분석 캐시 생성 성공: ' + cacheName);
        startCacheTimer(cacheName, 1800);
        
        // 매트릭스 병렬 분석
        updateProgress(8, '🔍 1차 재분석 매트릭스 병렬 분석 중...');
        
        var roles = [
            { id: 'role1_historical', name: '시대고증' },
            { id: 'role2_person_time', name: '인물·시간' },
            { id: 'role3_structure', name: '서사구조' },
            { id: 'role4_character', name: '캐릭터·감정' }
        ];
        
        var matrixResult = await runMatrixAnalysis(cleanPerfect, roles, cacheName, 6500, 10, 80, '1차 재분석');
        var mergedErrors = matrixResult.errors;
        
        console.log('🔍 1차 재분석 완료: 총 ' + mergedErrors.length + '개 오류');
        
        // 결과 저장
        updateProgress(82, '결과 저장 중...');
        
        state.re_stage1.allErrors = mergedErrors.map(function(err, idx) {
            return {
                id: 're-stage1-error-' + idx,
                type: err.type || '기타',
                original: err.original || '',
                revised: err.revised || err.suggestion || '',
                reason: err.reason || '',
                severity: err.severity || 'medium',
                useRevised: true
            };
        });
        
        // 결과 표시
        updateProgress(85, '결과 표시 중...');
        displayReStage1Results();
        
        var revisedText = buildReStage1FixedScript();
        state.re_stage1.revisedScript = revisedText;
        state.re_stage1.fixedScript = revisedText;
        
        updateProgress(100, '1차 재분석 완료!');
        setTimeout(hideProgress, 1000);
        
    } catch (error) {
        if (error.name !== 'AbortError') { alert('재분석 중 오류가 발생했습니다: ' + error.message); }
        hideProgress();
    }
}

// ============================================================
// startReanalysisStage2 - 100점 대본 2차 재분석
// ============================================================
async function startReanalysisStage2() {
    var reStage1Original = state.re_stage1.originalScript || '';
    
    if (!reStage1Original || reStage1Original.trim().length === 0) {
        alert('1차 재분석을 먼저 완료해주세요.');
        return;
    }
    
    var reStage1Fixed = buildReStage1FixedScript();
    state.re_stage1.fixedScript = reStage1Fixed;
    state.re_stage1.revisedScript = reStage1Fixed;
    
    if (reStage1Fixed.trim().length < 10) {
        alert('대본 내용이 너무 짧습니다.');
        return;
    }
    
    showProgress('🔄 2차 재분석 중...');
    updateProgress(2, '준비 중...');
    
    try {
        // 캐시 재생성 (1차 재수정본 기반)
        updateProgress(3, '📦 2차 재분석용 캐시 생성 중...');
        
        if (state._cacheName) {
            deleteScriptCache(state._cacheName);
            state._cacheName = null;
        }
        
        var systemPrompt2 = '당신은 대한민국 방송 역사상 가장 뛰어난 사극 드라마 감독입니다.\n' +
            '사용자가 제공한 전체 대본을 완전히 이해한 상태에서, 요청받은 역할에 따라 집중 분석합니다.\n' +
            '냉정하지만 정확한 피드백으로 이 대본을 명작 수준으로 끌어올려야 합니다.';
        
        var cacheName2 = await createScriptCache(reStage1Fixed, systemPrompt2, 1800);
        state._cacheName = cacheName2;
        
        if (!cacheName2) {
            alert('캐시 생성에 실패했습니다. 다시 시도해주세요.');
            hideProgress();
            return;
        }
        
        console.log('✅ 2차 재분석 캐시 생성 성공: ' + cacheName2);
        startCacheTimer(cacheName2, 1800);
        
        // 매트릭스 병렬 분석 + role6
        updateProgress(8, '🔍 2차 재분석 매트릭스 병렬 분석 중...');
        
        var chunkRoles = [
            { id: 'role2_person_time', name: '인물·시간' },
            { id: 'role3_structure', name: '서사구조' },
            { id: 'role4_character', name: '캐릭터·감정' },
            { id: 'role5_dialogue', name: '대사품질' }
        ];
        
        var role6Promise = retryWithDelay(function() {
            var role6Prompt = buildRolePrompt('role6_audience', '', '', reStage1Fixed.length);
            return callGeminiAPI(role6Prompt, cacheName2);
        }, 3, 3000);
        
        var matrixPromise = runMatrixAnalysis(reStage1Fixed, chunkRoles, cacheName2, 6500, 10, 65, '2차 재분석');
        
        var allResults = await Promise.allSettled([matrixPromise, role6Promise]);
        
        updateProgress(70, '🔀 결과 통합 중...');
        
        // 매트릭스 결과
        var matrixResult = { errors: [], role6Data: { scores: null, scoreDetails: null } };
        if (allResults[0].status === 'fulfilled') {
            matrixResult = allResults[0].value;
        }
        
        // role6 결과
        var role6Scores = null;
        var role6ScoreDetails = null;
        var role6Errors = [];
        if (allResults[1].status === 'fulfilled') {
            try {
                var role6Parsed = parseApiResponse(allResults[1].value);
                role6Errors = role6Parsed.errors || role6Parsed.issues || [];
                role6Errors = filterNarrationErrors(role6Errors, reStage1Fixed);
                for (var re = 0; re < role6Errors.length; re++) {
                    role6Errors[re]._role = 'role6_audience';
                }
                role6Scores = role6Parsed.scores || null;
                role6ScoreDetails = role6Parsed.scoreDetails || null;
            } catch (r6Error) {
                console.error('⚠️ role6 파싱 실패:', r6Error.message);
            }
        }
        
        var allRoleErrors = matrixResult.errors.concat(role6Errors);
        var mergedErrors = mergeRoleResults(allRoleErrors);
        
        updateProgress(75, '결과 저장 중...');
        
        // state.re_stage2 저장
        state.re_stage2 = {
            originalScript: reStage1Fixed,
            analysis: [],
            allErrors: mergedErrors.map(function(err, idx) {
                return {
                    id: 're-stage2-error-' + idx,
                    type: err.type || '기타',
                    original: err.original || '',
                    revised: err.revised || err.suggestion || '',
                    reason: err.reason || '',
                    severity: err.severity || 'medium',
                    useRevised: true,
                    _role: err._role || ''
                };
            }),
            fixedScript: '',
            currentErrorIndex: -1,
            isFixed: false
        };
        
        // 최종 재수정 반영 대본 생성
        var finalFixedScript = reStage1Fixed;
        state.re_stage2.allErrors.forEach(function(err) {
            if (err.useRevised && err.original && err.revised) {
                var fixedRevised = cleanRevisedText(err.revised);
                if (fixedRevised === '__DELETE__') {
                    finalFixedScript = finalFixedScript.split(err.original).join('');
                } else {
                    finalFixedScript = finalFixedScript.split(err.original).join(fixedRevised);
                }
            }
        });
        finalFixedScript = finalFixedScript.replace(/\n\s*\n\s*\n/g, '\n\n');
        state.re_stage2.fixedScript = finalFixedScript;
        
        updateProgress(80, '점수 계산 중...');
        
        // 점수 계산
        var aiScores = role6Scores || { senior: 75, fun: 75, flow: 75, retention: 75 };
        var scoreDetails = role6ScoreDetails || {};
        
        var scoreResult = null;
        try {
            scoreResult = calculateScoresFromAnalysis(finalFixedScript, aiScores, scoreDetails);
            state.reScores = scoreResult;
        } catch (scoreError) {
            scoreResult = {
                finalScores: aiScores,
                deductions: { senior: [], fun: [], flow: [], retention: [] }
            };
            state.reScores = scoreResult;
        }
        
        updateProgress(90, '결과 표시 중...');
        
        // 결과 표시
        displayReStage2Results();
        displayReScores(scoreResult.finalScores, scoreResult.deductions);
        
        // 캐시 정리
        if (state._cacheName) {
            deleteScriptCache(state._cacheName);
            state._cacheName = null;
        }
        
        updateProgress(100, '2차 재분석 완료!');
        
        var avgScore = Math.round((scoreResult.finalScores.senior + scoreResult.finalScores.fun + scoreResult.finalScores.flow + scoreResult.finalScores.retention) / 4);
        console.log('🔄 재분석 완료! 평균: ' + avgScore + '점');
        
        setTimeout(hideProgress, 1000);
        
    } catch (error) {
        console.error('❌ 2차 재분석 오류:', error);
        if (state._cacheName) {
            deleteScriptCache(state._cacheName);
            state._cacheName = null;
        }
        hideProgress();
        if (error.name !== 'AbortError') {
            alert('2차 재분석 중 오류가 발생했습니다: ' + error.message);
        }
    }
}

// ============================================================
// displayReStage1Results - 재분석 1차 결과 표시
// ============================================================
function displayReStage1Results() {
    var container = document.getElementById('analysis-re-stage1');
    if (!container) return;
    var errors = state.re_stage1.allErrors;
    if (!errors || errors.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:30px;color:#69f0ae;font-size:18px;">✅ 오류가 발견되지 않았습니다.</div>';
    } else {
        var html = '<table class="analysis-table"><thead><tr><th>유형</th><th>원문</th><th>수정</th><th>사유</th></tr></thead><tbody>';
        errors.forEach(function(err) {
            var severityColor = err.severity === 'high' ? '#ff5555' : (err.severity === 'medium' ? '#ffaa00' : '#69f0ae');
            html += '<tr data-marker-id="' + err.id + '" style="cursor:pointer;">' +
                '<td class="type-cell" style="color:' + severityColor + ';font-weight:bold;">' + formatTypeText(err.type) + '</td>' +
                '<td style="color:#ff9800;font-size:11px;">' + escapeHtml(err.original) + '</td>' +
                '<td style="color:#69f0ae;font-size:11px;">' + escapeHtml(err.revised) + '</td>' +
                '<td style="color:#aaa;font-size:11px;">' + escapeHtml(err.reason) + '</td></tr>';
        });
        html += '</tbody></table>';
        container.innerHTML = html;
        
        container.querySelectorAll('tr[data-marker-id]').forEach(function(row) {
            row.addEventListener('click', function() {
                var markerId = this.getAttribute('data-marker-id');
                var errorIndex = findErrorIndexById('re_stage1', markerId);
                if (errorIndex >= 0) { 
                    setCurrentError('re_stage1', errorIndex); 
                }
            });
        });
    }
    renderScriptWithMarkers('re_stage1');
    
    // 버튼 활성화
    var btnBefore = document.getElementById('btn-revert-before-re-stage1');
    var btnAfter = document.getElementById('btn-revert-after-re-stage1');
    var btnFix = document.getElementById('btn-fix-script-re-stage1');
    if (btnBefore) btnBefore.disabled = !(errors && errors.length > 0);
    if (btnAfter) btnAfter.disabled = !(errors && errors.length > 0);
    if (btnFix) btnFix.disabled = false;
}

// ============================================================
// displayReStage2Results - 재분석 2차 결과 표시
// ============================================================
function displayReStage2Results() {
    var container = document.getElementById('analysis-re-stage2');
    if (!container) return;
    var errors = state.re_stage2.allErrors;
    if (!errors || errors.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:30px;color:#69f0ae;font-size:18px;">✅ 추가 오류가 발견되지 않았습니다.</div>';
    } else {
        var html = '<table class="analysis-table"><thead><tr><th>유형</th><th>원문</th><th>수정</th><th>사유</th></tr></thead><tbody>';
        errors.forEach(function(err) {
            var severityColor = err.severity === 'high' ? '#ff5555' : (err.severity === 'medium' ? '#ffaa00' : '#69f0ae');
            html += '<tr data-marker-id="' + err.id + '" style="cursor:pointer;">' +
                '<td class="type-cell" style="color:' + severityColor + ';font-weight:bold;">' + formatTypeText(err.type) + '</td>' +
                '<td style="color:#ff9800;font-size:11px;">' + escapeHtml(err.original) + '</td>' +
                '<td style="color:#69f0ae;font-size:11px;">' + escapeHtml(err.revised) + '</td>' +
                '<td style="color:#aaa;font-size:11px;">' + escapeHtml(err.reason) + '</td></tr>';
        });
        html += '</tbody></table>';
        container.innerHTML = html;
        
        container.querySelectorAll('tr[data-marker-id]').forEach(function(row) {
            row.addEventListener('click', function() {
                var markerId = this.getAttribute('data-marker-id');
                var errorIndex = findErrorIndexById('re_stage2', markerId);
                if (errorIndex >= 0) { 
                    setCurrentError('re_stage2', errorIndex); 
                }
            });
        });
    }
    renderScriptWithMarkers('re_stage2');
    
    // 버튼 활성화
    var btnBefore = document.getElementById('btn-revert-before-re-stage2');
    var btnAfter = document.getElementById('btn-revert-after-re-stage2');
    var btnFix = document.getElementById('btn-fix-script-re-stage2');
    if (btnBefore) btnBefore.disabled = !(errors && errors.length > 0);
    if (btnAfter) btnAfter.disabled = !(errors && errors.length > 0);
    if (btnFix) btnFix.disabled = false;
}

// ============================================================
// displayReScores - 재분석 점수 표시
// ============================================================
function displayReScores(scores, deductions) {
    var scoreSection = document.getElementById('re-score-display');
    if (!scoreSection) return;
    
    var avgScore = Math.round((scores.senior + scores.fun + scores.flow + scores.retention) / 4);
    var passText = avgScore >= 80 ? '합격' : '재검토 필요';
    
    var html = '<h3 style="color:#FFD700;margin-bottom:15px;text-align:center;">🔄 재분석 점수</h3>' +
        '<div style="text-align:center;margin-bottom:20px;">' +
        '<span style="font-size:24px;font-weight:bold;color:' + (avgScore >= 80 ? '#69f0ae' : '#ff5555') + ';">' +
        '평균: ' + avgScore + '점 (' + passText + ')' +
        '</span></div>' +
        '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:15px;">' +
        createScoreCard('시니어 적합도', scores.senior, deductions.senior) +
        createScoreCard('재미 요소', scores.fun, deductions.fun) +
        createScoreCard('이야기 흐름', scores.flow, deductions.flow) +
        createScoreCard('시청자 이탈 방지', scores.retention, deductions.retention) +
        '</div>';
    
    scoreSection.innerHTML = html;
    console.log('📊 재분석 점수 표시 완료 - 평균:', avgScore);
}

// ============================================================
// showPerfectScriptSection 수정 - 재분석 섹션도 함께 생성
// ============================================================
var _originalShowPerfectScriptSection = showPerfectScriptSection;
showPerfectScriptSection = function() {
    _originalShowPerfectScriptSection();
    createReanalysisSection();
    var reSection = document.getElementById('reanalysis-section');
    if (reSection) reSection.style.display = 'block';
};

function showPerfectScriptSection() {
    var section = document.getElementById('perfect-script-section');
    if (section) {
        section.style.display = 'block';
    }
}

async function generatePerfectScriptFromScores() {
    // 최종 수정 반영 대본 가져오기
    var finalScript = state.stage2.fixedScript || state.stage1.fixedScript || state.finalScript || '';
    
    if (!finalScript || finalScript.trim().length < 50) {
        alert('2차 분석을 먼저 완료해주세요.\n최종 수정 반영 대본이 필요합니다.');
        return;
    }
    
    var apiKey = localStorage.getItem('GEMINI_API_KEY');
    if (!apiKey) {
        alert('API 키를 먼저 설정해주세요.');
        return;
    }
    
    // 점수 및 감점 사항 수집
    var scores = state.scores ? state.scores.finalScores : null;
    var deductions = state.scores ? state.scores.deductions : null;
    
    if (!scores) {
        alert('점수 정보가 없습니다.\n2차 분석을 먼저 완료해주세요.');
        return;
    }
    
    var generateBtn = document.getElementById('btn-generate-perfect');
    if (generateBtn) {
        generateBtn.disabled = true;
        generateBtn.textContent = '⏳ 100점 대본 생성 중...';
    }
    
    // 중지 버튼 표시
    var stopBtn = document.getElementById('btn-stop-perfect');
    if (!stopBtn) {
        stopBtn = document.createElement('button');
        stopBtn.id = 'btn-stop-perfect';
        stopBtn.innerHTML = '⏹️ 생성 중지';
        stopBtn.style.cssText = 'background:#f44336;color:white;border:none;padding:10px 24px;border-radius:8px;cursor:pointer;font-weight:bold;font-size:14px;margin-left:10px;';
        stopBtn.addEventListener('click', function() {
            if (currentAbortController) {
                currentAbortController.abort();
                currentAbortController = null;
            }
            state._perfectAborted = true;
            stopBtn.disabled = true;
            stopBtn.textContent = '중지됨';
            console.log('⏹️ 100점 대본 생성 중지됨');
        });
        if (generateBtn && generateBtn.parentNode) {
            generateBtn.parentNode.insertBefore(stopBtn, generateBtn.nextSibling);
        }
    }
    stopBtn.style.display = 'inline-block';
    stopBtn.disabled = false;
    stopBtn.textContent = '⏹️ 생성 중지';
    state._perfectAborted = false;
    
    var display = document.getElementById('perfect-script-display');
    if (display) {
        display.innerHTML = '<div style="text-align:center;padding:30px;color:#ffaa00;font-size:16px;">⏳ 4명의 전문가가 순차적으로 대본을 개선하고 있습니다...<br><span style="font-size:12px;color:#aaa;">약 2~4분 소요됩니다. 중지하려면 "생성 중지" 버튼을 누르세요.</span></div>';
    }
    
    showProgress('💯 100점 대본 생성 중...');
    
    try {
        // ============================================================
        // STEP 0: 100점 대본용 캐시 생성 (최종 수정 반영 대본)
        // ============================================================
        updateProgress(2, '📦 100점 대본용 캐시 생성 중...');
        
        if (state._cacheName) {
            deleteScriptCache(state._cacheName);
            state._cacheName = null;
        }
        
        var perfectSystemPrompt = '당신은 대한민국 최고의 사극 시나리오 작가입니다.\n' +
            '사용자가 제공한 전체 대본을 완전히 이해한 상태에서,\n' +
            '요청받은 카테고리의 품질을 100점으로 끌어올리는 작업을 합니다.\n' +
            '핵심 줄거리와 등장인물은 유지하면서 자유롭게 개선하세요.';
        
        var perfectCacheName = await createScriptCache(finalScript, perfectSystemPrompt, 1800);
        state._cacheName = perfectCacheName;
        
        if (perfectCacheName) {
            console.log('✅ 100점 대본용 캐시 생성 성공: ' + perfectCacheName);
            startCacheTimer(perfectCacheName, 1800);
        } else {
            console.log('⚠️ 캐시 생성 실패, 프롬프트에 대본 직접 포함 방식으로 진행');
        }
        
        var currentScript = finalScript;
        
        // 공통 자유 수정 규칙
        var freeEditRule = '## 자유 수정 권한\n' +
            '100점 달성을 위해 아래 행위가 모두 허용됩니다:\n' +
            '- 나레이션, 대사, 지문, 감정 표현 자유롭게 추가/삭제/수정\n' +
            '- 이야기 흐름 개선을 위한 문장 재배치\n' +
            '- 재미 요소 강화를 위한 대사/지문 추가\n' +
            '- 불필요한 반복/군더더기 삭제\n' +
            '- 최고의 시나리오가 되도록 자유롭게 집필\n' +
            '단, 핵심 줄거리와 등장인물은 유지하세요.\n\n';
        
        // 공통 태그 규칙
        var tagRule = '## 수정 표시 규칙 (반드시 준수!)\n' +
            '수정/추가/삭제한 부분에 아래 태그를 사용하세요:\n' +
            '- 기존 텍스트를 수정한 부분: [SENIOR]수정내용[/SENIOR] 또는 [FUN]수정내용[/FUN] 또는 [FLOW]수정내용[/FLOW] 또는 [RETAIN]수정내용[/RETAIN]\n' +
            '- 새로 추가한 나레이션/대사/지문: [SENIOR+]추가내용[/SENIOR+] 또는 [FUN+]추가내용[/FUN+] 또는 [FLOW+]추가내용[/FLOW+] 또는 [RETAIN+]추가내용[/RETAIN+]\n' +
            '- 삭제해야 할 부분: [DEL]삭제할원문[/DEL]\n' +
            '- 당신의 담당 카테고리 태그만 사용하세요!\n' +
            '- 수정하지 않은 부분은 원본 그대로 태그 없이 출력!\n\n';
        
        // 캐시가 있을 때는 대본을 프롬프트에 넣지 않음
        var scriptSection;
        if (perfectCacheName) {
            scriptSection = '\n\n## 수정 대상 대본\n' +
                '캐시에 제공된 전체 대본을 수정 대상으로 사용하세요.\n' +
                '대본 전문을 처음부터 끝까지 모두 출력하세요.\n';
        } else {
            scriptSection = '\n\n## 수정 대상 대본:\n\n' + currentScript;
        }
        
        var outputRule = '## 출력 규칙\n' +
            '1. 대본 전문을 처음부터 끝까지 모두 출력하세요.\n' +
            '2. 앞뒤 설명, 주석, 코드블록 없이 대본만 출력하세요.\n' +
            '3. JSON이 아닌 대본 텍스트만 출력하세요.\n';
        
        // ============================================================
        // 페르소나 ① 시니어 대사 전문가
        // ============================================================
        if (state._perfectAborted) throw { name: 'AbortError', message: '사용자 중지' };
        
        updateProgress(5, '💯 ① 시니어 대사 전문가 작업 중...');
        console.log('💯 페르소나 ① 시니어 대사 전문가 시작');
        
        var seniorDeductions = '';
        if (deductions.senior && deductions.senior.length > 0) {
            deductions.senior.forEach(function(d) { seniorDeductions += '- ' + d + '\n'; });
        }
        
        if (scores.senior < 100 && seniorDeductions) {
            var prompt1 = '당신은 이미 캐시에 제공된 전체 대본을 완전히 읽고 이해한 상태입니다.\n\n' +
                '당신은 시니어 타깃 사극 드라마 대사 전문가입니다.\n' +
                '50대 이상 시청자가 한 번에 알아듣는 대사를 만드는 것이 당신의 전문 분야입니다.\n' +
                '최고의 시나리오 작가로서 자유롭게 대본을 개선하세요.\n\n' +
                '## 현재 시니어 적합도: ' + scores.senior + '점 (목표: 100점)\n\n' +
                '## 감점 사항:\n' + seniorDeductions + '\n\n' +
                freeEditRule +
                '## 당신의 담당 태그: [SENIOR]...[/SENIOR] (수정), [SENIOR+]...[/SENIOR+] (추가)\n\n' +
                tagRule +
                '## 주요 개선 방향:\n' +
                '- 50자 초과 대사 → 2~3문장으로 분리\n' +
                '- 30~50자 대사 → 더 짧고 간결하게\n' +
                '- 불명확한 대명사(그가/그녀가) → 구체적 이름\n' +
                '- 어려운 한자어/전문용어 → 쉬운 말\n' +
                '- 문어체 대사 → 자연스러운 구어체\n' +
                '- 같은 단어 과도 반복 → 유의어로 교체\n' +
                '- 시니어 시청자가 이해하기 어려운 부분은 자유롭게 보강\n\n' +
                outputRule + scriptSection;
            
            var result1 = await callGeminiAPI(prompt1, perfectCacheName);
            result1 = result1.replace(/```[a-z]*\n?/g, '').replace(/```/g, '').trim();
            
            if (result1.length > currentScript.length * 0.3) {
                currentScript = result1;
                console.log('✅ 페르소나 ① 완료: ' + currentScript.length + '자');
            } else {
                console.log('⚠️ 페르소나 ① 결과가 너무 짧아 건너뜀');
            }
        } else {
            console.log('⏭️ 페르소나 ① 건너뜀 (이미 100점)');
        }
        
        // ============================================================
        // 페르소나 ② 극작 연출가
        // ============================================================
        if (state._perfectAborted) throw { name: 'AbortError', message: '사용자 중지' };
        
        updateProgress(30, '💯 ② 극작 연출가 작업 중...');
        console.log('💯 페르소나 ② 극작 연출가 시작');
        
        var funDeductions = '';
        if (deductions.fun && deductions.fun.length > 0) {
            deductions.fun.forEach(function(d) { funDeductions += '- ' + d + '\n'; });
        }
        
        if (scores.fun < 100 && funDeductions) {
            // 페르소나 ②부터는 이전 페르소나 결과를 입력으로 사용
            // 캐시에는 원본이 있으므로, 수정된 대본은 프롬프트에 직접 포함
            var prompt2Input;
            if (currentScript !== finalScript) {
                // 이전 페르소나가 수정한 대본이 있으면 그것을 사용
                prompt2Input = '\n\n## 수정 대상 대본 (이전 전문가가 수정한 버전):\n\n' + currentScript;
            } else {
                prompt2Input = scriptSection;
            }
            
            var prompt2 = '당신은 이미 캐시에 제공된 원본 대본을 완전히 읽고 이해한 상태입니다.\n\n' +
                '당신은 사극 드라마 극작 연출가입니다.\n' +
                '시청자의 심장을 뛰게 하는 갈등, 반전, 감정을 만드는 것이 당신의 전문 분야입니다.\n' +
                '최고의 시나리오 작가로서 자유롭게 대본을 개선하세요.\n\n' +
                '## 현재 재미 요소: ' + scores.fun + '점 (목표: 100점)\n\n' +
                '## 감점 사항:\n' + funDeductions + '\n\n' +
                freeEditRule +
                '## 당신의 담당 태그: [FUN]...[/FUN] (수정), [FUN+]...[/FUN+] (추가)\n\n' +
                '## 주의: 이전 전문가가 [SENIOR]...[/SENIOR], [SENIOR+]...[/SENIOR+] 태그를 이미 사용했습니다. 이 태그는 그대로 유지하세요!\n\n' +
                tagRule +
                '## 주요 개선 방향:\n' +
                '- 갈등/대립 부족 → 인물 간 긴장감 있는 대사 추가\n' +
                '- 반전/의외성 부족 → 예상을 깨는 전개나 대사 추가\n' +
                '- 감정 표현 부족 → 감정 키워드/지문 추가\n' +
                '- 긴장/이완 리듬 부재 → 대사 강약 조절\n' +
                '- 인물 간 관계 변화 부재 → 미묘한 변화 표현 추가\n' +
                '- 재미를 위해 대사/지문/나레이션 자유롭게 추가/수정 가능\n\n' +
                outputRule + prompt2Input;
            
            var result2 = await callGeminiAPI(prompt2, perfectCacheName);
            result2 = result2.replace(/```[a-z]*\n?/g, '').replace(/```/g, '').trim();
            
            if (result2.length > currentScript.length * 0.3) {
                currentScript = result2;
                console.log('✅ 페르소나 ② 완료: ' + currentScript.length + '자');
            } else {
                console.log('⚠️ 페르소나 ② 결과가 너무 짧아 건너뜀');
            }
        } else {
            console.log('⏭️ 페르소나 ② 건너뜀 (이미 100점)');
        }
        
        // ============================================================
        // 페르소나 ③ 서사 편집자
        // ============================================================
        if (state._perfectAborted) throw { name: 'AbortError', message: '사용자 중지' };
        
        updateProgress(55, '💯 ③ 서사 편집자 작업 중...');
        console.log('💯 페르소나 ③ 서사 편집자 시작');
        
        var flowDeductions = '';
        if (deductions.flow && deductions.flow.length > 0) {
            deductions.flow.forEach(function(d) { flowDeductions += '- ' + d + '\n'; });
        }
        
        if (scores.flow < 100 && flowDeductions) {
            var prompt3Input;
            if (currentScript !== finalScript) {
                prompt3Input = '\n\n## 수정 대상 대본 (이전 전문가들이 수정한 버전):\n\n' + currentScript;
            } else {
                prompt3Input = scriptSection;
            }
            
            var prompt3 = '당신은 이미 캐시에 제공된 원본 대본을 완전히 읽고 이해한 상태입니다.\n\n' +
                '당신은 사극 드라마 서사 구조 편집자입니다.\n' +
                '이야기의 흐름을 매끄럽게 다듬는 것이 당신의 전문 분야입니다.\n' +
                '최고의 시나리오 작가로서 자유롭게 대본을 개선하세요.\n\n' +
                '## 현재 이야기 흐름: ' + scores.flow + '점 (목표: 100점)\n\n' +
                '## 감점 사항:\n' + flowDeductions + '\n\n' +
                freeEditRule +
                '## 당신의 담당 태그: [FLOW]...[/FLOW] (수정), [FLOW+]...[/FLOW+] (추가)\n\n' +
                '## 주의: 이전 전문가가 [SENIOR]...[/SENIOR], [SENIOR+]...[/SENIOR+], [FUN]...[/FUN], [FUN+]...[/FUN+] 태그를 이미 사용했습니다. 이 태그들은 그대로 유지하세요!\n\n' +
                tagRule +
                '## 주요 개선 방향:\n' +
                '- 장면 전환 설명 부족 → 연결어/전환 문장 추가\n' +
                '- 인과관계 부족 → 인과 표현 추가\n' +
                '- 시간 순서 혼란 → 시간 표현 명확화\n' +
                '- 복선 미회수 → 기존 복선에 대한 언급 추가\n' +
                '- 흐름 개선을 위해 나레이션/지문 자유롭게 추가/수정 가능\n\n' +
                outputRule + prompt3Input;
            
            var result3 = await callGeminiAPI(prompt3, perfectCacheName);
            result3 = result3.replace(/```[a-z]*\n?/g, '').replace(/```/g, '').trim();
            
            if (result3.length > currentScript.length * 0.3) {
                currentScript = result3;
                console.log('✅ 페르소나 ③ 완료: ' + currentScript.length + '자');
            } else {
                console.log('⚠️ 페르소나 ③ 결과가 너무 짧아 건너뜀');
            }
        } else {
            console.log('⏭️ 페르소나 ③ 건너뜀 (이미 100점)');
        }
        
        // ============================================================
        // 페르소나 ④ 시청률 PD
        // ============================================================
        if (state._perfectAborted) throw { name: 'AbortError', message: '사용자 중지' };
        
        updateProgress(80, '💯 ④ 시청률 PD 작업 중...');
        console.log('💯 페르소나 ④ 시청률 PD 시작');
        
        var retentionDeductions = '';
        if (deductions.retention && deductions.retention.length > 0) {
            deductions.retention.forEach(function(d) { retentionDeductions += '- ' + d + '\n'; });
        }
        
        if (scores.retention < 100 && retentionDeductions) {
            var prompt4Input;
            if (currentScript !== finalScript) {
                prompt4Input = '\n\n## 수정 대상 대본 (이전 전문가들이 수정한 버전):\n\n' + currentScript;
            } else {
                prompt4Input = scriptSection;
            }
            
            var prompt4 = '당신은 이미 캐시에 제공된 원본 대본을 완전히 읽고 이해한 상태입니다.\n\n' +
                '당신은 사극 드라마 시청률 전문 PD입니다.\n' +
                '시청자가 채널을 고정하고 끝까지 시청하게 만드는 것이 당신의 전문 분야입니다.\n' +
                '최고의 시나리오 작가로서 자유롭게 대본을 개선하세요.\n\n' +
                '## 현재 시청자 이탈 방지: ' + scores.retention + '점 (목표: 100점)\n\n' +
                '## 감점 사항:\n' + retentionDeductions + '\n\n' +
                freeEditRule +
                '## 당신의 담당 태그: [RETAIN]...[/RETAIN] (수정), [RETAIN+]...[/RETAIN+] (추가)\n\n' +
                '## 주의: 이전 전문가가 [SENIOR]...[/SENIOR], [SENIOR+]...[/SENIOR+], [FUN]...[/FUN], [FUN+]...[/FUN+], [FLOW]...[/FLOW], [FLOW+]...[/FLOW+] 태그를 이미 사용했습니다. 이 태그들은 그대로 유지하세요!\n\n' +
                tagRule +
                '## 주요 개선 방향:\n' +
                '- 초반 훅 부재 → 첫 장면에 호기심/긴장감 강화\n' +
                '- 클리프행어 부재 → 마지막 장면에 궁금증 유발 추가\n' +
                '- 중반 처짐 → 중간 장면에 사건/긴장 요소 추가\n' +
                '- 지문/무대지시 부족 → 행동/표정 묘사 추가\n' +
                '- 감각적 묘사 부족 → 빛, 소리, 냄새 등 감각 표현 추가\n' +
                '- 시청자 몰입을 위해 대사/지문/나레이션 자유롭게 추가/수정 가능\n\n' +
                outputRule + prompt4Input;
            
            var result4 = await callGeminiAPI(prompt4, perfectCacheName);
            result4 = result4.replace(/```[a-z]*\n?/g, '').replace(/```/g, '').trim();
            
            if (result4.length > currentScript.length * 0.3) {
                currentScript = result4;
                console.log('✅ 페르소나 ④ 완료: ' + currentScript.length + '자');
            } else {
                console.log('⚠️ 페르소나 ④ 결과가 너무 짧아 건너뜀');
            }
        } else {
            console.log('⏭️ 페르소나 ④ 건너뜀 (이미 100점)');
        }
        
        // ============================================================
        // 최종 결과 저장 및 표시
        // ============================================================
        if (state._perfectAborted) throw { name: 'AbortError', message: '사용자 중지' };
        
        updateProgress(88, '결과 처리 중...');
        
        if (!currentScript || currentScript.length < 100) {
            throw new Error('100점 대본 생성 결과가 너무 짧습니다. 다시 시도해주세요.');
        }
        
        // ============================================================
        // 잘림 감지 및 이어쓰기
        // ============================================================
        var originalLength = finalScript.length;
        var currentLength = currentScript.length;
        
        var lastChar = currentScript.trim().slice(-1);
        var isIncomplete = (currentLength < originalLength * 0.95) || 
                           (lastChar !== '.' && lastChar !== '!' && lastChar !== '?' && lastChar !== '"' && lastChar !== ')');
        
        if (isIncomplete && !state._perfectAborted) {
            console.log('⚠️ 대본 잘림 감지: ' + currentLength + '자 / 원본 ' + originalLength + '자 (' + Math.round(currentLength / originalLength * 100) + '%)');
            console.log('   마지막 문자: "' + lastChar + '" → 이어쓰기 시작');
            
            updateProgress(90, '💯 잘린 부분 이어쓰기 중...');
            
            var lastContext = currentScript.substring(currentScript.length - 500);
            
            var cutPosition = finalScript.indexOf(lastContext.substring(0, 50));
            var remainingOriginal = '';
            if (cutPosition !== -1) {
                remainingOriginal = finalScript.substring(cutPosition + 500);
            } else {
                var estimatedCutPos = Math.floor(finalScript.length * (currentLength / originalLength));
                remainingOriginal = finalScript.substring(Math.max(0, estimatedCutPos - 200));
            }
            
            var continuePrompt = '이전 작업에서 대본 수정이 중간에 끊겼습니다.\n' +
                '아래에 지금까지 수정된 대본의 마지막 부분과, 아직 수정하지 못한 원본 부분이 있습니다.\n' +
                '끊긴 곳부터 이어서 수정을 완료해주세요.\n\n' +
                '## 규칙\n' +
                '1. 지금까지의 수정 내용(기존 태그 [SENIOR], [SENIOR+], [FUN], [FUN+], [FLOW], [FLOW+], [RETAIN], [RETAIN+], [DEL])은 건드리지 마세요.\n' +
                '2. 끊긴 부분부터 자연스럽게 이어쓰세요.\n' +
                '3. 남은 원본 부분에 대해서도 필요한 개선을 적용하세요.\n' +
                '4. 수정한 부분에는 동일한 태그를 사용하세요.\n' +
                '5. 앞뒤 설명 없이 이어지는 대본만 출력하세요.\n\n' +
                '## 지금까지 수정된 대본의 마지막 부분:\n\n' +
                '...' + lastContext + '\n\n' +
                '## 아직 수정하지 못한 원본 부분:\n\n' +
                remainingOriginal;
            
            try {
                var continueResult = await callGeminiAPI(continuePrompt, perfectCacheName);
                continueResult = continueResult.replace(/```[a-z]*\n?/g, '').replace(/```/g, '').trim();
                
                if (continueResult && continueResult.length > 50) {
                    var overlapCheck = lastContext.substring(lastContext.length - 100);
                    var overlapIdx = continueResult.indexOf(overlapCheck);
                    
                    if (overlapIdx !== -1) {
                        continueResult = continueResult.substring(overlapIdx + overlapCheck.length);
                    }
                    
                    currentScript = currentScript.trimEnd() + '\n' + continueResult.trimStart();
                    console.log('✅ 이어쓰기 완료: +' + continueResult.length + '자 → 총 ' + currentScript.length + '자');
                } else {
                    console.log('⚠️ 이어쓰기 결과가 너무 짧아 원본으로 보완');
                    if (remainingOriginal && remainingOriginal.length > 50) {
                        currentScript = currentScript.trimEnd() + '\n' + remainingOriginal.trimStart();
                    }
                }
            } catch (continueError) {
                console.error('⚠️ 이어쓰기 실패:', continueError.message);
                if (remainingOriginal && remainingOriginal.length > 50) {
                    currentScript = currentScript.trimEnd() + '\n' + remainingOriginal.trimStart();
                    console.log('⚠️ 원본으로 보완: +' + remainingOriginal.length + '자');
                }
            }
        } else {
            console.log('✅ 대본 잘림 없음: ' + currentLength + '자 (' + Math.round(currentLength / originalLength * 100) + '%)');
        }
        
        // state에 저장
        state.perfectScript = currentScript;
        
        // 변경 포인트 추출
        state.changePoints = [];
        try {
            var changes = findDifferences(finalScript, currentScript);
            state.changePoints = changes.slice(0, 15);
        } catch (diffError) {
            state.changePoints = [];
        }
        
        // 100점 대본 표시
        displayPerfectScriptResult(currentScript, finalScript);
        
        // 캐시 정리
        if (perfectCacheName) {
            deleteScriptCache(perfectCacheName);
            if (state._cacheName === perfectCacheName) {
                state._cacheName = null;
            }
        }
        
        var avgScore = Math.round((scores.senior + scores.fun + scores.flow + scores.retention) / 4);
        console.log('💯 ========================================');
        console.log('💯 100점 대본 생성 완료!');
        console.log('💯 원본: ' + finalScript.length + '자 → 100점: ' + currentScript.length + '자');
        console.log('💯 기존 평균 점수: ' + avgScore + '점');
        console.log('💯 ========================================');
        
        updateProgress(100, '💯 100점 대본 생성 완료!');
        setTimeout(hideProgress, 1000);
        
    } catch (error) {
        console.error('❌ 100점 대본 생성 실패:', error);
        
        // 캐시 정리
        if (state._cacheName) {
            deleteScriptCache(state._cacheName);
            state._cacheName = null;
        }
        
        if (error.name === 'AbortError') {
            if (display) {
                display.innerHTML = '<div style="text-align:center;padding:30px;color:#ffaa00;font-size:16px;">⏹️ 100점 대본 생성이 중지되었습니다.<br><span style="font-size:12px;color:#aaa;">다시 시도하려면 "100점 대본 생성" 버튼을 누르세요.</span></div>';
            }
            hideProgress();
        } else {
            if (display) {
                display.innerHTML = '<div style="text-align:center;padding:30px;color:#ff5555;font-size:16px;">❌ 생성 실패: ' + error.message + '<br><span style="font-size:12px;color:#aaa;">다시 시도해주세요.</span></div>';
            }
            hideProgress();
            alert('100점 대본 생성 중 오류: ' + error.message);
        }
    } finally {
        if (generateBtn) {
            generateBtn.disabled = false;
            generateBtn.textContent = '💯 100점 대본 생성';
        }
        if (stopBtn) {
            stopBtn.style.display = 'none';
        }
        state._perfectAborted = false;
    }
}
function displayPerfectScriptResult(perfectText, originalText) {
    var display = document.getElementById('perfect-script-display');
    if (!display) return;
    
    // 태그별 색상 변환
    var htmlContent = escapeHtml(perfectText);
    
    // [SENIOR+]...[/SENIOR+] → 녹색 + 밑줄 (시니어 적합도 추가)
    htmlContent = htmlContent.replace(/\[SENIOR\+\]([\s\S]*?)\[\/SENIOR\+\]/g, '<span style="background:#4CAF5040;color:#69f0ae;border-left:3px solid #4CAF50;padding:1px 4px;border-radius:2px;text-decoration:underline;text-decoration-color:#4CAF50;text-underline-offset:3px;" title="➕ 시니어 적합도 추가">$1</span>');
    
    // [FUN+]...[/FUN+] → 주황색 + 밑줄 (재미 요소 추가)
    htmlContent = htmlContent.replace(/\[FUN\+\]([\s\S]*?)\[\/FUN\+\]/g, '<span style="background:#FF980040;color:#FFB74D;border-left:3px solid #FF9800;padding:1px 4px;border-radius:2px;text-decoration:underline;text-decoration-color:#FF9800;text-underline-offset:3px;" title="➕ 재미 요소 추가">$1</span>');
    
    // [FLOW+]...[/FLOW+] → 파란색 + 밑줄 (이야기 흐름 추가)
    htmlContent = htmlContent.replace(/\[FLOW\+\]([\s\S]*?)\[\/FLOW\+\]/g, '<span style="background:#2196F340;color:#64B5F6;border-left:3px solid #2196F3;padding:1px 4px;border-radius:2px;text-decoration:underline;text-decoration-color:#2196F3;text-underline-offset:3px;" title="➕ 이야기 흐름 추가">$1</span>');
    
    // [RETAIN+]...[/RETAIN+] → 보라색 + 밑줄 (시청자 이탈 방지 추가)
    htmlContent = htmlContent.replace(/\[RETAIN\+\]([\s\S]*?)\[\/RETAIN\+\]/g, '<span style="background:#9C27B040;color:#CE93D8;border-left:3px solid #9C27B0;padding:1px 4px;border-radius:2px;text-decoration:underline;text-decoration-color:#9C27B0;text-underline-offset:3px;" title="➕ 시청자 이탈 방지 추가">$1</span>');
    
    // [SENIOR]...[/SENIOR] → 녹색 (시니어 적합도 수정)
    htmlContent = htmlContent.replace(/\[SENIOR\]([\s\S]*?)\[\/SENIOR\]/g, '<span style="background:#4CAF5040;color:#69f0ae;border-left:3px solid #4CAF50;padding:1px 4px;border-radius:2px;" title="✏️ 시니어 적합도 수정">$1</span>');
    
    // [FUN]...[/FUN] → 주황색 (재미 요소 수정)
    htmlContent = htmlContent.replace(/\[FUN\]([\s\S]*?)\[\/FUN\]/g, '<span style="background:#FF980040;color:#FFB74D;border-left:3px solid #FF9800;padding:1px 4px;border-radius:2px;" title="✏️ 재미 요소 수정">$1</span>');
    
    // [FLOW]...[/FLOW] → 파란색 (이야기 흐름 수정)
    htmlContent = htmlContent.replace(/\[FLOW\]([\s\S]*?)\[\/FLOW\]/g, '<span style="background:#2196F340;color:#64B5F6;border-left:3px solid #2196F3;padding:1px 4px;border-radius:2px;" title="✏️ 이야기 흐름 수정">$1</span>');
    
    // [RETAIN]...[/RETAIN] → 보라색 (시청자 이탈 방지 수정)
    htmlContent = htmlContent.replace(/\[RETAIN\]([\s\S]*?)\[\/RETAIN\]/g, '<span style="background:#9C27B040;color:#CE93D8;border-left:3px solid #9C27B0;padding:1px 4px;border-radius:2px;" title="✏️ 시청자 이탈 방지 수정">$1</span>');
    
    // [DEL]...[/DEL] → 빨간색 취소선 (삭제)
    htmlContent = htmlContent.replace(/\[DEL\]([\s\S]*?)\[\/DEL\]/g, '<span style="text-decoration:line-through;color:#ff5555;background:#ff555520;padding:1px 4px;border-radius:2px;" title="🗑️ 삭제된 부분">$1</span>');
    
    // ★...★ 호환 (이전 버전 호환)
    htmlContent = htmlContent.replace(/★([^★]+)★/g, '<span style="background:#FFD70040;color:#FFD700;padding:1px 4px;border-radius:2px;" title="수정된 부분">$1</span>');
    
    // 수정/추가 카운트
    var seniorEditCount = (perfectText.match(/\[SENIOR\][^\+\[]/g) || []).length;
    var seniorAddCount = (perfectText.match(/\[SENIOR\+\]/g) || []).length;
    var funEditCount = (perfectText.match(/\[FUN\][^\+\[]/g) || []).length;
    var funAddCount = (perfectText.match(/\[FUN\+\]/g) || []).length;
    var flowEditCount = (perfectText.match(/\[FLOW\][^\+\[]/g) || []).length;
    var flowAddCount = (perfectText.match(/\[FLOW\+\]/g) || []).length;
    var retainEditCount = (perfectText.match(/\[RETAIN\][^\+\[]/g) || []).length;
    var retainAddCount = (perfectText.match(/\[RETAIN\+\]/g) || []).length;
    var delCount = (perfectText.match(/\[DEL\]/g) || []).length;
    var totalCount = seniorEditCount + seniorAddCount + funEditCount + funAddCount + flowEditCount + flowAddCount + retainEditCount + retainAddCount + delCount;
    
    var html = '<div style="padding:15px;">' +
        '<div style="text-align:center;margin-bottom:15px;">' +
        '<span style="font-size:16px;font-weight:bold;color:#FFD700;">💯 100점 대본 생성 완료</span>' +
        '<span style="margin-left:15px;font-size:13px;color:#aaa;">총 수정 ' + totalCount + '개소</span>' +
        '</div>' +
        
        '<!-- 색상 범례 -->' +
        '<div style="margin-bottom:15px;padding:12px;background:#1e1e1e;border-radius:8px;">' +
        '<div style="display:flex;justify-content:center;gap:20px;flex-wrap:wrap;margin-bottom:8px;">' +
        '<span style="font-size:12px;font-weight:bold;color:#aaa;">✏️ 수정 = 배경색</span>' +
        '<span style="font-size:12px;font-weight:bold;color:#aaa;">➕ 추가 = 배경색 + <u>밑줄</u></span>' +
        '<span style="font-size:12px;font-weight:bold;color:#aaa;">🗑️ 삭제 = <span style="text-decoration:line-through;color:#ff5555;">취소선</span></span>' +
        '</div>' +
        '<div style="display:flex;justify-content:center;gap:12px;flex-wrap:wrap;">' +
        '<span style="font-size:11px;color:#69f0ae;">● 시니어 적합도: ✏️' + seniorEditCount + ' / ➕' + seniorAddCount + '</span>' +
        '<span style="font-size:11px;color:#FFB74D;">● 재미 요소: ✏️' + funEditCount + ' / ➕' + funAddCount + '</span>' +
        '<span style="font-size:11px;color:#64B5F6;">● 이야기 흐름: ✏️' + flowEditCount + ' / ➕' + flowAddCount + '</span>' +
        '<span style="font-size:11px;color:#CE93D8;">● 시청자 이탈 방지: ✏️' + retainEditCount + ' / ➕' + retainAddCount + '</span>' +
        '<span style="font-size:11px;color:#ff5555;">● 삭제: 🗑️' + delCount + '</span>' +
        '</div>' +
        '</div>' +
        
        '<div id="perfect-script-content" class="perfect-script-content">' + htmlContent + '</div>' +
        '</div>';
    
    display.innerHTML = html;
    
    // 버튼 표시
    var buttons = document.getElementById('perfect-script-buttons');
    if (buttons) {
        buttons.style.display = 'flex';
    }
    
    console.log('💯 100점 대본 표시 완료: ' + perfectText.length + '자');
    console.log('   시니어: ✏️' + seniorEditCount + ' ➕' + seniorAddCount + ', 재미: ✏️' + funEditCount + ' ➕' + funAddCount + ', 흐름: ✏️' + flowEditCount + ' ➕' + flowAddCount + ', 이탈방지: ✏️' + retainEditCount + ' ➕' + retainAddCount + ', 삭제: ' + delCount);
}

function initResetCacheButton() {
    var btn = document.getElementById('btn-reset-cache');
    if (!btn) return;
    btn.addEventListener('click', function() {
        var cacheName = state._cacheName;
        if (!cacheName) {
            alert('현재 활성화된 캐시가 없습니다.');
            return;
        }
        if (!confirm('캐시를 삭제하시겠습니까?\n\n진행 중인 분석이 있으면 실패할 수 있습니다.')) {
            return;
        }
        deleteScriptCache(cacheName);
        state._cacheName = null;
        alert('캐시가 삭제되었습니다.');
        console.log('🗑️ 수동 캐시 초기화 완료');
    });
}
// ============================================================
// 전체 초기화 함수 (v4.57 추가)
// 새 대본 삽입 시 이전 분석 결과/캐시/점수 모두 초기화
// ============================================================
function resetAllAnalysis() {
    console.log('🔄 전체 초기화 시작...');

    // 1. 캐시 삭제
    if (state._cacheName) {
        deleteScriptCache(state._cacheName);
        state._cacheName = null;
    }

    // 2. state 초기화
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
    state.scriptSummary = '';

    // 3. 4칸 결과 영역 초기화
    var stage1Analysis = document.getElementById('analysis-stage1');
    if (stage1Analysis) stage1Analysis.innerHTML = '<p class="placeholder">1차 분석을 시작하면 결과가 표시됩니다.</p>';

    var revisedStage1 = document.getElementById('revised-stage1');
    if (revisedStage1) revisedStage1.innerHTML = '<p class="placeholder">1차 분석 후 수정본이 표시됩니다.</p>';

    var stage2Analysis = document.getElementById('analysis-stage2');
    if (stage2Analysis) stage2Analysis.innerHTML = '<p class="placeholder">2차 분석을 시작하면 결과가 표시됩니다.</p>';

    var revisedStage2 = document.getElementById('revised-stage2');
    if (revisedStage2) revisedStage2.innerHTML = '<p class="placeholder">2차 분석 후 최종본이 표시됩니다.</p>';

    // 4. 수정 건수 표시 초기화
    var revCount1 = document.getElementById('revision-count-stage1');
    if (revCount1) revCount1.textContent = '';

    var revCount2 = document.getElementById('revision-count-stage2');
    if (revCount2) revCount2.textContent = '';

    // 5. 점수 영역 초기화
    var scoreDisplay = document.getElementById('score-display');
    if (scoreDisplay) scoreDisplay.innerHTML = '<p class="placeholder">분석 완료 후 점수가 표시됩니다.</p>';

    // 6. 다운로드 버튼 비활성화
    var downloadBtn = document.getElementById('btn-download');
    if (downloadBtn) downloadBtn.disabled = true;

    // 7. 수정 전/후/픽스 버튼 비활성화
    var btnNames = [
        'btn-revert-before-stage1', 'btn-revert-after-stage1', 'btn-fix-script-stage1',
        'btn-revert-before-stage2', 'btn-revert-after-stage2', 'btn-fix-script-stage2'
    ];
    btnNames.forEach(function(id) {
        var btn = document.getElementById(id);
        if (btn) btn.disabled = true;
    });

    // 8. 진행률 바 숨기기
    hideProgress();

    console.log('✅ 전체 초기화 완료');
}
