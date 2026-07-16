// Cloudflare Worker — прокси к Claude API с CORS.
// 1. Dashboard → Workers → Create Worker → вставить этот код.
// 2. Settings → Variables → добавить секрет ANTHROPIC_KEY (твой ключ sk-ant-...).
// 3. URL воркера вписать в CONFIG.WORKER_URL в index.html.

export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": "*", // на проде сузить до домена магазина
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    if (request.method !== "POST") return new Response("POST only", { status: 405, headers: cors });

    let body;
    try { body = await request.json(); }
    catch { return new Response(JSON.stringify({ error: "bad json" }), { status: 400, headers: cors }); }

    // не даём гонять чужие нагрузки через твой ключ
    body.model = "claude-sonnet-4-6";
    body.max_tokens = Math.min(body.max_tokens || 700, 1000);

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    return new Response(r.body, {
      status: r.status,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  },
};
