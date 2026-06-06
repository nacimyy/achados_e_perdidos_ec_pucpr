export const categories = [
  "Acessórios",
  "Documentos",
  "Eletrônicos",
  "Garrafas e copos",
  "Livros",
  "Material escolar",
  "Roupas",
  "Outros"
];

export const locations = [
  "Bloco 2",
  "Bloco 3",
  "Bloco 5",
  "Bloco 6",
  "Bloco 8",
  "Bloco 9",
  "Bloco 10",
  "Biblioteca",
  "Ginásio",
  "Praça de alimentação"
];

export const statusLabels = {
  available: "Disponível",
  claimed: "Resgatado",
  expired: "Expirado",
  donated: "Doado"
};

export const defaultFilters = {
  q: "",
  status: "all",
  category: "all",
  location: "all",
  sort: "newest",
  dateFrom: "",
  dateTo: ""
};

export function formatDate(value, includeTime = false) {
  if (!value) return "";
  const date = value.includes("T") ? new Date(value) : new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    ...(includeTime ? { timeStyle: "short" } : {})
  }).format(date);
}
