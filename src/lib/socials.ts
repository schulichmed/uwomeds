/** Detect a social network from a profile link (plan Task 5). */
export type Network = 'instagram' | 'facebook' | 'tiktok' | 'linkedin' | 'youtube' | 'linktree' | 'website';

const HOSTS: [Network, string[]][] = [
  ['instagram', ['instagram.com']],
  ['facebook', ['facebook.com', 'fb.com']],
  ['tiktok', ['tiktok.com']],
  ['linkedin', ['linkedin.com']],
  ['youtube', ['youtube.com', 'youtu.be']],
  ['linktree', ['linktr.ee']],
];

export const NETWORK_LABEL: Record<Network, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  linktree: 'Linktree',
  website: 'Website',
};

function host(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '').replace(/^m\./, '');
  } catch {
    return null;
  }
}

export function detectNetwork(url: string): Network {
  const h = host(url);
  if (!h) return 'website';
  for (const [network, hosts] of HOSTS) {
    if (hosts.some((d) => h === d || h.endsWith(`.${d}`))) return network;
  }
  return 'website';
}

export function isHttpUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

/** `https://www.instagram.com/fakeclub/?hl=en` gives `fakeclub`; post and reel links give null. */
export function instagramHandle(url: string): string | null {
  if (detectNetwork(url) !== 'instagram') return null;
  try {
    const parts = new URL(url).pathname.split('/').filter(Boolean);
    if (parts.length !== 1) return null;
    const handle = parts[0];
    if (['p', 'reel', 'reels', 'stories', 'explore'].includes(handle)) return null;
    return /^[A-Za-z0-9._]+$/.test(handle) ? handle : null;
  } catch {
    return null;
  }
}

/** Small inline SVG icons; decorative (the link carries an aria-label). */
export function networkIcon(network: Network): string {
  const svg = (inner: string) =>
    `<svg class="icon" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">${inner}</svg>`;
  switch (network) {
    case 'instagram':
      return svg('<rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.5" cy="6.5" r="1.3" fill="currentColor"/>');
    case 'facebook':
      return svg('<rect x="2" y="2" width="20" height="20" rx="4" fill="currentColor"/><path d="M13.5 20v-6h2.2l.4-2.6h-2.6V9.8c0-.8.3-1.3 1.4-1.3h1.3V6.2c-.3 0-1.1-.1-2-.1-2 0-3.3 1.2-3.3 3.4v1.9H8.7V14h2.2v6z" fill="#fff"/>');
    case 'tiktok':
      return svg('<path d="M14 3h3c.2 2 1.5 3.4 3.5 3.6v3a7 7 0 0 1-3.5-1.1V15a6 6 0 1 1-6-6v3.1a2.9 2.9 0 1 0 3 2.9z" fill="currentColor"/>');
    case 'linkedin':
      return svg('<rect x="2" y="2" width="20" height="20" rx="3" fill="currentColor"/><path d="M7 10h2.4v7H7zm1.2-3.8a1.4 1.4 0 1 1 0 2.8 1.4 1.4 0 0 1 0-2.8zM11 10h2.3v1c.4-.7 1.2-1.2 2.4-1.2 2.4 0 2.8 1.5 2.8 3.5V17h-2.4v-3.3c0-.9 0-1.9-1.2-1.9s-1.4.9-1.4 1.8V17H11z" fill="#fff"/>');
    case 'youtube':
      return svg('<rect x="2" y="5" width="20" height="14" rx="4" fill="currentColor"/><path d="M10 9l5 3-5 3z" fill="#fff"/>');
    case 'linktree':
      return svg('<path d="M11 2h2v6.2l4.4-4.4 1.4 1.4L14.6 9.4H21v2h-6.4l4.4 4.4-1.4 1.4L12 11.6l-5.6 5.6L5 15.8l4.4-4.4H3v-2h6.4L5.2 5.2l1.4-1.4L11 8.2zM11 15h2v7h-2z" fill="currentColor"/>');
    default:
      return svg('<path d="M10.6 13.4a1 1 0 0 0 1.4 0l4-4a3 3 0 0 0-4.2-4.2l-1.5 1.5 1.4 1.4 1.5-1.5a1 1 0 0 1 1.4 1.4l-4 4a1 1 0 0 0 0 1.4zm2.8-2.8a1 1 0 0 0-1.4 0l-4 4a3 3 0 0 0 4.2 4.2l1.5-1.5-1.4-1.4-1.5 1.5a1 1 0 0 1-1.4-1.4l4-4a1 1 0 0 0 0-1.4z" fill="currentColor"/>');
  }
}
