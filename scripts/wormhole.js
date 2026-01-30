/**
 * Wormhole Management - Single exit that orbits perimeter
 */
const Wormhole = {
  /**
   * Update wormhole position along perimeter
   */
  update() {
    GameState.wormhole.pos = (GameState.wormhole.pos + GameState.wormholeSpeed * GameState.wormhole.dir) % GameState.perimeterLength;
    if (GameState.wormhole.pos < 0) {
      GameState.wormhole.pos += GameState.perimeterLength;
    }
  },

  /**
   * Update wormhole timer (level 6+ only)
   */
  updateTimer() {
    if (!GameState.buttonRequired) return;

    if (GameState.wormholeOpen && GameState.wormholeTimer > 0) {
      GameState.wormholeTimer--;

      // Warning sounds
      if (GameState.wormholeTimer === 60 || GameState.wormholeTimer === 30) {
        Audio.play('tick');
      }

      if (GameState.wormholeTimer <= 0) {
        GameState.wormholeOpen = false;
        GameState.button.pressed = false;
        Audio.play('close');
        GameState.shakeAmount = 4;
      }
    }
  },

  /**
   * Convert perimeter position to x,y coordinates
   * @param {boolean} useShrunk - Whether to use shrunk bounds
   */
  getPosition(useShrunk = true) {
    let bounds, pWidth, pHeight;

    if (useShrunk) {
      bounds = GameState.getCurrentBounds();
      pWidth = bounds.width;
      pHeight = bounds.height;
    } else {
      bounds = {
        left: Config.PLAY_LEFT,
        right: Config.PLAY_RIGHT,
        top: Config.PLAY_TOP,
        bottom: Config.PLAY_BOTTOM
      };
      pWidth = Config.PLAY_WIDTH;
      pHeight = Config.PLAY_HEIGHT;
    }

    const totalPerimeter = 2 * pWidth + 2 * pHeight;
    let pos = GameState.wormhole.pos % totalPerimeter;
    if (pos < 0) pos += totalPerimeter;

    let x, y, wall;

    if (pos < pWidth) {
      // Top edge
      x = bounds.left + pos;
      y = bounds.top;
      wall = 'top';
    } else if (pos < pWidth + pHeight) {
      // Right edge
      x = bounds.right;
      y = bounds.top + (pos - pWidth);
      wall = 'right';
    } else if (pos < pWidth + pHeight + pWidth) {
      // Bottom edge
      x = bounds.right - (pos - pWidth - pHeight);
      y = bounds.bottom;
      wall = 'bottom';
    } else {
      // Left edge
      x = bounds.left;
      y = bounds.bottom - (pos - pWidth - pHeight - pWidth);
      wall = 'left';
    }

    return { x, y, wall };
  },

  /**
   * Check if wormhole is blocked by an obstacle
   */
  isBlocked() {
    if (!GameState.wormholeOpen) return true;

    const pos = this.getPosition(true);
    const halfSize = Config.WORMHOLE_SIZE / 2;

    // Check multiple points along the wormhole opening
    for (let i = -1; i <= 1; i++) {
      let checkX, checkY;
      if (pos.wall === 'top' || pos.wall === 'bottom') {
        checkX = pos.x + i * halfSize * 0.8;
        checkY = pos.y + (pos.wall === 'top' ? 10 : -10);
      } else {
        checkX = pos.x + (pos.wall === 'left' ? 10 : -10);
        checkY = pos.y + i * halfSize * 0.8;
      }

      if (Obstacles.checkPointCollision(checkX, checkY)) {
        return true;
      }
    }

    return false;
  },

  /**
   * Check if a point is inside the wormhole entry zone
   */
  isInWormhole(x, y) {
    if (!GameState.wormholeOpen) return false;
    if (this.isBlocked()) return false;

    const bounds = GameState.getCurrentBounds();
    const pos = this.getPosition(true);
    const halfSize = Config.WORMHOLE_SIZE / 2;

    if (pos.wall === 'top' || pos.wall === 'bottom') {
      const inX = x >= pos.x - halfSize && x <= pos.x + halfSize;
      let inY;
      if (pos.wall === 'top') {
        inY = y <= bounds.top + 8;
      } else {
        inY = y >= bounds.bottom - 8;
      }
      return inX && inY;
    } else {
      const inY = y >= pos.y - halfSize && y <= pos.y + halfSize;
      let inX;
      if (pos.wall === 'left') {
        inX = x <= bounds.left + 8;
      } else {
        inX = x >= bounds.right - 8;
      }
      return inX && inY;
    }
  }
};
