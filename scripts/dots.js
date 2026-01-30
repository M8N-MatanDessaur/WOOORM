/**
 * Dots and Poison Dots Management - Matching original logic
 */
const Dots = {
  maxDots: 1,
  maxPoisonDots: 0,

  /**
   * Initialize dots for current level
   */
  init(lvl) {
    GameState.dots = [];
    GameState.poisonDots = [];
    GameState.dotsEaten = 0;
    GameState.minimumReached = false;

    this.maxDots = Worm.getMaxDots(lvl);
    this.maxPoisonDots = Worm.getMaxPoisonDots(lvl);

    // Note: Dots will spawn during update()
  },

  /**
   * Check if position is clear for spawning
   */
  isPositionClear(x, y, radius) {
    // Check worm collision
    for (const seg of GameState.worm) {
      const dx = x - seg.x;
      const dy = y - seg.y;
      if (Math.sqrt(dx*dx + dy*dy) < radius + Config.WORM_HEAD_SIZE) {
        return false;
      }
    }

    // Check other dots
    for (const dot of GameState.dots) {
      const dx = x - dot.x;
      const dy = y - dot.y;
      if (Math.sqrt(dx*dx + dy*dy) < radius * 3) {
        return false;
      }
    }

    // Check obstacles
    if (Obstacles.checkPointCollision(x, y)) {
      return false;
    }

    // Check button area
    if (GameState.buttonRequired) {
      if (x >= GameState.button.x - 10 && x <= GameState.button.x + Config.BUTTON_SIZE + 10 &&
          y >= GameState.button.y - 10 && y <= GameState.button.y + Config.BUTTON_SIZE + 10) {
        return false;
      }
    }

    return true;
  },

  /**
   * Spawn a regular dot
   */
  spawnDot() {
    const margin = Config.DOT_WALL_MARGIN;
    const obstacleMargin = Config.DOT_OBSTACLE_MARGIN;
    const dotSpacing = Config.DOT_SPACING;
    const attempts = 80;

    for (let i = 0; i < attempts; i++) {
      const x = Config.PLAY_LEFT + margin + Math.random() * (Config.PLAY_WIDTH - margin * 2);
      const y = Config.PLAY_TOP + margin + Math.random() * (Config.PLAY_HEIGHT - margin * 2);

      if (this.isPositionClear(x, y, 15)) {
        let tooClose = false;

        // Check obstacle proximity
        for (const obs of GameState.obstacles) {
          if (x > obs.x - obstacleMargin && x < obs.x + obs.w + obstacleMargin &&
              y > obs.y - obstacleMargin && y < obs.y + obs.h + obstacleMargin) {
            tooClose = true;
            break;
          }
        }

        // Check distance from other regular dots
        if (!tooClose) {
          for (const d of GameState.dots) {
            const dx = x - d.x;
            const dy = y - d.y;
            if (Math.sqrt(dx*dx + dy*dy) < dotSpacing) {
              tooClose = true;
              break;
            }
          }
        }

        // Check distance from poison dots
        if (!tooClose) {
          for (const p of GameState.poisonDots) {
            const dx = x - p.x;
            const dy = y - p.y;
            if (Math.sqrt(dx*dx + dy*dy) < dotSpacing) {
              tooClose = true;
              break;
            }
          }
        }

        if (!tooClose) {
          GameState.dots.push({ x, y, timer: Config.DOT_REPOSITION_TIME });
          return true;
        }
      }
    }
    return false;
  },

  /**
   * Spawn a poison dot
   */
  spawnPoisonDot() {
    const margin = Config.DOT_WALL_MARGIN;
    const obstacleMargin = Config.DOT_OBSTACLE_MARGIN;
    const dotSpacing = Config.DOT_SPACING;
    const attempts = 80;

    for (let i = 0; i < attempts; i++) {
      const x = Config.PLAY_LEFT + margin + Math.random() * (Config.PLAY_WIDTH - margin * 2);
      const y = Config.PLAY_TOP + margin + Math.random() * (Config.PLAY_HEIGHT - margin * 2);

      if (this.isPositionClear(x, y, 15)) {
        let tooClose = false;

        // Check obstacle proximity
        for (const obs of GameState.obstacles) {
          if (x > obs.x - obstacleMargin && x < obs.x + obs.w + obstacleMargin &&
              y > obs.y - obstacleMargin && y < obs.y + obs.h + obstacleMargin) {
            tooClose = true;
            break;
          }
        }

        // Check distance from regular dots
        if (!tooClose) {
          for (const d of GameState.dots) {
            const dx = x - d.x;
            const dy = y - d.y;
            if (Math.sqrt(dx*dx + dy*dy) < dotSpacing) {
              tooClose = true;
              break;
            }
          }
        }

        // Check distance from other poison dots
        if (!tooClose) {
          for (const p of GameState.poisonDots) {
            const dx = x - p.x;
            const dy = y - p.y;
            if (Math.sqrt(dx*dx + dy*dy) < dotSpacing) {
              tooClose = true;
              break;
            }
          }
        }

        if (!tooClose) {
          GameState.poisonDots.push({ x, y, timer: Config.DOT_REPOSITION_TIME });
          return true;
        }
      }
    }
    return false;
  },

  /**
   * Reposition a dot
   */
  repositionDot(dot) {
    const margin = Config.DOT_WALL_MARGIN;
    const obstacleMargin = Config.DOT_OBSTACLE_MARGIN;
    const dotSpacing = Config.DOT_SPACING;
    const attempts = 80;

    for (let i = 0; i < attempts; i++) {
      const x = Config.PLAY_LEFT + margin + Math.random() * (Config.PLAY_WIDTH - margin * 2);
      const y = Config.PLAY_TOP + margin + Math.random() * (Config.PLAY_HEIGHT - margin * 2);

      if (this.isPositionClear(x, y, 15)) {
        let tooClose = false;

        for (const obs of GameState.obstacles) {
          if (x > obs.x - obstacleMargin && x < obs.x + obs.w + obstacleMargin &&
              y > obs.y - obstacleMargin && y < obs.y + obs.h + obstacleMargin) {
            tooClose = true;
            break;
          }
        }

        if (!tooClose) {
          for (const d of GameState.dots) {
            if (d !== dot) {
              const dx = x - d.x;
              const dy = y - d.y;
              if (Math.sqrt(dx*dx + dy*dy) < dotSpacing) {
                tooClose = true;
                break;
              }
            }
          }
        }

        if (!tooClose) {
          for (const p of GameState.poisonDots) {
            const dx = x - p.x;
            const dy = y - p.y;
            if (Math.sqrt(dx*dx + dy*dy) < dotSpacing) {
              tooClose = true;
              break;
            }
          }
        }

        if (!tooClose) {
          dot.x = x;
          dot.y = y;
          dot.timer = Config.DOT_REPOSITION_TIME;
          return;
        }
      }
    }
  },

  /**
   * Update regular dots (spawn new ones, handle repositioning)
   */
  update() {
    // Spawn new dots if needed
    let spawnAttempts = 0;
    while (GameState.dots.length < this.maxDots && spawnAttempts < 5) {
      if (!this.spawnDot()) {
        spawnAttempts++;
      }
    }

    // Update dot timers
    for (const dot of GameState.dots) {
      if (dot.timer !== undefined) {
        dot.timer--;
        if (dot.timer <= 0) {
          this.repositionDot(dot);
        }
      }
    }
  },

  /**
   * Update poison dots
   */
  updatePoison() {
    // Spawn poison dots if needed
    let spawnAttempts = 0;
    while (GameState.poisonDots.length < this.maxPoisonDots && spawnAttempts < 5) {
      if (!this.spawnPoisonDot()) {
        spawnAttempts++;
      }
    }

    // Update timers
    for (const dot of GameState.poisonDots) {
      if (dot.timer !== undefined) {
        dot.timer--;
        if (dot.timer <= 0) {
          this.repositionDot(dot);
        }
      }
    }
  },

  /**
   * Check collision with dots (called from game update)
   */
  checkCollision() {
    const head = Worm.getHead();
    if (!head) return;

    const newX = head.x;
    const newY = head.y;

    // Check regular dots
    for (let i = GameState.dots.length - 1; i >= 0; i--) {
      const dot = GameState.dots[i];
      const dx = newX - dot.x;
      const dy = newY - dot.y;
      const dist = Math.sqrt(dx*dx + dy*dy);

      if (dist < Config.WORM_HEAD_SIZE + 5) {
        // Eat the dot
        GameState.dots.splice(i, 1);
        Worm.grow();
        GameState.dotsEaten++;

        // Combo system
        GameState.combo++;
        GameState.comboTimer = Config.COMBO_WINDOW;
        const multiplier = this.getComboMultiplier();
        const comboBonus = Math.floor(10 * multiplier);
        GameState.score += comboBonus;
        GameState.lastComboScore = comboBonus;

        Audio.play('eat');
        Particles.spawn(dot.x, dot.y, 8);

        // Extra particles at combo milestones
        if (GameState.combo === 10) {
          Particles.spawn(dot.x, dot.y, 15);
          GameState.shakeAmount = 6;
          GameState.flashTimer = 4;
        } else if (GameState.combo === 20) {
          Particles.spawn(dot.x, dot.y, 25);
          GameState.shakeAmount = 10;
          GameState.flashTimer = 6;
        }

        // Check if minimum reached
        if (!GameState.minimumReached && GameState.dotsEaten >= GameState.dotsRequired) {
          GameState.minimumReached = true;
          GameState.shakeAmount = 6;
          GameState.flashTimer = 8;

          // Start wall shrinking
          GameState.shrinkActive = true;
          GameState.shrinkTimer = 0;

          if (GameState.buttonRequired) {
            // Level 6+: Show the key
            GameState.button.visible = true;
            Audio.play('button');
          } else {
            // Level 1-5: Wormhole opens automatically
            GameState.wormholeOpen = true;
            Audio.play('levelUp');
          }
        }
      }
    }

    // Check poison dots
    for (let i = GameState.poisonDots.length - 1; i >= 0; i--) {
      const dot = GameState.poisonDots[i];
      const dx = newX - dot.x;
      const dy = newY - dot.y;
      const dist = Math.sqrt(dx*dx + dy*dy);

      if (dist < Config.WORM_HEAD_SIZE + 5) {
        GameState.poisonDots.splice(i, 1);

        // Check if we have enough dots to survive
        if (GameState.dotsEaten < 2) {
          // Die - not enough dots
          Game.gameOver();
          return;
        }

        // Lose 2 dots eaten
        GameState.dotsEaten -= 2;
        GameState.poisonPenaltyTimer = 60;

        // Un-reach minimum if we drop below
        if (GameState.minimumReached && GameState.dotsEaten < GameState.dotsRequired) {
          GameState.minimumReached = false;
          GameState.wormholeOpen = false;
          GameState.button.visible = false;
          GameState.button.pressed = false;
        }

        // Shrink the worm
        Worm.shrink(10);

        // Reset combo
        GameState.combo = 0;
        GameState.comboTimer = 0;

        // Feedback
        GameState.shakeAmount = 8;
        GameState.flashTimer = 6;
        Particles.spawn(dot.x, dot.y, 15);
        Audio.play('poison');
      }
    }
  },

  /**
   * Get combo multiplier
   */
  getComboMultiplier() {
    if (GameState.combo <= 1) return 1;
    if (GameState.combo <= 3) return 1.5;
    if (GameState.combo <= 5) return 2;
    if (GameState.combo <= 10) return 3;
    return 4;
  },

  /**
   * Update combo timer
   */
  updateCombo() {
    if (GameState.comboTimer > 0) {
      GameState.comboTimer--;
      if (GameState.comboTimer <= 0) {
        GameState.combo = 0;
      }
    }
    // Smooth display
    GameState.comboDisplay += (GameState.combo - GameState.comboDisplay) * 0.2;
  }
};
