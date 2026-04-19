const fs = require("fs/promises");
const path = require("path");

function expandirChavesLegadas(id) {
  if (!id || typeof id !== "string") return [];

  const chaves = [id];
  const partes = id.split("|").filter(Boolean);
  const [, titulo, empresa, local] = partes;

  if (titulo && empresa) {
    chaves.push(["vaga", titulo, empresa].join("|"));
  }

  if (titulo && empresa && local) {
    chaves.push(["vaga", titulo, empresa, local].join("|"));
  }

  return chaves;
}

async function carregarHistorico(stateFile) {
  try {
    const conteudo = await fs.readFile(stateFile, "utf8");
    const parsed = JSON.parse(conteudo);

    if (Array.isArray(parsed.ids)) {
      return new Set(parsed.ids.flatMap(expandirChavesLegadas).filter(Boolean));
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

function obterChavesDedupe(item) {
  if (!item) return [];

  if (typeof item === "string") {
    return expandirChavesLegadas(item).filter(Boolean);
  }

  const chaves = [
    item.id,
    ...(Array.isArray(item.dedupeKeys) ? item.dedupeKeys : []),
  ];

  return Array.from(new Set(chaves.filter(Boolean)));
}

function filtrarVagasNovas(vagas, historico, maxJobs) {
  const vistos = new Set(historico);
  const novas = [];

  for (const vaga of vagas) {
    const chaves = obterChavesDedupe(vaga);

    if (chaves.length === 0 || chaves.some((chave) => vistos.has(chave))) {
      continue;
    }

    novas.push(vaga);
    chaves.forEach((chave) => vistos.add(chave));

    if (novas.length >= maxJobs) {
      break;
    }
  }

  return novas;
}

async function registrarVagaPublicada(vaga, historico, config) {
  obterChavesDedupe(vaga).forEach((chave) => historico.add(chave));
  await salvarHistorico(historico, config.stateFile, config.maxHistory);
}

module.exports = {
  carregarHistorico,
  expandirChavesLegadas,
  salvarHistorico,
  filtrarVagasNovas,
  obterChavesDedupe,
  registrarVagaPublicada,
};
