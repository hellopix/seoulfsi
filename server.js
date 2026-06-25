import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "0.0.0.0";
const ROOT = process.cwd();
const PUBLIC = join(ROOT, "public");

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

function send(res, status, body, type = "text/plain; charset=utf-8") {
  res.writeHead(status, { "content-type": type, "cache-control": "no-store" });
  res.end(body);
}

async function proxySeoulRisk(res) {
  try {
    const upstream = await fetch("https://poisonmap.mfds.go.kr/api/risk.do", {
      headers: {
        "referer": "https://poisonmap.mfds.go.kr/main.do",
        "user-agent": "Mozilla/5.0"
      }
    });

    if (!upstream.ok) {
      send(res, upstream.status, JSON.stringify({ ok: false, message: `upstream error: ${upstream.status}` }), "application/json; charset=utf-8");
      return;
    }

    const json = await upstream.json();
    if (Array.isArray(json.data)) {
      json.data = json.data.slice(0, 26).filter(row => row && row.sd === "서울특별시");
    }
    send(res, 200, JSON.stringify(json), "application/json; charset=utf-8");
  } catch (error) {
    send(res, 500, JSON.stringify({ ok: false, message: error.message }), "application/json; charset=utf-8");
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (url.pathname === "/api/seoul-risk") {
    await proxySeoulRisk(res);
    return;
  }

  const requested = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const filePath = normalize(join(PUBLIC, requested));

  if (!filePath.startsWith(PUBLIC)) {
    send(res, 403, "Forbidden");
    return;
  }

  try {
    const body = await readFile(filePath);
    send(res, 200, body, types[extname(filePath)] || "application/octet-stream");
  } catch {
    send(res, 404, "Not found");
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Server running: http://localhost:${PORT}`);
});
