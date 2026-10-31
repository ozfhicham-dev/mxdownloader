import crypto from 'crypto';
import type { User } from './types';

// Default signing secret for dev environment; in production set via ADMIN_JWT_SECRET
const SECRET_KEY = process.env.ADMIN_JWT_SECRET || 'mxdownloader_secret_admin_signing_key_2026';
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface TokenPayload {
  userId: string;
  username: string;
  role: string;
  iat: number;
  exp: number;
}

export class TokenService {
  private secret: string;

  constructor(secretKey: string = SECRET_KEY) {
    this.secret = secretKey;
  }

  /**
   * Generates a signed tamper-proof token
   */
  generateToken(user: User, ttlMs: number = TOKEN_TTL_MS): string {
    const now = Date.now();
    const payload: TokenPayload = {
      userId: user.id,
      username: user.username,
      role: user.role,
      iat: now,
      exp: now + ttlMs,
    };

    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = this.createSignature(`${header}.${body}`);

    return `${header}.${body}.${signature}`;
  }

  /**
   * Validates and extracts payload from a signed token
   */
  verifyToken(token: string): TokenPayload | null {
    if (!token || typeof token !== 'string') return null;

    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [header, body, signature] = parts;
    const expectedSignature = this.createSignature(`${header}.${body}`);

    // Timing-safe signature comparison to mitigate side-channel attacks
    try {
      const a = Buffer.from(signature);
      const b = Buffer.from(expectedSignature);
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        return null;
      }

      const payload: TokenPayload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));

      if (Date.now() > payload.exp) {
        return null; // Expired
      }

      return payload;
    } catch {
      return null;
    }
  }

  private createSignature(data: string): string {
    return crypto
      .createHmac('sha256', this.secret)
      .update(data)
      .digest('base64url');
  }
}

export const defaultTokenService = new TokenService();
