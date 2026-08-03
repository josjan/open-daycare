"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { navItems, pageInfo, NavItemId } from "@/data/mock";
import { createClient } from "@/utils/supabase/client";
import { type UserProfile } from "@/types/profile";

function SunIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function NavIcon({ icon }: { icon: string }) {
  const props = { width: 19, height: 19, fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (icon) {
    case "home":
      return <svg {...props}><path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></svg>;
    case "users":
      return <svg {...props}><circle cx="9" cy="7" r="3" /><circle cx="17" cy="9" r="2.4" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 20a5 5 0 0 1 5.5-4.9" /></svg>;
    case "bell":
      return <svg {...props}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" /></svg>;
    case "user":
      return <svg {...props}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
    default:
      return null;
  }
}

function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}

function HamburgerIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12h18M3 6h18M3 18h18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

const NAV_HREFS: Record<NavItemId, string> = {
  feed: "/",
  kids: "/kids",
  notices: "#",
  account: "#",
};

const ROLE_LABELS: Record<UserProfile["role"], string> = {
  staff: "Personal",
  parent: "Familia",
  admin: "Admin",
};

function SidebarContent({
  activeNav,
  onCreatePost,
}: {
  activeNav: NavItemId;
  onCreatePost?: () => void;
}) {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userRow } = await supabase
        .from("users")
        .select("full_name, role")
        .eq("id", user.id)
        .single();

      if (userRow) {
        setProfile({
          fullName: userRow.full_name,
          role: userRow.role,
          initial: userRow.full_name.charAt(0).toUpperCase(),
        });
        return;
      }

      const meta = user.user_metadata ?? {};
      const fullName = (meta.full_name as string) ?? user.email ?? "Usuario";
      const role = (meta.role as UserProfile["role"]) ?? "parent";
      setProfile({
        fullName,
        role,
        initial: fullName.charAt(0).toUpperCase(),
      });
    };
    loadProfile();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      <Link href="/" className="flex items-center gap-[11px] px-2 pb-[22px] pt-1">
        <div className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-xl bg-gradient-to-br from-[#F8C3A8] to-[#F2937A]">
          <SunIcon />
        </div>
        <div>
          <div className="font-fredoka text-[17px] font-semibold leading-none text-[#3F362E]">
            OpenDayCare
          </div>
          <div className="mt-[2px] text-[11.5px] text-[#A89A8B]">{pageInfo.roomName}</div>
        </div>
      </Link>

      {onCreatePost && (
        <button
          onClick={onCreatePost}
          className="mb-[18px] flex w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-b from-[#F4977E] to-[#EE8164] px-3 py-3 text-[14.5px] font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,.75)]"
        >
          <PlusIcon />
          Nueva publicación
        </button>
      )}

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => {
          const active = item.id === activeNav;
          return (
            <Link
              key={item.id}
              href={NAV_HREFS[item.id]}
              className={`flex items-center gap-3 rounded-xl px-3 py-[11px] text-[14.5px] ${
                active
                  ? "bg-[#FBE3D8] font-extrabold text-[#D9583C]"
                  : "bg-transparent font-semibold text-[#6E6359]"
              }`}
            >
              <NavIcon icon={item.icon} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-[10px] border-t border-[#ECE0D0] pt-[14px]">
        <div className="flex items-center gap-[11px] px-2 py-[6px]">
          <div className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full bg-[#F2937A] font-fredoka font-semibold text-white" style={{ fontSize: 16 }}>
            {profile?.initial ?? "·"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-extrabold text-[#3F362E]">
              {profile?.fullName ?? "Cargando…"}
            </div>
            <div className="text-xs text-[#A89A8B]">
              {profile ? ROLE_LABELS[profile.role] : ""}
            </div>
          </div>
          <button
            onClick={handleSignOut}
            title="Cerrar sesión"
            className="flex h-8 w-8 flex-none items-center justify-center rounded-xl bg-[#F6ECDF] text-[#94887B]"
          >
            <LogoutIcon />
          </button>
        </div>
      </div>
    </>
  );
}

interface SidebarProps {
  activeNav: NavItemId;
  onCreatePost?: () => void;
}

export default function Sidebar({ activeNav, onCreatePost }: SidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFFDF9] text-[#3F362E] shadow-md md:hidden"
        aria-label="Abrir menú"
      >
        <HamburgerIcon />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-none flex-col bg-[#FFFDF9] px-4 py-6 transition-transform md:sticky md:top-0 md:flex md:h-screen md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={() => setOpen(false)}
          className="mb-4 flex h-10 w-10 items-center justify-center self-end text-[#3F362E] md:hidden"
          aria-label="Cerrar menú"
        >
          <CloseIcon />
        </button>
        <SidebarContent activeNav={activeNav} onCreatePost={onCreatePost} />
      </aside>
    </>
  );
}
