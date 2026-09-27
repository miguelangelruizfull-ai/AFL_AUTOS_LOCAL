# MULTIMEDIA — AFL AUTOS

Actualizado: 2026-09-27

## FUENTE DE MULTIMEDIA

Google Drive conserva los archivos pesados del sistema.

Root lógico:

`AFL_AUTOS_MULTIMEDIA`

Este repositorio público solo documenta la arquitectura lógica.
No guarda URLs privadas, IDs de Drive, VIN completos ni datos personales.

## ARQUITECTURA ACTUAL EN DRIVE

```text
AFL_AUTOS_MULTIMEDIA/
├── 01_ENTRADAS/
├── 01_ACTIVOS/                 # estructura histórica / transición
├── 02_PENDIENTE_REVISION/      # estructura histórica / transición
├── 03_LISTO_PRODUCCION/
├── 04_PUBLICADO/
├── 05_VENDIDOS/
└── 99_ARCHIVO/
```

## 01_ENTRADAS — PUERTA DE INGESTA POR VEHICULO

Toda unidad nueva o material nuevo de una unidad debe entrar por:

```text
AFL_AUTOS_MULTIMEDIA/
└── 01_ENTRADAS/
    └── AFL-ID/
```

Ejemplo piloto vigente:

```text
01_ENTRADAS/
└── AFL-279006/
    ├── 00_MATERIAL_DISPONIBLE_LOCAL/
    ├── 10_APROBADOS/
    ├── 20_NUEVA_CAPTURA/
    ├── 90_RECHAZADOS/
    └── 95_DUPLICADOS/
```

## FUNCION DE CADA CARPETA

### 00_MATERIAL_DISPONIBLE_LOCAL

Entrada inicial para material ya existente del vehículo:

- fotografías;
- videos;
- evidencia técnica;
- VIN/etiquetas para verificación privada;
- interior;
- exterior;
- motor;
- equipo;
- documentos solo cuando sean necesarios para validación privada.

Estado inicial:

`PENDIENTE_REVISION`

Nada dentro de esta carpeta se considera aprobado automáticamente.

### 10_APROBADOS

Contiene material que ya pasó revisión.

Puede incluir:

- fotos comerciales;
- evidencia técnica útil;
- material interno de condición.

Importante:

`APROBADO` no significa `PUBLICABLE`.

Los archivos con VIN, odómetro, etiquetas, documentos o evidencia sensible deben marcarse:

`PRIVADO / NO_PUBLICAR`

### 20_NUEVA_CAPTURA

Aquí se carga el material producido durante una nueva sesión de campo.

Flujo:

```text
CAPTURA_DE_CAMPO
→ 20_NUEVA_CAPTURA
→ MATERIAL_NUEVO_SUBIDO
→ REVISION_MATERIAL
→ CLASIFICACION
```

Después de revisión cada archivo puede pasar a:

- `APROBADO`
- `RECHAZADO`
- `DUPLICADO`
- `PRIVADO`
- `FALTANTE`

### 90_RECHAZADOS

Material técnicamente no útil:

- desenfoque;
- encuadre deficiente;
- reflejo severo;
- dedo/mano tapando lente;
- exposición inutilizable;
- archivo corrupto;
- toma que no aporta cobertura.

No se elimina automáticamente.

### 95_DUPLICADOS

Copias exactas o redundantes del material fuente.

Regla:

- aislar;
- registrar;
- no borrar originales automáticamente;
- eliminación física requiere una acción separada y autorizada.

## FLUJO OPERATIVO DE ENTRADAS

```text
MATERIAL DISPONIBLE
→ 01_ENTRADAS/AFL-ID/00_MATERIAL_DISPONIBLE_LOCAL
→ REVISION_MATERIAL
→ CLASIFICACION
    ├── 10_APROBADOS
    ├── 90_RECHAZADOS
    └── 95_DUPLICADOS
→ PLAN_CAPTURA
→ GOOGLE CALENDAR
→ CAPTURA_DE_CAMPO
→ 20_NUEVA_CAPTURA
→ REVISION_MATERIAL
→ SELECCION_FINAL
→ CAPTURA_COMPLETA
```

## RELACION CON GOOGLE CALENDAR

Google Calendar conserva:

- fecha;
- hora;
- recordatorios;
- programación activa de captura.

Drive conserva:

- originales;
- material nuevo;
- aprobados;
- rechazados;
- duplicados.

GitHub conserva:

- `PUENTE.md`;
- `ESTADO.md`;
- `PLAN_CAPTURA.md`;
- `CAPTURA_COMPLETA.md`;
- `SELECCION_MATERIAL.md`;
- `FICHA_WHATSAPP.md`;
- `PLAN_CONTENIDO.md`.

## RELACION CON EL VEHICULO

Estructura GitHub:

```text
ACTIVOS/
└── AFL-ID/
    ├── PUENTE.md
    ├── ESTADO.md
    ├── PLAN_CAPTURA.md
    ├── CAPTURA_COMPLETA.md
    ├── SELECCION_MATERIAL.md
    ├── FICHA_WHATSAPP.md
    └── PLAN_CONTENIDO.md
```

Estructura Drive:

```text
01_ENTRADAS/
└── AFL-ID/
    ├── 00_MATERIAL_DISPONIBLE_LOCAL/
    ├── 10_APROBADOS/
    ├── 20_NUEVA_CAPTURA/
    ├── 90_RECHAZADOS/
    └── 95_DUPLICADOS/
```

La relación se realiza mediante el `AFL-ID`.

## ESTADO PILOTO ACTUAL

Unidad activa en `01_ENTRADAS`:

- `AFL-279006` — Chevrolet Colorado Work Truck 2016.

Su flujo actual:

```text
REVISION_MATERIAL: COMPLETADA
CLASIFICACION: COMPLETADA
CAPTURA_COMERCIAL_COMPLETA: PROGRAMADA
VIDEO_REAL: PENDIENTE
WHATSAPP: OCULTO
PUBLICAR: NO
```

Archivos relacionados:

- [Captura completa](../ACTIVOS/AFL-279006/CAPTURA_COMPLETA.md)
- [Plan de captura](../ACTIVOS/AFL-279006/PLAN_CAPTURA.md)
- [Selección de material](../ACTIVOS/AFL-279006/SELECCION_MATERIAL.md)
- [Plan de contenido](../ACTIVOS/AFL-279006/PLAN_CONTENIDO.md)
- [Estado](../ACTIVOS/AFL-279006/ESTADO.md)
- [Puente](../ACTIVOS/AFL-279006/PUENTE.md)

## SALIDA DESPUES DE CAPTURA

Cuando la captura quede completa:

```text
CAPTURA_COMPLETA
→ REVISION_MATERIAL
→ SELECCION_FINAL
→ WHATSAPP_OCULTO_LISTO
→ CONTENIDO_DISPONIBLE
```

Contenido posible después de revisión:

- Marketplace;
- post;
- imágenes comerciales;
- historia;
- feed;
- Reel;
- TikTok.

## REGLAS DE SEGURIDAD

- No publicar automáticamente.
- No almacenar VIN completo en contenido público.
- No publicar odómetro.
- No mostrar documentación privada.
- No sobrescribir originales.
- No borrar rechazados o duplicados automáticamente.
- No mover material sin conservar trazabilidad.
- Material `PENDIENTE_REVISION` no entra a producción.
