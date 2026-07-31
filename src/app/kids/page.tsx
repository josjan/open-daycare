import Sidebar from "@/components/Sidebar";
import KidCard from "@/components/KidCard";
import { kids, pageInfo } from "@/data/mock";

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#B0A290"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export default function KidsPage() {
  return (
    <div className="flex min-h-screen bg-[#F6ECDF]">
      <Sidebar activeNav="kids" />

      <main className="h-screen min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[880px] px-10 pb-20 pt-[34px]">

          {/* Header */}
          <div className="mb-[22px] flex items-end justify-between gap-4">
            <div>
              <div className="mb-1 text-[12.5px] font-extrabold tracking-[.8px] text-[#D9583C]">
                GESTIÓN
              </div>
              <h1 className="m-0 font-fredoka text-[30px] font-semibold text-[#3F362E]">
                Niños
              </h1>
            </div>
            <button className="flex items-center gap-2 rounded-[14px] bg-gradient-to-b from-[#F4977E] to-[#EE8164] px-[18px] py-[11px] text-[14.5px] font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,.7)]">
              <PlusIcon />
              Agregar niño
            </button>
          </div>

          {/* Search */}
          <div className="mb-[22px] flex items-center gap-[11px] rounded-[14px] border border-[#ECE0D0] bg-[#FFFDF9] px-4 py-3">
            <SearchIcon />
            <input
              placeholder="Buscar niño…"
              className="flex-1 border-none bg-transparent text-[15px] text-[#3F362E] placeholder-[#B6A99B] outline-none"
              readOnly
            />
          </div>

          {/* Section heading */}
          <div className="mb-[14px] flex items-center gap-3">
            <span className="text-[12.5px] font-extrabold tracking-[.8px] text-[#3F362E]">
              {pageInfo.roomName}
            </span>
            <span className="text-[13px] text-[#A89A8B]">{kids.length} niños</span>
            <span className="h-[1px] flex-1 bg-[#E7DAC8]" />
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 gap-[14px]">
            {kids.map((kid) => (
              <KidCard key={kid.id} kid={kid} />
            ))}
          </div>

        </div>
      </main>
    </div>
  );
}
