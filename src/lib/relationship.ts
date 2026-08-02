import type { RelationshipValue } from "@/types/invitation";

export const relationshipLabels: Record<RelationshipValue, string> = {
  mother: "Mamá",
  father: "Papá",
  guardian: "Tutor/a",
};

export const relationshipToDb: Record<string, RelationshipValue> = {
  "Mamá": "mother",
  "Papá": "father",
  "Tutor/a": "guardian",
};
