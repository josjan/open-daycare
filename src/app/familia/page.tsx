"use client";

import { useEffect, useState } from "react";
import Post from "@/components/Post";
import { postRowToPost } from "@/lib/postMappers";
import type { PostRow } from "@/types/post";
import { createClient } from "@/utils/supabase/client";

const BASE_SELECT =
  "id, type, title, body, published_at, room_id, author_id, " +
  "users(full_name), rooms(name), " +
  "post_photos(url, position), reactions(count), comments(count)";

const CHILD_POSTS_SELECT =
  BASE_SELECT +
  ", post_children!inner(child_id, children(full_name, rooms(name)))";

const ANNOUNCEMENTS_SELECT =
  BASE_SELECT + ", post_children(child_id, children(full_name, rooms(name)))";

interface FamilyChild {
  id: string;
  fullName: string;
  roomId: string | null;
}

const shortMonths = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

const weekDays = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

function todayLabel(): string {
  const now = new Date();
  return `${weekDays[now.getDay()]} ${now.getDate()} ${shortMonths[now.getMonth()]}`;
}

function uniqueById<T extends { id: string }>(rows: T[]): T[] {
  const seen = new Set<string>();
  return rows.filter((row) => {
    if (seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  });
}

export default function FamilyFeedPage() {
  const [firstName, setFirstName] = useState("");
  const [kids, setKids] = useState<FamilyChild[]>([]);
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    const supabase = createClient();

    async function loadFeed() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (ignore) return;
        if (!user) return;

        const { data: profile } = await supabase
          .from("users")
          .select("full_name")
          .eq("id", user.id)
          .single();

        const { data: links } = await supabase
          .from("parent_children")
          .select("relationship, children(id, full_name, room_id)")
          .eq("parent_id", user.id);

        if (ignore) return;

        if (profile) {
          setFirstName(profile.full_name.split(" ")[0] ?? profile.full_name);
        }

        const childRows = (links ?? [])
          .flatMap((link) => link.children)
          .filter((child): child is { id: string; full_name: string; room_id: string | null } =>
            child !== null && typeof child === "object" && "id" in child,
          );
        const myKids: FamilyChild[] = childRows.map((child) => ({
          id: child.id,
          fullName: child.full_name,
          roomId: child.room_id,
        }));
        setKids(myKids);

        const childIds = myKids.map((kid) => kid.id);
        const roomIds = Array.from(
          new Set(myKids.map((kid) => kid.roomId).filter(Boolean)),
        );

        const [childPostsResult, announcementResult] = await Promise.all([
          childIds.length > 0
            ? supabase
                .from("posts")
                .select(CHILD_POSTS_SELECT)
                .in("post_children.child_id", childIds)
                .order("published_at", { ascending: false })
            : Promise.resolve({ data: null, error: null }),
          roomIds.length > 0
            ? supabase
                .from("posts")
                .select(ANNOUNCEMENTS_SELECT)
                .eq("type", "announcement")
                .in("room_id", roomIds)
                .order("published_at", { ascending: false })
            : Promise.resolve({ data: null, error: null }),
        ]);

        if (ignore) return;

        if (childPostsResult.error || announcementResult.error) {
          setError("No pudimos cargar las publicaciones.");
          return;
        }

        const merged = uniqueById([
          ...((childPostsResult.data as unknown as PostRow[]) ?? []),
          ...((announcementResult.data as unknown as PostRow[]) ?? []),
        ]).sort(
          (a, b) =>
            new Date(b.published_at).getTime() - new Date(a.published_at).getTime(),
        );
        setPosts(merged);
      } catch {
        if (!ignore) setError("No pudimos cargar las publicaciones.");
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    loadFeed();

    return () => {
      ignore = true;
    };
  }, []);

  const filteredPosts: PostRow[] =
    selectedChildId === "all"
      ? posts
      : posts.filter((row) => {
          const tagsChild = row.post_children?.some(
            (pc) => pc.child_id === selectedChildId,
          );
          if (tagsChild) return true;
          if (row.type !== "announcement") return false;
          const child = kids.find((kid) => kid.id === selectedChildId);
          return child?.roomId != null && row.room_id === child.roomId;
        });

  return (
    <div className="mx-auto w-full max-w-[760px] px-10 pb-20 pt-[34px]">
      <div className="mb-6">
        <div className="mb-1 text-[12.5px] font-extrabold tracking-wide text-[#D9583C]">
          TU FAMILIA
        </div>
        <h1 className="m-0 font-fredoka text-[30px] font-semibold text-[#3F362E]">
          Hola, {firstName || "…"}
        </h1>
        <p className="mt-[5px] text-[14.5px] text-[#94887B]">
          Así va el día de hoy
        </p>
      </div>

      {kids.length > 0 && (
        <div className="mb-[22px] flex flex-wrap items-center gap-[9px]">
          <button
            type="button"
            onClick={() => setSelectedChildId("all")}
            aria-pressed={selectedChildId === "all"}
            className={`rounded-full px-4 py-[7px] text-[14px] font-bold ${
              selectedChildId === "all"
                ? "border-[1.5px] border-[#3F362E] bg-[#3F362E] text-white"
                : "border-[1.5px] border-[#ECE0D0] bg-[#FFFDF9] text-[#6E6359]"
            }`}
          >
            Todos
          </button>
          {kids.map((kid) => {
            const selected = selectedChildId === kid.id;
            return (
              <button
                key={kid.id}
                type="button"
                onClick={() => setSelectedChildId(kid.id)}
                aria-pressed={selected}
                className={`rounded-full px-4 py-[7px] text-[14px] font-bold ${
                  selected
                    ? "border-[1.5px] border-[#3F362E] bg-[#3F362E] text-white"
                    : "border-[1.5px] border-[#ECE0D0] bg-[#FFFDF9] text-[#6E6359]"
                }`}
              >
                {kid.fullName.split(" ")[0]}
              </button>
            );
          })}
        </div>
      )}

      <div className="mb-[14px] flex items-center gap-[14px]">
        <span className="text-[12.5px] font-extrabold tracking-wide text-[#8A7C6D]">
          HOY · {todayLabel()}
        </span>
        <span className="h-[1px] flex-1 bg-[#E7DAC8]" />
      </div>

      {isLoading && (
        <p className="py-8 text-center text-sm text-[#94887B]">
          Cargando publicaciones…
        </p>
      )}

      {!isLoading && error && (
        <div className="rounded-[20px] border border-[#EADFD0] bg-[#FFFDF9] p-6 text-center">
          <p className="mb-3 text-[15px] text-[#4A4038]">
            No pudimos cargar las publicaciones.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-full bg-[#D9583C] px-5 py-2 text-sm font-extrabold text-white"
          >
            Reintentar
          </button>
        </div>
      )}

      {!isLoading && !error && (
        <div className="flex flex-col gap-4">
          {filteredPosts.length === 0 && (
            <p className="py-8 text-center text-sm text-[#94887B]">
              Todavía no hay publicaciones para tu familia.
            </p>
          )}
          {filteredPosts.map((row) => (
            <Post key={row.id} post={postRowToPost(row)} variant="family" />
          ))}
        </div>
      )}
    </div>
  );
}
