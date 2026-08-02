"use client";

import { useEffect, useRef, useState } from "react";
import {
  type Kid,
  type Post,
  type PostCategory,
  categoryStyles,
} from "@/data/mock";

const CATEGORIES: PostCategory[] = [
  "food",
  "nap",
  "activity",
  "achievement",
  "mood",
  "photo",
  "announcement",
];

const INITIAL_DESCRIPTION =
  "Pintamos con témperas esta mañana. Mateo eligió el azul para todo y se concentró un montón.";

interface CreatePostModalProps {
  kids: Kid[];
  onClose: () => void;
  onPublish: (post: Post) => void;
}

function PlusIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C5503A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export default function CreatePostModal({
  kids,
  onClose,
  onPublish,
}: CreatePostModalProps) {
  const [audienceId, setAudienceId] = useState(kids[0]?.id ?? "all");
  const [category, setCategory] = useState<PostCategory>("food");
  const [description, setDescription] = useState(INITIAL_DESCRIPTION);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const photosRef = useRef<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => {
    return () => photosRef.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const addFiles = (files: File[]) => {
    const images = files.filter((file) => file.type.startsWith("image/"));
    const remaining = 4 - photos.length;
    if (remaining <= 0) return;
    const urls = images
      .slice(0, remaining)
      .map((file) => URL.createObjectURL(file));
    const next = [...photos, ...urls];
    setPhotos(next);
    photosRef.current = next;
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(photos[index]);
    const next = photos.filter((_, i) => i !== index);
    setPhotos(next);
    photosRef.current = next;
  };

  const handlePublish = () => {
    const content = description.trim();
    if (!content) return;
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes(),
    ).padStart(2, "0")}`;
    const kid = kids.find((k) => k.id === audienceId);
    const firstName = kid ? kid.name.split(" ")[0] : null;
    const image =
      photos.length > 0 ? { label: "foto", src: photos[0] } : undefined;

    if (image) {
      photosRef.current = photosRef.current.filter((url) => url !== image.src);
    }

    onPublish({
      id: crypto.randomUUID(),
      childName: firstName ?? "Anuncio general",
      childInitial: kid?.initial ?? "",
      childAvatarBg: kid?.avatarBg ?? "#CCD8F4",
      category,
      time,
      audience: firstName ? `familia de ${firstName}` : "toda la sala",
      content,
      image,
      likes: 0,
      comments: 0,
    });
  };

  const canPublish = description.trim().length > 0;

  return (
      <div
        className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#3F362E]/45 px-6 pb-10 pt-12"
        onClick={onClose}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-post-title"
          className="w-full max-w-[580px] overflow-hidden rounded-[24px] border border-[#ECE0D0] bg-[#FBF4EC] shadow-[0_20px_50px_-24px_rgba(63,54,46,.35)]"
          onClick={(event) => event.stopPropagation()}
        >
        <div className="flex items-center justify-between border-b border-[#ECE0D0] px-[26px] py-5">
          <button
            type="button"
            onClick={onClose}
            className="text-[15px] font-bold text-[#94887B]"
          >
            Cancelar
          </button>
          <span id="create-post-title" className="font-fredoka text-lg font-semibold text-[#3F362E]">
            Nueva publicación
          </span>
          <button
            type="button"
            onClick={handlePublish}
            disabled={!canPublish}
            className="text-[15px] font-extrabold text-[#D9583C] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Publicar
          </button>
        </div>

        <div className="px-[26px] py-6">
          <div className="mb-[10px] text-xs font-extrabold tracking-[.7px] text-[#94887B]">
            PARA
          </div>
          <div className="mb-[22px] flex flex-wrap gap-[9px]">
            {kids.map((kid) => {
              const selected = audienceId === kid.id;
              return (
                <button
                  key={kid.id}
                  type="button"
                  onClick={() => setAudienceId(kid.id)}
                  aria-pressed={selected}
                  className={`flex items-center gap-2 rounded-full py-[6px] pl-[6px] pr-[14px] text-[14px] font-bold ${
                    selected
                      ? "border-[1.5px] border-[#3F362E] bg-[#3F362E] text-white"
                      : "border-[1.5px] border-[#ECE0D0] bg-[#FFFDF9] text-[#6E6359]"
                  }`}
                >
                  <span
                    className="flex h-[26px] w-[26px] items-center justify-center rounded-full font-fredoka font-semibold"
                    style={{ background: kid.avatarBg, color: kid.avatarText, fontSize: 13 }}
                  >
                    {kid.initial}
                  </span>
                  {kid.name.split(" ")[0]}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setAudienceId("all")}
              aria-pressed={audienceId === "all"}
              className={`rounded-full px-4 py-[6px] text-[14px] font-bold ${
                audienceId === "all"
                  ? "border-[1.5px] border-[#3F362E] bg-[#3F362E] text-white"
                  : "border-[1.5px] border-[#ECE0D0] bg-[#FFFDF9] text-[#6E6359]"
              }`}
            >
              Toda la sala
            </button>
          </div>

          <div className="mb-[10px] text-xs font-extrabold tracking-[.7px] text-[#94887B]">
            TIPO
          </div>
          <div className="mb-[22px] flex flex-wrap gap-[9px]">
            {CATEGORIES.map((cat) => {
              const style = categoryStyles[cat];
              const selected = category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  aria-pressed={selected}
                  className={`rounded-full px-4 py-2 text-[13.5px] font-extrabold ${
                    selected
                      ? "ring-2 ring-[#3F362E] ring-offset-2 ring-offset-[#FBF4EC]"
                      : ""
                  }`}
                  style={{ background: style.badgeBg, color: style.badgeText }}
                >
                  {style.badgeLabel}
                </button>
              );
            })}
          </div>

          <div className="mb-[10px] text-xs font-extrabold tracking-[.7px] text-[#94887B]">
            DESCRIPCIÓN
          </div>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Contá cómo le fue hoy…"
            className="mb-[22px] min-h-[120px] w-full resize-y rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[14px] text-[15px] leading-normal text-[#3F362E]"
          />

          <div className="mb-[10px] text-xs font-extrabold tracking-[.7px] text-[#94887B]">
            FOTOS
          </div>
          <div
            className={`flex gap-3 rounded-2xl ${isDragging ? "bg-[#F4ECE1]" : ""}`}
            onDragOver={(event) => {
              event.preventDefault();
            }}
            onDragEnter={(event) => {
              event.preventDefault();
              dragCounterRef.current += 1;
              setIsDragging(true);
            }}
            onDragLeave={() => {
              dragCounterRef.current -= 1;
              if (dragCounterRef.current <= 0) setIsDragging(false);
            }}
            onDrop={(event) => {
              event.preventDefault();
              dragCounterRef.current = 0;
              setIsDragging(false);
              addFiles(Array.from(event.dataTransfer.files));
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              aria-label="Agregar fotos"
              className="hidden"
              onChange={(event) => {
                if (event.target.files) addFiles(Array.from(event.target.files));
                event.target.value = "";
              }}
            />
            {photos.map((url, index) => (
              <div
                key={url}
                className="relative h-24 w-24 flex-none overflow-hidden rounded-[14px] border border-[#ECE0D0]"
              >
                <img src={url} alt={`foto ${index + 1}`} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  aria-label="Quitar foto"
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#3F362E]/60 text-xs font-bold text-white"
                >
                  ×
                </button>
              </div>
            ))}
            {photos.length < 4 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-24 w-24 flex-none flex-col items-center justify-center gap-[6px] rounded-[14px] border-[1.5px] border-dashed border-[#DBCDBA] bg-[#F4ECE1] text-[#B0A290]"
              >
                <PlusIcon />
                <span className="text-xs">Agregar</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
