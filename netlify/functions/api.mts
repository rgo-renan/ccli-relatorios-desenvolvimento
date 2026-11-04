// API do gerador de relatórios: documentos no Netlify Blobs, protegidos por chave.
// PAINEL_CHAVE = chave dos consultores (lê tudo, salva rascunhos de relatório)
// ADMIN_CHAVE  = chave da equipe de CS (também atualiza as planilhas em base/*)
import { getStore } from "@netlify/blobs";
import type { Config, Context } from "@netlify/functions";

const store = () => getStore({ name: "relatorios", consistency: "strong" });
const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { "cache-control": "no-store" } });

export function papel(req: Request): "admin" | "consultor" | null {
  const k = req.headers.get("x-chave") || "";
  const admin = Netlify.env.get("ADMIN_CHAVE");
  const cons = Netlify.env.get("PAINEL_CHAVE");
  if (admin && k === admin) return "admin";
  if (cons && k === cons) return "consultor";
  return null;
}

const VALID = /^(base|rel|relidx)\/[A-Za-z0-9_\-.~:@+]{1,200}$/;

export default async (req: Request, context: Context) => {
  const role = papel(req);
  if (!role) return json({ error: "chave inválida" }, 401);
  const url = new URL(req.url);
  const rota = url.pathname.replace(/^\/api\//, "");

  if (rota === "quemsou") return json({ papel: role, ia: !!Netlify.env.get("ANTHROPIC_API_KEY") });

  if (rota === "doc") {
    const p = url.searchParams.get("p") || "";
    if (!VALID.test(p)) return json({ error: "caminho inválido" }, 400);
    const s = store();
    if (req.method === "GET") {
      const v = await s.get(p, { type: "json" });
      return json({ exists: v !== null, data: v ?? undefined });
    }
    if (p.startsWith("base/") && role !== "admin") return json({ error: "só a equipe de CS atualiza as planilhas" }, 403);
    if (req.method === "PUT") {
      const body = await req.json();
      if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "corpo inválido" }, 400);
      await s.setJSON(p, body);
      return json({ ok: true });
    }
    if (req.method === "DELETE") { await s.delete(p); return json({ ok: true }); }
    return json({ error: "método não suportado" }, 405);
  }

  if (rota === "lista") {
    const prefix = url.searchParams.get("prefix") || "";
    if (!["relidx/"].includes(prefix)) return json({ error: "prefixo inválido" }, 400);
    const s = store();
    const { blobs } = await s.list({ prefix });
    const out: Record<string, unknown> = {};
    await Promise.all(blobs.map(async b => { out[b.key.slice(prefix.length)] = await s.get(b.key, { type: "json" }); }));
    return json(out);
  }

  if (rota === "job") {
    const id = url.searchParams.get("id") || "";
    if (!/^[a-z0-9-]{8,64}$/.test(id)) return json({ error: "id inválido" }, 400);
    const v = await getStore({ name: "jobs", consistency: "strong" }).get(id, { type: "json" });
    return json(v ?? { status: "pendente" });
  }

  return json({ error: "rota desconhecida" }, 404);
};

export const config: Config = { path: "/api/*", excludedPath: ["/api/redigir"] };
