/**
 * ZenNurikabe - Core Game Logic & Constraint Solver Engine
 *
 * Nurikabe (Islands in the Stream) Rules:
 * 1. Each island contains exactly one numbered clue and has area equal to that number.
 * 2. Islands cannot touch each other orthogonally (they may touch diagonally).
 * 3. All ocean stream (wall/water) cells must form a single, contiguous connected component.
 * 4. There can be no 2x2 blocks of ocean stream cells anywhere on the grid.
 */

const CELL_EMPTY = 0;
const CELL_WALL = 1;   // Ocean stream (shaded)
const CELL_ISLAND = 2; // Island cell (unshaded / dot)

class NurikabeEngine {
  constructor(level) {
    this.level = level;
    this.size = level.size; // N x N
    this.clues = level.clues; // N x N array (0 for empty, >0 for island clue)

    // Grid state
    this.grid = Array.from({ length: this.size }, () =>
      Array(this.size).fill(CELL_EMPTY)
    );

    // Clue cells are inherently islands
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.clues[r][c] > 0) {
          this.grid[r][c] = CELL_ISLAND;
        }
      }
    }

    this.history = [];
  }

  isInside(r, c) {
    return r >= 0 && r < this.size && c >= 0 && c < this.size;
  }

  isClueCell(r, c) {
    return this.isInside(r, c) && this.clues[r][c] > 0;
  }

  getCell(r, c) {
    if (!this.isInside(r, c)) return null;
    return this.grid[r][c];
  }

  setCell(r, c, state, recordHistory = true) {
    if (!this.isInside(r, c)) return false;
    // Clue cells cannot be changed from ISLAND
    if (this.isClueCell(r, c)) return false;

    const prev = this.grid[r][c];
    if (prev === state) return false;

    if (recordHistory) {
      this.history.push({ r, c, prev, next: state });
    }
    this.grid[r][c] = state;
    return true;
  }

  toggleCell(r, c, autoSurround = true) {
    if (!this.isInside(r, c) || this.isClueCell(r, c)) return null;

    const current = this.grid[r][c];
    let next;
    if (current === CELL_EMPTY) next = CELL_WALL;
    else if (current === CELL_WALL) next = CELL_ISLAND;
    else next = CELL_EMPTY;

    this.setCell(r, c, next, true);

    if (autoSurround && next === CELL_ISLAND) {
      this.checkAndAutoSurroundIslands();
    }

    return next;
  }

  checkAndAutoSurroundIslands() {
    const islands = this.getIslands();
    for (const island of islands) {
      if (island.clue && island.cells.length === island.clue.size) {
        // Island is complete, surround with walls
        for (const cell of island.cells) {
          const neighbors = this.getOrthogonalNeighbors(cell.r, cell.c);
          for (const n of neighbors) {
            if (this.grid[n.r][n.c] === CELL_EMPTY && !this.isClueCell(n.r, n.c)) {
              this.setCell(n.r, n.c, CELL_WALL, true);
            }
          }
        }
      }
    }
  }

  undo() {
    if (this.history.length === 0) return false;
    const action = this.history.pop();
    this.grid[action.r][action.c] = action.prev;
    return true;
  }

  reset() {
    this.history = [];
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (!this.isClueCell(r, c)) {
          this.grid[r][c] = CELL_EMPTY;
        } else {
          this.grid[r][c] = CELL_ISLAND;
        }
      }
    }
  }

  getOrthogonalNeighbors(r, c) {
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    const res = [];
    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (this.isInside(nr, nc)) {
        res.push({ r: nr, c: nc });
      }
    }
    return res;
  }

  /**
   * Find all connected components of island cells
   */
  getIslands() {
    const visited = Array.from({ length: this.size }, () => Array(this.size).fill(false));
    const islands = [];

    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.grid[r][c] === CELL_ISLAND && !visited[r][c]) {
          const cells = [];
          const cluesInIsland = [];
          const queue = [{ r, c }];
          visited[r][c] = true;

          while (queue.length > 0) {
            const curr = queue.shift();
            cells.push(curr);
            if (this.clues[curr.r][curr.c] > 0) {
              cluesInIsland.push({ r: curr.r, c: curr.c, size: this.clues[curr.r][curr.c] });
            }

            for (const n of this.getOrthogonalNeighbors(curr.r, curr.c)) {
              if (this.grid[n.r][n.c] === CELL_ISLAND && !visited[n.r][n.c]) {
                visited[n.r][n.c] = true;
                queue.push(n);
              }
            }
          }

          islands.push({
            cells,
            clue: cluesInIsland.length === 1 ? cluesInIsland[0] : null,
            clueCount: cluesInIsland.length,
            clues: cluesInIsland
          });
        }
      }
    }

    return islands;
  }

  /**
   * Find all connected components of ocean stream (wall) cells
   */
  getStreamComponents() {
    const visited = Array.from({ length: this.size }, () => Array(this.size).fill(false));
    const components = [];

    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.grid[r][c] === CELL_WALL && !visited[r][c]) {
          const cells = [];
          const queue = [{ r, c }];
          visited[r][c] = true;

          while (queue.length > 0) {
            const curr = queue.shift();
            cells.push(curr);

            for (const n of this.getOrthogonalNeighbors(curr.r, curr.c)) {
              if (this.grid[n.r][n.c] === CELL_WALL && !visited[n.r][n.c]) {
                visited[n.r][n.c] = true;
                queue.push(n);
              }
            }
          }

          components.push(cells);
        }
      }
    }

    return components;
  }

  /**
   * Detect any 2x2 block of stream cells
   */
  get2x2Pools() {
    const pools = [];
    for (let r = 0; r < this.size - 1; r++) {
      for (let c = 0; c < this.size - 1; c++) {
        if (
          this.grid[r][c] === CELL_WALL &&
          this.grid[r + 1][c] === CELL_WALL &&
          this.grid[r][c + 1] === CELL_WALL &&
          this.grid[r + 1][c + 1] === CELL_WALL
        ) {
          pools.push({ r, c });
        }
      }
    }
    return pools;
  }

  getViolations() {
    const violations = {
      pools: this.get2x2Pools(),
      multiClueIslands: [],
      cluelessIslands: [],
      oversizedIslands: [],
      multipleStreams: false
    };

    const islands = this.getIslands();
    for (const island of islands) {
      if (island.clueCount > 1) {
        violations.multiClueIslands.push(island);
      } else if (island.clueCount === 0) {
        violations.cluelessIslands.push(island);
      } else if (island.clue && island.cells.length > island.clue.size) {
        violations.oversizedIslands.push(island);
      }
    }

    const streams = this.getStreamComponents();
    if (streams.length > 1) {
      violations.multipleStreams = true;
    }

    return violations;
  }

  isLevelCompleted() {
    // 1. Grid must have no empty cells
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.grid[r][c] === CELL_EMPTY) return false;
      }
    }

    // 2. No 2x2 pools of ocean stream
    if (this.get2x2Pools().length > 0) return false;

    // 3. Exactly one connected ocean stream
    const streams = this.getStreamComponents();
    if (streams.length !== 1) return false;

    // 4. Every island must have exactly 1 clue, and island size === clue size
    const islands = this.getIslands();
    let totalCluesInBoard = 0;
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.clues[r][c] > 0) totalCluesInBoard++;
      }
    }

    if (islands.length !== totalCluesInBoard) return false;

    for (const island of islands) {
      if (island.clueCount !== 1) return false;
      if (island.cells.length !== island.clue.size) return false;
    }

    return true;
  }

  getHint() {
    // 1. Check for immediate violations
    const violations = this.getViolations();
    if (violations.pools.length > 0) {
      const p = violations.pools[0];
      return {
        type: 'violation',
        message: `2x2 ocean stream pool at (${p.r + 1}, ${p.c + 1}). 2x2 water squares are forbidden!`,
        cell: { r: p.r, c: p.c }
      };
    }

    if (violations.multiClueIslands.length > 0) {
      const isl = violations.multiClueIslands[0];
      return {
        type: 'violation',
        message: `Two or more numbered clues are connected together into one island. Islands must be separate!`,
        cell: isl.cells[0]
      };
    }

    if (violations.oversizedIslands.length > 0) {
      const isl = violations.oversizedIslands[0];
      return {
        type: 'violation',
        message: `Island at (${isl.clue.r + 1}, ${isl.clue.c + 1}) has ${isl.cells.length} cells, exceeding clue ${isl.clue.size}.`,
        cell: isl.clue
      };
    }

    // 2. Prevent 2x2 pool: if 3 cells in a 2x2 are WALL and the 4th is EMPTY, 4th must be ISLAND
    for (let r = 0; r < this.size - 1; r++) {
      for (let c = 0; c < this.size - 1; c++) {
        const sq = [
          { r, c, state: this.grid[r][c] },
          { r: r + 1, c, state: this.grid[r + 1][c] },
          { r, c: c + 1, state: this.grid[r][c + 1] },
          { r: r + 1, c: c + 1, state: this.grid[r + 1][c + 1] }
        ];
        const walls = sq.filter(s => s.state === CELL_WALL);
        const empties = sq.filter(s => s.state === CELL_EMPTY);
        if (walls.length === 3 && empties.length === 1) {
          const target = empties[0];
          return {
            type: 'deduction',
            action: 'island',
            cell: { r: target.r, c: target.c },
            message: `Placing water at (${target.r + 1}, ${target.c + 1}) would form a forbidden 2x2 pool. It must be an island cell.`
          };
        }
      }
    }

    // 3. Size 1 clues: surround immediately with ocean stream
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.clues[r][c] === 1) {
          for (const n of this.getOrthogonalNeighbors(r, c)) {
            if (this.grid[n.r][n.c] === CELL_EMPTY) {
              return {
                type: 'deduction',
                action: 'wall',
                cell: n,
                message: `Clue 1 at (${r + 1}, ${c + 1}) is already complete. All neighboring cells must be water.`
              };
            }
          }
        }
      }
    }

    // 4. Clue separation: if two clue cells are within distance 2 of each other,
    // cell between them cannot be an island (would merge or touch orthogonally)
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.clues[r][c] > 0) {
          // Check horizontal neighbor at dist 2
          if (c + 2 < this.size && this.clues[r][c + 2] > 0) {
            if (this.grid[r][c + 1] === CELL_EMPTY) {
              return {
                type: 'deduction',
                action: 'wall',
                cell: { r, c: c + 1 },
                message: `Islands cannot touch orthogonally. The cell between (${r + 1}, ${c + 1}) and (${r + 1}, ${c + 3}) must be water.`
              };
            }
          }
          // Check vertical neighbor at dist 2
          if (r + 2 < this.size && this.clues[r + 2][c] > 0) {
            if (this.grid[r + 1][c] === CELL_EMPTY) {
              return {
                type: 'deduction',
                action: 'wall',
                cell: { r: r + 1, c },
                message: `Islands cannot touch orthogonally. The cell between (${r + 1}, ${c + 1}) and (${r + 3}, ${c + 1}) must be water.`
              };
            }
          }
          // Check diagonal neighbors: if two clues are diagonally adjacent,
          // the two shared orthogonal neighbors cannot both be islands.
          const diags = [[1, 1], [1, -1]];
          for (const [dr, dc] of diags) {
            const nr = r + dr;
            const nc = c + dc;
            if (this.isInside(nr, nc) && this.clues[nr][nc] > 0) {
              // The shared neighbors are (r, nc) and (nr, c)
              // If one is island, other must be water, or if both empty...
            }
          }
        }
      }
    }

    // 5. Complete island surrounded with water
    const islands = this.getIslands();
    for (const island of islands) {
      if (island.clue && island.cells.length === island.clue.size) {
        for (const cell of island.cells) {
          for (const n of this.getOrthogonalNeighbors(cell.r, cell.c)) {
            if (this.grid[n.r][n.c] === CELL_EMPTY) {
              return {
                type: 'deduction',
                action: 'wall',
                cell: n,
                message: `Island with clue ${island.clue.size} is complete. Its remaining open borders must be water.`
              };
            }
          }
        }
      }
    }

    // 6. Forced island expansion: if an island needs more cells and only has 1 empty neighbor
    for (const island of islands) {
      if (island.clue && island.cells.length < island.clue.size) {
        const candidateNeighbors = new Set();
        for (const cell of island.cells) {
          for (const n of this.getOrthogonalNeighbors(cell.r, cell.c)) {
            if (this.grid[n.r][n.c] === CELL_EMPTY) {
              candidateNeighbors.add(`${n.r},${n.c}`);
            }
          }
        }

        if (candidateNeighbors.size === 1) {
          const [key] = candidateNeighbors;
          const [nr, nc] = key.split(',').map(Number);
          return {
            type: 'deduction',
            action: 'island',
            cell: { r: nr, c: nc },
            message: `Island at (${island.clue.r + 1}, ${island.clue.c + 1}) needs ${island.clue.size - island.cells.length} more cell(s) and only has one open direction.`
          };
        }
      }
    }

    return {
      type: 'info',
      message: 'Look for cells that must be water to keep the ocean stream connected or prevent 2x2 pools.',
      cell: null
    };
  }
}

/**
 * NurikabeSolver: Depth-first constraint propagation solver
 * Verifies solution uniqueness for level generation and testing.
 */
class NurikabeSolver {
  constructor(size, clues) {
    this.size = size;
    this.clues = clues;
    this.engine = new NurikabeEngine({ size, clues });
  }

  solve(maxSolutions = 2) {
    const size = this.size;
    const clues = this.clues;
    const solutions = [];
    const engine = this.engine;

    function snapshot() {
      return engine.grid.map(row => [...row]);
    }

    function restore(snap) {
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          engine.grid[r][c] = snap[r][c];
        }
      }
    }

    function propagate() {
      let changed = true;
      while (changed) {
        changed = false;

        // 1. Violations check
        const pools = engine.get2x2Pools();
        if (pools.length > 0) return false;

        const islands = engine.getIslands();
        for (const isl of islands) {
          if (isl.clueCount > 1) return false;
          if (isl.clue && isl.cells.length > isl.clue.size) return false;
        }

        // 2. Prevent 2x2 pools
        for (let r = 0; r < size - 1; r++) {
          for (let c = 0; c < size - 1; c++) {
            const sq = [
              { r, c, state: engine.grid[r][c] },
              { r: r + 1, c, state: engine.grid[r + 1][c] },
              { r, c: c + 1, state: engine.grid[r][c + 1] },
              { r: r + 1, c: c + 1, state: engine.grid[r + 1][c + 1] }
            ];
            const walls = sq.filter(s => s.state === CELL_WALL);
            const empties = sq.filter(s => s.state === CELL_EMPTY);
            if (walls.length === 3 && empties.length === 1) {
              const t = empties[0];
              engine.grid[t.r][t.c] = CELL_ISLAND;
              changed = true;
            }
          }
        }

        // 3. Completed islands surrounded with wall
        for (const isl of engine.getIslands()) {
          if (isl.clue && isl.cells.length === isl.clue.size) {
            for (const cell of isl.cells) {
              for (const n of engine.getOrthogonalNeighbors(cell.r, cell.c)) {
                if (engine.grid[n.r][n.c] === CELL_EMPTY) {
                  engine.grid[n.r][n.c] = CELL_WALL;
                  changed = true;
                }
              }
            }
          }
        }

        // 4. Clue separation at distance 2
        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            if (clues[r][c] > 0) {
              if (c + 2 < size && clues[r][c + 2] > 0 && engine.grid[r][c + 1] === CELL_EMPTY) {
                engine.grid[r][c + 1] = CELL_WALL;
                changed = true;
              }
              if (r + 2 < size && clues[r + 2][c] > 0 && engine.grid[r + 1][c] === CELL_EMPTY) {
                engine.grid[r + 1][c] = CELL_WALL;
                changed = true;
              }
            }
          }
        }

        // 5. Clue or island conflict: an empty cell touching two different islands must be WALL
        const islandsAll = engine.getIslands();
        const cellToIsland = Array.from({ length: size }, () => Array(size).fill(-1));
        for (let idx = 0; idx < islandsAll.length; idx++) {
          for (const cell of islandsAll[idx].cells) {
            cellToIsland[cell.r][cell.c] = idx;
          }
        }
        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            if (engine.grid[r][c] === CELL_EMPTY) {
              const touchingIslands = new Set();
              for (const n of engine.getOrthogonalNeighbors(r, c)) {
                const islIdx = cellToIsland[n.r][n.c];
                if (islIdx !== -1) {
                  touchingIslands.add(islIdx);
                }
              }
              if (touchingIslands.size > 1) {
                engine.grid[r][c] = CELL_WALL;
                changed = true;
              }
            }
          }
        }

        // 6. Forced island expansion: if an island with clue needs cells and has only 1 empty neighbor
        for (const isl of islandsAll) {
          if (isl.clue && isl.cells.length < isl.clue.size) {
            const emptyNeighbors = [];
            for (const cell of isl.cells) {
              for (const n of engine.getOrthogonalNeighbors(cell.r, cell.c)) {
                if (engine.grid[n.r][n.c] === CELL_EMPTY) {
                  if (!emptyNeighbors.some(en => en.r === n.r && en.c === n.c)) {
                    emptyNeighbors.push(n);
                  }
                }
              }
            }
            if (emptyNeighbors.length === 1) {
              const target = emptyNeighbors[0];
              engine.grid[target.r][target.c] = CELL_ISLAND;
              changed = true;
            }
          }
        }
      }
      return true;
    }

    function getNextUnassignedCell() {
      // Prioritize empty cells adjacent to islands or walls
      let best = null;
      let maxScore = -1;

      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (engine.grid[r][c] === CELL_EMPTY) {
            let score = 0;
            for (const n of engine.getOrthogonalNeighbors(r, c)) {
              if (engine.grid[n.r][n.c] === CELL_ISLAND) score += 4;
              if (engine.grid[n.r][n.c] === CELL_WALL) score += 2;
            }
            if (score > maxScore) {
              maxScore = score;
              best = { r, c };
            }
          }
        }
      }
      return best;
    }

    let steps = 0;
    const MAX_STEPS = 1500;
    let aborted = false;

    function search() {
      if (solutions.length >= maxSolutions || aborted) return;
      if (++steps > MAX_STEPS) {
        aborted = true;
        return;
      }

      const snap = snapshot();
      if (!propagate()) {
        restore(snap);
        return;
      }

      if (engine.isLevelCompleted()) {
        solutions.push(snapshot());
        restore(snap);
        return;
      }

      const cell = getNextUnassignedCell();
      if (!cell) {
        restore(snap);
        return;
      }

      // Branch 1: Try WALL
      const snapBeforeBranch = snapshot();
      engine.grid[cell.r][cell.c] = CELL_WALL;
      search();
      restore(snapBeforeBranch);

      if (solutions.length >= maxSolutions || aborted) return;

      // Branch 2: Try ISLAND
      engine.grid[cell.r][cell.c] = CELL_ISLAND;
      search();
      restore(snap);
    }

    search();
    if (aborted) return [];
    return solutions;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CELL_EMPTY,
    CELL_WALL,
    CELL_ISLAND,
    NurikabeEngine,
    NurikabeSolver
  };
}
