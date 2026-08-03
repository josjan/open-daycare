import {
  type Post,
  type PostCategory,
  type PostImage,
  avatarPalette,
} from "@/data/mock";
import type { PostRow, PostType } from "@/types/post";

const CATEGORY_TO_TYPE: Record<PostCategory, PostType> = {
  food: "meal",
  nap: "nap",
  activity: "activity",
  achievement: "achievement",
  mood: "mood",
  photo: "photo",
  announcement: "announcement",
};

const TYPE_TO_CATEGORY: Record<PostType, PostCategory> = {
  meal: "food",
  nap: "nap",
  activity: "activity",
  achievement: "achievement",
  mood: "mood",
  photo: "photo",
  announcement: "announcement",
};

export function categoryToPostType(category: PostCategory): PostType {
  return CATEGORY_TO_TYPE[category];
}

export function postTypeToCategory(type: PostType): PostCategory {
  return TYPE_TO_CATEGORY[type];
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
}

function paletteIndex(key: string): number {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return hash % avatarPalette.length;
}

function firstPhoto(photos: PostRow["post_photos"]): PostImage {
  if (!photos || photos.length === 0) return { label: "Foto" };
  const sorted = [...photos].sort((a, b) => a.position - b.position);
  return { label: "Foto", src: sorted[0].url };
}

// Convierte una fila de posts (con sus joins) a la forma del mock.
export function postRowToPost(row: PostRow): Post {
  const category = postTypeToCategory(row.type);

  if (category === "announcement") {
    return {
      id: row.id,
      childName: row.title ?? "Anuncio general",
      childInitial: "",
      childAvatarBg: "#CCD8F4",
      category,
      time: formatTime(row.published_at),
      audience: "toda la sala",
      content: row.body,
      image: firstPhoto(row.post_photos),
      likes: row.reactions?.[0]?.count ?? 0,
      comments: row.comments?.[0]?.count ?? 0,
    };
  }

  const child = row.post_children?.[0]?.children;
  const fullName = child?.full_name ?? "";
  const firstName = fullName.split(" ")[0];
  const avatar = avatarPalette[paletteIndex(fullName || row.id)];

  return {
    id: row.id,
    childName: firstName || "Anuncio general",
    childInitial: firstName ? firstName.charAt(0).toUpperCase() : "",
    childAvatarBg: avatar.bg,
    category,
    time: formatTime(row.published_at),
    audience: firstName ? `familia de ${firstName}` : "toda la sala",
    content: row.body,
    image: firstPhoto(row.post_photos),
    likes: row.reactions?.[0]?.count ?? 0,
    comments: row.comments?.[0]?.count ?? 0,
  };
}
