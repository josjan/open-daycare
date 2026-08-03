"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import CreatePostPrompt from "@/components/CreatePostPrompt";
import CreatePostModal from "@/components/CreatePostModal";
import Post from "@/components/Post";

import { type Kid, type Post as PostData, pageInfo } from "@/data/mock";
import { childToKid } from "@/lib/childMappers";
import { postRowToPost } from "@/lib/postMappers";
import type { ChildRow } from "@/types/child";
import type { PostRow } from "@/types/post";
import { createClient } from "@/utils/supabase/client";

const FEED_SELECT =
  "id, type, title, body, published_at, room_id, author_id, " +
  "post_children(child_id, children(full_name)), " +
  "post_photos(url, position), reactions(count), comments(count)";

export default function Home() {
  const [feedPosts, setFeedPosts] = useState<PostData[]>([]);
  const [kids, setKids] = useState<Kid[]>([]);
  const [authorId, setAuthorId] = useState<string | null>(null);
  const [staffRoomId, setStaffRoomId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadPosts = async () => {
    setIsLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error: queryError } = await supabase
      .from("posts")
      .select(FEED_SELECT)
      .order("published_at", { ascending: false });
    if (queryError) {
      setError(queryError.message);
      setIsLoading(false);
      return;
    }
    setFeedPosts((data as unknown as PostRow[]).map(postRowToPost));
    setIsLoading(false);
  };

  useEffect(() => {
    let ignore = false;
    const supabase = createClient();

    async function loadContext() {
      const { data: { user } } = await supabase.auth.getUser();
      if (ignore) return;
      if (user) {
        const { data: profile } = await supabase
          .from("users")
          .select("id, role, room_id")
          .eq("id", user.id)
          .single();
        if (!ignore && profile) {
          setAuthorId(profile.id);
          setStaffRoomId(profile.room_id);
        }
      }

      const { data: childRows } = await supabase
        .from("children")
        .select("*, rooms(name)");
      if (ignore) return;
      setKids((childRows ?? []).map((child, index) =>
        childToKid(child as ChildRow, index),
      ));
    }

    loadContext();
    loadPosts();

    return () => {
      ignore = true;
    };
  }, []);

  const handlePublished = () => {
    setIsModalOpen(false);
    loadPosts();
  };

  return (
    <div className="flex min-h-screen bg-[#F6ECDF]">
      <Sidebar activeNav="feed" onCreatePost={() => setIsModalOpen(true)} />
      <main className="h-screen min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[760px] px-10 pb-20 pt-[34px]">
          <div className="mb-6">
            <div className="mb-1 text-[12.5px] font-extrabold tracking-wide text-[#D9583C]">
              {pageInfo.daycareName} · {pageInfo.roomName}
            </div>
            <h1 className="m-0 font-fredoka text-[30px] font-semibold text-[#3F362E]">
              Buenas, {pageInfo.teacherName}
            </h1>
            <p className="mt-[5px] text-[14.5px] text-[#94887B]">
              {pageInfo.childCount} niños · {pageInfo.date}
            </p>
          </div>

          <CreatePostPrompt onOpen={() => setIsModalOpen(true)} />

          <div className="mb-[14px] flex items-center gap-[14px]">
            <span className="text-[12.5px] font-extrabold tracking-wide text-[#8A7C6D]">
              PUBLICADO HOY
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
                onClick={loadPosts}
                className="rounded-full bg-[#D9583C] px-5 py-2 text-sm font-extrabold text-white"
              >
                Reintentar
              </button>
            </div>
          )}

          {!isLoading && !error && (
            <div className="flex flex-col gap-4">
              {feedPosts.length === 0 && (
                <p className="py-8 text-center text-sm text-[#94887B]">
                  Todavía no hay publicaciones.
                </p>
              )}
              {feedPosts.map((post) => (
                <Post key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </main>

      {isModalOpen && authorId && (
        <CreatePostModal
          kids={kids}
          authorId={authorId}
          staffRoomId={staffRoomId}
          onClose={() => setIsModalOpen(false)}
          onPublished={handlePublished}
        />
      )}
    </div>
  );
}
