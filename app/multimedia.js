import { getJSON, element } from "./api.js";

const root = document.getElementById("multimedia-app");

function button(label, href, primary) {
  const a = element("a", primary ? "btn primary" : "btn", label);
  a.href = href;
  return a;
}

function treeBlock(title, rootPath, folders) {
  const panel = element("article", "panel");
  panel.append(element("h2", "", title));
  const tree = element("div", "folder-tree");
  tree.append(element("div", "tree-root", rootPath));
  folders.forEach(function(item) {
    const name = typeof item === "string" ? item : item.name;
    const purpose = typeof item === "string" ? "" : item.purpose;
    const row = element("div", "tree-row");
    row.append(element("span", "tree-branch", "↳"), element("strong", "", name));
    if (purpose) row.append(element("span", "tree-purpose", purpose));
    tree.append(row);
  });
  panel.append(tree);
  return panel;
}

function statusLegend(model) {
  const panel = element("article", "panel wide");
  panel.append(element("h2", "", "Estados de salidas"));
  const grid = element("div", "status-legend");
  model.allowed.forEach(function(status) {
    const item = element("div", "legend-item");
    item.append(element("span", "status-chip status-" + status.toLowerCase(), status));
    const key = status === "PENDIENTE" ? "pending" :
                status === "EN_PRODUCCION" ? "inProduction" :
                status === "LISTO" ? "ready" : "published";
    item.append(element("span", "tree-purpose", model.rules[key] || ""));
    grid.append(item);
  });
  panel.append(grid);
  return panel;
}

async function run() {
  try {
    const data = await Promise.all([
      getJSON("data/multimedia.json"),
      getJSON("data/vehicles/index.json")
    ]);
    const multimedia = data[0];
    const vehicles = data[1];

    const shell = element("div", "shell");
    const header = element("header", "header");
    const intro = element("div");
    intro.append(
      element("div", "eyebrow", "AFL AUTOS · MULTIMEDIA JSON"),
      element("h1", "", "Arquitectura Drive"),
      element("p", "subtitle", "Vista generada desde data/multimedia.json. No expone IDs privados de Drive.")
    );
    const actions = element("div", "actions compact");
    actions.append(button("← ROOT", "index.html", false), button("Nuevo vehículo", "NUEVO_VEHICULO.html", true));
    header.append(intro, actions);

    const grid = element("div", "detail-grid");
    grid.append(
      treeBlock("Staging", multimedia.staging.root, [
        {name:"00_PENDIENTE_ID",purpose:multimedia.staging.purpose}
      ]),
      treeBlock("01_ENTRADAS", multimedia.inputTemplate.root, multimedia.inputTemplate.folders),
      treeBlock("02_SALIDAS", multimedia.outputTemplate.root, multimedia.outputTemplate.folders.map(function(name) {
        const channel = (multimedia.outputChannels || []).find(function(x){ return x.folder === name; });
        return {name:name,purpose:channel ? channel.label : ""};
      }))
    );

    if (multimedia.outputStatusModel) grid.append(statusLegend(multimedia.outputStatusModel));

    const active = element("article", "panel wide");
    active.append(element("h2", "", "Vehículos en framework"));
    const list = element("div", "vehicle-links");
    vehicles.vehicles.forEach(function(v) {
      const row = element("div", "vehicle-link-row");
      row.append(
        element("strong", "", v.id + " · " + v.title),
        v.detail ? button("Abrir expediente", "index.html?vehicle=" + encodeURIComponent(v.id), false) : element("span", "tree-purpose", "JSON completo pendiente")
      );
      list.append(row);
    });
    active.append(list);
    grid.append(active);

    shell.append(header, grid);
    root.replaceChildren(shell);
  } catch (error) {
    const shell = element("div", "shell");
    const box = element("div", "error");
    box.append(element("h1", "", "Error"), element("p", "", error.message));
    shell.append(box);
    root.replaceChildren(shell);
  }
}

run();
