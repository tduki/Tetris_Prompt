class Dashboard {
    constructor() {
        this.init();
    }

    init() {
        this.displayLastGame();
        this.setupEventListeners();
    }

    displayLastGame() {
        const lastGameData = localStorage.getItem('lastGameData');
        if (lastGameData) {
            try {
                const gameData = JSON.parse(lastGameData);
                const lastGameSection = document.querySelector('.last-game');
                if (lastGameSection) {
                    const winnerName = gameData.winner === 'player' ? 'Joueur' : 'IA';
                    lastGameSection.innerHTML = `
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
                    `;
                }
                localStorage.removeItem('lastGameData');
            } catch (e) {
                console.error('Erreur lors du chargement des données de la dernière partie:', e);
            }
        }
    }

    setupEventListeners() {
        const mainMenuBtn = document.getElementById('mainMenuBtn');
        if (mainMenuBtn) {
            mainMenuBtn.addEventListener('click', () => {
                window.location.href = 'index.html';
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Dashboard();
}); 