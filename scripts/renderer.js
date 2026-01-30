/**
 * Canvas Renderer
 */
const Renderer = {
  canvas: null,
  ctx: null,
  keyImage: null,
  hunterImage: null,

  /**
   * Initialize renderer with canvas
   */
  init() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    // Load images
    this.keyImage = new Image();
    this.keyImage.src = 'assets/key.png';

    this.hunterImage = new Image();
    this.hunterImage.src = 'assets/hunter-head.png';
  },

  /**
   * Draw the game
   */
  draw() {
    const { ctx } = this;

    // Clear
    ctx.fillStyle = Theme.getBG();
    ctx.fillRect(0, 0, Config.CANVAS_W, Config.CANVAS_H);

    // Draw play area border
    this.drawPlayArea();

    // Draw obstacles
    this.drawObstacles();

    // Draw wormhole
    this.drawWormhole();

    // Draw button
    this.drawButton();

    // Draw dots
    this.drawDots();

    // Draw hunters
    this.drawHunters();

    // Draw worm
    this.drawWorm();

    // Draw particles
    this.drawParticles();

    // Draw HUD
    this.drawHUD();
  },

  /**
   * Draw play area border
   */
  drawPlayArea() {
    const { ctx } = this;
    const shrink = GameState.wallShrink;

    const left = Config.PLAY_LEFT + shrink;
    const right = Config.PLAY_RIGHT - shrink;
    const top = Config.PLAY_TOP + shrink;
    const bottom = Config.PLAY_BOTTOM - shrink;

    ctx.strokeStyle = Theme.getINK();
    ctx.lineWidth = 2;

    // Draw border (but leave gap for wormhole if open)
    if (GameState.wormholeOpen && !Wormhole.isBlocked()) {
      const pos = Wormhole.getPosition();
      const halfSize = Config.WORMHOLE_SIZE / 2;

      ctx.beginPath();

      // Top edge
      if (pos.wall === 'top') {
        ctx.moveTo(left, top);
        ctx.lineTo(pos.x - halfSize, top);
        ctx.moveTo(pos.x + halfSize, top);
        ctx.lineTo(right, top);
      } else {
        ctx.moveTo(left, top);
        ctx.lineTo(right, top);
      }

      // Right edge
      if (pos.wall === 'right') {
        ctx.moveTo(right, top);
        ctx.lineTo(right, pos.y - halfSize);
        ctx.moveTo(right, pos.y + halfSize);
        ctx.lineTo(right, bottom);
      } else {
        ctx.moveTo(right, top);
        ctx.lineTo(right, bottom);
      }

      // Bottom edge
      if (pos.wall === 'bottom') {
        ctx.moveTo(right, bottom);
        ctx.lineTo(pos.x + halfSize, bottom);
        ctx.moveTo(pos.x - halfSize, bottom);
        ctx.lineTo(left, bottom);
      } else {
        ctx.moveTo(right, bottom);
        ctx.lineTo(left, bottom);
      }

      // Left edge
      if (pos.wall === 'left') {
        ctx.moveTo(left, bottom);
        ctx.lineTo(left, pos.y + halfSize);
        ctx.moveTo(left, pos.y - halfSize);
        ctx.lineTo(left, top);
      } else {
        ctx.moveTo(left, bottom);
        ctx.lineTo(left, top);
      }

      ctx.stroke();
    } else {
      ctx.strokeRect(left, top, right - left, bottom - top);
    }

    // Draw shrink progress bar (bottom right)
    if (GameState.shrinkActive) {
      const barWidth = 80;
      const barHeight = 6;
      const barX = right - barWidth - 5;
      const barY = bottom + 5;

      const remaining = 1 - (GameState.wallShrink / Config.MAX_WALL_SHRINK);
      const shouldBlink = remaining < 0.25 && GameState.frameCount % 8 < 4;

      ctx.fillStyle = Theme.getFAINT();
      ctx.fillRect(barX, barY, barWidth, barHeight);

      if (!shouldBlink) {
        ctx.fillStyle = Theme.getINK();
        ctx.fillRect(barX, barY, barWidth * remaining, barHeight);
      }
    }
  },

  /**
   * Draw obstacles
   */
  drawObstacles() {
    const { ctx } = this;

    ctx.fillStyle = Theme.getINK();

    for (const obs of GameState.obstacles) {
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
    }
  },

  /**
   * Draw wormhole indicator - just a gap in the wall (handled by drawPlayArea)
   */
  drawWormhole() {
    // The wormhole is simply a gap in the wall border
    // The gap is drawn in drawPlayArea() when wormholeOpen is true
    // No additional graphics needed - it's just an exit opening
  },

  /**
   * Draw button/key
   */
  drawButton() {
    if (!GameState.button || !GameState.button.visible || GameState.button.pressed) return;

    const { ctx } = this;
    const { x, y } = GameState.button;
    const keySize = 28;  // Bigger key

    // Try to use image, fallback to square
    if (this.keyImage.complete && this.keyImage.naturalWidth > 0) {
      ctx.save();
      // Invert colors in dark mode
      if (GameState.isDark) {
        ctx.filter = 'invert(1)';
      }
      ctx.drawImage(this.keyImage, x - keySize/2, y - keySize/2, keySize, keySize);
      ctx.filter = 'none';
      ctx.restore();
    } else {
      ctx.strokeStyle = Theme.getINK();
      ctx.lineWidth = 2;
      ctx.strokeRect(x - keySize/2, y - keySize/2, keySize, keySize);
    }
  },

  /**
   * Draw dots
   */
  drawDots() {
    const { ctx } = this;

    // Regular dots (filled)
    ctx.fillStyle = Theme.getINK();
    for (const dot of GameState.dots) {
      // Blink fast when about to reposition (last 1 second = 30 frames)
      if (dot.timer !== undefined && dot.timer <= 30) {
        if (GameState.frameCount % 4 >= 2) continue;  // Fast blink
      }

      ctx.beginPath();
      ctx.arc(dot.x, dot.y, Config.DOT_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    }

    // Poison dots (outlined)
    ctx.strokeStyle = Theme.getINK();
    ctx.lineWidth = 2;
    for (const dot of GameState.poisonDots) {
      // Blink fast when about to reposition (last 1 second = 30 frames)
      if (dot.timer !== undefined && dot.timer <= 30) {
        if (GameState.frameCount % 4 >= 2) continue;  // Fast blink
      }

      ctx.beginPath();
      ctx.arc(dot.x, dot.y, Config.DOT_RADIUS, 0, Math.PI * 2);
      ctx.stroke();
    }
  },

  /**
   * Draw hunters
   */
  drawHunters() {
    const { ctx } = this;
    const hunterSize = 12;  // Larger hunter head

    for (const hunter of GameState.hunters) {
      if (!hunter.active) continue;

      // Draw trail (thicker)
      ctx.strokeStyle = Theme.getINK();
      for (let i = 1; i < hunter.trail.length; i++) {
        const thickness = Math.max(1, (1 - i / hunter.trail.length) * 5);
        ctx.lineWidth = thickness;
        ctx.beginPath();
        ctx.moveTo(hunter.trail[i - 1].x, hunter.trail[i - 1].y);
        ctx.lineTo(hunter.trail[i].x, hunter.trail[i].y);
        ctx.stroke();
      }

      // Draw head (rotated image with color inversion for dark mode)
      if (this.hunterImage.complete && this.hunterImage.naturalWidth > 0) {
        ctx.save();
        ctx.translate(hunter.x, hunter.y);
        ctx.rotate(hunter.angle);

        // Invert colors in dark mode
        if (GameState.isDark) {
          ctx.filter = 'invert(1)';
        }

        ctx.drawImage(this.hunterImage, -hunterSize, -hunterSize, hunterSize * 2, hunterSize * 2);
        ctx.filter = 'none';
        ctx.restore();
      } else {
        // Fallback to circle
        ctx.fillStyle = Theme.getINK();
        ctx.beginPath();
        ctx.arc(hunter.x, hunter.y, hunterSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  },

  /**
   * Draw worm
   */
  drawWorm() {
    const { ctx } = this;
    const worm = GameState.worm;

    if (worm.length < 2) return;

    ctx.strokeStyle = Theme.getINK();
    ctx.fillStyle = Theme.getINK();

    // Draw body segments with tapering thickness
    for (let i = 1; i < worm.length; i++) {
      const thickness = 1 + (1 - i / worm.length) * 3;
      ctx.lineWidth = thickness;
      ctx.beginPath();
      ctx.moveTo(worm[i - 1].x, worm[i - 1].y);
      ctx.lineTo(worm[i].x, worm[i].y);
      ctx.stroke();
    }

    // Draw head
    const head = worm[0];
    ctx.beginPath();
    ctx.arc(head.x, head.y, Config.WORM_HEAD_SIZE, 0, Math.PI * 2);
    ctx.fill();
  },

  /**
   * Draw particles
   */
  drawParticles() {
    Particles.draw(this.ctx);
  },

  /**
   * Draw HUD elements
   */
  drawHUD() {
    const { ctx } = this;

    // Draw penalty indicator
    if (GameState.penaltyTimer > 0) {
      GameState.penaltyTimer--;

      const blink = GameState.penaltyTimer % 8 < 4;
      if (blink) {
        ctx.fillStyle = Theme.getINK();
        ctx.font = 'bold 14px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(GameState.penaltyAmount.toString(), Config.PLAY_LEFT + 50, Config.PLAY_BOTTOM + 18);
      }
    }

    // Draw wormhole timer (level 6+)
    if (GameState.buttonRequired && GameState.wormholeOpen && GameState.wormholeTimer > 0) {
      const seconds = Math.ceil(GameState.wormholeTimer / 30);
      const blink = GameState.wormholeTimer < 60 && GameState.frameCount % 8 < 4;

      if (!blink) {
        ctx.fillStyle = Theme.getINK();
        ctx.font = 'bold 16px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(seconds.toString(), (Config.PLAY_LEFT + Config.PLAY_RIGHT) / 2, Config.PLAY_TOP - 5);
      }
    }

  }
};
