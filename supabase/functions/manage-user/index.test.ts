import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const FN = `${SUPABASE_URL}/functions/v1/manage-user`;

Deno.test("manage-user: OPTIONS renvoie les en-têtes CORS", async () => {
  const res = await fetch(FN, { method: "OPTIONS" });
  await res.text();
  assertEquals(res.status, 200);
  assert(res.headers.get("access-control-allow-origin"));
});

Deno.test("manage-user: refuse une requête sans Authorization", async () => {
  const res = await fetch(FN, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON_KEY },
    body: JSON.stringify({ action: "delete", user_id: crypto.randomUUID() }),
  });
  const body = await res.json();
  assertEquals(res.status, 400);
  assert(/autoris/i.test(String(body.error)));
});

Deno.test("manage-user: refuse un appelant non administrateur", async () => {
  const res = await fetch(FN, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: ANON_KEY,
      Authorization: "Bearer invalid.token.value",
    },
    body: JSON.stringify({ action: "disable", user_id: crypto.randomUUID() }),
  });
  const body = await res.json();
  assertEquals(res.status, 400);
  assert(String(body.error).length > 0);
});

Deno.test("manage-user: action inconnue rejetée", async () => {
  const res = await fetch(FN, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: ANON_KEY,
      Authorization: "Bearer invalid.token.value",
    },
    body: JSON.stringify({ action: "nuke", user_id: crypto.randomUUID() }),
  });
  await res.json();
  assertEquals(res.status, 400);
});
