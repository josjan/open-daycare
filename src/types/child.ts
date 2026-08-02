export interface Room {
  id: string;
  name: string;
}

export interface ChildRow {
  id: string;
  room_id: string;
  full_name: string;
  birth_date: string; // YYYY-MM-DD
  enrolled_at: string; // YYYY-MM-DD
  medical_notes: string | null;
  allergy_tags: string[];
  photo_consent: boolean;
  status: "active" | "archived";
  created_at: string;
  updated_at: string;
  rooms?: Pick<Room, "id" | "name"> | null; // join embebido por el select
}

export interface NewChildForm {
  name: string;
  birthDateISO: string; // YYYY-MM-DD
  roomId: string; // uuid de la sala
  allergyTags: string[]; // etiquetas en inglés (traducidas por el modal)
  medicalNotes: string;
}
