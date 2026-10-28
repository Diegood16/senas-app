import { SignLetter } from '../types/signs';

export const DACTYLOLOGY_ALPHABET: SignLetter[] = [
  {
    id: 'a',
    letter: 'A',
    name: 'Letra A',
    category: 'vocal',
    difficulty: 'Fácil',
    imagePath: '/signs/a.svg',
    description: 'Puño cerrado mirando al frente con el pulgar erguido descansando al lado del dedo índice.',
    anatomicalTips: [
      'Cierra los 4 dedos (índice, medio, anular y meñique) en un puño.',
      'Mantén el pulgar recto y apoyado pegado al lateral exterior del índice.',
      'La palma debe apuntar directamente hacia la cámara.'
    ],
    commonMistakes: [
      'No escondas el pulgar dentro del puño.',
      'No cruces el pulgar sobre las uñas (eso sería una S).'
    ],
    visualFeatures: {
      thumb: 'Extendido al lateral',
      index: 'Completamente doblado',
      middle: 'Completamente doblado',
      ring: 'Completamente doblado',
      pinky: 'Completamente doblado'
    }
  },
  {
    id: 'b',
    letter: 'B',
    name: 'Letra B',
    category: 'consonante',
    difficulty: 'Fácil',
    imagePath: '/signs/b.svg',
    description: 'Palma abierta hacia el frente con los 4 dedos juntos y estirados hacia arriba, y el pulgar cruzado sobre la palma.',
    anatomicalTips: [
      'Extiende el índice, medio, anular y meñique juntos hacia arriba sin separarlos.',
      'Flexiona el pulgar sobre el centro de la palma.',
      'Mantén la muñeca recta.'
    ],
    commonMistakes: [
      'Separar los dedos (deben estar unidos).',
      'Dejar el pulgar salido hacia un lado en lugar de apoyarlo en la palma.'
    ],
    visualFeatures: {
      thumb: 'Cruzado sobre la palma',
      index: 'Extendido vertical',
      middle: 'Extendido vertical',
      ring: 'Extendido vertical',
      pinky: 'Extendido vertical'
    }
  },
  {
    id: 'c',
    letter: 'C',
    name: 'Letra C',
    category: 'consonante',
    difficulty: 'Fácil',
    imagePath: '/signs/c.svg',
    description: 'Mano curvada en forma de letra "C" vista de perfil o semicurva frontal.',
    anatomicalTips: [
      'Curva los 4 dedos juntos como si sostuvieras una taza o pelota.',
      'Opón el pulgar a los demás dedos manteniendo un arco visible.',
      'El espacio entre el pulgar y las yemas debe ser claro y circular.'
    ],
    commonMistakes: [
      'Cerrar los dedos tocando el pulgar (eso formaría una O).',
      'Dejar los dedos rectos en ángulo recto.'
    ],
    visualFeatures: {
      thumb: 'Curvado hacia arriba formando arco',
      index: 'Semicurvado',
      middle: 'Semicurvado',
      ring: 'Semicurvado',
      pinky: 'Semicurvado'
    }
  },
  {
    id: 'd',
    letter: 'D',
    name: 'Letra D',
    category: 'consonante',
    difficulty: 'Fácil',
    imagePath: '/signs/d.svg',
    description: 'Dedo índice apuntando recto hacia arriba, mientras el pulgar toca las yemas del medio, anular y meñique formando un círculo.',
    anatomicalTips: [
      'Estira únicamente el dedo índice hacia arriba.',
      'Une la punta del pulgar con las yemas del dedo medio y anular.',
      'La palma se orienta hacia adelante o ligeramente en diagonal.'
    ],
    commonMistakes: [
      'Levantar el dedo medio por accidente.',
      'No tocar el pulgar con los dedos flexionados.'
    ],
    visualFeatures: {
      thumb: 'Toca las puntas de medio y anular',
      index: 'Extendido vertical',
      middle: 'Curvado tocando pulgar',
      ring: 'Curvado tocando pulgar',
      pinky: 'Curvado'
    }
  },
  {
    id: 'e',
    letter: 'E',
    name: 'Letra E',
    category: 'vocal',
    difficulty: 'Media',
    imagePath: '/signs/e.svg',
    description: 'Los cuatro dedos doblados hacia abajo tocando el pulgar que está recogido horizontalmente bajo ellos.',
    anatomicalTips: [
      'Dobla las dos primeras falanges de los cuatro dedos hacia la base de la palma.',
      'Coloca el pulgar flexionado por debajo de las yemas sin que sobrepase el meñique.',
      'Muestra las uñas y nudillos hacia la cámara.'
    ],
    commonMistakes: [
      'Cerrar un puño completo apretado.',
      'Dejar el pulgar por fuera tapando los nudillos.'
    ],
    visualFeatures: {
      thumb: 'Recogido bajo las yemas',
      index: 'Doblado en garra hacia abajo',
      middle: 'Doblado en garra hacia abajo',
      ring: 'Doblado en garra hacia abajo',
      pinky: 'Doblado en garra hacia abajo'
    }
  },
  {
    id: 'f',
    letter: 'F',
    name: 'Letra F',
    category: 'consonante',
    difficulty: 'Media',
    imagePath: '/signs/f.svg',
    description: 'La yema del dedo índice toca la yema del pulgar formando un círculo (gesto de "ok"), mientras el medio, anular y meñique están estirados hacia arriba.',
    anatomicalTips: [
      'Une la punta del pulgar y el índice en un anillo.',
      'Mantén los otros 3 dedos (medio, anular y meñique) estirados y ligeramente separados hacia arriba.',
      'Palma mirando al frente.'
    ],
    commonMistakes: [
      'Confundir con la letra D.'
    ],
    visualFeatures: {
      thumb: 'Toca la punta del índice en círculo',
      index: 'Curvado tocando pulgar',
      middle: 'Extendido vertical',
      ring: 'Extendido vertical',
      pinky: 'Extendido vertical'
    }
  },
  {
    id: 'g',
    letter: 'G',
    name: 'Letra G',
    category: 'consonante',
    difficulty: 'Media',
    imagePath: '/signs/g.svg',
    description: 'Dedo índice y pulgar extendidos hacia un lateral en paralelo, como sosteniendo un pequeño objeto.',
    anatomicalTips: [
      'Extiende el índice y el pulgar apuntando horizontalmente.',
      'Mantén los otros dedos doblados contra la palma.',
      'El dorso de la mano apunta ligeramente hacia arriba.'
    ],
    commonMistakes: [
      'Tocar las puntas de los dedos.'
    ],
    visualFeatures: {
      thumb: 'Extendido en paralelo al índice',
      index: 'Extendido horizontal',
      middle: 'Doblado',
      ring: 'Doblado',
      pinky: 'Doblado'
    }
  },
  {
    id: 'h',
    letter: 'H',
    name: 'Letra H',
    category: 'consonante',
    difficulty: 'Media',
    imagePath: '/signs/h.svg',
    description: 'Dedos índice y medio extendidos juntos horizontalmente, con el pulgar plegado sobre el anular.',
    anatomicalTips: [
      'Estira el índice y el medio juntos apuntando hacia un costado.',
      'Mantén la mano horizontal.',
      'Anular y meñique doblados.'
    ],
    commonMistakes: [
      'Separar los dedos o apuntar hacia arriba.'
    ],
    visualFeatures: {
      thumb: 'Sobre anular',
      index: 'Extendido horizontal',
      middle: 'Extendido horizontal junto al índice',
      ring: 'Doblado',
      pinky: 'Doblado'
    }
  },
  {
    id: 'i',
    letter: 'I',
    name: 'Letra I',
    category: 'vocal',
    difficulty: 'Fácil',
    imagePath: '/signs/i.svg',
    description: 'Puño cerrado con el dedo meñique apuntando recto hacia arriba y el pulgar sobre los demás dedos.',
    anatomicalTips: [
      'Cierra en puño el pulgar, índice, medio y anular.',
      'Estira solo el dedo meñique apuntando al cielo.',
      'Mantén la mano firme con la palma mirando al frente.'
    ],
    commonMistakes: [
      'Dejar el pulgar suelto o no flexionar bien los otros dedos.'
    ],
    visualFeatures: {
      thumb: 'Cruzado sobre dedos doblados',
      index: 'Doblado',
      middle: 'Doblado',
      ring: 'Doblado',
      pinky: 'Extendido verticalmente'
    }
  },
  {
    id: 'l',
    letter: 'L',
    name: 'Letra L',
    category: 'consonante',
    difficulty: 'Fácil',
    imagePath: '/signs/l.svg',
    description: 'Forma clara de "L" con el pulgar extendido en horizontal y el índice apuntando en vertical.',
    anatomicalTips: [
      'Abre un ángulo de 90 grados exactos entre el pulgar y el índice.',
      'Mantén el medio, anular y meñique doblados en puño contra la palma.',
      'Muestra la palma hacia la cámara.'
    ],
    commonMistakes: [
      'Cerrar demasiado el pulgar o inclinar el índice.'
    ],
    visualFeatures: {
      thumb: 'Extendido en ángulo recto (90°)',
      index: 'Extendido hacia arriba',
      middle: 'Doblado en puño',
      ring: 'Doblado en puño',
      pinky: 'Doblado en puño'
    }
  },
  {
    id: 'm',
    letter: 'M',
    name: 'Letra M',
    category: 'consonante',
    difficulty: 'Media',
    imagePath: '/signs/m.svg',
    description: 'El pulgar se asoma por debajo de tres dedos doblados (índice, medio y anular).',
    anatomicalTips: [
      'Dobla índice, medio y anular sobre el pulgar.',
      'El pulgar descansa entre el anular y el meñique.',
      'Los tres nudillos deben ser claramente visibles.'
    ],
    commonMistakes: [
      'Confundir con la N (la N solo cubre dos dedos sobre el pulgar).'
    ],
    visualFeatures: {
      thumb: 'Asomando bajo 3 dedos',
      index: 'Doblado sobre pulgar',
      middle: 'Doblado sobre pulgar',
      ring: 'Doblado sobre pulgar',
      pinky: 'Doblado al lateral'
    }
  },
  {
    id: 'n',
    letter: 'N',
    name: 'Letra N',
    category: 'consonante',
    difficulty: 'Media',
    imagePath: '/signs/n.svg',
    description: 'El pulgar se asoma por debajo de dos dedos doblados (índice y medio).',
    anatomicalTips: [
      'Dobla índice y medio sobre el pulgar.',
      'El pulgar descansa entre el dedo medio y el anular.',
      'Solo dos nudillos cubren el pulgar.'
    ],
    commonMistakes: [
      'Cubrir tres dedos (eso sería M).'
    ],
    visualFeatures: {
      thumb: 'Asomando bajo 2 dedos',
      index: 'Doblado sobre pulgar',
      middle: 'Doblado sobre pulgar',
      ring: 'Doblado',
      pinky: 'Doblado'
    }
  },
  {
    id: 'o',
    letter: 'O',
    name: 'Letra O',
    category: 'vocal',
    difficulty: 'Fácil',
    imagePath: '/signs/o.svg',
    description: 'Todos los dedos se curvan y sus yemas tocan la yema del pulgar formando un óvalo o círculo perfecto.',
    anatomicalTips: [
      'Curva los dedos de manera que formen un túnel circular con el pulgar.',
      'Las yemas de todos los dedos se encuentran con la punta del pulgar.',
      'El orificio circular debe ser visible de frente o en ligero perfil.'
    ],
    commonMistakes: [
      'Dejar el hueco abierto (eso sería una C).'
    ],
    visualFeatures: {
      thumb: 'Toca las puntas de los 4 dedos',
      index: 'Curvado tocando pulgar',
      middle: 'Curvado tocando pulgar',
      ring: 'Curvado tocando pulgar',
      pinky: 'Curvado tocando pulgar'
    }
  },
  {
    id: 'p',
    letter: 'P',
    name: 'Letra P',
    category: 'consonante',
    difficulty: 'Media',
    imagePath: '/signs/p.svg',
    description: 'Forma similar a una "K" pero inclinada hacia abajo.',
    anatomicalTips: [
      'Índice apuntando hacia adelante y abajo.',
      'Dedo medio en diagonal con el pulgar tocando la falange media.',
      'Mano inclinada hacia el suelo.'
    ],
    commonMistakes: [
      'Apuntar hacia arriba (eso sería una K).'
    ],
    visualFeatures: {
      thumb: 'Toca falange del medio',
      index: 'Extendido apuntando abajo',
      middle: 'Extendido en diagonal',
      ring: 'Doblado',
      pinky: 'Doblado'
    }
  },
  {
    id: 'r',
    letter: 'R',
    name: 'Letra R',
    category: 'consonante',
    difficulty: 'Fácil',
    imagePath: '/signs/r.svg',
    description: 'Dedo medio cruzado sobre el dedo índice, ambos apuntando hacia arriba (gesto de dedos cruzados).',
    anatomicalTips: [
      'Estira el índice y cruza el dedo medio por delante de él.',
      'Anular, meñique y pulgar doblados.',
      'Palma mirando al frente.'
    ],
    commonMistakes: [
      'No cruzar los dedos claramente.'
    ],
    visualFeatures: {
      thumb: 'Sobre anular',
      index: 'Extendido vertical',
      middle: 'Cruzado sobre el índice',
      ring: 'Doblado',
      pinky: 'Doblado'
    }
  },
  {
    id: 's',
    letter: 'S',
    name: 'Letra S',
    category: 'consonante',
    difficulty: 'Fácil',
    imagePath: '/signs/s.svg',
    description: 'Puño cerrado con el pulgar cruzado por encima de los dedos doblados en el centro.',
    anatomicalTips: [
      'Cierra los 4 dedos en un puño.',
      'Cruza el pulgar firmemente por delante sobre los dedos índice y medio.',
      'Dorso mirando a la cámara.'
    ],
    commonMistakes: [
      'Dejar el pulgar al lateral (eso sería una A).'
    ],
    visualFeatures: {
      thumb: 'Cruzado por delante de los dedos',
      index: 'Doblado en puño',
      middle: 'Doblado en puño',
      ring: 'Doblado en puño',
      pinky: 'Doblado en puño'
    }
  },
  {
    id: 't',
    letter: 'T',
    name: 'Letra T',
    category: 'consonante',
    difficulty: 'Media',
    imagePath: '/signs/t.svg',
    description: 'El pulgar se asoma entre el dedo índice y el dedo medio doblados.',
    anatomicalTips: [
      'Cierra la mano en puño.',
      'Pasa el pulgar entre el índice y el medio para que sobresalga su punta.',
      'Palma orientada al frente.'
    ],
    commonMistakes: [
      'Pasar el pulgar bajo tres dedos (eso sería M).'
    ],
    visualFeatures: {
      thumb: 'Asomando entre índice y medio',
      index: 'Doblado sobre pulgar',
      middle: 'Doblado',
      ring: 'Doblado',
      pinky: 'Doblado'
    }
  },
  {
    id: 'u',
    letter: 'U',
    name: 'Letra U',
    category: 'vocal',
    difficulty: 'Fácil',
    imagePath: '/signs/u.svg',
    description: 'Dedo índice y dedo medio estirados hacia arriba y pegados uno al lado del otro, con el pulgar sobre el anular y meñique.',
    anatomicalTips: [
      'Levanta el índice y el medio bien rectos.',
      'Pega ambos dedos entre sí sin dejar espacio entre ellos.',
      'Cierra anular y meñique con el pulgar descansando sobre ellos.'
    ],
    commonMistakes: [
      'Separar el índice y el medio (si los separas, estarías haciendo la letra V).'
    ],
    visualFeatures: {
      thumb: 'Cruzado sobre anular y meñique',
      index: 'Extendido vertical (pegado al medio)',
      middle: 'Extendido vertical (pegado al índice)',
      ring: 'Doblado',
      pinky: 'Doblado'
    }
  },
  {
    id: 'v',
    letter: 'V',
    name: 'Letra V',
    category: 'consonante',
    difficulty: 'Fácil',
    imagePath: '/signs/v.svg',
    description: 'Dedo índice y medio extendidos hacia arriba separados en forma de "V" (señal de victoria).',
    anatomicalTips: [
      'Estira el índice y el medio.',
      'Separa claramente ambos dedos formando una letra V.',
      'Anular, meñique y pulgar permanecen doblados.'
    ],
    commonMistakes: [
      'Juntar los dedos (eso sería la U).'
    ],
    visualFeatures: {
      thumb: 'Cruzado sobre anular y meñique',
      index: 'Extendido separado',
      middle: 'Extendido separado',
      ring: 'Doblado',
      pinky: 'Doblado'
    }
  },
  {
    id: 'w',
    letter: 'W',
    name: 'Letra W',
    category: 'consonante',
    difficulty: 'Media',
    imagePath: '/signs/w.svg',
    description: 'Tres dedos extendidos hacia arriba (índice, medio y anular) separados entre sí formando una "W".',
    anatomicalTips: [
      'Levanta el índice, medio y anular separados de manera uniforme.',
      'El pulgar sujeta la uña del dedo meñique sobre la palma.',
      'Palma orientada hacia el frente.'
    ],
    commonMistakes: [
      'Permitir que el meñique se levante.',
      'Juntar los tres dedos.'
    ],
    visualFeatures: {
      thumb: 'Sujeta la punta del meñique',
      index: 'Extendido vertical',
      middle: 'Extendido vertical',
      ring: 'Extendido vertical',
      pinky: 'Doblado sujeto por pulgar'
    }
  },
  {
    id: 'y',
    letter: 'Y',
    name: 'Letra Y',
    category: 'consonante',
    difficulty: 'Fácil',
    imagePath: '/signs/y.svg',
    description: 'Pulgar y meñique completamente extendidos hacia los extremos, mientras índice, medio y anular están cerrados contra la palma.',
    anatomicalTips: [
      'Extiende el pulgar hacia un lado y el meñique hacia el lado opuesto al máximo.',
      'Dobla los tres dedos centrales (índice, medio, anular) contra la palma.',
      'Muñeca firme orientada al frente.'
    ],
    commonMistakes: [
      'No extender suficiente el pulgar o dejar el índice medio abierto.'
    ],
    visualFeatures: {
      thumb: 'Extendido al lateral máximo',
      index: 'Doblado contra palma',
      middle: 'Doblado contra palma',
      ring: 'Doblado contra palma',
      pinky: 'Extendido al lateral máximo'
    }
  }
];
