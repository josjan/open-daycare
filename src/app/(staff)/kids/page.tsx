"use client";

import { useCallback, useEffect, useState } from "react";
import KidCard from "@/components/KidCard";
import AddKidModal from "@/components/AddKidModal";
import { Kid } from "@/data/mock";
import { Room, ChildRow, NewChildForm } from "@/types/child";
import { childToKid } from "@/lib/childMappers";
import { createClient } from "@/utils/supabase/client";

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

function groupKidsByRoom(
  roomRows: Room[],
  childRows: ChildRow[],
): Record<string, Kid[]> {
  const grouped: Record<string, Kid[]> = {};
  roomRows.forEach((room) => {
    grouped[room.id] = [];
  });

  let avatarIndex = 0;
  childRows.forEach((child) => {
    const kid = childToKid(child, avatarIndex);
    avatarIndex += 1;
    const list = grouped[child.room_id] ?? [];
    list.push(kid);
    grouped[child.room_id] = list;
  });

  return grouped;
}

export default function KidsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [kidsByRoom, setKidsByRoom] = useState<Record<string, Kid[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddKidOpen, setIsAddKidOpen] = useState(false);

  useEffect(() => {
    let ignore = false;
    const supabase = createClient();

    async function loadKids() {
      try {
        const { data: roomRows, error: roomsError } = await supabase
          .from("rooms")
          .select("id,name")
          .order("created_at");
        if (ignore) return;
        if (roomsError) {
          setError("No se pudieron cargar las salas.");
          return;
        }

        const { data: childRows, error: childrenError } = await supabase
          .from("children")
          .select("*, rooms(name)");
        if (ignore) return;
        if (childrenError) {
          setError("No se pudieron cargar los niños.");
          return;
        }

        setRooms(roomRows ?? []);
        setKidsByRoom(groupKidsByRoom(roomRows ?? [], childRows ?? []));
      } catch {
        if (!ignore) setError("No se pudieron cargar los datos.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadKids();

    return () => {
      ignore = true;
    };
  }, []);

  const closeAddKidModal = useCallback(() => {
    setIsAddKidOpen(false);
  }, []);

  const handleSaveKid = useCallback(
    async (form: NewChildForm): Promise<boolean> => {
      const supabase = createClient();
      const today = new Date();
      const enrolledAt = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0"),
      ].join("-");

      const { data, error } = await supabase
        .from("children")
        .insert({
          room_id: form.roomId,
          full_name: form.name,
          birth_date: form.birthDateISO,
          enrolled_at: enrolledAt,
          medical_notes: form.medicalNotes.length > 0 ? form.medicalNotes : null,
          allergy_tags: form.allergyTags,
          photo_consent: true,
          status: "active",
        })
        .select("*, rooms(name)")
        .single();

      if (error || !data) return false;

      setKidsByRoom((prev) => {
        const avatarIndex = Object.values(prev).reduce(
          (total, list) => total + list.length,
          0,
        );
        const kid = childToKid(data as ChildRow, avatarIndex);
        return {
          ...prev,
          [form.roomId]: [...(prev[form.roomId] ?? []), kid],
        };
      });

      return true;
    },
    [],
  );

  return (
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
        <button
          onClick={() => setIsAddKidOpen(true)}
          className="flex items-center gap-2 rounded-[14px] bg-gradient-to-b from-[#F4977E] to-[#EE8164] px-[18px] py-[11px] text-[14.5px] font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,.7)]"
        >
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

      {loading && (
        <div className="py-10 text-center text-[15px] font-semibold text-[#94887B]">
          Cargando…
        </div>
      )}

      {error && (
        <div className="mb-[14px] rounded-[14px] border-[1.5px] border-[#F2A78E] bg-[#FDEBE3] px-4 py-3 text-[13.5px] font-semibold text-[#C5503A]">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="flex flex-col gap-[30px]">
          {rooms.map((room) => {
            const kidsInRoom = kidsByRoom[room.id] ?? [];
            return (
              <section key={room.id}>
                <div className="mb-[14px] flex items-center gap-3">
                  <span className="text-[12.5px] font-extrabold tracking-[.8px] text-[#3F362E]">
                    SALA {room.name.toUpperCase()}
                  </span>
                  <span className="text-[13px] text-[#A89A8B]">
                    {kidsInRoom.length} niños
                  </span>
                  <span className="h-[1px] flex-1 bg-[#E7DAC8]" />
                </div>

                {kidsInRoom.length === 0 ? (
                  <div className="rounded-[18px] border border-dashed border-[#E7DAC8] bg-[#FFFDF9]/60 px-4 py-[22px] text-center text-[13.5px] font-semibold text-[#A89A8B]">
                    No hay niños en esta sala todavía.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-[14px]">
                    {kidsInRoom.map((kid) => (
                      <KidCard key={kid.id} kid={kid} />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {isAddKidOpen && (
        <AddKidModal
          rooms={rooms}
          onClose={closeAddKidModal}
          onSave={handleSaveKid}
        />
      )}
    </div>
  );
}
