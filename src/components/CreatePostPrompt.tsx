import { currentUser } from "@/data/mock";

function CameraIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

export default function CreatePostPrompt({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="mb-6 flex w-full items-center gap-3.5 rounded-2xl border border-[#ECE0D0] bg-[#FFFDF9] px-[18px] py-3.5 text-left shadow-[0_4px_14px_-10px_rgba(120,90,60,.4)]"
    >
      <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[#F2937A] font-fredoka font-semibold text-white" style={{ fontSize: 16 }}>
        {currentUser.initial}
      </div>
      <span className="flex-1 text-[15px] text-[#A89A8B]">Compartí un momento…</span>
      <span className="flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-[#FBE3D8] text-[#E0654A]">
        <CameraIcon />
      </span>
    </button>
  );
}
