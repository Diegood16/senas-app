# Verificación del reconocimiento

Fecha: 5 de noviembre de 2026.

## Estado actual

Se sustituyó la calibración específica de A/O por un escaneo general de palma abierta. Se conserva un perfil por mano durante la sesión con el tamaño aparente de la palma, su anchura normalizada y las longitudes normalizadas de los cinco dedos. No se capturan ni almacenan videos o imágenes para este perfil.

El escaneo exige al menos 24 observaciones durante 1,6 segundos. Comprueba encuadre, resolución aparente de la mano, dedos extendidos, continuidad del seguimiento y variación de las medidas. No pide ejecutar letras ni usa el objetivo del juego para etiquetar las muestras.

## Cambios matemáticos

- Las coordenadas verticales se convierten a las mismas unidades que las horizontales y de profundidad mediante la relación de aspecto del video. Antes se mezclaban unidades normalizadas por ancho y alto.
- La escala se obtiene en cada observación combinando longitud y anchura de la palma. Esto compensa cambios de tamaño aparente sin exigir mantener una distancia fija.
- Los dedos se evalúan con ángulos de articulaciones y la relación entre longitud articulada y alcance, sustituyendo la distancia punta–muñeca. Una mano girada hacia un lado o abajo ya no convierte automáticamente un dedo recto en doblado.
- Contactos entre dedos y separaciones se comparan con las longitudes personales del índice y medio. Las longitudes de los otros dedos se miden y validan durante el escaneo, aunque no todos los umbrales las utilizan todavía.
- La posición del pulgar y el cruce de dedos se calculan en ejes locales de la palma. La orientación en pantalla se conserva para distinguir posturas verticales, horizontales y hacia abajo.
- Se consideran todos los candidatos que cumplen las reglas. Una coincidencia múltiple se rechaza como ambigua. La letra objetivo puede aparecer en las indicaciones, pero no cambia la letra reconocida.
- C/O se separan de los puños compactos mediante alcance de dedos y posición de las yemas; E deja de depender solo del contacto del pulgar, que también ocurre en O.
- Academia acumula únicamente tiempo observado de coincidencia. Los huecos breves pausan la retención; una interrupción de más de 180 ms la reinicia. Se requieren al menos ocho observaciones. No se cuentan los huecos como evidencia de postura correcta.

La distancia de trabajo se expresa respecto al tamaño aparente de la palma al calibrar. No hay una medida física en centímetros. Las indicaciones de acercarse o alejarse no bloquean automáticamente una postura que todavía tenga puntos utilizables.

## Pruebas ejecutadas

- `npm test`: **58/58 grupos correctos**.
- `npm run build`: correcto.
- Se probaron las **21 letras del catálogo**, cada una a tres escalas, dos relaciones de aspecto (4:3 y 16:9) y ambas manos reflejadas: **252 variaciones matemáticas** de las posturas.
- Estas pruebas recorren control de encuadre, conversión de coordenadas, normalización, extracción de geometría y clasificación con un perfil obtenido mediante escaneo sintético. También se comprueban la separación de perfiles por mano, reinicio de calibración, independencia del objetivo, duplicados y retención de Academia.

Los archivos `scripts/hand-fixtures.cjs` y `scripts/verify-project.cjs` contienen posturas construidas matemáticamente, no manos capturadas. Estas pruebas detectan errores de cálculo e invariancia; **no miden precisión real ni prueban que MediaPipe produzca esos puntos con todas las manos**.

## Reproducción de la muestra real de S

Se analizó el archivo de mediciones aportado por el usuario, sin copiar sus puntos originales al repositorio. Contiene 36 fotogramas de un solo intento declarado como S.

- Antes del ajuste: 24 T, 11 E y 1 rechazo; ninguna S.
- Se añadió la dirección del último segmento del pulgar en ejes locales ortogonales de la palma. Una dirección compatible con pulgar cruzado sobre el puño puede distinguir S del pulgar que asoma entre dedos, incluso cuando sus puntas terminan cerca del mismo lugar.
- Después del ajuste: 36 S. Al reproducir los tiempos de la captura, el motor de Academia confirma S a los 859 ms.
- Las pruebas sintéticas de las 21 letras, incluida E y T, siguen pasando. Se añadieron dos regresiones geométricas de pulgar cruzado y contacto de yemas.

Esta captura se utilizó para ajustar la regla: es una comprobación de reproducción, no una evaluación independiente, y 36 fotogramas correlacionados no representan 36 intentos. Falta validar nuevas muestras, especialmente de E real, para conocer la generalización.

Reproducción local: agregar las opciones --sample con la ruta del archivo y --expect S al comando de verificación. La opción --features muestra las medidas geométricas para diagnóstico; el resultado incluye el tiempo de primera confirmación en Academia.

## Mejoras del transcriptor en vivo

El transcriptor comparte las reglas geométricas de Academia, la calibración general y la corrección de S. Se reemplazó su confirmación temporal por LiveTranscriptionEngine:

- Exige tiempo observado coherente y al menos seis observaciones; una pausa de cámara no confirma una letra por el mero paso del reloj.
- Usa cambios de geometría normalizada para filtrar movimiento de los dedos y deja pendientes las detecciones ambiguas. Un error estable del clasificador aún puede producir una letra equivocada.
- Las pérdidas breves pausan la evidencia; la misma letra sostenida se registra una vez. Para repetirla se requiere ausencia detectada durante 650 ms o el botón Repetir letra. Un periodo ambiguo o de mala calidad no rearma por sí solo la repetición.
- CameraView distingue calibración, mala calidad, mano ausente y mano utilizable. Los espacios solo se generan después de 1,6 s continuos de ausencia detectada, no durante calibración o encuadre insuficiente. Una pérdida prolongada del detector puede parecer ausencia real; no hay garantía de distinguir ambas situaciones.
- Inicio y pausa explícitos, ritmo personal de 0,5/0,7/1,1 s recordado por mano durante la sesión y pizarra editable que pausa la captura. Cambiar de mano reinicia la evaluación y pausa la captura, conservando el texto.
- Las muestras locales del transcriptor guardan hasta 12 segundos, ritmo, perfil, puntos, estados, confirmaciones, texto opcional esperado y texto actual. No contienen imágenes/video y no se transmiten automáticamente. Se diferencian de las muestras de una letra de Academia mediante versión 2. El texto esperado nunca modifica el reconocimiento.

Pruebas adicionales: transiciones breves, cámara detenida y baja frecuencia de cuadros, mala calidad, recalibración, pausas, repetición intencional, huecos cortos, ritmo lento, baja puntuación, movimiento y captura de secuencias. Al reproducir la muestra real de S, el transcriptor genera una sola S, sin duplicados. Es la misma captura utilizada previamente para ajustar S, no una evaluación independiente.

No se han recogido muestras de otras personas ni entrenado perfiles por letra. La inclusividad entre usuarios y la precisión de palabras completas siguen pendientes de validar con datos nuevos. El catálogo sigue teniendo 21 letras; no se añadió traducción de lengua de señas completa.

## Validación pendiente con cámara

### Ajustes tras las confusiones reportadas en Academia

- E/S: la E permite una separación moderada entre pulgar y yemas, pero exige que el pulgar quede bajo ellas. S/T/N/M ya no requieren que el pulgar esté doblado en todas sus articulaciones.
- N/M/T: se comparan los huecos entre los nudillos reales de la mano. Una punta de pulgar cercana al límite entre dos huecos se rechaza en lugar de forzar M o N.
- O/A: una A exige un puño compacto. El contacto en O admite una discrepancia moderada de profundidad estimada cuando las yemas coinciden en la imagen y la separación 3D sigue limitada.
- P/G: se comprueba contacto con los segmentos del dedo medio, no solamente su punta. Se admite inclinación diagonal y se evita ofrecer G/H/U/V cuando está presente esa configuración de P.
- Se añadieron pruebas sintéticas de esas variaciones. No se dispone todavía de los puntos de los intentos reales reportados; por tanto, no se afirma que los fallos del usuario estén resueltos.

Academia incluye **Guardar muestra del intento**: descarga los últimos tres segundos de posiciones de puntos, predicciones, objetivo, mano y perfil de calibración. No contiene fotos ni video y no se envía automáticamente. El objetivo registra intención, no una etiqueta validada. Permite revisar errores reales sin seguir ajustando únicamente a partir de una descripción. Para reproducir mediciones con el clasificador actual: `node scripts/verify-project.cjs --sample ruta/al/intento-e.json`. Los totales por fotograma no son una tasa de precisión.

Recargar la página para descartar el perfil anterior. Seleccionar mano, completar el escaneo general y probar Academia. Registrar letra solicitada, resultado observado o rechazo, mano, condiciones y distancia aproximada de trabajo. Si falla, activar Ver puntos para distinguir pérdida de seguimiento de clasificación incorrecta.

Se necesitan muestras reales etiquetadas y reservadas para evaluación, distintas de las usadas para ajustar reglas. Medir aciertos, rechazos, falsas aprobaciones y confusiones por letra, por persona y por mano. Contar intentos, no fotogramas correlacionados como muestras independientes.

## Límites

No se ejecutó una validación con cámara en esta revisión y no se puede afirmar un 98 % de precisión. Las reglas siguen siendo heurísticas. La oclusión, los puntos estimados incorrectamente, la perspectiva extrema y las diferencias de movilidad pueden causar errores. El escaneo no reconstruye la anatomía real ni elimina el efecto del fondo o la iluminación. No se ha validado el alfabeto regional con especialistas ni certificado cumplimiento WCAG.

## Historial

La primera revisión reprodujo aprobaciones de S como T, U como H/R y duplicados después de una pérdida breve de seguimiento. Se corrigieron. La posterior calibración limitada a A/O resultó insuficiente en las pruebas del usuario en Academia; por eso se sustituyó por el escaneo general y el cálculo geométrico descritos arriba.
