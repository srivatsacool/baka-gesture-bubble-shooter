# Baka Gesture Bubble Shooter

A hands-free, computer-vision-powered clone of the classic Bubble Shooter game. Players use hand gestures to aim and shoot bubbles, leveraging real-time camera feed and physical interactions rendered on an HTML5 Canvas.

## Abstract
This project presents an interactive, web-based implementation of a classic arcade game reimagined through modern human-computer interaction paradigms. Utilizing computer vision (CV) and machine learning (ML) models running locally in the browser, the application tracks hand landmarks to interpret user gestures continuously. These gestures serve as primary input mechanisms to control a custom-built, 2D physics engine handling projectile motion, collision detection, and clustered chain reactions. The resulting system demonstrates the viability of real-time, high-performance edge inference for immersive gaming experiences without specialized hardware peripherals.

## Introduction
Traditional arcade games rely heavily on physical controllers, keyboards, or touch screens. "Baka Gesture Bubble Shooter" aims to bridge the gap between physical motion and digital play by introducing entirely hands-free controls. Through a simple web camera, the application tracks the user's index finger and thumb, translating the "pinch" and "release" motions into targeting and firing mechanics. It integrates a lightweight ML hand-tracking model within a responsive React single-page application (SPA).

## Problem Statement
Standard computer interfaces restrict gaming accessibility and natural interaction by enforcing physical contact with hardware (mice, keyboards, touchscreens). Developing robust, real-time, browser-centric optical tracking capable of sustaining minimum input latency is challenging. This project addresses the need for a seamlessly integrated, hardware-agnostic, and low-latency gesture recognition system tailored for continuous, fast-paced arcade gameplay.

## Objectives
- To implement a reliable computer vision interface that tracks hand landmarks in real-time.
- To design a custom 2D physics engine for projectile arcs, realistic bouncing, particle emissions, and clustered block destruction.
- To formulate an intuitive control scheme where pinching dictates aiming and releasing executes firing.
- To ensure client-side execution for strict privacy and minimal network latency overhead.
- To build a scalable, maintainable React architecture for UI, Game HUD, and Canvas rendering.

## System Architecture

The system follows a client-side architecture where inference, logic, and rendering occur natively in the browser. 

```text
+-------------------------------------------------------------+
|                     Browser Environment                     |
|                                                             |
|  +---------------+    +-------------------+    +---------+  |
|  |    Webcam     |--->|  MediaPipe Hand   |--->| React   |  |
|  | HTMLVideoElem |    |    Landmarker     |    | States  |  |
|  +---------------+    +-------------------+    +---------+  |
|                                                     |       |
|  +---------------+    +-------------------+         |       |
|  |   HTML5       |<---|  Custom Physics & |<--------+       |
|  |   Canvas      |    |   Collision Engine|                 |
|  +---------------+    +-------------------+                 |
+-------------------------------------------------------------+
```

## Data Flow Diagram (DFD)

### Level 0 (Context Diagram)
```text
[ User ] --(Hand Movements/Video Frames)--> [ Game Application ] --(Visual Output/Score)--> [ User ]
```

### Level 1 (Detailed Flow)
```text
[ Webcam ] 
    | 
   (Raw Video Frames) 
    v 
[ Vision Module: useHandTracking ] 
    | 
   (Hand Landmarks / Pinch State / Distance)
    v
[ React App State Manager ]
    | 
   (Mapped Coordinates / Action Events)
    v
[ Physics & Grid Engine (GameCanvas) ]
    |--> (Projectile Motion & Vector Math)
    |--> (Grid Traversal & Cluster Detection)
    |--> (Debris & Particle Physics)
    v
[ HTML5 Render Context (Canvas 2D) ]
    |
   (Rendered Frames)
    v
[ Display ]
```

## Technology Stack

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19 / Vite | Component architecture and state management |
| **Language** | TypeScript | Strong typing and structural integrity |
| **Computer Vision** | MediaPipe Tasks Vision | Real-time hand landmark detection (WASM/GPU) |
| **Rendering** | HTML5 Canvas API | Performant 2D graphics rendering for game loop |
| **Styling** | Tailwind CSS / Vanilla CSS | Responsive UI, transitions, and HUD overlays |
| **Icons** | Lucide React | Minimalist UI iconography |

## Data / Input Description
- **Video Feed**: Continuous high-resolution input from the user's primary webcam.
- **Hand Landmarks**: 21 3D spatial coordinates normalized (0.0 to 1.0) outputted by the model. The core points utilized are `INDEX_FINGER_TIP` (landmark 8) and `THUMB_TIP` (landmark 4).
- **Derived Gesture Input**: Distance between the index and thumb tips, evaluated against a threshold (< 0.08) to trigger boolean "Is Pinching" and "Is Released" states.

## Model / Core Logic Explanation
1. **Grid Logic (Odd-R Hexagonal Pattern)**: The bubbles are stored in a 2D matrix structure evaluated as an odd-row offset grid. Neighbors are calculated via spatial radius matching and 6-directional hexagonal relative index traversals.
2. **Physics Engine**: Operates via a standard `requestAnimationFrame` loop. Projectiles possess (`x`, `y`, `vx`, `vy`) components. Vector mathematics drive elastic collision bounces off canvas walls. 
3. **Cluster Algorithms**:
   - *Matching Clusters*: A Breadth-First Search (BFS) algorithm checks adjacent nodes matching the instantiated color to invoke destruction.
   - *Floating Clusters*: Post-destruction, a second BFS marks all bubbles connected to the ceiling (row 0). Unmarked (floating) clusters are physically liberated, transferring from the static Grid to the 'Falling Debris' logic step.
4. **Debris & Particles**: Falling items simulate gravity, friction, static repulsion (avoiding alive bubbles), and elastic boundary impacts. Burst events spawn smaller particles decaying over an ephemeral lifeline.

## Training / Execution Flow
*(Inference Only - Pre-trained Model)*
1. **Initialization**: MediaPipe WASM and model files are downloaded from Google Cloud Storage via CDN on mount.
2. **Detection Loop**: `detectForVideo` processes video frames via the GPU delegate synchronously alongside the render loop.
3. **State Sync**: Detected data writes to a mutable `React.useRef` object (`gestureStateRef`) to prevent excessive component re-renders while allowing the 60FPS Canvas logic instant access.

## Web App / UI Flow
1. **Loading State**: Displays spinner while WASM components and webcam permissions are negotiated.
2. **Main Menu**: Offers control instructions and a toggle to officially initialize the `GameState.PLAYING`.
3. **HUD/Gameplay**: A persistent UI layering Score, Level, and Next Bubble Queue above an invisible video feed (for aesthetic focus) and the centralized Canvas element.
4. **Game Over**: Triggered if static bubbles reach the lowest row. Presents final score and restart capability.

## Limitations
- **Lighting Constraints**: Hand Landmarker heavily relies on adequate room lighting for accurate tracking depth.
- **Occlusion Issues**: Objects obscuring the hand, or overlapping hands, can confuse the single-hand detection constraint.
- **Performance Overhead**: Execution on lower-end devices might suffer thermal throttling due to browser-bound WASM GPU reliance combined with Canvas loops.

## Future Enhancements
- Support for dual-hand tracking allowing for item-swapping or power-ups.
- Implementing level variations, obstacles, and varied bubble shapes.
- Leaderboards and local persistent storage.
- Adding Web Audio API sound effects synced to interactions and collisions.

## How to Run the Project

1. **Clone the repository** (if applicable) and navigate to the project directory.
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Start the development server**:
   ```bash
   npm run dev
   ```
4. **Build for production** (generates static files for deployment):
   ```bash
   npm run build
   ```
5. **Preview the production build**:
   ```bash
   npm run preview
   ```

*Note: Allow webcam permissions when prompted by the browser.*

## Author / Credits
- **Developer**: Open Source Contribution
- **Models Built With**: Google MediaPipe
#   b a k a - g e s t u r e - b u b b l e - s h o o t e r  
 