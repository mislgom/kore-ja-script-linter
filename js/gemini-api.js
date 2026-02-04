/**
 * Gemini API 연동 모듈 (v3.0 Final)
 * Google Gemini 2.5 Flash API 통합
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

        // 사용자 경고 (기존 showNotification 함수 사용)
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

    // 5) API 호출 (fetch)
    console.log('🚀 Gemini API 호출 시작...');

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
            var errorData = await response.json().catch(function () { return {}; });
            var errorMessage = (errorData.error && errorData.error.message)
                ? errorData.error.message
                : 'API 오류: ' + response.status;

            console.error('❌ Gemini API 오류:', errorMessage);
            this.lastError = errorMessage;

            // API 오류는 네트워크/모델 오류이므로 상단 알림 표시 (정책상 허용)
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
        throw error; // 상위 호출자(main.js)에게 전파하여 처리
    }
};

/**
 * 대본 종합 분석 (generateContent = forceGeminiAnalyze 매핑)
 * [User Request] window.GeminiAPI.generateContent 노출 요구 충족
 */
GeminiAPI.prototype.generateContent = async function (prompt, options) {
    return this.forceGeminiAnalyze(prompt, options);
};


// ========================================
// 전역 인스턴스 및 노출
// ========================================
var geminiAPI = new GeminiAPI();

// [User Request] window.GeminiAPI 및 인스턴스 노출
window.GeminiAPI = GeminiAPI; // Note: main.js에서는 window.GeminiAPI.generateContent(...) 형태로 사용함
window.geminiAPI = geminiAPI;

// 호환성 유지
window.forceGeminiAnalyze = function (prompt, options) {
    return geminiAPI.forceGeminiAnalyze(prompt, options);
};

console.log('✅ Gemini API 모듈 로드 완료 (v3.0 Final)');
