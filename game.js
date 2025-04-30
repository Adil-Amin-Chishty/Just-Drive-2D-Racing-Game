class RacingGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.timerElement = document.getElementById('timer');
        this.bestScoreElement = document.getElementById('best-score');
        this.finalScoreElement = document.getElementById('final-score');
        this.gameOverElement = document.getElementById('gameOver');
        this.restartButton = document.getElementById('restart-button');
        this.pauseButton = document.getElementById('pause-button');
        this.musicButton = document.getElementById('music-button');
        this.backgroundMusic = document.getElementById('background-music');

        // Game state
        this.gameRunning = false;
        this.isPaused = false;
        this.isMusicPlaying = true;
        this.score = 0;
        this.bestScore = localStorage.getItem('bestScore') || 0;
        this.startTime = 0;
        this.obstacles = [];
        this.roadOffset = 0;
        this.roadSpeed = 2;

        // Car properties
        this.car = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 100,
            width: 50,
            height: 80,
            speed: 5,
            velocity: { x: 0, y: 0 },
            acceleration: 0.5,
            friction: 0.95
        };

        // Obstacle properties
        this.obstacleConfig = {
            width: 40,
            height: 40,
            minSpeed: 3,
            maxSpeed: 7,
            spawnInterval: 2000
        };

        // Initialize game
        this.init();
    }

    init() {
        // Set canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Event listeners
        this.restartButton.addEventListener('click', () => this.startGame());
        this.pauseButton.addEventListener('click', () => this.togglePause());
        this.musicButton.addEventListener('click', () => this.toggleMusic());
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));

        // Initialize best score
        this.bestScoreElement.textContent = this.bestScore;

        // Start game and music
        this.startGame();
        this.startMusic();
    }

    startMusic() {
        this.backgroundMusic.volume = 0.5;
        this.backgroundMusic.play().catch(error => {
            console.log("Audio play failed:", error);
        });
        this.musicButton.textContent = '🔊';
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        this.pauseButton.textContent = this.isPaused ? '▶️' : '⏸️';
        
        if (this.isPaused) {
            this.gameRunning = false;
            this.backgroundMusic.pause();
        } else {
            this.gameRunning = true;
            if (this.isMusicPlaying) {
                this.backgroundMusic.play();
            }
            this.gameLoop();
        }
    }

    toggleMusic() {
        this.isMusicPlaying = !this.isMusicPlaying;
        this.musicButton.textContent = this.isMusicPlaying ? '🔊' : '🔇';
        
        if (this.isMusicPlaying) {
            this.backgroundMusic.play();
        } else {
            this.backgroundMusic.pause();
        }
    }

    resizeCanvas() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
        this.car.x = this.canvas.width / 2;
    }

    startGame() {
        this.gameRunning = true;
        this.isPaused = false;
        this.pauseButton.textContent = '⏸️';
        this.score = 0;
        this.obstacles = [];
        this.roadOffset = 0;
        this.startTime = Date.now();
        this.gameOverElement.classList.add('hidden');
        this.updateScore();
        
        if (this.isMusicPlaying) {
            this.backgroundMusic.play();
        }
        
        this.gameLoop();
    }

    gameLoop() {
        if (!this.gameRunning) return;

        this.clearCanvas();
        this.drawRoad();
        this.updateCar();
        this.updateObstacles();
        this.checkCollisions();
        this.updateScore();
        this.updateTimer();

        requestAnimationFrame(() => this.gameLoop());
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawRoad() {
        // Draw road background with gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#1F2937');
        gradient.addColorStop(1, '#111827');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw road markings with smooth animation
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 5;
        this.ctx.setLineDash([20, 20]);
        
        this.roadOffset = (this.roadOffset + this.roadSpeed) % 40;
        for (let i = -40; i < this.canvas.height; i += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.canvas.width / 2, i + this.roadOffset);
            this.ctx.lineTo(this.canvas.width / 2, i + this.roadOffset + 20);
            this.ctx.stroke();
        }

        // Draw road edges
        this.ctx.strokeStyle = '#374151';
        this.ctx.lineWidth = 10;
        this.ctx.setLineDash([]);
        this.ctx.beginPath();
        this.ctx.moveTo(50, 0);
        this.ctx.lineTo(50, this.canvas.height);
        this.ctx.moveTo(this.canvas.width - 50, 0);
        this.ctx.lineTo(this.canvas.width - 50, this.canvas.height);
        this.ctx.stroke();
    }

    updateCar() {
        // Apply friction
        this.car.velocity.x *= this.car.friction;
        this.car.velocity.y *= this.car.friction;

        // Update position
        this.car.x += this.car.velocity.x;
        this.car.y += this.car.velocity.y;

        // Keep car within bounds
        this.car.x = Math.max(this.car.width/2, Math.min(this.canvas.width - this.car.width/2, this.car.x));
        this.car.y = Math.max(this.car.height/2, Math.min(this.canvas.height - this.car.height/2, this.car.y));

        // Draw car body with shadow
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowOffsetX = 5;
        this.ctx.shadowOffsetY = 5;

        // Draw car body
        this.ctx.fillStyle = '#3B82F6';
        this.ctx.fillRect(
            this.car.x - this.car.width / 2,
            this.car.y - this.car.height / 2,
            this.car.width,
            this.car.height
        );

        // Draw car windows
        this.ctx.fillStyle = '#93C5FD';
        this.ctx.fillRect(
            this.car.x - this.car.width / 2 + 5,
            this.car.y - this.car.height / 2 + 5,
            this.car.width - 10,
            this.car.height / 3
        );

        // Draw car wheels
        this.ctx.fillStyle = '#1F2937';
        // Front wheels
        this.ctx.fillRect(
            this.car.x - this.car.width / 2 - 5,
            this.car.y - this.car.height / 2 + 10,
            10,
            20
        );
        this.ctx.fillRect(
            this.car.x + this.car.width / 2 - 5,
            this.car.y - this.car.height / 2 + 10,
            10,
            20
        );
        // Back wheels
        this.ctx.fillRect(
            this.car.x - this.car.width / 2 - 5,
            this.car.y + this.car.height / 2 - 30,
            10,
            20
        );
        this.ctx.fillRect(
            this.car.x + this.car.width / 2 - 5,
            this.car.y + this.car.height / 2 - 30,
            10,
            20
        );

        // Reset shadow
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
    }

    updateObstacles() {
        // Spawn new obstacles
        if (Math.random() < 0.02) {
            this.spawnObstacle();
        }

        // Update and draw obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            obstacle.y += obstacle.speed;

            // Add shadow to rocks
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            this.ctx.shadowBlur = 10;
            this.ctx.shadowOffsetX = 5;
            this.ctx.shadowOffsetY = 5;

            // Draw rock
            this.ctx.fillStyle = '#EF4444';
            this.ctx.beginPath();
            this.ctx.arc(
                obstacle.x,
                obstacle.y,
                obstacle.width / 2,
                0,
                Math.PI * 2
            );
            this.ctx.fill();

            // Add rock texture
            this.ctx.fillStyle = '#DC2626';
            this.ctx.beginPath();
            this.ctx.arc(
                obstacle.x - 5,
                obstacle.y - 5,
                5,
                0,
                Math.PI * 2
            );
            this.ctx.fill();

            // Reset shadow
            this.ctx.shadowColor = 'transparent';
            this.ctx.shadowBlur = 0;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 0;

            // Remove obstacles that are off screen
            if (obstacle.y > this.canvas.height + obstacle.height) {
                this.obstacles.splice(i, 1);
                this.score += 10;
            }
        }
    }

    spawnObstacle() {
        const width = this.obstacleConfig.width;
        const height = this.obstacleConfig.height;
        const x = Math.random() * (this.canvas.width - width) + width / 2;
        const speed = this.obstacleConfig.minSpeed + 
                     Math.random() * (this.obstacleConfig.maxSpeed - this.obstacleConfig.minSpeed);

        this.obstacles.push({
            x,
            y: -height,
            width,
            height,
            speed
        });
    }

    checkCollisions() {
        for (const obstacle of this.obstacles) {
            if (this.checkCollision(this.car, obstacle)) {
                this.gameOver();
                break;
            }
        }
    }

    checkCollision(rect1, rect2) {
        return rect1.x - rect1.width/2 < rect2.x + rect2.width/2 &&
               rect1.x + rect1.width/2 > rect2.x - rect2.width/2 &&
               rect1.y - rect1.height/2 < rect2.y + rect2.height/2 &&
               rect1.y + rect1.height/2 > rect2.y - rect2.height/2;
    }

    updateScore() {
        this.scoreElement.textContent = this.score;
    }

    updateTimer() {
        const elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
        this.timerElement.textContent = elapsedTime;
    }

    gameOver() {
        this.gameRunning = false;
        this.finalScoreElement.textContent = this.score;
        
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('bestScore', this.bestScore);
            this.bestScoreElement.textContent = this.bestScore;
        }

        this.gameOverElement.classList.remove('hidden');
    }

    handleKeyDown(e) {
        if (!this.gameRunning) return;

        switch(e.key) {
            case 'ArrowLeft':
            case 'a':
                this.car.velocity.x = -this.car.speed;
                break;
            case 'ArrowRight':
            case 'd':
                this.car.velocity.x = this.car.speed;
                break;
            case 'ArrowUp':
            case 'w':
                this.car.velocity.y = -this.car.speed;
                break;
            case 'ArrowDown':
            case 's':
                this.car.velocity.y = this.car.speed;
                break;
        }
    }

    handleKeyUp(e) {
        if (!this.gameRunning) return;

        switch(e.key) {
            case 'ArrowLeft':
            case 'a':
            case 'ArrowRight':
            case 'd':
                this.car.velocity.x = 0;
                break;
            case 'ArrowUp':
            case 'w':
            case 'ArrowDown':
            case 's':
                this.car.velocity.y = 0;
                break;
        }
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new RacingGame();
}); 