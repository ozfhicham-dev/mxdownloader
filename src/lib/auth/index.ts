import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { query } from '$lib/db';
import { createAuthToken } from './token';

export async function loginAdmin(username: string, passwordPlain: string, ip: string) {
  const users = await query('SELECT * FROM admin_users WHERE username = $1 LIMIT 1', [username]);

  if (users.length === 0 && username === (process.env.ADMIN_DEFAULT_USER || 'admin')) {
    if (passwordPlain === (process.env.ADMIN_DEFAULT_PASSWORD || 'mxadmin2026')) {
      const hash = await bcrypt.hash(passwordPlain, 10);
      const id = 'usr_' + crypto.randomBytes(4).toString('hex');
      await query('INSERT INTO admin_users (id, username, password_hash) VALUES ($1, $2, $3)', [id, username, hash]);
      const token = createAuthToken({ id, username, role: 'superadmin' });
      return { success: true, token };
    }
  }

  const user = users[0];
  if (!user) return { success: false, error: 'Invalid credentials' };

  const isMatch = await bcrypt.compare(passwordPlain, user.password_hash);
  if (!isMatch) return { success: false, error: 'Invalid credentials' };

  const token = createAuthToken({ id: user.id, username: user.username, role: user.role });
  return { success: true, token };
}

export async function recordAudit(action: string, username: string, ip: string, success: boolean, details: string) {
  const id = 'log_' + crypto.randomBytes(6).toString('hex');
  await query('INSERT INTO admin_audit_logs (id, action, username, ip_address, success, details) VALUES ($1, $2, $3, $4, $5, $6)', [id, action, username, ip, success, details]);
}