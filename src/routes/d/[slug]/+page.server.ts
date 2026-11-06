import { getPageMetadata } from '$lib/seo/pseo';
export const load = async ({ params }) => {
  return { meta: await getPageMetadata(params.slug) };
};