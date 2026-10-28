import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { HandLandmarks } from '../types/vision';

export class MediaPipeService {
  private static landmarker: HandLandmarker | null = null;
  private static isLoading = false;
  private static lastSmoothedLandmarks: HandLandmarks | null = null;

  /**
   * Filtro de suavizado temporal (EMA) para eliminar el temblor o jitter de los puntos.
   */
  public static smoothLandmarks(current: HandLandmarks, alpha = 0.68): HandLandmarks {
    if (!this.lastSmoothedLandmarks || this.lastSmoothedLandmarks.length !== current.length) {
      this.lastSmoothedLandmarks = current;
      return current;
    }

    const smoothed = current.map((p, i) => {
      const prev = this.lastSmoothedLandmarks![i];
      return {
        x: alpha * p.x + (1 - alpha) * prev.x,
        y: alpha * p.y + (1 - alpha) * prev.y,
        z: alpha * (p.z || 0) + (1 - alpha) * (prev.z || 0),
      };
    });

    this.lastSmoothedLandmarks = smoothed;
    return smoothed;
  }

  /**
   * Inicializa el modelo de Hand Landmarker acelerado por WASM / WebGL.
   */
  public static async initialize(onStatusUpdate?: (msg: string) => void): Promise<HandLandmarker> {
    if (this.landmarker) return this.landmarker;
    if (this.isLoading) {
      while (this.isLoading) {
        await new Promise(r => setTimeout(r, 100));
      }
      if (this.landmarker) return this.landmarker;
    }

    this.isLoading = true;
    try {
      onStatusUpdate?.('Cargando motor de visión WebAssembly...');
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      );

      onStatusUpdate?.('Descargando modelo de seguimiento de manos...');
      this.landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numHands: 1,
        minHandDetectionConfidence: 0.6,
        minHandPresenceConfidence: 0.6,
        minTrackingConfidence: 0.6
      });

      onStatusUpdate?.('¡Modelo de IA listo!');
      return this.landmarker;
    } catch (error) {
      console.error('Error inicializando MediaPipe HandLandmarker:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Procesa un cuadro del elemento <video> en tiempo real.
   */
  public static detectForVideo(video: HTMLVideoElement, timestamp: number): HandLandmarks | null {
    if (!this.landmarker || video.readyState < 2) return null;

    try {
      const results = this.landmarker.detectForVideo(video, timestamp);
      if (results.landmarks && results.landmarks.length > 0) {
        const rawLandmarks = results.landmarks[0] as HandLandmarks;
        return this.smoothLandmarks(rawLandmarks);
      } else {
        this.lastSmoothedLandmarks = null;
      }
    } catch (err) {
      // Manejar desincronización de timestamps o pausas de video
      console.warn('Frame skip en visión:', err);
    }

    return null;
  }

  /**
   * Dibuja los 21 puntos y conexiones en un elemento <canvas>.
   */
  public static drawHand(ctx: CanvasRenderingContext2D, landmarks: HandLandmarks, width: number, height: number): void {
    if (!landmarks || landmarks.length < 21) return;

    // Conexiones de los dedos según la topología de MediaPipe
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4],       // Pulgar
      [0, 5], [5, 6], [6, 7], [7, 8],       // Índice
      [5, 9], [9, 10], [10, 11], [11, 12],  // Medio
      [9, 13], [13, 14], [14, 15], [15, 16],// Anular
      [13, 17], [17, 18], [18, 19], [19, 20],// Meñique
      [0, 17]                               // Base de la palma
    ];

    ctx.save();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#38bdf8'; // Azul cielo accesible
    ctx.fillStyle = '#38bdf8';

    // Dibujar líneas esqueléticas
    for (const [start, end] of connections) {
      const p1 = landmarks[start];
      const p2 = landmarks[end];
      ctx.beginPath();
      ctx.moveTo(p1.x * width, p1.y * height);
      ctx.lineTo(p2.x * width, p2.y * height);
      ctx.stroke();
    }

    // Dibujar articulaciones (puntos)
    for (let i = 0; i < landmarks.length; i++) {
      const p = landmarks[i];
      const isTip = [4, 8, 12, 16, 20].includes(i);
      ctx.beginPath();
      ctx.arc(p.x * width, p.y * height, isTip ? 6 : 4, 0, 2 * Math.PI);
      ctx.fillStyle = isTip ? '#22c55e' : '#f8fafc'; // Puntas verdes, nudillos blancos
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    ctx.restore();
  }
}
