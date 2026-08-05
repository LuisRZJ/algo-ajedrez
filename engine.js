/**
 * Chess AI Engine for White Player
 * Minimax algorithm with Alpha-Beta Pruning & Piece-Square Tables (PST)
 */

class ChessEngine {
    constructor() {
        this.nodesEvaluated = 0;
        this.transpositionTable = new Map();

        // Base piece values in centipawns
        this.PIECE_VALUES = {
            'p': 100,
            'n': 320,
            'b': 330,
            'r': 500,
            'q': 900,
            'k': 20000
        };

        // Piece-Square Tables (from White's perspective, row 0 = rank 8, row 7 = rank 1)
        this.PST = {
            p: [
                [0,  0,  0,  0,  0,  0,  0,  0],
                [50, 50, 50, 50, 50, 50, 50, 50],
                [10, 10, 20, 30, 30, 20, 10, 10],
                [ 5,  5, 10, 27, 27, 10,  5,  5],
                [ 0,  0,  0, 25, 25,  0,  0,  0],
                [ 5, -5,-10,  0,  0,-10, -5,  5],
                [ 5, 10, 10,-25,-25, 10, 10,  5],
                [0,  0,  0,  0,  0,  0,  0,  0]
            ],
            n: [
                [-50,-40,-30,-30,-30,-30,-40,-50],
                [-40,-20,  0,  0,  0,  0,-20,-40],
                [-30,  0, 10, 15, 15, 10,  0,-30],
                [-30,  5, 15, 20, 20, 15,  5,-30],
                [-30,  0, 15, 20, 20, 15,  0,-30],
                [-30,  5, 10, 15, 15, 10,  5,-30],
                [-40,-20,  0,  5,  5,  0,-20,-40],
                [-50,-40,-30,-30,-30,-30,-40,-50]
            ],
            b: [
                [-20,-10,-10,-10,-10,-10,-10,-20],
                [-10,  0,  0,  0,  0,  0,  0,-10],
                [-10,  0,  5, 10, 10,  5,  0,-10],
                [-10,  5,  5, 10, 10,  5,  5,-10],
                [-10,  0, 10, 10, 10, 10,  0,-10],
                [-10, 10, 10, 10, 10, 10, 10,-10],
                [-10,  5,  0,  0,  0,  0,  5,-10],
                [-20,-10,-10,-10,-10,-10,-10,-20]
            ],
            r: [
                [ 0,  0,  0,  0,  0,  0,  0,  0],
                [ 5, 10, 10, 10, 10, 10, 10,  5],
                [-5,  0,  0,  0,  0,  0,  0, -5],
                [-5,  0,  0,  0,  0,  0,  0, -5],
                [-5,  0,  0,  0,  0,  0,  0, -5],
                [-5,  0,  0,  0,  0,  0,  0, -5],
                [-5,  0,  0,  0,  0,  0,  0, -5],
                [ 0,  0,  0,  5,  5,  0,  0,  0]
            ],
            q: [
                [-20,-10,-10, -5, -5,-10,-10,-20],
                [-10,  0,  0,  0,  0,  0,  0,-10],
                [-10,  0,  5,  5,  5,  5,  0,-10],
                [ -5,  0,  5,  5,  5,  5,  0, -5],
                [  0,  0,  5,  5,  5,  5,  0, -5],
                [-10,  5,  5,  5,  5,  5,  0,-10],
                [-10,  0,  5,  0,  0,  0,  0,-10],
                [-20,-10,-10, -5, -5,-10,-10,-20]
            ],
            k: [
                [-30,-40,-40,-50,-50,-40,-40,-30],
                [-30,-40,-40,-50,-50,-40,-40,-30],
                [-30,-40,-40,-50,-50,-40,-40,-30],
                [-30,-40,-40,-50,-50,-40,-40,-30],
                [-20,-30,-30,-40,-40,-30,-30,-20],
                [-10,-20,-20,-20,-20,-20,-20,-10],
                [ 20, 20,  0,  0,  0,  0, 20, 20],
                [ 20, 30, 10,  0,  0, 10, 30, 20]
            ]
        };
    }

    /**
     * Evaluates position from White's perspective (+ values mean White advantage)
     */
    evaluateBoard(game) {
        if (game.in_checkmate()) {
            return game.turn() === 'w' ? -99999 : 99999;
        }
        if (game.in_draw() || game.in_stalemate() || game.in_threefold_repetition()) {
            return 0;
        }

        let totalEval = 0;
        const board = game.board();

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const piece = board[r][c];
                if (piece) {
                    const type = piece.type;
                    const color = piece.color;
                    const value = this.PIECE_VALUES[type];

                    const pstRow = color === 'w' ? r : 7 - r;
                    const pstBonus = this.PST[type][pstRow][c];

                    const pieceEval = value + pstBonus;

                    if (color === 'w') {
                        totalEval += pieceEval;
                    } else {
                        totalEval -= pieceEval;
                    }
                }
            }
        }

        return totalEval;
    }

    /**
     * Move ordering with Transposition Table best move prioritization
     */
    orderMoves(game, moves) {
        const fenKey = game.fen();
        const ttEntry = this.transpositionTable.get(fenKey);
        const ttMoveSan = ttEntry?.bestMove?.san;

        return moves.sort((a, b) => {
            let scoreA = 0;
            let scoreB = 0;

            if (ttMoveSan) {
                if (a.san === ttMoveSan) scoreA += 10000;
                if (b.san === ttMoveSan) scoreB += 10000;
            }

            if (a.captured) {
                const victimVal = this.PIECE_VALUES[a.captured] || 0;
                const attackerVal = this.PIECE_VALUES[a.piece] || 0;
                scoreA += 10 * victimVal - attackerVal;
            }
            if (b.captured) {
                const victimVal = this.PIECE_VALUES[b.captured] || 0;
                const attackerVal = this.PIECE_VALUES[b.piece] || 0;
                scoreB += 10 * victimVal - attackerVal;
            }

            if (a.promotion) scoreA += 800;
            if (b.promotion) scoreB += 800;

            return scoreB - scoreA;
        });
    }

    /**
     * Minimax with Alpha-Beta Pruning and Time Safety Check
     */
    minimax(game, depth, alpha, beta, isMaximizing, startTime, maxTimeMs) {
        this.nodesEvaluated++;

        // Periodic time safety check every 2048 nodes
        if ((this.nodesEvaluated & 2047) === 0) {
            if (performance.now() - startTime > maxTimeMs) {
                return null; // Signals search timeout
            }
        }

        if (depth === 0 || game.game_over()) {
            return this.evaluateBoard(game);
        }

        const rawMoves = game.moves({ verbose: true });
        const moves = this.orderMoves(game, rawMoves);

        if (isMaximizing) {
            let maxEval = -Infinity;
            for (let i = 0; i < moves.length; i++) {
                game.move(moves[i]);
                const evaluation = this.minimax(game, depth - 1, alpha, beta, false, startTime, maxTimeMs);
                game.undo();

                if (evaluation === null) return null; // Timeout

                maxEval = Math.max(maxEval, evaluation);
                alpha = Math.max(alpha, evaluation);
                if (beta <= alpha) {
                    break; // Beta cutoff
                }
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (let i = 0; i < moves.length; i++) {
                game.move(moves[i]);
                const evaluation = this.minimax(game, depth - 1, alpha, beta, true, startTime, maxTimeMs);
                game.undo();

                if (evaluation === null) return null; // Timeout

                minEval = Math.min(minEval, evaluation);
                beta = Math.min(beta, evaluation);
                if (beta <= alpha) {
                    break; // Alpha cutoff
                }
            }
            return minEval;
        }
    }

    /**
     * Iterative Deepening Search with Transposition Table and Time Limit (default maxTimeMs = 3500)
     */
    getBestMove(game, targetDepth = 5, maxTimeMs = 3500) {
        this.nodesEvaluated = 0;
        this.transpositionTable.clear();
        const startTime = performance.now();

        const rawMoves = game.moves({ verbose: true });
        if (rawMoves.length === 0) {
            return null;
        }

        let bestMoveGlobal = null;
        let bestEvalGlobal = 0;
        let reachedDepth = 1;

        for (let currentDepth = 1; currentDepth <= targetDepth; currentDepth++) {
            const isWhite = game.turn() === 'w';
            let bestMoveCurrent = null;
            let bestEvalCurrent = isWhite ? -Infinity : Infinity;
            let alpha = -Infinity;
            let beta = Infinity;

            const moves = this.orderMoves(game, rawMoves);
            let timedOut = false;

            for (let i = 0; i < moves.length; i++) {
                const move = moves[i];
                game.move(move);

                const evaluation = this.minimax(game, currentDepth - 1, alpha, beta, !isWhite, startTime, maxTimeMs);
                game.undo();

                if (evaluation === null) {
                    timedOut = true;
                    break;
                }

                if (isWhite) {
                    if (evaluation > bestEvalCurrent) {
                        bestEvalCurrent = evaluation;
                        bestMoveCurrent = move;
                    }
                    alpha = Math.max(alpha, evaluation);
                } else {
                    if (evaluation < bestEvalCurrent) {
                        bestEvalCurrent = evaluation;
                        bestMoveCurrent = move;
                    }
                    beta = Math.min(beta, evaluation);
                }

                if (beta <= alpha) break;
            }

            if (timedOut) break;

            if (bestMoveCurrent) {
                bestMoveGlobal = bestMoveCurrent;
                bestEvalGlobal = bestEvalCurrent;
                reachedDepth = currentDepth;

                const fenKey = game.fen();
                this.transpositionTable.set(fenKey, { bestMove: bestMoveCurrent, depth: currentDepth, eval: bestEvalCurrent });
            }

            // Stop if time exceeded 70% of max time limit
            if (performance.now() - startTime > maxTimeMs * 0.75) break;
        }

        const endTime = performance.now();
        const timeMs = Math.round(endTime - startTime);

        return {
            bestMove: bestMoveGlobal || rawMoves[0],
            evaluation: bestEvalGlobal,
            nodesEvaluated: this.nodesEvaluated,
            depth: reachedDepth,
            timeMs: timeMs,
            nps: timeMs > 0 ? Math.round((this.nodesEvaluated / timeMs) * 1000) : 0
        };
    }
}

// Global instance
window.chessEngine = new ChessEngine();
