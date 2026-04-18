const axios = require("axios");

async function encurtarUrl(url, config, client = axios) {
  if (!config.shortenUrls || !url) {
    return url;
  }

  try {
    const { data } = await client.get("https://is.gd/create.php", {
      params: {
        format: "simple",
        url,
      },
      timeout: 10000,
    });

    if (typeof data === "string" && data.startsWith("https://")) {
      return data.trim();
    }
  } catch (error) {
    console.warn("Nao foi possivel encurtar a URL:", error.message);
  }

  return url;
}

module.exports = {
  encurtarUrl,
};
