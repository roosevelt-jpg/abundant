/** Generate a short alphanumeric check-in / invite code */
export function generateEventCode(length = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

/** Payload encoded in guest QR (scanned at the door) */
export function buildCheckInQrPayload(eventId: string, checkInCode: string): string {
  return `AGC|${eventId}|${checkInCode}`;
}

export function parseCheckInQrPayload(raw: string): { eventId: string; checkInCode: string } | null {
  const text = raw.trim();
  const parts = text.split('|');
  if (parts.length === 3 && parts[0] === 'AGC') {
    return { eventId: parts[1], checkInCode: parts[2] };
  }
  // Allow pasting just the code
  if (/^[A-Z0-9]{6,12}$/i.test(text)) {
    return { eventId: '', checkInCode: text.toUpperCase() };
  }
  return null;
}

export function qrImageUrl(data: string, size = 220): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`;
}
