# ADMIN ROOT — Datos privados y visibilidad

Actualizado: 2026-09-27

## AUTORIZACIÓN

Miguel autoriza a ROOT GLOBAL a consultar y mostrar información privada necesaria para operar, auditar, relacionar y escalar AFL AUTOS cuando la sesión use fuentes autenticadas y autorizadas.

Esta autorización NO convierte los datos privados en datos publicables.

## DOS SUPERFICIES

```text
PUBLIC
→ GitHub Pages / JSON público / vistas sanitizadas
→ solo información apta para exposición pública

ADMIN ROOT
→ sesión autenticada de ROOT / conectores autorizados / fuentes privadas
→ puede consultar y mostrar datos privados necesarios para la operación
```

## ETIQUETADO OBLIGATORIO

Cuando ROOT muestre información privada debe marcarla claramente con una de estas etiquetas:

- `ADMIN ROOT · PRIVADO`
- `SOLO ADMIN · NO PUBLICABLE`
- `FUENTE PRIVADA AUTENTICADA`

Si una respuesta mezcla datos públicos y privados, separar visualmente ambas capas.

## REGLA TÉCNICA CRÍTICA

AFL_AUTOS_LOCAL está alojado en un repositorio público y GitHub Pages sirve archivos públicamente.

Por lo tanto:

- ocultar un dato con CSS, JavaScript, una pestaña, un modal o una bandera `admin=true` NO lo vuelve privado;
- un dato incluido en HTML, JavaScript, JSON, assets, historial Git o source maps debe considerarse públicamente recuperable;
- nunca incrustar credenciales, tokens, PII sensible, VIN completo, documentos privados, conversaciones RAW ni URLs/IDs privados en archivos servidos por GitHub Pages.

## QUÉ PUEDE VER ADMIN ROOT

Desde fuentes autenticadas, ROOT puede mostrar cuando sea necesario:

- VIN completo;
- odómetro/millas/km;
- documentos y estado documental;
- enlaces o IDs privados de Drive;
- datos comerciales internos;
- notas operativas;
- relaciones entre repositorios privados;
- información de leads o conversaciones cuando el trabajo autorizado lo requiera;
- cualquier otro dato privado necesario para ejecutar o auditar el sistema.

Siempre aplicar minimización: mostrar lo necesario para la tarea actual.

## QUÉ LLEGA A PUBLIC

Solo derivados sanitizados explícitamente aptos para exposición pública.

```text
FUENTE PRIVADA
→ ROOT ADMIN
→ VALIDAR
→ SANITIZAR
→ DERIVADO PUBLICABLE
→ AFL_AUTOS_LOCAL / GitHub Pages
```

## ADMIN ROOT EN LA INTERFAZ

Una vista pública puede mostrar que existe un modo `ADMIN ROOT`, sus estados, enlaces de entrada o placeholders, pero no debe contener los valores privados.

Los valores privados se resuelven en la sesión autenticada de ROOT o, en el futuro, mediante un backend autenticado separado de GitHub Pages.

## PUBLICACIÓN

`VISIBLE_EN_ADMIN_ROOT != PUBLICABLE`

`AUTORIZADO_PARA_OPERAR != AUTORIZADO_PARA_PUBLICAR`

No publicar automáticamente.
