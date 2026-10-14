/**
 * ZenNurikabe - Main Game Application Controller
 */

(() => {
  // State
  let currentLevelIndex = 0;
  let engine = null;
  let completedLevels = new Set();
  let autoWater = true;
  let isDragging = false;
  let dragMode = null; // 'wall', 'island', 'clear'
  let lastDraggedCell = null;
  let hintCell = null;

  // DOM Elements
  const packNameEl = document.getElementById('pack-name');
  const levelNameEl = document.getElementById('level-name');
  const btnPrevLevel = document.getElementById('btn-prev-level');
  const btnNextLevel = document.getElementById('btn-next-level');
  const btnSound = document.getElementById('btn-sound');
  const btnLevels = document.getElementById('btn-levels');
  const btnUndo = document.getElementById('btn-undo');
  const btnReset = document.getElementById('btn-reset');
  const btnHint = document.getElementById('btn-hint');
  const btnAutoWater = document.getElementById('btn-autowater');
  const hintBanner = document.getElementById('hint-banner');
  const hintText = document.getElementById('hint-text');
  const btnCloseHint = document.getElementById('btn-close-hint');
  const modalLevels = document.getElementById('modal-levels');
  const btnCloseLevels = document.getElementById('btn-close-levels');
  const packContainer = document.getElementById('pack-container');
  const modalVictory = document.getElementById('modal-victory');
  const btnNextVictory = document.getElementById('btn-next-victory');
  const boardGrid = document.getElementById('board-grid');

  // Load progress
  function loadProgress() {
    try {
      const saved = localStorage.getItem('zennurikabe_completed');
      if (saved) {
        completedLevels = new Set(JSON.parse(saved));
      }
      const lastLevel = localStorage.getItem('zennurikabe_level');
      if (lastLevel !== null) {
        const idx = parseInt(lastLevel, 10);
        if (!isNaN(idx) && idx >= 0 && idx < LEVELS.length) {
          currentLevelIndex = idx;
        }
      }
      const savedAutoWater = localStorage.getItem('zennurikabe_autowater');
      if (savedAutoWater !== null) {
        autoWater = savedAutoWater === 'true';
      }
    } catch (e) {}
  }

  function saveProgress() {
    try {
      localStorage.setItem('zennurikabe_completed', JSON.stringify([...completedLevels]));
      localStorage.setItem('zennurikabe_level', String(currentLevelIndex));
      localStorage.setItem('zennurikabe_autowater', String(autoWater));
    } catch (e) {}
  }

  function init() {
    loadProgress();
    updateSoundBtn();
    updateAutoWaterBtn();
    loadLevel(currentLevelIndex);
    attachEvents();
  }

  function updateSoundBtn() {
    btnSound.textContent = sounds.enabled ? '🔊' : '🔇';
  }

  function updateAutoWaterBtn() {
    if (autoWater) {
      btnAutoWater.classList.add('active');
    } else {
      btnAutoWater.classList.remove('active');
    }
  }

  function loadLevel(index) {
    if (index < 0 || index >= LEVELS.length) return;
    currentLevelIndex = index;
    saveProgress();

    const level = LEVELS[index];
    engine = new NurikabeEngine(level);
    hintCell = null;
    hideHint();

    packNameEl.textContent = level.packName;
    levelNameEl.textContent = `Level ${level.id} (${level.size}×${level.size})`;

    btnPrevLevel.disabled = index === 0;
    btnNextLevel.disabled = index === LEVELS.length - 1;

    renderBoard();
  }

  function renderBoard() {
    const size = engine.size;
    boardGrid.innerHTML = '';
    boardGrid.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
    boardGrid.style.gridTemplateRows = `repeat(${size}, 1fr)`;

    const violations = engine.getViolations();
    const poolSet = new Set();
    for (const p of violations.pools) {
      poolSet.add(`${p.r},${p.c}`);
      poolSet.add(`${p.r + 1},${p.c}`);
      poolSet.add(`${p.r},${p.c + 1}`);
      poolSet.add(`${p.r + 1},${p.c + 1}`);
    }

    const islands = engine.getIslands();
    const islandMap = new Map();
    for (const isl of islands) {
      for (const c of isl.cells) {
        islandMap.set(`${c.r},${c.c}`, isl);
      }
    }

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const cellEl = document.createElement('div');
        cellEl.className = 'cell';
        cellEl.dataset.r = r;
        cellEl.dataset.c = c;

        const isClue = engine.isClueCell(r, c);
        const state = engine.getCell(r, c);

        if (isClue) {
          cellEl.classList.add('clue', 'island');
          cellEl.textContent = engine.clues[r][c];

          const isl = islandMap.get(`${r},${c}`);
          if (isl) {
            if (isl.cells.length === engine.clues[r][c] && isl.clueCount === 1) {
              cellEl.classList.add('satisfied');
            } else if (isl.cells.length > engine.clues[r][c] || isl.clueCount > 1) {
              cellEl.classList.add('violated');
            }
          }
        } else {
          if (state === CELL_WALL) {
            cellEl.classList.add('wall');
          } else if (state === CELL_ISLAND) {
            cellEl.classList.add('island', 'player-dot');
          }
        }

        if (poolSet.has(`${r},${c}`)) {
          cellEl.classList.add('pool-violation');
        }

        if (hintCell && hintCell.r === r && hintCell.c === c) {
          cellEl.classList.add('highlight-hint');
        }

        boardGrid.appendChild(cellEl);
      }
    }
  }

  function handleCellInteraction(r, c) {
    if (engine.isClueCell(r, c)) return;

    const nextState = engine.toggleCell(r, c, autoWater);
    if (nextState === CELL_WALL) {
      sounds.playWall();
    } else if (nextState === CELL_ISLAND) {
      sounds.playIsland();
    } else {
      sounds.playClear();
    }

    // Check if an island was just satisfied
    const islands = engine.getIslands();
    for (const isl of islands) {
      if (isl.clue && isl.cells.length === isl.clue.size && isl.cells.some(cell => cell.r === r && cell.c === c)) {
        sounds.playIslandComplete();
        break;
      }
    }

    hintCell = null;
    renderBoard();
    checkVictory();
  }

  function checkVictory() {
    if (engine.isLevelCompleted()) {
      sounds.playVictory();
      completedLevels.add(LEVELS[currentLevelIndex].id);
      saveProgress();

      setTimeout(() => {
        showVictoryModal();
      }, 400);
    }
  }

  function showVictoryModal() {
    modalVictory.classList.remove('hidden');
  }

  function hideVictoryModal() {
    modalVictory.classList.add('hidden');
  }

  function showHint() {
    const hint = engine.getHint();
    if (!hint) return;
    hintText.textContent = hint.message;
    hintCell = hint.cell || null;
    hintBanner.classList.remove('hidden');
    renderBoard();
    sounds.playTap();
  }

  function hideHint() {
    hintBanner.classList.add('hidden');
    hintCell = null;
    renderBoard();
  }

  function renderLevelSelector() {
    packContainer.innerHTML = '';

    const packs = {};
    for (let i = 0; i < LEVELS.length; i++) {
      const level = LEVELS[i];
      if (!packs[level.packId]) {
        packs[level.packId] = {
          id: level.packId,
          name: level.packName,
          size: level.size,
          levels: []
        };
      }
      packs[level.packId].levels.push({ index: i, level });
    }

    for (const packKey in packs) {
      const pack = packs[packKey];
      const section = document.createElement('div');
      section.className = 'pack-section';

      const title = document.createElement('div');
      title.className = 'pack-title';
      title.innerHTML = `<span>${pack.name} (${pack.size}×${pack.size})</span>`;
      section.appendChild(title);

      const grid = document.createElement('div');
      grid.className = 'level-grid';

      for (const item of pack.levels) {
        const btn = document.createElement('button');
        btn.className = 'level-select-btn';
        btn.textContent = item.level.id;

        if (item.index === currentLevelIndex) {
          btn.classList.add('current');
        }
        if (completedLevels.has(item.level.id)) {
          btn.classList.add('completed');
        }

        btn.addEventListener('click', () => {
          modalLevels.classList.add('hidden');
          loadLevel(item.index);
          sounds.playTap();
        });

        grid.appendChild(btn);
      }

      section.appendChild(grid);
      packContainer.appendChild(section);
    }
  }

  function attachEvents() {
    // Sound toggle
    btnSound.addEventListener('click', () => {
      sounds.toggleSound();
      updateSoundBtn();
    });

    // Level navigation
    btnPrevLevel.addEventListener('click', () => {
      if (currentLevelIndex > 0) {
        loadLevel(currentLevelIndex - 1);
        sounds.playTap();
      }
    });

    btnNextLevel.addEventListener('click', () => {
      if (currentLevelIndex < LEVELS.length - 1) {
        loadLevel(currentLevelIndex + 1);
        sounds.playTap();
      }
    });

    // Action buttons
    btnUndo.addEventListener('click', () => {
      if (engine.undo()) {
        sounds.playClear();
        hintCell = null;
        renderBoard();
      }
    });

    btnReset.addEventListener('click', () => {
      engine.reset();
      sounds.playClear();
      hintCell = null;
      hideHint();
      renderBoard();
    });

    btnHint.addEventListener('click', () => {
      showHint();
    });

    btnCloseHint.addEventListener('click', () => {
      hideHint();
    });

    btnAutoWater.addEventListener('click', () => {
      autoWater = !autoWater;
      saveProgress();
      updateAutoWaterBtn();
      sounds.playTap();
    });

    // Level selector modal
    btnLevels.addEventListener('click', () => {
      renderLevelSelector();
      modalLevels.classList.remove('hidden');
      sounds.playTap();
    });

    btnCloseLevels.addEventListener('click', () => {
      modalLevels.classList.add('hidden');
    });

    modalLevels.addEventListener('click', (e) => {
      if (e.target === modalLevels) {
        modalLevels.classList.add('hidden');
      }
    });

    // Victory modal
    btnNextVictory.addEventListener('click', () => {
      hideVictoryModal();
      if (currentLevelIndex < LEVELS.length - 1) {
        loadLevel(currentLevelIndex + 1);
      } else {
        renderLevelSelector();
        modalLevels.classList.remove('hidden');
      }
    });

    modalVictory.addEventListener('click', (e) => {
      if (e.target === modalVictory) {
        hideVictoryModal();
      }
    });

    // Drag / Touch Board Interaction
    boardGrid.addEventListener('pointerdown', (e) => {
      const cellEl = e.target.closest('.cell');
      if (!cellEl) return;

      const r = parseInt(cellEl.dataset.r, 10);
      const c = parseInt(cellEl.dataset.c, 10);
      if (isNaN(r) || isNaN(c)) return;

      isDragging = true;
      lastDraggedCell = `${r},${c}`;
      handleCellInteraction(r, c);
    });

    boardGrid.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      const target = document.elementFromPoint(e.clientX, e.clientY);
      if (!target) return;
      const cellEl = target.closest('.cell');
      if (!cellEl) return;

      const r = parseInt(cellEl.dataset.r, 10);
      const c = parseInt(cellEl.dataset.c, 10);
      if (isNaN(r) || isNaN(c)) return;

      const key = `${r},${c}`;
      if (key !== lastDraggedCell) {
        lastDraggedCell = key;
        // In dragging mode, paint empty cells as WALL (stream tracing)
        if (engine.getCell(r, c) === CELL_EMPTY && !engine.isClueCell(r, c)) {
          engine.setCell(r, c, CELL_WALL, true);
          sounds.playWall();
          renderBoard();
          checkVictory();
        }
      }
    });

    window.addEventListener('pointerup', () => {
      isDragging = false;
      lastDraggedCell = null;
    });

    window.addEventListener('pointercancel', () => {
      isDragging = false;
      lastDraggedCell = null;
    });

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.key === 'z' || e.key === 'Z') {
        if (engine.undo()) {
          sounds.playClear();
          renderBoard();
        }
      } else if (e.key === 'r' || e.key === 'R') {
        engine.reset();
        sounds.playClear();
        renderBoard();
      } else if (e.key === 'h' || e.key === 'H') {
        showHint();
      } else if (e.key === 'ArrowRight') {
        if (currentLevelIndex < LEVELS.length - 1) {
          loadLevel(currentLevelIndex + 1);
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentLevelIndex > 0) {
          loadLevel(currentLevelIndex - 1);
        }
      }
    });
  }

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
