# PROGRAMADOR — AFL AUTOS

Actualizado: 2026-09-27

## FUENTE DE PROGRAMACION
Google Calendar principal de AFL Autos.

Este archivo define cómo leer el programador. Las fechas y horas vigentes deben confirmarse en Google Calendar cada vez que se inicia o retoma trabajo.

## PENDIENTES DETECTADOS
Snapshot operativo al 2026-09-27:
- AFL-279006 — Captura de campo — 2026-09-28 10:00–11:00 — estado repo: CAPTURA_PENDIENTE.
- AFL-338663 — Captura de campo — 2026-09-28 11:30–13:00 — estado repo: CAPTURA_PENDIENTE.

El snapshot es informativo. Si Google Calendar cambia, prevalece Calendar para fecha/hora.

## REGLAS
- Antes de captura: revisar eventos próximos y conflicto de horarios.
- Después de captura: el evento de calendario no cambia por sí mismo el estado del vehículo.
- Material subido = cambiar a `MATERIAL_NUEVO_SUBIDO`.
- Revisión iniciada = cambiar a `REVISION_MATERIAL`.
- Si una captura sigue pendiente, mantener recordatorio/programación hasta completar trabajo de campo y subir material nuevo.
- No crear duplicados de calendario sin verificar eventos existentes.
- No almacenar URLs/IDs privados del calendario en este repositorio público.

## SALIDA OBLIGATORIA
Después de cualquier operación de captura, mostrar opciones numeradas y el siguiente paso recomendado.
