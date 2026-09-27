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

function buildAlternativeResponsePrompt(system, mode, question, aflId, vehicleName, price, cta) {
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

  grid.append(questionBox, idBox, nameBox, priceBox, ctaBox);
  panel.append(grid);

  const status = element("span", "copy-status", "");
  const actions = element("div", "actions");
  actions.append(
    actionButton("Copiar prompt · otra respuesta", function() {
      copyText(buildAlternativeResponsePrompt(system, "OTRA_RESPUESTA", questionInput.value, idInput.value, nameInput.value, priceInput.value, ctaInput.value), status);
    }, true),
    actionButton("Copiar prompt · alternativa breve", function() {
      copyText(buildAlternativeResponsePrompt(system, "ALTERNATIVA_BREVE", questionInput.value, idInput.value, nameInput.value, priceInput.value, ctaInput.value), status);
    }, false)
  );
  panel.append(
    element("p", "deliverable-note", "Si no hay expediente, los datos manuales son solo fallback de redacción: no crean ficha ni autorizan publicación."),
    actions,
    status
  );
  return panel;
}

function makeHomeTabs(system) {
  const wrap = element("div", "home-tabs");
  const nav = element("div", "home-tabs-nav");
  const rootButton = actionButton("ROOT", function(){ activate("root"); }, true);
  const quickButton = actionButton("Respuestas rápidas", function(){ activate("quick"); }, false);
  const alternativeButton = actionButton("Otra respuesta", function(){ activate("alternative"); }, false);
  nav.append(rootButton, quickButton, alternativeButton);

  const rootPanel = element("div", "home-tab-panel");
  rootPanel.dataset.tab = "root";
  const rootActions = element("div", "root-actions");
  (system.rootAccess || []).forEach(function(item) {
    rootActions.append(linkButton(item.label, item.url, item.label === "Nuevo vehículo"));
  });
  rootPanel.append(
    element("p", "subtitle", "Accesos públicos/canónicos del ROOT. Los enlaces privados de Drive permanecen fuera del JSON público."),
    rootActions
  );

  const quickPanel = element("div", "home-tab-panel");
  quickPanel.dataset.tab = "quick";
  quickPanel.hidden = true;
  const quickGrid = element("div", "quick-response-grid");
  (system.quickResponses || []).forEach(function(item) {
    const card = element("div", "quick-response-card");
    card.append(element("strong", "", item.label), element("p", "deliverable-note", item.description || ""));
    const status = element("span", "copy-status", "");
    card.append(actionButton("Copiar respuesta/prompt", function(){ copyText(item.prompt || "", status); }, item.key === "editAuthorized"), status);
    quickGrid.append(card);
  });
  quickPanel.append(quickGrid);

  const alternativePanel = makeAlternativeResponsePanel(system);

  function activate(name) {
    rootPanel.hidden = name !== "root";
    quickPanel.hidden = name !== "quick";
    alternativePanel.hidden = name !== "alternative";
    rootButton.classList.toggle("primary", name === "root");
    quickButton.classList.toggle("primary", name === "quick");
    alternativeButton.classList.toggle("primary", name === "alternative");
  }

  wrap.append(nav, rootPanel, quickPanel, alternativePanel);
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

  const opsMenu = makeVehicleOpsMenu(v);
  const authorizedEdit = makeAuthorizedEditPanel(v);
  const promptMenu = makePromptMenu(v);
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

  grid.append(state, media, opsMenu, authorizedEdit, promptMenu, capture, video, channelNav, whatsapp, outputs, drive, fieldActions);
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
    getJSON("data/vehicles/index.json"),
    getJSON("data/programador.json")
  ]);
  const system = data[0];
  const vehicles = data[1];
  const programador = data[2];

  const shell = element("div", "shell");

  const header = element("header", "header");
  const intro = element("div");
  intro.append(
    element("div", "eyebrow", "AFL AUTOS · JSON FRAMEWORK"),
    element("h1", "", "ROOT Console"),
    element("p", "subtitle", "Interfaz generada desde JSON público sanitizado. Drive conserva multimedia; Google Calendar conserva trabajo de campo y Meta Business Suite la programación social.")
  );
  const stats = element("div", "stats");
  stats.append(stat("Activos", vehicles.vehicles.length), stat("Modo", "JSON"), stat("Publicar", "NO AUTO"));
  header.append(intro, stats);

  const consoleSection = element("section", "root-console");
  const consoleCard = element("div", "console-card");
  const consoleHead = element("div", "console-head");
  const consoleTitle = element("div");
  consoleTitle.append(element("div", "eyebrow", "SYSTEM"), element("h2", "", "Contrato " + system.schemaVersion));
  consoleHead.append(consoleTitle, element("span", "console-status", "JSON ACTIVO"));
  const homeTabs = makeHomeTabs(system);
  consoleCard.append(consoleHead, homeTabs);
  consoleSection.append(consoleCard);

  const schedule = element("section", "programador");
  programador.events.slice(0, 3).forEach(function(e) { schedule.append(scheduleCard(e)); });

  const toolbar = element("section", "toolbar");
  const searchLabel = element("label", "search");
  const input = element("input");
  input.id = "search";
  input.type = "search";
  input.placeholder = "Buscar código, vehículo o estado…";
  searchLabel.append(input);
  const filters = element("div", "filters");
  [["all","Todos"],["CAPTURA_PENDIENTE","Captura"],["REVISION_MATERIAL","Revisión"]].forEach(function(pair, i) {
    const b = element("button", "filter" + (i === 0 ? " active" : ""), pair[1]);
    b.dataset.filter = pair[0];
    filters.append(b);
  });
  toolbar.append(searchLabel, filters);

  const grid = element("main", "grid");
  grid.id = "grid";
  vehicles.vehicles.forEach(function(v) { grid.append(vehicleCard(v)); });

  const empty = element("div", "empty", "No hay vehículos que coincidan.");
  empty.id = "empty";

  const footer = element("footer", "footer", "AFL_AUTOS_LOCAL · JSON-driven · " + system.updated);

  shell.append(header, consoleSection, schedule, toolbar, grid, empty, footer);
  root.replaceChildren(shell);
  bindFilters();
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
