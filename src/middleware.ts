import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/middleware";
import { getPanelForPath, resolveRole } from "@/lib/role";

const PUBLIC_PATHS = ["/login", "/activate"];

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isPublicPath = PUBLIC_PATHS.includes(pathname);

  if (!user && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && isPublicPath) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (user) {
    const role = await resolveRole(supabase, user);
    const panel = getPanelForPath(pathname);

    if (role === "parent" && panel === "staff") {
      return NextResponse.redirect(new URL("/familia", request.url));
    }

    if ((role === "staff" || role === "admin") && panel === "family") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
