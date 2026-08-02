"use client";

import { use, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import KidProfile from "@/components/KidProfile";
import LinkParentModal from "@/components/LinkParentModal";
import { Kid, Parent } from "@/data/mock";
import { ChildRow } from "@/types/child";
import { childToKid } from "@/lib/childMappers";
import { createClient } from "@/utils/supabase/client";

interface KidPageProps {
  params: Promise<{ id: string }>;
}

export default function KidPage({ params }: KidPageProps) {
  const { id } = use(params);
  const [kidState, setKidState] = useState<Kid | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);
  const [isLinkParentOpen, setIsLinkParentOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadKid() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("children")
        .select("*, rooms(name)")
        .eq("id", id)
        .maybeSingle();

      if (cancelled) return;
      setLoading(false);

      if (error) {
        setError("No se pudo cargar el perfil del niño.");
        return;
      }
      if (!data) {
        setIsNotFound(true);
        return;
      }
      setKidState(childToKid(data as ChildRow, 0));
    }

    loadKid();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (isNotFound) {
    notFound();
  }

  function handleInvite(parent: Parent) {
    setKidState((prev) => {
      if (!prev) return prev;
      return { ...prev, parents: [...prev.parents, parent] };
    });
    setIsLinkParentOpen(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#F6ECDF]">
        <Sidebar activeNav="kids" />
        <main className="flex h-screen flex-1 items-center justify-center bg-[#F6ECDF]">
          <div className="text-[15px] font-semibold text-[#94887B]">Cargando…</div>
        </main>
      </div>
    );
  }

  if (error || !kidState) {
    return (
      <div className="flex min-h-screen bg-[#F6ECDF]">
        <Sidebar activeNav="kids" />
        <main className="h-screen flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[820px] px-10 pt-[34px]">
            <div className="rounded-[14px] border-[1.5px] border-[#F2A78E] bg-[#FDEBE3] px-4 py-3 text-[13.5px] font-semibold text-[#C5503A]">
              {error ?? "No se encontró el niño."}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F6ECDF]">
      <Sidebar activeNav="kids" />
      <main className="h-screen min-w-0 flex-1 overflow-y-auto">
        <KidProfile kid={kidState} onLinkParent={() => setIsLinkParentOpen(true)} />
        {isLinkParentOpen && (
          <LinkParentModal
            kid={kidState}
            onClose={() => setIsLinkParentOpen(false)}
            onInvite={handleInvite}
          />
        )}
      </main>
    </div>
  );
}
