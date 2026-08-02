import { Kid, avatarPalette } from "@/data/mock";
import { ChildRow } from "@/types/child";
import { toBadgeLabel } from "@/lib/allergyTags";

const shortMonths = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

function monthYearLabel(iso: string): string {
  const [year, month] = iso.split("-").map(Number);
  return `${shortMonths[month - 1]} ${year}`;
}

// Construye el Kid de UI desde una fila de children.
export function childToKid(child: ChildRow, avatarIndex: number): Kid {
  const birth = new Date(`${child.birth_date}T00:00:00`);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const birthdayThisYear = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
  if (today < birthdayThisYear) age -= 1;

  const avatar = avatarPalette[avatarIndex % avatarPalette.length];

  return {
    id: child.id,
    name: child.full_name,
    initial: child.full_name.charAt(0).toUpperCase(),
    avatarBg: avatar.bg,
    avatarText: avatar.text,
    age,
    room: child.rooms?.name ?? "",
    birthDate: `${birth.getDate()} ${shortMonths[birth.getMonth()]} ${birth.getFullYear()}`,
    enrolledSince: monthYearLabel(child.enrolled_at),
    allergies: child.medical_notes ?? undefined,
    allergyLabel: child.allergy_tags.length > 0 ? toBadgeLabel(child.allergy_tags[0]) : undefined,
    parents: [],
  };
}
