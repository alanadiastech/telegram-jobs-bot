const axios = require("axios");
const { parseCourse } = require("../parsers/courseParser");

async function buscarCursosGratuitos(config, client = axios) {
  const { data } = await client.get("https://serpapi.com/search.json", {
    params: {
      engine: "google",
      api_key: config.serpApiKey,
      q: config.coursesQuery,
      location: config.searchLocation,
      hl: "pt-br",
      gl: "br",
      num: 10,
    },
  });

  const resultados = Array.isArray(data.organic_results) ? data.organic_results : [];

  return resultados
    .filter((resultado) => {
      const texto = [
        resultado.title,
        resultado.snippet,
        resultado.source,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        texto.includes("curso") &&
        (texto.includes("gratuito") ||
          texto.includes("grátis") ||
          texto.includes("gratis") ||
          texto.includes("free"))
      );
    })
    .map(parseCourse)
    .filter((curso) => curso.id && curso.link)
    .slice(0, config.maxCourses);
}

module.exports = {
  buscarCursosGratuitos,
};
