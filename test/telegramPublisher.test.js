const test = require("node:test");
const assert = require("node:assert/strict");

const { enviarTelegram } = require("../src/services/telegramPublisher");

test("enviarTelegram envia payload correto para a API do Telegram", async () => {
  const chamadas = [];
  const client = {
    async post(url, payload) {
      chamadas.push({ url, payload });
    },
  };

  await enviarTelegram(
    {
      titulo: "Desenvolvedor Backend",
      empresa: "Empresa XPTO",
      local: "São Paulo, SP",
      modelo: "Remoto",
      publicado: "há 1 dia",
      link: "https://example.com/vaga",
    },
    {
      botToken: "bot-token",
      chatId: "chat-id",
      socialLinkedin: "https://linkedin.com/in/alanadiastech",
      socialInstagram: "https://instagram.com/alanadiastech",
    },
    client
  );

  assert.equal(chamadas.length, 1);
  assert.equal(
    chamadas[0].url,
    "https://api.telegram.org/botbot-token/sendMessage"
  );
  assert.equal(chamadas[0].payload.chat_id, "chat-id");
  assert.equal(
    chamadas[0].payload.reply_markup.inline_keyboard[0][0].text,
    "Ver vaga e candidatar-se"
  );
  assert.match(chamadas[0].payload.text, /Desenvolvedor Backend/);
});
