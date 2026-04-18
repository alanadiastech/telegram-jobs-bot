const test = require("node:test");
const assert = require("node:assert/strict");

const {
  calcularPrioridade,
  extrairSenioridade,
  parseJob,
  vagaEhDoBrasil,
} = require("../src/parsers/jobParser");
const {
  hybridJob,
  remoteJuniorJob,
  sankhyaJob,
  seniorRemoteJob,
  usJob,
} = require("./helpers/jobs.fixture");

const context = {
  googleJobsUrl: "https://google.com/jobs",
  searchQuery: "desenvolvedor de software brasil",
};

test("parseJob extrai modelo remoto a partir da descricao", () => {
  const parsed = parseJob(sankhyaJob, context);

  assert.equal(parsed.modelo, "Remoto");
  assert.equal(parsed.empresa, "Sankhya");
  assert.equal(parsed.publicado, "há 3 dias");
});

test("parseJob prioriza modelo vindo das extensions", () => {
  const parsed = parseJob(hybridJob, context);

  assert.equal(parsed.modelo, "Hibrido");
});

test("vagaEhDoBrasil aceita vaga brasileira", () => {
  assert.equal(vagaEhDoBrasil(hybridJob), true);
});

test("vagaEhDoBrasil rejeita vaga dos estados unidos", () => {
  assert.equal(vagaEhDoBrasil(usJob), false);
});

test("parseJob gera link a partir do share_link quando disponivel", () => {
  const parsed = parseJob(hybridJob, context);

  assert.equal(parsed.link, hybridJob.share_link);
});

test("extrairSenioridade reconhece vagas junior", () => {
  assert.equal(extrairSenioridade(remoteJuniorJob), "Junior");
});

test("calcularPrioridade favorece remoto e junior", () => {
  const remotoJunior = parseJob(remoteJuniorJob, context);
  const remotoSenior = parseJob(seniorRemoteJob, context);
  const hibrido = parseJob(hybridJob, context);

  assert.equal(calcularPrioridade(remotoJunior), 3);
  assert.equal(calcularPrioridade(remotoSenior), 2);
  assert.equal(calcularPrioridade(hibrido), 0);
});
