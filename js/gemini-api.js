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
    apiKey: 'AIzaSyA6ePilBkuZHoQe-KxT0_mmcGvI7uMeeTo',
    model: 'gemini-2.5-flash',
    baseUrl: 'https://generativelanguage.googleapis.com/v1/models',
    maxTokens: 8192,
    temperature: 0.7,
    chunkSize: 15000, // 대본 분할 처리 단위 (문자 수)
    maxRetries: 3,    // API 호출 최대 재시도 횟수
    backoffDelay: 1000 // 재시도 기본 대기 시간 (ms)
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
            // "hello" 와 유사한 간단한 테스트로 변경
            const response = await this.generateContent('\"연결 성공\"이라고만 짧게 답해주세요.');
            this.isAvailable = response && response.includes('연결 성공');
            return this.isAvailable;
        } catch (error) {
            this.isAvailable = false;
            this.lastError = error.message;
            console.error('❌ Gemini API 연결 테스트 실패:', error);
            return false;
        }
    }

    /**
     * 콘텐츠 생성 (기본 API 호출) - 재시도 및 백오프 로직 포함
     */
    async generateContent(prompt, options = {}) {
        const url = `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`;
        
        // 요구사항 3: 엔드포인트, 모델, 메서드 로그 (API 키 제외)
        console.log('--- [Gemini API Call] ---');
        console.log('Endpoint:', this.baseUrl);
        console.log('API Version: v1');
        console.log('Model:', this.model);
        console.log('Method: generateContent');
        console.log('---------------------------');

        const requestBody = {
            contents: [{ parts: [{ text: prompt }] }],
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

        // 요구사항 4: 429/timeout 시 backoff 재시도
        for (let attempt = 1; attempt <= GeminiConfig.maxRetries; attempt++) {
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody)
                });

                if (!response.ok) {
                    // 재시도해야 하는 오류 코드 (429: Too Many Requests)
                    if (response.status === 429 && attempt < GeminiConfig.maxRetries) {
                        const delay = GeminiConfig.backoffDelay * Math.pow(2, attempt - 1);
                        console.warn(`[Attempt ${attempt}] API Rate Limit (429). Retrying in ${delay}ms...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        continue; // 재시도
                    }
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
                // 네트워크 오류 또는 Timeout 등으로 인한 재시도
                if (attempt < GeminiConfig.maxRetries) {
                    const delay = GeminiConfig.backoffDelay * Math.pow(2, attempt - 1);
                    console.warn(`[Attempt ${attempt}] API Call Failed (${error.message}). Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
                // 최종 실패
                throw error;
            }
        }
    }

    /**
     * 대본 종합 분석 (Chunk 분할 처리 기능 포함)
     */
    async analyzeScript(script, analysisType = 'comprehensive') {
        // 요구사항 4: 실제 운영 대본(약 4만자) 기준으로 chunk 분할 호출 테스트
        console.log(`대본 분할 분석 시작 (전체 ${script.length}자, Chunk 크기: ${GeminiConfig.chunkSize}자)`);
        
        const chunks = [];
        for (let i = 0; i < script.length; i += GeminiConfig.chunkSize) {
            chunks.push(script.substring(i, i + GeminiConfig.chunkSize));
        }
        console.log(`${chunks.length}개의 Chunk로 분할되었습니다.`);

        const analysisResults = [];

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            console.log(`[Chunk ${i + 1}/${chunks.length}] 분석 요청 중...`);

            const prompts = {
                comprehensive: this.getComprehensivePrompt(chunk, i + 1, chunks.length),
                // 다른 분석 타입들도 필요 시 chunk용 프롬프트로 수정 가능
            };
            const prompt = prompts[analysisType] || prompts.comprehensive;

            try {
                const response = await this.generateContent(prompt, {
                    temperature: 0.3,
                    maxTokens: 4096
                });
                
                const parsedResponse = this.parseAnalysisResponse(response, analysisType);
                analysisResults.push({ chunk: i + 1, status: 'success', data: parsedResponse });
                console.log(`[Chunk ${i + 1}/${chunks.length}] 분석 성공!`);

            } catch (error) {
                // 요구사항 4: 실패 시 SYS 이슈로 기록하고 계속 진행
                console.error(`[Chunk ${i + 1}/${chunks.length}] 분석 최종 실패. 다음 Chunk로 넘어갑니다.`, error);
                analysisResults.push({ chunk: i + 1, status: 'failed', error: error.message });
            }
        }
        
        console.log("✅ 모든 Chunk 분석 완료.");
        // TODO: 각 chunk 별 분석 결과를 의미있게 통합하는 로직 추가 필요
        return {
            summary: "Chunk별 분석이 완료되었습니다. 결과 취합 로직이 필요합니다.",
            results: analysisResults
        };
    }

    /**
     * 종합 분석 프롬프트 (Chunk 처리용으로 수정)
     */
    getComprehensivePrompt(scriptChunk, chunkNum, totalChunks) {
        return \`당신은 한국 시니어 낭독 콘텐츠 전문 대본 검수자입니다.
이것은 전체 대본 중 ${totalChunks}개의 조각 중 ${chunkNum}번째 조각입니다. 이 부분에 대해서만 분석하고 JSON 형식으로 결과를 제공해주세요.

## 분석 기준
1. **(부분) 한국 배경 확인**: 한국 지명, 문화, 장소가 적절히 사용되었는지
2. **(부분) 등장인물 설정 일관성**: 이름, 나이, 특성이 일관되는지 (이 조각 내에서)
3. **(부분) 이야기 흐름**: 자연스럽고 논리적인 전개인지
4. **(부분) 재미/몰입 요소**: 시니어 시청자가 공감하고 몰입할 수 있는지

## 대본 (일부분)
\${scriptChunk}

## 응답 형식 (반드시 JSON으로)
\\\`\\\`\\\`json
{
    "chunkInfo": {
        "current": ${chunkNum},
        "total": ${totalChunks}
    },
    "partialAnalysis": {
        "koreaBackground": { "pass": true/false, "feedback": "피드백", "keywords": [] },
        "characterConsistency": { "pass": true/false, "feedback": "피드백", "issues": [] },
        "storyFlow": { "pass": true/false, "feedback": "피드백" },
        "entertainment": { "pass": true/false, "feedback": "피드백" }
    },
    "issuesFoundInChunk": ["이 조각에서 발견된 구체적인 문제점 목록"]
}
\\\`\\\`\\\`\`;
    }

    // (getCharacterPrompt, getStoryPrompt 등 다른 프롬프트들도 필요시 위와 같이 chunk용으로 수정)

    /**
     * AI 응답 파싱
     */
    parseAnalysisResponse(response, analysisType) {
        try {
            const jsonMatch = response.match(/\\\`\\\`\\\`json\\s*([\\s\\S]*?)\\s*\\\`\\\`\\\`/);
            if (jsonMatch && jsonMatch[1]) {
                return JSON.parse(jsonMatch[1]);
            }
            const jsonStart = response.indexOf('{');
            const jsonEnd = response.lastIndexOf('}');
            if (jsonStart !== -1 && jsonEnd !== -1) {
                return JSON.parse(response.substring(jsonStart, jsonEnd + 1));
            }
            return { raw: response, parsed: false, error: 'JSON 파싱 실패' };
        } catch (error) {
            console.error('응답 파싱 오류:', error);
            return { raw: response, parsed: false, error: error.message };
        }
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
    console.log("🚀 Gemini API 연결 테스트 시작...");
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

console.log('✅ Gemini API 모듈 로드 완료 (v2.0 - Chunking & Retry)');
