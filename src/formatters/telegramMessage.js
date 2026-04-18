const { escapeHtml } = require("../utils/text");

function montarMensagem(vaga, config) {
  if (vaga.tipo === "curso") {
    return [
      "<b>📚 Curso gratuito de TI</b>",
      "<i>Conteudo para evoluir na carreira tech</i>",
      "",
      "━━━━━━━━━━━━━━",
      `<b>🎓 Titulo</b>\n${escapeHtml(vaga.titulo)}`,
      "",
      `<b>🏫 Plataforma</b>\n${escapeHtml(vaga.plataforma)}`,
      "",
      `<b>📝 Resumo</b>\n${escapeHtml(vaga.resumo)}`,
      "",
      "━━━━━━━━━━━━━━",
      "<b>📲 Alana Dias Tech</b>",
      '<a href="' +
        escapeHtml(config.socialLinkedin) +
        '">LinkedIn</a> • <a href="' +
        escapeHtml(config.socialInstagram) +
        '">Instagram</a>',
    ].join("\n");
  }

  return [
    "<b>🚀 Vaga em TI no Brasil</b>",
    "<i>Oportunidade para a comunidade tech brasileira</i>",
    "",
    "━━━━━━━━━━━━━━",
    `<b>💼 Cargo</b>\n${escapeHtml(vaga.titulo)}`,
    "",
    `<b>🏢 Empresa</b>\n${escapeHtml(vaga.empresa)}`,
    "",
    `<b>📍 Local</b>\n${escapeHtml(vaga.local)}`,
    "",
    `<b>🧭 Modelo</b>\n${escapeHtml(vaga.modelo)}`,
    "",
    `<b>🕒 Publicada</b>\n${escapeHtml(vaga.publicado)}`,
    "",
    "━━━━━━━━━━━━━━",
    "<b>📲 Alana Dias Tech</b>",
    '<a href="' +
      escapeHtml(config.socialLinkedin) +
      '">LinkedIn</a> • <a href="' +
      escapeHtml(config.socialInstagram) +
      '">Instagram</a>',
  ].join("\n");
}

function montarBotoes(vaga) {
  if (vaga.tipo === "curso") {
    return {
      inline_keyboard: [[{ text: "Acessar curso gratuito", url: vaga.link }]],
    };
  }

  return {
    inline_keyboard: [[{ text: "Ver vaga e candidatar-se", url: vaga.link }]],
  };
}

module.exports = {
  montarBotoes,
  montarMensagem,
};
