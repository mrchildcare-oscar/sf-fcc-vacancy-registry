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
    if (l.code === current) {
      return '<span class="aud-lang-btn active" aria-current="page">' + l.label + '</span>';
    }
    return '<a class="aud-lang-btn" href="' + href + '" hreflang="' + l.code + '">' + l.label + '</a>';
  }).join('');

  // Static pages are all parent-facing content, so Find Child Care is active.
  bar.innerHTML =
    '<a class="aud-tab aud-tab-parent active" href="' + homeUrl + '">' + labels.parent + '</a>' +
    '<a class="aud-tab aud-tab-provider" href="' + providerUrl + '">' + labels.provider + '</a>' +
    '<div class="aud-lang">' + pillHtml + '</div>';
})();
