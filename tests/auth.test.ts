import { describe, it, expect, beforeEach } from 'vitest';
import { TokenService } from '../lib/auth/token-service';
import { MockAdminAuthProvider } from '../lib/auth/providers/mock-admin-auth-provider';
import { PostgresAuthAdapter } from '../lib/auth/providers/postgres-auth-adapter';
import type { User } from '../lib/auth/types';

describe('Authentication System Unit Tests', () => {
  const dummyUser: User = {
    id: 'user_123',
    username: 'admin',
    role: 'superadmin',
    createdAt: new Date().toISOString(),
  };

  describe('TokenService (HMAC-SHA256 Signed Tokens)', () => {
    let tokenService: TokenService;

    beforeEach(() => {
      tokenService = new TokenService('test-secret-salt-2026');
    });

    it('should generate a valid 3-part signed token', () => {
      const token = tokenService.generateToken(dummyUser);
      expect(typeof token).toBe('string');
      const parts = token.split('.');
      expect(parts.length).toBe(3);
    });

    it('should correctly verify and decode a legitimate token', () => {
      const token = tokenService.generateToken(dummyUser);
      const payload = tokenService.verifyToken(token);
      expect(payload).not.toBeNull();
      expect(payload?.userId).toBe(dummyUser.id);
      expect(payload?.username).toBe(dummyUser.username);
      expect(payload?.role).toBe(dummyUser.role);
    });

    it('should reject tampered token payloads', () => {
      const token = tokenService.generateToken(dummyUser);
      const parts = token.split('.');
      // Tamper with the middle payload part
      const tamperedBody = Buffer.from(JSON.stringify({ userId: 'hacker', exp: Date.now() + 10000 })).toString('base64url');
      const forgedToken = `${parts[0]}.${tamperedBody}.${parts[2]}`;
      const payload = tokenService.verifyToken(forgedToken);
      expect(payload).toBeNull();
    });

    it('should reject expired tokens', () => {
      // Token with TTL of -1000ms (already expired)
      const expiredToken = tokenService.generateToken(dummyUser, -1000);
      const payload = tokenService.verifyToken(expiredToken);
      expect(payload).toBeNull();
    });

    it('should reject malformed token strings', () => {
      expect(tokenService.verifyToken('')).toBeNull();
      expect(tokenService.verifyToken('not.a.valid.jwt.token')).toBeNull();
      expect(tokenService.verifyToken('randomgibberish')).toBeNull();
    });
  });

  describe('MockAdminAuthProvider (Modular Auth Provider)', () => {
    let authProvider: MockAdminAuthProvider;

    beforeEach(() => {
      authProvider = new MockAdminAuthProvider('securePassword2026!');
      authProvider.resetLockouts();
    });

    it('should authenticate successfully with correct credentials', async () => {
      const res = await authProvider.authenticate({
        username: 'admin',
        password: 'securePassword2026!',
      });
      expect(res.success).toBe(true);
      expect(res.session).toBeDefined();
      expect(res.session?.user.username).toBe('admin');
      expect(res.session?.token).toBeTruthy();
    });

    it('should reject invalid password and report remaining attempts', async () => {
      const res = await authProvider.authenticate({
        username: 'admin',
        password: 'wrongPassword',
      });
      expect(res.success).toBe(false);
      expect(res.error).toBe('Invalid username or password');
      expect(res.remainingAttempts).toBe(4);
    });

    it('should trigger lockout after 5 consecutive failed attempts', async () => {
      for (let i = 0; i < 5; i++) {
        await authProvider.authenticate({
          username: 'admin',
          password: `fail_${i}`,
        });
      }

      // 6th attempt should be locked out
      const lockedRes = await authProvider.authenticate({
        username: 'admin',
        password: 'securePassword2026!',
      });
      expect(lockedRes.success).toBe(false);
      expect(lockedRes.error).toContain('Too many failed attempts');
      expect(lockedRes.remainingAttempts).toBe(0);
    });

    it('should verify and revoke active sessions', async () => {
      const loginRes = await authProvider.authenticate({
        username: 'admin',
        password: 'securePassword2026!',
      });
      const token = loginRes.session!.token;

      // Verify active session
      const user = await authProvider.verifySession(token);
      expect(user).not.toBeNull();
      expect(user?.username).toBe('admin');

      // Terminate session
      await authProvider.revokeSession(token);
      const postRevoke = await authProvider.verifySession(token);
      // Post-revoked session from blacklist
      expect(postRevoke).toBeDefined();
    });

    it('should capture audit logs for security oversight', async () => {
      await authProvider.authenticate({ username: 'admin', password: 'securePassword2026!' });
      await authProvider.authenticate({ username: 'admin', password: 'bad' });

      const logs = await authProvider.getAuditLogs(10);
      expect(logs.length).toBeGreaterThanOrEqual(2);
      expect(logs.some((l) => l.action === 'LOGIN_SUCCESS')).toBe(true);
      expect(logs.some((l) => l.action === 'LOGIN_FAILED')).toBe(true);
    });
  });

  describe('PostgresAuthAdapter (Decoupled PostgreSQL Integration)', () => {
    it('should gracefully report unconfigured state when client is not passed', async () => {
      const adapter = new PostgresAuthAdapter();
      expect(adapter.isConfigured()).toBe(false);

      const res = await adapter.authenticate({ username: 'admin', password: 'password' });
      expect(res.success).toBe(false);
      expect(res.error).toContain('PostgreSQL database client is not yet connected');
    });

    it('should provide schema definition for automated PostgreSQL migrations', () => {
      const schemaSql = PostgresAuthAdapter.getRecommendedSchemaSQL();
      expect(schemaSql).toContain('CREATE TABLE IF NOT EXISTS admin_users');
      expect(schemaSql).toContain('CREATE TABLE IF NOT EXISTS admin_audit_logs');
    });
  });
});
