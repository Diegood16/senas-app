import React from 'react';
import { AppMode, GameSettings } from '../types/game';
import { BookOpen, Gamepad2, MessageSquareText, Hand, Volume2, VolumeX, Eye } from 'lucide-react';

interface NavbarProps {
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
  settings: GameSettings;
  onSettingsChange: (settings: GameSettings) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentMode,
  onModeChange,
  settings,
  onSettingsChange,
}) => {
  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Logo & Identidad */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
            <Hand className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-sky-400 via-indigo-200 to-white bg-clip-text text-transparent">
              SeñasApp <span className="text-xs uppercase px-2 py-0.5 ml-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30">IA Local</span>
            </h1>
            <p className="text-xs text-slate-400">Accesibilidad e Inclusión Comunitaria</p>
          </div>
        </div>

        {/* Selector de Modos de la Aplicación */}
        <nav className="flex items-center bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700/60 shadow-inner" role="tablist">
          <button
            onClick={() => onModeChange('manual')}
            role="tab"
            aria-selected={currentMode === 'manual'}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs md:text-sm font-medium transition-all duration-200 ${
              currentMode === 'manual'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>1. Manual de Señas</span>
          </button>

          <button
            onClick={() => onModeChange('game')}
            role="tab"
            aria-selected={currentMode === 'game'}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs md:text-sm font-medium transition-all duration-200 ${
              currentMode === 'game'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            <span>2. Modo Academia</span>
          </button>

          <button
            onClick={() => onModeChange('transcription')}
            role="tab"
            aria-selected={currentMode === 'transcription'}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs md:text-sm font-medium transition-all duration-200 ${
              currentMode === 'transcription'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <MessageSquareText className="w-4 h-4" />
            <span>3. Transcriptor en Vivo</span>
          </button>
        </nav>

        {/* Opciones Rápidas de Accesibilidad */}
        <div className="flex items-center gap-2">
          {/* Mano Dominante */}
          <button
            onClick={() =>
              onSettingsChange({
                ...settings,
                handDominance: settings.handDominance === 'Right' ? 'Left' : 'Right',
              })
            }
            title={`Mano activa: ${settings.handDominance === 'Right' ? 'Diestro' : 'Zurdo'}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs border border-slate-700 transition"
          >
            <Hand className="w-3.5 h-3.5 text-sky-400" />
            <span>{settings.handDominance === 'Right' ? 'Diestro' : 'Zurdo'}</span>
          </button>

          {/* Voz / Sonido */}
          <button
            onClick={() =>
              onSettingsChange({
                ...settings,
                speechEnabled: !settings.speechEnabled,
              })
            }
            title={settings.speechEnabled ? 'Lectura por voz activada' : 'Lectura por voz desactivada'}
            className={`p-2 rounded-lg border text-xs transition ${
              settings.speechEnabled
                ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            {settings.speechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Alto Contraste */}
          <button
            onClick={() =>
              onSettingsChange({
                ...settings,
                highContrast: !settings.highContrast,
              })
            }
            title="Alternar contraste"
            className={`p-2 rounded-lg border text-xs transition ${
              settings.highContrast
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
