export type InAppBrowser = 'wechat' | 'line' | 'facebook' | 'instagram' | 'tiktok' | null;

export function detectInAppBrowser(): InAppBrowser {
  if (typeof navigator === 'undefined') return null;
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('micromessenger')) return 'wechat';
  if (ua.includes(' line/') || ua.includes(' line ')) return 'line';
  if (ua.includes('fban') || ua.includes('fbav') || ua.includes('fb_iab')) return 'facebook';
  if (ua.includes('instagram')) return 'instagram';
  if (ua.includes('tiktok') || ua.includes('bytedance') || ua.includes('musical_ly')) return 'tiktok';
  return null;
}

export function isWeChat(): boolean {
  return detectInAppBrowser() === 'wechat';
}
