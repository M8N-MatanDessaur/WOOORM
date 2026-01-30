/**
 * Particle System
 */
const Particles = {
  /**
   * Spawn particles at position
   */
  spawn(x, y, count) {
    for (let i = 0; i < count; i++) {
      GameState.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        life: 15 + Math.random() * 15,
        size: 2 + Math.random() * 2
      });
    }
  },

  /**
   * Update all particles
   */
  update() {
    for (let i = GameState.particles.length - 1; i >= 0; i--) {
      const p = GameState.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.95;
      p.vy *= 0.95;
      p.life--;

      if (p.life <= 0) {
        GameState.particles.splice(i, 1);
      }
    }
  },

  /**
   * Draw all particles
   */
  draw(ctx) {
    ctx.fillStyle = Theme.getINK();
    for (const p of GameState.particles) {
      const alpha = p.life / 30;
      ctx.globalAlpha = alpha;
      ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }
};
