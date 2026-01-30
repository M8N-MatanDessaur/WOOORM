/**
 * UI Updates
 */
const UI = {
  // DOM element cache
  elements: {},

  /**
   * Cache DOM elements for performance
   */
  cacheElements() {
    this.elements = {
      score: document.getElementById('score'),
      level: document.getElementById('level'),
      dots: document.getElementById('dots'),
      combo: document.getElementById('combo'),
      mobileScore: document.getElementById('mobileScore'),
      mobileLevel: document.getElementById('mobileLevel'),
      mobileDots: document.getElementById('mobileDots'),
      progressBar: document.getElementById('mobileProgressBar'),
      startScreen: document.getElementById('startScreen'),
      gameOverScreen: document.getElementById('gameOverScreen'),
      finalScore: document.getElementById('finalScore'),
      highScoreDisplay: document.getElementById('highScoreDisplay'),
      startLevel: document.getElementById('startLevel'),
      gameWrapper: document.querySelector('.game-wrapper')
    };
  },

  /**
   * Update all UI elements
   */
  update() {
    const { elements } = this;

    elements.score.textContent = GameState.score;
    elements.level.textContent = GameState.level;
    elements.dots.textContent = `${GameState.dotsEaten}/${GameState.dotsRequired}`;

    // Combo display - only show when combo > 1
    if (GameState.combo > 1) {
      elements.combo.textContent = `x${GameState.combo}`;
      elements.combo.style.opacity = GameState.comboTimer < 30 ? (GameState.comboTimer % 6 < 3 ? '1' : '0.3') : '1';
    } else {
      elements.combo.textContent = '';
      elements.combo.style.opacity = '1';
    }

    elements.mobileScore.textContent = GameState.score;
    elements.mobileLevel.textContent = GameState.level;
    elements.mobileDots.textContent = `${GameState.dotsEaten}/${GameState.dotsRequired}`;

    // Progress bar shows dots progress
    const progress = Math.min(100, (GameState.dotsEaten / GameState.dotsRequired) * 100);
    elements.progressBar.style.width = `${progress}%`;
  },

  /**
   * Show start screen
   */
  showStartScreen() {
    this.elements.startScreen.style.display = 'flex';
    this.elements.gameOverScreen.style.display = 'none';
  },

  /**
   * Hide start screen
   */
  hideStartScreen() {
    this.elements.startScreen.style.display = 'none';
  },

  /**
   * Show game over screen
   */
  showGameOver() {
    const isNewRecord = GameState.saveHighScore();

    this.elements.gameOverScreen.style.display = 'flex';
    this.elements.finalScore.textContent = GameState.score;

    if (isNewRecord && GameState.score > 0) {
      this.elements.highScoreDisplay.textContent = 'New High Score!';
      this.elements.highScoreDisplay.classList.add('new-record');
    } else {
      this.elements.highScoreDisplay.textContent = `High Score: ${GameState.highScore}`;
      this.elements.highScoreDisplay.classList.remove('new-record');
    }
  },

  /**
   * Hide game over screen
   */
  hideGameOver() {
    this.elements.gameOverScreen.style.display = 'none';
  },

  /**
   * Update level selector display
   */
  updateLevelSelector() {
    this.elements.startLevel.textContent = GameState.startingLevel;
  },

  /**
   * Apply screen shake effect (decays over time)
   */
  applyScreenShake() {
    if (GameState.shakeAmount > 0) {
      const shakeX = (Math.random() - 0.5) * GameState.shakeAmount * 2;
      const shakeY = (Math.random() - 0.5) * GameState.shakeAmount * 2;
      this.elements.gameWrapper.style.transform = `translate(${shakeX}px, ${shakeY}px)`;
      // Decay shake (runs at 60fps render loop, so decay quickly)
      GameState.shakeAmount *= 0.9;
      if (GameState.shakeAmount < 0.5) {
        GameState.shakeAmount = 0;
      }
    } else {
      this.elements.gameWrapper.style.transform = '';
    }
  }
};
