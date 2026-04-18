const test = require("node:test");
const assert = require("node:assert/strict");

const {
  montarBotoes,
  montarMensagem,
} = require("../src/formatters/telegramMessage");

test("montarMensagem inclui secoes principais e links sociais", () => {
  const mensagem = montarMensagem(
    {
      titulo: "Desenvolvedor Backend",
      empresa: "Empresa XPTO",
      local: "São Paulo, SP",
      modelo: "Remoto",
      publicado: "há 1 dia",
    },
    {
      socialLinkedin: "https://linkedin.com/in/alanadiastech",
      socialInstagram: "https://instagram.com/alanadiastech",
    }
  );

  assert.match(mensagem, /<b>💼 Cargo<\/b>/);
  assert.match(mensagem, /Empresa XPTO/);
  assert.match(mensagem, /LinkedIn/);
  assert.match(mensagem, /Instagram/);
});

test("montarBotoes cria somente o CTA principal", () => {
  const botoes = montarBotoes({ link: "https://example.com/vaga" });

  assert.deepEqual(botoes, {
    inline_keyboard: [[{ text: "Ver vaga e candidatar-se", url: "https://example.com/vaga" }]],
  });
});
