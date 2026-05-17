import React, { FC, useCallback, useEffect, useRef, useState } from "react";
import { css } from "@emotion/css";
import { FaceLandmarker, FilesetResolver, FaceLandmarkerResult } from "@mediapipe/tasks-vision";
import { drawLandmarks } from "../utils/drawCanvas";
import { computeExpressionMetrics, ExpressionMetrics } from "../utils/expressionMetrics";
import { Gauge } from "./Gauge";
import { EngagementTimeline } from "./EngagementTimeline";
import { HeadPoseAlert } from "./HeadPoseAlert";

const VIDEO_WIDTH = 1280;
const VIDEO_HEIGHT = 720;
const TIMELINE_MAX_POINTS = 120;

export const App: FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const animationFrameRef = useRef<number>(0);
  const lastTimestampRef = useRef<number>(0);

  const [metrics, setMetrics] = useState<ExpressionMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [engagementHistory, setEngagementHistory] = useState<number[]>([]);
  const [showMesh, setShowMesh] = useState(true);

  const lastTimelineSampleRef = useRef<number>(0);

  const initializeFaceLandmarker = useCallback(async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        const faceLandmarker = await FaceLandmarker.createFromOptions( vision, {
              baseOptions: {
                modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
                delegate: "GPU",
              },
              runningMode: "VIDEO",
              numFaces: 1,
              outputFaceBlendshapes: true,
              outputFacialTransformationMatrixes: true,
        });

        faceLandmarkerRef.current = faceLandmarker;
		setIsLoading(false);
      } catch (err) {
        	console.error( "Failed to initialize FaceLandmarker:", err);
        	setError("Failed to load face detection model.");
        	setIsLoading(false);
      }
    }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: VIDEO_WIDTH },
            height: { ideal: VIDEO_HEIGHT },
            facingMode: "user",
          },

          audio: false,
        });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error( "Camera access denied:",err);
      setError("Camera access denied. Please allow permissions.");
    }
  }, []);

  const processFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const faceLandmarker = faceLandmarkerRef.current;

    if (!video || !canvas || !faceLandmarker || video.readyState < 2) {
      	animationFrameRef.current =requestAnimationFrame(processFrame);
		return;
    }
    const now = performance.now();

    if (now === lastTimestampRef.current) {
		animationFrameRef.current = requestAnimationFrame(processFrame);
      	return;
    }

    lastTimestampRef.current = now;

    const result: FaceLandmarkerResult = faceLandmarker.detectForVideo(video, now );

    const ctx = canvas.getContext("2d");

    if (ctx) {
      if (showMesh) {
        drawLandmarks(ctx, result, video);
      } else {
        ctx.clearRect( 0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
        ctx.drawImage( video, 0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
      }
    }

    if ( result.faceBlendshapes && result.faceBlendshapes.length > 0 ) {
      const expressionMetrics = computeExpressionMetrics(result.faceBlendshapes);
      setMetrics(expressionMetrics);

      if (expressionMetrics && now - lastTimelineSampleRef.current >500) {
        lastTimelineSampleRef.current = now;
		setEngagementHistory((prev) => {
          const next = [...prev, expressionMetrics.expressiveness,];
		  if ( next.length > TIMELINE_MAX_POINTS) {
            return next.slice(next.length - TIMELINE_MAX_POINTS);
          }
          return next;
        });
      }
    }

    animationFrameRef.current =requestAnimationFrame(processFrame);
  }, [showMesh]);

  useEffect(() => {
    initializeFaceLandmarker();
    startCamera();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (faceLandmarkerRef.current) { 
		faceLandmarkerRef.current.close();
      }
    };
  }, [initializeFaceLandmarker,startCamera,]);

  useEffect(() => {
    if (!isLoading && !error) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame( animationFrameRef.current );
      }
    };
  }, [isLoading, error, processFrame]);

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <video
        ref={videoRef}
        className={styles.hiddenVideo}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
        playsInline
        muted
      />

      <div className={styles.mainArea}>
        <div className={styles.canvasWrapper}>
          {isLoading && (
            <div className={styles.loading}>
              Loading face detection model...
            </div>
          )}

          <canvas
            ref={canvasRef}
            className={styles.canvas}
            width={VIDEO_WIDTH}
            height={VIDEO_HEIGHT}
          />

          {metrics && (
            <div
              className={styles.alertOverlay}
            >
              <HeadPoseAlert
                lookingDown={
                  metrics.headPose
                    .lookingDown
                }
                lookingAway={
                  metrics.headPose
                    .lookingAway
                }
              />
            </div>
          )}

          {metrics &&
            metrics.smile > 0.3 && (
              <div
                className={
                  styles.smileOverlay
                }
              >
                😊 Great expression
              </div>
            )}
        </div>

        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>
            Communication Coach
          </h2>

          <div className={styles.controls}>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={showMesh}
                onChange={(e) =>
                  setShowMesh(
                    e.target.checked
                  )
                }
              />

              Show Face Mesh
            </label>
          </div>

          <div className={styles.gauges}>
            <Gauge
              label="Eye Contact"
              value={
                metrics?.eyeContact ?? 0
              }
              color="#22d3ee"
              icon="👁"
            />

            <Gauge
              label="Smile"
              value={metrics?.smile ?? 0}
              color="#facc15"
              icon="😊"
            />

            <Gauge
              label="Expressive"
              value={
                metrics?.expressiveness ??
                0
              }
              color="#a78bfa"
              icon="🎭"
            />

            <Gauge
              label="Eyes Open"
              value={
                metrics?.eyeOpenness ??
                0
              }
              color="#fb923c"
              icon="👀"
            />
          </div>

          <div
            className={
              styles.timelineSection
            }
          >
            <EngagementTimeline
              history={engagementHistory}
              maxPoints={
                TIMELINE_MAX_POINTS
              }
            />
          </div>

          <div className={styles.tips}>
            <h3 className={styles.tipsTitle}>
              Tips
            </h3>

            <ul
              className={
                styles.tipsList
              }
            >
              <li>
                Maintain eye contact with
                the camera
              </li>

              <li>
                Keep your head level and
                centered
              </li>

              <li>
                Smile naturally when making
                key points
              </li>

              <li>
                Use facial expressions to
                emphasize ideas
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// styles

const styles = {
  container: css`
    width: 100%;
    min-height: 100vh;
    background-color: #0f0f0f;
    color: #ffffff;

    font-family:
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      sans-serif;
  `,

  hiddenVideo: css`
    position: absolute;
    opacity: 0;
    pointer-events: none;

    width: 0;
    height: 0;
  `,

  mainArea: css`
    display: flex;
    gap: 20px;

    padding: 20px;

    max-width: 100%;
    max-height: 100%;

    align-items: flex-start;
  `,

  canvasWrapper: css`
    position: relative;

    border-radius: 12px;
    overflow: hidden;

    box-shadow: 0 4px 24px
      rgba(0, 0, 0, 0.5);
  `,

  canvas: css`
    display: block;

    width: 854px;
    height: 480px;

    background-color: #1e1e1e;
  `,

  loading: css`
    position: absolute;

    top: 50%;
    left: 50%;

    transform: translate(-50%, -50%);

    color: #aaa;
    font-size: 14px;

    z-index: 10;

    animation: bounceIn 0.3s ease;

    @keyframes bounceIn {
      0% {
        transform: translate(-50%, -50%)
          scale(0);
      }

      50% {
        transform: translate(-50%, -50%)
          scale(1.2);
      }

      100% {
        transform: translate(-50%, -50%)
          scale(1);
      }
    }
  `,

  alertOverlay: css`
    position: absolute;

    top: 12px;
    left: 50%;

    transform: translateX(-50%);

    z-index: 10;
  `,

  smileOverlay: css`
    position: absolute;

    bottom: 12px;
    right: 12px;

    font-size: 32px;

    animation: bounceIn 0.3s ease;

    @keyframes bounceIn {
      0% {
        transform: scale(0);
      }

      50% {
        transform: scale(1.2);
      }

      100% {
        transform: scale(1);
      }
    }
  `,

  panel: css`
    width: 280px;

    background-color: #1a1a2e;

    border-radius: 12px;

    padding: 20px;

    display: flex;
    flex-direction: column;

    gap: 16px;

    box-shadow: 0 4px 24px
      rgba(0, 0, 0, 0.3);
  `,

  panelTitle: css`
    font-size: 16px;
    font-weight: 600;

    margin: 0;

    color: #e0e0e0;
  `,

  controls: css`
    display: flex;
    flex-direction: column;

    gap: 8px;
  `,

  toggle: css`
    display: flex;
    align-items: center;

    gap: 8px;

    font-size: 12px;
    color: #aaa;

    cursor: pointer;

    input {
      accent-color: #22d3ee;
    }
  `,

  gauges: css`
    display: grid;

    grid-template-columns: 1fr 1fr;

    gap: 12px;
  `,

  timelineSection: css`
    margin-top: 4px;
  `,

  tips: css`
    border-top: 1px solid #333;

    padding-top: 12px;
  `,

  tipsTitle: css`
    font-size: 12px;
    font-weight: 600;

    margin: 0 0 8px 0;

    color: #aaa;

    text-transform: uppercase;
    letter-spacing: 0.5px;
  `,

  tipsList: css`
    margin: 0;

    padding: 0 0 0 16px;

    font-size: 11px;

    color: #888;

    line-height: 1.6;

    li {
      margin-bottom: 4px;
    }
  `,

  error: css`
    color: #f87171;

    font-size: 14px;
    text-align: center;

    padding: 20px;
  `,
};