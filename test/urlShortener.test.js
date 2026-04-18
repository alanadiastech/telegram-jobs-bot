const test = require("node:test");
const assert = require("node:assert/strict");

const { encurtarUrl } = require("../src/services/urlShortener");

test("encurtarUrl retorna original quando shortenUrls esta desativado", async () => {
  const url = await encurtarUrl("https://example.com", { shortenUrls: false });
  assert.equal(url, "https://example.com");
});

test("encurtarUrl usa retorno do encurtador quando valido", async () => {
  const client = {
    async get() {
      return { data: "https://is.gd/abc123" };
    },
  };

  const url = await encurtarUrl(
    "https://example.com/vaga",
    { shortenUrls: true },
    client
  );

  assert.equal(url, "https://is.gd/abc123");
});

test("encurtarUrl faz fallback para original quando encurtador falha", async () => {
  const client = {
    async get() {
      throw new Error("falhou");
    },
  };

  const url = await encurtarUrl(
    "https://example.com/vaga",
    { shortenUrls: true },
    client
  );

  assert.equal(url, "https://example.com/vaga");
});
