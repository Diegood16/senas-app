import React, { useState, useRef, useCallback } from 'react';
import { CameraView } from './CameraView';
import { HandLandmarks } from '../types/vision';
import { GestureClassifier } from '../vision/GestureClassifier';
import { DebounceEngine } from '../transcription/DebounceEngine';
import { TextToSpeechHelper } from '../transcription/TextToSpeechHelper';
import { DACTYLOLOGY_ALPHABET } from '../data/alphabetData';
import { GameSettings } from '../types/game';
import { Haptics } from '../accessibility/Haptics';
import {
  Volume2,
  Copy,
  Delete,
  Space,
  RotateCcw,
  Check,
  MessageSquare,
  Sparkles,
  Info,
} from 'lucide-react';

interface TranscriptionBoardViewProps {
  settings: GameSettings;
}

export const TranscriptionBoardView: React.FC<TranscriptionBoardViewProps> = ({ settings }) => {
  const [currentWord, setCurrentWord] = useState('');
  const [fullSentence, setFullSentence] = useState('');
  const [candidateLetter, setCandidateLetter] = useState<string | null>(null);
  const [holdProgress, setHoldProgress] = useState(0);
  const [lastEmittedLetter, setLastEmittedLetter] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const debounceEngineRef = useRef<DebounceEngine>(new DebounceEngine({ minHoldMs: 480, confidenceThreshold: 0.85 }));
  const lastActiveTimeRef = useRef<number>(performance.now());
  const inactivityTimerRef = useRef<number | null>(null);

  // Manejar adición de letra confirmada
  const handleConfirmedLetter = useCallback(
    (letter: string) => {
      setLastEmittedLetter(letter);
      Haptics.subtle();

      setCurrentWord(prev => prev + letter);
      setFullSentence(prev => prev + letter);

      // Reiniciar temporizador de espacio automático tras 1.4s de inactividad
      if (inactivityTimerRef.current !== null) {
        window.clearTimeout(inactivityTimerRef.current);
      }
      inactivityTimerRef.current = window.setTimeout(() => {
        setCurrentWord('');
        setFullSentence(prev => (prev.endsWith(' ') || prev.length === 0 ? prev : prev + ' '));
      }, 1500);
    },
    []
  );

  // Frame de MediaPipe
  const handleLandmarks = useCallback(
    (landmarks: HandLandmarks | null) => {
      const now = performance.now();

      if (!landmarks) {
        setCandidateLetter(null);
        setHoldProgress(0);
        debounceEngineRef.current.process(null, 0, now);
        return;
      }

      lastActiveTimeRef.current = now;
      const isMirrored = settings.handDominance === 'Right';
      const result = GestureClassifier.classify(landmarks, isMirrored);

      if (result) {
        setCandidateLetter(result.letter);

        const { confirmedLetter, holdProgress } = debounceEngineRef.current.process(
          result.letter,
          result.confidence,
          now
        );

        setHoldProgress(holdProgress);

        if (confirmedLetter) {
          handleConfirmedLetter(confirmedLetter);
        }
      } else {
        setCandidateLetter(null);
        setHoldProgress(0);
        debounceEngineRef.current.process(null, 0, now);
      }
    },
    [handleConfirmedLetter, settings.handDominance]
  );

  // Acciones Manuales de la Pizarra
  const handleAddSpace = () => {
    setCurrentWord('');
    setFullSentence(prev => (prev.endsWith(' ') || prev.length === 0 ? prev : prev + ' '));
  };

  const handleDeleteLast = () => {
    setFullSentence(prev => prev.slice(0, -1));
    setCurrentWord(prev => prev.slice(0, -1));
  };

  const handleClearAll = () => {
    setCurrentWord('');
    setFullSentence('');
    setLastEmittedLetter(null);
    debounceEngineRef.current.reset();
  };

  const handleCopyText = async () => {
    if (!fullSentence) return;
    try {
      await navigator.clipboard.writeText(fullSentence);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn('Error al copiar:', e);
    }
  };

  const handleSpeakText = () => {
    if (!fullSentence.trim()) return;
    setIsSpeaking(true);
    TextToSpeechHelper.speak(fullSentence, () => {
      setIsSpeaking(false);
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Banner Informativo sobre el Modo Transcriptor */}
      <div className="bg-gradient-to-r from-indigo-900/40 via-sky-900/30 to-slate-900/60 border border-indigo-500/20 rounded-3xl p-6 md:p-8 mb-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Modo Traductor y Transcriptor en Vivo</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-2">
              Traducción Continua de Señas a Texto y Voz
            </h2>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed">
              Deletrea con naturalidad frente a la cámara. El sistema filtra los movimientos intermedios, ensambla tus letras en palabras y oraciones completas, e incluye síntesis de voz para que personas oyentes puedan leer y escuchar en tiempo real lo que estás explicando.
            </p>
          </div>

          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 text-xs text-slate-300 space-y-1.5 max-w-sm">
            <p className="font-bold text-white flex items-center gap-1.5">
              <Info className="w-4 h-4 text-sky-400" />
              <span>Tips para un deletreo fluido:</span>
            </p>
            <p>• Sostén cada letra por medio segundo (0.5 s) para registrarla.</p>
            <p>• Para separar palabras, baja o relaja la mano 1.5 s y se añadirá un espacio automáticamente.</p>
          </div>
        </div>
      </div>

      {/* Grid Principal: Cámara de Video + Pizarra de Transcripción */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Columna Izquierda: Cámara con Indicador de Letra Candidata */}
        <div className="lg:col-span-6 space-y-4">
          <CameraView onLandmarksDetected={handleLandmarks} isMirrored={settings.handDominance === 'Right'} />

          {/* Estado de Estabilidad de la Letra Actual con Imagen de Referencia */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Imagen o Letra Candidata Limpia */}
              <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 flex items-center justify-center p-1.5 relative overflow-hidden shadow-sm">
                {candidateLetter ? (
                  (() => {
                    const sign = DACTYLOLOGY_ALPHABET.find(s => s.letter === candidateLetter);
                    return sign ? (
                      <img
                        src={sign.imagePath}
                        alt={`Seña ${candidateLetter}`}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="text-2xl font-black text-sky-600">{candidateLetter}</span>
                    );
                  })()
                ) : (
                  <span className="text-xl font-bold text-slate-400">—</span>
                )}
              </div>

              <div>
                <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block">
                  Letra en Detección
                </span>
                <p className="text-sm font-medium text-slate-200">
                  {candidateLetter
                    ? `Detectando letra ${candidateLetter} (${holdProgress}%)`
                    : 'Realiza una seña frente a la cámara'}
                </p>
              </div>
            </div>

            {/* Barra de progreso */}
            <div className="w-24 h-2.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 transition-all duration-75"
                style={{ width: `${holdProgress}%` }}
              />
            </div>
          </div>

          {/* Tira Rápida Visual de Señas Limpias (Cheat Sheet) */}
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Guía Visual Rápida para Deletrear:
            </span>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {DACTYLOLOGY_ALPHABET.map(sign => (
                <div
                  key={sign.id}
                  className="flex flex-col items-center flex-shrink-0 bg-white border border-slate-200 rounded-xl p-2 w-16 shadow-sm"
                >
                  <img
                    src={sign.imagePath}
                    alt={sign.letter}
                    className="w-10 h-10 object-contain mb-1"
                  />
                  <span className="text-xs font-bold text-sky-700">{sign.letter}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Pizarra de Subtítulos y Oraciones */}
        <div className="lg:col-span-6 bg-slate-800/80 border border-slate-700 rounded-3xl p-6 lg:p-8 shadow-xl flex flex-col justify-between min-h-[460px]">
          <div>
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-700/60">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-sky-400" />
                <h3 className="text-lg font-bold text-white">Pizarra de Transcripción</h3>
              </div>

              {lastEmittedLetter && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Última letra: <strong>{lastEmittedLetter}</strong>
                </span>
              )}
            </div>

            {/* Área de Visualización de la Oración */}
            <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800 min-h-[200px] max-h-[300px] overflow-y-auto mb-6 flex flex-col justify-between">
              <div>
                {fullSentence ? (
                  <p className="text-2xl md:text-3xl font-medium text-white tracking-wide leading-relaxed font-sans select-all">
                    {fullSentence}
                    <span className="inline-block w-2.5 h-6 bg-sky-400 ml-1.5 animate-pulse" />
                  </p>
                ) : (
                  <p className="text-slate-500 text-base italic flex items-center justify-center h-32">
                    Las palabras que deletrees con tus manos se traducirán aquí en tiempo real...
                  </p>
                )}
              </div>

              {currentWord && (
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>Palabra actual:</span>
                  <span className="font-mono text-sky-400 font-bold tracking-widest text-sm">
                    {currentWord}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Botones de Acción Accesibles */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <button
              onClick={handleSpeakText}
              disabled={!fullSentence.trim() || isSpeaking}
              className={`flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl text-xs font-semibold shadow transition ${
                fullSentence.trim() && !isSpeaking
                  ? 'bg-sky-500 hover:bg-sky-400 text-white shadow-sky-500/20'
                  : 'bg-slate-700/40 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Volume2 className="w-4 h-4" />
              <span>{isSpeaking ? 'Hablando...' : 'Escuchar'}</span>
            </button>

            <button
              onClick={handleCopyText}
              disabled={!fullSentence.trim()}
              className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copiado' : 'Copiar'}</span>
            </button>

            <button
              onClick={handleAddSpace}
              className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold transition"
            >
              <Space className="w-4 h-4" />
              <span>Espacio</span>
            </button>

            <button
              onClick={handleDeleteLast}
              disabled={!fullSentence}
              className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Delete className="w-4 h-4" />
              <span>Borrar</span>
            </button>

            <button
              onClick={handleClearAll}
              disabled={!fullSentence}
              className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Limpiar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
