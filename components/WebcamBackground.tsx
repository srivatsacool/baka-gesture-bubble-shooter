import React, { useEffect } from 'react';

interface Props {
  videoRef: React.RefObject<HTMLVideoElement>;
}

const WebcamBackground: React.FC<Props> = ({ videoRef }) => {
  useEffect(() => {
    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
      }
    };

    startWebcam();
  }, [videoRef]);

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-0">
        {/* Video Layer - Mirrored to match user interaction */}
        <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
            playsInline
            muted
        />
        {/* Dark Overlay with Blur */}
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
    </div>
  );
};

export default WebcamBackground;