import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { CameraView } from './CameraView';
import { HandLandmarks } from '../types/vision';
import { GestureClassifier } from '../vision/GestureClassifier';
import { DACTYLOLOGY_ALPHABET } from '../data/alphabetData';
import { SignLetter } from '../types/signs';
import { GameSettings } from '../types/game';
import { Haptics } from '../accessibility/Haptics';
import { TextToSpeechHelper } from '../transcription/TextToSpeechHelper';
import { Flame, Trophy, CheckCircle2, ArrowRight, ArrowLeft, Sparkles, HelpCircle } from 'lucide-react';

interface AcademyGameViewProps {
  initialLetter?: string;
  settings: GameSettings;
}

export const AcademyGameView: React.FC<AcademyGameViewProps> = ({
  initialLetter = 'A',
  settings,
}) => {
  const [currentLetterIdx, setCurrentLetterIdx] = useState(() => {
    const idx = DACTYLOLOGY_ALPHABET.findIndex(s => s.letter === initialLetter);
    return idx >= 0 ? idx : 0;
  });

  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [completedList, setCompletedList] = useState<string[]>([]);
  
  // Detección en vivo
  const [detectedLetter, setDetectedLetter] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [hint, setHint] = useState<string>('Muestra tu mano frente a la cámara');
  const [holdProgress, setHoldProgress] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showTips, setShowTips] = useState(true);

  const holdStartTimeRef = useRef<number | null>(null);
  const lastSuccessFrameTimeRef = useRef<number>(0);
  const targetSign: SignLetter = DACTYLOLOGY_ALPHABET[currentLetterIdx];

  // Cambio de letra inicial si se pasa como prop
  useEffect(() => {
    const idx = DACTYLOLOGY_ALPHABET.findIndex(s => s.letter === initialLetter);
    if (idx >= 0) {
      setCurrentLetterIdx(idx);
      setIsSuccess(false);
      setHoldProgress(0);
      holdStartTimeRef.current = null;
    }
  }, [initialLetter]);

  const triggerSuccessCelebration = useCallback(() => {
    setIsSuccess(true);
    setScore(prev => prev + 100 + streak * 20);
    setStreak(prev => {
      const next = prev + 1;
      setBestStreak(b => Math.max(b, next));
      return next;
    });

    if (!completedList.includes(targetSign.letter)) {
      setCompletedList(prev => [...prev, targetSign.letter]);
    }

    // Respuesta háptica y auditiva accesible
    Haptics.success();
    if (settings.speechEnabled) {
      TextToSpeechHelper.speak(`¡Excelente! Letra ${targetSign.letter} completada.`);
    }

    // Efecto visual de celebración
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#38bdf8', '#818cf8', '#34d399', '#fcd34d'],
    });

    // Pasar a la siguiente letra automáticamente después de 1.4s
    setTimeout(() => {
      setCurrentLetterIdx(prev => (prev + 1) % DACTYLOLOGY_ALPHABET.length);
      setIsSuccess(false);
      setHoldProgress(0);
      holdStartTimeRef.current = null;
    }, 1400);
  }, [completedList, settings.speechEnabled, streak, targetSign.letter]);

  // Manejador del frame de MediaPipe
  const handleLandmarks = useCallback(
    (landmarks: HandLandmarks | null) => {
      const now = performance.now();

      if (!landmarks) {
        setDetectedLetter(null);
        setConfidence(0);
        if (now - lastSuccessFrameTimeRef.current > 350) {
          setHoldProgress(0);
          holdStartTimeRef.current = null;
        }
        setHint('Coloca tu mano dentro del encuadre');
        return;
      }

      const isMirrored = settings.handDominance === 'Right';
      // Pasamos targetSign.letter para tolerancia y clasificación específica de nivel
      const result = GestureClassifier.classify(landmarks, isMirrored, targetSign.letter);

      if (result) {
        setDetectedLetter(result.letter);
        setConfidence(result.confidence);
        setHint(result.hint);

        // Si la letra coincide con el objetivo del nivel
        if (result.letter === targetSign.letter && !isSuccess) {
          lastSuccessFrameTimeRef.current = now;
          if (!holdStartTimeRef.current) {
            holdStartTimeRef.current = now;
          }

          const elapsed = now - holdStartTimeRef.current;
          // Tiempo de retención más amigable para señas con auto-oclusión (G, H, M, N, P, R, S, T)
          const isComplexOcclusion = ['G', 'H', 'M', 'N', 'P', 'R', 'S', 'T'].includes(targetSign.letter);
          const baseHoldTime = settings.holdTimeMs || 800;
          const targetHoldTime = isComplexOcclusion ? Math.min(baseHoldTime, 600) : baseHoldTime;

          const progress = Math.min(100, Math.round((elapsed / targetHoldTime) * 100));
          setHoldProgress(progress);

          if (elapsed >= targetHoldTime) {
            triggerSuccessCelebration();
          }
        } else {
          // Si hubo una pérdida momentánea de un fotograma (flicker), damos una ventana de gracia de 300ms
          if (now - lastSuccessFrameTimeRef.current > 300) {
            setHoldProgress(0);
            holdStartTimeRef.current = null;
          }
        }
      } else {
        setDetectedLetter(null);
        setConfidence(0);
        if (now - lastSuccessFrameTimeRef.current > 300) {
          setHoldProgress(0);
          holdStartTimeRef.current = null;
        }
        setHint('Ajusta la posición de los dedos según la foto objetivo');
      }
    },
    [isSuccess, settings.handDominance, settings.holdTimeMs, targetSign.letter, triggerSuccessCelebration]
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Barra de Estadísticas y Puntuación */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Puntos</span>
            <p className="text-xl font-black text-white">{score}</p>
          </div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Racha Actual</span>
            <p className="text-xl font-black text-white">{streak} seguidas</p>
          </div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Mejor Racha</span>
            <p className="text-xl font-black text-white">{bestStreak}</p>
          </div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Dominadas</span>
            <p className="text-xl font-black text-white">{completedList.length} / {DACTYLOLOGY_ALPHABET.length}</p>
          </div>
        </div>
      </div>

      {/* Grid Principal: Cámara + Panel del Desafío */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Columna Izquierda: Visión de Cámara */}
        <div className="lg:col-span-7 space-y-4">
          <CameraView onLandmarksDetected={handleLandmarks} isMirrored={settings.handDominance === 'Right'} />

          {/* Tarjeta de Retroalimentación en Tiempo Real */}
          <div className={`p-4 rounded-2xl border transition-all duration-300 ${
            isSuccess
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
              : holdProgress > 0
              ? 'bg-sky-950/40 border-sky-500/50 text-sky-200'
              : 'bg-slate-800/80 border-slate-700 text-slate-300'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Estado de la Detección
              </span>
              {detectedLetter && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-700 text-slate-200 font-mono">
                  Letra detectada: <strong className="text-sky-400">{detectedLetter}</strong> ({Math.round(confidence * 100)}%)
                </span>
              )}
            </div>

            <p className="text-sm font-semibold mb-3 flex items-center gap-2">
              {isSuccess ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>¡Excelente! Has dominado la letra {targetSign.letter}.</span>
                </>
              ) : (
                <span>{hint}</span>
              )}
            </p>

            {/* Barra de Progreso de Sostenimiento (Hold-Time) */}
            <div className="w-full h-2.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-75 ${
                  isSuccess ? 'bg-emerald-400 w-full' : 'bg-gradient-to-r from-sky-500 to-indigo-500'
                }`}
                style={{ width: `${isSuccess ? 100 : holdProgress}%` }}
              />
            </div>
            {holdProgress > 0 && !isSuccess && (
              <p className="text-[11px] text-sky-400 mt-1.5 font-medium text-right">
                Mantén la seña fija... {holdProgress}%
              </p>
            )}
          </div>
        </div>

        {/* Columna Derecha: Tarjeta de la Letra Objetivo y Guías */}
        <div className="lg:col-span-5 bg-slate-800/80 border border-slate-700 rounded-3xl p-6 lg:p-8 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-400 bg-sky-500/10 border border-sky-500/30 px-3 py-1 rounded-full">
              Objetivo del Nivel
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setCurrentLetterIdx(prev => (prev - 1 + DACTYLOLOGY_ALPHABET.length) % DACTYLOLOGY_ALPHABET.length)
                }
                title="Letra anterior"
                className="p-2 rounded-xl bg-slate-700 text-slate-300 hover:text-white transition"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() =>
                  setCurrentLetterIdx(prev => (prev + 1) % DACTYLOLOGY_ALPHABET.length)
                }
                title="Siguiente letra"
                className="p-2 rounded-xl bg-slate-700 text-slate-300 hover:text-white transition"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Gran Letra y Foto de Referencia de la Mano */}
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 p-6 rounded-3xl border border-slate-700/80 mb-6 flex flex-col sm:flex-row items-center gap-6">
            {/* Foto Limpia de la Mano de Referencia (Sin puntos) */}
            <div className="w-32 h-32 md:w-36 md:h-36 bg-white rounded-2xl p-2.5 flex items-center justify-center flex-shrink-0 border border-slate-200 shadow-lg">
              <img
                src={targetSign.imagePath}
                alt={`Gesto limpio de referencia para la letra ${targetSign.letter}`}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
                <span className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-xl font-black text-white shadow-md">
                  {targetSign.letter}
                </span>
                <h3 className="text-xl font-bold text-white">{targetSign.name}</h3>
              </div>
              <p className="text-xs text-slate-400 capitalize mb-2">{targetSign.category} • Dificultad {targetSign.difficulty}</p>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-800/60 p-3 rounded-xl border border-slate-700/40">
                {targetSign.description}
              </p>
            </div>
          </div>

          {/* Puntas y Pistas Anatómicas */}
          <div className="space-y-4 mb-8">
            <button
              onClick={() => setShowTips(!showTips)}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-200 transition"
            >
              <HelpCircle className="w-4 h-4 text-sky-400" />
              <span>{showTips ? 'Ocultar Pistas Anatómicas' : 'Mostrar Pistas Anatómicas'}</span>
            </button>

            {showTips && (
              <div className="space-y-2 bg-slate-900/40 p-4 rounded-2xl border border-slate-700/40">
                {targetSign.anatomicalTips.map((tip, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 flex-shrink-0" />
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selector Rápido de Letras */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Saltar a otra letra:
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
              {DACTYLOLOGY_ALPHABET.map((s, idx) => {
                const isSelected = idx === currentLetterIdx;
                const isDone = completedList.includes(s.letter);
                return (
                  <button
                    key={s.id}
                    onClick={() => setCurrentLetterIdx(idx)}
                    className={`w-9 h-9 rounded-xl text-xs font-bold transition flex items-center justify-center ${
                      isSelected
                        ? 'bg-sky-500 text-white shadow-md'
                        : isDone
                        ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {s.letter}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
