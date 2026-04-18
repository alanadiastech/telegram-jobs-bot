const sankhyaJob = {
  title: "Desenvolvedor(a) de Software Pleno (Java)",
  company_name: "Sankhya",
  location: "Dois Irmãos, RS",
  share_link: "https://www.google.com/jobs/sankhya",
  extensions: ["há 3 dias", "Tempo integral"],
  detected_extensions: {
    posted_at: "há 3 dias",
    schedule_type: "Tempo integral",
  },
  description:
    "Buscamos um(a) Desenvolvedor(a) de Software Pleno - (Java). " +
    "LOCALIDADE Uberlândia/MG – Presencial São Paulo/SP – Híbrido (2x/semana no escritório) " +
    "Outras localidades – Remoto REGIME DE CONTRATAÇÃO: CLT",
  job_id: "sankhya-job-id",
};

const usJob = {
  title: "Senior Software Engineer",
  company_name: "Acme Inc",
  location: "San Francisco, CA",
  share_link: "https://www.google.com/jobs/acme",
  extensions: ["2 days ago", "Remote"],
  detected_extensions: {
    posted_at: "2 days ago",
  },
  description: "Remote role in the United States.",
  job_id: "us-job-id",
};

const hybridJob = {
  title: "Pessoa Desenvolvedora Backend",
  company_name: "Empresa XPTO",
  location: "São Paulo, SP",
  share_link: "https://www.google.com/jobs/xpto",
  extensions: ["há 1 dia", "Híbrido"],
  detected_extensions: {
    posted_at: "há 1 dia",
  },
  description: "Atuação híbrida em São Paulo.",
  job_id: "hybrid-job-id",
};

module.exports = {
  hybridJob,
  sankhyaJob,
  usJob,
};
