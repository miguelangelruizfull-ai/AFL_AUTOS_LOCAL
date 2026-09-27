# PLAN CAPTURA — AFL-279006

ESTADO: CAPTURA_PENDIENTE
TIPO: CAPTURA_COMERCIAL
ENTRADA_LOGICA: AFL_AUTOS_MULTIMEDIA/01_ENTRADAS/AFL-279006
SALIDA_LOGICA: AFL_AUTOS_MULTIMEDIA/02_SALIDAS/AFL-279006
PROGRAMACION_ACTIVA: 2026-09-28 10:00-11:00 America/Mexico_City
REPROGRAMACION: HASTA_COMPLETAR_CAPTURA
SALIDA: MOSTRAR_OPCIONES_SIEMPRE
ACTUALIZADO: 2026-09-27

## REGLA DE ENTRADA
Todo material nuevo del vehículo entra primero como PENDIENTE_REVISION.
Revisar antes de moverlo a selección, contenido o salida.

## PREPARACION
- Lavar exterior.
- Limpiar cristales, tablero, asientos y caja.
- Retirar objetos personales, basura y accesorios sueltos.
- Estacionar con fondo limpio y luz uniforme.
- No ocultar daños ni defectos visibles.

## FOTOS OBLIGATORIAS
1. HERO 3/4 frontal, altura de faros.
2. Frente completo.
3. Perfil izquierdo 90°.
4. Perfil derecho 90°.
5. 3/4 trasero.
6. Trasera completa.
7. Cabina extendida / puertas abiertas.
8. Caja con cubierta cerrada.
9. Caja con cubierta abierta.
10. Interior de caja.
11. Cabina desde puerta del conductor.
12. Tablero encendido.
13. Volante y controles.
14. Palanca de transmisión manual.
15. Asientos delanteros.
16. Segunda fila / espacio trasero.
17. Rin y neumático.
18. Compartimiento de motor.
19. Emblemas y accesorios relevantes.
20. Daños o detalles visibles para registro interno.
21. Etiqueta técnica solo para verificación privada.

## VIDEO REAL
- Vertical 9:16.
- HERO acercamiento.
- Frontal a lateral.
- Perfil.
- 3/4 posterior.
- Caja cerrada y abierta.
- Interior y tablero.
- Palanca manual.
- Motor/arranque si es seguro.
- Walkaround continuo 20–30 s.

## CLASIFICACION DESPUES DE CADA CARGA
- APROBADO
- RECHAZADO
- DUPLICADO
- PENDIENTE_REVISION
- FALTANTE

RECHAZADO y DUPLICADO se aíslan y registran.
NO borrar permanentemente originales de forma automática.

## PRIVADO / NO PUBLICAR
- VIN completo.
- Odómetro.
- Etiquetas con identificadores.
- Documentación personal o sensible.

## CIERRE DE CADA SESION
1. Subir originales sin editar.
2. Cambiar estado a MATERIAL_NUEVO_SUBIDO.
3. Ejecutar REVISION_MATERIAL.
4. Actualizar SELECCION_MATERIAL.md.
5. Marcar tomas cubiertas y faltantes.
6. Si quedan faltantes obligatorios: mantener CAPTURA_PENDIENTE y reprogramar la captura activa sin duplicar eventos.
7. Si no quedan faltantes: CAPTURA_COMPLETA y detener reprogramaciones.
8. Mantener WhatsApp OCULTO hasta cierre y aprobación.
9. NO PUBLICAR AUTOMÁTICAMENTE.
