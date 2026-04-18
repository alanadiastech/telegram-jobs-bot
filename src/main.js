const { createConfig, validateConfig } = require("./config");
const { buscarVagasGoogle } = require("./providers/googleJobs");
const {
  carregarHistorico,
  filtrarVagasNovas,
  registrarVagaPublicada,
  salvarHistorico,
} = require("./services/historyStore");
const { enviarTelegram } = require("./services/telegramPublisher");
const { encurtarUrl } = require("./services/urlShortener");
const { montarMensagem } = require("./formatters/telegramMessage");

function exibirDryRun(vagas, config) {
  console.log(`DRY_RUN ativo. ${vagas.length} vaga(s) seriam publicadas:\n`);

  for (const [index, vaga] of vagas.entries()) {
    console.log(`--- Vaga ${index + 1} ---`);
    console.log(montarMensagem(vaga, config));
    console.log(`Link: ${vaga.link}`);
    console.log("");
  }
}

async function run(env = process.env, deps = {}) {
  const {
    createConfigFn = createConfig,
    validateConfigFn = validateConfig,
    carregarHistoricoFn = carregarHistorico,
    buscarVagasGoogleFn = buscarVagasGoogle,
    filtrarVagasNovasFn = filtrarVagasNovas,
    salvarHistoricoFn = salvarHistorico,
    encurtarUrlFn = encurtarUrl,
    enviarTelegramFn = enviarTelegram,
    registrarVagaPublicadaFn = registrarVagaPublicada,
    exibirDryRunFn = exibirDryRun,
  } = deps;

  const config = createConfigFn(env);
  validateConfigFn(config);

  const historico = await carregarHistoricoFn(config.stateFile);
  const vagas = await buscarVagasGoogleFn(config);
  const vagasNovas = filtrarVagasNovasFn(vagas, historico, config.maxJobs);

  if (vagas.length === 0) {
    await salvarHistoricoFn(historico, config.stateFile, config.maxHistory);
    console.log("Nenhuma vaga do Brasil encontrada para a busca atual.");
    return;
  }

  if (vagasNovas.length === 0) {
    await salvarHistoricoFn(historico, config.stateFile, config.maxHistory);
    console.log("Nenhuma vaga nova encontrada. Nada sera publicado.");
    return;
  }

  for (const vaga of vagasNovas) {
    vaga.link = await encurtarUrlFn(vaga.link, config);
  }

  if (config.dryRun) {
    exibirDryRunFn(vagasNovas, config);
    return;
  }

  for (const vaga of vagasNovas) {
    await enviarTelegramFn(vaga, config);
    await registrarVagaPublicadaFn(vaga.id, historico, config);
  }
}

module.exports = {
  exibirDryRun,
  run,
};
