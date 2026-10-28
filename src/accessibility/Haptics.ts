export class Haptics {
  public static success(): void {
    if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
      navigator.vibrate([40, 60, 80]); // Pequeño patrón rítmico agradable
    }
  }

  public static subtle(): void {
    if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
      navigator.vibrate(30);
    }
  }
}
