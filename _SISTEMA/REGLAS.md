# REGLAS

## DATOS

- La web de AFL_AUTOS_LOCAL es JSON-driven.
- `data/vehicles/index.json` = índice público de vehículos.
- `data/vehicles/AFL-ID.json` = expediente público sanitizado por unidad.
- `data/programador.json` = snapshot público del programador.
- `data/multimedia.json` = arquitectura pública de Drive.
- `data/musica-usada.json` = registro público de metadatos de audio usado.
- Los archivos `.md` son documentación/respaldo y NO deben actuar como base de datos para renderizar la web.
- `Vehiculos` privado conserva identidad y datos confirmados canónicos.
- Google Calendar conserva fecha, hora y recordatorios vigentes.
- Google Drive conserva originales y derivados multimedia.

## FLUJO

- Material nuevo sin validar = `PENDIENTE_REVISION`.
- Ningún material en `PENDIENTE_REVISION` pasa a producción/publicación.
- Un evento terminado en Calendar NO significa captura completada.
- Solo material efectivamente subido puede avanzar a `MATERIAL_NUEVO_SUBIDO`.
- Originales nunca se sobrescriben.
- Selección, retoque y producción permanecen separados.
- No crear eventos duplicados sin consultar Calendar.

## PRIVACIDAD

- No publicar automáticamente.
- No publicar VIN completo.
- No publicar millas/kilómetros.
- No publicar documentación privada.
- No guardar IDs/URLs privados de Drive o Calendar en JSON público.
- No convertir material visual en prueba de datos no confirmados.

## CONTRATOS

- `data/schema/vehicle.schema.json`
- `data/schema/programador.schema.json`

Los cambios de estructura JSON deben conservar compatibilidad o incrementar `schemaVersion`.


## NUEVO VEHICULO

- Material sin AFL-ID confirmado entra a `01_ENTRADAS/00_PENDIENTE_ID`.
- No mezclar unidades dentro de staging.
- AFL-ID definitivo preferente: `AFL-<ultimos_6_VIN>` únicamente cuando el VIN esté confirmado de forma privada.
- Antes de crear estructura definitiva, verificar duplicados en repo y Drive.
- Con AFL-ID confirmado, crear ambas ramas: `01_ENTRADAS/AFL-ID` y `02_SALIDAS/AFL-ID`.
- Crear el expediente público desde `data/templates/vehicle.template.json`.
- Ejecutar `data/prompts/nuevo-vehiculo.json` como contrato operativo.


## EDICION AUTORIZADA POR MIGUEL

- Prompt canónico: `data/prompts/editar-informacion-autorizada.json`.
- Miguel puede autorizar explícitamente la edición de cualquier campo operativo/comercial permitido de una unidad.
- La autorización se limita al AFL-ID, campo y nuevo valor indicados; no habilita cambios colaterales.
- Toda edición debe sincronizar, cuando aplique: CONTROL OPERATIVO de Drive → `data/vehicles/AFL-ID.json` → `data/vehicles/index.json` (HOME) → documentación operativa relevante.
- Verificar Drive ↔ JSON vehículo ↔ HOME antes de cerrar.
- Precio interno actualizado no cambia precio de catálogo ni WhatsApp público salvo autorización separada.
- Un cambio informativo no cambia estado/checkpoint salvo que ese sea el campo expresamente autorizado.
- Ninguna edición autoriza publicación automática.
- Los campos privados permanecen fuera de JSON/HOME públicos.

## ESTANDAR POR VEHICULO

Todo vehículo actual o nuevo del framework debe tener:

1. `01_ENTRADAS/AFL-ID` con las cinco carpetas canónicas.
2. `02_SALIDAS/AFL-ID` con los once canales canónicos.
3. `AFL-ID — CONTROL OPERATIVO` dentro de SALIDAS.
4. expediente `data/vehicles/AFL-ID.json` basado en la plantilla vigente.
5. resumen sincronizado en HOME.
6. checkpoint, prompt de edición autorizada y respuestas rápidas estándar.


## PROGRAMACION, PUBLICACION Y RETORNO AL MENU

- `PROGRAMADA ≠ PUBLICADA`. Registrar una programación no inicia la medición 7D.
- Después de confirmar una programación, una publicación real o una acción de cambio autorizada, actualizar siempre las fuentes afectadas y `data/vehicles/index.json` para que HOME refleje el estado vigente.
- Si existe fecha/hora programada, actualizar también `data/programador.json` con la fuente real: Google Calendar para trabajo de campo y Meta Business Suite para publicaciones sociales.
- Una publicación pasa a `PUBLICADO_CONFIRMADO_POR_MIGUEL` solo con confirmación de Miguel o evidencia verificable; desde ahí inicia `MEDICION_7D`.
- Después del cierre, si el ChatGPT actual recomienda una siguiente acción concreta, mostrarla y regresar al menú/opciones del vehículo. Si no existe recomendación útil, omitir ese bloque.
- Ninguna programación, publicación o edición habilita publicación automática de otras piezas.
