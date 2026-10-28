export class TextToSpeechHelper {
  private static synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private static spanishVoice: SpeechSynthesisVoice | null = null;

  public static init(): void {
    if (!this.synth) return;

    const loadVoices = () => {
      const voices = this.synth?.getVoices() || [];
      // Priorizar voces en español
      this.spanishVoice = voices.find(v => v.lang.startsWith('es')) || voices[0] || null;
    };

    loadVoices();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = loadVoices;
    }
  }

  public static speak(text: string, onEnd?: () => void): void {
    if (!this.synth || !text.trim()) {
      onEnd?.();
      return;
    }

    // Cancelar cualquier lectura previa para no acumular eco
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    if (this.spanishVoice) {
      utterance.voice = this.spanishVoice;
    }
    utterance.lang = 'es-ES';
    utterance.rate = 0.95; // Velocidad pausada y clara
    utterance.pitch = 1.0;

    utterance.onend = () => {
      onEnd?.();
    };

    utterance.onerror = () => {
      onEnd?.();
    };

    this.synth.speak(utterance);
  }

  public static stop(): void {
    if (this.synth) {
      this.synth.cancel();
    }
  }
}
