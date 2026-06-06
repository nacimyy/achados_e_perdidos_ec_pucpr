import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import database from "./database.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const baseUrl = process.env.BASE_URL || "http://localhost:3001";
let createdItem = null;

async function request(route, options) {
  const response = await fetch(`${baseUrl}${route}`, options);
  const body = await response.json();
  if (!response.ok) throw new Error(body.message || `Erro HTTP ${response.status}`);
  return body;
}

try {
  const health = await request("/api/health");
  assert.equal(health.status, "ok");

  const login = await request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "funcionario@pucpr.br", password: "pucpr" })
  });
  assert.equal(login.user.role, "staff");

  const form = new FormData();
  form.append("name", "Item de teste automatizado");
  form.append("category", "Outros");
  form.append("description", "Cadastro temporário criado pelo teste de integração.");
  form.append("location", "Bloco 10");
  form.append("foundDate", "2026-06-05");
  form.append("registeredBy", "Teste automatizado");
  form.append("existingImages", "[]");
  const image = await fs.readFile(path.resolve(__dirname, "../public/images/items/chaves.jpg"));
  form.append("images", new Blob([image], { type: "image/jpeg" }), "item-teste.jpg");

  createdItem = await request("/api/items", { method: "POST", body: form });
  assert.equal(createdItem.status, "available");
  assert.equal(createdItem.images.length, 1);

  const claimedItem = await request(`/api/items/${createdItem.id}/claim`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Pessoa de Teste", document: "000.000.000-00" })
  });
  assert.equal(claimedItem.status, "claimed");
  assert.equal(claimedItem.claim_name, "Pessoa de Teste");

  console.log("Smoke test concluído: health, login, upload, cadastro e resgate.");
} finally {
  if (createdItem) {
    database.prepare("DELETE FROM items WHERE id = ?").run(createdItem.id);
    for (const imagePath of createdItem.images) {
      if (imagePath.startsWith("/uploads/")) {
        await fs.rm(path.resolve(__dirname, `../public${imagePath}`), { force: true });
      }
    }
  }
  database.close();
}
