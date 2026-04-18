const test = require("node:test");
const assert = require("node:assert/strict");

const { buscarVagasGoogle } = require("../src/providers/googleJobs");
const {
  hybridJob,
  remoteJuniorJob,
  sankhyaJob,
  seniorRemoteJob,
  usJob,
} = require("./helpers/jobs.fixture");

test("buscarVagasGoogle consulta a SerpApi e retorna vagas parseadas", async () => {
  const chamadas = [];
  const client = {
    async get(url, options) {
      chamadas.push({ url, options });
      return {
        data: {
          jobs_results: [sankhyaJob, usJob],
          search_metadata: {
            google_jobs_url: "https://google.com/jobs/search",
          },
        },
      };
    },
  };

  const vagas = await buscarVagasGoogle(
    {
      serpApiKey: "key",
      searchQuery: "desenvolvedor de software brasil",
      searchLocation: "Brazil",
    },
    client
  );

  assert.equal(chamadas.length, 1);
  assert.equal(chamadas[0].url, "https://serpapi.com/search.json");
  assert.equal(vagas.length, 1);
  assert.equal(vagas[0].empresa, "Sankhya");
  assert.equal(vagas[0].modelo, "Remoto");
});

test("buscarVagasGoogle prioriza remoto e junior antes das demais", async () => {
  const client = {
    async get() {
      return {
        data: {
          jobs_results: [hybridJob, sankhyaJob, remoteJuniorJob, seniorRemoteJob],
        },
      };
    },
  };

  const vagas = await buscarVagasGoogle(
    {
      serpApiKey: "key",
      searchQuery: "desenvolvedor de software brasil",
      searchLocation: "Brazil",
    },
    client
  );

  assert.equal(vagas[0].empresa, "Tech Remota");
  assert.equal(vagas[0].prioridade, 3);
  assert.equal(vagas[1].prioridade, 2);
});
