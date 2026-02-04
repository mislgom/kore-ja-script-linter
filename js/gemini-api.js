/**
 * Gemini API 연동 모듈 (v3.0 Final Fixed)
 * Google Gemini 2.5 Flash API 통합
 * 
 * [수정 사항]
 * 전역 객체 window.GeminiAPI를 "클래스"가 아닌 "인스턴스"로 확정.
 * main.js에서 window.GeminiAPI.generateContent() 호출 시 오류가 없도록 조치.
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
// Gemini API 클래스 정의
// ========================================
function GeminiAPI() {
    this.endpoint = GeminiConfig.endpoint;
    this.isAvailable = false;
    this.lastError = null;
    console.log('[GeminiAPI] Constructor initialized');
}

/**
 * API 키 가져오기 (localStorage에서만)
 */
GeminiAPI.prototype.getApiKey = function () {
    return localStorage.getItem('GEMINI_API_KEY');
};

/**
 * API 키 존재 여부 확인
 */
GeminiAPI.prototype.hasApiKey = function () {
    var key = this.getApiKey();
    return !!(key && key.trim());
};

/**
 * 핵심 API 호출 함수 (단일 진입점)
 */
GeminiAPI.prototype.forceGeminiAnalyze = async function (prompt, options) {
    options = options || {};

    // 1) API 키 로드
    var apiKey = this.getApiKey();

    // 2) 키 없음 체크
    if (!apiKey || !apiKey.trim()) {
        var errorMsg = 'API 키가 설정되지 않았습니다. 우측 상단 🔑 버튼에서 설정해주세요.';
        console.warn('⚠️ Gemini API:', errorMsg);

        if (typeof window.showNotification === 'function') {
            window.showNotification(errorMsg, 'warning');
        } else {
            alert(errorMsg);
        }
        return null;
    }

    // 3) 엔드포인트 구성
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

    console.log('🚀 Gemini API 호출 시작...');

    try {
        var response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            var errorData = await response.json().catch(function () { return {}; });
            var errorMessage = (errorData.error && errorData.error.message) ? errorData.error.message : 'API 오류: ' + response.status;
            console.error('❌ Gemini API 오류:', errorMessage);
            this.lastError = errorMessage;
            if (typeof window.showNotification === 'function') {
                window.showNotification('API 호출 실패: ' + errorMessage, 'error');
            }
            throw new Error(errorMessage);
        }

        var data = await response.json();

        if (data.candidates && data.candidates[0] &&
            data.candidates[0].content && data.candidates[0].content.parts &&
            data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text) {

            var resultText = data.candidates[0].content.parts[0].text;
            console.log('✅ Gemini API 응답 수신 완료');
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
 * 대본 종합 분석 (generateContent = forceGeminiAnalyze 매핑)
 * [중요] window.GeminiAPI.generateContent() 형태로 호출됨
 */
GeminiAPI.prototype.generateContent = async function (prompt, options) {
    return this.forceGeminiAnalyze(prompt, options);
};


// ========================================
// [CRITICAL] 전역 인스턴스 노출 설정
// ========================================

// 1. 인스턴스 생성
const geminiInstance = new GeminiAPI();

// 2. window.GeminiAPI에 "인스턴스" 할당 (클래스 아님!)
// 이제 window.GeminiAPI.generateContent() 호출 시 undefined가 아님.
window.GeminiAPI = geminiInstance;
window.geminiAPI = geminiInstance;

// 3. (선택사항) 클래스가 필요한 경우 별도 이름으로 노출
window.GeminiAPIClass = GeminiAPI;

// 호환성 유지
window.forceGeminiAnalyze = function (prompt, options) {
    return geminiInstance.forceGeminiAnalyze(prompt, options);
};

console.log('✅ Gemini API 모듈 로드 완료: window.GeminiAPI는 이제 인스턴스입니다.');
console.log('   - window.GeminiAPI.generateContent type check:', typeof window.GeminiAPI.generateContent);
