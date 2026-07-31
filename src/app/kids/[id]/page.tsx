"use client";

import { use, useState } from "react";
import { notFound } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import KidProfile from "@/components/KidProfile";
import LinkParentModal from "@/components/LinkParentModal";
import { Parent, kids } from "@/data/mock";

interface KidPageProps {
  params: Promise<{ id: string }>;
}

export default function KidPage({ params }: KidPageProps) {
  const { id } = use(params);
  const [kidState, setKidState] = useState(() => kids.find((k) => k.id === id));
  const [isLinkParentOpen, setIsLinkParentOpen] = useState(false);

  if (!kidState) {
    notFound();
  }

  function handleInvite(parent: Parent) {
    setKidState((prev) => {
      if (!prev) return prev;
      return { ...prev, parents: [...prev.parents, parent] };
    });
    setIsLinkParentOpen(false);
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
