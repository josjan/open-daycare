"use client";

import { useEffect, useState } from "react";
import { Kid } from "@/data/mock";
import { relationshipToDb } from "@/lib/relationship";

interface LinkParentModalProps {
  kid: Kid;
  onClose: () => void;
  onInvited: () => void;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function CloseIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#4E72C8"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-[1px] flex-none"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#fff"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m22 2-7 20-4-9-9-4z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}

export default function LinkParentModal({ kid, onClose, onInvited }: LinkParentModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Mamá");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const nameValid = name.trim().length > 0;
  const emailValid = emailRegex.test(email.trim());
  const canInvite = nameValid && emailValid && role.length > 0 && !loading && !inviteCode;

  async function handleInvite() {
    if (!canInvite) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          child_id: kid.id,
          full_name: name.trim(),
          email: email.trim(),
          relationship: relationshipToDb[role],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "No se pudo enviar la invitación.");
        return;
      }

      setInviteCode(data.code);
      onInvited();
    } catch {
      setError("No se pudo enviar la invitación. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-[#3F362E]/45 px-6 pt-10"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Vincular padre"
        className="w-full max-w-[520px] overflow-hidden rounded-[24px] border border-[#ECE0D0] bg-[#FBF4EC] shadow-[0_20px_50px_-24px_rgba(63,54,46,.35)]"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-[26px] py-5">
          <button
            type="button"
            onClick={onClose}
            className="text-[15px] font-bold text-[#94887B]"
          >
            Cancelar
          </button>
          <div className="text-center">
            <div className="font-fredoka text-[18px] font-semibold text-[#3F362E]">
              Vincular padre
            </div>
            <div className="text-[13px] text-[#A89A8B]">a {kid.name}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-[#F0E6D8] text-[#94887B]"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Body */}
        <div className="px-[26px] pb-[22px]">
          <div className="mb-5 flex gap-[11px] rounded-[14px] bg-[#E3ECFB] px-4 py-[13px]">
            <InfoIcon />
            <span className="text-[13.5px] leading-[1.45] text-[#3F5694]">
              Le enviaremos un correo con un código para que active su cuenta. Solo verá el
              feed de {kid.name}.
            </span>
          </div>

          <div className="mb-2 text-[12px] font-extrabold tracking-[0.7px] text-[#94887B]">
            NOMBRE DEL PADRE/MADRE
          </div>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ej. Diego Fernández"
            className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[13px] text-[15px] text-[#3F362E] placeholder-[#B6A99B] outline-none"
          />

          <div className="mb-2 text-[12px] font-extrabold tracking-[0.7px] text-[#94887B]">
            EMAIL
          </div>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="correo@ejemplo.com"
            className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[13px] text-[15px] text-[#3F362E] placeholder-[#B6A99B] outline-none"
          />
          {email.length > 0 && !emailValid && (
            <div className="-mt-[12px] mb-[14px] text-[13px] font-semibold text-[#D9583C]">
              Email inválido
            </div>
          )}

          <div className="mb-[10px] text-[12px] font-extrabold tracking-[0.7px] text-[#94887B]">
            PARENTESCO
          </div>
          <div className="mb-5 flex gap-[9px]">
            {(["Mamá", "Papá", "Tutor/a"] as const).map((option) => {
              const selected = option === role;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setRole(option)}
                  aria-pressed={selected}
                  className={
                    selected
                      ? "flex-1 rounded-full border-[1.5px] border-[#9FB8EC] bg-[#CCD8F4] px-2 py-[11px] text-[14px] font-extrabold text-[#4E72C8]"
                      : "flex-1 rounded-full border-[1.5px] border-[#ECE0D0] bg-[#FFFDF9] px-2 py-[11px] text-[14px] font-extrabold text-[#6E6359]"
                  }
                >
                  {option}
                </button>
              );
            })}
          </div>

          <div className="mb-5 rounded-[16px] border-[1.5px] border-dashed border-[#E6D08A] bg-[#FBF1D6] px-[18px] py-[18px] text-center">
            <div className="mb-2 text-[12px] font-extrabold tracking-[0.7px] text-[#A88526]">
              CÓDIGO DE INVITACIÓN
            </div>
            <div className="font-fredoka text-[34px] font-semibold tracking-[7px] text-[#8A7234]">
              {inviteCode ?? "—"}
            </div>
            <div className="mt-[6px] text-[13px] text-[#A88526]">Vence en 7 días</div>
          </div>

          {error && (
            <div className="mb-5 rounded-[14px] bg-[#FDEBE3] px-4 py-3 text-[13.5px] font-semibold text-[#C5503A]">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleInvite}
            disabled={!canInvite}
            className="flex w-full items-center justify-center gap-[9px] rounded-[14px] bg-gradient-to-b from-[#F4977E] to-[#EE8164] px-4 py-[14px] text-[15.5px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,.7)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <SendIcon />
            {loading ? "Enviando…" : inviteCode ? "Invitación enviada" : "Enviar invitación"}
          </button>
        </div>
      </div>
    </div>
  );
}
