/**
 * Input Handling - Crank accumulates angle changes
 */
const Input = {
  init() {
    this.initKeyboard();
    this.initDesktopCrank();
    this.initMobileCrank();
    this.initMobileArrows();
    this.initModal();
    this.initButtons();
    this.initLevelSelect();
  },

  initKeyboard() {
    document.addEventListener('keydown', (e) => {
      GameState.keys[e.key] = true;

      // Space to start/restart (also used for boost while playing)
      if (e.key === ' ') {
        e.preventDefault();
        if (GameState.status === 'start') {
          Game.start();
        } else if (GameState.status === 'gameover') {
          Game.restart();
        }
      }

      // Level selection
      if (GameState.status === 'start') {
        if (e.key === 'ArrowUp' && GameState.startingLevel < Config.MAX_LEVEL) {
          GameState.startingLevel++;
          UI.updateLevelSelector();
        }
        if (e.key === 'ArrowDown' && GameState.startingLevel > 1) {
          e.preventDefault();
          GameState.startingLevel--;
          UI.updateLevelSelector();
        }
      }
    });

    document.addEventListener('keyup', (e) => {
      GameState.keys[e.key] = false;
    });
  },

  initDesktopCrank() {
    const crankControl = document.getElementById('crankControl');

    crankControl.addEventListener('mousedown', (e) => {
      if (GameState.status !== 'playing') return;
      GameState.crankDragging = true;
      document.body.classList.add('crank-dragging');
      const rect = crankControl.getBoundingClientRect();
      GameState.dragCenterX = rect.left + rect.width / 2;
      GameState.dragCenterY = rect.top + rect.height / 2;
      GameState.dragPrevX = e.clientX;
      GameState.dragPrevY = e.clientY;
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!GameState.crankDragging || GameState.status !== 'playing') return;

      const currX = e.clientX;
      const currY = e.clientY;

      // Calculate rotation delta using cross product
      const v1x = GameState.dragPrevX - GameState.dragCenterX;
      const v1y = GameState.dragPrevY - GameState.dragCenterY;
      const v2x = currX - GameState.dragCenterX;
      const v2y = currY - GameState.dragCenterY;

      const cross = v1x * v2y - v1y * v2x;
      const dot = v1x * v2x + v1y * v2y;
      const delta = Math.atan2(cross, dot);

      // Update visual crank angle
      GameState.crankVisualAngle += delta;

      // Accumulate angle change for worm (applied in fixed update)
      // delta is in radians, convert to degrees then apply sensitivity
      // CRANK_SENSITIVITY = 0.08 radians per degree of crank rotation
      const deltaDegrees = delta * (180 / Math.PI);
      GameState.crankAngleChange += deltaDegrees * Config.CRANK_SENSITIVITY;

      GameState.dragPrevX = currX;
      GameState.dragPrevY = currY;
    });

    document.addEventListener('mouseup', () => {
      GameState.crankDragging = false;
      document.body.classList.remove('crank-dragging');
    });
  },

  initMobileCrank() {
    const mobileCrank = document.getElementById('mobileCrank');

    mobileCrank.addEventListener('touchstart', (e) => {
      if (GameState.status !== 'playing') return;
      GameState.crankDragging = true;
      const rect = mobileCrank.getBoundingClientRect();
      GameState.dragCenterX = rect.left + rect.width / 2;
      GameState.dragCenterY = rect.top + rect.height / 2;
      GameState.dragPrevX = e.touches[0].clientX;
      GameState.dragPrevY = e.touches[0].clientY;
      e.preventDefault();
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
      if (!GameState.crankDragging || GameState.status !== 'playing') return;

      const currX = e.touches[0].clientX;
      const currY = e.touches[0].clientY;

      const v1x = GameState.dragPrevX - GameState.dragCenterX;
      const v1y = GameState.dragPrevY - GameState.dragCenterY;
      const v2x = currX - GameState.dragCenterX;
      const v2y = currY - GameState.dragCenterY;

      const cross = v1x * v2y - v1y * v2x;
      const dot = v1x * v2x + v1y * v2y;
      const delta = Math.atan2(cross, dot);

      GameState.crankVisualAngle += delta;
      const deltaDegrees = delta * (180 / Math.PI);
      GameState.crankAngleChange += deltaDegrees * Config.CRANK_SENSITIVITY;

      GameState.dragPrevX = currX;
      GameState.dragPrevY = currY;
      e.preventDefault();
    }, { passive: false });

    document.addEventListener('touchend', () => {
      GameState.crankDragging = false;
    });
  },

  initMobileArrows() {
    const leftArrow = document.getElementById('mobileLeftArrow');
    const rightArrow = document.getElementById('mobileRightArrow');

    leftArrow.addEventListener('touchstart', (e) => {
      if (GameState.status !== 'playing') return;
      GameState.mobileLeftPressed = true;
      e.preventDefault();
    }, { passive: false });

    leftArrow.addEventListener('touchend', () => { GameState.mobileLeftPressed = false; });
    leftArrow.addEventListener('touchcancel', () => { GameState.mobileLeftPressed = false; });

    rightArrow.addEventListener('touchstart', (e) => {
      if (GameState.status !== 'playing') return;
      GameState.mobileRightPressed = true;
      e.preventDefault();
    }, { passive: false });

    rightArrow.addEventListener('touchend', () => { GameState.mobileRightPressed = false; });
    rightArrow.addEventListener('touchcancel', () => { GameState.mobileRightPressed = false; });
  },

  initModal() {
    document.getElementById('mobileInfoBtn').addEventListener('click', () => {
      document.getElementById('infoModal').classList.add('active');
    });

    document.getElementById('modalClose').addEventListener('click', () => {
      document.getElementById('infoModal').classList.remove('active');
    });

    document.getElementById('infoModal').addEventListener('click', (e) => {
      if (e.target.id === 'infoModal') {
        document.getElementById('infoModal').classList.remove('active');
      }
    });
  },

  initButtons() {
    document.getElementById('startBtn').addEventListener('click', (e) => {
      e.preventDefault();
      if (GameState.status === 'start') {
        Game.start();
      }
    });

    document.getElementById('restartBtn').addEventListener('click', (e) => {
      e.preventDefault();
      if (GameState.status === 'gameover') {
        Game.restart();
      }
    });

    document.getElementById('themeToggle').addEventListener('click', () => Theme.toggle());
    document.getElementById('modalThemeToggle').addEventListener('click', () => Theme.toggle());
  },

  initLevelSelect() {
    document.getElementById('levelUp').addEventListener('click', () => {
      if (GameState.startingLevel < Config.MAX_LEVEL) {
        GameState.startingLevel++;
        UI.updateLevelSelector();
      }
    });

    document.getElementById('levelDown').addEventListener('click', () => {
      if (GameState.startingLevel > 1) {
        GameState.startingLevel--;
        UI.updateLevelSelector();
      }
    });
  },

  updateCrankVisual() {
    const angle = GameState.crankVisualAngle * (180 / Math.PI);
    document.getElementById('crankArm').style.transform = `translateY(-50%) rotate(${angle}deg)`;
    document.getElementById('mobileCrankArm').style.transform = `translateY(-50%) rotate(${angle}deg)`;
  }
};
