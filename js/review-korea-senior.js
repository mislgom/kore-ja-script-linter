/**
 * 한국 시니어 낭독 - 대본 검수 모듈
 * Script Review Pro v2.0
 * 
 * 검수 항목 (전체 자동화):
 * 1. 한국 배경 확인 - 키워드 매칭
 * 2. 인물 설정 일관성 - 패턴 분석
 * 3. 인물 관계 일관성 - 관계 추적
 * 4. 이야기 흐름 - 씬 구조 분석
 * 5. 반전/변화 속도 - 감정어 분포 분석
 * 6. 재미/몰입 요소 - 복합 지표 분석
 */

// ========================================
// 한국 배경 키워드 데이터베이스
// ========================================
const KoreaKeywordDB = {
    regions: [
        '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
        '경기도', '강원도', '충청북도', '충청남도', '전라북도', '전라남도',
        '경상북도', '경상남도', '제주도', '제주',
        '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남'
    ],
    
    cities: [
        '강남', '강북', '강서', '강동', '송파', '마포', '용산', '종로', '중구',
        '영등포', '구로', '금천', '동작', '관악', '서초', '성동', '광진',
        '동대문', '중랑', '성북', '노원', '도봉', '은평', '서대문', '양천',
        '수원', '성남', '고양', '용인', '부천', '안산', '안양', '남양주',
        '화성', '평택', '의정부', '시흥', '파주', '김포', '광명',
        '군포', '오산', '이천', '양주', '구리', '안성', '포천', '의왕',
        '하남', '여주', '양평', '동두천', '과천', '가평', '연천', '분당', '일산', '판교',
        '해운대', '서면', '남포동', '광안리', '센텀시티',
        '춘천', '원주', '강릉', '속초', '청주', '천안', '아산', '전주',
        '익산', '군산', '목포', '여수', '순천', '광양', '포항', '경주',
        '구미', '안동', '김천', '창원', '김해', '진주', '양산', '거제', '통영'
    ],
    
    places: [
        '동사무소', '주민센터', '구청', '시청', '군청', '면사무소', '읍사무소',
        '경찰서', '파출소', '지구대', '소방서', '우체국', '세무서', '법원',
        '검찰청', '교육청', '보건소', '복지관', '주민자치센터',
        '국민은행', '신한은행', '우리은행', '하나은행', '농협', '새마을금고',
        '신협', 'IBK기업은행', '수협',
        '편의점', 'CU', 'GS25', '세븐일레븐', '이마트24', '미니스톱',
        '대형마트', '이마트', '홈플러스', '롯데마트', '코스트코', '트레이더스',
        '백화점', '롯데백화점', '신세계', '현대백화점', '갤러리아',
        '시장', '재래시장', '전통시장', '오일장', '야시장',
        '식당', '분식집', '중국집', '짜장면집', '치킨집', '삼겹살집',
        '고깃집', '횟집', '국밥집', '설렁탕집', '칼국수집', '냉면집',
        '떡볶이집', '김밥천국', '백반집', '한정식', '보쌈집',
        '찜질방', '목욕탕', '사우나', '당구장', 'PC방', '노래방', '코인노래방',
        '만화방', '독서실', 'DVD방', '볼링장', '스크린골프',
        '초등학교', '중학교', '고등학교', '대학교', '학원', '유치원', '어린이집',
        '병원', '의원', '한의원', '치과', '약국', '요양원', '요양병원',
        '교회', '성당', '절', '사찰', '암자', '법당',
        '아파트', '빌라', '단독주택', '오피스텔', '원룸', '고시원', '하숙집',
        '버스정류장', '지하철역', '기차역', 'KTX역', '터미널', '고속버스터미널',
        '시외버스터미널', '공항', '김포공항', '인천공항', '톨게이트', '휴게소',
        '공원', '놀이터', '경로당', '마을회관', '정자', '약수터'
    ],
    
    culture: [
        '김치', '된장찌개', '김치찌개', '불고기', '비빔밥', '삼겹살', '갈비',
        '떡볶이', '순대', '김밥', '라면', '짜장면', '짬뽕', '탕수육',
        '치킨', '소주', '막걸리', '맥주', '삼계탕', '냉면', '칼국수',
        '보쌈', '족발', '해장국', '설렁탕', '곰탕', '순두부찌개', '부대찌개',
        '잡채', '전', '파전', '빈대떡', '만두', '떡', '한과',
        '아버지', '어머니', '아버님', '어머님', '할아버지', '할머니',
        '형', '누나', '오빠', '언니', '동생', '삼촌', '이모', '고모', '외삼촌',
        '사위', '며느리', '시어머니', '시아버지', '장인', '장모',
        '아저씨', '아주머니', '아줌마', '어르신',
        '설날', '추석', '명절', '제사', '차례', '성묘', '한가위',
        '어버이날', '스승의날', '어린이날', '광복절', '한글날',
        '돌잔치', '환갑', '칠순', '팔순', '결혼식', '장례식', '49재',
        '수능', '입시', '학원', '과외', '야자', '급식', '소풍', '수학여행',
        '회식', '야근', '월급', '퇴근', '출근', '연차', '휴가',
        '한복', '온돌', '보일러', '전세', '월세', '청약', '분양'
    ],
    
    units: ['원', '만원', '십만원', '백만원', '천만원', '억', '평', '평수']
};

// ========================================
// 감정/분위기 키워드 데이터베이스 (4~6번 분석용)
// ========================================
const EmotionKeywordDB = {
    // 긍정 감정
    positive: [
        '기쁘', '행복', '즐거', '웃', '미소', '좋', '사랑', '감사', '고마',
        '희망', '설레', '신나', '뿌듯', '자랑', '축하', '환호', '감동',
        '따뜻', '포근', '평화', '안심', '편안', '든든', '기대'
    ],
    
    // 부정 감정
    negative: [
        '슬프', '울', '눈물', '아프', '고통', '괴로', '힘들', '지치',
        '화나', '분노', '짜증', '답답', '억울', '서운', '실망', '후회',
        '무섭', '두려', '불안', '걱정', '초조', '긴장', '당황', '충격',
        '외로', '쓸쓸', '허전', '공허', '우울', '절망', '좌절'
    ],
    
    // 갈등/긴장
    conflict: [
        '싸우', '다투', '갈등', '대립', '반대', '거부', '거절', '비난',
        '문제', '위기', '사건', '사고', '비밀', '거짓', '속이', '배신',
        '오해', '의심', '질투', '시기', '경쟁', '복수', '증오', '원망'
    ],
    
    // 반전/변화
    turning: [
        '갑자기', '느닷없이', '뜻밖에', '예상치', '생각지도', '믿을 수 없',
        '알고 보니', '사실은', '진실', '밝혀지', '드러나', '발각',
        '변하', '바뀌', '달라지', '깨닫', '알게 되', '이해하게',
        '결국', '마침내', '드디어', '끝내', '결심', '결정'
    ],
    
    // 시니어 공감 키워드
    seniorThemes: [
        '옛날', '그때', '그 시절', '젊었을 때', '어렸을 때', '예전',
        '추억', '기억', '회상', '그리움', '향수', '고향',
        '자식', '손자', '손녀', '며느리', '사위', '효도',
        '노후', '은퇴', '건강', '병원', '약', '치료',
        '전쟁', '피난', '가난', '고생', '성공', '자수성가',
        '인생', '세월', '나이', '늙', '젊', '청춘'
    ]
};

// ========================================
// 씬/시간 키워드 (4번 분석용)
// ========================================
const SceneKeywordDB = {
    sceneMarkers: ['씬', 'S#', 'Scene', '#', '장면'],
    timeMarkers: ['낮', '밤', '아침', '저녁', '새벽', '오전', '오후', '한낮', '자정', '해질녘', '동틀녘'],
    timeFlow: ['다음 날', '며칠 후', '일주일 후', '한 달 후', '몇 년 후', '그날', '그때', '이후', '나중에', '잠시 후', '얼마 후'],
    placeTransition: ['한편', '그 시각', '같은 시간', '다른 곳에서는', '그곳에서', '이곳에서']
};

// ========================================
// 인물 정보 추출 패턴
// ========================================
const CharacterPatterns = {
    introduction: [
        /([가-힣]{2,4})\s*\(\s*(\d{1,3})세[,\s]*([^)]*)\)/g,
        /([가-힣]{2,4})\s*\(\s*(\d{1,2})대[^)]*\)/g,
    ],
    dialogue: /^([가-힣]{2,4})\s*[:：]\s*/gm,
    age: /(\d{1,3})세|(\d{1,2})대(\s*(초반|중반|후반))?/g,
    relationships: [
        '아들', '딸', '엄마', '아빠', '아버지', '어머니', '할머니', '할아버지',
        '형', '누나', '오빠', '언니', '동생', '남동생', '여동생',
        '삼촌', '이모', '고모', '외삼촌', '조카',
        '며느리', '사위', '시어머니', '시아버지', '장인', '장모',
        '처남', '처제', '매형', '매제', '형부', '제부', '올케', '시누이', '시동생',
        '손자', '손녀', '외손자', '외손녀',
        '남편', '아내', '부인', '남자친구', '여자친구', '애인',
        '친구', '선배', '후배', '동료', '상사', '동창', '소꿉친구'
    ]
};

// ========================================
// 검수 클래스
// ========================================
class KoreaSeniorReviewer {
    constructor(script) {
        this.script = script;
        this.scenes = [];
        this.characters = {};
        this.dialogues = [];
        this.stats = {};
        
        this.results = {
            koreaBackground: { pass: false, score: 0, details: [], found: [] },
            characterConsistency: { pass: false, score: 0, details: [], characters: {} },
            relationshipConsistency: { pass: false, score: 0, details: [], relationships: [] },
            storyFlow: { pass: false, score: 0, details: [], metrics: {} },
            pacingSpeed: { pass: false, score: 0, details: [], metrics: {} },
            entertainment: { pass: false, score: 0, details: [], metrics: {} }
        };
        
        // 기본 분석 실행
        this.parseScenes();
        this.parseDialogues();
        this.calculateStats();
    }
    
    // ========================================
    // 씬 파싱
    // ========================================
    parseScenes() {
        const scenePattern = /\[([^\]]+)\]|\[씬\s*\d+[^\]]*\]|S#\d+[^\n]*/gi;
        const lines = this.script.split('\n');
        let currentScene = null;
        let sceneContent = [];
        let sceneIndex = 0;
        
        lines.forEach((line, index) => {
            const sceneMatch = line.match(/^\s*\[([^\]]+)\]|^\s*S#\d+/i);
            
            if (sceneMatch) {
                if (currentScene) {
                    currentScene.content = sceneContent.join('\n');
                    currentScene.lineCount = sceneContent.length;
                    this.scenes.push(currentScene);
                }
                
                sceneIndex++;
                currentScene = {
                    index: sceneIndex,
                    header: line.trim(),
                    startLine: index,
                    content: '',
                    lineCount: 0,
                    hasTime: SceneKeywordDB.timeMarkers.some(t => line.includes(t)),
                    hasPlace: true // 씬 헤더가 있으면 장소 있다고 가정
                };
                sceneContent = [];
            } else if (currentScene) {
                sceneContent.push(line);
            }
        });
        
        // 마지막 씬 저장
        if (currentScene) {
            currentScene.content = sceneContent.join('\n');
            currentScene.lineCount = sceneContent.length;
            this.scenes.push(currentScene);
        }
        
        // 씬이 없으면 전체를 하나의 씬으로 처리
        if (this.scenes.length === 0) {
            this.scenes.push({
                index: 1,
                header: '[전체]',
                startLine: 0,
                content: this.script,
                lineCount: lines.length,
                hasTime: false,
                hasPlace: false
            });
        }
    }
    
    // ========================================
    // 대사 파싱
    // ========================================
    parseDialogues() {
        const dialoguePattern = /^([가-힣]{2,4})\s*[:：]\s*(.+)/gm;
        let match;
        
        while ((match = dialoguePattern.exec(this.script)) !== null) {
            const speaker = match[1];
            const content = match[2].trim();
            
            // 나레이션 등 제외
            if (['나레이션', '내레이션', '해설', 'NA', '자막'].includes(speaker)) continue;
            
            this.dialogues.push({
                speaker,
                content,
                length: content.length,
                position: match.index
            });
        }
    }
    
    // ========================================
    // 기본 통계 계산
    // ========================================
    calculateStats() {
        const totalLength = this.script.length;
        const dialogueLength = this.dialogues.reduce((sum, d) => sum + d.content.length, 0);
        
        this.stats = {
            totalCharacters: totalLength,
            totalLines: this.script.split('\n').length,
            sceneCount: this.scenes.length,
            dialogueCount: this.dialogues.length,
            dialogueRatio: totalLength > 0 ? Math.round((dialogueLength / totalLength) * 100) : 0,
            avgSceneLength: this.scenes.length > 0 ? Math.round(totalLength / this.scenes.length) : 0,
            estimatedRuntime: Math.round(totalLength / 400) // 대략 분당 400자
        };
    }
    
    // ========================================
    // 1. 한국 배경 확인
    // ========================================
    checkKoreaBackground() {
        const found = { regions: [], cities: [], places: [], culture: [], units: [] };
        const script = this.script;
        
        KoreaKeywordDB.regions.forEach(k => { if (script.includes(k)) found.regions.push(k); });
        KoreaKeywordDB.cities.forEach(k => { if (script.includes(k)) found.cities.push(k); });
        KoreaKeywordDB.places.forEach(k => { if (script.includes(k)) found.places.push(k); });
        KoreaKeywordDB.culture.forEach(k => { if (script.includes(k)) found.culture.push(k); });
        
        const totalFound = found.regions.length + found.cities.length + found.places.length + found.culture.length;
        const pass = totalFound >= 3;
        const score = Math.min(100, totalFound * 10);
        
        const details = [];
        if (found.regions.length > 0) details.push({ type: 'success', message: `지역: ${found.regions.join(', ')}` });
        if (found.cities.length > 0) details.push({ type: 'success', message: `도시: ${found.cities.slice(0, 5).join(', ')}${found.cities.length > 5 ? ' 외' : ''}` });
        if (found.places.length > 0) details.push({ type: 'success', message: `장소: ${[...new Set(found.places)].slice(0, 5).join(', ')}${found.places.length > 5 ? ' 외' : ''}` });
        if (found.culture.length > 0) details.push({ type: 'success', message: `문화: ${[...new Set(found.culture)].slice(0, 5).join(', ')}${found.culture.length > 5 ? ' 외' : ''}` });
        
        if (totalFound === 0) {
            details.push({ type: 'error', message: '한국 배경 키워드를 찾을 수 없습니다.' });
        } else if (totalFound < 3) {
            details.push({ type: 'warning', message: `한국 배경 요소 부족 (${totalFound}개, 권장: 3개+)` });
        } else {
            details.push({ type: 'success', message: `✅ 총 ${totalFound}개 한국 요소 확인` });
        }
        
        this.results.koreaBackground = { pass, score, details, found, totalFound };
        return this.results.koreaBackground;
    }
    
    // ========================================
    // 2. 인물 설정 일관성
    // ========================================
    checkCharacterConsistency() {
        const characters = {};
        const inconsistencies = [];
        const details = [];
        
        // 패턴 1: 이름(나이세, 특성)
        const pattern1 = /([가-힣]{2,4})\s*\(\s*(\d{1,3})세[,\s]*([^)]*)\)/g;
        let match;
        
        while ((match = pattern1.exec(this.script)) !== null) {
            const name = match[1];
            const age = parseInt(match[2]);
            const trait = match[3].trim();
            
            if (!characters[name]) {
                characters[name] = { name, ages: [age], traits: trait ? [trait] : [], firstMention: match.index };
            } else {
                if (!characters[name].ages.includes(age)) characters[name].ages.push(age);
                if (trait && !characters[name].traits.includes(trait)) characters[name].traits.push(trait);
            }
        }
        
        // 패턴 2: 이름(나이대)
        const pattern2 = /([가-힣]{2,4})\s*\(\s*(\d{1,2})대\s*(초반|중반|후반)?\s*\)/g;
        while ((match = pattern2.exec(this.script)) !== null) {
            const name = match[1];
            const decade = match[2] + '대' + (match[3] || '');
            
            if (!characters[name]) {
                characters[name] = { name, ages: [decade], traits: [], firstMention: match.index };
            } else {
                if (!characters[name].ages.includes(decade)) characters[name].ages.push(decade);
            }
        }
        
        // 대사에서 이름 추출
        const dialoguePattern = /^([가-힣]{2,4})\s*[:：]/gm;
        while ((match = dialoguePattern.exec(this.script)) !== null) {
            const name = match[1];
            if (['나레이션', '내레이션', '해설', 'NA', '자막'].includes(name)) continue;
            if (!characters[name]) {
                characters[name] = { name, ages: [], traits: [], firstMention: match.index, dialogueOnly: true };
            }
        }
        
        // 일관성 검사
        let pass = true;
        Object.values(characters).forEach(char => {
            const numericAges = char.ages.filter(a => typeof a === 'number');
            if (numericAges.length > 1) {
                const uniqueAges = [...new Set(numericAges)];
                if (uniqueAges.length > 1) {
                    pass = false;
                    inconsistencies.push({ character: char.name, type: 'age', values: uniqueAges });
                    details.push({ type: 'error', message: `⚠️ '${char.name}' 나이 불일치: ${uniqueAges.join('세 → ')}세` });
                }
            }
        });
        
        const characterCount = Object.keys(characters).length;
        if (characterCount > 0) {
            details.unshift({ type: 'info', message: `총 ${characterCount}명 감지` });
        }
        
        Object.values(characters).slice(0, 5).forEach(char => {
            let info = char.name;
            if (char.ages.length > 0) info += ` (${char.ages[0]}${typeof char.ages[0] === 'number' ? '세' : ''})`;
            details.push({ type: 'info', message: `👤 ${info}` });
        });
        
        if (characterCount > 5) {
            details.push({ type: 'info', message: `... 외 ${characterCount - 5}명` });
        }
        
        if (pass && characterCount > 0) {
            details.push({ type: 'success', message: '✅ 인물 설정 일관성 확인' });
        }
        
        this.characters = characters;
        this.results.characterConsistency = {
            pass: pass && characterCount > 0,
            score: pass ? 100 : 0,
            details,
            characters,
            inconsistencies
        };
        
        return this.results.characterConsistency;
    }
    
    // ========================================
    // 3. 인물 관계 일관성
    // ========================================
    checkRelationshipConsistency() {
        const relationships = [];
        const details = [];
        
        const relationshipKeywords = CharacterPatterns.relationships.join('|');
        const pattern = new RegExp(`([가-힣]{2,4})\\s*\\(\\s*(${relationshipKeywords})[^)]*\\)`, 'g');
        
        let match;
        while ((match = pattern.exec(this.script)) !== null) {
            relationships.push({ name: match[1], relation: match[2], position: match.index });
        }
        
        const relationMap = {};
        let pass = true;
        
        relationships.forEach(rel => {
            if (!relationMap[rel.name]) {
                relationMap[rel.name] = [rel.relation];
            } else if (!relationMap[rel.name].includes(rel.relation)) {
                pass = false;
                relationMap[rel.name].push(rel.relation);
            }
        });
        
        Object.entries(relationMap).forEach(([name, relations]) => {
            if (relations.length > 1) {
                details.push({ type: 'error', message: `⚠️ '${name}' 관계 불일치: ${relations.join(' → ')}` });
            }
        });
        
        if (relationships.length > 0) {
            details.unshift({ type: 'info', message: `총 ${relationships.length}개 관계 정보` });
            const uniqueRelations = [...new Set(relationships.map(r => `${r.name}(${r.relation})`))];
            uniqueRelations.slice(0, 5).forEach(rel => {
                details.push({ type: 'info', message: `👥 ${rel}` });
            });
            if (uniqueRelations.length > 5) {
                details.push({ type: 'info', message: `... 외 ${uniqueRelations.length - 5}개` });
            }
        } else {
            details.push({ type: 'warning', message: '관계 정보 없음 (이름(관계) 형식 사용 권장)' });
        }
        
        if (pass && relationships.length > 0) {
            details.push({ type: 'success', message: '✅ 인물 관계 일관성 확인' });
        }
        
        this.results.relationshipConsistency = {
            pass: pass && relationships.length > 0,
            score: pass ? 100 : 0,
            details,
            relationships,
            relationMap
        };
        
        return this.results.relationshipConsistency;
    }
    
    // ========================================
    // 4. 이야기 흐름 분석 (자동)
    // ========================================
    checkStoryFlow() {
        const details = [];
        const metrics = {
            hasIntro: false,
            sceneTransitions: 0,
            timeConsistency: true,
            placeClarity: true,
            causalLinks: 0
        };
        
        let score = 0;
        let issues = [];
        
        // 1. 도입부 확인 (첫 씬 또는 첫 500자)
        const intro = this.script.substring(0, Math.min(500, this.script.length));
        const hasTimeIntro = SceneKeywordDB.timeMarkers.some(t => intro.includes(t));
        const hasPlaceIntro = [...KoreaKeywordDB.places, ...KoreaKeywordDB.cities].some(p => intro.includes(p));
        metrics.hasIntro = hasTimeIntro || hasPlaceIntro || this.scenes.length > 0;
        
        if (metrics.hasIntro) {
            score += 20;
            details.push({ type: 'success', message: '✓ 도입부 상황 설정 있음' });
        } else {
            issues.push('도입부에 시간/장소 설정 부족');
            details.push({ type: 'warning', message: '△ 도입부 상황 설정 보강 필요' });
        }
        
        // 2. 씬 전환 자연스러움
        metrics.sceneTransitions = this.scenes.length - 1;
        const transitionWords = SceneKeywordDB.timeFlow.concat(SceneKeywordDB.placeTransition);
        let transitionCount = 0;
        transitionWords.forEach(word => {
            const matches = this.script.match(new RegExp(word, 'g'));
            if (matches) transitionCount += matches.length;
        });
        
        if (this.scenes.length <= 1) {
            score += 20;
            details.push({ type: 'info', message: '○ 단일 씬 구조' });
        } else if (transitionCount >= this.scenes.length - 1) {
            score += 20;
            details.push({ type: 'success', message: `✓ 씬 전환 표현 충분 (${transitionCount}개)` });
        } else {
            score += 10;
            details.push({ type: 'warning', message: `△ 씬 전환 표현 부족 (${transitionCount}개/${this.scenes.length - 1}씬)` });
        }
        
        // 3. 시간 흐름 논리성
        const timeMarkerCount = SceneKeywordDB.timeMarkers.reduce((count, marker) => {
            const matches = this.script.match(new RegExp(marker, 'g'));
            return count + (matches ? matches.length : 0);
        }, 0);
        
        if (timeMarkerCount >= this.scenes.length) {
            score += 20;
            details.push({ type: 'success', message: `✓ 시간 표현 충분 (${timeMarkerCount}개)` });
        } else if (timeMarkerCount > 0) {
            score += 15;
            details.push({ type: 'info', message: `○ 시간 표현 있음 (${timeMarkerCount}개)` });
        } else {
            score += 5;
            details.push({ type: 'warning', message: '△ 시간 표현 추가 권장' });
        }
        
        // 4. 장소 명확성
        const placeCount = [...KoreaKeywordDB.places, ...KoreaKeywordDB.cities].reduce((count, place) => {
            return count + (this.script.includes(place) ? 1 : 0);
        }, 0);
        
        if (placeCount >= 2) {
            score += 20;
            details.push({ type: 'success', message: `✓ 장소 설정 명확 (${placeCount}개)` });
        } else if (placeCount > 0) {
            score += 15;
            details.push({ type: 'info', message: `○ 장소 설정 있음 (${placeCount}개)` });
        } else {
            score += 5;
            details.push({ type: 'warning', message: '△ 장소 설정 추가 권장' });
        }
        
        // 5. 인과관계 (연결어 확인)
        const causalWords = ['그래서', '따라서', '때문에', '덕분에', '결국', '그러나', '하지만', '그런데'];
        metrics.causalLinks = causalWords.reduce((count, word) => {
            const matches = this.script.match(new RegExp(word, 'g'));
            return count + (matches ? matches.length : 0);
        }, 0);
        
        if (metrics.causalLinks >= 3) {
            score += 20;
            details.push({ type: 'success', message: `✓ 인과관계 표현 충분 (${metrics.causalLinks}개)` });
        } else if (metrics.causalLinks > 0) {
            score += 15;
            details.push({ type: 'info', message: `○ 인과관계 표현 있음 (${metrics.causalLinks}개)` });
        } else {
            score += 10;
            details.push({ type: 'warning', message: '△ 인과관계 연결어 추가 권장' });
        }
        
        const pass = score >= 70;
        if (pass) {
            details.push({ type: 'success', message: `✅ 이야기 흐름 양호 (${score}점)` });
        } else {
            details.push({ type: 'warning', message: `⚠️ 이야기 흐름 개선 필요 (${score}점)` });
        }
        
        this.results.storyFlow = { pass, score, details, metrics };
        return this.results.storyFlow;
    }
    
    // ========================================
    // 5. 반전/변화 속도 분석 (자동)
    // ========================================
    checkPacingSpeed() {
        const details = [];
        const metrics = {
            emotionChanges: [],
            turningPoints: 0,
            tensionRhythm: 'unknown',
            buildupQuality: 'unknown',
            endingPace: 'unknown'
        };
        
        let score = 0;
        const scriptLength = this.script.length;
        
        // 씬별 감정 분석
        const analyzeEmotions = (text) => {
            let positive = 0, negative = 0, conflict = 0;
            EmotionKeywordDB.positive.forEach(k => { if (text.includes(k)) positive++; });
            EmotionKeywordDB.negative.forEach(k => { if (text.includes(k)) negative++; });
            EmotionKeywordDB.conflict.forEach(k => { if (text.includes(k)) conflict++; });
            return { positive, negative, conflict, total: positive + negative + conflict };
        };
        
        // 1. 감정 변화 급격성 체크
        let prevEmotion = null;
        let abruptChanges = 0;
        
        this.scenes.forEach((scene, index) => {
            const emotion = analyzeEmotions(scene.content);
            metrics.emotionChanges.push({ scene: index + 1, ...emotion });
            
            if (prevEmotion) {
                const diff = Math.abs(emotion.positive - prevEmotion.positive) + 
                            Math.abs(emotion.negative - prevEmotion.negative);
                if (diff > 5) abruptChanges++;
            }
            prevEmotion = emotion;
        });
        
        if (abruptChanges === 0) {
            score += 20;
            details.push({ type: 'success', message: '✓ 감정 변화 자연스러움' });
        } else if (abruptChanges <= 2) {
            score += 15;
            details.push({ type: 'info', message: `○ 감정 변화 약간 급함 (${abruptChanges}회)` });
        } else {
            score += 10;
            details.push({ type: 'warning', message: `△ 감정 변화 급격함 (${abruptChanges}회)` });
        }
        
        // 2. 반전 전 복선 확인
        metrics.turningPoints = EmotionKeywordDB.turning.reduce((count, word) => {
            const matches = this.script.match(new RegExp(word, 'g'));
            return count + (matches ? matches.length : 0);
        }, 0);
        
        const foreshadowWords = ['사실', '비밀', '몰랐', '알고 보니', '나중에', '언젠가'];
        const foreshadowCount = foreshadowWords.reduce((count, word) => {
            const matches = this.script.match(new RegExp(word, 'g'));
            return count + (matches ? matches.length : 0);
        }, 0);
        
        if (foreshadowCount >= 2 || metrics.turningPoints >= 2) {
            score += 20;
            details.push({ type: 'success', message: `✓ 복선/반전 요소 충분 (${foreshadowCount + metrics.turningPoints}개)` });
        } else if (foreshadowCount > 0 || metrics.turningPoints > 0) {
            score += 15;
            details.push({ type: 'info', message: `○ 복선/반전 요소 있음` });
        } else {
            score += 10;
            details.push({ type: 'warning', message: '△ 복선/반전 요소 추가 권장' });
        }
        
        // 3. 긴장-이완 리듬
        const totalEmotions = metrics.emotionChanges.reduce((sum, e) => sum + e.total, 0);
        const avgEmotionPerScene = this.scenes.length > 0 ? totalEmotions / this.scenes.length : 0;
        
        if (avgEmotionPerScene >= 2 && avgEmotionPerScene <= 8) {
            score += 20;
            metrics.tensionRhythm = 'good';
            details.push({ type: 'success', message: '✓ 긴장-이완 리듬 적절' });
        } else if (avgEmotionPerScene > 0) {
            score += 15;
            metrics.tensionRhythm = 'moderate';
            details.push({ type: 'info', message: '○ 긴장-이완 리듬 보통' });
        } else {
            score += 10;
            metrics.tensionRhythm = 'weak';
            details.push({ type: 'warning', message: '△ 감정 표현 추가 권장' });
        }
        
        // 4. 클라이맥스 빌드업 (후반부 감정 밀도)
        if (this.scenes.length >= 3) {
            const lastThird = metrics.emotionChanges.slice(-Math.ceil(this.scenes.length / 3));
            const firstThird = metrics.emotionChanges.slice(0, Math.ceil(this.scenes.length / 3));
            
            const lastAvg = lastThird.reduce((sum, e) => sum + e.total, 0) / lastThird.length;
            const firstAvg = firstThird.reduce((sum, e) => sum + e.total, 0) / firstThird.length;
            
            if (lastAvg >= firstAvg) {
                score += 20;
                metrics.buildupQuality = 'good';
                details.push({ type: 'success', message: '✓ 클라이맥스 빌드업 적절' });
            } else {
                score += 15;
                metrics.buildupQuality = 'moderate';
                details.push({ type: 'info', message: '○ 후반부 긴장감 유지 권장' });
            }
        } else {
            score += 15;
            details.push({ type: 'info', message: '○ 씬 수 적어 빌드업 분석 제한' });
        }
        
        // 5. 결말 속도 (마지막 10%가 너무 짧지 않은지)
        const lastPart = this.script.substring(Math.floor(scriptLength * 0.9));
        const lastPartHasEmotion = analyzeEmotions(lastPart).total > 0;
        
        if (lastPart.length >= 200 && lastPartHasEmotion) {
            score += 20;
            metrics.endingPace = 'good';
            details.push({ type: 'success', message: '✓ 결말 페이싱 적절' });
        } else if (lastPart.length >= 100) {
            score += 15;
            metrics.endingPace = 'moderate';
            details.push({ type: 'info', message: '○ 결말 조금 더 여유있게 권장' });
        } else {
            score += 10;
            metrics.endingPace = 'rushed';
            details.push({ type: 'warning', message: '△ 결말이 급함, 확장 권장' });
        }
        
        const pass = score >= 70;
        if (pass) {
            details.push({ type: 'success', message: `✅ 페이싱 양호 (${score}점)` });
        } else {
            details.push({ type: 'warning', message: `⚠️ 페이싱 개선 필요 (${score}점)` });
        }
        
        this.results.pacingSpeed = { pass, score, details, metrics };
        return this.results.pacingSpeed;
    }
    
    // ========================================
    // 6. 재미/몰입 요소 분석 (자동)
    // ========================================
    checkEntertainment() {
        const details = [];
        const metrics = {
            curiosityElements: 0,
            relatableElements: 0,
            unexpectedElements: 0,
            emotionalScenes: 0,
            memorableLines: 0,
            seniorRelevance: 0
        };
        
        let score = 0;
        
        // 1. 호기심 유발 요소
        const curiosityWords = ['비밀', '수수께끼', '미스터리', '왜', '어떻게', '무슨 일', '도대체', '궁금'];
        metrics.curiosityElements = curiosityWords.reduce((count, word) => {
            const matches = this.script.match(new RegExp(word, 'g'));
            return count + (matches ? matches.length : 0);
        }, 0);
        
        if (metrics.curiosityElements >= 3) {
            score += 17;
            details.push({ type: 'success', message: `✓ 호기심 유발 요소 충분 (${metrics.curiosityElements}개)` });
        } else if (metrics.curiosityElements > 0) {
            score += 12;
            details.push({ type: 'info', message: `○ 호기심 유발 요소 있음 (${metrics.curiosityElements}개)` });
        } else {
            score += 5;
            details.push({ type: 'warning', message: '△ 호기심 유발 요소 추가 권장' });
        }
        
        // 2. 공감 가능한 캐릭터/상황
        const relatableWords = ['누구나', '우리', '모두', '같은', '마찬가지', '역시', '당연', '공감'];
        const familyWords = ['가족', '부모', '자식', '형제', '친구'];
        metrics.relatableElements = [...relatableWords, ...familyWords].reduce((count, word) => {
            const matches = this.script.match(new RegExp(word, 'g'));
            return count + (matches ? matches.length : 0);
        }, 0);
        
        const characterCount = Object.keys(this.characters).length;
        if (metrics.relatableElements >= 3 || characterCount >= 3) {
            score += 17;
            details.push({ type: 'success', message: '✓ 공감 요소 충분' });
        } else if (metrics.relatableElements > 0 || characterCount > 0) {
            score += 12;
            details.push({ type: 'info', message: '○ 공감 요소 있음' });
        } else {
            score += 5;
            details.push({ type: 'warning', message: '△ 공감 요소 추가 권장' });
        }
        
        // 3. 예상치 못한 전개
        metrics.unexpectedElements = EmotionKeywordDB.turning.reduce((count, word) => {
            const matches = this.script.match(new RegExp(word, 'g'));
            return count + (matches ? matches.length : 0);
        }, 0);
        
        if (metrics.unexpectedElements >= 3) {
            score += 17;
            details.push({ type: 'success', message: `✓ 반전/전개 요소 충분 (${metrics.unexpectedElements}개)` });
        } else if (metrics.unexpectedElements > 0) {
            score += 12;
            details.push({ type: 'info', message: `○ 반전/전개 요소 있음 (${metrics.unexpectedElements}개)` });
        } else {
            score += 5;
            details.push({ type: 'warning', message: '△ 반전 요소 추가 권장' });
        }
        
        // 4. 감정 몰입 장면
        const emotionalCount = [...EmotionKeywordDB.positive, ...EmotionKeywordDB.negative].reduce((count, word) => {
            const matches = this.script.match(new RegExp(word, 'g'));
            return count + (matches ? matches.length : 0);
        }, 0);
        metrics.emotionalScenes = emotionalCount;
        
        if (emotionalCount >= 10) {
            score += 17;
            details.push({ type: 'success', message: `✓ 감정 표현 풍부 (${emotionalCount}개)` });
        } else if (emotionalCount >= 5) {
            score += 12;
            details.push({ type: 'info', message: `○ 감정 표현 있음 (${emotionalCount}개)` });
        } else {
            score += 5;
            details.push({ type: 'warning', message: '△ 감정 표현 추가 권장' });
        }
        
        // 5. 기억에 남을 명대사 (긴 대사, 반복, 강조)
        const longDialogues = this.dialogues.filter(d => d.content.length >= 50);
        const exclamations = (this.script.match(/[!？]/g) || []).length;
        metrics.memorableLines = longDialogues.length + Math.floor(exclamations / 3);
        
        if (metrics.memorableLines >= 5) {
            score += 16;
            details.push({ type: 'success', message: `✓ 명대사 요소 충분` });
        } else if (metrics.memorableLines > 0) {
            score += 11;
            details.push({ type: 'info', message: '○ 명대사 요소 있음' });
        } else {
            score += 5;
            details.push({ type: 'warning', message: '△ 인상적인 대사 추가 권장' });
        }
        
        // 6. 시니어 타겟 공감 소재
        metrics.seniorRelevance = EmotionKeywordDB.seniorThemes.reduce((count, word) => {
            const matches = this.script.match(new RegExp(word, 'g'));
            return count + (matches ? matches.length : 0);
        }, 0);
        
        if (metrics.seniorRelevance >= 5) {
            score += 16;
            details.push({ type: 'success', message: `✓ 시니어 공감 소재 충분 (${metrics.seniorRelevance}개)` });
        } else if (metrics.seniorRelevance > 0) {
            score += 11;
            details.push({ type: 'info', message: `○ 시니어 공감 소재 있음 (${metrics.seniorRelevance}개)` });
        } else {
            score += 3;
            details.push({ type: 'warning', message: '△ 시니어 공감 소재 추가 강력 권장' });
        }
        
        const pass = score >= 70;
        if (pass) {
            details.push({ type: 'success', message: `✅ 재미/몰입 요소 양호 (${score}점)` });
        } else {
            details.push({ type: 'warning', message: `⚠️ 재미/몰입 요소 보강 필요 (${score}점)` });
        }
        
        this.results.entertainment = { pass, score, details, metrics };
        return this.results.entertainment;
    }
    
    // ========================================
    // 전체 검수 실행
    // ========================================
    runFullReview() {
        this.checkKoreaBackground();
        this.checkCharacterConsistency();
        this.checkRelationshipConsistency();
        this.checkStoryFlow();
        this.checkPacingSpeed();
        this.checkEntertainment();
        
        return this.results;
    }
    
    // ========================================
    // 종합 점수 계산
    // ========================================
    calculateOverallScore() {
        const scores = [
            this.results.koreaBackground.score,
            this.results.characterConsistency.score,
            this.results.relationshipConsistency.score,
            this.results.storyFlow.score,
            this.results.pacingSpeed.score,
            this.results.entertainment.score
        ];
        
        const passCount = [
            this.results.koreaBackground.pass,
            this.results.characterConsistency.pass,
            this.results.relationshipConsistency.pass,
            this.results.storyFlow.pass,
            this.results.pacingSpeed.pass,
            this.results.entertainment.pass
        ].filter(p => p).length;
        
        const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        
        return {
            totalScore: avgScore,
            passCount,
            totalCount: 6,
            sceneCount: this.stats.sceneCount,
            characterCount: Object.keys(this.characters).length,
            keywordCount: this.results.koreaBackground.totalFound || 0,
            dialogueRatio: this.stats.dialogueRatio,
            estimatedRuntime: this.stats.estimatedRuntime,
            allPass: passCount === 6
        };
    }
}

// ========================================
// 전역 노출
// ========================================
window.KoreaSeniorReviewer = KoreaSeniorReviewer;
window.KoreaKeywordDB = KoreaKeywordDB;
window.EmotionKeywordDB = EmotionKeywordDB;
