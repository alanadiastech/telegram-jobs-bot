function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function normalizarTexto(value, fallback = "Nao informado") {
  if (!value) return fallback;
  return String(value).trim();
}

function normalizarModelo(value) {
  const texto = normalizarTexto(value, "").toLowerCase();

  if (/remot/.test(texto)) return "Remoto";
  if (/h[ií]brid/.test(texto)) return "Hibrido";
  if (/presencial/.test(texto)) return "Presencial";

  return "";
}

function slug(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

module.exports = {
  escapeHtml,
  normalizarModelo,
  normalizarTexto,
  slug,
};
