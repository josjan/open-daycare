"use client";

import { useState } from "react";
import Link from "next/link";

function SunIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default function ActivatePage() {
  const [code, setCode] = useState("7K4P9");
  const [email, setEmail] = useState("lucia.fernandez@gmail.com");
  const [password, setPassword] = useState("");
  const [accepted, setAccepted] = useState(true);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FBF4EC] p-10">
      <div className="w-full max-w-[440px]">
        <div className="mb-[22px] flex h-[58px] w-[58px] items-center justify-center rounded-[18px] bg-gradient-to-br from-[#F8C3A8] to-[#F2937A] shadow-[0_12px_26px_-10px_rgba(238,129,100,.65)]">
          <SunIcon />
        </div>

        <h1 className="m-0 mb-[8px] font-fredoka text-[32px] font-semibold leading-[1.15] text-[#3F362E]">
          Bienvenida a OpenDayCare
        </h1>
        <p className="mb-[26px] text-[15.5px] leading-[1.55] text-[#94887B]">
          Te invitaron a seguir el día de tu hijo. Creá tu contraseña para activar la cuenta.
        </p>

        <div className="mb-[22px] flex items-center gap-[14px] rounded-[16px] border-[1.5px] border-[#EADFD0] bg-white p-[14px_16px]">
          <div className="flex h-[44px] w-[44px] flex-none items-center justify-center rounded-full bg-[#A9D9E8] font-fredoka text-[19px] font-semibold text-[#1F7A93]">
            M
          </div>
          <div>
            <div className="text-[13px] text-[#94887B]">Te invitaron a seguir a</div>
            <div className="font-fredoka text-[17px] font-semibold text-[#3F362E]">
              Mateo · Sala Soles
            </div>
          </div>
        </div>

        <div className="mb-[8px] text-[12px] font-bold tracking-[.7px] text-[#94887B]">
          CÓDIGO DE INVITACIÓN
        </div>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[14px] font-fredoka text-[18px] font-bold tracking-[3px] text-[#3F362E] outline-none"
        />
        <div className="mb-[8px] text-[12px] font-bold tracking-[.7px] text-[#94887B]">EMAIL</div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[14px] text-[15px] text-[#3F362E] outline-none"
        />
        <div className="mb-[8px] text-[12px] font-bold tracking-[.7px] text-[#94887B]">
          CREAR CONTRASEÑA
        </div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-[#F2A78E] bg-white px-4 py-[14px] text-[15px] text-[#3F362E] outline-none"
        />

        <label
          onClick={() => setAccepted((v) => !v)}
          className="mb-[24px] flex cursor-pointer items-start gap-[12px] rounded-[14px] bg-[#FBF1D6] p-[14px_16px]"
        >
          <span
            className={`mt-[1px] flex h-6 w-6 flex-none items-center justify-center rounded-[8px] ${
              accepted ? "bg-[#5FB97E]" : "border-[1.5px] border-[#C9BFA8] bg-white"
            }`}
          >
            {accepted && <CheckIcon />}
          </span>
          <span className="text-[14px] leading-[1.45] text-[#8A7234]">
            Autorizo a la guardería a tomar y compartir fotos de mi hijo dentro de la app.
          </span>
        </label>

        <Link
          href="/"
          className="block w-full rounded-[15px] bg-gradient-to-b from-[#F4977E] to-[#EE8164] px-4 py-[15px] text-center text-[16px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,.7)]"
        >
          Activar mi cuenta
        </Link>

        <p className="mt-[22px] text-center text-[14.5px] text-[#94887B]">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="font-extrabold text-[#C5503A]">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
