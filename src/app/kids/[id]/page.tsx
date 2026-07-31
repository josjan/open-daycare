import { notFound } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import KidProfile from "@/components/KidProfile";
import { kids } from "@/data/mock";

interface KidPageProps {
  params: Promise<{ id: string }>;
}

export default async function KidPage({ params }: KidPageProps) {
  const { id } = await params;
  const kid = kids.find((k) => k.id === id);

  if (!kid) {
    notFound();
  }

  return (
    <div className="flex min-h-screen bg-[#F6ECDF]">
      <Sidebar activeNav="kids" />
      <main className="h-screen min-w-0 flex-1 overflow-y-auto">
        <KidProfile kid={kid} />
      </main>
    </div>
  );
}
