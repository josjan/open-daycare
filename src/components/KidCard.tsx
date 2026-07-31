import Link from "next/link";
import { Kid } from "@/data/mock";

interface KidCardProps {
  kid: Kid;
}

function ChevronRightIcon() {
  return (
    <svg
      style={{ flex: "none" }}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#CBB89F"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function parentCountLabel(count: number): string {
  if (count === 0) return "sin padres vinculados";
  if (count === 1) return "1 padre vinculado";
  return `${count} padres vinculados`;
}

export default function KidCard({ kid }: KidCardProps) {
  return (
    <Link
      href={`/kids/${kid.id}`}
      className="group flex min-w-0 items-center gap-[14px] rounded-[18px] border border-[#ECE0D0] bg-[#FFFDF9] p-4 shadow-[0_4px_14px_-12px_rgba(120,90,60,.5)] transition-all duration-150 hover:-translate-y-[2px] hover:border-[#F2A78E]"
    >
      {/* Avatar */}
      <div
        className="flex h-12 w-12 flex-none items-center justify-center rounded-full font-fredoka text-[19px] font-semibold"
        style={{ background: kid.avatarBg, color: kid.avatarText }}
      >
        {kid.initial}
      </div>

      {/* Name + subtitle */}
      <div className="min-w-0 flex-1">
        <div className="font-fredoka text-[16px] font-semibold text-[#3F362E]">
          {kid.name}
        </div>
        <div className="text-[13px] text-[#A89A8B]">
          {kid.age} años · {parentCountLabel(kid.parents.length)}
        </div>
      </div>

      {/* Badge or chevron */}
      {kid.parents.length === 0 ? (
        <span className="flex-none rounded-full bg-[#F9D2DE] px-[9px] py-[5px] text-[11px] font-extrabold text-[#C56486]">
          VINCULAR
        </span>
      ) : kid.allergyLabel ? (
        <span className="flex-none rounded-full bg-[#FBD8CC] px-[9px] py-[5px] text-[11px] font-extrabold text-[#D9684A]">
          {kid.allergyLabel}
        </span>
      ) : (
        <ChevronRightIcon />
      )}
    </Link>
  );
}
