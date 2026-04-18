const path = require("path");

function parseNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function createConfig(env = process.env) {
  const contentType = env.CONTENT_TYPE || "jobs";

  return {
    botToken: env.BOT_TOKEN,
    chatId: env.CHAT_ID,
    serpApiKey: env.SERPAPI_KEY,
    contentType,
    searchQuery: env.SEARCH_QUERY || "desenvolvedor de software brasil",
    coursesQuery: env.COURSES_QUERY || "curso gratuito ti brasil",
    searchLocation: env.SEARCH_LOCATION || "Brazil",
    maxJobs: parseNumber(env.MAX_JOBS, 5),
    maxCourses: parseNumber(env.MAX_COURSES, 3),
    maxHistory: parseNumber(env.MAX_HISTORY, 500),
    dryRun: env.DRY_RUN === "true",
    shortenUrls: env.SHORTEN_URLS !== "false",
    stateFile:
      env.STATE_FILE ||
      path.join(
        ".cache",
        contentType === "courses" ? "posted-courses.json" : "posted-jobs.json"
      ),
    socialLinkedin:
      env.SOCIAL_LINKEDIN || "https://www.linkedin.com/in/alanadiastech/",
    socialInstagram:
      env.SOCIAL_INSTAGRAM || "https://www.instagram.com/alanadiastech/",
  };
}

function validateConfig(config) {
  if (!["jobs", "courses"].includes(config.contentType)) {
    throw new Error("CONTENT_TYPE deve ser 'jobs' ou 'courses'.");
  }

  if (!config.serpApiKey) {
    throw new Error("Defina a variavel SERPAPI_KEY para consultar o Google Jobs.");
  }

  if (!config.dryRun && (!config.botToken || !config.chatId)) {
    throw new Error("Defina BOT_TOKEN e CHAT_ID antes de executar o bot.");
  }
}

module.exports = {
  createConfig,
  validateConfig,
};
