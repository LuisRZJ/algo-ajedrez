/**
 * Chess Vision Engine powered by Google AI Studio (Gemini Multimodal API)
 */

class ChessVisionEngine {
    /**
     * Fetch all available models supporting generateContent for the given API Key
     */
    async getAvailableModels(apiKey) {
        if (!apiKey) {
            throw new Error('MISSING_API_KEY');
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`;
        const response = await fetch(url);

        if (!response.ok) {
            const errJson = await response.json().catch(() => ({}));
            const errMsg = errJson.error?.message || `HTTP ${response.status} ${response.statusText}`;
            throw new Error(`Error al listar modelos: ${errMsg}`);
        }

        const data = await response.json();
        const rawModels = data.models || [];

        // Filter models that support generateContent
        const contentModels = rawModels.filter(m => 
            m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')
        );

        return contentModels.map(m => {
            const cleanId = m.name.replace(/^models\//, '');
            return {
                id: cleanId,
                rawName: m.name,
                displayName: m.displayName || cleanId,
                description: m.description || ''
            };
        });
    }

    /**
     * Process image file or Blob with Gemini Multimodal API
     */
    async processImageWithGemini(imageSource, apiKey, model = 'gemini-3.5-flash-lite') {
        if (!apiKey) {
            throw new Error('MISSING_API_KEY');
        }

        const { base64Data, mimeType, dataUrl } = await this.imageToBase64(imageSource);

        const cleanModel = model.replace(/^models\//, '');
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(cleanModel)}:generateContent?key=${encodeURIComponent(apiKey)}`;

        const promptText = `You are a Grandmaster Chess Vision AI.
Analyze this 8x8 chessboard screenshot carefully.
The White player is playing from the bottom of the screen (ranks 1-2 at bottom, ranks 7-8 at top, files a to h from left to right).

Identify all pieces on each square from rank 8 (top) down to rank 1 (bottom), files a to h:
- White pieces: P (pawn), N (knight), B (bishop), R (rook), Q (queen), K (king).
- Black pieces: p (pawn), n (knight), b (bishop), r (rook), q (queen), k (king).
- Empty square: null.

Return ONLY a valid JSON object matching this exact schema:
{
  "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1",
  "board_matrix": [
    ["r", "n", "b", "q", "k", "b", "n", "r"],
    ["p", "p", "p", "p", "p", "p", "p", "p"],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    ["P", "P", "P", "P", "P", "P", "P", "P"],
    ["R", "N", "B", "Q", "K", "B", "N", "R"]
  ]
}`;

        const payload = {
            contents: [
                {
                    parts: [
                        {
                            inlineData: {
                                mimeType: mimeType || 'image/png',
                                data: base64Data
                            }
                        },
                        {
                            text: promptText
                        }
                    ]
                }
            ],
            generationConfig: {
                temperature: 0.1,
                response_mime_type: "application/json"
            }
        };

        console.log(`[ChessVisionEngine] Sending request to Gemini (${cleanModel})...`);
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errJson = await response.json().catch(() => ({}));
            const errMsg = errJson.error?.message || `HTTP ${response.status} ${response.statusText}`;
            console.error('[ChessVisionEngine] API Error response:', errJson);
            throw new Error(`Gemini API Error (${cleanModel}): ${errMsg}`);
        }

        const responseData = await response.json();
        console.log('[ChessVisionEngine] Raw Gemini Response:', responseData);

        const candidateText = responseData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!candidateText) {
            throw new Error('Respuesta vacía de Gemini AI.');
        }

        // Strip markdown backticks if present
        let cleanText = candidateText.trim();
        cleanText = cleanText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

        let parsedResult;
        try {
            parsedResult = JSON.parse(cleanText);
        } catch (e) {
            console.error('[ChessVisionEngine] Failed to parse JSON:', candidateText);
            throw new Error('Formato JSON inválido recibido de Gemini.');
        }

        let fen = parsedResult.fen ? parsedResult.fen.trim() : null;

        // Reconstruct from board_matrix if needed or if FEN missing
        if (!fen || !this.isValidFen(fen)) {
            if (parsedResult.board_matrix && Array.isArray(parsedResult.board_matrix)) {
                fen = this.matrixToFen(parsedResult.board_matrix);
            }
        }

        if (fen) {
            // Ensure FEN has 6 fields
            const parts = fen.trim().split(/\s+/);
            if (parts.length === 1) {
                fen = parts[0] + ' w - - 0 1';
            } else if (parts.length < 6) {
                fen = parts[0] + ' w - - 0 1';
            }
        }

        console.log('[ChessVisionEngine] Extracted FEN:', fen);

        return {
            imgSrc: dataUrl,
            fen: fen || '8/8/8/8/8/8/8/8 w - - 0 1',
            rawJson: parsedResult,
            rawText: candidateText
        };
    }

    isValidFen(fenStr) {
        if (!fenStr) return false;
        try {
            const temp = new Chess();
            const fenToTest = fenStr.includes(' ') ? fenStr : fenStr + ' w - - 0 1';
            return temp.load(fenToTest);
        } catch (e) {
            return false;
        }
    }

    /**
     * Converts File, Blob or Image to Base64 object
     */
    imageToBase64(source) {
        return new Promise((resolve, reject) => {
            if (source instanceof File || source instanceof Blob) {
                const reader = new FileReader();
                reader.onload = () => {
                    const dataUrl = reader.result;
                    const mimeType = dataUrl.substring(dataUrl.indexOf(':') + 1, dataUrl.indexOf(';'));
                    const base64Data = dataUrl.substring(dataUrl.indexOf(',') + 1);
                    resolve({ base64Data, mimeType, dataUrl });
                };
                reader.onerror = (err) => reject(err);
                reader.readAsDataURL(source);
            } else {
                reject(new Error('Invalid image object'));
            }
        });
    }

    /**
     * Helper to construct FEN from 2D array matrix
     */
    matrixToFen(matrix) {
        if (!matrix || !Array.isArray(matrix)) return '8/8/8/8/8/8/8/8 w - - 0 1';
        const fenRows = [];
        for (let r = 0; r < 8; r++) {
            let emptyCount = 0;
            let rowStr = '';
            const rowData = matrix[r] || [];
            for (let c = 0; c < 8; c++) {
                const rawChar = rowData[c];
                const char = (rawChar && typeof rawChar === 'string' && rawChar.trim()) ? rawChar.trim() : null;
                if (!char || char === 'null' || char === 'None') {
                    emptyCount++;
                } else {
                    if (emptyCount > 0) {
                        rowStr += emptyCount;
                        emptyCount = 0;
                    }
                    rowStr += char;
                }
            }
            if (emptyCount > 0) {
                rowStr += emptyCount;
            }
            fenRows.push(rowStr);
        }
        return fenRows.join('/') + ' w - - 0 1';
    }
}

window.chessVisionEngine = new ChessVisionEngine();
