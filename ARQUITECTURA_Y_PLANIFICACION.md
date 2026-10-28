# Especificación de Arquitectura de Software y Planificación Técnica
## Proyecto: Plataforma Gamificada e Inclusiva para el Aprendizaje de Dactilología (Lengua de Señas)
**Rol:** Arquitecto de Software Senior & Especialista en IA y Accesibilidad Web  
**Estado:** Fase 0 - Planificación, Diseño Arquitectónico y Estrategia  
**Ubicación:** `APP/ARQUITECTURA_Y_PLANIFICACION.md`

---

## 1. Visión y Principios Rectores

El propósito del proyecto es crear una experiencia dual integral:
1. **Modo Academia / Entrenamiento Gamificado:** Aprendizaje autónomo y lúdico del alfabeto dactilológico (deletreo manual) con retroalimentación en tiempo real y manual visual interactivo.
2. **Modo Transcriptor / Traductor en Vivo:** Herramienta de comunicación asistiva que traduce el deletreo continuo de la persona en señas a texto escrito y voz en tiempo real, permitiendo construir palabras y oraciones completas legibles para personas oyentes.

Todo ello respetando estrictamente la privacidad del usuario y operando 100% en el cliente.

### Principios de Arquitectura:
1. **Privacy-by-Design (100% Client-Side):** El flujo de video de la cámara jamás abandona el dispositivo del usuario. Todo el procesamiento de visión artificial e inferencia de Machine Learning ocurre localmente en el navegador mediante WebAssembly (WASM) y WebGL/WebGPU.
2. **Invarianza y Universalidad de IA:** No entrenamos redes sobre imágenes de píxeles en bruto (RGB), sino sobre vectores geométricos normalizados de puntos de referencia de la mano (*landmarks*). Esto elimina sesgos de tono de piel, condiciones lumínicas del entorno y reduce drásticamente el peso del modelo (de ~50 MB a <100 KB).
3. **Diseño Visual-First y Accesibilidad Universal (WCAG 2.2 AA/AAA):** La interfaz está concebida primordialmente para personas sordas e hipoacúsicas: ninguna retroalimentación depende únicamente del audio. Cada estímulo sonoro tiene un equivalente visual y háptico explícito.

---

## 2. Recomendación del Ecosistema y Tecnologías

### 2.1. Núcleo de Visión por Computadora (Client-Side)
* **Tecnología Recomendada:** **Google MediaPipe Hand Landmarker (`@mediapipe/tasks-vision`)**
  * **Por qué es la mejor opción:** 
    * Extrae en tiempo real (30-60 FPS) **21 puntos clave en 3D (x, y, z)** de cada mano.
    * Acelerado por hardware con WebAssembly y WebGL, funcionando fluidamente en navegadores de computadoras portátiles modestas y teléfonos móviles sin saturar la CPU.
    * Es totalmente independiente de servidores externos.
    * Nos permite desacoplar la **detección espacial de la mano** de la **clasificación semántica de la seña**.

### 2.2. Motor de Clasificación de Señas
* **Tecnología Recomendada:** **TensorFlow.js (`@tensorflow/tfjs`)** con un perceptrón multicapa ligero (MLP) o un clasificador basado en **k-Nearest Neighbors (KNN) / SVM**.
  * **Por qué es la mejor opción:**
    * El modelo no recibe una imagen de 640x480 (300,000 píxeles), sino un vector de 63 características numéricas (21 coordenadas `x, y, z` normalizadas respecto a la muñeca).
    * La inferencia toma menos de **3 milisegundos por fotograma**.
    * Permite la persistencia y carga inmediata mediante IndexedDB o archivos `.json` estáticos servidos en el cliente.

### 2.3. Herramientas de Entrenamiento Rápido y Sin Código Complejo
1. **Google Teachable Machine (Opción Entrada Rápida):**
   * Permite prototipar clases con la cámara en pocos minutos. Sin embargo, su modelo estándar opera sobre píxeles (MobileNet), lo cual es sensible a la luz y fondo.
2. **Herramienta Recomendada: Micro-Recolector de Landmarks en el propio navegador:**
   * Diseñar una pantalla oculta de administración dentro de la misma app (`/admin/recorder`) que capture los 21 puntos de MediaPipe directamente al presionar una tecla (ej: presionar "A" 50 veces mientras se hacen ligeras variaciones de la letra A).
   * Se exportan los datos en un archivo JSON o CSV y se entrenan con un script simple en TensorFlow.js o Scikit-Learn (exportable a TF.js u ONNX), asegurando 100% de invarianza visual.

### 2.4. Framework Frontend y Entorno de Desarrollo
* **Tecnología Recomendada:** **TypeScript + Vite + Svelte (o React con Tailwind CSS y Radix UI)**.
  * **¿Por qué NO Vanilla JS puro?**
    * Aunque Vanilla JS es ligero, la gestión de estados complejos (temporizadores de gamificación, rachas, cálculo de puntaje, niveles, gestión de estados de cámara y controles de accesibilidad) se vuelve frágil y difícil de mantener (*spaghetti code*).
  * **¿Por qué TypeScript + Vite?**
    * **Vite:** Arranque instantáneo, Hot Module Replacement ultrarrápido y empaquetado optimizado en chunks ligeros.
    * **TypeScript:** Garantiza tipado estricto para las 21 coordenadas de la mano (`Landmark3D`), matrices de calibración y estados del juego, evitando errores en tiempo de ejecución.
    * **Svelte o React:** Svelte ofrece reactividad directa sin la sobrecarga del Virtual DOM, ideal para renderizar a 60 FPS sobre un `<canvas>`. Si se prefiere un ecosistema masivo de accesibilidad lista para usar, React + Radix UI / Shadcn UI proporciona componentes con compatibilidad WCAG y navegación por teclado nativa.

---

## 3. Estructura de Archivos y Carpetas (Clean Architecture)

A continuación se detalla la arquitectura modular y desacoplada sugerida para el directorio del proyecto:

```text
APP/
├── index.html                     # Punto de entrada HTML con atributos de accesibilidad iniciales
├── package.json                   # Dependencias del proyecto y scripts
├── tsconfig.json                  # Configuración de TypeScript
├── vite.config.ts                 # Configuración del empaquetador Vite
├── public/
│   ├── favicon.ico
│   ├── models/                    # Pesos y topología de los modelos entrenados
│   │   ├── dactylology-model.json
│   │   └── dactylology-weights.bin
│   ├── signs-guide/               # Ilustraciones vectoriales (SVG) de referencia para cada letra
│   │   ├── letter_a.svg
│   │   └── letter_b.svg
│   └── wasm/                      # Binarios WASM de MediaPipe (servidos localmente)
└── src/
    ├── main.ts                    # Bootstrap de la aplicación
    ├── App.svelte (o App.tsx)     # Contenedor raíz con proveedores de estado
    │
    ├── vision/                    # Capa de Visión por Computadora e IA
    │   ├── CameraManager.ts       # Control de Stream de video, resolución y permisos de cámara
    │   ├── HandTracker.ts         # Envoltorio de MediaPipe HandLandmarker
    │   ├── LandmarkNormalizer.ts  # Normalización geométrica (invarianza de posición, escala y rotación)
    │   ├── GestureClassifier.ts   # Inferencia del modelo (clasificación de la letra)
    │   └── MirrorHelper.ts        # Soporte para mano izquierda/derecha mediante espejado de coordenadas
    │
    ├── transcription/             # [NUEVO] Capa de Transcripción Continua y Traducción a Texto
    │   ├── ContinuousBuffer.ts    # Búfer de fotogramas y supresión de ruido en transiciones entre señas
    │   ├── StabilityDebouncer.ts  # Confirmación de letra por umbral de estabilidad temporal (ej: 500 ms)
    │   ├── SentenceBuilder.ts     # Ensamblador de letras a palabras y oraciones (control de espacio y retroceso)
    │   ├── SpaceGestureDetector.ts# Detección de espacio (pausa con mano abajo o gesto de separación)
    │   └── TextToSpeechHelper.ts  # Web Speech API para lectura auditiva en voz alta para oyentes
    │
    ├── game/                      # Capa de Lógica de Negocio y Gamificación (Modo Academia)
    │   ├── GameLoop.ts            # Bucle de validación en tiempo real (tolerancia y fotogramas estables)
    │   ├── ScoreEngine.ts         # Cálculo de puntos, multiplicadores y rachas (streaks)
    │   ├── LevelSystem.ts         # Gestión de progresión (Nivel 1: Vocales, Nivel 2: Consonantes simples, etc.)
    │   └── EvaluationRules.ts     # Criterios de tolerancia (tiempo de retención de la seña, umbral de confianza)
    │
    ├── accessibility/             # Capa de Inclusión y Accesibilidad (WCAG)
    │   ├── VisualAnnouncer.ts     # Notificaciones visuales en pantalla y regiones aria-live
    │   ├── HapticFeedback.ts      # Respuesta por vibración en dispositivos compatibles (navigator.vibrate)
    │   ├── ContrastManager.ts     # Modos de alto contraste y esquemas para daltonismo
    │   └── KeyboardNavigator.ts   # Atajos y navegación accesible mediante teclado completo
    │
    ├── components/                # Componentes Visuales Reutilizables
    │   ├── CameraView.svelte      # Elemento de video y selector de dispositivo
    │   ├── HandCanvas.svelte      # Superposición de canvas para dibujar esqueleto de la mano
    │   ├── SignManualModal.svelte # [NUEVO] Manual interactivo previo de cómo formar cada letra
    │   ├── SignCardGuide.svelte   # Ficha anatómica de la letra con consejos de posición y botón "Probar ahora"
    │   ├── LiveTranscriptBoard.svelte # [NUEVO] Pizarra de transcripción en tiempo real (palabras/oraciones)
    │   ├── TargetSignCard.svelte  # Tarjeta ilustrada de la seña objetivo (en Modo Juego)
    │   ├── FeedbackBadge.svelte   # Indicador visual ("¡Excelente!", "Ajusta el pulgar", etc.)
    │   ├── ScoreBoard.svelte      # Marcador de puntajes, nivel y racha
    │   ├── QualityIndicator.svelte# Semáforo de iluminación y encuadre de la mano
    │   └── AccessibilityMenu.svelte# Modal de configuración de accesibilidad (zoom, contraste, vibración)
    │
    ├── types/                     # Definiciones de Tipos e Interfaces TypeScript
    │   ├── vision.d.ts            # Tipos de Landmarks, coordenadas 3D y resultados de MediaPipe
    │   ├── gestures.d.ts          # Letras soportadas, alfabetos y metadatos de señas
    │   ├── transcription.d.ts     # Tipos para búfer de texto, eventos de caracteres y oraciones
    │   └── game.d.ts              # Estados de juego (Idle, Playing, Success, GameOver, Paused)
    │
    └── styles/                    # Estilos Globales y Sistema de Diseño
        ├── main.css               # Reset y variables CSS (tokens de color de alto contraste)
        └── accessibility.css      # Reglas específicas para prefers-reduced-motion y focus rings visibles
```

---

## 4. Hoja de Ruta (Roadmap) Paso a Paso

### Fase 1: Cimientos de la Interfaz, Manual Interactivo y Cámara Accesible
* **Hito 1.1:** Inicializar proyecto con Vite y TypeScript.
* **Hito 1.2:** Crear la interfaz base con HTML semántico y tokens de diseño accesibles (foco visible, contraste > 4.5:1).
* **Hito 1.3:** **Manual Interactivo y Diccionario Dactilológico:** Diseñar la vista inicial de bienvenida donde el usuario puede explorar cada letra del alfabeto con ilustraciones vectoriales, consejos de posición de los dedos ("anatomía de la seña") y un botón directo *"Practicar esta letra con la cámara"*, reduciendo la curva de aprendizaje antes de activar el video.
* **Hito 1.4:** Implementar `CameraManager.ts`: solicitud de permisos amigable, selector de cámaras frontal/trasera, apagado correcto del flujo de video y manejo de errores con mensajes visuales claros.

### Fase 2: Pipeline de Visión por Computadora (MediaPipe Hands)
* **Hito 2.1:** Integrar `@mediapipe/tasks-vision` localmente (descarga de modelos y binarios WASM en `public/`).
* **Hito 2.2:** Renderizar el video en vivo y superponer un `<canvas>` donde se dibuje el esqueleto de 21 puntos en tiempo real (30+ FPS).
* **Hito 2.3:** Crear `LandmarkNormalizer.ts`:
  * Trasladar el punto 0 (muñeca) al origen `(0, 0, 0)`.
  * Escalar la distancia entre la muñeca y el nudillo del dedo medio a una unidad estándar (`1.0`), de modo que el tamaño de la mano o la distancia a la cámara no afecte la clasificación.

### Fase 3: Estrategia y Entrenamiento del Modelo de Dactilología
* **Hito 3.1:** Crear una herramienta interna ligera para registrar vectores de coordenadas correspondientes a las letras estáticas del alfabeto dactilológico (por ejemplo, A, B, C, D, E, etc.).
* **Hito 3.2:** Entrenar un clasificador ligero (MLP en TensorFlow.js o k-NN).
* **Hito 3.3:** Evaluar la precisión con matriz de confusión: diferenciar señas con alta similitud espacial (por ejemplo: la 'M', 'N' y 'S' en varios alfabetos).
* **Hito 3.4:** Implementar el mecanismo de espejado para permitir que personas zurdas o diestras puedan practicar indistintamente.

### Fase 4: Gamificación y Motor de Transcripción Continua (Deletreo a Texto)
* **Hito 4.1:** **Modo Academia / Juego:**
  * Algoritmo de Estabilidad ("Hold Time"): retención de seña correcta con >85% de confianza durante 0.8 a 1.2 s.
  * Niveles progresivos (Vocales, Consonantes, Palabras reto) con cálculo de rachas y puntaje.
* **Hito 4.2:** **Modo Transcriptor / Traductor en Vivo:**
  * **Filtro de Co-articulación:** Ignora los fotogramas de transición mientras la mano cambia de una letra a otra.
  * **Búfer de Letras y Espaciado:** Detecta pausas (mano en reposo o fuera de cuadro durante 1.2 s) o gesto de separación para insertar espacios y formar palabras.
  * **Pizarra de Subtítulos en Vivo:** Muestra la palabra y oración en construcción con tipografía grande y accesible.
  * **Síntesis de Voz (TTS):** Botón o auto-lectura con `window.speechSynthesis` para que una persona oyente pueda escuchar lo que la persona sorda acaba de deletrear.

### Fase 5: Accesibilidad Profunda, Pruebas de Usabilidad y Despliegue PWA
* **Hito 5.1:** Auditoría estricta WCAG 2.2 (navegación completa por teclado `Tab`/`Enter`, atributos `aria-live`, etiquetas para lectores de pantalla).
* **Hito 5.2:** Integración de la Vibration API para dispositivos táctiles y efectos visuales de celebración respetuosos con `prefers-reduced-motion`.
* **Hito 5.3:** Pruebas de campo con usuarios de la comunidad sorda y oyentes para ajustar ergonomía y comprensión de las instrucciones.
* **Hito 5.4:** Empaquetar como PWA (Progressive Web App) con Service Workers para funcionamiento 100% offline una vez cargado el sitio.

---

## 5. Recomendaciones Clave para el Éxito

### 5.1. Estrategia de Datos y Entrenamiento de Manos
1. **Nunca entrenar sobre imágenes crudas (píxeles):** Si entrenas con imágenes de la cámara, el modelo aprenderá el color de la pared de tu habitación o la ropa del usuario. Al entrenar sobre las coordenadas 3D de MediaPipe, el modelo se vuelve **100% ciego al color de piel y al fondo**, garantizando equidad algorítmica y portabilidad.
2. **Espejado para Mano Dominante:** Permite al usuario seleccionar si es zurdo o diestro. Si es zurdo, simplemente invierte el signo del eje X en las coordenadas de la mano (`x = -x`) antes de pasarlas al clasificador, permitiendo usar el mismo modelo entrenado con la mano derecha.
3. **Señas Estáticas vs. Dinámicas:** 
   * En la mayoría de los alfabetos de lengua de señas (como ASL o LSE), el 90% de las letras son estáticas (A, B, C, D, etc.).
   * Letras con movimiento (como la 'J' o la 'Z') requieren registrar una ventana temporal de fotogramas (por ejemplo, con una red LSTM corta o cálculo del vector de velocidad del dedo índice). **Recomendación:** Inicia exclusivamente con las letras estáticas para garantizar un primer hito exitoso y robusto.

### 5.2. Desafíos del Deletreo Continuo (Transcripción en Vivo)
* **El Problema del Rebote y Ruido de Transición (Co-articulación):** Al pasar de la letra 'A' a la 'L', los dedos atraviesan posturas intermedias que podrían parecer una 'E' o 'C' involuntaria.
  * *Solución Técnica:* Implementar una máquina de estados con **Debounce Temporal**. Una letra solo se agrega al búfer si la predicción se mantiene constante durante al menos 400 a 500 milisegundos.
* **Manejo de Letras Duplicadas:** Si alguien quiere escribir "HOLA", mantendrá la 'O' un momento. Para evitar que se escriba "HOOOOLA", el sistema solo emite un carácter por postura estable y requiere una ligera relajación de la mano o un cambio de postura antes de registrar la misma letra.
* **Delimitador de Palabras (Espacio):** En lengua de señas, una pausa natural con la mano baja o quieta indica el fin de una palabra. Si la mano baja o permanece quieta más de 1.2 segundos, el sistema inserta automáticamente un espacio (` `).

### 5.3. Manejo de Iluminación y Hardware Diverso
* **Indicador de Calidad de Detección:** MediaPipe entrega un valor numérico de confianza (`handPresenceScore`). Muestra un indicador visual discreto en pantalla:
  * 🟢 **Verde:** Mano claramente detectada dentro del marco.
  * 🟡 **Amarillo:** Mano parcialmente fuera de cuadro o detección inestable.
  * 🔴 **Rojo:** No se detecta ninguna mano (mostrar silueta guía animada para ayudar al usuario a posicionar su mano).
* **Sensibilidad a Contraluz:** Recomienda en la interfaz una guía visual: "Colócate frente a una fuente de luz, no detrás de una ventana brillante".

### 5.4. Buenas Prácticas de Accesibilidad Web (WCAG 2.2 y Deaf-First UX)
1. **Regla de Oro: Visual-First:**
   * Jamás comuniques éxito o error únicamente con un sonido (ej: un "bip").
   * Utiliza contornos de color perceptibles, iconos universales (tilde verde de verificación, signo de exclamación para ajustes), cambios de estado textuales y micro-animaciones suaves.
2. **Uso No Exclusivo del Color (WCAG 1.4.1):**
   * Un acierto no debe ser solo color verde; debe acompañarse de texto legible: *"¡Correcto! Letra A detectada"* y un icono distintivo.
3. **Regiones Dinámicas Accesibles (`aria-live`):**
   * Emplea un contenedor invisible o visible con `aria-live="polite"` y `role="status"` para que los lectores de pantalla anuncien los cambios de letra, puntaje o aciertos a personas con baja visión o personas ciegas que asistan a estudiantes sordos.
4. **Respeto a Preferencias de Movimiento (`prefers-reduced-motion`):**
   * Para personas con trastornos vestibulares o sensibilidad visual, desactiva confetis o transiciones bruscas si su sistema operativo lo solicita.
5. **Guías Visuales de Alta Precisión:**
   * La tarjeta de referencia no debe ser una foto borrosa: debe ser una ilustración estilizada o modelo 3D que muestre claramente el ángulo de la palma y la posición de los dedos ocultos.
