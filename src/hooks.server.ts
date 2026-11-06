import type { Handle } from '@sveltejs/kit';
import { verifyAuthToken } from '$lib/auth/token';

export const handle: Handle = async ({ event, resolve }) => {
  const sessionToken = event.cookies.get('mx_admin_session');
  event.locals.adminUser = sessionToken ? verifyAuthToken(sessionToken) : null;

  if (event.url.pathname.startsWith('/api/admin') && !event.locals.adminUser) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const response = await resolve(event);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  return response;
};