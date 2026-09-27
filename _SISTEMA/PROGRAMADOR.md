# PROGRAMADOR — AFL AUTOS

Actualizado: 2026-09-27

## FUENTE DE PROGRAMACION
Google Calendar principal de AFL Autos.

Este archivo define cómo leer el programador. Las fechas, horas y recordatorios vigentes deben confirmarse en Google Calendar cada vez que se inicia o retoma trabajo.

## PENDIENTES DETECTADOS
Snapshot operativo al 2026-09-27:
- AFL-279006 — Captura de campo — 2026-09-28 10:00–11:00 — estado repo: CAPTURA_PENDIENTE — recordatorio Calendar: 60 min antes.
- AFL-338663 — Captura de campo — 2026-09-28 11:30–13:00 — estado repo: CAPTURA_PENDIENTE — recordatorios Calendar: 60 min y 15 min antes.

El snapshot es informativo. Si Google Calendar cambia, prevalece Calendar para fecha/hora/recordatorios.

## REGLAS
- Antes de captura: revisar eventos próximos, recordatorios y conflictos de horario.
- Después de captura: el evento de calendario no cambia por sí mismo el estado del vehículo.
- Material subido = cambiar a `MATERIAL_NUEVO_SUBIDO`.
- Revisión iniciada = cambiar a `REVISION_MATERIAL`.
- Si una captura sigue pendiente, mantener programación/recordatorio hasta completar trabajo de campo y subir material nuevo.
- No crear eventos o recordatorios duplicados sin verificar Google Calendar.
- No almacenar URLs/IDs privados del calendario en este repositorio público.

## SALIDA OBLIGATORIA
Después de cualquier operación de captura:
1. Mostrar estado actual.
2. Mostrar siguiente acción.
3. Mostrar siempre opciones numeradas.
4. Incluir opción para consultar/programar recordatorios en Google Calendar.
