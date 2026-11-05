import React, { useState, useRef, useCallback, useEffect } from 'react';
import { CameraView } from './CameraView';
import { HandLandmarks, CameraTrackingState } from '../types/vision';
import { getCalibration } from '../vision/RecognitionCalibration';
import { GestureClassifier } from '../vision/GestureClassifier';
import { LiveTranscriptionEngine } from '../transcription/LiveTranscriptionEngine';
import { RecognitionSamples } from '../vision/RecognitionSamples';
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

const paceByHand = new Map<string, number>();

interface TranscriptionBoardViewProps {
  settings: GameSettings;
}

export const TranscriptionBoardView: React.FC<TranscriptionBoardViewProps> = ({ settings }) => {
  const [fullSentence, setFullSentence] = useState('');
  const currentWord = fullSentence.split(' ').pop() || '';
  const [candidateLetter, setCandidateLetter] = useState<string | null>(null);
  const [holdProgress, setHoldProgress] = useState(0);
  const [lastEmittedLetter, setLastEmittedLetter] = useState<string | null>(null);
  const [recognitionHint, setRecognitionHint] = useState('Completa el escaneo y pulsa Comenzar.');
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [holdMs, setHoldMs] = useState(() => paceByHand.get(settings.handDominance) || 700);
  const [expectedText, setExpectedText] = useState('');
  const [sampleMessage, setSampleMessage] = useState('');
  const engineRef = useRef(new LiveTranscriptionEngine(holdMs));
  const samplesRef = useRef(new RecognitionSamples(12000, 160));
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousTrackingRef = useRef<CameraTrackingState>('calibrating');

  const interrupt = useCallback(() => {
    engineRef.current.interrupt(); setHoldProgress(0); setCandidateLetter(null);
  }, []);

  const handleLandmarks = useCallback((landmarks: HandLandmarks | null, tracking: CameraTrackingState = landmarks ? 'ready' : 'absent') => {
    const now = performance.now();
    if (tracking === 'calibrating' && previousTrackingRef.current !== 'calibrating') samplesRef.current = new RecognitionSamples(12000, 160);
    previousTrackingRef.current = tracking;
    const mirrored = settings.handDominance === 'Right';
    const result = landmarks && tracking === 'ready' ? GestureClassifier.classify(landmarks, mirrored, undefined, getCalibration(mirrored)) : null;
    if (isPaused) {
      samplesRef.current.add(now, landmarks, result?.letter || null, { tracking, paused: true });
      return;
    }
    const decision = engineRef.current.process({ letter: result?.letter || null, score: result?.confidence || 0, points: landmarks, tracking, now });
    samplesRef.current.add(now, landmarks, result?.letter || null, { tracking, confirmedLetter: decision.confirmedLetter, paused: false });
    setCandidateLetter(decision.candidate);
    setHoldProgress(decision.progress);
    const messages: Partial<Record<typeof decision.state, string>> = {
      calibrating: 'Completa el escaneo general antes de deletrear.',
      'poor-quality': 'Seguimiento insuficiente. Revisa el encuadre y la iluminación.',
      absent: 'Para repetir una letra, retira la mano 0,7 s; para separar palabras, 1,6 s.',
      moving: 'Ajustando la postura. Mantén los dedos quietos para confirmar.',
      held: 'Letra registrada. Cambia de postura o pulsa Repetir letra.',
      holding: 'Mantén la postura hasta completar la barra.',
      confirmed: 'Letra registrada: ' + decision.confirmedLetter,
      ambiguous: result?.hint || 'Postura ambigua o no reconocida. Ajusta la mano.'
    };
    setRecognitionHint(messages[decision.state] || 'Muestra la mano frente a la cámara.');
    if (decision.confirmedLetter) {
      setLastEmittedLetter(decision.confirmedLetter);
      setFullSentence(prev => prev + decision.confirmedLetter);
      if (settings.vibrationEnabled) Haptics.subtle();
    }
    if (decision.addSpace) setFullSentence(prev => prev && !prev.endsWith(' ') ? prev + ' ' : prev);
  }, [isPaused, settings.handDominance, settings.vibrationEnabled]);

  useEffect(() => {
    const pace = paceByHand.get(settings.handDominance) || 700;
    setHoldMs(pace); engineRef.current = new LiveTranscriptionEngine(pace);
    samplesRef.current = new RecognitionSamples(12000, 160);
    setIsPaused(true); setCandidateLetter(null); setHoldProgress(0); setSampleMessage('');
    setRecognitionHint('Completa el escaneo y pulsa Comenzar.');
  }, [settings.handDominance]);

  useEffect(() => () => {
    if (copyTimerRef.current !== null) clearTimeout(copyTimerRef.current);
    TextToSpeechHelper.stop();
  }, []);

  const handleAddSpace = () => {
    interrupt();
    setFullSentence(prev => prev && !prev.endsWith(' ') ? prev + ' ' : prev);
  };
  const handleDeleteLast = () => { interrupt(); setFullSentence(prev => prev.slice(0, -1)); };
  const handleClearAll = () => {
    setIsPaused(true); engineRef.current.reset(); setFullSentence('');
    setCandidateLetter(null); setHoldProgress(0); setLastEmittedLetter(null);
    samplesRef.current = new RecognitionSamples(12000, 160);
    setRecognitionHint('Texto limpio. Pulsa Comenzar cuando estés listo.');
    TextToSpeechHelper.stop(); setIsSpeaking(false);
  };
  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(fullSentence); setCopied(true);
      if (copyTimerRef.current !== null) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch { setRecognitionHint('No se pudo copiar el texto. Puedes seleccionarlo en la pizarra.'); }
  };
  const handleSpeakText = () => {
    if (!fullSentence.trim()) return;
    setIsSpeaking(true); TextToSpeechHelper.speak(fullSentence, () => setIsSpeaking(false));
  };
  const pauseForEditing = () => { setIsPaused(true); interrupt(); };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Banner Informativo sobre el Modo Transcriptor */}
      <div className="bg-gradient-to-r from-indigo-900/40 via-sky-900/30 to-slate-900/60 border border-indigo-500/20 rounded-3xl p-6 md:p-8 mb-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Transcriptor de Deletreo en Vivo</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-2">
              Deletreo a Texto y Voz
            </h2>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed">
              Completa el escaneo general y comienza cuando estés listo. Solo se añaden letras que mantienen una postura estable; las detecciones dudosas quedan pendientes. Puedes pausar y corregir el texto antes de escucharlo.
            </p>
          </div>

          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 text-xs text-slate-300 space-y-1.5 max-w-sm">
            <p className="font-bold text-white flex items-center gap-1.5">
              <Info className="w-4 h-4 text-sky-400" />
              <span>Tips para un deletreo fluido:</span>
            </p>
            <p>• Mantén cada letra hasta completar la barra. Ajusta el ritmo a tu comodidad.</p>
            <p>• Retira la mano 0,7 s para repetir una letra y 1,6 s para separar palabras. También puedes usar los botones.</p>
          </div>
        </div>
      </div>

      {/* Grid Principal: Cámara de Video + Pizarra de Transcripción */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Columna Izquierda: Cámara con Indicador de Letra Candidata */}
        <div className="lg:col-span-6 space-y-4">
          <CameraView key={settings.handDominance} onLandmarksDetected={handleLandmarks} isMirrored={settings.handDominance === 'Right'} />

          <div className="rounded-2xl border border-slate-700 bg-slate-800/80 p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <button aria-pressed={!isPaused} className="rounded-xl bg-sky-600 px-4 py-2 font-semibold text-white hover:bg-sky-500" onClick={() => {
                interrupt(); setIsPaused(value => !value);
              }}>{isPaused ? 'Comenzar' : 'Pausar'}</button>
              <label className="text-sm text-slate-300 flex items-center gap-2">Ritmo
                <select value={holdMs} className="bg-slate-900 rounded-lg border border-slate-600 p-2 text-white" onChange={event => {
                  const value = Number(event.target.value);
                  paceByHand.set(settings.handDominance, value); setHoldMs(value);
                  engineRef.current.setHoldMs(value); setCandidateLetter(null); setHoldProgress(0);
                }}>
                  <option value={500}>Ágil · 0,5 s</option>
                  <option value={700}>Normal · 0,7 s</option>
                  <option value={1100}>Pausado · 1,1 s</option>
                </select>
              </label>
              <button className="rounded-xl border border-slate-600 px-3 py-2 text-sm text-white hover:bg-slate-700" onClick={() => {
                engineRef.current.allowRepeat(); setCandidateLetter(null); setHoldProgress(0);
                setRecognitionHint('Listo para repetir. Mantén de nuevo la letra hasta completar la barra.');
              }}>Repetir letra</button>
            </div>
            <p className="text-xs text-slate-400">El ritmo se recuerda por mano durante esta sesión. Las posturas que el sistema considera ambiguas quedan pendientes. Si cambia la persona, usa Recalibrar.</p>
          </div>

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
                <p role="status" className="text-sm font-medium text-slate-200">
                  {candidateLetter
                    ? `Postura candidata: ${candidateLetter}`
                    : (isPaused ? 'Transcripción en pausa. Pulsa Comenzar.' : recognitionHint)}
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

          <p role="status" className="text-sm text-slate-300">{isPaused ? 'Transcripción en pausa. El texto se conserva.' : recognitionHint}</p>

          <div className="rounded-2xl border border-slate-700 bg-slate-800/80 p-4 space-y-2">
            <label htmlFor="expected-spelling" className="block text-xs text-slate-300">Texto que intentabas deletrear (opcional, para revisar fallos)</label>
            <input id="expected-spelling" value={expectedText} maxLength={80} onFocus={pauseForEditing}
              onChange={event => setExpectedText(event.target.value)} placeholder="Por ejemplo: HOLA"
              className="w-full rounded-lg border border-slate-600 bg-slate-900 p-2 text-white" />
            <button className="rounded-lg bg-slate-700 px-3 py-2 text-sm text-white hover:bg-slate-600" onClick={() => {
              const json = samplesRef.current.snapshotTranscription(expectedText, fullSentence, settings.handDominance, getCalibration(settings.handDominance === 'Right'), holdMs);
              if (!json) { setSampleMessage('Completa el escaneo y muestra la mano para guardar mediciones.'); return; }
              const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
              const link = document.createElement('a'); link.href = url; link.download = 'intento-transcriptor.json';
              document.body.appendChild(link); link.click(); link.remove();
              window.setTimeout(() => URL.revokeObjectURL(url), 1000);
              setSampleMessage('Muestra guardada en tu equipo. No se envió a ningún servidor.');
            }}>Guardar muestra del transcriptor</button>
            <p className="text-xs text-slate-400">Guarda hasta 12 segundos de puntos y resultados, el texto esperado y la pizarra actual. Sin fotos ni video. El texto esperado no modifica el reconocimiento ni entrena al sistema.</p>
            <p role="status" className="text-xs text-sky-300">{sampleMessage}</p>
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
                <label htmlFor="transcription-text" className="sr-only">Texto transcrito. Editarlo pausa la captura.</label>
                <textarea id="transcription-text" value={fullSentence} onFocus={pauseForEditing}
                  onChange={event => { interrupt(); setFullSentence(event.target.value); }}
                  placeholder="Las letras confirmadas aparecerán aquí. Puedes corregir este texto."
                  className="w-full min-h-[160px] bg-transparent text-2xl text-white leading-relaxed resize-y focus:outline-sky-400" />
                <p className="text-xs text-slate-400">Editar el texto pausa la captura. Pulsa Comenzar para continuar.</p>
                <span role="status" className="sr-only">{lastEmittedLetter ? 'Última letra confirmada: ' + lastEmittedLetter : ''}</span>
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
