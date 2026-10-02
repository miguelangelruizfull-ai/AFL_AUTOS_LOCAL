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


## CHECKPOINT Y PROMPTS OPERATIVOS

Cada vehículo operativo debe poder reanudarse sin depender de memoria de ChatGPT.

Fuente mínima por unidad:

1. `data/vehicles/AFL-ID.json` — estado y checkpoint canónico de la web.
2. `data/vehicles/index.json` — HOME.
3. Drive `01_ENTRADAS/AFL-ID` y `02_SALIDAS/AFL-ID`.
4. Documento Drive `AFL-ID — CONTROL OPERATIVO`.
5. Los `.md` de `ACTIVOS/AFL-ID/` solo cuando sean relevantes al paso actual.

### Contrato después de cada prompt operativo

Todo prompt que cambie o revise el estado de una unidad debe cerrar en la misma operación:

1. actualizar Drive y el `CONTROL OPERATIVO`;
2. actualizar `data/vehicles/AFL-ID.json`;
3. actualizar `data/vehicles/index.json` para que HOME muestre el checkpoint y siguiente acción vigentes;
4. actualizar documentación operativa relevante;
5. verificar consistencia Drive ↔ JSON vehículo ↔ HOME;
6. dejar `checkpoint.nextAction` preparado para el siguiente chat.

No se considera cerrado un prompt si solo se respondió en conversación y el estado no quedó persistido.

Reglas:
- no publicar automáticamente;
- no depender de memoria de chat;
- no releer todo el proyecto si el checkpoint y las fuentes mínimas son suficientes;
- no exponer VIN completo, odómetro, documentación privada o PII.


## EDICION AUTORIZADA

Prompt canónico:

`data/prompts/editar-informacion-autorizada.json`

Uso:

1. indicar AFL-ID;
2. indicar CAMPO/ruta;
3. indicar NUEVO_VALOR;
4. Miguel autoriza explícitamente el cambio;
5. leer el valor vigente;
6. actualizar únicamente el campo autorizado y sus resúmenes dependientes;
7. sincronizar CONTROL OPERATIVO/Drive, JSON del vehículo y HOME;
8. verificar coincidencia antes de cerrar.

Ejemplo de precio:

`CAMPO: commercial.priceInternal`

Actualizar ese campo también actualiza `priceInternal` del resumen HOME. No modifica precio de catálogo, estado, checkpoint ni publicación salvo autorización específica.

## ESTANDAR DRIVE Y HOME

Todos los vehículos del framework, actuales y nuevos, deben tener la misma estructura de ENTRADAS/SALIDAS definida en `data/multimedia.json`, un CONTROL OPERATIVO dentro de SALIDAS y un expediente JSON detallado cuando la unidad ya esté incorporada al framework. HOME debe mostrar accesos ROOT en su pestaña propia y respuestas rápidas reutilizables.


## CIERRE DESPUES DE PROGRAMAR O PUBLICAR

`PROGRAMADA ≠ PUBLICADA`.

Al confirmar una programación social:
1. actualizar el archivo real de la pieza en su carpeta de `02_SALIDAS` (por ejemplo `30_POST`) con copy final, estado, fecha/hora e identificador disponible;
2. registrar canal, fuente, fecha/hora y estado en el expediente del vehículo;
3. sincronizar `data/vehicles/index.json` para HOME;
4. sincronizar `data/programador.json` con la fuente real de la programación;
5. actualizar CONTROL OPERATIVO/Drive y documentación relevante;
6. conservar el checkpoint operativo del vehículo salvo que el evento cambie realmente ese flujo.

Al confirmar publicación real, cambiar la pieza a `PUBLICADO_CONFIRMADO_POR_MIGUEL` y activar únicamente `MEDICION_7D`.

Después del cierre, mostrar la siguiente acción solo cuando el ChatGPT actual tenga una recomendación concreta; en ese caso devolver después el menú/opciones del vehículo. Si no existe recomendación, omitir ese retorno.

Toda programación, publicación o cambio autorizado debe dejar HOME actualizado antes de cerrar.


## MENU FINAL OBLIGATORIO

Después de persistir y verificar cualquier cambio operativo:

1. determinar si existe una siguiente acción concreta con la evidencia y checkpoint vigentes;
2. si existe, mostrarla primero como **RECOMENDADA**;
3. mostrar después las demás opciones relevantes de la unidad;
4. usar enlaces operativos vigentes cuando existan;
5. si no existe una recomendación concreta, omitir la etiqueta/recomendación y mostrar solamente las opciones restantes.

El menú se genera después de sincronizar Drive ↔ JSON vehículo ↔ HOME ↔ documentación aplicable, por lo que siempre debe representar el estado recién persistido.


## RESPUESTA ALTERNATIVA DESDE HOME

HOME incluye una pestaña **Otra respuesta** para generar una redacción distinta ante la misma pregunta comercial.

Contrato:

- `data/prompts/respuesta-alternativa.json`

Campos disponibles:

- pregunta o mensaje original;
- AFL-ID opcional cuando ya existe expediente;
- nombre del vehículo como fallback manual;
- canal de respuesta (`COMENTARIO / MESSENGER / WHATSAPP / LLAMADA`);
- precio MXN como fallback manual;
- CTA como fallback manual.

Resolución:

1. si existe AFL-ID en `data/vehicles`, el expediente vigente es la fuente de datos;
2. si todavía no existe expediente, se usan exclusivamente nombre, precio y CTA ingresados manualmente;
3. el fallback manual sirve para redactar la respuesta y no crea ni actualiza automáticamente expediente, HOME, Drive, catálogo o WhatsApp;
4. no inventar datos faltantes;
5. en `MESSENGER`, `WHATSAPP` o `LLAMADA`, un `commercial.priceInternal` vigente puede usarse cuando la intención requiere precio;
6. en `COMENTARIO` público, `commercial.priceInternal` no autoriza mostrar la cifra; si el catálogo omite precio, mover la continuidad a inbox;
7. HOME permite copiar un prompt de **otra respuesta** o una **alternativa breve**;
8. no enviar ni publicar automáticamente.


## COPY PAGE COMERCIAL

Entrada oficial desde HOME/ROOT:

- pestaña integrada en HOME: **Generador respuestas**
- UI reutilizada: `COPY_PAGE.html?embedded=1`
- Motor: `app/copy-page.js`
- Política/routing: `data/copy-page.json`
- Contrato: `data/prompts/copy-page-respuestas.json`

Canales:

`COMENTARIO_PUBLICO / MESSENGER_INBOX / WHATSAPP / LLAMADA`

Contrato funcional:

`RESPONDER → NO_REPETIR_DATOS → VERIFICAR_UNIDAD → DETECTAR_IDIOMA/LADA → CLASIFICAR_LEAD → SIGUIENTE_ACCION → OPCIONES`

Reglas:
- si existe número, detectar país y LADA/código de área cuando el mapa local lo permita;
- el teléfono permanece solo en sesión y nunca se persiste en HOME, repo, localStorage o query string;
- si el dato ya fue proporcionado, no volver a pedirlo;
- en `MESSENGER`, `WHATSAPP` y `LLAMADA`, si `commercial.priceInternal` contiene una cifra vigente y la intención requiere precio, se puede comunicar esa cifra exacta;
- en comentario público, `commercial.priceInternal` nunca se toma como autorización de publicación; solo se muestra un precio público explícitamente autorizado y, si no lo hay, se mueve la continuidad a inbox;
- informar precio en privado no cambia `commercial.catalogPrice`, `whatsapp.price` ni autoriza publicación;
- unidad no verificada no autoriza año, versión, motor, transmisión, tracción, documentación o disponibilidad;
- para leads fuera de México, confirmar si la compra se realizará en México y no prometer exportación/envío;
- la siguiente acción se ofrece mediante enlace `target="_blank"` hacia ROOT/vehículo, Multimedia, Programador o WhatsApp del lead según corresponda;
- Copy Page genera/copia respuestas, pero NO envía ni publica automáticamente.


## ROOT GLOBAL — AFL AUTOS LAB

HOME integra navegación y relación operativa con los repositorios privados sin convertirlos en datos públicos.

Relación canónica:

```text
Vehiculos/index/EXPEDIENTES_INDEX.json = NAVEGACION
Vehiculos/.../PUENTE.md = VERDAD_DE_UNIDAD
AFL_AUTOS_CONTENT_LAB = PRODUCCION / EXPERIMENTO
AFL_AUTOS_LOCAL = HOME / DERIVADO_PUBLICO_SANITIZADO
```

Flujo:

```text
VEHICULOS / PUENTE.md
→ CONTENT LAB
→ validación / producción
→ derivados sanitizados
→ HOME
```

Reglas:
- Content Lab nunca sustituye el `PUENTE.md`;
- HOME no debe exponer VIN completo, odómetro, PII, documentos ni URLs privadas;
- una contradicción se reconcilia primero en la fuente dueña del dato;
- la integración con Lab no autoriza publicación automática;
- la pestaña **AFL Autos Lab** del HOME muestra esta relación y accesos a los repositorios para usuarios autorizados.


## ADMIN ROOT — CAPA PRIVADA AUTORIZADA

Miguel autoriza a ROOT GLOBAL a consultar y mostrar información privada necesaria para operar, auditar y escalar AFL AUTOS cuando la información provenga de fuentes autenticadas y autorizadas.

Separación obligatoria:

```text
PUBLIC = GitHub Pages + JSON sanitizado
ADMIN ROOT = sesión autenticada + fuentes privadas
```

Cuando se muestren datos privados, etiquetar:

- `ADMIN ROOT · PRIVADO`
- `SOLO ADMIN · NO PUBLICABLE`
- `FUENTE PRIVADA AUTENTICADA`

Reglas:

- `VISIBLE_EN_ADMIN_ROOT != PUBLICABLE`;
- `AUTORIZADO_PARA_OPERAR != AUTORIZADO_PARA_PUBLICAR`;
- no persistir valores privados en HTML/JS/JSON/assets de GitHub Pages;
- CSS, JavaScript o una pestaña oculta no constituyen control de acceso;
- sanitizar antes de sincronizar cualquier dato hacia HOME público;
- no publicar automáticamente.

Política completa: `_SISTEMA/ADMIN_ROOT.md`.


## AUTORIZACION GLOBAL DE CREACION DESDE HOME Y LISTA

La acción manual de Miguel sobre cualquier vehículo:

`HOME / lista.html → abrir ficha → Crear contenido con AFL Lab / Crear contenido por pieza / Contenido Express`

constituye autorización explícita para **CREAR Y PRODUCIR derivados** usando únicamente material real y datos verificables de esa unidad.

Reglas transversales para todos los vehículos:

- `AUTORIZADO_CREAR ≠ APROBADO ≠ PUBLICADO`.
- `CHECKPOINT_OPERATIVO ≠ VETO_A_CREACION_MANUAL`.
- Un checkpoint en `CAPTURA_PENDIENTE`, `REVISION_MATERIAL`, `SELECCION_FINAL_BLOQUEADA` o `PRODUCCION_FINAL_BLOQUEADA` conserva el flujo operativo, pero no cancela una pieza solicitada manualmente.
- Si falta un dato/toma, se omite solo el elemento dependiente y se continúa con el material utilizable.
- `commercial.priceInternal` / `PRECIO INTERNO` permanece `SOLO_ADMIN / NO_PUBLICABLE`; HOME no debe insertarlo en prompts creativos como valor visible.
- Precio en arte/copy solo cuando exista precio público expresamente autorizado.
- La creación no cambia por sí sola el checkpoint físico.
- Resultado creativo: `PRODUCIDO_NO_APROBADO` hasta aprobación expresa; si la base visual no supera el gate para publicación pero sirve como prueba, `BORRADOR_INTERNO_REQUIERE_RECAPTURA`.
- No publicar ni programar automáticamente.
- No inventar datos, tomas, versión, tracción, equipamiento o condición.

Esta autorización es global y evita mantener reglas distintas por vehículo.

## CREAR CONTENIDO CON AFL LAB DESDE HOME

Cada tarjeta de vehículo incluye:

`Seleccionar función → Crear contenido con AFL Lab → Preparar orden`

La selección genera una orden con AFL-ID, checkpoint de navegación, fecha/hora de solicitud y zona `America/Mexico_City`.

Launcher público:

`data/prompts/crear-contenido-afl-lab.json`

Contrato canónico privado de producción:

`AFL_AUTOS_CONTENT_LAB/contracts/HOME_CREAR_CONTENIDO_AFL_LAB_V1.md`

Ejecución:

`HOME → Vehiculos/EXPEDIENTES_INDEX → PUENTE.md → Drive/CONTROL → AFL Autos Lab → repos derivados afectados → HOME`

Reglas:
- `PUENTE.md` manda para datos variables de la unidad;
- Drive debe groundear archivos/carpetas y verificar padres antes de mover;
- RAW/originales canónicos no se mueven/eliminan automáticamente;
- seleccionados, aprobados, derivados y entregables sí pueden avanzar cuando el destino sea inequívoco;
- sólo se actualizan los repositorios afectados;
- HOME recibe `contentLab` sanitizado con estado, resultado, cantidades y timestamps;
- registrar `requestedAt`, `startedAt`, `completedAt`, `lastVerifiedAt` y `movedAt` reales;
- no publicar automáticamente.


## LISTA JSON-DRIVEN

`lista.html` ya no mantiene tarjetas de vehículos escritas manualmente.

Fuente:

`data/vehicles/index.json`

Comportamiento:
- carga únicamente el índice público ligero;
- filtra/busca en cliente;
- abre el detalle por vehículo bajo demanda;
- muestra solo banderas sanitizadas de PUENTE/RELACIONES/DRIVE/REPOS;
- no expone URLs ni IDs privados de Drive;
- evita duplicados entre HOME y la lista.

La autoridad privada continúa en `Vehiculos/PUENTE.md` y la resolución privada en `Vehiculos/.../RELACIONES.json`.


## PRIORIDAD COMERCIAL GLOBAL — VENTA / LLAMADA / HORARIO

Aplica a **todos los vehículos** sin reescribir el checkpoint físico de cada unidad.

Orden operativo cuando compiten tareas:

1. cliente o negociación activa;
2. llamada o visita de intención alta;
3. material urgente necesario para responder al lead;
4. publicación;
5. organización interna.

Horario comercial: `lunes a sábado, 08:00–21:00`, zona `America/Mexico_City`.

Regla de llamada:

- no llamar automáticamente;
- si ya existe teléfono en la sesión y la intención es alta, evaluar llamada como siguiente acción cuando reduzca fricción comercial;
- dentro del horario puede mostrarse `LLAMAR_AHORA`;
- fuera del horario usar `PROGRAMAR_LLAMADA`;
- una solicitud explícita de visita conserva `PROPONER_VISITA`;
- no volver a pedir un teléfono ya capturado;
- preguntar precio + tener teléfono no convierte por sí solo el estado en `LEAD_CALIFICADO`;
- no afirmar que la llamada vende más que la visita sin medición comparable.

La política se implementa globalmente en Copy Page/Home y por eso no requiere editar todos los expedientes de vehículo. Los datos variables de cada unidad siguen gobernados por `Vehiculos/PUENTE.md`.
