import type { RelationshipValue } from "@/types/invitation";

export const relationshipToDb = {
  "Mamá": "mother",
  "Papá": "father",
  "Tutor/a": "guardian",
} as const satisfies Record<string, RelationshipValue>;

export type RelationshipLabel = keyof typeof relationshipToDb;

export const relationshipLabels: Record<RelationshipValue, string> = {
  mother: "Mamá",
  father: "Papá",
  guardian: "Tutor/a",
};
