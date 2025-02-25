class GameRules {
    constructor(game) {
        this.game = game;
        this.specialPieces = this.createSpecialPieces();
        this.comboCount = 0;
        this.lastClearTime = 0;
        this.comboCooldown = 2000; // 2 secondes pour maintenir un combo
        this.attackModes = {
            normal: 'normal',
            aggressive: 'aggressive',
            defensive: 'defensive'
        };
        this.currentMode = this.attackModes.normal;
    }

    createSpecialPieces() {
        return {
            heart: [
                [0, 1, 0, 1, 0],
                [1, 1, 1, 1, 1],
                [1, 1, 1, 1, 1],
                [0, 1, 1, 1, 0],
                [0, 0, 1, 0, 0]
            ],
            star: [
                [0, 0, 1, 0, 0],
                [0, 1, 1, 1, 0],
                [1, 1, 1, 1, 1],
                [0, 1, 1, 1, 0],
                [0, 0, 1, 0, 0]
            ]
        };
    }

    handleLineClears(player, linesCleared) {
        const currentTime = Date.now();
        
        // Gestion des combos
        if (currentTime - this.lastClearTime < this.comboCooldown) {
            this.comboCount++;
        } else {
            this.comboCount = 0;
        }
        this.lastClearTime = currentTime;

        // Bonus de points pour les combos
        const comboBonus = Math.floor(this.comboCount * 50);
        
        if (player === 'player') {
            this.game.playerScore.addScore(comboBonus);
            if (this.comboCount >= 3) {
                this.showEvent(`Combo x${this.comboCount} ! 🔥`);
            }
        }

        // Attaques spéciales basées sur le nombre de lignes
        if (linesCleared >= 2) {
            this.handleSpecialAttack(player, linesCleared);
        }

        // Changement de mode d'attaque de l'IA
        this.updateAIMode();
    }

    handleSpecialAttack(player, linesCleared) {
        const opponent = player === 'player' ? 'ai' : 'player';
        const opponentBoard = opponent === 'player' ? this.game.playerBoard : this.game.aiBoard;

        switch(linesCleared) {
            case 2:
                this.addGarbageLines(opponentBoard, 1);
                break;
            case 3:
                this.shuffleOpponentPiece(opponent);
                break;
            case 4:
                this.addGarbageLines(opponentBoard, 2);
                this.showEvent('Tetris Attack! 💥');
                break;
        }
    }

    addGarbageLines(board, numLines) {
        for (let i = 0; i < numLines; i++) {
            const garbageLine = new Array(board.cols).fill(1);
            const holePosition = Math.floor(Math.random() * board.cols);
            garbageLine[holePosition] = 0;
            board.addGarbageLine(garbageLine);
        }
    }

    shuffleOpponentPiece(opponent) {
        const piece = opponent === 'player' ? this.game.playerPiece : this.game.aiPiece;
        if (piece) {
            const rotations = Math.floor(Math.random() * 4);
            for (let i = 0; i < rotations; i++) {
                piece.rotate();
            }
            this.showEvent('Pièce mélangée! 🔄');
        }
    }

    updateAIMode() {
        const playerScore = this.game.playerScore.current;
        const aiScore = this.game.aiScore.current;
        
        if (playerScore > aiScore + 1000) {
            this.currentMode = this.attackModes.aggressive;
            this.showEvent('L\'IA devient agressive! 😠');
        } else if (aiScore > playerScore + 500) {
            this.currentMode = this.attackModes.defensive;
            this.showEvent('L\'IA joue défensif! 🛡️');
        } else {
            this.currentMode = this.attackModes.normal;
        }
    }

    showEvent(message, duration = 2000) {
        const eventDisplay = document.getElementById('eventDisplay');
        eventDisplay.textContent = message;
        eventDisplay.classList.remove('hidden');
        eventDisplay.classList.add('event-animation');
        
        setTimeout(() => {
            eventDisplay.classList.remove('event-animation');
            eventDisplay.classList.add('hidden');
        }, duration);
    }
} 