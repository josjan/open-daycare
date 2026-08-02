export type ParentStatus = "active" | "pending";

export interface Parent {
  id: string;
  name: string;
  initial: string;
  avatarBg: string;
  role: string;
  status: ParentStatus;
}

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
  allergyLabel?: string;
  parents: Parent[];
}
