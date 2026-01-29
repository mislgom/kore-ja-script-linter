/**
 * Performance Utilities Module
 * 10만자+ 대본 처리를 위한 성능 최적화 유틸리티
 * Script Review Pro vNext
 */

// ========================================
// 청크 처리 유틸리티
// ========================================
class ChunkProcessor {
    constructor(options = {}) {
        this.chunkSize = options.chunkSize || 10000; // 기본 1만자 단위
        this.delayBetweenChunks = options.delay || 10; // 청크 간 지연 (ms)
        this.onProgress = options.onProgress || null;
    }

    /**
     * 텍스트를 청크로 분할
     */
    splitIntoChunks(text, preserveLines = true) {
        if (text.length <= this.chunkSize) {
            return [{ text, startIndex: 0, endIndex: text.length }];
        }

        const chunks = [];
        let startIndex = 0;

        while (startIndex < text.length) {
            let endIndex = Math.min(startIndex + this.chunkSize, text.length);

            // 줄 보존 모드: 줄 끝에서 자르기
            if (preserveLines && endIndex < text.length) {
                const lastNewline = text.lastIndexOf('\n', endIndex);
                if (lastNewline > startIndex) {
                    endIndex = lastNewline + 1;
                }
            }

            chunks.push({
                text: text.substring(startIndex, endIndex),
                startIndex,
                endIndex
            });

            startIndex = endIndex;
        }

        return chunks;
    }

    /**
     * 청크별로 함수 실행 (비동기, 진행률 콜백)
     */
    async processChunks(chunks, processor) {
        const results = [];
        const total = chunks.length;

        for (let i = 0; i < total; i++) {
            const chunk = chunks[i];
            
            try {
                const result = await processor(chunk, i, total);
                results.push(result);
            } catch (error) {
                console.error(`청크 ${i + 1}/${total} 처리 오류:`, error);
                results.push({ error: error.message, chunkIndex: i });
            }

            // 진행률 콜백
            if (this.onProgress) {
                this.onProgress({
                    current: i + 1,
                    total,
                    percent: Math.round(((i + 1) / total) * 100)
                });
            }

            // UI 블로킹 방지를 위한 지연
            if (i < total - 1 && this.delayBetweenChunks > 0) {
                await this.delay(this.delayBetweenChunks);
            }
        }

        return results;
    }

    /**
     * 지연 유틸리티
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 결과 병합
     */
    mergeResults(results, merger) {
        if (typeof merger === 'function') {
            return merger(results);
        }

        // 기본 병합: 배열 합치기
        if (Array.isArray(results[0])) {
            return results.flat();
        }

        // 객체 병합
        if (typeof results[0] === 'object') {
            return results.reduce((acc, curr) => {
                Object.keys(curr).forEach(key => {
                    if (Array.isArray(curr[key])) {
                        acc[key] = (acc[key] || []).concat(curr[key]);
                    } else if (typeof curr[key] === 'number') {
                        acc[key] = (acc[key] || 0) + curr[key];
                    } else {
                        acc[key] = curr[key];
                    }
                });
                return acc;
            }, {});
        }

        return results;
    }
}

// ========================================
// 키워드 매칭 최적화
// ========================================
class OptimizedKeywordMatcher {
    constructor(keywords) {
        this.keywords = keywords;
        this.keywordSet = new Set(keywords);
        this.keywordMap = this.buildKeywordMap(keywords);
        this.regex = this.buildRegex(keywords);
    }

    /**
     * 첫 글자 기반 맵 생성
     */
    buildKeywordMap(keywords) {
        const map = {};
        keywords.forEach(keyword => {
            const firstChar = keyword.charAt(0);
            if (!map[firstChar]) {
                map[firstChar] = [];
            }
            map[firstChar].push(keyword);
        });
        return map;
    }

    /**
     * 정규식 생성 (키워드 OR 패턴)
     */
    buildRegex(keywords) {
        if (keywords.length === 0) return null;
        // 긴 키워드 먼저 매칭하도록 정렬
        const sorted = [...keywords].sort((a, b) => b.length - a.length);
        const escaped = sorted.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        return new RegExp(`(${escaped.join('|')})`, 'g');
    }

    /**
     * 텍스트에서 키워드 찾기 (최적화)
     */
    findAll(text) {
        if (!this.regex) return [];
        
        const matches = [];
        let match;
        
        while ((match = this.regex.exec(text)) !== null) {
            matches.push({
                keyword: match[1],
                index: match.index,
                length: match[1].length
            });
        }

        return matches;
    }

    /**
     * 키워드 존재 여부만 확인 (빠름)
     */
    hasAny(text) {
        if (!this.regex) return false;
        return this.regex.test(text);
    }

    /**
     * 키워드 개수 카운트
     */
    count(text) {
        if (!this.regex) return 0;
        const matches = text.match(this.regex);
        return matches ? matches.length : 0;
    }
}

// ========================================
// 진행률 표시 유틸리티
// ========================================
class ProgressIndicator {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.progressBar = null;
        this.progressText = null;
        this.isVisible = false;
    }

    /**
     * 진행률 UI 생성
     */
    create() {
        if (!this.container) return;

        this.progressBar = document.createElement('div');
        this.progressBar.className = 'progress-indicator hidden';
        this.progressBar.innerHTML = `
            <div class="flex items-center justify-between mb-2">
                <span class="text-sm text-gray-600 dark:text-gray-400">처리 중...</span>
                <span class="progress-percent text-sm font-medium text-blue-600">0%</span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div class="progress-fill bg-blue-500 h-2 rounded-full transition-all duration-200" style="width: 0%"></div>
            </div>
            <div class="progress-status text-xs text-gray-500 dark:text-gray-400 mt-1"></div>
        `;
        
        this.container.insertBefore(this.progressBar, this.container.firstChild);
        this.progressText = this.progressBar.querySelector('.progress-percent');
        this.progressFill = this.progressBar.querySelector('.progress-fill');
        this.progressStatus = this.progressBar.querySelector('.progress-status');
    }

    /**
     * 진행률 표시
     */
    show() {
        if (!this.progressBar) this.create();
        if (this.progressBar) {
            this.progressBar.classList.remove('hidden');
            this.isVisible = true;
        }
    }

    /**
     * 진행률 숨기기
     */
    hide() {
        if (this.progressBar) {
            this.progressBar.classList.add('hidden');
            this.isVisible = false;
        }
    }

    /**
     * 진행률 업데이트
     */
    update(percent, status = '') {
        if (!this.isVisible) this.show();
        
        if (this.progressText) {
            this.progressText.textContent = `${percent}%`;
        }
        if (this.progressFill) {
            this.progressFill.style.width = `${percent}%`;
        }
        if (this.progressStatus && status) {
            this.progressStatus.textContent = status;
        }
    }

    /**
     * 완료 표시
     */
    complete(message = '완료!') {
        this.update(100, message);
        setTimeout(() => this.hide(), 1500);
    }
}

// ========================================
// 안전한 실행 래퍼 (try/catch + 폴백)
// ========================================
class SafeExecutor {
    /**
     * 안전하게 함수 실행 (실패 시 폴백)
     */
    static async execute(fn, fallback = null, context = 'unknown') {
        try {
            return await fn();
        } catch (error) {
            console.error(`[${context}] 실행 오류:`, error);
            
            // SYS 오류 객체 반환
            if (window.issuesUI && window.issuesUI.issuesManager) {
                window.issuesUI.issuesManager.addIssue({
                    category: 'SYS',
                    ruleId: `SYS-${context.toUpperCase()}-001`,
                    severity: 'LOW',
                    confidence: 'HIGH',
                    startIndex: 0,
                    endIndex: 0,
                    message: `${context} 처리 중 오류 발생`,
                    reason: error.message,
                    suggestion: '수동으로 검토해주세요.'
                });
            }

            return fallback;
        }
    }

    /**
     * 정규식 안전 실행
     */
    static safeRegex(pattern, text, fallback = []) {
        try {
            const matches = [];
            let match;
            const regex = typeof pattern === 'string' ? new RegExp(pattern, 'g') : pattern;
            
            // 무한 루프 방지
            let count = 0;
            const maxIterations = 10000;
            
            while ((match = regex.exec(text)) !== null && count < maxIterations) {
                matches.push(match);
                count++;
            }
            
            if (count >= maxIterations) {
                console.warn('정규식 매칭 최대 횟수 초과');
            }
            
            return matches;
        } catch (error) {
            console.error('정규식 실행 오류:', error);
            return fallback;
        }
    }

    /**
     * JSON 파싱 안전 실행
     */
    static safeJSONParse(text, fallback = null) {
        try {
            return JSON.parse(text);
        } catch (error) {
            console.error('JSON 파싱 오류:', error);
            return fallback;
        }
    }
}

// ========================================
// 메모리 관리 유틸리티
// ========================================
class MemoryManager {
    /**
     * 대용량 문자열 처리 시 메모리 정리
     */
    static cleanup() {
        // 가비지 컬렉션 힌트 (브라우저가 무시할 수 있음)
        if (window.gc) {
            window.gc();
        }
    }

    /**
     * 문자열 인턴 (중복 문자열 메모리 절약)
     */
    static internString(str) {
        // 작은 문자열만 인턴
        if (str.length > 100) return str;
        return String(str);
    }

    /**
     * 대용량 배열 청크 처리
     */
    static processLargeArray(array, processor, chunkSize = 1000) {
        const results = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            const chunk = array.slice(i, i + chunkSize);
            results.push(...chunk.map(processor));
        }
        return results;
    }
}

// ========================================
// 전역 노출
// ========================================
window.ChunkProcessor = ChunkProcessor;
window.OptimizedKeywordMatcher = OptimizedKeywordMatcher;
window.ProgressIndicator = ProgressIndicator;
window.SafeExecutor = SafeExecutor;
window.MemoryManager = MemoryManager;

console.log('✅ Performance Utils 모듈 로드 완료');
