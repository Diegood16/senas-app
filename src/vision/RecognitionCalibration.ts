import { HandLandmarks } from '../types/vision';
import { LandmarkNormalizer } from './LandmarkNormalizer';

export interface CalibrationProfile {
  palmSize: number;
  fingerLengths: number[];
  palmWidth: number;
}
const profiles = new Map<boolean, CalibrationProfile>();
export const getCalibration = (mirrored: boolean) => profiles.get(mirrored);
export const forgetCalibration = (mirrored: boolean) => profiles.delete(mirrored);

export function handQuality(points: HandLandmarks | null): string | null {
  if (!points || points.length !== 21) return 'Muestra una mano completa frente a la cámara.';
  if (points.some(p => ![p.x, p.y, p.z].every(Number.isFinite))) return 'No se pudo medir la mano. Ajusta la iluminación.';
  if (points.some(p => p.x <= 0.01 || p.x >= 0.99 || p.y <= 0.01 || p.y >= 0.99)) return 'Centra la mano completa dentro del encuadre.';
  if (LandmarkNormalizer.palmSize(points) < 0.045) return 'Acerca la mano: faltan detalles para medir los dedos.';
  return null;
}

export function distanceFeedback(points: HandLandmarks, profile?: CalibrationProfile): string {
  if (!profile) return '';
  const ratio = LandmarkNormalizer.palmSize(points) / profile.palmSize;
  if (ratio < 0.65) return 'Estás más lejos que al calibrar. Acércate un poco si los puntos saltan.';
  if (ratio > 1.6) return 'Estás más cerca que al calibrar. Mantén todos los dedos dentro del encuadre.';
  return 'Distancia de trabajo adecuada. Medidas ajustadas al tamaño de tu mano.';
}

export class CalibrationSession {
  private samples: { palmSize: number; lengths: number[]; width: number }[] = [];
  private started: number | null = null;
  private lastTime: number | null = null;
  private previous: HandLandmarks | null = null;

  public process(points: HandLandmarks | null, mirrored: boolean, now: number): { message: string; progress: number; done: boolean } {
    const reset = (message: string) => {
      this.samples = []; this.started = null; this.previous = null; this.lastTime = null;
      return { message, progress: 0, done: false };
    };
    const quality = handQuality(points);
    if (quality || !points) return reset(quality || 'Muestra tu mano.');
    const normalized = LandmarkNormalizer.normalize(points, mirrored);
    const geo = LandmarkNormalizer.analyzeGeometry(normalized);
    if (!geo.isOpenPalm) return reset('Abre los dedos con la palma hacia la cámara. No necesitas hacer ninguna letra.');
    if (this.lastTime !== null && now - this.lastTime < 60) return { message: 'Midiendo palma y dedos. Mantén la mano quieta.', progress: Math.min(99, this.samples.length / 24 * 100), done: false };
    if (this.lastTime !== null && now - this.lastTime > 250) return reset('Se perdió el seguimiento. Mantén la mano visible.');
    if (this.previous) {
      const movement = normalized.reduce((sum, p, i) => sum + LandmarkNormalizer.distance(p, this.previous![i]), 0) / 21;
      if (movement > 0.15) return reset('Mantén la mano quieta; revisa la luz si los puntos saltan.');
    }
    const lengths = [1, 5, 9, 13, 17].map(i => LandmarkNormalizer.fingerLength(normalized, i));
    if (lengths.some(length => length < 0.25 || length > 3)) return reset('No se ven bien los dedos. Muestra la palma de frente.');
    this.started ??= now;
    this.previous = normalized;
    this.lastTime = now;
    this.samples.push({ palmSize: LandmarkNormalizer.palmSize(points), lengths, width: LandmarkNormalizer.distance(normalized[5], normalized[17]) });
    if (this.samples.length < 24 || now - this.started < 1600) return { message: 'Midiendo palma, proporciones de dedos y distancia de trabajo.', progress: Math.min(99, Math.min(this.samples.length / 24, (now - this.started) / 1600) * 100), done: false };
    const median = (values: number[]) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
    const palmSize = median(this.samples.map(s => s.palmSize));
    if (this.samples.some(s => Math.abs(s.palmSize / palmSize - 1) > 0.15)) return reset('La distancia está cambiando. Repite manteniendo la mano en un lugar.');
    const fingerLengths = lengths.map((_, i) => median(this.samples.map(s => s.lengths[i])));
    if (this.samples.some(s => s.lengths.some((v, i) => Math.abs(v / fingerLengths[i] - 1) > 0.2))) return reset('Los puntos de los dedos varían demasiado. Mejora la luz o cambia de fondo.');
    profiles.set(mirrored, { palmSize, fingerLengths, palmWidth: median(this.samples.map(s => s.width)) });
    return { message: 'Escaneo completo. Ya puedes practicar cualquier letra del catálogo.', progress: 100, done: true };
  }
}
