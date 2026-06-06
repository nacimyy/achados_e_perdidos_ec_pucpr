import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDirectory = path.resolve(__dirname, "../data");
fs.mkdirSync(dataDirectory, { recursive: true });

const database = new Database(path.join(dataDirectory, "achados-perdidos.db"));
database.pragma("journal_mode = WAL");
database.pragma("foreign_keys = ON");

database.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT NOT NULL,
    found_date TEXT NOT NULL,
    registered_by TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'available'
      CHECK (status IN ('available', 'claimed', 'expired', 'donated')),
    images TEXT NOT NULL DEFAULT '[]',
    claim_name TEXT,
    claim_document TEXT,
    claimed_at TEXT,
    donation_institution TEXT,
    donated_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

const seedItems = [
  ["Guarda-chuva azul", "Acessórios", "Guarda-chuva azul-marinho com cabo preto. Disponível para retirada na Central de Atendimento.", "Bloco 10", "2026-05-29", "Marina Alves", "available", ["/images/items/guarda-chuva.jpg"]],
  ["Caderno Midnight", "Material escolar", "Caderno de capa escura com estampa de fases da lua e anotações nas primeiras páginas.", "Bloco 5", "2026-05-28", "Carlos Lima", "available", ["/images/items/caderno.jpg"]],
  ["Copo térmico Stanley", "Garrafas e copos", "Copo térmico branco, com tampa e alça. Disponível para retirada na secretaria do Bloco 10.", "Bloco 10", "2026-05-27", "Marina Alves", "available", ["/images/items/copo-termico-1.jpg", "/images/items/copo-termico-2.jpg", "/images/items/copo-termico-3.jpg", "/images/items/copo-termico-4.jpg"]],
  ["Chaveiro com chaves", "Acessórios", "Conjunto com quatro chaves e um chaveiro vermelho. O proprietário deverá informar detalhes adicionais.", "Bloco 3", "2026-05-27", "João Mendes", "available", ["/images/items/chaves.jpg"]],
  ["iPhone dourado", "Eletrônicos", "Celular Apple com capa transparente, encontrado próximo à praça de alimentação.", "Bloco 5", "2026-05-25", "Carlos Lima", "claimed", ["/images/items/celular.jpg"]],
  ["Pendrive com chaveiro", "Eletrônicos", "Pendrive preso a um chaveiro metálico. Não conectamos o dispositivo por segurança.", "Bloco 2", "2026-05-24", "Ana Souza", "available", ["/images/items/pendrive.jpg"]],
  ["Power bank Anker", "Eletrônicos", "Carregador portátil preto com alça cinza, encontrado em uma sala de estudos.", "Bloco 6", "2026-05-23", "Paulo Rocha", "available", ["/images/items/power-bank.jpg"]],
  ["Kindle verde", "Eletrônicos", "Leitor digital com capa verde. A tela está em boas condições.", "Bloco 10", "2026-05-22", "Marina Alves", "available", ["/images/items/kindle.jpg"]],
  ["Console portátil", "Eletrônicos", "Console portátil em estojo preto, sem carregador.", "Bloco 8", "2026-03-12", "Renata Costa", "expired", ["/images/items/jogo-portatil.jpg"]],
  ["Fones JBL", "Eletrônicos", "Par de fones sem fio JBL em estojo carregador preto.", "Bloco 3", "2026-03-10", "João Mendes", "donated", ["/images/items/fone-ouvido.jpg"]],
  ["Apple Pencil", "Eletrônicos", "Caneta digital branca encontrada no laboratório de informática.", "Bloco 9", "2026-05-20", "Paulo Rocha", "available", ["/images/items/apple-pencil.jpg"]],
  ["Livro Entendendo Algoritmos", "Livros", "Livro técnico com pequenas marcações a lápis.", "Biblioteca", "2026-05-18", "Luciana Prado", "available", ["/images/items/livro.jpg"]]
];

if (database.prepare("SELECT COUNT(*) AS total FROM items").get().total === 0) {
  const insert = database.prepare(`
    INSERT INTO items
      (name, category, description, location, found_date, registered_by, status, images)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const seed = database.transaction(() => {
    for (const item of seedItems) {
      insert.run(...item.slice(0, 7), JSON.stringify(item[7]));
    }

    database.prepare(`
      UPDATE items
      SET claim_name = 'Helena Castro',
          claim_document = '000.000.000-00',
          claimed_at = '2026-05-26T17:20:00.000Z'
      WHERE status = 'claimed'
    `).run();

    database.prepare(`
      UPDATE items
      SET donation_institution = 'Complexo de Saúde Pequeno Cotolengo',
          donated_at = '2026-05-12T14:00:00.000Z'
      WHERE status = 'donated'
    `).run();
  });

  seed();
}

export function serializeItem(item) {
  if (!item) return null;
  return {
    ...item,
    images: JSON.parse(item.images || "[]")
  };
}

export default database;
