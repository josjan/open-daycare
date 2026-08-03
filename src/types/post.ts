export type PostType =
  | "meal"
  | "nap"
  | "activity"
  | "achievement"
  | "photo"
  | "announcement"
  | "mood";

export interface PostRow {
  id: string;
  author_id: string;
  room_id: string | null;
  type: PostType;
  title: string | null;
  body: string;
  published_at: string;
  post_children?: { child_id: string; children?: { full_name: string } | null }[];
  post_photos?: { url: string; position: number }[];
  reactions?: { count: number }[];
  comments?: { count: number }[];
}

export interface NewPost {
  authorId: string;
  roomId: string | null; // sala del staff si es anuncio; null si es de niño
  type: PostType;
  title: string | null; // "Anuncio general" si es anuncio; null si es de niño
  body: string;
  childIds: string[]; // [childId] si es de niño; [] si es anuncio
  photos: File[];
}
