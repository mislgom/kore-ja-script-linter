/**
 * Gemini API 연동 모듈
 * Google Gemini Flash 2.5 API 통합
 * 
 * 대본 심층 분석을 위한 AI 기능 제공
 */

// ========================================
// Gemini API 설정
// ========================================
const GeminiConfig = {
    apiKey: 'AIzaSyBBe3VO3f56aidIb-tYa-dhoVUbqEOkFoI',
    model: 'gemini-2.5-flash-preview-05-20',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
    maxTokens: 8192,
    temperature: 0.7
};

// ========================================
// Gemini API 클래스
// ========================================
class GeminiAPI {
    constructor(apiKey = GeminiConfig.apiKey) {
        this.apiKey = apiKey;
        this.model = GeminiConfig.model;
        this.baseUrl = GeminiConfig.baseUrl;
        this.isAvailable = true;
        this.lastError = null;
    }

    /**
     * API 연결 테스트
     */
    async testConnection() {
        try {
            const response = await this.generateContent('테스트입니다. "연결 성공"이라고만 답해주세요.');
            this.isAvailable = response && response.length > 0;
            return this.isAvailable;
        } catch (error) {
            this.isAvailable = false;
            this.lastError = error.message;
            console.error('Gemini API 연결 실패:', error);
            return false;
        }
    }

    /**
     * 콘텐츠 생성 (기본 API 호출)
     */
    async generateContent(prompt, options = {}) {
        const url = `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`;
        
        const requestBody = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: options.temperature || GeminiConfig.temperature,
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

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || `API 오류: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
                return data.candidates[0].content.parts[0].text;
            }
            
            throw new Error('응답 형식이 올바르지 않습니다.');
        } catch (error) {
            this.lastError = error.message;
            throw error;
        }
    }

    /**
     * 대본 종합 분석
     */
    async analyzeScript(script, analysisType = 'comprehensive') {
        const prompts = {
            comprehensive: this.getComprehensivePrompt(script),
            characters: this.getCharacterPrompt(script),
            story: this.getStoryPrompt(script),
            entertainment: this.getEntertainmentPrompt(script)
        };

        const prompt = prompts[analysisType] || prompts.comprehensive;
        
        try {
            const response = await this.generateContent(prompt, {
                temperature: 0.3, // 분석은 낮은 온도로
                maxTokens: 4096
            });
            
            return this.parseAnalysisResponse(response, analysisType);
        } catch (error) {
            console.error('대본 분석 오류:', error);
            throw error;
        }
    }

    /**
     * 종합 분석 프롬프트
     */
    getComprehensivePrompt(script) {
        return `당신은 한국 시니어 낭독 콘텐츠 전문 대본 검수자입니다.
아래 대본을 분석하고 JSON 형식으로 결과를 제공해주세요.

## 분석 기준
1. **한국 배경 확인**: 한국 지명, 문화, 장소가 적절히 사용되었는지
2. **등장인물 설정 일관성**: 이름, 나이, 특성이 처음부터 끝까지 일관되는지
3. **인물 관계 일관성**: 가족/사회 관계가 변하지 않는지
4. **이야기 흐름**: 자연스럽고 논리적인 전개인지
5. **반전/변화 속도**: 급격한 변화 없이 적절한 페이싱인지
6. **재미/몰입 요소**: 시니어 시청자가 공감하고 몰입할 수 있는지

## 대본
${script.substring(0, 15000)}

## 응답 형식 (반드시 JSON으로)
\`\`\`json
{
    "summary": "대본 전체 요약 (2-3문장)",
    "koreaBackground": {
        "score": 0-100,
        "pass": true/false,
        "feedback": "피드백 내용",
        "keywords": ["발견된 한국 키워드들"]
    },
    "characterConsistency": {
        "score": 0-100,
        "pass": true/false,
        "feedback": "피드백 내용",
        "characters": [
            {"name": "이름", "age": "나이", "traits": "특성", "consistent": true/false}
        ],
        "issues": ["발견된 문제점"]
    },
    "relationshipConsistency": {
        "score": 0-100,
        "pass": true/false,
        "feedback": "피드백 내용",
        "relationships": [
            {"from": "인물1", "to": "인물2", "relation": "관계", "consistent": true/false}
        ],
        "issues": ["발견된 문제점"]
    },
    "storyFlow": {
        "score": 0-100,
        "pass": true/false,
        "feedback": "피드백 내용",
        "strengths": ["강점"],
        "weaknesses": ["개선점"]
    },
    "pacingSpeed": {
        "score": 0-100,
        "pass": true/false,
        "feedback": "피드백 내용",
        "issues": ["페이싱 문제점"],
        "suggestions": ["개선 제안"]
    },
    "entertainment": {
        "score": 0-100,
        "pass": true/false,
        "feedback": "피드백 내용",
        "elements": ["발견된 재미 요소"],
        "suggestions": ["추가 제안"]
    },
    "overallScore": 0-100,
    "verdict": "합격/조건부/재검토",
    "topIssues": ["가장 중요한 개선점 3가지"],
    "recommendations": ["전문가 추천사항"]
}
\`\`\``;
    }

    /**
     * 캐릭터 분석 프롬프트
     */
    getCharacterPrompt(script) {
        return `당신은 대본 전문 분석가입니다.
아래 대본에서 등장인물 정보를 추출하고 일관성을 분석해주세요.

## 분석 항목
1. 모든 등장인물의 이름, 나이, 관계, 특성 추출
2. 대본 전체에서 인물 정보가 일관되게 유지되는지 확인
3. 인물 간 관계가 변하지 않는지 확인

## 대본
${script.substring(0, 15000)}

## 응답 형식 (반드시 JSON으로)
\`\`\`json
{
    "characters": [
        {
            "name": "이름",
            "age": "나이",
            "relation": "관계(엄마/아들 등)",
            "traits": ["특성 목록"],
            "firstAppearance": "첫 등장 위치 설명",
            "mentions": 3,
            "consistent": true,
            "inconsistencies": []
        }
    ],
    "relationships": [
        {
            "person1": "인물1",
            "person2": "인물2", 
            "relation": "관계",
            "consistent": true,
            "changes": []
        }
    ],
    "issues": ["발견된 문제점"],
    "score": 0-100
}
\`\`\``;
    }

    /**
     * 스토리 분석 프롬프트
     */
    getStoryPrompt(script) {
        return `당신은 시니어 낭독 콘텐츠 스토리 전문가입니다.
아래 대본의 스토리 구조와 흐름을 분석해주세요.

## 분석 항목
1. 이야기 흐름의 자연스러움
2. 씬 전환의 적절성
3. 반전/변화의 속도와 타이밍
4. 시니어 시청자를 위한 페이싱

## 대본
${script.substring(0, 15000)}

## 응답 형식 (반드시 JSON으로)
\`\`\`json
{
    "structure": {
        "introduction": "도입부 분석",
        "development": "전개부 분석",
        "climax": "절정 분석",
        "resolution": "결말 분석"
    },
    "sceneTransitions": {
        "score": 0-100,
        "feedback": "씬 전환 평가",
        "issues": []
    },
    "pacing": {
        "score": 0-100,
        "feedback": "페이싱 평가",
        "tooFast": [],
        "tooSlow": [],
        "suggestions": []
    },
    "emotionalArc": {
        "description": "감정선 설명",
        "peaks": ["감정 고조 지점"],
        "appropriateness": "시니어 적합성 평가"
    },
    "overallScore": 0-100,
    "verdict": "평가 결론"
}
\`\`\``;
    }

    /**
     * 재미 요소 분석 프롬프트
     */
    getEntertainmentPrompt(script) {
        return `당신은 시니어 콘텐츠 전문가입니다.
아래 대본의 재미 요소와 시청 몰입도를 분석해주세요.

## 분석 항목
1. 시니어 시청자가 공감할 수 있는 요소
2. 지루하지 않게 하는 장치들
3. 감정적 몰입 요소
4. 시청 시간을 늘릴 수 있는 요소

## 대본
${script.substring(0, 15000)}

## 응답 형식 (반드시 JSON으로)
\`\`\`json
{
    "engagementElements": [
        {
            "type": "요소 유형",
            "description": "설명",
            "effectiveness": 0-100
        }
    ],
    "seniorAppeal": {
        "score": 0-100,
        "relatable": ["공감 요소"],
        "nostalgic": ["향수 요소"],
        "emotional": ["감동 요소"]
    },
    "retention": {
        "score": 0-100,
        "hooks": ["시청 유지 요소"],
        "dropoffRisks": ["이탈 위험 지점"],
        "suggestions": ["개선 제안"]
    },
    "overallEntertainment": 0-100,
    "verdict": "평가 결론"
}
\`\`\``;
    }

    /**
     * AI 응답 파싱
     */
    parseAnalysisResponse(response, analysisType) {
        try {
            // JSON 블록 추출
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonMatch && jsonMatch[1]) {
                return JSON.parse(jsonMatch[1]);
            }
            
            // JSON 블록이 없으면 전체 응답에서 JSON 찾기
            const jsonStart = response.indexOf('{');
            const jsonEnd = response.lastIndexOf('}');
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
    }

    /**
     * 특정 항목만 빠르게 분석
     */
    async quickAnalyze(script, item) {
        const prompts = {
            korea: `이 대본이 한국 배경인지 확인하고, 발견된 한국 지명/장소/문화 키워드를 나열해주세요. JSON 형식으로 {"isKorea": true/false, "keywords": [], "score": 0-100, "feedback": ""} 응답해주세요.\n\n대본:\n${script.substring(0, 5000)}`,
            
            characters: `이 대본의 등장인물 이름, 나이, 관계, 특성을 추출해주세요. JSON 형식으로 {"characters": [{"name": "", "age": "", "relation": "", "traits": []}]} 응답해주세요.\n\n대본:\n${script.substring(0, 5000)}`,
            
            flow: `이 대본의 이야기 흐름이 자연스러운지 평가해주세요. JSON 형식으로 {"score": 0-100, "feedback": "", "issues": []} 응답해주세요.\n\n대본:\n${script.substring(0, 5000)}`
        };

        const prompt = prompts[item] || prompts.korea;
        
        try {
            const response = await this.generateContent(prompt, {
                temperature: 0.2,
                maxTokens: 1024
            });
            return this.parseAnalysisResponse(response, item);
        } catch (error) {
            throw error;
        }
    }

    /**
     * FLOW 후보 구간 분석 (하이브리드 2차 - Gemini 호출)
     * 규칙 기반으로 추출된 후보 구간만 AI로 확정 판정
     */
    async analyzeFlowCandidates(candidateSegments, fullScript) {
        if (!candidateSegments || candidateSegments.length === 0) {
            return [];
        }

        const results = [];

        for (const candidate of candidateSegments) {
            try {
                const segmentText = fullScript.substring(candidate.startIndex, candidate.endIndex);
                
                const prompt = `당신은 한국 시니어 낭독 콘텐츠 스토리 전문가입니다.
아래 대본 구간에서 전개/흐름 오류가 있는지 판정해주세요.

## 후보 유형
${candidate.type === 'TIME_JUMP' ? '시간 점프 (급격한 시간 변화)' : 
  candidate.type === 'EMOTION_SHIFT' ? '감정 급변 (긍정↔부정 혼재)' : 
  candidate.type === 'LOCATION_CHANGE' ? '장소 급변' : '기타 전환'}

## 분석 기준
1. 부자연스러운 전개인가?
2. 인과관계가 누락되었는가?
3. 연결이 부자연스러운가?
4. 시니어 시청자에게 혼란을 줄 수 있는가?

## 대본 구간 (씬 ${candidate.sceneNum || '?'})
${segmentText.substring(0, 3000)}

## 응답 형식 (반드시 JSON으로)
\`\`\`json
{
    "isIssue": true/false,
    "issueType": "부자연전개/인과누락/연결부자연/급변화/없음",
    "severity": "HIGH/MED/LOW",
    "confidence": "HIGH/MID/LOW",
    "reason": "판정 근거 설명",
    "suggestion": "최소 수정 제안",
    "problematicPart": "문제가 되는 구체적 텍스트 (있다면)"
}
\`\`\``;

                const response = await this.generateContent(prompt, {
                    temperature: 0.2,
                    maxTokens: 1024
                });

                const parsed = this.parseAnalysisResponse(response, 'flow');
                
                if (parsed && !parsed.error) {
                    results.push({
                        ...candidate,
                        ...parsed,
                        analyzed: true
                    });
                }

            } catch (error) {
                console.error('FLOW 후보 분석 오류:', error);
                results.push({
                    ...candidate,
                    isIssue: false,
                    error: error.message,
                    analyzed: false
                });
            }
        }

        return results;
    }

    /**
     * FLOW 오류 종합 분석 (하이브리드)
     * 1차: 규칙 기반 후보 추출
     * 2차: Gemini로 후보만 확정
     */
    async analyzeFlowHybrid(script, candidateExtractor) {
        // 1차: 규칙 기반 후보 추출 (외부에서 전달)
        let candidates = [];
        if (typeof candidateExtractor === 'function') {
            candidates = candidateExtractor(script);
        } else if (Array.isArray(candidateExtractor)) {
            candidates = candidateExtractor;
        }

        console.log(`📊 FLOW 후보 ${candidates.length}개 추출됨`);

        if (candidates.length === 0) {
            return {
                issues: [],
                message: '규칙 기반 검사에서 FLOW 후보가 발견되지 않았습니다.'
            };
        }

        // 2차: Gemini로 후보만 분석
        const analyzedCandidates = await this.analyzeFlowCandidates(candidates, script);
        
        // isIssue=true인 것만 필터링
        const confirmedIssues = analyzedCandidates.filter(c => c.isIssue === true);

        console.log(`✅ FLOW 오류 ${confirmedIssues.length}개 확정됨`);

        return {
            candidates: candidates.length,
            analyzed: analyzedCandidates.length,
            issues: confirmedIssues,
            message: `${candidates.length}개 후보 중 ${confirmedIssues.length}개 오류 확정`
        };
    }
}

// ========================================
// 전역 인스턴스
// ========================================
const geminiAPI = new GeminiAPI();

// ========================================
// 유틸리티 함수
// ========================================
async function testGeminiConnection() {
    const result = await geminiAPI.testConnection();
    if (result) {
        console.log('✅ Gemini API 연결 성공');
    } else {
        console.error('❌ Gemini API 연결 실패:', geminiAPI.lastError);
    }
    return result;
}

// 전역 노출
window.GeminiAPI = GeminiAPI;
window.geminiAPI = geminiAPI;
window.testGeminiConnection = testGeminiConnection;

console.log('✅ Gemini API 모듈 로드 완료');
