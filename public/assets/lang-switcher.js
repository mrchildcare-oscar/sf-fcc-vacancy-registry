(function () {
  var LANGS = [
    { code: 'en',    label: 'EN',    prefix: ''    },
    { code: 'es',    label: 'ES',    prefix: '/es' },
    { code: 'zh-TW', label: '中文',  prefix: '/zh' },
  ];

  // Audience-bar labels per language.
  var LABELS = {
    'en':    { parent: 'Find Child Care',    provider: 'List Your Vacancy' },
    'es':    { parent: 'Buscar cuidado',     provider: 'Liste su vacante' },
    'zh-TW': { parent: '尋找托兒',           provider: '刊登您的空缺'    },
  };

  var path = window.location.pathname;

  // Detect current language from URL prefix
  var current = 'en';
  if (/^\/zh(\/|$)/.test(path)) current = 'zh-TW';
  else if (/^\/es(\/|$)/.test(path)) current = 'es';

  // Strip current-language prefix to get canonical sub-path
  var subPath = path.replace(/^\/zh(?=\/|$)/, '').replace(/^\/es(?=\/|$)/, '');
  if (!subPath) subPath = '/';

  // SPA URLs for the audience tabs. The SPA reads ?lang= so the user stays
  // in the same language when jumping from a static article to the SPA.
  var langParam = '';
  if (current === 'zh-TW') langParam = '?lang=zh';
  else if (current === 'es') langParam = '?lang=es';
  var homeUrl = '/' + langParam;
  var providerUrl = '/list-your-vacancy' + langParam;

  // --- Legacy language-pill-only mount (backwards compatible) ---
  var legacy = document.getElementById('lang-switcher');
  if (legacy && !document.getElementById('audience-top-bar')) {
    legacy.innerHTML = LANGS.map(function (l) {
      var href = l.prefix + subPath;
      if (href === '') href = '/';
      // The EN homepage is the SPA at "/", which honors ?lang= before stored
      // language — force it so switching to EN doesn't stick on the visitor's
      // last language. (Localized homepages /es/ /zh/ are static, no param needed.)
      if (href === '/' && l.code === 'en') href = '/?lang=en';
      if (l.code === current) {
        return '<span class="active" aria-current="page">' + l.label + '</span>';
      }
      return '<a href="' + href + '" hreflang="' + l.code + '">' + l.label + '</a>';
    }).join('');
  }

  // --- Audience top bar (new) ---
  var bar = document.getElementById('audience-top-bar');
  if (!bar) return;

  var labels = LABELS[current] || LABELS.en;

  var pillHtml = LANGS.map(function (l) {
    var href = l.prefix + subPath;
    if (href === '') href = '/';
    // See note above: force EN homepage to the SPA with ?lang=en so it doesn't
    // inherit the visitor's stored (e.g. Chinese) language.
    if (href === '/' && l.code === 'en') href = '/?lang=en';
    if (l.code === current) {
      return '<span class="aud-lang-btn active" aria-current="page">' + l.label + '</span>';
    }
    return '<a class="aud-lang-btn" href="' + href + '" hreflang="' + l.code + '">' + l.label + '</a>';
  }).join('');

  // 🎈 Fair 2026 highlight — mirrors the SPA AudienceTopBar; opens the fair page
  // in the current language. Auto-retires after the event (Jun 28, 00:00 PT).
  var FAIR = {
    'en':    { label: 'Fair 2026',   href: '/fcc-fair-2026' },
    'es':    { label: 'Feria 2026',  href: '/fcc-fair-2026?lang=es' },
    'zh-TW': { label: '博覽會 2026', href: '/fcc-fair-2026?lang=zh' },
  };
  var f = FAIR[current] || FAIR.en;
  var fairHtml = Date.now() > Date.parse('2026-06-28T00:00:00-07:00') ? '' :
    '<a class="aud-fair" href="' + f.href + '">' +
      '<span class="aud-fair-full">🎈 ' + f.label + '</span>' +
      '<span class="aud-fair-short" aria-hidden="true">🎈</span>' +
    '</a>';

  // Static pages are all parent-facing content, so Find Child Care is active.
  bar.innerHTML =
    '<a class="aud-tab aud-tab-parent active" href="' + homeUrl + '">' + labels.parent + '</a>' +
    '<a class="aud-tab aud-tab-provider" href="' + providerUrl + '">' + labels.provider + '</a>' +
    '<div class="aud-right">' + fairHtml + '<div class="aud-lang">' + pillHtml + '</div></div>';
})();
