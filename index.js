const axios = require("axios");

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const SERPAPI_KEY = process.env.SERPAPI_KEY;
const SEARCH_QUERY =
  process.env.SEARCH_QUERY || "desenvolvedor de software brasil";
const SEARCH_LOCATION = process.env.SEARCH_LOCATION || "Brazil";
const MAX_JOBS = Number(process.env.MAX_JOBS || 5);
const DRY_RUN = process.env.DRY_RUN === "true";
const SHORTEN_URLS = process.env.SHORTEN_URLS !== "false";
const TERMOS_BRASIL = [
  "brasil",
  "brazil",
  "sao paulo",
  "rio de janeiro",
  "belo horizonte",
  "curitiba",
  "porto alegre",
  "recife",
  "fortaleza",
  "salvador",
  "brasilia",
  "goiania",
  "manaus",
  "florianopolis",
  "campinas",
  "parana",
  "santa catarina",
  "rio grande do sul",
  "minas gerais",
  "bahia",
  "pernambuco",
  "ceara",
  "goias",
  "distrito federal",
  "espirito santo",
  "mato grosso",
  "mato grosso do sul",
  "para",
  "amazonas",
  "maranhao",
  "paraiba",
  "rio grande do norte",
  "sergipe",
  "piaui",
  "alagoas",
  "tocantins",
  "rondonia",
  "acre",
  "amapa",
  "roraima",
];
const TERMOS_FORA_BRASIL = [
  "united states",
  "usa",
  "canada",
  "mexico",
  "argentina",
  "chile",
  "portugal",
  "spain",
  "germany",
  "france",
  "italy",
  "united kingdom",
  "uk",
  "europe",
  "india",
];

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function normalizarTexto(value, fallback = "Nao informado") {
  if (!value) return fallback;
  return String(value).trim();
}

function vagaEhDoBrasil(vaga) {
  const texto = [
    vaga.location,
    ...(vaga.extensions || []),
    ...(vaga.detected_extensions
      ? Object.values(vaga.detected_extensions)
      : []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (TERMOS_BRASIL.some((termo) => texto.includes(termo))) {
    return true;
  }

  if (TERMOS_FORA_BRASIL.some((termo) => texto.includes(termo))) {
    return false;
  }

  return true;
}

function extrairLink(vaga, fallback) {
  if (vaga.share_link) return vaga.share_link;

  const linkRelacionado =
    vaga.related_links &&
    vaga.related_links.find((item) => item.link && item.text);

  if (linkRelacionado) return linkRelacionado.link;

  if (vaga.job_id) {
    const query = encodeURIComponent(SEARCH_QUERY);
    return `https://www.google.com/search?q=${query}&ibp=htl;jobs#htivrt=jobs&htidocid=${encodeURIComponent(
      vaga.job_id
    )}`;
  }

  return fallback;
}

async function buscarVagasGoogle() {
  if (!SERPAPI_KEY) {
    throw new Error("Defina a variavel SERPAPI_KEY para consultar o Google Jobs.");
  }

  const { data } = await axios.get("https://serpapi.com/search.json", {
    params: {
      engine: "google_jobs",
      api_key: SERPAPI_KEY,
      q: SEARCH_QUERY,
      location: SEARCH_LOCATION,
      hl: "pt-br",
      gl: "br",
      no_cache: true,
    },
  });

  const vagas = Array.isArray(data.jobs_results) ? data.jobs_results : [];
  const googleJobsUrl =
    data.search_metadata?.google_jobs_url ||
    `https://www.google.com/search?q=${encodeURIComponent(SEARCH_QUERY)}&udm=8&gl=br&hl=pt-BR`;

  return vagas
    .filter(vagaEhDoBrasil)
    .slice(0, MAX_JOBS)
    .map((vaga) => ({
      titulo: normalizarTexto(vaga.title),
      empresa: normalizarTexto(vaga.company_name),
      local: normalizarTexto(vaga.location),
      modelo: normalizarTexto(
        (vaga.extensions || []).find((item) =>
          /remoto|hybrid|hibrido|presencial/i.test(item)
        ),
        "Nao informado"
      ),
      publicado: normalizarTexto(
        vaga.detected_extensions?.posted_at ||
          (vaga.extensions || []).find((item) => /ago|hora|dia|semana|mes/i.test(item)),
        "Nao informado"
      ),
      link: extrairLink(vaga, googleJobsUrl),
    }));
}

async function encurtarUrl(url) {
  if (!SHORTEN_URLS || !url) {
    return url;
  }

  try {
    const { data } = await axios.get("https://is.gd/create.php", {
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

function montarMensagem(vaga) {
  return [
    "<b>🚀 Vaga em TI no Brasil</b>",
    "",
    `<b>Cargo:</b> ${escapeHtml(vaga.titulo)}`,
    `<b>Empresa:</b> ${escapeHtml(vaga.empresa)}`,
    `<b>Local:</b> ${escapeHtml(vaga.local)}`,
    `<b>Modelo:</b> ${escapeHtml(vaga.modelo)}`,
    `<b>Publicada:</b> ${escapeHtml(vaga.publicado)}`,
    "",
    `<b>Candidatura:</b> ${escapeHtml(vaga.link)}`,
    "",
    "#Vagas #TI #Brasil",
  ].join("\n");
}

async function enviarTelegram(msg) {
  await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    chat_id: CHAT_ID,
    text: msg,
    parse_mode: "HTML",
    disable_web_page_preview: true,
  });
}

function exibirDryRun(vagas) {
  console.log(`DRY_RUN ativo. ${vagas.length} vaga(s) seriam publicadas:\n`);

  vagas.forEach((vaga, index) => {
    console.log(`--- Vaga ${index + 1} ---`);
    console.log(montarMensagem(vaga));
    console.log("");
  });
}

async function run() {
  if (!DRY_RUN && (!BOT_TOKEN || !CHAT_ID)) {
    throw new Error("Defina BOT_TOKEN e CHAT_ID antes de executar o bot.");
  }

  const vagas = await buscarVagasGoogle();

  if (vagas.length === 0) {
    console.log("Nenhuma vaga do Brasil encontrada para a busca atual.");
    return;
  }

  for (const vaga of vagas) {
    vaga.link = await encurtarUrl(vaga.link);
  }

  if (DRY_RUN) {
    exibirDryRun(vagas);
    return;
  }

  for (const vaga of vagas) {
    await enviarTelegram(montarMensagem(vaga));
  }
}

run().catch((error) => {
  const detalhe = error.response?.data || error.message;
  console.error("Falha ao executar o bot:", detalhe);
  process.exit(1);
});
