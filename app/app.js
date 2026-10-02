import { getJSON, money, labelStatus, element } from "./api.js";

const root = document.getElementById("app");

function linkButton(label, href, primary) {
  const a = element("a", primary ? "btn primary" : "btn", label);
  a.href = href;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  return a;
}

function vehicleThumbnailPath(v) {
  if (v && v.ui && v.ui.thumbnail) return v.ui.thumbnail;
  if (v && v.image) return v.image;
  return "assets/thumbs/" + encodeURIComponent(v.id) + ".jpg";
}

function publicVehicleThumbnailUrl(v) {
  if (v && v.ui && v.ui.thumbnailPublicUrl) return v.ui.thumbnailPublicUrl;
  try { return new URL(vehicleThumbnailPath(v), document.baseURI).href; }
  catch (error) { return vehicleThumbnailPath(v); }
}

function configurationSummary(v) {
  const c = (v && v.vehicle && v.vehicle.configuration) || {};
  return [c.engine, c.transmission, c.drivetrain].filter(function(x) {
    return x != null && String(x).trim() && String(x).toUpperCase() !== "PENDIENTE";
  }).join(" · ") || "Configuración pendiente de confirmar";
}

function detectOperationalPattern(v) {
  const c = v.checkpoint || {};
  const status = String((v.status && v.status.vehicle) || c.state || "").toUpperCase();
  const next = String(c.nextAction || "").toUpperCase();
  const joined = status + " " + next;
  if (/MATERIAL_NUEVO_SUBIDO/.test(joined)) return "MATERIAL_NUEVO_SUBIDO";
  if (/REVISION_MATERIAL/.test(joined)) return "REVISION_MATERIAL";
  if (/SELECCION_FINAL/.test(joined)) return "SELECCION_FINAL";
  if (/CAPTURA_PENDIENTE|CAPTURA_COMERCIAL|PLAN_CAPTURA/.test(joined)) return "CAPTURA_PENDIENTE";
  if (/CONTENIDO_DISPONIBLE|LISTO_PARA_VALIDACION|LISTO/.test(joined)) return "CONTENIDO_LISTO_O_VALIDACION";
  return "GENERAL";
}

function currentChatGPTInstruction(v) {
  return [
    "Detecta el patrón operativo real usando checkpoint, estado, Drive y evidencia disponible.",
    "Patrón funcional detectado por la interfaz: " + detectOperationalPattern(v) + ".",
    "La decisión del siguiente paso corresponde al ChatGPT actual. El repo solo aporta estado, evidencia, enlaces y acciones manuales; no uses el orden del menú estático como autoridad de recomendación.",
    "Recomienda y ejecuta únicamente el siguiente paso válido que pueda realizarse con evidencia disponible. Si requiere trabajo físico, indícalo y conserva estados.",
    "Al responder, muestra la miniatura pública de este vehículo al inicio si el cliente permite imágenes."
  ].join(" ");
}


function standardQuickFields(v) {
  return (v && Array.isArray(v.quickResponses) && v.quickResponses.length) ? v.quickResponses : [
    { label: "Precio interno", field: "commercial.priceInternal" },
    { label: "Disponibilidad", field: "commercial.availability" },
    { label: "Color", field: "vehicle.color" },
    { label: "Título público", field: "vehicle.publicTitle" },
    { label: "Estado", field: "status.vehicle" },
    { label: "Siguiente acción", field: "checkpoint.nextAction" },
    { label: "WhatsApp descripción", field: "whatsapp.description" }
  ];
}

function formatOperationalDateTime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  try {
    return new Intl.DateTimeFormat("es-MX", {
      timeZone: "America/Mexico_City",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }).format(d) + " · America/Mexico_City";
  } catch (error) {
    return String(value);
  }
}

function currentHomeRequestTime() {
  const now = new Date();
  let local = now.toISOString();
  try {
    local = new Intl.DateTimeFormat("es-MX", {
      timeZone: "America/Mexico_City",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }).format(now);
  } catch (error) {}
  return { utc: now.toISOString(), local: local, timezone: "America/Mexico_City" };
}

function buildContentLabPrompt(v) {
  const c = v.checkpoint || {};
  const t = currentHomeRequestTime();
  const title = (v.vehicle && v.vehicle.publicTitle) || v.title || v.id;
  return [
    "CREAR_CONTENIDO_CON_AFL_LAB",
    "",
    "AFL-ID: " + v.id,
    "VEHÍCULO: " + title,
    "SOLICITUD_HOME_UTC: " + t.utc,
    "SOLICITUD_HOME_LOCAL: " + t.local,
    "ZONA_HORARIA: " + t.timezone,
    "",
    "CONTRATO CANÓNICO:",
    "AFL_AUTOS_CONTENT_LAB/contracts/HOME_CREAR_CONTENIDO_AFL_LAB_V1.md",
    "LAUNCHER HOME: AFL_AUTOS_LOCAL/data/prompts/crear-contenido-afl-lab.json",
    "",
    "AUTORIZACIÓN OPERATIVA:",
    "Esta selección de HOME constituye autorización explícita de Miguel para CREAR/PRODUCIR derivados creativos de esta unidad con el material verificable disponible. La autorización de crear es independiente del checkpoint operativo: CAPTURA_PENDIENTE, REVISION_MATERIAL, SELECCION_FINAL_BLOQUEADA o PRODUCCION_FINAL_BLOQUEADA pueden conservarse sin vetar la pieza solicitada manualmente. No autoriza publicar, programar, inventar datos ni usar precio interno como precio visible. Relaciona únicamente los repositorios afectados y Google Drive autorizado; no muevas ni elimines RAW/originales canónicos.",
    "",
    "CHECKPOINT HOME DE NAVEGACIÓN:",
    "- Fase: " + (c.phase || "PENDIENTE"),
    "- Estado: " + (c.state || v.status || "PENDIENTE"),
    "- Último cierre: " + (c.lastCompleted || "PENDIENTE"),
    "- Siguiente acción: " + (c.nextAction || v.nextAction || "PENDIENTE"),
    "- Última verificación: " + (c.lastVerifiedAt || c.lastVerified || v.updated || "PENDIENTE"),
    "",
    "EJECUCIÓN OBLIGATORIA:",
    "1. Lee Vehiculos/START_HERE.md.",
    "2. Localiza " + v.id + " en Vehiculos/index/EXPEDIENTES_INDEX.json y abre completo el PUENTE.md indicado por puente_path.",
    "3. Lee AFL_AUTOS_CONTENT_LAB/START_HERE.md y el contrato canónico anterior.",
    "4. Groundea Drive/CONTROL OPERATIVO y verifica padres y destinos antes de cualquier movimiento.",
    "5. Separa flujo operativo y creación manual: conserva el checkpoint y faltantes físicos, pero produce el contenido solicitado con el material verificable disponible. Si falta un dato/toma, omite solo el elemento dependiente; bloquea toda la creación únicamente si no existe material utilizable o sería necesario inventar/alterar.",
    "6. Sincroniza sólo los dominios afectados: Content Lab, Content System, Comercial, Platform, Operación, History y/o HOME según corresponda.",
    "7. Registra requestedAt, startedAt, completedAt, lastVerifiedAt y movedAt reales en America/Mexico_City; conserva timestamps externos de la fuente.",
    "8. Actualiza data/vehicles/" + v.id + ".json y data/vehicles/index.json con contentLab sanitizado: operación, estado, timestamps, resultado, filesMoved, filesProduced, deliverables, reposUpdated y nextAction.",
    "9. Verifica Drive ↔ repos afectados ↔ HOME y devuelve resultados.",
    "",
    "REGLAS:",
    "- PUENTE.md manda sobre HOME y Content Lab para datos variables de la unidad.",
    "- AUTORIZADO_CREAR ≠ APROBADO ≠ PUBLICADO.",
    "- CHECKPOINT_OPERATIVO ≠ VETO_A_CREACION_MANUAL.",
    "- commercial.priceInternal / PRECIO INTERNO = SOLO ADMIN / NO PUBLICABLE; no lo uses en copy, texto sobreimpreso ni arte.",
    "- No publiques automáticamente.",
    "- No expongas VIN completo, odómetro, documentos, PII, RAW ni IDs/URLs privadas en HOME.",
    "- No declares movimientos o producción si no quedaron persistidos y verificados.",
    "",
    "CIERRE:",
    "Muestra autoridad PUENTE usada, producción creada/continuada, archivos producidos, movimientos Drive con cantidades y horas, repos modificados, estado por entregable, requestedAt/startedAt/completedAt, resumen visible en HOME, siguiente acción y bloqueos."
  ].join("\n");
}


const CONTENT_EXPRESS_CONTRACT = "AFL_AUTOS_CONTENT_LAB/contracts/CONTENIDO_EXPRESS.md";
const APPROVED_REFERENCES_ALIAS = "DRIVE:REFERENCIAS_APROBADAS_AFL";
const TEMP_SELECTION_FOLDER = "05_SELECCION_TEMPORAL";

function buildContentExpressPrompt(v, pieceKey, materialFolder, referenceFolder) {
  const c = v.checkpoint || {};
  const commercial = v.commercial || {};
  const title = (v.vehicle && v.vehicle.publicTitle) || v.title || v.id;
  const reference = String(referenceFolder || APPROVED_REFERENCES_ALIAS).trim() || APPROVED_REFERENCES_ALIAS;
  const material = creativeMaterialPath(v, materialFolder);
  const pieces = creativeProductionPieces();
  const piece = pieces.find(function(item) { return item.key === pieceKey; });
  const requested = piece ? piece.label : "Paquete express";
  const output = piece
    ? v.drive.outputRoot.replace(/\/$/, "") + "/" + piece.outputFolder
    : pieces.map(function(item) {
        return item.label + " → " + v.drive.outputRoot.replace(/\/$/, "") + "/" + item.outputFolder;
      }).join("\n- ");

  return [
    "CONTENIDO_EXPRESS_AFL",
    "CONTRATO CANÓNICO EXPRESS: " + CONTENT_EXPRESS_CONTRACT,
    "CONTRATO HOME/LAB: AFL_AUTOS_CONTENT_LAB/contracts/HOME_CREAR_CONTENIDO_AFL_LAB_V1.md",
    "LAUNCHER HOME: AFL_AUTOS_LOCAL/data/prompts/crear-contenido-afl-lab.json",
    "",
    "AUTORIZACIÓN:",
    "La selección de esta función desde HOME/ficha constituye autorización explícita de Miguel para CREAR el derivado solicitado con el material verificable disponible. El checkpoint operativo puede conservarse en captura/revisión y no veta esta creación manual. No autoriza publicación, programación ni uso de precio interno como precio visible. No hagas barridos generales de repositorios o Drive.",
    "",
    "VEHÍCULO:",
    "- AFL-ID: " + v.id,
    "- Unidad: " + title,
    "- Función solicitada: " + requested,
    "- Carpeta de material: " + material,
    "- Carpeta de referencias creativas: " + reference,
    "- Referencia por defecto si no se elige otra: " + APPROVED_REFERENCES_ALIAS,
    "- Salida: " + output,
    "",
    "CONTEXTO VIGENTE:",
    "- Fase: " + (c.phase || "PENDIENTE"),
    "- Estado: " + (c.state || (v.status && v.status.vehicle) || "PENDIENTE"),
    "- Siguiente acción: " + (c.nextAction || "PENDIENTE"),
    "- Disponibilidad: " + (commercial.availability || "PENDIENTE"),
    "- Precio visible: SOLO si existe precio público/catalogable expresamente autorizado en la fuente vigente. PRECIO INTERNO = SOLO ADMIN / NO PUBLICABLE.",
    "",
    "FLUJO EXPRESS OBLIGATORIO — MISMA EJECUCIÓN:",
    "1. MATERIAL + ENLACE: revisa únicamente expediente/PUENTE y carpeta seleccionada. Resuelve en Drive y muestra SIEMPRE el enlace vivo de la carpeta de archivos disponibles; no persistas URL/ID privado en HOME público.",
    "2. NAVEGACIÓN: inventaría material y ofrece: SUBIR/APORTAR NUEVO MATERIAL, SELECCIONAR OTRA CARPETA, CREAR/USAR " + TEMP_SELECTION_FOLDER + " o CONTINUAR CON PRODUCCIÓN. Si la carpeta está vacía, no cierres sin estas opciones.",
    "3. CAPTURA EXPRESS: inventaría fotos/videos, identifica tomas útiles y genera una captura comercial factual con lo visible y verificado.",
    "4. ESTRATEGIA: sin esperar otro proceso, define hook, beneficio principal, prueba visible, objeción y CTA específicos para esta unidad.",
    "5. CREATIVIDAD PREMIUM AFL: antes de componer, lee el contrato express completo y analiza visualmente referencias aprobadas relevantes del mismo tipo de pieza: mínimo 3 cuando existan y preferentemente 5–6. Extrae el ADN visual repetido de AFL (marca integrada, vehículo HERO, profundidad, geometría dinámica, jerarquía, tipografía y acentos) y aplícalo sin copiar literalmente una pieza ni transferir datos de otra unidad.",
    "5.1 GATE ANTI-GENÉRICO: la pieza no puede depender de una plantilla genérica de agencia/lote. Si al quitar mentalmente el logo pudiera pertenecer sin cambios relevantes a cualquier vendedor, o si la dirección se reduce a foto + rectángulo semitransparente + píldora + CTA tipo botón, recompón antes de entregar. Ejecuta el gate premium del contrato CONTENIDO_EXPRESS.md y exige generic_template_risk=LOW para considerar la composición lista para revisión.",
    "5.2 ESPECIFICIDAD: la composición debe responder a la toma HERO, color, postura y proporciones reales de esta unidad; conservar fidelidad del vehículo y usar el logo AFL canónico/temporal autorizado, nunca uno generado o aproximado.",
    "6. PRODUCCIÓN: al continuar, despliega las opciones de contenido y crea la función solicitada. Si es Paquete express, produce o deja lista la especificación de todas las piezas útiles con la evidencia disponible.",
    "7. VIDEO/TENDENCIAS: cuando aplique, analiza hook, ritmo, encuadre, estabilidad, luz, color, audio, subtítulos y cortes. Verifica tendencias/audio vigentes antes de recomendarlos.",
    "8. APROBACIÓN/REFERENCIAS: solo después de aprobación explícita, copia el derivado aprobado a " + APPROVED_REFERENCES_ALIAS + "/<TIPO_DE_PIEZA>. PRODUCIDO_NO_APROBADO no entra.",
    "8.1 MEMORIA VISUAL: registra premium_authenticity, generic_template_risk y approved_reference_alignment en la evaluación de la pieza cuando aplique.",
    "9. CIERRE: entrega captura, estrategia, copy, texto sobreimpreso, formato/duración, shot list/cut sheet, efectos, audio, hashtags, nombre de archivo, destino, enlace de material y opciones de continuación.",
    "",
    "REGLAS DE VELOCIDAD:",
    "- No detener captura → estrategia → producción si la evidencia es suficiente.",
    "- No pedir de nuevo datos ya verificados.",
    "- Si falta un dato, bloquea solo la afirmación dependiente y continúa con lo demás.",
    "- Si falta una toma física indispensable, especifica exactamente cuál; no inventes la toma. Conserva el checkpoint, pero continúa la creación con lo que sí sea verificable cuando sea viable.",
    "",
    "SEGURIDAD Y ESTADO:",
    "- No alterar RAW/originales.",
    "- Guardar solo derivados en SALIDAS.",
    "- HOME recibe únicamente resumen sanitizado.",
    "- No exponer VIN completo, PII, documentos privados, odómetro privado ni enlaces privados.",
    "- No marcar LISTO/PUBLICADO sin evidencia real.",
    "- No publicar automáticamente."
  ].join("\n");
}

function makeContentExpressPanel(vehicles) {
  const panel = element("div", "home-tab-panel");
  panel.dataset.tab = "express";
  panel.hidden = true;

  panel.append(
    element("div", "eyebrow", "AFL AUTOS · CONTENIDO EXPRESS"),
    element("h2", "", "Fotos → captura → estrategia → contenido"),
    element("p", "subtitle", "Selecciona vehículo, función y carpetas. La orden ejecuta captura comercial, estrategia y producción en una sola corrida sin barridos generales.")
  );

  const form = element("div", "creative-config-grid");

  const vehicleField = element("label", "creative-field");
  vehicleField.append(element("span", "", "Vehículo"));
  const vehicleSelect = element("select", "status-select");
  const vehiclePlaceholder = element("option", "", "Seleccionar vehículo…");
  vehiclePlaceholder.value = "";
  vehicleSelect.append(vehiclePlaceholder);
  (vehicles.vehicles || []).forEach(function(v) {
    const option = element("option", "", v.id + " · " + (v.title || "Vehículo"));
    option.value = v.id;
    option.dataset.detail = v.detail || ("data/vehicles/" + v.id + ".json");
    vehicleSelect.append(option);
  });
  vehicleField.append(vehicleSelect);

  const functionField = element("label", "creative-field");
  functionField.append(element("span", "", "Función"));
  const functionSelect = element("select", "status-select");
  const pack = element("option", "", "Paquete express");
  pack.value = "package";
  functionSelect.append(pack);
  creativeProductionPieces().forEach(function(piece) {
    const option = element("option", "", piece.label);
    option.value = piece.key;
    functionSelect.append(option);
  });
  functionField.append(functionSelect);

  const materialField = element("label", "creative-field");
  materialField.append(element("span", "", "Carpeta de material"));
  const materialSelect = element("select", "status-select");
  const materialPlaceholder = element("option", "", "Selecciona primero el vehículo");
  materialPlaceholder.value = "";
  materialSelect.append(materialPlaceholder);
  materialField.append(materialSelect);

  const referenceField = element("label", "creative-field");
  referenceField.append(element("span", "", "Carpeta de creatividad / referencias"));
  const referenceInput = element("input", "status-select");
  referenceInput.type = "text";
  referenceInput.placeholder = "Ruta o URL; por defecto se usa REFERENCIAS_APROBADAS_AFL";
  referenceInput.value = APPROVED_REFERENCES_ALIAS;
  referenceInput.autocomplete = "off";
  referenceField.append(referenceInput);

  functionField.hidden = true;
  form.append(vehicleField, materialField, referenceField, functionField);
  panel.append(form);

  let loadedVehicle = null;
  const status = element("span", "copy-status", "");

  async function loadSelectedVehicle() {
    loadedVehicle = null;
    materialSelect.replaceChildren();
    if (!vehicleSelect.value) {
      const o = element("option", "", "Selecciona primero el vehículo");
      o.value = "";
      materialSelect.append(o);
      return null;
    }

    const summary = (vehicles.vehicles || []).find(function(v) { return v.id === vehicleSelect.value; });
    const detailPath = (vehicleSelect.selectedOptions[0] && vehicleSelect.selectedOptions[0].dataset.detail) ||
      (summary && summary.detail) || ("data/vehicles/" + vehicleSelect.value + ".json");

    try {
      loadedVehicle = await getJSON(detailPath);
    } catch (error) {
      loadedVehicle = summary || null;
    }

    const drive = (loadedVehicle && loadedVehicle.drive) || {};
    const folders = Array.isArray(drive.inputs) && drive.inputs.length
      ? drive.inputs
      : (drive.inputRoot ? [drive.inputRoot] : []);

    if (!folders.length) {
      const o = element("option", "", "Carpeta no registrada; usar raíz de entrada");
      o.value = drive.inputRoot || "";
      materialSelect.append(o);
    } else {
      folders.forEach(function(folder, index) {
        const o = element("option", "", folder);
        o.value = folder;
        o.selected = index === 0;
        materialSelect.append(o);
      });
    }
    if (!folders.includes(TEMP_SELECTION_FOLDER)) {
      const temp = element("option", "", TEMP_SELECTION_FOLDER + " · crear/usar temporal");
      temp.value = TEMP_SELECTION_FOLDER;
      materialSelect.append(temp);
    }
    functionField.hidden = true;
    status.textContent = loadedVehicle
      ? "Unidad cargada. Selecciona función y prepara la orden express."
      : "No se pudo cargar el expediente de la unidad.";
    return loadedVehicle;
  }

  vehicleSelect.addEventListener("change", loadSelectedVehicle);

  const materialActions = element("div", "actions");
  materialActions.append(
    actionButton("Archivos disponibles · obtener enlace", async function() {
      const v = loadedVehicle || await loadSelectedVehicle();
      if (!v) { status.textContent = "Selecciona un vehículo."; return; }
      copyText(buildMaterialNavigationPrompt(v, "OPEN", materialSelect.value), status);
    }, false),
    actionButton("Subir / aportar material", async function() {
      const v = loadedVehicle || await loadSelectedVehicle();
      if (!v) { status.textContent = "Selecciona un vehículo."; return; }
      copyText(buildMaterialNavigationPrompt(v, "UPLOAD", materialSelect.value), status);
    }, false),
    actionButton("Usar carpeta temporal", async function() {
      const v = loadedVehicle || await loadSelectedVehicle();
      if (!v) { status.textContent = "Selecciona un vehículo."; return; }
      materialSelect.value = TEMP_SELECTION_FOLDER;
      copyText(buildMaterialNavigationPrompt(v, "TEMP", TEMP_SELECTION_FOLDER), status);
    }, false),
    actionButton("Continuar · elegir contenido", function() {
      functionField.hidden = false;
      status.textContent = "Menú de contenido habilitado. Elige la pieza y prepara la orden.";
    }, true)
  );
  panel.append(materialActions);

  const actions = element("div", "actions");
  actions.append(
    actionButton("Preparar Contenido Express", async function() {
      if (!vehicleSelect.value) {
        status.textContent = "Selecciona un vehículo.";
        return;
      }
      const v = loadedVehicle || await loadSelectedVehicle();
      if (!v) {
        status.textContent = "No se pudo cargar el vehículo.";
        return;
      }
      copyText(buildContentExpressPrompt(v, functionSelect.value, materialSelect.value, referenceInput.value), status);
    }, true),
    linkButton("Abrir lista de vehículos", "lista.html", false)
  );
  panel.append(actions, status, element("p", "deliverable-note", "Contrato autorizado: AFL_AUTOS_CONTENT_LAB/contracts/CONTENIDO_EXPRESS.md · gate premium/anti-genérico obligatorio · sin publicación automática."));
  return panel;
}

function contentLabHomeSummary(v) {
  const lab = v.contentLab || {};
  if (!lab.status && !lab.requestedAt && !lab.startedAt && !lab.completedAt) {
    return "AFL Lab: SIN EJECUCIÓN REGISTRADA";
  }
  const parts = ["AFL Lab: " + labelStatus(lab.status || "SIN_ESTADO")];
  const when = lab.completedAt || lab.startedAt || lab.requestedAt;
  if (when) parts.push(formatOperationalDateTime(when));
  if (lab.result) {
    const result = String(lab.result);
    parts.push(result.length > 150 ? result.slice(0, 147) + "…" : result);
  }
  return parts.join(" · ");
}

function makeHomeCardFunctionSelect(v) {
  const wrap = element("div", "home-card-function no-print");
  wrap.append(element("div", "eyebrow", "FUNCIÓN ROOT POR VEHÍCULO"));
  const row = element("div", "home-card-function-row");
  const select = element("select", "status-select home-function-select");
  const placeholder = element("option", "", "Seleccionar función…");
  placeholder.value = "";
  select.append(placeholder);
  const lab = element("option", "", "Crear contenido con AFL Lab");
  lab.value = "createContentLab";
  select.append(lab);

  const status = element("span", "copy-status", "");
  const run = actionButton("Preparar orden", function() {
    if (select.value !== "createContentLab") {
      status.textContent = "Selecciona una función.";
      return;
    }
    copyText(buildContentLabPrompt(v), status);
  }, true);

  select.addEventListener("change", function() {
    status.textContent = select.value === "createContentLab"
      ? "AFL Lab seleccionado. Preparará PUENTE → Drive/repos → producción → HOME."
      : "";
  });

  row.append(select, run);
  wrap.append(row, status);
  return wrap;
}

function buildAuthorizedEditPrompt(v, field, newValue) {
  const fieldPath = String(field || "<CAMPO>").trim() || "<CAMPO>";
  const value = String(newValue || "<NUEVO_VALOR>").trim() || "<NUEVO_VALOR>";
  const c = v.checkpoint || {};
  const protocol = v.promptProtocol || {};
  const lines = [
    "Opera únicamente el vehículo " + v.id + " (" + v.vehicle.publicTitle + ") dentro de AFL Autos.",
    "",
    "EDITAR INFORMACIÓN AUTORIZADA POR MIGUEL.",
    "Miguel autoriza explícitamente este cambio y únicamente este cambio:",
    "- CAMPO: " + fieldPath,
    "- NUEVO_VALOR: " + value,
    "",
    "CONTRATO CANÓNICO:",
    "data/prompts/editar-informacion-autorizada.json",
    "",
    "VALOR VIGENTE:",
    "Lee primero el valor actual desde el expediente/CONTROL OPERATIVO; no lo supongas.",
    "",
    "CHECKPOINT ACTUAL:",
    "- Fase: " + (c.phase || "PENDIENTE"),
    "- Estado: " + (c.state || (v.status && v.status.vehicle) || "PENDIENTE"),
    "- Siguiente acción: " + (c.nextAction || "PENDIENTE"),
    "",
    "REGLAS DEL CAMBIO:",
    "- Limita la autorización al CAMPO y NUEVO_VALOR indicados.",
    "- No cambies campos no solicitados.",
    "- Conserva estado, checkpoint y siguiente acción salvo que alguno de ellos sea el CAMPO autorizado.",
    "- Si CAMPO=commercial.priceInternal, sincroniza priceInternal en HOME; no cambies catalogPrice ni whatsapp.price salvo autorización separada.",
    "- Si CAMPO=vehicle.publicTitle, sincroniza el título de HOME.",
    "- Si CAMPO=status.vehicle o checkpoint.nextAction, sincroniza el resumen HOME correspondiente.",
    "- Actualiza CONTROL OPERATIVO y los documentos Drive directamente afectados.",
    "- Actualiza data/vehicles/" + v.id + ".json y data/vehicles/index.json.",
    "- Actualiza el .md operativo relevante cuando corresponda.",
    "- Verifica Drive ↔ JSON vehículo ↔ HOME antes de cerrar.",
    "- No publiques automáticamente.",
    "- No expongas VIN completo, odómetro, documentos privados o PII. Si el campo es privado, mantenlo fuera de JSON/HOME públicos.",
    "",
    "MINIATURA PÚBLICA:",
    publicVehicleThumbnailUrl(v),
    "",
    "CIERRE:",
    "Devuelve valor anterior, valor nuevo, fuentes actualizadas, checkpoint conservado/cambiado y enlaces operativos."
  ];
  if ((protocol.minimalSources || []).length) {
    lines.push("", "FUENTES MÍNIMAS DE ESTA UNIDAD:");
    protocol.minimalSources.forEach(function(x, i) { lines.push((i + 1) + ". " + x); });
  }
  return lines.join("\n");
}

function makeAuthorizedEditPanel(v) {
  const panel = element("article", "panel wide authorized-edit-panel no-print");
  panel.id = "authorized-edit";
  panel.append(
    element("div", "eyebrow", "AUTORIZACIÓN EXPLÍCITA DE MIGUEL"),
    element("h2", "", "Editar información autorizada"),
    element("p", "subtitle", "Escribe la ruta del campo y el nuevo valor. El botón copia un prompt que obliga a sincronizar Drive + expediente JSON + HOME.")
  );

  const form = element("div", "authorized-edit-grid");
  const fieldBox = element("label", "form-field");
  fieldBox.append(element("span", "", "Campo / ruta JSON"));
  const fieldInput = element("input");
  fieldInput.type = "text";
  fieldInput.placeholder = "Ej. commercial.priceInternal";
  fieldBox.append(fieldInput);

  const valueBox = element("label", "form-field");
  valueBox.append(element("span", "", "Nuevo valor"));
  const valueInput = element("textarea");
  valueInput.rows = 3;
  valueInput.placeholder = "Ej. 325000";
  valueBox.append(valueInput);
  form.append(fieldBox, valueBox);
  panel.append(form);

  const quick = element("div", "quick-field-buttons");
  standardQuickFields(v).forEach(function(item) {
    const b = actionButton(item.label, function() {
      fieldInput.value = item.field;
      fieldInput.focus();
      status.textContent = "Campo seleccionado: " + item.field + ". Escribe el nuevo valor.";
    }, false);
    quick.append(b);
  });
  panel.append(element("p", "deliverable-note", "Atajos de campo:"), quick);

  const status = element("span", "copy-status", "");
  const actions = element("div", "actions");
  actions.append(
    actionButton("Copiar prompt de edición autorizada", function() {
      copyText(buildAuthorizedEditPrompt(v, fieldInput.value, valueInput.value), status);
    }, true),
    actionButton("Ejemplo · actualizar precio", function() {
      fieldInput.value = "commercial.priceInternal";
      if (!valueInput.value) valueInput.value = "<PRECIO_MXN>";
      copyText(buildAuthorizedEditPrompt(v, fieldInput.value, valueInput.value), status);
    }, false)
  );
  panel.append(actions, status);
  return panel;
}

function buildAlternativeResponsePrompt(system, mode, channel, question, aflId, vehicleName, price, cta) {
  const promptPath = (system && system.features && system.features.alternativeResponsePrompt) || "data/prompts/respuesta-alternativa.json";
  const q = String(question || "").trim() || "<PREGUNTA_O_MENSAJE>";
  const id = String(aflId || "").trim();
  const name = String(vehicleName || "").trim();
  const priceText = String(price || "").trim();
  const ctaText = String(cta || "").trim();
  return [
    "GENERAR_RESPUESTA_ALTERNATIVA",
    "CONTRATO: " + promptPath,
    "MODO: " + (mode || "OTRA_RESPUESTA"),
    "CANAL: " + (String(channel || "COMENTARIO").trim().toUpperCase()),
    "",
    "PREGUNTA_O_MENSAJE:",
    q,
    "",
    "EXPEDIENTE:",
    "- AFL-ID: " + (id || "NO_PROPORCIONADO"),
    "",
    "FALLBACK MANUAL — usar solo si no existe expediente:",
    "- NOMBRE_VEHICULO: " + (name || "NO_PROPORCIONADO"),
    "- PRECIO_MXN: " + (priceText || "NO_PROPORCIONADO"),
    "- CTA: " + (ctaText || "NO_PROPORCIONADO"),
    "",
    "REGLAS:",
    "- Si el AFL-ID existe en data/vehicles, usa el expediente vigente como fuente de datos.",
    "- Si no existe expediente, usa únicamente los datos manuales proporcionados arriba.",
    "- No inventes datos faltantes ni finjas que existe un expediente.",
    "- Nombre, precio y CTA manuales sirven para esta respuesta; no crean ni actualizan automáticamente expediente, HOME, Drive, catálogo o WhatsApp.",
    "- Si hay precio manual, úsalo exactamente como fue escrito y solo cuando sea pertinente a la pregunta.",
    "- En COMENTARIO público no uses commercial.priceInternal como autorización para mostrar una cifra; en MESSENGER, WHATSAPP o LLAMADA sí puede usarse el precio interno vigente del expediente.",
    "- Si hay CTA manual, úsalo exactamente como fue escrito.",
    "- Genera una respuesta distinta a la anterior, lista para copiar y pegar.",
    "- No envíes ni publiques automáticamente."
  ].join("\n");
}

function makeAlternativeResponsePanel(system) {
  const panel = element("div", "home-tab-panel");
  panel.dataset.tab = "alternative";
  panel.hidden = true;

  panel.append(
    element("div", "eyebrow", "RESPUESTA COMERCIAL"),
    element("h2", "", "Generar otra respuesta / alternativa"),
    element("p", "subtitle", "Usa el expediente si existe. Si aún no está en Vehículos, captura nombre, precio y CTA como datos manuales para esa respuesta.")
  );

  const grid = element("div", "authorized-edit-grid");

  const channelBox = element("label", "form-field");
  channelBox.append(element("span", "", "Canal de respuesta"));
  const channelInput = element("select");
  [["COMENTARIO","Comentario público"],["MESSENGER","Inbox / Messenger"],["WHATSAPP","WhatsApp"],["LLAMADA","Llamada"]].forEach(function(pair) {
    const o = element("option", "", pair[1]);
    o.value = pair[0];
    channelInput.append(o);
  });
  channelBox.append(channelInput);

  const questionBox = element("label", "form-field");
  questionBox.append(element("span", "", "Pregunta o mensaje recibido"));
  const questionInput = element("textarea");
  questionInput.rows = 4;
  questionInput.placeholder = "Ej. ¿Cuál es el precio y dónde se encuentra?";
  questionBox.append(questionInput);

  const idBox = element("label", "form-field");
  idBox.append(element("span", "", "AFL-ID / expediente (opcional)"));
  const idInput = element("input");
  idInput.type = "text";
  idInput.placeholder = "Ej. AFL-279006";
  idBox.append(idInput);

  const nameBox = element("label", "form-field");
  nameBox.append(element("span", "", "Nombre del vehículo (fallback)"));
  const nameInput = element("input");
  nameInput.type = "text";
  nameInput.placeholder = "Ej. Chevrolet Colorado 2016";
  nameBox.append(nameInput);

  const priceBox = element("label", "form-field");
  priceBox.append(element("span", "", "Precio MXN (fallback)"));
  const priceInput = element("input");
  priceInput.type = "text";
  priceInput.inputMode = "numeric";
  priceInput.placeholder = "Ej. 330000";
  priceBox.append(priceInput);

  const ctaBox = element("label", "form-field");
  ctaBox.append(element("span", "", "CTA (fallback)"));
  const ctaInput = element("textarea");
  ctaInput.rows = 3;
  ctaInput.placeholder = "Ej. Mándanos mensaje por WhatsApp para más información.";
  ctaBox.append(ctaInput);

  grid.append(channelBox, questionBox, idBox, nameBox, priceBox, ctaBox);
  panel.append(grid);

  const status = element("span", "copy-status", "");
  const actions = element("div", "actions");
  actions.append(
    actionButton("Copiar prompt · otra respuesta", function() {
      copyText(buildAlternativeResponsePrompt(system, "OTRA_RESPUESTA", channelInput.value, questionInput.value, idInput.value, nameInput.value, priceInput.value, ctaInput.value), status);
    }, true),
    actionButton("Copiar prompt · alternativa breve", function() {
      copyText(buildAlternativeResponsePrompt(system, "ALTERNATIVA_BREVE", channelInput.value, questionInput.value, idInput.value, nameInput.value, priceInput.value, ctaInput.value), status);
    }, false)
  );
  panel.append(
    element("p", "deliverable-note", "Si no hay expediente, los datos manuales son solo fallback de redacción: no crean ficha ni autorizan publicación."),
    actions,
    status
  );
  return panel;
}

function makeResponseGeneratorPanel() {
  const panel = element("div", "home-tab-panel");
  panel.dataset.tab = "responses";
  panel.hidden = true;
  panel.append(
    element("div", "eyebrow", "COMERCIAL · RESPUESTAS"),
    element("h2", "", "Generador de respuestas"),
    element("p", "subtitle", "Generador integrado al HOME. Comentario público conserva la política de precio público; Inbox/Messenger, WhatsApp y Llamada pueden usar el precio interno vigente del expediente.")
  );
  const frame = element("iframe", "response-generator-frame");
  frame.src = "COPY_PAGE.html?embedded=1";
  frame.title = "AFL Autos · Generador de respuestas";
  frame.loading = "lazy";
  panel.append(frame);
  return panel;
}

function makeLabPanel(system) {
  const panel = element("div", "home-tab-panel");
  panel.dataset.tab = "lab";
  panel.hidden = true;

  const config = (system && system.rootGlobal) || {};
  panel.append(
    element("div", "eyebrow", "ROOT GLOBAL · AFL AUTOS LAB"),
    element("h2", "", "Relación de sistemas"),
    element("p", "subtitle", "Vehículos conserva la verdad vigente de cada unidad; AFL Autos Lab produce y experimenta; HOME consume únicamente derivados públicos sanitizados.")
  );

  const flow = element("div", "lab-flow");
  (config.flow || []).forEach(function(item, index) {
    flow.append(element("span", "lab-flow-step", item));
    if (index < (config.flow || []).length - 1) flow.append(element("span", "lab-flow-arrow", "→"));
  });
  if ((config.flow || []).length) panel.append(flow);

  const grid = element("div", "lab-relation-grid");
  (config.relations || []).forEach(function(item) {
    const card = element("article", "lab-relation-card");
    card.append(
      element("div", "eyebrow", item.role || "SISTEMA"),
      element("h3", "", item.label || item.key || "Sistema"),
      element("p", "deliverable-note", item.description || "")
    );
    const actions = element("div", "actions compact");
    if (item.repositoryUrl) actions.append(linkButton("Abrir repositorio", item.repositoryUrl, item.key === "contentLab"));
    if (item.startUrl) actions.append(linkButton("START_HERE", item.startUrl, false));
    if (actions.childNodes.length) card.append(actions);
    grid.append(card);
  });
  panel.append(grid);

  if ((config.rules || []).length) {
    const rules = element("div", "lab-rules");
    rules.append(element("strong", "", "Reglas ROOT Global"));
    rules.append(makeList(config.rules, false));
    panel.append(rules);
  }
  return panel;
}

function makeLabLauncherPanel(vehicles) {
  const panel = element("div", "home-tab-panel");
  panel.dataset.tab = "production";

  panel.append(
    element("div", "eyebrow", "AFL AUTOS LAB · PRODUCCIÓN"),
    element("h2", "", "Crear contenido con AFL Lab"),
    element("p", "subtitle", "Selecciona una unidad. La orden conserva el flujo canónico PUENTE → Drive/CONTROL → producción → repos afectados → HOME sanitizado.")
  );

  const form = element("div", "authorized-edit-grid");
  const vehicleBox = element("label", "form-field");
  vehicleBox.append(element("span", "", "Vehículo"));
  const select = element("select");
  const placeholder = element("option", "", "Seleccionar vehículo…");
  placeholder.value = "";
  select.append(placeholder);

  (vehicles.vehicles || []).forEach(function(v) {
    const option = element("option", "", v.id + " · " + (v.title || "Vehículo"));
    option.value = v.id;
    option.dataset.detail = v.detail || ("data/vehicles/" + v.id + ".json");
    select.append(option);
  });
  vehicleBox.append(select);

  const checkpointBox = element("div", "lab-launch-summary");
  checkpointBox.append(
    element("strong", "", "Checkpoint"),
    element("p", "deliverable-note", "Selecciona una unidad para ver fase, estado y siguiente acción.")
  );
  form.append(vehicleBox, checkpointBox);
  panel.append(form);

  const status = element("span", "copy-status", "");
  const actions = element("div", "actions");
  const prepare = actionButton("Preparar orden AFL Lab", async function() {
    if (!select.value) {
      status.textContent = "Selecciona un vehículo.";
      return;
    }
    const selected = (vehicles.vehicles || []).find(function(v) { return v.id === select.value; });
    try {
      const detailPath = (select.selectedOptions[0] && select.selectedOptions[0].dataset.detail) || (selected && selected.detail) || ("data/vehicles/" + select.value + ".json");
      const fullVehicle = await getJSON(detailPath);
      copyText(buildContentLabPrompt(fullVehicle), status);
    } catch (error) {
      if (selected) copyText(buildContentLabPrompt(selected), status);
      else status.textContent = "No se pudo preparar la orden.";
    }
  }, true);
  actions.append(prepare, linkButton("Lista de vehículos", "lista.html", false));
  panel.append(actions, status);

  function refreshSummary() {
    checkpointBox.replaceChildren();
    const v = (vehicles.vehicles || []).find(function(item) { return item.id === select.value; });
    if (!v) {
      checkpointBox.append(
        element("strong", "", "Checkpoint"),
        element("p", "deliverable-note", "Selecciona una unidad para ver fase, estado y siguiente acción.")
      );
      return;
    }
    const cp = v.checkpoint || {};
    checkpointBox.append(
      element("strong", "", v.id + " · " + (v.title || "Vehículo")),
      element("p", "deliverable-note", "Fase: " + labelStatus(cp.phase || "PENDIENTE")),
      element("p", "deliverable-note", "Estado: " + labelStatus(cp.state || v.status || "PENDIENTE")),
      element("p", "deliverable-note", "Siguiente: " + labelStatus(cp.nextAction || v.nextAction || "PENDIENTE"))
    );
  }
  select.addEventListener("change", refreshSummary);

  return panel;
}

function makeLabUxMenu(system, vehicles) {
  const wrap = element("div", "home-tabs");
  const nav = element("div", "home-tabs-nav");

  const buttons = {
    production: actionButton("Producción AFL Lab", function(){ activate("production"); }, true),
    express: actionButton("Contenido Express", function(){ activate("express"); }, false),
    responses: actionButton("Responder cliente", function(){ activate("responses"); }, false),
    alternative: actionButton("Otra redacción", function(){ activate("alternative"); }, false),
    tools: actionButton("Actualizar / operar", function(){ activate("tools"); }, false),
    systems: actionButton("Flujo y sistemas", function(){ activate("systems"); }, false)
  };
  nav.append(buttons.production, buttons.express, buttons.responses, buttons.alternative, buttons.tools, buttons.systems);

  const guide = element("article", "panel wide no-print");
  guide.append(
    element("div", "eyebrow", "MENÚ HOME · GUÍA RÁPIDA"),
    element("h2", "", "Elige por objetivo, no por nombre de herramienta"),
    element("p", "subtitle", "Cada opción indica cuándo conviene usarla y qué debe producir. Ninguna opción publica automáticamente.")
  );
  const guideGrid = element("div", "quick-response-grid");
  [
    {
      label: "1. Producción AFL Lab",
      when: "Cuando necesitas producción completa y trazable para una unidad.",
      output: "PUENTE → Drive/CONTROL → producción → repos afectados → HOME."
    },
    {
      label: "2. Contenido Express",
      when: "Cuando ya hay material utilizable y necesitas una pieza o paquete rápido.",
      output: "Selección de material → estrategia → derivado creativo → salida, sin publicar."
    },
    {
      label: "3. Responder cliente",
      when: "Cuando recibiste una pregunta real por comentario, Messenger, WhatsApp o llamada.",
      output: "Respuesta por canal respetando política de precio y datos confirmados."
    },
    {
      label: "4. Otra redacción",
      when: "Cuando la primera respuesta no convence o necesitas una alternativa breve.",
      output: "Nueva redacción sobre la misma intención; no crea ni modifica expediente."
    },
    {
      label: "5. Actualizar / operar",
      when: "Cuando Miguel autoriza cambiar un dato, auditar sincronización o registrar programación/publicación.",
      output: "Acción controlada + sincronización de las superficies dependientes."
    },
    {
      label: "6. Flujo y sistemas",
      when: "Cuando necesitas entender autoridad, repositorios, reglas o relación entre sistemas.",
      output: "Contexto técnico y navegación; no sustituye el checkpoint de una unidad."
    }
  ].forEach(function(item) {
    const card = element("div", "quick-response-card");
    card.append(
      element("strong", "", item.label),
      element("p", "deliverable-note", "Úsalo cuando: " + item.when),
      element("p", "deliverable-note", "Salida esperada: " + item.output)
    );
    guideGrid.append(card);
  });
  guide.append(guideGrid);

  const productionPanel = makeLabLauncherPanel(vehicles);
  const expressPanel = makeContentExpressPanel(vehicles);
  const responsesPanel = makeResponseGeneratorPanel();
  const alternativePanel = makeAlternativeResponsePanel(system);

  const toolsPanel = element("div", "home-tab-panel");
  toolsPanel.dataset.tab = "tools";
  toolsPanel.hidden = true;
  toolsPanel.append(
    element("div", "eyebrow", "AFL AUTOS LAB · HERRAMIENTAS"),
    element("h2", "", "Acciones rápidas"),
    element("p", "subtitle", "Edición autorizada, precio, disponibilidad, datos técnicos, WhatsApp, estado, sincronización y publicación confirmada.")
  );
  const quickGrid = element("div", "quick-response-grid");
  (system.quickResponses || []).forEach(function(item) {
    const card = element("div", "quick-response-card");
    card.append(element("strong", "", item.label), element("p", "deliverable-note", item.description || ""));
    const status = element("span", "copy-status", "");
    card.append(actionButton("Copiar acción", function(){ copyText(item.prompt || "", status); }, item.key === "editAuthorized"), status);
    quickGrid.append(card);
  });
  toolsPanel.append(quickGrid);

  const systemsPanel = makeLabPanel(system);
  systemsPanel.dataset.tab = "systems";

  const panels = {
    production: productionPanel,
    express: expressPanel,
    responses: responsesPanel,
    alternative: alternativePanel,
    tools: toolsPanel,
    systems: systemsPanel
  };

  function activate(name) {
    Object.keys(panels).forEach(function(key) {
      panels[key].hidden = key !== name;
      buttons[key].classList.toggle("primary", key === name);
    });
  }

  activate("production");
  wrap.append(guide, nav, productionPanel, expressPanel, responsesPanel, alternativePanel, toolsPanel, systemsPanel);
  return wrap;
}

function actionButton(label, onClick, primary) {
  const b = element("button", primary ? "btn primary" : "btn", label);
  b.type = "button";
  b.addEventListener("click", onClick);
  return b;
}

async function copyText(text, statusNode) {
  try {
    await navigator.clipboard.writeText(text);
    if (statusNode) statusNode.textContent = "Copiado";
  } catch (error) {
    if (statusNode) statusNode.textContent = "No se pudo copiar automáticamente";
  }
}

function stat(label, value) {
  const box = element("div", "stat");
  box.append(element("span", "", label), element("strong", "", value));
  return box;
}

function meta(label, value) {
  const box = element("div");
  box.append(element("span", "", label), element("strong", "", value));
  return box;
}

function scheduleCard(e) {
  const card = element("article", "schedule-card");
  const top = element("div", "schedule-top");
  const left = element("div");
  left.append(element("div", "eyebrow", e.type || "PROGRAMADO"), element("h3", "", e.title));
  top.append(left, element("span", "tag", labelStatus(e.status)));
  card.append(top);
  const timeText = e.date + " · " + e.start + (e.end ? "–" + e.end : "");
  card.append(element("div", "schedule-time", timeText));
  card.append(element("div", "schedule-meta", "Fuente: " + labelStatus(e.source || "GOOGLE_CALENDAR") + " · " + (e.timezone || "")));
  if (e.links && e.links.vehicle) {
    const actions = element("div", "actions compact");
    actions.append(linkButton("Abrir vehículo", "index.html" + e.links.vehicle, true));
    card.append(actions);
  }
  return card;
}

function inventoryChecklistSection(data) {
  const section = element("section", "inventory-checklist panel");
  section.id = "inventory-checklist";
  const units = (data && Array.isArray(data.units)) ? data.units : [];
  const pendingCount = units.filter(function(u){ return (u.pending || []).length > 0; }).length;
  const head = element("div", "inventory-checklist-head");
  const title = element("div");
  title.append(
    element("div", "eyebrow", "RELACIÓN OPERATIVA"),
    element("h2", "", "Disponibilidad, precio y pendientes"),
    element("p", "subtitle", "Vista sanitizada. VIN, odómetro, documentos privados e IDs/URLs privadas de Drive no se muestran aquí.")
  );
  head.append(title, element("span", "tag", pendingCount + " con pendientes"));
  section.append(head);

  const rows = element("div", "inventory-checklist-grid");
  units.forEach(function(u) {
    const row = element("article", "inventory-checklist-row");
    const visual = element("div", "inventory-checklist-visual");
    if (u.image) {
      const img = element("img", "inventory-checklist-thumb");
      img.src = u.image;
      img.alt = u.title || u.key;
      img.loading = "lazy";
      visual.append(img);
    } else {
      visual.append(element("div", "inventory-checklist-placeholder", "SIN MINIATURA"));
    }

    const body = element("div", "inventory-checklist-body");
    const top = element("div", "inventory-checklist-title");
    top.append(
      element("strong", "", u.title || u.key),
      element("span", "status-chip " + (u.aflId ? "status-listo" : "status-pendiente"), u.aflId || "PENDIENTE DE ID")
    );
    const metaRow = element("div", "inventory-checklist-meta");
    metaRow.append(
      meta("Precio", money(u.priceInternal, u.currency || "MXN")),
      meta("Disponibilidad", labelStatus(u.availability || "PENDIENTE")),
      meta("Estado", labelStatus(u.status || "PENDIENTE"))
    );
    if (u.month) metaRow.append(meta("Mes", u.month));
    if (u.material) metaRow.append(meta("Material", u.material));
    if (u.nextAction) metaRow.append(meta("Siguiente", labelStatus(u.nextAction)));
    body.append(top, metaRow);

    const pending = u.pending || [];
    const checklist = element("div", "inventory-pending-list");
    if (pending.length) {
      pending.forEach(function(item) {
        checklist.append(element("span", "inventory-pending-item", "☐ " + labelStatus(item)));
      });
    } else {
      checklist.append(element("span", "inventory-pending-item done", "✓ Sin pendientes registrados"));
    }
    body.append(checklist);

    if (u.aflId) {
      const actions = element("div", "actions compact");
      actions.append(linkButton("Abrir unidad", "?vehicle=" + encodeURIComponent(u.aflId), false));
      body.append(actions);
    }
    row.append(visual, body);
    rows.append(row);
  });
  section.append(rows);
  return section;
}

function vehicleCard(v) {
  const card = element("article", "vehicle-card");
  card.dataset.search = [v.id, v.title, v.status].join(" ").toLowerCase();
  card.dataset.status = v.status;

  const wrap = element("div", "thumb-wrap");
  const img = element("img", "thumb");
  img.src = vehicleThumbnailPath(v);
  img.alt = v.title;
  img.loading = "lazy";
  const fbStatus = v.publication && v.publication.facebook && v.publication.facebook.status;
  const publishLabel = fbStatus === "PROGRAMADA" ? "FB PROGRAMADA" : (fbStatus === "PUBLICADO_CONFIRMADO_POR_MIGUEL" ? "FB PUBLICADO" : (v.publish ? "PUBLICABLE" : "NO PUBLICAR"));
  wrap.append(img, element("span", "code-badge", v.id), element("span", "publish-badge", publishLabel));

  const body = element("div", "card-body");
  const titleRow = element("div", "title-row");
  titleRow.append(element("h2", "", v.title), element("span", "state", labelStatus(v.status)));

  const metaGrid = element("div", "meta-grid");
  metaGrid.append(
    meta("WhatsApp", v.whatsapp),
    meta("Precio interno", money(v.priceInternal, v.currency)),
    meta("Siguiente", labelStatus(v.nextAction)),
    meta("Facebook", labelStatus((v.publication && v.publication.facebook && v.publication.facebook.status) || "NO_PROGRAMADA"))
  );

  const actions = element("div", "actions");
  if (v.detail) {
    actions.append(
      linkButton("Ficha y salidas", "?vehicle=" + encodeURIComponent(v.id), true),
      linkButton("Editar info", "?vehicle=" + encodeURIComponent(v.id) + "#authorized-edit", false)
    );
  }
  actions.append(linkButton("Programador", "PROGRAMADOR.html", false));

  const shortcuts = element("div", "channel-shortcuts");
  if (v.detail) {
    [
      ["WhatsApp", "whatsapp"],
      ["Marketplace", "marketplace"],
      ["Post", "post"],
      ["Feed", "feed"],
      ["Historias", "stories"],
      ["Reel", "reel"],
      ["TikTok", "tiktok"]
    ].forEach(function(pair) {
      shortcuts.append(linkButton(pair[0], "?vehicle=" + encodeURIComponent(v.id) + "#channel-" + pair[1], false));
    });
  }

  body.append(titleRow, metaGrid);
  if (v.checkpoint) {
    body.append(element("div", "home-checkpoint",
      "Checkpoint: " + labelStatus(v.checkpoint.phase || "") +
      (v.updated ? " · " + v.updated : "")
    ));
  }
  body.append(element("div", "home-checkpoint lab-home-result", contentLabHomeSummary(v)));
  body.append(makeHomeCardFunctionSelect(v));
  if (v.detail) body.append(shortcuts);
  body.append(actions);
  card.append(wrap, body);
  return card;
}

function kv(label, value) {
  const row = element("div", "kv");
  row.append(element("span", "", label), element("strong", "", value));
  return row;
}

function metric(label, value) {
  const box = element("div");
  box.append(element("span", "", label), element("strong", "", value));
  return box;
}

function makeList(items, ordered) {
  const node = element(ordered ? "ol" : "ul", "checklist");
  (items || []).forEach(function(item) { node.append(element("li", "", item)); });
  return node;
}

function makeFieldChecklist(v) {
  const wrap = element("div", "field-checklist-wrap");
  const storageKey = "afl-field-checklist:" + v.id;
  let saved = [];
  try { saved = JSON.parse(localStorage.getItem(storageKey) || "[]"); } catch (error) { saved = []; }
  const checked = new Set(saved);
  const progress = element("div", "field-progress");
  const list = element("ol", "checklist field-checklist-list");

  function refresh() {
    progress.textContent = checked.size + " / " + (v.capture.checklist || []).length + " tomas marcadas en este dispositivo";
    try { localStorage.setItem(storageKey, JSON.stringify(Array.from(checked))); } catch (error) {}
  }

  (v.capture.checklist || []).forEach(function(item, index) {
    const li = element("li", "field-check-item");
    const label = element("label", "field-check-label");
    const input = element("input", "field-check-input");
    input.type = "checkbox";
    input.checked = checked.has(index);
    input.addEventListener("change", function() {
      if (input.checked) checked.add(index); else checked.delete(index);
      refresh();
    });
    label.append(input, element("span", "", item));
    li.append(label);
    list.append(li);
  });

  const localActions = element("div", "field-local-actions no-print");
  const clear = actionButton("Limpiar progreso local", function() {
    checked.clear();
    list.querySelectorAll("input").forEach(function(input){ input.checked = false; });
    refresh();
  }, false);
  localActions.append(clear);

  wrap.append(progress, list, localActions);
  refresh();
  return wrap;
}

function statusChip(status) {
  return element("span", "status-chip status-" + String(status || "PENDIENTE").toLowerCase(), labelStatus(status || "PENDIENTE"));
}

function channelStatus(v, d) {
  if (d.key === "whatsapp" && v.whatsapp && v.whatsapp.status) return v.whatsapp.status;
  if (v.outputs && v.outputs[d.key]) return v.outputs[d.key];
  return d.status || "PENDIENTE";
}

function channelNote(status) {
  const notes = {
    PENDIENTE: "Sin pieza final aprobada.",
    EN_PRODUCCION: "Edición o preparación activa.",
    LISTO: "Pieza final aprobada y disponible.",
    PROGRAMADA: "Programación confirmada; todavía no equivale a publicación real.",
    PUBLICADO: "Publicación confirmada.",
    OCULTO: "Ficha preparada; no publicar automáticamente."
  };
  return notes[status] || labelStatus(status);
}

function buildOperationalPrompt(v, item) {
  const c = v.checkpoint || {};
  const protocol = v.promptProtocol || {};
  const lines = [
    "Opera únicamente el vehículo " + v.id + " (" + v.vehicle.publicTitle + ") dentro de AFL Autos.",
    "",
    "MINIATURA PÚBLICA DEL VEHÍCULO:",
    publicVehicleThumbnailUrl(v),
    "Al responder a este prompt, muestra esta miniatura al inicio si el cliente permite imágenes. No uses la imagen de otro vehículo.",
    "",
    "AUTORIDAD DE RECOMENDACIÓN:",
    currentChatGPTInstruction(v),
    "",
    "REANUDAR DESDE CHECKPOINT. No leas todo el proyecto ni dependas de memoria de conversaciones anteriores.",
    "",
    "CHECKPOINT ACTUAL:",
    "- Fase: " + (c.phase || "PENDIENTE"),
    "- Estado: " + (c.state || v.status.vehicle || "PENDIENTE"),
    "- Último cierre: " + (c.lastCompleted || "PENDIENTE"),
    "- Siguiente acción: " + (c.nextAction || "PENDIENTE"),
    "- Reanudar desde: " + (c.resumeFrom || "PENDIENTE"),
    "",
    "ACCIÓN SOLICITADA:",
    item.instruction || item.description || item.label
  ];

  if ((protocol.minimalSources || []).length) {
    lines.push("", "FUENTES MÍNIMAS OBLIGATORIAS:");
    protocol.minimalSources.forEach(function(x, i) { lines.push((i + 1) + ". " + x); });
  }

  if ((protocol.afterEveryPrompt || []).length) {
    lines.push("", "CIERRE OBLIGATORIO DESPUÉS DE ESTE PROMPT:");
    protocol.afterEveryPrompt.forEach(function(x, i) { lines.push((i + 1) + ". " + x); });
  }

  if ((protocol.rules || []).length) {
    lines.push("", "REGLAS:");
    protocol.rules.forEach(function(x) { lines.push("- " + x); });
  }

  if ((protocol.responseLinks || []).length) {
    lines.push("", "ENLACES QUE DEBES MOSTRAR EN EL CHAT AL CERRAR:");
    protocol.responseLinks.forEach(function(x) { lines.push("- " + x.label + ": " + x.url); });
  }

  lines.push("", "Al terminar, devuelve el checkpoint nuevo, la siguiente acción, el submenú recomendado y los enlaces operativos. El nuevo estado debe quedar persistido en Drive + repositorio + HOME antes de cerrar.");
  return lines.join("\n");
}

function makeRecommendationPanel(v) {
  const rec = v.recommendation || {};
  const next = rec.nextRecommended || {};
  const closure = rec.latestClosure || v.contentLab || {};
  const panel = element("article", "panel wide recommendation-panel");
  panel.id = "recommended-content";
  panel.append(
    element("div", "eyebrow", "SIGUIENTE RECOMENDADO · AFL LAB"),
    element("h2", "", next.label || labelStatus((v.contentLab && v.contentLab.nextAction) || (v.checkpoint && v.checkpoint.nextAction) || "PENDIENTE")),
    element("p", "subtitle", next.reason || "La recomendación se deriva del checkpoint y la evidencia vigente.")
  );

  const summary = element("div", "checkpoint-grid");
  summary.append(
    kv("AFL Lab", labelStatus(closure.status || (v.contentLab && v.contentLab.status) || "SIN_ESTADO")),
    kv("Siguiente", labelStatus(next.key || (v.contentLab && v.contentLab.nextAction) || "PENDIENTE")),
    kv("Después", labelStatus((rec.afterNextRecommended && rec.afterNextRecommended.key) || "PENDIENTE")),
    kv("Verificado", closure.lastVerifiedAt || (v.contentLab && v.contentLab.lastVerifiedAt) || "PENDIENTE")
  );
  panel.append(summary);

  if (closure.summary || closure.result) {
    panel.append(element("p", "deliverable-note", "Último cierre: " + (closure.summary || closure.result)));
  }
  if (rec.rule) {
    panel.append(element("p", "deliverable-note", "Regla: " + rec.rule));
  }

  if ((rec.availableNow || []).length) {
    panel.append(element("h3", "", "Qué tenemos"));
    panel.append(makeList(rec.availableNow, false));
  }

  if ((rec.missingContent || []).length) {
    panel.append(element("h3", "", "Contenido que falta"));
    const missing = element("div", "deliverables-grid");
    rec.missingContent.forEach(function(item) {
      const card = element("div", "deliverable-card");
      card.append(
        element("strong", "", item.label || item.key),
        element("p", "deliverable-note", "Estado: " + labelStatus(item.status || "PENDIENTE") + (item.gate ? " · Gate: " + labelStatus(item.gate) : "")),
        statusChip(item.status || "PENDIENTE")
      );
      missing.append(card);
    });
    panel.append(missing);
  }

  if ((rec.optionsRecommended || []).length) {
    panel.append(element("h3", "", "Opciones recomendadas"));
    const options = element("div", "prompt-menu-grid");
    rec.optionsRecommended.slice().sort(function(a,b){ return (a.order||99)-(b.order||99); }).forEach(function(item) {
      const card = element("div", "prompt-menu-card");
      card.append(
        element("strong", "", (item.recommended ? "RECOMENDADA · " : "") + (item.label || item.key)),
        element("p", "deliverable-note", (item.canExecuteNow ? "Puede ejecutarse ahora. " : "") + (item.gate ? "Gate: " + labelStatus(item.gate) + ". " : "") + (item.instruction || ""))
      );
      const copyStatus = element("span", "copy-status", "");
      const actions = element("div", "actions");
      actions.append(actionButton("Copiar prompt", function() {
        copyText(buildOperationalPrompt(v, {
          key: item.key,
          label: item.label || item.key,
          description: item.instruction || "",
          instruction: item.instruction || ""
        }), copyStatus);
      }, !!item.recommended));
      card.append(actions, copyStatus);
      options.append(card);
    });
    panel.append(options);
  }
  return panel;
}

function makeVehicleOpsMenu(v) {
  const panel = element("article", "panel wide no-print");
  panel.id = "vehicle-ops";
  const links = v.operationalLinks || {};
  const pattern = detectOperationalPattern(v);
  const status = element("span", "copy-status", "");
  panel.append(
    element("div", "eyebrow", "CHATGPT ACTUAL · DECISIÓN OPERATIVA"),
    element("h2", "", "¿Qué conviene hacer ahora?"),
    element("p", "subtitle", "Patrón detectado: " + labelStatus(pattern) + ". El repo no decide la recomendación; el ChatGPT actual evalúa el checkpoint y la evidencia.")
  );

  const decisionActions = element("div", "actions");
  decisionActions.append(actionButton("Copiar prompt · decidir siguiente paso", function() {
    copyText(buildOperationalPrompt(v, {
      key: "currentChatGPT",
      label: "ChatGPT actual",
      instruction: currentChatGPTInstruction(v)
    }), status);
  }, true));
  panel.append(decisionActions, status);

  const quick = element("div", "actions");
  if (links.newCapture && links.newCapture.url) quick.append(linkButton("Subir nueva captura", links.newCapture.url, false));
  quick.append(
    linkButton("Producción creativa", "#creative-production", false),
    linkButton("Ver checklist", "#field-checklist", false),
    linkButton("Opciones del vehículo", "#prompt-menu", false)
  );
  if (links.outputs && links.outputs.url) quick.append(linkButton("Abrir SALIDAS", links.outputs.url, false));
  if (links.control && links.control.url) quick.append(linkButton("CONTROL OPERATIVO", links.control.url, false));
  quick.append(
    linkButton("Abrir otro vehículo", (links.otherVehicle && links.otherVehicle.url) || "index.html", false),
    linkButton("Nuevo vehículo", (links.newVehicle && links.newVehicle.url) || "NUEVO_VEHICULO.html", false),
    linkButton("Regresar a ROOT GLOBAL", (links.rootGlobal && links.rootGlobal.url) || "index.html", false)
  );
  panel.append(element("p", "deliverable-note", "Accesos rápidos: navegación manual, no equivalen a una recomendación operativa."), quick);
  return panel;
}

function makePromptMenu(v) {
  const panel = element("article", "panel wide prompt-menu-panel no-print");
  panel.id = "prompt-menu";
  panel.append(
    element("div", "eyebrow", "REANUDACIÓN SIN MEMORIA DE CHAT"),
    element("h2", "", "Menú de prompts operativos"),
    element("p", "subtitle", "Copia un prompt para continuar en este chat o en uno nuevo. Cada prompt obliga a cerrar actualizando Drive, repositorio y Home.")
  );

  const c = v.checkpoint || {};
  const checkpoint = element("div", "checkpoint-grid");
  checkpoint.append(
    kv("Fase", labelStatus(c.phase || "PENDIENTE")),
    kv("Estado", labelStatus(c.state || v.status.vehicle || "PENDIENTE")),
    kv("Siguiente", labelStatus(c.nextAction || "PENDIENTE")),
    kv("Actualizado", c.updated || v.updated || "PENDIENTE")
  );
  panel.append(checkpoint);

  const grid = element("div", "prompt-menu-grid");
  const dynamicRecommendation = {
    key: "currentChatGPT",
    label: "0. ChatGPT actual · decidir siguiente paso",
    description: "El ChatGPT actual detecta el patrón, contrasta evidencia y elige la siguiente acción válida; el repo no impone la recomendación.",
    instruction: currentChatGPTInstruction(v)
  };
  [dynamicRecommendation].concat(v.promptMenu || []).forEach(function(item) {
    const card = element("div", "prompt-menu-card");
    card.append(
      element("strong", "", item.label),
      element("p", "deliverable-note", item.description || "")
    );
    const status = element("span", "copy-status", "");
    const actions = element("div", "actions");
    actions.append(actionButton("Copiar prompt", function() {
      copyText(buildOperationalPrompt(v, item), status);
    }, item.key === "currentChatGPT"));
    card.append(actions, status);
    grid.append(card);
  });
  panel.append(grid);
  return panel;
}

const CREATIVE_PRODUCTION_PROMPT = "data/prompts/produccion-creativa-por-vehiculo.json";

function creativeProductionPieces() {
  return [
    { key: "cover", label: "Crear portada", outputFolder: "60_PORTADAS", format: "Hero/portada comercial" },
    { key: "flyer", label: "Crear flyer", outputFolder: "20_IMAGENES_COMERCIALES", format: "Pieza gráfica comercial" },
    { key: "story", label: "Crear historia", outputFolder: "50_HISTORIAS", format: "Vertical 9:16" },
    { key: "tiktok", label: "Crear TikTok", outputFolder: "80_TIKTOK", format: "Video vertical corto" },
    { key: "marketplace", label: "Crear post Marketplace", outputFolder: "10_MARKETPLACE", format: "Ficha/post Marketplace" }
  ];
}

function creativeMaterialPath(v, folder) {
  const value = String(folder || "").trim();
  if (!value) return v.drive.inputRoot;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.indexOf(v.drive.inputRoot) === 0) return value;
  return v.drive.inputRoot.replace(/\/$/, "") + "/" + value.replace(/^\//, "");
}

function buildMaterialNavigationPrompt(v, action, materialFolder) {
  const material = creativeMaterialPath(v, materialFolder);
  const upload = v.drive.inputRoot.replace(/\/$/, "") + "/20_NUEVA_CAPTURA";
  const temp = v.drive.inputRoot.replace(/\/$/, "") + "/" + TEMP_SELECTION_FOLDER;
  const instruction = action === "UPLOAD"
    ? "Resuelve/crea si corresponde la carpeta de nueva captura y devuelve su enlace vivo para subir o aportar archivos: " + upload
    : action === "TEMP"
      ? "Resuelve o crea la carpeta temporal " + temp + ". Copia solo seleccionados de trabajo cuando exista una fuente autorizada; no muevas RAW/originales. Devuelve su enlace vivo."
      : "Resuelve la carpeta de material seleccionada y devuelve su enlace vivo: " + material;
  return [
    "MATERIAL_NAVEGACION_AFL",
    "Opera únicamente " + v.id + " (" + ((v.vehicle && v.vehicle.publicTitle) || v.title || "Vehículo") + ").",
    instruction,
    "No hagas barridos generales de Drive ni mezcles unidades.",
    "No publiques IDs/URLs privadas en HOME/JSON público; el enlace puede mostrarse en esta respuesta operativa.",
    "Después muestra estas opciones: 1) Subir/aportar nuevo material, 2) Seleccionar otra carpeta de la unidad, 3) Crear/usar " + TEMP_SELECTION_FOLDER + ", 4) Continuar con producción y desplegar portada/flyer/historia/TikTok/Marketplace/paquete express."
  ].join("\n");
}

function buildCreativeProductionPrompt(v, piece, materialFolder, referenceFolder) {
  const c = v.checkpoint || {};
  const commercial = v.commercial || {};
  const reference = String(referenceFolder || APPROVED_REFERENCES_ALIAS).trim() || APPROVED_REFERENCES_ALIAS;
  const material = creativeMaterialPath(v, materialFolder);
  const output = v.drive.outputRoot.replace(/\/$/, "") + "/" + piece.outputFolder;
  const lines = [
    "PRODUCCION_CREATIVA_AFL",
    "CONTRATO: " + CREATIVE_PRODUCTION_PROMPT,
    "",
    "Opera únicamente el vehículo " + v.id + " (" + v.vehicle.publicTitle + ") dentro de AFL Autos.",
    "AUTORIZACION_DE_CREACION_HOME: SI. La solicitud explícita de esta pieza autoriza CREAR/PRODUCIR el derivado con material verificable disponible aunque el checkpoint operativo siga en captura o revisión.",
    "No mezcles material de otra unidad y no publiques automáticamente. AUTORIZADO_CREAR ≠ APROBADO ≠ PUBLICADO.",
    "",
    "NAVEGACIÓN DE MATERIAL OBLIGATORIA:",
    "- Antes de producir, resuelve y muestra el enlace vivo de la carpeta de material seleccionada.",
    "- Ofrece: subir/aportar nuevo material, seleccionar otra carpeta, crear/usar " + TEMP_SELECTION_FOLDER + " o continuar con producción.",
    "- Si usas temporal, copia seleccionados de trabajo; nunca muevas RAW/originales.",
    "",
    "PIEZA SOLICITADA:",
    "- Tipo: " + piece.label,
    "- Formato/objetivo: " + piece.format,
    "- Carpeta de material seleccionada: " + material,
    "- Carpeta de referencias creativas: " + reference,
    "- Biblioteca aprobada por defecto: " + APPROVED_REFERENCES_ALIAS,
    "- Carpeta de salida: " + output,
    "",
    "CONTEXTO COMERCIAL VERIFICADO:",
    "- Disponibilidad: " + (commercial.availability || "PENDIENTE"),
    "- Precio visible: SOLO si existe precio público/catalogable expresamente autorizado en la fuente vigente. PRECIO INTERNO = SOLO ADMIN / NO PUBLICABLE.",
    "- Fase: " + (c.phase || "PENDIENTE"),
    "- Estado: " + (c.state || (v.status && v.status.vehicle) || "PENDIENTE"),
    "- Siguiente acción: " + (c.nextAction || "PENDIENTE"),
    "",
    "ESTRATEGIA COMERCIAL OBLIGATORIA:",
    "1. Revisa primero expediente y material seleccionado. Usa solo características, precio PUBLICO autorizado, disponibilidad y evidencias verificadas. PRECIO INTERNO = SOLO ADMIN / NO PUBLICABLE.",
    "2. Define el ángulo de venta adecuado para esta unidad: hook, beneficio principal, prueba visible, objeción a resolver y CTA.",
    "3. Separa: copy final, texto sobreimpreso y guía visual. No inventes versión, tracción, equipamiento ni condiciones.",
    "",
    "ANÁLISIS DE FOTOS Y VIDEO:",
    "1. Inventaría fotos y videos útiles de la carpeta seleccionada y elige los mejores planos.",
    "2. Si puedes visualizar los videos, analiza hook de los primeros segundos, ritmo, encuadre, estabilidad, iluminación, color, audio, silencios, texto, transiciones y cortes aprovechables.",
    "3. Propón mejoras concretas: reencuadre, estabilización, corrección de color, limpieza de audio, subtítulos, velocidad, transiciones o efectos solo cuando aporten.",
    "4. Si no puedes visualizar un archivo, dilo y no inventes su contenido.",
    "",
    "REFERENCIAS CREATIVAS:",
    "Usa la carpeta de referencias como inspiración de composición, ritmo, efectos y estructura; no copies marcas de agua, logos ajenos ni material protegido.",
    "",
    "TENDENCIA Y POTENCIAL VIRAL:",
    "Consulta tendencias vigentes al momento de ejecutar este prompt antes de recomendar formato, edición, audio o hashtags. Sugiere 2–3 patrones actuales que encajen con el vehículo y explica por qué. No garantices viralidad.",
    "",
    "SONIDO Y MÚSICA:",
    "Recomienda hasta 3 sonidos o pistas vigentes y apropiados para la plataforma. Verifica disponibilidad/licencia cuando sea posible y consulta data/musica-usada.json para evitar repetir audio registrado. No reproduzcas letras.",
    "",
    "HASHTAGS:",
    "Entrega hashtags específicos para intención de compra, categoría, marca/modelo, formato y ubicación solo cuando esté verificada. Evita spam.",
    "",
    "TERMINAR LA PIEZA:",
    "Entrega el resultado final listo para producir: concepto, copy, texto sobreimpreso, dimensiones/duración, shot list o cut sheet, efectos/transiciones, audio sugerido, hashtags, nombre de archivo y destino exacto.",
    "Si las herramientas disponibles permiten crear o editar la pieza, prodúcela y guarda solo el derivado en SALIDAS. El checkpoint operativo no veta esta creación manual. Si el material supera los gates visuales, estado: PRODUCIDO_NO_APROBADO; si solo permite una prueba útil pero insuficiente para publicación, estado: BORRADOR_INTERNO_REQUIERE_RECAPTURA. Si no puede producirse fielmente, entrega especificación y declara la limitación.",
    "No cambies el checkpoint operativo solo por producir la pieza. No marques APROBADO, LISTO o PUBLICADO sin evidencia/autorización real.",
    "Después de una aprobación explícita de Miguel, copia el derivado aprobado a " + APPROVED_REFERENCES_ALIAS + "/<TIPO_DE_PIEZA>, crea el subdirectorio si hace falta y muestra el enlace vivo. No copies borradores ni PRODUCIDO_NO_APROBADO."
  ];
  return lines.join("\n");
}

function makeCreativeProductionMenu(v) {
  const panel = element("article", "panel wide prompt-menu-panel creative-production-panel no-print");
  panel.id = "creative-production";
  panel.append(
    element("div", "eyebrow", "AFL LAB · PRODUCCIÓN CREATIVA"),
    element("h2", "", "Crear contenido por pieza"),
    element("p", "subtitle", "Selecciona el material del vehículo y, si existe, pega la ruta o URL de una carpeta de referencias creativas. Cada botón genera un prompt con estrategia comercial, análisis de video, tendencias, audio y hashtags.")
  );

  const config = element("div", "creative-config-grid");
  const materialField = element("label", "creative-field");
  materialField.append(element("span", "", "Carpeta de material disponible"));
  const materialSelect = element("select", "status-select");
  (v.drive.inputs || []).forEach(function(folder, index) {
    const option = element("option", "", folder);
    option.value = folder;
    option.selected = index === 0;
    materialSelect.append(option);
  });
  if (!(v.drive.inputs || []).includes(TEMP_SELECTION_FOLDER)) {
    const temp = element("option", "", TEMP_SELECTION_FOLDER + " · crear/usar temporal");
    temp.value = TEMP_SELECTION_FOLDER;
    materialSelect.append(temp);
  }
  if (!(v.drive.inputs || []).length) {
    const option = element("option", "", v.drive.inputRoot);
    option.value = v.drive.inputRoot;
    materialSelect.append(option);
  }
  materialField.append(materialSelect);

  const referenceField = element("label", "creative-field");
  referenceField.append(element("span", "", "Carpeta de referencias creativas"));
  const referenceInput = element("input", "status-select");
  referenceInput.type = "text";
  referenceInput.placeholder = "Pega otra ruta/URL o usa la biblioteca aprobada";
  referenceInput.value = APPROVED_REFERENCES_ALIAS;
  referenceInput.autocomplete = "off";
  referenceField.append(referenceInput);

  const sourceActions = element("div", "creative-field");
  sourceActions.append(element("span", "", "Material · elegir cómo continuar"));
  const sourceButtons = element("div", "actions compact");
  const sourceStatus = element("span", "copy-status", "");
  if (v.drive.inputUrl) sourceButtons.append(linkButton("Abrir ENTRADAS", v.drive.inputUrl, false));
  sourceButtons.append(
    actionButton("Obtener enlace de archivos", function() {
      copyText(buildMaterialNavigationPrompt(v, "OPEN", materialSelect.value), sourceStatus);
    }, false),
    actionButton("Subir / aportar nuevos", function() {
      copyText(buildMaterialNavigationPrompt(v, "UPLOAD", materialSelect.value), sourceStatus);
    }, false),
    actionButton("Usar temporal", function() {
      materialSelect.value = TEMP_SELECTION_FOLDER;
      copyText(buildMaterialNavigationPrompt(v, "TEMP", TEMP_SELECTION_FOLDER), sourceStatus);
    }, false),
    linkButton("Ver Multimedia", "MULTIMEDIA.html?vehicle=" + encodeURIComponent(v.id), false)
  );
  sourceActions.append(sourceButtons, sourceStatus);
  config.append(materialField, referenceField, sourceActions);
  panel.append(config);

  const grid = element("div", "prompt-menu-grid");
  creativeProductionPieces().forEach(function(piece) {
    const card = element("div", "prompt-menu-card");
    card.append(
      element("strong", "", piece.label),
      element("p", "deliverable-note", piece.format + " · salida " + piece.outputFolder)
    );
    const status = element("span", "copy-status", "");
    const actions = element("div", "actions");
    actions.append(actionButton("Copiar prompt creativo", function() {
      copyText(buildCreativeProductionPrompt(v, piece, materialSelect.value, referenceInput.value), status);
    }, piece.key === "marketplace"));
    card.append(actions, status);
    grid.append(card);
  });
  const contentMenu = element("details", "rec-options creative-content-menu");
  const menuSummary = element("summary", "", "Continuar con la producción · desplegar opciones de contenido");
  contentMenu.append(menuSummary, grid);
  panel.append(contentMenu);
  panel.append(element("p", "deliverable-note", "Referencia por defecto: REFERENCIAS_APROBADAS_AFL. Solo una pieza aprobada explícitamente se copia a esa biblioteca; producir no equivale a aprobar. La web pública no persiste enlaces privados de Drive."));
  return panel;
}

function makeChannelNav(v) {
  const panel = element("article", "panel wide channel-index");
  panel.append(
    element("div", "eyebrow", "SALIDAS"),
    element("h2", "", "Fichas y contenido por canal"),
    element("p", "subtitle", "Cada canal se muestra aunque todavía esté pendiente. PENDIENTE no significa que exista una pieza final.")
  );
  const nav = element("div", "channel-nav");
  (v.deliverables || []).forEach(function(d) {
    const a = linkButton(d.label, "#channel-" + d.key, d.key === "whatsapp");
    nav.append(a);
  });
  panel.append(nav);
  return panel;
}

function makeWhatsappSheet(v) {
  const w = v.whatsapp || {};
  const panel = element("article", "panel wide channel-sheet whatsapp-sheet");
  panel.id = "channel-whatsapp";

  const head = element("div", "channel-sheet-head");
  const title = element("div");
  title.append(
    element("div", "eyebrow", "90_WHATSAPP_OCULTO"),
    element("h2", "", "Ficha WhatsApp"),
    element("p", "subtitle", "Estado: " + labelStatus(w.status || "OCULTO") + " · No publicar automáticamente")
  );
  head.append(title, statusChip(w.status || "OCULTO"));
  panel.append(head);

  const body = element("div", "copy-sheet");
  body.append(
    kv("Título", w.title || "PENDIENTE"),
    kv("Descripción", w.description || "PENDIENTE"),
    kv("Precio público", w.price == null ? "OMITIR" : money(w.price, v.commercial.currency)),
    kv("Fotos seleccionadas", String(w.selectedPhotos ?? 0)),
    kv("Video real", w.realVideo ? "SÍ" : "NO")
  );
  panel.append(body);

  const copyStatus = element("span", "copy-status", "");
  const actions = element("div", "actions no-print");
  actions.append(actionButton("Copiar ficha WhatsApp", function() {
    const lines = [];
    if (w.title) lines.push(w.title);
    if (w.description) lines.push(w.description);
    if (w.price != null) lines.push("Precio: " + money(w.price, v.commercial.currency));
    copyText(lines.join("\n\n"), copyStatus);
  }, true));
  panel.append(actions, copyStatus);
  return panel;
}

function makeDeliverables(v) {
  const panel = element("article", "panel wide");
  panel.append(element("h2", "", "Marketplace, Post y demás salidas"));
  const note = element("p", "subtitle", "Estados canónicos: PENDIENTE · EN PRODUCCION · LISTO · PROGRAMADA · PUBLICADO. Esta web es de solo lectura; los controles preparan el cambio para actualizar JSON.");
  panel.append(note);
  const grid = element("div", "deliverables-grid");

  (v.deliverables || []).forEach(function(d) {
    const card = element("div", "deliverable-card");
    card.id = "channel-" + d.key;
    const effectiveStatus = channelStatus(v, d);
    const top = element("div", "deliverable-head");
    const title = element("div");
    title.append(element("strong", "", d.label), element("span", "deliverable-folder", d.folder));
    top.append(title, statusChip(effectiveStatus));

    const controls = element("div", "deliverable-controls no-print");
    const select = element("select", "status-select");
    (d.key === "whatsapp" ? ["OCULTO","PENDIENTE","EN_PRODUCCION","LISTO","PROGRAMADA","PUBLICADO"] : ["PENDIENTE","EN_PRODUCCION","LISTO","PROGRAMADA","PUBLICADO"]).forEach(function(s) {
      const option = element("option", "", labelStatus(s));
      option.value = s;
      option.selected = s === effectiveStatus;
      select.append(option);
    });
    const status = element("span", "copy-status", "");
    const copy = actionButton("Copiar cambio", function() {
      const payload = {
        vehicleId: v.id,
        deliverable: d.key,
        folder: d.folder,
        from: effectiveStatus,
        to: select.value
      };
      copyText(JSON.stringify(payload, null, 2), status);
    }, false);
    if (d.url) controls.append(linkButton("Abrir carpeta", d.url, false));
    if (["marketplace","images","post","stories","covers","reel","tiktok"].includes(d.key)) {
      controls.append(linkButton("Abrir menú creativo", "#creative-production", false));
    }
    controls.append(select, copy);
    card.append(top, element("p", "deliverable-note", channelNote(effectiveStatus)), controls, status);
    grid.append(card);
  });

  panel.append(grid);
  return panel;
}

function vehicleDetail(v) {
  const section = element("section", "detail-panel");
  const head = element("div", "detail-head");
  const headText = element("div");
  headText.append(
    element("div", "eyebrow", v.id),
    element("h1", "", v.vehicle.publicTitle),
    element("p", "subtitle", configurationSummary(v))
  );
  const detailThumbWrap = element("div", "detail-thumb-wrap");
  const detailThumb = element("img", "detail-thumb");
  detailThumb.src = vehicleThumbnailPath(v);
  detailThumb.alt = "Miniatura " + v.id + " · " + v.vehicle.publicTitle;
  detailThumb.loading = "eager";
  detailThumbWrap.append(detailThumb);
  head.append(headText, detailThumbWrap, linkButton("← Inventario", "index.html", false));
  section.append(head);

  const grid = element("div", "detail-grid");

  const state = element("article", "panel");
  state.append(element("h2", "", "Estado"));
  state.append(
    kv("Vehículo", labelStatus(v.status.vehicle)),
    kv("Revisión", labelStatus(v.status.materialReview)),
    kv("Clasificación", labelStatus(v.status.classification)),
    kv("Captura", labelStatus(v.status.captureExecution)),
    kv("WhatsApp", v.status.whatsapp),
    kv("Precio interno", money(v.commercial.priceInternal, v.commercial.currency)),
    kv("Facebook", labelStatus((v.publication && v.publication.facebook && v.publication.facebook.status) || "NO_PROGRAMADA")),
    kv("Facebook programado", (v.publication && v.publication.facebook && v.publication.facebook.scheduledAt) || "—")
  );

  const media = element("article", "panel");
  media.append(element("h2", "", "Material"));
  const metrics = element("div", "metric-grid");
  metrics.append(
    metric("Total", v.media.totalJpeg),
    metric("Únicas", v.media.unique),
    metric("Aprobadas", v.media.approvedUnique),
    metric("Comerciales", v.media.commercialCandidates),
    metric("Privadas", v.media.privateNoPublish),
    metric("Duplicados", v.media.duplicates)
  );
  media.append(metrics);

  const capture = element("article", "panel print-checklist");
  capture.id = "field-checklist";
  const printThumb = element("img", "print-only print-vehicle-thumb");
  printThumb.src = vehicleThumbnailPath(v);
  printThumb.alt = "Miniatura " + v.id + " · " + v.vehicle.publicTitle;
  const hasSchedule = Boolean(v.capture && v.capture.scheduled && v.capture.date && v.capture.start && v.capture.end);
  capture.append(
    printThumb,
    element("h2", "", "Checklist de trabajo de campo"),
    element("div", "print-only", v.id + " · " + v.vehicle.publicTitle),
    element("h3", "", hasSchedule ? "Captura programada" : "Programación"),
    element("div", "schedule-time", hasSchedule ? (v.capture.date + " · " + v.capture.start + "–" + v.capture.end) : "Sin programación confirmada"),
    element("p", "subtitle", hasSchedule ? ("Fuente: " + v.capture.source + " · " + v.capture.timezone) : "Consultar Google Calendar solo cuando exista fecha/hora autorizada."),
    element("h3", "", "Checklist"),
    makeFieldChecklist(v)
  );

  const video = element("article", "panel");
  video.append(
    element("h2", "", "Video obligatorio"),
    kv("Formato", v.capture.requiredVideo.format),
    kv("Walkaround", v.capture.requiredVideo.walkaroundSeconds + " s"),
    makeList(v.capture.requiredVideo.shots, false)
  );

  const recommendationPanel = makeRecommendationPanel(v);
  const opsMenu = makeVehicleOpsMenu(v);
  const authorizedEdit = makeAuthorizedEditPanel(v);
  const promptMenu = makePromptMenu(v);
  const creativeProduction = makeCreativeProductionMenu(v);
  const channelNav = makeChannelNav(v);
  const whatsapp = makeWhatsappSheet(v);
  const outputs = makeDeliverables(v);

  const drive = element("article", "panel wide");
  drive.append(element("h2", "", "Drive"));
  const inBox = element("div", "codebox");
  inBox.append(element("strong", "", v.drive.inputRoot));
  (v.drive.inputs || []).forEach(function(x) { inBox.append(document.createElement("br"), document.createTextNode("↳ " + x)); });
  const outBox = element("div", "codebox");
  outBox.append(element("strong", "", v.drive.outputRoot));
  (v.drive.outputs || []).forEach(function(x) { outBox.append(document.createElement("br"), document.createTextNode("↳ " + x)); });
  const driveActions = element("div", "actions");
  driveActions.append(
    linkButton("Ver Multimedia", "MULTIMEDIA.html?vehicle=" + encodeURIComponent(v.id), true)
  );
  if (v.drive.inputUrl) driveActions.append(linkButton("Abrir ENTRADAS", v.drive.inputUrl, false));
  if (v.drive.outputUrl) driveActions.append(linkButton("Abrir SALIDAS", v.drive.outputUrl, false));
  driveActions.append(
    actionButton("Copiar ruta ENTRADAS", function() {
      navigator.clipboard.writeText(v.drive.inputRoot);
    }, false),
    actionButton("Copiar ruta SALIDAS", function() {
      navigator.clipboard.writeText(v.drive.outputRoot);
    }, false)
  );
  drive.append(inBox, outBox, driveActions);

  const fieldActions = element("article", "panel wide no-print");
  fieldActions.append(element("h2", "", "Trabajo de campo"));
  fieldActions.append(
    kv("Estado", labelStatus((v.fieldWork && v.fieldWork.canonicalState) || v.status.vehicle)),
    kv("Después de subir", labelStatus((v.fieldWork && v.fieldWork.nextAfterUpload) || "MATERIAL_NUEVO_SUBIDO")),
    kv("Carpeta de carga", (v.fieldWork && v.fieldWork.uploadFolder) || "20_NUEVA_CAPTURA")
  );
  const fieldStatus = element("span", "copy-status", "");
  const fieldButtons = element("div", "actions");
  fieldButtons.append(
    actionButton("Imprimir checklist", function() { window.print(); }, true),
    actionButton("Preparar MATERIAL_NUEVO_SUBIDO", function() {
      const payload = {
        vehicleId: v.id,
        requestedState: "MATERIAL_NUEVO_SUBIDO",
        precondition: "Confirmar que el material nuevo ya fue subido físicamente a " + v.drive.inputRoot + "/" + ((v.fieldWork && v.fieldWork.uploadFolder) || "20_NUEVA_CAPTURA"),
        next: "REVISION_MATERIAL"
      };
      copyText(JSON.stringify(payload, null, 2), fieldStatus);
    }, false),
    actionButton("Copiar ruta nueva captura", function() {
      copyText(v.drive.inputRoot + "/" + ((v.fieldWork && v.fieldWork.uploadFolder) || "20_NUEVA_CAPTURA"), fieldStatus);
    }, false),
    linkButton("Programador", "PROGRAMADOR.html", false)
  );
  fieldActions.append(fieldButtons, fieldStatus);

  grid.append(state, media, recommendationPanel, opsMenu, authorizedEdit, promptMenu, creativeProduction, capture, video, channelNav, whatsapp, outputs, drive, fieldActions);
  section.append(grid);
  return section;
}

function bindFilters() {
  const search = document.getElementById("search");
  const cards = Array.from(document.querySelectorAll(".vehicle-card"));
  const filters = Array.from(document.querySelectorAll(".filter"));
  const empty = document.getElementById("empty");
  let active = "all";

  function apply() {
    const q = (search ? search.value : "").trim().toLowerCase();
    let shown = 0;
    cards.forEach(function(card) {
      const visible = (!q || card.dataset.search.includes(q)) && (active === "all" || card.dataset.status === active);
      card.hidden = !visible;
      if (visible) shown += 1;
    });
    if (empty) empty.style.display = shown ? "none" : "block";
  }

  if (search) search.addEventListener("input", apply);
  filters.forEach(function(btn) {
    btn.addEventListener("click", function() {
      filters.forEach(function(x) { x.classList.remove("active"); });
      btn.classList.add("active");
      active = btn.dataset.filter;
      apply();
    });
  });
}

async function renderHome() {
  const data = await Promise.all([
    getJSON("data/system.json"),
    getJSON("data/vehicles/index.json")
  ]);
  const system = data[0];
  const vehicles = data[1];

  const shell = element("div", "shell");

  const header = element("header", "header");
  const intro = element("div");
  intro.append(
    element("div", "eyebrow", "AFL AUTOS"),
    element("h1", "", "AFL Autos Lab"),
    element("p", "subtitle", "Centro UX para producción, respuestas y herramientas operativas. Vehículos/PUENTE conserva la verdad de cada unidad; HOME muestra únicamente derivados sanitizados.")
  );
  const stats = element("div", "stats");
  stats.append(
    stat("Vehículos", (vehicles.vehicles || []).length),
    stat("Modo", "AFL LAB"),
    stat("Publicar", "NO AUTO")
  );
  header.append(intro, stats);

  const labSection = element("section", "root-console");
  const card = element("div", "console-card");
  const head = element("div", "console-head");
  const title = element("div");
  title.append(
    element("div", "eyebrow", "MENÚ UX"),
    element("h2", "", "Funciones AFL Lab")
  );
  head.append(title, element("span", "console-status", "LAB ACTIVO"));
  card.append(head, makeLabUxMenu(system, vehicles));
  labSection.append(card);

  const footer = element("footer", "footer", "AFL_AUTOS_LOCAL · AFL Lab · " + system.updated);

  shell.append(header, labSection, footer);
  root.replaceChildren(shell);
}

async function renderVehicle(id) {
  try {
    const data = await getJSON("data/vehicles/" + encodeURIComponent(id) + ".json");
    const shell = element("div", "shell");
    shell.append(vehicleDetail(data));
    root.replaceChildren(shell);
    if (location.hash) {
      requestAnimationFrame(function() {
        const target = document.querySelector(location.hash);
        if (target) target.scrollIntoView({behavior:"smooth", block:"start"});
      });
    }
  } catch (error) {
    const shell = element("div", "shell");
    const box = element("div", "error");
    box.append(element("h1", "", "Expediente no disponible"), element("p", "", error.message), linkButton("Volver", "index.html", false));
    shell.append(box);
    root.replaceChildren(shell);
  }
}

const params = new URLSearchParams(location.search);
const vehicle = params.get("vehicle");

try {
  if (vehicle) await renderVehicle(vehicle);
  else await renderHome();
} catch (error) {
  const shell = element("div", "shell");
  const box = element("div", "error");
  box.append(element("h1", "", "Error de carga"), element("p", "", error.message));
  shell.append(box);
  root.replaceChildren(shell);
}
