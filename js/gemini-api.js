// ========================================
// Gemini API 연동 (프론트엔드)
// ========================================

/**
 * localStorage에서 API 키를 가져오는 함수
 * @returns {string} 저장된 API 키 또는 빈 문자열
 */
function getGeminiApiKey() {
  return localStorage.getItem('GEMINI_API_KEY') || '';
}

/**
 * [수정] 프론트엔드에서 Gemini API를 직접 호출하는 함수 (localStorage 키 사용)
 * @param {string} textToAnalyze - 분석할 텍스트
 */
async function forceGeminiAnalyze(textToAnalyze) {
    console.log(`[연동] Gemini 분석 시작...`);
    const apiKey = getGeminiApiKey();

    if (!apiKey) {
        if (typeof showNotification === 'function') {
            showNotification('API 키를 먼저 설정해주세요.', 'warning');
        } else {
            alert('API 키를 먼저 설정해주세요.');
        }
        return; // API 키가 없으면 분석 중단
    }

    const GEMINI_MODEL = 'gemini-2.5-flash';
    const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

    console.log("[forceGeminiAnalyze] CALL_URL =", GEMINI_ENDPOINT.replace(/key=[^&]+/, "key=***"));
    console.log("[forceGeminiAnalyze] MODEL =", GEMINI_MODEL);

    const requestBody = {
        contents: [{ parts: [{ text: textToAnalyze }] }]
    };

    try {
        const response = await fetch(GEMINI_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            let errorMessage = `Gemini HTTP error: ${response.status}`;
            if (response.status === 400) {
                errorMessage = 'API 키가 유효하지 않거나 형식이 잘못되었습니다.';
            }
            if (typeof showNotification === 'function') {
                showNotification(errorMessage, 'error');
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();
        const geminiResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!geminiResponse) {
            throw new Error("Gemini로부터 비어있는 응답을 받았습니다.");
        }
        
        return geminiResponse;

    } catch (error) {
        console.error('Gemini API 호출 중 오류 발생:', error.message);
        if (typeof showNotification === 'function' && !error.message.includes('HTTP error')) {
             showNotification(`API 호출 오류: ${error.message}`, 'error');
        }
        return undefined;
    }
}

// 모듈 스코프 이슈 방지를 위해 window 객체에 명시적으로 바인딩
window.forceGeminiAnalyze = forceGeminiAnalyze;
