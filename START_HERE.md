# START_HERE — AFL AUTOS LOCAL

Actualizado: 2026-09-27

Este archivo documenta cómo operar el repositorio.

## ARQUITECTURA VIGENTE

La interfaz web es **JSON-driven**.

Fuentes:

- `Vehiculos` privado: identidad y datos confirmados canónicos.
- Google Drive: originales y derivados multimedia.
- Google Calendar: fecha, hora y recordatorios vigentes.
- `AFL_AUTOS_LOCAL/data/*.json`: copia pública sanitizada usada por la web.
- archivos `.md`: documentación humana y respaldo; no deben alimentar directamente la interfaz.

## DATOS WEB

Entrada principal:

`data/vehicles/index.json`

Expediente piloto:

`data/vehicles/AFL-279006.json`

Programador:

`data/programador.json`

Multimedia:

`data/multimedia.json`

Música usada:

`data/musica-usada.json`

Contratos:

- `data/schema/vehicle.schema.json`
- `data/schema/programador.schema.json`

## REGLA DE SINCRONIZACION

1. Verificar fuente canónica privada.
2. Verificar Drive/Calendar cuando aplique.
3. Actualizar JSON público sanitizado.
4. La web renderiza el JSON.
5. Los `.md` pueden documentar el cambio, pero no son la base de datos de la interfaz.

## PRIVACIDAD

Nunca publicar en JSON:

- VIN completo;
- odómetro/millas/km;
- documentación personal;
- IDs o URLs privadas de Drive;
- IDs o URLs privadas de Calendar;
- PII.

## CAPTURA

`CAPTURA_PENDIENTE → campo → MATERIAL_NUEVO_SUBIDO → REVISION_MATERIAL → SELECCION_FINAL → CAPTURA_COMPLETA`

Un evento terminado en Calendar NO significa captura completada.

## PUBLICACION

NO PUBLICAR AUTOMÁTICAMENTE.


## NUEVO VEHICULO

Entrada del framework:

- UI: `NUEVO_VEHICULO.html`
- Prompt: `data/prompts/nuevo-vehiculo.json`
- Workflow: `data/workflows/nuevo-vehiculo.json`
- Plantilla: `data/templates/vehicle.template.json`
- Staging Drive: `01_ENTRADAS/00_PENDIENTE_ID`

No crear un AFL-ID definitivo si la identificación/VIN no está suficientemente confirmada.
