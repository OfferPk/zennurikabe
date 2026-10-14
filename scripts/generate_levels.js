/**
 * Fast, intelligent Nurikabe Level Generator & Solver Verifier
 */

const fs = require('fs');
const path = require('path');
const { CELL_EMPTY, CELL_WALL, CELL_ISLAND, NurikabeEngine, NurikabeSolver } = require('../src/nurikabe-engine.js');

function isConnectedWall(grid, size) {
  let wallCount = 0;
  let start = null;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === CELL_WALL) {
        wallCount++;
        if (!start) start = { r, c };
      }
    }
  }
  if (wallCount === 0 || !start) return false;

  const visited = Array.from({ length: size }, () => Array(size).fill(false));
  const queue = [start];
  visited[start.r][start.c] = true;
  let count = 0;

  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  while (queue.length > 0) {
    const curr = queue.shift();
    count++;
    for (const [dr, dc] of dirs) {
      const nr = curr.r + dr;
      const nc = curr.c + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr][nc] === CELL_WALL && !visited[nr][nc]) {
        visited[nr][nc] = true;
        queue.push({ r: nr, c: nc });
      }
    }
  }

  return count === wallCount;
}

function has2x2WallPool(grid, size) {
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      if (
        grid[r][c] === CELL_WALL &&
        grid[r + 1][c] === CELL_WALL &&
        grid[r][c + 1] === CELL_WALL &&
        grid[r + 1][c + 1] === CELL_WALL
      ) {
        return true;
      }
    }
  }
  return false;
}

function getIslands(grid, size) {
  const visited = Array.from({ length: size }, () => Array(size).fill(false));
  const islands = [];
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === CELL_ISLAND && !visited[r][c]) {
        const cells = [];
        const queue = [{ r, c }];
        visited[r][c] = true;

        while (queue.length > 0) {
          const curr = queue.shift();
          cells.push(curr);
          for (const [dr, dc] of dirs) {
            const nr = curr.r + dr;
            const nc = curr.c + dc;
            if (nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr][nc] === CELL_ISLAND && !visited[nr][nc]) {
              visited[nr][nc] = true;
              queue.push({ r: nr, c: nc });
            }
          }
        }
        islands.push(cells);
      }
    }
  }
  return islands;
}

function generateCandidate(size) {
  // Start with all cells as WALL
  const grid = Array.from({ length: size }, () => Array(size).fill(CELL_WALL));
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  // Place island seeds on a staggered pattern
  const step = 2;
  const seeds = [];
  for (let r = 0; r < size; r += step) {
    for (let c = 0; c < size; c += step) {
      if (Math.random() < 0.8) {
        grid[r][c] = CELL_ISLAND;
        seeds.push({ r, c });
      }
    }
  }

  // Grow some islands randomly
  for (const seed of seeds) {
    const growth = Math.floor(Math.random() * 3); // 0, 1, or 2 expansions
    let curr = seed;
    for (let g = 0; g < growth; g++) {
      const candidates = [];
      for (const [dr, dc] of dirs) {
        const nr = curr.r + dr;
        const nc = curr.c + dc;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr][nc] === CELL_WALL) {
          // Check if nr, nc touches any OTHER island
          let touchesOther = false;
          for (const [d2r, d2c] of dirs) {
            const n2r = nr + d2r;
            const n2c = nc + d2c;
            if (n2r >= 0 && n2r < size && n2c >= 0 && n2c < size && grid[n2r][n2c] === CELL_ISLAND) {
              if (n2r !== curr.r || n2c !== curr.c) {
                touchesOther = true;
                break;
              }
            }
          }
          if (!touchesOther) {
            candidates.push({ r: nr, c: nc });
          }
        }
      }
      if (candidates.length === 0) break;
      const nextCell = candidates[Math.floor(Math.random() * candidates.length)];
      grid[nextCell.r][nextCell.c] = CELL_ISLAND;
      curr = nextCell;
    }
  }

  // Break all 2x2 pools of walls
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      if (
        grid[r][c] === CELL_WALL &&
        grid[r + 1][c] === CELL_WALL &&
        grid[r][c + 1] === CELL_WALL &&
        grid[r + 1][c + 1] === CELL_WALL
      ) {
        // Try converting one of the 4 cells to island if it doesn't merge two different islands
        const options = [{ r, c }, { r: r + 1, c }, { r, c: c + 1 }, { r: r + 1, c: c + 1 }];
        for (const opt of options) {
          // Check surrounding island neighbors
          const islandNeighbors = [];
          for (const [dr, dc] of dirs) {
            const nr = opt.r + dr;
            const nc = opt.c + dc;
            if (nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr][nc] === CELL_ISLAND) {
              islandNeighbors.push({ r: nr, c: nc });
            }
          }
          if (islandNeighbors.length <= 1) {
            grid[opt.r][opt.c] = CELL_ISLAND;
            break;
          }
        }
      }
    }
  }

  // Re-verify no 2x2 wall pool
  if (has2x2WallPool(grid, size)) return null;

  // Re-verify wall is fully connected
  if (!isConnectedWall(grid, size)) return null;

  // Extract islands and assign clues
  const islands = getIslands(grid, size);
  if (islands.length < 2) return null;

  const clues = Array.from({ length: size }, () => Array(size).fill(0));
  for (const isl of islands) {
    // Choose one cell in the island for the clue
    const clueCell = isl[0];
    clues[clueCell.r][clueCell.c] = isl.length;
  }

  return { size, clues, grid };
}

function generateLevelsForPack(pack, count) {
  const levels = [];
  let attempts = 0;

  while (levels.length < count && attempts < 5000) {
    attempts++;
    const cand = generateCandidate(pack.size);
    if (!cand) continue;

    // Verify unique solution with solver
    const solver = new NurikabeSolver(cand.size, cand.clues);
    const solutions = solver.solve(2);
    if (solutions.length === 1) {
      levels.push({
        id: 0, // assigned later
        packId: pack.id,
        packName: pack.name,
        name: `${pack.name} ${levels.length + 1}`,
        size: cand.size,
        clues: cand.clues,
        solution: solutions[0]
      });
      console.log(`  ✓ ${pack.name} ${levels.length} verified in ${attempts} attempts`);
      attempts = 0;
    }
  }

  return levels;
}

const packs = [
  { id: 'spring', name: 'Spring Garden', size: 5, count: 10 },
  { id: 'koi', name: 'Koi Pond', size: 6, count: 10 },
  { id: 'stone', name: 'Stone Archipelago', size: 7, count: 10 },
  { id: 'mist', name: 'Mist River', size: 8, count: 10 },
  { id: 'sanctuary', name: 'Zen Sanctuary', size: 9, count: 10 }
];

console.log('Generating 50 solver-verified ZenNurikabe levels...');
const allLevels = [];
let id = 1;

for (const pack of packs) {
  console.log(`Generating pack: ${pack.name} (${pack.size}x${pack.size})...`);
  const packLevels = generateLevelsForPack(pack, pack.count);
  for (const lvl of packLevels) {
    lvl.id = id++;
    allLevels.push(lvl);
  }
}

// Compact output to src/levels.js
const destPath = path.join(__dirname, '../src/levels.js');
let fileContent = 'const LEVELS = [\n';
for (let i = 0; i < allLevels.length; i++) {
  fileContent += `  ${JSON.stringify(allLevels[i])}${i < allLevels.length - 1 ? ',' : ''}\n`;
}
fileContent += '];\n\nif (typeof module !== \'undefined\' && module.exports) {\n  module.exports = { LEVELS };\n}\n';

fs.writeFileSync(destPath, fileContent);
console.log(`Successfully generated and wrote all ${allLevels.length} levels to ${destPath}!`);
