import "dotenv/config.js";

async function getAuthToken() {
  const email = "loadtestuser@example.com";
  const url = "http://localhost:3002/api/auth/login";

  console.log(`Tentando obter o authToken para o usuário: ${email}`);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Falha ao fazer login: ${response.status} ${
          response.statusText
        } - ${JSON.stringify(errorData)}`
      );
    }

    const cookies = response.headers.get("set-cookie");
    if (!cookies) {
      throw new Error("O cabeçalho set-cookie não foi encontrado na resposta.");
    }

    const authTokenCookie = cookies
      .split(";")
      .find((c) => c.trim().startsWith("authToken="));

    if (!authTokenCookie) {
      throw new Error("O cookie authToken não foi encontrado.");
    }

    const authToken = authTokenCookie.split("=")[1];
    console.log("Login bem-sucedido!");
    console.log("AuthToken:", authToken);

    return authToken;
  } catch (error) {
    console.error("Erro ao obter o authToken:", error);
    process.exit(1);
  }
}

getAuthToken();