/**
 * Obstacles Management - Matching original generation
 */
const Obstacles = {
  // Obstacle size presets (matching original exactly)
  SIZES: [
    // Small obstacles
    { w: 25, h: 25, r: 10 },
    { w: 35, h: 25, r: 10 },
    { w: 25, h: 35, r: 10 },
    { w: 40, h: 40, r: 14 },
    // Medium obstacles
    { w: 55, h: 35, r: 14 },
    { w: 35, h: 55, r: 14 },
    { w: 50, h: 50, r: 16 },
    { w: 65, h: 40, r: 16 },
    // Large obstacles
    { w: 80, h: 50, r: 20 },
    { w: 50, h: 80, r: 20 },
    { w: 90, h: 45, r: 18 },
    { w: 45, h: 90, r: 18 },
    { w: 70, h: 70, r: 22 },
    // Extra large
    { w: 110, h: 50, r: 20 },
    { w: 50, h: 100, r: 20 },
    { w: 100, h: 60, r: 22 },
    { w: 60, h: 100, r: 22 }
  ],

  /**
   * Check if two obstacles overlap
   */
  obstaclesOverlap(obs1, obs2, minDistance = 20) {
    const margin = minDistance;
    const x1 = obs1.x - margin;
    const y1 = obs1.y - margin;
    const w1 = obs1.w + margin * 2;
    const h1 = obs1.h + margin * 2;

    return !(x1 + w1 < obs2.x ||
             obs2.x + obs2.w < x1 ||
             y1 + h1 < obs2.y ||
             obs2.y + obs2.h < y1);
  },

  /**
   * Generate obstacles for a level
   */
  generate(lvl) {
    GameState.obstacles = [];

    // No obstacles for levels 1-2
    if (lvl < 3) return;

    // Number of obstacles based on level
    let numObstacles;
    if (lvl < 5) {
      numObstacles = 3 + Math.floor(Math.random() * 2);
    } else if (lvl < 8) {
      numObstacles = 5 + Math.floor(Math.random() * 2);
    } else if (lvl < 12) {
      numObstacles = 6 + Math.floor(Math.random() * 3);
    } else if (lvl < 16) {
      numObstacles = 7 + Math.floor(Math.random() * 3);
    } else {
      numObstacles = 8 + Math.floor(Math.random() * 3);
    }

    const wallMargin = 8;
    const minObstacleSpacing = 15;

    const areaLeft = Config.PLAY_LEFT + wallMargin;
    const areaTop = Config.PLAY_TOP + wallMargin;
    const areaRight = Config.PLAY_RIGHT - wallMargin;
    const areaBottom = Config.PLAY_BOTTOM - wallMargin;

    // Center spawn area to avoid
    const centerX = Config.PLAY_LEFT + Config.PLAY_WIDTH / 2;
    const centerY = Config.PLAY_TOP + Config.PLAY_HEIGHT / 2;
    const spawnClearRadius = 45;

    let placed = 0;
    let attempts = 0;
    const maxAttempts = 250;

    while (placed < numObstacles && attempts < maxAttempts) {
      attempts++;

      // Pick size based on level
      let sizeIdx;
      const largeBias = Math.min(0.5, lvl * 0.03);
      const roll = Math.random();
      if (roll < 0.3 - largeBias) {
        sizeIdx = Math.floor(Math.random() * 4);  // Small (0-3)
      } else if (roll < 0.6 - largeBias) {
        sizeIdx = 4 + Math.floor(Math.random() * 4);  // Medium (4-7)
      } else if (roll < 0.85) {
        sizeIdx = 8 + Math.floor(Math.random() * 5);  // Large (8-12)
      } else {
        sizeIdx = 13 + Math.floor(Math.random() * 4);  // Extra large (13-16)
      }
      const size = this.SIZES[sizeIdx];

      const maxX = areaRight - areaLeft - size.w;
      const maxY = areaBottom - areaTop - size.h;

      if (maxX > 0 && maxY > 0) {
        const x = areaLeft + Math.random() * maxX;
        const y = areaTop + Math.random() * maxY;

        const newObs = { x, y, w: size.w, h: size.h, r: size.r };

        // Check overlap with existing obstacles
        let valid = true;
        for (const existingObs of GameState.obstacles) {
          if (this.obstaclesOverlap(newObs, existingObs, minObstacleSpacing)) {
            valid = false;
            break;
          }
        }

        // Check not blocking center spawn area
        if (valid) {
          const obsCenterX = x + size.w / 2;
          const obsCenterY = y + size.h / 2;
          const dx = obsCenterX - centerX;
          const dy = obsCenterY - centerY;
          if (Math.sqrt(dx*dx + dy*dy) < spawnClearRadius + Math.max(size.w, size.h) / 2) {
            valid = false;
          }
        }

        if (valid) {
          GameState.obstacles.push(newObs);
          placed++;
        }
      }
    }
  },

  /**
   * Generate button for level 6+
   */
  generateButton(lvl) {
    if (lvl < 6) {
      GameState.buttonRequired = false;
      GameState.button.visible = false;
      return;
    }

    GameState.buttonRequired = true;
    GameState.button.pressed = false;
    GameState.button.visible = false;  // Hidden until minimum dots reached

    const margin = 40;
    const attempts = 20;

    for (let i = 0; i < attempts; i++) {
      const x = Config.PLAY_LEFT + margin + Math.random() * (Config.PLAY_WIDTH - margin * 2 - Config.BUTTON_SIZE);
      const y = Config.PLAY_TOP + margin + Math.random() * (Config.PLAY_HEIGHT - margin * 2 - Config.BUTTON_SIZE);

      // Check not inside obstacles
      let clear = true;
      for (const obs of GameState.obstacles) {
        if (x + Config.BUTTON_SIZE > obs.x && x < obs.x + obs.w &&
            y + Config.BUTTON_SIZE > obs.y && y < obs.y + obs.h) {
          clear = false;
          break;
        }
      }

      if (clear) {
        GameState.button.x = x;
        GameState.button.y = y;
        return;
      }
    }

    // Fallback position
    GameState.button.x = Config.PLAY_LEFT + Config.PLAY_WIDTH / 2;
    GameState.button.y = Config.PLAY_TOP + Config.PLAY_HEIGHT / 2;
  },

  /**
   * Check if a point collides with any obstacle
   */
  checkPointCollision(x, y) {
    for (const obs of GameState.obstacles) {
      if (x >= obs.x && x <= obs.x + obs.w && y >= obs.y && y <= obs.y + obs.h) {
        return true;
      }
    }
    return false;
  }
};
