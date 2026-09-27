import { getJSON, money, labelStatus, element } from "./api.js";

const root = document.getElementById("app");

function linkButton(label, href, primary) {
  const a = element("a", primary ? "btn primary" : "btn", label);
  a.href = href;
  return a;
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
  card.append(element("div", "schedule-time", e.date + " · " + e.start + "–" + e.end));
  card.append(element("div", "schedule-meta", "Fuente: Google Calendar · " + (e.timezone || "")));
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
  img.src = v.image;
  img.alt = v.title;
  img.loading = "lazy";
  wrap.append(img, element("span", "code-badge", v.id), element("span", "publish-badge", v.publish ? "PUBLICABLE" : "NO PUBLICAR"));

  const body = element("div", "card-body");
  const titleRow = element("div", "title-row");
  titleRow.append(element("h2", "", v.title), element("span", "state", labelStatus(v.status)));

  const metaGrid = element("div", "meta-grid");
  metaGrid.append(
    meta("WhatsApp", v.whatsapp),
    meta("Precio interno", money(v.priceInternal, v.currency)),
    meta("Siguiente", labelStatus(v.nextAction))
  );

  const actions = element("div", "actions");
  if (v.detail) actions.append(linkButton("Ficha y salidas", "?vehicle=" + encodeURIComponent(v.id), true));
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
    PUBLICADO: "Publicación confirmada.",
    OCULTO: "Ficha preparada; no publicar automáticamente."
  };
  return notes[status] || labelStatus(status);
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
  const note = element("p", "subtitle", "Estados canónicos: PENDIENTE · EN PRODUCCION · LISTO · PUBLICADO. Esta web es de solo lectura; los controles preparan el cambio para actualizar JSON.");
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
    (d.key === "whatsapp" ? ["OCULTO","PENDIENTE","EN_PRODUCCION","LISTO","PUBLICADO"] : ["PENDIENTE","EN_PRODUCCION","LISTO","PUBLICADO"]).forEach(function(s) {
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
    element("p", "subtitle", v.vehicle.configuration.engine + " · " + v.vehicle.configuration.transmission + " · " + v.vehicle.configuration.drivetrain)
  );
  head.append(headText, linkButton("← Inventario", "index.html", false));
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
    kv("Precio interno", money(v.commercial.priceInternal, v.commercial.currency))
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
  capture.append(
    element("h2", "", "Checklist de trabajo de campo"),
    element("div", "print-only", v.id + " · " + v.vehicle.publicTitle),
    element("h3", "", "Captura programada"),
    element("div", "schedule-time", v.capture.date + " · " + v.capture.start + "–" + v.capture.end),
    element("p", "subtitle", "Fuente: " + v.capture.source + " · " + v.capture.timezone),
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

  grid.append(state, media, capture, video, channelNav, whatsapp, outputs, drive, fieldActions);
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
    element("p", "subtitle", "Interfaz generada desde JSON público sanitizado. Drive conserva multimedia; Google Calendar conserva programación.")
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
  const actions = element("div", "root-actions");
  actions.append(
    linkButton("Nuevo vehículo", "NUEVO_VEHICULO.html", true),
    linkButton("Programador", "PROGRAMADOR.html", false),
    linkButton("Vehicles JSON", "data/vehicles/index.json", false),
    linkButton("Multimedia", "MULTIMEDIA.html", false),
    linkButton("Música JSON", "data/musica-usada.json", false),
    linkButton("Portafolio técnico", "PORTAFOLIO/", false)
  );
  consoleCard.append(consoleHead, actions);
  consoleSection.append(consoleCard);

  const schedule = element("section", "programador");
  programador.events.slice(0, 2).forEach(function(e) { schedule.append(scheduleCard(e)); });

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
