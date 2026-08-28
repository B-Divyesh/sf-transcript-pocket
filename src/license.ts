const SLUG = 'transcript-pocket';
const KEY = `sb_license:${SLUG}`;
const VERDICT_KEY = `${KEY}:verdict`;
const DAY = 86_400_000;
const API_BASE = import.meta.env.VITE_BILLING_BASE_URL || 'https://api.sociobot.in';

interface Verdict {
  valid: boolean;
  checkedAt: number;
  reason: string;
}

export const checkoutUrl = `${API_BASE}/api/v1/products/${SLUG}/checkout`;

export function captureReturnedLicense(): void {
  const url = new URL(location.href);
  const token = url.searchParams.get('license');
  if (!token) return;
  localStorage.setItem(KEY, token.trim());
  localStorage.removeItem(VERDICT_KEY);
  url.searchParams.delete('license');
  history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
}

export function storeLicense(token: string): void {
  localStorage.setItem(KEY, token.trim());
  localStorage.removeItem(VERDICT_KEY);
}

export function getLicense(): string {
  return localStorage.getItem(KEY) ?? '';
}

function cachedVerdict(): Verdict | null {
  try {
    return JSON.parse(localStorage.getItem(VERDICT_KEY) ?? 'null') as Verdict | null;
  } catch {
    return null;
  }
}

export function optimisticallyUnlocked(): boolean {
  return Boolean(getLicense() && cachedVerdict()?.valid);
}

export async function verifyLicense(force = false): Promise<Verdict | null> {
  const token = getLicense();
  if (!token) return null;
  const cached = cachedVerdict();
  if (!force && cached && Date.now() - cached.checkedAt < DAY) return cached;
  try {
    const response = await fetch(`${API_BASE}/api/v1/products/${SLUG}/verify?license=${encodeURIComponent(token)}`);
    if (!response.ok) throw new Error('Verification service unavailable');
    const result = await response.json() as { valid?: boolean; reason?: string };
    const verdict = { valid: result.valid === true, reason: result.reason ?? 'invalid', checkedAt: Date.now() };
    localStorage.setItem(VERDICT_KEY, JSON.stringify(verdict));
    return verdict;
  } catch {
    return cached;
  }
}
