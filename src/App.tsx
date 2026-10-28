import React, { useState, useEffect } from 'react';
import { AppMode, GameSettings } from './types/game';
import { Navbar } from './components/Navbar';
import { SignManualView } from './components/SignManualView';
import { AcademyGameView } from './components/AcademyGameView';
import { TranscriptionBoardView } from './components/TranscriptionBoardView';
import { TextToSpeechHelper } from './transcription/TextToSpeechHelper';
import { ShieldCheck, Cpu, Heart } from 'lucide-react';

export const App: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<AppMode>('manual');
  const [targetPracticeLetter, setTargetPracticeLetter] = useState<string>('A');

  const [settings, setSettings] = useState<GameSettings>({
    holdTimeMs: 800,
    handDominance: 'Right',
    highContrast: false,
    soundEnabled: true,
    vibrationEnabled: true,
    speechEnabled: true,
  });

  // Inicializar síntesis de voz al cargar la aplicación
  useEffect(() => {
    TextToSpeechHelper.init();
  }, []);

  // Transición directa desde el Manual hacia la Cámara
  const handlePracticeFromManual = (letter: string) => {
    setTargetPracticeLetter(letter);
    setCurrentMode('game');
  };

  return (
    <div
      className={`min-h-screen flex flex-col justify-between font-sans ${
        settings.highContrast ? 'bg-black text-yellow-300' : 'bg-slate-900 text-slate-100'
      }`}
    >
      <div>
        <Navbar
          currentMode={currentMode}
          onModeChange={setCurrentMode}
          settings={settings}
          onSettingsChange={setSettings}
        />

        <main role="main">
          {currentMode === 'manual' && (
            <SignManualView onPracticeLetter={handlePracticeFromManual} />
          )}

          {currentMode === 'game' && (
            <AcademyGameView
              initialLetter={targetPracticeLetter}
              settings={settings}
            />
          )}

          {currentMode === 'transcription' && (
            <TranscriptionBoardView settings={settings} />
          )}
        </main>
      </div>

      {/* Pie de página con compromisos de privacidad y accesibilidad */}
      <footer className="border-t border-slate-800 bg-slate-950/80 px-4 py-6 mt-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Privacidad Total: El video nunca sale de tu navegador</span>
            </span>
            <span className="hidden sm:flex items-center gap-1.5 text-slate-300">
              <Cpu className="w-4 h-4 text-sky-400" />
              <span>Inferencia de IA Local (MediaPipe + WASM)</span>
            </span>
          </div>

          <div className="flex items-center gap-1 text-slate-400">
            <span>Diseñado con</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>para la inclusión de la Comunidad Sorda y Oyentes</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
