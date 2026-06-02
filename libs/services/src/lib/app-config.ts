/** آدرس پایه API/Socket — در production خالی = همان origin (پشت nginx) */
let apiBaseOverride: string | null = null;

export function configureAppApi(baseUrl: string): void {
  apiBaseOverride = baseUrl;
}

export function getApiBaseUrl(): string {
  if (apiBaseOverride !== null) {
    const trimmed = apiBaseOverride.trim();
    if (trimmed) return trimmed.replace(/\/$/, '');
    if (typeof window !== 'undefined') return window.location.origin;
    return '';
  }
  if (typeof window !== 'undefined') {
    if (window.location.hostname !== 'localhost') {
      return window.location.origin;
    }
    return 'http://localhost:5000';
  }
  return 'http://localhost:5000';
}

export function getApiUrl(path = '/api'): string {
  return `${getApiBaseUrl()}${path}`;
}
