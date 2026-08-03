"use client";

import { usePathname } from "next/navigation";
import { type ReactNode } from "react";
import Sidebar from "@/components/Sidebar";
import CreatePostProvider, {
  useCreatePost,
} from "@/components/CreatePostProvider";
import type { NavItemId } from "@/data/mock";

function StaffShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { openCreatePost } = useCreatePost();

  const activeNav: NavItemId = pathname.startsWith("/kids")
    ? "kids"
    : pathname.startsWith("/avisos")
      ? "notices"
      : pathname.startsWith("/cuenta")
        ? "account"
        : "feed";

  return (
    <div className="flex min-h-screen bg-[#F6ECDF]">
      <Sidebar
        variant="staff"
        activeNav={activeNav}
        onCreatePost={openCreatePost}
      />
      <main className="h-screen min-w-0 flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}

export default function StaffLayout({ children }: { children: ReactNode }) {
  return (
    <CreatePostProvider>
      <StaffShell>{children}</StaffShell>
    </CreatePostProvider>
  );
}
