const test = require("node:test");
const assert = require("node:assert/strict");

const { createConfig, validateConfig } = require("../src/config");

test("createConfig aplica defaults e conversions", () => {
  const config = createConfig({
    SERPAPI_KEY: "key",
    MAX_JOBS: "7",
    MAX_HISTORY: "123",
    DRY_RUN: "true",
    SHORTEN_URLS: "false",
  });

  assert.equal(config.maxJobs, 7);
  assert.equal(config.maxHistory, 123);
  assert.equal(config.dryRun, true);
  assert.equal(config.shortenUrls, false);
  assert.match(config.stateFile, /\.cache\/posted-jobs\.json$/);
});

test("validateConfig exige SERPAPI_KEY", () => {
  assert.throws(() => validateConfig({ dryRun: true }), /SERPAPI_KEY/);
});

test("validateConfig exige BOT_TOKEN e CHAT_ID quando nao esta em dry run", () => {
  assert.throws(
    () => validateConfig({ dryRun: false, serpApiKey: "key" }),
    /BOT_TOKEN e CHAT_ID/
  );
});

test("validateConfig aceita dry run sem credenciais do telegram", () => {
  assert.doesNotThrow(() =>
    validateConfig({ dryRun: true, serpApiKey: "key" })
  );
});
