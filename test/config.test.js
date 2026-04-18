const test = require("node:test");
const assert = require("node:assert/strict");

const { createConfig, validateConfig } = require("../src/config");

test("createConfig aplica defaults e conversions", () => {
  const config = createConfig({
    SERPAPI_KEY: "key",
    CONTENT_TYPE: "courses",
    MAX_JOBS: "7",
    MAX_COURSES: "3",
    MAX_HISTORY: "123",
    DRY_RUN: "true",
    SHORTEN_URLS: "false",
  });

  assert.equal(config.contentType, "courses");
  assert.equal(config.maxJobs, 7);
  assert.equal(config.maxCourses, 3);
  assert.equal(config.maxHistory, 123);
  assert.equal(config.dryRun, true);
  assert.equal(config.shortenUrls, false);
  assert.match(config.stateFile, /\.cache\/posted-courses\.json$/);
});

test("validateConfig exige SERPAPI_KEY", () => {
  assert.throws(
    () => validateConfig({ contentType: "jobs", dryRun: true }),
    /SERPAPI_KEY/
  );
});

test("validateConfig exige BOT_TOKEN e CHAT_ID quando nao esta em dry run", () => {
  assert.throws(
    () => validateConfig({ contentType: "jobs", dryRun: false, serpApiKey: "key" }),
    /BOT_TOKEN e CHAT_ID/
  );
});

test("validateConfig aceita dry run sem credenciais do telegram", () => {
  assert.doesNotThrow(() =>
    validateConfig({ contentType: "jobs", dryRun: true, serpApiKey: "key" })
  );
});

test("validateConfig rejeita content type invalido", () => {
  assert.throws(
    () => validateConfig({ contentType: "invalid", dryRun: true, serpApiKey: "key" }),
    /CONTENT_TYPE/
  );
});
