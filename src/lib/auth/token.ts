import crypto from 'crypto';
const SECRET = process.env.ADMIN_JWT_SECRET || 'mxdownloader_secret_key_2026';

export function createAuthToken(user: { id: string; username: string; role: string }): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ ...user, exp: Date.now() + 86400000 })).toString('base64url');
  const signature = crypto.createHmac('sha256', SECRET).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}

export function verifyAuthToken(token: string) {
  try {
    const [h, p, s] = token.split('.');
    const expected = crypto.createHmac('sha256', SECRET).update(`${h}.${p}`).digest('base64url');
    if (s !== expected) return null;
    const data = JSON.parse(Buffer.from(p, 'base64url').toString('utf8'));
    return Date.now() > data.exp ? null : data;
  } catch {
    return null;
  }
}