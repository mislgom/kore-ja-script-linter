/**
 * 대본 검수 시스템 - Main JavaScript
 */

// 전역 상태 관리 (필요시 사용)
const AppState = {
    isAIAnalyzing: false,
};

// 알림 UI 표시 함수 (기존 구현이 있다고 가정)
function showNotification(message, type = 'info') {
    // 이 함수는 이미 프로젝트 내에 존재한다고 가정합니다.
    // 실제 구현은 동적으로 DOM 요소를 생성하여 화면에 표시합니다.
    console.log(`[알림 / ${type}] ${message}`);
    // 예: 토스트 메시지 UI 생성 및 표시 로직
}

// ========================================
// API 키 설정 UI 핸들러
// ========================================
function initApiKeySettings() {
    const settingsBtn = document.getElementById('api-key-settings-btn');
    const apiKeyPanel = document.getElementById('api-key-panel');
    const apiKeyInput = document.getElementById('gemini-api-key-input');
    const saveBtn = document.getElementById('save-api-key-btn');
    const deleteBtn = document.getElementById('delete-api-key-btn');

    if (!settingsBtn || !apiKeyPanel) return; // UI 요소 없으면 중단

    // 설정 버튼 클릭 시 패널 열기/닫기
    settingsBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        apiKeyPanel.classList.toggle('hidden');
        // 패널이 열릴 때, localStorage에서 현재 키를 불러와 input에 표시
        if (!apiKeyPanel.classList.contains('hidden')) {
            apiKeyInput.value = localStorage.getItem('GEMINI_API_KEY') || '';
        }
    });

    // 문서 전체 클릭 시 패널 닫기 (패널 외부 클릭 감지)
    document.addEventListener('click', (event) => {
        if (!apiKeyPanel.contains(event.target) && !settingsBtn.contains(event.target)) {
            apiKeyPanel.classList.add('hidden');
        }
    });
    
    // 저장 버튼 클릭 핸들러
    saveBtn.addEventListener('click', () => {
        const apiKey = apiKeyInput.value.trim();
        if (apiKey) {
            localStorage.setItem('GEMINI_API_KEY', apiKey);
            showNotification('✅ API 키가 안전하게 저장되었습니다.', 'success');
            apiKeyPanel.classList.add('hidden');
        } else {
            showNotification('API 키를 입력해주세요.', 'warning');
        }
    });

    // 삭제 버튼 클릭 핸들러
    deleteBtn.addEventListener('click', () => {
        localStorage.removeItem('GEMINI_API_KEY');
        apiKeyInput.value = '';
        showNotification('API 키가 삭제되었습니다.', 'info');
        apiKeyPanel.classList.add('hidden');
    });
}


// ========================================
// AI 분석 초기화 (버튼 핸들러)
// ========================================
function initAIAnalysis() {
  const aiBtn = document.getElementById('korea-ai-analyze-btn');
  if (!aiBtn) return;

  if (aiBtn.dataset.listenerAttached) return; // 중복 방지
  aiBtn.dataset.listenerAttached = 'true';

  aiBtn.addEventListener('click', async function () {
    const script = document.getElementById('korea-senior-script')?.value;
    if (!script || script.trim().length < 100) {
      showNotification('AI 분석을 위해 최소 100자 이상의 대본이 필요합니다.', 'warning');
      return;
    }

    // forceGeminiAnalyze 함수는 내부적으로 API 키 존재 여부를 확인하고 없으면 알림을 표시함
    const result = await window.forceGeminiAnalyze(script);

    if (!result) { // 키가 없거나, API 호출이 실패하면 undefined가 반환됨
      console.log("AI 분석이 중단되었거나 실패했습니다.");
      return;
    }

    console.log("✅ result(head):", (result || "").slice(0, 80));

    const resultEl = document.getElementById('korea-ai-result');
    if (resultEl) {
      resultEl.classList.remove('hidden');
      const summaryEl = document.getElementById('korea-ai-summary');
      if (summaryEl) summaryEl.textContent = result;
    }

    showNotification('✅ AI 심층 분석이 완료되었습니다!', 'success');
  });
}

// ========================================
// 페이지 로드 완료 시 실행
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    // 각종 초기화 함수 실행
    initAIAnalysis();
    initApiKeySettings();

    // 여기에 다른 초기화 스크립트들을 추가할 수 있습니다.
    // 예: initTabs(), initDarkMode(), ...
});
