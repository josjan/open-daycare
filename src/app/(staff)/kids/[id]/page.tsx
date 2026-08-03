"use client";

import { use, useCallback, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import KidProfile from "@/components/KidProfile";
import LinkParentModal from "@/components/LinkParentModal";
import { Kid, Parent, avatarPalette } from "@/data/mock";
import { ChildRow } from "@/types/child";
import { InvitationRow, ParentLinkRow } from "@/types/invitation";
import { relationshipLabels } from "@/lib/relationship";
import { childToKid } from "@/lib/childMappers";
import { createClient } from "@/utils/supabase/client";

interface KidPageProps {
  params: Promise<{ id: string }>;
}

function parentFromLink(link: ParentLinkRow): Parent | null {
  const name = link.users?.full_name ?? "";
  if (!name) return null;
  return {
    id: link.parent_id,
    name,
    initial: name.charAt(0).toUpperCase(),
    avatarBg: "",
    role: relationshipLabels[link.relationship],
    status: "active",
  };
}

function parentFromInvitation(invitation: InvitationRow): Parent {
  const name = invitation.full_name;
  return {
    id: invitation.code,
    name,
    initial: name.charAt(0).toUpperCase(),
    avatarBg: "",
    role: relationshipLabels[invitation.relationship],
    status: "pending",
  };
}

function buildParents(
  links: ParentLinkRow[],
  invitations: InvitationRow[]
): Parent[] {
  const active = links
    .map(parentFromLink)
    .filter((parent): parent is Parent => parent !== null);
  const pending = invitations.map(parentFromInvitation);

  return [...active, ...pending].map((parent, index) => ({
    ...parent,
    avatarBg: avatarPalette[index % avatarPalette.length].bg,
  }));
}

export default function KidPage({ params }: KidPageProps) {
  const { id } = use(params);
  const [kidState, setKidState] = useState<Kid | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);
  const [isLinkParentOpen, setIsLinkParentOpen] = useState(false);

  const loadParents = useCallback(
    async (supabase: ReturnType<typeof createClient>, child: Kid) => {
      const [linksResult, invitationsResult] = await Promise.all([
        supabase
          .from("parent_children")
          .select("parent_id, child_id, relationship, users(full_name)")
          .eq("child_id", id),
        supabase
          .from("invitations")
          .select("*")
          .eq("child_id", id)
          .eq("status", "pending"),
      ]);

      if (linksResult.error || invitationsResult.error) {
        setError("No se pudieron cargar los padres vinculados.");
        return child;
      }

      const parents = buildParents(
        (linksResult.data ?? []) as unknown as ParentLinkRow[],
        (invitationsResult.data ?? []) as InvitationRow[]
      );

      return { ...child, parents };
    },
    [id]
  );

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

      const kid = childToKid(data as ChildRow, 0);
      const kidWithParents = await loadParents(supabase, kid);
      if (cancelled) return;
      setKidState(kidWithParents);
    }

    loadKid();
    return () => {
      cancelled = true;
    };
  }, [id, loadParents]);

  if (isNotFound) {
    notFound();
  }

  async function handleInvited() {
    const supabase = createClient();
    if (kidState) {
      const refreshed = await loadParents(supabase, kidState);
      setKidState(refreshed);
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-[15px] font-semibold text-[#94887B]">Cargando…</div>
      </div>
    );
  }

  if (error || !kidState) {
    return (
      <div className="mx-auto w-full max-w-[820px] px-10 pt-[34px]">
        <div className="rounded-[14px] border-[1.5px] border-[#F2A78E] bg-[#FDEBE3] px-4 py-3 text-[13.5px] font-semibold text-[#C5503A]">
          {error ?? "No se encontró el niño."}
        </div>
      </div>
    );
  }

  return (
    <>
      <KidProfile kid={kidState} onLinkParent={() => setIsLinkParentOpen(true)} />
      {isLinkParentOpen && (
        <LinkParentModal
          kid={kidState}
          onClose={() => setIsLinkParentOpen(false)}
          onInvited={handleInvited}
        />
      )}
    </>
  );
}
