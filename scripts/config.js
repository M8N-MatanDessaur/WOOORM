/**
 * Game Configuration Constants
 * All values designed for 30 FPS (matching original Playdate game)
 */
const Config = {
  // Canvas (matching Playdate screen)
  CANVAS_W: 400,
  CANVAS_H: 240,

  // Play area (matching original exactly)
  PLAY_LEFT: 10,
  PLAY_TOP: 24,
  PLAY_RIGHT: 390,  // SCREEN_WIDTH - 10
  PLAY_BOTTOM: 216, // SCREEN_HEIGHT - 24
  PLAY_WIDTH: 380,  // PLAY_RIGHT - PLAY_LEFT
  PLAY_HEIGHT: 192, // PLAY_BOTTOM - PLAY_TOP

  // Worm
  WORM_SEGMENT_DIST: 3,
  WORM_HEAD_SIZE: 5,
  MIN_WORM_LENGTH: 15,
  GROW_AMOUNT: 8,

  // Speed (these are per-frame at 30fps)
  BASE_SPEED: 2.0,
  MAX_SPEED_BONUS: 2.0,
  BOOST_MULTIPLIER: 1.5,
  GRACE_FRAMES: 30,  // 1 second at 30fps

  // Crank (matching original exactly)
  CRANK_SENSITIVITY: 0.015,  // Radians per degree of crank rotation (lower = more resistance)
  DPAD_TURN_SPEED: 0.08,    // Radians per frame with arrow keys

  // Dots
  DOT_RADIUS: 5,
  DOT_REPOSITION_TIME: 240,  // 8 seconds at 30fps
  DOT_SPACING: 40,
  DOT_WALL_MARGIN: 35,
  DOT_OBSTACLE_MARGIN: 20,

  // Wormhole
  WORMHOLE_SIZE: 30,
  WORMHOLE_OPEN_TIME: 240,  // 8 seconds at 30fps

  // Button
  BUTTON_SIZE: 18,

  // Hunters
  HUNTER_SPEED: 1.8,
  HUNTER_TURN_RATE: 0.08,
  HUNTER_TRAIL_LENGTH: 8,
  HUNTER_MIN_DISTANCE: 50,
  HUNTER_SPAWN_TIMES: [300, 600, 900],  // 10s, 20s, 30s at 30fps
  HUNTER_RESPAWN_DELAY: 300,  // 10 seconds at 30fps

  // Wall shrinking
  MAX_SHRINK: 75,
  GENTLE_SHRINK_RATE: 0.025,   // Pixels per frame (first 10 seconds)
  MODERATE_SHRINK_RATE: 0.08,  // Pixels per frame (after 10 seconds)
  GENTLE_DURATION: 300,         // 10 seconds at 30fps

  // Combo
  COMBO_WINDOW: 150,  // 5 seconds at 30fps

  // Target frame rate
  TARGET_FPS: 30,
  FRAME_TIME: 1000 / 30,  // ~33.33ms per frame

  // Levels
  MAX_LEVEL: 16
};

// Freeze to prevent accidental modifications
Object.freeze(Config);
