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

test("montarMensagem e botoes para curso usam formato proprio", () => {
  const mensagem = montarMensagem(
    {
      tipo: "curso",
      titulo: "Curso gratuito de JavaScript",
      plataforma: "Fundacao Bradesco",
      resumo: "Aprenda JavaScript do zero.",
    },
    {
      socialLinkedin: "https://linkedin.com/in/alanadiastech",
      socialInstagram: "https://instagram.com/alanadiastech",
    }
  );

  const botoes = montarBotoes({
    tipo: "curso",
    link: "https://example.com/curso",
  });

  assert.match(mensagem, /Curso gratuito de TI/);
  assert.match(mensagem, /Fundacao Bradesco/);
  assert.deepEqual(botoes, {
    inline_keyboard: [[{ text: "Acessar curso gratuito", url: "https://example.com/curso" }]],
  });
});
