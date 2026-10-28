# Plataforma Gamificada e Inclusiva de Aprendizaje de Dactilología (Lengua de Señas)

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
