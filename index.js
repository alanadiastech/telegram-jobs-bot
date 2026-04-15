const axios = require("axios");

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

// RSS simples (vagas remotas)
const RSS_URL = "https://remotive.com/remote-jobs/feed";

async function buscarVagas() {
  const res = await axios.get(RSS_URL);
  return res.data;
}

function montarMensagem() {
  return `
🚀 VAGA EM TI

🏢 Empresa: Exemplo Tech
📍 Local: Remoto
💻 Modelo: Remoto
🎯 Nível: Júnior

🧠 Requisitos:
- React
- TypeScript

🔗 Candidatar-se:
https://exemplo.com

#TI #Vagas #Tech
`;
}

async function enviarTelegram(msg) {
  await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    chat_id: CHAT_ID,
    text: msg,
    parse_mode: "Markdown"
  });
}

async function run() {
  await buscarVagas(); 
  const msg = montarMensagem();
  await enviarTelegram(msg);
}

run();