export interface TranscriptionEvent {
  letter: string;
  timestamp: number;
  confidence: number;
}

export interface TranscriptionState {
  currentWord: string;
  sentenceHistory: string[];
  fullSentence: string;
  isPaused: boolean;
  isSpeaking: boolean;
  lastAddedLetter: string | null;
}
