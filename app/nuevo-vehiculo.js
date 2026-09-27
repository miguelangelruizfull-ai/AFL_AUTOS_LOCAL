import { getJSON, element } from "./api.js";

const root = document.getElementById("nuevo-vehiculo-app");

function button(label, href, primary) {
  const a = element("a", primary ? "btn primary" : "btn", label);
  a.href = href;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  return a;
}

function codeBlock(text) {
  const pre = element("pre", "prompt-box");
  pre.textContent = text;
  return pre;
}

async function run() {
  try {
    const data = await Promise.all([
      getJSON("data/prompts/nuevo-vehiculo.json"),
      getJSON("data/workflows/nuevo-vehiculo.json"),
      getJSON("data/templates/vehicle.template.json"),
      getJSON("data/multimedia.json")
    ]);
    const prompt = data[0];
    const workflow = data[1];
    const template = data[2];
    const multimedia = data[3];

    const shell = element("div", "shell");

    const header = element("header", "header");
    const intro = element("div");
    intro.append(
      element("div", "eyebrow", "AFL AUTOS · NUEVO VEHICULO"),
      element("h1", "", "Ingreso de vehículo nuevo"),
      element("p", "subtitle", prompt.purpose)
    );
    header.append(intro, button("← ROOT", "index.html", false));

    const grid = element("div", "detail-grid");

    const staging = element("article", "panel");
    staging.append(
      element("h2", "", "1 · Entrada temporal"),
      element("p", "subtitle", "Antes de confirmar el AFL-ID, cargar el material aquí:"),
      codeBlock(workflow.staging)
    );

    const drive = element("article", "panel");
    drive.append(element("h2", "", "2 · Después de confirmar AFL-ID"));
    drive.append(codeBlock(
      multimedia.inputTemplate.root + "\n" +
      multimedia.inputTemplate.folders.map(function(x){ return "↳ " + x.name; }).join("\n") +
      "\n\n" +
      multimedia.outputTemplate.root + "\n" +
      multimedia.outputTemplate.folders.map(function(x){ return "↳ " + x; }).join("\n")
    ));

    const flow = element("article", "panel wide");
    flow.append(element("h2", "", "3 · Workflow"));
    const ol = element("ol", "checklist");
    workflow.stateFlow.forEach(function(x){ ol.append(element("li", "", x)); });
    flow.append(ol);

    const promptPanel = element("article", "panel wide");
    promptPanel.append(element("h2", "", "4 · Prompt operativo"));
    const promptText = prompt.prompt.join("\n");
    const copy = element("button", "btn primary", "Copiar prompt");
    copy.type = "button";
    const status = element("span", "copy-status", "");
    copy.addEventListener("click", async function(){
      try {
        await navigator.clipboard.writeText(promptText);
        status.textContent = "Copiado";
      } catch (error) {
        status.textContent = "No se pudo copiar automáticamente";
      }
    });
    const actions = element("div", "actions");
    actions.append(copy, button("Ver JSON del prompt", "data/prompts/nuevo-vehiculo.json", false));
    promptPanel.append(actions, status, codeBlock(promptText));

    const templatePanel = element("article", "panel wide");
    templatePanel.append(
      element("h2", "", "5 · Plantilla JSON"),
      element("p", "subtitle", "El expediente público parte de esta plantilla. Nunca incluir VIN completo, odómetro, PII o enlaces privados.")
    );
    const templateActions = element("div", "actions");
    templateActions.append(
      button("Ver plantilla", "data/templates/vehicle.template.json", true),
      button("Ver workflow JSON", "data/workflows/nuevo-vehiculo.json", false),
      button("Ver multimedia JSON", "data/multimedia.json", false)
    );
    templatePanel.append(templateActions);

    grid.append(staging, drive, flow, promptPanel, templatePanel);
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
