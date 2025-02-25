class Score {
    constructor(player) {
        this.player = player; // 'player' ou 'ai'
        this.current = 0;
        this.level = 1;
        this.lines = 0;
        this.highScores = this.loadHighScores();
        this.game = null; // Sera défini lors de l'initialisation du jeu
    }

    setGame(game) {
        this.game = game;
    }

    reset() {
        this.current = 0;
        this.level = 1;
        this.lines = 0;
        this.updateDisplay();
    }

    addLines(linesCleared) {
        if (linesCleared === 0) return;

        // Points pour les lignes selon le cahier des charges
        const points = {
            1: 50,
            2: 150,  // 50 + 100 bonus
            3: 250,  // 150 + 200 bonus
            4: 350   // 250 + 300 bonus pour Tetris
        };

        this.lines += linesCleared;
        const basePoints = points[linesCleared] || 0;
        const levelBonus = this.level * 10;
        this.addScore(basePoints + levelBonus);

        // Augmentation du niveau
        const newLevel = Math.floor(this.lines / 10) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            if (this.game) {
                this.game.setSpeed(1 - (this.level - 1) * 0.1);
            }
            // Animation de niveau
            this.showLevelUpAnimation();
        }

        this.updateDisplay();
    }

    showLevelUpAnimation() {
        const levelDisplay = document.getElementById(`${this.player}Level`);
        levelDisplay.classList.add('level-up');
        setTimeout(() => levelDisplay.classList.remove('level-up'), 1000);
    }

    addScore(points) {
        this.current += points;
        this.updateDisplay();
    }

    getSpeed() {
        // Vitesse initiale : 1 case/seconde
        // Vitesse maximale : 20 cases/seconde
        return Math.min(20, 1 + (this.level - 1) * 1.5);
    }

    updateDisplay() {
        const prefix = this.player === 'player' ? 'player' : 'ai';
        document.getElementById(`${prefix}Score`).textContent = this.current;
        document.getElementById(`${prefix}Level`).textContent = this.level;
        document.getElementById(`${prefix}Lines`).textContent = this.lines;
    }

    loadHighScores() {
        const scores = localStorage.getItem('tetrisHighScores');
        return scores ? JSON.parse(scores) : [];
    }

    saveHighScore(playerName = null) {
        const newScore = {
            player: this.player,
            score: this.current,
            level: this.level,
            date: new Date().toLocaleDateString(),
            name: playerName || 'IA'
        };

        this.highScores.push(newScore);
        this.highScores.sort((a, b) => b.score - a.score);
        this.highScores = this.highScores.slice(0, 10); // Garder les 10 meilleurs scores

        localStorage.setItem('tetrisHighScores', JSON.stringify(this.highScores));
    }

    // Nouvelle méthode pour ajouter des points bonus
    addBonusPoints(bonus) {
        const bonusPoints = Math.floor(bonus);
        this.addScore(bonusPoints);
        
        // Afficher une animation de bonus
        const bonusDisplay = document.createElement('div');
        bonusDisplay.className = 'bonus-points';
        bonusDisplay.textContent = `+${bonusPoints}`;
        
        const scoreContainer = document.querySelector(`.${this.player}-section .score-container`);
        scoreContainer.appendChild(bonusDisplay);
        
        // Supprimer l'élément après l'animation
        setTimeout(() => {
            bonusDisplay.remove();
        }, 1000);
    }
} 