const test = require("node:test");
const assert = require("node:assert/strict");

const { exibirDryRun, run } = require("../src/main");

test("exibirDryRun imprime mensagem e link", async () => {
  const logs = [];
  const original = console.log;
  console.log = (...args) => logs.push(args.join(" "));

  try {
    exibirDryRun(
      [
        {
          titulo: "Dev",
          empresa: "XPTO",
          local: "SP",
          modelo: "Remoto",
          publicado: "hoje",
          link: "https://example.com",
        },
      ],
      {
        socialLinkedin: "https://linkedin.com",
        socialInstagram: "https://instagram.com",
      }
    );
  } finally {
    console.log = original;
  }

  assert.match(logs.join("\n"), /DRY_RUN ativo/);
  assert.match(logs.join("\n"), /https:\/\/example.com/);
});

test("run salva historico e encerra quando nao ha vagas", async () => {
  const chamadas = [];

  await run(
    { SERPAPI_KEY: "key", DRY_RUN: "true" },
    {
      createConfigFn: () => ({
        serpApiKey: "key",
        dryRun: true,
        stateFile: ".cache/test.json",
        maxHistory: 5,
      }),
      validateConfigFn: () => {},
      carregarHistoricoFn: async () => new Set(),
      buscarVagasGoogleFn: async () => [],
      filtrarVagasNovasFn: () => [],
      salvarHistoricoFn: async () => chamadas.push("salvou"),
    }
  );

  assert.deepEqual(chamadas, ["salvou"]);
});

test("run executa dry run sem enviar telegram", async () => {
  const chamadas = [];
  const vaga = {
    id: "vaga-1",
    titulo: "Dev",
    empresa: "XPTO",
    local: "SP",
    modelo: "Remoto",
    publicado: "hoje",
    link: "https://vaga-original.com",
  };

  await run(
    { SERPAPI_KEY: "key", DRY_RUN: "true" },
    {
      createConfigFn: () => ({
        serpApiKey: "key",
        dryRun: true,
        maxJobs: 5,
        maxHistory: 5,
        shortenUrls: true,
        stateFile: ".cache/test.json",
        socialLinkedin: "https://linkedin.com",
        socialInstagram: "https://instagram.com",
      }),
      validateConfigFn: () => {},
      carregarHistoricoFn: async () => new Set(),
      buscarVagasGoogleFn: async () => [vaga],
      filtrarVagasNovasFn: (vagas) => vagas,
      encurtarUrlFn: async () => "https://encurtada.com",
      exibirDryRunFn: (vagas) => chamadas.push(vagas[0].link),
      enviarTelegramFn: async () => chamadas.push("enviou"),
      registrarVagaPublicadaFn: async () => chamadas.push("registrou"),
    }
  );

  assert.deepEqual(chamadas, ["https://encurtada.com"]);
});

test("run envia vagas e registra historico uma a uma", async () => {
  const chamadas = [];
  const vaga = {
    id: "vaga-2",
    titulo: "Dev",
    empresa: "XPTO",
    local: "SP",
    modelo: "Remoto",
    publicado: "hoje",
    link: "https://vaga-original.com",
  };

  await run(
    { SERPAPI_KEY: "key", BOT_TOKEN: "bot", CHAT_ID: "chat" },
    {
      createConfigFn: () => ({
        serpApiKey: "key",
        botToken: "bot",
        chatId: "chat",
        dryRun: false,
        maxJobs: 5,
        maxHistory: 5,
        shortenUrls: true,
        stateFile: ".cache/test.json",
        socialLinkedin: "https://linkedin.com",
        socialInstagram: "https://instagram.com",
      }),
      validateConfigFn: () => {},
      carregarHistoricoFn: async () => new Set(),
      buscarVagasGoogleFn: async () => [vaga],
      filtrarVagasNovasFn: (vagas) => vagas,
      encurtarUrlFn: async () => "https://encurtada.com",
      enviarTelegramFn: async (job) => chamadas.push(`envio:${job.link}`),
      registrarVagaPublicadaFn: async (id) => chamadas.push(`registro:${id}`),
    }
  );

  assert.deepEqual(chamadas, ["envio:https://encurtada.com", "registro:vaga-2"]);
});
