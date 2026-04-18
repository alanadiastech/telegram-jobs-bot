const axios = require("axios");
const {
  montarBotoes,
  montarMensagem,
} = require("../formatters/telegramMessage");

async function enviarTelegram(vaga, config, client = axios) {
  await client.post(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
    chat_id: config.chatId,
    text: montarMensagem(vaga, config),
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: montarBotoes(vaga),
  });
}

module.exports = {
  enviarTelegram,
};
