/**
 * Main Game Controller - Fixed 30 FPS to match Playdate
 */
const Game = {
  /**
   * Initialize the game
   */
  init() {
    GameState.init();
    Renderer.init();
    UI.cacheElements();
    Input.init();
    Theme.apply();

    // Calculate perimeter for wormhole
    GameState.perimeterLength = 2 * Config.PLAY_WIDTH + 2 * Config.PLAY_HEIGHT;

    // Start game loop
    GameState.lastFrameTime = performance.now();
    requestAnimationFrame(this.loop.bind(this));
  },

  /**
   * Start a new game
   */
  start() {
    Audio.init();
    GameState.status = 'playing';
    UI.hideStartScreen();
    GameState.reset();
    this.initLevel();
    UI.update();
    Audio.play('start');
    // Start background music after start sound + 0.2s delay (1s total)
    setTimeout(() => Audio.startMusic(), 1000);
  },

  /**
   * Restart the game
   */
  restart() {
    GameState.status = 'playing';
    UI.hideGameOver();
    GameState.reset();
    this.initLevel();
    UI.update();
    Audio.play('start');
    // Start background music after start sound + 0.2s delay (1s total)
    setTimeout(() => Audio.startMusic(), 1000);
  },

  /**
   * Initialize current level
   */
  initLevel() {
    const lvl = GameState.level;

    // Set level parameters
    GameState.wormSpeed = Worm.getWormSpeed(lvl);
    GameState.wormholeSpeed = Worm.getWormholeSpeed(lvl);
    GameState.dotsRequired = Worm.getRequiredDots(lvl);
    GameState.maxHunters = Worm.getMaxHunters(lvl);

    // Generate obstacles first
    Obstacles.generate(lvl);

    // Generate button (level 6+)
    Obstacles.generateButton(lvl);

    // Wormhole starts closed until minimum dots eaten
    GameState.wormholeOpen = false;
    GameState.wormholeTimer = 0;
    GameState.wormhole.pos = 0;

    // Find clear spawn point and init worm
    const spawn = Worm.findClearSpawnPoint();
    Worm.init(spawn.x, spawn.y, spawn.angle);

    // Initialize dots
    Dots.init(lvl);

    // Reset hunters
    GameState.hunters = [];
    GameState.levelTimer = 0;
    GameState.hunterRespawnTime = 0;
    GameState.hunterPenaltyTimer = 0;

    // Reset wall shrinking
    GameState.wallShrink = 0;
    GameState.shrinkTimer = 0;
    GameState.shrinkActive = false;

    // Grace period
    GameState.graceTimer = Config.GRACE_FRAMES;
  },

  /**
   * Setup next level (keep score, advance level)
   */
  setupNextLevel() {
    // Bank score
    const lengthPoints = Math.max(0, GameState.worm.length - Config.MIN_WORM_LENGTH);
    const points = lengthPoints * (10 + GameState.level * 2);
    GameState.score += points;

    if (GameState.score > GameState.highScore) {
      GameState.highScore = GameState.score;
      GameState.saveHighScore();
    }

    // Advance level
    GameState.level++;

    // Reset level state
    GameState.dotsEaten = 0;
    GameState.minimumReached = false;
    GameState.dots = [];
    GameState.poisonDots = [];

    // Wormhole closed until minimum dots
    GameState.wormholeOpen = false;
    GameState.wormholeTimer = 0;
    GameState.button.pressed = false;
    GameState.button.visible = false;

    // Reset hunters
    GameState.hunters = [];
    GameState.levelTimer = 0;
    GameState.hunterRespawnTime = 0;

    // Reset shrinking
    GameState.wallShrink = 0;
    GameState.shrinkTimer = 0;
    GameState.shrinkActive = false;
  },

  /**
   * Complete current level
   */
  completeLevel() {
    this.setupNextLevel();
    this.initLevel();

    // Find new spawn and reinit worm
    const spawn = Worm.findClearSpawnPoint();
    Worm.init(spawn.x, spawn.y, spawn.angle);

    GameState.graceTimer = Config.GRACE_FRAMES;

    Audio.play('warp');
    setTimeout(() => Audio.play('levelUp'), 200);
    Particles.spawn(spawn.x, spawn.y, 15);
    GameState.shakeAmount = 8;
    GameState.flashTimer = 10;
  },

  /**
   * Main game update - called at fixed 30fps
   */
  fixedUpdate() {
    if (GameState.status !== 'playing') return;

    GameState.frameCount++;

    // Update worm and check collisions
    const wormResult = Worm.update();
    if (wormResult === 'gameover') {
      this.gameOver();
      return;
    }
    if (wormResult === 'levelComplete') {
      this.completeLevel();
      UI.update();
      return;
    }

    // Check dot collisions
    Dots.checkCollision();

    // Update dots (respawning)
    Dots.update();

    // Update poison dots
    Dots.updatePoison();

    // Update combo
    Dots.updateCombo();

    // Update wormhole position
    Wormhole.update();

    // Update wormhole timer (level 6+)
    Wormhole.updateTimer();

    // Update hunters
    Hunters.update();

    // Update wall shrinking
    this.updateShrinking();

    // Update effects
    this.updateEffects();

    UI.update();
  },

  /**
   * Update wall shrinking
   */
  updateShrinking() {
    if (!GameState.shrinkActive) return;

    GameState.shrinkTimer++;

    // Determine shrink rate based on time
    let rate;
    if (GameState.shrinkTimer <= Config.GENTLE_DURATION) {
      rate = Config.GENTLE_SHRINK_RATE;
    } else {
      rate = Config.MODERATE_SHRINK_RATE;
    }

    GameState.wallShrink += rate;

    if (GameState.wallShrink > Config.MAX_SHRINK) {
      GameState.wallShrink = Config.MAX_SHRINK;
    }
  },

  /**
   * Update visual effects
   */
  updateEffects() {
    if (GameState.shakeAmount > 0) {
      GameState.shakeAmount--;
    }
    if (GameState.flashTimer > 0) {
      GameState.flashTimer--;
    }

    // Update particles
    Particles.update();
  },

  /**
   * Handle game over
   */
  gameOver() {
    Audio.stopMusic();
    Audio.play('die');
    Audio.play('gameover');
    GameState.status = 'gameover';
    GameState.shakeAmount = 5;

    const head = Worm.getHead();
    if (head) {
      Particles.spawn(head.x, head.y, 20);
    }

    setTimeout(() => UI.showGameOver(), 500);
  },

  /**
   * Main game loop - uses fixed timestep for 30fps updates
   */
  loop(currentTime) {
    const elapsed = currentTime - GameState.lastFrameTime;
    GameState.lastFrameTime = currentTime;

    // Accumulate time
    GameState.accumulator += elapsed;

    // Run fixed updates at 30fps
    while (GameState.accumulator >= Config.FRAME_TIME) {
      this.fixedUpdate();
      GameState.accumulator -= Config.FRAME_TIME;
    }

    // Always render
    Renderer.draw();
    Input.updateCrankVisual();
    UI.applyScreenShake();

    requestAnimationFrame(this.loop.bind(this));
  }
};

// Start game when DOM is ready
document.addEventListener('DOMContentLoaded', () => Game.init());
