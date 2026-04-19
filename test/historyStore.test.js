const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs/promises");
const os = require("os");
const path = require("path");

const {
  carregarHistorico,
  expandirChavesLegadas,
  filtrarVagasNovas,
  obterChavesDedupe,
  registrarVagaPublicada,
} = require("../src/services/historyStore");

test("filtrarVagasNovas respeita historico e limite", () => {
  const historico = new Set(["vaga-1"]);
  const vagas = [{ id: "vaga-1" }, { id: "vaga-2" }, { id: "vaga-3" }];

  const resultado = filtrarVagasNovas(vagas, historico, 1);

  assert.deepEqual(resultado, [{ id: "vaga-2" }]);
});

test("filtrarVagasNovas remove duplicadas do mesmo lote por chaves alternativas", () => {
  const historico = new Set();
  const vagas = [
    {
      id: "google-job-id-1",
      dedupeKeys: ["vaga|dev-backend|empresa-x"],
    },
    {
      id: "google-job-id-2",
      dedupeKeys: ["vaga|dev-backend|empresa-x"],
    },
    {
      id: "google-job-id-3",
      dedupeKeys: ["vaga|dev-frontend|empresa-x"],
    },
  ];

  const resultado = filtrarVagasNovas(vagas, historico, 5);

  assert.deepEqual(resultado, [vagas[0], vagas[2]]);
});

test("filtrarVagasNovas bloqueia vaga com nova id quando chave estavel ja existe", () => {
  const historico = new Set(["vaga|dev-backend|empresa-x"]);
  const vagas = [
    {
      id: "novo-google-job-id",
      dedupeKeys: ["vaga|dev-backend|empresa-x"],
    },
  ];

  const resultado = filtrarVagasNovas(vagas, historico, 5);

  assert.deepEqual(resultado, []);
});

test("obterChavesDedupe aceita string e objeto sem duplicar chaves", () => {
  assert.deepEqual(obterChavesDedupe("vaga-1"), ["vaga-1"]);
  assert.deepEqual(obterChavesDedupe({ id: "vaga-1", dedupeKeys: ["vaga-1", "cargo|empresa"] }), [
    "vaga-1",
    "cargo|empresa",
  ]);
});

test("expandirChavesLegadas cria chave estavel a partir do fingerprint antigo", () => {
  const resultado = expandirChavesLegadas(
    "google-id|desenvolvedor-backend|empresa-x|brasil|https-google"
  );

  assert.deepEqual(resultado, [
    "google-id|desenvolvedor-backend|empresa-x|brasil|https-google",
    "vaga|desenvolvedor-backend|empresa-x",
    "vaga|desenvolvedor-backend|empresa-x|brasil",
  ]);
});

test("carregarHistorico expande ids antigos para bloquear duplicadas futuras", async () => {
  const diretorio = await fs.mkdtemp(path.join(os.tmpdir(), "jobs-bot-"));
  const stateFile = path.join(diretorio, "posted-jobs.json");
  await fs.writeFile(
    stateFile,
    JSON.stringify({
      ids: ["google-id-antigo|dev-backend|empresa-x|brasil|link-antigo"],
    })
  );

  const historico = await carregarHistorico(stateFile);

  assert.equal(historico.has("vaga|dev-backend|empresa-x"), true);
});

test("registrarVagaPublicada persiste historico no arquivo", async () => {
  const diretorio = await fs.mkdtemp(path.join(os.tmpdir(), "jobs-bot-"));
  const stateFile = path.join(diretorio, "posted-jobs.json");
  const historico = await carregarHistorico(stateFile);

  await registrarVagaPublicada(
    {
      id: "vaga-10",
      dedupeKeys: ["vaga|dev|empresa"],
    },
    historico,
    {
      stateFile,
      maxHistory: 5,
    }
  );

  const recarregado = await carregarHistorico(stateFile);

  assert.equal(recarregado.has("vaga-10"), true);
  assert.equal(recarregado.has("vaga|dev|empresa"), true);
});
