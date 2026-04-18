const axios = require("axios");
const { parseJob, vagaEhDoBrasil } = require("../parsers/jobParser");

async function buscarVagasGoogle(config, client = axios) {
  const { data } = await client.get("https://serpapi.com/search.json", {
    params: {
      engine: "google_jobs",
      api_key: config.serpApiKey,
      q: config.searchQuery,
      location: config.searchLocation,
      hl: "pt-br",
      gl: "br",
      no_cache: true,
    },
  });

  const vagas = Array.isArray(data.jobs_results) ? data.jobs_results : [];
  const googleJobsUrl =
    data.search_metadata?.google_jobs_url ||
    `https://www.google.com/search?q=${encodeURIComponent(
      config.searchQuery
    )}&udm=8&gl=br&hl=pt-BR`;

  return vagas
    .filter(vagaEhDoBrasil)
    .map((vaga) =>
      parseJob(vaga, {
        googleJobsUrl,
        searchQuery: config.searchQuery,
      })
    );
}

module.exports = {
  buscarVagasGoogle,
};
