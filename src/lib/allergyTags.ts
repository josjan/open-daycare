export const allergyTagLabels: Record<string, string> = {
  peanut: "MANÍ",
  lactose: "LACTOSA",
  gluten: "GLUTEN",
  egg: "HUEVO",
  soy: "SOJA",
};

const englishByLabel: Record<string, string> = Object.entries(allergyTagLabels).reduce(
  (acc, [english, spanish]) => {
    acc[spanish.toLowerCase()] = english;
    return acc;
  },
  {} as Record<string, string>
);

// "Maní" → "peanut", "Lactosa" → "lactose";
// sin traducción conocida → la palabra en minúsculas (fallback).
export function toEnglishTag(label: string): string {
  const normalized = label.trim().toLowerCase();
  return englishByLabel[normalized] ?? normalized;
}

// "peanut" → "MANÍ"; etiqueta desconocida → el tag en mayúsculas.
export function toBadgeLabel(tag: string): string {
  return allergyTagLabels[tag] ?? tag.toUpperCase();
}
