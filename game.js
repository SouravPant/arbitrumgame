// Tic Tac Toe Game Logic

class TicTacToe {
    constructor() {
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.gameActive = true;
        this.scores = {
            X: 0,
            O: 0,
            tie: 0
        };
        
        this.winningCombinations = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6]             // Diagonals
        ];
        
        this.initializeGame();
    }
    
    initializeGame() {
        this.setupEventListeners();
        this.updateStatus();
        this.updateScoreBoard();
    }
    
    setupEventListeners() {
        // Cell click events
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.addEventListener('click', () => {
                const index = parseInt(cell.getAttribute('data-cell-index'));
                this.handleCellClick(index);
            });
        });
        
        // Button events
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.restartGame();
        });
        
        document.getElementById('resetScoreBtn').addEventListener('click', () => {
            this.resetScore();
        });
        
        document.getElementById('playAgainBtn').addEventListener('click', () => {
            this.hideGameOverModal();
            this.restartGame();
        });
    }
    
    handleCellClick(index) {
        console.log('Cell clicked:', index, 'Current player:', this.currentPlayer);
        
        if (this.board[index] !== '' || !this.gameActive) {
            console.log('Cell already filled or game not active');
            return;
        }
        
        // Place the player's mark
        this.board[index] = this.currentPlayer;
        this.updateCell(index);
        
        console.log('Board after move:', this.board);
        
        // Check for win or draw
        if (this.checkWin()) {
            console.log('Win detected!');
            this.handleGameOver('win');
        } else if (this.checkDraw()) {
            console.log('Draw detected!');
            this.handleGameOver('draw');
        } else {
            // Switch players
            this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
            this.updateStatus();
            console.log('Switched to player:', this.currentPlayer);
        }
    }
    
    updateCell(index) {
        const cell = document.querySelector(`[data-cell-index="${index}"]`);
        cell.classList.add(this.currentPlayer);
        cell.setAttribute('data-player', this.currentPlayer);
        
        // Also set the text content directly to ensure visibility
        cell.textContent = this.currentPlayer;
    }
    
    checkWin() {
        for (let combination of this.winningCombinations) {
            const [a, b, c] = combination;
            if (this.board[a] && 
                this.board[a] === this.board[b] && 
                this.board[a] === this.board[c]) {
                
                // Highlight winning cells
                combination.forEach(index => {
                    const cell = document.querySelector(`[data-cell-index="${index}"]`);
                    cell.classList.add('winning');
                });
                
                return true;
            }
        }
        return false;
    }
    
    checkDraw() {
        return this.board.every(cell => cell !== '');
    }
    
    handleGameOver(result) {
        this.gameActive = false;
        
        if (result === 'win') {
            this.scores[this.currentPlayer]++;
            this.showGameOverModal(`${this.currentPlayer} wins!`);
        } else if (result === 'draw') {
            this.scores.tie++;
            this.showGameOverModal("It's a tie!");
        }
        
        this.updateScoreBoard();
    }
    
    showGameOverModal(message) {
        const modal = document.getElementById('gameOverModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');
        
        modalTitle.textContent = 'Game Over!';
        modalMessage.textContent = message;
        modal.classList.add('show');
    }
    
    hideGameOverModal() {
        const modal = document.getElementById('gameOverModal');
        modal.classList.remove('show');
    }
    
    restartGame() {
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.gameActive = true;
        
        // Clear all cells
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.classList.remove('x', 'o', 'winning');
            cell.removeAttribute('data-player');
            cell.textContent = ''; // Clear the text content
        });
        
        this.updateStatus();
        this.hideGameOverModal();
    }
    
    resetScore() {
        this.scores = { X: 0, O: 0, tie: 0 };
        this.updateScoreBoard();
    }
    
    updateStatus() {
        const status = document.getElementById('status');
        status.textContent = `Player ${this.currentPlayer}'s turn`;
    }
    
    updateScoreBoard() {
        document.getElementById('scoreX').textContent = this.scores.X;
        document.getElementById('scoreO').textContent = this.scores.O;
        document.getElementById('scoreTie').textContent = this.scores.tie;
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new TicTacToe();
});