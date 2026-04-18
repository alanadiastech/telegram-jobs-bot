const { run } = require("./src/main");

run().catch((error) => {
  const detalhe = error.response?.data || error.message;
  console.error("Falha ao executar o bot:", detalhe);
  process.exit(1);
});
