"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { type Kid } from "@/data/mock";
import CreatePostModal from "@/components/CreatePostModal";
import { childToKid } from "@/lib/childMappers";
import type { ChildRow } from "@/types/child";
import { createClient } from "@/utils/supabase/client";

interface CreatePostContextValue {
  openCreatePost: () => void;
  feedVersion: number;
}

const CreatePostContext = createContext<CreatePostContextValue | null>(null);

export function useCreatePost(): CreatePostContextValue {
  const value = useContext(CreatePostContext);
  if (!value) {
    throw new Error("useCreatePost must be used within CreatePostProvider");
  }
  return value;
}

export default function CreatePostProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [kids, setKids] = useState<Kid[]>([]);
  const [authorId, setAuthorId] = useState<string | null>(null);
  const [staffRoomId, setStaffRoomId] = useState<string | null>(null);
  const [feedVersion, setFeedVersion] = useState(0);

  useEffect(() => {
    let ignore = false;
    const supabase = createClient();

    async function loadContext() {
      const { data: { user } } = await supabase.auth.getUser();
      if (ignore) return;
      if (user) {
        const { data: profile } = await supabase
          .from("users")
          .select("id, room_id")
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

    return () => {
      ignore = true;
    };
  }, []);

  const openCreatePost = useCallback(() => setIsModalOpen(true), []);

  const handlePublished = useCallback(() => {
    setIsModalOpen(false);
    setFeedVersion((version) => version + 1);
  }, []);

  return (
    <CreatePostContext.Provider value={{ openCreatePost, feedVersion }}>
      {children}
      {isModalOpen && authorId && (
        <CreatePostModal
          kids={kids}
          authorId={authorId}
          staffRoomId={staffRoomId}
          onClose={() => setIsModalOpen(false)}
          onPublished={handlePublished}
        />
      )}
    </CreatePostContext.Provider>
  );
}
