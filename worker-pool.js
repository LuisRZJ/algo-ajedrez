/**
 * Multi-Threaded Web Worker Pool Manager for Parallel Chess Search
 */

class WorkerPoolManager {
    constructor() {
        this.workerCount = Math.max(1, navigator.hardwareConcurrency || 2);
        this.workers = [];
        this.isSearching = false;
        this.activeSearchId = 0;
        this.initWorkers();

        // Kill all active worker threads immediately when reloading or navigating away
        if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', () => this.terminateAll());
            window.addEventListener('pagehide', () => this.terminateAll());
        }
    }

    initWorkers() {
        this.terminateAll();
        this.workers = [];
        for (let i = 0; i < this.workerCount; i++) {
            try {
                const w = new Worker('engine-worker.js');
                w.onerror = (err) => {
                    console.error(`[WorkerPool] Worker ${i} encountered an error:`, err);
                };
                this.workers.push(w);
            } catch (err) {
                console.error('[WorkerPool] Error creating Web Worker:', err);
            }
        }
        if (this.workers.length === 0) {
            console.warn('[WorkerPool] Web Workers not available, fallback to single thread.');
        }
    }

    terminateAll() {
        this.workers.forEach(w => {
            try { w.terminate(); } catch (e) {}
        });
        this.workers = [];
        this.isSearching = false;
    }

    cancelSearch() {
        this.activeSearchId++;
        this.initWorkers();
    }

    async searchBestMove(fen, targetDepth = 6, maxTimeMs = Infinity, onProgress = null) {
        this.cancelSearch(); // Cancel any existing search

        const currentSearchId = ++this.activeSearchId;
        this.isSearching = true;

        const tempGame = new Chess(fen);
        const rawMoves = tempGame.moves({ verbose: true });
        if (rawMoves.length === 0) {
            this.isSearching = false;
            return null;
        }

        const isWhite = tempGame.turn() === 'w';

        // Single Worker or Single Thread Fallback if Workers not supported or only 1 move
        const availableWorkers = Math.min(this.workers.length, rawMoves.length);
        if (availableWorkers <= 1) {
            return new Promise((resolve) => {
                const worker = this.workers[0];
                if (!worker) {
                    // Single thread fallback
                    const res = window.chessEngine ? window.chessEngine.getBestMove(tempGame, targetDepth, maxTimeMs) : null;
                    this.isSearching = false;
                    resolve(res);
                    return;
                }

                let totalNodes = 0;
                const startTime = performance.now();

                const handleMsg = (e) => {
                    if (this.activeSearchId !== currentSearchId) return;
                    if (e.data.type === 'PROGRESS_UPDATE') {
                        totalNodes += e.data.nodes;
                        if (onProgress) {
                            const timeMs = Math.max(1, Math.round(performance.now() - startTime));
                            onProgress({ nodes: totalNodes, timeMs, nps: Math.round((totalNodes / timeMs) * 1000) });
                        }
                    } else if (e.data.type === 'SEARCH_COMPLETE') {
                        cleanup();
                        this.isSearching = false;
                        const finalRes = e.data.result;
                        finalRes.nps = finalRes.timeMs > 0 ? Math.round((finalRes.nodesEvaluated / finalRes.timeMs) * 1000) : 0;
                        resolve(finalRes);
                    }
                };

                const handleError = (err) => {
                    console.error('[WorkerPool] Worker error during search, falling back to main thread engine:', err);
                    cleanup();
                    const res = window.chessEngine ? window.chessEngine.getBestMove(tempGame, targetDepth, maxTimeMs) : null;
                    this.isSearching = false;
                    resolve(res);
                };

                const cleanup = () => {
                    worker.removeEventListener('message', handleMsg);
                    worker.removeEventListener('error', handleError);
                };

                worker.addEventListener('message', handleMsg);
                worker.addEventListener('error', handleError);

                try {
                    worker.postMessage({
                        id: currentSearchId,
                        task: 'SEARCH_SUBTREE',
                        fen,
                        assignedMoves: rawMoves,
                        targetDepth,
                        maxTimeMs
                    });
                } catch (postErr) {
                    handleError(postErr);
                }
            });
        }

        // Parallel Multi-Core Root Splitting
        const moveBatches = Array.from({ length: availableWorkers }, () => []);
        rawMoves.forEach((m, idx) => {
            moveBatches[idx % availableWorkers].push(m);
        });

        let totalNodesEvaluated = 0;
        let completedWorkers = 0;
        const results = [];
        const startTime = performance.now();

        return new Promise((resolve) => {
            let hasFallenBack = false;

            const triggerFallback = (err) => {
                if (hasFallenBack || this.activeSearchId !== currentSearchId) return;
                hasFallenBack = true;
                console.error('[WorkerPool] Worker error during parallel search, falling back to main thread engine:', err);
                const res = window.chessEngine ? window.chessEngine.getBestMove(tempGame, targetDepth, maxTimeMs) : null;
                this.isSearching = false;
                resolve(res);
            };

            moveBatches.forEach((batch, workerIdx) => {
                const worker = this.workers[workerIdx];

                const handleMsg = (e) => {
                    if (this.activeSearchId !== currentSearchId || hasFallenBack) return;

                    if (e.data.type === 'PROGRESS_UPDATE') {
                        totalNodesEvaluated += e.data.nodes;
                        if (onProgress) {
                            const timeMs = Math.max(1, Math.round(performance.now() - startTime));
                            onProgress({
                                nodes: totalNodesEvaluated,
                                timeMs,
                                nps: Math.round((totalNodesEvaluated / timeMs) * 1000)
                            });
                        }
                    } else if (e.data.type === 'SEARCH_COMPLETE') {
                        worker.removeEventListener('message', handleMsg);
                        worker.removeEventListener('error', handleError);
                        results.push(e.data.result);
                        completedWorkers++;

                        if (completedWorkers === availableWorkers) {
                            this.isSearching = false;

                            // Combine sub-tree results from all workers
                            let bestGlobalMove = null;
                            let bestGlobalEval = isWhite ? -Infinity : Infinity;
                            let maxReachedDepth = 1;
                            let totalNodesAll = 0;

                            results.forEach(res => {
                                totalNodesAll += res.nodesEvaluated || 0;
                                maxReachedDepth = Math.max(maxReachedDepth, res.depth || 1);

                                if (res.bestMove) {
                                    if (isWhite) {
                                        if (res.evaluation > bestGlobalEval) {
                                            bestGlobalEval = res.evaluation;
                                            bestGlobalMove = res.bestMove;
                                        }
                                    } else {
                                        if (res.evaluation < bestGlobalEval) {
                                            bestGlobalEval = res.evaluation;
                                            bestGlobalMove = res.bestMove;
                                        }
                                    }
                                }
                            });

                            const totalTimeMs = Math.round(performance.now() - startTime);

                            resolve({
                                bestMove: bestGlobalMove || rawMoves[0],
                                evaluation: bestGlobalEval,
                                nodesEvaluated: totalNodesAll,
                                depth: maxReachedDepth,
                                timeMs: totalTimeMs,
                                nps: totalTimeMs > 0 ? Math.round((totalNodesAll / totalTimeMs) * 1000) : 0,
                                threadsUsed: availableWorkers
                            });
                        }
                    }
                };

                const handleError = (err) => {
                    worker.removeEventListener('message', handleMsg);
                    worker.removeEventListener('error', handleError);
                    triggerFallback(err);
                };

                worker.addEventListener('message', handleMsg);
                worker.addEventListener('error', handleError);

                try {
                    worker.postMessage({
                        id: currentSearchId,
                        task: 'SEARCH_SUBTREE',
                        fen,
                        assignedMoves: batch,
                        targetDepth,
                        maxTimeMs
                    });
                } catch (postErr) {
                    triggerFallback(postErr);
                }
            });
        });
    }
}

window.workerPool = new WorkerPoolManager();
