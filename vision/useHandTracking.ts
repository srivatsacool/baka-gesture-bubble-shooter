import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker, DrawingUtils } from "@mediapipe/tasks-vision";
import { HandGestureState } from '../types';
import { distance } from './gestureUtils';

export const useHandTracking = (videoRef: React.RefObject<HTMLVideoElement>) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const requestRef = useRef<number>();
  
  // Store latest gesture state in a ref to avoid react render loop issues
  const gestureStateRef = useRef<HandGestureState>({
    isPinching: false,
    pinchDistance: 0,
    indexTip: { x: 0, y: 0 },
    thumbTip: { x: 0, y: 0 },
    detected: false,
  });

  useEffect(() => {
    const initMediaPipe = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
        );
        
        handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });
        
        setIsLoaded(true);
      } catch (error) {
        console.error("Error initializing MediaPipe:", error);
      }
    };

    initMediaPipe();

    return () => {
      if (handLandmarkerRef.current) {
        handLandmarkerRef.current.close();
      }
    };
  }, []);

  const detect = () => {
    if (videoRef.current && handLandmarkerRef.current && isLoaded) {
      // Ensure video is playing and has data
      if (videoRef.current.readyState >= 2) {
         const startTimeMs = performance.now();
         const results = handLandmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);

         if (results.landmarks && results.landmarks.length > 0) {
            const landmarks = results.landmarks[0];
            const indexTip = landmarks[8];
            const thumbTip = landmarks[4];
            
            // Mirror x coordinate because webcam is mirrored in CSS
            // However, landmarks from MediaPipe are normalized 0-1 from left to right of the source image.
            const iTip = { x: 1 - indexTip.x, y: indexTip.y };
            const tTip = { x: 1 - thumbTip.x, y: thumbTip.y };

            const dist = distance(iTip, tTip);
            
            gestureStateRef.current = {
              detected: true,
              indexTip: iTip,
              thumbTip: tTip,
              pinchDistance: dist,
              isPinching: dist < 0.08, // Adjust threshold if needed
              landmarks: landmarks
            };
         } else {
            gestureStateRef.current.detected = false;
            gestureStateRef.current.isPinching = false;
            gestureStateRef.current.landmarks = undefined;
         }
      }
    }
    requestRef.current = requestAnimationFrame(detect);
  };

  useEffect(() => {
    if (isLoaded) {
      requestRef.current = requestAnimationFrame(detect);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isLoaded]);

  return { isLoaded, gestureStateRef };
};