import { Landmark3D, HandLandmarks, AnalyzedHandGeometry, FingerState } from '../types/vision';

/**
 * Normaliza las coordenadas de la mano para hacerlas invariantes a la distancia y posición.
 */
export class LandmarkNormalizer {
  /**
   * Traslada la muñeca al origen (0, 0, 0) y escala la mano a tamaño unitario
   * basado en la distancia de la muñeca (0) al nudillo del medio (9).
   */
  public static normalize(landmarks: HandLandmarks, isMirrored = false): HandLandmarks {
    if (!landmarks || landmarks.length < 21) return landmarks;

    const wrist = landmarks[0];
    const middleMCP = landmarks[9];

    // Distancia base para normalización de escala
    const scale = Math.hypot(
      middleMCP.x - wrist.x,
      middleMCP.y - wrist.y,
      (middleMCP.z || 0) - (wrist.z || 0)
    ) || 1.0;

    return landmarks.map(point => {
      let x = (point.x - wrist.x) / scale;
      const y = (point.y - wrist.y) / scale;
      const z = ((point.z || 0) - (wrist.z || 0)) / scale;

      if (isMirrored) {
        x = -x;
      }

      return { x, y, z };
    });
  }

  /**
   * Distancia euclidiana 3D entre dos puntos.
   */
  public static distance(p1: Landmark3D, p2: Landmark3D): number {
    return Math.hypot(p1.x - p2.x, p1.y - p2.y, (p1.z || 0) - (p2.z || 0));
  }

  /**
   * Determina si un dedo está extendido o doblado en base a sus articulaciones:
   * MCP (base), PIP (intermedia), DIP (alta), TIP (punta).
   */
  private static checkFingerState(
    wrist: Landmark3D,
    mcp: Landmark3D,
    pip: Landmark3D,
    tip: Landmark3D
  ): FingerState {
    const distTipToWrist = this.distance(tip, wrist);
    const distPipToWrist = this.distance(pip, wrist);
    const distMcpToWrist = this.distance(mcp, wrist);

    // Si la punta está significativamente más lejos de la muñeca que la articulación intermedia
    const isExtended = distTipToWrist > distPipToWrist * 1.12 && distTipToWrist > distMcpToWrist;
    const curl = Math.max(0, Math.min(1, (distPipToWrist * 1.3 - distTipToWrist) / (distPipToWrist * 0.8)));

    return { isExtended, curl };
  }

  /**
   * Extrae la anatomía completa de la mano para clasificar señas.
   */
  public static analyzeGeometry(rawLandmarks: HandLandmarks): AnalyzedHandGeometry {
    const wrist = rawLandmarks[0];

    // Pulgar (1: CMC, 2: MCP, 3: IP, 4: TIP)
    const thumbTip = rawLandmarks[4];
    const thumbMcp = rawLandmarks[2];
    const indexMcp = rawLandmarks[5];
    const indexTip = rawLandmarks[8];
    const middleMcp = rawLandmarks[9];
    const middleTip = rawLandmarks[12];
    const ringMcp = rawLandmarks[13];

    const distThumbToIndexMcp = this.distance(thumbTip, indexMcp);
    const distThumbToWrist = this.distance(thumbTip, wrist);
    const isThumbExtended = distThumbToWrist > this.distance(thumbMcp, wrist) * 1.15 && distThumbToIndexMcp > 0.35;

    // Índice (5: MCP, 6: PIP, 7: DIP, 8: TIP)
    const indexState = this.checkFingerState(wrist, rawLandmarks[5], rawLandmarks[6], rawLandmarks[8]);
    // Medio (9: MCP, 10: PIP, 11: DIP, 12: TIP)
    const middleState = this.checkFingerState(wrist, rawLandmarks[9], rawLandmarks[10], rawLandmarks[12]);
    // Anular (13: MCP, 14: PIP, 15: DIP, 16: TIP)
    const ringState = this.checkFingerState(wrist, rawLandmarks[13], rawLandmarks[14], rawLandmarks[16]);
    // Meñique (17: MCP, 18: PIP, 19: DIP, 20: TIP)
    const pinkyState = this.checkFingerState(wrist, rawLandmarks[17], rawLandmarks[18], rawLandmarks[20]);

    // Distancias clave entre puntas
    const distances: Record<string, number> = {
      thumbToIndexTip: this.distance(thumbTip, rawLandmarks[8]),
      thumbToMiddleTip: this.distance(thumbTip, rawLandmarks[12]),
      thumbToRingTip: this.distance(thumbTip, rawLandmarks[16]),
      thumbToPinkyTip: this.distance(thumbTip, rawLandmarks[20]),
      indexToMiddleTip: this.distance(rawLandmarks[8], rawLandmarks[12]),
      middleToRingTip: this.distance(rawLandmarks[12], rawLandmarks[16]),
      ringToPinkyTip: this.distance(rawLandmarks[16], rawLandmarks[20]),
      indexTipToWrist: this.distance(rawLandmarks[8], wrist),
      pinkyTipToWrist: this.distance(rawLandmarks[20], wrist)
    };

    // Orientaciones vectoriales para letras horizontales (G, H) y hacia abajo (P)
    const isIndexPointingHorizontal =
      (indexState.isExtended || distances.indexTipToWrist > 0.7) &&
      Math.abs(indexTip.x - indexMcp.x) > Math.abs(indexTip.y - indexMcp.y) * 0.7;

    const isMiddlePointingHorizontal =
      (middleState.isExtended || distances.indexToMiddleTip < 0.25) &&
      Math.abs(middleTip.x - middleMcp.x) > Math.abs(middleTip.y - middleMcp.y) * 0.7;

    const isIndexPointingDown =
      (indexState.isExtended || distances.indexTipToWrist > 0.6) &&
      indexTip.y > indexMcp.y + 0.1;

    const isMiddlePointingDown =
      (middleState.isExtended || distances.thumbToMiddleTip < 0.4) &&
      middleTip.y > middleMcp.y + 0.05;

    // Dedos cruzados (Letra R)
    const isIndexMiddleCrossed =
      indexState.isExtended &&
      middleState.isExtended &&
      (middleTip.x < indexTip.x || distances.indexToMiddleTip < 0.15);

    const isFist =
      !indexState.isExtended &&
      !middleState.isExtended &&
      !ringState.isExtended &&
      !pinkyState.isExtended;

    const isOpenPalm =
      indexState.isExtended &&
      middleState.isExtended &&
      ringState.isExtended &&
      pinkyState.isExtended &&
      isThumbExtended;

    // Determinar la posición del pulgar en puño (A, S, T, N, M, E)
    let thumbFistSlot: 'A' | 'T' | 'N' | 'M' | 'S' | 'E' | 'NONE' = 'NONE';
    if (isFist) {
      const boundaryIndexMiddle = (indexMcp.x + middleMcp.x) / 2;
      const boundaryMiddleRing = (middleMcp.x + ringMcp.x) / 2;

      // Si el pulgar está al costado exterior (Letra A)
      if (thumbTip.x < indexMcp.x - 0.08 && isThumbExtended) {
        thumbFistSlot = 'A';
      }
      // Si el pulgar está cruzado por el frente de los nudillos (Letra S)
      else if (distances.thumbToIndexTip < 0.45 && distances.thumbToMiddleTip < 0.45 && thumbTip.y > -0.8 && thumbTip.y < 0.2) {
        thumbFistSlot = 'S';
      }
      // Si el pulgar está metido entre los dedos (T, N, M)
      else if (thumbTip.x <= boundaryIndexMiddle) {
        thumbFistSlot = 'T'; // Entre índice y medio
      } else if (thumbTip.x <= boundaryMiddleRing) {
        thumbFistSlot = 'N'; // Entre medio y anular
      } else {
        thumbFistSlot = 'M'; // Bajo anular / meñique
      }

      // Si las puntas están replegadas sobre el pulgar (Letra E)
      if (distances.thumbToIndexTip < 0.28 && distances.thumbToMiddleTip < 0.32 && !isThumbExtended) {
        thumbFistSlot = 'E';
      }
    }

    return {
      thumb: { isExtended: isThumbExtended, curl: isThumbExtended ? 0 : 1 },
      index: indexState,
      middle: middleState,
      ring: ringState,
      pinky: pinkyState,
      isFist,
      isOpenPalm,
      isIndexPointingHorizontal,
      isMiddlePointingHorizontal,
      isIndexPointingDown,
      isMiddlePointingDown,
      isIndexMiddleCrossed,
      thumbFistSlot,
      distances
    };
  }
}
