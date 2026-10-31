import type {
  AuthProviderInterface,
  AuthCredentials,
  AuthResult,
  User,
  AdminAuditLog,
} from './types';
import { MockAdminAuthProvider } from './providers/mock-admin-auth-provider';
import { PostgresAuthAdapter } from './providers/postgres-auth-adapter';

class AuthService {
  private provider: AuthProviderInterface;

  constructor() {
    // Decoupled architecture: switches to PostgreSQL adapter if DB credentials exist,
    // otherwise falls back to MockAdminAuthProvider.
    if (process.env.DATABASE_URL || process.env.POSTGRES_HOST) {
      this.provider = new PostgresAuthAdapter();
    } else {
      this.provider = new MockAdminAuthProvider();
    }
  }

  /**
   * Switch the active authentication provider at runtime
   */
  setProvider(newProvider: AuthProviderInterface) {
    this.provider = newProvider;
  }

  getProviderName(): string {
    return this.provider.name;
  }

  getProvider(): AuthProviderInterface {
    return this.provider;
  }

  async login(credentials: AuthCredentials, ipAddress?: string): Promise<AuthResult> {
    return this.provider.authenticate(credentials, ipAddress);
  }

  async validateSession(token: string): Promise<User | null> {
    return this.provider.verifySession(token);
  }

  async logout(token: string): Promise<boolean> {
    return this.provider.revokeSession(token);
  }

  async getAuditLogs(limit?: number): Promise<AdminAuditLog[]> {
    return this.provider.getAuditLogs(limit);
  }
}

// Global singleton instance
export const authService = new AuthService();
