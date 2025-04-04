import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Endpoint de callback após autenticação
app.get("/callback", async (req, res) => {
  const code = req.query.code as string;

  if (!code) {
    return res.status(400).json({ error: "Código de autorização ausente" });
  }

  try {
    const response = await fetch("https://api.clickup.com/api/v2/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        code,
      }),
    });

    const data = await response.json();
    console.log("🔐 [BACKEND] Access Token recebido:", data);
    return res.json(data);
  } catch (error) {
    console.error("❌ [BACKEND] Erro ao trocar código por token:", error);
    return res.status(500).json({ error: "Erro ao obter access token" });
  }
});

// Endpoint para buscar spaces de um time (proxy da API do ClickUp para evitar CORS)
app.get("/api/spaces", async (req, res) => {
  const teamId = req.query.team_id as string;
  const token = req.headers.authorization;

  if (!teamId || !token) {
    return res.status(400).json({ error: "team_id e token são obrigatórios" });
  }

  try {
    const response = await fetch(`https://api.clickup.com/api/v2/team/${teamId}/space`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    res.json({ spaces: data.spaces || [] });
  } catch (err) {
    console.error("Erro ao buscar espaços:", err);
    res.status(500).json({ error: "Erro ao buscar espaços" });
  }
});


app.listen(port, () => {
  console.log(`🚀 Servidor OAuth2 rodando em http://localhost:${port}`);
});
