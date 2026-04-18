const fs = require("fs/promises");
const path = require("path");

async function carregarHistorico(stateFile) {
  try {
    const conteudo = await fs.readFile(stateFile, "utf8");
    const parsed = JSON.parse(conteudo);

    if (Array.isArray(parsed.ids)) {
      return new Set(parsed.ids.filter(Boolean));
    }
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.warn("Nao foi possivel ler o historico:", error.message);
    }
  }

  return new Set();
}

async function salvarHistorico(ids, stateFile, maxHistory) {
  const diretorio = path.dirname(stateFile);
  await fs.mkdir(diretorio, { recursive: true });

  const payload = {
    ids: Array.from(ids).slice(-maxHistory),
    updated_at: new Date().toISOString(),
  };

  await fs.writeFile(stateFile, JSON.stringify(payload, null, 2));
}

function filtrarVagasNovas(vagas, historico, maxJobs) {
  return vagas.filter((vaga) => vaga.id && !historico.has(vaga.id)).slice(0, maxJobs);
}

async function registrarVagaPublicada(vagaId, historico, config) {
  historico.add(vagaId);
  await salvarHistorico(historico, config.stateFile, config.maxHistory);
}

module.exports = {
  carregarHistorico,
  salvarHistorico,
  filtrarVagasNovas,
  registrarVagaPublicada,
};
