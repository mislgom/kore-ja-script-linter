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

function renderScriptWithMarkers(stage) {
    var container = document.getElementById('revised-' + stage);
    if (!container) return;

    var scrollTop = container.scrollTop;

    var s = state[stage];
    var text = s.originalScript;
    var errors = s.allErrors || [];

    var sortedErrors = errors.slice().sort(function(a, b) {
        var posA = text.indexOf(a.original);
        var posB = text.indexOf(b.original);
        return posB - posA;
    });

    sortedErrors.forEach(function(err) {
        if (err.original && text.includes(err.original)) {
            var displayText = err.useRevised ? cleanRevisedText(err.revised) : err.original;
            var markerClass = err.useRevised ? 'marker-revised' : 'marker-original';
            var markerHtml = '<span class="correction-marker ' + markerClass + '" data-marker-id="' + err.id + '" data-stage="' + stage + '" title="' + escapeHtml(err.original) + ' → ' + escapeHtml(cleanRevisedText(err.revised)) + '">' + escapeHtml(displayText) + '</span>';
            text = text.replace(err.original, markerHtml);
        }
    });

    container.innerHTML = '<div style="background:#2d2d2d;padding:15px;border-radius:8px;white-space:pre-wrap;word-break:break-word;line-height:1.8;color:#fff;">' + text + '</div>';

    container.scrollTop = scrollTop;

    container.querySelectorAll('.correction-marker').forEach(function(marker) {
        marker.addEventListener('click', function() {
            var markerId = this.getAttribute('data-marker-id');
            var errorIndex = findErrorIndexById(stage, markerId);
            if (errorIndex >= 0) {
                setCurrentError(stage, errorIndex);
                scrollToTableRow(stage, markerId);
            }
        });
    });
    
    console.log('🖊️ 수정 반영 렌더링 완료: ' + stage + ' (' + errors.length + '개 항목, 특수문자 정제 적용)');
}

function cleanRevisedText(text) {
    if (!text) return '';
    
    var cleaned = text
        .replace(/\s*\/\s*/g, '')
        .replace(/\s*\|\s*/g, '')
        .replace(/\([^)]*\)/g, '')
        .replace(/\[[^\]]*\]/g, '')
        .replace(/\{[^}]*\}/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    
    var firstOption = cleaned.split(/[,、]/)[0].trim();
    
    console.log('🧹 수정안 정제: "' + text + '" → "' + firstOption + '"');
    
    return firstOption || cleaned || text;
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
    if (!container) return;
    
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
    
    console.log('📝 1차 분석 프롬프트 생성: 6개 항목 검사 (시대착오/인물설정/시간왜곡/이야기흐름/쌩뚱맞은표현/캐릭터일관성/장면연결성)');
    
    return '당신은 조선시대 사극 대본 전문 검수자입니다. 반드시 모든 오류를 빠짐없이 찾아내야 합니다.\n\n' +
        '## 🎯 1차 분석 목적: 기본 오류 검출 (7개 항목 필수 검사)\n\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '## ✅ 검사항목 1: 시대착오 (최우선)\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
        '### 아래 현대 단어가 대사에 있으면 무조건 오류입니다!\n\n' +
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
        '## ✅ 검사항목 2: 인물 설정 오류\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
        '- 같은 인물의 나이가 장면마다 다르게 표기된 경우\n' +
        '- 인물의 신분(양반/상민/천민)에 맞지 않는 말투 사용\n' +
        '- 인물 소개와 실제 행동이 불일치하는 경우\n' +
        '- 예: "열 살 소녀"가 다음 장면에서 "스무 살 처녀"로 표기\n\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '## ✅ 검사항목 3: 시간 왜곡 오류\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
        '- 아침→저녁→아침 등 시간 순서가 뒤바뀐 경우\n' +
        '- "3일 후"라고 했는데 바로 다음 장면이 "어제" 언급\n' +
        '- 계절이 갑자기 바뀌는 경우 (봄→겨울→여름)\n' +
        '- 예: "해가 뜨는 아침"인데 대사에서 "달빛 아래"\n\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '## ✅ 검사항목 4: 이야기 흐름 오류\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
        '- 앞 장면과 연결이 안 되는 갑작스러운 전개\n' +
        '- 인과관계 없이 갑자기 결론으로 점프\n' +
        '- 설명 없이 새로운 인물/상황 등장\n' +
        '- 예: 싸우던 두 사람이 다음 장면에서 갑자기 친구\n\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '## ✅ 검사항목 5: 쌩뚱맞은 표현 오류\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
        '- 상황과 전혀 맞지 않는 대사\n' +
        '- 분위기를 깨는 부적절한 표현\n' +
        '- 갑자기 튀어나온 엉뚱한 말\n' +
        '- 예: 장례식장에서 "오늘 날씨 좋네요"\n\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '## ✅ 검사항목 6: 캐릭터 일관성 오류\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
        '- 같은 인물이 장면마다 다른 성격으로 말하는 경우\n' +
        '- 과묵한 캐릭터가 갑자기 수다스러워지는 경우\n' +
        '- 호칭이 일관되지 않는 경우 (아버지→아빠→부친)\n' +
        '- 예: 엄격한 아버지가 갑자기 애교 부리는 말투\n\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '## ✅ 검사항목 7: 장면 연결성 오류\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
        '- 장소 이동 설명 없이 갑자기 다른 곳에 있는 경우\n' +
        '- A장소에서 B장소로 이동할 수 없는 상황인데 이동\n' +
        '- 연속된 장면인데 옷이나 소품이 갑자기 바뀐 경우\n' +
        '- 예: 감옥에 갇혀있던 사람이 다음 장면에서 궁궐에\n\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '## ⛔ 오류로 판정하지 말 것\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
        '- 나레이션 (나레이션:, NA:, N: 등으로 시작하는 줄)\n' +
        '- 지문/설명 (괄호 안의 행동 묘사)\n' +
        '- 음향효과 ([SE], [BGM] 등)\n\n' +
        '## 📝 분석 대상 대본:\n```\n' + script + '\n```\n\n' +
        '## 📤 응답 형식 (반드시 JSON만, 수정안에 / 또는 괄호 금지!):\n' +
        '```json\n' +
        '{"errors": [\n' +
        '  {"type": "시대착오", "original": "원문 그대로", "revised": "수정안 하나만", "reason": "사유 15자 이내", "severity": "high"},\n' +
        '  {"type": "인물설정", "original": "원문", "revised": "수정안", "reason": "사유", "severity": "medium"},\n' +
        '  {"type": "시간왜곡", "original": "원문", "revised": "수정안", "reason": "사유", "severity": "medium"},\n' +
        '  {"type": "이야기흐름", "original": "원문", "revised": "수정안", "reason": "사유", "severity": "medium"},\n' +
        '  {"type": "쌩뚱맞은표현", "original": "원문", "revised": "수정안", "reason": "사유", "severity": "low"},\n' +
        '  {"type": "캐릭터일관성", "original": "원문", "revised": "수정안", "reason": "사유", "severity": "medium"},\n' +
        '  {"type": "장면연결성", "original": "원문", "revised": "수정안", "reason": "사유", "severity": "medium"}\n' +
        ']}\n' +
        '```\n\n' +
        '⚠️ 중요: revised에는 수정안을 딱 하나만! / 또는 괄호() 절대 금지!';
}

function buildStage2Prompt(script) {
    console.log('📝 2차 분석 프롬프트 생성: 정밀 검토 + 놓친 오류 + 점수 산출 + 100점 대본 생성');
    
    return '당신은 조선시대 사극 대본 전문 작가이자 최고급 품질 검수 전문가입니다.\n' +
        '1차 분석에서 놓친 미세한 오류를 찾고, 대본 품질을 정밀 평가하고, 100점짜리 완벽한 대본을 만들어주세요.\n\n' +
        '## 🎯 2차 분석 목적: 정밀 검토 + 점수 산출 + 100점 대본 생성\n\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '## ✅ 검사항목 1: 시간 왜곡 (미세한 부분)\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
        '- 1차에서 놓친 미묘한 시간 순서 오류\n' +
        '- "잠시 후", "이윽고" 등의 시간 표현 일관성\n' +
        '- 하루 중 시간대 흐름의 자연스러움\n\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '## ✅ 검사항목 2: 이야기 흐름 (감정선 연결)\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
        '- 인물의 감정 변화가 자연스럽게 연결되는가\n' +
        '- 갑작스러운 감정 전환이 있는가\n' +
        '- 감정의 고조와 해소가 적절한가\n\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '## ✅ 검사항목 3: 쌩뚱맞은 표현 (대사 자연스러움)\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
        '- 대사가 상황에 맞게 자연스러운가\n' +
        '- 어색하거나 부자연스러운 문장 구조\n' +
        '- 조선시대 말투로서 어색한 표현\n\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '## ✅ 검사항목 4: 캐릭터 일관성 (호칭 일관성)\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
        '- 같은 인물을 부르는 호칭이 일관되는가\n' +
        '- 신분에 맞는 호칭을 사용하는가\n' +
        '- 관계 변화에 따른 호칭 변화가 자연스러운가\n\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '## ✅ 검사항목 5: 장면 연결성 (복선/떡밥 회수)\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
        '- 앞에서 언급된 복선이 회수되는가\n' +
        '- 떡밥(암시)이 적절히 해소되는가\n' +
        '- 미완결된 이야기 요소가 있는가\n\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '## ✅ 검사항목 6: 역사적 사실 오류\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
        '- 조선시대 역사적 사실과 맞지 않는 내용\n' +
        '- 실존 인물/사건의 잘못된 묘사\n' +
        '- 시대별 제도/문화의 오류\n\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '## 📊 점수 산출 (4개 항목, 각 100점 만점) + 100점 달성 방법\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
        '### 1. 시니어 적합도 (senior) - 100점 만들기\n' +
        '- 긴 문장 → 짧은 문장 2개로 분리\n' +
        '- 어려운 한자어 → 쉬운 우리말로 교체\n' +
        '- 호칭 불명확 → 관계를 알 수 있는 호칭 추가\n' +
        '- 100점 기준: 60대 이상이 한 번에 이해 가능\n\n' +
        '### 2. 재미 요소 (fun) - 100점 만들기\n' +
        '- 갈등 약함 → 대립 대사 강화\n' +
        '- 긴장감 없음 → 위기 상황 암시 추가\n' +
        '- 속마음 안 보임 → 혼잣말/독백 추가\n' +
        '- 100점 기준: 다음 장면이 궁금해지는 몰입감\n\n' +
        '### 3. 이야기 흐름 (flow) - 100점 만들기\n' +
        '- 장면 전환 어색 → 연결 대사/지문 추가\n' +
        '- 인과관계 불명확 → 이유 설명 대사 추가\n' +
        '- 시간 점프 → "며칠 후" 등 시간 표시 추가\n' +
        '- 100점 기준: 논리적 비약 없이 술술 읽힘\n\n' +
        '### 4. 시청자 이탈 방지 (retention) - 100점 만들기\n' +
        '- 초반 지루 → 첫 대사에 호기심 유발 요소\n' +
        '- 장면 끝 밋밋 → 긴장감 있는 마무리 대사\n' +
        '- 중간 늘어짐 → 불필요한 대사 삭제/압축\n' +
        '- 100점 기준: 끝까지 보고 싶어지는 구성\n\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '## ⛔ 오류로 판정하지 말 것\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
        '- 나레이션 (나레이션:, NA:, N: 등)\n' +
        '- 지문/설명 (괄호 안 행동 묘사)\n' +
        '- 음향효과 ([SE], [BGM] 등)\n\n' +
        '## 📝 분석 대상 대본:\n```\n' + script + '\n```\n\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '## 🏆 100점 수정 대본 작성 규칙 (매우 중요!!!)\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
        '**perfectScript에는 반드시 아래 4가지를 모두 적용한 완성본을 작성하세요:**\n\n' +
        '### 🔴 시니어 적합도 100점 적용\n' +
        '- 모든 긴 문장을 2개 이하 짧은 문장으로 분리\n' +
        '- 모든 호칭에 관계가 드러나게 수정 (예: "그가" → "사위가")\n' +
        '- 어려운 단어를 쉬운 말로 교체\n\n' +
        '### 🟠 재미 요소 100점 적용\n' +
        '- 갈등 장면에 긴장감 있는 대사 추가\n' +
        '- 인물의 속마음을 드러내는 표현 추가\n' +
        '- 반전/의외성 요소 강화\n\n' +
        '### 🟢 이야기 흐름 100점 적용\n' +
        '- 모든 장면 전환에 연결 표현 추가\n' +
        '- 인과관계가 명확하게 드러나도록 수정\n' +
        '- 시간/공간 이동 시 설명 추가\n\n' +
        '### 🔵 시청자 이탈 방지 100점 적용\n' +
        '- 첫 장면에 호기심 유발 요소 강화\n' +
        '- 각 장면 끝에 다음이 궁금해지는 마무리\n' +
        '- 지루한 부분 삭제/압축\n\n' +
        '## 📤 응답 형식 (반드시 JSON만, 수정안에 / 또는 괄호 금지!):\n' +
        '```json\n' +
        '{\n' +
        '  "errors": [\n' +
        '    {"type": "오류유형", "original": "원문", "revised": "수정안 하나만", "reason": "사유 15자 이내", "severity": "high/medium/low"}\n' +
        '  ],\n' +
        '  "scores": {\n' +
        '    "senior": 75,\n' +
        '    "fun": 70,\n' +
        '    "flow": 80,\n' +
        '    "retention": 65\n' +
        '  },\n' +
        '  "improvements": [\n' +
        '    {\n' +
        '      "category": "시니어적합도",\n' +
        '      "currentScore": 75,\n' +
        '      "targetScore": 100,\n' +
        '      "issues": [\n' +
        '        {"location": "S#1", "problem": "문장이 길어 이해 어려움", "solution": "두 문장으로 분리", "before": "원문", "after": "수정문"}\n' +
        '      ]\n' +
        '    },\n' +
        '    {\n' +
        '      "category": "재미요소",\n' +
        '      "currentScore": 70,\n' +
        '      "targetScore": 100,\n' +
        '      "issues": [\n' +
        '        {"location": "S#2", "problem": "갈등이 약함", "solution": "긴장감 대사 추가", "before": "원문", "after": "수정문"}\n' +
        '      ]\n' +
        '    },\n' +
        '    {\n' +
        '      "category": "이야기흐름",\n' +
        '      "currentScore": 80,\n' +
        '      "targetScore": 100,\n' +
        '      "issues": [\n' +
        '        {"location": "S#3", "problem": "장면 연결 어색", "solution": "연결 대사 추가", "before": "원문", "after": "수정문"}\n' +
        '      ]\n' +
        '    },\n' +
        '    {\n' +
        '      "category": "시청자이탈방지",\n' +
        '      "currentScore": 65,\n' +
        '      "targetScore": 100,\n' +
        '      "issues": [\n' +
        '        {"location": "S#1", "problem": "초반 호기심 부족", "solution": "궁금증 유발 대사 추가", "before": "원문", "after": "수정문"}\n' +
        '      ]\n' +
        '    }\n' +
        '  ],\n' +
        '  "changePoints": [\n' +
        '    {"location": "S#1", "description": "문장 분리로 가독성 향상", "category": "시니어적합도"},\n' +
        '    {"location": "S#2", "description": "갈등 대사 추가", "category": "재미요소"},\n' +
        '    {"location": "S#3", "description": "장면 연결 대사 추가", "category": "이야기흐름"},\n' +
        '    {"location": "S#1", "description": "호기심 유발 대사 추가", "category": "시청자이탈방지"}\n' +
        '  ],\n' +
        '  "perfectScript": "위 4가지 개선사항을 모두 적용한 100점짜리 완성 대본 전체"\n' +
        '}\n' +
        '```\n\n' +
        '⚠️ 최종 확인:\n' +
        '1. perfectScript에 improvements의 모든 수정사항이 실제로 반영되었는지 확인!\n' +
        '2. 나레이션은 오류로 넣지 말 것!\n' +
        '3. revised에 / 또는 () 넣지 말 것!';
}

function filterNarrationErrors(errors, script) {
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
        if (!err.original) return true;
        
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
        updateProgress(100, '1차 분석 완료!');
        setTimeout(hideProgress, 1000);
    } catch (error) {
        if (error.name !== 'AbortError') { alert('분석 중 오류가 발생했습니다: ' + error.message); }
        hideProgress();
    }
}

async function startStage2Analysis() {
    var script = state.stage1.fixedScript || state.stage1.originalScript;
    if (!script) { alert('1차 분석을 먼저 완료해주세요.'); return; }
    var apiKey = localStorage.getItem('GEMINI_API_KEY');
    if (!apiKey) { alert('API 키를 먼저 설정해주세요.'); return; }

    showProgress('2차 분석 시작...');
    updateProgress(10, 'AI 정밀 분석 요청 중...');

    try {
        state.stage2.originalScript = script;
        state.stage2.isFixed = false;
        state.stage2.currentErrorIndex = -1;
        var prompt = buildStage2Prompt(script);
        updateProgress(30, 'Gemini API 응답 대기 중...');
        var response = await callGeminiAPI(prompt);
        updateProgress(70, '분석 결과 처리 중...');
        var result = parseApiResponse(response);
        
        var filteredErrors = filterNarrationErrors(result.errors || [], script);
        
        state.stage2.analysis = result;
        state.stage2.allErrors = filteredErrors.map(function(err, idx) {
            return { id: 'stage2-error-' + idx, type: err.type, original: err.original, revised: err.revised, reason: err.reason, severity: err.severity, useRevised: true };
        });
        if (result.scores) state.scores = result.scores;
        if (result.perfectScript) state.perfectScript = result.perfectScript;
        if (result.changePoints) state.changePoints = result.changePoints;
        updateProgress(90, '결과 표시 중...');
        displayStage2Results();
        if (result.scores) displayScoresAndPerfectScript(result.scores, result.improvements, result.perfectScript, result.changePoints);
        updateProgress(100, '2차 분석 완료!');
        setTimeout(hideProgress, 1000);
    } catch (error) {
        if (error.name !== 'AbortError') { alert('분석 중 오류가 발생했습니다: ' + error.message); }
        hideProgress();
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
    enableStage2Buttons(errors && errors.length > 0);
}

function displayScoresAndPerfectScript(scores, improvements, perfectScript, changePoints) {
    var scoreDisplay = document.getElementById('score-display');
    if (!scoreDisplay) return;
    
    var senior = scores.senior || 0;
    var fun = scores.fun || 0;
    var flow = scores.flow || 0;
    var retention = scores.retention || 0;
    var average = Math.round((senior + fun + flow + retention) / 4);
    var passed = average >= 95;
    
    var html = '<div class="score-perfect-container">' +
        '<div class="score-panel">' +
        '<h3 style="color:#fff;margin-bottom:15px;text-align:center;">📊 품질 평가 점수</h3>' +
        '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:15px;">' +
        createScoreCard('시니어 적합도', senior, '#4CAF50') +
        createScoreCard('이야기 흐름', flow, '#2196F3') +
        createScoreCard('재미 요소', fun, '#FF9800') +
        createScoreCard('시청자 이탈 방지', retention, '#9C27B0') +
        '</div>' +
        '<div style="text-align:center;padding:15px;background:#2d2d2d;border-radius:8px;margin-bottom:15px;">' +
        '<div style="font-size:20px;color:#fff;">평균: <span style="color:' + (passed ? '#69f0ae' : '#ff5555') + ';font-weight:bold;">' + average + '점</span></div>' +
        '<div style="font-size:16px;color:' + (passed ? '#69f0ae' : '#ff5555') + ';">' + (passed ? '✅ 합격' : '❌ 미합격') + '</div>' +
        '</div>';
    
    if (improvements && improvements.length > 0) {
        html += '<div><h4 style="color:#ffaa00;margin-bottom:10px;font-size:14px;">💡 개선 제안</h4>';
        improvements.forEach(function(imp) {
            var issuesHtml = '';
            if (imp.issues && imp.issues.length > 0) {
                imp.issues.forEach(function(issue) {
                    issuesHtml += '<div style="font-size:10px;color:#aaa;margin-top:3px;">• ' + escapeHtml(issue.location) + ': ' + escapeHtml(issue.solution) + '</div>';
                });
            } else if (imp.suggestion) {
                issuesHtml = '<div style="color:#aaa;font-size:11px;margin-top:5px;">' + escapeHtml(imp.suggestion) + '</div>';
            }
            html += '<div style="background:#2d2d2d;padding:10px;border-radius:6px;margin-bottom:8px;border-left:3px solid #ffaa00;">' +
                '<div style="color:#fff;font-weight:bold;font-size:12px;">' + escapeHtml(imp.category) + ' (' + (imp.currentScore || '') + '점)</div>' +
                issuesHtml + '</div>';
        });
        html += '</div>';
    }
    html += '</div>';
    
    var formattedScript = formatPerfectScript(perfectScript || '100점 수정 대본이 생성되지 않았습니다.');
    
    html += '<div class="perfect-panel">' +
        '<h3 style="color:#69f0ae;margin-bottom:15px;text-align:center;">💯 100점 수정 대본</h3>' +
        '<div class="perfect-script-content">' + formattedScript + '</div>';
    
    if (changePoints && changePoints.length > 0) {
        html += '<div class="change-points-section">' +
            '<div class="change-points-title">📍 변경 포인트 (' + changePoints.length + '개)</div>';
        changePoints.forEach(function(point, idx) {
            html += '<div class="change-point-item" data-point-index="' + idx + '">' +
                '<strong>[' + escapeHtml(point.location) + ']</strong> ' + 
                escapeHtml(point.description) + 
                ' <span style="color:#888;font-size:10px;">(' + escapeHtml(point.category) + ')</span>' +
                '</div>';
        });
        html += '</div>';
    }
    
    html += '<div style="text-align:center;margin-top:15px;display:flex;justify-content:center;gap:10px;flex-wrap:wrap;">' +
        '<button id="btn-download-perfect" style="background:#69f0ae;color:#000;border:none;padding:10px 20px;border-radius:5px;cursor:pointer;font-weight:bold;">📥 100점 대본 다운로드</button>' +
        '<button id="btn-compare-scripts" style="background:#9c27b0;color:#fff;border:none;padding:10px 20px;border-radius:5px;cursor:pointer;font-weight:bold;">🔍 대본 비교하기</button>' +
        '</div></div></div>';
    
    scoreDisplay.innerHTML = html;
    
    var downloadBtn = document.getElementById('btn-download-perfect');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
            if (perfectScript) {
                downloadScript(perfectScript);
            } else {
                alert('100점 수정 대본이 없습니다.');
            }
        });
    }
    
    var compareBtn = document.getElementById('btn-compare-scripts');
    if (compareBtn) {
        compareBtn.addEventListener('click', function() {
            openCompareModal();
        });
    }
    
    document.querySelectorAll('.change-point-item').forEach(function(item) {
        item.addEventListener('click', function() {
            var idx = parseInt(this.getAttribute('data-point-index'));
            scrollToPerfectScriptChange(idx, changePoints);
        });
    });
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
    
    var location = point.location;
    var text = scriptContent.innerHTML;
    
    var searchText = escapeHtml(location);
    var startIdx = text.indexOf(searchText);
    
    if (startIdx !== -1) {
        var highlightId = 'temp-highlight-' + index;
        var before = text.substring(0, startIdx);
        var match = text.substring(startIdx, startIdx + searchText.length);
        var after = text.substring(startIdx + searchText.length);
        
        scriptContent.innerHTML = before + '<span id="' + highlightId + '" style="background:#69f0ae;color:#000;padding:2px 4px;border-radius:3px;">' + match + '</span>' + after;
        
        var highlightEl = document.getElementById(highlightId);
        if (highlightEl) {
            highlightEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            setTimeout(function() {
                highlightEl.outerHTML = match;
            }, 2000);
        }
    } else {
        scriptContent.scrollTop = 0;
    }
}

function createScoreCard(label, score, color) {
    var tips = getImprovementTips(label, score);
    var tipsHtml = score < 100 && tips ? '<div style="color:#ffaa00;font-size:9px;margin-top:5px;text-align:left;line-height:1.3;">' + tips + '</div>' : '';
    
    return '<div style="background:#2d2d2d;padding:10px;border-radius:6px;text-align:center;">' +
        '<div style="color:#aaa;font-size:10px;margin-bottom:3px;">' + label + '</div>' +
        '<div style="font-size:24px;font-weight:bold;color:' + color + ';">' + score + '</div>' +
        '<div style="width:100%;background:#444;height:6px;border-radius:3px;margin-top:5px;">' +
        '<div style="width:' + score + '%;background:' + color + ';height:100%;border-radius:3px;"></div></div>' +
        tipsHtml + '</div>';
}

function getImprovementTips(label, score) {
    if (score >= 100) return '';
    
    var tips = {
        '시니어 적합도': '💡 문장을 짧게, 호칭을 명확히, 관계 설명 추가',
        '이야기 흐름': '💡 장면 연결어 추가, 시간 순서 명시, 인과관계 강화',
        '재미 요소': '💡 갈등 심화, 반전 추가, 감정 대사 강화',
        '시청자 이탈 방지': '💡 초반 호기심 유발, 장면 끝 궁금증 추가'
    };
    
    return tips[label] || '';
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
