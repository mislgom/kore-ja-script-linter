/**
 * MISLGOM 대본 검수 자동 프로그램
 * gemini-api.js v1.0 - Vercel Serverless Function
 * Vertex AI API 키를 사용한 Google AI 엔드포인트 중계
 */

export default async function handler(req, res) {
    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // OPTIONS 요청 처리 (preflight)
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // POST 요청만 허용
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        const { prompt, apiKey } = req.body;

        // 필수 파라미터 검증
        if (!prompt) {
            res.status(400).json({ error: 'prompt is required' });
            return;
        }

        // API 키 (요청에서 받거나 환경 변수에서)
        const key = apiKey || process.env.GEMINI_API_KEY;
        
        if (!key) {
            res.status(400).json({ error: 'API key is required' });
            return;
        }

        // Gemini API 설정
        const MODEL = 'gemini-2.5-flash-preview-05-20';
        const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;

        console.log('🚀 Gemini API 호출 시작');
        console.log('   - 모델:', MODEL);
        console.log('   - 프롬프트 길이:', prompt.length, '자');

        // Gemini API 호출
        const response = await fetch(ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.1,
                    topP: 0.8,
                    topK: 40,
                    maxOutputTokens: 8192
                }
            })
        });

        console.log('📡 Gemini API 응답:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Gemini API 오류:', errorText);
            res.status(response.status).json({ 
                error: 'Gemini API error', 
                details: errorText 
            });
            return;
        }

        const data = await response.json();
        console.log('✅ Gemini API 응답 성공');

        // 응답 전달
        res.status(200).json(data);

    } catch (error) {
        console.error('❌ 서버 오류:', error.message);
        res.status(500).json({ 
            error: 'Internal server error', 
            message: error.message 
        });
    }
}
