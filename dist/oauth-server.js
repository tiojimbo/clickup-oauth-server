"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const node_fetch_1 = __importDefault(require("node-fetch"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const CLIENT_ID = process.env.CLICKUP_CLIENT_ID;
const CLIENT_SECRET = process.env.CLICKUP_CLIENT_SECRET;
const REDIRECT_URI = process.env.CLICKUP_REDIRECT_URI;
// ✅ Endpoint para trocar o código por um access_token
app.post("/auth/token", async (req, res) => {
    const { code } = req.body;
    if (!code)
        return res.status(400).json({ error: "Authorization code is required" });
    try {
        const response = await (0, node_fetch_1.default)("https://api.clickup.com/api/v2/oauth/token", {
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
            res.status(200).json(data);
        }
        else {
            res.status(400).json({ error: "Failed to get token", details: data });
        }
    }
    catch (error) {
        res.status(500).json({ error: "Server error", details: error });
    }
});
// ✅ Novo endpoint para redirecionamento do ClickUp após login
app.get("/callback", (req, res) => {
    const code = req.query.code;
    if (!code) {
        return res.status(400).send("Código de autorização não fornecido.");
    }
    // Redireciona para o painel da extensão com o código
    res.redirect(`http://localhost:5173/?code=${code}`);
});
