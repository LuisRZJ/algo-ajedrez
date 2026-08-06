/**
 * Web Worker for Parallel Chess Engine Minimax Search
 */

importScripts('chess.min.js');

class WorkerChessEngine {
    constructor() {
        this.nodesEvaluated = 0;
        this.transpositionTable = new Map();

        this.PIECE_VALUES = {
            'p': 100,
            'n': 320,
            'b': 330,
            'r': 500,
            'q': 900,
            'k': 20000
        };

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

    minimax(game, depth, alpha, beta, isMaximizing, startTime, maxTimeMs) {
        this.nodesEvaluated++;

        if ((this.nodesEvaluated & 1023) === 0) {
            if (performance.now() - startTime > maxTimeMs) {
                return null;
            }
            self.postMessage({ type: 'PROGRESS_UPDATE', nodes: 1024 });
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

                if (evaluation === null) return null;

                maxEval = Math.max(maxEval, evaluation);
                alpha = Math.max(alpha, evaluation);
                if (beta <= alpha) break;
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (let i = 0; i < moves.length; i++) {
                game.move(moves[i]);
                const evaluation = this.minimax(game, depth - 1, alpha, beta, true, startTime, maxTimeMs);
                game.undo();

                if (evaluation === null) return null;

                minEval = Math.min(minEval, evaluation);
                beta = Math.min(beta, evaluation);
                if (beta <= alpha) break;
            }
            return minEval;
        }
    }

    searchSubtree(fen, assignedMoves, targetDepth, maxTimeMs) {
        this.nodesEvaluated = 0;
        this.transpositionTable.clear();
        const startTime = performance.now();

        const game = new Chess(fen);
        const isWhite = game.turn() === 'w';

        if (targetDepth <= 0.25) {
            let bestMove = assignedMoves[0];
            let bestEval = isWhite ? -Infinity : Infinity;

            for (let i = 0; i < assignedMoves.length; i++) {
                const move = assignedMoves[i];
                game.move(move);
                this.nodesEvaluated++;
                // Slight variance (-15 to +15 centipawns) for 0.25 depth novice feel
                const noise = (Math.random() * 30 - 15);
                const evalScore = this.evaluateBoard(game) + noise;
                game.undo();

                if (isWhite) {
                    if (evalScore > bestEval) {
                        bestEval = evalScore;
                        bestMove = move;
                    }
                } else {
                    if (evalScore < bestEval) {
                        bestEval = evalScore;
                        bestMove = move;
                    }
                }
            }

            return {
                bestMove: bestMove || assignedMoves[0],
                evaluation: Math.round(bestEval),
                nodesEvaluated: this.nodesEvaluated,
                depth: 0.25,
                timeMs: Math.round(performance.now() - startTime)
            };
        }

        let bestMoveGlobal = null;
        let bestEvalGlobal = isWhite ? -Infinity : Infinity;
        let reachedDepth = 1;

        for (let currentDepth = 1; currentDepth <= Math.floor(targetDepth) || currentDepth <= 1; currentDepth++) {
            let bestMoveCurrent = null;
            let bestEvalCurrent = isWhite ? -Infinity : Infinity;
            let alpha = -Infinity;
            let beta = Infinity;

            const moves = this.orderMoves(game, assignedMoves);
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

            console.log(`[Diagnostic Worker] currentDepth: ${currentDepth}, nodesEvaluated: ${this.nodesEvaluated}, timedOut: ${timedOut}, elapsed: ${(performance.now() - startTime).toFixed(2)}ms`);

            if (timedOut) {
                console.log(`[Diagnostic Worker] Loop BROKEN by timedOut === true at depth ${currentDepth}`);
                break;
            }

            if (bestMoveCurrent) {
                bestMoveGlobal = bestMoveCurrent;
                bestEvalGlobal = bestEvalCurrent;
                reachedDepth = currentDepth;

                const fenKey = game.fen();
                this.transpositionTable.set(fenKey, { bestMove: bestMoveCurrent, depth: currentDepth, eval: bestEvalCurrent });
            }

            // Only stop if explicit maxTimeMs limit exceeded
            if (maxTimeMs && maxTimeMs !== Infinity && performance.now() - startTime > maxTimeMs) {
                console.log(`[Diagnostic Worker] Loop BROKEN by maxTimeMs threshold at depth ${currentDepth}`);
                break;
            }
        }

        return {
            bestMove: bestMoveGlobal || assignedMoves[0],
            evaluation: bestEvalGlobal,
            nodesEvaluated: this.nodesEvaluated,
            depth: reachedDepth,
            timeMs: Math.round(performance.now() - startTime)
        };
    }
}

const workerEngine = new WorkerChessEngine();

self.onmessage = function (e) {
    const { id, task, fen, assignedMoves, targetDepth, maxTimeMs } = e.data;
    if (task === 'SEARCH_SUBTREE') {
        const result = workerEngine.searchSubtree(fen, assignedMoves, targetDepth, maxTimeMs);
        self.postMessage({ type: 'SEARCH_COMPLETE', id, result });
    }
};
