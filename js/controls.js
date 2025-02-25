class Controls {
    constructor(game) {
        this.game = game;
        this.isKeyDown = false;
        this.dropInterval = null;
        
        this.initKeyboardControls();
        this.initTouchControls();
    }

    initKeyboardControls() {
        document.addEventListener('keydown', (event) => {
            if (this.game.isPaused) return;

            switch (event.code) {
                case 'ArrowLeft':
                    if (this.game.playerPiece.canMove(-1, 0, this.game.playerBoard)) {
                        this.game.playerPiece.move(-1, 0);
                        this.game.draw();
                    }
                    break;

                case 'ArrowRight':
                    if (this.game.playerPiece.canMove(1, 0, this.game.playerBoard)) {
                        this.game.playerPiece.move(1, 0);
                        this.game.draw();
                    }
                    break;

                case 'ArrowUp':
                    if (this.game.playerPiece.tryRotate(this.game.playerBoard)) {
                        this.game.draw();
                    }
                    break;

                case 'ArrowDown':
                    if (!this.isKeyDown) {
                        this.isKeyDown = true;
                        this.startSoftDrop();
                    }
                    break;

                case 'Space':
                    this.hardDrop();
                    break;

                case 'KeyP':
                    this.game.togglePause();
                    break;
            }
        });

        document.addEventListener('keyup', (event) => {
            if (event.code === 'ArrowDown') {
                this.isKeyDown = false;
                this.stopSoftDrop();
            }
        });
    }

    initTouchControls() {
        let touchStartX = 0;
        let touchStartY = 0;

        // Boutons mobiles
        document.getElementById('leftBtn').addEventListener('click', () => {
            if (this.game.playerPiece.canMove(-1, 0, this.game.playerBoard)) {
                this.game.playerPiece.move(-1, 0);
                this.game.draw();
            }
        });

        document.getElementById('rightBtn').addEventListener('click', () => {
            if (this.game.playerPiece.canMove(1, 0, this.game.playerBoard)) {
                this.game.playerPiece.move(1, 0);
                this.game.draw();
            }
        });

        document.getElementById('rotateBtn').addEventListener('click', () => {
            if (this.game.playerPiece.tryRotate(this.game.playerBoard)) {
                this.game.draw();
            }
        });

        document.getElementById('dropBtn').addEventListener('click', () => {
            this.hardDrop();
        });

        // Contrôles tactiles
        this.game.playerCanvas.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });

        this.game.playerCanvas.addEventListener('touchmove', (e) => {
            if (this.game.isPaused) return;
            
            const touchX = e.touches[0].clientX;
            const touchY = e.touches[0].clientY;
            const diffX = touchX - touchStartX;
            const diffY = touchY - touchStartY;

            // Déplacement horizontal si le mouvement est principalement horizontal
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 30) {
                const direction = diffX > 0 ? 1 : -1;
                if (this.game.playerPiece.canMove(direction, 0, this.game.playerBoard)) {
                    this.game.playerPiece.move(direction, 0);
                    this.game.draw();
                }
                touchStartX = touchX;
            }
            // Soft drop si le mouvement est principalement vertical vers le bas
            else if (diffY > 30) {
                if (this.game.playerPiece.canMove(0, 1, this.game.playerBoard)) {
                    this.game.playerPiece.move(0, 1);
                    this.game.draw();
                }
                touchStartY = touchY;
            }
        });

        this.game.playerCanvas.addEventListener('dblclick', () => {
            this.hardDrop();
        });
    }

    startSoftDrop() {
        if (this.dropInterval) clearInterval(this.dropInterval);
        this.dropInterval = setInterval(() => {
            if (this.game.playerPiece.canMove(0, 1, this.game.playerBoard)) {
                this.game.playerPiece.move(0, 1);
                this.game.draw();
            }
        }, 50);
    }

    stopSoftDrop() {
        if (this.dropInterval) {
            clearInterval(this.dropInterval);
            this.dropInterval = null;
        }
    }

    hardDrop() {
        while (this.game.playerPiece.canMove(0, 1, this.game.playerBoard)) {
            this.game.playerPiece.move(0, 1);
        }
        this.game.update();
    }
} 