const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  CELL_EMPTY,
  CELL_WALL,
  CELL_ISLAND,
  NurikabeEngine,
  NurikabeSolver
} = require('../src/nurikabe-engine.js');

describe('ZenNurikabe Engine Tests', () => {
  it('should initialize board with correct dimensions and clues', () => {
    const level = {
      size: 5,
      clues: [
        [0, 2, 0, 0, 0],
        [0, 0, 0, 1, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 3, 0, 0],
        [0, 0, 0, 0, 0]
      ]
    };
    const engine = new NurikabeEngine(level);

    assert.equal(engine.size, 5);
    assert.equal(engine.isClueCell(0, 1), true);
    assert.equal(engine.isClueCell(1, 3), true);
    assert.equal(engine.isClueCell(0, 0), false);
    assert.equal(engine.getCell(0, 1), CELL_ISLAND);
    assert.equal(engine.getCell(0, 0), CELL_EMPTY);
  });

  it('should cycle cell states: EMPTY -> WALL -> ISLAND -> EMPTY on non-clue cells', () => {
    const level = {
      size: 5,
      clues: Array.from({ length: 5 }, () => Array(5).fill(0))
    };
    const engine = new NurikabeEngine(level);

    assert.equal(engine.getCell(2, 2), CELL_EMPTY);

    // 1st toggle: WALL
    assert.equal(engine.toggleCell(2, 2), CELL_WALL);
    assert.equal(engine.getCell(2, 2), CELL_WALL);

    // 2nd toggle: ISLAND
    assert.equal(engine.toggleCell(2, 2), CELL_ISLAND);
    assert.equal(engine.getCell(2, 2), CELL_ISLAND);

    // 3rd toggle: EMPTY
    assert.equal(engine.toggleCell(2, 2), CELL_EMPTY);
    assert.equal(engine.getCell(2, 2), CELL_EMPTY);
  });

  it('should protect clue cells from being altered', () => {
    const level = {
      size: 5,
      clues: [
        [2, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0]
      ]
    };
    const engine = new NurikabeEngine(level);

    assert.equal(engine.toggleCell(0, 0), null);
    assert.equal(engine.setCell(0, 0, CELL_WALL), false);
    assert.equal(engine.getCell(0, 0), CELL_ISLAND);
  });

  it('should support undo and reset operations', () => {
    const level = {
      size: 5,
      clues: [
        [2, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0]
      ]
    };
    const engine = new NurikabeEngine(level);

    engine.setCell(1, 1, CELL_WALL);
    engine.setCell(2, 2, CELL_ISLAND);

    assert.equal(engine.getCell(2, 2), CELL_ISLAND);
    assert.equal(engine.undo(), true);
    assert.equal(engine.getCell(2, 2), CELL_EMPTY);

    engine.reset();
    assert.equal(engine.getCell(1, 1), CELL_EMPTY);
    assert.equal(engine.getCell(0, 0), CELL_ISLAND);
  });

  it('should detect 2x2 ocean stream pools as violations', () => {
    const level = {
      size: 5,
      clues: Array.from({ length: 5 }, () => Array(5).fill(0))
    };
    const engine = new NurikabeEngine(level);

    engine.setCell(1, 1, CELL_WALL);
    engine.setCell(1, 2, CELL_WALL);
    engine.setCell(2, 1, CELL_WALL);
    assert.equal(engine.get2x2Pools().length, 0);

    engine.setCell(2, 2, CELL_WALL);
    const pools = engine.get2x2Pools();
    assert.equal(pools.length, 1);
    assert.deepEqual(pools[0], { r: 1, c: 1 });
  });

  it('should provide smart deductive hints for 2x2 pool prevention', () => {
    const level = {
      size: 5,
      clues: Array.from({ length: 5 }, () => Array(5).fill(0))
    };
    const engine = new NurikabeEngine(level);

    // Form 3 walls in a 2x2
    engine.setCell(0, 0, CELL_WALL);
    engine.setCell(0, 1, CELL_WALL);
    engine.setCell(1, 0, CELL_WALL);
    // (1,1) is EMPTY

    const hint = engine.getHint();
    assert.equal(hint.type, 'deduction');
    assert.equal(hint.action, 'island');
    assert.deepEqual(hint.cell, { r: 1, c: 1 });
  });

  it('should verify level completion correctly with full solution', () => {
    const level = {
      size: 3,
      clues: [
        [1, 0, 1],
        [0, 0, 0],
        [0, 0, 2]
      ]
    };
    const engine = new NurikabeEngine(level);

    // Solution:
    // [I] [W] [I]
    // [W] [W] [W]
    // [W] [I] [I]
    engine.setCell(0, 1, CELL_WALL);
    engine.setCell(1, 0, CELL_WALL);
    engine.setCell(1, 1, CELL_WALL);
    engine.setCell(1, 2, CELL_WALL);
    engine.setCell(2, 0, CELL_WALL);
    engine.setCell(2, 1, CELL_ISLAND);

    assert.equal(engine.isLevelCompleted(), true);
  });

  it('should load all 50 generated levels and verify their solutions', () => {
    const { LEVELS } = require('../src/levels.js');
    assert.equal(LEVELS.length, 50);

    for (const lvl of LEVELS) {
      assert.ok(lvl.size >= 5 && lvl.size <= 9);
      assert.ok(lvl.clues && lvl.clues.length === lvl.size);
      assert.ok(lvl.solution && lvl.solution.length === lvl.size);

      const engine = new NurikabeEngine(lvl);
      // Apply solution
      for (let r = 0; r < lvl.size; r++) {
        for (let c = 0; c < lvl.size; c++) {
          if (!engine.isClueCell(r, c)) {
            engine.setCell(r, c, lvl.solution[r][c]);
          }
        }
      }
      assert.equal(engine.isLevelCompleted(), true, `Level ${lvl.id} solution should be valid`);
    }
  });
});
