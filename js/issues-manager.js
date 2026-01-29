/**
 * Issues Manager Module
 * 오류 추출, 관리, 편집을 위한 핵심 모듈
 * Script Review Pro vNext
 */

// ========================================
// 상수 정의
// ========================================
const IssueCategories = {
    BG: { id: 'BG', name: '배경 오류', color: 'blue', icon: 'fa-map-marker-alt' },
    CHAR: { id: 'CHAR', name: '인물 설정', color: 'purple', icon: 'fa-user' },
    REL: { id: 'REL', name: '관계 일관성', color: 'pink', icon: 'fa-users' },
    FLOW: { id: 'FLOW', name: '전개/흐름', color: 'orange', icon: 'fa-random' },
    SYS: { id: 'SYS', name: '시스템', color: 'gray', icon: 'fa-cog' }
};

const SeverityLevels = {
    HIGH: { id: 'HIGH', name: '높음', color: 'red', priority: 1 },
    MED: { id: 'MED', name: '중간', color: 'yellow', priority: 2 },
    LOW: { id: 'LOW', name: '낮음', color: 'green', priority: 3 }
};

const ConfidenceLevels = {
    HIGH: { id: 'HIGH', name: '확실', color: 'green' },
    MID: { id: 'MID', name: '보통', color: 'yellow' },
    LOW: { id: 'LOW', name: '추정', color: 'gray' }
};

// ========================================
// Issues Manager 클래스
// ========================================
class IssuesManager {
    constructor() {
        this.issues = [];
        this.edits = [];
        this.originalScript = '';
        this.currentScript = '';
        this.filters = {
            categories: ['BG', 'CHAR', 'REL', 'FLOW', 'SYS'],
            severities: ['HIGH', 'MED', 'LOW'],
            confidences: ['HIGH', 'MID', 'LOW']
        };
        this.sortBy = 'position'; // 'position' or 'severity'
        this.issueIdCounter = 0;
    }

    /**
     * 초기화
     */
    initialize(script) {
        this.originalScript = script;
        this.currentScript = script;
        this.issues = [];
        this.edits = [];
        this.issueIdCounter = 0;
    }

    /**
     * 고유 Issue ID 생성
     */
    generateIssueId(category) {
        this.issueIdCounter++;
        return `${category}-${String(this.issueIdCounter).padStart(4, '0')}`;
    }

    /**
     * Issue 추가
     */
    addIssue(issueData) {
        const issue = {
            id: issueData.id || this.generateIssueId(issueData.category),
            category: issueData.category,
            ruleId: issueData.ruleId || `${issueData.category}-RULE-001`,
            severity: issueData.severity || 'MED',
            confidence: issueData.confidence || 'MID',
            startIndex: issueData.startIndex,
            endIndex: issueData.endIndex,
            snippet: issueData.snippet || this.currentScript.substring(
                issueData.startIndex, 
                Math.min(issueData.endIndex, issueData.startIndex + 100)
            ),
            message: issueData.message,
            reason: issueData.reason || '',
            suggestion: issueData.suggestion || '',
            status: 'open', // 'open', 'fixed', 'ignored'
            createdAt: Date.now(),
            actions: {
                editThis: true,
                ignoreThis: true
            }
        };
        
        this.issues.push(issue);
        return issue;
    }

    /**
     * Issue 상태 업데이트
     */
    updateIssueStatus(issueId, status) {
        const issue = this.issues.find(i => i.id === issueId);
        if (issue) {
            issue.status = status;
            issue.updatedAt = Date.now();
        }
        return issue;
    }

    /**
     * Issue 무시 처리
     */
    ignoreIssue(issueId) {
        return this.updateIssueStatus(issueId, 'ignored');
    }

    /**
     * Issue 수정 적용
     */
    applyEdit(issueId, newText) {
        const issue = this.issues.find(i => i.id === issueId);
        if (!issue) return null;

        const edit = {
            id: `EDIT-${Date.now()}`,
            issueId: issueId,
            before: this.currentScript.substring(issue.startIndex, issue.endIndex),
            after: newText,
            timestamp: Date.now(),
            userAction: 'edit'
        };

        // 스크립트 업데이트
        const beforeText = this.currentScript.substring(0, issue.startIndex);
        const afterText = this.currentScript.substring(issue.endIndex);
        this.currentScript = beforeText + newText + afterText;

        // 인덱스 조정 (수정된 부분 이후의 모든 issue)
        const lengthDiff = newText.length - (issue.endIndex - issue.startIndex);
        this.issues.forEach(i => {
            if (i.startIndex > issue.startIndex && i.id !== issueId) {
                i.startIndex += lengthDiff;
                i.endIndex += lengthDiff;
            }
        });

        // 수정된 issue 업데이트
        issue.endIndex = issue.startIndex + newText.length;
        issue.snippet = newText;
        issue.status = 'fixed';
        issue.updatedAt = Date.now();

        this.edits.push(edit);
        return edit;
    }

    /**
     * 필터링된 Issues 반환
     */
    getFilteredIssues() {
        let filtered = this.issues.filter(issue => {
            if (!this.filters.categories.includes(issue.category)) return false;
            if (!this.filters.severities.includes(issue.severity)) return false;
            if (!this.filters.confidences.includes(issue.confidence)) return false;
            if (issue.status === 'ignored') return false;
            return true;
        });

        // 정렬
        if (this.sortBy === 'position') {
            filtered.sort((a, b) => a.startIndex - b.startIndex);
        } else if (this.sortBy === 'severity') {
            filtered.sort((a, b) => {
                const priorityA = SeverityLevels[a.severity]?.priority || 99;
                const priorityB = SeverityLevels[b.severity]?.priority || 99;
                return priorityA - priorityB;
            });
        }

        return filtered;
    }

    /**
     * 통계 계산
     */
    getStatistics() {
        const stats = {
            total: this.issues.length,
            byCategory: {},
            bySeverity: {},
            byStatus: { open: 0, fixed: 0, ignored: 0 }
        };

        this.issues.forEach(issue => {
            // 카테고리별
            stats.byCategory[issue.category] = (stats.byCategory[issue.category] || 0) + 1;
            // 심각도별
            stats.bySeverity[issue.severity] = (stats.bySeverity[issue.severity] || 0) + 1;
            // 상태별
            stats.byStatus[issue.status] = (stats.byStatus[issue.status] || 0) + 1;
        });

        return stats;
    }

    /**
     * 현재 스크립트 반환
     */
    getCurrentScript() {
        return this.currentScript;
    }

    /**
     * 수정 이력 반환
     */
    getEdits() {
        return this.edits;
    }

    /**
     * JSON 내보내기
     */
    exportToJSON() {
        return {
            originalScript: this.originalScript,
            currentScript: this.currentScript,
            issues: this.issues,
            edits: this.edits,
            statistics: this.getStatistics(),
            exportedAt: new Date().toISOString()
        };
    }
}

// ========================================
// 오류 추출 엔진
// ========================================
class IssueExtractor {
    constructor(issuesManager) {
        this.manager = issuesManager;
    }

    /**
     * 검수 결과에서 Issues 추출
     */
    extractFromReviewResults(results, script) {
        try {
            // BG (배경) 오류 추출
            if (results.koreaBackground && !results.koreaBackground.pass) {
                this.extractBGIssues(results.koreaBackground, script);
            }

            // CHAR (인물 설정) 오류 추출
            if (results.characterConsistency && !results.characterConsistency.pass) {
                this.extractCharacterIssues(results.characterConsistency, script);
            }

            // REL (관계) 오류 추출
            if (results.relationshipConsistency && !results.relationshipConsistency.pass) {
                this.extractRelationshipIssues(results.relationshipConsistency, script);
            }

            // FLOW (흐름) 오류 추출
            if (results.storyFlow && !results.storyFlow.pass) {
                this.extractFlowIssues(results.storyFlow, script);
            }
            if (results.pacingSpeed && !results.pacingSpeed.pass) {
                this.extractPacingIssues(results.pacingSpeed, script);
            }
            if (results.entertainment && !results.entertainment.pass) {
                this.extractEntertainmentIssues(results.entertainment, script);
            }

        } catch (error) {
            // 시스템 오류로 기록
            this.manager.addIssue({
                category: 'SYS',
                ruleId: 'SYS-PARSE-001',
                severity: 'LOW',
                confidence: 'HIGH',
                startIndex: 0,
                endIndex: 0,
                message: '오류 추출 중 시스템 오류 발생',
                reason: error.message,
                suggestion: '수동으로 검토해주세요.'
            });
        }
    }

    /**
     * 배경 오류 추출
     */
    extractBGIssues(bgResult, script) {
        if (bgResult.details) {
            bgResult.details.forEach(detail => {
                if (detail.type === 'warning' || detail.type === 'error') {
                    // 메시지에서 키워드 찾기
                    const keywordMatch = detail.message.match(/['"]([^'"]+)['"]/);
                    const keyword = keywordMatch ? keywordMatch[1] : '';
                    
                    let startIndex = 0;
                    let endIndex = 50;
                    
                    if (keyword) {
                        const idx = script.indexOf(keyword);
                        if (idx !== -1) {
                            startIndex = Math.max(0, idx - 20);
                            endIndex = Math.min(script.length, idx + keyword.length + 20);
                        }
                    }

                    this.manager.addIssue({
                        category: 'BG',
                        ruleId: 'BG-KEYWORD-001',
                        severity: bgResult.score < 50 ? 'HIGH' : 'MED',
                        confidence: 'HIGH',
                        startIndex,
                        endIndex,
                        snippet: script.substring(startIndex, endIndex),
                        message: detail.message,
                        reason: '한국 배경 키워드가 부족하거나 충돌합니다.',
                        suggestion: '한국 지명, 장소, 문화 요소를 추가하세요.'
                    });
                }
            });
        }

        // 점수가 낮으면 전체 배경 부족 이슈 추가
        if (bgResult.score < 60 && bgResult.details?.length === 0) {
            this.manager.addIssue({
                category: 'BG',
                ruleId: 'BG-GENERAL-001',
                severity: 'MED',
                confidence: 'MID',
                startIndex: 0,
                endIndex: Math.min(script.length, 200),
                snippet: script.substring(0, 200),
                message: '한국 배경 요소가 전반적으로 부족합니다.',
                reason: `배경 점수: ${bgResult.score}점`,
                suggestion: '서울, 부산 등 지명이나 한국 특유의 장소/문화를 추가하세요.'
            });
        }
    }

    /**
     * 인물 설정 오류 추출
     */
    extractCharacterIssues(charResult, script) {
        // 불일치 항목에서 추출
        if (charResult.inconsistencies && charResult.inconsistencies.length > 0) {
            charResult.inconsistencies.forEach(inc => {
                const searchText = inc.name || inc.character || '';
                let startIndex = 0;
                let endIndex = 100;

                if (searchText) {
                    const idx = script.indexOf(searchText);
                    if (idx !== -1) {
                        // 해당 줄 전체를 찾기
                        const lineStart = script.lastIndexOf('\n', idx) + 1;
                        const lineEnd = script.indexOf('\n', idx);
                        startIndex = lineStart;
                        endIndex = lineEnd === -1 ? script.length : lineEnd;
                    }
                }

                this.manager.addIssue({
                    category: 'CHAR',
                    ruleId: 'CHAR-INCONSIST-001',
                    severity: 'HIGH',
                    confidence: 'HIGH',
                    startIndex,
                    endIndex,
                    snippet: script.substring(startIndex, Math.min(endIndex, startIndex + 150)),
                    message: inc.message || `인물 '${searchText}'의 설정이 일관되지 않습니다.`,
                    reason: inc.reason || '이름, 나이, 또는 특성이 변경되었습니다.',
                    suggestion: inc.suggestion || '인물 설정을 일관되게 수정하세요.'
                });
            });
        }

        // details에서 추가 추출
        if (charResult.details) {
            charResult.details.forEach(detail => {
                if (detail.type === 'error' || detail.type === 'warning') {
                    const nameMatch = detail.message.match(/'([^']+)'/);
                    const charName = nameMatch ? nameMatch[1] : '';
                    
                    let startIndex = 0;
                    let endIndex = 100;
                    
                    if (charName) {
                        const idx = script.indexOf(charName);
                        if (idx !== -1) {
                            startIndex = Math.max(0, idx - 10);
                            endIndex = Math.min(script.length, idx + 100);
                        }
                    }

                    this.manager.addIssue({
                        category: 'CHAR',
                        ruleId: 'CHAR-DETAIL-001',
                        severity: detail.type === 'error' ? 'HIGH' : 'MED',
                        confidence: 'MID',
                        startIndex,
                        endIndex,
                        snippet: script.substring(startIndex, endIndex),
                        message: detail.message,
                        reason: '인물 설정 검사에서 발견된 문제입니다.',
                        suggestion: '해당 인물의 이름/나이/특성을 확인하세요.'
                    });
                }
            });
        }
    }

    /**
     * 관계 일관성 오류 추출
     */
    extractRelationshipIssues(relResult, script) {
        if (relResult.inconsistencies && relResult.inconsistencies.length > 0) {
            relResult.inconsistencies.forEach(inc => {
                const searchText = inc.name || '';
                let startIndex = 0;
                let endIndex = 100;

                if (searchText) {
                    // 모든 등장 위치 찾기
                    const regex = new RegExp(searchText + '\\s*\\([^)]+\\)', 'g');
                    let match;
                    const positions = [];
                    while ((match = regex.exec(script)) !== null) {
                        positions.push({ start: match.index, end: match.index + match[0].length });
                    }

                    if (positions.length > 0) {
                        // 첫 번째 불일치 위치 사용 (또는 두 번째)
                        const pos = positions.length > 1 ? positions[1] : positions[0];
                        startIndex = Math.max(0, pos.start - 20);
                        endIndex = Math.min(script.length, pos.end + 20);
                    }
                }

                this.manager.addIssue({
                    category: 'REL',
                    ruleId: 'REL-CHANGE-001',
                    severity: 'HIGH',
                    confidence: 'HIGH',
                    startIndex,
                    endIndex,
                    snippet: script.substring(startIndex, endIndex),
                    message: inc.message || `'${searchText}'의 관계가 변경되었습니다.`,
                    reason: inc.reason || '동일 인물의 관계 설정이 다릅니다.',
                    suggestion: inc.suggestion || '관계를 일관되게 유지하세요.'
                });
            });
        }

        if (relResult.details) {
            relResult.details.forEach(detail => {
                if (detail.type === 'error') {
                    this.manager.addIssue({
                        category: 'REL',
                        ruleId: 'REL-DETAIL-001',
                        severity: 'MED',
                        confidence: 'MID',
                        startIndex: 0,
                        endIndex: 100,
                        snippet: script.substring(0, 100),
                        message: detail.message,
                        reason: '관계 검사에서 발견된 문제입니다.',
                        suggestion: '인물 간 관계를 확인하세요.'
                    });
                }
            });
        }
    }

    /**
     * 흐름 오류 추출
     */
    extractFlowIssues(flowResult, script) {
        if (flowResult.details) {
            flowResult.details.forEach(detail => {
                if (detail.type === 'warning' || detail.type === 'error') {
                    // 씬 번호나 키워드 추출
                    const sceneMatch = detail.message.match(/씬\s*(\d+)/i);
                    let startIndex = 0;
                    let endIndex = 200;

                    if (sceneMatch) {
                        const sceneNum = sceneMatch[1];
                        const scenePattern = new RegExp(`\\[씬\\s*${sceneNum}[^\\]]*\\]`, 'i');
                        const sceneStart = script.search(scenePattern);
                        if (sceneStart !== -1) {
                            startIndex = sceneStart;
                            // 다음 씬 시작 또는 끝까지
                            const nextScene = script.indexOf('[씬', startIndex + 1);
                            endIndex = nextScene === -1 ? Math.min(script.length, startIndex + 500) : nextScene;
                        }
                    }

                    this.manager.addIssue({
                        category: 'FLOW',
                        ruleId: 'FLOW-STRUCTURE-001',
                        severity: detail.type === 'error' ? 'HIGH' : 'MED',
                        confidence: 'MID',
                        startIndex,
                        endIndex,
                        snippet: script.substring(startIndex, Math.min(endIndex, startIndex + 200)),
                        message: detail.message,
                        reason: '이야기 흐름 분석에서 발견된 문제입니다.',
                        suggestion: '씬 전환이나 스토리 전개를 검토하세요.'
                    });
                }
            });
        }
    }

    /**
     * 페이싱 오류 추출
     */
    extractPacingIssues(paceResult, script) {
        if (paceResult.details) {
            paceResult.details.forEach(detail => {
                if (detail.type === 'warning' || detail.type === 'error') {
                    this.manager.addIssue({
                        category: 'FLOW',
                        ruleId: 'FLOW-PACING-001',
                        severity: 'MED',
                        confidence: 'MID',
                        startIndex: 0,
                        endIndex: 200,
                        snippet: script.substring(0, 200),
                        message: detail.message,
                        reason: '페이싱 분석에서 발견된 문제입니다.',
                        suggestion: '감정 변화나 전개 속도를 조절하세요.'
                    });
                }
            });
        }
    }

    /**
     * 재미 요소 오류 추출
     */
    extractEntertainmentIssues(entResult, script) {
        if (entResult.score < 60 && entResult.details) {
            entResult.details.forEach(detail => {
                if (detail.type === 'warning') {
                    this.manager.addIssue({
                        category: 'FLOW',
                        ruleId: 'FLOW-ENGAGE-001',
                        severity: 'LOW',
                        confidence: 'LOW',
                        startIndex: 0,
                        endIndex: 200,
                        snippet: script.substring(0, 200),
                        message: detail.message,
                        reason: '재미/몰입 요소 분석에서 발견된 문제입니다.',
                        suggestion: '갈등, 대화, 공감 요소를 추가하세요.'
                    });
                }
            });
        }
    }

    /**
     * FLOW 후보 구간 추출 (1차 룰 기반)
     */
    extractFlowCandidates(script) {
        const candidates = [];
        
        // 씬 추출
        const scenePattern = /\[씬\s*\d+[^\]]*\]/gi;
        const scenes = [];
        let match;
        
        while ((match = scenePattern.exec(script)) !== null) {
            scenes.push({
                index: match.index,
                header: match[0],
                startIndex: match.index
            });
        }

        // 씬 간 전환 검사
        for (let i = 0; i < scenes.length - 1; i++) {
            const currentScene = scenes[i];
            const nextScene = scenes[i + 1];
            
            // 시간 점프 감지
            const timeJumpPatterns = [
                /(\d+)년\s*(후|뒤|전)/,
                /(\d+)개월\s*(후|뒤|전)/,
                /다음\s*날/,
                /며칠\s*(후|뒤)/,
                /몇\s*년\s*(후|뒤)/
            ];

            const sceneContent = script.substring(currentScene.startIndex, nextScene.startIndex);
            
            for (const pattern of timeJumpPatterns) {
                if (pattern.test(sceneContent)) {
                    candidates.push({
                        type: 'TIME_JUMP',
                        startIndex: currentScene.startIndex,
                        endIndex: nextScene.startIndex,
                        sceneNum: i + 1,
                        trigger: pattern.source
                    });
                    break;
                }
            }

            // 감정 급변 감지
            const emotionPatterns = {
                positive: ['기쁨', '행복', '웃', '감동', '사랑', '기쁜'],
                negative: ['슬픔', '분노', '화가', '눈물', '아프', '고통', '절망']
            };

            let hasPositive = false;
            let hasNegative = false;

            emotionPatterns.positive.forEach(word => {
                if (sceneContent.includes(word)) hasPositive = true;
            });
            emotionPatterns.negative.forEach(word => {
                if (sceneContent.includes(word)) hasNegative = true;
            });

            if (hasPositive && hasNegative) {
                candidates.push({
                    type: 'EMOTION_SHIFT',
                    startIndex: currentScene.startIndex,
                    endIndex: nextScene.startIndex,
                    sceneNum: i + 1,
                    trigger: 'emotion_contrast'
                });
            }
        }

        return candidates;
    }
}

// ========================================
// 다운로드 유틸리티
// ========================================
class ScriptDownloader {
    /**
     * UTF-8 TXT 다운로드
     */
    static downloadReviewedTXT(script, originalFileName = 'script') {
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const fileName = `${originalFileName}_reviewed_${date}.txt`;
        
        const blob = new Blob([script], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        return fileName;
    }

    /**
     * Vrew 편집용 TXT 다운로드
     */
    static downloadVrewTXT(script, originalFileName = 'script', options = {}) {
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const fileName = `${originalFileName}_vrew_${date}.txt`;
        
        let processedScript = script;

        if (options.mode === 'sentence') {
            // 문장 단위 줄바꿈 + 최대 글자수 자동 개행
            const maxChars = options.maxChars || 20;
            processedScript = this.formatForVrew(script, maxChars);
        } else {
            // 기본: 1줄=1클립 (기존 줄바꿈 유지)
            processedScript = script;
        }

        const blob = new Blob([processedScript], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        return fileName;
    }

    /**
     * Vrew 포맷 변환 (문장 단위 + 최대 글자수)
     */
    static formatForVrew(script, maxChars = 20) {
        const lines = [];
        
        // 문장 분리 (마침표, 물음표, 느낌표 기준)
        const sentences = script.split(/(?<=[.?!。])\s*/);
        
        sentences.forEach(sentence => {
            sentence = sentence.trim();
            if (!sentence) return;

            // 씬 헤더는 그대로 유지
            if (sentence.startsWith('[씬') || sentence.startsWith('[') && sentence.endsWith(']')) {
                lines.push(sentence);
                lines.push(''); // 빈 줄 추가
                return;
            }

            // 인물명: 대사 형식 처리
            const dialogueMatch = sentence.match(/^([가-힣a-zA-Z]+)(\([^)]*\))?:\s*(.*)$/);
            if (dialogueMatch) {
                const speaker = dialogueMatch[1] + (dialogueMatch[2] || '');
                const dialogue = dialogueMatch[3];
                
                // 화자 표시
                lines.push(`[${speaker}]`);
                
                // 대사를 maxChars 단위로 분할
                const chunks = this.splitByLength(dialogue, maxChars);
                chunks.forEach(chunk => lines.push(chunk));
                lines.push(''); // 클립 구분용 빈 줄
            } else {
                // 일반 텍스트
                const chunks = this.splitByLength(sentence, maxChars);
                chunks.forEach(chunk => lines.push(chunk));
            }
        });

        return lines.join('\n');
    }

    /**
     * 텍스트를 최대 길이로 분할
     */
    static splitByLength(text, maxLength) {
        const chunks = [];
        let remaining = text;

        while (remaining.length > maxLength) {
            // 자연스러운 끊김점 찾기 (공백, 쉼표 등)
            let breakPoint = maxLength;
            const lastSpace = remaining.lastIndexOf(' ', maxLength);
            const lastComma = remaining.lastIndexOf(',', maxLength);
            
            if (lastSpace > maxLength * 0.5) {
                breakPoint = lastSpace;
            } else if (lastComma > maxLength * 0.5) {
                breakPoint = lastComma + 1;
            }

            chunks.push(remaining.substring(0, breakPoint).trim());
            remaining = remaining.substring(breakPoint).trim();
        }

        if (remaining) {
            chunks.push(remaining);
        }

        return chunks;
    }
}

// ========================================
// 전역 노출
// ========================================
window.IssueCategories = IssueCategories;
window.SeverityLevels = SeverityLevels;
window.ConfidenceLevels = ConfidenceLevels;
window.IssuesManager = IssuesManager;
window.IssueExtractor = IssueExtractor;
window.ScriptDownloader = ScriptDownloader;

console.log('✅ Issues Manager 모듈 로드 완료');
