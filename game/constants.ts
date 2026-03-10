import { BubbleColor } from '../types';

// Canvas Logic
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 800;

// Grid Logic
export const BUBBLE_RADIUS = 24;
export const BUBBLE_DIAMETER = BUBBLE_RADIUS * 2;
export const GRID_ROWS = 10; // Number of visible rows
export const GRID_COLS = 11; // Number of columns
export const ROW_OFFSET = BUBBLE_RADIUS * Math.sqrt(3); // Height of a row in hex grid

// Physics
export const PROJECTILE_SPEED = 15;
export const LAUNCHER_POS = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 60 };
export const GRAVITY = 0.5;
export const BOUNCE_DAMPING = 0.7; // Energy lost on bounce
export const FRICTION = 0.99; // Air resistance

// Gestures
export const PINCH_THRESHOLD = 0.05; // Normalized distance
export const SMOOTHING_FACTOR = 0.3; // For aim interpolation

export const COLORS = [
  BubbleColor.RED,
  BubbleColor.BLUE,
  BubbleColor.GREEN,
  BubbleColor.YELLOW,
  BubbleColor.PURPLE,
  BubbleColor.CYAN
];
