export interface User {
  id: string;
  username: string;
  email?: string;
  role: 'superadmin' | 'admin' | 'editor';
  createdAt: string;
  lastLoginAt?: string;
}

export interface AuthCredentials {
  username: string;
  password: string;
}

export interface AuthSession {
  token: string;
  user: User;
  expiresAt: number; // Unix timestamp in ms
}

export interface AuthResult {
  success: boolean;
  session?: AuthSession;
  error?: string;
  remainingAttempts?: number;
}

export interface AdminAuditLog {
  id: string;
  timestamp: string;
  action: string;
  username: string;
  ipAddress?: string;
  success: boolean;
  details?: string;
}

/**
 * Modular Auth Provider Interface
 * Allows clean swapping between in-memory/environment mock provider
 * and future PostgreSQL / Cloud SQL / ORM database provider.
 */
export interface AuthProviderInterface {
  name: string;
  authenticate(credentials: AuthCredentials, ipAddress?: string): Promise<AuthResult>;
  verifySession(token: string): Promise<User | null>;
  revokeSession(token: string): Promise<boolean>;
  getAuditLogs(limit?: number): Promise<AdminAuditLog[]>;
  getUserByUsername(username: string): Promise<User | null>;
  isConfigured(): boolean;
}
