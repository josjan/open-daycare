import Link from "next/link";
import { Kid, Parent } from "@/data/mock";

interface KidProfileProps {
  kid: Kid;
}

function BackIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function ParentRow({ parent }: { parent: Parent }) {
  const isActive = parent.status === "active";
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex h-10 w-10 flex-none items-center justify-center rounded-full font-fredoka text-[16px] font-semibold text-white"
        style={{ background: parent.avatarBg }}
      >
        {parent.initial}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[14.5px] font-extrabold text-[#3F362E]">{parent.name}</div>
        <div className="text-[12.5px] text-[#A89A8B]">
          {parent.role} · {isActive ? "activa" : "invitación enviada"}
        </div>
      </div>
      {isActive ? (
        <span className="flex-none rounded-full bg-[#CFEBD8] px-[9px] py-1 text-[10.5px] font-extrabold text-[#3E9B6C]">
          ACTIVA
        </span>
      ) : (
        <span className="flex-none rounded-full bg-[#F7E7A6] px-[9px] py-1 text-[10.5px] font-extrabold text-[#9A7B1E]">
          PENDIENTE
        </span>
      )}
    </div>
  );
}

export default function KidProfile({ kid }: KidProfileProps) {
  return (
    <div className="mx-auto w-full max-w-[820px] px-10 pb-20 pt-[34px]">
      {/* Back link */}
      <Link
        href="/kids"
        className="mb-5 flex items-center gap-[7px] text-[14px] font-bold text-[#94887B]"
      >
        <BackIcon />
        Volver a Niños
      </Link>

      <div className="flex flex-wrap items-start gap-[26px]">
        {/* Left column */}
        <div className="flex min-w-[300px] flex-1 flex-col gap-[18px]">
          {/* Avatar + name */}
          <div className="flex items-center gap-[18px]">
            <div
              className="flex h-[84px] w-[84px] flex-none items-center justify-center rounded-full font-fredoka text-[34px] font-semibold"
              style={{ background: kid.avatarBg, color: kid.avatarText }}
            >
              {kid.initial}
            </div>
            <div className="flex-1">
              <h1 className="m-0 font-fredoka text-[28px] font-semibold text-[#3F362E]">
                {kid.name}
              </h1>
              <p className="mt-[3px] text-[15px] text-[#94887B]">
                {kid.age} años · Sala {kid.room}
              </p>
            </div>
            <button className="rounded-xl border border-[1.5px] border-[#ECE0D0] bg-[#FFFDF9] px-4 py-[9px] text-[14px] font-bold text-[#6E6359]">
              Editar
            </button>
          </div>

          {/* Allergies block — only when allergies exist */}
          {kid.allergies && (
            <div className="flex gap-[14px] rounded-[16px] bg-[#FBDAD6] px-[18px] py-4">
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-[11px] bg-[#F4A8A0]">
                <AlertIcon />
              </div>
              <div>
                <div className="mb-[2px] text-[15px] font-extrabold text-[#C5413A]">
                  Alergias y notas
                </div>
                <div className="text-[14.5px] leading-[1.5] text-[#B25249]">
                  {kid.allergies}
                </div>
              </div>
            </div>
          )}

          {/* Basic data table */}
          <div className="overflow-hidden rounded-[16px] border border-[#ECE0D0] bg-[#FFFDF9]">
            <div className="flex justify-between border-b border-[#F0E6D8] px-[18px] py-[15px]">
              <span className="text-[14.5px] text-[#94887B]">Fecha de nacimiento</span>
              <span className="text-[14.5px] font-extrabold text-[#3F362E]">{kid.birthDate}</span>
            </div>
            <div className="flex justify-between border-b border-[#F0E6D8] px-[18px] py-[15px]">
              <span className="text-[14.5px] text-[#94887B]">Sala</span>
              <span className="text-[14.5px] font-extrabold text-[#3F362E]">{kid.room}</span>
            </div>
            <div className="flex justify-between px-[18px] py-[15px]">
              <span className="text-[14.5px] text-[#94887B]">Ingreso</span>
              <span className="text-[14.5px] font-extrabold text-[#3F362E]">{kid.enrolledSince}</span>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="flex w-[300px] flex-none flex-col gap-[14px]">
          {/* Resumen del día button (placeholder) */}
          <button className="flex w-full items-center justify-center gap-[9px] rounded-[14px] bg-[#3F362E] px-4 py-[13px] text-[15px] font-extrabold text-white">
            <SunIcon />
            Resumen del día
          </button>

          {/* Parents card */}
          <div className="rounded-[16px] border border-[#ECE0D0] bg-[#FFFDF9] px-[18px] py-4">
            <div className="mb-[14px] text-[12.5px] font-extrabold tracking-[.8px] text-[#8A7C6D]">
              PADRES VINCULADOS
            </div>
            <div className="flex flex-col gap-[14px]">
              {kid.parents.map((parent) => (
                <ParentRow key={parent.id} parent={parent} />
              ))}
              {/* Link another parent (placeholder) */}
              <a
                href="#"
                className="flex items-center gap-3 pt-2"
              >
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full border border-dashed border-[#D8CBBA] text-[#B0A290]">
                  <PlusIcon />
                </span>
                <span className="text-[14.5px] font-extrabold text-[#C5503A]">
                  Vincular otro padre
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
