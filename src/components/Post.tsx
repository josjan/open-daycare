import { type Post as PostData, categoryStyles } from "@/data/mock";

function HeartIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="#E0654A" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" />
    </svg>
  );
}

function MegaphoneIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 11 18-5v12L3 14v-3zM11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </svg>
  );
}

function PhotoIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.6-3.6a2 2 0 0 0-2.8 0L6 21" />
    </svg>
  );
}

export default function Post({ post }: { post: PostData }) {
  const style = categoryStyles[post.category];

  return (
    <div className="rounded-[20px] border border-[#ECE0D0] bg-[#FFFDF9] p-5 px-[22px] shadow-[0_4px_16px_-12px_rgba(120,90,60,.5)]">
      <div className="mb-[14px] flex items-center gap-3">
        <div
          className="flex h-11 w-11 flex-none items-center justify-center rounded-full font-fredoka font-semibold"
          style={{ background: post.childAvatarBg, color: style.avatarText, fontSize: 17 }}
        >
          {post.category === "announcement" ? <MegaphoneIcon /> : post.childInitial}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-fredoka text-base font-semibold text-[#3F362E]">
            {post.childName}
          </div>
          <div className="text-xs text-[#A89A8B]">
            {post.time} · publicado por vos
          </div>
        </div>
        <div
          className="flex items-center gap-[7px] rounded-full px-3 py-[6px]"
          style={{ background: style.badgeBg }}
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: style.badgeDot }}
          />
          <span
            className="text-xs font-extrabold tracking-wide"
            style={{ color: style.badgeText }}
          >
            {style.badgeLabel}
          </span>
        </div>
      </div>

      <div className="mb-[10px] text-xs text-[#A89A8B]">Para: {post.audience}</div>

      <p className="m-0 text-[15.5px] leading-relaxed text-[#4A4038]">{post.content}</p>

      {post.image && (
        <a
          href="foto.dc.html"
          className="mt-[14px] flex h-[200px] flex-col items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-[#DBCDBA] bg-[#F4ECE1] text-[#B0A290]"
        >
          <PhotoIcon />
          <span className="text-sm">{post.image.label}</span>
        </a>
      )}

      <div className="mt-4 flex items-center gap-[18px] border-t border-[#F0E6D8] pt-[14px]">
        <span className="flex items-center gap-[7px] text-sm font-bold text-[#E0654A]">
          <HeartIcon />
          {post.likes}
        </span>
        <a
          href="detalle-publicacion.dc.html"
          className="flex items-center gap-[7px] text-sm font-bold text-[#94887B]"
        >
          <CommentIcon />
          {post.comments}
        </a>
        <span className="flex-1" />
        <a
          href="crear-publicacion.dc.html"
          className="text-sm font-extrabold text-[#C5503A]"
        >
          Editar
        </a>
      </div>
    </div>
  );
}
