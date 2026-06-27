#!/usr/bin/env node
// Generates public/links.html — a personal reference of every /go/* short link
// and where it points. Reads vercel.json so the list is always complete.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const { redirects } = JSON.parse(readFileSync(join(ROOT, 'vercel.json'), 'utf8'));

// Friendly labels + grouping (fallback: derived from slug). Edit here as needed.
const META = {
  '/go/survey':      { group: 'Outreach',  label: 'Community survey' },
  '/go/consent':     { group: 'Outreach',  label: 'Consent form' },
  '/go/volunteer':   { group: 'Outreach',  label: 'Volunteer helper page (both QRs)' },
  '/go/rsvp':        { group: 'Events',    label: 'Event RSVP' },
  '/go/rsvp-zh':     { group: 'Events',    label: 'Event RSVP — 中文' },
  '/go/rsvp-es':     { group: 'Events',    label: 'Event RSVP — Español' },
  '/go/eligibility': { group: 'Site',      label: 'Eligibility checker' },
  '/go/find':        { group: 'Site',      label: 'Find vacancies' },
  '/go/list':        { group: 'Site',      label: 'List your vacancy' },
  '/go/en':          { group: 'Language',  label: 'Site in English' },
  '/go/es':          { group: 'Language',  label: 'Site in Español' },
  '/go/zh':          { group: 'Language',  label: 'Site in 中文' },
  '/go/links':       { group: 'Reference', label: 'This page — all go links' },
};
const ORDER = ['Outreach', 'Events', 'Site', 'Language', 'Reference', 'Other'];

const links = redirects
  .filter(r => r.source.startsWith('/go/'))
  .map(r => {
    const m = META[r.source] || {};
    const slug = r.source.replace('/go/', '');
    return {
      source: r.source,
      label: m.label || slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      group: m.group || 'Other',
      dest: r.destination,
      external: r.destination.startsWith('http'),
    };
  });

const groups = ORDER.filter(g => links.some(l => l.group === g));

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const destShort = d => d.startsWith('http')
  ? esc(d.replace(/^https?:\/\//, '').replace(/\/$/, '').slice(0, 48) + (d.length > 55 ? '…' : ''))
  : esc(d);

const rows = g => links.filter(l => l.group === g).map(l => `
        <li>
          <a class="slug" href="${esc(l.source)}">familychildcaresf.com${esc(l.source)}</a>
          <span class="label">${esc(l.label)}</span>
          <span class="dest ${l.external ? 'ext' : 'int'}">${l.external ? '↗ ' : ''}${destShort(l.dest)}</span>
        </li>`).join('');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Go Links — quick reference</title>
<style>
  :root { --ink:#111; --muted:#5b6470; --line:#e6e9ec; --accent:#0f766e; --bg:#f6f7f9; }
  * { box-sizing:border-box; }
  body { margin:0; background:var(--bg); color:var(--ink); line-height:1.45;
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; }
  .wrap { max-width:740px; margin:0 auto; padding:28px 18px 60px; }
  h1 { font-size:24px; margin:0 0 2px; }
  .tag { text-transform:uppercase; letter-spacing:.16em; font-size:11px; font-weight:700; color:var(--accent); }
  .intro { color:var(--muted); font-size:14px; margin:6px 0 22px; }
  h2 { font-size:13px; text-transform:uppercase; letter-spacing:.06em; color:var(--muted);
    margin:24px 0 8px; }
  ul { list-style:none; margin:0; padding:0; display:grid; gap:8px; }
  li { background:#fff; border:1px solid var(--line); border-radius:12px; padding:12px 14px;
    display:grid; grid-template-columns:1fr; gap:3px; }
  @media (min-width:560px){ li{ grid-template-columns:auto 1fr; align-items:baseline; column-gap:14px; } .label{grid-column:1/2;} .dest{grid-column:2/3; text-align:right;} .slug{grid-column:1/3;} }
  .slug { font-family:ui-monospace,Menlo,Consolas,monospace; font-size:14px; font-weight:600;
    color:var(--ink); text-decoration:none; word-break:break-all; }
  .slug:hover { color:var(--accent); text-decoration:underline; }
  .label { font-size:13px; color:var(--ink); font-weight:600; }
  .dest { font-size:12px; color:var(--muted); font-family:ui-monospace,Menlo,Consolas,monospace; word-break:break-all; }
  .dest.int { color:#92400e; }
  footer { color:var(--muted); font-size:12px; margin-top:28px; }
  code { background:#eef0f2; padding:1px 5px; border-radius:5px; font-size:12px; }
</style>
</head>
<body>
  <div class="wrap">
    <div class="tag">Personal reference</div>
    <h1>Go Links</h1>
    <p class="intro">Every <code>/go/</code> short link and where it points. Tap a link to follow it. Generated from <code>vercel.json</code> — re-run <code>scripts/build-go-links.mjs</code> after adding links.</p>
${groups.map(g => `    <h2>${g}</h2>\n    <ul>${rows(g)}\n    </ul>`).join('\n')}
    <footer>familychildcaresf.com/go/links · ${links.length} short links</footer>
  </div>
</body>
</html>
`;

mkdirSync(join(ROOT, 'public'), { recursive: true });
writeFileSync(join(ROOT, 'public/links.html'), html);
console.log(`Wrote public/links.html — ${links.length} /go links across ${groups.length} groups`);
