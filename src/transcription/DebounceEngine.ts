export interface DebounceConfig {
  minHoldMs: number; // Tiempo requerido para confirmar la letra (ej: 450ms)
  confidenceThreshold: number; // Confianza mínima (ej: 0.85)
}

export class DebounceEngine {
  private candidateLetter: string | null = null;
  private candidateStartTime: number = 0;
  private lastEmittedLetter: string | null = null;
  private config: DebounceConfig;

  constructor(config: Partial<DebounceConfig> = {}) {
    this.config = {
      minHoldMs: config.minHoldMs ?? 450,
      confidenceThreshold: config.confidenceThreshold ?? 0.85
    };
  }

  /**
   * Procesa la letra detectada en el fotograma actual.
   * Retorna la letra confirmada si superó la ventana de estabilidad temporal, o null.
   */
  public process(
    detectedLetter: string | null,
    confidence: number,
    now: number = performance.now()
  ): { confirmedLetter: string | null; holdProgress: number } {
    if (!detectedLetter || confidence < this.config.confidenceThreshold) {
      // Si la mano se relajó o cambió a postura irreconocible, permitimos volver a emitir la letra anterior
      if (now - this.candidateStartTime > 600) {
        this.lastEmittedLetter = null;
      }
      this.candidateLetter = null;
      return { confirmedLetter: null, holdProgress: 0 };
    }

    // Si cambió la letra candidata
    if (detectedLetter !== this.candidateLetter) {
      this.candidateLetter = detectedLetter;
      this.candidateStartTime = now;
      return { confirmedLetter: null, holdProgress: 0 };
    }

    // Si es la misma candidata, calculamos cuánto tiempo se ha sostenido
    const elapsed = now - this.candidateStartTime;
    const holdProgress = Math.min(100, Math.round((elapsed / this.config.minHoldMs) * 100));

    // Si superó el tiempo y no es una repetición estática no intencional
    if (elapsed >= this.config.minHoldMs) {
      if (this.candidateLetter !== this.lastEmittedLetter) {
        this.lastEmittedLetter = this.candidateLetter;
        return { confirmedLetter: this.candidateLetter, holdProgress: 100 };
      }
    }

    return { confirmedLetter: null, holdProgress };
  }

  public reset(): void {
    this.candidateLetter = null;
    this.candidateStartTime = 0;
    this.lastEmittedLetter = null;
  }
}
