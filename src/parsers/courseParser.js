const { normalizarTexto, slug } = require("../utils/text");

function extrairLinkCurso(resultado) {
  if (resultado.link) return resultado.link;
  if (resultado.serpapi_link) return resultado.serpapi_link;
  return "";
}

function gerarFingerprintCurso(resultado) {
  return [
    resultado.title,
    resultado.source,
    resultado.platform,
    extrairLinkCurso(resultado),
  ]
    .filter(Boolean)
    .map(slug)
    .filter(Boolean)
    .join("|");
}

function parseCourse(resultado) {
  const curso = {
    id: gerarFingerprintCurso(resultado),
    tipo: "curso",
    titulo: normalizarTexto(resultado.title),
    plataforma: normalizarTexto(
      resultado.source || resultado.platform,
      "Plataforma nao informada"
    ),
    resumo: normalizarTexto(
      resultado.snippet || resultado.description,
      "Curso gratuito de TI"
    ),
    link: extrairLinkCurso(resultado),
  };

  curso.dedupeKeys = [curso.id].filter(Boolean);

  return curso;
}

module.exports = {
  parseCourse,
};
