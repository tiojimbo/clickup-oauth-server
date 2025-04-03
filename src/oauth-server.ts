import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const FRONTEND_URL = process.env.FRONTEND_URL;

// ✅ Rota de redirecionamento padrão (substitui /callback)
app.get("/", async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send("Código de autorização ausente.");
  }

  // ✅ Logs de verificação
  console.log("CLIENT_ID:", CLIENT_ID);
  console.log("CLIENT_SECRET:", CLIENT_SECRET);
  console.log("REDIRECT_URI:", REDIRECT_URI);
  console.log("CODE:", code);

  try {
    const response = await fetch("https://api.clickup.com/api/v2/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    const data = await response.json();

    if (data.access_token) {
      const redirectUrl = `${FRONTEND_URL}?code=${code}`;
      res.redirect(redirectUrl);
    } else {
      res.status(500).json({ error: "Erro ao obter token", details: data });
    }
  } catch (err) {
    console.error("Erro no redirecionamento inicial:", err);
    res.status(500).json({ error: "Erro no servidor de autenticação." });
  }
});


// ✅ Rota POST para troca de code por token (usada pelo frontend)
app.post("/auth/token", async (req, res) => {
  const { code } = req.body;

  try {
    const response = await fetch("https://api.clickup.com/api/v2/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Erro ao trocar código por token:", err);
    res.status(500).json({ error: "Erro ao trocar código por token." });
  }
});

// ✅ Rota proxy para contornar CORS e retornar equipes
app.get("/api/team", async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token de autenticação ausente ou inválido." });
  }

  const accessToken = authHeader.replace("Bearer ", "");

  try {
    const response = await fetch("https://api.clickup.com/api/v2/team", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).send(errorText);
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Erro ao buscar dados da API do ClickUp:", err);
    res.status(500).json({ error: "Erro interno no servidor proxy." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`OAuth server rodando em http://localhost:${PORT}`);
});
