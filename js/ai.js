class AI {
    constructor(game) {
        this.game = game;
        this.board = game.aiBoard;
        this.currentPiece = null;
        this.targetPosition = null;
        this.targetRotation = 0;
        this.currentRotation = 0;
        this.hasReachedTarget = false;
        this.moveDelay = 0;

        // Poids optimisés pour une stratégie similaire au script partagé
        this.weights = {
            completedLines: 10000,    // Bonus ÉNORME pour chaque ligne complète
            holes: -3000,             // Pénalité très forte pour les trous
            maxHeight: -50,           // Légère pénalité pour la hauteur
            heightDiff: -100,         // Pénalité pour les différences de hauteur
            almostComplete: 500,      // Bonus pour lignes presque complètes
            wellForI: 1000,           // Bonus pour créer un puits pour les I
            flatSurface: 200          // Bonus pour une surface plate
        };
    }

    update() {
        if (!this.currentPiece) return;
        
        try {
            // Petit délai pour rendre le jeu plus visible
            this.moveDelay++;
            if (this.moveDelay < 1) return;
            this.moveDelay = 0;
            
            // Trouver le meilleur mouvement
            if (!this.targetPosition) {
                const bestMove = this.findBestMove();
                if (bestMove) {
                    this.targetPosition = bestMove.x;
                    this.targetRotation = bestMove.rotation;
                    this.currentRotation = 0;
                    this.hasReachedTarget = false;
                }
            }

            // Exécuter le mouvement
            if (!this.hasReachedTarget) {
                this.executeMove();
            }
        } catch (e) {
            // Récupération silencieuse des erreurs
            this.resetTargetPosition();
        }
    }

    findBestMove() {
        try {
            let bestMove = null;
            let bestScore = -Infinity;

            // Tester toutes les rotations possibles
            const maxRotations = this.getMaxRotations(this.currentPiece);
            for (let rotation = 0; rotation < maxRotations; rotation++) {
                const testPiece = this.currentPiece.clone();
                
                // Appliquer la rotation
                for (let i = 0; i < rotation; i++) {
                    if (!testPiece.canRotate(this.board)) break;
                    testPiece.rotate(this.board);
                }

                // Tester toutes les positions horizontales
                for (let x = -2; x < this.board.cols + 2; x++) {
                    const testPieceAtPosition = testPiece.clone();
                    testPieceAtPosition.x = x;
                    testPieceAtPosition.y = 0;

                    // Descendre la pièce
                    while (testPieceAtPosition.canMove(0, 1, this.board)) {
                        testPieceAtPosition.move(0, 1);
                    }

                    if (this.isValidPosition(testPieceAtPosition)) {
                        const boardCopy = this.copyBoard();
                        this.placePiece(testPieceAtPosition, boardCopy);
                        const score = this.evaluatePosition(boardCopy, testPieceAtPosition);

                        if (score > bestScore) {
                            bestScore = score;
                            bestMove = { x, rotation, score: bestScore };
                        }
                    }
                }
            }

            return bestMove;
        } catch (e) {
            // Récupération silencieuse
            return { x: 5, rotation: 0 }; // Position par défaut
        }
    }

    evaluatePosition(board, piece) {
        let score = 0;
        
        // 1. Priorité absolue : lignes complètes
        let completedLines = 0;
        for (let y = 0; y < board.length; y++) {
            if (board[y].every(cell => cell === 1)) {
                completedLines++;
                score += this.weights.completedLines; // Bonus ÉNORME pour chaque ligne complète
            }
        }

        // 2. Vérifier les trous créés
        const holes = this.countHoles(board);
        score += holes * this.weights.holes; // Pénalité très forte pour les trous

        // 3. Mesurer la hauteur et la compacité
        const heights = this.getColumnHeights(board);
        const maxHeight = Math.max(...heights);
        const minHeight = Math.min(...heights.filter(h => h > 0));
        const heightDiff = maxHeight - minHeight;

        score += maxHeight * this.weights.maxHeight;        // Légère pénalité pour la hauteur
        score += heightDiff * this.weights.heightDiff;      // Pénalité pour les différences de hauteur

        // 4. Bonus pour positions favorables
        if (completedLines === 0) {
            // Si pas de ligne complète, favoriser les positions qui préparent des lignes
            let almostComplete = 0;
            for (let y = board.length - 1; y >= 0; y--) {
                let blockCount = board[y].filter(x => x !== 0).length;
                if (blockCount >= board[y].length - 2) {
                    almostComplete++;
                    score += this.weights.almostComplete; // Bonus pour lignes presque complètes
                }
            }
        }

        // 5. Bonus pour surface plate
        const flatSurface = this.evaluateFlatSurface(heights);
        score += flatSurface * this.weights.flatSurface;

        return score;
    }

    countHoles(board) {
        let holes = 0;
        for (let x = 0; x < board[0].length; x++) {
            let foundBlock = false;
            for (let y = 0; y < board.length; y++) {
                if (board[y][x] !== 0) {
                    foundBlock = true;
                } else if (foundBlock) {
                    holes++;
                }
            }
        }
        return holes;
    }

    evaluateFlatSurface(heights) {
        let flatScore = 0;
        for (let i = 0; i < heights.length - 1; i++) {
            if (Math.abs(heights[i] - heights[i + 1]) <= 1) {
                flatScore++;
            }
        }
        return flatScore;
    }

    executeMove() {
        try {
            if (!this.currentPiece || !this.targetPosition) return;

            // Rotation
            if (this.currentRotation < this.targetRotation) {
                if (this.currentPiece.canRotate(this.board)) {
                    this.currentPiece.rotate(this.board);
                    this.currentRotation++;
                } else {
                    // Si la rotation est bloquée, essayer de se déplacer
                    for (let dx of [-1, 1, -2, 2]) {
                        if (this.currentPiece.canMove(dx, 0, this.board)) {
                            this.currentPiece.move(dx, 0);
                            if (this.currentPiece.canRotate(this.board)) {
                                this.currentPiece.rotate(this.board);
                                this.currentRotation++;
                                break;
                            } else {
                                // Annuler le mouvement
                                this.currentPiece.move(-dx, 0);
                            }
                        }
                    }
                }
                return;
            }

            // Mouvement horizontal
            if (this.currentPiece.x !== this.targetPosition) {
                const dx = Math.sign(this.targetPosition - this.currentPiece.x);
                if (this.currentPiece.canMove(dx, 0, this.board)) {
                    this.currentPiece.move(dx, 0);
                }
                return;
            }

            // Descente
            if (this.currentPiece.canMove(0, 1, this.board)) {
                this.currentPiece.move(0, 1);
            } else {
                this.hasReachedTarget = true;
                this.resetTargetPosition();
            }
        } catch (e) {
            // Récupération silencieuse
            this.resetTargetPosition();
        }
    }

    getMaxRotations(piece) {
        // I et O ont 2 rotations, les autres en ont 4
        if (piece.type === 'I' || piece.type === 'O') {
            return 2;
        }
        return 4;
    }

    isValidPosition(piece) {
        return !this.checkCollision(piece.x, piece.y, piece);
    }

    checkCollision(x, y, piece) {
        for (let row = 0; row < piece.shape.length; row++) {
            for (let col = 0; col < piece.shape[row].length; col++) {
                if (piece.shape[row][col]) {
                    const boardX = x + col;
                    const boardY = y + row;
                    
                    if (boardX < 0 || boardX >= this.board.cols || boardY >= this.board.rows) {
                        return true;
                    }
                    
                    if (boardY >= 0 && this.board.grid[boardY][boardX]) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    copyBoard() {
        return this.board.grid.map(row => [...row]);
    }

    placePiece(piece, board) {
        for (let row = 0; row < piece.shape.length; row++) {
            for (let col = 0; col < piece.shape[row].length; col++) {
                if (piece.shape[row][col]) {
                    const boardX = piece.x + col;
                    const boardY = piece.y + row;
                    
                    if (boardY >= 0 && boardY < board.length && 
                        boardX >= 0 && boardX < board[0].length) {
                        board[boardY][boardX] = 1;
                    }
                }
            }
        }
    }

    getColumnHeights(board) {
        const heights = new Array(board[0].length).fill(0);
        
        for (let x = 0; x < board[0].length; x++) {
            for (let y = 0; y < board.length; y++) {
                if (board[y][x] !== 0) {
                    heights[x] = board.length - y;
                    break;
                }
            }
        }
        
        return heights;
    }

    resetTargetPosition() {
        this.targetPosition = null;
        this.targetRotation = 0;
    }
}

