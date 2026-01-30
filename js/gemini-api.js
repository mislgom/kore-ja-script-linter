/**
 * Gemini API 연동 모듈
 * Google Gemini 2.5 Flash API 통합
 * 
 * [STEP 2 최종 보완]
 * - 모든 API 호출은 forceGeminiAnalyze() 단일 함수에서만 수행
 * - API 키는 localStorage("GEMINI_API_KEY")에서만 읽음
 * - 엔드포인트/모델 고정: v1/models/gemini-2.5-flash:generateContent
 * - 금지 문자열 완전 제거: v1beta, preview-, gemini-pro, 하드코딩 키
 * - testConnection() 호출부 0건 (자동 호출 금지)
 * - AIza 형식 검증 제거 (빈 값만 차단)
 */

// ========================================
// Gemini API 설정 (고정값)
// ========================================
var GeminiConfig = {
    // 엔드포인트 고정 (v1 + gemini-2.5-flash)
    endpoint: 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent',
    maxTokens: 8192,
    temperature: 0.7
};

// ========================================
// Gemini API 클래스
// ========================================
function GeminiAPI() {
    this.endpoint = GeminiConfig.endpoint;
    this.isAvailable = false;
    this.lastError = null;
}

/**
 * API 키 가져오기 (localStorage에서만)
 * @returns {string|null} API 키 또는 null
 */
GeminiAPI.prototype.getApiKey = function() {
    return localStorage.getItem('GEMINI_API_KEY');
};

/**
 * API 키 존재 여부 확인 (빈 값만 체크, 형식 검증 없음)
 * @returns {boolean}
 */
GeminiAPI.prototype.hasApiKey = function() {
    var key = this.getApiKey();
    return !!(key && key.trim());
};

/**
 * API 연결 테스트
 * 
 * [주의] 이 함수는 내부적으로 forceGeminiAnalyze()를 호출함.
 * 자동 호출 금지 규칙에 따라 프로젝트 전역에서 이 함수를 호출하면 안 됨.
 * 수동 테스트/디버깅 목적으로만 유지.
 */
GeminiAPI.prototype.testConnection = async function() {
    if (!this.hasApiKey()) {
        this.isAvailable = false;
        return false;
    }
    
    try {
        var response = await this.forceGeminiAnalyze('테스트입니다. "연결 성공"이라고만 답해주세요.', {
            maxTokens: 100,
            temperature: 0.1
        });
        this.isAvailable = response && response.length > 0;
        return this.isAvailable;
    } catch (error) {
        this.isAvailable = false;
        this.lastError = error.message;
        console.error('Gemini API 연결 실패:', error);
        return false;
    }
};

/**
 * ============================================
 * 핵심 API 호출 함수 (단일 진입점)
 * 모든 Gemini API 호출은 이 함수에서만 수행
 * ============================================
 * @param {string} prompt - 프롬프트 텍스트
 * @param {object} options - 옵션 (temperature, maxTokens 등)
 * @returns {Promise<string|null>} 응답 텍스트 또는 null
 */
GeminiAPI.prototype.forceGeminiAnalyze = async function(prompt, options) {
    options = options || {};
    
    // 1) API 키 로드 (localStorage에서만)
    var apiKey = this.getApiKey();
    
    // 2) 키 없음/빈 값 체크 (형식 검증 없음)
    if (!apiKey || !apiKey.trim()) {
        var errorMsg = 'API 키가 설정되지 않았습니다. 우측 상단 🔑 버튼에서 설정해주세요.';
        console.warn('⚠️ Gemini API:', errorMsg);
        
        // 사용자 경고 (기존 showNotification 함수 사용)
        if (typeof window.showNotification === 'function') {
            window.showNotification(errorMsg, 'warning');
        } else {
            alert(errorMsg);
        }
        
        // 네트워크 요청 없이 즉시 반환
        return null;
    }
    
    // 3) 엔드포인트 구성 (고정 URL + API 키)
    var url = this.endpoint + '?key=' + apiKey;
    
    // 4) 요청 본문 구성
    var requestBody = {
        contents: [{
            parts: [{
                text: prompt
            }]
        }],
        generationConfig: {
            temperature: options.temperature !== undefined ? options.temperature : GeminiConfig.temperature,
            maxOutputTokens: options.maxTokens || GeminiConfig.maxTokens,
            topP: options.topP || 0.95,
            topK: options.topK || 40
        },
        safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ]
    };

    // 5) API 호출 (fetch)
    console.log('🚀 Gemini API 호출 시작...');
    console.log('📍 Endpoint:', this.endpoint);
    
    try {
        var response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        // 6) 응답 상태 확인
        if (!response.ok) {
            var errorData = await response.json().catch(function() { return {}; });
            var errorMessage = (errorData.error && errorData.error.message) 
                ? errorData.error.message 
                : 'API 오류: ' + response.status;
            
            console.error('❌ Gemini API 오류:', errorMessage);
            this.lastError = errorMessage;
            
            if (typeof window.showNotification === 'function') {
                window.showNotification('API 호출 실패: ' + errorMessage, 'error');
            }
            
            throw new Error(errorMessage);
        }

        // 7) 응답 파싱
        var data = await response.json();
        
        if (data.candidates && data.candidates[0] && 
            data.candidates[0].content && data.candidates[0].content.parts &&
            data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text) {
            
            var resultText = data.candidates[0].content.parts[0].text;
            console.log('✅ Gemini API 응답 수신 완료 (길이:', resultText.length, '자)');
            return resultText;
        }
        
        throw new Error('응답 형식이 올바르지 않습니다.');
        
    } catch (error) {
        this.lastError = error.message;
        console.error('❌ Gemini API 호출 실패:', error);
        throw error;
    }
};

/**
 * 대본 종합 분석 (forceGeminiAnalyze 위임)
 */
GeminiAPI.prototype.analyzeScript = async function(script, analysisType) {
    analysisType = analysisType || 'comprehensive';
    
    var prompts = {
        comprehensive: this.getComprehensivePrompt(script),
        characters: this.getCharacterPrompt(script),
        story: this.getStoryPrompt(script),
        entertainment: this.getEntertainmentPrompt(script)
    };

    var prompt = prompts[analysisType] || prompts.comprehensive;
    
    try {
        var response = await this.forceGeminiAnalyze(prompt, {
            temperature: 0.3,
            maxTokens: 4096
        });
        
        if (!response) {
            return { error: 'API 키가 설정되지 않았습니다.' };
        }
        
        return this.parseAnalysisResponse(response, analysisType);
    } catch (error) {
        console.error('대본 분석 오류:', error);
        return { error: error.message };
    }
};

/**
 * 빠른 분석 (forceGeminiAnalyze 위임)
 */
GeminiAPI.prototype.quickAnalyze = async function(script, item) {
    var prompts = {
        korea: '이 대본이 한국 배경인지 확인하고, 발견된 한국 지명/장소/문화 키워드를 나열해주세요. JSON 형식으로 {"isKorea": true/false, "keywords": [], "score": 0-100, "feedback": ""} 응답해주세요.\n\n대본:\n' + script.substring(0, 5000),
        
        characters: '이 대본의 등장인물 이름, 나이, 관계, 특성을 추출해주세요. JSON 형식으로 {"characters": [{"name": "", "age": "", "relation": "", "traits": []}]} 응답해주세요.\n\n대본:\n' + script.substring(0, 5000),
        
        flow: '이 대본의 이야기 흐름이 자연스러운지 평가해주세요. JSON 형식으로 {"score": 0-100, "feedback": "", "issues": []} 응답해주세요.\n\n대본:\n' + script.substring(0, 5000)
    };

    var prompt = prompts[item] || prompts.korea;
    
    try {
        var response = await this.forceGeminiAnalyze(prompt, {
            temperature: 0.2,
            maxTokens: 1024
        });
        
        if (!response) {
            return { error: 'API 키가 설정되지 않았습니다.' };
        }
        
        return this.parseAnalysisResponse(response, item);
    } catch (error) {
        return { error: error.message };
    }
};

/**
 * FLOW 후보 구간 분석 (forceGeminiAnalyze 위임)
 */
GeminiAPI.prototype.analyzeFlowCandidates = async function(candidateSegments, fullScript) {
    if (!candidateSegments || candidateSegments.length === 0) {
        return [];
    }

    var results = [];
    var self = this;

    for (var i = 0; i < candidateSegments.length; i++) {
        var candidate = candidateSegments[i];
        
        try {
            var segmentText = fullScript.substring(candidate.startIndex, candidate.endIndex);
            
            var prompt = '당신은 한국 시니어 낭독 콘텐츠 스토리 전문가입니다.\n' +
                '아래 대본 구간에서 전개/흐름 오류가 있는지 판정해주세요.\n\n' +
                '## 후보 유형\n' +
                (candidate.type === 'TIME_JUMP' ? '시간 점프 (급격한 시간 변화)' : 
                 candidate.type === 'EMOTION_SHIFT' ? '감정 급변 (긍정↔부정 혼재)' : 
                 candidate.type === 'LOCATION_CHANGE' ? '장소 급변' : '기타 전환') + '\n\n' +
                '## 대본 구간 (씬 ' + (candidate.sceneNum || '?') + ')\n' +
                segmentText.substring(0, 3000) + '\n\n' +
                '## 응답 형식 (반드시 JSON으로)\n' +
                '```json\n' +
                '{\n' +
                '    "isIssue": true/false,\n' +
                '    "issueType": "부자연전개/인과누락/연결부자연/급변화/없음",\n' +
                '    "severity": "HIGH/MED/LOW",\n' +
                '    "confidence": "HIGH/MID/LOW",\n' +
                '    "reason": "판정 근거 설명",\n' +
                '    "suggestion": "최소 수정 제안"\n' +
                '}\n' +
                '```';

            var response = await self.forceGeminiAnalyze(prompt, {
                temperature: 0.2,
                maxTokens: 1024
            });

            if (response) {
                var parsed = self.parseAnalysisResponse(response, 'flow');
                
                if (parsed && !parsed.error) {
                    var result = {};
                    for (var key in candidate) {
                        result[key] = candidate[key];
                    }
                    for (var key2 in parsed) {
                        result[key2] = parsed[key2];
                    }
                    result.analyzed = true;
                    results.push(result);
                }
            }

        } catch (error) {
            console.error('FLOW 후보 분석 오류:', error);
            var errorResult = {};
            for (var key3 in candidate) {
                errorResult[key3] = candidate[key3];
            }
            errorResult.isIssue = false;
            errorResult.error = error.message;
            errorResult.analyzed = false;
            results.push(errorResult);
        }
    }

    return results;
};

/**
 * FLOW 하이브리드 분석 (forceGeminiAnalyze 위임)
 */
GeminiAPI.prototype.analyzeFlowHybrid = async function(script, candidateExtractor) {
    var candidates = [];
    if (typeof candidateExtractor === 'function') {
        candidates = candidateExtractor(script);
    } else if (Array.isArray(candidateExtractor)) {
        candidates = candidateExtractor;
    }

    console.log('📊 FLOW 후보', candidates.length, '개 추출됨');

    if (candidates.length === 0) {
        return {
            issues: [],
            message: '규칙 기반 검사에서 FLOW 후보가 발견되지 않았습니다.'
        };
    }

    var analyzedCandidates = await this.analyzeFlowCandidates(candidates, script);
    
    var confirmedIssues = analyzedCandidates.filter(function(c) {
        return c.isIssue === true;
    });

    console.log('✅ FLOW 오류', confirmedIssues.length, '개 확정됨');

    return {
        candidates: candidates.length,
        analyzed: analyzedCandidates.length,
        issues: confirmedIssues,
        message: candidates.length + '개 후보 중 ' + confirmedIssues.length + '개 오류 확정'
    };
};

/**
 * 종합 분석 프롬프트
 */
GeminiAPI.prototype.getComprehensivePrompt = function(script) {
    return '당신은 한국 시니어 낭독 콘텐츠 전문 대본 검수자입니다.\n' +
        '아래 대본을 분석하고 JSON 형식으로 결과를 제공해주세요.\n\n' +
        '## 분석 기준\n' +
        '1. **한국 배경 확인**: 한국 지명, 문화, 장소가 적절히 사용되었는지\n' +
        '2. **등장인물 설정 일관성**: 이름, 나이, 특성이 처음부터 끝까지 일관되는지\n' +
        '3. **인물 관계 일관성**: 가족/사회 관계가 변하지 않는지\n' +
        '4. **이야기 흐름**: 자연스럽고 논리적인 전개인지\n' +
        '5. **반전/변화 속도**: 급격한 변화 없이 적절한 페이싱인지\n' +
        '6. **재미/몰입 요소**: 시니어 시청자가 공감하고 몰입할 수 있는지\n\n' +
        '## 대본\n' + script.substring(0, 15000) + '\n\n' +
        '## 응답 형식 (반드시 JSON으로)\n' +
        '```json\n' +
        '{\n' +
        '    "summary": "대본 전체 요약 (2-3문장)",\n' +
        '    "koreaBackground": { "score": 0-100, "pass": true/false, "feedback": "" },\n' +
        '    "characterConsistency": { "score": 0-100, "pass": true/false, "feedback": "" },\n' +
        '    "relationshipConsistency": { "score": 0-100, "pass": true/false, "feedback": "" },\n' +
        '    "storyFlow": { "score": 0-100, "pass": true/false, "feedback": "" },\n' +
        '    "pacingSpeed": { "score": 0-100, "pass": true/false, "feedback": "" },\n' +
        '    "entertainment": { "score": 0-100, "pass": true/false, "feedback": "" },\n' +
        '    "overallScore": 0-100,\n' +
        '    "verdict": "합격/조건부/재검토",\n' +
        '    "topIssues": ["개선점1", "개선점2", "개선점3"],\n' +
        '    "recommendations": ["추천사항1", "추천사항2"]\n' +
        '}\n' +
        '```';
};

/**
 * 캐릭터 분석 프롬프트
 */
GeminiAPI.prototype.getCharacterPrompt = function(script) {
    return '당신은 대본 전문 분석가입니다.\n' +
        '아래 대본에서 등장인물 정보를 추출하고 일관성을 분석해주세요.\n\n' +
        '## 대본\n' + script.substring(0, 15000) + '\n\n' +
        '## 응답 형식 (반드시 JSON으로)\n' +
        '```json\n' +
        '{"characters": [{"name": "", "age": "", "relation": "", "traits": [], "consistent": true}], "issues": [], "score": 0-100}\n' +
        '```';
};

/**
 * 스토리 분석 프롬프트
 */
GeminiAPI.prototype.getStoryPrompt = function(script) {
    return '당신은 시니어 낭독 콘텐츠 스토리 전문가입니다.\n' +
        '아래 대본의 스토리 구조와 흐름을 분석해주세요.\n\n' +
        '## 대본\n' + script.substring(0, 15000) + '\n\n' +
        '## 응답 형식 (반드시 JSON으로)\n' +
        '```json\n' +
        '{"structure": {}, "sceneTransitions": {"score": 0-100}, "pacing": {"score": 0-100}, "overallScore": 0-100}\n' +
        '```';
};

/**
 * 재미 요소 분석 프롬프트
 */
GeminiAPI.prototype.getEntertainmentPrompt = function(script) {
    return '당신은 시니어 콘텐츠 전문가입니다.\n' +
        '아래 대본의 재미 요소와 시청 몰입도를 분석해주세요.\n\n' +
        '## 대본\n' + script.substring(0, 15000) + '\n\n' +
        '## 응답 형식 (반드시 JSON으로)\n' +
        '```json\n' +
        '{"engagementElements": [], "seniorAppeal": {"score": 0-100}, "retention": {"score": 0-100}, "overallEntertainment": 0-100}\n' +
        '```';
};

/**
 * AI 응답 파싱
 */
GeminiAPI.prototype.parseAnalysisResponse = function(response, analysisType) {
    try {
        // JSON 블록 추출
        var jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
            return JSON.parse(jsonMatch[1]);
        }
        
        // JSON 블록이 없으면 전체 응답에서 JSON 찾기
        var jsonStart = response.indexOf('{');
        var jsonEnd = response.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
            return JSON.parse(response.substring(jsonStart, jsonEnd + 1));
        }
        
        // 파싱 실패 시 텍스트로 반환
        return {
            raw: response,
            parsed: false,
            error: 'JSON 파싱 실패'
        };
    } catch (error) {
        console.error('응답 파싱 오류:', error);
        return {
            raw: response,
            parsed: false,
            error: error.message
        };
    }
};

// ========================================
// 전역 인스턴스
// ========================================
var geminiAPI = new GeminiAPI();

// ========================================
// 전역 노출
// ========================================
window.GeminiAPI = GeminiAPI;
window.geminiAPI = geminiAPI;

// forceGeminiAnalyze를 전역에서 직접 호출 가능하도록 노출
window.forceGeminiAnalyze = function(prompt, options) {
    return geminiAPI.forceGeminiAnalyze(prompt, options);
};

console.log('✅ Gemini API 모듈 로드 완료 (v1/gemini-2.5-flash 고정)');
