export async function getJSON(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error("No se pudo cargar " + path + ": " + response.status);
  return response.json();
}

export function money(value, currency) {
  if (value === null || value === undefined) return "Pendiente";
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: currency || "MXN",
    maximumFractionDigits: 0
  }).format(value);
}

export function labelStatus(value) {
  return String(value || "").replaceAll("_", " ");
}

export function element(tag, className, textValue) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (textValue !== undefined && textValue !== null) node.textContent = String(textValue);
  return node;
}
