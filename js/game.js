class Game {
    constructor() {
        // Nettoyer les données de la dernière partie au démarrage
        localStorage.removeItem('lastGameData');
        
        // Initialisation des canvas
        this.initCanvases();
        
        // Dimensions de la grille
        this.GRID_SIZE = 30;
        this.COLS = 10;
        this.ROWS = 20;
        
        // Initialisation des composants du jeu
        this.playerBoard = new Board(this.COLS, this.ROWS);
        this.aiBoard = new Board(this.COLS, this.ROWS);
        
        this.playerScore = new Score('player');
        this.aiScore = new Score('ai');
        
        // Lier les scores au jeu
        this.playerScore.setGame(this);
        this.aiScore.setGame(this);
        
        this.controls = new Controls(this);
        this.ai = new AI(this);
        this.rules = new GameRules(this);
        
        // État du jeu
        this.playerPiece = null;
        this.playerNextPiece = null;
        this.aiPiece = null;
        this.aiNextPiece = null;
        
        this.gameLoop = null;
        this.isPaused = false;
        this.baseSpeed = 300;
        this.currentSpeed = this.baseSpeed;
        
        this.lastPlayerUpdate = 0;
        this.lastAIUpdate = 0;
        
        this.audio = new AudioManager();
        
        // Initialisation de l'audio et des thèmes
        this.initThemes();
        
        // Initialisation
        this.init();
    }

    initCanvases() {
        // Canvas du joueur
        this.playerCanvas = document.getElementById('playerBoard');
        this.playerCtx = this.playerCanvas.getContext('2d');
        this.playerNextCanvas = document.getElementById('playerNextPiece');
        this.playerNextCtx = this.playerNextCanvas.getContext('2d');

        // Canvas de l'IA
        this.aiCanvas = document.getElementById('aiBoard');
        this.aiCtx = this.aiCanvas.getContext('2d');
        this.aiNextCanvas = document.getElementById('aiNextPiece');
        this.aiNextCtx = this.aiNextCanvas.getContext('2d');
    }

    init() {
        // Initialisation des événements
        document.getElementById('startBtn').addEventListener('click', () => this.start());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        
        // Affichage initial
        this.drawBoards();
    }

    start() {
        // Réinitialisation
        this.playerBoard.clear();
        this.aiBoard.clear();
        this.playerScore.reset();
        this.aiScore.reset();
        this.isPaused = false;
        this.currentSpeed = this.baseSpeed;
        
        // Création des premières pièces
        this.playerPiece = new Tetromino();
        this.playerNextPiece = new Tetromino();
        this.aiPiece = new Tetromino();
        this.aiNextPiece = new Tetromino();
        
        // Initialisation des timestamps pour les mises à jour
        this.lastPlayerUpdate = Date.now();
        this.lastAIUpdate = Date.now();
        
        // Démarrage de la boucle de jeu
        this.startTime = new Date();
        
        // Annuler l'ancienne boucle si elle existe
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
        }
        
        // Démarrer la nouvelle boucle de jeu
        this.gameLoop = requestAnimationFrame(() => this.animate());
        
        this.draw();
    }

    animate() {
        if (this.isPaused) {
            return;
        }
        
        this.update();
        this.gameLoop = requestAnimationFrame(() => this.animate());
    }

    update() {
        if (this.isPaused) return;
        
        const currentTime = Date.now();
        
        // Mise à jour du joueur
        if (currentTime - this.lastPlayerUpdate >= this.currentSpeed) {
            this.updatePlayer();
            this.lastPlayerUpdate = currentTime;
        }
        
        // Mise à jour de l'IA (modification de la vitesse ici)
        if (currentTime - this.lastAIUpdate >= this.currentSpeed * 0.8) { // L'IA joue seulement 1.25x plus vite
            this.updateAI();
            this.lastAIUpdate = currentTime;
        }
        
        // Appliquer les effets du mode de l'IA
        switch(this.rules.currentMode) {
            case this.rules.attackModes.aggressive:
                this.currentSpeed = this.baseSpeed * 0.9; // Plus lent en mode agressif
                break;
            case this.rules.attackModes.defensive:
                this.currentSpeed = this.baseSpeed * 1.1; // Plus lent en mode défensif
                break;
            default:
                this.currentSpeed = this.baseSpeed; // Vitesse normale
        }

        this.draw();
    }

    updatePlayer() {
        if (!this.playerPiece) return;
        
        if (this.playerPiece.canMove(0, 1, this.playerBoard)) {
            this.playerPiece.move(0, 1);
        } else {
            this.handlePieceLanding('player');
        }
    }

    updateAI() {
        if (!this.aiPiece) return;
        
        // Mettre à jour la pièce courante de l'IA
        this.ai.currentPiece = this.aiPiece;
        this.ai.nextPiece = this.aiNextPiece;
        
        // Laisser l'IA jouer son coup
        this.ai.update(Date.now());
        
        // Vérifier si la pièce doit descendre
        if (this.aiPiece.canMove(0, 1, this.aiBoard)) {
            this.aiPiece.move(0, 1);
        } else {
            this.handlePieceLanding('ai');
        }
    }

    handlePieceLanding(player) {
        const board = player === 'player' ? this.playerBoard : this.aiBoard;
        const piece = player === 'player' ? this.playerPiece : this.aiPiece;
        const score = player === 'player' ? this.playerScore : this.aiScore;
        
        board.placePiece(piece);
        const linesCleared = board.clearLines();
        
        if (linesCleared > 0) {
            score.addLines(linesCleared);
            this.rules.handleLineClears(player, linesCleared);
            this.audio.playSound('clear');
        }
        
        // Nouvelle pièce
        if (player === 'player') {
            this.playerPiece = this.playerNextPiece;
            this.playerNextPiece = new Tetromino();
            if (!this.playerPiece.canMove(0, 0, this.playerBoard)) {
                this.gameOver(player);
            }
        } else {
            this.aiPiece = this.aiNextPiece;
            this.aiNextPiece = new Tetromino();
            // Réinitialiser la position cible de l'IA pour la nouvelle pièce
            this.ai.resetTargetPosition();
            if (!this.aiPiece.canMove(0, 0, this.aiBoard)) {
                this.gameOver(player);
            }
        }
        this.audio.playSound('drop');
    }

    draw() {
        // Effacement des canvas
        this.clearCanvases();
        
        // Dessin des plateaux
        this.drawBoards();
        
        // Dessin des pièces courantes
        if (this.playerPiece) {
            this.playerPiece.draw(this.playerCtx, this.GRID_SIZE);
        }
        if (this.aiPiece) {
            this.aiPiece.draw(this.aiCtx, this.GRID_SIZE);
        }
        
        // Dessin des prochaines pièces
        if (this.playerNextPiece) {
            this.playerNextPiece.draw(this.playerNextCtx, this.GRID_SIZE, true);
        }
        if (this.aiNextPiece) {
            this.aiNextPiece.draw(this.aiNextCtx, this.GRID_SIZE, true);
        }
    }

    clearCanvases() {
        this.playerCtx.clearRect(0, 0, this.playerCanvas.width, this.playerCanvas.height);
        this.playerNextCtx.clearRect(0, 0, this.playerNextCanvas.width, this.playerNextCanvas.height);
        this.aiCtx.clearRect(0, 0, this.aiCanvas.width, this.aiCanvas.height);
        this.aiNextCtx.clearRect(0, 0, this.aiNextCanvas.width, this.aiNextCanvas.height);
    }

    drawBoards() {
        this.playerBoard.draw(this.playerCtx, this.GRID_SIZE);
        this.aiBoard.draw(this.aiCtx, this.GRID_SIZE);
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        document.getElementById('pauseBtn').textContent = this.isPaused ? 'Reprendre' : 'Pause';
        
        // Redémarrer l'animation si on sort de la pause
        if (!this.isPaused) {
            this.gameLoop = requestAnimationFrame(() => this.animate());
        }
    }

    setSpeed(multiplier) {
        this.currentSpeed = this.baseSpeed * multiplier;
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
            this.gameLoop = null;
        }
    }

    resetSpeed() {
        this.setSpeed(1);
    }

    gameOver(loser) {
        if (this.gameLoop) {
            cancelAnimationFrame(this.gameLoop);
            this.gameLoop = null;
        }
        
        const winner = loser === 'player' ? 'ai' : 'player';
        const gameData = {
            playerScore: this.playerScore.current,
            aiScore: this.aiScore.current,
            winner: winner,
            playTime: this.getPlayTime()
        };
        
        // Sauvegarder les données de la partie
        localStorage.setItem('lastGameData', JSON.stringify(gameData));
        
        // Sauvegarder le score si c'est un high score
        if (winner === 'player' && this.isHighScore(gameData.playerScore)) {
            const playerName = prompt('Nouveau high score ! Entrez votre nom:') || 'Anonyme';
            this.saveHighScore(playerName, gameData.playerScore);
        }

        // Rediriger vers le dashboard après un court délai
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 500);

        this.audio.stopAll();
    }

    showGameSummary(gameData) {
        const summaryOverlay = document.createElement('div');
        summaryOverlay.className = 'game-summary-overlay';
        
        const summary = document.createElement('div');
        summary.className = 'game-summary';
        
        const winnerName = gameData.winner === 'player' ? 'Joueur' : 'IA';
        
        // Sauvegarder le score si c'est un high score
        if (gameData.winner === 'player' && this.isHighScore(gameData.playerScore)) {
            const playerName = prompt('Nouveau high score ! Entrez votre nom:') || 'Anonyme';
            this.saveHighScore(playerName, gameData.playerScore);
        }
        
        // Afficher les high scores
        const highScores = this.loadHighScores();
        const highScoresList = highScores.map((score, index) => 
            `<tr>
                <td>${index + 1}</td>
                <td>${score.name}</td>
                <td>${score.score}</td>
                <td>${score.date}</td>
            </tr>`
        ).join('');

        summary.innerHTML = `
            <h2>Partie Terminée !</h2>
            <div class="summary-content">
                <div class="winner-section">
                    <div class="winner-trophy">🏆</div>
                    <p>Vainqueur : <span class="winner">${winnerName}</span></p>
                </div>
                <div class="scores">
                    <div class="player-score ${gameData.winner === 'player' ? 'winner-highlight' : ''}">
                        <h3>👤 Joueur</h3>
                        <p class="score-value">${gameData.playerScore}</p>
                        <p class="score-label">points</p>
                    </div>
                    <div class="score-vs">VS</div>
                    <div class="ai-score ${gameData.winner === 'ai' ? 'winner-highlight' : ''}">
                        <h3>🤖 IA</h3>
                        <p class="score-value">${gameData.aiScore}</p>
                        <p class="score-label">points</p>
                    </div>
                </div>
                <div class="game-stats">
                    <p>⏱️ Temps de jeu: ${gameData.playTime}</p>
                </div>
                <div class="high-scores">
                    <h3>Meilleurs Scores</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Rang</th>
                                <th>Nom</th>
                                <th>Score</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${highScoresList}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="summary-buttons">
                <button id="playAgainBtn" class="summary-button">🔄 Rejouer</button>
                <button id="mainMenuBtn" class="summary-button">🏠 Menu Principal</button>
            </div>
        `;
        
        summaryOverlay.appendChild(summary);
        document.body.appendChild(summaryOverlay);
        
        setTimeout(() => summary.classList.add('show'), 10);
        
        // Gestionnaires d'événements
        document.getElementById('playAgainBtn').onclick = () => {
            summary.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(summaryOverlay);
                this.resetGame();
                this.start();
            }, 300);
        };

        document.getElementById('mainMenuBtn').onclick = () => {
            window.location.reload();
        };
    }

    isHighScore(score) {
        const highScores = this.loadHighScores();
        return highScores.length < 10 || score > highScores[highScores.length - 1].score;
    }

    loadHighScores() {
        const scores = localStorage.getItem('tetrisHighScores');
        return scores ? JSON.parse(scores) : [];
    }

    saveHighScore(name, score) {
        const highScores = this.loadHighScores();
        highScores.push({
            name,
            score,
            date: new Date().toLocaleDateString()
        });
        highScores.sort((a, b) => b.score - a.score);
        if (highScores.length > 10) {
            highScores.length = 10;
        }
        localStorage.setItem('tetrisHighScores', JSON.stringify(highScores));
    }

    getPlayTime() {
        const endTime = new Date();
        const playTimeMs = endTime - this.startTime;
        const minutes = Math.floor(playTimeMs / 60000);
        const seconds = Math.floor((playTimeMs % 60000) / 1000);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    mirrorPieces() {
        // Inverse la position des pièces horizontalement
        if (this.playerPiece) {
            this.playerPiece.shape = this.playerPiece.shape.map(row => row.reverse());
        }
    }

    showGhostPiece() {
        // Vérifier quelle pièce utiliser (joueur ou IA)
        const piece = this.playerPiece || this.aiPiece;
        const board = this.playerPiece ? this.playerBoard : this.aiBoard;
        const ctx = this.playerPiece ? this.playerCtx : this.aiCtx;
        
        if (!piece) return;

        const ghost = piece.clone();
        while (ghost.canMove(0, 1, board)) {
            ghost.move(0, 1);
        }

        // Dessiner la pièce fantôme avec transparence
        ctx.globalAlpha = 0.3;
        ghost.draw(ctx, this.GRID_SIZE);
        ctx.globalAlpha = 1.0;
    }

    // Nouvelle méthode pour réinitialiser complètement le jeu
    resetGame() {
        this.playerBoard.clear();
        this.aiBoard.clear();
        this.playerScore = new Score('player');
        this.aiScore = new Score('ai');
        this.playerScore.setGame(this);
        this.aiScore.setGame(this);
        this.isPaused = false;
        this.currentSpeed = this.baseSpeed;
    }

    initThemes() {
        // Gestion des thèmes
        const themeSelect = document.getElementById('theme');
        if (themeSelect) {
            // Charger le thème sauvegardé ou utiliser le thème néon par défaut
            const savedTheme = localStorage.getItem('tetrisTheme') || 'neon';
            document.body.className = `theme-${savedTheme}`;
            themeSelect.value = savedTheme;

            themeSelect.addEventListener('change', (e) => {
                const theme = e.target.value;
                document.body.className = `theme-${theme}`;
                localStorage.setItem('tetrisTheme', theme);
            });
        }

        // Gestion du son
        const musicBtn = document.getElementById('musicToggle');
        const soundBtn = document.getElementById('soundToggle');

        // Charger les préférences audio sauvegardées
        const isMuted = localStorage.getItem('tetrisSoundMuted') === 'true';
        if (isMuted) {
            this.audio.toggleMute();
            if (soundBtn) soundBtn.classList.add('active');
        }

        if (musicBtn) {
            musicBtn.addEventListener('click', () => {
                musicBtn.classList.toggle('active');
                this.audio.toggleMusic();
                if (musicBtn.classList.contains('active')) {
                    musicBtn.textContent = '🔈 Musique ON';
                } else {
                    musicBtn.textContent = '🔇 Musique OFF';
                }
            });
        }

        if (soundBtn) {
            soundBtn.addEventListener('click', () => {
                this.audio.toggleMute();
                soundBtn.classList.toggle('active');
                const isMuted = this.audio.isMuted;
                soundBtn.textContent = isMuted ? '🔇 Sons OFF' : '🔊 Sons ON';
                localStorage.setItem('tetrisSoundMuted', isMuted);
            });
        }
    }

    // Ajouter les sons dans les méthodes appropriées
    handleKeyDown(event) {
        if (this.isPaused) return;

        switch(event.code) {
            case 'ArrowLeft':
                if (this.playerPiece.canMove(-1, 0, this.playerBoard)) {
                    this.playerPiece.move(-1, 0);
                    this.audio.playSound('move');
                }
                break;
            case 'ArrowRight':
                if (this.playerPiece.canMove(1, 0, this.playerBoard)) {
                    this.playerPiece.move(1, 0);
                    this.audio.playSound('move');
                }
                break;
            case 'ArrowUp':
                if (this.playerPiece.canRotate(this.playerBoard)) {
                    this.playerPiece.rotate(this.playerBoard);
                    this.audio.playSound('rotate');
                }
                break;
            // ... autres cas
        }
    }

    checkHighScore(score, playerType) {
        if (this.isHighScore(score)) {
            this.saveHighScore(score, playerType);
            
            this.showHighScoreNotification(playerType);
        }
    }

    showHighScoreNotification(playerType) {
        const eventDisplay = document.getElementById('eventDisplay');
        const eventText = document.getElementById('eventText');
        
        if (eventDisplay && eventText) {
            eventText.textContent = `Nouveau High Score pour ${playerType === 'player' ? 'Joueur' : 'IA'}!`;
            eventDisplay.classList.remove('hidden');
            
            setTimeout(() => {
                eventDisplay.classList.add('hidden');
            }, 3000);
        }
    }
}

// Démarrage du jeu
window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
}); 