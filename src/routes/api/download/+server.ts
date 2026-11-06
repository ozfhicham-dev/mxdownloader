import { json } from '@sveltejs/kit';
import { parseLink } from '$lib/downloader/parsers';

export const POST = async ({ request }) => {
  const { url } = await request.json();
  return json({ success: true, media: parseLink(url || '') });
};