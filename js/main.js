<!DOCTYPE html>
<html lang="ko">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>대본 검수 시스템 | Script Review Pro</title>

    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700&display=swap"
        rel="stylesheet">

    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css">

    <!-- Custom Styles -->
    <link rel="stylesheet" href="css/style.css">

    <!-- Tailwind Config -->
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: {
                        'korean': ['Noto Sans KR', 'sans-serif'],
                    },
                    colors: {
                        'primary': '#2563eb',
                        'primary-dark': '#1d4ed8',
                        'secondary': '#64748b',
                        'accent': '#f59e0b',
                        'success': '#10b981',
                        'warning': '#f59e0b',
                        'danger': '#ef4444',
                        'dark': '#1e293b',
                        'light': '#f8fafc',
                    }
                }
            }
        }
    </script>
</head>

<body class="font-korean bg-gray-50 min-h-screen transition-colors duration-300 dark:bg-gray-900">

    <!-- Header -->
    <header class="bg-dark text-white shadow-lg dark:bg-gray-800">
        <div class="container mx-auto px-4 py-4">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                        <i class="fas fa-film text-xl"></i>
                    </div>
                    <div>
                        <h1 class="text-xl font-bold">대본 검수 시스템</h1>
                        <p class="text-xs text-gray-400">Script Review Pro v2.0</p>
                    </div>
                </div>
                <div class="flex items-center space-x-4">
                    <span class="text-sm text-gray-400 hidden sm:inline">
                        <i class="fas fa-circle text-success text-xs mr-1"></i> 시스템 정상
                    </span>

                    <!-- API KEY UI -->
                    <div id="api-key-container" class="relative">
                        <button id="api-key-toggle-btn" type="button"
                            class="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-600 bg-gray-700 text-white text-sm font-medium hover:bg-gray-600 transition-colors">
                            <span id="api-key-status-icon" aria-hidden="true">🔑</span>
                            <span id="api-key-status-text">API 키 설정</span>
                        </button>

                        <div id="api-key-panel"
                            class="hidden absolute right-0 mt-2 w-[360px] rounded-xl border border-gray-200 bg-white shadow-lg p-4 z-50">
                            <div class="flex items-center justify-between mb-3">
                                <div class="font-semibold text-sm text-gray-800">Gemini API 키</div>
                                <button id="api-key-close-btn" type="button"
                                    class="px-2 py-1 rounded-md hover:bg-gray-100 text-gray-600">✕</button>
                            </div>
                            <input id="api-key-input" type="password" autocomplete="off"
                                placeholder="AIza... (Gemini API Key)"
                                class="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800" />
                            <div class="flex gap-2 mt-3">
                                <button id="api-key-save-btn" type="button"
                                    class="flex-1 px-3 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700">저장</button>
                                <button id="api-key-delete-btn" type="button"
                                    class="px-3 py-2 rounded-lg border border-gray-300 bg-white font-semibold hover:bg-gray-50 text-gray-800">삭제</button>
                            </div>
                            <div class="mt-3 text-xs text-gray-500">저장된 키는 로컬스토리지(GEMINI_API_KEY)에만 보관됩니다.</div>
                        </div>
                    </div>

                    <!-- 다크모드 토글 버튼 -->
                    <button id="dark-mode-toggle"
                        class="w-10 h-10 rounded-lg bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors"
                        title="다크모드 전환">
                        <i class="fas fa-moon text-yellow-300" id="dark-icon"></i>
                        <i class="fas fa-sun text-yellow-400 hidden" id="light-icon"></i>
                    </button>
                </div>
            </div>
        </div>
    </header>

    <!-- Main Navigation Tabs -->
    <nav class="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50 dark:bg-gray-800 dark:border-gray-700">
        <div class="container mx-auto px-4">
            <div class="flex space-x-1 overflow-x-auto" id="main-tabs">

                <!-- Tab 1: 한국 배경 시니어 낭독 -->
                <button
                    class="tab-btn active flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 border-primary text-primary bg-blue-50 transition-all duration-200 whitespace-nowrap"
                    data-tab="korea-senior">
                    <span class="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                        <i class="fas fa-book-open text-red-500"></i>
                    </span>
                    <span>한국 시니어 낭독</span>
                </button>

                <!-- Tab 2: 한국 조선 배경 야담 -->
                <button
                    class="tab-btn flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-all duration-200 whitespace-nowrap"
                    data-tab="joseon-yadam">
                    <span class="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                        <i class="fas fa-scroll text-amber-600"></i>
                    </span>
                    <span>조선 야담</span>
                </button>

                <!-- Tab 3: 일본 배경 시니어 낭독 -->
                <button
                    class="tab-btn flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-all duration-200 whitespace-nowrap"
                    data-tab="japan-senior">
                    <span class="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
                        <i class="fas fa-torii-gate text-pink-500"></i>
                    </span>
                    <span>일본 시니어 낭독</span>
                </button>

                <!-- Tab 4: 전세계 뉴스 관련 -->
                <button
                    class="tab-btn flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-all duration-200 whitespace-nowrap"
                    data-tab="world-news">
                    <span class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <i class="fas fa-globe text-blue-500"></i>
                    </span>
                    <span>전세계 뉴스</span>
                </button>

            </div>
        </div>
    </nav>

    <!-- Main Content Area -->
    <main class="container mx-auto px-4 py-6">

        <!-- Tab Content: 한국 시니어 낭독 -->
        <section id="korea-senior" class="tab-content active">
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <!-- Content Header -->
                <div class="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-3">
                            <i class="fas fa-book-open text-white text-2xl"></i>
                            <div>
                                <h2 class="text-xl font-bold text-white">한국 배경 시니어 낭독</h2>
                                <p class="text-red-100 text-sm">한국 현대/근대 배경의 시니어 타겟 낭독 콘텐츠</p>
                            </div>
                        </div>
                        <div id="korea-senior-overall-status"
                            class="bg-white/20 text-white px-3 py-1 rounded-full text-sm">
                            <i class="fas fa-clock mr-1"></i> 검수 대기
                        </div>
                    </div>
                </div>

                <!-- Content Body -->
                <div class="p-6">
                    <!-- 대본 입력 영역 -->
                    <div class="mb-6">
                        <div class="flex items-center justify-between mb-3">
                            <h3 class="font-semibold text-gray-800 flex items-center">
                                <i class="fas fa-edit text-primary mr-2"></i>
                                대본 입력
                            </h3>
                            <span id="korea-char-counter" class="text-xs text-gray-400">0자 / 무제한</span>
                        </div>
                        <textarea id="korea-senior-script"
                            class="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono text-sm leading-relaxed"
                            style="min-height: 200px; max-height: 500px; resize: vertical;" placeholder="검수할 대본을 입력하세요... (10만자 이상 입력 가능)

예시 형식:
[씬 1. 서울 강남 아파트 / 낮]

나레이션: 
1990년대 초, 서울 강남의 한 아파트 단지.

현숙(엄마, 55세, 자상한 성격):
우리 창현이, 오늘도 회사에서 힘들었지?

창현(아들, 32세, 회사원):
네, 어머니. 요즘 프로젝트가 많아서요.

영희(딸, 28세, 대학원생):
오빠, 저녁 같이 먹어요!"></textarea>
                        <div class="flex space-x-2 mt-3">
                            <button id="korea-senior-review-btn"
                                class="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg font-medium transition-colors">
                                <i class="fas fa-robot mr-2"></i>전체 자동 검수 시작
                            </button>
                            <button id="korea-senior-clear-btn"
                                class="px-4 py-3 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                                title="내용 지우기">
                                <i class="fas fa-eraser"></i>
                            </button>
                            <button id="korea-senior-sample-btn"
                                class="px-4 py-3 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                                title="샘플 대본 불러오기">
                                <i class="fas fa-file-import"></i>
                            </button>
                        </div>
                    </div>

                    <!-- 로딩 표시 -->
                    <div id="korea-loading" class="hidden mb-6">
                        <div class="flex items-center justify-center p-8 bg-gray-50 rounded-lg dark:bg-gray-700">
                            <div class="loading mr-3"></div>
                            <span class="text-gray-600 dark:text-gray-300">대본 분석 중... 잠시만 기다려주세요.</span>
                        </div>
                    </div>

                    <!-- 등장인물 분석 결과 (검수 전 표시) -->
                    <div id="korea-character-analysis" class="hidden mb-6">
                        <div class="border-2 border-blue-200 rounded-xl overflow-hidden dark:border-blue-800">
                            <div class="bg-blue-500 px-4 py-3 dark:bg-blue-700">
                                <div class="flex items-center justify-between">
                                    <h3 class="font-semibold text-white flex items-center">
                                        <i class="fas fa-users mr-2"></i>
                                        대본 분석 완료 - 등장인물 확인
                                    </h3>
                                    <span id="korea-analysis-char-count"
                                        class="bg-white/20 text-white px-2 py-1 rounded text-xs">
                                        0명 감지
                                    </span>
                                </div>
                            </div>
                            <div class="p-4 bg-blue-50 dark:bg-gray-800">
                                <!-- 등장인물 리스트 -->
                                <div class="mb-4">
                                    <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        <i class="fas fa-user-friends text-blue-500 mr-1"></i>
                                        등장인물 목록
                                    </h4>
                                    <div id="korea-character-list"
                                        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                        <!-- 동적으로 채워짐 -->
                                    </div>
                                </div>

                                <!-- 관계도 요약 -->
                                <div class="mb-4">
                                    <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        <i class="fas fa-sitemap text-green-500 mr-1"></i>
                                        관계 정보
                                    </h4>
                                    <div id="korea-relationship-list" class="flex flex-wrap gap-2">
                                        <!-- 동적으로 채워짐 -->
                                    </div>
                                </div>

                                <!-- 기본 통계 -->
                                <div class="mb-4">
                                    <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        <i class="fas fa-chart-bar text-purple-500 mr-1"></i>
                                        대본 기본 정보
                                    </h4>
                                    <div class="grid grid-cols-2 md:grid-cols-4 gap-2" id="korea-script-stats">
                                        <div class="bg-white dark:bg-gray-700 rounded p-2 text-center">
                                            <p class="text-lg font-bold text-gray-800 dark:text-white"
                                                id="stat-total-chars">-</p>
                                            <p class="text-xs text-gray-500 dark:text-gray-400">총 글자수</p>
                                        </div>
                                        <div class="bg-white dark:bg-gray-700 rounded p-2 text-center">
                                            <p class="text-lg font-bold text-gray-800 dark:text-white"
                                                id="stat-scene-count">-</p>
                                            <p class="text-xs text-gray-500 dark:text-gray-400">씬 개수</p>
                                        </div>
                                        <div class="bg-white dark:bg-gray-700 rounded p-2 text-center">
                                            <p class="text-lg font-bold text-gray-800 dark:text-white"
                                                id="stat-dialogue-count">-</p>
                                            <p class="text-xs text-gray-500 dark:text-gray-400">대사 수</p>
                                        </div>
                                        <div class="bg-white dark:bg-gray-700 rounded p-2 text-center">
                                            <p class="text-lg font-bold text-gray-800 dark:text-white"
                                                id="stat-est-runtime">-</p>
                                            <p class="text-xs text-gray-500 dark:text-gray-400">예상 시간</p>
                                        </div>
                                    </div>
                                </div>

                                <!-- 확인 및 검수 시작 버튼 -->
                                <div class="flex space-x-2">
                                    <button id="korea-confirm-review-btn"
                                        class="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg font-medium transition-colors">
                                        <i class="fas fa-check-circle mr-2"></i>확인 완료, 검수 시작
                                    </button>
                                    <button id="korea-cancel-review-btn"
                                        class="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                        <i class="fas fa-times mr-1"></i>취소
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 자동 검수 결과 (1~3번: 기본 검수) -->
                    <div class="mb-6">
                        <h3 class="font-semibold text-gray-800 flex items-center mb-3">
                            <i class="fas fa-robot text-red-500 mr-2"></i>
                            기본 검수 (자동)
                            <span class="ml-2 text-xs text-gray-400 font-normal">배경, 인물, 관계 일관성</span>
                        </h3>

                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4" id="korea-senior-auto-results">
                            <!-- 1. 한국 배경 확인 -->
                            <div class="border border-gray-200 rounded-lg p-4 bg-gray-50" id="korea-bg-result">
                                <div class="flex items-center justify-between mb-2">
                                    <span class="font-medium text-gray-700 text-sm">1. 한국 배경 확인</span>
                                    <span
                                        class="status-badge bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">대기</span>
                                </div>
                                <div class="text-xs text-gray-500 mb-2">지명, 장소, 문화 요소 검사</div>
                                <div
                                    class="result-detail text-xs text-gray-400 min-h-[60px] max-h-[100px] overflow-y-auto">
                                    검수를 시작하면 결과가 표시됩니다.
                                </div>
                            </div>

                            <!-- 2. 인물 설정 일관성 -->
                            <div class="border border-gray-200 rounded-lg p-4 bg-gray-50" id="korea-char-result">
                                <div class="flex items-center justify-between mb-2">
                                    <span class="font-medium text-gray-700 text-sm">2. 인물 설정 일관성</span>
                                    <span
                                        class="status-badge bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">대기</span>
                                </div>
                                <div class="text-xs text-gray-500 mb-2">이름, 나이, 특성 변경 감지</div>
                                <div
                                    class="result-detail text-xs text-gray-400 min-h-[60px] max-h-[100px] overflow-y-auto">
                                    검수를 시작하면 결과가 표시됩니다.
                                </div>
                            </div>

                            <!-- 3. 인물 관계 일관성 -->
                            <div class="border border-gray-200 rounded-lg p-4 bg-gray-50" id="korea-rel-result">
                                <div class="flex items-center justify-between mb-2">
                                    <span class="font-medium text-gray-700 text-sm">3. 인물 관계 일관성</span>
                                    <span
                                        class="status-badge bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">대기</span>
                                </div>
                                <div class="text-xs text-gray-500 mb-2">가족/사회 관계 변경 감지</div>
                                <div
                                    class="result-detail text-xs text-gray-400 min-h-[60px] max-h-[100px] overflow-y-auto">
                                    검수를 시작하면 결과가 표시됩니다.
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 자동 검수 결과 (4~6번: 스토리 분석) -->
                    <div class="mb-6">
                        <h3 class="font-semibold text-gray-800 flex items-center mb-3">
                            <i class="fas fa-brain text-purple-500 mr-2"></i>
                            스토리 분석 (자동)
                            <span class="ml-2 text-xs text-gray-400 font-normal">흐름, 페이싱, 재미요소</span>
                        </h3>

                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <!-- 4. 이야기 흐름 -->
                            <div class="border border-gray-200 rounded-lg p-4 bg-gray-50" id="korea-flow-result">
                                <div class="flex items-center justify-between mb-2">
                                    <span class="font-medium text-gray-700 text-sm">4. 이야기 흐름</span>
                                    <span
                                        class="status-badge bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">대기</span>
                                </div>
                                <div class="text-xs text-gray-500 mb-2">씬 구조, 시간/장소 흐름 분석</div>
                                <div
                                    class="result-detail text-xs text-gray-400 min-h-[80px] max-h-[120px] overflow-y-auto">
                                    검수를 시작하면 결과가 표시됩니다.
                                </div>
                            </div>

                            <!-- 5. 반전/변화 속도 -->
                            <div class="border border-gray-200 rounded-lg p-4 bg-gray-50" id="korea-pace-result">
                                <div class="flex items-center justify-between mb-2">
                                    <span class="font-medium text-gray-700 text-sm">5. 반전/변화 속도</span>
                                    <span
                                        class="status-badge bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">대기</span>
                                </div>
                                <div class="text-xs text-gray-500 mb-2">감정 변화, 페이싱 분석</div>
                                <div
                                    class="result-detail text-xs text-gray-400 min-h-[80px] max-h-[120px] overflow-y-auto">
                                    검수를 시작하면 결과가 표시됩니다.
                                </div>
                            </div>

                            <!-- 6. 재미/몰입 요소 -->
                            <div class="border border-gray-200 rounded-lg p-4 bg-gray-50" id="korea-fun-result">
                                <div class="flex items-center justify-between mb-2">
                                    <span class="font-medium text-gray-700 text-sm">6. 재미/몰입 요소</span>
                                    <span
                                        class="status-badge bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">대기</span>
                                </div>
                                <div class="text-xs text-gray-500 mb-2">갈등, 대화, 시니어 공감 분석</div>
                                <div
                                    class="result-detail text-xs text-gray-400 min-h-[80px] max-h-[120px] overflow-y-auto">
                                    검수를 시작하면 결과가 표시됩니다.
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 종합 결과 -->
                    <div class="border-t border-gray-200 pt-6">
                        <h3 class="font-semibold text-gray-800 flex items-center mb-3">
                            <i class="fas fa-chart-pie text-green-500 mr-2"></i>
                            종합 검수 결과
                        </h3>
                        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3" id="korea-senior-summary">
                            <div class="bg-gray-100 rounded-lg p-3 text-center dark:bg-gray-700">
                                <p class="text-xl font-bold text-gray-800 dark:text-white" id="korea-total-score">-</p>
                                <p class="text-xs text-gray-500 dark:text-gray-400">종합점수</p>
                            </div>
                            <div class="bg-gray-100 rounded-lg p-3 text-center dark:bg-gray-700">
                                <p class="text-xl font-bold text-gray-800 dark:text-white" id="korea-pass-count">-</p>
                                <p class="text-xs text-gray-500 dark:text-gray-400">합격항목</p>
                            </div>
                            <div class="bg-gray-100 rounded-lg p-3 text-center dark:bg-gray-700">
                                <p class="text-xl font-bold text-gray-800 dark:text-white" id="korea-scene-count">-</p>
                                <p class="text-xs text-gray-500 dark:text-gray-400">씬 수</p>
                            </div>
                            <div class="bg-gray-100 rounded-lg p-3 text-center dark:bg-gray-700">
                                <p class="text-xl font-bold text-gray-800 dark:text-white" id="korea-char-count">-</p>
                                <p class="text-xs text-gray-500 dark:text-gray-400">등장인물</p>
                            </div>
                            <div class="bg-gray-100 rounded-lg p-3 text-center dark:bg-gray-700">
                                <p class="text-xl font-bold text-gray-800 dark:text-white" id="korea-keyword-count">-
                                </p>
                                <p class="text-xs text-gray-500 dark:text-gray-400">한국키워드</p>
                            </div>
                            <div class="bg-gray-100 rounded-lg p-3 text-center dark:bg-gray-700">
                                <p class="text-xl font-bold text-gray-800 dark:text-white" id="korea-dialogue-ratio">-
                                </p>
                                <p class="text-xs text-gray-500 dark:text-gray-400">대화비율</p>
                            </div>
                            <div class="bg-gray-100 rounded-lg p-3 text-center dark:bg-gray-700">
                                <p class="text-xl font-bold text-gray-800 dark:text-white" id="korea-runtime">-</p>
                                <p class="text-xs text-gray-500 dark:text-gray-400">예상시간</p>
                            </div>
                            <div class="bg-gray-100 rounded-lg p-3 text-center dark:bg-gray-700">
                                <p class="text-xl font-bold text-gray-800 dark:text-white" id="korea-final-status">-</p>
                                <p class="text-xs text-gray-500 dark:text-gray-400">최종판정</p>
                            </div>
                        </div>
                    </div>

                    <!-- AI 심층 분석 결과 (Gemini API) -->
                    <div id="korea-ai-analysis" class="hidden border-t border-gray-200 pt-6 mt-6">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="font-semibold text-gray-800 dark:text-white flex items-center">
                                <i class="fas fa-magic text-indigo-500 mr-2"></i>
                                AI 심층 분석
                                <span
                                    class="ml-2 text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full dark:bg-indigo-900 dark:text-indigo-300">
                                    Gemini Flash 2.5
                                </span>
                            </h3>
                            <button id="korea-ai-start-btn"
                                class="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                                <i class="fas fa-brain mr-2"></i>AI 분석 시작
                            </button>
                        </div>

                        <!-- AI 분석 로딩 -->
                        <div id="korea-ai-loading" class="hidden mb-4">
                            <div
                                class="flex items-center justify-center p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                                <div class="loading border-indigo-500 mr-3"></div>
                                <span class="text-indigo-600 dark:text-indigo-300">AI가 대본을 심층 분석하고 있습니다... (약 10-30초
                                    소요)</span>
                            </div>
                        </div>

                        <!-- 진행바/스텝 영역 -->
                        <div id="korea-ai-progress-section" class="hidden mb-4">
                            <div class="flex items-center justify-between mb-2">
                                <div class="text-sm font-semibold text-gray-700 dark:text-gray-300">AI 분석 진행</div>
                                <div class="text-sm text-gray-600 dark:text-gray-400"><span
                                        id="korea-ai-progress-percent">0%</span></div>
                            </div>
                            <div class="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div id="korea-ai-progress-bar" class="h-3 bg-indigo-600 transition-all duration-300"
                                    style="width:0%"></div>
                            </div>

                            <!-- [추가] progress-step-* 요소 (스텝별 진행/실패 표시용) -->
                            <div class="mt-3 space-y-1 text-xs">
                                <div id="progress-step-0" class="hidden text-gray-600 dark:text-gray-400">Step 0: 대본 파악
                                </div>
                                <div id="progress-step-1" class="hidden text-gray-600 dark:text-gray-400">Step 1: 배경 확인
                                </div>
                                <div id="progress-step-2" class="hidden text-gray-600 dark:text-gray-400">Step 2: 등장인물
                                    일관성</div>
                                <div id="progress-step-3" class="hidden text-gray-600 dark:text-gray-400">Step 3: 스토리 왜곡
                                    분석</div>
                                <div id="progress-step-4" class="hidden text-gray-600 dark:text-gray-400">Step 4: 반전/변화
                                    속도</div>
                                <div id="progress-step-5" class="hidden text-gray-600 dark:text-gray-400">Step 5: 재미/몰입
                                    요소</div>
                            </div>
                        </div>

                        <!-- AI 분석 결과 컨테이너 -->
                        <div id="korea-ai-result" class="hidden">
                            <!-- 상단 판정 배너 -->
                            <div id="overall-verdict-banner"
                                class="hidden mb-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                <div class="flex items-center justify-between">
                                    <div class="font-semibold text-gray-800 dark:text-white">전체 판정</div>
                                    <div class="text-sm text-gray-600 dark:text-gray-400">총점: <span
                                            id="korea-ai-overall-score" class="font-bold text-indigo-600">0</span></div>
                                </div>
                                <div class="mt-2">
                                    <span id="korea-ai-verdict"
                                        class="font-semibold text-gray-800 dark:text-white"></span>
                                    <span id="verdict-pass"
                                        class="hidden ml-2 px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-semibold">합격</span>
                                    <span id="verdict-fail"
                                        class="hidden ml-2 px-2 py-1 rounded bg-red-100 text-red-700 text-xs font-semibold">불합격</span>
                                </div>
                                <div id="fail-reason" class="mt-2 text-sm text-red-600 dark:text-red-400 hidden"></div>
                            </div>

                            <!-- 요약 -->
                            <div
                                class="mb-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-lg border border-indigo-200 dark:border-indigo-700">
                                <h4 class="font-medium text-indigo-800 dark:text-indigo-300 mb-2">
                                    <i class="fas fa-lightbulb mr-2"></i>AI 요약
                                </h4>
                                <p id="korea-ai-summary"
                                    class="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">-</p>
                            </div>

                            <!-- AI 평가 점수 (탭별 독립 분석) -->
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                <!-- 배경확인 탭 -->
                                <div class="bg-white dark:bg-gray-700 rounded-lg p-4 border-2 border-gray-200 dark:border-gray-600 hover:border-indigo-300 transition-colors"
                                    data-category="background">
                                    <div class="flex items-center justify-between mb-3">
                                        <div>
                                            <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">배경확인</p>
                                            <p class="text-2xl font-bold text-indigo-600" id="ai-background-score">-</p>
                                        </div>
                                        <div class="flex flex-col gap-1">
                                            <button
                                                class="tab-ai-btn px-3 py-1 text-xs bg-indigo-500 hover:bg-indigo-600 text-white rounded transition-colors"
                                                data-category="background" title="AI 분석">
                                                <i class="fas fa-robot mr-1"></i>분석
                                            </button>
                                            <button
                                                class="tab-review-btn px-3 py-1 text-xs bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
                                                data-category="background" title="검수">
                                                <i class="fas fa-check mr-1"></i>검수
                                            </button>
                                        </div>
                                    </div>
                                    <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                                        <div class="bg-indigo-600 h-1.5 rounded-full transition-all" style="width: 0%"
                                            id="progress-background"></div>
                                    </div>
                                </div>

                                <!-- 등장인물 일관성 탭 -->
                                <div class="bg-white dark:bg-gray-700 rounded-lg p-4 border-2 border-gray-200 dark:border-gray-600 hover:border-indigo-300 transition-colors"
                                    data-category="character">
                                    <div class="flex items-center justify-between mb-3">
                                        <div>
                                            <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">등장인물 일관성</p>
                                            <p class="text-2xl font-bold text-indigo-600" id="ai-character-score">-</p>
                                        </div>
                                        <div class="flex flex-col gap-1">
                                            <button
                                                class="tab-ai-btn px-3 py-1 text-xs bg-indigo-500 hover:bg-indigo-600 text-white rounded transition-colors"
                                                data-category="character" title="AI 분석">
                                                <i class="fas fa-robot mr-1"></i>분석
                                            </button>
                                            <button
                                                class="tab-review-btn px-3 py-1 text-xs bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
                                                data-category="character" title="검수">
                                                <i class="fas fa-check mr-1"></i>검수
                                            </button>
                                        </div>
                                    </div>
                                    <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                                        <div class="bg-indigo-600 h-1.5 rounded-full transition-all" style="width: 0%"
                                            id="progress-character"></div>
                                    </div>
                                </div>

                                <!-- 스토리 왜곡 분석 탭 -->
                                <div class="bg-white dark:bg-gray-700 rounded-lg p-4 border-2 border-gray-200 dark:border-gray-600 hover:border-indigo-300 transition-colors"
                                    data-category="distortion">
                                    <div class="flex items-center justify-between mb-3">
                                        <div>
                                            <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">스토리 왜곡</p>
                                            <p class="text-2xl font-bold text-indigo-600" id="ai-distortion-score">-</p>
                                        </div>
                                        <div class="flex flex-col gap-1">
                                            <button
                                                class="tab-ai-btn px-3 py-1 text-xs bg-indigo-500 hover:bg-indigo-600 text-white rounded transition-colors"
                                                data-category="distortion" title="AI 분석">
                                                <i class="fas fa-robot mr-1"></i>분석
                                            </button>
                                            <button
                                                class="tab-review-btn px-3 py-1 text-xs bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
                                                data-category="distortion" title="검수">
                                                <i class="fas fa-check mr-1"></i>검수
                                            </button>
                                        </div>
                                    </div>
                                    <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                                        <div class="bg-indigo-600 h-1.5 rounded-full transition-all" style="width: 0%"
                                            id="progress-distortion"></div>
                                    </div>
                                </div>

                                <!-- 반전/변화 속도 탭 -->
                                <div class="bg-white dark:bg-gray-700 rounded-lg p-4 border-2 border-gray-200 dark:border-gray-600 hover:border-indigo-300 transition-colors"
                                    data-category="twistPace">
                                    <div class="flex items-center justify-between mb-3">
                                        <div>
                                            <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">반전/변화 속도</p>
                                            <p class="text-2xl font-bold text-indigo-600" id="ai-twistPace-score">-</p>
                                        </div>
                                        <div class="flex flex-col gap-1">
                                            <button
                                                class="tab-ai-btn px-3 py-1 text-xs bg-indigo-500 hover:bg-indigo-600 text-white rounded transition-colors"
                                                data-category="twistPace" title="AI 분석">
                                                <i class="fas fa-robot mr-1"></i>분석
                                            </button>
                                            <button
                                                class="tab-review-btn px-3 py-1 text-xs bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
                                                data-category="twistPace" title="검수">
                                                <i class="fas fa-check mr-1"></i>검수
                                            </button>
                                        </div>
                                    </div>
                                    <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                                        <div class="bg-indigo-600 h-1.5 rounded-full transition-all" style="width: 0%"
                                            id="progress-twistPace"></div>
                                    </div>
                                </div>

                                <!-- 재미/몰입 요소 탭 -->
                                <div class="bg-white dark:bg-gray-700 rounded-lg p-4 border-2 border-gray-200 dark:border-gray-600 hover:border-indigo-300 transition-colors"
                                    data-category="immersion">
                                    <div class="flex items-center justify-between mb-3">
                                        <div>
                                            <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">재미/몰입 요소</p>
                                            <p class="text-2xl font-bold text-indigo-600" id="ai-immersion-score">-</p>
                                        </div>
                                        <div class="flex flex-col gap-1">
                                            <button
                                                class="tab-ai-btn px-3 py-1 text-xs bg-indigo-500 hover:bg-indigo-600 text-white rounded transition-colors"
                                                data-category="immersion" title="AI 분석">
                                                <i class="fas fa-robot mr-1"></i>분석
                                            </button>
                                            <button
                                                class="tab-review-btn px-3 py-1 text-xs bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
                                                data-category="immersion" title="검수">
                                                <i class="fas fa-check mr-1"></i>검수
                                            </button>
                                        </div>
                                    </div>
                                    <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                                        <div class="bg-indigo-600 h-1.5 rounded-full transition-all" style="width: 0%"
                                            id="progress-immersion"></div>
                                    </div>
                                </div>
                            </div>

                            <!-- 상세 피드백 -->
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <!-- 주요 개선점 -->
                                <div
                                    class="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                                    <h4 class="font-medium text-red-800 dark:text-red-300 mb-2">
                                        <i class="fas fa-exclamation-triangle mr-2"></i>주요 개선점
                                    </h4>
                                    <ul id="korea-ai-issues"
                                        class="text-sm text-red-700 dark:text-red-300 space-y-1 list-disc list-inside">
                                        <li>-</li>
                                    </ul>
                                </div>

                                <!-- 전문가 추천 -->
                                <div
                                    class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                                    <h4 class="font-medium text-green-800 dark:text-green-300 mb-2">
                                        <i class="fas fa-thumbs-up mr-2"></i>전문가 추천사항
                                    </h4>
                                    <ul id="korea-ai-recommendations"
                                        class="text-sm text-green-700 dark:text-green-300 space-y-1 list-disc list-inside">
                                        <li>-</li>
                                    </ul>
                                </div>
                            </div>

                            <!-- 카테고리별 이슈/수정 제안 패널 -->
                            <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div
                                    class="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                    <div id="category-issues-title"
                                        class="font-semibold mb-2 text-gray-800 dark:text-white">이슈</div>
                                    <div id="category-issues-list" class="text-sm text-gray-700 dark:text-gray-300">
                                    </div>
                                </div>
                                <div
                                    class="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                    <div class="flex items-center justify-between mb-2">
                                        <div id="category-fixes-title"
                                            class="font-semibold text-gray-800 dark:text-white">수정 제안</div>
                                        <button id="auto-fix-all-btn" type="button"
                                            class="px-3 py-1 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700">
                                            전체 자동수정
                                        </button>
                                    </div>
                                    <div id="category-fixes-list" class="text-sm text-gray-700 dark:text-gray-300">
                                    </div>
                                </div>
                            </div>

                            <!-- AI 최종 판정 -->
                            <div class="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                <div class="flex items-center">
                                    <i class="fas fa-robot text-indigo-500 text-2xl mr-3"></i>
                                    <div>
                                        <p class="text-sm text-gray-500 dark:text-gray-400">AI 최종 평가</p>
                                        <p id="korea-ai-verdict-bottom"
                                            class="font-bold text-lg text-gray-800 dark:text-white">-</p>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <p class="text-sm text-gray-500 dark:text-gray-400">AI 종합 점수</p>
                                    <p id="korea-ai-overall-score-bottom" class="font-bold text-2xl text-indigo-600">-
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 오류 상세 분석 및 수정 패널 (Issues Panel) -->
                    <div id="korea-issues-section" class="hidden border-t border-gray-200 pt-6 mt-6">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="font-semibold text-gray-800 dark:text-white flex items-center">
                                <i class="fas fa-bug text-red-500 mr-2"></i>
                                오류 상세 분석 및 수정
                                <span
                                    class="ml-2 text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full dark:bg-red-900 dark:text-red-300">
                                    vNext
                                </span>
                            </h3>
                        </div>

                        <!-- 오류 통계 -->
                        <div id="issues-stats" class="mb-4">
                            <!-- JavaScript로 동적 생성 -->
                        </div>

                        <!-- 오류 리스트 패널 -->
                        <div id="issues-panel"
                            class="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                            <!-- JavaScript로 동적 생성 -->
                            <div class="text-center py-8 text-gray-400 dark:text-gray-500">
                                <i class="fas fa-search text-4xl mb-3"></i>
                                <p>검수 완료 후 발견된 오류가 여기에 표시됩니다.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Tab Content: 조선 야담 -->
        <section id="joseon-yadam" class="tab-content hidden">
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <!-- Content Header -->
                <div class="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-3">
                            <i class="fas fa-scroll text-white text-2xl"></i>
                            <div>
                                <h2 class="text-xl font-bold text-white">한국 조선 배경 야담</h2>
                                <p class="text-amber-100 text-sm">조선시대 배경의 전통 야담/설화 콘텐츠</p>
                            </div>
                        </div>
                        <span class="bg-white/20 text-white px-3 py-1 rounded-full text-sm">
                            <i class="fas fa-file-alt mr-1"></i> 대본 0건
                        </span>
                    </div>
                </div>

                <!-- Content Body -->
                <div class="p-6">
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <!-- 대본 입력 영역 -->
                        <div class="space-y-4">
                            <h3 class="font-semibold text-gray-800 flex items-center">
                                <i class="fas fa-edit text-primary mr-2"></i>
                                대본 입력
                            </h3>
                            <textarea
                                class="w-full h-80 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none font-mono text-sm"
                                placeholder="검수할 야담 대본을 입력하세요...

예시:
[씬 1. 한양 저잣거리 / 낮]

나레이션:
조선 영조 임금 시절, 한양 도성 안에
기이한 이야기가 떠돌았으니...

양반(40대):
허허, 이보게. 그 귀신 이야기 들었는가?

상인:
예, 나으리. 소문이 자자하옵니다..."></textarea>
                            <div class="flex space-x-2">
                                <button
                                    class="flex-1 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                                    <i class="fas fa-search mr-2"></i>검수 시작
                                </button>
                                <button
                                    class="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                                    <i class="fas fa-eraser"></i>
                                </button>
                            </div>
                        </div>

                        <!-- 검수 결과 영역 -->
                        <div class="space-y-4">
                            <h3 class="font-semibold text-gray-800 flex items-center">
                                <i class="fas fa-clipboard-check text-success mr-2"></i>
                                검수 결과
                            </h3>
                            <div class="h-80 border border-gray-200 rounded-lg bg-gray-50 p-4 overflow-y-auto">
                                <div class="flex flex-col items-center justify-center h-full text-gray-400">
                                    <i class="fas fa-inbox text-4xl mb-3"></i>
                                    <p class="text-sm">대본을 입력하고 검수를 시작하세요</p>
                                </div>
                            </div>
                            <div class="grid grid-cols-3 gap-2 text-center">
                                <div class="bg-gray-100 rounded-lg p-3">
                                    <p class="text-2xl font-bold text-gray-800">-</p>
                                    <p class="text-xs text-gray-500">총 씬</p>
                                </div>
                                <div class="bg-gray-100 rounded-lg p-3">
                                    <p class="text-2xl font-bold text-gray-800">-</p>
                                    <p class="text-xs text-gray-500">예상 시간</p>
                                </div>
                                <div class="bg-gray-100 rounded-lg p-3">
                                    <p class="text-2xl font-bold text-gray-800">-</p>
                                    <p class="text-xs text-gray-500">검수 점수</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Tab Content: 일본 시니어 낭독 -->
        <section id="japan-senior" class="tab-content hidden">
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <!-- Content Header -->
                <div class="bg-gradient-to-r from-pink-500 to-pink-600 px-6 py-4">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-3">
                            <i class="fas fa-torii-gate text-white text-2xl"></i>
                            <div>
                                <h2 class="text-xl font-bold text-white">일본 배경 시니어 낭독</h2>
                                <p class="text-pink-100 text-sm">일본 배경의 시니어 타겟 낭독 콘텐츠</p>
                            </div>
                        </div>
                        <span class="bg-white/20 text-white px-3 py-1 rounded-full text-sm">
                            <i class="fas fa-file-alt mr-1"></i> 대본 0건
                        </span>
                    </div>
                </div>

                <!-- Content Body -->
                <div class="p-6">
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <!-- 대본 입력 영역 -->
                        <div class="space-y-4">
                            <h3 class="font-semibold text-gray-800 flex items-center">
                                <i class="fas fa-edit text-primary mr-2"></i>
                                대본 입력
                            </h3>
                            <textarea
                                class="w-full h-80 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none font-mono text-sm"
                                placeholder="검수할 대본을 입력하세요...

예시:
[씬 1. 교토 골목길 / 저녁]

나레이션:
1960년대 교토의 한 골목.
석양이 물드는 시간이었습니다.

할아버지(70대):
그 시절 교토는 참 아름다웠지요.
전쟁의 상처가 아물어가던 때였습니다..."></textarea>
                            <div class="flex space-x-2">
                                <button
                                    class="flex-1 bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                                    <i class="fas fa-search mr-2"></i>검수 시작
                                </button>
                                <button
                                    class="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                                    <i class="fas fa-eraser"></i>
                                </button>
                            </div>
                        </div>

                        <!-- 검수 결과 영역 -->
                        <div class="space-y-4">
                            <h3 class="font-semibold text-gray-800 flex items-center">
                                <i class="fas fa-clipboard-check text-success mr-2"></i>
                                검수 결과
                            </h3>
                            <div class="h-80 border border-gray-200 rounded-lg bg-gray-50 p-4 overflow-y-auto">
                                <div class="flex flex-col items-center justify-center h-full text-gray-400">
                                    <i class="fas fa-inbox text-4xl mb-3"></i>
                                    <p class="text-sm">대본을 입력하고 검수를 시작하세요</p>
                                </div>
                            </div>
                            <div class="grid grid-cols-3 gap-2 text-center">
                                <div class="bg-gray-100 rounded-lg p-3">
                                    <p class="text-2xl font-bold text-gray-800">-</p>
                                    <p class="text-xs text-gray-500">총 씬</p>
                                </div>
                                <div class="bg-gray-100 rounded-lg p-3">
                                    <p class="text-2xl font-bold text-gray-800">-</p>
                                    <p class="text-xs text-gray-500">예상 시간</p>
                                </div>
                                <div class="bg-gray-100 rounded-lg p-3">
                                    <p class="text-2xl font-bold text-gray-800">-</p>
                                    <p class="text-xs text-gray-500">검수 점수</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Tab Content: 전세계 뉴스 -->
        <section id="world-news" class="tab-content hidden">
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <!-- Content Header -->
                <div class="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-3">
                            <i class="fas fa-globe text-white text-2xl"></i>
                            <div>
                                <h2 class="text-xl font-bold text-white">전세계 뉴스 관련</h2>
                                <p class="text-blue-100 text-sm">글로벌 뉴스/시사 관련 콘텐츠</p>
                            </div>
                        </div>
                        <span class="bg-white/20 text-white px-3 py-1 rounded-full text-sm">
                            <i class="fas fa-file-alt mr-1"></i> 대본 0건
                        </span>
                    </div>
                </div>

                <!-- Content Body -->
                <div class="p-6">
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <!-- 대본 입력 영역 -->
                        <div class="space-y-4">
                            <h3 class="font-semibold text-gray-800 flex items-center">
                                <i class="fas fa-edit text-primary mr-2"></i>
                                대본 입력
                            </h3>
                            <textarea
                                class="w-full h-80 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                                placeholder="검수할 뉴스 대본을 입력하세요...

예시:
[인트로]

앵커:
안녕하세요. 오늘의 글로벌 뉴스입니다.
먼저 첫 번째 소식입니다.

[본문 1]

나레이션:
미국 연방준비제도가 기준금리를
동결하기로 결정했습니다..."></textarea>
                            <div class="flex space-x-2">
                                <button
                                    class="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                                    <i class="fas fa-search mr-2"></i>검수 시작
                                </button>
                                <button
                                    class="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                                    <i class="fas fa-eraser"></i>
                                </button>
                            </div>
                        </div>

                        <!-- 검수 결과 영역 -->
                        <div class="space-y-4">
                            <h3 class="font-semibold text-gray-800 flex items-center">
                                <i class="fas fa-clipboard-check text-success mr-2"></i>
                                검수 결과
                            </h3>
                            <div class="h-80 border border-gray-200 rounded-lg bg-gray-50 p-4 overflow-y-auto">
                                <div class="flex flex-col items-center justify-center h-full text-gray-400">
                                    <i class="fas fa-inbox text-4xl mb-3"></i>
                                    <p class="text-sm">대본을 입력하고 검수를 시작하세요</p>
                                </div>
                            </div>
                            <div class="grid grid-cols-3 gap-2 text-center">
                                <div class="bg-gray-100 rounded-lg p-3">
                                    <p class="text-2xl font-bold text-gray-800">-</p>
                                    <p class="text-xs text-gray-500">총 씬</p>
                                </div>
                                <div class="bg-gray-100 rounded-lg p-3">
                                    <p class="text-2xl font-bold text-gray-800">-</p>
                                    <p class="text-xs text-gray-500">예상 시간</p>
                                </div>
                                <div class="bg-gray-100 rounded-lg p-3">
                                    <p class="text-2xl font-bold text-gray-800">-</p>
                                    <p class="text-xs text-gray-500">검수 점수</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

    </main>

    <!-- Footer -->
    <footer class="bg-dark text-gray-400 mt-8">
        <div class="container mx-auto px-4 py-6">
            <div class="flex flex-col md:flex-row justify-between items-center">
                <p class="text-sm">© 2025 대본 검수 시스템. All rights reserved.</p>
                <p class="text-sm mt-2 md:mt-0">
                    <i class="fas fa-code mr-1"></i> Built with passion for content creators
                </p>
            </div>
        </div>
    </footer>

    <!-- JavaScript -->
    <script src="./js/performance-utils.js"></script>
    <script src="./js/gemini-api.js"></script>
    <script src="./js/review-korea-senior.js"></script>
    <script src="./js/issues-manager.js"></script>
    <script src="./js/issues-ui.js"></script>
    <script src="./js/main.js"></script>

    <!-- main.js 로드 검증 -->
    <script>
        setTimeout(function () {
            if (!window.__MAIN_JS_LOADED__) {
                alert('⚠️ main.js 로드 실패\n\n경로 또는 404 오류를 확인하세요.\n\nDevTools → Network → JS 필터에서 main.js 상태를 확인하세요.');
                console.error('[FATAL] main.js 로드 실패 - 경로/404 확인 필요');
            } else {
                console.log('[BOOT] ✅ main.js 로드 성공');
            }
        }, 500);
    </script>
</body>

</html>
