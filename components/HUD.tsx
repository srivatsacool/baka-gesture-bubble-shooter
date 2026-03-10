import React from 'react';
import { Target, Trophy, PlayCircle } from 'lucide-react';
import { BubbleColor } from '../types';

interface Props {
  score: number;
  level: number;
  nextBubbleColor: BubbleColor;
}

const HUD: React.FC<Props> = ({ score, level, nextBubbleColor }) => {
  return (
    <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start pointer-events-none z-50">
      <div className="flex flex-col gap-2">
        <div className="bg-zinc-900/90 backdrop-blur-md p-3 rounded-xl border border-zinc-700 text-white shadow-lg min-w-[120px]">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-gray-400">
                <Trophy size={14} className="text-yellow-500" /> Score
            </div>
            <div className="text-2xl font-bold font-mono text-white">{score.toString().padStart(6, '0')}</div>
        </div>

        <div className="bg-zinc-900/90 backdrop-blur-md p-3 rounded-xl border border-zinc-700 text-white shadow-lg">
             <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-gray-400">
                <Target size={14} className="text-red-500" /> Level
            </div>
            <div className="text-2xl font-bold font-mono text-white">{level}</div>
        </div>
      </div>

      <div className="bg-zinc-900/90 backdrop-blur-md p-3 rounded-xl border border-zinc-700 text-white shadow-lg flex flex-col items-center">
         <div className="text-xs uppercase tracking-wider text-gray-400 mb-2">Next</div>
         <div 
            className="w-12 h-12 rounded-full shadow-inner border-2 border-white/10"
            style={{ backgroundColor: nextBubbleColor }}
         />
      </div>
    </div>
  );
};

export default HUD;