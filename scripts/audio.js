/**
 * Audio System - Uses HTML5 Audio for better compatibility
 */
const Audio = {
  sounds: {},
  music: null,
  initialized: false,

  /**
   * Initialize and preload all sounds
   */
  init() {
    if (this.initialized) return;
    this.initialized = true;

    // Preload sound effects
    this.sounds.eat = this.createAudio('assets/chew.mp3', 0.5);
    this.sounds.start = this.createAudio('assets/startSound.mp3', 0.6);
    this.sounds.gameover = this.createAudio('assets/gameOver.mp3', 0.6);
    this.sounds.hunter = this.createAudio('assets/haunterLaugh.mp3', 0.6);

    // Music (separate for looping)
    this.music = this.createAudio('assets/track.mp3', 0.4);
    this.music.loop = true;

    console.log('Audio initialized');
  },

  /**
   * Create an audio element
   */
  createAudio(src, volume) {
    const audio = new window.Audio(src);
    audio.volume = volume;
    audio.preload = 'auto';
    return audio;
  },

  /**
   * Play a sound effect
   */
  play(type) {
    // Play from preloaded sounds
    if (this.sounds[type]) {
      try {
        // Clone for overlapping sounds
        const sound = this.sounds[type].cloneNode();
        sound.volume = this.sounds[type].volume;
        sound.play().catch(() => {});
      } catch (e) {
        console.warn(`Failed to play: ${type}`, e);
      }
      return;
    }

    // Fallback to Web Audio API for generated sounds
    this.playGenerated(type);
  },

  /**
   * Play generated sounds (fallback)
   */
  playGenerated(type) {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;

    switch(type) {
      case 'poison':
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);
        osc.type = 'sawtooth';
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
        break;

      case 'warp':
        [0, 0.05, 0.1].forEach((delay, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.frequency.setValueAtTime([150, 300, 600][i], now + delay);
          o.type = 'sawtooth';
          g.gain.setValueAtTime(0.15, now + delay);
          g.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.1);
          o.start(now + delay);
          o.stop(now + delay + 0.1);
        });
        break;

      case 'levelUp':
        [0, 0.08, 0.16].forEach((delay, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.frequency.setValueAtTime([523, 659, 784][i], now + delay);
          o.type = 'sine';
          g.gain.setValueAtTime(0.15, now + delay);
          g.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.15);
          o.start(now + delay);
          o.stop(now + delay + 0.15);
        });
        break;

      case 'button':
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.05);
        osc.type = 'square';
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
        break;

      case 'close':
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);
        osc.type = 'sawtooth';
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
        break;

      case 'tick':
        osc.frequency.setValueAtTime(600, now);
        osc.type = 'square';
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.02);
        osc.start(now);
        osc.stop(now + 0.02);
        break;

      case 'die':
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.3);
        osc.type = 'sawtooth';
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
    }
  },

  /**
   * Start background music (looping)
   */
  startMusic() {
    if (!this.music) return;
    try {
      this.music.currentTime = 0;
      this.music.play().catch(() => {});
      console.log('Music started');
    } catch (e) {
      console.warn('Failed to start music', e);
    }
  },

  /**
   * Stop background music
   */
  stopMusic() {
    if (this.music) {
      try {
        this.music.pause();
        this.music.currentTime = 0;
        console.log('Music stopped');
      } catch (e) {
        // Ignore
      }
    }
  }
};
