/** Accumulate only observed matching time; short tracking gaps pause instead of approving a pose. */
export class PoseHoldEngine {
  private target = '';
  private lastTime: number | null = null;
  private lastMatch: number | null = null;
  private previousMatched = false;
  private accumulated = 0;
  private observations = 0;

  public reset(): void {
    this.target = ''; this.lastTime = null; this.lastMatch = null;
    this.previousMatched = false; this.accumulated = 0; this.observations = 0;
  }

  public process(letter: string | null, target: string, now: number, holdMs: number): { progress: number; confirmed: boolean } {
    if (target !== this.target || (this.lastMatch !== null && now - this.lastMatch > 180)) {
      this.reset(); this.target = target;
    }
    const matches = letter === target;
    if (matches) {
      if (this.previousMatched && this.lastTime !== null) this.accumulated += Math.max(0, Math.min(100, now - this.lastTime));
      this.lastMatch = now;
      this.observations++;
    }
    this.lastTime = now;
    this.previousMatched = matches;
    const confirmed = matches && this.accumulated >= holdMs && this.observations >= 8;
    return { progress: Math.min(confirmed ? 100 : 99, Math.round(this.accumulated / holdMs * 100)), confirmed };
  }
}
