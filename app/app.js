import { getJSON, money, labelStatus, element } from "./api.js";

const root = document.getElementById("app");

function linkButton(label, href, primary) {
  const a = element("a", primary ? "btn primary" : "btn", label);
  a.href = href;
  return a;
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
  if (v.detail) actions.append(linkButton("Abrir expediente", "?vehicle=" + encodeURIComponent(v.id), true));
  actions.append(linkButton("Programador", "PROGRAMADOR.html", false));

  body.append(titleRow, metaGrid, actions);
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

  const capture = element("article", "panel");
  capture.append(
    element("h2", "", "Captura programada"),
    element("div", "schedule-time", v.capture.date + " · " + v.capture.start + "–" + v.capture.end),
    element("p", "subtitle", "Fuente: " + v.capture.source + " · " + v.capture.timezone),
    element("h3", "", "Checklist"),
    makeList(v.capture.checklist, true)
  );

  const video = element("article", "panel");
  video.append(
    element("h2", "", "Video obligatorio"),
    kv("Formato", v.capture.requiredVideo.format),
    kv("Walkaround", v.capture.requiredVideo.walkaroundSeconds + " s"),
    makeList(v.capture.requiredVideo.shots, false)
  );

  const outputs = element("article", "panel wide");
  outputs.append(element("h2", "", "Salidas"));
  const outGrid = element("div", "output-grid");
  Object.entries(v.outputs || {}).forEach(function(entry) {
    outGrid.append(meta(entry[0], labelStatus(entry[1])));
  });
  outputs.append(outGrid);

  const drive = element("article", "panel wide");
  drive.append(element("h2", "", "Arquitectura Drive"));
  const inBox = element("div", "codebox");
  inBox.append(element("strong", "", v.drive.inputRoot));
  (v.drive.inputs || []).forEach(function(x) { inBox.append(document.createElement("br"), document.createTextNode("↳ " + x)); });
  const outBox = element("div", "codebox");
  outBox.append(element("strong", "", v.drive.outputRoot));
  (v.drive.outputs || []).forEach(function(x) { outBox.append(document.createElement("br"), document.createTextNode("↳ " + x)); });
  drive.append(inBox, outBox);

  grid.append(state, media, capture, video, outputs, drive);
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
    linkButton("Multimedia JSON", "data/multimedia.json", false),
    linkButton("Música JSON", "data/musica-usada.json", false)
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
