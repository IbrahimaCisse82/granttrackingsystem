import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const FN = `${SUPABASE_URL}/functions/v1/validate-operation`;

Deno.test("validate-operation: OPTIONS renvoie les en-têtes CORS", async () => {
  const res = await fetch(FN, { method: "OPTIONS" });
  await res.text();
  assertEquals(res.status, 200);
  assert(res.headers.get("access-control-allow-origin"));
});

Deno.test("validate-operation: 401 sans Authorization", async () => {
  const res = await fetch(FN, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON_KEY },
    body: JSON.stringify({ action: "check_transaction", project_id: crypto.randomUUID() }),
  });
  const body = await res.json();
  assertEquals(res.status, 401);
  assertEquals(body.code, "AUTH_REQUIRED");
});

Deno.test("validate-operation: 400 si paramètres manquants", async () => {
  const res = await fetch(FN, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
    },
    body: JSON.stringify({}),
  });
  const body = await res.json();
  assertEquals(res.status, 400);
  assertEquals(body.code, "BAD_REQUEST");
});

Deno.test("validate-operation: projet inexistant => PROJECT_NOT_FOUND", async () => {
  const res = await fetch(FN, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
    },
    body: JSON.stringify({ action: "check_transaction", project_id: crypto.randomUUID() }),
  });
  const body = await res.json();
  assertEquals(res.status, 404);
  assertEquals(body.code, "PROJECT_NOT_FOUND");
});

Deno.test("validate-operation: action inconnue rejetée", async () => {
  const res = await fetch(FN, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
    },
    body: JSON.stringify({ action: "wat", project_id: crypto.randomUUID() }),
  });
  const body = await res.json();
  assert([400, 404].includes(res.status));
  assert(typeof body.code === "string");
});
