import { HandLandmarks, CameraTrackingState } from '../types/vision';
import { CalibrationProfile } from './RecognitionCalibration';

interface FrameDetails { tracking?: CameraTrackingState; confirmedLetter?: string | null; paused?: boolean }
interface SampleFrame extends FrameDetails { timeMs: number; points: HandLandmarks | null; aspectRatio: number; detected: string | null }

/** A short in-memory measurement buffer. No camera images, network or automatic file writes. */
export class RecognitionSamples {
  private frames: SampleFrame[] = [];
  public constructor(private durationMs = 3000, private maxFrames = 40) {}

  public add(timeMs: number, points: HandLandmarks | null, detected: string | null, details: FrameDetails = {}): void {
    if (this.frames.length && timeMs - this.frames[this.frames.length - 1].timeMs < 80 && !details.confirmedLetter) return;
    this.frames.push({ timeMs, points: points ? points.map(p => ({ ...p })) : null, aspectRatio: points?.aspectRatio || 1, detected, ...details });
    this.frames = this.frames.filter(frame => timeMs - frame.timeMs <= this.durationMs).slice(-this.maxFrames);
  }

  public snapshot(target: string, hand: string, calibration?: CalibrationProfile): string | null {
    if (!this.frames.some(frame => frame.points)) return null;
    return JSON.stringify({ version: 1, intendedLetter: target, hand, calibration,
      note: 'Intended letter is user intent, not a verified label. Measurements only; no images or video.',
      frames: this.frames }, null, 2);
  }

  public snapshotTranscription(expectedText: string, actualText: string, hand: string, calibration?: CalibrationProfile, holdMs = 700): string | null {
    if (!this.frames.some(frame => frame.points)) return null;
    return JSON.stringify({ version: 2, mode: 'transcription', intendedText: expectedText,
      actualText, hand, calibration, holdMs,
      note: 'Optional intended text is user intent, not a verified label. No images or video; no automatic training.',
      frames: this.frames }, null, 2);
  }
}
