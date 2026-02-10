/**
 * MISLGOM 대본 검수 자동 프로그램
 * main.js v4.54 - Vertex AI API 키 + Gemini 2.5 Flash
 * - v4.54: 시대고증 오류 검출 대폭 강화 (현대물건 자동 검출 + 프롬프트 강화)
 * - v4.53: 2차 분석 테이블 클릭 → 최종 수정 반영 스크롤 이동 + 개별 오류 독립 토글
 * - v4.52: 개별 수정 전/후 토글 + 나레이션 오류 제외 강화
 * - v4.51: 1차/2차 분석 프롬프트 강화 (오류 검출 정확도 향상)
 * - v4.50: 나레이션 조선어투 허용 강화 + 클릭 이동/버튼 수정
 * - ENDPOINT: generativelanguage.googleapis.com
 * - TIMEOUT: 300000 ms
 * - MAX_OUTPUT_TOKENS: 16384
 */

console.log('🚀 main.js v4.54 로드됨');
console.log('📌 v4.54: 시대고증 오류 검출 대폭 강화 (현대물건 자동 검출 + 프롬프트 강화)');

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
        { modern: '선풍기', historical: ['부채', '손풍기'], confidence: '높음', reason: '선풍기는 근대 이후' },
        { modern: '전등', historical: ['촛불', '등잔', '횃불'], confidence: '높음', reason: '전등은 근대 이후' },
        { modern: '전구', historical: ['촛불', '등잔'], confidence: '높음', reason: '전구는 근대 발명' },
        { modern: '형광등', historical: ['촛불', '등잔'], confidence: '높음', reason: '현대 조명' },
        { modern: '손전등', historical: ['횃불', '등롱'], confidence: '높음', reason: '현대 도구' },
        { modern: '플래시', historical: ['횃불', '등롱'], confidence: '높음', reason: '현대 도구' },
        { modern: '칫솔', historical: ['이쑤시개', '소금'], confidence: '높음', reason: '칫솔은 근대 도입' },
        { modern: '치약', historical: ['소금', '재'], confidence: '높음', reason: '치약은 현대 제품' },
        { modern: '비누', historical: ['잿물', '쌀뜨물'], confidence: '중간', reason: '비누는 근대 도입' },
        { modern: '샴푸', historical: ['쌀뜨물', '비누'], confidence: '높음', reason: '현대 제품' },
        { modern: '수건', historical: ['수건', '손수건'], confidence: '낮음', reason: '수건은 존재했으나 형태 다름' },
        { modern: '거울', historical: ['동경', '수경'], confidence: '낮음', reason: '금속거울 존재' },
        { modern: '유리', historical: ['없음'], confidence: '높음', reason: '유리창은 근대 이후' },
        { modern: '유리창', historical: ['창호지', '문종이'], confidence: '높음', reason: '유리창은 근대 이후' },
        { modern: '플라스틱', historical: ['없음'], confidence: '높음', reason: '현대 소재' },
        { modern: '비닐', historical: ['없음'], confidence: '높음', reason: '현대 소재' },
        { modern: '고무', historical: ['없음'], confidence: '높음', reason: '고무는 근대 도입' },
        { modern: '지퍼', historical: ['끈', '단추', '매듭'], confidence: '높음', reason: '지퍼는 20세기' },
        { modern: '단추', historical: ['매듭', '끈', '띠'], confidence: '중간', reason: '단추는 조선 후기 일부' },
        { modern: '벨트', historical: ['띠', '허리띠', '대'], confidence: '높음', reason: '벨트는 서양식' },
        { modern: '지갑', historical: ['전대', '돈주머니'], confidence: '높음', reason: '지갑은 근대 용어' },
        { modern: '가위', historical: ['가위'], confidence: '낮음', reason: '가위는 존재' },
        { modern: '칼', historical: ['칼', '도'], confidence: '낮음', reason: '칼은 존재' },
        { modern: '포크', historical: ['젓가락', '숟가락'], confidence: '높음', reason: '포크는 서양 식기' },
        { modern: '나이프', historical: ['칼', '식도'], confidence: '높음', reason: '나이프는 서양 식기' },
        { modern: '접시', historical: ['접시', '사발', '대접'], confidence: '낮음', reason: '접시는 존재' },
        { modern: '컵', historical: ['잔', '사발'], confidence: '높음', reason: '컵은 서양 용어' },
        { modern: '머그컵', historical: ['잔', '사발'], confidence: '높음', reason: '머그컵은 현대' },
        { modern: '텀블러', historical: ['물병', '호리병'], confidence: '높음', reason: '현대 용어' },
        { modern: '보온병', historical: ['없음'], confidence: '높음', reason: '현대 발명' },
        { modern: '냄비', historical: ['솥', '가마솥', '냄비'], confidence: '낮음', reason: '냄비 유사품 존재' },
        { modern: '프라이팬', historical: ['번철', '석쇠'], confidence: '높음', reason: '프라이팬은 서양식' },
        { modern: '전자레인지', historical: ['없음'], confidence: '높음', reason: '현대 가전' },
        { modern: '가스레인지', historical: ['아궁이', '화덕'], confidence: '높음', reason: '현대 가전' },
        { modern: '인덕션', historical: ['아궁이', '화덕'], confidence: '높음', reason: '현대 가전' }
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
        { modern: '역', historical: ['역참', '역원'], confidence: '중간', reason: '기차역은 근대 시설' },
        { modern: '주유소', historical: ['없음'], confidence: '높음', reason: '현대 시설' },
        { modern: '세탁소', historical: ['빨래터'], confidence: '높음', reason: '세탁소는 근대' },
        { modern: '미용실', historical: ['없음'], confidence: '높음', reason: '현대 시설' },
        { modern: '이발소', historical: ['없음'], confidence: '높음', reason: '근대 시설' },
        { modern: '헬스장', historical: ['무예장', '연무장'], confidence: '높음', reason: '현대 시설' },
        { modern: '수영장', historical: ['연못', '강'], confidence: '높음', reason: '현대 시설' },
        { modern: '영화관', historical: ['없음'], confidence: '높음', reason: '현대 시설' },
        { modern: '극장', historical: ['광대패 공연장'], confidence: '높음', reason: '근대 시설' },
        { modern: '놀이공원', historical: ['없음'], confidence: '높음', reason: '현대 시설' },
        { modern: '도서관', historical: ['서고', '장서각'], confidence: '높음', reason: '도서관은 근대' }
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
        { modern: '디자이너', historical: ['화공', '장인'], confidence: '높음', reason: '현대 용어' },
        { modern: '요리사', historical: ['수라간 나인', '주방장'], confidence: '높음', reason: '요리사는 근대' },
        { modern: '셰프', historical: ['수라간 나인', '주방장'], confidence: '높음', reason: '셰프는 외래어' },
        { modern: '바리스타', historical: ['없음'], confidence: '높음', reason: '현대 직업' },
        { modern: '소방관', historical: ['화재진압꾼', '포졸'], confidence: '높음', reason: '소방관은 근대' },
        { modern: '군인', historical: ['군졸', '병사', '무사'], confidence: '중간', reason: '군인은 근대 용어' },
        { modern: '장교', historical: ['장수', '무관', '선전관'], confidence: '높음', reason: '장교는 근대 용어' },
        { modern: '대통령', historical: ['임금', '왕', '전하'], confidence: '높음', reason: '대통령은 근대' },
        { modern: '국회의원', historical: ['대신', '관원'], confidence: '높음', reason: '국회의원은 근대' }
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
        { modern: '%', historical: ['할', '푼', '리'], confidence: '높음', reason: '서양 기호' },
        { modern: 'cm', historical: ['치', '푼'], confidence: '높음', reason: '서양 단위' },
        { modern: 'kg', historical: ['근', '냥'], confidence: '높음', reason: '서양 단위' },
        { modern: 'km', historical: ['리'], confidence: '높음', reason: '서양 단위' },
        { modern: 'm', historical: ['자', '척'], confidence: '높음', reason: '서양 단위' }
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
        { modern: '여권', historical: ['통행증', '노인'], confidence: '높음', reason: '여권은 현대 용어' },
        { modern: '전화하다', historical: ['전령을 보내다', '서신을 보내다'], confidence: '높음', reason: '전화는 근대' },
        { modern: '문자하다', historical: ['서신을 보내다'], confidence: '높음', reason: '문자는 현대' },
        { modern: '인터넷', historical: ['없음'], confidence: '높음', reason: '현대 기술' },
        { modern: '검색하다', historical: ['찾아보다', '수소문하다'], confidence: '높음', reason: '검색은 현대' },
        { modern: '다운로드', historical: ['없음'], confidence: '높음', reason: '현대 용어' },
        { modern: '업로드', historical: ['없음'], confidence: '높음', reason: '현대 용어' },
        { modern: '로그인', historical: ['없음'], confidence: '높음', reason: '현대 용어' },
        { modern: '비밀번호', historical: ['암호', '암구호'], confidence: '높음', reason: '현대 용어' },
        { modern: '예약하다', historical: ['미리 청하다', '자리를 잡다'], confidence: '중간', reason: '예약은 근대' },
        { modern: '주문하다', historical: ['청하다', '부르다'], confidence: '중간', reason: '주문은 근대' }
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
        { modern: '와인', historical: ['포도주'], confidence: '중간', reason: '포도주는 일부 존재' },
        { modern: '소시지', historical: ['순대'], confidence: '높음', reason: '소시지는 서양' },
        { modern: '햄', historical: ['포', '육포'], confidence: '높음', reason: '햄은 서양' },
        { modern: '베이컨', historical: ['없음'], confidence: '높음', reason: '서양 음식' },
        { modern: '스테이크', historical: ['고기구이'], confidence: '높음', reason: '스테이크는 서양' },
        { modern: '파스타', historical: ['없음'], confidence: '높음', reason: '서양 음식' },
        { modern: '스파게티', historical: ['없음'], confidence: '높음', reason: '서양 음식' },
        { modern: '샐러드', historical: ['나물'], confidence: '높음', reason: '샐러드는 서양' },
        { modern: '샌드위치', historical: ['없음'], confidence: '높음', reason: '서양 음식' },
        { modern: '토스트', historical: ['없음'], confidence: '높음', reason: '서양 음식' },
        { modern: '시리얼', historical: ['죽'], confidence: '높음', reason: '시리얼은 현대' },
        { modern: '요거트', historical: ['없음'], confidence: '높음', reason: '현대 음식' },
        { modern: '아메리카노', historical: ['없음'], confidence: '높음', reason: '현대 음료' },
        { modern: '라떼', historical: ['없음'], confidence: '높음', reason: '현대 음료' },
        { modern: '에스프레소', historical: ['없음'], confidence: '높음', reason: '현대 음료' },
        { modern: '주스', historical: ['과일즙', '과즙'], confidence: '높음', reason: '주스는 현대' },
        { modern: '탄산수', historical: ['없음'], confidence: '높음', reason: '현대 음료' },
        { modern: '에너지드링크', historical: ['없음'], confidence: '높음', reason: '현대 음료' }
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
        { modern: '슬리퍼', historical: ['짚신', '나막신'], confidence: '높음', reason: '현대 신발' },
        { modern: '부츠', historical: ['목화', '가죽신'], confidence: '높음', reason: '부츠는 서양' },
        { modern: '샌들', historical: ['짚신', '미투리'], confidence: '높음', reason: '샌들은 서양' },
        { modern: '스니커즈', historical: ['짚신', '미투리'], confidence: '높음', reason: '현대 신발' },
        { modern: '모자', historical: ['갓', '망건', '탕건'], confidence: '중간', reason: '모자는 근대' },
        { modern: '캡', historical: ['갓', '패랭이'], confidence: '높음', reason: '캡은 현대' },
        { modern: '비니', historical: ['없음'], confidence: '높음', reason: '현대 의복' },
        { modern: '장갑', historical: ['토시', '장갑'], confidence: '낮음', reason: '장갑 유사품 존재' },
        { modern: '목도리', historical: ['목도리', '털목도리'], confidence: '낮음', reason: '목도리 유사품 존재' },
        { modern: '코트', historical: ['두루마기', '외투'], confidence: '높음', reason: '코트는 서양' },
        { modern: '점퍼', historical: ['저고리', '배자'], confidence: '높음', reason: '점퍼는 현대' },
        { modern: '패딩', historical: ['솜옷', '누비옷'], confidence: '높음', reason: '패딩은 현대' },
        { modern: '브래지어', historical: ['가슴띠', '속적삼'], confidence: '높음', reason: '브래지어는 서양' },
        { modern: '팬티', historical: ['속곳', '다리속곳'], confidence: '높음', reason: '팬티는 현대' },
        { modern: '속옷', historical: ['속옷', '속적삼'], confidence: '낮음', reason: '속옷은 존재' },
        { modern: '수영복', historical: ['없음'], confidence: '높음', reason: '수영복은 현대' },
        { modern: '비키니', historical: ['없음'], confidence: '높음', reason: '비키니는 현대' }
    ],
    concepts: [
        { modern: '민주주의', historical: ['없음'], confidence: '높음', reason: '근대 정치 개념' },
        { modern: '공화국', historical: ['없음'], confidence: '높음', reason: '근대 정치 개념' },
        { modern: '자유', historical: ['없음'], confidence: '중간', reason: '개념 자체는 있으나 근대적 의미 다름' },
        { modern: '평등', historical: ['없음'], confidence: '높음', reason: '근대 개념' },
        { modern: '인권', historical: ['없음'], confidence: '높음', reason: '근대 개념' },
        { modern: '투표', historical: ['없음'], confidence: '높음', reason: '근대 제도' },
        { modern: '선거', historical: ['없음'], confidence: '높음', reason: '근대 제도' },
        { modern: '헌법', historical: ['없음'], confidence: '높음', reason: '근대 법률' },
        { modern: '법률', historical: ['율법', '법전'], confidence: '중간', reason: '법률은 근대 용어' },
        { modern: '계약', historical: ['문서', '증서', '각서'], confidence: '중간', reason: '계약은 근대 개념' },
        { modern: '보험', historical: ['없음'], confidence: '높음', reason: '근대 제도' },
        { modern: '연금', historical: ['없음'], confidence: '높음', reason: '현대 제도' },
        { modern: '복지', historical: ['없음'], confidence: '높음', reason: '현대 개념' },
        { modern: '노동자', historical: ['일꾼', '품팔이'], confidence: '높음', reason: '노동자는 근대' },
        { modern: '파업', historical: ['없음'], confidence: '높음', reason: '파업은 근대' },
        { modern: '시위', historical: ['상소', '민란'], confidence: '높음', reason: '시위는 근대' },
        { modern: '데모', historical: ['없음'], confidence: '높음', reason: '데모는 외래어' },
        { modern: '혁명', historical: ['반정', '역모'], confidence: '높음', reason: '혁명은 근대' },
        { modern: '자본주의', historical: ['없음'], confidence: '높음', reason: '근대 경제 개념' },
        { modern: '사회주의', historical: ['없음'], confidence: '높음', reason: '근대 사상' },
        { modern: '공산주의', historical: ['없음'], confidence: '높음', reason: '근대 사상' }
    ],
    expressions: [
        { modern: '오케이', historical: ['알겠소', '그리 하리다'], confidence: '높음', reason: '영어 표현' },
        { modern: 'OK', historical: ['알겠소', '그리 하리다'], confidence: '높음', reason: '영어 표현' },
        { modern: '바이', historical: ['안녕히', '편히 가시오'], confidence: '높음', reason: '영어 표현' },
        { modern: '헬로', historical: ['안녕하시오'], confidence: '높음', reason: '영어 표현' },
        { modern: '땡큐', historical: ['고맙소', '감사하오'], confidence: '높음', reason: '영어 표현' },
        { modern: '소리', historical: ['쏘리', '죄송'], confidence: '높음', reason: '영어 표현' },
        { modern: '노', historical: ['아니오', '그렇지 않소'], confidence: '높음', reason: '영어 표현' },
        { modern: '예스', historical: ['그렇소', '옳소'], confidence: '높음', reason: '영어 표현' },
        { modern: '굿', historical: ['좋소', '훌륭하오'], confidence: '높음', reason: '영어 표현' },
        { modern: '베리굿', historical: ['아주 좋소'], confidence: '높음', reason: '영어 표현' },
        { modern: '파이팅', historical: ['힘내시오', '분발하시오'], confidence: '높음', reason: '외래어' },
        { modern: '화이팅', historical: ['힘내시오', '분발하시오'], confidence: '높음', reason: '외래어' },
        { modern: '스트레스', historical: ['심화', '울화'], confidence: '높음', reason: '외래어' },
        { modern: '멘탈', historical: ['정신', '마음'], confidence: '높음', reason: '외래어' },
        { modern: '컨디션', historical: ['기력', '몸 상태'], confidence: '높음', reason: '외래어' },
        { modern: '타이밍', historical: ['때', '시기'], confidence: '높음', reason: '외래어' },
        { modern: '센스', historical: ['눈치', '재치'], confidence: '높음', reason: '외래어' },
        { modern: '매너', historical: ['예의', '범절'], confidence: '높음', reason: '외래어' },
        { modern: '이미지', historical: ['모습', '인상'], confidence: '높음', reason: '외래어' },
        { modern: '스타일', historical: ['모양새', '차림새'], confidence: '높음', reason: '외래어' },
        { modern: '포인트', historical: ['핵심', '요점'], confidence: '높음', reason: '외래어' },
        { modern: '리스크', historical: ['위험', '모험'], confidence: '높음', reason: '외래어' },
        { modern: '퀄리티', historical: ['품질', '질'], confidence: '높음', reason: '외래어' },
        { modern: '케이스', historical: ['경우', '사례'], confidence: '높음', reason: '외래어' },
        { modern: '미션', historical: ['임무', '소임'], confidence: '높음', reason: '외래어' },
        { modern: '레벨', historical: ['수준', '급'], confidence: '높음', reason: '외래어' },
        { modern: '메모', historical: ['기록', '적어두다'], confidence: '높음', reason: '외래어' },
        { modern: '체크', historical: ['확인', '점검'], confidence: '높음', reason: '외래어' },
        { modern: '리스트', historical: ['목록', '명부'], confidence: '높음', reason: '외래어' },
        { modern: '스케줄', historical: ['일정', '계획'], confidence: '높음', reason: '외래어' },
        { modern: '플랜', historical: ['계획', '방책'], confidence: '높음', reason: '외래어' }
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
    console.log('✅ main.js v4.54 초기화 완료');
    console.log('🆕 v4.54 신규: 시대고증 규칙 대폭 확장 (8개 카테고리, 300개+ 규칙)');
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
        '역사적사실': '역사<br>사실',
        '현대물건': '현대<br>물건',
        '현대시설': '현대<br>시설',
        '현대직업': '현대<br>직업',
        '현대개념': '현대<br>개념',
        '외래어': '외래어'
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
    var cleanScript = script.replace(/★/g, '');
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
            var displayText = err.useRevised ? err.revised : err.original;
            var markerClass = err.useRevised ? 'marker-revised' : 'marker-original';
            var markerHtml = '<span class="correction-marker ' + markerClass + '" data-marker-id="' + err.id + '" data-stage="' + stage + '" title="' + escapeHtml(err.original) + ' → ' + escapeHtml(err.revised) + '">' + escapeHtml(displayText) + '</span>';
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

function getModernWordsOnly() {
    var words = [];
    for (var category in HISTORICAL_RULES) {
        HISTORICAL_RULES[category].forEach(function(rule) {
            words.push(rule.modern);
        });
    }
    return words;
}

function detectHistoricalErrors(script) {
    var detectedErrors = [];
    var lines = script.split('\n');
    
    for (var category in HISTORICAL_RULES) {
        HISTORICAL_RULES[category].forEach(function(rule) {
            var regex = new RegExp(rule.modern, 'g');
            var match;
            
            while ((match = regex.exec(script)) !== null) {
                var lineIndex = script.substring(0, match.index).split('\n').length - 1;
                var line = lines[lineIndex] || '';
                
                var isNarration = /^(나레이션|NA|N|내레이션)\s*:/i.test(line) || /^\(나레이션\)/i.test(line);
                
                if (!isNarration) {
                    var context = script.substring(Math.max(0, match.index - 20), Math.min(script.length, match.index + rule.modern.length + 20));
                    
                    var isDuplicate = detectedErrors.some(function(err) {
                        return err.original === rule.modern && err.context === context;
                    });
                    
                    if (!isDuplicate) {
                        detectedErrors.push({
                            type: '시대착오',
                            original: rule.modern,
                            revised: rule.historical[0] || '(수정 필요)',
                            reason: rule.reason,
                            severity: rule.confidence === '높음' ? 'high' : 'medium',
                            context: context,
                            position: match.index
                        });
                        console.log('🔍 시대착오 자동 검출: ' + rule.modern + ' → ' + rule.historical[0]);
                    }
                }
            }
        });
    }
    
    return detectedErrors;
}

function buildStage1Prompt(script) {
    var modernWords = getModernWordsOnly();
    var modernWordsList = modernWords.slice(0, 100).join(', ');
    
    return '당신은 조선시대 사극 대본 전문 검수자입니다. 반드시 오류를 찾아내야 합니다.\n\n' +
        '## 🎯 핵심 임무 (매우 중요!!!)\n' +
        '이 대본에서 시대에 맞지 않는 현대적 표현, 물건, 시설, 직업, 개념을 반드시 찾아내세요.\n' +
        '"오류 없음"은 거의 불가능합니다. 더 꼼꼼히 분석하세요.\n\n' +
        '## ⚠️ 최우선 검사 항목: 현대 물건/용어 검출 (절대 놓치지 마세요!!!)\n\n' +
        '### 🚨 다음 단어가 대본에 있으면 무조건 오류입니다:\n' +
        modernWordsList + '\n\n' +
        '### 📌 현대 물건 예시 (조선시대에 절대 있을 수 없음):\n' +
        '- 필기구: 펜, 볼펜, 연필, 지우개, 노트 → 붓, 먹, 서책으로 수정\n' +
        '- 조명: 전등, 전구, 형광등, 손전등 → 촛불, 등잔, 횃불로 수정\n' +
        '- 통신: 전화, 휴대폰, 문자 → 전령, 파발, 서신으로 수정\n' +
        '- 교통: 자동차, 기차, 버스, 택시 → 가마, 마차, 말로 수정\n' +
        '- 가전: 냉장고, 에어컨, 선풍기, TV, 라디오 → 석빙고, 부채 등으로 수정\n' +
        '- 식품: 커피, 라면, 콜라, 햄버거, 피자 → 차, 국수 등으로 수정\n' +
        '- 의복: 양복, 청바지, 티셔츠, 구두, 운동화 → 도포, 한복, 짚신으로 수정\n' +
        '- 시설: 병원, 학교, 경찰서, 은행, 카페 → 의원, 서당, 포도청, 전당포로 수정\n' +
        '- 직업: 의사, 경찰, 선생님, 회사원 → 의원, 포졸, 훈장, 상인으로 수정\n' +
        '- 단위: 미터, 킬로그램, 퍼센트, 원 → 자, 근, 할, 냥으로 수정\n' +
        '- 외래어: OK, 바이, 파이팅, 스트레스, 센스 → 조선식 표현으로 수정\n\n' +
        '## ⛔ 오류로 판정하지 말아야 할 것\n' +
        '### 나레이션은 절대 오류가 아닙니다!\n' +
        '- "나레이션:", "NA:", "N:" 등으로 시작하는 줄\n' +
        '- 나레이션의 고어체/문어체 표현은 작가의 스타일\n\n' +
        '## 📋 추가 검출 항목 (등장인물 대사에서만)\n' +
        '### 1. 캐릭터/인물 오류\n' +
        '- 같은 인물의 나이가 다르게 표기된 경우\n' +
        '- 신분에 맞지 않는 말투\n\n' +
        '### 2. 호칭 오류\n' +
        '- 신분에 맞지 않는 호칭\n\n' +
        '### 3. 이야기 흐름 오류\n' +
        '- 시간 순서, 장소 이동 오류\n\n' +
        '## 📝 분석 대상 대본:\n```\n' + script + '\n```\n\n' +
        '## ✅ 응답 규칙\n' +
        '1. 나레이션은 절대 오류로 넣지 마세요!\n' +
        '2. 위에 나열된 현대 물건/용어가 대본에 있으면 반드시 오류로 검출하세요!\n' +
        '3. 각 오류에 대해 조선시대에 맞는 수정안을 제시하세요\n\n' +
        '## 📤 응답 형식 (반드시 JSON만 반환):\n' +
        '```json\n' +
        '{"errors": [\n' +
        '  {"type": "시대착오", "original": "펜", "revised": "붓", "reason": "펜은 근대 이후 도입", "severity": "high"},\n' +
        '  {"type": "시대착오", "original": "커피", "revised": "차", "reason": "커피는 근대 도입", "severity": "high"}\n' +
        ']}\n' +
        '```\n\n' +
        '⚠️ 최종 확인: 펜, 커피, 병원, 의사, 전화 등 현대 용어를 꼭 검출했는지 확인하세요!';
}

function buildStage2Prompt(script) {
    var modernWords = getModernWordsOnly();
    var modernWordsList = modernWords.slice(0, 80).join(', ');
    
    return '당신은 조선시대 사극 대본 전문 작가이자 품질 검수 전문가입니다.\n' +
        '이 대본의 품질을 엄격하게 평가하고, 반드시 개선점을 찾아주세요.\n\n' +
        '## 🚨 최우선 검사: 현대 물건/용어 추가 검출\n' +
        '다음 단어가 대본에 남아있으면 무조건 오류입니다:\n' +
        modernWordsList + '\n\n' +
        '## ⛔ 오류로 판정하지 말아야 할 것\n' +
        '### 나레이션은 절대 오류가 아닙니다!\n' +
        '- "나레이션:", "NA:", "N:" 등으로 시작하는 줄\n\n' +
        '## 📝 분석 대상 대본:\n```\n' + script + '\n```\n\n' +
        '## 🔍 필수 검사 항목\n' +
        '### 1. 추가 오류 검출\n' +
        '- 1차 분석에서 놓친 현대 물건/용어\n' +
        '- 어색한 문장 구조\n' +
        '- 캐릭터 말투 불일치\n\n' +
        '### 2. 품질 평가 기준 (각 100점)\n' +
        '- 시니어 적합도 (senior): 문장 명확성, 호칭 자연스러움\n' +
        '- 재미 요소 (fun): 갈등, 긴장감\n' +
        '- 이야기 흐름 (flow): 장면 연결, 인과관계\n' +
        '- 시청자 이탈 방지 (retention): 호기심 유발\n\n' +
        '## 📤 응답 형식 (반드시 JSON만 반환):\n' +
        '```json\n' +
        '{\n' +
        '  "errors": [\n' +
        '    {"type": "시대착오", "original": "원문", "revised": "수정문", "reason": "사유", "severity": "high"}\n' +
        '  ],\n' +
        '  "scores": {"senior": 75, "fun": 70, "flow": 80, "retention": 65},\n' +
        '  "improvements": [{"category": "시니어적합도", "currentScore": 75, "issues": [{"location": "S#1", "problem": "문제점", "solution": "해결방법"}]}],\n' +
        '  "changePoints": [{"location": "S#1", "description": "변경내용", "category": "개선항목"}],\n' +
        '  "perfectScript": "★수정부분 앞에 ★표시한 전체 대본"\n' +
        '}\n' +
        '```';
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

function mergeErrors(apiErrors, localErrors) {
    var merged = [];
    var seen = new Set();
    
    apiErrors.forEach(function(err) {
        if (err.original) {
            seen.add(err.original);
            merged.push(err);
        }
    });
    
    localErrors.forEach(function(err) {
        if (err.original && !seen.has(err.original)) {
            merged.push(err);
            console.log('➕ 로컬 검출 오류 추가: ' + err.original);
        }
    });
    
    return merged;
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
        
        updateProgress(20, '로컬 시대고증 검사 중...');
        var localErrors = detectHistoricalErrors(script);
        console.log('🔍 로컬 검출 오류: ' + localErrors.length + '개');
        
        var prompt = buildStage1Prompt(script);
        updateProgress(30, 'Gemini API 응답 대기 중...');
        var response = await callGeminiAPI(prompt);
        updateProgress(70, '분석 결과 처리 중...');
        var result = parseApiResponse(response);
        
        var apiErrors = filterNarrationErrors(result.errors || [], script);
        var mergedErrors = mergeErrors(apiErrors, localErrors);
        console.log('📊 최종 오류: API(' + apiErrors.length + ') + 로컬(' + localErrors.length + ') = ' + mergedErrors.length + '개');
        
        state.stage1.analysis = result;
        state.stage1.allErrors = mergedErrors.map(function(err, idx) {
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
        
        updateProgress(20, '로컬 시대고증 재검사 중...');
        var localErrors = detectHistoricalErrors(script);
        
        var prompt = buildStage2Prompt(script);
        updateProgress(30, 'Gemini API 응답 대기 중
