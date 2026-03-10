import { Bubble, BubbleColor } from '../types';
import { BUBBLE_RADIUS, ROW_OFFSET, GRID_COLS, GRID_ROWS, CANVAS_WIDTH } from './constants';

export const createGrid = (): (Bubble | null)[][] => {
  const grid: (Bubble | null)[][] = [];
  // Initialize grid with some bubbles
  for (let r = 0; r < GRID_ROWS; r++) {
    const rowBubbles: (Bubble | null)[] = [];
    for (let c = 0; c < GRID_COLS; c++) {
      // Create bubbles only in top rows for initial state
      if (r < 4) {
        rowBubbles.push({
          row: r,
          col: c,
          x: getBubbleX(c, r),
          y: getBubbleY(r),
          color: getRandomColor(),
          active: true
        });
      } else {
        rowBubbles.push(null);
      }
    }
    grid.push(rowBubbles);
  }
  return grid;
};

export const getBubbleX = (col: number, row: number): number => {
  const offset = (row % 2 !== 0) ? BUBBLE_RADIUS : 0;
  // Centering the grid
  const gridWidth = GRID_COLS * BUBBLE_RADIUS * 2 + BUBBLE_RADIUS; // Approx width
  const startX = (CANVAS_WIDTH - gridWidth) / 2 + BUBBLE_RADIUS;
  
  return startX + col * BUBBLE_RADIUS * 2 + offset;
};

export const getBubbleY = (row: number): number => {
  return BUBBLE_RADIUS + row * ROW_OFFSET;
};

export const getRandomColor = (): BubbleColor => {
  const colors = Object.values(BubbleColor);
  return colors[Math.floor(Math.random() * colors.length)] as BubbleColor;
};

// Find snapped grid position for a point (x,y)
export const getGridPosition = (x: number, y: number): { r: number, c: number } => {
  const r = Math.round((y - BUBBLE_RADIUS) / ROW_OFFSET);
  
  const offset = (r % 2 !== 0) ? BUBBLE_RADIUS : 0;
  const gridWidth = GRID_COLS * BUBBLE_RADIUS * 2 + BUBBLE_RADIUS;
  const startX = (CANVAS_WIDTH - gridWidth) / 2 + BUBBLE_RADIUS;
  
  const c = Math.round((x - startX - offset) / (BUBBLE_RADIUS * 2));
  
  return { r, c };
};

// Neighbor offsets for odd-r horizontal layout
const EVEN_ROW_NEIGHBORS = [
  [-1, -1], [-1, 0], [0, -1],
  [0, 1], [1, -1], [1, 0]
];
const ODD_ROW_NEIGHBORS = [
  [-1, 0], [-1, 1], [0, -1],
  [0, 1], [1, 0], [1, 1]
];

export const getNeighbors = (r: number, c: number): {r: number, c: number}[] => {
  const offsets = (r % 2 === 0) ? EVEN_ROW_NEIGHBORS : ODD_ROW_NEIGHBORS;
  const neighbors: {r: number, c: number}[] = [];
  
  for (const [dr, dc] of offsets) {
    const nr = r + dr;
    const nc = c + dc;
    if (nr >= 0 && nr < GRID_ROWS && nc >= 0 && nc < GRID_COLS) {
      neighbors.push({ r: nr, c: nc });
    }
  }
  return neighbors;
};

export const findCluster = (grid: (Bubble | null)[][], r: number, c: number, color: BubbleColor, matchColor: boolean = true): {r: number, c: number}[] => {
  const cluster: {r: number, c: number}[] = [];
  const visited = new Set<string>();
  const queue = [{r, c}];
  
  visited.add(`${r},${c}`);
  cluster.push({r, c});
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    const neighbors = getNeighbors(current.r, current.c);
    
    for (const n of neighbors) {
      const b = grid[n.r][n.c];
      if (b && b.active) {
        if (!visited.has(`${n.r},${n.c}`)) {
          if (!matchColor || b.color === color) {
            visited.add(`${n.r},${n.c}`);
            cluster.push(n);
            queue.push(n);
          }
        }
      }
    }
  }
  return cluster;
};

export const findFloatingClusters = (grid: (Bubble | null)[][]): {r: number, c: number}[] => {
  const visited = new Set<string>();
  const queue: {r: number, c: number}[] = [];
  
  // Add all active bubbles in the top row to queue
  for (let c = 0; c < GRID_COLS; c++) {
    if (grid[0][c] && grid[0][c]!.active) {
      queue.push({r: 0, c});
      visited.add(`0,${c}`);
    }
  }
  
  // BFS to find all attached bubbles
  while (queue.length > 0) {
    const current = queue.shift()!;
    const neighbors = getNeighbors(current.r, current.c);
    
    for (const n of neighbors) {
      const b = grid[n.r][n.c];
      if (b && b.active && !visited.has(`${n.r},${n.c}`)) {
        visited.add(`${n.r},${n.c}`);
        queue.push(n);
      }
    }
  }
  
  // Identify all active bubbles NOT in visited set
  const floating: {r: number, c: number}[] = [];
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      if (grid[r][c] && grid[r][c]!.active && !visited.has(`${r},${c}`)) {
        floating.push({r, c});
      }
    }
  }
  
  return floating;
};
