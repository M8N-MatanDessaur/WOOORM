/**
 * Worm Management - matching original Playdate logic exactly
 */
const Worm = {
  /**
   * Get difficulty factor (0 to ~1) based on level
   * Uses exponential curve: 1 - exp(-level / 20)
   */
  getDifficultyFactor(lvl) {
    return 1 - Math.exp(-lvl / 20);
  },

  /**
   * Get worm speed for current level
   */
  getWormSpeed(lvl) {
    const baseSpeed = 1.5;      // Slower start
    const maxIncrease = 2.0;    // Max increase
    return baseSpeed + maxIncrease * this.getDifficultyFactor(lvl);
  },

  /**
   * Get wormhole orbit speed for current level
   */
  getWormholeSpeed(lvl) {
    const effectiveLvl = Math.floor(lvl / 2);
    const baseSpeed = 0.25;
    const maxIncrease = 1.0;
    return baseSpeed + maxIncrease * this.getDifficultyFactor(effectiveLvl);
  },

  /**
   * Get required dots to open wormhole
   * Level 1: 5, Level 2: 7, Level 3: 9, etc.
   */
  getRequiredDots(lvl) {
    return 3 + lvl * 2;
  },

  /**
   * Get max regular dots for level
   */
  getMaxDots(lvl) {
    if (lvl < 5) return 1;
    if (lvl < 10) return 3;
    return 5;
  },

  /**
   * Get max poison dots for level
   */
  getMaxPoisonDots(lvl) {
    if (lvl < 4) return 0;
    if (lvl < 7) return 1;
    if (lvl < 10) return 2;
    return 3;
  },

  /**
   * Get max hunters for level
   */
  getMaxHunters(lvl) {
    if (lvl < 5) return 0;
    if (lvl < 7) return 1;
    if (lvl < 10) return 2;
    return 3;
  },

  /**
   * Check if spawn area is clear for worm
   */
  isSpawnAreaClear(x, y, angle, length) {
    for (let i = 0; i <= length; i++) {
      const dist = i * Config.WORM_SEGMENT_DIST;
      const checkX = x - Math.cos(angle) * dist;
      const checkY = y - Math.sin(angle) * dist;

      // Check obstacle collision
      if (Obstacles.checkPointCollision(checkX, checkY)) {
        return false;
      }

      // Check wall collision
      if (checkX < Config.PLAY_LEFT + 10 || checkX > Config.PLAY_RIGHT - 10 ||
          checkY < Config.PLAY_TOP + 10 || checkY > Config.PLAY_BOTTOM - 10) {
        return false;
      }
    }
    return true;
  },

  /**
   * Find a clear spawn point for the worm
   */
  findClearSpawnPoint() {
    const centerX = Config.PLAY_LEFT + Config.PLAY_WIDTH / 2;
    const centerY = Config.PLAY_TOP + Config.PLAY_HEIGHT / 2;

    const angles = [0, Math.PI/2, Math.PI, -Math.PI/2, Math.PI/4, -Math.PI/4, 3*Math.PI/4, -3*Math.PI/4];

    // Try center first
    for (const angle of angles) {
      if (this.isSpawnAreaClear(centerX, centerY, angle, Config.MIN_WORM_LENGTH)) {
        return { x: centerX, y: centerY, angle };
      }
    }

    // Try other positions
    const offsets = [
      { dx: -60, dy: 0 }, { dx: 60, dy: 0 },
      { dx: 0, dy: -30 }, { dx: 0, dy: 30 },
      { dx: -50, dy: -25 }, { dx: 50, dy: 25 },
      { dx: -50, dy: 25 }, { dx: 50, dy: -25 }
    ];

    for (const off of offsets) {
      const x = centerX + off.dx;
      const y = centerY + off.dy;
      for (const angle of angles) {
        if (this.isSpawnAreaClear(x, y, angle, Config.MIN_WORM_LENGTH)) {
          return { x, y, angle };
        }
      }
    }

    // Fallback
    return { x: centerX, y: centerY, angle: 0 };
  },

  /**
   * Initialize worm at given position and angle
   */
  init(startX, startY, startAngle) {
    GameState.worm = [];
    GameState.wormAngle = startAngle;

    // Create initial segments
    for (let i = 0; i < Config.MIN_WORM_LENGTH; i++) {
      const dist = i * Config.WORM_SEGMENT_DIST;
      GameState.worm.push({
        x: startX - Math.cos(startAngle) * dist,
        y: startY - Math.sin(startAngle) * dist
      });
    }

    GameState.growCounter = 0;
  },

  /**
   * Update worm position (called once per game frame at 30fps)
   * Returns: null if ok, 'gameover' if collision
   */
  update() {
    if (GameState.worm.length === 0) return null;

    // Apply crank/keyboard input to angle
    // crankAngleChange is accumulated from input events
    GameState.wormAngle += GameState.crankAngleChange;
    GameState.crankAngleChange = 0;  // Reset after applying

    // D-pad controls (checked each frame) - also update crank visual
    if (GameState.keys['ArrowLeft']) {
      GameState.wormAngle -= Config.DPAD_TURN_SPEED;
      GameState.crankVisualAngle -= Config.DPAD_TURN_SPEED;
    }
    if (GameState.keys['ArrowRight']) {
      GameState.wormAngle += Config.DPAD_TURN_SPEED;
      GameState.crankVisualAngle += Config.DPAD_TURN_SPEED;
    }
    // Mobile arrow buttons - also update crank visual
    if (GameState.mobileLeftPressed) {
      GameState.wormAngle -= Config.DPAD_TURN_SPEED;
      GameState.crankVisualAngle -= Config.DPAD_TURN_SPEED;
    }
    if (GameState.mobileRightPressed) {
      GameState.wormAngle += Config.DPAD_TURN_SPEED;
      GameState.crankVisualAngle += Config.DPAD_TURN_SPEED;
    }

    // Calculate current speed (with grace period acceleration)
    let currentSpeed = GameState.wormSpeed;
    if (GameState.graceTimer > 0) {
      // Ease in from 30% speed to full speed (quadratic)
      const progress = 1 - (GameState.graceTimer / Config.GRACE_FRAMES);
      const easedProgress = progress * progress;
      currentSpeed = GameState.wormSpeed * (0.3 + 0.7 * easedProgress);
      GameState.graceTimer--;
    }

    // Boost with A button (spacebar on web) - 1.5x speed
    if (GameState.keys[' '] || GameState.keys['a'] || GameState.keys['A']) {
      currentSpeed = currentSpeed * Config.BOOST_MULTIPLIER;
    }

    const head = GameState.worm[0];
    const newX = head.x + Math.cos(GameState.wormAngle) * currentSpeed;
    const newY = head.y + Math.sin(GameState.wormAngle) * currentSpeed;

    // Check button press
    if (GameState.buttonRequired && GameState.button.visible && !GameState.button.pressed) {
      if (newX >= GameState.button.x && newX <= GameState.button.x + Config.BUTTON_SIZE &&
          newY >= GameState.button.y && newY <= GameState.button.y + Config.BUTTON_SIZE) {
        GameState.button.pressed = true;
        GameState.wormholeOpen = true;
        GameState.wormholeTimer = Config.WORMHOLE_OPEN_TIME;
        Audio.play('button');
        Particles.spawn(GameState.button.x + Config.BUTTON_SIZE/2, GameState.button.y + Config.BUTTON_SIZE/2, 10);
      }
    }

    // Check wormhole entry
    if (GameState.wormholeOpen && Wormhole.isInWormhole(newX, newY)) {
      return 'levelComplete';
    }

    // Check wall collision
    const bounds = GameState.getCurrentBounds();
    if (newX < bounds.left || newX > bounds.right || newY < bounds.top || newY > bounds.bottom) {
      // Check if in wormhole opening
      if (!Wormhole.isInWormhole(newX, newY)) {
        return 'gameover';
      }
    }

    // Check obstacle collision
    if (Obstacles.checkPointCollision(newX, newY)) {
      return 'gameover';
    }

    // Insert new head
    GameState.worm.unshift({ x: newX, y: newY });

    // Check self collision (only when worm >= 20 segments, checking from segment 16+)
    if (GameState.worm.length >= 20) {
      const headSeg = GameState.worm[0];
      const collisionRadius = Config.WORM_HEAD_SIZE * 0.8;

      for (let i = 16; i < GameState.worm.length; i++) {
        const seg = GameState.worm[i];
        const dx = headSeg.x - seg.x;
        const dy = headSeg.y - seg.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        if (dist < collisionRadius) {
          return 'gameover';
        }
      }
    }

    // Remove tail (unless growing)
    if (GameState.growCounter > 0) {
      GameState.growCounter--;
    } else {
      GameState.worm.pop();
    }

    return null;
  },

  /**
   * Get head position
   */
  getHead() {
    return GameState.worm[0] || null;
  },

  /**
   * Grow the worm
   */
  grow() {
    GameState.growCounter += Config.GROW_AMOUNT;
  },

  /**
   * Shrink the worm by removing segments
   */
  shrink(amount) {
    for (let i = 0; i < amount; i++) {
      if (GameState.worm.length > Config.MIN_WORM_LENGTH) {
        GameState.worm.pop();
      }
    }
  }
};
