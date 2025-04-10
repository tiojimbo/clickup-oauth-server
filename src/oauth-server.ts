import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: [process.env.FRONTEND_URL || "http://localhost:5173"]
}));

app.use(express.json());


app.get("/", (_req, res) => {
  res.send("Servidor OAuth do ClickUp está no ar ✅");
});

app.post("/auth/token", async (req, res) => {
  const { code } = req.body;
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
    console.log("📦 Dados da ClickUp:", JSON.stringify(data, null, 2));
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
    console.log("✅ [BACKEND] Spaces recebidos da ClickUp:", data.spaces);
    res.json({ spaces: data.spaces });
  } catch (error) {
    console.error("❌ Erro ao buscar spaces:", error);
    res.status(500).json({ error: "Erro ao buscar spaces", details: error });
  }
});

app.get("/api/folders", async (req, res) => {
  const spaceId = req.query.space_id as string;
  const token = req.headers.authorization?.split(" ")[1];

  if (!spaceId || !token) {
    return res.status(400).json({ error: "space_id e token são obrigatórios" });
  }

  try {
    const response = await fetch(`https://api.clickup.com/api/v2/space/${spaceId}/folder`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    console.log("📁 [BACKEND] Folders recebidos:", data.folders);
    res.json({ folders: data.folders });
  } catch (error) {
    console.error("❌ Erro ao buscar folders:", error);
    res.status(500).json({ error: "Erro ao buscar folders", details: error });
  }
});

app.get("/api/lists", async (req, res) => {
  const folderId = req.query.folder_id as string;
  const token = req.headers.authorization?.split(" ")[1];

  if (!folderId || !token) {
    return res.status(400).json({ error: "folder_id e token são obrigatórios" });
  }

  try {
    const response = await fetch(`https://api.clickup.com/api/v2/folder/${folderId}/list`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    console.log("📄 [BACKEND] Lists recebidas:", data.lists);
    res.json({ lists: data.lists });
  } catch (error) {
    console.error("❌ Erro ao buscar lists:", error);
    res.status(500).json({ error: "Erro ao buscar lists", details: error });
  }
});

app.get("/api/tasks/:listId", async (req, res) => {
  const listId = req.params.listId;
  const accessToken = req.headers.authorization;

  console.log("🔑 Token recebido:", accessToken);

  if (!accessToken) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  try {
    const response = await fetch(
      `https://api.clickup.com/api/v2/list/${listId}/task?include_task_type=true`,
      {
        headers: {
          Authorization: accessToken,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Erro ao buscar tarefas");
    }

    const data = await response.json();
    return res.json(data);
  } catch (error) {
    console.error("Erro no endpoint /api/tasks/:listId:", error);
    return res.status(500).json({ error: "Erro ao buscar tarefas" });
  }
});

app.get("/api/task-types/:teamId", async (req, res) => {
  const teamId = req.params.teamId;
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  try {
    const response = await fetch(`https://api.clickup.com/api/v2/team/${teamId}/task_type`, {
      headers: {
        Authorization: token,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("✅ Tipos de tarefa recebidos:", data.task_types);
    return res.json(data.task_types);
  } catch (error) {
    console.error("❌ Erro ao buscar tipos de tarefa:", error);
    return res.status(500).json({ error: "Erro ao buscar tipos de tarefa", details: error });
  }
});


app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});


app.get("/api/tasks", async (req, res) => {
  const listId = req.query.list_id as string;
  const token = req.headers.authorization?.split(" ")[1];

  if (!listId || !token) {
    return res.status(400).json({ error: "list_id e token são obrigatórios" });
  }

  try {
    const response = await fetch(`https://api.clickup.com/api/v2/list/${listId}/task`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    console.log("🧩 [BACKEND] Tarefas recebidas da ClickUp:", data.tasks);
    res.json({ tasks: data.tasks });
  } catch (error) {
    console.error("❌ Erro ao buscar tarefas:", error);
    res.status(500).json({ error: "Erro ao buscar tarefas", details: error });
  }
});
