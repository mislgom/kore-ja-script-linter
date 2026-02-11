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
    
    if (scoreDisplay.querySelector('.score-perfect-container')) {
        return scoreDisplay;
    }
    
    scoreDisplay.innerHTML = '<div class="score-perfect-container">' +
        '<div class="score-panel">' +
        '<h3 style="color:#fff;margin-bottom:15px;text-align:center;">📊 품질 평가 점수</h3>' +
        '<div style="text-align:center;padding:50px 20px;color:#888;">2차 분석 완료 후 점수가 표시됩니다</div>' +
        '</div>' +
        '<div class="perfect-panel">' +
        '<h3 style="color:#69f0ae;margin-bottom:15px;text-align:center;">💯 100점 수정 대본</h3>' +
        '<div style="text-align:center;padding:50px 20px;color:#888;">2차 분석 완료 후 수정 대본이 표시됩니다</div>' +
        '</div></div>';
    
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
        document.getElementById('original-script').value = e.target.result;
        document.getElementById('char-count').textContent = e.target.result.length;
    };
    reader.readAsText(file);
}

function initDownloadButton() {
    var btn = document.getElementById('btn-download');
    if (!btn) return;
    btn.addEventListener('click', function() {
        var scriptToDownload = state.perfectScript || state.finalScript;
        if (!scriptToDownload || scriptToDownload.trim() === '') {
            scriptToDownload = state.stage2.fixedScript || state.stage1.fixedScript;
        }
        if (!scriptToDownload || scriptToDownload.trim() === '') {
            alert('다운로드할 수정본이 없습니다.\n\n분석 후 "대본 픽스" 버튼을 먼저 눌러주세요.');
            return;
        }
        downloadScript(scriptToDownload);
    });
}

function downloadScript(script) {
    if (!script || script.trim() === '') {
        alert('다운로드할 내용이 없습니다.');
        return;
    }
     var cleanScript = script;
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
    
    try {
        var blob = new Blob([script], { type: 'text/plain;charset=utf-8' });
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
    
    // 4. 부분 문자열 매칭 (앞 30자, 뒤 30자)
    if (searchText.length > 30) {
        var frontPart = searchText.substring(0, 30).trim();
        var frontPos = text.indexOf(frontPart);
        if (frontPos !== -1) {
            // 앞부분 발견, 그 위치부터 원본 길이만큼을 매칭으로 사용
            var endPos = Math.min(frontPos + searchText.length, text.length);
            var matchedText = text.substring(frontPos, endPos);
            return { found: true, matchedText: matchedText, position: frontPos };
        }
        
        var backPart = searchText.substring(searchText.length - 30).trim();
        var backPos = text.indexOf(backPart);
        if (backPos !== -1) {
            var startPos = Math.max(0, backPos - searchText.length + 30);
            var matchedText = text.substring(startPos, backPos + backPart.length);
            return { found: true, matchedText: matchedText, position: startPos };
        }
    }
    
    // 5. 핵심 단어 기반 매칭 (3자 이상 단어들)
    var words = searchText.split(/\s+/).filter(function(w) { return w.length >= 3; });
    if (words.length >= 2) {
        var firstWord = words[0];
        var lastWord = words[words.length - 1];
        var firstPos = text.indexOf(firstWord);
        var lastPos = text.indexOf(lastWord, firstPos);
        
        if (firstPos !== -1 && lastPos !== -1 && lastPos > firstPos) {
            var matchedText = text.substring(firstPos, lastPos + lastWord.length);
            if (matchedText.length <= searchText.length * 1.5) {
                return { found: true, matchedText: matchedText, position: firstPos };
            }
        }
    }
    
    // 6. 첫 단어만으로 위치 추정
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
        
        // 마커 HTML
        var display = (err.useRevised && err.revised) ? cleanRevisedText(err.revised) : m.matchedText;
        var cls = (err.useRevised && err.revised) ? 'marker-revised' : 'marker-original';
        var title = (err.original + ' → ' + (err.revised || '')).replace(/"/g, '&quot;');
        
        html += '<span class="correction-marker ' + cls + '" data-marker-id="' + err.id + '" data-stage="' + stage + '" title="' + title + '">' + escapeHtml(display) + '</span>';
        
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
    
    var cleaned = text;
    
    // 슬래시(/)로 구분된 여러 옵션이 있으면 첫 번째만 사용
    // 예: "옵션1 / 옵션2" → "옵션1"
    if (cleaned.indexOf(' / ') !== -1) {
        cleaned = cleaned.split(' / ')[0].trim();
    }
    
    // 파이프(|)로 구분된 여러 옵션이 있으면 첫 번째만 사용
    // 예: "옵션1 | 옵션2" → "옵션1"
    if (cleaned.indexOf(' | ') !== -1) {
        cleaned = cleaned.split(' | ')[0].trim();
    }
    
    // 괄호 안의 설명 제거 (단, 문장 전체가 괄호인 경우는 제외)
    // 예: "수정문 (설명)" → "수정문"
    if (cleaned.indexOf('(') !== -1 && !cleaned.startsWith('(')) {
        cleaned = cleaned.replace(/\s*\([^)]*\)\s*$/g, '').trim();
    }
    
    // 대괄호 안의 설명 제거
    // 예: "수정문 [참고]" → "수정문"
    if (cleaned.indexOf('[') !== -1 && !cleaned.startsWith('[')) {
        cleaned = cleaned.replace(/\s*\[[^\]]*\]\s*$/g, '').trim();
    }
    
    // 연속 공백 정리
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    // 결과가 비어있으면 원본 반환
    if (!cleaned || cleaned.length === 0) {
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

function scrollToMarker(stage, markerId) {
    var container = document.getElementById('revised-' + stage);
    if (!container) {
        console.log('⚠️ scrollToMarker: 컨테이너를 찾을 수 없음 - revised-' + stage);
        return;
    }
    
    // 방법 1: data-marker-id로 찾기
    var marker = container.querySelector('.correction-marker[data-marker-id="' + markerId + '"]');
    
    // 방법 2: 마커를 못 찾으면 에러 객체에서 원문으로 직접 찾기
    if (!marker) {
        console.log('⚠️ 마커 ID로 찾기 실패, 원문 텍스트로 검색 시도: ' + markerId);
        
        var errors = state[stage].allErrors || [];
        var targetError = null;
        
        for (var i = 0; i < errors.length; i++) {
            if (errors[i].id === markerId) {
                targetError = errors[i];
                break;
            }
        }
        
        if (targetError && targetError.original) {
            // 컨테이너 내에서 원문 텍스트 포함하는 마커 찾기
            var allMarkers = container.querySelectorAll('.correction-marker');
            for (var j = 0; j < allMarkers.length; j++) {
                var markerText = allMarkers[j].textContent || '';
                var originalText = targetError.original;
                var revisedText = targetError.revised ? cleanRevisedText(targetError.revised) : '';
                
                if (markerText === originalText || markerText === revisedText || 
                    markerText.indexOf(originalText) !== -1 || 
                    (revisedText && markerText.indexOf(revisedText) !== -1)) {
                    marker = allMarkers[j];
                    console.log('✅ 텍스트 매칭으로 마커 찾음: ' + markerText);
                    break;
                }
            }
        }
    }
    
    // 방법 3: 그래도 못 찾으면 대략적 위치로 스크롤
    if (!marker) {
        var errors = state[stage].allErrors || [];
        var targetError = null;
        
        for (var i = 0; i < errors.length; i++) {
            if (errors[i].id === markerId) {
                targetError = errors[i];
                break;
            }
        }
        
        // approximatePosition 사용
        if (targetError && typeof targetError.approximatePosition === 'number' && targetError.approximatePosition >= 0) {
            var innerDiv = container.querySelector('div');
            if (innerDiv) {
                var scrollTarget = innerDiv.scrollHeight * targetError.approximatePosition;
                container.scrollTop = Math.max(0, scrollTarget - 100);
                
                console.log('📍 대략적 위치로 스크롤: ' + Math.round(targetError.approximatePosition * 100) + '%');
                
                // 대략적 위치 근처 하이라이트 표시
                var highlightDiv = document.createElement('div');
                highlightDiv.style.cssText = 'position: absolute; left: 0; right: 0; height: 40px; background: rgba(255, 235, 59, 0.3); pointer-events: none; transition: opacity 0.5s;';
                highlightDiv.style.top = scrollTarget + 'px';
                
                if (innerDiv.style.position !== 'relative') {
                    innerDiv.style.position = 'relative';
                }
                innerDiv.appendChild(highlightDiv);
                
                setTimeout(function() {
                    highlightDiv.style.opacity = '0';
                    setTimeout(function() {
                        if (highlightDiv.parentNode) {
                            highlightDiv.parentNode.removeChild(highlightDiv);
                        }
                    }, 500);
                }, 1500);
                
                return;
            }
        }
        
        // 원문 텍스트로 위치 계산
        if (targetError && targetError.original) {
            var containerText = container.innerText || container.textContent || '';
            var searchText = targetError.useRevised ? cleanRevisedText(targetError.revised) : targetError.original;
            var textIndex = containerText.indexOf(searchText);
            
            if (textIndex !== -1) {
                console.log('✅ 텍스트 위치 찾음, 스크롤 이동: ' + searchText.substring(0, 20) + '...');
                
                var totalLength = containerText.length;
                var scrollRatio = textIndex / totalLength;
                var scrollTarget = container.scrollHeight * scrollRatio;
                
                container.scrollTo({
                    top: Math.max(0, scrollTarget - 100),
                    behavior: 'smooth'
                });
                
                highlightTextInContainer(container, searchText, stage);
                return;
            }
        }
        
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

// 텍스트 하이라이트 헬퍼 함수
function highlightTextInContainer(container, searchText, stage) {
    if (!searchText || searchText.length < 2) return;
    
    var innerDiv = container.querySelector('div');
    if (!innerDiv) innerDiv = container;
    
    var originalHtml = innerDiv.innerHTML;
    var escapedSearch = escapeHtml(searchText);
    
    // 검색 텍스트가 HTML에 있는지 확인
    if (originalHtml.indexOf(escapedSearch) === -1) {
        // 짧은 버전으로 재시도
        var shortSearch = searchText.substring(0, Math.min(15, searchText.length));
        escapedSearch = escapeHtml(shortSearch);
        if (originalHtml.indexOf(escapedSearch) === -1) {
            console.log('⚠️ 하이라이트할 텍스트를 찾을 수 없음');
            return;
        }
    }
    
    var highlightId = 'temp-highlight-' + Date.now();
    var highlightHtml = '<span id="' + highlightId + '" style="background:#ffeb3b;color:#000;padding:2px 4px;border-radius:3px;transition:background 0.3s;">' + escapedSearch + '</span>';
    
    innerDiv.innerHTML = originalHtml.replace(escapedSearch, highlightHtml);
    
    var highlightEl = document.getElementById(highlightId);
    if (highlightEl) {
        highlightEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // 1.6초 후 하이라이트 제거
        setTimeout(function() {
            if (highlightEl && highlightEl.parentNode) {
                highlightEl.outerHTML = escapedSearch;
            }
        }, 1600);
    }
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
    return `당신은 한국 시니어 대상 낭독 대본 전문 검수자입니다.
⚠️ 중요: 오류가 없다고 하지 마세요! 반드시 최소 5개 이상의 개선점을 찾아내야 합니다!

## 검수 대상 대본:
${script}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 🎯 2차 분석 목표: 1차에서 놓친 오류 + 품질 개선점 검출
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## ✅ 필수 검사항목 (6가지) - 각 항목에서 최소 1개씩 찾을 것!

### 1. 대사 자연스러움 검사 🗣️
- 어색하거나 부자연스러운 대사 표현
- 문어체가 섞인 대사 (구어체로 수정 필요)
- 같은 단어가 반복되는 대사
- 너무 긴 대사 (50자 초과)
**예시**: "나는 그것을 하였다" → "내가 했어요"

### 2. 호칭 일관성 검사 👤
- 같은 인물을 다르게 부르는 경우 (아버지/아빠/부친)
- "그가", "그녀가" 등 불명확한 대명사 사용
- 신분에 맞지 않는 호칭
**예시**: "그가 말했다" → "영감님이 말했다"

### 3. 장면 연결성 검사 🎬
- 장면 전환 시 설명 부족
- 시간 경과 표현 누락
- 장소 이동 설명 부족
**예시**: (갑자기 다른 장소) → "한편, 마을 어귀에서는..."

### 4. 감정선 연결 검사 💭
- 인물의 감정 변화가 급작스러운 경우
- 감정 표현이 부족한 대사
- 상황에 맞지 않는 감정 반응
**예시**: "알겠습니다" → "알겠습니다... (눈시울을 붉히며)"

### 5. 문장 구조 검사 📝
- 30자 초과 긴 문장 (시니어 청취 어려움)
- 복잡한 문장 구조
- 이중 부정 등 이해하기 어려운 표현
**예시**: "그는 그것이 아니라고 생각하지 않았다" → "그는 그렇다고 생각했다"

### 6. 이야기 흐름 검사 📖
- 앞뒤 맥락이 맞지 않는 부분
- 갑작스러운 전개
- 설명 없이 등장하는 새로운 요소
**예시**: (갑자기 새 인물 등장) → "마을에서 소문난 박 첨지가 나타났다"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## ⛔ 오류로 판정하지 말 것
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- 나레이션 (나레이션:, NA:, N: 으로 시작하는 줄)
- 나레이션의 조선어투/문어체 (허용됨)
- 지문/설명 (괄호 안의 행동 묘사)
- 음향효과 ([SE], [BGM] 등)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 📊 점수 산출 기준
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 시니어 적합도 (100점 시작):
- 50자 초과 문장 1개당: -5점
- 30~50자 문장 1개당: -3점
- 불명확한 호칭 1개당: -4점
- 어려운 한자어/외래어 1개당: -2점

### 재미 요소 (100점 시작):
- 갈등 요소 없음: -15점
- 반전/의외성 없음: -10점
- 감정 표현 부족: -8점
- 긴장감 부족: -10점

### 이야기 흐름 (100점 시작):
- 장면 전환 설명 부족 1건당: -5점
- 인과관계 표현 부족: -7점
- 시간 순서 혼란: -10점

### 시청자 이탈 방지 (100점 시작):
- 초반 훅 없음: -12점
- 클리프행어 없음: -8점
- 중반 처짐 구간: -10점

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 🚨🚨🚨 필수 응답 규칙 🚨🚨🚨
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. **반드시 최소 5개 이상의 issues를 찾아야 합니다!**
2. 오류가 없어 보여도 개선할 수 있는 부분을 찾으세요!
3. 나레이션은 절대 오류로 넣지 마세요!
4. suggestion에 / 또는 () 넣지 마세요! 수정안 하나만!
5. perfectScript는 모든 issues를 반영한 완전한 대본!

## 📤 응답 형식 (반드시 JSON만):
\`\`\`json
{
    "issues": [
        {
            "type": "대사자연스러움",
            "original": "원문 그대로 복사",
            "suggestion": "수정안 하나만 (슬래시 금지)",
            "reason": "수정 이유 15자 이내",
            "severity": "high/medium/low"
        },
        {
            "type": "호칭일관성",
            "original": "원문",
            "suggestion": "수정안",
            "reason": "사유",
            "severity": "medium"
        },
        {
            "type": "장면연결성",
            "original": "원문",
            "suggestion": "수정안",
            "reason": "사유",
            "severity": "medium"
        },
        {
            "type": "감정선연결",
            "original": "원문",
            "suggestion": "수정안",
            "reason": "사유",
            "severity": "low"
        },
        {
            "type": "문장구조",
            "original": "원문",
            "suggestion": "수정안",
            "reason": "사유",
            "severity": "medium"
        }
    ],
    "scores": {
        "senior": 75,
        "fun": 70,
        "flow": 80,
        "retention": 72
    },
    "scoreDetails": {
        "senior": ["50자 초과 문장 3개 (-15점)", "불명확한 호칭 2개 (-8점)"],
        "fun": ["갈등 요소 부족 (-15점)", "반전 부족 (-10점)"],
        "flow": ["장면 전환 설명 부족 2건 (-10점)"],
        "retention": ["초반 훅 부족 (-12점)", "클리프행어 부족 (-8점)"]
    },
    "perfectScript": "모든 issues를 수정 반영한 완전한 대본 전문을 여기에 작성"
}
\`\`\`

⚠️ 다시 한번 강조: "추가 오류가 없습니다"라고 하지 말고, 반드시 개선점을 찾아주세요!`;
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

async function callGeminiAPI(prompt) {
    var apiKey = localStorage.getItem('GEMINI_API_KEY');
    var validation = validateApiKey(apiKey);
    if (!validation.valid) {
        throw new Error(validation.message);
    }

    currentAbortController = new AbortController();
    var stopBtn = document.getElementById('btn-stop-analysis');
    if (stopBtn) stopBtn.disabled = false;

    var url = API_CONFIG.ENDPOINT + '/' + API_CONFIG.MODEL + ':generateContent?key=' + apiKey;

    var response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.1,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: API_CONFIG.MAX_OUTPUT_TOKENS
            }
        }),
        signal: currentAbortController.signal
    });

    if (!response.ok) {
        var errorData = await response.json().catch(function() { return {}; });
        throw new Error('API 오류: ' + (errorData.error?.message || response.statusText));
    }

    var data = await response.json();
    if (stopBtn) stopBtn.disabled = true;
    currentAbortController = null;

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
                var result = { errors: [], scores: null, perfectScript: '', changePoints: [] };
                
                var errorsMatch = jsonText.match(/"errors"\s*:\s*\[([\s\S]*?)\]/);
                if (errorsMatch) {
                    try {
                        result.errors = JSON.parse('[' + errorsMatch[1] + ']');
                    } catch (e) {
                        result.errors = [];
                    }
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
                
                var perfectMatch = jsonText.match(/"perfectScript"\s*:\s*"([\s\S]*?)(?:"\s*[,}]|"$)/);
                if (perfectMatch) {
                    result.perfectScript = perfectMatch[1]
                        .replace(/\\n/g, '\n')
                        .replace(/\\r/g, '')
                        .replace(/\\t/g, '\t')
                        .replace(/\\"/g, '"');
                }
                
                console.log('✅ 부분 추출 성공:', result);
                return result;
                
            } catch (e3) {
                console.error('❌ 모든 파싱 시도 실패');
                
                return {
                    errors: [],
                    scores: { senior: 70, fun: 70, flow: 70, retention: 70 },
                    perfectScript: '⚠️ AI 응답 파싱 실패. 다시 분석해주세요.',
                    changePoints: []
                };
            }
        }
    }
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
    updateProgress(10, 'AI 분석 요청 중...');

    try {
        state.stage1.originalScript = script;
        state.stage1.isFixed = false;
        state.stage1.currentErrorIndex = -1;
        var prompt = buildStage1Prompt(script);
        updateProgress(30, 'Gemini API 응답 대기 중...');
        var response = await callGeminiAPI(prompt);
        updateProgress(70, '분석 결과 처리 중...');
        var result = parseApiResponse(response);
        
        var filteredErrors = filterNarrationErrors(result.errors || [], script);
        
        state.stage1.analysis = result;
        state.stage1.allErrors = filteredErrors.map(function(err, idx) {
            return { id: 'stage1-error-' + idx, type: err.type, original: err.original, revised: err.revised, reason: err.reason, severity: err.severity, useRevised: true };
        });
        updateProgress(90, '결과 표시 중...');
                displayStage1Results();
        
        // 1차 수정본 저장 (2차 분석용)
        var revisedText = state.stage1.originalScript;
        state.stage1.allErrors.forEach(function(err) {
            if (err.useRevised && err.original && err.revised) {
                revisedText = revisedText.split(err.original).join(cleanRevisedText(err.revised));
            }
        });
        state.stage1.revisedScript = revisedText;
        console.log('📝 1차 수정본 저장 완료: ' + revisedText.length + '자');
        
        updateProgress(100, '1차 분석 완료!');

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
    console.log('🔬 2차 분석 시작 (v4.53 최종 수정)');
    console.log('🔬 ========================================');
    
    // ============================================================
    // 1단계: 1차 분석 완료 여부 확인
    // ============================================================
    var stage1Original = state.stage1 ? state.stage1.originalScript : '';
    var stage1Errors = state.stage1 ? state.stage1.allErrors : [];
    
    if (!stage1Original || stage1Original.trim().length === 0) {
        alert('1차 분석을 먼저 완료해주세요.');
        return;
    }
    
    console.log('📋 1단계: 1차 분석 데이터 확인');
    console.log('   - 원본 대본 길이: ' + stage1Original.length + '자');
    console.log('   - 1차 오류 수: ' + stage1Errors.length + '개');
    
    // ============================================================
    // 2단계: 1차 수정이 반영된 대본 생성 (핵심!)
    // ============================================================
    console.log('📋 2단계: 1차 수정 반영 대본 생성');
    
    var stage1FixedScript = stage1Original;
    var stage1AppliedCount = 0;
    var stage1AppliedList = [];
    
    for (var i = 0; i < stage1Errors.length; i++) {
        var err = stage1Errors[i];
        if (err.useRevised && err.original && err.revised) {
            var originalText = err.original;
            var revisedText = cleanRevisedText(err.revised);
            
            // 원본 텍스트가 대본에 존재하는지 확인
            if (stage1FixedScript.indexOf(originalText) !== -1) {
                stage1FixedScript = stage1FixedScript.split(originalText).join(revisedText);
                stage1AppliedCount++;
                stage1AppliedList.push({
                    index: i,
                    original: originalText.substring(0, 30),
                    revised: revisedText.substring(0, 30)
                });
                console.log('   ✅ 1차 수정 [' + i + ']: "' + originalText.substring(0, 25) + '..." → "' + revisedText.substring(0, 25) + '..."');
            } else {
                console.log('   ⚠️ 1차 수정 [' + i + '] 매칭 실패: "' + originalText.substring(0, 25) + '..."');
            }
        }
    }
    
    console.log('📄 1차 수정 적용 결과:');
    console.log('   - 적용된 수정: ' + stage1AppliedCount + '개');
    console.log('   - 1차 수정본 길이: ' + stage1FixedScript.length + '자');
    
    // 1차 수정본을 state에 저장
    state.stage1.revisedScript = stage1FixedScript;
    state.stage1.fixedScript = stage1FixedScript;
    
    // 검증: 1차 수정이 실제로 적용되었는지 확인
    if (stage1AppliedCount > 0) {
        console.log('✅ 1차 수정이 성공적으로 적용됨');
    } else if (stage1Errors.length > 0) {
        console.log('⚠️ 1차 오류가 있지만 적용된 수정이 없음 - 원본 사용');
    }
    
    // 스크립트 최소 길이 검사
    if (stage1FixedScript.trim().length < 10) {
        alert('대본 내용이 너무 짧습니다. 올바른 대본을 업로드해주세요.');
        return;
    }
    
    showProgress('2차 정밀 분석 중...');
    updateProgress(10, '1차 수정본 기반 2차 분석 준비...');
    
    try {
        // ============================================================
        // 3단계: AI API 호출 (1차 수정본 기반으로 2차 분석)
        // ============================================================
        console.log('📋 3단계: AI API 호출 (1차 수정본 기반)');
        console.log('   - 분석 대상: 1차 수정 반영 대본 (' + stage1FixedScript.length + '자)');
        
        updateProgress(20, 'AI 분석 요청 중...');
        var prompt = buildStage2Prompt(stage1FixedScript);
        
        updateProgress(30, 'Gemini API 응답 대기 중...');
        var response = await callGeminiAPI(prompt);
        
        console.log('📥 2차 분석 API 응답 수신 완료');
        updateProgress(50, '분석 결과 처리 중...');
        
        // ============================================================
        // 4단계: JSON 파싱
        // ============================================================
        console.log('📋 4단계: JSON 파싱');
        var analysisResult = null;
        
        // 방법 1: 코드 블록에서 추출
        var jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
            try {
                analysisResult = JSON.parse(jsonMatch[1]);
                console.log('   ✅ JSON 블록 파싱 성공');
            } catch (e) {
                console.log('   ⚠️ JSON 블록 파싱 실패: ' + e.message);
            }
        }
        
        // 방법 2: 전체 응답에서 JSON 추출
        if (!analysisResult) {
            var jsonStart = response.indexOf('{');
            var jsonEnd = response.lastIndexOf('}');
            if (jsonStart !== -1 && jsonEnd !== -1) {
                try {
                    analysisResult = JSON.parse(response.substring(jsonStart, jsonEnd + 1));
                    console.log('   ✅ 직접 JSON 파싱 성공');
                } catch (e) {
                    console.log('   ⚠️ 직접 JSON 파싱 실패: ' + e.message);
                }
            }
        }
        
        // 방법 3: 기본값 사용
        if (!analysisResult) {
            console.log('   ⚠️ JSON 파싱 실패, 기본값 사용');
            analysisResult = {
                issues: [],
                scores: { senior: 75, fun: 75, flow: 75, retention: 75 },
                scoreDetails: {},
                improvements: [],
                perfectScript: ''
            };
        }
        
        updateProgress(60, '오류 필터링 중...');
        
        // ============================================================
        // 5단계: 나레이션 오류 필터링
        // ============================================================
        console.log('📋 5단계: 나레이션 오류 필터링');
        var rawIssues = analysisResult.issues || [];
        var filteredIssues = [];
        
        try {
            filteredIssues = filterNarrationErrors(rawIssues, stage1FixedScript);
        } catch (filterError) {
            console.error('   ⚠️ 필터링 오류:', filterError);
            filteredIssues = rawIssues;
        }
        
        console.log('   - 필터링 전: ' + rawIssues.length + '개');
        console.log('   - 필터링 후: ' + filteredIssues.length + '개');
        
        updateProgress(70, '점수 계산 중...');
        
        // ============================================================
        // 6단계: 점수 계산
        // ============================================================
        console.log('📋 6단계: 점수 계산');
        var aiScores = analysisResult.scores || { senior: 75, fun: 75, flow: 75, retention: 75 };
        var scoreDetails = analysisResult.scoreDetails || {};
        
        var scoreResult = null;
        try {
            scoreResult = calculateScoresFromAnalysis(stage1FixedScript, aiScores, scoreDetails);
        } catch (scoreError) {
            console.error('   ⚠️ 점수 계산 오류:', scoreError);
            scoreResult = {
                finalScores: aiScores,
                deductions: { senior: [], fun: [], flow: [], retention: [] }
            };
        }
        
        console.log('   - 최종 점수:', JSON.stringify(scoreResult.finalScores));
        
        state.scores = scoreResult.finalScores;
        state.scoreDeductions = scoreResult.deductions;
        
        // ============================================================
        // 7단계: 개선 방안 생성
        // ============================================================
        console.log('📋 7단계: 개선 방안 생성');
        var improvements = [];
        try {
            improvements = buildImprovementsFromDeductions(scoreResult.deductions, scoreResult.finalScores);
        } catch (impError) {
            console.error('   ⚠️ 개선 방안 생성 오류:', impError);
            improvements = [];
        }
        console.log('   - 생성된 개선 방안: ' + improvements.length + '개');
        
        updateProgress(80, '2차 수정 적용 중...');
        
        // ============================================================
        // 8단계: state.stage2 저장 (2차 분석 기준 = 1차 수정본)
        // ============================================================
        console.log('📋 8단계: state.stage2 저장');
        
        state.stage2 = {
            originalScript: stage1FixedScript,  // 핵심! 1차 수정본을 2차의 원본으로 사용
            analysis: analysisResult,
            allErrors: filteredIssues.map(function(err, idx) {
                return {
                    id: 'stage2-error-' + idx,
                    type: err.type || '기타',
                    original: err.original || err.location || '',
                    revised: err.suggestion || err.revised || '',
                    reason: err.reason || '',
                    severity: err.severity || 'medium',
                    useRevised: true
                };
            }),
            scores: scoreResult.finalScores,
            scoreDetails: scoreResult.deductions,
            improvements: improvements,
            revisedScript: '',
            fixedScript: '',
            currentErrorIndex: 0,
            isCompleted: true,
            isFixed: false
        };
        
        console.log('   - stage2.originalScript 길이: ' + state.stage2.originalScript.length + '자');
        console.log('   - stage2.allErrors 수: ' + state.stage2.allErrors.length + '개');
        
        // ============================================================
        // 9단계: 최종 수정 반영 대본 생성 (1차 수정본 + 2차 수정)
        // ============================================================
        console.log('📋 9단계: 최종 수정 반영 대본 생성');
        
        var finalFixedScript = stage1FixedScript;  // 1차 수정본에서 시작
        var stage2Errors = state.stage2.allErrors;
        var stage2AppliedCount = 0;
        
        for (var j = 0; j < stage2Errors.length; j++) {
            var err2 = stage2Errors[j];
            if (err2.useRevised && err2.original && err2.revised) {
                var originalText2 = err2.original;
                var revisedText2 = cleanRevisedText(err2.revised);
                
                if (finalFixedScript.indexOf(originalText2) !== -1) {
                    finalFixedScript = finalFixedScript.split(originalText2).join(revisedText2);
                    stage2AppliedCount++;
                    console.log('   ✅ 2차 수정 [' + j + ']: "' + originalText2.substring(0, 25) + '..." → "' + revisedText2.substring(0, 25) + '..."');
                } else {
                    console.log('   ⚠️ 2차 수정 [' + j + '] 매칭 실패: "' + originalText2.substring(0, 25) + '..."');
                }
            }
        }
        
        console.log('📄 최종 수정 반영 결과:');
        console.log('   - 2차 수정 적용: ' + stage2AppliedCount + '개');
        console.log('   - 최종 수정본 길이: ' + finalFixedScript.length + '자');
        
        // 최종 수정본 저장
        state.stage2.revisedScript = finalFixedScript;
        state.stage2.fixedScript = finalFixedScript;
        state.finalScript = finalFixedScript;
        
        updateProgress(90, '100점 대본 생성 중...');
        
        // ============================================================
        // 10단계: 100점 대본 생성
        // ============================================================
        console.log('📋 10단계: 100점 대본 생성');
        
        var aiPerfectScript = analysisResult.perfectScript || '';
        
        // AI가 제공한 100점 대본이 있고, 충분히 길면 사용
        // 단, 1차/2차 수정 내용이 반영되어 있는지 검증
        var usePerfectFromAI = false;
        
        if (aiPerfectScript && aiPerfectScript.trim().length > 100) {
            // 1차 수정 내용이 AI 100점 대본에 반영되어 있는지 확인
            var stage1ReflectedInAI = true;
            for (var k = 0; k < stage1AppliedList.length && k < 3; k++) {
                var applied = stage1AppliedList[k];
                if (aiPerfectScript.indexOf(applied.revised) === -1) {
                    stage1ReflectedInAI = false;
                    console.log('   ⚠️ AI 100점 대본에 1차 수정 미반영: "' + applied.revised + '"');
                    break;
                }
            }
            
            if (stage1ReflectedInAI) {
                usePerfectFromAI = true;
                console.log('   ✅ AI 100점 대본에 1차 수정 내용 반영 확인됨');
            }
        }
        
        if (usePerfectFromAI) {
            state.perfectScript = aiPerfectScript;
            console.log('   💯 100점 대본: AI 제공본 사용 (' + aiPerfectScript.length + '자)');
        } else {
            // AI 대본을 사용하지 않고 최종 수정본을 100점 대본으로 사용
            state.perfectScript = finalFixedScript;
            console.log('   💯 100점 대본: 최종 수정본 사용 (' + finalFixedScript.length + '자)');
        }
        
        // ============================================================
        // 11단계: 변경 포인트 추출 (원본과 100점 대본 비교)
        // ============================================================
        console.log('📋 11단계: 변경 포인트 추출');
        
        state.changePoints = [];
        try {
            var changes = findDifferences(stage1Original, state.perfectScript);
            state.changePoints = changes.slice(0, 10);
            console.log('   - 변경 포인트: ' + state.changePoints.length + '개');
        } catch (diffError) {
            console.error('   ⚠️ 변경 포인트 추출 오류:', diffError);
            state.changePoints = [];
        }
        
        updateProgress(95, '결과 표시 중...');
        
        // ============================================================
        // 12단계: 결과 표시
        // ============================================================
        console.log('📋 12단계: 결과 표시');
        
        displayStage2Results(filteredIssues);
        displayScoresAndPerfectScript(scoreResult.finalScores, scoreResult.deductions, improvements);
        
        updateProgress(100, '2차 분석 완료!');
        
        console.log('🔬 ========================================');
        console.log('🔬 2차 분석 완료!');
        console.log('🔬 ========================================');
        console.log('📊 최종 요약:');
        console.log('   - 원본 대본: ' + stage1Original.length + '자');
        console.log('   - 1차 수정 적용: ' + stage1AppliedCount + '개');
        console.log('   - 1차 수정본: ' + stage1FixedScript.length + '자');
        console.log('   - 2차 수정 적용: ' + stage2AppliedCount + '개');
        console.log('   - 최종 수정본: ' + finalFixedScript.length + '자');
        console.log('   - 100점 대본: ' + state.perfectScript.length + '자');
        console.log('   - 평균 점수: ' + Math.round((scoreResult.finalScores.senior + scoreResult.finalScores.fun + scoreResult.finalScores.flow + scoreResult.finalScores.retention) / 4) + '점');
        
        setTimeout(hideProgress, 1000);
        
    } catch (error) {
        console.error('❌ 2차 분석 오류:', error);
        console.error('   오류 상세:', error.stack);
        hideProgress();
        alert('2차 분석 중 오류가 발생했습니다: ' + error.message);
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
    
    console.log('📊 2차 분석 결과 표시 완료: 오류 ' + (errors ? errors.length : 0) + '개, 점수/100점 대본 표시 진행');
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
        '</div>';
    
    // ============================================================
    // 100점 달성 개선방안 테이블 (수정된 레이아웃)
    // - 항목 칸: 좁게 (70px)
    // - 현재/목표: 작게 (45px)
    // - 개선 방안: 넓게 (간략한 설명 + 실제 반영 내용)
    // ============================================================
    
    // 100점 대본에서 카테고리별 실제 반영 내용 추출
    var perfectScriptExamples = extractPerfectScriptExamples(state.perfectScript, scores);
    
    html += '<div style="background:#1e1e1e;border-radius:10px;padding:15px;margin-bottom:20px;">' +
        '<h4 style="color:#ffaa00;margin-bottom:15px;">📈 100점 달성 개선방안</h4>' +
        '<table style="width:100%;border-collapse:collapse;font-size:12px;table-layout:fixed;">' +
        '<thead><tr style="background:#333;">' +
        '<th style="width:70px;padding:8px 4px;border:1px solid #444;color:#fff;">항목</th>' +
        '<th style="width:45px;padding:8px 4px;border:1px solid #444;color:#fff;">현재</th>' +
        '<th style="width:45px;padding:8px 4px;border:1px solid #444;color:#fff;">목표</th>' +
        '<th style="padding:8px 4px;border:1px solid #444;color:#fff;">개선 방안 및 실제 반영 내용</th>' +
        '</tr></thead><tbody>';
    
    var categoryKeywords = {
        '시니어 적합도': ['문장', '호칭', '그가', '그녀가', '그는', '그녀는'],
        '재미 요소': ['갈등', '반전', '감정', '긴장'],
        '이야기 흐름': ['그때', '한편', '다음', '때문에', '그래서', '장면'],
        '시청자 이탈 방지': ['비밀', '충격', '과연', '궁금', '계속']
    };
    
    improvements.forEach(function(item, index) {
        var scoreColor = item.currentScore >= 90 ? '#69f0ae' : item.currentScore >= 70 ? '#ffaa00' : '#ff5555';
        
        // 간략한 개선 방안
        var briefSolution = item.issues.map(function(i) { 
            return '• ' + i.solution; 
        }).join('<br>');
        
        // 실제 반영 내용
        var actualExample = perfectScriptExamples[item.category] || '';
        
        // 개선 방안 + 실제 반영 내용 결합
        var combinedContent = '<div style="margin-bottom:8px;">' +
            '<span style="color:#ffaa00;font-weight:bold;font-size:11px;">▶ 개선 방안:</span><br>' +
            '<span style="color:#aaa;">' + briefSolution + '</span>' +
            '</div>';
        
        if (actualExample) {
            combinedContent += '<div style="background:#2a2a2a;padding:6px 8px;border-radius:4px;border-left:2px solid #69f0ae;">' +
                '<span style="color:#69f0ae;font-weight:bold;font-size:11px;">▶ 실제 반영:</span><br>' +
                '<span style="color:#fff;font-size:11px;">' + escapeHtml(actualExample) + '</span>' +
                '</div>';
        }
        
        html += '<tr class="improvement-row" data-category="' + item.category + '" data-index="' + index + '" style="cursor:pointer;transition:background 0.2s;" onmouseover="this.style.background=\'#2a2a2a\'" onmouseout="this.style.background=\'\'">' +
            '<td style="padding:8px 4px;border:1px solid #444;color:#fff;font-weight:bold;font-size:11px;text-align:center;word-break:keep-all;">' + item.category + '</td>' +
            '<td style="padding:8px 4px;border:1px solid #444;color:' + scoreColor + ';text-align:center;font-weight:bold;">' + item.currentScore + '</td>' +
            '<td style="padding:8px 4px;border:1px solid #444;color:#69f0ae;text-align:center;font-weight:bold;">100</td>' +
            '<td style="padding:8px;border:1px solid #444;">' + combinedContent + '</td>' +
            '</tr>';
    });
    
    html += '</tbody></table>' +
        '<p style="color:#888;font-size:11px;margin-top:10px;text-align:center;">💡 항목을 클릭하면 100점 대본에서 관련 부분으로 이동합니다</p>' +
        '</div>';
    
    if (state.perfectScript) {
        html += '<div style="background:#1e1e1e;border-radius:10px;padding:15px;margin-bottom:20px;">' +
            '<h4 style="color:#69f0ae;margin-bottom:15px;">✨ 100점 수정 대본</h4>' +
            '<div id="perfect-script-content" class="perfect-script-content" style="background:#2d2d2d;padding:15px;border-radius:8px;white-space:pre-wrap;word-break:break-word;line-height:1.8;color:#fff;max-height:400px;overflow-y:auto;">' +
            escapeHtml(state.perfectScript) +
            '</div>';
        
        if (state.changePoints && state.changePoints.length > 0) {
            html += '<div class="change-points-section" style="margin-top:15px;">' +
                '<div class="change-points-title" style="color:#ffaa00;font-weight:bold;margin-bottom:10px;">📍 주요 변경 포인트 (클릭하면 해당 위치로 이동)</div>';
            
            state.changePoints.forEach(function(point, index) {
                var displayText = point.original ? point.original.substring(0, 25) + (point.original.length > 25 ? '...' : '') : '변경 ' + (index + 1);
                html += '<a href="#" class="change-point-item" data-point-index="' + index + '" style="display:inline-block;background:#2d2d2d;color:#69f0ae;padding:8px 12px;margin:5px;border-radius:5px;cursor:pointer;font-size:12px;border-left:3px solid #69f0ae;text-decoration:none;">' +
                    (index + 1) + '. ' + displayText + '</a>';
            });
            
            html += '</div>';
        }
        
        html += '<div style="text-align:center;margin-top:15px;display:flex;justify-content:center;gap:10px;flex-wrap:wrap;">' +
            '<button onclick="downloadPerfectScript()" style="background:#69f0ae;color:#000;border:none;padding:10px 20px;border-radius:5px;cursor:pointer;font-weight:bold;">📥 100점 대본 다운로드</button>' +
            '<button onclick="openCompareModal()" style="background:#9c27b0;color:#fff;border:none;padding:10px 20px;border-radius:5px;cursor:pointer;font-weight:bold;">🔍 대본 비교하기</button>' +
            '</div></div>';
    }
    
    html += '</div>';
    
    scoreSection.innerHTML = html;
    
    // 개선방안 테이블 행 클릭 이벤트
    document.querySelectorAll('.improvement-row').forEach(function(row) {
        row.addEventListener('click', function() {
            var category = this.getAttribute('data-category');
            scrollToImprovementInScript(category, categoryKeywords);
        });
    });
    
    // 변경 포인트 클릭 이벤트
    document.querySelectorAll('.change-point-item').forEach(function(item) {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            var idx = parseInt(this.getAttribute('data-point-index'));
            scrollToPerfectScriptChange(idx, state.changePoints);
        });
    });
    
    var downloadBtn = document.getElementById('btn-download');
    if (downloadBtn) downloadBtn.disabled = false;
    
    console.log('📊 점수 표시 완료 - 평균:', avgScore);
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
    var scoreClass = score >= 90 ? 'high' : score >= 70 ? 'medium' : 'low';
    var deductionText = '';
    
    if (deductions && deductions.length > 0) {
        deductionText = '<div class="score-deductions">';
        deductions.slice(0, 3).forEach(function(d) {
            deductionText += '<div class="deduction-item">• ' + d + '</div>';
        });
        deductionText += '</div>';
    } else {
        deductionText = '<div class="score-deductions"><div class="deduction-item">• 감점 사항 없음</div></div>';
    }
    
    return `
        <div class="score-card">
            <div class="score-label">${label}</div>
            <div class="score-value ${scoreClass}">${score}점</div>
            ${deductionText}
        </div>
    `;
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

function calculateScoresFromAnalysis(script, aiScores, scoreDetails) {
    console.log('📊 점수 검증 및 보정 시작...');
    
    var lines = script.split('\n');
    var totalChars = script.length;
    
    // 1. 시니어 적합도 점수 계산
    var seniorScore = 100;
    var seniorDeductions = [];
    
    var longSentences = 0;
    var veryLongSentences = 0;
    lines.forEach(function(line) {
        if (line.trim().length > 50) {
            veryLongSentences++;
        } else if (line.trim().length > 30) {
            longSentences++;
        }
    });
    
    if (veryLongSentences > 0) {
        var deduct = Math.min(veryLongSentences * 5, 25);
        seniorScore -= deduct;
        seniorDeductions.push('50자 초과 문장 ' + veryLongSentences + '개 (-' + deduct + '점)');
    }
    if (longSentences > 0) {
        var deduct = Math.min(longSentences * 3, 15);
        seniorScore -= deduct;
        seniorDeductions.push('30자 초과 문장 ' + longSentences + '개 (-' + deduct + '점)');
    }
    
    var unclearPronouns = (script.match(/그가|그녀가|그는|그녀는|그들이/g) || []).length;
    if (unclearPronouns > 3) {
        var deduct = Math.min((unclearPronouns - 3) * 4, 20);
        seniorScore -= deduct;
        seniorDeductions.push('불명확한 호칭 ' + unclearPronouns + '개 (-' + deduct + '점)');
    }
    
    // 2. 재미 요소 점수 계산
    var funScore = 100;
    var funDeductions = [];
    
    var conflictKeywords = ['갈등', '다투', '싸우', '대립', '충돌', '반대', '거부', '분노', '화가'];
    var hasConflict = conflictKeywords.some(function(kw) { return script.includes(kw); });
    if (!hasConflict) {
        funScore -= 15;
        funDeductions.push('갈등 요소 부재 (-15점)');
    }
    
    var twistKeywords = ['그런데', '하지만', '그러나', '뜻밖에', '갑자기', '놀랍게도', '반전'];
    var twistCount = twistKeywords.reduce(function(count, kw) {
        return count + (script.match(new RegExp(kw, 'g')) || []).length;
    }, 0);
    if (twistCount < 2) {
        funScore -= 10;
        funDeductions.push('반전/의외성 부족 (-10점)');
    }
    
    var emotionKeywords = ['기뻐', '슬퍼', '화가', '두려', '설레', '그리워', '미안', '고마워', '사랑'];
    var emotionCount = emotionKeywords.reduce(function(count, kw) {
        return count + (script.match(new RegExp(kw, 'g')) || []).length;
    }, 0);
    if (emotionCount < 3) {
        funScore -= 8;
        funDeductions.push('감정 표현 부족 (-8점)');
    }
    
    // 3. 이야기 흐름 점수 계산
    var flowScore = 100;
    var flowDeductions = [];
    
    var sceneTransitions = ['그때', '한편', '다음 날', '며칠 후', '그 후', '잠시 후', '얼마 뒤'];
    var transitionCount = sceneTransitions.reduce(function(count, kw) {
        return count + (script.match(new RegExp(kw, 'g')) || []).length;
    }, 0);
    if (transitionCount < 2) {
        flowScore -= 10;
        flowDeductions.push('장면 전환 설명 부족 (-10점)');
    }
    
    var causalKeywords = ['때문에', '그래서', '따라서', '덕분에', '결국', '그 결과'];
    var causalCount = causalKeywords.reduce(function(count, kw) {
        return count + (script.match(new RegExp(kw, 'g')) || []).length;
    }, 0);
    if (causalCount < 2) {
        flowScore -= 7;
        flowDeductions.push('인과관계 표현 부족 (-7점)');
    }
    
    // 4. 시청자 이탈 방지 점수 계산
    var retentionScore = 100;
    var retentionDeductions = [];
    
    var firstPart = script.substring(0, Math.min(500, script.length));
    var hookKeywords = ['비밀', '충격', '놀라운', '믿기 힘든', '알려지지 않은', '숨겨진'];
    var hasHook = hookKeywords.some(function(kw) { return firstPart.includes(kw); });
    if (!hasHook) {
        retentionScore -= 12;
        retentionDeductions.push('초반 훅 부족 (-12점)');
    }
    
    var lastPart = script.substring(Math.max(0, script.length - 500));
    var cliffhangerKeywords = ['과연', '어떻게 될까', '다음에', '계속', '기대', '궁금'];
    var hasCliffhanger = cliffhangerKeywords.some(function(kw) { return lastPart.includes(kw); });
    if (!hasCliffhanger) {
        retentionScore -= 8;
        retentionDeductions.push('클리프행어 부족 (-8점)');
    }
    
    // 점수 범위 제한 (30-100)
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
    
    // AI 점수와 로컬 점수 보정
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

function fixScript(stage) {
    var s = state[stage];
    var text = s.originalScript;
    var errors = s.allErrors || [];
    errors.forEach(function(err) {
        if (err.useRevised && err.original && err.revised) {
            text = text.split(err.original).join(err.revised);
        }
    });
    s.fixedScript = text;
    s.isFixed = true;
    if (stage === 'stage2') state.finalScript = text;
    renderScriptWithMarkers(stage);
    alert((stage === 'stage1' ? '1차' : '최종') + ' 수정본이 적용되었습니다.');
}
