export interface Point {
  x: number;
  y: number;
}

export interface Vector {
  x: number;
  y: number;
}

export interface Landmark {
  x: number;
  y: number;
  z: number;
}

export enum BubbleColor {
  RED = '#ff4757',
  BLUE = '#1e90ff',
  GREEN = '#2ed573',
  YELLOW = '#ffa502',
  PURPLE = '#a55eea',
  CYAN = '#00d2d3'
}

export interface Bubble {
  color: BubbleColor;
  row: number;
  col: number;
  x: number;
  y: number;
  active: boolean; // false if popped/falling
}

export interface FallingBubble {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: BubbleColor;
  active: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
  type: 'burst' | 'spark';
}

export interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: BubbleColor;
  active: boolean;
}

export interface HandGestureState {
  isPinching: boolean;
  pinchDistance: number;
  indexTip: Point;
  thumbTip: Point;
  detected: boolean;
  landmarks?: Landmark[];
}

export enum GameState {
  MENU,
  LOADING,
  PLAYING,
  GAME_OVER,
  VICTORY
}