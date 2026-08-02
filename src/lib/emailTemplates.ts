export interface InvitationEmailData {
  parentName: string;
  childName: string;
  roomName: string;
  activateUrl: string;
  code: string;
}

export function buildInvitationEmailHtml(data: InvitationEmailData): string {
  const { parentName, childName, roomName, activateUrl, code } = data;

  return `
    <div style="font-family: Arial, Helvetica, sans-serif; background:#F6ECDF; padding:32px 16px;">
      <div style="max-width:480px; margin:0 auto; background:#ffffff; border-radius:16px; padding:32px; border:1px solid #EADCC9;">
        <p style="margin:0 0 16px; font-size:15px; color:#4A4238;">Hola ${parentName},</p>
        <p style="margin:0 0 16px; font-size:15px; color:#4A4238; line-height:1.5;">
          Te invitamos a vincularte con <strong>${childName}</strong> (sala ${roomName}) en Open Daycare.
        </p>
        <a href="${activateUrl}" style="display:inline-block; background:#F2A78E; color:#4A2B1E; text-decoration:none; font-weight:700; font-size:14px; padding:12px 20px; border-radius:12px;">
          Activar mi cuenta
        </a>
        <p style="margin:24px 0 0; font-size:13px; color:#94887B;">Tu código de invitación:</p>
        <p style="margin:6px 0 0; font-size:28px; font-weight:800; letter-spacing:4px; color:#4A4238;">${code}</p>
        <p style="margin:16px 0 0; font-size:12px; color:#94887B;">El enlace y el código vencen en 7 días.</p>
      </div>
    </div>
  `;
}
