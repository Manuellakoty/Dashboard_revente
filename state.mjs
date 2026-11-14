// Base de données en ligne du dashboard : une fonction Netlify + Netlify Blobs.
// Chaque espace est identifié par une clé (SHA-256 du code choisi par l'utilisatrice).
import { getStore } from "@netlify/blobs";

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
const MAX_BYTES = 1_500_000;

export default async (req) => {
  const key = req.headers.get("x-sync-key") || "";
  if (!/^[a-f0-9]{64}$/.test(key)) {
    return new Response(JSON.stringify({ error: "clé invalide" }), { status: 401, headers: JSON_HEADERS });
  }
  const store = getStore("revente");

  if (req.method === "GET") {
    const data = await store.get(key, { type: "text" });
    return new Response(data ?? "null", { status: 200, headers: JSON_HEADERS });
  }

  if (req.method === "PUT") {
    const body = await req.text();
    if (body.length > MAX_BYTES) {
      return new Response(JSON.stringify({ error: "données trop volumineuses" }), { status: 413, headers: JSON_HEADERS });
    }
    try { JSON.parse(body); } catch {
      return new Response(JSON.stringify({ error: "JSON invalide" }), { status: 400, headers: JSON_HEADERS });
    }
    await store.set(key, body);
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: JSON_HEADERS });
  }

  return new Response(JSON.stringify({ error: "méthode non autorisée" }), { status: 405, headers: JSON_HEADERS });
};

export const config = { path: "/api/state" };
