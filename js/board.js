class Board {
    constructor(cols, rows) {
        this.cols = cols;
        this.rows = rows;
        this.grid = this.createGrid();
    }

    createGrid() {
        return Array(this.rows).fill()
            .map(() => Array(this.cols).fill(0));
    }

    clear() {
        this.grid = this.createGrid();
    }

    placePiece(piece) {
        for (let y = 0; y < piece.shape.length; y++) {
            for (let x = 0; x < piece.shape[y].length; x++) {
                if (piece.shape[y][x]) {
                    this.grid[piece.y + y][piece.x + x] = {
                        color: piece.color
                    };
                }
            }
        }
    }

    clearLines() {
        let linesCleared = 0;
        
        for (let y = this.rows - 1; y >= 0; y--) {
            if (this.isLineComplete(y)) {
                this.removeLine(y);
                linesCleared++;
                y++; // Vérifier la même ligne après la chute des blocs
            }
        }
        
        return linesCleared;
    }

    isLineComplete(y) {
        return this.grid[y].every(cell => cell !== 0);
    }

    removeLine(y) {
        // Suppression de la ligne complète
        this.grid.splice(y, 1);
        // Ajout d'une nouvelle ligne vide en haut
        this.grid.unshift(Array(this.cols).fill(0));
    }

    draw(ctx, gridSize) {
        // Dessin de la grille
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                ctx.strokeStyle = '#333';
                ctx.strokeRect(
                    x * gridSize, 
                    y * gridSize, 
                    gridSize, 
                    gridSize
                );

                if (this.grid[y][x]) {
                    ctx.fillStyle = this.grid[y][x].color;
                    ctx.fillRect(
                        x * gridSize, 
                        y * gridSize, 
                        gridSize - 1, 
                        gridSize - 1
                    );
                }
            }
        }
    }

    addGarbageLine(garbageLine) {
        // Déplacer toutes les lignes vers le haut
        for (let y = 0; y < this.rows - 1; y++) {
            this.grid[y] = [...this.grid[y + 1]];
        }
        
        // Ajouter la ligne de pénalité en bas
        this.grid[this.rows - 1] = garbageLine;

        // Ajouter la classe pour l'animation
        const garbageElements = document.querySelectorAll('.garbage-line');
        garbageElements.forEach(el => {
            el.classList.add('garbage-line-animation');
            setTimeout(() => {
                el.classList.remove('garbage-line-animation');
            }, 500);
        });
    }

    // Méthode utilitaire pour vérifier si une ligne est pleine
    isLineFull(row) {
        return this.grid[row].every(cell => cell !== 0);
    }

    // Méthode utilitaire pour obtenir une ligne vide
    getEmptyLine() {
        for (let y = 0; y < this.rows; y++) {
            if (this.grid[y].every(cell => cell === 0)) {
                return y;
            }
        }
        return -1;
    }

    // Méthode utilitaire pour obtenir une ligne pleine
    getFullLine() {
        for (let y = this.rows - 1; y >= 0; y--) {
            if (this.isLineFull(y)) {
                return y;
            }
        }
        return -1;
    }

    // Méthode pour supprimer une ligne spécifique
    removeLine(row) {
        // Faire descendre toutes les lignes au-dessus
        for (let y = row; y > 0; y--) {
            this.grid[y] = [...this.grid[y - 1]];
        }
        // Ajouter une nouvelle ligne vide en haut
        this.grid[0] = new Array(this.cols).fill(0);
    }

    // Méthode pour insérer une ligne vide à une position spécifique
    insertLine(row) {
        // Déplacer toutes les lignes vers le haut à partir de la position
        for (let y = 0; y < row; y++) {
            this.grid[y] = [...this.grid[y + 1]];
        }
        // Insérer une ligne vide
        this.grid[row] = new Array(this.cols).fill(0);
    }
} 