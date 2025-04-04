import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (_, res) => {
  res.send("Servidor OAuth do ClickUp está no ar ✅");
});

app.post("/auth/token", async (req, res) => {
  const code = req.body.code;
  if (!code) return res.status(400).json({ error: "Código não fornecido" });

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
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Erro ao obter token", details: error });
  }
});

app.get("/api/spaces", async (req, res) => {
  const teamId = req.query.team_id as string;
  const token = req.headers.authorization?.split(" ")[1];

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

    console.log("✅ [BACKEND] Spaces recebidos da ClickUp:", data?.spaces); // LOG ÚTIL

    res.json({ spaces: data.spaces }); // 🔥 ESSA LINHA FOI O QUE FALTAVA
  } catch (error) {
    console.error("❌ Erro ao buscar spaces:", error);
    res.status(500).json({ error: "Erro ao buscar spaces", details: error });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor OAuth rodando na porta ${PORT}`);
});
