// Arbitrum Runner - Subway Surfer Style Game
// Based on open-source Subway Surfer implementation with Arbitrum theming

class ArbitrumRunner {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameState = 'start'; // start, playing, gameOver
        this.score = 0;
        this.coins = 0;
        this.distance = 0;
        this.gameSpeed = 5;
        this.maxSpeed = 15;
        
        // Player properties
        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 100,
            width: 60,
            height: 80,
            lane: 1, // 0: left, 1: center, 2: right
            isJumping: false,
            isSliding: false,
            jumpHeight: 0,
            maxJumpHeight: 150,
            jumpSpeed: 8,
            gravity: 0.6
        };
        
        // Game objects
        this.obstacles = [];
        this.coins = [];
        this.particles = [];
        
        // Lane positions
        this.lanes = [
            this.canvas.width * 0.25,
            this.canvas.width * 0.5,
            this.canvas.width * 0.75
        ];
        
        // Game settings
        this.obstacleSpawnRate = 0.02;
        this.coinSpawnRate = 0.03;
        this.lastObstacleSpawn = 0;
        this.lastCoinSpawn = 0;
        
        // Input handling
        this.keys = {};
        this.touchStartX = 0;
        this.touchStartY = 0;
        
        this.setupEventListeners();
        this.setupGame();
    }
    
    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
                this.moveLeft();
            } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
                this.moveRight();
            } else if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') {
                this.jump();
            } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
                this.slide();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Touch controls for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const deltaX = touchEndX - this.touchStartX;
            const deltaY = touchEndY - this.touchStartY;
            
            const minSwipeDistance = 50;
            
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (Math.abs(deltaX) > minSwipeDistance) {
                    if (deltaX > 0) {
                        this.moveRight();
                    } else {
                        this.moveLeft();
                    }
                }
            } else {
                if (Math.abs(deltaY) > minSwipeDistance) {
                    if (deltaY < 0) {
                        this.jump();
                    } else {
                        this.slide();
                    }
                }
            }
        });
        
        // Game control buttons
        document.getElementById('startBtn').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.restartGame();
        });
    }
    
    setupGame() {
        this.updateScore();
        this.gameLoop();
    }
    
    startGame() {
        this.gameState = 'playing';
        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('scoreBoard').style.display = 'flex';
        this.gameSpeed = 5;
        this.lastObstacleSpawn = 0;
        this.lastCoinSpawn = 0;
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
        this.player.jumpHeight = 0;
        this.player.x = this.lanes[this.player.lane];
        this.player.y = this.canvas.height - 100;
        
        document.getElementById('gameOverScreen').classList.add('hidden');
        document.getElementById('startScreen').classList.remove('hidden');
        document.getElementById('scoreBoard').style.display = 'none';
        this.gameState = 'start';
        this.updateScore();
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalCoins').textContent = this.coins;
        document.getElementById('finalDistance').textContent = this.distance + 'm';
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
            this.player.jumpHeight = 0;
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
            this.player.jumpHeight += this.player.jumpSpeed;
            if (this.player.jumpHeight >= this.player.maxJumpHeight) {
                this.player.jumpSpeed = -this.player.jumpSpeed;
            }
            if (this.player.jumpHeight <= 0) {
                this.player.isJumping = false;
                this.player.jumpSpeed = Math.abs(this.player.jumpSpeed);
            }
        }
        
        // Update player position
        this.player.y = this.canvas.height - 100 - this.player.jumpHeight;
    }
    
    spawnObstacles() {
        if (Math.random() < this.obstacleSpawnRate) {
            const lane = Math.floor(Math.random() * 3);
            const obstacle = {
                x: this.lanes[lane] - 25,
                y: -50,
                width: 50,
                height: 50,
                lane: lane,
                type: Math.random() < 0.3 ? 'barrier' : 'obstacle'
            };
            this.obstacles.push(obstacle);
        }
    }
    
    spawnCoins() {
        if (Math.random() < this.coinSpawnRate) {
            const lane = Math.floor(Math.random() * 3);
            const coin = {
                x: this.lanes[lane] - 15,
                y: -30,
                width: 30,
                height: 30,
                lane: lane,
                collected: false
            };
            this.coins.push(coin);
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
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];
            if (this.player.lane === coin.lane && !coin.collected) {
                const playerBottom = this.player.y + this.player.height;
                const playerTop = this.player.y;
                const coinBottom = coin.y + coin.height;
                const coinTop = coin.y;
                
                if (playerBottom > coinTop && playerTop < coinBottom) {
                    this.coins.splice(i, 1);
                    this.coins++;
                    this.score += 10;
                    this.createCoinParticles(coin.x + coin.width/2, coin.y + coin.height/2);
                    this.updateScore();
                }
            }
        }
    }
    
    createCoinParticles(x, y) {
        for (let i = 0; i < 8; i++) {
            const particle = {
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 30,
                maxLife: 30
            };
            this.particles.push(particle);
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
        if (this.gameState !== 'playing') return;
        
        this.updatePlayer();
        this.spawnObstacles();
        this.spawnCoins();
        this.updateObstacles();
        this.updateCoins();
        this.updateParticles();
        this.checkCollisions();
        
        // Increase game speed over time
        this.gameSpeed = Math.min(this.maxSpeed, 5 + this.score / 1000);
        
        // Update distance
        this.distance = Math.floor(this.score / 10);
        this.updateScore();
    }
    
    updateScore() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('coins').textContent = this.coins;
        document.getElementById('distance').textContent = this.distance + 'm';
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background
        this.drawBackground();
        
        // Draw game objects
        this.drawObstacles();
        this.drawCoins();
        this.drawPlayer();
        this.drawParticles();
        
        // Draw UI elements
        this.drawUI();
    }
    
    drawBackground() {
        // Create gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#1E293B');
        gradient.addColorStop(1, '#0F172A');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw lane markers
        this.ctx.strokeStyle = 'rgba(40, 160, 240, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([20, 20]);
        
        for (const lane of this.lanes) {
            this.ctx.beginPath();
            this.ctx.moveTo(lane, 0);
            this.ctx.lineTo(lane, this.canvas.height);
            this.ctx.stroke();
        }
        this.ctx.setLineDash([]);
    }
    
    drawPlayer() {
        this.ctx.fillStyle = '#28A0F0';
        this.ctx.fillRect(
            this.player.x - this.player.width/2,
            this.player.y,
            this.player.width,
            this.player.height
        );
        
        // Draw player details
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(
            this.player.x - this.player.width/2 + 5,
            this.player.y + 5,
            this.player.width - 10,
            10
        );
        
        // Draw eyes
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(
            this.player.x - 15,
            this.player.y + 20,
            8,
            8
        );
        this.ctx.fillRect(
            this.player.x + 7,
            this.player.y + 20,
            8,
            8
        );
    }
    
    drawObstacles() {
        this.ctx.fillStyle = '#EF4444';
        for (const obstacle of this.obstacles) {
            if (obstacle.type === 'barrier') {
                this.ctx.fillStyle = '#F59E0B';
            } else {
                this.ctx.fillStyle = '#EF4444';
            }
            this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        }
    }
    
    drawCoins() {
        this.ctx.fillStyle = '#FBBF24';
        for (const coin of this.coins) {
            this.ctx.beginPath();
            this.ctx.arc(
                coin.x + coin.width/2,
                coin.y + coin.height/2,
                coin.width/2,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
            
            // Draw coin shine
            this.ctx.fillStyle = '#FCD34D';
            this.ctx.beginPath();
            this.ctx.arc(
                coin.x + coin.width/2 - 5,
                coin.y + coin.height/2 - 5,
                3,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
            this.ctx.fillStyle = '#FBBF24';
        }
    }
    
    drawParticles() {
        this.ctx.fillStyle = '#FBBF24';
        for (const particle of this.particles) {
            const alpha = particle.life / particle.maxLife;
            this.ctx.globalAlpha = alpha;
            this.ctx.fillRect(particle.x, particle.y, 4, 4);
        }
        this.ctx.globalAlpha = 1;
    }
    
    drawUI() {
        // Draw speed indicator
        this.ctx.fillStyle = '#28A0F0';
        this.ctx.font = '16px Inter';
        this.ctx.fillText(`Speed: ${this.gameSpeed.toFixed(1)}`, 20, 40);
    }
    
    gameLoop() {
        this.updateGame();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ArbitrumRunner();
});