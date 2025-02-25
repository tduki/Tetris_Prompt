class Tetromino {
    constructor() {
        // Définition des formes de pièces
        this.SHAPES = {
            I: [[1, 1, 1, 1]],
            O: [[1, 1], 
                [1, 1]],
            T: [[0, 1, 0],
                [1, 1, 1]],
            L: [[1, 0, 0],
                [1, 1, 1]],
            J: [[0, 0, 1],
                [1, 1, 1]],
            S: [[0, 1, 1],
                [1, 1, 0]],
            Z: [[1, 1, 0],
                [0, 1, 1]]
        };

        // Couleurs des pièces
        this.COLORS = {
            I: '#00f0f0',
            O: '#f0f000',
            T: '#a000f0',
            L: '#f0a000',
            J: '#0000f0',
            S: '#00f000',
            Z: '#f00000'
        };

        // Sélection aléatoire d'une pièce
        this.type = this.randomPiece();
        this.shape = this.SHAPES[this.type];
        this.color = this.COLORS[this.type];

        // Position initiale
        this.x = 3;
        this.y = 0;
    }

    randomPiece() {
        const pieces = Object.keys(this.SHAPES);
        return pieces[Math.floor(Math.random() * pieces.length)];
    }

    rotate() {
        // Création d'une nouvelle matrice pour la rotation
        const newShape = Array(this.shape[0].length).fill()
            .map(() => Array(this.shape.length).fill(0));

        // Rotation de 90 degrés dans le sens horaire
        for (let y = 0; y < this.shape.length; y++) {
            for (let x = 0; x < this.shape[y].length; x++) {
                newShape[x][this.shape.length - 1 - y] = this.shape[y][x];
            }
        }

        return newShape;
    }

    canMove(dx, dy, board) {
        for (let y = 0; y < this.shape.length; y++) {
            for (let x = 0; x < this.shape[y].length; x++) {
                if (this.shape[y][x]) {
                    const newX = this.x + x + dx;
                    const newY = this.y + y + dy;

                    // Vérification des limites du plateau
                    if (newX < 0 || newX >= board.cols || 
                        newY < 0 || newY >= board.rows) {
                        return false;
                    }

                    // Vérification des collisions avec d'autres pièces
                    if (board.grid[newY][newX]) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    canRotate(board) {
        const rotatedShape = this.rotate();
        for (let y = 0; y < rotatedShape.length; y++) {
            for (let x = 0; x < rotatedShape[y].length; x++) {
                if (rotatedShape[y][x]) {
                    const newX = this.x + x;
                    const newY = this.y + y;

                    if (newX < 0 || newX >= board.cols || 
                        newY < 0 || newY >= board.rows || 
                        board.grid[newY][newX]) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    move(dx, dy) {
        this.x += dx;
        this.y += dy;
    }

    tryRotate(board) {
        if (this.canRotate(board)) {
            this.shape = this.rotate();
            return true;
        }
        return false;
    }

    draw(ctx, gridSize, isPreview = false) {
        const offsetX = isPreview ? 
            (ctx.canvas.width - this.shape[0].length * gridSize) / 2 : 
            this.x * gridSize;
        const offsetY = isPreview ? 
            (ctx.canvas.height - this.shape.length * gridSize) / 2 : 
            this.y * gridSize;

        ctx.fillStyle = this.color;
        
        for (let y = 0; y < this.shape.length; y++) {
            for (let x = 0; x < this.shape[y].length; x++) {
                if (this.shape[y][x]) {
                    ctx.fillRect(
                        offsetX + x * gridSize, 
                        offsetY + y * gridSize, 
                        gridSize - 1, 
                        gridSize - 1
                    );
                }
            }
        }
    }

    clone() {
        const clonedPiece = new Tetromino();
        clonedPiece.type = this.type;
        clonedPiece.shape = this.shape.map(row => [...row]);
        clonedPiece.color = this.color;
        clonedPiece.x = this.x;
        clonedPiece.y = this.y;
        clonedPiece.rotation = this.rotation || 0;
        return clonedPiece;
    }
} 