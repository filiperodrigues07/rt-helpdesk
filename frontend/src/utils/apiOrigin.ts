export const API_ORIGIN = (import.meta.env.VITE_API_URL ?? 'http://localhost:3333/api').replace(/\/api\/?$/, '');

export function resolveUploadUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  return `${API_ORIGIN}${url}`;
}
