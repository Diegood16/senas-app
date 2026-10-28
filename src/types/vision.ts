export interface Landmark3D {
  x: number; // Coordenada horizontal normalizada [0, 1]
  y: number; // Coordenada vertical normalizada [0, 1]
  z: number; // Profundidad relativa
}

export type HandLandmarks = Landmark3D[];

export interface HandDetectionResult {
  landmarks: HandLandmarks[];
  handedness?: 'Left' | 'Right';
  confidence: number;
}

export interface FingerState {
  isExtended: boolean;
  curl: number; // 0 = extendido, 1 = completamente doblado
}

export interface AnalyzedHandGeometry {
  thumb: FingerState;
  index: FingerState;
  middle: FingerState;
  ring: FingerState;
  pinky: FingerState;
  isFist: boolean;
  isOpenPalm: boolean;
  isIndexPointingHorizontal: boolean;
  isMiddlePointingHorizontal: boolean;
  isIndexPointingDown: boolean;
  isMiddlePointingDown: boolean;
  isIndexMiddleCrossed: boolean;
  thumbFistSlot: 'A' | 'T' | 'N' | 'M' | 'S' | 'E' | 'NONE';
  distances: Record<string, number>;
}
