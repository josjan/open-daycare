"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

function SunIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setLoading(false);
      setError("Email o contraseña incorrectos.");
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <div className="grid min-h-screen bg-[#FBF4EC] lg:grid-cols-[1.05fr_1fr]">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[linear-gradient(155deg,#F6A98E_0%,#F2937A_45%,#EC7E62_100%)] p-[56px_60px] text-white lg:flex">
        <div className="absolute -right-[120px] -top-[140px] h-[420px] w-[420px] rounded-full bg-[rgba(255,255,255,.12)]" />
        <div className="absolute -bottom-[110px] -left-[80px] h-[300px] w-[300px] rounded-full bg-[rgba(255,255,255,.10)]" />

        <div className="relative flex items-center gap-[13px]">
          <div className="flex h-[46px] w-[46px] items-center justify-center rounded-[14px] bg-[rgba(255,255,255,.22)]">
            <SunIcon />
          </div>
          <span className="font-fredoka text-[21px] font-semibold tracking-[.5px]">
            OpenDayCare
          </span>
        </div>

        <div className="relative">
          <h1 className="m-0 mb-[18px] font-fredoka text-[42px] font-semibold leading-[1.12]">
            El día de cada niño,
            <br />
            compartido con su familia.
          </h1>
          <p className="m-0 max-w-[430px] text-[17px] leading-[1.6] text-white/92">
            Publicá momentos, gestioná las salas y mantené a las familias cerca, desde un solo lugar.
          </p>
        </div>

        <div className="relative text-[14px] text-white/90">🌿 Guardería Sala Soles</div>
      </div>

      <div className="flex items-center justify-center p-10">
        <form onSubmit={handleSubmit} className="w-full max-w-[392px]">
          <h2 className="m-0 mb-[6px] font-fredoka text-[30px] font-semibold text-[#3F362E]">
            Iniciar sesión
          </h2>
          <p className="mb-[28px] text-[15px] text-[#94887B]">
            Ingresá para ver el día de hoy.
          </p>

          <div className="mb-[8px] text-[12px] font-bold tracking-[.7px] text-[#94887B]">EMAIL</div>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[14px] text-[15px] text-[#3F362E] outline-none"
          />
          <div className="mb-[8px] text-[12px] font-bold tracking-[.7px] text-[#94887B]">CONTRASEÑA</div>
          <input
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-[10px] w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[14px] text-[15px] text-[#3F362E] outline-none placeholder-[#B6A99B]"
          />
          <div className="mb-[20px] text-right">
            <a href="#" className="text-[13.5px] font-bold text-[#C5503A]">
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          {error && (
            <div className="mb-[14px] rounded-[12px] border-[1.5px] border-[#F2A78E] bg-[#FDEBE3] px-4 py-3 text-[13.5px] font-semibold text-[#C5503A]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="block w-full rounded-[15px] bg-gradient-to-b from-[#F4977E] to-[#EE8164] px-4 py-[15px] text-center text-[16px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,.7)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Ingresando…" : "Iniciar sesión"}
          </button>

          <p className="mt-[24px] text-center text-[14.5px] text-[#94887B]">
            ¿Te invitó la guardería?{" "}
            <Link href="/activate" className="font-extrabold text-[#C5503A]">
              Activá tu cuenta
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
