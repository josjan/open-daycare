import type { SupabaseClient, User } from "@supabase/supabase-js";

export type Role = "staff" | "parent" | "admin";
export type Panel = "staff" | "family";

const VALID_ROLES: Role[] = ["staff", "parent", "admin"];

function isRole(value: unknown): value is Role {
  return typeof value === "string" && VALID_ROLES.includes(value as Role);
}

// Resuelve el rol de un usuario: primero el metadata del JWT (evita una query
// por request), con fallback a la tabla `users` (fuente de verdad) y default
// `parent` (privilegio mínimo) ante la duda.
export async function resolveRole(
  supabase: SupabaseClient,
  user: User,
): Promise<Role> {
  const metaRole = user.user_metadata?.role;
  if (isRole(metaRole)) {
    return metaRole;
  }

  const { data } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (data && isRole(data.role)) {
    return data.role;
  }

  return "parent";
}

// Clasifica un pathname en el panel al que pertenece: `/familia` y su subárbol
// son del panel familia; el resto (autenticado) es del panel staff.
export function getPanelForPath(pathname: string): Panel {
  if (pathname === "/familia" || pathname.startsWith("/familia/")) {
    return "family";
  }
  return "staff";
}
