import { Landmark3D, HandLandmarks, AnalyzedHandGeometry, FingerState } from '../types/vision';

export class LandmarkNormalizer {
  public static distance(a: Landmark3D, b: Landmark3D): number {
    return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  }

  /** Image x and z use width units; y uses height units. Convert before measuring. */
  public static metric(points: HandLandmarks): HandLandmarks {
    const aspect = points.aspectRatio || 1;
    return points.map(p => ({ x: p.x, y: p.y / aspect, z: p.z }));
  }

  public static palmSize(points: HandLandmarks): number {
    const p = this.metric(points);
    return (this.distance(p[0], p[9]) + this.distance(p[5], p[17])) / 2;
  }

  public static normalize(points: HandLandmarks, mirrored = false): HandLandmarks {
    if (points.length !== 21) return points;
    const p = this.metric(points);
    // Combining palm width and length is less dependent on a single projected axis.
    const scale = (this.distance(p[0], p[9]) + this.distance(p[5], p[17])) / 2 || 1;
    return p.map(v => ({ x: (v.x - p[0].x) / scale * (mirrored ? -1 : 1), y: (v.y - p[0].y) / scale, z: (v.z - p[0].z) / scale }));
  }

  public static fingerLength(p: HandLandmarks, start: number): number {
    return this.distance(p[start], p[start + 1]) + this.distance(p[start + 1], p[start + 2]) + this.distance(p[start + 2], p[start + 3]);
  }

  private static segmentDistance(p: Landmark3D, a: Landmark3D, b: Landmark3D): number {
    const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy + (p.z - a.z) * dz) / (dx * dx + dy * dy + dz * dz || 1)));
    return this.distance(p, { x: a.x + t * dx, y: a.y + t * dy, z: a.z + t * dz });
  }

  private static angle(a: Landmark3D, b: Landmark3D, c: Landmark3D): number {
    const u = { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
    const v = { x: c.x - b.x, y: c.y - b.y, z: c.z - b.z };
    const denominator = Math.hypot(u.x, u.y, u.z) * Math.hypot(v.x, v.y, v.z);
    return denominator < 1e-8 ? 0 : Math.acos(Math.max(-1, Math.min(1, (u.x * v.x + u.y * v.y + u.z * v.z) / denominator))) * 180 / Math.PI;
  }

  private static finger(p: HandLandmarks, start: number): FingerState {
    // Joint angles work with fingers pointing up, sideways or down; wrist distance does not.
    const pip = this.angle(p[start], p[start + 1], p[start + 2]);
    const dip = this.angle(p[start + 1], p[start + 2], p[start + 3]);
    const reach = this.distance(p[start], p[start + 3]) / Math.max(1e-6, this.fingerLength(p, start));
    const curl = Math.max(0, Math.min(1, (1 - reach) * 1.4 + (180 - pip) / 240 + (180 - dip) / 480));
    return { isExtended: pip > 145 && dip > 140 && reach > 0.82, curl };
  }

  public static analyzeGeometry(p: HandLandmarks): AnalyzedHandGeometry {
    const index = this.finger(p, 5), middle = this.finger(p, 9), ring = this.finger(p, 13), pinky = this.finger(p, 17);
    const thumbAngle = this.angle(p[1], p[2], p[3]);
    const thumb = { isExtended: thumbAngle > 140 && this.distance(p[4], p[5]) > 0.35, curl: Math.max(0, Math.min(1, (180 - thumbAngle) / 100)) };
    // Hand-local lateral coordinate: index knuckle = 0, little-finger knuckle = 1.
    // This does not assume that thumb is at the left of the screen.
    const lateral = { x: p[17].x - p[5].x, y: p[17].y - p[5].y, z: p[17].z - p[5].z };
    const width2 = lateral.x ** 2 + lateral.y ** 2 + lateral.z ** 2 || 1;
    const slot = (v: Landmark3D) => ((v.x - p[5].x) * lateral.x + (v.y - p[5].y) * lateral.y + (v.z - p[5].z) * lateral.z) / width2;
    const along = (v: Landmark3D) => ((v.x - p[0].x) * p[9].x + (v.y - p[0].y) * p[9].y + (v.z - p[0].z) * p[9].z) / (this.distance(p[0], p[9]) ** 2 || 1);
    const unitLateral = { x: lateral.x / Math.sqrt(width2), y: lateral.y / Math.sqrt(width2), z: lateral.z / Math.sqrt(width2) };
    const lateralDot = p[9].x * unitLateral.x + p[9].y * unitLateral.y + p[9].z * unitLateral.z;
    const palmUp = { x: p[9].x - lateralDot * unitLateral.x, y: p[9].y - lateralDot * unitLateral.y, z: p[9].z - lateralDot * unitLateral.z };
    const upLength = Math.hypot(palmUp.x, palmUp.y, palmUp.z) || 1;
    const terminal = { x: p[4].x - p[3].x, y: p[4].y - p[3].y, z: p[4].z - p[3].z };
    const distances: Record<string, number> = {
      thumbToIndexTip: this.distance(p[4], p[8]), thumbToMiddleTip: this.distance(p[4], p[12]),
      thumbToRingTip: this.distance(p[4], p[16]), thumbToPinkyTip: this.distance(p[4], p[20]),
      indexToMiddleTip: this.distance(p[8], p[12]), middleToRingTip: this.distance(p[12], p[16]), ringToPinkyTip: this.distance(p[16], p[20]),
      indexTipToWrist: this.distance(p[8], p[0]), pinkyTipToWrist: this.distance(p[20], p[0]),
      indexLength: this.fingerLength(p, 5), middleLength: this.fingerLength(p, 9),
      thumbToIndexTip2D: Math.hypot(p[4].x - p[8].x, p[4].y - p[8].y),
      thumbToMiddleTip2D: Math.hypot(p[4].x - p[12].x, p[4].y - p[12].y),
      thumbToMiddleSegment: Math.min(...[9, 10, 11].map(i => this.segmentDistance(p[4], p[i], p[i + 1]))),
      middleReach: this.distance(p[9], p[12]),
      thumbTerminalAcross: terminal.x * unitLateral.x + terminal.y * unitLateral.y + terminal.z * unitLateral.z,
      thumbTerminalAlong: (terminal.x * palmUp.x + terminal.y * palmUp.y + terminal.z * palmUp.z) / upLength,
      thumbAcross: slot(p[4]), thumbAlong: along(p[4]), indexReach: this.distance(p[8], p[5]),
      tipAlong: (along(p[8]) + along(p[12])) / 2,
      compactCount: [5, 9, 13, 17].filter(i => this.distance(p[i], p[i + 3]) / Math.max(1e-6, this.fingerLength(p, i)) < 0.42).length
    };
    const isFist = !index.isExtended && !middle.isExtended && !ring.isExtended && !pinky.isExtended;
    const horizontal = (base: number) => Math.abs(p[base + 3].x - p[base].x) > Math.abs(p[base + 3].y - p[base].y) * 1.25;
    const indexDown = p[8].y - p[5].y > 0.25 && p[8].y - p[5].y > Math.abs(p[8].x - p[5].x) * 0.5;
    let thumbFistSlot: AnalyzedHandGeometry['thumbFistSlot'] = 'NONE';
    if (isFist) {
      const across = distances.thumbAcross;
      if (across < -0.12 && thumb.isExtended) thumbFistSlot = 'A';
      else if (distances.thumbAlong < 0.68 && across >= -0.1 && across <= 0.95) thumbFistSlot = 'S';
      else if (distances.thumbAlong >= 0.68 && across >= -0.06 && across <= 1.15) {
        // Locate actual gaps between this hand's knuckles, rather than dividing palm width into thirds.
        const centers = [(slot(p[5]) + slot(p[9])) / 2, (slot(p[9]) + slot(p[13])) / 2, (slot(p[13]) + slot(p[17])) / 2];
        const ranked = centers.map((center, i) => ({ letter: (['T', 'N', 'M'] as const)[i], error: Math.abs(across - center) })).sort((a, b) => a.error - b.error);
        distances.thumbSlotMargin = ranked[1].error - ranked[0].error;
        if (distances.thumbSlotMargin >= 0.07) thumbFistSlot = ranked[0].letter;
        else distances.thumbSlotAmbiguous = 1;
      }
      if (distances.tipAlong < 1.15 && distances.thumbAlong < 1 && distances.thumbToIndexTip < 0.35 && distances.thumbToMiddleTip < 0.4) thumbFistSlot = 'E';
    }
    return {
      thumb, index, middle, ring, pinky, distances, isFist,
      isOpenPalm: index.isExtended && middle.isExtended && ring.isExtended && pinky.isExtended,
      isIndexPointingHorizontal: index.isExtended && horizontal(5),
      isMiddlePointingHorizontal: middle.isExtended && horizontal(9),
      isIndexPointingDown: index.isExtended && indexDown,
      isMiddlePointingDown: distances.middleReach / distances.middleLength > 0.45 && p[12].y > p[9].y + 0.2,
      // Require an actual inversion of fingertip ordering, not merely close fingers.
      isIndexMiddleCrossed: index.isExtended && middle.isExtended && slot(p[8]) > slot(p[12]) + 0.06,
      thumbFistSlot
    };
  }
}
