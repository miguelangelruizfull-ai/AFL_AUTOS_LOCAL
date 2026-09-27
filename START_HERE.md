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
- precio MXN como fallback manual;
- CTA como fallback manual.

Resolución:

1. si existe AFL-ID en `data/vehicles`, el expediente vigente es la fuente de datos;
2. si todavía no existe expediente, se usan exclusivamente nombre, precio y CTA ingresados manualmente;
3. el fallback manual sirve para redactar la respuesta y no crea ni actualiza automáticamente expediente, HOME, Drive, catálogo o WhatsApp;
4. no inventar datos faltantes;
5. HOME permite copiar un prompt de **otra respuesta** o una **alternativa breve**;
6. no enviar ni publicar automáticamente.


## COPY PAGE COMERCIAL

Entrada oficial desde HOME/ROOT:

- UI: `COPY_PAGE.html`
- Motor: `app/copy-page.js`
- Política/routing: `data/copy-page.json`
- Contrato: `data/prompts/copy-page-respuestas.json`

Canales:

`COMENTARIO_PUBLICO / MESSENGER_INBOX / WHATSAPP`

Contrato funcional:

`RESPONDER → NO_REPETIR_DATOS → VERIFICAR_UNIDAD → DETECTAR_IDIOMA/LADA → CLASIFICAR_LEAD → SIGUIENTE_ACCION → OPCIONES`

Reglas:
- si existe número, detectar país y LADA/código de área cuando el mapa local lo permita;
- el teléfono permanece solo en sesión y nunca se persiste en HOME, repo, localStorage o query string;
- si el dato ya fue proporcionado, no volver a pedirlo;
- precio solo se comunica automáticamente desde un campo explícitamente publicable;
- unidad no verificada no autoriza año, versión, motor, transmisión, tracción, documentación o disponibilidad;
- para leads fuera de México, confirmar si la compra se realizará en México y no prometer exportación/envío;
- la siguiente acción se ofrece mediante enlace `target="_blank"` hacia ROOT/vehículo, Multimedia, Programador o WhatsApp del lead según corresponda;
- Copy Page genera/copia respuestas, pero NO envía ni publica automáticamente.
