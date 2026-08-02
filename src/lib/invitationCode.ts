const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

// 5 caracteres alfanuméricos en mayúsculas (sin confundibles O/0, I/1).
export function generateInvitationCode(): string {
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}
