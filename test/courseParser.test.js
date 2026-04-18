const test = require("node:test");
const assert = require("node:assert/strict");

const { parseCourse } = require("../src/parsers/courseParser");

test("parseCourse normaliza curso gratuito", () => {
  const curso = parseCourse({
    title: "Curso Gratuito de Java",
    source: "Coursera",
    snippet: "Aprenda Java do zero gratuitamente.",
    link: "https://example.com/java",
  });

  assert.equal(curso.tipo, "curso");
  assert.equal(curso.titulo, "Curso Gratuito de Java");
  assert.equal(curso.plataforma, "Coursera");
  assert.equal(curso.link, "https://example.com/java");
  assert.match(curso.id, /curso-gratuito-de-java/);
});
