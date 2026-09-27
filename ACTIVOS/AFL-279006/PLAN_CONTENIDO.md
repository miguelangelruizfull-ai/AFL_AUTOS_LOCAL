# PLAN CONTENIDO — AFL-279006

VEHICULO: Chevrolet Colorado Work Truck 2016
COLOR: ROJO
ESTADO: PENDIENTE_DE_CAPTURA / NO_PUBLICAR_AUTOMATICAMENTE
FUENTE_CAPTURA: [CAPTURA_COMPLETA.md](CAPTURA_COMPLETA.md)
PROGRAMACION: GOOGLE_CALENDAR
ACTUALIZADO: 2026-09-27

## OBJETIVO

Dejar material suficiente para producir, después de REVISION_MATERIAL y SELECCION_FINAL:

- Marketplace.
- Post.
- Imágenes comerciales.
- Historia.
- Feed.
- Reel.
- TikTok.

No publicar automáticamente.

## 1. MARKETPLACE

ESTADO: EN_PRODUCCION / BORRADOR_PRECAPTURA / NO_PUBLICAR

Material requerido:
- HERO 3/4 frontal.
- frente.
- ambos perfiles.
- ambos 3/4 traseros.
- trasera.
- caja cerrada.
- caja abierta.
- interior de caja.
- tablero.
- asientos.
- segunda fila.
- motor.
- rin/neumático.
- detalles de equipo.

Salida prevista:
- 10 a 15 fotografías seleccionadas.
- título comercial.
- descripción estratégica.
- precio solo cuando corresponda y esté confirmado para ese canal.
- ubicación comercial autorizada.
- CTA vigente.

## 2. POST

ESTADO: PUBLICADO_CONFIRMADO_POR_MIGUEL / FACEBOOK / META_BUSINESS_SUITE
PROGRAMACION_ORIGINAL: 2026-09-29 19:00 America/Mexico_City
PUBLICACION_REAL: 2026-09-27 17:22:14 America/Mexico_City
IDENTIFICADOR: 1886741839427469
COPY: FINAL_CONFIRMADO_POR_MIGUEL
MEDICION_7D: ACTIVA / CORTE 2026-10-04 17:22:14 America/Mexico_City
REGLA: publicación confirmada por Miguel; conservar programación original como historial.

Formato recomendado:
- imagen principal 4:5.
- copy breve de venta.
- CTA.
- sin VIN, odómetro ni documentación privada.

## 3. IMAGENES COMERCIALES

ESTADO: PENDIENTE

Generar después de selección:
- HERO.
- exterior frontal.
- lateral.
- 3/4 trasero.
- interior.
- tablero.
- caja.
- motor/equipo.

Mantener originales separados de retoques/derivados.

## 4. HISTORIA

ESTADO: PENDIENTE

Formato:
- 9:16.

Secuencia sugerida:
1. HERO.
2. lateral/equipo.
3. interior.
4. caja.
5. CTA.

Objetivo:
3 a 5 frames.

## 5. FEED

ESTADO: EN_PRODUCCION / BORRADOR_PRECAPTURA / NO_PUBLICAR

Formato:
- 4:5 preferente.
- carrusel de 5 a 8 imágenes.

Orden recomendado:
1. HERO.
2. perfil.
3. 3/4 trasero.
4. interior.
5. tablero.
6. caja.
7. motor/equipo.
8. CTA si aplica.

## 6. REEL

ESTADO: PENDIENTE

Formato:
- vertical 9:16.

Duración objetivo:
- 15 a 30 s.

Material:
- walkaround.
- frontal a lateral.
- perfil.
- trasera.
- caja.
- interior.
- tablero.
- palanca manual.
- motor/equipo.

## 7. TIKTOK

ESTADO: PENDIENTE

Formato:
- vertical 9:16.

Duración objetivo:
- 8 a 20 s para versión corta.
- opcional 20 a 30 s para versión completa.

Requisitos:
- hook visual inmediato.
- HERO en primeros segundos.
- movimiento estable.
- equipo diferenciador.
- cierre con CTA.
- sin datos privados.

## GATE DE PRODUCCION

DECISION_OPERATIVA_2026-09-27:
- Marketplace y Feed pueden prepararse como BORRADOR_PRECAPTURA con el material comercial ya aprobado.
- Post de Facebook ya está PROGRAMADA con copy final confirmado por Miguel; no modificarla salvo autorización expresa.
- Estado mientras falte el trabajo de campo: EN_PRODUCCION.
- WhatsApp: LISTO por transición explícita del entregable; conservar NO_PUBLICAR. Para las demás salidas, no programar/publicar automáticamente ni pasarlas a LISTO antes de revisar la nueva captura.
- Reel y TikTok continúan esperando el video vertical de campo cuando corresponda.

Flujo de cierre:
CAPTURA_COMERCIAL_COMPLETA
→ MATERIAL_NUEVO_SUBIDO
→ REVISION_MATERIAL
→ SELECCION_FINAL
→ ACTUALIZAR_BORRADORES
→ CONTENIDO_DISPONIBLE
→ LISTO_PARA_VALIDACION

La nueva captura puede sustituir o complementar imágenes de Marketplace, Post y Feed antes del cierre.

## REGLAS

- NO PUBLICAR AUTOMATICAMENTE.
- NO usar material PENDIENTE_REVISION.
- NO publicar VIN completo.
- NO publicar odómetro.
- NO mostrar documentos privados.
- NO sobrescribir originales.


## RUTAS DE SALIDA EN DRIVE

Después de `SELECCION_FINAL`, usar:

```text
02_SALIDAS/AFL-279006/
├── 00_CONTENIDO_DISPONIBLE/
├── 10_MARKETPLACE/
├── 20_IMAGENES_COMERCIALES/
├── 30_POST/
├── 40_FEED/
├── 50_HISTORIAS/
├── 60_PORTADAS/
├── 70_REEL/
├── 80_TIKTOK/
├── 90_WHATSAPP_OCULTO/
└── 95_PARA_ENVIAR/
```

Regla:
- originales permanecen en ENTRADAS;
- derivados terminados van a SALIDAS;
- no mezclar material pendiente con piezas finales;
- no publicar automáticamente.


## CONTROL DE MUSICA

Antes de producir Reel, TikTok o Historia con audio:

1. Consultar [MUSICA_USADA.md](../../_SISTEMA/MUSICA_USADA.md).
2. Evitar audios con estado `PUBLICADO`.
3. Elegir audio disponible.
4. Después de publicación, registrar el uso por AFL-ID y plataforma.

No crear carpeta de música para este vehículo.
No guardar archivos de audio.


## REVALIDACIÓN DE CHECKPOINT — 2026-09-27 15:25

- 20_NUEVA_CAPTURA continúa vacía.
- 30_POST fue verificado en Drive como PROGRAMADA y sincronizado.
- No procede MATERIAL_NUEVO_SUBIDO ni REVISION_MATERIAL.
- Se conserva CAPTURA_PENDIENTE.
- Siguiente acción operativa: CAPTURA_COMERCIAL_COMPLETA de 22 fotos + video vertical 9:16 y carga únicamente en 20_NUEVA_CAPTURA.
- Facebook Post programada para 2026-09-29 19:00; MEDICION_7D inicia solo después de PUBLICADO_CONFIRMADO_POR_MIGUEL.

## REVALIDACIÓN DE CHECKPOINT — 2026-09-27 17:08 America/Mexico_City

- `20_NUEVA_CAPTURA` continúa vacía.
- No procede `MATERIAL_NUEVO_SUBIDO` ni una nueva `REVISION_MATERIAL`.
- Se conserva `PRECAPTURA_CON_BORRADORES / CAPTURA_PENDIENTE`.
- Siguiente acción: `CAPTURA_COMERCIAL_COMPLETA` con 22 fotos + video vertical 9:16.
- Cargar únicamente en `01_ENTRADAS/AFL-279006/20_NUEVA_CAPTURA`.
- Evento de campo confirmado para 2026-09-28 10:00–11:00.
- Facebook Post permanece `PROGRAMADA` para 2026-09-29 19:00; `PROGRAMADA ≠ PUBLICADA`.
- `MEDICION_7D` no inicia hasta `PUBLICADO_CONFIRMADO_POR_MIGUEL`.

## PUBLICACIÓN FACEBOOK — CONFIRMACIÓN REAL 2026-09-27 17:22:14 America/Mexico_City

- Estado anterior: `PROGRAMADA`.
- Estado nuevo: `PUBLICADO_CONFIRMADO_POR_MIGUEL`.
- Programación original: 2026-09-29 19:00 America/Mexico_City.
- Publicación real confirmada por Miguel: 2026-09-27 17:22:14 America/Mexico_City.
- Identificador: `1886741839427469`.
- `MEDICION_7D` activa desde 2026-09-27T17:22:14-06:00; corte 2026-10-04T17:22:14-06:00.
- Captura física: `PRECAPTURA_CON_BORRADORES / CAPTURA_PENDIENTE`.
- Siguiente acción de campo: `CAPTURA_COMERCIAL_COMPLETA`.
- No autoriza publicación automática de ninguna otra pieza.

