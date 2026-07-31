"use client";

import { useEffect, useState } from "react";
import { Kid, avatarPalette, kids } from "@/data/mock";
import { slugify } from "@/lib/slugify";

interface AddKidModalProps {
  rooms: string[];
  onClose: () => void;
  onSave: (kid: Kid) => void;
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

function formatDateMask(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  let masked = "";
  for (let i = 0; i < digits.length; i++) {
    if (i === 2 || i === 4) masked += "/";
    masked += digits[i];
  }
  return masked;
}

function daysInMonth(month: number, year: number): number {
  if (month === 2) {
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28;
  }
  return [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
}

function isValidDate(day: number, month: number, year: number): boolean {
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > daysInMonth(month, year)) return false;
  return year >= 1900 && year <= 2100;
}

function ChevronDownIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export default function AddKidModal({ rooms, onClose, onSave }: AddKidModalProps) {
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [room, setRoom] = useState("");
  const [allergies, setAllergies] = useState("");
  const [medicalNotes, setMedicalNotes] = useState("");

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const dateComplete = birthDate.length === 10;
  const [day, month, year] = birthDate.split("/").map(Number);
  const dateValid = dateComplete && isValidDate(day, month, year);
  const canSave = name.trim().length > 0 && dateValid && room.length > 0;

  function handleSave() {
    if (!canSave) return;
    const trimmedName = name.trim();
    const today = new Date();
    let age = today.getFullYear() - year;
    const birthdayThisYear = new Date(today.getFullYear(), month - 1, day);
    if (today < birthdayThisYear) age -= 1;

    const avatar = avatarPalette[kids.length % avatarPalette.length];

    onSave({
      id: slugify(trimmedName),
      name: trimmedName,
      initial: trimmedName.charAt(0).toUpperCase(),
      avatarBg: avatar.bg,
      avatarText: avatar.text,
      age,
      room,
      birthDate: `${day} ${shortMonths[month - 1]} ${year}`,
      enrolledSince: `${shortMonths[today.getMonth()]} ${today.getFullYear()}`,
      allergyLabel: allergies.trim() ? allergies.trim().toUpperCase() : undefined,
      allergies: medicalNotes.trim() ? medicalNotes.trim() : undefined,
      parents: [],
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-[#3F362E]/45 px-6 pt-10"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Agregar niño"
        className="w-full max-w-[520px] overflow-hidden rounded-[24px] border border-[#ECE0D0] bg-[#FBF4EC] shadow-[0_20px_50px_-24px_rgba(63,54,46,.35)]"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#ECE0D0] px-[26px] py-5">
          <button
            type="button"
            onClick={onClose}
            className="text-[15px] font-bold text-[#94887B]"
          >
            Cancelar
          </button>
          <span className="font-fredoka text-[18px] font-semibold text-[#3F362E]">
            Agregar niño
          </span>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="text-[15px] font-extrabold text-[#D9583C] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Guardar
          </button>
        </div>

        {/* Body */}
        <div className="px-[26px] py-6">
          <div className="mb-2 text-[12px] font-extrabold tracking-[0.7px] text-[#94887B]">
            NOMBRE COMPLETO
          </div>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ej. Martina López"
            className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[13px] text-[15px] text-[#3F362E] placeholder-[#B6A99B] outline-none"
          />

          <div className="mb-[18px] flex gap-[14px]">
            <div className="flex-1">
              <div className="mb-2 text-[12px] font-extrabold tracking-[0.7px] text-[#94887B]">
                FECHA DE NACIMIENTO
              </div>
              <input
                value={birthDate}
                onChange={(event) => setBirthDate(formatDateMask(event.target.value))}
                placeholder="dd/mm/aaaa"
                className="w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[13px] text-[15px] text-[#3F362E] placeholder-[#B6A99B] outline-none"
              />
              {dateComplete && !dateValid && (
                <div className="mt-2 text-[13px] font-semibold text-[#D9583C]">
                  Fecha inválida
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="mb-2 text-[12px] font-extrabold tracking-[0.7px] text-[#94887B]">
                SALA
              </div>
              <div className="relative">
                <select
                  value={room}
                  onChange={(event) => setRoom(event.target.value)}
                  className="w-full appearance-none rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[13px] pr-10 text-[15px] font-bold text-[#3F362E] outline-none"
                >
                  <option value="" disabled>
                    Seleccionar sala
                  </option>
                  {rooms.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#B0A290]">
                  <ChevronDownIcon />
                </div>
              </div>
            </div>
          </div>

          <div className="mb-2 text-[12px] font-extrabold tracking-[0.7px] text-[#94887B]">
            ALERGIAS (ETIQUETAS)
          </div>
          <input
            value={allergies}
            onChange={(event) => setAllergies(event.target.value)}
            placeholder="Ej. Maní, Lactosa"
            className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[13px] text-[15px] text-[#3F362E] placeholder-[#B6A99B] outline-none"
          />

          <div className="mb-2 text-[12px] font-extrabold tracking-[0.7px] text-[#94887B]">
            NOTAS MÉDICAS
          </div>
          <textarea
            value={medicalNotes}
            onChange={(event) => setMedicalNotes(event.target.value)}
            placeholder="Indicaciones, medicación, contactos…"
            className="w-full min-h-[90px] resize-y rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[13px] text-[15px] text-[#3F362E] placeholder-[#B6A99B] outline-none"
          />
        </div>
      </div>
    </div>
  );
}
