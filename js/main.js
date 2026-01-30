/**
 * 대본 검수 시스템 - Main JavaScript
 * Script Review Pro vNext
 * 
 * 완전 자동화 검수 시스템 + AI 분석 + Issues 관리 + 인라인 편집
 */

// ========================================
// 전역 상태 관리
// ========================================
const AppState = {
    // ========================================
// STEP 3 추가 전역 상태 (AppState 아래에만 추가)
// ========================================
var notificationState = {
    lastMessage: '',
    lastTimestamp: 0,
    dedupeInterval: 2000  // 2초
};

var buttonThrottle = {
    lastClickTime: {},
    interval: 300  // 300ms
};

// ========================================
// 버튼 쓰로틀 체크
// ========================================
function isButtonThrottled(buttonId) {
    var now = Date.now();
    var lastTime = buttonThrottle.lastClickTime[buttonId] || 0;

    if (now - lastTime < buttonThrottle.interval) {
        return true;
    }

    buttonThrottle.lastClickTime[buttonId] = now;
    return false;
}

    currentTab: 'korea-senior',
    isReviewing: false,
    isAIAnalyzing: false,
    isDarkMode: false,
    analysisResult: null,
    lastReviewResult: null,
    aiAnalysisResult: null,
    issuesProcessed: false,
    tabConfig: {
        'korea-senior': { name: '한국 시니어 낭독', color: 'red', icon: 'fa-book-open' },
        'joseon-yadam': { name: '조선 야담', color: 'amber', icon: 'fa-scroll' },
        'japan-senior': { name: '일본 시니어 낭독', color: 'pink', icon: 'fa-torii-gate' },
        'world-news': { name: '전세계 뉴스', color: 'blue', icon: 'fa-globe' }
    }
};

// ========================================
// DOM 로드 완료 시 초기화
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    initDarkMode();
    initTabs();
    initTextareas();
    initKoreaSeniorReview();
    initAIAnalysis();
    initIssuesSystem();
    initApiKeyUI(); // API 키 UI 초기화 추가
    console.log('✅ 대본 검수 시스템 vNext (Issues 관리) 초기화 완료');
});

// ========================================
// Issues 시스템 초기화
// ========================================
function initIssuesSystem() {
    // Issues UI 컨트롤러가 이미 초기화되어 있음
    console.log('✅ Issues 시스템 연동 완료');
}

// ========================================
// 다크모드 초기화
// ========================================
function initDarkMode() {
    const toggleBtn = document.getElementById('dark-mode-toggle');
    const darkIcon = document.getElementById('dark-icon');
    const lightIcon = document.getElementById('light-icon');
    
    // 저장된 설정 불러오기
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode === 'true') {
        enableDarkMode();
    }
    
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function() {
            if (AppState.isDarkMode) {
                disableDarkMode();
            } else {
                enableDarkMode();
            }
        });
    }
    
    function enableDarkMode() {
        document.documentElement.classList.add('dark');
        AppState.isDarkMode = true;
        localStorage.setItem('darkMode', 'true');
        if (darkIcon) darkIcon.classList.add('hidden');
        if (lightIcon) lightIcon.classList.remove('hidden');
    }
    
    function disableDarkMode() {
        document.documentElement.classList.remove('dark');
        AppState.isDarkMode = false;
        localStorage.setItem('darkMode', 'false');
        if (darkIcon) darkIcon.classList.remove('hidden');
        if (lightIcon) lightIcon.classList.add('hidden');
    }
}

// ========================================
// 탭 시스템 초기화
// ========================================
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            tabButtons.forEach(btn => {
                btn.classList.remove('active', 'border-primary', 'text-primary', 'bg-blue-50');
                btn.classList.add('border-transparent', 'text-gray-500');
            });
            
            this.classList.add('active', 'border-primary', 'text-primary', 'bg-blue-50');
            this.classList.remove('border-transparent', 'text-gray-500');
            
            tabContents.forEach(content => {
                content.classList.add('hidden');
                content.classList.remove('active');
            });
            
            const targetContent = document.getElementById(targetTab);
            if (targetContent) {
                targetContent.classList.remove('hidden');
                targetContent.classList.add('active');
            }
            
            AppState.currentTab = targetTab;
        });
    });
}

// ========================================
// 텍스트에리어 초기화
// ========================================
function initTextareas() {
    const textarea = document.getElementById('korea-senior-script');
    const charCounter = document.getElementById('korea-char-counter');
    
    if (textarea && charCounter) {
        textarea.addEventListener('input', function() {
            const count = this.value.length;
            let displayCount;
            if (count >= 10000) {
                displayCount = (count / 10000).toFixed(1) + '만';
            } else if (count >= 1000) {
                displayCount = (count / 1000).toFixed(1) + '천';
            } else {
                displayCount = count;
            }
            charCounter.textContent = `${displayCount}자 / 무제한`;
            
            // 분석 결과 숨기기 (내용이 바뀌면)
            hideAnalysisPanel();
        });
        
        textarea.addEventListener('keydown', function(e) {
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = this.selectionStart;
                const end = this.selectionEnd;
                this.value = this.value.substring(0, start) + '    ' + this.value.substring(end);
                this.selectionStart = this.selectionEnd = start + 4;
            }
        });
    }
}

// ========================================
// 한국 시니어 낭독 검수 초기화
// ========================================
function initKoreaSeniorReview() {
    const reviewBtn = document.getElementById('korea-senior-review-btn');
    const clearBtn = document.getElementById('korea-senior-clear-btn');
    const sampleBtn = document.getElementById('korea-senior-sample-btn');
    const confirmBtn = document.getElementById('korea-confirm-review-btn');
    const cancelBtn = document.getElementById('korea-cancel-review-btn');
    const textarea = document.getElementById('korea-senior-script');
    
    if (!reviewBtn || !textarea) return;
    
    // 1단계: 대본 분석 버튼
    reviewBtn.addEventListener('click', function() {
        const script = textarea.value.trim();
        
        if (!script) {
            showNotification('대본을 입력해주세요.', 'warning');
            textarea.focus();
            return;
        }
        
        if (script.length < 50) {
            showNotification('대본이 너무 짧습니다. 최소 50자 이상 입력해주세요.', 'warning');
            return;
        }
        
        // 1단계: 대본 분석 및 등장인물 추출
        analyzeScript(script);
    });
    
    // 2단계: 확인 후 검수 시작 버튼
    if (confirmBtn) {
        confirmBtn.addEventListener('click', function() {
            if (AppState.analysisResult) {
                runFullReview(AppState.analysisResult);
            }
        });
    }
    
    // 취소 버튼
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            hideAnalysisPanel();
            AppState.analysisResult = null;
            showNotification('검수가 취소되었습니다.', 'info');
        });
    }
    
    // 지우기 버튼
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            if (textarea.value.trim()) {
                if (confirm('입력한 내용을 모두 지우시겠습니까?')) {
                    textarea.value = '';
                    document.getElementById('korea-char-counter').textContent = '0자 / 무제한';
                    resetKoreaSeniorResults();
                    hideAnalysisPanel();
                    showNotification('내용이 삭제되었습니다.', 'success');
                }
            }
        });
    }
    
    // 샘플 불러오기 버튼
    if (sampleBtn) {
        sampleBtn.addEventListener('click', function() {
            textarea.value = getSampleScript();
            const count = textarea.value.length;
            document.getElementById('korea-char-counter').textContent = `${count}자 / 무제한`;
            hideAnalysisPanel();
            showNotification('샘플 대본이 불러와졌습니다. 검수 버튼을 클릭하세요!', 'info');
        });
    }
}

// ========================================
// 1단계: 대본 분석 (등장인물 추출)
// ========================================
async function analyzeScript(script) {
    if (AppState.isReviewing) {
        showNotification('이미 분석이 진행 중입니다.', 'warning');
        return;
    }
    
    AppState.isReviewing = true;
    
    // 로딩 표시
    const loadingEl = document.getElementById('korea-loading');
    if (loadingEl) loadingEl.classList.remove('hidden');
    
    const reviewBtn = document.getElementById('korea-senior-review-btn');
    if (reviewBtn) {
        reviewBtn.disabled = true;
        reviewBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>대본 분석 중...';
    }
    
    showNotification('대본을 분석하고 있습니다...', 'info');
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    try {
        // 검수 클래스로 분석
        const reviewer = new KoreaSeniorReviewer(script);
        
        // 등장인물 정보 추출
        const characters = reviewer.characters;
        const stats = reviewer.stats;
        const scenes = reviewer.scenes;
        const dialogues = reviewer.dialogues;
        
        // 관계 정보 추출
        const relationshipKeywords = [
            '아들', '딸', '엄마', '아빠', '아버지', '어머니', '할머니', '할아버지',
            '형', '누나', '오빠', '언니', '동생', '삼촌', '이모', '고모',
            '며느리', '사위', '시어머니', '장인', '장모', '남편', '아내',
            '친구', '선배', '후배', '동료', '상사'
        ];
        
        const relationships = [];
        const relationPattern = new RegExp(`([가-힣]{2,4})\\s*\\(\\s*(${relationshipKeywords.join('|')})[^)]*\\)`, 'g');
        let match;
        while ((match = relationPattern.exec(script)) !== null) {
            relationships.push({ name: match[1], relation: match[2] });
        }
        
        // 분석 결과 저장
        AppState.analysisResult = {
            script,
            reviewer,
            characters,
            relationships: [...new Map(relationships.map(r => [r.name + r.relation, r])).values()],
            stats,
            scenes,
            dialogues
        };
        
        // 분석 결과 표시
        displayAnalysisResult(AppState.analysisResult);
        
        showNotification('✅ 대본 분석 완료! 등장인물을 확인하고 검수를 시작하세요.', 'success');
        
    } catch (error) {
        console.error('분석 오류:', error);
        showNotification('분석 중 오류가 발생했습니다.', 'error');
    } finally {
        AppState.isReviewing = false;
        
        if (loadingEl) loadingEl.classList.add('hidden');
        
        if (reviewBtn) {
            reviewBtn.disabled = false;
            reviewBtn.innerHTML = '<i class="fas fa-robot mr-2"></i>전체 자동 검수 시작';
        }
    }
}

// ========================================
// 분석 결과 표시
// ========================================
function displayAnalysisResult(analysis) {
    const panel = document.getElementById('korea-character-analysis');
    const charList = document.getElementById('korea-character-list');
    const relList = document.getElementById('korea-relationship-list');
    const charCount = document.getElementById('korea-analysis-char-count');
    
    if (!panel) return;
    
    // 등장인물 수 표시
    const characterCount = Object.keys(analysis.characters).length;
    if (charCount) {
        charCount.textContent = `${characterCount}명 감지`;
    }
    
    // 등장인물 리스트 생성
    if (charList) {
        let html = '';
        Object.values(analysis.characters).forEach((char, index) => {
            const ageText = char.ages.length > 0 
                ? (typeof char.ages[0] === 'number' ? `${char.ages[0]}세` : char.ages[0])
                : '나이 미상';
            const traitText = char.traits.length > 0 ? char.traits[0] : '';
            
            // 관계 찾기
            const relation = analysis.relationships.find(r => r.name === char.name);
            const relationText = relation ? relation.relation : '';
            
            html += `
                <div class="bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600 flex items-center space-x-3">
                    <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                        ${char.name.charAt(0)}
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="font-medium text-gray-800 dark:text-white text-sm truncate">
                            ${char.name}
                            ${relationText ? `<span class="text-blue-500 dark:text-blue-400">(${relationText})</span>` : ''}
                        </p>
                        <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
                            ${ageText}${traitText ? ' · ' + traitText : ''}
                        </p>
                    </div>
                </div>
            `;
        });
        
        if (html === '') {
            html = '<p class="text-gray-500 dark:text-gray-400 text-sm col-span-full">등장인물 정보를 찾을 수 없습니다. "이름(나이, 특성)" 형식으로 작성해주세요.</p>';
        }
        
        charList.innerHTML = html;
    }
    
    // 관계 정보 표시
    if (relList) {
        let html = '';
        analysis.relationships.forEach(rel => {
            const colors = {
                '엄마': 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
                '아빠': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
                '아버지': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
                '어머니': 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
                '아들': 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
                '딸': 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
                '할머니': 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
                '할아버지': 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
            };
            const colorClass = colors[rel.relation] || 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300';
            
            html += `<span class="px-3 py-1 rounded-full text-xs font-medium ${colorClass}">${rel.name} (${rel.relation})</span>`;
        });
        
        if (html === '') {
            html = '<span class="text-gray-500 dark:text-gray-400 text-sm">관계 정보가 없습니다.</span>';
        }
        
        relList.innerHTML = html;
    }
    
    // 기본 통계 표시
    document.getElementById('stat-total-chars').textContent = analysis.stats.totalCharacters.toLocaleString() + '자';
    document.getElementById('stat-scene-count').textContent = analysis.stats.sceneCount + '개';
    document.getElementById('stat-dialogue-count').textContent = analysis.stats.dialogueCount + '개';
    document.getElementById('stat-est-runtime').textContent = analysis.stats.estimatedRuntime + '분';
    
    // 패널 표시
    panel.classList.remove('hidden');
    
    // 스크롤
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ========================================
// 분석 패널 숨기기
// ========================================
function hideAnalysisPanel() {
    const panel = document.getElementById('korea-character-analysis');
    if (panel) {
        panel.classList.add('hidden');
    }
}

// ========================================
// 2단계: 전체 검수 실행
// ========================================
async function runFullReview(analysis) {
    if (AppState.isReviewing) return;
    
    AppState.isReviewing = true;
    
    // 분석 패널 숨기기
    hideAnalysisPanel();
    
    // 로딩 표시
    const loadingEl = document.getElementById('korea-loading');
    if (loadingEl) {
        loadingEl.classList.remove('hidden');
        loadingEl.querySelector('span').textContent = '상세 검수 진행 중...';
    }
    
    showNotification('상세 검수를 시작합니다...', 'info');
    
    await new Promise(resolve => setTimeout(resolve, 200));
    
    try {
        // 전체 검수 실행
        const results = analysis.reviewer.runFullReview();
        const overall = analysis.reviewer.calculateOverallScore();
        
        AppState.lastReviewResult = { results, overall, reviewer: analysis.reviewer };
        
        // 결과 표시
        await displayResults(results, overall);
        
        showNotification('✅ 전체 검수가 완료되었습니다!', 'success');
        console.log('📊 검수 결과:', results);
        console.log('📈 종합 점수:', overall);
        
    } catch (error) {
        console.error('검수 오류:', error);
        showNotification('검수 중 오류가 발생했습니다.', 'error');
    } finally {
        AppState.isReviewing = false;
        AppState.analysisResult = null;
        
        if (loadingEl) loadingEl.classList.add('hidden');
    }
}

// ========================================
// 결과 표시 (애니메이션)
// ========================================
async function displayResults(results, overall) {
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
    
    // 1~3번 기본 검수 결과
    updateResultCard('korea-bg-result', results.koreaBackground);
    await delay(100);
    updateResultCard('korea-char-result', results.characterConsistency);
    await delay(100);
    updateResultCard('korea-rel-result', results.relationshipConsistency);
    await delay(100);
    
    // 4~6번 스토리 분석 결과
    updateResultCard('korea-flow-result', results.storyFlow);
    await delay(100);
    updateResultCard('korea-pace-result', results.pacingSpeed);
    await delay(100);
    updateResultCard('korea-fun-result', results.entertainment);
    await delay(100);
    
    // 종합 결과
    updateOverallSummary(overall);
    updateOverallStatus(overall);
    
    // AI 분석 섹션 표시
    showAIAnalysisSection();
    
    // Issues 추출 및 패널 표시
    processIssuesFromResults(results);
}

// ========================================
// Issues 추출 및 처리
// ========================================
function processIssuesFromResults(results) {
    try {
        // Issues 섹션 표시
        const issuesSection = document.getElementById('korea-issues-section');
        if (issuesSection) {
            issuesSection.classList.remove('hidden');
        }

        // 스크립트 가져오기
        const script = document.getElementById('korea-senior-script')?.value || '';
        
        if (!script) {
            console.warn('스크립트가 없습니다.');
            return;
        }

        // Issues UI 컨트롤러를 통해 처리
        if (window.issuesUI) {
            const issues = window.issuesUI.processReviewResults(results, script);
            AppState.issuesProcessed = true;
            
            console.log(`📊 ${issues.length}개의 오류가 추출되었습니다.`);
            
            if (issues.length > 0) {
                showNotification(`🔍 ${issues.length}개의 오류가 발견되었습니다. 아래에서 확인하세요.`, 'warning');
            }
        }
    } catch (error) {
        console.error('Issues 처리 오류:', error);
        showNotification('오류 추출 중 문제가 발생했습니다.', 'error');
    }
}

// ========================================
// 결과 카드 업데이트
// ========================================
function updateResultCard(cardId, result) {
    const card = document.getElementById(cardId);
    if (!card) return;
    
    const badge = card.querySelector('.status-badge');
    const detail = card.querySelector('.result-detail');
    
    if (badge) {
        if (result.pass) {
            badge.className = 'status-badge bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-xs px-2 py-1 rounded-full font-medium';
            badge.textContent = `합격 ${result.score}점`;
        } else if (result.score >= 50) {
            badge.className = 'status-badge bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 text-xs px-2 py-1 rounded-full font-medium';
            badge.textContent = `주의 ${result.score}점`;
        } else {
            badge.className = 'status-badge bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 text-xs px-2 py-1 rounded-full font-medium';
            badge.textContent = `미달 ${result.score}점`;
        }
    }
    
    // 카드 배경색
    card.className = card.className.replace(/bg-\w+-50/g, 'bg-gray-50');
    card.classList.remove('bg-green-50', 'bg-yellow-50', 'bg-red-50', 'dark:bg-green-900/20', 'dark:bg-yellow-900/20', 'dark:bg-red-900/20');
    
    if (result.pass) {
        card.classList.add('bg-green-50', 'dark:bg-green-900/20');
    } else if (result.score >= 50) {
        card.classList.add('bg-yellow-50', 'dark:bg-yellow-900/20');
    } else {
        card.classList.add('bg-red-50', 'dark:bg-red-900/20');
    }
    
    if (detail && result.details) {
        const iconMap = {
            'success': '<i class="fas fa-check-circle text-green-500 mr-1"></i>',
            'error': '<i class="fas fa-times-circle text-red-500 mr-1"></i>',
            'warning': '<i class="fas fa-exclamation-triangle text-yellow-500 mr-1"></i>',
            'info': '<i class="fas fa-info-circle text-blue-400 mr-1"></i>'
        };
        
        let html = result.details.map(item => {
            const icon = iconMap[item.type] || iconMap['info'];
            return `<div class="mb-1 leading-relaxed">${icon}${item.message}</div>`;
        }).join('');
        
        detail.innerHTML = html || '<span class="text-gray-400">결과 없음</span>';
        detail.classList.remove('text-gray-400');
        detail.classList.add('text-gray-600', 'dark:text-gray-300');
    }
}

// ========================================
// 종합 결과 업데이트
// ========================================
function updateOverallSummary(overall) {
    const scoreEl = document.getElementById('korea-total-score');
    if (scoreEl) {
        scoreEl.textContent = overall.totalScore + '점';
        scoreEl.className = 'text-xl font-bold ' + 
            (overall.totalScore >= 80 ? 'text-green-600' : 
             overall.totalScore >= 60 ? 'text-yellow-600' : 'text-red-600');
    }
    
    const passEl = document.getElementById('korea-pass-count');
    if (passEl) {
        passEl.textContent = `${overall.passCount}/${overall.totalCount}`;
        passEl.className = 'text-xl font-bold ' + 
            (overall.passCount === overall.totalCount ? 'text-green-600' : 
             overall.passCount >= 4 ? 'text-yellow-600' : 'text-red-600');
    }
    
    const sceneEl = document.getElementById('korea-scene-count');
    if (sceneEl) sceneEl.textContent = overall.sceneCount + '개';
    
    const charEl = document.getElementById('korea-char-count');
    if (charEl) charEl.textContent = overall.characterCount + '명';
    
    const keywordEl = document.getElementById('korea-keyword-count');
    if (keywordEl) keywordEl.textContent = overall.keywordCount + '개';
    
    const dialogueEl = document.getElementById('korea-dialogue-ratio');
    if (dialogueEl) dialogueEl.textContent = overall.dialogueRatio + '%';
    
    const runtimeEl = document.getElementById('korea-runtime');
    if (runtimeEl) runtimeEl.textContent = overall.estimatedRuntime + '분';
    
    const finalEl = document.getElementById('korea-final-status');
    if (finalEl) {
        if (overall.allPass) {
            finalEl.textContent = '합격';
            finalEl.className = 'text-xl font-bold text-green-600';
        } else if (overall.passCount >= 4) {
            finalEl.textContent = '조건부';
            finalEl.className = 'text-xl font-bold text-yellow-600';
        } else {
            finalEl.textContent = '재검토';
            finalEl.className = 'text-xl font-bold text-red-600';
        }
    }
}

// ========================================
// 전체 상태 업데이트
// ========================================
function updateOverallStatus(overall) {
    const statusEl = document.getElementById('korea-senior-overall-status');
    if (!statusEl) return;
    
    if (overall.allPass) {
        statusEl.innerHTML = '<i class="fas fa-check-circle mr-1"></i> 전체 합격';
        statusEl.className = 'bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium';
    } else if (overall.passCount >= 4) {
        statusEl.innerHTML = '<i class="fas fa-exclamation-circle mr-1"></i> 조건부 합격';
        statusEl.className = 'bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium';
    } else {
        statusEl.innerHTML = '<i class="fas fa-times-circle mr-1"></i> 재검토 필요';
        statusEl.className = 'bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium';
    }
}

// ========================================
// 결과 초기화
// ========================================
function resetKoreaSeniorResults() {
    const cardIds = [
        'korea-bg-result', 'korea-char-result', 'korea-rel-result',
        'korea-flow-result', 'korea-pace-result', 'korea-fun-result'
    ];
    
    cardIds.forEach(id => {
        const card = document.getElementById(id);
        if (card) {
            const badge = card.querySelector('.status-badge');
            const detail = card.querySelector('.result-detail');
            
            if (badge) {
                badge.className = 'status-badge bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300 text-xs px-2 py-1 rounded-full';
                badge.textContent = '대기';
            }
            if (detail) {
                detail.innerHTML = '<span class="text-gray-400 dark:text-gray-500">검수를 시작하면 결과가 표시됩니다.</span>';
            }
            card.className = card.className.replace(/bg-\w+-50/g, 'bg-gray-50');
            card.classList.remove('dark:bg-green-900/20', 'dark:bg-yellow-900/20', 'dark:bg-red-900/20');
        }
    });
    
    const summaryIds = [
        'korea-total-score', 'korea-pass-count', 'korea-scene-count',
        'korea-char-count', 'korea-keyword-count', 'korea-dialogue-ratio',
        'korea-runtime', 'korea-final-status'
    ];
    
    summaryIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = '-';
            el.className = 'text-xl font-bold text-gray-800 dark:text-white';
        }
    });
    
    const statusEl = document.getElementById('korea-senior-overall-status');
    if (statusEl) {
        statusEl.innerHTML = '<i class="fas fa-clock mr-1"></i> 검수 대기';
        statusEl.className = 'bg-white/20 text-white px-3 py-1 rounded-full text-sm';
    }
    
    // AI 분석 섹션 숨기기 및 초기화
    const aiSection = document.getElementById('korea-ai-analysis');
    const aiResult = document.getElementById('korea-ai-result');
    if (aiSection) aiSection.classList.add('hidden');
    if (aiResult) aiResult.classList.add('hidden');
    
    // Issues 섹션 숨기기 및 초기화
    const issuesSection = document.getElementById('korea-issues-section');
    if (issuesSection) issuesSection.classList.add('hidden');
    
    // Issues 매니저 초기화
    if (window.issuesUI && window.issuesUI.issuesManager) {
        window.issuesUI.issuesManager.issues = [];
        window.issuesUI.issuesManager.edits = [];
    }
    
    AppState.lastReviewResult = null;
    AppState.analysisResult = null;
    AppState.aiAnalysisResult = null;
    AppState.issuesProcessed = false;
}

// ========================================
// 알림 표시
// ========================================
// ========================================
// 알림 표시 (중복 방지 포함)
// ========================================
function showNotification(message, type, options) {
    type = type || 'info';
    options = options || {};

    var now = Date.now();

    // 중복 방지 (force 옵션으로 무시 가능)
    if (!options.force) {
        if (message === notificationState.lastMessage &&
            (now - notificationState.lastTimestamp) < notificationState.dedupeInterval) {
            return;
        }
        notificationState.lastMessage = message;
        notificationState.lastTimestamp = now;
    }

    var existingNotif = document.querySelector('.notification');
    if (existingNotif) existingNotif.remove();

    var styles = {
        success: 'bg-green-500',
        warning: 'bg-amber-500',
        error: 'bg-red-500',
        info: 'bg-blue-500'
    };

    var icons = {
        success: 'fa-check-circle',
        warning: 'fa-exclamation-triangle',
        error: 'fa-times-circle',
        info: 'fa-info-circle'
    };

    var notification = document.createElement('div');
    notification.className =
        'notification fixed top-4 right-4 ' + styles[type] +
        ' text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 z-50';
    notification.style.animation = 'slideIn 0.3s ease';
    notification.innerHTML =
        '<i class="fas ' + icons[type] + '"></i><span>' + message + '</span>';

    document.body.appendChild(notification);

    setTimeout(function() {
        notification.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(function() {
            if (notification.parentNode) notification.remove();
        }, 300);
    }, 3000);
}

// ========================================
// 샘플 대본
// ========================================
function getSampleScript() {
    return `[씬 1. 서울 강남 아파트 거실 / 낮]

나레이션:
1995년 봄, 서울 강남의 한 아파트 단지.
따스한 햇살이 거실에 가득 들어오는 오후였습니다.
이 집에는 삼대가 함께 살고 있었습니다.

현숙(엄마, 55세, 자상하고 따뜻한 성격):
(식탁에 된장찌개와 김치를 차리며)
우리 창현이, 오늘 회사에서 좋은 일 있었어?
얼굴에 화색이 도네.

창현(아들, 32세, 성실한 회사원):
(넥타이를 풀며 소파에 앉으며)
네, 어머니. 드디어 과장 승진이 확정됐어요!
정말 기쁩니다.

현숙(엄마):
(눈물을 글썽이며)
아이고, 우리 아들! 그동안 정말 고생 많았다.
아버지 살아계셨으면 얼마나 좋아하셨을까...
네 아버지도 하늘에서 기뻐하실 거야.

[씬 2. 같은 아파트 현관 / 잠시 후]

나레이션:
그때, 대학원에서 돌아온 막내딸 영희가 
문을 열고 들어왔습니다.

영희(딸, 28세, 밝고 활발한 대학원생):
(가방을 내려놓으며)
엄마! 오빠! 나 왔어요~
오늘 드디어 석사 논문 제출했어요!

창현(아들):
(반가워하며)
영희야, 축하한다! 오늘 경사가 겹쳤네.

현숙(엄마):
(손뼉을 치며)
아이고, 오늘 정말 좋은 날이구나!
엄마가 맛있는 삼계탕 끓여줄게. 어서 와서 손 씻고 앉아.

[씬 3. 아파트 베란다 / 저녁]

나레이션:
저녁 식사 후, 현숙은 베란다에 나와 
석양을 바라보며 옛 생각에 잠겼습니다.

현숙(엄마):
(혼잣말로)
여보, 당신이 없어도 아이들이 이렇게 잘 자랐어요.
참 기특하죠?
당신도 보고 있죠?

나레이션:
현숙의 눈가에 눈물이 맺혔습니다.
20년 전, 남편을 먼저 보낸 후로
그녀는 홀로 두 아이를 키워왔습니다.
힘들었지만, 후회는 없었습니다.

[씬 4. 강남역 지하철역 앞 / 다음 날 아침]

나레이션:
다음 날 아침, 창현은 평소보다 일찍 집을 나섰습니다.
과장으로서의 첫 출근이었기 때문입니다.

창현(아들, 32세):
(지하철역으로 향하며 혼잣말)
오늘부터 새로운 시작이야.
아버지, 하늘에서 지켜봐 주세요.
열심히 하겠습니다.

[씬 5. 회사 사무실 / 낮]

나레이션:
한편, 회사에서는 예상치 못한 일이 기다리고 있었습니다.

박부장(50대, 카리스마 있는 상사):
창현 과장, 잠깐 내 방으로 와보게.
중요한 이야기가 있어.

창현(아들):
(긴장하며)
네, 부장님. 무슨 일이신지요?

나레이션:
창현의 가슴이 두근거렸습니다.
과연 어떤 이야기가 기다리고 있을까요?

[씬 6. 집 거실 / 저녁]

현숙(엄마):
(걱정스러운 표정으로)
창현아, 오늘 무슨 일 있었니?
표정이 안 좋아 보여.

창현(아들):
(한숨을 쉬며)
어머니, 사실은... 갑자기 해외 파견 제의를 받았어요.
2년간 미국에 가야 할 것 같아요.

현숙(엄마):
(놀라며)
뭐라고? 미국?

영희(딸):
(걱정스럽게)
오빠, 그럼 엄마는 어떡해요?

나레이션:
갑작스러운 소식에 가족들은 당황했습니다.
하지만 현숙은 이내 미소를 지었습니다.

현숙(엄마):
(아들의 손을 잡으며)
창현아, 걱정하지 마. 
이건 좋은 기회야. 당연히 가야지.
엄마는 영희랑 잘 있을 테니까.
네 인생이 중요한 거야.

창현(아들):
(감동하며)
어머니... 정말 괜찮으시겠어요?

현숙(엄마):
(웃으며)
그래, 네 아버지도 분명 응원하실 거야.
우리 아들, 세계로 나가거라!`;
}

// ========================================
// CSS 애니메이션
// ========================================
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    .loading {
        display: inline-block;
        width: 20px;
        height: 20px;
        border: 2px solid #f3f3f3;
        border-top: 2px solid #ef4444;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(styleSheet);

// ========================================
// AI 분석 초기화
// ========================================
// ========================================
// AI 분석 초기화
// ========================================
function initAIAnalysis() {
    var aiBtn = document.getElementById('korea-ai-analyze-btn');
    if (!aiBtn) return;

    aiBtn.addEventListener('click', function(e) {
        if (e && typeof e.preventDefault === 'function') e.preventDefault();

        // 300ms 쓰로틀 (버튼 1회 클릭 = 네트워크 1회 보장 보조)
        if (isButtonThrottled('korea-ai-analyze-btn')) return;

        var scriptEl = document.getElementById('korea-senior-script');
        var scriptValue = scriptEl ? scriptEl.value : '';

        if (!scriptValue || scriptValue.trim().length < 100) {
            showNotification('AI 분석을 위해 최소 100자 이상의 대본이 필요합니다.', 'warning');
            return;
        }

        // 실제 실행(버튼 disabled/문구 원복 책임은 runAIAnalysis finally에서만)
        runAIAnalysis(scriptValue);
    });
}
// ========================================
// AI 분석 실행 (Gemini API)
// ========================================

/**
 * AI 분석 실행
 * - 버튼 클릭 시 1회만 호출
 * - forceGeminiAnalyze()를 통해 API 호출 단일화
 * - 사전 키 체크 제거 (forceGeminiAnalyze에서 처리, 중복 경고 방지)
 */
// ========================================
// AI 분석 실행 (Gemini API) - 버튼 문구 원복/disabled 책임 단일화
// ========================================
async function runAIAnalysis(script) {
    if (AppState.isAIAnalyzing) {
        showNotification('이미 AI 분석이 진행 중입니다.', 'warning');
        return;
    }

    if (!window.geminiAPI) {
        showNotification('Gemini API 모듈이 로드되지 않았습니다.', 'error');
        return;
    }

    AppState.isAIAnalyzing = true;

    var loadingEl = document.getElementById('korea-ai-loading');
    var resultEl = document.getElementById('korea-ai-result');
    var btn = document.getElementById('korea-ai-analyze-btn');

    // 원본 버튼 HTML 저장 → finally에서 원복
    var originalBtnHtml = btn ? btn.innerHTML : '';

    if (loadingEl) loadingEl.classList.remove('hidden');
    if (resultEl) resultEl.classList.add('hidden');

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>분석 중...';
    }

    showNotification('AI가 대본을 심층 분석하고 있습니다...', 'info');

    try {
        var analysis = await window.geminiAPI.analyzeScript(script, 'comprehensive');

        if (analysis && !analysis.error) {
            AppState.aiAnalysisResult = analysis;
            displayAIAnalysisResult(analysis);
            showNotification('✅ AI 심층 분석이 완료되었습니다!', 'success');
        } else {
            var errorMsg = (analysis && analysis.error) ? analysis.error : 'AI 응답 처리 실패';

            // 키 없음은 forceGeminiAnalyze에서 이미 경고 처리 → 여기서 추가 알림 최소화
            if (errorMsg !== 'API 키가 설정되지 않았습니다.') {
                throw new Error(errorMsg);
            }
        }
    } catch (error) {
        console.error('AI 분석 오류:', error);

        // 중복 알림 방지(키 없음/응답 형식 오류는 하위에서 처리될 수 있음)
        if (error && error.message &&
            !error.message.includes('API 키') &&
            !error.message.includes('응답 형식')) {
            showNotification('AI 분석 중 오류 발생: ' + error.message, 'error');
        }

        if (resultEl) {
            resultEl.classList.remove('hidden');
            var summaryEl = document.getElementById('korea-ai-summary');
            if (summaryEl) {
                summaryEl.textContent = '분석 중 오류가 발생했습니다: ' + (error && error.message ? error.message : '');
            }
        }
    } finally {
        AppState.isAIAnalyzing = false;

        if (loadingEl) loadingEl.classList.add('hidden');

        // 버튼 원복 책임은 여기서만
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalBtnHtml;
        }
    }
}


// ========================================
// AI 분석 결과 표시
// ========================================
function displayAIAnalysisResult(analysis) {
    const resultEl = document.getElementById('korea-ai-result');
    if (!resultEl) return;
    
    resultEl.classList.remove('hidden');
    
    // 요약
    const summaryEl = document.getElementById('korea-ai-summary');
    if (summaryEl) {
        summaryEl.textContent = analysis.summary || '요약 정보를 불러올 수 없습니다.';
    }
    
    // 점수들
    const scoreMap = {
        'ai-korea-score': analysis.koreaBackground?.score,
        'ai-char-score': analysis.characterConsistency?.score,
        'ai-rel-score': analysis.relationshipConsistency?.score,
        'ai-flow-score': analysis.storyFlow?.score,
        'ai-pace-score': analysis.pacingSpeed?.score,
        'ai-fun-score': analysis.entertainment?.score
    };
    
    Object.entries(scoreMap).forEach(([id, score]) => {
        const el = document.getElementById(id);
        if (el && score !== undefined) {
            el.textContent = score + '점';
            el.className = 'text-xl font-bold ' + getScoreColorClass(score);
        }
    });
    
    // 주요 개선점
    const issuesEl = document.getElementById('korea-ai-issues');
    if (issuesEl && analysis.topIssues && analysis.topIssues.length > 0) {
        issuesEl.innerHTML = analysis.topIssues
            .map(issue => `<li>${issue}</li>`)
            .join('');
    } else if (issuesEl) {
        issuesEl.innerHTML = '<li>발견된 주요 문제점이 없습니다.</li>';
    }
    
    // 전문가 추천사항
    const recEl = document.getElementById('korea-ai-recommendations');
    if (recEl && analysis.recommendations && analysis.recommendations.length > 0) {
        recEl.innerHTML = analysis.recommendations
            .map(rec => `<li>${rec}</li>`)
            .join('');
    } else if (recEl) {
        recEl.innerHTML = '<li>추가 추천사항이 없습니다.</li>';
    }
    
    // AI 최종 판정
    const verdictEl = document.getElementById('korea-ai-verdict');
    if (verdictEl) {
        const verdict = analysis.verdict || '평가 불가';
        verdictEl.textContent = verdict;
        
        if (verdict.includes('합격')) {
            verdictEl.className = 'font-bold text-lg text-green-600';
        } else if (verdict.includes('조건부')) {
            verdictEl.className = 'font-bold text-lg text-yellow-600';
        } else {
            verdictEl.className = 'font-bold text-lg text-red-600';
        }
    }
    
    // AI 종합 점수
    const overallEl = document.getElementById('korea-ai-overall-score');
    if (overallEl) {
        const score = analysis.overallScore || 0;
        overallEl.textContent = score + '점';
        overallEl.className = 'font-bold text-2xl ' + getScoreColorClass(score);
    }
    
    // 스크롤
    resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ========================================
// 점수별 색상 클래스
// ========================================
function getScoreColorClass(score) {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
}

// ========================================
// 검수 완료 후 AI 분석 영역 표시
// ========================================
function showAIAnalysisSection() {
    const aiSection = document.getElementById('korea-ai-analysis');
    if (aiSection) {
        aiSection.classList.remove('hidden');
    }
}

// ========================================
// 전역 함수 노출
// ========================================
window.ScriptReview = {
    state: AppState,
    showNotification,
    analyzeScript,
    runFullReview,
    resetKoreaSeniorResults,
    runAIAnalysis,
    testGeminiAPI: async function() {
        if (window.testGeminiConnection) {
            return await window.testGeminiConnection();
        }
        return false;
    }
};
// ========================================
// API 키 UI 초기화 및 관리
// ========================================

// 중복 초기화 방지 플래그
let isApiKeyUIInitialized = false;

/**
 * API 키 UI 초기화
 * - localStorage에서 기존 키 로드
 * - 이벤트 바인딩 (열기/닫기/저장/삭제)
 */
function initApiKeyUI() {
    // (3) 중복 리스너 방지 가드
    if (isApiKeyUIInitialized) {
        console.warn('⚠️ API 키 UI가 이미 초기화되었습니다.');
        return;
    }

    const STORAGE_KEY = 'GEMINI_API_KEY';

    // DOM 요소 참조
    const container = document.getElementById('api-key-container');
    const toggleBtn = document.getElementById('api-key-toggle-btn');
    const panel = document.getElementById('api-key-panel');
    const closeBtn = document.getElementById('api-key-close-btn');
    const input = document.getElementById('api-key-input');
    const saveBtn = document.getElementById('api-key-save-btn');
    const deleteBtn = document.getElementById('api-key-delete-btn');
    const statusEl = document.getElementById('api-key-status');
    const statusIcon = document.getElementById('api-key-status-icon');
    const statusText = document.getElementById('api-key-status-text');

    // (1) DOM 요소 전부 null 체크
    if (!container) { console.warn('⚠️ API 키 UI: #api-key-container 요소를 찾을 수 없습니다.'); return; }
    if (!toggleBtn) { console.warn('⚠️ API 키 UI: #api-key-toggle-btn 요소를 찾을 수 없습니다.'); return; }
    if (!panel) { console.warn('⚠️ API 키 UI: #api-key-panel 요소를 찾을 수 없습니다.'); return; }
    if (!closeBtn) { console.warn('⚠️ API 키 UI: #api-key-close-btn 요소를 찾을 수 없습니다.'); return; }
    if (!input) { console.warn('⚠️ API 키 UI: #api-key-input 요소를 찾을 수 없습니다.'); return; }
    if (!saveBtn) { console.warn('⚠️ API 키 UI: #api-key-save-btn 요소를 찾을 수 없습니다.'); return; }
    if (!deleteBtn) { console.warn('⚠️ API 키 UI: #api-key-delete-btn 요소를 찾을 수 없습니다.'); return; }
    if (!statusEl) { console.warn('⚠️ API 키 UI: #api-key-status 요소를 찾을 수 없습니다.'); return; }
    if (!statusIcon) { console.warn('⚠️ API 키 UI: #api-key-status-icon 요소를 찾을 수 없습니다.'); return; }
    if (!statusText) { console.warn('⚠️ API 키 UI: #api-key-status-text 요소를 찾을 수 없습니다.'); return; }

    // (2)(4) 상태 메시지 업데이트 함수 (기본 클래스 유지 + status-* 토글)
    function updateStatus(message, type) {
        type = type || 'info';

        var icons = {
            info: 'fa-info-circle',
            saved: 'fa-check-circle',
            deleted: 'fa-trash-alt',
            error: 'fa-exclamation-triangle'
        };

        statusEl.classList.remove('status-info', 'status-saved', 'status-deleted', 'status-error');
        statusEl.classList.add('status-' + type);

        statusIcon.classList.remove('fa-info-circle', 'fa-check-circle', 'fa-trash-alt', 'fa-exclamation-triangle');
        statusIcon.classList.add(icons[type] || icons.info);

        statusText.textContent = message;
    }

    function updateButtonState() {
        var hasKey = !!localStorage.getItem(STORAGE_KEY);
        if (hasKey) {
            toggleBtn.classList.add('has-key');
            toggleBtn.title = 'API 키 설정됨';
        } else {
            toggleBtn.classList.remove('has-key');
            toggleBtn.title = 'API 키 설정';
        }
    }

    function openPanel() {
        panel.classList.remove('hidden', 'closing');
        input.focus();
    }

    function closePanel() {
        panel.classList.add('closing');
        setTimeout(function() {
            panel.classList.add('hidden');
            panel.classList.remove('closing');
        }, 150);
    }

    function togglePanel(e) {
        e.stopPropagation();
        if (panel.classList.contains('hidden')) openPanel();
        else closePanel();
    }

    function handlePanelClick(e) {
        e.stopPropagation();
    }

    function loadSavedKey() {
        var savedKey = localStorage.getItem(STORAGE_KEY);
        if (savedKey) {
            input.value = savedKey;
            updateStatus('API 키가 저장되어 있습니다.', 'saved');
        } else {
            input.value = '';
            updateStatus('API 키가 설정되지 않았습니다.', 'info');
        }
        updateButtonState();
    }

    function handleSave(e) {
        e.preventDefault();
        e.stopPropagation();

        var keyValue = input.value.trim();

        if (!keyValue) {
            updateStatus('API 키를 입력해주세요.', 'error');
            input.focus();
            return;
        }

        if (!keyValue.startsWith('AIza')) {
            updateStatus('올바른 API 키 형식이 아닙니다. (AIza...)', 'error');
            input.focus();
            return;
        }

        localStorage.setItem(STORAGE_KEY, keyValue);
        updateStatus('저장 완료! API 키가 저장되었습니다.', 'saved');
        updateButtonState();
        console.log('✅ Gemini API 키 저장 완료');
    }

    function handleDelete(e) {
        e.preventDefault();
        e.stopPropagation();

        localStorage.removeItem(STORAGE_KEY);
        input.value = '';
        updateStatus('삭제 완료! API 키가 제거되었습니다.', 'deleted');
        updateButtonState();
        console.log('🗑️ Gemini API 키 삭제 완료');
    }

    function handleClose(e) {
        e.preventDefault();
        e.stopPropagation();
        closePanel();
    }

    function handleOutsideClick(e) {
        if (panel.classList.contains('hidden')) return;
        if (container.contains(e.target)) return;
        closePanel();
    }

    function handleEscKey(e) {
        if (e.key === 'Escape' && !panel.classList.contains('hidden')) closePanel();
    }

    function handleInputKeydown(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSave(e);
        }
    }

    toggleBtn.addEventListener('click', togglePanel);
    panel.addEventListener('click', handlePanelClick);
    closeBtn.addEventListener('click', handleClose);
    saveBtn.addEventListener('click', handleSave);
    deleteBtn.addEventListener('click', handleDelete);
    input.addEventListener('keydown', handleInputKeydown);
    document.addEventListener('click', handleOutsideClick);
    document.addEventListener('keydown', handleEscKey);

    loadSavedKey();

    isApiKeyUIInitialized = true;

    console.log('✅ API 키 UI 초기화 완료');
}
