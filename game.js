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
        this.lastTime = 0;
        this.deltaTime = 0;
        
        // Visual effects
        this.screenShake = 0;
        this.backgroundOffset = 0;
        
        // Game mechanics
        this.combo = 0;
        this.maxCombo = 0;
        this.powerUpActive = false;
        this.powerUpTimer = 0;
        this.invincible = false;
        this.invincibleTimer = 0;
        
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
            jumpVelocity: 0,
            gravity: 0.8,
            groundY: this.canvas.height - 100,
            slideHeight: 40
        };
        
        // Game objects
        this.obstacles = [];
        this.coins = [];
        this.particles = [];
        this.powerUps = [];
        
        // Lane positions
        this.lanes = [
            this.canvas.width * 0.25,
            this.canvas.width * 0.5,
            this.canvas.width * 0.75
        ];
        
        // Game settings
        this.obstacleSpawnRate = 0.015;
        this.coinSpawnRate = 0.025;
        this.powerUpSpawnRate = 0.005;
        this.lastObstacleSpawn = 0;
        this.lastCoinSpawn = 0;
        this.lastPowerUpSpawn = 0;
        this.frameCount = 0;
        
        // Input handling
        this.keys = {};
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.lastTouchTime = 0;
        
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
            this.lastTouchTime = Date.now();
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const touchDuration = Date.now() - this.lastTouchTime;
            
            const deltaX = touchEndX - this.touchStartX;
            const deltaY = touchEndY - this.touchStartY;
            
            const minSwipeDistance = 30;
            const maxTouchDuration = 300;
            
            if (touchDuration < maxTouchDuration && (Math.abs(deltaX) > minSwipeDistance || Math.abs(deltaY) > minSwipeDistance)) {
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    if (deltaX > 0) {
                        this.moveRight();
                    } else {
                        this.moveLeft();
                    }
                } else {
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
        this.frameCount = 0;
        this.score = 0;
        this.coins = 0;
        this.distance = 0;
        this.obstacles = [];
        this.coins = [];
        this.particles = [];
        this.player.lane = 1;
        this.player.isJumping = false;
        this.player.isSliding = false;
        this.player.jumpHeight = 0;
        this.player.jumpVelocity = 0;
        this.player.x = this.lanes[this.player.lane];
        this.player.y = this.player.groundY;
    }
    
    restartGame() {
        this.gameState = 'start';
        document.getElementById('gameOverScreen').classList.add('hidden');
        document.getElementById('startScreen').classList.remove('hidden');
        document.getElementById('scoreBoard').style.display = 'none';
        this.updateScore();
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        this.screenShake = 20; // Add screen shake effect
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalCoins').textContent = this.coins;
        document.getElementById('finalDistance').textContent = this.distance + 'm';
        document.getElementById('gameOverScreen').classList.remove('hidden');
    }
    
    moveLeft() {
        if (this.player.lane > 0) {
            this.player.lane--;
            this.animateLaneChange();
        }
    }
    
    moveRight() {
        if (this.player.lane < 2) {
            this.player.lane++;
            this.animateLaneChange();
        }
    }
    
    animateLaneChange() {
        const targetX = this.lanes[this.player.lane];
        const startX = this.player.x;
        const distance = targetX - startX;
        const duration = 200; // 200ms for smooth transition
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth movement
            const easeOut = 1 - Math.pow(1 - progress, 3);
            this.player.x = startX + (distance * easeOut);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
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
            }, 800);
        }
    }
    
    updatePlayer() {
        // Update jumping physics
        if (this.player.isJumping) {
            this.player.jumpVelocity += this.player.gravity;
            this.player.jumpHeight = -this.player.jumpVelocity;
            
            // Check if landed
            if (this.player.jumpHeight <= 0) {
                this.player.isJumping = false;
                this.player.jumpHeight = 0;
                this.player.jumpVelocity = 0;
            }
        }
        
        // Update player position
        this.player.y = this.player.groundY - this.player.jumpHeight;
        
        // Update player height based on sliding
        if (this.player.isSliding) {
            this.player.height = this.player.slideHeight;
        } else {
            this.player.height = 80;
        }
    }
    
    spawnObstacles() {
        this.frameCount++;
        if (this.frameCount - this.lastObstacleSpawn > 60 / this.obstacleSpawnRate) {
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
            this.lastObstacleSpawn = this.frameCount;
        }
    }
    
    spawnCoins() {
        if (this.frameCount - this.lastCoinSpawn > 40 / this.coinSpawnRate) {
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
            this.lastCoinSpawn = this.frameCount;
        }
    }
    
    spawnPowerUps() {
        if (this.frameCount - this.lastPowerUpSpawn > 120 / this.powerUpSpawnRate) {
            const lane = Math.floor(Math.random() * 3);
            const powerUp = {
                x: this.lanes[lane] - 20,
                y: -40,
                width: 40,
                height: 40,
                lane: lane,
                type: Math.random() < 0.5 ? 'shield' : 'magnet',
                collected: false
            };
            this.powerUps.push(powerUp);
            this.lastPowerUpSpawn = this.frameCount;
        }
    }
    
    updatePowerUps() {
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            powerUp.y += this.gameSpeed;
            
            if (powerUp.y > this.canvas.height) {
                this.powerUps.splice(i, 1);
            }
        }
    }
    
    collectPowerUp(powerUp) {
        if (powerUp.type === 'shield') {
            this.invincible = true;
            this.invincibleTimer = 300; // 5 seconds at 60fps
            this.createPowerUpParticles(powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2, '#00D4FF');
        } else if (powerUp.type === 'magnet') {
            this.powerUpActive = true;
            this.powerUpTimer = 180; // 3 seconds at 60fps
            this.createPowerUpParticles(powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2, '#FBBF24');
        }
        
        this.score += 50;
        this.combo++;
        this.maxCombo = Math.max(this.maxCombo, this.combo);
    }
    
    createPowerUpParticles(x, y, color) {
        for (let i = 0; i < 12; i++) {
            const particle = {
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 15,
                vy: (Math.random() - 0.5) * 15,
                life: 45,
                maxLife: 45,
                color: color
            };
            this.particles.push(particle);
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
            
            // Magnet effect when power-up is active
            if (this.powerUpActive && this.player.lane === coin.lane) {
                const distanceToPlayer = Math.abs(coin.x - this.player.x);
                if (distanceToPlayer < 100) {
                    // Attract coin to player
                    const direction = this.player.x > coin.x ? 1 : -1;
                    coin.x += direction * 3;
                }
            }
            
            if (coin.y > this.canvas.height) {
                this.coins.splice(i, 1);
            }
        }
    }
    
    checkCollisions() {
        // Check power-up collisions
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            if (this.player.lane === powerUp.lane && !powerUp.collected) {
                const playerBottom = this.player.y + this.player.height;
                const playerTop = this.player.y;
                const powerUpBottom = powerUp.y + powerUp.height;
                const powerUpTop = powerUp.y;
                
                if (playerBottom > powerUpTop && playerTop < powerUpBottom) {
                    this.collectPowerUp(powerUp);
                    this.powerUps.splice(i, 1);
                    this.updateScore();
                    continue;
                }
            }
        }
        
        // Check obstacle collisions (skip if invincible)
        if (this.invincible) return;
        
        for (const obstacle of this.obstacles) {
            if (this.player.lane === obstacle.lane) {
                const playerBottom = this.player.y + this.player.height;
                const playerTop = this.player.y;
                const obstacleBottom = obstacle.y + obstacle.height;
                const obstacleTop = obstacle.y;
                
                // Check if player is jumping over obstacle
                if (this.player.isJumping && this.player.jumpHeight > obstacle.height) {
                    continue; // Player jumps over obstacle
                }
                
                // Check if player is sliding under barrier
                if (this.player.isSliding && obstacle.type === 'barrier' && this.player.height < obstacle.height) {
                    continue; // Player slides under barrier
                }
                
                if (playerBottom > obstacleTop && playerTop < obstacleBottom) {
                    this.combo = 0; // Reset combo on collision
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
                    this.score += 10 + this.combo * 2; // Bonus points for combo
                    this.combo++;
                    this.maxCombo = Math.max(this.maxCombo, this.combo);
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
        this.spawnPowerUps(); // Spawn power-ups
        this.updateObstacles();
        this.updateCoins();
        this.updatePowerUps(); // Update power-ups
        this.updateParticles();
        this.checkCollisions();
        
        // Update power-up timers
        if (this.invincible) {
            this.invincibleTimer--;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
            }
        }
        
        if (this.powerUpActive) {
            this.powerUpTimer--;
            if (this.powerUpTimer <= 0) {
                this.powerUpActive = false;
            }
        }
        
        // Update visual effects
        this.backgroundOffset += this.gameSpeed * 0.5;
        if (this.screenShake > 0) {
            this.screenShake *= 0.9;
        }
        
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
        
        // Apply screen shake
        if (this.screenShake > 0) {
            const shakeX = (Math.random() - 0.5) * this.screenShake;
            const shakeY = (Math.random() - 0.5) * this.screenShake;
            this.ctx.save();
            this.ctx.translate(shakeX, shakeY);
        }
        
        // Draw background
        this.drawBackground();
        
        // Draw game objects
        this.drawObstacles();
        this.drawCoins();
        this.drawPowerUps();
        this.drawPlayer();
        this.drawParticles();
        
        // Draw UI elements
        this.drawUI();
        
        // Restore canvas state
        if (this.screenShake > 0) {
            this.ctx.restore();
        }
    }
    
    drawBackground() {
        // Create gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#1E293B');
        gradient.addColorStop(1, '#0F172A');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw parallax background elements
        this.ctx.fillStyle = 'rgba(40, 160, 240, 0.1)';
        for (let i = 0; i < 20; i++) {
            const x = (i * 100 + this.backgroundOffset * 0.3) % (this.canvas.width + 100);
            const y = (i * 80) % this.canvas.height;
            this.ctx.fillRect(x, y, 2, 2);
        }
        
        // Draw lane markers with parallax effect
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
        
        // Draw ground line
        this.ctx.strokeStyle = 'rgba(40, 160, 240, 0.5)';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.player.groundY + this.player.height);
        this.ctx.lineTo(this.canvas.width, this.player.groundY + this.player.height);
        this.ctx.stroke();
    }
    
    drawPlayer() {
        // Draw player body
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
        
        // Draw mouth
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(
            this.player.x - 8,
            this.player.y + 35,
            16,
            4
        );
    }
    
    drawObstacles() {
        for (const obstacle of this.obstacles) {
            if (obstacle.type === 'barrier') {
                this.ctx.fillStyle = '#F59E0B';
            } else {
                this.ctx.fillStyle = '#EF4444';
            }
            this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            
            // Add some detail to obstacles
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.fillRect(obstacle.x + 5, obstacle.y + 5, obstacle.width - 10, obstacle.height - 10);
        }
    }
    
    drawCoins() {
        for (const coin of this.coins) {
            // Draw coin body
            this.ctx.fillStyle = '#FBBF24';
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
            
            // Draw coin symbol
            this.ctx.fillStyle = '#B45309';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('$', coin.x + coin.width/2, coin.y + coin.height/2 + 4);
        }
    }
    
    drawPowerUps() {
        for (const powerUp of this.powerUps) {
            if (powerUp.type === 'shield') {
                this.ctx.fillStyle = '#00D4FF';
            } else {
                this.ctx.fillStyle = '#FBBF24';
            }
            
            this.ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
            
            // Draw power-up symbol
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '20px Arial';
            this.ctx.textAlign = 'center';
            const symbol = powerUp.type === 'shield' ? '🛡️' : '🧲';
            this.ctx.fillText(symbol, powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2 + 8);
        }
    }
    
    drawParticles() {
        for (const particle of this.particles) {
            const alpha = particle.life / particle.maxLife;
            this.ctx.globalAlpha = alpha;
            
            if (particle.color) {
                this.ctx.fillStyle = particle.color;
            } else {
                this.ctx.fillStyle = '#FBBF24';
            }
            
            this.ctx.fillRect(particle.x, particle.y, 4, 4);
        }
        this.ctx.globalAlpha = 1;
    }
    
    drawUI() {
        // Draw speed indicator
        this.ctx.fillStyle = '#28A0F0';
        this.ctx.font = '16px Inter';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Speed: ${this.gameSpeed.toFixed(1)}`, 20, 40);
        
        // Draw frame rate
        this.ctx.fillStyle = '#6B7280';
        this.ctx.font = '12px Inter';
        this.ctx.fillText(`FPS: ${Math.round(1000 / this.deltaTime)}`, 20, 60);
        
        // Draw combo
        if (this.combo > 0) {
            this.ctx.fillStyle = '#FBBF24';
            this.ctx.font = '18px Inter';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`Combo: ${this.combo}x`, this.canvas.width / 2, 40);
        }
        
        // Draw power-up indicators
        if (this.invincible) {
            this.ctx.fillStyle = '#00D4FF';
            this.ctx.font = '14px Inter';
            this.ctx.textAlign = 'right';
            this.ctx.fillText(`🛡️ Shield: ${Math.ceil(this.invincibleTimer / 60)}s`, this.canvas.width - 20, 40);
        }
        
        if (this.powerUpActive) {
            this.ctx.fillStyle = '#FBBF24';
            this.ctx.font = '14px Inter';
            this.ctx.textAlign = 'right';
            this.ctx.fillText(`🧲 Magnet: ${Math.ceil(this.powerUpTimer / 60)}s`, this.canvas.width - 20, 60);
        }
        
        // Draw invincibility effect around player
        if (this.invincible) {
            this.ctx.strokeStyle = '#00D4FF';
            this.ctx.lineWidth = 3;
            this.ctx.globalAlpha = 0.7;
            this.ctx.strokeRect(
                this.player.x - this.player.width/2 - 5,
                this.player.y - 5,
                this.player.width + 10,
                this.player.height + 10
            );
            this.ctx.globalAlpha = 1;
        }
    }
    
    gameLoop(currentTime = 0) {
        this.deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Always render, but only update game logic when playing
        if (this.gameState === 'playing') {
            this.updateGame();
        }
        
        this.render();
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ArbitrumRunner();
});