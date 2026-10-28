import React, { useState } from 'react';
import { DACTYLOLOGY_ALPHABET } from '../data/alphabetData';
import { SignLetter, SignCategory } from '../types/signs';
import { Camera, CheckCircle2, AlertTriangle, Search, Sparkles, Image as ImageIcon } from 'lucide-react';

interface SignManualViewProps {
  onPracticeLetter: (letter: string) => void;
}

export const SignManualView: React.FC<SignManualViewProps> = ({ onPracticeLetter }) => {
  const [selectedCategory, setSelectedCategory] = useState<SignCategory | 'todas'>('todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeLetter, setActiveLetter] = useState<SignLetter>(DACTYLOLOGY_ALPHABET[0]);

  const filteredLetters = DACTYLOLOGY_ALPHABET.filter(sign => {
    const matchesCategory = selectedCategory === 'todas' || sign.category === selectedCategory;
    const matchesSearch =
      sign.letter.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sign.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Banner de Bienvenida y Propósito Visual */}
      <div className="bg-gradient-to-r from-sky-900/40 via-indigo-900/30 to-slate-900/60 border border-sky-500/20 rounded-3xl p-6 md:p-8 mb-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Guía Visual Ilustrada</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-2">
              Manual Visual de Señas y Posturas de Manos
            </h2>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed">
              La lengua de señas es 100% visual. A continuación puedes ver la ilustración exacta de cómo formar cada letra con tus manos antes de ponerlo en práctica con la cámara.
            </p>
          </div>

          <button
            onClick={() => onPracticeLetter(activeLetter.letter)}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-sky-500/25 transition transform hover:-translate-y-0.5"
          >
            <Camera className="w-4 h-4" />
            <span>Practicar "{activeLetter.letter}" con la Cámara</span>
          </button>
        </div>
      </div>

      {/* Controles de Búsqueda y Filtros */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700 w-full sm:w-auto">
          {(['todas', 'vocal', 'consonante'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition ${
                selectedCategory === cat
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat === 'todas' ? 'Todas las señas' : cat === 'vocal' ? 'Vocales' : 'Consonantes'}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar letra (A, B, V, L)..."
            className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
          />
        </div>
      </div>

      {/* Cuadrícula Principal: Fichas con Imágenes de Manos + Detalle */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Catálogo de Tarjetas con Ilustraciones de Manos */}
        <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
          {filteredLetters.map(sign => {
            const isSelected = activeLetter.id === sign.id;
            return (
              <button
                key={sign.id}
                onClick={() => setActiveLetter(sign)}
                className={`flex flex-col items-center justify-between p-3.5 rounded-2xl border transition-all duration-200 relative group ${
                  isSelected
                    ? 'bg-gradient-to-b from-sky-500/20 to-indigo-500/20 border-sky-400 ring-2 ring-sky-500/50 shadow-xl shadow-sky-500/15 -translate-y-1'
                    : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/80 hover:border-slate-600 text-slate-300'
                }`}
              >
                {/* Badge de la Letra */}
                <span className="absolute top-2.5 left-2.5 w-7 h-7 rounded-lg bg-slate-900/80 border border-slate-700 text-sm font-black text-white flex items-center justify-center">
                  {sign.letter}
                </span>

                {/* Ilustración de la Mano Limpia (Sin puntos) */}
                <div className="w-24 h-24 my-2 flex items-center justify-center bg-white rounded-2xl p-2.5 shadow-md group-hover:scale-105 transition-transform duration-200">
                  <img
                    src={sign.imagePath}
                    alt={`Gesto limpio de la mano para la letra ${sign.letter}`}
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                </div>

                <span className="text-[11px] font-semibold text-slate-400 capitalize">
                  {sign.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Ficha Visual Ampliada de la Letra Activa */}
        <div className="lg:col-span-5 bg-slate-800/80 border border-slate-700 rounded-3xl p-6 lg:p-8 shadow-xl sticky top-24">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-2xl font-black text-white shadow-md shadow-sky-500/30">
                {activeLetter.letter}
              </span>
              <div>
                <h3 className="text-xl font-bold text-white">{activeLetter.name}</h3>
                <span className="inline-block text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-700 text-slate-300 capitalize">
                  {activeLetter.category} • {activeLetter.difficulty}
                </span>
              </div>
            </div>

            <button
              onClick={() => onPracticeLetter(activeLetter.letter)}
              title="Abrir cámara con esta letra"
              className="p-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white shadow-md transition"
            >
              <Camera className="w-5 h-5" />
            </button>
          </div>

          {/* Gran Escaparate Visual de la Mano Limpia (Sin puntos) */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 mb-6 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-3 left-3 flex items-center gap-1.5 text-[11px] text-sky-700 font-semibold uppercase tracking-wider bg-sky-100 px-2.5 py-1 rounded-full border border-sky-300">
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Gesto Real Limpio (Sin puntos)</span>
            </div>

            <div className="w-48 h-48 md:w-56 md:h-56 mt-4 flex items-center justify-center">
              <img
                src={activeLetter.imagePath}
                alt={`Postura visual limpia para la letra ${activeLetter.letter}`}
                className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
              />
            </div>

            <p className="text-center text-xs text-slate-700 mt-2 font-medium bg-slate-100 px-4 py-2 rounded-xl border border-slate-200">
              Imita esta posición exacta con tu mano frente a la cámara
            </p>
          </div>

          {/* Pasos Anatómicos Resumidos */}
          <div className="mb-6">
            <h4 className="text-xs uppercase tracking-wider font-bold text-sky-400 flex items-center gap-1.5 mb-2.5">
              <CheckCircle2 className="w-4 h-4 text-sky-400" />
              <span>Detalles Anatómicos</span>
            </h4>
            <ul className="space-y-1.5">
              {activeLetter.anatomicalTips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 flex-shrink-0" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Errores Comunes a Evitar */}
          <div className="mb-8">
            <h4 className="text-xs uppercase tracking-wider font-bold text-amber-400 flex items-center gap-1.5 mb-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Evita este error</span>
            </h4>
            <ul className="space-y-1.5">
              {activeLetter.commonMistakes.map((err, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                  <span>{err}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Botón de Práctica Rápida */}
          <button
            onClick={() => onPracticeLetter(activeLetter.letter)}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-sky-500/25 transition transform hover:-translate-y-0.5"
          >
            <Camera className="w-4 h-4" />
            <span>Poner en práctica "{activeLetter.letter}" con la cámara</span>
          </button>
        </div>
      </div>
    </div>
  );
};
