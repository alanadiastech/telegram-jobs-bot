const test = require("node:test");
const assert = require("node:assert/strict");

const {
  escapeHtml,
  normalizarModelo,
  normalizarTexto,
  slug,
} = require("../src/utils/text");

test("escapeHtml protege caracteres especiais", () => {
  assert.equal(escapeHtml("<b>Alan & Dias</b>"), "&lt;b&gt;Alan &amp; Dias&lt;/b&gt;");
});

test("normalizarTexto usa fallback quando vazio", () => {
  assert.equal(normalizarTexto("", "Fallback"), "Fallback");
});

test("normalizarModelo reconhece remoto, hibrido e presencial", () => {
  assert.equal(normalizarModelo("100% remoto"), "Remoto");
  assert.equal(normalizarModelo("Modelo híbrido"), "Hibrido");
  assert.equal(normalizarModelo("Atuação presencial"), "Presencial");
});

test("slug remove acentos e caracteres especiais", () => {
  assert.equal(slug("São Paulo / SP"), "sao-paulo-sp");
});
