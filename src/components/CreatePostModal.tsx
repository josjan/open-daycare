"use client";

import { useEffect, useRef, useState } from "react";
import {
  type Kid,
  type PostCategory,
  categoryStyles,
} from "@/data/mock";
import { categoryToPostType } from "@/lib/postMappers";
import { createClient } from "@/utils/supabase/client";

const CATEGORIES: PostCategory[] = [
  "food",
  "nap",
  "activity",
  "achievement",
  "mood",
  "photo",
  "announcement",
];

const INITIAL_DESCRIPTION = "";

interface PhotoDraft {
  file: File;
  url: string;
}

interface CreatePostModalProps {
  kids: Kid[];
  authorId: string;
  staffRoomId: string | null;
  onClose: () => void;
  onPublished: () => void;
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
  authorId,
  staffRoomId,
  onClose,
  onPublished,
}: CreatePostModalProps) {
  const [audienceId, setAudienceId] = useState(kids[0]?.id ?? "all");
  const [category, setCategory] = useState<PostCategory>("food");
  const [description, setDescription] = useState(INITIAL_DESCRIPTION);
  const [photos, setPhotos] = useState<PhotoDraft[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const photosRef = useRef<PhotoDraft[]>([]);
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
    return () => photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.url));
  }, []);

  const addFiles = (files: File[]) => {
    const images = files.filter((file) => file.type.startsWith("image/"));
    const remaining = 4 - photos.length;
    if (remaining <= 0) return;
    const next: PhotoDraft[] = [
      ...photos,
      ...images.slice(0, remaining).map((file) => ({
        file,
        url: URL.createObjectURL(file),
      })),
    ];
    setPhotos(next);
    photosRef.current = next;
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(photos[index].url);
    const next = photos.filter((_, i) => i !== index);
    setPhotos(next);
    photosRef.current = next;
  };

  const handlePublish = async () => {
    const content = description.trim();
    if (!content || isPublishing) return;

    setIsPublishing(true);
    setError(null);
    const supabase = createClient();
    const isAnnouncement = audienceId === "all";
    const type = isAnnouncement ? "announcement" : categoryToPostType(category);

    const { data: post, error: postError } = await supabase
      .from("posts")
      .insert({
        author_id: authorId,
        room_id: isAnnouncement ? staffRoomId : null,
        type,
        title: isAnnouncement ? "Anuncio general" : null,
        body: content,
        published_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (postError || !post) {
      setError("No se pudo publicar el post. Intentalo de nuevo.");
      setIsPublishing(false);
      return;
    }

    if (photos.length > 0) {
      const photoRows = [];
      for (let i = 0; i < photos.length; i += 1) {
        const photo = photos[i];
        const path = `${post.id}/${i}-${photo.file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("post-photos")
          .upload(path, photo.file, { upsert: false });
        if (uploadError) {
          setError("No se pudo subir una de las fotos.");
          setIsPublishing(false);
          return;
        }
        const { data: urlData } = supabase.storage
          .from("post-photos")
          .getPublicUrl(path);
        photoRows.push({
          post_id: post.id,
          url: urlData.publicUrl,
          position: i,
        });
      }
      const { error: photosError } = await supabase
        .from("post_photos")
        .insert(photoRows);
      if (photosError) {
        setError("No se pudo guardar las fotos.");
        setIsPublishing(false);
        return;
      }
    }

    if (!isAnnouncement) {
      const { error: childError } = await supabase
        .from("post_children")
        .insert({ post_id: post.id, child_id: audienceId });
      if (childError) {
        setError("No se pudo asociar el post al niño.");
        setIsPublishing(false);
        return;
      }
    }

    photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.url));
    onPublished();
  };

  const canPublish = description.trim().length > 0 && !isPublishing;

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
            {isPublishing ? "Publicando…" : "Publicar"}
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
            {photos.map((photo, index) => (
              <div
                key={photo.url}
                className="relative h-24 w-24 flex-none overflow-hidden rounded-[14px] border border-[#ECE0D0]"
              >
                <img src={photo.url} alt={`foto ${index + 1}`} className="h-full w-full object-cover" />
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

          {error && (
            <div
              role="alert"
              className="mt-5 rounded-[12px] border-[1.5px] border-[#F2A78E] bg-[#FDEBE3] px-4 py-3 text-[13.5px] font-semibold text-[#C5503A]"
            >
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
