const axios = require("axios");
const fs = require("fs/promises");
const path = require("path");

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const SERPAPI_KEY = process.env.SERPAPI_KEY;
const SEARCH_QUERY =
  process.env.SEARCH_QUERY || "desenvolvedor de software brasil";
const SEARCH_LOCATION = process.env.SEARCH_LOCATION || "Brazil";
const MAX_JOBS = Number(process.env.MAX_JOBS || 5);
const MAX_HISTORY = Number(process.env.MAX_HISTORY || 500);
const DRY_RUN = process.env.DRY_RUN === "true";
const SHORTEN_URLS = process.env.SHORTEN_URLS !== "false";
const STATE_FILE =
  process.env.STATE_FILE || path.join(".cache", "posted-jobs.json");
const SOCIAL_LINKEDIN =
  process.env.SOCIAL_LINKEDIN || "https://www.linkedin.com/in/alanadiastech/";
const SOCIAL_INSTAGRAM =
  process.env.SOCIAL_INSTAGRAM || "https://www.instagram.com/alanadiastech/";

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

function normalizarModelo(value) {
  const texto = normalizarTexto(value, "").toLowerCase();

  if (/remot/.test(texto)) return "Remoto";
  if (/h[ií]brid/.test(texto)) return "Hibrido";
  if (/presencial/.test(texto)) return "Presencial";

  return "";
}

function slug(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

function gerarFingerprint(vaga) {
  const partes = [
    vaga.job_id,
    vaga.title,
    vaga.company_name,
    vaga.location,
    vaga.share_link,
  ]
    .filter(Boolean)
    .map(slug)
    .filter(Boolean);

  return partes.join("|");
}

function extrairModeloDaDescricao(vaga) {
  const descricao = normalizarTexto(vaga.description, "");

  if (!descricao) return "";

  const matches = [
    ...descricao.matchAll(
      /([A-Za-zÀ-ÿ0-9/(),.\s]+?)\s*[–-]\s*(Presencial|Híbrido|Hibrido|Remoto)/gi
    ),
  ];

  if (matches.length === 0) return "";

  const locationSlug = slug(vaga.location);
  let fallbackOutrasLocalidades = "";
  const modelosEncontrados = new Set();

  for (const match of matches) {
    const local = normalizarTexto(match[1], "");
    const modelo = normalizarModelo(match[2]);

    if (!modelo) continue;

    modelosEncontrados.add(modelo);

    const localSlug = slug(local);

    if (localSlug.includes("outras-localidades")) {
      fallbackOutrasLocalidades = modelo;
      continue;
    }

    if (locationSlug && (localSlug.includes(locationSlug) || locationSlug.includes(localSlug))) {
      return modelo;
    }
  }

  if (fallbackOutrasLocalidades) {
    return fallbackOutrasLocalidades;
  }

  if (modelosEncontrados.size === 1) {
    return Array.from(modelosEncontrados)[0];
  }

  return Array.from(modelosEncontrados).join(" / ");
}

function extrairModelo(vaga) {
  const modeloDasExtensoes = normalizarModelo(
    (vaga.extensions || []).find((item) =>
      /remot|hybrid|h[ií]brid|presencial/i.test(item)
    )
  );

  if (modeloDasExtensoes) {
    return modeloDasExtensoes;
  }

  const modeloDaDescricao = extrairModeloDaDescricao(vaga);

  if (modeloDaDescricao) {
    return modeloDaDescricao;
  }

  return "Nao informado";
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
    .map((vaga) => ({
      id: gerarFingerprint(vaga),
      titulo: normalizarTexto(vaga.title),
      empresa: normalizarTexto(vaga.company_name),
      local: normalizarTexto(vaga.location),
      modelo: extrairModelo(vaga),
      publicado: normalizarTexto(
        vaga.detected_extensions?.posted_at ||
          (vaga.extensions || []).find((item) => /ago|hora|dia|semana|mes/i.test(item)),
        "Nao informado"
      ),
      link: extrairLink(vaga, googleJobsUrl),
    }));
}

async function carregarHistorico() {
  try {
    const conteudo = await fs.readFile(STATE_FILE, "utf8");
    const parsed = JSON.parse(conteudo);

    if (Array.isArray(parsed.ids)) {
      return new Set(parsed.ids.filter(Boolean));
    }
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.warn("Nao foi possivel ler o historico:", error.message);
    }
  }

  return new Set();
}

async function salvarHistorico(ids) {
  const diretorio = path.dirname(STATE_FILE);
  await fs.mkdir(diretorio, { recursive: true });

  const payload = {
    ids: Array.from(ids).slice(-MAX_HISTORY),
    updated_at: new Date().toISOString(),
  };

  await fs.writeFile(STATE_FILE, JSON.stringify(payload, null, 2));
}

function filtrarVagasNovas(vagas, historico) {
  return vagas.filter((vaga) => vaga.id && !historico.has(vaga.id)).slice(0, MAX_JOBS);
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
    "<i>Oportunidade para a comunidade tech brasileira</i>",
    "",
    "━━━━━━━━━━━━━━",
    `<b>💼 Cargo</b>\n${escapeHtml(vaga.titulo)}`,
    "",
    `<b>🏢 Empresa</b>\n${escapeHtml(vaga.empresa)}`,
    "",
    `<b>📍 Local</b>\n${escapeHtml(vaga.local)}`,
    "",
    `<b>🧭 Modelo</b>\n${escapeHtml(vaga.modelo)}`,
    "",
    `<b>🕒 Publicada</b>\n${escapeHtml(vaga.publicado)}`,
    "",
    "━━━━━━━━━━━━━━",
    "<b>📲 Alan Dias Tech</b>",
    '<a href="' +
      escapeHtml(SOCIAL_LINKEDIN) +
      '">LinkedIn</a> • <a href="' +
      escapeHtml(SOCIAL_INSTAGRAM) +
      '">Instagram</a>',
  ].join("\n");
}

async function enviarTelegram(vaga) {
  await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    chat_id: CHAT_ID,
    text: montarMensagem(vaga),
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: {
      inline_keyboard: [
        [{ text: "Ver vaga e candidatar-se", url: vaga.link }],
      ],
    },
  });
}

function exibirDryRun(vagas) {
  console.log(`DRY_RUN ativo. ${vagas.length} vaga(s) seriam publicadas:\n`);

  for (const [index, vaga] of vagas.entries()) {
    console.log(`--- Vaga ${index + 1} ---`);
    console.log(montarMensagem(vaga));
    console.log(`Link: ${vaga.link}`);
    console.log("");
  }
}

async function run() {
  if (!DRY_RUN && (!BOT_TOKEN || !CHAT_ID)) {
    throw new Error("Defina BOT_TOKEN e CHAT_ID antes de executar o bot.");
  }

  const historico = await carregarHistorico();
  const vagas = await buscarVagasGoogle();
  const vagasNovas = filtrarVagasNovas(vagas, historico);

  if (vagas.length === 0) {
    await salvarHistorico(historico);
    console.log("Nenhuma vaga do Brasil encontrada para a busca atual.");
    return;
  }

  if (vagasNovas.length === 0) {
    await salvarHistorico(historico);
    console.log("Nenhuma vaga nova encontrada. Nada sera publicado.");
    return;
  }

  for (const vaga of vagasNovas) {
    vaga.link = await encurtarUrl(vaga.link);
  }

  if (DRY_RUN) {
    exibirDryRun(vagasNovas);
    return;
  }

  for (const vaga of vagasNovas) {
    await enviarTelegram(vaga);
    historico.add(vaga.id);
  }

  await salvarHistorico(historico);
}

run().catch((error) => {
  const detalhe = error.response?.data || error.message;
  console.error("Falha ao executar o bot:", detalhe);
  process.exit(1);
});
