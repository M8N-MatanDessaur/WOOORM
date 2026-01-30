/**
 * Hunters Management - Matching original AI
 */
const Hunters = {
  /**
   * Check if position is too close to other hunters
   */
  isTooCloseToOthers(x, y, excludeIndex) {
    for (let i = 0; i < GameState.hunters.length; i++) {
      if (i !== excludeIndex) {
        const h = GameState.hunters[i];
        const dx = x - h.x;
        const dy = y - h.y;
        if (Math.sqrt(dx*dx + dy*dy) < Config.HUNTER_MIN_DISTANCE) {
          return true;
        }
      }
    }
    return false;
  },

  /**
   * Spawn a new hunter at a random edge position
   */
  spawnHunter() {
    const attempts = 20;
    for (let i = 0; i < attempts; i++) {
      let x, y;
      const side = Math.floor(Math.random() * 4);

      if (side === 0) {  // top
        x = Config.PLAY_LEFT + Math.random() * Config.PLAY_WIDTH;
        y = Config.PLAY_TOP + 20;
      } else if (side === 1) {  // bottom
        x = Config.PLAY_LEFT + Math.random() * Config.PLAY_WIDTH;
        y = Config.PLAY_BOTTOM - 20;
      } else if (side === 2) {  // left
        x = Config.PLAY_LEFT + 20;
        y = Config.PLAY_TOP + Math.random() * Config.PLAY_HEIGHT;
      } else {  // right
        x = Config.PLAY_RIGHT - 20;
        y = Config.PLAY_TOP + Math.random() * Config.PLAY_HEIGHT;
      }

      if (!this.isTooCloseToOthers(x, y, -1)) {
        GameState.hunters.push({
          x: x,
          y: y,
          angle: 0,
          trail: [],
          active: true,
          spawnTimer: 0
        });
        Audio.play('hunter');
        return;
      }
    }
  },

  /**
   * Update all hunters
   */
  update() {
    if (GameState.maxHunters === 0) return;
    if (GameState.worm.length === 0) return;

    const head = GameState.worm[0];

    // Increment level timer
    GameState.levelTimer++;

    // Check if we need to spawn hunters based on time thresholds
    if (GameState.hunters.length < GameState.maxHunters) {
      const nextHunterIndex = GameState.hunters.length;
      const spawnTime = Config.HUNTER_SPAWN_TIMES[nextHunterIndex];

      let shouldSpawn = false;
      if (spawnTime && GameState.levelTimer >= spawnTime) {
        shouldSpawn = true;
      } else if (GameState.hunterRespawnTime > 0 && GameState.levelTimer >= GameState.hunterRespawnTime) {
        shouldSpawn = true;
        GameState.hunterRespawnTime = 0;
      }

      if (shouldSpawn) {
        this.spawnHunter();
      }
    }

    // Update each active hunter
    for (let i = GameState.hunters.length - 1; i >= 0; i--) {
      const hunter = GameState.hunters[i];

      // Calculate angle to player
      const dx = head.x - hunter.x;
      const dy = head.y - hunter.y;
      const targetAngle = Math.atan2(dy, dx);

      // Smoothly turn towards player
      let angleDiff = targetAngle - hunter.angle;
      while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
      while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
      hunter.angle += angleDiff * Config.HUNTER_TURN_RATE;

      // Store previous position for trail
      hunter.trail.unshift({ x: hunter.x, y: hunter.y });
      while (hunter.trail.length > Config.HUNTER_TRAIL_LENGTH) {
        hunter.trail.pop();
      }

      // Calculate new position
      let newX = hunter.x + Math.cos(hunter.angle) * Config.HUNTER_SPEED;
      let newY = hunter.y + Math.sin(hunter.angle) * Config.HUNTER_SPEED;

      // Separation from other hunters
      for (let j = 0; j < GameState.hunters.length; j++) {
        if (i !== j) {
          const other = GameState.hunters[j];
          const sepDx = newX - other.x;
          const sepDy = newY - other.y;
          const sepDist = Math.sqrt(sepDx*sepDx + sepDy*sepDy);
          if (sepDist < Config.HUNTER_MIN_DISTANCE && sepDist > 0) {
            const pushStrength = (Config.HUNTER_MIN_DISTANCE - sepDist) * 0.1;
            newX += (sepDx / sepDist) * pushStrength;
            newY += (sepDy / sepDist) * pushStrength;
          }
        }
      }

      // Keep hunter inside play area
      hunter.x = Math.max(Config.PLAY_LEFT + 5, Math.min(Config.PLAY_RIGHT - 5, newX));
      hunter.y = Math.max(Config.PLAY_TOP + 5, Math.min(Config.PLAY_BOTTOM - 5, newY));

      // Check collision with player's HEAD
      const distDx = head.x - hunter.x;
      const distDy = head.y - hunter.y;
      const distToHead = Math.sqrt(distDx * distDx + distDy * distDy);

      if (distToHead < 10) {
        // Hit the head! Lose 5 dots eaten
        if (GameState.dotsEaten >= 5) {
          GameState.dotsEaten -= 5;
          GameState.hunterPenaltyTimer = 60;

          // Un-reach minimum if we drop below
          if (GameState.minimumReached && GameState.dotsEaten < GameState.dotsRequired) {
            GameState.minimumReached = false;
            GameState.wormholeOpen = false;
            GameState.button.visible = false;
            GameState.button.pressed = false;
          }

          // Shrink the worm
          Worm.shrink(15);

          // Reset combo
          GameState.combo = 0;
          GameState.comboTimer = 0;

          // Feedback
          GameState.shakeAmount = 10;
          GameState.flashTimer = 6;
          Particles.spawn(head.x, head.y, 15);
          Audio.play('hunter');

          // Remove this hunter and set respawn timer
          GameState.hunters.splice(i, 1);
          GameState.hunterRespawnTime = GameState.levelTimer + Config.HUNTER_RESPAWN_DELAY;
        } else {
          // Not enough dots - game over
          Game.gameOver();
          return;
        }
      }
    }
  }
};
