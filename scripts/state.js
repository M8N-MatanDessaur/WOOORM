/**
 * Game State Management
 */
const GameState = {
  // Game status
  status: 'start',  // 'start', 'playing', 'gameover'

  // Score and progress
  score: 0,
  level: 1,
  startingLevel: 1,
  highScore: 0,

  // Worm state
  worm: [],
  wormAngle: 0,
  wormSpeed: 2,
  growCounter: 0,
  graceTimer: 0,

  // Dots
  dots: [],
  poisonDots: [],
  dotsEaten: 0,
  dotsRequired: 5,
  minimumReached: false,

  // Wormhole (single exit that orbits perimeter)
  wormhole: { pos: 0, dir: 1 },
  wormholeSpeed: 0.3,
  wormholeOpen: false,
  wormholeTimer: 0,
  perimeterLength: 0,

  // Button/Key (level 6+)
  button: { x: 0, y: 0, pressed: false, visible: false },
  buttonRequired: false,

  // Hunters
  hunters: [],
  maxHunters: 0,
  levelTimer: 0,
  hunterRespawnTime: 0,
  hunterPenaltyTimer: 0,

  // Obstacles
  obstacles: [],

  // Wall shrinking
  wallShrink: 0,
  shrinkTimer: 0,
  shrinkActive: false,

  // Combo system
  combo: 0,
  comboTimer: 0,
  comboDisplay: 0,
  lastComboScore: 0,

  // Visual effects
  particles: [],
  shakeAmount: 0,
  flashTimer: 0,

  // Penalty display
  poisonPenaltyTimer: 0,

  // Timing - for fixed 30fps
  lastFrameTime: 0,
  accumulator: 0,
  frameCount: 0,

  // Input state
  keys: {},
  crankDragging: false,
  crankVisualAngle: -Math.PI / 2,  // Start pointing up (middle top)
  crankAngleChange: 0,  // Accumulated crank change this frame
  dragPrevX: 0,
  dragPrevY: 0,
  dragCenterX: 0,
  dragCenterY: 0,
  mobileLeftPressed: false,
  mobileRightPressed: false,

  // Theme
  isDark: false,

  /**
   * Initialize state from localStorage
   */
  init() {
    this.highScore = parseInt(localStorage.getItem('wooorm-highscore')) || 0;
    this.isDark = localStorage.getItem('wooorm-theme') === 'dark' ||
                  (localStorage.getItem('wooorm-theme') === null &&
                   window.matchMedia('(prefers-color-scheme: dark)').matches);
  },

  /**
   * Reset game state for new game
   */
  reset() {
    this.score = 0;
    this.level = this.startingLevel;
    this.frameCount = 0;

    // Reset worm
    this.worm = [];
    this.wormAngle = 0;
    this.wormSpeed = 0;
    this.growCounter = 0;
    this.graceTimer = Config.GRACE_FRAMES;

    // Reset dots
    this.dots = [];
    this.poisonDots = [];
    this.dotsEaten = 0;
    this.minimumReached = false;

    // Reset wormhole
    this.wormhole = { pos: 0, dir: 1 };
    this.wormholeOpen = false;
    this.wormholeTimer = 0;

    // Reset button
    this.button = { x: 0, y: 0, pressed: false, visible: false };
    this.buttonRequired = false;

    // Reset hunters
    this.hunters = [];
    this.maxHunters = 0;
    this.levelTimer = 0;
    this.hunterRespawnTime = 0;
    this.hunterPenaltyTimer = 0;

    // Reset obstacles
    this.obstacles = [];

    // Reset wall shrinking
    this.wallShrink = 0;
    this.shrinkTimer = 0;
    this.shrinkActive = false;

    // Reset combo
    this.combo = 0;
    this.comboTimer = 0;
    this.comboDisplay = 0;
    this.lastComboScore = 0;

    // Reset effects
    this.particles = [];
    this.shakeAmount = 0;
    this.flashTimer = 0;
    this.poisonPenaltyTimer = 0;
  },

  /**
   * Save high score to localStorage
   */
  saveHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('wooorm-highscore', this.highScore);
      return true;
    }
    return false;
  },

  /**
   * Get current play area bounds (accounting for wall shrink)
   */
  getCurrentBounds() {
    return {
      left: Config.PLAY_LEFT + this.wallShrink,
      right: Config.PLAY_RIGHT - this.wallShrink,
      top: Config.PLAY_TOP + this.wallShrink,
      bottom: Config.PLAY_BOTTOM - this.wallShrink,
      width: Config.PLAY_WIDTH - this.wallShrink * 2,
      height: Config.PLAY_HEIGHT - this.wallShrink * 2
    };
  }
};
