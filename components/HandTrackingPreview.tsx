import React, { useEffect, useRef } from 'react';
import { HandGestureState } from '../types';

interface Props {
  videoRef: React.RefObject<HTMLVideoElement>;
  gestureStateRef: React.MutableRefObject<HandGestureState>;
}

const HandTrackingPreview: React.FC<Props> = ({ videoRef, gestureStateRef }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>();

  useEffect(() => {
    const draw = () => {
      if (canvasRef.current && videoRef.current && videoRef.current.readyState >= 2) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          const width = canvasRef.current.width;
          const height = canvasRef.current.height;

          // Clear
          ctx.clearRect(0, 0, width, height);

          // Draw Video Frame (Mirrored to match background)
          ctx.save();
          ctx.scale(-1, 1);
          ctx.translate(-width, 0);
          ctx.drawImage(videoRef.current, 0, 0, width, height);

          // Draw Landmarks overlay if detected
          const { detected, landmarks } = gestureStateRef.current;
          if (detected && landmarks) {
            ctx.fillStyle = '#60a5fa'; // Blue-400 dots
            ctx.strokeStyle = '#93c5fd'; // Blue-300 lines
            ctx.lineWidth = 3;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';

            // Draw connections (simple lines)
            // Thumb
            drawFinger(ctx, landmarks, [0,1,2,3,4], width, height);
            // Index
            drawFinger(ctx, landmarks, [0,5,6,7,8], width, height);
            // Middle
            drawFinger(ctx, landmarks, [0,9,10,11,12], width, height);
            // Ring
            drawFinger(ctx, landmarks, [0,13,14,15,16], width, height);
            // Pinky
            drawFinger(ctx, landmarks, [0,17,18,19,20], width, height);

            // Draw points
            for (const lm of landmarks) {
                const cx = lm.x * width;
                const cy = lm.y * height;
                
                ctx.beginPath();
                ctx.arc(cx, cy, 4, 0, 2 * Math.PI);
                ctx.fill();
            }
          }
          ctx.restore();
        }
      }
      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [videoRef, gestureStateRef]);

  const drawFinger = (ctx: CanvasRenderingContext2D, landmarks: any[], indices: number[], w: number, h: number) => {
      ctx.beginPath();
      for (let i = 0; i < indices.length - 1; i++) {
          const p1 = landmarks[indices[i]];
          const p2 = landmarks[indices[i+1]];
          ctx.moveTo(p1.x * w, p1.y * h);
          ctx.lineTo(p2.x * w, p2.y * h);
      }
      ctx.stroke();
  };

  return (
    <div className="bg-zinc-900 p-2 rounded-xl border-2 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
        <div className="text-blue-400 text-xs font-bold font-mono mb-1 text-center tracking-widest uppercase">Input Feed</div>
        <canvas 
            ref={canvasRef} 
            width={320} 
            height={240} 
            className="rounded-lg bg-zinc-950 block w-full h-auto"
        />
    </div>
  );
};

export default HandTrackingPreview;