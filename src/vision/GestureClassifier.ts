import { HandLandmarks } from '../types/vision';
import { CalibrationProfile } from './RecognitionCalibration';
import { LandmarkNormalizer } from './LandmarkNormalizer';

export interface ClassificationOutput {
  letter: string;
  confidence: number; // Internal rule score; not a measured probability.
  hint: string;
}

export class GestureClassifier {
  public static classify(points: HandLandmarks, mirrored = false, targetLetter?: string, calibration?: CalibrationProfile): ClassificationOutput | null {
    if (!points || points.length !== 21 || points.some(p => ![p.x, p.y, p.z].every(Number.isFinite))) return null;
    const geo = LandmarkNormalizer.analyzeGeometry(LandmarkNormalizer.normalize(points, mirrored));
    const { thumb, index, middle, ring, pinky, distances: d } = geo;
    // Distances are expressed relative to the user's open-finger lengths, not pixels.
    const indexLength = calibration?.fingerLengths[1] || d.indexLength || 1.3;
    const middleLength = calibration?.fingerLengths[2] || d.middleLength || 1.4;
    const indexContact = d.thumbToIndexTip / indexLength;
    const middleContact = d.thumbToMiddleTip / middleLength;
    const separation = d.indexToMiddleTip / indexLength;
    // Estimated depth can disagree slightly at touching fingertips. Projected contact
    // only supplements 3D contact when the spatial separation is still bounded.
    const indexTouch = indexContact < 0.25 || (d.thumbToIndexTip2D / indexLength < 0.22 && indexContact < 0.45);
    const middleTouch = middleContact < 0.28 || (d.thumbToMiddleTip2D / middleLength < 0.25 && middleContact < 0.45);
    const contact = indexTouch && middleTouch;
    const fingers = [index, middle, ring, pinky];
    const pattern = (...values: boolean[]) => fingers.every((finger, i) => finger.isExtended === values[i]);
    const pair = pattern(true, true, false, false);
    const horizontal = geo.isIndexPointingHorizontal && geo.isMiddlePointingHorizontal;
    const down = geo.isIndexPointingDown;
    const pShape = index.isExtended && !ring.isExtended && !pinky.isExtended
      && (down || geo.isMiddlePointingDown)
      && d.middleReach / middleLength > 0.45
      && d.thumbToMiddleSegment / middleLength < 0.3;
    const candidates: string[] = [];
    const offer = (letter: string, condition: boolean) => { if (condition) candidates.push(letter); };

    offer('R', pair && geo.isIndexMiddleCrossed);
    offer('H', pair && horizontal && !down && !pShape && !geo.isIndexMiddleCrossed && separation < 0.34);
    offer('U', pair && !horizontal && !down && !pShape && !geo.isIndexMiddleCrossed && separation <= 0.32);
    offer('V', pair && !horizontal && !down && !pShape && !geo.isIndexMiddleCrossed && separation > 0.32);
    offer('P', pShape);
    offer('G', pattern(true, false, false, false) && geo.isIndexPointingHorizontal && !down && !pShape && thumb.isExtended);
    offer('L', pattern(true, false, false, false) && !geo.isIndexPointingHorizontal && !down && thumb.isExtended && indexContact > 0.6 && middleContact > 0.35);
    offer('D', pattern(true, false, false, false) && !geo.isIndexPointingHorizontal && !down && middleContact < 0.35);
    offer('Y', pattern(false, false, false, true) && thumb.isExtended);
    offer('I', pattern(false, false, false, true) && !thumb.isExtended);
    offer('F', middle.isExtended && ring.isExtended && pinky.isExtended && indexContact < 0.28);
    offer('W', pattern(true, true, true, false));
    offer('B', pattern(true, true, true, true) && !thumb.isExtended && indexContact >= 0.28);

    if (geo.isFist) {
      // Curved C/O must be considered before compact fists. A bent finger is not automatically a fist.
      const compact = (d.compactCount ?? fingers.filter(f => f.curl >= 0.65).length) >= 3;
      const round = !compact && (d.tipAlong ?? 1.5) > 1.12;
      offer('O', contact && round);
      offer('C', round && !contact && indexContact >= 0.3 && indexContact <= 0.95 && middleContact >= 0.28);
      // A requires a compact fist; an imperfect round O must not fall back to A.
      offer('A', compact && !contact && thumb.isExtended && geo.thumbFistSlot === 'A');
      if (!round) {
        // S crosses the thumb over the folded fingers. A thumb tip near the
        // index/middle gap alone cannot distinguish S from T or E.
        const crossedThumb = d.thumbAcross >= -0.05 && d.thumbAcross <= 0.45
          && d.thumbAlong >= 0.5 && d.thumbAlong <= 1.25 && d.tipAlong < 1.18
          && d.thumbTerminalAcross > 0.1
          && d.thumbTerminalAcross > Math.abs(d.thumbTerminalAlong) * 0.45;
        const eShape = indexContact < 0.34 && middleContact < 0.36
          && d.tipAlong < 1.22 && d.thumbAlong < 1.12
          && d.thumbAlong <= d.tipAlong + 0.07 && !crossedThumb;
        offer('E', eShape);
        offer('S', crossedThumb || (!eShape && geo.thumbFistSlot === 'S'));
        // A straight thumb can still be crossed over a fist or tucked between fingers.
        for (const letter of ['T', 'N', 'M']) offer(letter, !crossedThumb && !eShape && geo.thumbFistSlot === letter);
      }
    }

    if (candidates.length !== 1) return {
      letter: '', confidence: 0,
      hint: candidates.length > 1
        ? 'Postura ambigua entre ' + candidates.join(' y ') + '. Gira ligeramente la mano para mostrar los dedos.'
        : d.thumbSlotAmbiguous
          ? 'No se ve claramente entre qué dedos está el pulgar. Gira ligeramente el puño para mostrar su punta.'
          : 'No se distingue la postura' + (targetLetter ? ' de ' + targetLetter : '') + '. Revisa dedos y pulgar; muestra los puntos para comprobar el seguimiento.'
    };
    const letter = candidates[0];
    return { letter, confidence: 0.9, hint: 'Postura compatible con ' + letter + '. Mantén la mano estable.' };
  }
}
