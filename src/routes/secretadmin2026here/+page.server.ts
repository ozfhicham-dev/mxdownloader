import { fail, redirect } from '@sveltejs/kit';
import { loginAdmin } from '$lib/auth';

export const load = async ({ locals, cookies }) => {
  return {
    authenticated: !!locals.adminUser,
    currentLocale: cookies.get('mx_admin_locale') || 'en'
  };
};

export const actions = {
  login: async ({ request, cookies, getClientAddress }) => {
    const data = await request.formData();
    const res = await loginAdmin(data.get('username') as string, data.get('password') as string, getClientAddress());
    if (!res.success) return fail(400, { error: res.error });
    cookies.set('mx_admin_session', res.token!, { path: '/', httpOnly: true });
    return { success: true };
  },
  logout: async ({ cookies }) => {
    cookies.delete('mx_admin_session', { path: '/' });
    throw redirect(303, '/secretadmin2026here');
  },
  setLocale: async ({ request, cookies }) => {
    const data = await request.formData();
    cookies.set('mx_admin_locale', data.get('locale') as string, { path: '/' });
    return { success: true };
  }
};