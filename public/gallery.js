(function() {
  'use strict';

  const SUPABASE_URL = 'https://egaecoxcpwqldktxlmvi.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnYWVjb3hjcHdxbGRrdHhsbXZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2MjAyMzcsImV4cCI6MjA4NDE5NjIzN30.lHET39bJc6pkdyBIipTjJbJfofroRhC18dYXrBGG4aE';

  const container = document.getElementById('fcc-gallery-widget');
  if (!container) {
    console.error('FCC Gallery: Container #fcc-gallery-widget not found');
    return;
  }

  const orgSlug = container.dataset.org;
  const limit = parseInt(container.dataset.limit || '9', 10);
  const columns = parseInt(container.dataset.columns || '3', 10);

  if (!orgSlug) {
    console.error('FCC Gallery: data-org attribute is required');
    return;
  }

  const style = document.createElement('style');
  style.textContent = `
    .fcc-gallery {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
    }
    .fcc-gallery-grid {
      display: grid;
      grid-template-columns: repeat(${columns}, 1fr);
      gap: 8px;
    }
    @media (max-width: 640px) {
      .fcc-gallery-grid {
        grid-template-columns: repeat(${Math.min(columns, 2)}, 1fr);
        gap: 4px;
      }
    }
    .fcc-gallery-item {
      position: relative;
      aspect-ratio: 1 / 1;
      overflow: hidden;
      border-radius: 6px;
      background: #f3f4f6;
      cursor: pointer;
      display: block;
      text-decoration: none;
    }
    .fcc-gallery-item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: transform 0.3s ease;
    }
    .fcc-gallery-item:hover img {
      transform: scale(1.05);
    }
    .fcc-gallery-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0) 60%);
      opacity: 0;
      transition: opacity 0.2s ease;
      display: flex;
      align-items: flex-end;
      padding: 12px;
      box-sizing: border-box;
    }
    .fcc-gallery-item:hover .fcc-gallery-overlay,
    .fcc-gallery-item:focus-visible .fcc-gallery-overlay {
      opacity: 1;
    }
    .fcc-gallery-caption {
      color: #fff;
      font-size: 12px;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .fcc-gallery-badge {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 20px;
      height: 20px;
      color: #fff;
      filter: drop-shadow(0 1px 2px rgba(0,0,0,0.4));
      pointer-events: none;
    }
    .fcc-gallery-loading {
      display: grid;
      grid-template-columns: repeat(${columns}, 1fr);
      gap: 8px;
    }
    .fcc-gallery-skeleton {
      aspect-ratio: 1 / 1;
      background: linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%);
      background-size: 200% 100%;
      animation: fcc-shimmer 1.5s infinite;
      border-radius: 6px;
    }
    @keyframes fcc-shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    .fcc-gallery-empty {
      padding: 24px;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
      background: #f9fafb;
      border-radius: 6px;
    }
    .fcc-gallery-error {
      padding: 16px;
      text-align: center;
      color: #dc2626;
      font-size: 13px;
    }
  `;
  document.head.appendChild(style);

  function renderLoading() {
    const skeletons = Array.from({ length: limit }, () =>
      '<div class="fcc-gallery-skeleton"></div>'
    ).join('');
    container.innerHTML = `<div class="fcc-gallery"><div class="fcc-gallery-loading">${skeletons}</div></div>`;
  }

  function escapeHtml(s) {
    if (!s) return '';
    return s.replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function carouselBadge() {
    return `<svg class="fcc-gallery-badge" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="7" y="3" width="14" height="14" rx="2" stroke="currentColor" stroke-width="2"/>
      <rect x="3" y="7" width="14" height="14" rx="2" fill="currentColor" opacity="0.6" stroke="currentColor" stroke-width="2"/>
    </svg>`;
  }

  function videoBadge() {
    return `<svg class="fcc-gallery-badge" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M8 5v14l11-7z"/>
    </svg>`;
  }

  function renderPosts(posts) {
    if (!posts || posts.length === 0) {
      container.innerHTML = `<div class="fcc-gallery"><div class="fcc-gallery-empty">No posts to display yet.</div></div>`;
      return;
    }

    const items = posts.map(p => {
      const src = p.thumbnail_url || p.image_url;
      const href = p.permalink || p.image_url;
      const caption = escapeHtml(p.caption || '');
      const badge = p.media_type === 'CAROUSEL_ALBUM' ? carouselBadge()
                  : p.media_type === 'VIDEO' ? videoBadge()
                  : '';
      return `
        <a class="fcc-gallery-item" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" aria-label="${caption.slice(0, 80) || 'Instagram post'}">
          <img src="${escapeHtml(src)}" alt="${caption.slice(0, 80) || ''}" loading="lazy" referrerpolicy="no-referrer" />
          ${badge}
          ${caption ? `<div class="fcc-gallery-overlay"><div class="fcc-gallery-caption">${caption}</div></div>` : ''}
        </a>`;
    }).join('');

    container.innerHTML = `<div class="fcc-gallery"><div class="fcc-gallery-grid">${items}</div></div>`;
  }

  function renderError(msg) {
    container.innerHTML = `<div class="fcc-gallery"><div class="fcc-gallery-error">${escapeHtml(msg)}</div></div>`;
  }

  async function fetchPosts() {
    try {
      const orgRes = await fetch(
        `${SUPABASE_URL}/rest/v1/organizations?slug=eq.${encodeURIComponent(orgSlug)}&select=id`,
        { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      const orgs = await orgRes.json();
      if (!orgs || orgs.length === 0) {
        renderError(`Organization "${orgSlug}" not found.`);
        return;
      }
      const orgId = orgs[0].id;

      const postsRes = await fetch(
        `${SUPABASE_URL}/rest/v1/gallery_posts?organization_id=eq.${orgId}&is_active=eq.true&select=image_url,thumbnail_url,caption,permalink,media_type,posted_at,display_order&order=display_order.desc,posted_at.desc&limit=${limit}`,
        { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
      );
      const posts = await postsRes.json();
      renderPosts(posts);
    } catch (err) {
      console.error('FCC Gallery error:', err);
      renderError('Could not load gallery.');
    }
  }

  renderLoading();
  fetchPosts();
})();
