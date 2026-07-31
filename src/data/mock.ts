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

// ── Parent ──
export type ParentStatus = "active" | "pending";

export interface Parent {
  id: string;
  name: string;
  initial: string;
  avatarBg: string;
  role: string;
  status: ParentStatus;
}

// ── Kid ──
export interface Kid {
  id: string;
  name: string;
  initial: string;
  avatarBg: string;
  avatarText: string;
  age: number;
  room: string;
  birthDate: string;
  enrolledSince: string;
  allergies?: string;
  allergyLabel?: string;   // short badge label, e.g. "MANÍ"
  parents: Parent[];
}

// ── Rooms ──
export const rooms: string[] = ["Soles", "Lunas", "Estrellas"];

// ── Parent roles for the link-parent modal ──
export const parentRoles: string[] = ["Mamá", "Papá", "Tutor/a"];

// ── Avatar palette (assigned in order to new kids) ──
export const avatarPalette: { bg: string; text: string }[] = [
  { bg: "#F4B8CC", text: "#C44A7A" },
  { bg: "#A9D9E8", text: "#1F7A93" },
  { bg: "#B9DEC4", text: "#3E8B62" },
  { bg: "#C9B6E8", text: "#7B5FC0" },
  { bg: "#F4DC8E", text: "#9A7B1E" },
];

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

export const kids: Kid[] = [
  {
    id: "mateo-fernandez",
    name: "Mateo Fernández",
    initial: "M",
    avatarBg: "#A9D9E8",
    avatarText: "#1F7A93",
    age: 3,
    room: "Soles",
    birthDate: "12 mar 2022",
    enrolledSince: "feb 2025",
    allergies: "Alergia al maní. Evitar frutos secos. Lleva inhalador en la mochila.",
    allergyLabel: "MANÍ",
    parents: [
      {
        id: "lucia-fernandez",
        name: "Lucía Fernández",
        initial: "L",
        avatarBg: "#C9B6E8",
        role: "Mamá",
        status: "active",
      },
      {
        id: "diego-fernandez",
        name: "Diego Fernández",
        initial: "D",
        avatarBg: "#A9C7E8",
        role: "Papá",
        status: "pending",
      },
    ],
  },
  {
    id: "sofia-mendez",
    name: "Sofía Méndez",
    initial: "S",
    avatarBg: "#F4B8CC",
    avatarText: "#C44A7A",
    age: 2,
    room: "Soles",
    birthDate: "5 ago 2023",
    enrolledSince: "mar 2025",
    parents: [
      {
        id: "ana-mendez",
        name: "Ana Méndez",
        initial: "A",
        avatarBg: "#F4B8CC",
        role: "Mamá",
        status: "active",
      },
    ],
  },
  {
    id: "benjamin-ruiz",
    name: "Benjamín Ruiz",
    initial: "B",
    avatarBg: "#B9DEC4",
    avatarText: "#3E8B62",
    age: 3,
    room: "Soles",
    birthDate: "20 ene 2022",
    enrolledSince: "ene 2025",
    parents: [
      {
        id: "maria-ruiz",
        name: "María Ruiz",
        initial: "M",
        avatarBg: "#B9DEC4",
        role: "Mamá",
        status: "active",
      },
      {
        id: "carlos-ruiz",
        name: "Carlos Ruiz",
        initial: "C",
        avatarBg: "#A9C7E8",
        role: "Papá",
        status: "active",
      },
    ],
  },
  {
    id: "valentina-soto",
    name: "Valentina Soto",
    initial: "V",
    avatarBg: "#F4DC8E",
    avatarText: "#9A7B1E",
    age: 2,
    room: "Soles",
    birthDate: "14 nov 2023",
    enrolledSince: "abr 2025",
    parents: [],
  },
  {
    id: "tomas-diaz",
    name: "Tomás Díaz",
    initial: "T",
    avatarBg: "#C9B6E8",
    avatarText: "#7B5FC0",
    age: 3,
    room: "Soles",
    birthDate: "8 feb 2022",
    enrolledSince: "feb 2025",
    allergies: "Intolerancia a la lactosa. No leche ni derivados.",
    allergyLabel: "LACTOSA",
    parents: [
      {
        id: "paula-diaz",
        name: "Paula Díaz",
        initial: "P",
        avatarBg: "#C9B6E8",
        role: "Mamá",
        status: "active",
      },
    ],
  },
  {
    id: "emma-castro",
    name: "Emma Castro",
    initial: "E",
    avatarBg: "#F4B8CC",
    avatarText: "#C44A7A",
    age: 2,
    room: "Soles",
    birthDate: "30 abr 2023",
    enrolledSince: "may 2025",
    parents: [
      {
        id: "laura-castro",
        name: "Laura Castro",
        initial: "L",
        avatarBg: "#F4B8CC",
        role: "Mamá",
        status: "active",
      },
    ],
  },
  {
    id: "lucas-romero",
    name: "Lucas Romero",
    initial: "L",
    avatarBg: "#A9D9E8",
    avatarText: "#1F7A93",
    age: 3,
    room: "Soles",
    birthDate: "17 jun 2022",
    enrolledSince: "mar 2025",
    parents: [
      {
        id: "roberto-romero",
        name: "Roberto Romero",
        initial: "R",
        avatarBg: "#A9D9E8",
        role: "Papá",
        status: "active",
      },
    ],
  },
  {
    id: "olivia-vega",
    name: "Olivia Vega",
    initial: "O",
    avatarBg: "#B9DEC4",
    avatarText: "#3E8B62",
    age: 2,
    room: "Soles",
    birthDate: "22 sep 2023",
    enrolledSince: "jun 2025",
    parents: [
      {
        id: "claudia-vega",
        name: "Claudia Vega",
        initial: "C",
        avatarBg: "#B9DEC4",
        role: "Mamá",
        status: "active",
      },
    ],
  },
];

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
