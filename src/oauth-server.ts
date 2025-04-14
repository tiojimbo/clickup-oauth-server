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

app.get("/api/tasks/details/:taskId", async (req, res) => {
  const taskId = req.params.taskId;
  const accessToken = req.headers.authorization;

  if (!accessToken) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  try {
    const response = await fetch(`https://api.clickup.com/api/v2/task/${taskId}`, {
      headers: {
        Authorization: accessToken,
      },
    });

    if (!response.ok) {
      throw new Error("Erro ao buscar detalhes da tarefa");
    }

    const task = await response.json();
    return res.json(task);
  } catch (error) {
    console.error("❌ Erro no endpoint /api/tasks/details/:taskId:", error);
    return res.status(500).json({ error: "Erro ao buscar detalhes da tarefa" });
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

app.get("/api/lists/:listId", async (req, res) => {
  const { listId } = req.params;
  const accessToken = req.headers.authorization?.replace("Bearer ", "");

  if (!accessToken) {
    return res.status(401).json({ error: "Access token ausente" });
  }

  try {
    const response = await fetch(`https://api.clickup.com/api/v2/list/${listId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Erro ao buscar dados da lista:", errorText);
      return res.status(response.status).json({ error: "Erro ao buscar dados da lista", details: errorText });
    }

    const data = await response.json();
    console.log("✅ Dados da lista recebidos:", data);

    return res.json(data.statuses || []);
  } catch (error) {
    console.error("❌ Erro inesperado ao buscar dados da lista:", error);
    return res.status(500).json({ error: "Erro inesperado ao buscar dados da lista", details: error });
  }
});


app.get("/api/tasks/details/:taskId", async (req, res) => {
  const taskId = req.params.taskId;
  const accessToken = req.headers.authorization?.replace("Bearer ", "");

  if (!accessToken) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  try {
    // Buscar a tarefa
    const taskResponse = await fetch(`https://api.clickup.com/api/v2/task/${taskId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!taskResponse.ok) throw new Error("Erro ao buscar detalhes da tarefa");
    const task = await taskResponse.json();
    console.log("📦 Tarefa carregada:", JSON.stringify(task.custom_fields, null, 2));

    // Enriquecer campos personalizados
    const enrichedFields = await Promise.all(
      (task.custom_fields || []).map(async (field: any) => {
        const type = field.type;

        // Enriquecimento de campos com opções (dropdown, label)
        if (["dropdown", "drop_down", "label", "labels"].includes(type)) {
          try {
            const defResponse = await fetch(`https://api.clickup.com/api/v2/field/${field.id}`, {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            const def = await defResponse.json();
            const options = def?.type_config?.options || [];

            if (Array.isArray(field.value)) {
              field.value = field.value.map((id: string) => {
                const opt = options.find((o: any) => o.id === id || o.orderindex === id);
                return opt ? { id, label: opt.label } : { id, label: id };
              });
            } else {
              const opt = options.find((o: any) => o.id === field.value || o.orderindex === field.value);
              field.value = opt ? { id: field.value, label: opt.label } : field.value;
            }
          } catch (err) {
            console.warn(`⚠️ Falha ao enriquecer ${field.name}:`, err);
          }
        }

        // Enriquecimento de campos de relação com tarefas
        if (["relation", "list_relationship", "task"].includes(type)) {
          if (Array.isArray(field.value)) {
            field.value = await Promise.all(
              field.value.map(async (item: any) => {
                const id = item.id || item;
                try {
                  const taskRes = await fetch(`https://api.clickup.com/api/v2/task/${id}`, {
                    headers: { Authorization: `Bearer ${accessToken}` },
                  });
                  const taskData = await taskRes.json();
                  return { id, name: taskData?.name || id };
                } catch {
                  return { id, name: id };
                }
              })
            );
          } else if (field.value?.id) {
            try {
              const taskRes = await fetch(`https://api.clickup.com/api/v2/task/${field.value.id}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
              });
              const taskData = await taskRes.json();
              field.value.name = taskData?.name || field.value.id;
            } catch {
              field.value.name = field.value.id;
            }
          }
        }

        // Os demais tipos não exigem enriquecimento
        console.log(`🧠 Campo enriquecido: ${field.name}`, JSON.stringify(field.value, null, 2));
        
        return field;
      })
    );

    task.custom_fields = enrichedFields;
    return res.json(task);
  } catch (error) {
    console.error("❌ Erro ao buscar/enriquecer detalhes da tarefa:", error);
    return res.status(500).json({ error: "Erro ao buscar detalhes da tarefa" });
  }
});

app.get("/api/fields/:fieldId", async (req, res) => {
  const fieldId = req.params.fieldId;
  const accessToken = req.headers.authorization?.replace("Bearer ", "");

  if (!accessToken) {
    return res.status(401).json({ error: "Token não fornecido" });
  }

  try {
    const response = await fetch(`https://api.clickup.com/api/v2/field/${fieldId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) throw new Error("Erro ao buscar o campo");

    const fieldData = await response.json();

    console.info(`📦 Dados do campo ${fieldId}:`, JSON.stringify(fieldData, null, 2));

    res.json(fieldData);
  } catch (error) {
    console.error("❌ Erro ao buscar campo personalizado:", error);
    res.status(500).json({ error: "Erro ao buscar campo personalizado" });
  }
});

