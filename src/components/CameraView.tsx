import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MediaPipeService } from '../vision/MediaPipeService';
import { HandLandmarks } from '../types/vision';
import { RefreshCw, AlertCircle, Sparkles, Eye, EyeOff } from 'lucide-react';

interface CameraViewProps {
  onLandmarksDetected: (landmarks: HandLandmarks | null) => void;
  isMirrored?: boolean;
}

export const CameraView: React.FC<CameraViewProps> = ({
  onLandmarksDetected,
  isMirrored = true,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  
  const [modelStatus, setModelStatus] = useState<string>('Iniciando visión por computadora...');
  const [isModelReady, setIsModelReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showSkeleton, setShowSkeleton] = useState(false); // Por defecto limpio sin puntos azules encima

  // 1. Inicializar MediaPipe HandLandmarker
  useEffect(() => {
    let isMounted = true;

    async function setupModel() {
      try {
        await MediaPipeService.initialize(status => {
          if (isMounted) setModelStatus(status);
        });
        if (isMounted) {
          setIsModelReady(true);
        }
      } catch (err) {
        console.error('Error cargando modelo de visión:', err);
        if (isMounted) {
          setCameraError('No se pudo cargar el modelo de visión artificial. Revisa tu conexión a internet.');
        }
      }
    }

    setupModel();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Iniciar Stream de Cámara
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.error('Error al acceder a la cámara:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Permiso de cámara denegado. Habilita el acceso en tu navegador para continuar.');
      } else {
        setCameraError('No se pudo conectar a la cámara web. Asegúrate de que no esté en uso por otra aplicación.');
      }
    }
  }, []);

  useEffect(() => {
    if (isModelReady) {
      startCamera();
    }

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isModelReady, startCamera]);

  // 3. Bucle de Detección en Tiempo Real
  const renderLoop = useCallback(
    (timestamp: number) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState >= 2) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Ajustar tamaño del canvas al video
          if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
          }

          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Detección con MediaPipe
          const landmarks = MediaPipeService.detectForVideo(video, timestamp);

          if (landmarks) {
            if (showSkeleton) {
              MediaPipeService.drawHand(ctx, landmarks, canvas.width, canvas.height);
            }
            onLandmarksDetected(landmarks);
          } else {
            onLandmarksDetected(null);
          }
        }
      }

      requestRef.current = requestAnimationFrame(renderLoop);
    },
    [onLandmarksDetected, showSkeleton]
  );

  useEffect(() => {
    requestRef.current = requestAnimationFrame(renderLoop);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [renderLoop]);

  return (
    <div className="relative w-full aspect-[4/3] bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center">
      {/* Video Element (Oculto a la vista directa, renderizado a través del canvas y layout espejado) */}
      <video
        ref={videoRef}
        playsInline
        muted
        className={`w-full h-full object-cover ${isMirrored ? 'scale-x-[-1]' : ''}`}
      />

      {/* Canvas Superpuesto con los Landmarks de la Mano */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full object-cover pointer-events-none ${
          isMirrored ? 'scale-x-[-1]' : ''
        }`}
      />

      {/* Estado de Carga Inicial del Modelo */}
      {!isModelReady && !cameraError && (
        <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-6 text-center z-20">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 mb-4 animate-pulse">
            <Sparkles className="w-6 h-6 animate-spin" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Cargando Inteligencia Artificial</h3>
          <p className="text-xs text-slate-400 max-w-sm">{modelStatus}</p>
        </div>
      )}

      {/* Mensaje de Error de Cámara */}
      {cameraError && (
        <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-6 text-center z-20">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Acceso a la Cámara</h3>
          <p className="text-xs text-slate-300 max-w-sm mb-6 leading-relaxed">{cameraError}</p>
          <button
            onClick={startCamera}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold shadow-lg transition"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reintentar Conexión</span>
          </button>
        </div>
      )}

      {/* Badge de Estado Activo y Control de Esqueleto */}
      {isModelReady && !cameraError && (
        <div className="absolute top-4 inset-x-4 z-10 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur border border-slate-700/60 text-[11px] text-slate-300 shadow">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Cámara e IA Activa</span>
          </div>

          <button
            onClick={() => setShowSkeleton(!showSkeleton)}
            title={showSkeleton ? 'Ocultar puntos en la mano' : 'Mostrar puntos en la mano'}
            className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur border border-slate-700/60 text-xs text-slate-300 hover:text-white transition shadow"
          >
            {showSkeleton ? <EyeOff className="w-3.5 h-3.5 text-sky-400" /> : <Eye className="w-3.5 h-3.5 text-slate-400" />}
            <span>{showSkeleton ? 'Ocultar puntos azules' : 'Ver puntos'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
