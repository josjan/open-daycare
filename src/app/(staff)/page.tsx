"use client";

import { useCallback, useEffect, useState } from "react";
import CreatePostPrompt from "@/components/CreatePostPrompt";
import Post from "@/components/Post";
import { useCreatePost } from "@/components/CreatePostProvider";

import { type Post as PostData, pageInfo } from "@/data/mock";
import { postRowToPost } from "@/lib/postMappers";
import type { PostRow } from "@/types/post";
import { createClient } from "@/utils/supabase/client";

const FEED_SELECT =
  "id, type, title, body, published_at, room_id, author_id, " +
  "users(full_name), rooms(name), " +
  "post_children(child_id, children(full_name)), " +
  "post_photos(url, position), reactions(count), comments(count)";

export default function Home() {
  const { openCreatePost, feedVersion } = useCreatePost();
  const [feedPosts, setFeedPosts] = useState<PostData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts, feedVersion]);

  return (
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

      <CreatePostPrompt onOpen={openCreatePost} />

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
  );
}
