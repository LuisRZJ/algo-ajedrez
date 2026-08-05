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
    let currentMode = 'play'; // 'play' or 'setup'
    let vsAiMode = false; // Mode VS AI (AI plays Black)
    let selectedSquare = null;
    let selectedPalettePiece = null;
    let recommendedMove = null;

    // Round, Modern Duolingo-Style SVG Piece Renderer
    const PIECE_SVG_TEMPLATES = {
        'k': `<g>
            <ellipse cx="22.5" cy="38" rx="11" ry="3.5" fill="{SHADOW}" />
            <path d="M22.5 5v5M20 7.5h5" stroke="{STROKE}" stroke-width="2.5" stroke-linecap="round"/>
            <path d="M22.5 13c-7.5 0-12 5-12 11 0 4 2.5 7 5.5 9 3 2 4.5 3 4.5 5h4c0-2 1.5-3 4.5-5 3-2 5.5-5 5.5-9 0-6-4.5-11-12-11z" fill="{COLOR}" stroke="{STROKE}" stroke-width="2.2" stroke-linejoin="round"/>
            <path d="M15.5 38h14" stroke="{STROKE}" stroke-width="2.5" stroke-linecap="round"/>
        </g>`,
        'q': `<g>
            <ellipse cx="22.5" cy="38" rx="11" ry="3.5" fill="{SHADOW}" />
            <path d="M12 15l-3 9 6-2 7.5-10 7.5 10 6 2-3-9z" fill="{COLOR}" stroke="{STROKE}" stroke-width="2.2" stroke-linejoin="round"/>
            <path d="M11 24c0 0 2 6 11.5 6S34 24 34 24s1 7.5-3.5 11-8 3-8 3h-4s-3.5 0-8-3S11 24 11 24z" fill="{COLOR}" stroke="{STROKE}" stroke-width="2.2" stroke-linejoin="round"/>
            <circle cx="22.5" cy="10.5" r="2.2" fill="{COLOR}" stroke="{STROKE}" stroke-width="1.8"/>
            <path d="M15 38h15" stroke="{STROKE}" stroke-width="2.5" stroke-linecap="round"/>
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
            <ellipse cx="22.5" cy="38" rx="11" ry="3.5" fill="{SHADOW}" />
            <path d="M22.5 9c-5.5 0-9.5 4.5-9.5 10.5 0 4.5 3 7.5 6 9.5 2.5 1.5 3.5 3 3.5 5h5c0-2 1-3.5 3.5-5 3-2 6-5 6-9.5C32 13.5 28 9 22.5 9z" fill="{COLOR}" stroke="{STROKE}" stroke-width="2.2" stroke-linejoin="round"/>
            <path d="M24.5 15l-6 6" stroke="{STROKE}" stroke-width="2.2" stroke-linecap="round"/>
            <circle cx="22.5" cy="6.5" r="1.8" fill="{COLOR}" stroke="{STROKE}" stroke-width="1.5"/>
            <path d="M16 38h13" stroke="{STROKE}" stroke-width="2.5" stroke-linecap="round"/>
        </g>`,
        'n': `<g>
            <ellipse cx="22.5" cy="38" rx="11" ry="3.5" fill="{SHADOW}" />
            <path d="M14 36v-3c0-3 1.5-5.5 4-7.5.5-2.5 0-5.5-2-7.5-2-2-1-4.5 1-6 2.5-2 6.5-2.5 10.5-.5 3 1.5 5 4 5 7.5 0 3-1.5 6.5-3.5 8.5-2 2-3 4.5-3 8.5H14z" fill="{COLOR}" stroke="{STROKE}" stroke-width="2.2" stroke-linejoin="round"/>
            <circle cx="20.5" cy="18.5" r="1.5" fill="{STROKE}"/>
            <path d="M15 38h14" stroke="{STROKE}" stroke-width="2.5" stroke-linecap="round"/>
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
    const resetBoardBtn = document.getElementById('resetBoardBtn');
    const clearBoardBtn = document.getElementById('clearBoardBtn');
    const findBestMoveBtn = document.getElementById('findBestMoveBtn');
    const suggestedMoveDisplay = document.getElementById('suggestedMoveDisplay');
    const moveDescription = document.getElementById('moveDescription');
    const evalBadge = document.getElementById('evalBadge');
    const statDepth = document.getElementById('statDepth');
    const statNodes = document.getElementById('statNodes');
    const statTime = document.getElementById('statTime');
    const statNps = document.getElementById('statNps');
    const fenInput = document.getElementById('fenInput');
    const applyFenBtn = document.getElementById('applyFenBtn');
    const fenStatus = document.getElementById('fenStatus');
    const depthSelect = document.getElementById('depthSelect');
    const threadsLabel = document.getElementById('threadsLabel');

    if (threadsLabel && window.workerPool) {
        threadsLabel.textContent = `${window.workerPool.workerCount} Hilos`;
    }

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
    modeSetupBtn.addEventListener('click', () => setMode('setup'));

    // Reset & Clear
    resetBoardBtn.addEventListener('click', () => {
        game.reset();
        selectedSquare = null;
        recommendedMove = null;
        renderBoard();
        clearAnalysisResults();
    });

    clearBoardBtn.addEventListener('click', () => {
        game.clear();
        selectedSquare = null;
        recommendedMove = null;
        renderBoard();
        clearAnalysisResults();
    });

    // FEN Actions
    applyFenBtn.addEventListener('click', () => {
        const fenStr = fenInput.value.trim();
        if (game.load(fenStr)) {
            showFenStatus('FEN cargado correctamente', 'success');
            selectedSquare = null;
            recommendedMove = null;
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

        const legalMovesFromSelected = selectedSquare ? game.moves({ square: selectedSquare, verbose: true }) : [];
        const legalDestinations = legalMovesFromSelected.map(m => m.to);

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
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
                if (pieceObj) {
                    squareDiv.innerHTML = getPieceSvg(pieceObj.type, pieceObj.color);
                    // Highlight King if in Check
                    if (game.in_check() && pieceObj.type === 'k' && pieceObj.color === game.turn()) {
                        squareDiv.classList.add('in-check');
                    }
                }

                // Legal move indicator
                if (legalDestinations.includes(squareSquare)) {
                    const dot = document.createElement('div');
                    dot.className = 'legal-dot';
                    squareDiv.appendChild(dot);
                }

                // Click event for square
                squareDiv.addEventListener('click', () => handleSquareClick(squareSquare, pieceObj));

                chessboardEl.appendChild(squareDiv);
            }
        }
        updateTurnBadge();
    }

    // Toggle VS AI Mode
    autoAiToggleBtn.addEventListener('click', () => {
        vsAiMode = !vsAiMode;
        if (vsAiMode) {
            autoAiToggleBtn.classList.add('active');
            showFenStatus('Modo VS IA Activado: La IA jugará con las Negras', 'success');
            if (game.turn() === 'b' && !game.game_over()) {
                triggerAiBlackMove();
            }
        } else {
            autoAiToggleBtn.classList.remove('active');
            showFenStatus('Modo VS IA Desactivado', 'success');
        }
        updateTurnBadge();
    });

    function updateTurnBadge() {
        if (!turnBadge) return;
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
            turnBadge.innerHTML = `<i class="fa-solid fa-circle" style="color: #ffffff;"></i> Turno: Blancas (Tú)${checkStr}`;
            turnBadge.className = 'badge turn-badge' + (isCheck ? ' negative' : '');
        } else {
            const checkStr = isCheck ? ' — ¡EN JAQUE!' : '';
            const statusText = vsAiMode ? 'Turno: Negras (IA pensando...)' : 'Turno: Negras';
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
            handleSetupSquareClick(sq);
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
                    if (vsAiMode && game.turn() === 'b' && !game.game_over()) {
                        triggerAiBlackMove();
                    }
                    return;
                } else {
                    // Select new piece if same turn
                    if (pieceObj && pieceObj.color === game.turn()) {
                        selectedSquare = sq;
                    } else {
                        selectedSquare = null;
                    }
                }
            }
        } else {
            if (pieceObj && pieceObj.color === game.turn()) {
                selectedSquare = sq;
            }
        }

        renderBoard();
    }

    /**
     * Handles square clicks during setup mode (Piece placement / deletion)
     */
    function handleSetupSquareClick(sq) {
        if (!selectedPalettePiece) return;

        if (selectedPalettePiece === 'NONE') {
            game.remove(sq);
        } else {
            const color = selectedPalettePiece === selectedPalettePiece.toUpperCase() ? 'w' : 'b';
            const type = selectedPalettePiece.toLowerCase();
            game.put({ type: type, color: color }, sq);
        }

        // Update turn in FEN to White if needed
        let currentFen = game.fen();
        const fenParts = currentFen.split(' ');
        fenParts[1] = 'w'; // Force white's turn for analysis
        game.load(fenParts.join(' '));

        renderBoard();
        clearAnalysisResults();
    }

    /**
     * Mode Switcher
     */
    function setMode(mode) {
        currentMode = mode;
        selectedSquare = null;

        if (mode === 'play') {
            modePlayBtn.classList.add('active');
            modeSetupBtn.classList.remove('active');
            piecePalette.classList.add('hidden');
        } else {
            modeSetupBtn.classList.add('active');
            modePlayBtn.classList.remove('active');
            piecePalette.classList.remove('hidden');
        }
        renderBoard();
    }

    /**
     * Run Engine Analysis with Asynchronous Worker Pool
     */
    async function calculateBestMove() {
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
        suggestedMoveDisplay.innerHTML = `<span class="placeholder-text"><i class="fa-solid fa-gear fa-spin"></i> Evaluando (${targetDepth} capas / ${window.workerPool.workerCount} hilos)...</span>`;

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

    function clearAnalysisResults() {
        suggestedMoveDisplay.innerHTML = '<span class="placeholder-text">Presiona "Calcular Mejor Jugada" para obtener la recomendación.</span>';
        moveDescription.textContent = '';
        evalBadge.textContent = '0.00';
        evalBadge.className = 'eval-badge neutral';
        statNodes.textContent = '-';
        statTime.textContent = '- ms';
        statNps.textContent = '- kN/s';
    }

    function showFenStatus(msg, type) {
        fenStatus.textContent = msg;
        fenStatus.className = `fen-status ${type}`;
        setTimeout(() => {
            fenStatus.textContent = '';
            fenStatus.className = 'fen-status';
        }, 3000);
    }
});
