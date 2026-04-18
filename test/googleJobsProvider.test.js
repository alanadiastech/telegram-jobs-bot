const test = require("node:test");
const assert = require("node:assert/strict");

const { buscarVagasGoogle } = require("../src/providers/googleJobs");
const { sankhyaJob, usJob } = require("./helpers/jobs.fixture");

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
