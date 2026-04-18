const test = require("node:test");
const assert = require("node:assert/strict");

const { buscarCursosGratuitos } = require("../src/providers/freeCourses");

test("buscarCursosGratuitos retorna apenas cursos gratuitos com link", async () => {
  const client = {
    async get() {
      return {
        data: {
          organic_results: [
            {
              title: "Curso gratuito de Python",
              source: "Fundacao Bradesco",
              snippet: "Curso gratuito para iniciantes em Python.",
              link: "https://example.com/python",
            },
            {
              title: "MBA em TI",
              source: "Universidade XPTO",
              snippet: "Pos-graduacao paga",
              link: "https://example.com/mba",
            },
          ],
        },
      };
    },
  };

  const cursos = await buscarCursosGratuitos(
    {
      serpApiKey: "key",
      coursesQuery: "curso gratuito ti brasil",
      searchLocation: "Brazil",
      maxCourses: 3,
    },
    client
  );

  assert.equal(cursos.length, 1);
  assert.equal(cursos[0].titulo, "Curso gratuito de Python");
});
