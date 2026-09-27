# PROGRAMADOR — AFL AUTOS

[Abrir Programador visual](../PROGRAMADOR.html)

Actualizado: 2026-09-27

## FUENTE DE PROGRAMACION

**Google Calendar es la fuente vigente para fecha, hora y recordatorios.**

Este archivo muestra el estado operativo y los enlaces a los archivos `.md`.
Si Calendar cambia, prevalece Calendar para fecha/hora/recordatorios.
No almacenar URLs ni IDs privados de Calendar en este repositorio público.

## PROGRAMADOS CON GOOGLE CALENDAR

### AFL-279006 — Chevrolet Colorado Work Truck 2016

- Estado: `CAPTURA_PENDIENTE`
- Tipo: `CAPTURA_COMERCIAL_COMPLETA`
- Calendar: **PROGRAMADO**
- Fecha: **2026-09-28**
- Hora: **10:00–11:00**
- Zona: `America/Mexico_City`
- WhatsApp: `OCULTO`
- Publicación: `NO_PUBLICAR`

Archivos operativos:

- [CHECKLIST CAMPO](../ACTIVOS/AFL-279006/CHECKLIST_CAMPO.md)
- [CAPTURA COMPLETA](../ACTIVOS/AFL-279006/CAPTURA_COMPLETA.md)
- [PLAN DE CAPTURA](../ACTIVOS/AFL-279006/PLAN_CAPTURA.md)
- [PLAN DE CONTENIDO](../ACTIVOS/AFL-279006/PLAN_CONTENIDO.md)
- [SELECCIÓN DE MATERIAL](../ACTIVOS/AFL-279006/SELECCION_MATERIAL.md)
- [FICHA WHATSAPP](../ACTIVOS/AFL-279006/FICHA_WHATSAPP.md)
- [ESTADO](../ACTIVOS/AFL-279006/ESTADO.md)
- [PUENTE](../ACTIVOS/AFL-279006/PUENTE.md)

Salidas previstas después de revisión:

- Marketplace.
- Post.
- Imágenes comerciales.
- Historia.
- Feed.
- Reel.
- TikTok.

Flujo:

`CAPTURA_COMPLETA → MATERIAL_NUEVO_SUBIDO → REVISION_MATERIAL → SELECCION_FINAL → WHATSAPP_OCULTO_LISTO → CONTENIDO_DISPONIBLE`

### AFL-338663 — Chevrolet Silverado 2016 Cabina Regular

- Estado: `CAPTURA_PENDIENTE`
- Calendar: **PROGRAMADO**
- Fecha: **2026-09-28**
- Hora: **11:30–13:00**

Archivos:

- [PLAN DE CAPTURA](../ACTIVOS/AFL-338663/PLAN_CAPTURA.md)
- [ESTADO](../ACTIVOS/AFL-338663/ESTADO.md)
- [PUENTE](../ACTIVOS/AFL-338663/PUENTE.md)
- [FICHA WHATSAPP](../ACTIVOS/AFL-338663/FICHA_WHATSAPP.md)

## REGLAS

- Antes de captura: revisar Google Calendar, conflictos y archivos operativos.
- El evento de Calendar no cambia por sí mismo el estado del vehículo.
- Material subido = `MATERIAL_NUEVO_SUBIDO`.
- Revisión iniciada = `REVISION_MATERIAL`.
- Si faltan tomas obligatorias, reprogramar la captura existente sin duplicar eventos.
- No producir/publicar material en `PENDIENTE_REVISION`.
- No publicar automáticamente.
- No guardar URLs/IDs privados de Calendar o Drive en este repositorio público.

## SALIDA OBLIGATORIA

Después de cualquier operación de captura:

1. Mostrar estado actual.
2. Mostrar siguiente acción.
3. Mostrar opciones numeradas.
4. Mostrar enlaces `.md` operativos.
5. Incluir opción para consultar/programar Google Calendar.
