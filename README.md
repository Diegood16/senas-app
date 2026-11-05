# SeñaLink — Plataforma Gamificada e Inclusiva de Aprendizaje de Dactilología

> Proyecto de innovación social, accesibilidad tecnológica y educación inclusiva para derribar las barreras de comunicación entre la Comunidad Sorda y personas oyentes.

---

## 📌 Documentación del Proyecto

El documento maestro de arquitectura de software, especificación de tecnologías, diseño de la estructura de archivos y hoja de ruta (roadmap) se encuentra disponible en:

📄 **[ARQUITECTURA_Y_PLANIFICACION.md](./ARQUITECTURA_Y_PLANIFICACION.md)**

---

## 🚀 Pilares Técnicos Fundamentales

1. **100% Client-Side & Privacidad:** El procesamiento de video y la inferencia de Inteligencia Artificial ocurren íntegramente de forma local en el navegador del usuario utilizando **WebAssembly (WASM)** y **WebGL/WebGPU**. El video de la cámara jamás se transmite a ningún servidor externo.
2. **Visión por Computadora Invariante:** Empleo de **MediaPipe Hand Landmarker** para la detección en tiempo real de 21 puntos clave en 3D (coordenadas espaciales). La clasificación de las letras se realiza sobre la geometría normalizada de la mano, eliminando sesgos de tono de piel, iluminación o fondos.
3. **Accesibilidad Universal (WCAG 2.2 AA/AAA) & Enfoque Visual-First:** Todo evento, acierto, error y estado del juego cuenta con retroalimentación visual inmediata y soporte de lectores de pantalla (`aria-live`), sin depender exclusivamente del audio.

---

## 🎯 Modos Principales del Sistema

1. **Manual Interactivo y Diccionario Dactilológico:** Guía visual previa con la anatomía y postura correcta de cada letra antes de encender la cámara.
2. **Modo Academia / Juego Gamificado:** Desafíos por niveles con evaluación de postura en tiempo real, puntuación y rachas.
3. **Modo Transcriptor / Traductor en Vivo:** Traducción continua de deletreo manual a texto en pantalla y síntesis de voz (TTS) para oraciones completas, facilitando la comunicación directa con personas oyentes.

---

## 💻 Cómo Ejecutar el Proyecto en tu Computadora

### Calibración y verificación

Al entrar en Academia o Transcriptor, selecciona tu mano y muestra la palma abierta con los dedos extendidos. El escaneo general mide palma, proporciones de los cinco dedos y tamaño aparente de referencia, sin pedir letras. Mantén la mano quieta hasta completar la barra. Usa **Ver puntos** para revisar el seguimiento y **Recalibrar** si cambian las condiciones. Las medidas se conservan únicamente mientras esta página permanece abierta. La distancia es relativa al tamaño aparente de la palma; no se mide en centímetros.

Las posturas ambiguas entre varias letras no se confirman. Los cálculos corrigen la relación de aspecto de la cámara y utilizan ángulos de articulación y distancias relativas a la mano, en vez de píxeles fijos. Esta mejora todavía no tiene una precisión medida con personas; no garantiza un 98 % de acierto.

En el Transcriptor, pulsa **Comenzar** después del escaneo. Elige ritmo ágil (0,5 s), normal (0,7 s) o pausado (1,1 s), según tu comodidad. Para repetir una letra, retira la mano unos 0,7 s o pulsa **Repetir letra**; para separar palabras, retírala 1,6 s o usa **Espacio**. **Pausar** conserva el texto y editar la pizarra pausa la captura. Si cambia la persona, vuelve a calibrar. **Guardar muestra del transcriptor** descarga mediciones locales de hasta 12 segundos para revisar errores; el texto esperado es opcional y no entrena al sistema.

Ejecuta `npm test` para las comprobaciones sintéticas y `npm run build` para verificar la compilación. Consulta [VERIFICACION.md](./VERIFICACION.md) para conocer resultados y límites.

1. Abre tu terminal en la carpeta del proyecto:
   ```bash
   cd "C:\Users\Administrator\Desktop\U\DDO\APP"
   ```
2. Ejecuta el servidor local de desarrollo:
   ```bash
   npm run dev
   ```
3. Abre tu navegador en `http://localhost:3000` (o el puerto indicado en la consola).

---

## 📂 Estado Actual

- **Fase Actual:** Fase 0 - Planificación, Arquitectura y Estrategia Técnica.
- **Ruta de Trabajo:** `C:\Users\Administrator\Desktop\U\DDO\APP`
