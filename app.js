/**
 * Main SPA Controller for Chess UI & Engine Interactivity
 */

document.addEventListener('DOMContentLoaded', () => {
    // Check if Chess.js is loaded
    if (typeof Chess === 'undefined') {
        console.error('Chess.js library is missing!');
        return;
    }

    let game = new Chess();
    let startingFen = game.fen();
    let currentMode = 'play'; // 'play', 'vs-ai', or 'setup'
    let selectedSquare = null;
    let selectedPalettePiece = null;
    let recommendedMove = null;
    let boardFlipped = localStorage.getItem('boardFlipped') === 'true';

    // Round, Modern Duolingo-Style SVG Piece Renderer
    const PIECE_SVG_TEMPLATES = {
        'k': `<g>
            <!-- Ground shadow base -->
            <ellipse cx="22.5" cy="38" rx="10.5" ry="3" fill="{SHADOW}" />
            <!-- Pedestal Ring Base -->
            <ellipse cx="22.5" cy="35" rx="7.5" ry="2.2" fill="{CREASE}" stroke="{STROKE}" stroke-width="2" />
            <!-- Main Heart/Spade Bulbous King Body -->
            <path d="M14.5 34.5 C16 26, 9 21.5, 9 15.5 C9 10.5, 15 8, 22.5 8 C30 8, 36 10.5, 36 15.5 C36 21.5, 29 26, 30.5 34.5 Z" fill="{COLOR}" stroke="{STROKE}" stroke-width="2.2" stroke-linejoin="round"/>
            <!-- Inner Top Dome Oval -->
            <ellipse cx="22.5" cy="12.5" rx="7.5" ry="3.5" fill="{CREASE}" opacity="0.4" />
            <!-- Lower Front Heart Collar Rim -->
            <path d="M15 27 C17 31.5, 28 31.5, 30 27 C28 34.5, 17 34.5, 15 27 Z" fill="{CREASE}" opacity="0.35" />
            <!-- Top Royal Cross -->
            <path d="M22.5 2.5 V9.5 M19 6 H26" stroke="{STROKE}" stroke-width="2.8" stroke-linecap="round"/>
        </g>`,
        'q': `<g>
            <!-- Ground shadow base -->
            <ellipse cx="22.5" cy="38" rx="10.5" ry="3" fill="{SHADOW}" />
            <!-- Pedestal Ring Base -->
            <ellipse cx="22.5" cy="35" rx="7.5" ry="2.2" fill="{CREASE}" stroke="{STROKE}" stroke-width="2" />
            <!-- Main Flaring Crown Tiara Body -->
            <path d="M14.5 34.5 C16 26, 9 20, 9.5 14 L14 18.5 L18.5 11.5 L22.5 16.5 L26.5 11.5 L31 18.5 L35.5 14 C36 20, 29 26, 30.5 34.5 Z" fill="{COLOR}" stroke="{STROKE}" stroke-width="2.2" stroke-linejoin="round"/>
            <!-- Inner Crown Sphere / Cushion -->
            <ellipse cx="22.5" cy="18" rx="7.5" ry="5.5" fill="{CREASE}" opacity="0.38" />
            <!-- Front Crown Jewel -->
            <circle cx="22.5" cy="28.5" r="2.2" fill="{CREASE}" />
        </g>`,
        'r': `<g>
            <!-- Ground shadow -->
            <ellipse cx="22.5" cy="38.5" rx="11" ry="3.5" fill="{SHADOW}" />
            <!-- Main Rook Castle Body -->
            <path d="M12.5 36.5 C12 36.5 11.5 35.5 12 34 C13 30 14.5 24 14 20 C13.5 18 12.5 16 12 14 C11.5 12.5 12.5 11 14.5 11 H30.5 C32.5 11 33.5 12.5 33 14 C32.5 16 31.5 18 31 20 C30.5 24 32 30 33 34 C33.5 35.5 33 36.5 32.5 36.5 Z" fill="{COLOR}" stroke="{STROKE}" stroke-width="2.2" stroke-linejoin="round"/>
            <!-- Top battlements (rounded castle notches) -->
            <path d="M17.5 11 V14.5 M22.5 11 V14.5 M27.5 11 V14.5" stroke="{STROKE}" stroke-width="2" stroke-linecap="round"/>
            <!-- Signature Central Donut Ring -->
            <circle cx="22.5" cy="23.5" r="5.5" fill="{COLOR}" stroke="{CREASE}" stroke-width="2.5"/>
            <circle cx="22.5" cy="23.5" r="2.5" fill="{CREASE}"/>
            <!-- Specular shine spot on top-left -->
            <circle cx="16" cy="14.5" r="1.8" fill="{HIGHLIGHT}"/>
        </g>`,
        'b': `<g>
            <!-- Ground shadow base -->
            <ellipse cx="22.5" cy="38" rx="10.5" ry="3" fill="{SHADOW}" />
            <!-- Pedestal Ring Base -->
            <ellipse cx="22.5" cy="35" rx="7.5" ry="2.2" fill="{CREASE}" stroke="{STROKE}" stroke-width="2" />
            <!-- Main Bishop Mitre Body with Right Side Notch -->
            <path d="M22.5 10.5 C17.5 11.5, 11 16.5, 11 25 C11 31.5, 16 34.5, 22.5 34.5 C29 34.5, 34 31.5, 34 25 C34 25, 30.5 18, 30.5 18 L21 24.5 L33.5 26 C34 25.5, 34 25.2, 34 25 C34 16.5, 27.5 11.5, 22.5 10.5 Z" fill="{COLOR}" stroke="{STROKE}" stroke-width="2.2" stroke-linejoin="round"/>
            <!-- Inner Mouth Notch Cut Shading -->
            <path d="M30.5 18 L21 24.5 L33.5 26 Z" fill="{CREASE}" opacity="0.4" />
            <!-- Top Ball Finial -->
            <circle cx="22.5" cy="7.5" r="3.2" fill="{COLOR}" stroke="{STROKE}" stroke-width="2.2"/>
            <!-- Top-Left Highlight Pill -->
            <rect x="15" y="14" width="4.2" height="9.5" rx="2.1" transform="rotate(-34 17 18.5)" fill="{HIGHLIGHT}" opacity="0.8" />
        </g>`,
        'n': `<g>
            <!-- Ground shadow base -->
            <ellipse cx="22.5" cy="38" rx="11" ry="3.5" fill="{SHADOW}" />
            <!-- Main Knight Horse Body -->
            <path d="M32 36.5 C32 38, 13 38, 13 36.5 C13 32, 17 26.5, 17 24.5 C15.8 24 13.5 24.8 11.5 22.8 C9.8 21.1 9.8 18.5 11.8 16.8 L17 12 L16.2 6.5 C16 5.5 17.5 5.2 18.8 6.5 L21.5 10 C24.8 8.2 32 9.5 32 14.5 Z" fill="{COLOR}" stroke="{STROKE}" stroke-width="2.2" stroke-linejoin="round"/>
            <!-- Muzzle & Chest Front Shading Overlay (matching reference image) -->
            <path d="M17 12 L11.8 16.8 C9.8 18.5 9.8 21.1 11.5 22.8 C13.5 24.8 15.8 24 17 24.5 C17 26.5, 13 32, 13 36.5 C13 36.5 19 37.2 21.8 32 L20.2 19.8 Z" fill="{CREASE}" opacity="0.32" />
            <!-- Eye -->
            <ellipse cx="23.5" cy="16" rx="1.3" ry="2.2" fill="{STROKE}" />
            <!-- Smile / Cheek Crease -->
            <path d="M22 23 Q26 26.5 30 22.5" fill="none" stroke="{STROKE}" stroke-width="2.3" stroke-linecap="round" />
        </g>`,
        'p': `<g>
            <!-- Ground shadow -->
            <ellipse cx="22.5" cy="38.5" rx="10.5" ry="3.5" fill="{SHADOW}" />
            <!-- Lower pear body -->
            <path d="M14.5 22.5 C10.5 26.5 10.5 35 15 37 C18.5 38.5 26.5 38.5 30 37 C34.5 35 34.5 26.5 30.5 22.5 C26.5 20.5 18.5 20.5 14.5 22.5 Z" fill="{COLOR}" stroke="{STROKE}" stroke-width="2.2" stroke-linejoin="round"/>
            <!-- Neck shadow crease line -->
            <path d="M16.5 21.5 Q22.5 24 28.5 21.5" fill="none" stroke="{CREASE}" stroke-width="2.5" stroke-linecap="round"/>
            <!-- Head sphere -->
            <circle cx="22.5" cy="14" r="8.5" fill="{COLOR}" stroke="{STROKE}" stroke-width="2.2"/>
            <!-- Specular shine spot on top-left of head -->
            <circle cx="19.2" cy="11.2" r="2.8" fill="{HIGHLIGHT}"/>
        </g>`
    };

    function getPieceSvg(type, color) {
        const t = type.toLowerCase();
        const template = PIECE_SVG_TEMPLATES[t];
        if (!template) return '';

        const isWhite = color === 'w';
        const bodyColor = isWhite ? '#e6f0fa' : '#52585e';
        const strokeColor = isWhite ? '#a0b6cc' : '#373c41';
        const creaseColor = isWhite ? '#70889f' : '#2b2f33';
        const highlightColor = isWhite ? '#ffffff' : '#737a82';
        const shadowColor = isWhite ? 'rgba(0, 0, 0, 0.08)' : 'rgba(0, 0, 0, 0.16)';

        const svgContent = template
            .replace(/{COLOR}/g, bodyColor)
            .replace(/{STROKE}/g, strokeColor)
            .replace(/{CREASE}/g, creaseColor)
            .replace(/{HIGHLIGHT}/g, highlightColor)
            .replace(/{SHADOW}/g, shadowColor);

        return `<svg viewBox="0 0 45 45" class="chess-piece-svg piece-${color}">${svgContent}</svg>`;
    }

    // DOM Elements
    const chessboardEl = document.getElementById('chessboard');
    const modePlayBtn = document.getElementById('modePlayBtn');
    const autoAiToggleBtn = document.getElementById('autoAiToggleBtn');
    const modeSetupBtn = document.getElementById('modeSetupBtn');
    const turnBadge = document.getElementById('turnBadge');
    const piecePalette = document.getElementById('piecePalette');
    const flipBoardBtn = document.getElementById('flipBoardBtn');
    const resetBoardBtn = document.getElementById('resetBoardBtn');
    const clearBoardBtn = document.getElementById('clearBoardBtn');
    const copyBoardImageBtn = document.getElementById('copyBoardImageBtn');
    const findBestMoveBtn = document.getElementById('findBestMoveBtn');
    const suggestedMoveDisplay = document.getElementById('suggestedMoveDisplay');
    const moveDescription = document.getElementById('moveDescription');
    const evalBadge = document.getElementById('evalBadge');
    const statDepth = document.getElementById('statDepth');
    const statEstimatedNodes = document.getElementById('statEstimatedNodes');
    const statNodes = document.getElementById('statNodes');
    const statBranching = document.getElementById('statBranching');
    const statTime = document.getElementById('statTime');
    const statNps = document.getElementById('statNps');
    const fenInput = document.getElementById('fenInput');
    const applyFenBtn = document.getElementById('applyFenBtn');
    const fenStatus = document.getElementById('fenStatus');
    const depthSelect = document.getElementById('depthSelect');
    const threadsLabel = document.getElementById('threadsLabel');

    if (threadsLabel && window.workerPool) {
        const count = window.workerPool.workerCount;
        threadsLabel.textContent = `${count} ${count === 1 ? 'Hilo' : 'Hilos'}`;
    }

    // Interactive Turn Badge Listener
    if (turnBadge) {
        turnBadge.style.cursor = 'pointer';
        turnBadge.setAttribute('title', 'Haz clic para alternar el turno activo (Blancas / Negras)');
        turnBadge.addEventListener('click', () => {
            const fenParts = game.fen().split(' ');
            const newTurn = fenParts[1] === 'w' ? 'b' : 'w';
            fenParts[1] = newTurn;
            if (game.load(fenParts.join(' '))) {
                startingFen = game.fen();
                selectedSquare = null;
                recommendedMove = null;
                clearAnalysisResults();
                renderBoard();
                showFenStatus(`Turno cambiado a ${newTurn === 'w' ? 'Blancas' : 'Negras'}`, 'success');
                if (currentMode === 'vs-ai' && newTurn === 'b' && !game.game_over()) {
                    triggerAiBlackMove();
                }
            }
        });
    }

    // PRO Mode DOM Elements & State
    let isProModeActive = false;
    let isProPanelCollapsed = false;
    const toggleProModeBtn = document.getElementById('toggleProModeBtn');
    const exitProModeBtn = document.getElementById('exitProModeBtn');
    const collapseProPanelBtn = document.getElementById('collapseProPanelBtn');
    const toggleProPanelFloatingBtn = document.getElementById('toggleProPanelFloatingBtn');
    const proControlPanel = document.getElementById('proControlPanel');
    const proFindBestMoveBtn = document.getElementById('proFindBestMoveBtn');
    const proOpenApiSettingsBtn = document.getElementById('proOpenApiSettingsBtn');
    const proCopyBoardImageBtn = document.getElementById('proCopyBoardImageBtn');
    const proFlipBoardBtn = document.getElementById('proFlipBoardBtn');
    const proResetBoardBtn = document.getElementById('proResetBoardBtn');
    const proClearBoardBtn = document.getElementById('proClearBoardBtn');

    function toggleProMode() {
        if (isProModeActive) {
            exitProMode();
        } else {
            enterProMode();
        }
    }

    function collapseProPanel() {
        if (!isProModeActive) return;
        isProPanelCollapsed = true;
        if (proControlPanel) proControlPanel.classList.add('collapsed');
        if (toggleProPanelFloatingBtn) toggleProPanelFloatingBtn.classList.remove('hidden');
    }

    function expandProPanel() {
        if (!isProModeActive) return;
        isProPanelCollapsed = false;
        if (proControlPanel) proControlPanel.classList.remove('collapsed');
        if (toggleProPanelFloatingBtn) toggleProPanelFloatingBtn.classList.add('hidden');
    }

    function toggleProPanelCollapse() {
        if (isProPanelCollapsed) {
            expandProPanel();
        } else {
            collapseProPanel();
        }
    }

    function enterProMode() {
        if (currentMode === 'setup') {
            showFenStatus('Cambia a modo Análisis o VS IA para activar el Modo PRO', 'warning');
            return;
        }

        isProModeActive = true;
        isProPanelCollapsed = false;
        document.body.classList.add('pro-mode-active');
        if (toggleProModeBtn) toggleProModeBtn.classList.add('active');
        if (proControlPanel) {
            proControlPanel.classList.remove('hidden');
            proControlPanel.classList.remove('collapsed');
        }
        if (toggleProPanelFloatingBtn) toggleProPanelFloatingBtn.classList.add('hidden');

        try {
            if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(() => {});
            }
        } catch (e) {}

        showFenStatus('Modo PRO Activado (Presiona H para colapsar panel)', 'success');
        renderBoard();
    }

    function exitProMode() {
        if (!isProModeActive) return;

        isProModeActive = false;
        isProPanelCollapsed = false;
        document.body.classList.remove('pro-mode-active');
        if (toggleProModeBtn) toggleProModeBtn.classList.remove('active');
        if (proControlPanel) {
            proControlPanel.classList.add('hidden');
            proControlPanel.classList.remove('collapsed');
        }
        if (toggleProPanelFloatingBtn) toggleProPanelFloatingBtn.classList.add('hidden');

        try {
            if (document.fullscreenElement && document.exitFullscreen) {
                document.exitFullscreen().catch(() => {});
            }
        } catch (e) {}

        showFenStatus('Modo Normal Restaurado', 'info');
        renderBoard();
    }

    document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement && isProModeActive) {
            exitProMode();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (!isProModeActive) return;
        const targetTag = e.target.tagName.toLowerCase();
        if (targetTag === 'input' || targetTag === 'textarea' || targetTag === 'select') return;

        if (e.key === 'h' || e.key === 'H') {
            e.preventDefault();
            toggleProPanelCollapse();
        } else if (e.key === 'Escape') {
            exitProMode();
        }
    });

    if (toggleProModeBtn) toggleProModeBtn.addEventListener('click', toggleProMode);
    if (exitProModeBtn) exitProModeBtn.addEventListener('click', exitProMode);
    if (collapseProPanelBtn) {
        collapseProPanelBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            collapseProPanel();
        });
    }
    if (toggleProPanelFloatingBtn) {
        toggleProPanelFloatingBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            expandProPanel();
        });
    }
    if (proFindBestMoveBtn) proFindBestMoveBtn.addEventListener('click', () => calculateBestMove());
    if (proOpenApiSettingsBtn) proOpenApiSettingsBtn.addEventListener('click', () => openApiSettingsModal());
    if (proCopyBoardImageBtn && copyBoardImageBtn) proCopyBoardImageBtn.addEventListener('click', () => copyBoardImageBtn.click());
    if (proFlipBoardBtn && flipBoardBtn) proFlipBoardBtn.addEventListener('click', () => flipBoardBtn.click());
    if (proResetBoardBtn && resetBoardBtn) proResetBoardBtn.addEventListener('click', () => resetBoardBtn.click());
    if (proClearBoardBtn && clearBoardBtn) proClearBoardBtn.addEventListener('click', () => clearBoardBtn.click());

    // API Key & Storage Constants
    const STORAGE_KEY_API = 'gemini_api_key';
    const STORAGE_KEY_MODEL = 'gemini_model';

    // DOM Elements - Vision & API Settings
    const openApiSettingsBtn = document.getElementById('openApiSettingsBtn');
    const apiSettingsModal = document.getElementById('apiSettingsModal');
    const closeApiSettingsModalBtn = document.getElementById('closeApiSettingsModalBtn');
    const cancelApiSettingsBtn = document.getElementById('cancelApiSettingsBtn');
    const saveApiSettingsBtn = document.getElementById('saveApiSettingsBtn');
    const apiKeyInput = document.getElementById('apiKeyInput');
    const toggleApiKeyVisibility = document.getElementById('toggleApiKeyVisibility');
    const apiModelSelect = document.getElementById('apiModelSelect');
    const fetchModelsBtn = document.getElementById('fetchModelsBtn');
    const apiSettingsMessage = document.getElementById('apiSettingsMessage');

    const imageUploadInput = document.getElementById('imageUploadInput');
    const imageDropzone = document.getElementById('imageDropzone');
    const visionModal = document.getElementById('visionModal');
    const closeVisionModalBtn = document.getElementById('closeVisionModalBtn');
    const cancelVisionBtn = document.getElementById('cancelVisionBtn');
    const confirmVisionBtn = document.getElementById('confirmVisionBtn');
    const uploadedImagePreview = document.getElementById('uploadedImagePreview');
    const previewChessboard = document.getElementById('previewChessboard');
    const rawAiResponseText = document.getElementById('rawAiResponseText');
    const previewBoardSpinner = document.getElementById('previewBoardSpinner');

    // DOM Elements - Game Over Modal
    const gameOverModal = document.getElementById('gameOverModal');
    const gameOverCard = document.getElementById('gameOverCard');
    const gameOverIcon = document.getElementById('gameOverIcon');
    const gameOverTitle = document.getElementById('gameOverTitle');
    const gameOverSubtitle = document.getElementById('gameOverSubtitle');
    const gameOverNotationText = document.getElementById('gameOverNotationText');
    const gameOverReasonText = document.getElementById('gameOverReasonText');
    const gameOverExportSection = document.getElementById('gameOverExportSection');
    const exportPgnText = document.getElementById('exportPgnText');
    const exportFenHistoryText = document.getElementById('exportFenHistoryText');
    const copyPgnBtn = document.getElementById('copyPgnBtn');
    const copyFenHistoryBtn = document.getElementById('copyFenHistoryBtn');
    const modalInspectBtn = document.getElementById('modalInspectBtn');
    const modalExportToggleBtn = document.getElementById('modalExportToggleBtn');
    const modalResetBtn = document.getElementById('modalResetBtn');

    let hasShownGameOverModal = false;
    let previewGame = new Chess();

    // Load Saved API Settings & Initialize Board
    renderBoard();
    initPiecePalette();
    initApiSettings();

    async function initApiSettings() {
        const savedKey = localStorage.getItem(STORAGE_KEY_API) || '';
        const savedModel = localStorage.getItem(STORAGE_KEY_MODEL) || '';
        apiKeyInput.value = savedKey;

        if (savedKey) {
            await loadLiveModels(savedKey, savedModel);
        } else {
            apiModelSelect.innerHTML = `
                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
            `;
            if (savedModel) apiModelSelect.value = savedModel;
        }
    }

    async function loadLiveModels(apiKey, selectedModel = '') {
        try {
            fetchModelsBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Cargando...';
            showApiMessage('Consultando API de Google para obtener la lista oficial de modelos...', 'success');

            const models = await window.chessVisionEngine.getAvailableModels(apiKey);
            fetchModelsBtn.innerHTML = '<i class="fa-solid fa-arrows-rotate"></i> Obtener Modelos Reales';

            if (!models || models.length === 0) {
                showApiMessage('No se encontraron modelos con soporte multimodal en tu cuenta', 'error');
                return;
            }

            apiModelSelect.innerHTML = '';
            models.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m.id;
                opt.textContent = `${m.displayName} (${m.id})`;
                apiModelSelect.appendChild(opt);
            });

            if (selectedModel && Array.from(apiModelSelect.options).some(o => o.value === selectedModel)) {
                apiModelSelect.value = selectedModel;
            } else if (apiModelSelect.options.length > 0) {
                apiModelSelect.selectedIndex = 0;
            }

            showApiMessage(`¡${models.length} modelos disponibles cargados directamente desde tu cuenta!`, 'success');
        } catch (err) {
            fetchModelsBtn.innerHTML = '<i class="fa-solid fa-arrows-rotate"></i> Reintentar';
            showApiMessage(err.message, 'error');
        }
    }

    // Fetch models button click
    fetchModelsBtn.addEventListener('click', () => {
        const key = apiKeyInput.value.trim();
        if (!key) {
            showApiMessage('Ingresa tu API Key primero para listar los modelos', 'error');
            return;
        }
        loadLiveModels(key, apiModelSelect.value);
    });

    // Toggle API Key visibility
    toggleApiKeyVisibility.addEventListener('click', () => {
        const type = apiKeyInput.getAttribute('type') === 'password' ? 'text' : 'password';
        apiKeyInput.setAttribute('type', type);
        toggleApiKeyVisibility.innerHTML = type === 'password' ? '<i class="fa-regular fa-eye"></i>' : '<i class="fa-regular fa-eye-slash"></i>';
    });

    // Open/Close API Settings Modal
    openApiSettingsBtn.addEventListener('click', () => openApiSettingsModal());
    closeApiSettingsModalBtn.addEventListener('click', () => closeApiSettingsModal());
    cancelApiSettingsBtn.addEventListener('click', () => closeApiSettingsModal());

    saveApiSettingsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const key = apiKeyInput.value.trim();
        const model = apiModelSelect.value;

        if (!key) {
            showApiMessage('Ingresa una clave API válida', 'error');
            return;
        }

        localStorage.setItem(STORAGE_KEY_API, key);
        localStorage.setItem(STORAGE_KEY_MODEL, model);
        showApiMessage('¡Configuración guardada correctamente!', 'success');
        setTimeout(() => closeApiSettingsModal(), 1200);
    });

    function openApiSettingsModal(message = '') {
        initApiSettings();
        if (message) {
            showApiMessage(message, 'error');
        } else {
            apiSettingsMessage.textContent = '';
        }
        apiSettingsModal.classList.remove('hidden');
    }

    function closeApiSettingsModal() {
        apiSettingsModal.classList.add('hidden');
    }

    function showApiMessage(msg, type) {
        apiSettingsMessage.textContent = msg;
        apiSettingsMessage.className = `form-message ${type}`;
    }

    // Global Paste Listener (Ctrl+V)
    window.addEventListener('paste', (e) => {
        const items = (e.clipboardData || e.originalEvent.clipboardData).items;
        for (const item of items) {
            if (item.type.indexOf('image') === 0) {
                const blob = item.getAsFile();
                if (blob) {
                    processImageFile(blob);
                    e.preventDefault();
                    break;
                }
            }
        }
    });

    // File Input Upload
    imageUploadInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            processImageFile(e.target.files[0]);
        }
    });

    // Drag & Drop
    if (imageDropzone) {
        imageDropzone.addEventListener('click', () => imageUploadInput.click());
        imageDropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            imageDropzone.classList.add('dragover');
        });
        imageDropzone.addEventListener('dragleave', () => imageDropzone.classList.remove('dragover'));
        imageDropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            imageDropzone.classList.remove('dragover');
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                processImageFile(e.dataTransfer.files[0]);
            }
        });
    }

    // Modal Action Buttons
    closeVisionModalBtn.addEventListener('click', closeVisionModal);
    cancelVisionBtn.addEventListener('click', closeVisionModal);
    confirmVisionBtn.addEventListener('click', () => {
        game.load(previewGame.fen());
        startingFen = game.fen();
        selectedSquare = null;
        recommendedMove = null;
        renderBoard();
        clearAnalysisResults();
        closeVisionModal();
        showFenStatus('¡Posición cargada desde IA Gemini con éxito!', 'success');
    });

    /**
     * Process Image through Gemini Multimodal API (Immediate Modal Opening)
     */
    async function processImageFile(file) {
        // 1. Immediately create preview URL for uploaded image
        const imgObj = await window.chessVisionEngine.imageToBase64(file).catch(() => null);
        const previewUrl = imgObj ? imgObj.dataUrl : URL.createObjectURL(file);
        
        uploadedImagePreview.src = previewUrl;
        previewGame.clear();
        renderPreviewBoard();
        
        if (rawAiResponseText) {
            rawAiResponseText.value = 'Iniciando análisis...\nEnviando imagen a Gemini AI...';
        }
        
        // 2. OPEN VISION MODAL IMMEDIATELY!
        if (previewBoardSpinner) previewBoardSpinner.classList.remove('hidden');
        openVisionModal();

        // 3. Check API Key
        const apiKey = localStorage.getItem(STORAGE_KEY_API);
        const model = localStorage.getItem(STORAGE_KEY_MODEL) || 'gemini-3.5-flash-lite';

        if (!apiKey) {
            if (previewBoardSpinner) previewBoardSpinner.classList.add('hidden');
            if (rawAiResponseText) {
                rawAiResponseText.value = 'ERROR: No se ha ingresado una Clave API de Google AI Studio.\nPor favor presiona el botón "Clave API IA" en la barra superior de la aplicación para guardar tu clave.';
            }
            showFenStatus('Configura tu API Key de Google AI Studio', 'error');
            return;
        }

        // 4. Send request to Gemini REST API asynchronously
        try {
            showFenStatus(`Analizando posición con Gemini AI (${model})...`, 'success');
            const result = await window.chessVisionEngine.processImageWithGemini(file, apiKey, model);

            if (previewBoardSpinner) previewBoardSpinner.classList.add('hidden');
            if (rawAiResponseText) {
                rawAiResponseText.value = result.rawText || JSON.stringify(result.rawJson, null, 2);
            }

            if (result) {
                let isLoaded = false;
                try {
                    isLoaded = previewGame.load(result.fen);
                } catch (e) {
                    isLoaded = false;
                }

                // If strict FEN loading fails in chess.js, manually put pieces from board_matrix into previewGame!
                if (!isLoaded && result.rawJson && result.rawJson.board_matrix) {
                    previewGame.clear();
                    const matrix = result.rawJson.board_matrix;
                    for (let r = 0; r < 8; r++) {
                        for (let c = 0; c < 8; c++) {
                            const char = matrix[r]?.[c];
                            if (char && typeof char === 'string' && char !== 'null' && char !== 'None') {
                                const sq = String.fromCharCode(97 + c) + (8 - r);
                                const color = char === char.toUpperCase() ? 'w' : 'b';
                                previewGame.put({ type: char.toLowerCase(), color: color }, sq);
                            }
                        }
                    }
                }

                renderPreviewBoard();
                showFenStatus('¡Posición detectada por IA! Revisa y confirma.', 'success');
            }
        } catch (err) {
            if (previewBoardSpinner) previewBoardSpinner.classList.add('hidden');
            if (rawAiResponseText) {
                rawAiResponseText.value = `ERROR DE IA:\n${err.message}\n\nRevisa tu conexión o vuelve a intentar con otro modelo.`;
            }
            console.error('Error al analizar la imagen con Gemini:', err);
            showFenStatus(`Error de IA: ${err.message}`, 'error');
        }
    }

    function openVisionModal() {
        visionModal.classList.remove('hidden');
    }

    function closeVisionModal() {
        visionModal.classList.add('hidden');
    }

    /**
     * Renders the mini preview board in the modal with click-to-cycle piece correction
     */
    function renderPreviewBoard() {
        previewChessboard.innerHTML = '';
        const board = previewGame.board();

        const pieceCycle = ['P', 'N', 'B', 'R', 'Q', 'K', 'p', 'n', 'b', 'r', 'q', 'k', null];

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const file = String.fromCharCode(97 + c);
                const rank = 8 - r;
                const sq = `${file}${rank}`;
                const isLight = (r + c) % 2 === 0;

                const squareDiv = document.createElement('div');
                squareDiv.className = `square ${isLight ? 'light' : 'dark'}`;
                squareDiv.dataset.square = sq;

                const pieceObj = board[r][c];
                if (pieceObj) {
                    squareDiv.innerHTML = getPieceSvg(pieceObj.type, pieceObj.color);
                }

                // Click to cycle piece on misrecognized square
                squareDiv.addEventListener('click', () => {
                    const currentPiece = pieceObj ? (pieceObj.color === 'w' ? pieceObj.type.toUpperCase() : pieceObj.type) : null;
                    const nextIdx = (pieceCycle.indexOf(currentPiece) + 1) % pieceCycle.length;
                    const nextPiece = pieceCycle[nextIdx];

                    if (!nextPiece) {
                        previewGame.remove(sq);
                    } else {
                        const color = nextPiece === nextPiece.toUpperCase() ? 'w' : 'b';
                        previewGame.put({ type: nextPiece.toLowerCase(), color: color }, sq);
                    }
                    renderPreviewBoard();
                });

                previewChessboard.appendChild(squareDiv);
            }
        }
    }

    // Event Listeners for Mode Switching
    modePlayBtn.addEventListener('click', () => setMode('play'));
    autoAiToggleBtn.addEventListener('click', () => setMode('vs-ai'));
    modeSetupBtn.addEventListener('click', () => setMode('setup'));

    // Flip Board Action
    if (flipBoardBtn) {
        if (boardFlipped) flipBoardBtn.classList.add('active');
        flipBoardBtn.addEventListener('click', () => {
            boardFlipped = !boardFlipped;
            localStorage.setItem('boardFlipped', boardFlipped);
            if (boardFlipped) {
                flipBoardBtn.classList.add('active');
                showFenStatus('Tablero girado (Vista de Negras)', 'success');
            } else {
                flipBoardBtn.classList.remove('active');
                showFenStatus('Tablero en posición normal (Vista de Blancas)', 'success');
            }
            renderBoard();
        });
    }

    // Copy Board Screenshot with Coordinates to Clipboard
    if (copyBoardImageBtn) {
        copyBoardImageBtn.addEventListener('click', async () => {
            const boardWrapper = document.querySelector('.board-wrapper');
            if (!boardWrapper) return;

            showNotification('Generando captura HD del tablero...', 'info', 1500);

            try {
                if (typeof html2canvas === 'undefined') {
                    showNotification('El motor de captura se está cargando...', 'warning');
                    return;
                }

                const canvas = await html2canvas(boardWrapper, {
                    backgroundColor: '#0f172a',
                    scale: 2,
                    useCORS: true,
                    logging: false
                });

                canvas.toBlob(async (blob) => {
                    if (!blob) {
                        showNotification('Error al procesar la captura', 'error');
                        return;
                    }

                    try {
                        const item = new ClipboardItem({ 'image/png': blob });
                        await navigator.clipboard.write([item]);
                        showNotification('¡Captura del tablero con escalas copiada al portapapeles!', 'success', 4000);
                    } catch (err) {
                        console.warn('[Clipboard write fallback to download]', err);
                        const a = document.createElement('a');
                        a.href = canvas.toDataURL('image/png');
                        a.download = `tablero_ajedrez_${Date.now()}.png`;
                        a.click();
                        showNotification('Captura guardada como imagen PNG en Descargas', 'success', 4000);
                    }
                }, 'image/png');
            } catch (err) {
                console.error('[html2canvas error]', err);
                showNotification('Error al generar la captura del tablero', 'error');
            }
        });
    }

    // Reset & Clear
    resetBoardBtn.addEventListener('click', () => {
        game.reset();
        startingFen = game.fen();
        selectedSquare = null;
        recommendedMove = null;
        hasShownGameOverModal = false;
        renderBoard();
        clearAnalysisResults();
    });

    clearBoardBtn.addEventListener('click', () => {
        game.clear();
        startingFen = game.fen();
        selectedSquare = null;
        recommendedMove = null;
        hasShownGameOverModal = false;
        renderBoard();
        clearAnalysisResults();
    });

    // FEN Actions
    applyFenBtn.addEventListener('click', () => {
        const fenStr = fenInput.value.trim();
        if (game.load(fenStr)) {
            startingFen = game.fen();
            showFenStatus('FEN cargado correctamente', 'success');
            selectedSquare = null;
            recommendedMove = null;
            hasShownGameOverModal = false;
            renderBoard();
            clearAnalysisResults();
        } else {
            showFenStatus('Código FEN inválido', 'error');
        }
    });

    copyFenBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(game.fen()).then(() => {
            showFenStatus('FEN copiado al portapapeles', 'success');
        });
    });

    function initPiecePalette() {
        document.querySelectorAll('.palette-piece[data-piece]').forEach(el => {
            const piece = el.getAttribute('data-piece');
            if (piece !== 'NONE') {
                const color = piece === piece.toUpperCase() ? 'w' : 'b';
                el.innerHTML = getPieceSvg(piece, color);
            }
            el.setAttribute('draggable', 'true');

            el.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', `PALETTE:${piece}`);
                el.classList.add('dragging');
            });

            el.addEventListener('dragend', () => {
                el.classList.remove('dragging');
            });

            el.addEventListener('click', () => {
                document.querySelectorAll('.palette-piece').forEach(p => p.classList.remove('active'));
                if (selectedPalettePiece === piece) {
                    selectedPalettePiece = null;
                } else {
                    selectedPalettePiece = piece;
                    el.classList.add('active');
                }
            });
        });
    }

    // AI Best Move Trigger
    findBestMoveBtn.addEventListener('click', calculateBestMove);

    /**
     * Renders the 8x8 Chessboard
     */
    function renderBoard() {
        chessboardEl.innerHTML = '';
        const board = game.board();
        fenInput.value = game.fen();

        // Update rank and file labels based on orientation
        const ranksLabelsEl = document.getElementById('ranksLabels');
        const filesLabelsEl = document.getElementById('filesLabels');

        if (ranksLabelsEl) {
            const ranks = boardFlipped ? ['1', '2', '3', '4', '5', '6', '7', '8'] : ['8', '7', '6', '5', '4', '3', '2', '1'];
            ranksLabelsEl.innerHTML = ranks.map(r => `<span>${r}</span>`).join('');
        }
        if (filesLabelsEl) {
            const files = boardFlipped ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'] : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
            filesLabelsEl.innerHTML = files.map(f => `<span>${f}</span>`).join('');
        }

        const legalMovesFromSelected = (selectedSquare && currentMode !== 'setup') ? game.moves({ square: selectedSquare, verbose: true }) : [];
        const legalDestinations = legalMovesFromSelected.map(m => m.to);

        const rowIndices = boardFlipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
        const colIndices = boardFlipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];

        for (let rIdx = 0; rIdx < 8; rIdx++) {
            const r = rowIndices[rIdx];
            for (let cIdx = 0; cIdx < 8; cIdx++) {
                const c = colIndices[cIdx];
                const file = String.fromCharCode(97 + c);
                const rank = 8 - r;
                const squareSquare = `${file}${rank}`;
                const isLight = (r + c) % 2 === 0;

                const squareDiv = document.createElement('div');
                squareDiv.className = `square ${isLight ? 'light' : 'dark'}`;
                squareDiv.dataset.square = squareSquare;

                // Highlight selected square
                if (selectedSquare === squareSquare) {
                    squareDiv.classList.add('selected');
                }

                // Highlight recommended move
                if (recommendedMove) {
                    if (recommendedMove.from === squareSquare) {
                        squareDiv.classList.add('highlight-from');
                    } else if (recommendedMove.to === squareSquare) {
                        squareDiv.classList.add('highlight-to');
                    }
                }

                // Render Piece if present
                const pieceObj = board[r][c];
                const isMovable = pieceObj !== null;

                if (pieceObj) {
                    squareDiv.innerHTML = getPieceSvg(pieceObj.type, pieceObj.color);
                    // Highlight King if in Check
                    if (game.in_check() && pieceObj.type === 'k' && pieceObj.color === game.turn()) {
                        squareDiv.classList.add('in-check');
                    }

                    const canDrag = currentMode === 'setup' || (pieceObj && pieceObj.color === game.turn());
                    if (isMovable && canDrag) {
                        squareDiv.setAttribute('draggable', 'true');

                        squareDiv.addEventListener('dragstart', (e) => {
                            e.dataTransfer.setData('text/plain', squareSquare);
                            e.dataTransfer.effectAllowed = 'move';
                            squareDiv.classList.add('dragging');

                            if (selectedSquare !== squareSquare) {
                                selectedSquare = squareSquare;
                                renderBoard();
                            }
                        });

                        squareDiv.addEventListener('dragend', () => {
                            squareDiv.classList.remove('dragging');
                        });
                    }
                }

                // Legal move indicator
                if (legalDestinations.includes(squareSquare)) {
                    const dot = document.createElement('div');
                    dot.className = 'legal-dot';
                    squareDiv.appendChild(dot);
                }

                // Drag & Drop Target Listeners
                squareDiv.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                });

                squareDiv.addEventListener('dragenter', (e) => {
                    e.preventDefault();
                    squareDiv.classList.add('drag-target-over');
                });

                squareDiv.addEventListener('dragleave', () => {
                    squareDiv.classList.remove('drag-target-over');
                });

                squareDiv.addEventListener('drop', (e) => {
                    e.preventDefault();
                    squareDiv.classList.remove('drag-target-over');
                    const sourceData = e.dataTransfer.getData('text/plain');
                    if (!sourceData) return;

                    if (sourceData.startsWith('PALETTE:')) {
                        const piece = sourceData.replace('PALETTE:', '');
                        if (piece === 'NONE') {
                            game.remove(squareSquare);
                        } else {
                            const color = piece === piece.toUpperCase() ? 'w' : 'b';
                            const type = piece.toLowerCase();
                            game.put({ type: type, color: color }, squareSquare);
                        }
                        renderBoard();
                        clearAnalysisResults();
                    } else {
                        handleMoveOrPlace(sourceData, squareSquare);
                    }
                });

                // Click event for square
                squareDiv.addEventListener('click', () => handleSquareClick(squareSquare, pieceObj));

                chessboardEl.appendChild(squareDiv);
            }
        }
        updateTurnBadge();
        updateSearchEstimates();
        updateCapturedPieces();
        checkAndTriggerGameOverOverlay();
    }

    /**
     * Calculates and updates the captured pieces indicator bars and material advantage
     */
    function updateCapturedPieces() {
        const topListEl = document.getElementById('capturedTopList');
        const bottomListEl = document.getElementById('capturedBottomList');
        const topAdvantageEl = document.getElementById('capturedTopAdvantage');
        const bottomAdvantageEl = document.getElementById('capturedBottomAdvantage');
        const topPlayerIcon = document.getElementById('topPlayerIcon');
        const bottomPlayerIcon = document.getElementById('bottomPlayerIcon');
        const topPlayerName = document.getElementById('topPlayerName');
        const bottomPlayerName = document.getElementById('bottomPlayerName');

        if (!topListEl || !bottomListEl) return;

        // 1. Count remaining pieces on board
        const board = game.board();
        const whiteOnBoard = { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 };
        const blackOnBoard = { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 };

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = board[r][c];
                if (piece) {
                    if (piece.color === 'w') whiteOnBoard[piece.type]++;
                    else if (piece.color === 'b') blackOnBoard[piece.type]++;
                }
            }
        }

        // Standard starting counts & values
        const initial = { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 };
        const pieceOrder = ['p', 'n', 'b', 'r', 'q'];
        const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

        // Pieces captured BY White (missing Black pieces)
        const whiteCaptures = [];
        let whiteCapturedValue = 0;

        // Pieces captured BY Black (missing White pieces)
        const blackCaptures = [];
        let blackCapturedValue = 0;

        pieceOrder.forEach(type => {
            const missingBlack = Math.max(0, initial[type] - blackOnBoard[type]);
            if (missingBlack > 0) {
                whiteCaptures.push({ type, color: 'b', count: missingBlack });
                whiteCapturedValue += missingBlack * pieceValues[type];
            }

            const missingWhite = Math.max(0, initial[type] - whiteOnBoard[type]);
            if (missingWhite > 0) {
                blackCaptures.push({ type, color: 'w', count: missingWhite });
                blackCapturedValue += missingWhite * pieceValues[type];
            }
        });

        // 2. Determine top and bottom assignment based on boardFlipped
        // boardFlipped = false -> Top = Black, Bottom = White
        // boardFlipped = true  -> Top = White, Bottom = Black
        const topColor = boardFlipped ? 'w' : 'b';
        const bottomColor = boardFlipped ? 'b' : 'w';

        const topCaptures = topColor === 'w' ? whiteCaptures : blackCaptures;
        const bottomCaptures = bottomColor === 'w' ? whiteCaptures : blackCaptures;

        const topScore = topColor === 'w' ? whiteCapturedValue : blackCapturedValue;
        const bottomScore = bottomColor === 'w' ? whiteCapturedValue : blackCapturedValue;

        // Update player labels & icons
        if (topPlayerName) topPlayerName.textContent = topColor === 'w' ? 'Blancas' : 'Negras';
        if (bottomPlayerName) bottomPlayerName.textContent = bottomColor === 'w' ? 'Blancas' : 'Negras';

        if (topPlayerIcon) topPlayerIcon.style.color = topColor === 'w' ? '#ffffff' : '#4a5568';
        if (bottomPlayerIcon) bottomPlayerIcon.style.color = bottomColor === 'w' ? '#ffffff' : '#4a5568';

        // Helper to render HTML list of captured pieces
        const renderListHtml = (capturesList) => {
            if (capturesList.length === 0) {
                return '<span class="no-captures">— Sin capturas</span>';
            }
            return capturesList.map(item => {
                const svg = getPieceSvg(item.type, item.color);
                const countBadge = item.count > 1 ? `<span class="captured-count">×${item.count}</span>` : '';
                return `<div class="captured-piece-item" title="Pieza eliminada (${item.color === 'w' ? 'Blanca' : 'Negra'})">${svg}${countBadge}</div>`;
            }).join('');
        };

        topListEl.innerHTML = renderListHtml(topCaptures);
        bottomListEl.innerHTML = renderListHtml(bottomCaptures);

        // Render material advantage pill (+1, +3, etc.)
        const topDiff = topScore - bottomScore;
        const bottomDiff = bottomScore - topScore;

        if (topAdvantageEl) {
            if (topDiff > 0) {
                topAdvantageEl.textContent = `+${topDiff}`;
                topAdvantageEl.classList.remove('hidden');
            } else {
                topAdvantageEl.textContent = '';
                topAdvantageEl.classList.add('hidden');
            }
        }

        if (bottomAdvantageEl) {
            if (bottomDiff > 0) {
                bottomAdvantageEl.textContent = `+${bottomDiff}`;
                bottomAdvantageEl.classList.remove('hidden');
            } else {
                bottomAdvantageEl.textContent = '';
                bottomAdvantageEl.classList.add('hidden');
            }
        }
    }

    /**
     * Helper to dynamically adjust game turn to piece color in setup mode
     */
    function ensurePieceTurn(pieceObj) {
        if (currentMode === 'setup' && pieceObj && game.turn() !== pieceObj.color) {
            const fenParts = game.fen().split(' ');
            fenParts[1] = pieceObj.color;
            if (game.load(fenParts.join(' '))) {
                startingFen = game.fen();
            }
        }
    }

    /**
     * Unified Move or Place handler for Drag and Drop
     */
    function handleMoveOrPlace(fromSq, toSq) {
        if (!fromSq || !toSq || fromSq === toSq) return;

        if (currentMode === 'setup') {
            const sourcePiece = game.get(fromSq);
            if (sourcePiece) {
                game.remove(fromSq);
                game.put({ type: sourcePiece.type, color: sourcePiece.color }, toSq);
                startingFen = game.fen();
                selectedSquare = null;
                renderBoard();
                clearAnalysisResults();
            }
        } else {
            const moveResult = game.move({
                from: fromSq,
                to: toSq,
                promotion: 'q'
            });

            if (moveResult) {
                selectedSquare = null;
                recommendedMove = null;
                clearAnalysisResults();
                renderBoard();

                if (currentMode === 'vs-ai' && game.turn() === 'b' && !game.game_over()) {
                    triggerAiBlackMove();
                }
            } else {
                selectedSquare = null;
                renderBoard();
            }
        }
    }



    function updateTurnBadge() {
        if (!turnBadge) return;
        if (currentMode === 'setup') {
            const turnText = game.turn() === 'w' ? 'Blancas' : 'Negras';
            turnBadge.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Edición Libre (Inician ${turnText})`;
            turnBadge.className = 'badge turn-badge setup-mode-badge';
            turnBadge.title = 'Modo Edición Activo: Mueve cualquier pieza libremente. Clic para cambiar el turno inicial FEN.';
            return;
        }
        if (game.in_checkmate()) {
            const winner = game.turn() === 'w' ? 'Negras' : 'Blancas';
            turnBadge.innerHTML = `<i class="fa-solid fa-trophy" style="color: #ef4444;"></i> ¡Jaque Mate! Gana ${winner}`;
            turnBadge.className = 'badge turn-badge negative';
            return;
        }
        if (game.in_draw() || game.in_stalemate()) {
            turnBadge.innerHTML = `<i class="fa-solid fa-handshake"></i> ¡Tablas / Ahogado! Empate`;
            turnBadge.className = 'badge turn-badge neutral';
            return;
        }

        const turn = game.turn();
        const isCheck = game.in_check();

        if (turn === 'w') {
            const checkStr = isCheck ? ' — ¡EN JAQUE!' : '';
            turnBadge.innerHTML = `<i class="fa-solid fa-circle" style="color: #ffffff;"></i> Turno: Blancas${checkStr}`;
            turnBadge.className = 'badge turn-badge' + (isCheck ? ' negative' : '');
        } else {
            const checkStr = isCheck ? ' — ¡EN JAQUE!' : '';
            const statusText = currentMode === 'vs-ai' ? 'Turno: Negras (IA pensando...)' : 'Turno: Negras';
            turnBadge.innerHTML = `<i class="fa-solid fa-circle" style="color: #4a5568;"></i> ${statusText}${checkStr}`;
            turnBadge.className = 'badge turn-badge' + (isCheck ? ' negative' : '');
        }
    }

    async function triggerAiBlackMove() {
        if (game.game_over() || game.turn() !== 'b') return;

        updateTurnBadge();
        const targetDepth = parseFloat(depthSelect ? depthSelect.value : '6');

        const maxSearchTimeMs = 30000; // 30s max safety limit
        const result = await window.workerPool.searchBestMove(game.fen(), targetDepth, maxSearchTimeMs, (p) => {
            statNodes.textContent = p.nodes.toLocaleString();
            statTime.textContent = `${p.timeMs} ms`;
            statNps.textContent = `${(p.nps / 1000).toFixed(1)} kN/s`;
        });

        if (result && result.bestMove) {
            game.move(result.bestMove);
            recommendedMove = result.bestMove;

            suggestedMoveDisplay.innerHTML = `<span>${result.bestMove.san}</span> <small style="font-size: 0.9rem; color: var(--text-muted); font-weight: 400; margin-left: 0.5rem;">(${result.bestMove.from} → ${result.bestMove.to})</small>`;
            moveDescription.textContent = `IA (Negras) jugó ${result.bestMove.san}.`;
            
            const evalCenti = result.evaluation;
            const evalPawns = (evalCenti / 100).toFixed(2);
            evalBadge.textContent = evalPawns > 0 ? `+${evalPawns}` : `${evalPawns}`;
            evalBadge.className = 'eval-badge ' + (evalCenti > 50 ? 'positive' : evalCenti < -50 ? 'negative' : 'neutral');

            statDepth.textContent = `${result.depth} plies`;
            statNodes.textContent = result.nodesEvaluated.toLocaleString();
            statTime.textContent = `${result.timeMs} ms`;
            statNps.textContent = `${(result.nps / 1000).toFixed(1)} kN/s`;
        }

        renderBoard();
        updateTurnBadge();
    }

    /**
     * Handles clicks on individual board squares
     */
    function handleSquareClick(sq, pieceObj) {
        if (currentMode === 'setup') {
            handleSetupSquareClick(sq, pieceObj);
            return;
        }

        // Play / Analysis Mode
        if (selectedSquare) {
            if (selectedSquare === sq) {
                selectedSquare = null;
            } else {
                // Attempt move
                const moveResult = game.move({
                    from: selectedSquare,
                    to: sq,
                    promotion: 'q' // Default auto-promote to queen
                });

                if (moveResult) {
                    selectedSquare = null;
                    recommendedMove = null; // Clear previous recommendation on manual move
                    clearAnalysisResults();
                    renderBoard();

                    // If VS AI mode is active and it's Black's turn, trigger AI move automatically!
                    if (currentMode === 'vs-ai' && game.turn() === 'b' && !game.game_over()) {
                        triggerAiBlackMove();
                    }
                    return;
                } else {
                    // Selection failed: If clicking another piece of the active turn, switch selection to it
                    if (pieceObj && pieceObj.color === game.turn()) {
                        selectedSquare = sq;
                    } else {
                        selectedSquare = null;
                    }
                }
            }
        } else {
            // Select piece only if it belongs to the active turn
            if (pieceObj && pieceObj.color === game.turn()) {
                selectedSquare = sq;
            }
        }

        renderBoard();
    }

    /**
     * Handles square clicks during setup mode (Piece placement, deletion, or free movement)
     */
    function handleSetupSquareClick(sq, pieceObj) {
        // Mode A: Placement / Eraser from active palette selection
        if (selectedPalettePiece) {
            if (selectedPalettePiece === 'NONE') {
                game.remove(sq);
            } else {
                const color = selectedPalettePiece === selectedPalettePiece.toUpperCase() ? 'w' : 'b';
                const type = selectedPalettePiece.toLowerCase();
                game.put({ type: type, color: color }, sq);
            }
            startingFen = game.fen();
            selectedSquare = null;
            renderBoard();
            clearAnalysisResults();
            return;
        }

        // Mode B: Free-form Click-to-Move for ANY piece (White or Black) without turn restrictions
        if (selectedSquare) {
            if (selectedSquare === sq) {
                selectedSquare = null;
            } else {
                const sourcePiece = game.get(selectedSquare);
                if (sourcePiece) {
                    game.remove(selectedSquare);
                    game.put({ type: sourcePiece.type, color: sourcePiece.color }, sq);
                    clearAnalysisResults();
                }
                selectedSquare = null;
            }
        } else {
            if (pieceObj) {
                selectedSquare = sq;
            }
        }

        renderBoard();
    }

    /**
     * Validates if board configuration is valid for starting VS AI mode
     */
    function validateBoardForAi() {
        const board = game.board();
        let whiteKings = 0;
        let blackKings = 0;

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = board[r][c];
                if (p && p.type === 'k') {
                    if (p.color === 'w') whiteKings++;
                    if (p.color === 'b') blackKings++;
                }
            }
        }

        if (whiteKings !== 1 || blackKings !== 1) {
            return { valid: false, reason: 'El tablero requiere exactamente 1 Rey Blanco y 1 Rey Negro.' };
        }

        if (game.in_checkmate() || game.in_draw() || game.in_stalemate()) {
            return { valid: false, reason: 'La posición actual del tablero ya ha finalizado.' };
        }

        return { valid: true };
    }

    /**
     * Mode Switcher (Exclusive modes: 'play' | 'vs-ai' | 'setup')
     */
    function setMode(mode) {
        if (mode === 'vs-ai') {
            const validation = validateBoardForAi();
            if (!validation.valid) {
                showFenStatus(`No se puede activar VS IA: ${validation.reason}`, 'error');
                return false;
            }
        }

        if (mode === 'setup' && isProModeActive) {
            exitProMode();
        }

        if (window.workerPool && window.workerPool.isSearching) {
            window.workerPool.cancelSearch();
        }

        if (currentMode === 'setup' && mode !== 'setup') {
            startingFen = game.fen();
        }

        currentMode = mode;
        selectedSquare = null;
        recommendedMove = null;

        modePlayBtn.classList.toggle('active', mode === 'play');
        autoAiToggleBtn.classList.toggle('active', mode === 'vs-ai');
        modeSetupBtn.classList.toggle('active', mode === 'setup');
        piecePalette.classList.toggle('hidden', mode !== 'setup');

        if (mode === 'vs-ai') {
            showFenStatus('Modo VS IA Activado: La IA jugará con las Negras', 'success');
            if (game.turn() === 'b' && !game.game_over()) {
                triggerAiBlackMove();
            }
        } else if (mode === 'setup') {
            showFenStatus('Modo Edición Activado: Acomoda el tablero libremente', 'success');
        } else {
            showFenStatus('Modo Análisis / Juego Libre Activado', 'success');
        }

        renderBoard();
        updateTurnBadge();
        return true;
    }

    /**
     * Run Engine Analysis with Asynchronous Worker Pool
     */
    async function calculateBestMove() {
        if (currentMode === 'setup') {
            suggestedMoveDisplay.innerHTML = '<span class="placeholder-text">Cambia a modo Análisis o VS IA para calcular jugadas.</span>';
            return;
        }

        if (game.game_over()) {
            suggestedMoveDisplay.innerHTML = '<span class="placeholder-text">La partida ya ha finalizado.</span>';
            return;
        }

        if (window.workerPool && window.workerPool.isSearching) {
            window.workerPool.cancelSearch();
            findBestMoveBtn.disabled = false;
            findBestMoveBtn.innerHTML = `<i class="fa-solid fa-brain"></i> Calcular Mejor Jugada`;
            suggestedMoveDisplay.innerHTML = '<span class="placeholder-text">Búsqueda cancelada por el usuario.</span>';
            return;
        }

        const targetDepth = parseFloat(depthSelect ? depthSelect.value : '6');

        findBestMoveBtn.disabled = false;
        findBestMoveBtn.innerHTML = '<i class="fa-solid fa-xmark"></i> Cancelar Búsqueda';
        const threadsCount = window.workerPool ? window.workerPool.workerCount : 1;
        const threadText = threadsCount === 1 ? 'hilo' : 'hilos';
        suggestedMoveDisplay.innerHTML = `<span class="placeholder-text"><i class="fa-solid fa-gear fa-spin"></i> Evaluando (${targetDepth} capas / ${threadsCount} ${threadText})...</span>`;

        const maxSearchTimeMs = 30000; // 30s max safety limit
        const result = await window.workerPool.searchBestMove(game.fen(), targetDepth, maxSearchTimeMs, (p) => {
            statNodes.textContent = p.nodes.toLocaleString();
            statTime.textContent = `${p.timeMs} ms`;
            statNps.textContent = `${(p.nps / 1000).toFixed(1)} kN/s`;
        });

        findBestMoveBtn.innerHTML = `<i class="fa-solid fa-brain"></i> Calcular Mejor Jugada`;

        if (!result || !result.bestMove) {
            suggestedMoveDisplay.innerHTML = '<span class="placeholder-text">No hay movimientos legales disponibles.</span>';
            return;
        }

        recommendedMove = result.bestMove;
        const san = result.bestMove.san;
        const fromTo = `${result.bestMove.from} → ${result.bestMove.to}`;
        
        suggestedMoveDisplay.innerHTML = `<span>${san}</span> <small style="font-size: 0.9rem; color: var(--text-muted); font-weight: 400; margin-left: 0.5rem;">(${fromTo})</small>`;
        moveDescription.textContent = getMoveDescription(result.bestMove);

        const evalCenti = result.evaluation;
        const evalPawns = (evalCenti / 100).toFixed(2);
        evalBadge.textContent = evalPawns > 0 ? `+${evalPawns}` : `${evalPawns}`;
        evalBadge.className = 'eval-badge ' + (evalCenti > 50 ? 'positive' : evalCenti < -50 ? 'negative' : 'neutral');

        statDepth.textContent = `${result.depth} plies`;
        statNodes.textContent = result.nodesEvaluated.toLocaleString();
        statTime.textContent = `${result.timeMs} ms`;
        statNps.textContent = `${(result.nps / 1000).toFixed(1)} kN/s`;

        renderBoard();
    }

    /**
     * Generates a descriptive string for the recommended move
     */
    function getMoveDescription(move) {
        let desc = `Mover pieza de ${move.from.toUpperCase()} a ${move.to.toUpperCase()}.`;
        if (move.captured) {
            desc += ` Captura de pieza rival.`;
        }
        if (move.san.includes('+')) {
            desc += ` Genera ¡Jaque! al rey rival.`;
        } else if (move.san.includes('#')) {
            desc += ` ¡Jaque Mate! Victoria definitiva.`;
        }
        return desc;
    }

    function estimateNodes(gameObj, depth) {
        const rawMoves = gameObj.moves().length;
        if (rawMoves === 0) return 0;
        if (depth <= 0.5) return Math.max(1, Math.floor(rawMoves * 0.25));
        if (depth === 1) return rawMoves;

        const bEff = 3.8;
        return Math.round(rawMoves * Math.pow(bEff, depth - 1));
    }

    function formatNumberAbbrev(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
        return num.toLocaleString();
    }

    function updateSearchEstimates() {
        const d = parseFloat(depthSelect ? depthSelect.value : '6');
        const movesCount = game.moves().length;
        const estNodes = estimateNodes(game, d);

        if (statDepth) statDepth.textContent = `${d} plies`;
        if (statEstimatedNodes) statEstimatedNodes.textContent = `~ ${formatNumberAbbrev(estNodes)}`;
        if (statBranching) statBranching.textContent = `${movesCount} jugadas`;
    }

    if (depthSelect) {
        depthSelect.addEventListener('change', updateSearchEstimates);
    }

    function clearAnalysisResults() {
        suggestedMoveDisplay.innerHTML = '<span class="placeholder-text">Presiona "Calcular Mejor Jugada" para obtener la recomendación.</span>';
        moveDescription.textContent = '';
        evalBadge.textContent = '0.00';
        evalBadge.className = 'eval-badge neutral';
        statNodes.textContent = '-';
        statTime.textContent = '- ms';
        statNps.textContent = '- kN/s';
        updateSearchEstimates();
    }

    /**
     * System Toast Notification (Slides in from top-right corner, auto-dismisses, click-to-close)
     */
    function showNotification(msg, type = 'info', duration = 3800) {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        let iconClass = 'fa-circle-info';
        if (type === 'success') iconClass = 'fa-circle-check';
        else if (type === 'error') iconClass = 'fa-circle-xmark';
        else if (type === 'warning') iconClass = 'fa-triangle-exclamation';

        toast.innerHTML = `
            <i class="fa-solid ${iconClass} toast-icon"></i>
            <div class="toast-content">${msg}</div>
            <button class="toast-close-btn" title="Cerrar notificación"><i class="fa-solid fa-xmark"></i></button>
        `;

        const closeBtn = toast.querySelector('.toast-close-btn');
        let timer = null;

        const dismiss = () => {
            if (timer) clearTimeout(timer);
            toast.classList.remove('show');
            toast.classList.add('hide');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 360);
        };

        closeBtn.addEventListener('click', dismiss);

        container.appendChild(toast);
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        if (duration > 0) {
            timer = setTimeout(dismiss, duration);
        }
    }

    /**
     * Checks game state and displays the Game Over Modal Overlay if match is finished using official chess terminology
     */
    function checkAndTriggerGameOverOverlay() {
        if (currentMode === 'setup') return;
        if (!game.game_over()) {
            hasShownGameOverModal = false;
            return;
        }

        if (hasShownGameOverModal) return;

        let theme = 'theme-draw';
        let icon = 'fa-handshake';
        let title = '¡Tablas!';
        let subtitle = 'La partida ha concluido en tablas.';
        let notationStr = '½ - ½';
        let reasonStr = 'Tablas';

        if (game.in_checkmate()) {
            reasonStr = 'Jaque Mate';
            const turn = game.turn();
            if (turn === 'b') {
                // White won! (Black king is checkmated)
                notationStr = '1 - 0';
                theme = 'theme-victory';
                icon = 'fa-trophy';
                if (currentMode === 'vs-ai') {
                    title = '¡Jaque Mate! Victoria';
                    subtitle = '¡Has logrado hacer jaque mate a la Inteligencia Artificial!';
                } else {
                    title = '¡Jaque Mate!';
                    subtitle = 'Las piezas Blancas han ganado la partida por jaque mate (1 - 0).';
                }
            } else {
                // Black won! (White king is checkmated)
                notationStr = '0 - 1';
                if (currentMode === 'vs-ai') {
                    theme = 'theme-defeat';
                    icon = 'fa-heart-crack';
                    title = '¡Jaque Mate! Derrota';
                    subtitle = 'La Inteligencia Artificial te ha hecho jaque mate.';
                } else {
                    theme = 'theme-victory';
                    icon = 'fa-crown';
                    title = '¡Jaque Mate!';
                    subtitle = 'Las piezas Negras han ganado la partida por jaque mate (0 - 1).';
                }
            }
        } else if (game.in_stalemate()) {
            reasonStr = 'Tablas por Ahogado';
            subtitle = 'El rey del jugador en turno no está en jaque pero no dispone de movimientos legales.';
        } else if (game.in_threefold_repetition()) {
            reasonStr = 'Tablas por Triple Repetición';
            subtitle = 'La misma posición exacta en el tablero se ha repetido tres veces consecutivas.';
        } else if (game.insufficient_material()) {
            reasonStr = 'Tablas por Material Insuficiente';
            subtitle = 'Ninguno de los dos jugadores tiene piezas suficientes para forzar el jaque mate.';
        } else if (game.in_draw()) {
            reasonStr = 'Tablas (50 Movimientos)';
            subtitle = 'Se han cumplido 50 movimientos consecutivos sin capturas ni avance de peón.';
        }

        if (gameOverCard) {
            gameOverCard.className = `modal-card game-over-card ${theme}`;
        }
        if (gameOverIcon) {
            gameOverIcon.className = `fa-solid ${icon}`;
        }
        if (gameOverTitle) gameOverTitle.textContent = title;
        if (gameOverSubtitle) gameOverSubtitle.textContent = subtitle;
        if (gameOverNotationText) gameOverNotationText.textContent = notationStr;
        if (gameOverReasonText) gameOverReasonText.textContent = reasonStr;

        if (gameOverModal) {
            populateExportFields();
            gameOverModal.classList.remove('hidden');
            hasShownGameOverModal = true;
        }
    }

    /**
     * Generates PGN and FEN sequence step-by-step for game export
     */
    function populateExportFields() {
        if (!exportPgnText || !exportFenHistoryText) return;

        const dateStr = new Date().toISOString().slice(0, 10);
        let resStr = '1/2-1/2';
        if (game.in_checkmate()) {
            resStr = game.turn() === 'b' ? '1-0' : '0-1';
        }
        const pgnHeader = `[Event "Partida ChessMind AI"]\n[Date "${dateStr}"]\n[Result "${resStr}"]\n\n`;
        const rawPgn = game.pgn() || '';
        exportPgnText.value = (pgnHeader + rawPgn).trim();

        const historyMoves = game.history({ verbose: true });
        const tempGame = new Chess();
        if (!tempGame.load(startingFen)) {
            console.warn('[Export] FEN inicial no válido para reconstrucción:', startingFen);
        }
        const fenList = [tempGame.fen()];
        for (const m of historyMoves) {
            const moved = tempGame.move(m);
            if (!moved) {
                console.warn('[Export] Movimiento no válido para el FEN reconstruido:', m);
                break;
            }
            fenList.push(tempGame.fen());
        }

        exportFenHistoryText.value = fenList.map((f, idx) => {
            if (idx === 0) return `0. [Posición Inicial]: ${f}`;
            const moveNum = Math.ceil(idx / 2);
            const isWhite = idx % 2 !== 0;
            const prefix = isWhite ? `${moveNum}. Blancas` : `${moveNum}... Negras`;
            return `${prefix}: ${f}`;
        }).join('\n');
    }

    if (copyPgnBtn) {
        copyPgnBtn.addEventListener('click', () => {
            if (exportPgnText && exportPgnText.value) {
                navigator.clipboard.writeText(exportPgnText.value);
                showNotification('PGN copiado al portapapeles', 'success');
            }
        });
    }

    if (copyFenHistoryBtn) {
        copyFenHistoryBtn.addEventListener('click', () => {
            if (exportFenHistoryText && exportFenHistoryText.value) {
                navigator.clipboard.writeText(exportFenHistoryText.value);
                showNotification('Secuencia FEN copiada al portapapeles', 'success');
            }
        });
    }

    if (modalExportToggleBtn) {
        modalExportToggleBtn.addEventListener('click', () => {
            populateExportFields();
            if (gameOverExportSection) {
                gameOverExportSection.classList.toggle('hidden');
            }
        });
    }

    if (modalInspectBtn) {
        modalInspectBtn.addEventListener('click', () => {
            if (gameOverModal) gameOverModal.classList.add('hidden');
        });
    }

    if (modalResetBtn) {
        modalResetBtn.addEventListener('click', () => {
            game.reset();
            startingFen = game.fen();
            selectedSquare = null;
            recommendedMove = null;
            hasShownGameOverModal = false;
            if (gameOverExportSection) gameOverExportSection.classList.add('hidden');
            if (gameOverModal) gameOverModal.classList.add('hidden');
            renderBoard();
            clearAnalysisResults();
            showNotification('Partida reiniciada', 'info');
        });
    }

    function showFenStatus(msg, type) {
        showNotification(msg, type);
    }

    /**
     * Smooth 30 FPS Theme Color Animator for Browser Header
     */
    function initThemeColorAnimation() {
        const themeMeta = document.querySelector('meta[name="theme-color"]');
        if (!themeMeta) return;

        const darkPalette = [
            { r: 11, g: 15, b: 25 },   // #0b0f19 (Slate Dark)
            { r: 24, g: 34, b: 56 },   // #182238 (Deep Indigo Dark)
            { r: 15, g: 23, b: 42 },   // #0f172a (Midnight Slate)
            { r: 17, g: 24, b: 39 },   // #111827 (Dark Charcoal)
            { r: 9,  g: 13, b: 22 }    // #090d16 (Pro Ultra Dark)
        ];

        let currentIndex = 0;
        let progress = 0;
        const step = 0.005; // Rates transition speed (~6s per cycle)
        const frameInterval = 1000 / 30; // 33.33ms (30 FPS)
        let lastFrameTime = performance.now();

        function animateThemeColor(now) {
            if (now - lastFrameTime >= frameInterval) {
                lastFrameTime = now;

                const c1 = darkPalette[currentIndex];
                const nextIndex = (currentIndex + 1) % darkPalette.length;
                const c2 = darkPalette[nextIndex];

                progress += step;
                if (progress >= 1) {
                    progress = 0;
                    currentIndex = nextIndex;
                }

                // Smooth RGB interpolation
                const r = Math.round(c1.r + (c2.r - c1.r) * progress);
                const g = Math.round(c1.g + (c2.g - c1.g) * progress);
                const b = Math.round(c1.b + (c2.b - c1.b) * progress);

                const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
                themeMeta.setAttribute('content', hex);
            }

            requestAnimationFrame(animateThemeColor);
        }

        requestAnimationFrame(animateThemeColor);
    }

    initThemeColorAnimation();
});
