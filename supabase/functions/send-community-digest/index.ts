// Monthly Community Digest — the reciprocity + reporting-nudge email.
// Reads the latest community_snapshots row and emails the community picture back to
// providers, in their language. Two modes:
//   - "test" (default): sends all three language versions to the report inbox for review.
//   - "live": sends each active+approved provider one email in their inferred language.
// Language is inferred from providers.languages (what they offer): Chinese -> zh-TW,
// Spanish -> es, otherwise English.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type Lang = 'en' | 'es' | 'zh-TW'
const LANG_PARAM: Record<Lang, string> = { 'en': 'en', 'es': 'es', 'zh-TW': 'zh' }
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

interface Snapshot {
  snapshot_month: string
  programs_with_openings: number
  open_spots: number
  elfa_programs: number
  beyond_elfa_programs: number
  freshness: Record<string, number>
  digest_sent_at?: string | null
}

function pickLang(languages: unknown): Lang {
  const langs = (Array.isArray(languages) ? languages : []).map((l) => String(l || '').toLowerCase())
  if (langs.some((l) => l.includes('cantonese') || l.includes('mandarin') || l.includes('chinese'))) return 'zh-TW'
  if (langs.some((l) => l.includes('spanish') || l.includes('español'))) return 'es'
  return 'en'
}

const COPY: Record<Lang, {
  subject: string
  heading: string
  intro: string
  stat: (p: number, s: number) => string
  nudge: (stale: number) => string
  updateCta: string
  seeCta: string
  footer: string
  optOut: string
}> = {
  'en': {
    subject: 'SF Family Child Care — this month’s community snapshot',
    heading: 'How the community is doing this month',
    intro: 'A quick snapshot of family child care openings across San Francisco — shared back with you, the providers who make it real.',
    stat: (p, s) => `<strong>${p}</strong> programs are sharing <strong>${s}</strong> open spots right now.`,
    nudge: (stale) => `${stale} listings haven’t been updated in over a month. If your openings changed, refreshing yours takes about 2 minutes — families are looking.`,
    updateCta: 'Update your openings',
    seeCta: 'See the full picture',
    footer: 'A service of the Family Child Care Association of San Francisco',
    optOut: 'Don’t want these monthly updates? Just reply with “unsubscribe.”',
  },
  'es': {
    subject: 'Cuidado Infantil Familiar de SF — resumen comunitario del mes',
    heading: 'Cómo está la comunidad este mes',
    intro: 'Un breve resumen de las vacantes de cuidado infantil familiar en San Francisco — compartido con ustedes, los proveedores que lo hacen posible.',
    stat: (p, s) => `<strong>${p}</strong> programas tienen <strong>${s}</strong> espacios disponibles ahora mismo.`,
    nudge: (stale) => `${stale} listados no se han actualizado en más de un mes. Si su disponibilidad cambió, actualizarla toma unos 2 minutos — las familias están buscando.`,
    updateCta: 'Actualizar mis vacantes',
    seeCta: 'Ver el panorama completo',
    footer: 'Un servicio de la Asociación de Cuidado Infantil Familiar de San Francisco',
    optOut: '¿No desea estas actualizaciones mensuales? Responda con «cancelar» y lo quitaremos de la lista.',
  },
  'zh-TW': {
    subject: '本月家庭托兒空缺近況',
    heading: '本月社區托兒近況',
    intro: '以下是這個月舊金山家庭托兒的空缺情況，和大家分享。謝謝各位一直以來的付出。',
    stat: (p, s) => `目前有 <strong>${p}</strong> 間家庭托兒正在招生，共 <strong>${s}</strong> 個名額。`,
    nudge: (stale) => `有 ${stale} 家的空缺資料超過一個月沒更新了。如果情況有變，花兩分鐘更新一下就好，家長們都在找。`,
    updateCta: '更新我的空缺',
    seeCta: '查看完整情況',
    footer: '由舊金山家庭托兒協會提供',
    optOut: '不想再收到每月更新？回覆「取消」就可以，我們會把您從名單移除。',
  },
}

function renderEmail(lang: Lang, snap: Snapshot): { subject: string; html: string; text: string } {
  const c = COPY[lang]
  const p = snap.programs_with_openings
  const s = snap.open_spots
  const stale = Number(snap.freshness?.stale || 0)
  const lp = LANG_PARAM[lang]
  const insightsUrl = `https://familychildcaresf.com/?lang=${lp}#insights`
  const updateUrl = `https://familychildcaresf.com/?lang=${lp}#list-your-vacancy`

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;margin:0;padding:20px;">
  <div style="max-width:540px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
    <div style="background:#0d9488;padding:28px 32px;">
      <h1 style="color:white;font-size:20px;margin:0;">${c.heading}</h1>
      <p style="color:rgba(255,255,255,0.9);margin:6px 0 0;font-size:13px;">FamilyChildCareSF.com</p>
    </div>
    <div style="padding:28px 32px;">
      <p style="color:#334155;font-size:15px;line-height:1.5;margin:0 0 18px;">${c.intro}</p>
      <div style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:10px;padding:18px;margin-bottom:18px;">
        <p style="color:#134e4a;font-size:17px;line-height:1.5;margin:0;">${c.stat(p, s)}</p>
      </div>
      ${stale > 0 ? `<p style="color:#64748b;font-size:14px;line-height:1.5;margin:0 0 22px;">${c.nudge(stale)}</p>` : ''}
      <div style="text-align:center;margin-bottom:14px;">
        <a href="${updateUrl}" style="display:inline-block;background:#0d9488;color:white;text-decoration:none;padding:11px 26px;border-radius:8px;font-size:15px;font-weight:600;">${c.updateCta}</a>
      </div>
      <div style="text-align:center;">
        <a href="${insightsUrl}" style="color:#0d9488;text-decoration:none;font-size:14px;font-weight:600;">${c.seeCta} →</a>
      </div>
      <div style="margin-top:28px;padding-top:18px;border-top:1px solid #e2e8f0;">
        <p style="color:#94a3b8;font-size:12px;line-height:1.5;margin:0 0 6px;">${c.footer}</p>
        <p style="color:#cbd5e1;font-size:11px;line-height:1.5;margin:0;">${c.optOut}</p>
      </div>
    </div>
  </div>
</body></html>`

  const text = `${c.heading}\n\n${c.intro}\n\n${c.stat(p, s).replace(/<[^>]+>/g, '')}\n${stale > 0 ? '\n' + c.nudge(stale) + '\n' : ''}\n${c.updateCta}: ${updateUrl}\n${c.seeCta}: ${insightsUrl}\n\n${c.footer}\n${c.optOut}`

  return { subject: c.subject, html, text }
}

async function sendEmail(apiKey: string, to: string, lang: Lang, content: { subject: string; html: string; text: string }, subjectPrefix = '') {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      from: 'Family Child Care SF <noreply@notifications.familychildcaresf.com>',
      to: [to],
      reply_to: 'oscar@familychildcaresf.com',
      subject: subjectPrefix + content.subject,
      html: content.html,
      text: content.text,
      headers: { 'List-Unsubscribe': '<mailto:oscar@familychildcaresf.com?subject=unsubscribe>' },
    }),
  })
  if (!res.ok) throw new Error(`Resend error (${res.status}) for ${to}: ${await res.text()}`)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const reportRecipient = Deno.env.get('DAILY_REPORT_EMAIL') || 'oscar@familychildcaresf.com'
    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: 'Email service not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    let mode: 'test' | 'live' = 'test'
    try {
      const body = await req.json()
      if (body?.mode === 'live') mode = 'live'
    } catch (_e) { /* no body -> default test */ }

    const supabase = createClient(supabaseUrl, serviceKey)

    // Latest monthly snapshot drives the numbers (always matches the /insights page).
    const { data: snaps, error: snapErr } = await supabase
      .from('community_snapshots')
      .select('snapshot_month, programs_with_openings, open_spots, elfa_programs, beyond_elfa_programs, freshness, digest_sent_at')
      .order('snapshot_month', { ascending: false })
      .limit(1)
    if (snapErr) throw snapErr
    const snap = (snaps && snaps[0]) as Snapshot | undefined
    if (!snap) {
      return new Response(JSON.stringify({ error: 'No community snapshot found yet' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (mode === 'test') {
      const langs: Lang[] = ['en', 'es', 'zh-TW']
      for (const lang of langs) {
        await sendEmail(resendApiKey, reportRecipient, lang, renderEmail(lang, snap), `[TEST · ${lang.toUpperCase()}] `)
      }
      return new Response(JSON.stringify({ success: true, mode, sentTo: reportRecipient, versions: langs, snapshot_month: snap.snapshot_month }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // LIVE: every active + approved provider, in their inferred language.
    // Idempotent per month: if this month's digest already went out, skip — prevents the
    // 10:00 cron from re-sending after a manual run, and guards accidental re-triggers.
    if (snap.digest_sent_at) {
      return new Response(JSON.stringify({ success: true, mode, skipped: true, reason: `digest already sent for ${snap.snapshot_month}`, digest_sent_at: snap.digest_sent_at }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: providers, error: provErr } = await supabase
      .from('providers')
      .select('contact_email, email, languages')
      .eq('is_active', true)
      .eq('is_approved', true)
    if (provErr) throw provErr

    const seen = new Set<string>()
    const byLang: Record<Lang, number> = { 'en': 0, 'es': 0, 'zh-TW': 0 }
    let sent = 0
    const errors: string[] = []
    for (const p of providers || []) {
      const to = (p.contact_email || p.email || '').trim().toLowerCase()
      // Skip blanks, dupes (multi-location providers share a contact email), and obvious test rows.
      if (!to || seen.has(to) || /(test|demo|example|noreply)/.test(to)) continue
      seen.add(to)
      const lang = pickLang(p.languages)
      try {
        await sendEmail(resendApiKey, to, lang, renderEmail(lang, snap))
        byLang[lang]++
        sent++
      } catch (e) {
        errors.push(e instanceof Error ? e.message : String(e))
      }
      await sleep(500) // stay under Resend's ~2 req/s rate limit
    }

    // Stamp the month so re-runs (including the scheduled cron) don't double-send.
    if (sent > 0) {
      await supabase.from('community_snapshots').update({ digest_sent_at: new Date().toISOString() }).eq('snapshot_month', snap.snapshot_month)
    }

    return new Response(JSON.stringify({ success: true, mode, sent, byLang, errors: errors.slice(0, 10), snapshot_month: snap.snapshot_month }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    console.error('Error sending community digest:', err)
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
