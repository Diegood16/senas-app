import { HandLandmarks } from '../types/vision';
import { LandmarkNormalizer } from './LandmarkNormalizer';

export interface ClassificationOutput {
  letter: string;
  confidence: number;
  hint: string;
}

export class GestureClassifier {
  /**
   * Clasifica la postura de la mano a partir de sus 21 puntos.
   * Si se pasa un `targetLetter`, optimiza y tolera la oclusión para esa letra objetivo.
   */
  public static classify(
    landmarks: HandLandmarks,
    isMirrored = false,
    targetLetter?: string
  ): ClassificationOutput | null {
    if (!landmarks || landmarks.length < 21) return null;

    // 1. Normalizar geometría
    const normalized = LandmarkNormalizer.normalize(landmarks, isMirrored);
    const geo = LandmarkNormalizer.analyzeGeometry(normalized);

    const {
      thumb,
      index,
      middle,
      ring,
      pinky,
      distances,
      isIndexPointingHorizontal,
      isMiddlePointingHorizontal,
      isIndexPointingDown,
      isIndexMiddleCrossed,
      thumbFistSlot,
      isFist
    } = geo;

    // ==============================================================
    // 1. EVALUACIÓN PRIORITARIA CON TOLERANCIA DE OBJETIVO (TARGET)
    // ==============================================================
    if (targetLetter) {
      // --- LETRA A (Puño cerrado con pulgar al lateral) ---
      if (targetLetter === 'A') {
        if (
          isFist &&
          (thumbFistSlot === 'A' || thumb.isExtended || normalized[4].x < normalized[5].x - 0.05)
        ) {
          return {
            letter: 'A',
            confidence: 0.95,
            hint: '¡Excelente A! Puño cerrado con pulgar apoyado al lateral.'
          };
        }
      }

      // --- LETRA C (Mano en arco abierto / forma de taza, NUNCA puño) ---
      if (targetLetter === 'C') {
        if (
          !isFist &&
          distances.indexTipToWrist > 0.6 &&
          distances.thumbToIndexTip >= 0.35 &&
          distances.thumbToIndexTip <= 0.85
        ) {
          return {
            letter: 'C',
            confidence: 0.94,
            hint: '¡Excelente C! Arco abierto y curvado.'
          };
        }
      }

      // --- LETRA G (Índice horizontal + pulgar paralelo) ---
      if (targetLetter === 'G') {
        if (
          (isIndexPointingHorizontal || (index.isExtended && Math.abs(normalized[8].x - normalized[5].x) > 0.4)) &&
          !middle.isExtended &&
          !ring.isExtended &&
          !pinky.isExtended
        ) {
          return {
            letter: 'G',
            confidence: 0.93,
            hint: '¡Excelente G! Índice apuntando al lateral con pulgar paralelo.'
          };
        }
      }

      // --- LETRA H (Índice y Medio horizontales juntos) ---
      if (targetLetter === 'H') {
        if (
          (isMiddlePointingHorizontal || isIndexPointingHorizontal || (index.isExtended && middle.isExtended)) &&
          distances.indexToMiddleTip < 0.35 &&
          !ring.isExtended &&
          !pinky.isExtended
        ) {
          return {
            letter: 'H',
            confidence: 0.94,
            hint: '¡Muy bien la H! Dos dedos juntos apuntando al lateral.'
          };
        }
      }

      // --- LETRA R (Índice y Medio cruzados) ---
      if (targetLetter === 'R') {
        if (
          index.isExtended &&
          middle.isExtended &&
          !ring.isExtended &&
          !pinky.isExtended &&
          (isIndexMiddleCrossed || distances.indexToMiddleTip < 0.22)
        ) {
          return {
            letter: 'R',
            confidence: 0.92,
            hint: '¡Perfecta R! Dedos índice y medio cruzados.'
          };
        }
      }

      // --- LETRA P (Índice y Medio hacia abajo / K invertida) ---
      if (targetLetter === 'P') {
        if (
          (isIndexPointingDown || normalized[8].y > normalized[5].y) &&
          !ring.isExtended &&
          !pinky.isExtended
        ) {
          return {
            letter: 'P',
            confidence: 0.91,
            hint: '¡Buena P! Dedos apuntando hacia abajo.'
          };
        }
      }

      // --- LETRAS CON PUÑO Y PULGAR EN DIFERENTES POSICIONES (S, T, N, M) ---
      if (isFist) {
        // LETRA S: Pulgar cruzado por el frente de los nudillos
        if (targetLetter === 'S') {
          if (thumbFistSlot === 'S' || (!thumb.isExtended && distances.thumbToIndexTip < 0.45)) {
            return {
              letter: 'S',
              confidence: 0.92,
              hint: '¡Excelente S! Pulgar cruzado por delante del puño.'
            };
          }
        }

        // LETRA T: Pulgar asomando entre índice y medio
        if (targetLetter === 'T') {
          if (thumbFistSlot === 'T' || thumbFistSlot === 'S' || normalized[4].x <= (normalized[5].x + normalized[9].x) / 2 + 0.05) {
            return {
              letter: 'T',
              confidence: 0.91,
              hint: '¡Bien la T! Pulgar asomando entre índice y medio.'
            };
          }
        }

        // LETRA N: Pulgar asomando entre medio y anular (2 dedos encima)
        if (targetLetter === 'N') {
          if (thumbFistSlot === 'N' || (normalized[4].x > normalized[5].x && normalized[4].x <= normalized[13].x)) {
            return {
              letter: 'N',
              confidence: 0.91,
              hint: '¡Bien la N! Pulgar asomando entre medio y anular.'
            };
          }
        }

        // LETRA M: Pulgar asomando entre anular y meñique (3 dedos encima)
        if (targetLetter === 'M') {
          if (thumbFistSlot === 'M' || normalized[4].x > (normalized[9].x + normalized[13].x) / 2 - 0.05) {
            return {
              letter: 'M',
              confidence: 0.91,
              hint: '¡Bien la M! Tres dedos doblados sobre el pulgar.'
            };
          }
        }
      }
    }

    // ==============================================================
    // 2. CLASIFICACIÓN GENERAL (PARA MODO TRANSCRIPTOR Y JUEGO ABIERTO)
    // ==============================================================

    // --- LETRA R (Índice y Medio cruzados) ---
    if (
      index.isExtended &&
      middle.isExtended &&
      !ring.isExtended &&
      !pinky.isExtended &&
      isIndexMiddleCrossed
    ) {
      return {
        letter: 'R',
        confidence: 0.92,
        hint: '¡Dedos cruzados! Letra R detectada.'
      };
    }

    // --- LETRA H (Índice y Medio horizontales) ---
    if (
      (isIndexPointingHorizontal || isMiddlePointingHorizontal) &&
      index.isExtended &&
      middle.isExtended &&
      !ring.isExtended &&
      !pinky.isExtended &&
      distances.indexToMiddleTip < 0.32
    ) {
      return {
        letter: 'H',
        confidence: 0.92,
        hint: '¡Letra H! Dos dedos extendidos al lateral.'
      };
    }

    // --- LETRA G (Índice horizontal + pulgar paralelo) ---
    if (
      isIndexPointingHorizontal &&
      !middle.isExtended &&
      !ring.isExtended &&
      !pinky.isExtended &&
      thumb.isExtended
    ) {
      return {
        letter: 'G',
        confidence: 0.91,
        hint: '¡Letra G! Índice apuntando al lateral.'
      };
    }

    // --- LETRA P (Dedos hacia abajo) ---
    if (
      isIndexPointingDown &&
      !ring.isExtended &&
      !pinky.isExtended &&
      distances.thumbToMiddleTip < 0.45
    ) {
      return {
        letter: 'P',
        confidence: 0.90,
        hint: '¡Letra P! Mano inclinada hacia abajo.'
      };
    }

    // --- LETRA L (Índice arriba, Pulgar a 90°, otros cerrados) ---
    if (
      index.isExtended &&
      !middle.isExtended &&
      !ring.isExtended &&
      !pinky.isExtended &&
      thumb.isExtended &&
      distances.thumbToIndexTip > 0.75
    ) {
      return {
        letter: 'L',
        confidence: 0.94,
        hint: '¡Excelente L! Pulgar e índice en ángulo recto.'
      };
    }

    // --- LETRA Y (Pulgar y Meñique extendidos, centro cerrado) ---
    if (
      thumb.isExtended &&
      pinky.isExtended &&
      !index.isExtended &&
      !middle.isExtended &&
      !ring.isExtended
    ) {
      return {
        letter: 'Y',
        confidence: 0.93,
        hint: '¡Gran letra Y! Pulgar y meñique bien extendidos.'
      };
    }

    // --- LETRA I (Solo Meñique arriba, puño cerrado) ---
    if (
      pinky.isExtended &&
      !index.isExtended &&
      !middle.isExtended &&
      !ring.isExtended &&
      !thumb.isExtended
    ) {
      return {
        letter: 'I',
        confidence: 0.92,
        hint: '¡Perfecta I! Meñique erguido y puño firme.'
      };
    }

    // --- LETRA D (Solo Índice arriba, pulgar tocando medio/anular) ---
    if (
      index.isExtended &&
      !middle.isExtended &&
      !ring.isExtended &&
      !pinky.isExtended &&
      distances.thumbToMiddleTip < 0.45
    ) {
      return {
        letter: 'D',
        confidence: 0.91,
        hint: '¡Muy bien la D! Índice apuntando al cielo.'
      };
    }

    // --- LETRA F (Pulgar e índice en anillo, medio/anular/meñique extendidos) ---
    if (
      middle.isExtended &&
      ring.isExtended &&
      pinky.isExtended &&
      distances.thumbToIndexTip < 0.35
    ) {
      return {
        letter: 'F',
        confidence: 0.92,
        hint: '¡Buena F! Pulgar e índice unidos en anillo.'
      };
    }

    // --- LETRA V (Índice y Medio arriba y SEPARADOS) ---
    if (
      index.isExtended &&
      middle.isExtended &&
      !ring.isExtended &&
      !pinky.isExtended &&
      distances.indexToMiddleTip > 0.28
    ) {
      return {
        letter: 'V',
        confidence: 0.95,
        hint: '¡Excelente V de victoria! Dedos bien separados.'
      };
    }

    // --- LETRA U (Índice y Medio arriba y JUNTOS) ---
    if (
      index.isExtended &&
      middle.isExtended &&
      !ring.isExtended &&
      !pinky.isExtended &&
      distances.indexToMiddleTip <= 0.28
    ) {
      return {
        letter: 'U',
        confidence: 0.93,
        hint: '¡Muy bien la U! Índice y medio bien unidos.'
      };
    }

    // --- LETRA W (Índice, Medio y Anular arriba) ---
    if (
      index.isExtended &&
      middle.isExtended &&
      ring.isExtended &&
      !pinky.isExtended
    ) {
      return {
        letter: 'W',
        confidence: 0.91,
        hint: '¡Gran W! Tres dedos estirados hacia arriba.'
      };
    }

    // --- LETRA B (4 dedos juntos arriba, pulgar sobre la palma) ---
    if (
      index.isExtended &&
      middle.isExtended &&
      ring.isExtended &&
      pinky.isExtended &&
      !thumb.isExtended
    ) {
      return {
        letter: 'B',
        confidence: 0.94,
        hint: '¡Excelente B! Palma plana y pulgar plegado.'
      };
    }

    // --- LETRA O (Círculo cerrado entre pulgar y las yemas de los 4 dedos) ---
    if (
      !index.isExtended &&
      !middle.isExtended &&
      distances.thumbToIndexTip < 0.3 &&
      distances.thumbToMiddleTip < 0.35
    ) {
      return {
        letter: 'O',
        confidence: 0.88,
        hint: '¡Buena O! Círculo cerrado y redondeado.'
      };
    }

    // --- PUÑOS VARIANTES (A, S, T, N, M, E) ---
    // IMPORTANTE: Se evalúa antes de la C para evitar falsos positivos
    if (isFist) {
      if (thumbFistSlot === 'A' || thumb.isExtended) {
        return {
          letter: 'A',
          confidence: 0.94,
          hint: '¡Excelente A! Puño cerrado con pulgar al lateral.'
        };
      }

      if (thumbFistSlot === 'S') {
        return {
          letter: 'S',
          confidence: 0.90,
          hint: '¡Letra S! Pulgar cruzado por delante.'
        };
      }

      if (thumbFistSlot === 'T') {
        return {
          letter: 'T',
          confidence: 0.89,
          hint: '¡Letra T! Pulgar entre índice y medio.'
        };
      }

      if (thumbFistSlot === 'N') {
        return {
          letter: 'N',
          confidence: 0.88,
          hint: '¡Letra N! Pulgar entre medio y anular.'
        };
      }

      if (thumbFistSlot === 'M') {
        return {
          letter: 'M',
          confidence: 0.88,
          hint: '¡Letra M! Tres dedos sobre el pulgar.'
        };
      }

      if (thumbFistSlot === 'E') {
        return {
          letter: 'E',
          confidence: 0.87,
          hint: '¡Bien la E! Yemas replegadas sobre el pulgar.'
        };
      }
    }

    // --- LETRA C (Mano en arco abierto sin tocarse, NUNCA en puño) ---
    if (
      !isFist &&
      !index.isExtended &&
      distances.indexTipToWrist > 0.58 &&
      distances.thumbToIndexTip >= 0.38 &&
      distances.thumbToIndexTip <= 0.85 &&
      thumb.isExtended
    ) {
      return {
        letter: 'C',
        confidence: 0.88,
        hint: '¡Buena C! Arco abierto y claro.'
      };
    }

    return null;
  }
}
