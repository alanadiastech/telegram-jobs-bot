const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs/promises");
const os = require("os");
const path = require("path");

const {
  carregarHistorico,
  filtrarVagasNovas,
  registrarVagaPublicada,
} = require("../src/services/historyStore");

test("filtrarVagasNovas respeita historico e limite", () => {
  const historico = new Set(["vaga-1"]);
  const vagas = [{ id: "vaga-1" }, { id: "vaga-2" }, { id: "vaga-3" }];

  const resultado = filtrarVagasNovas(vagas, historico, 1);

  assert.deepEqual(resultado, [{ id: "vaga-2" }]);
});

test("registrarVagaPublicada persiste historico no arquivo", async () => {
  const diretorio = await fs.mkdtemp(path.join(os.tmpdir(), "jobs-bot-"));
  const stateFile = path.join(diretorio, "posted-jobs.json");
  const historico = await carregarHistorico(stateFile);

  await registrarVagaPublicada("vaga-10", historico, {
    stateFile,
    maxHistory: 5,
  });

  const recarregado = await carregarHistorico(stateFile);

  assert.equal(recarregado.has("vaga-10"), true);
});
