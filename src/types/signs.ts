export type SignCategory = 'vocal' | 'consonante' | 'palabra';

export interface SignLetter {
  id: string;
  letter: string;
  name: string;
  category: SignCategory;
  difficulty: 'Fácil' | 'Media' | 'Avanzada';
  description: string;
  imagePath: string; // Ruta de la ilustración SVG de la mano
  anatomicalTips: string[];
  commonMistakes: string[];
  visualFeatures: {
    thumb: string;
    index: string;
    middle: string;
    ring: string;
    pinky: string;
  };
}
