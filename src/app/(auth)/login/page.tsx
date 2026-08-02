"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

function SunIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotNotice, setShowForgotNotice] = useState(false);

  const activated = searchParams.get("activated") === "1";

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
    <main className="grid min-h-screen bg-[#FBF4EC] lg:grid-cols-[1.05fr_1fr]">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[linear-gradient(155deg,#B95A3E_0%,#AE4D34_45%,#A84630_100%)] p-[56px_60px] text-white lg:flex">
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
          <p className="m-0 max-w-[430px] text-[17px] leading-[1.6] text-white">
            Publicá momentos, gestioná las salas y mantené a las familias cerca, desde un solo lugar.
          </p>
        </div>

        <div className="relative text-[14px] text-white">
          <span aria-hidden="true">🌿</span> Guardería Sala Soles
        </div>
      </div>

      <div className="flex items-center justify-center p-10">
        <form onSubmit={handleSubmit} aria-busy={loading} className="w-full max-w-[392px]">
          <h2 className="m-0 mb-[6px] font-fredoka text-[30px] font-semibold text-[#3F362E]">
            Iniciar sesión
          </h2>
          <p className="mb-[28px] text-[15px] text-[#75695C]">
            Ingresá para ver el día de hoy.
          </p>

          {activated && (
            <div className="mb-[18px] flex items-start gap-[10px] rounded-[14px] border-[1.5px] border-[#BFE3CC] bg-[#E4F4E9] px-4 py-3">
              <span className="mt-[1px] flex h-5 w-5 flex-none items-center justify-center rounded-full bg-[#5FB97E]">
                <CheckIcon />
              </span>
              <span className="text-[13.5px] font-semibold leading-[1.45] text-[#2F7050]">
                Tu cuenta fue activada. Ingresá con tu contraseña.
              </span>
            </div>
          )}

          <label
            htmlFor="email"
            className="mb-[8px] block text-[12px] font-bold tracking-[.7px] text-[#75695C]"
          >
            EMAIL
          </label>
          <input
            type="email"
            id="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "login-error" : undefined}
            className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[14px] text-[15px] text-[#3F362E] outline-none focus:ring-2 focus:ring-[#AF3D28]"
          />
          <label
            htmlFor="password"
            className="mb-[8px] block text-[12px] font-bold tracking-[.7px] text-[#75695C]"
          >
            CONTRASEÑA
          </label>
          <input
            type="password"
            id="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "login-error" : undefined}
            className="mb-[10px] w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[14px] text-[15px] text-[#3F362E] outline-none placeholder-[#7A6E61] focus:ring-2 focus:ring-[#AF3D28]"
          />
          <div className="mb-[20px] flex flex-col items-end gap-[10px]">
            <button
              type="button"
              onClick={() => setShowForgotNotice(true)}
              aria-expanded={showForgotNotice}
              aria-controls="forgot-password-help"
              className="inline-block py-[3px] text-[13.5px] font-bold text-[#AF3D28] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#AF3D28]"
            >
              ¿Olvidaste tu contraseña?
            </button>
            {showForgotNotice && (
              <p
                id="forgot-password-help"
                role="status"
                className="max-w-[320px] text-right text-[12.5px] font-semibold leading-[1.45] text-[#75695C]"
              >
                Contactá a la guardería para restablecer tu contraseña.
              </p>
            )}
          </div>

          {error && (
            <div
              id="login-error"
              role="alert"
              className="mb-[14px] rounded-[12px] border-[1.5px] border-[#F2A78E] bg-[#FDEBE3] px-4 py-3 text-[13.5px] font-semibold text-[#AF3D28]"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="block w-full rounded-[15px] bg-gradient-to-b from-[#B95438] to-[#A84630] px-4 py-[15px] text-center text-[16px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,.7)] disabled:cursor-not-allowed disabled:opacity-70 focus-visible:ring-2 focus-visible:ring-[#AF3D28] focus-visible:ring-offset-2"
          >
            {loading ? "Ingresando…" : "Iniciar sesión"}
          </button>
          <span role="status" className="sr-only">
            {loading ? "Ingresando…" : ""}
          </span>

          <p className="mt-[24px] text-center text-[14.5px] text-[#75695C]">
            ¿Te invitó la guardería?{" "}
            <Link href="/activate" className="font-extrabold text-[#AF3D28]">
              Activá tu cuenta
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#FBF4EC]">
          <div className="text-[15px] font-semibold text-[#75695C]">Cargando…</div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
