import { getJSON, labelStatus, element } from "./api.js";

const root = document.getElementById("programador-app");

function linkButton(label, href, primary) {
  const a = element("a", primary ? "btn primary" : "btn", label);
  a.href = href;
  return a;
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
  const actions = element("div", "actions compact");
  if (e.links && e.links.vehicle) actions.append(linkButton("Abrir vehículo", "index.html" + e.links.vehicle, true));
  actions.append(linkButton("ROOT", "index.html", false));
  card.append(actions);
  return card;
}

async function run() {
  try {
    const data = await getJSON("data/programador.json");
    const shell = element("div", "shell");

    const header = element("header", "header");
    const intro = element("div");
    intro.append(
      element("div", "eyebrow", "AFL AUTOS · PROGRAMADOR JSON"),
      element("h1", "", "Programados con Google Calendar"),
      element("p", "subtitle", "Vista generada desde data/programador.json. Calendar prevalece para fecha y hora.")
    );
    header.append(intro, linkButton("← ROOT", "index.html", false));

    const main = element("main", "programador full");
    data.events.forEach(function(e) { main.append(scheduleCard(e)); });

    const notice = element("div", "notice", "Fuente: " + data.source + " · Actualizado: " + data.updated);

    shell.append(header, main, notice);
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
