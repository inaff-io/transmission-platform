import "dotenv/config.js";

async function sendTestMessages() {
  const authToken = process.argv[2];
  if (!authToken) {
    console.error("Erro: authToken não fornecido. Passe o token como um argumento de linha de comando.");
    process.exit(1);
  }

  const url = "http://localhost:3002/api/chat/messages";
  const totalMessages = 1000;

  console.log(`Enviando ${totalMessages} mensagens de teste...`);

  for (let i = 1; i <= totalMessages; i++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `authToken=${authToken}`,
        },
        body: JSON.stringify({ message: `Mensagem de teste ${i}` }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(
          `Erro ao enviar a mensagem ${i}: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`
        );
      } else {
        console.log(`Mensagem ${i} enviada com sucesso.`);
      }
    } catch (error) {
      console.error(`Erro ao enviar a mensagem ${i}:`, error.message);
    }
    // Adiciona um pequeno atraso para não sobrecarregar o servidor
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  console.log("Envio de mensagens de teste concluído.");
}

sendTestMessages();