import type {
  AuthProviderInterface,
  AuthCredentials,
  AuthResult,
  User,
  AdminAuditLog,
} from '../types';
import { TokenService, defaultTokenService } from '../token-service';
import { RECOMMENDED_POSTGRES_SCHEMA_SQL } from '../schema';

/**
 * PostgreSQL Auth Adapter Blueprint
 * Implements AuthProviderInterface and prepares the database schema queries
 * for seamless integration once PostgreSQL / Cloud SQL is provisioned.
 */
export interface PostgresDatabaseClient {
  query<T = unknown>(sql: string, params?: unknown[]): Promise<{ rows: T[] }>;
}

export class PostgresAuthAdapter implements AuthProviderInterface {
  public readonly name = 'postgresql-adapter';
  private dbClient: PostgresDatabaseClient | null = null;
  private tokenService: TokenService;

  constructor(client?: PostgresDatabaseClient, tokenService: TokenService = defaultTokenService) {
    this.dbClient = client || null;
    this.tokenService = tokenService;
  }

  setClient(client: PostgresDatabaseClient) {
    this.dbClient = client;
  }

  isConfigured(): boolean {
    return this.dbClient !== null;
  }

  /**
   * Recommended PostgreSQL Schema for Admin Auth
   */
  public static getRecommendedSchemaSQL(): string {
    return RECOMMENDED_POSTGRES_SCHEMA_SQL;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    if (!this.dbClient) return null;

    const result = await this.dbClient.query<User>(
      'SELECT id, username, email, role, created_at as "createdAt", last_login_at as "lastLoginAt" FROM admin_users WHERE username = $1 LIMIT 1',
      [username]
    );

    return result.rows[0] || null;
  }

  async authenticate(credentials: AuthCredentials, ipAddress?: string): Promise<AuthResult> {
    if (!this.dbClient) {
      return {
        success: false,
        error: 'PostgreSQL database client is not yet connected. Using mock provider in development mode.',
      };
    }

    try {
      const userRes = await this.dbClient.query<{
        id: string;
        username: string;
        password_hash: string;
        role: User['role'];
        failed_attempts: number;
        locked_until: string | null;
        created_at: string;
      }>(
        'SELECT * FROM admin_users WHERE username = $1 LIMIT 1',
        [credentials.username]
      );

      const user = userRes.rows[0];
      if (!user) {
        return { success: false, error: 'Invalid credentials' };
      }

      // Check lockout
      if (user.locked_until && new Date(user.locked_until).getTime() > Date.now()) {
        return { success: false, error: 'Account is locked. Please try again later.' };
      }

      // In production, compare using bcrypt/argon2
      // const isMatch = await bcrypt.compare(credentials.password, user.password_hash);
      const isMatch = credentials.password === user.password_hash;

      if (!isMatch) {
        await this.dbClient.query(
          'UPDATE admin_users SET failed_attempts = failed_attempts + 1 WHERE id = $1',
          [user.id]
        );
        return { success: false, error: 'Invalid credentials' };
      }

      // Reset failed attempts & update last login
      await this.dbClient.query(
        'UPDATE admin_users SET failed_attempts = 0, locked_until = NULL, last_login_at = NOW() WHERE id = $1',
        [user.id]
      );

      const token = this.tokenService.generateToken({
        id: user.id,
        username: user.username,
        role: user.role,
        createdAt: user.created_at,
      });

      return {
        success: true,
        session: {
          token,
          user: {
            id: user.id,
            username: user.username,
            role: user.role,
            createdAt: user.created_at,
          },
          expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        },
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Database query error';
      return { success: false, error: errorMsg };
    }
  }

  async verifySession(token: string): Promise<User | null> {
    const payload = this.tokenService.verifyToken(token);
    if (!payload) return null;

    if (!this.dbClient) {
      return {
        id: payload.userId,
        username: payload.username,
        role: payload.role as User['role'],
        createdAt: new Date(payload.iat).toISOString(),
      };
    }

    return this.getUserByUsername(payload.username);
  }

  async revokeSession(_token: string): Promise<boolean> {
    return true;
  }

  async getAuditLogs(limit: number = 50): Promise<AdminAuditLog[]> {
    if (!this.dbClient) return [];
    const result = await this.dbClient.query<AdminAuditLog>(
      'SELECT id, timestamp, action, username, ip_address as "ipAddress", success, details FROM admin_audit_logs ORDER BY timestamp DESC LIMIT $1',
      [limit]
    );
    return result.rows;
  }
}
