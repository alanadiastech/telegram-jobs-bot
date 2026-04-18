const { createConfig, validateConfig } = require("./config");
const { buscarCursosGratuitos } = require("./providers/freeCourses");
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
  const rotulo =
    config.contentType === "courses" ? "curso(s)" : "vaga(s)";
  console.log(`DRY_RUN ativo. ${vagas.length} ${rotulo} seriam publicados:\n`);

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
    buscarCursosGratuitosFn = buscarCursosGratuitos,
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
  const isCourses = config.contentType === "courses";
  const itens = isCourses
    ? await buscarCursosGratuitosFn(config)
    : await buscarVagasGoogleFn(config);
  const itensNovos = filtrarVagasNovasFn(
    itens,
    historico,
    isCourses ? config.maxCourses : config.maxJobs
  );

  if (itens.length === 0) {
    await salvarHistoricoFn(historico, config.stateFile, config.maxHistory);
    console.log(
      isCourses
        ? "Nenhum curso encontrado para a busca atual."
        : "Nenhuma vaga do Brasil encontrada para a busca atual."
    );
    return;
  }

  if (itensNovos.length === 0) {
    await salvarHistoricoFn(historico, config.stateFile, config.maxHistory);
    console.log(
      isCourses
        ? "Nenhum curso novo encontrado. Nada sera publicado."
        : "Nenhuma vaga nova encontrada. Nada sera publicado."
    );
    return;
  }

  for (const item of itensNovos) {
    item.link = await encurtarUrlFn(item.link, config);
  }

  if (config.dryRun) {
    exibirDryRunFn(itensNovos, config);
    return;
  }

  for (const item of itensNovos) {
    await enviarTelegramFn(item, config);
    await registrarVagaPublicadaFn(item.id, historico, config);
  }
}

module.exports = {
  exibirDryRun,
  run,
};
