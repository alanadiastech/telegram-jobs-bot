const {
  normalizarModelo,
  normalizarTexto,
  slug,
} = require("../utils/text");

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

function vagaEhDoBrasil(vaga) {
  const texto = [
    vaga.location,
    vaga.description,
    ...(vaga.extensions || []),
    ...(vaga.detected_extensions ? Object.values(vaga.detected_extensions) : []),
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

function extrairLink(vaga, fallback, searchQuery) {
  if (vaga.share_link) return vaga.share_link;

  const linkRelacionado =
    vaga.related_links &&
    vaga.related_links.find((item) => item.link && item.text);

  if (linkRelacionado) return linkRelacionado.link;

  if (vaga.job_id) {
    const query = encodeURIComponent(searchQuery);
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

function parseJob(vaga, context) {
  return {
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
    link: extrairLink(vaga, context.googleJobsUrl, context.searchQuery),
  };
}

module.exports = {
  parseJob,
  vagaEhDoBrasil,
};
