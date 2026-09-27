# MULTIMEDIA

Actualizado: 2026-09-27

## Fuente de archivos pesados
Google Drive.

Root lógico: `AFL_AUTOS_MULTIMEDIA`

## Estructura canónica
```text
AFL_AUTOS_MULTIMEDIA/
├── 01_ACTIVOS/
├── 02_PENDIENTE_REVISION/
├── 03_LISTO_PRODUCCION/
├── 04_PUBLICADO/
├── 05_VENDIDOS/
└── 99_ARCHIVO/
```

## Flujo
`02_PENDIENTE_REVISION` recibe material nuevo que todavía no ha sido validado.
Solo después de revisión puede pasar a `01_ACTIVOS`, `03_LISTO_PRODUCCION` u otro estado correspondiente.

## Convención recomendada por unidad
```text
AFL-CODIGO-UNIDAD/
├── 01_ORIGINALES/
├── 02_SELECCION/
├── 03_VIDEO/
├── 04_EDITADOS/
└── 05_ENTREGABLES/
```

## Regla de seguridad
Este repositorio es público. No almacenar aquí URLs, IDs privados de Drive, VIN completos ni datos personales.

## Relación con GitHub
- Drive conserva multimedia original y derivados.
- `PUENTE.md` registra el nombre lógico de la carpeta de la unidad.
- `ESTADO.md` registra fase de material/captura.
- `INDEX.md` conserva navegación global.
