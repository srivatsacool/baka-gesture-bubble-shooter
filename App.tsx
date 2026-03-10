import React, { useState, useRef, useEffect } from 'react';
import { Camera, Hand, Play, RefreshCw } from 'lucide-react';
import WebcamBackground from './components/WebcamBackground';
import GameCanvas from './components/GameCanvas';
import HandTrackingPreview from './components/HandTrackingPreview';
import HUD from './components/HUD';
import { useHandTracking } from './vision/useHandTracking';
import { GameState, BubbleColor } from './types';

const App: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isLoaded, gestureStateRef } = useHandTracking(videoRef);
  
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [nextBubbleColor, setNextBubbleColor] = useState<BubbleColor>(BubbleColor.RED);

  const startGame = () => {
    setScore(0);
    setLevel(1);
    setGameState(GameState.PLAYING);
  };

  const handleScoreUpdate = (points: number) => {
    setScore(prev => prev + points);
    // Simple level up logic
    if (score + points > level * 2000) {
        setLevel(l => l + 1);
    }
  };

  const handleGameOver = () => {
    setGameState(GameState.GAME_OVER);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col items-center justify-center font-sans bg-black">
      {/* Invisible Webcam Source */}
      <WebcamBackground videoRef={videoRef} />
      
      {/* HUD Layer */}
      {gameState === GameState.PLAYING && (
          <HUD score={score} level={level} nextBubbleColor={nextBubbleColor} />
      )}

      {/* Main Content Area */}
      <div className="relative z-10 flex items-center justify-center gap-8 p-4 w-full max-w-7xl h-full">
        
        {/* Game Container */}
        <div className="relative">
            {isLoaded ? (
            <div className="relative">
                <GameCanvas 
                gestureStateRef={gestureStateRef}
                gameState={gameState}
                onScoreUpdate={handleScoreUpdate}
                onGameOver={handleGameOver}
                setNextBubbleColor={setNextBubbleColor}
                />
                
                {/* Overlays */}
                {gameState === GameState.MENU && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center text-white p-8 text-center animate-fade-in border border-white/10">
                    <h1 className="text-4xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                        GESTURE BUBBLE SHOOTER
                    </h1>
                    <p className="mb-8 text-gray-300">Hands-free Gaming Experience</p>
                    
                    <div className="grid grid-cols-2 gap-6 mb-8 text-sm">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
                                <Hand size={24} className="text-blue-400" />
                            </div>
                            <span className="text-gray-400">Pinch & Pull Back to AIM</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
                                <div className="w-4 h-4 bg-blue-400 rounded-full shadow-[0_0_10px_rgba(96,165,250,0.8)]"></div>
                            </div>
                            <span className="text-gray-400">Release to SHOOT</span>
                        </div>
                    </div>

                    <button 
                        onClick={startGame}
                        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-3 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-xl shadow-blue-500/30 border border-white/20"
                    >
                        <Play fill="white" size={20} /> START GAME
                    </button>
                </div>
                )}

                {gameState === GameState.GAME_OVER && (
                <div className="absolute inset-0 bg-black/90 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center text-white p-8 text-center border border-red-500/30">
                    <h2 className="text-4xl font-bold mb-4 text-red-500">GAME OVER</h2>
                    <p className="text-2xl mb-8">Final Score: {score}</p>
                    <button 
                        onClick={startGame}
                        className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded-full font-bold text-lg hover:scale-105 transition-transform"
                    >
                        <RefreshCw size={20} /> PLAY AGAIN
                    </button>
                </div>
                )}
            </div>
            ) : (
            <div className="flex flex-col items-center justify-center text-white bg-black/50 p-8 rounded-2xl backdrop-blur-md border border-white/10 w-[600px] h-[800px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
                <p className="text-lg font-medium">Initializing Computer Vision...</p>
                <p className="text-xs text-gray-400 mt-2">Please allow camera access</p>
            </div>
            )}
        </div>

        {/* Right Side Panel - Preview */}
        {isLoaded && (
            <div className="hidden lg:flex flex-col gap-4 animate-slide-in-right self-center">
               <HandTrackingPreview 
                 videoRef={videoRef} 
                 gestureStateRef={gestureStateRef}
               />
               <div className="bg-zinc-900/80 p-4 rounded-xl border border-zinc-700 text-white text-sm w-[320px]">
                   <h3 className="font-bold mb-2 flex items-center gap-2 text-blue-400">
                       <Camera size={16} /> Controls
                   </h3>
                   <ul className="space-y-2 text-gray-400 text-xs">
                       <li className="flex items-center gap-2">
                           <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.8)]"></span>
                           Pinch index & thumb
                       </li>
                       <li className="flex items-center gap-2">
                           <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]"></span>
                           Pull hand back to aim (Slingshot)
                       </li>
                       <li className="flex items-center gap-2">
                           <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_5px_white]"></span>
                           Release pinch to shoot
                       </li>
                   </ul>
               </div>
            </div>
        )}

      </div>

      <div className="absolute bottom-4 text-white/40 text-xs text-center pointer-events-none font-mono tracking-widest uppercase">
        Developed by Build.Srivatsa • Powered by MediaPipe & React
      </div>
    </div>
  );
};

export default App;