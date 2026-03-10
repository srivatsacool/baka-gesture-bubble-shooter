import React, { useEffect, useRef } from 'react';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  LAUNCHER_POS, 
  BUBBLE_RADIUS, 
  PROJECTILE_SPEED,
  SMOOTHING_FACTOR,
  GRAVITY,
  BOUNCE_DAMPING,
  FRICTION
} from '../game/constants';
import { Bubble, BubbleColor, GameState, HandGestureState, Projectile, FallingBubble, Particle } from '../types';
import { createGrid, getBubbleX, getBubbleY, getGridPosition, findCluster, findFloatingClusters, getRandomColor, getNeighbors } from '../game/grid';

interface Props {
  gestureStateRef: React.MutableRefObject<HandGestureState>;
  gameState: GameState;
  onScoreUpdate: (points: number) => void;
  onGameOver: () => void;
  setNextBubbleColor: (color: BubbleColor) => void;
}

const GameCanvas: React.FC<Props> = ({ 
  gestureStateRef, 
  gameState, 
  onScoreUpdate, 
  onGameOver,
  setNextBubbleColor
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  
  // Game State Refs
  const gridRef = useRef<(Bubble | null)[][]>(createGrid());
  const projectileRef = useRef<Projectile | null>(null);
  const fallingBubblesRef = useRef<FallingBubble[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  
  const currentBubbleColorRef = useRef<BubbleColor>(getRandomColor());
  const nextBubbleColorRef = useRef<BubbleColor>(getRandomColor());
  const aimAngleRef = useRef<number>(-Math.PI / 2); // Start pointing up
  const wasPinchingRef = useRef<boolean>(false);
  const pinchAnchorRef = useRef<{x: number, y: number} | null>(null); // Anchor point for the slingshot

  // Sync next color to parent for HUD
  useEffect(() => {
    setNextBubbleColor(nextBubbleColorRef.current);
  }, []);

  const resetGame = () => {
    gridRef.current = createGrid();
    projectileRef.current = null;
    fallingBubblesRef.current = [];
    particlesRef.current = [];
    currentBubbleColorRef.current = getRandomColor();
    nextBubbleColorRef.current = getRandomColor();
    setNextBubbleColor(nextBubbleColorRef.current);
  };

  useEffect(() => {
    if (gameState === GameState.PLAYING) {
        resetGame();
    }
  }, [gameState]);

  const updatePhysics = () => {
    // 1. Update Projectile
    if (projectileRef.current && projectileRef.current.active) {
      const p = projectileRef.current;
      p.x += p.vx;
      p.y += p.vy;

      // Wall collisions
      if (p.x <= BUBBLE_RADIUS || p.x >= CANVAS_WIDTH - BUBBLE_RADIUS) {
        p.vx *= -1;
        p.x = p.x <= BUBBLE_RADIUS ? BUBBLE_RADIUS : CANVAS_WIDTH - BUBBLE_RADIUS;
      }

      // Ceiling collision
      if (p.y <= BUBBLE_RADIUS) {
        snapProjectile(p);
      } else {
        // Bubble collisions
        let collided = false;
        const grid = gridRef.current;
        
        // Optimization: Only check nearby bubbles
        for (let r = 0; r < grid.length; r++) {
          for (let c = 0; c < grid[r].length; c++) {
            const b = grid[r][c];
            if (b && b.active) {
              const dist = Math.sqrt(Math.pow(p.x - b.x, 2) + Math.pow(p.y - b.y, 2));
              if (dist < BUBBLE_RADIUS * 2) {
                collided = true;
                break;
              }
            }
          }
          if (collided) break;
        }

        if (collided) {
          snapProjectile(p);
        }
      }
    }

    // 2. Update Falling Bubbles (Debris Physics)
    updateFallingBubbles();

    // 3. Update Particles
    updateParticles();
  };

  const updateFallingBubbles = () => {
    const bubbles = fallingBubblesRef.current;
    const grid = gridRef.current;

    for (let i = 0; i < bubbles.length; i++) {
      const b = bubbles[i];
      if (!b.active) continue;

      // Apply Forces
      b.vy += GRAVITY;
      b.vx *= FRICTION;
      b.vy *= FRICTION;

      // Move
      b.x += b.vx;
      b.y += b.vy;

      // Wall Bouncing
      if (b.x <= BUBBLE_RADIUS) {
        b.x = BUBBLE_RADIUS;
        b.vx *= -BOUNCE_DAMPING;
      } else if (b.x >= CANVAS_WIDTH - BUBBLE_RADIUS) {
        b.x = CANVAS_WIDTH - BUBBLE_RADIUS;
        b.vx *= -BOUNCE_DAMPING;
      }

      // Bottom Removal
      if (b.y > CANVAS_HEIGHT + BUBBLE_RADIUS) {
        b.active = false;
        continue;
      }

      // Collision with Static Grid Bubbles
      const { r, c } = getGridPosition(b.x, b.y);
      for(let dr = -2; dr <= 2; dr++) {
        for(let dc = -2; dc <= 2; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < grid.length && nc >= 0 && nc < grid[0].length) {
             const staticBubble = grid[nr][nc];
             if (staticBubble && staticBubble.active) {
               const dx = b.x - staticBubble.x;
               const dy = b.y - staticBubble.y;
               const dist = Math.sqrt(dx*dx + dy*dy);
               
               if (dist < BUBBLE_RADIUS * 2) {
                 const angle = Math.atan2(dy, dx);
                 const overlap = (BUBBLE_RADIUS * 2) - dist;
                 b.x += Math.cos(angle) * overlap;
                 b.y += Math.sin(angle) * overlap;

                 const nx = dx / dist;
                 const ny = dy / dist;
                 const dot = b.vx * nx + b.vy * ny;
                 
                 b.vx = (b.vx - 2 * dot * nx) * BOUNCE_DAMPING;
                 b.vy = (b.vy - 2 * dot * ny) * BOUNCE_DAMPING;
               }
             }
          }
        }
      }

      // Collision with Other Falling Bubbles
      for (let j = i + 1; j < bubbles.length; j++) {
        const other = bubbles[j];
        if (!other.active) continue;

        const dx = other.x - b.x;
        const dy = other.y - b.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        if (dist < BUBBLE_RADIUS * 2 && dist > 0) {
           const overlap = (BUBBLE_RADIUS * 2) - dist;
           const nx = dx / dist;
           const ny = dy / dist;
           
           const moveX = nx * overlap * 0.5;
           const moveY = ny * overlap * 0.5;
           
           b.x -= moveX;
           b.y -= moveY;
           other.x += moveX;
           other.y += moveY;

           const rvx = other.vx - b.vx;
           const rvy = other.vy - b.vy;
           const velAlongNormal = rvx * nx + rvy * ny;

           if (velAlongNormal < 0) {
             const jImpulse = -(1 + BOUNCE_DAMPING) * velAlongNormal;
             const impulseX = (jImpulse * nx) * 0.5;
             const impulseY = (jImpulse * ny) * 0.5;

             b.vx -= impulseX;
             b.vy -= impulseY;
             other.vx += impulseX;
             other.vy += impulseY;
           }
        }
      }
    }
    
    fallingBubblesRef.current = fallingBubblesRef.current.filter(b => b.active);
  };

  const updateParticles = () => {
    const particles = particlesRef.current;
    for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.life -= 1; 
        p.x += p.vx;
        p.y += p.vy;
        if (p.type === 'spark') {
            p.vx *= 0.95;
            p.vy *= 0.95;
        }
    }
    particlesRef.current = particles.filter(p => p.life > 0);
  };

  const spawnFallingBubble = (b: Bubble) => {
    fallingBubblesRef.current.push({
      x: b.x,
      y: b.y,
      color: b.color,
      active: true,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() * -5),
    });
  };

  const createPopEffect = (x: number, y: number, color: string) => {
      particlesRef.current.push({
          x, y, vx: 0, vy: 0,
          color,
          life: 15, 
          maxLife: 15,
          size: BUBBLE_RADIUS,
          type: 'burst'
      });

      const numSparks = 8;
      for(let i=0; i<numSparks; i++) {
          const angle = (Math.PI * 2 * i) / numSparks;
          const speed = 4 + Math.random() * 4;
          particlesRef.current.push({
              x, y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              color,
              life: 30 + Math.random() * 10,
              maxLife: 40,
              size: 4 + Math.random() * 4,
              type: 'spark'
          });
      }
  };

  const snapProjectile = (p: Projectile) => {
    let { r, c } = getGridPosition(p.x, p.y);
    const grid = gridRef.current;
    
    if (r >= 0 && r < grid.length && c >= 0 && c < grid[0].length) {
      // If the target cell is occupied, find the closest empty neighbor
      if (grid[r][c]) {
          const neighbors = getNeighbors(r, c);
          let minD = Infinity;
          let bestN = null;

          for (const n of neighbors) {
              if (grid[n.r] && !grid[n.r][n.c]) { // Check boundary and emptiness
                  // Calculate distance from projectile center to this neighbor's center
                  const nx = getBubbleX(n.c, n.r);
                  const ny = getBubbleY(n.r);
                  const d = Math.pow(p.x - nx, 2) + Math.pow(p.y - ny, 2);
                  if (d < minD) {
                      minD = d;
                      bestN = n;
                  }
              }
          }
          if (bestN) {
              r = bestN.r;
              c = bestN.c;
          } else {
             // No empty neighbors? Should not happen in standard gameplay unless choked.
             // Fail gracefully by returning/destroying projectile without placing
             projectileRef.current = null;
             return;
          }
      }

      if (!grid[r][c]) {
        grid[r][c] = {
            row: r, col: c,
            x: getBubbleX(c, r),
            y: getBubbleY(r),
            color: p.color,
            active: true
        };

        const matches = findCluster(grid, r, c, p.color, true);
        if (matches.length >= 3) {
           matches.forEach(m => {
             const bubble = grid[m.r][m.c];
             if (bubble) {
               createPopEffect(bubble.x, bubble.y, bubble.color);
               grid[m.r][m.c] = null;
             }
           });
           onScoreUpdate(matches.length * 100);

           const floating = findFloatingClusters(grid);
           floating.forEach(f => {
               const bubble = grid[f.r][f.c];
               if (bubble) {
                   spawnFallingBubble(bubble);
                   grid[f.r][f.c] = null; 
                   onScoreUpdate(50);
               }
           });
        }
      } 

      for (let c = 0; c < grid[0].length; c++) {
          if (grid[grid.length-1][c]) {
              onGameOver();
          }
      }
    }
    
    projectileRef.current = null;
    
    currentBubbleColorRef.current = nextBubbleColorRef.current;
    nextBubbleColorRef.current = getRandomColor();
    setNextBubbleColor(nextBubbleColorRef.current);
  };

  const updateGestures = () => {
    if (gameState !== GameState.PLAYING) return;

    const { isPinching, indexTip, detected } = gestureStateRef.current;
    
    if (detected) {
      // Map indexTip (0-1 across whole screen) to canvas.
      const mappedX = indexTip.x * CANVAS_WIDTH;
      const mappedY = indexTip.y * CANVAS_HEIGHT;

      if (isPinching && !wasPinchingRef.current) {
         // Pinch just started: set the anchor
         pinchAnchorRef.current = { x: mappedX, y: mappedY };
      }

      if (isPinching && pinchAnchorRef.current) {
         // Dragging: Calculate angle from current position BACK to the anchor (slingshot pull)
         const dx = pinchAnchorRef.current.x - mappedX;
         const dy = pinchAnchorRef.current.y - mappedY;

         // Only update angle if we pulled back far enough (deadzone to avoid jitter)
         if (Math.sqrt(dx*dx + dy*dy) > 20) {
             let targetAngle = Math.atan2(dy, dx);
             
             // Clamp angle so we only shoot upwards
             if (targetAngle > -0.2) targetAngle = -0.2;
             if (targetAngle < -Math.PI + 0.2) targetAngle = -Math.PI + 0.2;

             aimAngleRef.current = aimAngleRef.current + (targetAngle - aimAngleRef.current) * SMOOTHING_FACTOR;
         }
      }
    }

    if (wasPinchingRef.current && !isPinching) {
      if (!projectileRef.current && pinchAnchorRef.current) {
         shoot();
      }
      pinchAnchorRef.current = null; // Reset anchor on release
    }
    
    wasPinchingRef.current = isPinching;
  };

  const shoot = () => {
     const angle = aimAngleRef.current;
     projectileRef.current = {
       x: LAUNCHER_POS.x,
       y: LAUNCHER_POS.y,
       vx: Math.cos(angle) * PROJECTILE_SPEED,
       vy: Math.sin(angle) * PROJECTILE_SPEED,
       color: currentBubbleColorRef.current,
       active: true
     };
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    // Clear with black to match screenshot
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw Grid
    const grid = gridRef.current;
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        const b = grid[r][c];
        if (b && b.active) {
            drawBubble(ctx, b.x, b.y, b.color);
        }
      }
    }
    
    fallingBubblesRef.current.forEach(b => {
      drawBubble(ctx, b.x, b.y, b.color);
    });

    particlesRef.current.forEach(p => {
        const progress = p.life / p.maxLife; 
        const alpha = Math.max(0, progress);
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        if (p.type === 'burst') {
            const scale = 1 + (1 - progress) * 0.5;
            drawBubble(ctx, p.x, p.y, p.color, p.size * scale);
        } else {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
        }
        
        ctx.restore();
    });

    if (!projectileRef.current) {
        drawBubble(ctx, LAUNCHER_POS.x, LAUNCHER_POS.y, currentBubbleColorRef.current);
    }

    if (projectileRef.current) {
        drawBubble(ctx, projectileRef.current.x, projectileRef.current.y, projectileRef.current.color);
    }

    if (gestureStateRef.current.detected && !projectileRef.current && pinchAnchorRef.current) {
        ctx.beginPath();
        ctx.moveTo(LAUNCHER_POS.x, LAUNCHER_POS.y);
        const aimLen = 800;
        ctx.lineTo(
            LAUNCHER_POS.x + Math.cos(aimAngleRef.current) * aimLen, 
            LAUNCHER_POS.y + Math.sin(aimAngleRef.current) * aimLen
        );
        ctx.strokeStyle = '#4ade80';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 10]);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw the slingshot string (from anchor to current finger) on the screen for visual feedback
        const mappedX = gestureStateRef.current.indexTip.x * CANVAS_WIDTH;
        const mappedY = gestureStateRef.current.indexTip.y * CANVAS_HEIGHT;

        ctx.beginPath();
        ctx.moveTo(pinchAnchorRef.current.x, pinchAnchorRef.current.y);
        ctx.lineTo(mappedX, mappedY);
        ctx.strokeStyle = 'rgba(255, 100, 100, 0.8)';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(pinchAnchorRef.current.x, pinchAnchorRef.current.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
    }
    
    if (gestureStateRef.current.detected) {
        const hx = gestureStateRef.current.indexTip.x * CANVAS_WIDTH;
        const hy = gestureStateRef.current.indexTip.y * CANVAS_HEIGHT;
        
        ctx.beginPath();
        ctx.arc(hx, hy, 10, 0, Math.PI * 2);
        ctx.fillStyle = gestureStateRef.current.isPinching ? '#4ade80' : 'white';
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
  };

  const drawBubble = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, radius: number = BUBBLE_RADIUS) => {
    ctx.beginPath();
    ctx.arc(x, y, radius - 1, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(x - radius/4, y - radius/4, radius/10, x, y, radius);
    grad.addColorStop(0, 'white');
    grad.addColorStop(0.3, color);
    grad.addColorStop(1, adjustColor(color, -40)); 
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(x - radius/3, y - radius/3, radius/4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fill();
  };

  const adjustColor = (color: string, amount: number) => {
      const clamp = (val: number) => Math.min(Math.max(val, 0), 255);
      
      // Handle hex colors
      if (color.startsWith('#')) {
          const hex = color.replace('#', '');
          const num = parseInt(hex, 16);
          let r = (num >> 16) + amount;
          let g = ((num >> 8) & 0x00FF) + amount;
          let b = (num & 0x00FF) + amount;
          return `#${(1 << 24 | clamp(r) << 16 | clamp(g) << 8 | clamp(b)).toString(16).slice(1)}`;
      }
      
      // Fallback/Extensions for other formats if needed
      return color; 
  };

  const loop = () => {
    if (gameState === GameState.PLAYING) {
        updateGestures();
        updatePhysics();
    }
    
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) draw(ctx);

    animationFrameRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [gameState]);

  return (
    <canvas 
      ref={canvasRef} 
      width={CANVAS_WIDTH} 
      height={CANVAS_HEIGHT}
      className="max-h-[90vh] h-auto w-auto aspect-[3/4] shadow-2xl rounded-2xl bg-black border border-zinc-800"
    />
  );
};

export default GameCanvas;