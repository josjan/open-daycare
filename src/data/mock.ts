export interface User {
  name: string;
  role: string;
  group: string;
  initial: string;
}

export type NavItemId = "feed" | "kids" | "notices" | "account";

export interface NavItem {
  id: NavItemId;
  label: string;
  icon: "home" | "users" | "bell" | "user";
  current?: boolean;
}

export type PostCategory = "achievement" | "activity" | "announcement";

export interface PostCategoryStyle {
  badgeBg: string;
  badgeDot: string;
  badgeLabel: string;
  badgeText: string;
  avatarBg: string;
  avatarText: string;
  icon: "heart" | "megaphone";
}

export interface PostImage {
  label: string;
}

export interface Post {
  id: string;
  childName: string;
  childInitial: string;
  childAvatarBg: string;
  category: PostCategory;
  time: string;
  audience: string;
  content: string;
  image?: PostImage;
  likes: number;
  comments: number;
}

export interface PageInfo {
  daycareName: string;
  roomName: string;
  teacherName: string;
  childCount: number;
  date: string;
}

export const currentUser: User = {
  name: "Caro Giménez",
  role: "Maestra",
  group: "Soles",
  initial: "C",
};

export const navItems: NavItem[] = [
  { id: "feed", label: "Feed", icon: "home", current: true },
  { id: "kids", label: "Niños", icon: "users" },
  { id: "notices", label: "Avisos", icon: "bell" },
  { id: "account", label: "Mi cuenta", icon: "user" },
];

export const categoryStyles: Record<PostCategory, PostCategoryStyle> = {
  achievement: {
    badgeBg: "#CFEBD8",
    badgeDot: "#3E9B6C",
    badgeLabel: "LOGRO",
    badgeText: "#3E9B6C",
    avatarBg: "#A9D9E8",
    avatarText: "#1F7A93",
    icon: "heart",
  },
  activity: {
    badgeBg: "#C7E7F1",
    badgeDot: "#2E89A6",
    badgeLabel: "ACTIVIDAD",
    badgeText: "#2E89A6",
    avatarBg: "#A9D9E8",
    avatarText: "#1F7A93",
    icon: "heart",
  },
  announcement: {
    badgeBg: "#CCD8F4",
    badgeDot: "#4E72C8",
    badgeLabel: "ANUNCIO",
    badgeText: "#4E72C8",
    avatarBg: "#CCD8F4",
    avatarText: "#4E72C8",
    icon: "megaphone",
  },
};

export const pageInfo: PageInfo = {
  daycareName: "GUARDERÍA",
  roomName: "SALA SOLES",
  teacherName: "Caro",
  childCount: 12,
  date: "martes 17 jun",
};

export const posts: Post[] = [
  {
    id: "post-1",
    childName: "Mateo",
    childInitial: "M",
    childAvatarBg: "#A9D9E8",
    category: "achievement",
    time: "14:20",
    audience: "familia de Mateo",
    content:
      "¡Usó el orinal solito por primera vez! Estaba feliz de contárselo a todos. Un gran paso.",
    likes: 3,
    comments: 1,
  },
  {
    id: "post-2",
    childName: "Mateo",
    childInitial: "M",
    childAvatarBg: "#A9D9E8",
    category: "activity",
    time: "09:40",
    audience: "familia de Mateo",
    content:
      "Pintamos con témperas esta mañana. Mateo eligió el azul para todo y se concentró un montón mezclando colores.",
    image: { label: "pintando con témperas" },
    likes: 5,
    comments: 2,
  },
  {
    id: "post-3",
    childName: "Anuncio general",
    childInitial: "",
    childAvatarBg: "#CCD8F4",
    category: "announcement",
    time: "07:50",
    audience: "toda la sala",
    content:
      "El viernes salimos al parque por la mañana. Recuerden mandar gorra y una botellita de agua.",
    likes: 8,
    comments: 0,
  },
];
