class FarcasterRunner {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.score = 0;
        this.coins = 0;
        this.distance = 0;
        this.gameSpeed = 5;
        this.isGameRunning = false;
        this.isGameOver = false;
        
        // Game objects
        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 100,
            width: 40,
            height: 60,
            lane: 1, // 0: left, 1: center, 2: right
            isJumping: false,
            isSliding: false,
            jumpVelocity: 0,
            jumpHeight: 0,
            slideHeight: 30
        };
        
        this.obstacles = [];
        this.coins = [];
        this.particles = [];
        
        // Lane positions
        this.lanes = [
            this.canvas.width / 2 - 100,
            this.canvas.width / 2,
            this.canvas.width / 2 + 100
        ];
        
        // Touch/swipe handling
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchEndX = 0;
        this.touchEndY = 0;
        
        this.setupEventListeners();
        this.setupGame();
    }
    
    setupEventListeners() {
        // Start button
        document.getElementById('startBtn').addEventListener('click', () => {
            this.startGame();
        });
        
        // Restart button
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.restartGame();
        });
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (!this.isGameRunning) return;
            
            switch(e.key) {
                case 'ArrowLeft':
                    this.moveLeft();
                    break;
                case 'ArrowRight':
                    this.moveRight();
                    break;
                case 'ArrowUp':
                case ' ':
                    this.jump();
                    break;
                case 'ArrowDown':
                    this.slide();
                    break;
            }
        });
        
        // Touch controls for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.touchEndX = e.changedTouches[0].clientX;
            this.touchEndY = e.changedTouches[0].clientY;
            this.handleSwipe();
        });
    }
    
    handleSwipe() {
        const deltaX = this.touchEndX - this.touchStartX;
        const deltaY = this.touchEndY - this.touchStartY;
        const minSwipeDistance = 50;
        
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal swipe
            if (Math.abs(deltaX) > minSwipeDistance) {
                if (deltaX > 0) {
                    this.moveRight();
                } else {
                    this.moveLeft();
                }
            }
        } else {
            // Vertical swipe
            if (Math.abs(deltaY) > minSwipeDistance) {
                if (deltaY < 0) {
                    this.jump();
                } else {
                    this.slide();
                }
            }
        }
    }
    
    setupGame() {
        this.player.x = this.lanes[this.player.lane];
        this.spawnObstacles();
        this.spawnCoins();
    }
    
    startGame() {
        this.isGameRunning = true;
        this.isGameOver = false;
        document.getElementById('startScreen').classList.add('hidden');
        this.gameLoop();
    }
    
    restartGame() {
        this.score = 0;
        this.coins = 0;
        this.distance = 0;
        this.gameSpeed = 5;
        this.obstacles = [];
        this.coins = [];
        this.particles = [];
        this.player.lane = 1;
        this.player.isJumping = false;
        this.player.isSliding = false;
        this.player.jumpVelocity = 0;
        this.player.jumpHeight = 0;
        this.setupGame();
        document.getElementById('gameOverScreen').classList.add('hidden');
        this.startGame();
    }
    
    gameOver() {
        this.isGameRunning = false;
        this.isGameOver = true;
        
        document.getElementById('finalScore').textContent = `Final Score: ${this.score}`;
        document.getElementById('finalCoins').textContent = `Total Coins: ${this.coins}`;
        document.getElementById('finalDistance').textContent = `Distance: ${this.distance}m`;
        document.getElementById('gameOverScreen').classList.remove('hidden');
    }
    
    moveLeft() {
        if (this.player.lane > 0) {
            this.player.lane--;
            this.player.x = this.lanes[this.player.lane];
        }
    }
    
    moveRight() {
        if (this.player.lane < 2) {
            this.player.lane++;
            this.player.x = this.lanes[this.player.lane];
        }
    }
    
    jump() {
        if (!this.player.isJumping && !this.player.isSliding) {
            this.player.isJumping = true;
            this.player.jumpVelocity = -15;
        }
    }
    
    slide() {
        if (!this.player.isJumping && !this.player.isSliding) {
            this.player.isSliding = true;
            setTimeout(() => {
                this.player.isSliding = false;
            }, 500);
        }
    }
    
    updatePlayer() {
        // Update jumping
        if (this.player.isJumping) {
            this.player.jumpVelocity += 0.8; // Gravity
            this.player.jumpHeight += this.player.jumpVelocity;
            
            if (this.player.jumpHeight >= 0) {
                this.player.jumpHeight = 0;
                this.player.isJumping = false;
                this.player.jumpVelocity = 0;
            }
        }
        
        // Update player Y position
        this.player.y = this.canvas.height - 100 - this.player.jumpHeight;
        if (this.player.isSliding) {
            this.player.y += this.player.slideHeight;
        }
    }
    
    spawnObstacles() {
        if (Math.random() < 0.02) {
            const lane = Math.floor(Math.random() * 3);
            const type = Math.random() < 0.7 ? 'barrier' : 'train';
            
            this.obstacles.push({
                x: this.lanes[lane],
                y: -50,
                width: type === 'barrier' ? 60 : 120,
                height: type === 'barrier' ? 40 : 80,
                type: type,
                lane: lane
            });
        }
    }
    
    spawnCoins() {
        if (Math.random() < 0.03) {
            const lane = Math.floor(Math.random() * 3);
            this.coins.push({
                x: this.lanes[lane],
                y: -30,
                width: 20,
                height: 20,
                lane: lane,
                collected: false
            });
        }
    }
    
    updateObstacles() {
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            obstacle.y += this.gameSpeed;
            
            if (obstacle.y > this.canvas.height) {
                this.obstacles.splice(i, 1);
            }
        }
    }
    
    updateCoins() {
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];
            coin.y += this.gameSpeed;
            
            if (coin.y > this.canvas.height) {
                this.coins.splice(i, 1);
            }
        }
    }
    
    checkCollisions() {
        // Check obstacle collisions
        for (const obstacle of this.obstacles) {
            if (this.player.lane === obstacle.lane) {
                const playerBottom = this.player.y + this.player.height;
                const playerTop = this.player.y;
                const obstacleBottom = obstacle.y + obstacle.height;
                const obstacleTop = obstacle.y;
                
                if (playerBottom > obstacleTop && playerTop < obstacleBottom) {
                    this.gameOver();
                    return;
                }
            }
        }
        
        // Check coin collisions
        for (const coin of this.coins) {
            if (!coin.collected && this.player.lane === coin.lane) {
                const playerBottom = this.player.y + this.player.height;
                const playerTop = this.player.y;
                const coinBottom = coin.y + coin.height;
                const coinTop = coin.y;
                
                if (playerBottom > coinTop && playerTop < coinBottom) {
                    coin.collected = true;
                    this.coins++;
                    this.score += 10;
                    this.createCoinParticles(coin.x, coin.y);
                }
            }
        }
    }
    
    createCoinParticles(x, y) {
        for (let i = 0; i < 5; i++) {
            this.particles.push({
                x: x + Math.random() * 20 - 10,
                y: y + Math.random() * 20 - 10,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                life: 30,
                maxLife: 30
            });
        }
    }
    
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    updateGame() {
        if (!this.isGameRunning) return;
        
        this.updatePlayer();
        this.updateObstacles();
        this.updateCoins();
        this.updateParticles();
        this.checkCollisions();
        
        this.spawnObstacles();
        this.spawnCoins();
        
        // Update score and distance
        this.score += 1;
        this.distance = Math.floor(this.score / 10);
        
        // Increase game speed over time
        this.gameSpeed += 0.001;
        
        // Update UI
        document.getElementById('score').textContent = `Score: ${this.score}`;
        document.getElementById('coins').textContent = `Coins: ${this.coins}`;
        document.getElementById('distance').textContent = `Distance: ${this.distance}m`;
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background
        this.drawBackground();
        
        // Draw game objects
        this.drawPlayer();
        this.drawObstacles();
        this.drawCoins();
        this.drawParticles();
    }
    
    drawBackground() {
        // Sky gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#98FB98');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Lane markers
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.lanes[i], 0);
            this.ctx.lineTo(this.lanes[i], this.canvas.height);
            this.ctx.stroke();
        }
    }
    
    drawPlayer() {
        this.ctx.fillStyle = '#6366f1';
        this.ctx.fillRect(
            this.player.x - this.player.width / 2,
            this.player.y,
            this.player.width,
            this.player.height
        );
        
        // Player details
        this.ctx.fillStyle = '#4f46e5';
        this.ctx.fillRect(
            this.player.x - this.player.width / 2 + 5,
            this.player.y + 5,
            this.player.width - 10,
            this.player.height - 10
        );
        
        // Eyes
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(
            this.player.x - 8,
            this.player.y + 10,
            6,
            6
        );
        this.ctx.fillRect(
            this.player.x + 2,
            this.player.y + 10,
            6,
            6
        );
        
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(
            this.player.x - 6,
            this.player.y + 12,
            2,
            2
        );
        this.ctx.fillRect(
            this.player.x + 4,
            this.player.y + 12,
            2,
            2
        );
    }
    
    drawObstacles() {
        for (const obstacle of this.obstacles) {
            if (obstacle.type === 'barrier') {
                this.ctx.fillStyle = '#ef4444';
                this.ctx.fillRect(
                    obstacle.x - obstacle.width / 2,
                    obstacle.y,
                    obstacle.width,
                    obstacle.height
                );
            } else {
                this.ctx.fillStyle = '#dc2626';
                this.ctx.fillRect(
                    obstacle.x - obstacle.width / 2,
                    obstacle.y,
                    obstacle.width,
                    obstacle.height
                );
            }
        }
    }
    
    drawCoins() {
        for (const coin of this.coins) {
            if (!coin.collected) {
                this.ctx.fillStyle = '#fbbf24';
                this.ctx.beginPath();
                this.ctx.arc(
                    coin.x,
                    coin.y + coin.height / 2,
                    coin.width / 2,
                    0,
                    Math.PI * 2
                );
                this.ctx.fill();
                
                this.ctx.fillStyle = '#f59e0b';
                this.ctx.beginPath();
                this.ctx.arc(
                    coin.x,
                    coin.y + coin.height / 2,
                    coin.width / 2 - 2,
                    0,
                    Math.PI * 2
                );
                this.ctx.fill();
            }
        }
    }
    
    drawParticles() {
        for (const particle of this.particles) {
            const alpha = particle.life / particle.maxLife;
            this.ctx.fillStyle = `rgba(251, 191, 36, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    gameLoop() {
        if (!this.isGameRunning) return;
        
        this.updateGame();
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    new FarcasterRunner();
});