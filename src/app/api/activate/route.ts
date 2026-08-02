import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/utils/supabase/admin";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ActivateBody {
  code: string;
  email: string;
  password: string;
  photo_consent: boolean;
}

export async function POST(request: NextRequest) {
  let body: ActivateBody;
  try {
    body = (await request.json()) as ActivateBody;
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  const { code, email, password, photo_consent } = body;

  if (!code || typeof code !== "string" || !code.trim()) {
    return NextResponse.json({ error: "El código es obligatorio." }, { status: 400 });
  }
  if (!email || !EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: "Email inválido." }, { status: 400 });
  }
  if (!password || password.length < 8) {
    return NextResponse.json({ error: "La contraseña debe tener al menos 8 caracteres." }, { status: 400 });
  }
  if (photo_consent !== true) {
    return NextResponse.json({ error: "Debés aceptar el uso de fotos." }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const admin = adminClient();

  const { data: invitation } = await admin
    .from("invitations")
    .select("id, child_id, full_name, email, status, expires_at, relationship")
    .eq("code", code.trim().toUpperCase())
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (!invitation) {
    return NextResponse.json(
      { error: "El código o el email no son válidos." },
      { status: 400 }
    );
  }

  if (invitation.status === "expired") {
    return NextResponse.json({ error: "La invitación expiró." }, { status: 400 });
  }
  if (invitation.status === "cancelled") {
    return NextResponse.json({ error: "La invitación fue cancelada." }, { status: 400 });
  }
  if (invitation.status === "accepted") {
    return NextResponse.json({ error: "La invitación ya fue utilizada." }, { status: 400 });
  }
  if (new Date(invitation.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "La invitación expiró." }, { status: 400 });
  }

  const { data: child } = await admin
    .from("children")
    .select("id, room_id")
    .eq("id", invitation.child_id)
    .maybeSingle();

  if (!child) {
    return NextResponse.json({ error: "El niño ya no existe." }, { status: 400 });
  }

  const { data: room } = await admin
    .from("rooms")
    .select("daycare_id")
    .eq("id", child.room_id)
    .maybeSingle();

  if (!room) {
    return NextResponse.json({ error: "La sala del niño ya no existe." }, { status: 400 });
  }

  const daycareId = room.daycare_id;

  let parentUserId: string;

  const { data: existingUsers } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  const existing = existingUsers.users.find((u) => u.email === normalizedEmail);
  if (existing) {
    parentUserId = existing.id;
  } else {
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: invitation.full_name,
        role: "parent",
        daycare_id: daycareId,
      },
    });

    if (createError || !created.user) {
      return NextResponse.json(
        { error: "No se pudo crear la cuenta. Intentá de nuevo." },
        { status: 500 }
      );
    }
    parentUserId = created.user.id;
  }

  await admin
    .from("parent_children")
    .upsert(
      {
        parent_id: parentUserId,
        child_id: invitation.child_id,
        relationship: invitation.relationship,
      },
      { onConflict: "parent_id,child_id", ignoreDuplicates: true }
    );

  await admin
    .from("invitations")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", invitation.id);

  await admin.from("children").update({ photo_consent: true }).eq("id", invitation.child_id);

  return NextResponse.json({ ok: true });
}
