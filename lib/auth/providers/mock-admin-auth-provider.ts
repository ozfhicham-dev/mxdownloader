import type {
  AuthProviderInterface,
  AuthCredentials,
  AuthResult,
  User,
  AdminAuditLog,
} from '../types';
import { TokenService, defaultTokenService } from '../token-service';

export class MockAdminAuthProvider implements AuthProviderInterface {
  public readonly name = 'mock-in-memory';

  private adminUser: User = {
    id: 'usr_admin_01',
    username: 'admin',
    email: 'admin@mxdownloader.com',
    role: 'superadmin',
    createdAt: '2026-01-01T00:00:00.000Z',
    lastLoginAt: undefined,
  };

  private passwordHash: string;
  private failedAttempts: Map<string, { count: number; lockedUntil?: number }> = new Map();
  private auditLogs: AdminAuditLog[] = [];
  private activeSessions: Set<string> = new Set();
  private tokenService: TokenService;

  constructor(
    customPassword?: string,
    tokenService: TokenService = defaultTokenService
  ) {
    const rawPass = customPassword || process.env.ADMIN_PASSWORD || 'mxadmin2026';
    this.passwordHash = rawPass; // In mock, direct comparison or sha256
    this.tokenService = tokenService;
  }

  isConfigured(): boolean {
    return true;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    if (username.toLowerCase() === this.adminUser.username.toLowerCase()) {
      return { ...this.adminUser };
    }
    return null;
  }

  async authenticate(credentials: AuthCredentials, ipAddress: string = '127.0.0.1'): Promise<AuthResult> {
    const now = Date.now();
    const lockKey = `${credentials.username.toLowerCase()}_${ipAddress}`;
    const attemptRecord = this.failedAttempts.get(lockKey) || { count: 0 };

    // Check lockout status
    if (attemptRecord.lockedUntil && attemptRecord.lockedUntil > now) {
      const waitMinutes = Math.ceil((attemptRecord.lockedUntil - now) / 60000);
      this.recordAudit({
        action: 'LOGIN_BLOCKED_LOCKOUT',
        username: credentials.username,
        ipAddress,
        success: false,
        details: `Account temporarily locked. Retry in ${waitMinutes}m`,
      });
      return {
        success: false,
        error: `Too many failed attempts. Locked for ${waitMinutes} more minute(s).`,
        remainingAttempts: 0,
      };
    }

    const isUsernameMatch = credentials.username.toLowerCase() === this.adminUser.username.toLowerCase();
    const isPasswordMatch = credentials.password === this.passwordHash;

    if (!isUsernameMatch || !isPasswordMatch) {
      const nextCount = attemptRecord.count + 1;
      const MAX_ATTEMPTS = 5;
      const LOCKOUT_MS = 5 * 60 * 1000; // 5 minutes

      if (nextCount >= MAX_ATTEMPTS) {
        this.failedAttempts.set(lockKey, { count: nextCount, lockedUntil: now + LOCKOUT_MS });
      } else {
        this.failedAttempts.set(lockKey, { count: nextCount });
      }

      const remaining = Math.max(0, MAX_ATTEMPTS - nextCount);

      this.recordAudit({
        action: 'LOGIN_FAILED',
        username: credentials.username,
        ipAddress,
        success: false,
        details: `Invalid credentials. Attempts left: ${remaining}`,
      });

      return {
        success: false,
        error: 'Invalid username or password',
        remainingAttempts: remaining,
      };
    }

    // Reset failed attempts on success
    this.failedAttempts.delete(lockKey);

    this.adminUser.lastLoginAt = new Date().toISOString();
    const token = this.tokenService.generateToken(this.adminUser);
    this.activeSessions.add(token);

    this.recordAudit({
      action: 'LOGIN_SUCCESS',
      username: this.adminUser.username,
      ipAddress,
      success: true,
      details: 'Superadmin session initiated',
    });

    return {
      success: true,
      session: {
        token,
        user: { ...this.adminUser },
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      },
    };
  }

  async verifySession(token: string): Promise<User | null> {
    if (!token) return null;

    const payload = this.tokenService.verifyToken(token);
    if (!payload) return null;

    if (!this.activeSessions.has(token)) {
      // In stateless token service, token is valid if signed, but in our mock we can also check blacklist
      return {
        id: payload.userId,
        username: payload.username,
        role: payload.role as User['role'],
        createdAt: '2026-01-01T00:00:00.000Z',
      };
    }

    return { ...this.adminUser };
  }

  async revokeSession(token: string): Promise<boolean> {
    this.activeSessions.delete(token);
    this.recordAudit({
      action: 'LOGOUT',
      username: this.adminUser.username,
      success: true,
      details: 'Session terminated',
    });
    return true;
  }

  async getAuditLogs(limit: number = 50): Promise<AdminAuditLog[]> {
    return [...this.auditLogs].reverse().slice(0, limit);
  }

  // Helper method for testing or administrative resets
  resetLockouts(): void {
    this.failedAttempts.clear();
  }

  private recordAudit(entry: Omit<AdminAuditLog, 'id' | 'timestamp'>) {
    this.auditLogs.push({
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    });
  }
}
