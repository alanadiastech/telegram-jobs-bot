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

function gerarChavesDedupe(parsedJob) {
  const tituloSlug = slug(parsedJob.titulo);
  const empresaSlug = slug(parsedJob.empresa);
  const localSlug = slug(parsedJob.local);
  const chaves = [parsedJob.id];

  if (tituloSlug && empresaSlug) {
    chaves.push(["vaga", tituloSlug, empresaSlug].join("|"));
  }

  if (tituloSlug && empresaSlug && localSlug) {
    chaves.push(["vaga", tituloSlug, empresaSlug, localSlug]
      .map(slug)
      .filter(Boolean)
      .join("|"));
  }

  return Array.from(new Set(chaves.filter(Boolean)));
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

function extrairSenioridade(vaga) {
  const texto = [
    vaga.title,
    vaga.job_title,
    vaga.description,
    ...(vaga.extensions || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/j[uú]nior|junior|\bjr\b/.test(texto)) return "Junior";
  if (/trainee/.test(texto)) return "Trainee";
  if (/est[aá]gio|estagio|intern/.test(texto)) return "Estagio";
  if (/pleno/.test(texto)) return "Pleno";
  if (/s[eê]nior|senior|\bsr\b/.test(texto)) return "Senior";

  return "Nao informado";
}

function calcularPrioridade(parsedJob) {
  const senioridadeJunior =
    parsedJob.senioridade === "Junior" ||
    parsedJob.senioridade === "Trainee" ||
    parsedJob.senioridade === "Estagio";
  const remoto = parsedJob.modelo === "Remoto";

  if (remoto && senioridadeJunior) return 3;
  if (remoto) return 2;
  if (senioridadeJunior) return 1;

  return 0;
}

function parseJob(vaga, context) {
  const parsedJob = {
    id: gerarFingerprint(vaga),
    titulo: normalizarTexto(vaga.title),
    empresa: normalizarTexto(vaga.company_name),
    local: normalizarTexto(vaga.location),
    modelo: extrairModelo(vaga),
    senioridade: extrairSenioridade(vaga),
    publicado: normalizarTexto(
      vaga.detected_extensions?.posted_at ||
        (vaga.extensions || []).find((item) => /ago|hora|dia|semana|mes/i.test(item)),
      "Nao informado"
    ),
    link: extrairLink(vaga, context.googleJobsUrl, context.searchQuery),
  };

  parsedJob.dedupeKeys = gerarChavesDedupe(parsedJob);
  parsedJob.prioridade = calcularPrioridade(parsedJob);

  return parsedJob;
}

module.exports = {
  calcularPrioridade,
  gerarChavesDedupe,
  extrairSenioridade,
  parseJob,
  vagaEhDoBrasil,
};
