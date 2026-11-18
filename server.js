const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DB_DIR = path.join(ROOT, "database");
const DB_FILE = path.join(DB_DIR, "mtcars_db.json");

// Garante que a pasta database exista
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Detecta o IP da rede local (Wi-Fi / LAN) para acesso pelo Celular
function getLocalNetworkIP() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "127.0.0.1";
}

const LAN_IP = getLocalNetworkIP();

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

// Carrega ou inicializa o Banco de Dados Persistente em Disco (database/mtcars_db.json)
function readDatabaseFromDisk() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf8");
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn("Aviso ao ler banco em disco:", e.message);
  }
  return null;
}

function writeDatabaseToDisk(snapshot) {
  if (!snapshot) return;
  try {
    const dataToSave = {
      updatedAt: new Date().toISOString(),
      timestamp: Date.now(),
      ...snapshot
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), "utf8");
  } catch (e) {
    console.warn("Aviso ao gravar banco em disco:", e.message);
  }
}

const sseClients = new Set();
let sharedServerState = {
  lastUpdated: Date.now(),
  lastEvent: null,
  snapshot: readDatabaseFromDisk()
};

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  const parsedUrl = req.url.split("?")[0];

  // 1. Endpoint SSE: Stream de Eventos em Tempo Real (PC + Celular + Abas)
  if (parsedUrl === "/api/stream" && req.method === "GET") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive"
    });
    res.write(
      `data: ${JSON.stringify({
        type: "CONNECTED",
        timestamp: Date.now(),
        clientsCount: sseClients.size + 1,
        lanIp: LAN_IP,
        port: PORT,
        snapshot: sharedServerState.snapshot
      })}\n\n`
    );
    sseClients.add(res);

    req.on("close", () => {
      sseClients.delete(res);
    });
    return;
  }

  // 2. Endpoint GET /api/db: Lê o Banco de Dados Persistente + Status de Rede
  if ((parsedUrl === "/api/db" || parsedUrl === "/api/state") && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-cache" });
    return res.end(
      JSON.stringify({
        ok: true,
        lanIp: LAN_IP,
        port: PORT,
        localUrl: `http://localhost:${PORT}`,
        adminUrl: `http://localhost:${PORT}/?view=admin`,
        mobileUrl: `http://${LAN_IP}:${PORT}`,
        mobileAdminUrl: `http://${LAN_IP}:${PORT}/?view=admin`,
        connectedClients: sseClients.size,
        lastUpdated: sharedServerState.lastUpdated,
        snapshot: sharedServerState.snapshot
      })
    );
  }

  // 3. Endpoint POST /api/broadcast: Salva no Banco em Disco + Dispara em Tempo Real para todos
  if (parsedUrl === "/api/broadcast" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        const payload = JSON.parse(body);
        sharedServerState.lastUpdated = Date.now();
        sharedServerState.lastEvent = payload.event || null;
        if (payload.snapshot) {
          sharedServerState.snapshot = payload.snapshot;
          writeDatabaseToDisk(payload.snapshot);
        }

        const msg = `data: ${JSON.stringify(payload)}\n\n`;
        for (const client of sseClients) {
          try {
            client.write(msg);
          } catch (_) {}
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true, clientsNotified: sseClients.size }));
      } catch (e) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    });
    return;
  }

  // 4. Endpoint POST /api/reset: Reseta o Banco em Disco para novo Take de Gravação
  if (parsedUrl === "/api/reset" && req.method === "POST") {
    sharedServerState.snapshot = null;
    try {
      if (fs.existsSync(DB_FILE)) fs.unlinkSync(DB_FILE);
    } catch (_) {}

    const resetMsg = `data: ${JSON.stringify({
      event: {
        id: "evt_reset_" + Date.now(),
        type: "DEMO_RESET",
        timestamp: Date.now()
      }
    })}\n\n`;
    for (const client of sseClients) {
      try {
        client.write(resetMsg);
      } catch (_) {}
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ ok: true }));
  }

  // 5. Arquivos Estáticos da Aplicação
  const safeUrl = decodeURIComponent(parsedUrl);
  const relPath = safeUrl === "/" ? "index.html" : safeUrl.replace(/^\/+/, "");
  const filePath = path.join(ROOT, relPath);

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("Arquivo não encontrado: " + safeUrl);
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
      "Cache-Control": "no-store, no-cache, must-revalidate"
    });
    res.end(content);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("==================================================================");
  console.log(`🚀 SERVIDOR + BANCO DE DADOS MT CARS ATIVO!`);
  console.log(`💻 Link Vitrine (PC):           http://localhost:${PORT}`);
  console.log(`🛡️ Link Painel Vendedores (PC): http://localhost:${PORT}/?view=admin`);
  console.log(`📱 Link no Celular (Wi-Fi):     http://${LAN_IP}:${PORT}`);
  console.log(`🗄️ Banco de Dados em Disco:     ${DB_FILE}`);
  console.log("==================================================================");
});
