(function() {
  'use strict';

  // Supabase configuration
  const SUPABASE_URL = 'https://egaecoxcpwqldktxlmvi.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnYWVjb3hjcHdxbGRrdHhsbXZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2MjAyMzcsImV4cCI6MjA4NDE5NjIzN30.lHET39bJc6pkdyBIipTjJbJfofroRhC18dYXrBGG4aE';

  // Find widget container
  const container = document.getElementById('fcc-vacancy-widget');
  if (!container) {
    console.error('FCC Widget: Container #fcc-vacancy-widget not found');
    return;
  }

  // Get configuration from data attributes
  const orgSlug = container.dataset.org;
  const providerLicense = container.dataset.provider;
  const linkBase = container.dataset.linkBase || container.getAttribute('data-link-base') || '';

  // Determine mode
  const isProviderMode = !!providerLicense;

  // Inject styles
  const style = document.createElement('style');
  style.textContent = `
    .fcc-widget {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 500px;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .fcc-widget-header {
      padding: 12px 16px;
      border-bottom: 1px solid #e5e7eb;
      background: #f9fafb;
    }
    .fcc-widget-title {
      font-size: 14px;
      font-weight: 600;
      color: #1f2937;
      margin: 0;
    }
    .fcc-widget-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid #f3f4f6;
      text-decoration: none;
      color: inherit;
      transition: background 0.15s;
    }
    .fcc-widget-row:hover {
      background: #f9fafb;
    }
    .fcc-widget-row:last-of-type {
      border-bottom: none;
    }
    .fcc-widget-name {
      font-size: 14px;
      font-weight: 500;
      color: #1f2937;
    }
    .fcc-widget-location {
      font-size: 12px;
      color: #6b7280;
      margin-top: 2px;
    }
    .fcc-widget-status {
      font-size: 13px;
      font-weight: 500;
      text-align: right;
    }
    .fcc-widget-status.open { color: #059669; }
    .fcc-widget-status.upcoming { color: #d97706; }
    .fcc-widget-status.waitlist { color: #2563eb; }
    .fcc-widget-status.full { color: #9ca3af; }
    .fcc-widget-detail {
      font-size: 11px;
      color: #9ca3af;
      margin-top: 2px;
    }
    .fcc-widget-footer {
      padding: 8px 16px;
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
      font-size: 11px;
      color: #9ca3af;
    }
    .fcc-widget-loading {
      padding: 24px;
      text-align: center;
      color: #6b7280;
    }
    .fcc-widget-error {
      padding: 16px;
      text-align: center;
      color: #dc2626;
      font-size: 14px;
    }
    .fcc-widget-single {
      padding: 16px;
    }
    .fcc-widget-single-status {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .fcc-widget-single-status.open { color: #059669; }
    .fcc-widget-single-status.upcoming { color: #d97706; }
    .fcc-widget-single-status.waitlist { color: #2563eb; }
    .fcc-widget-single-status.full { color: #9ca3af; }
    .fcc-widget-spots {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
    }
    .fcc-widget-spot-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 500;
    }
    .fcc-widget-spot-badge.infant { background: #fce7f3; color: #be185d; }
    .fcc-widget-spot-badge.toddler { background: #ffedd5; color: #c2410c; }
    .fcc-widget-spot-badge.preschool { background: #dcfce7; color: #15803d; }
    .fcc-widget-spot-badge.school-age { background: #dbeafe; color: #1d4ed8; }
  `;
  document.head.appendChild(style);

  // Show loading state
  container.innerHTML = '<div class="fcc-widget"><div class="fcc-widget-loading">Loading availability...</div></div>';

  // Fetch data from Supabase using RPC function
  async function fetchVacancyData() {
    if (isProviderMode) {
      // Single provider mode
      const url = `${SUPABASE_URL}/rest/v1/rpc/get_provider_vacancy`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ license_num: providerLicense })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch vacancy data');
      }

      return response.json();
    } else {
      // Organization mode
      const url = `${SUPABASE_URL}/rest/v1/rpc/get_org_vacancies`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ org_slug: orgSlug || 'modern-education' })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch vacancy data');
      }

      return response.json();
    }
  }

  // Calculate vacancy status
  function getVacancyStatus(vacancy) {
    const totalSpots = (vacancy.infant_spots || 0) + (vacancy.toddler_spots || 0) +
                       (vacancy.preschool_spots || 0) + (vacancy.school_age_spots || 0);

    if (totalSpots > 0) {
      const parts = [];
      if (vacancy.infant_spots > 0) parts.push('Infant: ' + vacancy.infant_spots);
      if (vacancy.toddler_spots > 0) parts.push('Toddler: ' + vacancy.toddler_spots);
      if (vacancy.preschool_spots > 0) parts.push('Preschool: ' + vacancy.preschool_spots);
      if (vacancy.school_age_spots > 0) parts.push('School Age: ' + vacancy.school_age_spots);

      return {
        status: 'open',
        text: totalSpots + ' spot' + (totalSpots > 1 ? 's' : '') + ' open',
        detail: parts.join(', '),
        sortOrder: 1
      };
    }

    // Check for upcoming based on available_date
    if (vacancy.available_date) {
      const availDate = new Date(vacancy.available_date);
      const now = new Date();
      const monthsDiff = (availDate.getFullYear() - now.getFullYear()) * 12 +
                         (availDate.getMonth() - now.getMonth());

      if (monthsDiff > 0 && monthsDiff <= 6) {
        const monthName = availDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        return {
          status: 'upcoming',
          text: 'Opening ' + monthName,
          detail: 'Future availability',
          sortOrder: 2
        };
      }
    }

    if (vacancy.waitlist_available) {
      return {
        status: 'waitlist',
        text: 'Waitlist Open',
        detail: 'Accepting waitlist',
        sortOrder: 3
      };
    }

    return {
      status: 'full',
      text: 'Currently Full',
      detail: 'No current openings',
      sortOrder: 4
    };
  }

  // Render single provider widget
  function renderSingle(data) {
    if (!data || data.length === 0) {
      container.innerHTML = '<div class="fcc-widget"><div class="fcc-widget-error">Provider not found</div></div>';
      return;
    }

    const vacancy = data[0];
    const statusInfo = getVacancyStatus(vacancy);

    const spots = [];
    if (vacancy.infant_spots > 0) {
      spots.push(`<span class="fcc-widget-spot-badge infant">Infant: ${vacancy.infant_spots}</span>`);
    }
    if (vacancy.toddler_spots > 0) {
      spots.push(`<span class="fcc-widget-spot-badge toddler">Toddler: ${vacancy.toddler_spots}</span>`);
    }
    if (vacancy.preschool_spots > 0) {
      spots.push(`<span class="fcc-widget-spot-badge preschool">Preschool: ${vacancy.preschool_spots}</span>`);
    }
    if (vacancy.school_age_spots > 0) {
      spots.push(`<span class="fcc-widget-spot-badge school-age">School Age: ${vacancy.school_age_spots}</span>`);
    }

    const updatedText = vacancy.last_updated
      ? 'Updated ' + new Date(vacancy.last_updated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : '';

    container.innerHTML = `
      <div class="fcc-widget">
        <div class="fcc-widget-header">
          <h3 class="fcc-widget-title">Current Availability</h3>
        </div>
        <div class="fcc-widget-single">
          <div class="fcc-widget-single-status ${statusInfo.status}">${statusInfo.text}</div>
          ${spots.length > 0 ? `<div class="fcc-widget-spots">${spots.join('')}</div>` : `<div class="fcc-widget-detail">${statusInfo.detail}</div>`}
        </div>
        <div class="fcc-widget-footer">${updatedText}</div>
      </div>
    `;
  }

  // Render multi-location widget
  function renderMulti(data) {
    // Add status info and sort
    const locations = data.map(v => ({
      ...v,
      ...getVacancyStatus(v)
    })).sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.business_name.localeCompare(b.business_name);
    });

    const lastUpdated = locations.reduce((latest, loc) => {
      if (loc.last_updated && (!latest || new Date(loc.last_updated) > new Date(latest))) {
        return loc.last_updated;
      }
      return latest;
    }, null);

    const rows = locations.map(loc => {
      // Build link: linkBase/neighborhood.html (e.g., https://www.daycaresf.com/hayes-valley.html)
      const slug = (loc.neighborhood || loc.business_name).toLowerCase().replace(/\s+/g, '-');
      const href = linkBase ? `${linkBase}/${slug}.html` : '';
      return `
        <a href="${href || 'javascript:void(0)'}" class="fcc-widget-row">
          <div>
            <div class="fcc-widget-name">${loc.business_name}</div>
            <div class="fcc-widget-location">${loc.neighborhood || loc.zip_code}</div>
          </div>
          <div>
            <div class="fcc-widget-status ${loc.status}">${loc.text}</div>
            <div class="fcc-widget-detail">${loc.detail}</div>
          </div>
        </a>
      `;
    }).join('');

    const updatedText = lastUpdated
      ? 'Updated ' + new Date(lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : '';

    container.innerHTML = `
      <div class="fcc-widget">
        <div class="fcc-widget-header">
          <h3 class="fcc-widget-title">Program Availability</h3>
        </div>
        ${rows}
        <div class="fcc-widget-footer">${updatedText}</div>
      </div>
    `;
  }

  // Initialize
  fetchVacancyData()
    .then(data => {
      if (!data || data.length === 0) {
        container.innerHTML = '<div class="fcc-widget"><div class="fcc-widget-error">No data found</div></div>';
        return;
      }
      if (isProviderMode) {
        renderSingle(data);
      } else {
        renderMulti(data);
      }
    })
    .catch(err => {
      console.error('FCC Widget Error:', err);
      container.innerHTML = '<div class="fcc-widget"><div class="fcc-widget-error">Unable to load availability</div></div>';
    });

})();
