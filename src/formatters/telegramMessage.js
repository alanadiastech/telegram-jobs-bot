const { escapeHtml } = require("../utils/text");

function montarMensagem(vaga, config) {
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
  return {
    inline_keyboard: [[{ text: "Ver vaga e candidatar-se", url: vaga.link }]],
  };
}

module.exports = {
  montarBotoes,
  montarMensagem,
};
