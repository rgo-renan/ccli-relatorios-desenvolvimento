// Função em segundo plano: redige os textos do relatório com a API da Anthropic
// e grava o resultado em Blobs (store "jobs"); a página consulta /api/job?id=.
import { getStore } from "@netlify/blobs";
import type { Config } from "@netlify/functions";

export default async (req: Request) => {
  const k = req.headers.get("x-chave") || "";
  const ok = [Netlify.env.get("ADMIN_CHAVE"), Netlify.env.get("PAINEL_CHAVE")].filter(Boolean).includes(k);
  if (!ok || Netlify.env.get("REDACAO_IA") !== "sim") return;
  let job = "", prompt = "";
  try { ({ job, prompt } = await req.json()); } catch { return; }
  if (!/^[a-z0-9-]{8,64}$/.test(job) || typeof prompt !== "string" || prompt.length > 200_000) return;
  const jobs = getStore({ name: "jobs", consistency: "strong" });
  await jobs.setJSON(job, { status: "rodando", em: Date.now() });
  try {
    const r = await fetch(`${(Netlify.env.get("ANTHROPIC_BASE_URL") || "https://api.anthropic.com").replace(/\/$/, "")}/v1/messages`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": Netlify.env.get("ANTHROPIC_API_KEY") || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: Netlify.env.get("ANTHROPIC_MODEL") || "claude-sonnet-5-5",
        max_tokens: 8000,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const body = await r.json();
    if (!r.ok) throw new Error(body?.error?.message || `HTTP ${r.status}`);
    const text = (body.content || []).filter((c: any) => c.type === "text").map((c: any) => c.text).join("");
    const a = text.indexOf("{"), b = text.lastIndexOf("}");
    const data = JSON.parse(text.slice(a, b + 1));
    await jobs.setJSON(job, { status: "pronto", data, em: Date.now() });
  } catch (e: any) {
    await jobs.setJSON(job, { status: "erro", erro: String(e?.message || e), em: Date.now() });
  }
};

export const config: Config = { path: "/api/redigir", background: true };
