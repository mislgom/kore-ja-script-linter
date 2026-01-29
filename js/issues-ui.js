/**
 * Issues UI Module
 * 오류 리스트, 필터, 하이라이트, 인라인 편집 UI
 * Script Review Pro vNext
 */

// ========================================
// Issues UI Controller
// ========================================
class IssuesUIController {
    constructor() {
        this.issuesManager = new IssuesManager();
        this.issueExtractor = new IssueExtractor(this.issuesManager);
        this.currentEditingIssue = null;
        this.highlightedRanges = [];
        this.isInitialized = false;
    }

    /**
     * UI 초기화
     */
    initialize() {
        this.bindEvents();
        this.isInitialized = true;
        console.log('✅ Issues UI Controller 초기화 완료');
    }

    /**
     * 이벤트 바인딩
     */
    bindEvents() {
        // 필터 토글 이벤트
        document.addEventListener('click', (e) => {
            if (e.target.closest('.filter-toggle')) {
                this.handleFilterToggle(e.target.closest('.filter-toggle'));
            }
            if (e.target.closest('.issue-card')) {
                this.handleIssueCardClick(e.target.closest('.issue-card'));
            }
            if (e.target.closest('.issue-action-btn')) {
                this.handleIssueAction(e.target.closest('.issue-action-btn'));
            }
            if (e.target.closest('.sort-btn')) {
                this.handleSortChange(e.target.closest('.sort-btn'));
            }
        });

        // 인라인 편집 저장
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.currentEditingIssue) {
                this.cancelInlineEdit();
            }
        });
    }

    /**
     * 검수 결과로 Issues 생성
     */
    processReviewResults(results, script) {
        this.issuesManager.initialize(script);
        this.issueExtractor.extractFromReviewResults(results, script);
        
        // UI 업데이트
        this.renderIssuesPanel();
        this.updateStatistics();
        this.applyHighlights();
        
        return this.issuesManager.issues;
    }

    /**
     * Issues 패널 렌더링
     */
    renderIssuesPanel() {
        const container = document.getElementById('issues-panel');
        if (!container) return;

        const issues = this.issuesManager.getFilteredIssues();
        const stats = this.issuesManager.getStatistics();

        container.innerHTML = `
            <div class="issues-panel-content">
                <!-- 헤더 -->
                <div class="flex items-center justify-between mb-4">
                    <h3 class="font-semibold text-gray-800 dark:text-white flex items-center">
                        <i class="fas fa-exclamation-triangle text-red-500 mr-2"></i>
                        발견된 오류
                        <span class="ml-2 bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300 px-2 py-1 rounded-full text-xs">
                            ${stats.byStatus.open}건
                        </span>
                    </h3>
                    <div class="flex items-center space-x-2">
                        <button class="sort-btn text-xs px-2 py-1 rounded ${this.issuesManager.sortBy === 'position' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'} dark:bg-gray-700 dark:text-gray-300" data-sort="position">
                            <i class="fas fa-sort-amount-down mr-1"></i>위치순
                        </button>
                        <button class="sort-btn text-xs px-2 py-1 rounded ${this.issuesManager.sortBy === 'severity' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'} dark:bg-gray-700 dark:text-gray-300" data-sort="severity">
                            <i class="fas fa-exclamation mr-1"></i>심각도순
                        </button>
                    </div>
                </div>

                <!-- 필터 -->
                <div class="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div class="text-xs text-gray-500 dark:text-gray-400 mb-2">카테고리 필터</div>
                    <div class="flex flex-wrap gap-2 mb-3">
                        ${this.renderCategoryFilters()}
                    </div>
                    <div class="text-xs text-gray-500 dark:text-gray-400 mb-2">심각도 필터</div>
                    <div class="flex flex-wrap gap-2">
                        ${this.renderSeverityFilters()}
                    </div>
                </div>

                <!-- 오류 리스트 -->
                <div class="issues-list space-y-3 max-h-[500px] overflow-y-auto pr-2">
                    ${issues.length > 0 ? issues.map(issue => this.renderIssueCard(issue)).join('') : `
                        <div class="text-center py-8 text-gray-400 dark:text-gray-500">
                            <i class="fas fa-check-circle text-4xl mb-3 text-green-400"></i>
                            <p>발견된 오류가 없습니다!</p>
                        </div>
                    `}
                </div>

                <!-- 다운로드 버튼 -->
                ${stats.total > 0 ? `
                <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div class="flex space-x-2">
                        <button id="download-reviewed-btn" class="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                            <i class="fas fa-download mr-2"></i>수정본 다운로드
                        </button>
                        <button id="download-vrew-btn" class="flex-1 bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                            <i class="fas fa-video mr-2"></i>Vrew용 다운로드
                        </button>
                    </div>
                </div>
                ` : ''}
            </div>
        `;

        // 다운로드 버튼 이벤트
        this.bindDownloadButtons();
    }

    /**
     * 카테고리 필터 렌더링
     */
    renderCategoryFilters() {
        return Object.values(IssueCategories).map(cat => {
            const isActive = this.issuesManager.filters.categories.includes(cat.id);
            const count = this.issuesManager.issues.filter(i => i.category === cat.id && i.status !== 'ignored').length;
            
            return `
                <button class="filter-toggle category-filter flex items-center px-2 py-1 rounded text-xs font-medium transition-all
                    ${isActive 
                        ? `bg-${cat.color}-100 text-${cat.color}-700 dark:bg-${cat.color}-900 dark:text-${cat.color}-300 ring-2 ring-${cat.color}-300` 
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 opacity-50'}"
                    data-filter-type="category" data-filter-value="${cat.id}">
                    <i class="fas ${cat.icon} mr-1"></i>
                    ${cat.name}
                    <span class="ml-1 bg-white dark:bg-gray-800 px-1 rounded">${count}</span>
                </button>
            `;
        }).join('');
    }

    /**
     * 심각도 필터 렌더링
     */
    renderSeverityFilters() {
        return Object.values(SeverityLevels).map(sev => {
            const isActive = this.issuesManager.filters.severities.includes(sev.id);
            const count = this.issuesManager.issues.filter(i => i.severity === sev.id && i.status !== 'ignored').length;
            
            return `
                <button class="filter-toggle severity-filter flex items-center px-2 py-1 rounded text-xs font-medium transition-all
                    ${isActive 
                        ? `bg-${sev.color}-100 text-${sev.color}-700 dark:bg-${sev.color}-900 dark:text-${sev.color}-300 ring-2 ring-${sev.color}-300` 
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 opacity-50'}"
                    data-filter-type="severity" data-filter-value="${sev.id}">
                    <i class="fas fa-circle text-${sev.color}-500 mr-1" style="font-size: 8px;"></i>
                    ${sev.name}
                    <span class="ml-1 bg-white dark:bg-gray-800 px-1 rounded">${count}</span>
                </button>
            `;
        }).join('');
    }

    /**
     * 오류 카드 렌더링
     */
    renderIssueCard(issue) {
        const category = IssueCategories[issue.category] || IssueCategories.SYS;
        const severity = SeverityLevels[issue.severity] || SeverityLevels.MED;
        const confidence = ConfidenceLevels[issue.confidence] || ConfidenceLevels.MID;

        return `
            <div class="issue-card bg-white dark:bg-gray-700 rounded-lg border-l-4 border-${severity.color}-500 p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                 data-issue-id="${issue.id}" data-start="${issue.startIndex}" data-end="${issue.endIndex}">
                
                <!-- 헤더 -->
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center space-x-2">
                        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-${category.color}-100 text-${category.color}-700 dark:bg-${category.color}-900 dark:text-${category.color}-300">
                            <i class="fas ${category.icon} mr-1"></i>
                            ${category.name}
                        </span>
                        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-${severity.color}-100 text-${severity.color}-700 dark:bg-${severity.color}-900 dark:text-${severity.color}-300">
                            ${severity.name}
                        </span>
                    </div>
                    <span class="text-xs text-gray-400 dark:text-gray-500">
                        <i class="fas fa-check-circle mr-1 text-${confidence.color}-500"></i>
                        ${confidence.name}
                    </span>
                </div>

                <!-- 메시지 -->
                <p class="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    ${issue.message}
                </p>

                <!-- 스니펫 -->
                <div class="bg-gray-50 dark:bg-gray-800 rounded p-2 mb-2 text-xs font-mono text-gray-600 dark:text-gray-400 max-h-16 overflow-hidden">
                    <span class="text-gray-400">...</span>${this.escapeHtml(issue.snippet.substring(0, 100))}${issue.snippet.length > 100 ? '...' : ''}
                </div>

                <!-- 제안 -->
                ${issue.suggestion ? `
                    <div class="flex items-start text-xs text-green-600 dark:text-green-400 mb-2">
                        <i class="fas fa-lightbulb mt-0.5 mr-1"></i>
                        <span>${issue.suggestion}</span>
                    </div>
                ` : ''}

                <!-- 액션 버튼 -->
                <div class="flex space-x-2 mt-2 pt-2 border-t border-gray-100 dark:border-gray-600">
                    <button class="issue-action-btn flex-1 text-xs px-2 py-1.5 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800 transition-colors"
                            data-action="edit" data-issue-id="${issue.id}">
                        <i class="fas fa-edit mr-1"></i>이 오류 수정
                    </button>
                    <button class="issue-action-btn text-xs px-2 py-1.5 rounded bg-gray-50 text-gray-500 hover:bg-gray-100 dark:bg-gray-600 dark:text-gray-400 dark:hover:bg-gray-500 transition-colors"
                            data-action="ignore" data-issue-id="${issue.id}">
                        <i class="fas fa-eye-slash mr-1"></i>무시
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * 필터 토글 처리
     */
    handleFilterToggle(btn) {
        const filterType = btn.dataset.filterType;
        const filterValue = btn.dataset.filterValue;

        if (filterType === 'category') {
            const idx = this.issuesManager.filters.categories.indexOf(filterValue);
            if (idx > -1) {
                this.issuesManager.filters.categories.splice(idx, 1);
            } else {
                this.issuesManager.filters.categories.push(filterValue);
            }
        } else if (filterType === 'severity') {
            const idx = this.issuesManager.filters.severities.indexOf(filterValue);
            if (idx > -1) {
                this.issuesManager.filters.severities.splice(idx, 1);
            } else {
                this.issuesManager.filters.severities.push(filterValue);
            }
        }

        this.renderIssuesPanel();
        this.applyHighlights();
    }

    /**
     * 정렬 변경 처리
     */
    handleSortChange(btn) {
        const sortBy = btn.dataset.sort;
        this.issuesManager.sortBy = sortBy;
        this.renderIssuesPanel();
    }

    /**
     * 오류 카드 클릭 처리
     */
    handleIssueCardClick(card) {
        const issueId = card.dataset.issueId;
        const startIndex = parseInt(card.dataset.start);
        const endIndex = parseInt(card.dataset.end);

        // 스크립트 영역으로 스크롤 및 하이라이트
        this.scrollToPosition(startIndex);
        this.highlightRange(startIndex, endIndex, true);
    }

    /**
     * 오류 액션 처리
     */
    handleIssueAction(btn) {
        const action = btn.dataset.action;
        const issueId = btn.dataset.issueId;

        if (action === 'edit') {
            this.openInlineEditor(issueId);
        } else if (action === 'ignore') {
            this.ignoreIssue(issueId);
        }
    }

    /**
     * 인라인 편집기 열기
     */
    openInlineEditor(issueId) {
        const issue = this.issuesManager.issues.find(i => i.id === issueId);
        if (!issue) return;

        this.currentEditingIssue = issue;

        // 편집 모달 표시
        const modal = document.createElement('div');
        modal.id = 'inline-editor-modal';
        modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
                <!-- 헤더 -->
                <div class="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                    <div class="flex items-center justify-between">
                        <h3 class="text-lg font-bold text-white">
                            <i class="fas fa-edit mr-2"></i>오류 수정
                        </h3>
                        <button id="close-editor-btn" class="text-white/70 hover:text-white">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                </div>

                <!-- 본문 -->
                <div class="p-6">
                    <!-- 오류 정보 -->
                    <div class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                        <div class="flex items-center mb-2">
                            <span class="text-sm font-medium text-red-700 dark:text-red-300">
                                <i class="fas fa-exclamation-triangle mr-1"></i>
                                ${issue.message}
                            </span>
                        </div>
                        ${issue.reason ? `<p class="text-xs text-red-600 dark:text-red-400">${issue.reason}</p>` : ''}
                    </div>

                    <!-- 원본 텍스트 -->
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <i class="fas fa-file-alt mr-1"></i>원본 텍스트
                        </label>
                        <div class="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 text-sm font-mono text-gray-700 dark:text-gray-300 max-h-32 overflow-y-auto">
                            ${this.escapeHtml(this.issuesManager.currentScript.substring(issue.startIndex, issue.endIndex))}
                        </div>
                    </div>

                    <!-- 수정 텍스트 -->
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <i class="fas fa-pen mr-1"></i>수정 텍스트
                        </label>
                        <textarea id="edit-text-area" 
                            class="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg font-mono text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
                            rows="5">${this.escapeHtml(this.issuesManager.currentScript.substring(issue.startIndex, issue.endIndex))}</textarea>
                    </div>

                    <!-- 제안 -->
                    ${issue.suggestion ? `
                        <div class="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                            <div class="flex items-center text-sm text-green-700 dark:text-green-300">
                                <i class="fas fa-lightbulb mr-2"></i>
                                <span><strong>제안:</strong> ${issue.suggestion}</span>
                            </div>
                        </div>
                    ` : ''}
                </div>

                <!-- 푸터 -->
                <div class="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 flex justify-between">
                    <div class="flex items-center">
                        <input type="checkbox" id="recheck-after-save" class="mr-2" checked>
                        <label for="recheck-after-save" class="text-sm text-gray-600 dark:text-gray-400">저장 후 부분 재검사</label>
                    </div>
                    <div class="flex space-x-2">
                        <button id="cancel-edit-btn" class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors">
                            취소
                        </button>
                        <button id="save-edit-btn" class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors">
                            <i class="fas fa-save mr-1"></i>저장
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 이벤트 바인딩
        document.getElementById('close-editor-btn').addEventListener('click', () => this.cancelInlineEdit());
        document.getElementById('cancel-edit-btn').addEventListener('click', () => this.cancelInlineEdit());
        document.getElementById('save-edit-btn').addEventListener('click', () => this.saveInlineEdit());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.cancelInlineEdit();
        });
    }

    /**
     * 인라인 편집 취소
     */
    cancelInlineEdit() {
        const modal = document.getElementById('inline-editor-modal');
        if (modal) modal.remove();
        this.currentEditingIssue = null;
    }

    /**
     * 인라인 편집 저장
     */
    saveInlineEdit() {
        if (!this.currentEditingIssue) return;

        const newText = document.getElementById('edit-text-area').value;
        const recheck = document.getElementById('recheck-after-save').checked;

        // 수정 적용
        this.issuesManager.applyEdit(this.currentEditingIssue.id, newText);

        // 모달 닫기
        this.cancelInlineEdit();

        // UI 업데이트
        this.renderIssuesPanel();
        this.updateStatistics();
        this.updateScriptDisplay();
        this.applyHighlights();

        // 알림
        if (window.showNotification) {
            window.showNotification('✅ 수정이 저장되었습니다.', 'success');
        }

        // 부분 재검사
        if (recheck) {
            this.runPartialRecheck();
        }
    }

    /**
     * 오류 무시 처리
     */
    ignoreIssue(issueId) {
        this.issuesManager.ignoreIssue(issueId);
        this.renderIssuesPanel();
        this.updateStatistics();
        this.applyHighlights();

        if (window.showNotification) {
            window.showNotification('오류가 무시 처리되었습니다.', 'info');
        }
    }

    /**
     * 부분 재검사
     */
    async runPartialRecheck() {
        if (window.showNotification) {
            window.showNotification('부분 재검사 진행 중...', 'info');
        }

        // 현재 스크립트로 재검수
        const script = this.issuesManager.getCurrentScript();
        
        // textarea 업데이트
        const textarea = document.getElementById('korea-senior-script');
        if (textarea) {
            textarea.value = script;
        }

        // 간단한 지연 후 통계 업데이트
        await new Promise(resolve => setTimeout(resolve, 500));

        if (window.showNotification) {
            window.showNotification('✅ 재검사 완료', 'success');
        }
    }

    /**
     * 스크립트 표시 업데이트
     */
    updateScriptDisplay() {
        const textarea = document.getElementById('korea-senior-script');
        if (textarea) {
            textarea.value = this.issuesManager.getCurrentScript();
            
            // 글자수 카운터 업데이트
            const counter = document.getElementById('korea-char-counter');
            if (counter) {
                counter.textContent = `${textarea.value.length.toLocaleString()}자 / 무제한`;
            }
        }
    }

    /**
     * 통계 업데이트
     */
    updateStatistics() {
        const stats = this.issuesManager.getStatistics();
        
        // 통계 표시 요소가 있으면 업데이트
        const statsContainer = document.getElementById('issues-stats');
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div class="bg-gray-100 dark:bg-gray-700 rounded p-2 text-center">
                        <p class="text-lg font-bold text-gray-800 dark:text-white">${stats.total}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">전체 오류</p>
                    </div>
                    <div class="bg-green-100 dark:bg-green-900 rounded p-2 text-center">
                        <p class="text-lg font-bold text-green-600 dark:text-green-400">${stats.byStatus.fixed}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">수정됨</p>
                    </div>
                    <div class="bg-red-100 dark:bg-red-900 rounded p-2 text-center">
                        <p class="text-lg font-bold text-red-600 dark:text-red-400">${stats.byStatus.open}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">미해결</p>
                    </div>
                    <div class="bg-gray-100 dark:bg-gray-700 rounded p-2 text-center">
                        <p class="text-lg font-bold text-gray-600 dark:text-gray-400">${stats.byStatus.ignored}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">무시됨</p>
                    </div>
                </div>
            `;
        }
    }

    /**
     * 하이라이트 적용
     */
    applyHighlights() {
        const issues = this.issuesManager.getFilteredIssues();
        const textarea = document.getElementById('korea-senior-script');
        
        if (!textarea) return;

        // 하이라이트 오버레이 생성/업데이트
        let overlay = document.getElementById('highlight-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'highlight-overlay';
            overlay.className = 'highlight-overlay pointer-events-none absolute inset-0 overflow-hidden';
            textarea.parentElement.style.position = 'relative';
            textarea.parentElement.appendChild(overlay);
        }

        // 하이라이트 데이터 저장
        this.highlightedRanges = issues.map(issue => ({
            start: issue.startIndex,
            end: issue.endIndex,
            severity: issue.severity,
            issueId: issue.id
        }));
    }

    /**
     * 특정 범위 하이라이트
     */
    highlightRange(start, end, focus = false) {
        const textarea = document.getElementById('korea-senior-script');
        if (!textarea) return;

        if (focus) {
            textarea.focus();
            textarea.setSelectionRange(start, end);
        }
    }

    /**
     * 특정 위치로 스크롤
     */
    scrollToPosition(position) {
        const textarea = document.getElementById('korea-senior-script');
        if (!textarea) return;

        // 대략적인 줄 계산
        const text = textarea.value.substring(0, position);
        const lineCount = (text.match(/\n/g) || []).length;
        const lineHeight = 24; // 대략적인 줄 높이
        
        textarea.scrollTop = Math.max(0, lineCount * lineHeight - textarea.clientHeight / 2);
    }

    /**
     * 다운로드 버튼 이벤트 바인딩
     */
    bindDownloadButtons() {
        const reviewedBtn = document.getElementById('download-reviewed-btn');
        const vrewBtn = document.getElementById('download-vrew-btn');

        if (reviewedBtn) {
            reviewedBtn.addEventListener('click', () => {
                const script = this.issuesManager.getCurrentScript();
                const fileName = ScriptDownloader.downloadReviewedTXT(script, 'script');
                if (window.showNotification) {
                    window.showNotification(`✅ ${fileName} 다운로드 완료`, 'success');
                }
            });
        }

        if (vrewBtn) {
            vrewBtn.addEventListener('click', () => {
                this.showVrewDownloadOptions();
            });
        }
    }

    /**
     * Vrew 다운로드 옵션 표시
     */
    showVrewDownloadOptions() {
        const modal = document.createElement('div');
        modal.id = 'vrew-options-modal';
        modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md mx-4">
                <div class="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4 rounded-t-xl">
                    <h3 class="text-lg font-bold text-white">
                        <i class="fas fa-video mr-2"></i>Vrew 다운로드 옵션
                    </h3>
                </div>
                <div class="p-6">
                    <div class="space-y-4">
                        <label class="flex items-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                            <input type="radio" name="vrew-mode" value="line" class="mr-3" checked>
                            <div>
                                <p class="font-medium text-gray-800 dark:text-white">1줄 = 1클립</p>
                                <p class="text-xs text-gray-500 dark:text-gray-400">기존 줄바꿈 유지</p>
                            </div>
                        </label>
                        <label class="flex items-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                            <input type="radio" name="vrew-mode" value="sentence" class="mr-3">
                            <div>
                                <p class="font-medium text-gray-800 dark:text-white">문장 단위 + 자동 개행</p>
                                <p class="text-xs text-gray-500 dark:text-gray-400">최대 글자수에 맞춰 자동 줄바꿈</p>
                            </div>
                        </label>
                        <div id="max-chars-option" class="hidden pl-8">
                            <label class="block text-sm text-gray-600 dark:text-gray-400 mb-1">최대 글자수</label>
                            <input type="number" id="max-chars-input" value="20" min="10" max="50" 
                                class="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-center dark:bg-gray-700 dark:text-white">
                        </div>
                    </div>
                </div>
                <div class="px-6 py-4 bg-gray-50 dark:bg-gray-700 rounded-b-xl flex justify-end space-x-2">
                    <button id="cancel-vrew-btn" class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg">
                        취소
                    </button>
                    <button id="confirm-vrew-btn" class="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium">
                        <i class="fas fa-download mr-1"></i>다운로드
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 이벤트
        const sentenceRadio = modal.querySelector('input[value="sentence"]');
        const maxCharsOption = document.getElementById('max-chars-option');
        
        modal.querySelectorAll('input[name="vrew-mode"]').forEach(radio => {
            radio.addEventListener('change', () => {
                maxCharsOption.classList.toggle('hidden', !sentenceRadio.checked);
            });
        });

        document.getElementById('cancel-vrew-btn').addEventListener('click', () => modal.remove());
        document.getElementById('confirm-vrew-btn').addEventListener('click', () => {
            const mode = modal.querySelector('input[name="vrew-mode"]:checked').value;
            const maxChars = parseInt(document.getElementById('max-chars-input').value) || 20;
            
            const script = this.issuesManager.getCurrentScript();
            const options = mode === 'sentence' ? { mode: 'sentence', maxChars } : {};
            const fileName = ScriptDownloader.downloadVrewTXT(script, 'script', options);
            
            if (window.showNotification) {
                window.showNotification(`✅ ${fileName} 다운로드 완료`, 'success');
            }
            modal.remove();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    /**
     * HTML 이스케이프
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// ========================================
// 전역 인스턴스 및 노출
// ========================================
const issuesUI = new IssuesUIController();

window.IssuesUIController = IssuesUIController;
window.issuesUI = issuesUI;

// DOM 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    issuesUI.initialize();
});

console.log('✅ Issues UI 모듈 로드 완료');
