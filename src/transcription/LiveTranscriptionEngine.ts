import { CameraTrackingState, HandLandmarks } from '../types/vision';
import { LandmarkNormalizer } from '../vision/LandmarkNormalizer';

export interface LiveObservation {
  letter: string | null;
  score: number;
  tracking: CameraTrackingState;
  points?: HandLandmarks | null;
  now: number;
}
export interface LiveDecision {
  confirmedLetter: string | null;
  addSpace: boolean;
  candidate: string | null;
  progress: number;
  state: 'holding' | 'held' | 'confirmed' | 'moving' | 'ambiguous' | CameraTrackingState;
}

/** Decisions depend on observed stable time, not wall time since a single frame. */
export class LiveTranscriptionEngine {
  private candidate: string | null = null;
  private evidence = 0;
  private observations = 0;
  private lastFrame: number | null = null;
  private lastMatch: number | null = null;
  private previousMatched = false;
  private previousPoints: HandLandmarks | null = null;
  private lastEmitted: string | null = null;
  private absentSince: number | null = null;
  private spaceSent = false;

  public constructor(private holdMs = 700) {}

  private clearCandidate(): void {
    this.candidate = null; this.evidence = 0; this.observations = 0;
    this.lastMatch = null; this.previousMatched = false;
  }

  /** Pause, edit or change pace without re-emitting a letter still held on camera. */
  public interrupt(): void {
    this.clearCandidate(); this.lastFrame = null; this.previousPoints = null;
    this.absentSince = null; this.spaceSent = false;
  }

  public reset(): void { this.interrupt(); this.lastEmitted = null; }
  public allowRepeat(): void { this.reset(); }
  public setHoldMs(value: number): void { this.holdMs = Math.max(450, Math.min(1500, value)); this.interrupt(); }

  public process(input: LiveObservation): LiveDecision {
    const { now, tracking } = input;
    if (this.lastFrame !== null && (now - this.lastFrame > 250 || now < this.lastFrame)) this.interrupt();
    const delta = this.lastFrame === null ? 0 : Math.max(0, Math.min(100, now - this.lastFrame));
    this.lastFrame = now;
    const output = (state: LiveDecision['state'], confirmedLetter: string | null = null, addSpace = false): LiveDecision => ({
      state, confirmedLetter, addSpace, candidate: this.candidate,
      progress: this.candidate && this.candidate === this.lastEmitted ? 100 : Math.min(99, Math.round(this.evidence / this.holdMs * 100))
    });

    if (tracking === 'calibrating' || tracking === 'poor-quality') {
      this.clearCandidate(); this.previousPoints = null; this.absentSince = null; this.spaceSent = false;
      return output(tracking);
    }
    if (tracking === 'absent') {
      this.absentSince ??= now;
      this.previousPoints = null;
      this.previousMatched = false;
      if (this.lastMatch !== null && now - this.lastMatch > 180) this.clearCandidate();
      const absentMs = now - this.absentSince;
      if (absentMs >= 650) this.lastEmitted = null;
      if (absentMs >= 1600 && !this.spaceSent) { this.spaceSent = true; return output('absent', null, true); }
      return output('absent');
    }
    this.absentSince = null; this.spaceSent = false;
    let moving = false;
    if (input.points) {
      const normalized = LandmarkNormalizer.normalize(input.points);
      if (this.previousPoints) {
        const movement = normalized.reduce((sum, point, i) => sum + LandmarkNormalizer.distance(point, this.previousPoints![i]), 0) / 21;
        moving = movement > 0.1;
      }
      this.previousPoints = normalized;
    }
    const letter = !moving && input.score >= 0.85 && /^[A-Z]$/.test(input.letter || '') ? input.letter : null;
    if (!letter) {
      this.previousMatched = false;
      if (this.lastMatch !== null && now - this.lastMatch > 180) this.clearCandidate();
      return output(moving ? 'moving' : 'ambiguous');
    }
    if (letter !== this.candidate || (!this.previousMatched && this.lastMatch !== null && now - this.lastMatch > 180)) this.clearCandidate();
    this.candidate = letter;
    if (this.previousMatched) this.evidence += delta;
    this.observations++;
    this.lastMatch = now;
    this.previousMatched = true;
    if (letter === this.lastEmitted) return output('held');
    if (this.evidence >= this.holdMs && this.observations >= 6) {
      this.lastEmitted = letter;
      return output('confirmed', letter);
    }
    return output('holding');
  }
}
