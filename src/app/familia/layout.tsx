"use client";

import { usePathname } from "next/navigation";
import { type ReactNode } from "react";
import Sidebar from "@/components/Sidebar";
import type { NavItemId } from "@/data/mock";

export default function FamilyLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const activeNav: NavItemId = pathname.startsWith("/familia/cuenta")
    ? "account"
    : "feed";

  return (
    <div className="flex min-h-screen bg-[#F6ECDF]">
      <Sidebar variant="family" activeNav={activeNav} />
      <main className="h-screen min-w-0 flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
