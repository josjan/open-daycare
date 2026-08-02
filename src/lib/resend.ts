import { Resend } from "resend";
import { buildInvitationEmailHtml, InvitationEmailData } from "./emailTemplates";

const resendApiKey = process.env.RESEND_API_KEY;
const resendFrom = process.env.RESEND_FROM ?? "info@opendaycare.com";

// Best-effort: si Resend falla o no hay API key, loguea el error y no lanza.
export async function sendInvitationEmail(to: string, data: InvitationEmailData): Promise<void> {
  if (!resendApiKey) {
    console.error("[resend] RESEND_API_KEY no configurada; email no enviado.");
    return;
  }

  try {
    const resend = new Resend(resendApiKey);
    await resend.emails.send({
      from: resendFrom,
      to,
      subject: `Invitación para ${data.childName} — Open Daycare`,
      html: buildInvitationEmailHtml(data),
    });
  } catch (err) {
    console.error("[resend] error al enviar el email:", err);
  }
}
