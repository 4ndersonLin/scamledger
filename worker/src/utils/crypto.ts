export async function sha256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function generateDailySalt(): Promise<string> {
  const date = new Date().toISOString().split('T')[0];
  return sha256(`daily-salt-${date}`);
}

export async function hashIpWithSalt(ip: string, salt: string): Promise<string> {
  return sha256(`${ip}:${salt}`);
}

export function generateApiKey(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `csr_${hex}`;
}
