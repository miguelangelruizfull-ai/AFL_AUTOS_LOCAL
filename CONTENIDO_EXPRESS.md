# CONTENIDO EXPRESS — AFL AUTOS

Estado: **AUTORIZADO**
Fecha de autorización: **2026-10-02**
Ámbito: **AFL_AUTOS_LOCAL / AFL Lab**

## Autorización desde HOME

Seleccionar una función de contenido en HOME o en la ficha abierta desde `lista.html` constituye autorización explícita de Miguel para **crear el derivado solicitado** con el material verificable disponible.

`AUTORIZADO_CREAR ≠ APROBADO ≠ PUBLICADO`

El checkpoint operativo puede permanecer en captura/revisión y continuar en paralelo. No usarlo como veto para una solicitud manual de creación.

Límites:
- no publicar/programar automáticamente;
- no usar `commercial.priceInternal` / `PRECIO INTERNO` como precio visible;
- no inventar datos o tomas faltantes;
- no cambiar el checkpoint solo por producir una pieza;
- no marcar APROBADO/PUBLICADO sin evidencia.

## Objetivo

Reducir el flujo de creación de contenido a una sola ejecución por vehículo después de subir las fotos o videos necesarios:

**material subido → captura comercial express → estrategia comercial por vehículo → contenido final**

No se debe detener el flujo entre captura, estrategia y producción cuando la evidencia disponible sea suficiente.

## Entrada mínima

1. AFL-ID del vehículo.
2. Carpeta seleccionada con fotos/videos del vehículo.
3. Función de contenido: paquete express, portada, flyer, historia, TikTok o Marketplace.
4. Carpeta de referencias creativas, opcional.


## Navegación obligatoria de material

Antes de producir cualquier pieza, el ejecutor debe resolver la carpeta operativa exacta del vehículo y **mostrar en la respuesta un enlace vivo a la carpeta de archivos disponibles**. Ese enlace se obtiene en tiempo de ejecución desde Drive autorizado; no se persisten IDs ni URLs privadas en HOME o JSON público.

Después de inventariar el material, mostrar estas rutas de continuación sin obligar a reiniciar el flujo:

1. **Subir o aportar nuevo material** a la carpeta de entrada de la unidad.
2. **Seleccionar otra carpeta existente** de la misma unidad.
3. **Crear/usar selección temporal** en `01_ENTRADAS/<AFL-ID>/05_SELECCION_TEMPORAL` y copiar allí solo los archivos de trabajo seleccionados.
4. **Continuar con la producción** usando la carpeta actualmente seleccionada.

Reglas:
- RAW/originales canónicos no se mueven, borran ni sustituyen.
- Cuando el origen esté fuera del espacio de la unidad, copiar únicamente seleccionados/derivados de trabajo; no mover el original.
- La carpeta temporal es operativa, no una nueva fuente de verdad.
- Si la carpeta seleccionada está vacía, no terminar solo con “sin material”: devolver el enlace de la carpeta, las opciones anteriores y el faltante físico exacto.
- Al elegir **Continuar con la producción**, desplegar las opciones de contenido disponibles para esa unidad.

## Aprobación y biblioteca de referencias

Drive mantiene una biblioteca reutilizable llamada `REFERENCIAS_APROBADAS_AFL`.

- Si Miguel **aprueba explícitamente** una portada, flyer, historia u otra pieza producida, copiar el derivado aprobado a `REFERENCIAS_APROBADAS_AFL/<TIPO_DE_PIEZA>`; crear el subdirectorio cuando todavía no exista.
- El archivo original de `02_SALIDAS/<AFL-ID>/...` permanece en su lugar; la biblioteca recibe una copia de referencia.
- `PRODUCIDO_NO_APROBADO` y `BORRADOR_INTERNO_REQUIERE_RECAPTURA` nunca entran en la biblioteca.
- Cuando no se indique otra carpeta creativa, `REFERENCIAS_APROBADAS_AFL` es la referencia por defecto.
- Una referencia aprobada sirve como inspiración de composición, jerarquía y dirección visual; nunca autoriza copiar vehículo, datos, precio, logos ajenos o características de otra unidad.
- En el cierre posterior a una aprobación, mostrar el enlace vivo de la biblioteca o del subdirectorio creado, sin persistir ese URL privado en HOME público.

## Regla de alcance rápido

- Leer únicamente el expediente del vehículo seleccionado, su PUENTE cuando sea necesario para validar datos vigentes y la carpeta de material elegida.
- No barrer todos los repositorios ni todo Drive para producir una pieza.
- No mezclar material de otras unidades.
- No pedir de nuevo información que ya esté verificada en el expediente o en el material seleccionado.
- Si falta un dato, bloquear solo la afirmación que dependa de ese dato; continuar con el resto de la pieza cuando sea posible.

## Fase 1 — Captura comercial express

A partir del material ya subido:

- Inventariar fotos y videos disponibles.
- Detectar qué planos sirven para exterior, interior, detalles, equipo, prueba visible y cierre.
- Extraer únicamente hechos visibles o ya verificados.
- Registrar un resumen de captura comercial utilizable por la estrategia.
- No inventar versión, motor, tracción, equipamiento, kilometraje, precio público, condición ni ubicación.
- `PRECIO INTERNO` es SOLO ADMIN y no debe aparecer en copy, texto sobreimpreso ni arte.

Si una toma física indispensable no existe, indicar exactamente cuál falta sin frenar las tareas que sí pueden ejecutarse. Si el material actual permite una pieza fiel, producirla; si solo permite una prueba insuficiente para publicación, marcarla `BORRADOR_INTERNO_REQUIERE_RECAPTURA`.

## Fase 2 — Estrategia comercial por vehículo

Generar la estrategia inmediatamente después de la captura:

- Hook principal.
- Beneficio central.
- Evidencia visual disponible.
- Objeción principal a resolver.
- CTA.
- Enfoque por plataforma y formato.
- Copy y texto sobreimpreso separados.
- Tendencias, audio y hashtags solo cuando correspondan y puedan verificarse en el momento de producir.

La estrategia debe pertenecer al vehículo seleccionado, no a una plantilla genérica.

## Fase 3 — Crear contenido

Según la función seleccionada:

- **Paquete express:** preparar las piezas útiles con el material disponible.
- **Portada:** hero/portada comercial.
- **Flyer:** pieza gráfica comercial.
- **Historia:** vertical 9:16.
- **TikTok:** video vertical corto.
- **Marketplace:** ficha/post comercial.

Cada salida debe incluir, según aplique:

- concepto;
- selección de material;
- copy;
- texto sobreimpreso;
- formato/dimensiones o duración;
- shot list/cut sheet;
- edición, efectos o transiciones;
- audio sugerido;
- hashtags;
- nombre del archivo;
- carpeta de salida.

Si las herramientas disponibles permiten producir el archivo final, crear el derivado. Si no, dejar una especificación terminada y lista para edición.

## Creatividad establecida

- Mantener apariencia real del vehículo.
- Mejorar presentación sin crear características inexistentes.
- Priorizar claridad comercial, lectura móvil y primer impacto.
- Usar referencias seleccionadas como inspiración de composición, ritmo y estructura, no como material para copiar.
- No copiar marcas de agua, logos ajenos ni contenido protegido.
- No garantizar viralidad.
- Para video, revisar hook inicial, ritmo, encuadre, estabilidad, luz, color, audio, subtítulos y cortes aprovechables.

## Persistencia y privacidad

- RAW/originales no se borran, mueven ni sustituyen.
- Guardar derivados únicamente en SALIDAS del vehículo.
- HOME solo recibe resumen sanitizado y estados sustentados por evidencia.
- No exponer VIN completo, PII, documentos privados, odómetro privado ni URLs/IDs privados.
- No cambiar a LISTO o PUBLICADO sin evidencia real del entregable.
- **No publicar automáticamente.**

## Cierre obligatorio

Devolver en una sola respuesta:

1. material usado;
2. captura comercial express;
3. estrategia comercial;
4. pieza(s) producida(s) o especificación final;
5. archivos/destinos;
6. bloqueos puntuales, si existen;
7. siguiente acción mínima;
8. enlace vivo de la carpeta de material disponible;
9. opciones: subir/aportar material, seleccionar carpeta, usar temporal o continuar producción;
10. después de una aprobación explícita, enlace de la referencia aprobada guardada.

## Flujo específico — Historia 9:16

La función **Historia** reutiliza la navegación validada de **Crear portada**, pero añade un ciclo propio para secuencia vertical y revisión móvil.

Flujo funcional:

    MATERIAL_DISPONIBLE
    → SUBIR / OTRA_CARPETA / 05_SELECCION_TEMPORAL / CONTINUAR
    → VALIDAR_HERO_Y_DATOS_PUBLICABLES
    → DEFINIR_SECUENCIA_9X16
    → PRODUCIR_BORRADOR
    → REVISION
    → APROBACION_EXPLICITA
    → APROBADAS + COPIA_A_REFERENCIAS
    → OPCIONES_DE_CONTINUACION

### Estructura Drive por vehículo

    01_ENTRADAS/<AFL-ID>/
    └── 05_SELECCION_TEMPORAL/

    02_SALIDAS/<AFL-ID>/50_HISTORIAS/
    ├── 00_BORRADORES/
    ├── 10_EN_REVISION/
    ├── 20_APROBADAS/
    ├── 30_VARIANTES/
    └── 90_RECHAZADAS/

Biblioteca de referencia aprobada:

    AFL_AUTOS_REFERENCIAS_CREATIVAS/
    └── 04_REFERENCIAS_AFL_APROBADAS/
        └── HISTORIAS/

`04_REFERENCIAS_AFL_APROBADAS` es la implementación Drive actual del alias lógico `REFERENCIAS_APROBADAS_AFL`.

### Estados

- `BORRADOR_INTERNO_REQUIERE_RECAPTURA` → `00_BORRADORES`.
- `PRODUCIDO_NO_APROBADO` / `PRODUCIDA_VERIFICADA_NO_PUBLICAR` → `10_EN_REVISION`.
- `APROBADO_POR_MIGUEL` → `20_APROBADAS` y copia adicional a `04_REFERENCIAS_AFL_APROBADAS/HISTORIAS`.
- Variantes derivadas de una pieza vigente → `30_VARIANTES`.
- `RECHAZADO_POR_MIGUEL / NO_PUBLICAR / REQUIERE_REDISENO` → `90_RECHAZADAS`.

### Gate de Historia

1. Resolver y mostrar el enlace vivo del material disponible.
2. Permitir subir material, elegir otra carpeta, usar `05_SELECCION_TEMPORAL` o continuar.
3. Validar `ORIGINAL → SELECCION → RETOQUE → LAVADO_VISUAL_SI_APLICA → VALIDACION_FIDELIDAD`.
4. Diseñar 9:16 desde origen; no recortar automáticamente un feed.
5. Mantener HERO, título y CTA fuera de overlays críticos.
6. Usar 1–3 datos publicables por frame.
7. Secuencia base: `IDENTIDAD/HERO → DIFERENCIADOR → ACCION`.
8. No pasar a `20_APROBADAS` sin aprobación expresa.
9. Después de aprobación, copiar la pieza a la biblioteca `HISTORIAS`; conservar el original dentro de SALIDAS.
10. No publicar automáticamente.
