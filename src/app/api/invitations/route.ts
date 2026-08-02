import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { generateInvitationCode } from "@/lib/invitationCode";
import { sendInvitationEmail } from "@/lib/resend";
import type { InvitePayload, RelationshipValue } from "@/types/invitation";

const RELATIONSHIPS: RelationshipValue[] = ["father", "mother", "guardian"];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_ALPHABET = /^[A-Z2-9]{5}$/;

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const { data: staff } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (staff?.role !== "staff") {
    return NextResponse.json({ error: "Solo el staff puede invitar." }, { status: 403 });
  }

  let body: InvitePayload;
  try {
    body = (await request.json()) as InvitePayload;
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  const { child_id, full_name, email, relationship } = body;

  if (!child_id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(child_id)) {
    return NextResponse.json({ error: "child_id inválido." }, { status: 400 });
  }
  if (!full_name || typeof full_name !== "string" || !full_name.trim()) {
    return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });
  }
  if (!email || !EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: "Email inválido." }, { status: 400 });
  }
  if (!RELATIONSHIPS.includes(relationship)) {
    return NextResponse.json({ error: "Parentesco inválido." }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const { data: child } = await supabase
    .from("children")
    .select("id, full_name, rooms(name)")
    .eq("id", child_id)
    .maybeSingle();

  if (!child) {
    return NextResponse.json({ error: "El niño no existe." }, { status: 404 });
  }

  const { data: existing } = await supabase
    .from("invitations")
    .select("id")
    .eq("child_id", child_id)
    .eq("email", normalizedEmail)
    .eq("status", "pending")
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "Ya existe una invitación pendiente para este email en este niño." },
      { status: 400 }
    );
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  let invitation;
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateInvitationCode();
    if (!CODE_ALPHABET.test(code)) continue;

    const { data, error } = await supabase
      .from("invitations")
      .insert({
        child_id,
        invited_by: user.id,
        full_name: full_name.trim(),
        email: normalizedEmail,
        relationship,
        code,
        status: "pending",
        expires_at: expiresAt,
      })
      .select("code")
      .maybeSingle();

    if (error) {
      if (error.code === "23505") continue; // código único colisionado
      return NextResponse.json({ error: "No se pudo crear la invitación." }, { status: 500 });
    }

    invitation = data;
    break;
  }

  if (!invitation) {
    return NextResponse.json({ error: "No se pudo generar un código único." }, { status: 500 });
  }

  const origin = request.headers.get("origin") ?? request.nextUrl.origin ?? "http://localhost:3000";
  const activateUrl = `${origin}/activate?code=${encodeURIComponent(invitation.code)}&email=${encodeURIComponent(normalizedEmail)}`;

  await sendInvitationEmail(normalizedEmail, {
    parentName: full_name.trim(),
    childName: child.full_name,
    roomName: (child.rooms as { name?: string } | null)?.name ?? "",
    activateUrl,
    code: invitation.code,
  });

  return NextResponse.json({ code: invitation.code });
}
