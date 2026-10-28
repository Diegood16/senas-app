export type AppMode = 'manual' | 'game' | 'transcription';

export interface GameScoreState {
  currentScore: number;
  streak: number;
  bestStreak: number;
  completedLetters: string[];
  currentLevel: number;
}

export interface EvaluationResult {
  detectedLetter: string | null;
  confidence: number;
  isCorrect: boolean;
  message: string;
  holdProgress: number; // 0 a 100% (tiempo sostenido de la seña)
}

export interface GameSettings {
  holdTimeMs: number;
  handDominance: 'Right' | 'Left';
  highContrast: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  speechEnabled: boolean;
}
