import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const reportRecipient = Deno.env.get('DAILY_REPORT_EMAIL') || 'oscar@familychildcaresf.com'

    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured')
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const now = new Date()
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)

    const metrics = await getDetailedMetrics(supabase, yesterday, now)
    await sendDiagnosticReport(resendApiKey, reportRecipient, metrics, now)

    console.log('Daily diagnostic report sent to', reportRecipient)
    return new Response(
      JSON.stringify({ success: true, recipient: reportRecipient, metrics }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Error sending daily report:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function getDetailedMetrics(supabase: any, startDate: Date, endDate: Date) {
  const metrics: any = {}
  const sevenDaysOut = new Date(endDate)
  sevenDaysOut.setDate(sevenDaysOut.getDate() + 7)

  // === PROVIDERS ===
  const { data: allProviders } = await supabase
    .from('providers')
    .select('id, created_at, intake_source, is_approved, is_active, business_name, contact_email, zip_code')
    .order('created_at', { ascending: false })

  const providers = allProviders || []
  const bySource = (src: string) => providers.filter((p: any) => (p.intake_source ?? 'self_signup') === src)
  const newInWindow = (rows: any[]) => rows.filter((r: any) => {
    const t = new Date(r.created_at).getTime()
    return t >= startDate.getTime() && t <= endDate.getTime()
  })

  const pendingApproval = providers.filter((p: any) => p.is_approved === false && p.is_active !== false)

  metrics.providers = {
    total: providers.length,
    totalJotform: bySource('jotform').length,
    totalSelfSignup: bySource('self_signup').length,
    totalAdmin: bySource('admin').length,
    new24h: newInWindow(providers).length,
    new24hJotform: newInWindow(bySource('jotform')).length,
    new24hSelfSignup: newInWindow(bySource('self_signup')).length,
    new24hAdmin: newInWindow(bySource('admin')).length,
    pendingApproval: pendingApproval.length,
    pendingApprovalSample: pendingApproval.slice(0, 3).map((p: any) => ({
      name: p.business_name,
      email: p.contact_email,
      zip: p.zip_code,
      daysAgo: Math.floor((endDate.getTime() - new Date(p.created_at).getTime()) / 86400000),
    })),
  }

  // === PENDING INTAKES QUEUE ===
  // Table added in migration 20260419. Gracefully handle absence for older DBs.
  let pendingIntakes: any[] = []
  try {
    const { data } = await supabase
      .from('pending_intakes')
      .select('id, reason, created_at, token_expires_at, target_provider_id, payload')
      .is('resolved_at', null)
      .order('created_at', { ascending: false })
    pendingIntakes = data || []
  } catch (_e) {
    pendingIntakes = []
  }

  const classifyReason = (reason: string): string => {
    if (reason === 'suspicious_duplicate') return 'suspicious_duplicate'
    if (reason === 'auto_update_applied') return 'auto_update_applied'
    if (reason.startsWith('validation:')) return 'validation'
    if (reason.startsWith('insert_error')) return 'insert_error'
    return 'other'
  }

  const intakesByReason = pendingIntakes.reduce((acc: Record<string, any[]>, row: any) => {
    const k = classifyReason(row.reason || '')
    acc[k] = acc[k] || []
    acc[k].push(row)
    return acc
  }, {})

  // 24h activity — count ALL intake events (including resolved) for activity volume.
  let intake24hCount = 0
  let autoUpdate24hCount = 0
  try {
    const { data } = await supabase
      .from('pending_intakes')
      .select('reason, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
    intake24hCount = (data || []).length
    autoUpdate24hCount = (data || []).filter((r: any) => r.reason === 'auto_update_applied').length
  } catch (_e) {
    // Table not yet present.
  }

  metrics.intake = {
    pendingSuspicious: (intakesByReason.suspicious_duplicate || []).length,
    pendingValidation: (intakesByReason.validation || []).length,
    pendingInsertError: (intakesByReason.insert_error || []).length,
    pendingOther: (intakesByReason.other || []).length,
    totalPending:
      (intakesByReason.suspicious_duplicate || []).length +
      (intakesByReason.validation || []).length +
      (intakesByReason.insert_error || []).length +
      (intakesByReason.other || []).length,
    intakeEvents24h: intake24hCount,
    autoUpdates24h: autoUpdate24hCount,
    suspiciousSample: (intakesByReason.suspicious_duplicate || []).slice(0, 3).map((r: any) => {
      const p = r.payload || {}
      const submitted = stripQ(p) as any
      return {
        license: submitted.license_number,
        submittedBusiness: submitted.business_name,
        submittedEmail: submitted.contact_email,
        daysAgo: Math.floor((endDate.getTime() - new Date(r.created_at).getTime()) / 86400000),
        expiresInDays: r.token_expires_at
          ? Math.max(0, Math.ceil((new Date(r.token_expires_at).getTime() - endDate.getTime()) / 86400000))
          : null,
      }
    }),
    validationSample: (intakesByReason.validation || []).slice(0, 3).map((r: any) => ({
      reason: (r.reason || '').replace(/^validation:\s*/, ''),
      daysAgo: Math.floor((endDate.getTime() - new Date(r.created_at).getTime()) / 86400000),
    })),
  }

  // === VACANCIES ===
  const { data: allVacancies } = await supabase
    .from('vacancies')
    .select('provider_id, infant_spots, toddler_spots, preschool_spots, school_age_spots, waitlist_available, expires_at, reported_at')

  const vacancies = allVacancies || []
  const active = vacancies.filter((v: any) => new Date(v.expires_at) > endDate)
  const expiringSoon = active.filter((v: any) => new Date(v.expires_at) <= sevenDaysOut)
  const expired24h = vacancies.filter((v: any) => {
    const exp = new Date(v.expires_at).getTime()
    return exp > startDate.getTime() && exp <= endDate.getTime()
  })
  const newVacancies24h = vacancies.filter((v: any) => {
    const t = new Date(v.reported_at).getTime()
    return t >= startDate.getTime() && t <= endDate.getTime()
  })

  const sumSpots = (rows: any[]) =>
    rows.reduce(
      (s: number, v: any) =>
        s + (v.infant_spots || 0) + (v.toddler_spots || 0) + (v.preschool_spots || 0) + (v.school_age_spots || 0),
      0,
    )

  metrics.vacancies = {
    totalActive: active.length,
    totalSpots: sumSpots(active),
    byAge: {
      infant: active.reduce((s: number, v: any) => s + (v.infant_spots || 0), 0),
      toddler: active.reduce((s: number, v: any) => s + (v.toddler_spots || 0), 0),
      preschool: active.reduce((s: number, v: any) => s + (v.preschool_spots || 0), 0),
      schoolAge: active.reduce((s: number, v: any) => s + (v.school_age_spots || 0), 0),
    },
    waitlistOnly: active.filter((v: any) => v.waitlist_available && sumSpots([v]) === 0).length,
    expiringSoon: expiringSoon.length,
    expired24h: expired24h.length,
    new24h: newVacancies24h.length,
  }

  // Providers in DB but no vacancy row at all (possible stale imports).
  const providerIdsWithVacancy = new Set(vacancies.map((v: any) => v.provider_id))
  metrics.providers.noVacancyEver = providers.filter((p: any) => !providerIdsWithVacancy.has(p.id)).length

  // === INQUIRIES ===
  const { data: allInquiries } = await supabase
    .from('parent_inquiries')
    .select('created_at, parent_email, status')
    .order('created_at', { ascending: false })

  const testPatterns = ['@familychildcaresf.com', 'ryan.tang', 'test', 'demo']
  const isTest = (email?: string | null) =>
    !!email && testPatterns.some((p) => email.toLowerCase().includes(p))
  const inquiries = allInquiries || []
  const realInquiries = inquiries.filter((i: any) => !isTest(i.parent_email))
  const new24h = inquiries.filter((i: any) => {
    const t = new Date(i.created_at).getTime()
    return t >= startDate.getTime() && t <= endDate.getTime()
  })
  const newReal24h = new24h.filter((i: any) => !isTest(i.parent_email))

  metrics.inquiries = {
    totalReal: realInquiries.length,
    totalTest: inquiries.length - realInquiries.length,
    newReal24h: newReal24h.length,
    newTest24h: new24h.length - newReal24h.length,
    replied: inquiries.filter((i: any) => i.status === 'replied').length,
    pending: inquiries.filter((i: any) => i.status === 'pending').length,
  }

  // === TRAFFIC ===
  const { data: viewsData } = await supabase
    .from('page_views')
    .select('event_type, provider_id')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())

  const views = viewsData || []
  metrics.views = {
    pageViews: views.filter((v: any) => v.event_type === 'page_view').length,
    listingViews: views.filter((v: any) => v.event_type === 'listing_view').length,
    contactClicks: views.filter((v: any) => v.event_type === 'contact_click').length,
    uniqueListingsViewed: new Set(
      views.filter((v: any) => v.event_type === 'listing_view' && v.provider_id).map((v: any) => v.provider_id),
    ).size,
  }

  return metrics
}

// Jotform answer keys come in as "q3_license_number" — strip the "qN_" prefix so the template
// can show submitted values regardless of whether Unique Name is set on the form.
function stripQ(payload: Record<string, unknown>): Record<string, unknown> {
  if (!payload || typeof payload !== 'object') return {}
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(payload)) out[k.replace(/^q\d+_/, '')] = v
  return out
}

async function sendDiagnosticReport(apiKey: string, recipient: string, metrics: any, date: Date) {
  const dateStr = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const subject = `FamilyChildCareSF Daily Report — ${date.toLocaleDateString()}`

  const adminQueueTotal = metrics.intake.totalPending
  const queueColor = adminQueueTotal === 0 ? '#16a34a' : adminQueueTotal > 5 ? '#dc2626' : '#f59e0b'
  const queueBg = adminQueueTotal === 0 ? '#f0fdf4' : adminQueueTotal > 5 ? '#fee2e2' : '#fef3c7'
  const queueText = adminQueueTotal === 0 ? '#14532d' : adminQueueTotal > 5 ? '#7f1d1d' : '#78350f'

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;margin:0;padding:20px;">
  <div style="max-width:700px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
    <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:32px;text-align:center;">
      <h1 style="color:white;font-size:24px;margin:0;">Daily Report</h1>
      <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:14px;">FamilyChildCareSF.com</p>
      <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:13px;">${dateStr}</p>
    </div>

    <div style="padding:32px;">
      <!-- ADMIN QUEUE: the one thing you act on -->
      <div style="background:${queueBg};border-left:4px solid ${queueColor};padding:16px;margin-bottom:24px;border-radius:4px;">
        <h2 style="color:${queueText};font-size:18px;margin:0 0 12px;">Admin Queue — ${adminQueueTotal} open</h2>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:6px 8px;color:${queueText};font-size:14px;">Suspicious duplicate intakes (awaiting on-file provider)</td>
            <td style="padding:6px 8px;color:${queueText};font-size:15px;font-weight:600;text-align:right;">${metrics.intake.pendingSuspicious}</td>
          </tr>
          <tr>
            <td style="padding:6px 8px;color:${queueText};font-size:14px;">Validation failures</td>
            <td style="padding:6px 8px;color:${queueText};font-size:15px;font-weight:600;text-align:right;">${metrics.intake.pendingValidation}</td>
          </tr>
          <tr>
            <td style="padding:6px 8px;color:${queueText};font-size:14px;">Insert errors</td>
            <td style="padding:6px 8px;color:${queueText};font-size:15px;font-weight:600;text-align:right;">${metrics.intake.pendingInsertError}</td>
          </tr>
          <tr>
            <td style="padding:6px 8px;color:${queueText};font-size:14px;">Providers awaiting approval (non-SF / non-ELFA)</td>
            <td style="padding:6px 8px;color:${queueText};font-size:15px;font-weight:600;text-align:right;">${metrics.providers.pendingApproval}</td>
          </tr>
        </table>
        ${metrics.intake.suspiciousSample.length > 0 ? `
        <div style="margin-top:12px;padding-top:12px;border-top:1px solid rgba(0,0,0,0.08);">
          <p style="color:${queueText};font-size:13px;margin:0 0 8px;font-weight:600;">Suspicious duplicates in flight:</p>
          ${metrics.intake.suspiciousSample.map((s: any) => `
            <div style="background:white;padding:8px;margin-bottom:6px;border-radius:4px;font-size:12px;color:#334155;">
              License <strong>${s.license}</strong> — submitted as "${s.submittedBusiness}" by ${s.submittedEmail}<br>
              <span style="color:#64748b;">${s.daysAgo}d ago${s.expiresInDays !== null ? ` · token expires in ${s.expiresInDays}d` : ''}</span>
            </div>
          `).join('')}
        </div>
        ` : ''}
        ${metrics.intake.validationSample.length > 0 ? `
        <div style="margin-top:8px;">
          <p style="color:${queueText};font-size:13px;margin:0 0 6px;font-weight:600;">Recent validation failures:</p>
          ${metrics.intake.validationSample.map((s: any) => `
            <div style="background:white;padding:6px 8px;margin-bottom:4px;border-radius:4px;font-size:12px;color:#334155;">
              ${s.reason} <span style="color:#64748b;">· ${s.daysAgo}d ago</span>
            </div>
          `).join('')}
        </div>
        ` : ''}
      </div>

      <!-- INTAKE ACTIVITY (last 24h + totals) -->
      <div style="background:#f0f9ff;border-left:4px solid #0284c7;padding:16px;margin-bottom:24px;border-radius:4px;">
        <h2 style="color:#0c4a6e;font-size:18px;margin:0 0 16px;">Provider Intake</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:12px;">
          <tr style="background:#e0f2fe;">
            <td style="padding:8px;font-weight:600;color:#0c4a6e;font-size:14px;">Source</td>
            <td style="padding:8px;font-weight:600;color:#0c4a6e;font-size:14px;text-align:center;">Total</td>
            <td style="padding:8px;font-weight:600;color:#0c4a6e;font-size:14px;text-align:center;">Last 24h</td>
          </tr>
          <tr>
            <td style="padding:8px;color:#475569;font-size:14px;">Jotform drop form</td>
            <td style="padding:8px;color:#0f172a;font-size:15px;font-weight:600;text-align:center;">${metrics.providers.totalJotform}</td>
            <td style="padding:8px;color:#0f172a;font-size:15px;text-align:center;">${metrics.providers.new24hJotform > 0 ? '+' + metrics.providers.new24hJotform : '—'}</td>
          </tr>
          <tr style="background:#f8fafc;">
            <td style="padding:8px;color:#475569;font-size:14px;">Self-signup (SSO)</td>
            <td style="padding:8px;color:#0f172a;font-size:15px;font-weight:600;text-align:center;">${metrics.providers.totalSelfSignup}</td>
            <td style="padding:8px;color:#0f172a;font-size:15px;text-align:center;">${metrics.providers.new24hSelfSignup > 0 ? '+' + metrics.providers.new24hSelfSignup : '—'}</td>
          </tr>
          <tr>
            <td style="padding:8px;color:#475569;font-size:14px;">Admin-added</td>
            <td style="padding:8px;color:#0f172a;font-size:15px;font-weight:600;text-align:center;">${metrics.providers.totalAdmin}</td>
            <td style="padding:8px;color:#0f172a;font-size:15px;text-align:center;">${metrics.providers.new24hAdmin > 0 ? '+' + metrics.providers.new24hAdmin : '—'}</td>
          </tr>
          <tr style="background:#f8fafc;">
            <td style="padding:8px;color:#0c4a6e;font-size:14px;font-weight:600;">All providers</td>
            <td style="padding:8px;color:#0f172a;font-size:15px;font-weight:700;text-align:center;">${metrics.providers.total}</td>
            <td style="padding:8px;color:#0f172a;font-size:15px;font-weight:600;text-align:center;">${metrics.providers.new24h > 0 ? '+' + metrics.providers.new24h : '—'}</td>
          </tr>
        </table>
        <p style="color:#334155;font-size:13px;margin:0;">
          ${metrics.intake.autoUpdates24h} returning-provider auto-update${metrics.intake.autoUpdates24h === 1 ? '' : 's'} applied in last 24h
          · ${metrics.intake.intakeEvents24h} total Jotform submission${metrics.intake.intakeEvents24h === 1 ? '' : 's'} logged
        </p>
      </div>

      <!-- VACANCY HEALTH -->
      <div style="background:#faf5ff;border-left:4px solid #9333ea;padding:16px;margin-bottom:24px;border-radius:4px;">
        <h2 style="color:#581c87;font-size:18px;margin:0 0 12px;">Vacancy Health</h2>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
          <div>
            <p style="color:#64748b;font-size:13px;margin:0;">Active listings</p>
            <p style="color:#0f172a;font-size:22px;font-weight:bold;margin:4px 0;">${metrics.vacancies.totalActive}</p>
          </div>
          <div>
            <p style="color:#64748b;font-size:13px;margin:0;">Open spots</p>
            <p style="color:#0f172a;font-size:22px;font-weight:bold;margin:4px 0;">${metrics.vacancies.totalSpots}</p>
          </div>
          <div>
            <p style="color:#64748b;font-size:13px;margin:0;">Waitlist-only</p>
            <p style="color:#0f172a;font-size:22px;font-weight:bold;margin:4px 0;">${metrics.vacancies.waitlistOnly}</p>
          </div>
        </div>
        <div style="margin-top:12px;padding-top:12px;border-top:1px solid #e9d5ff;font-size:13px;color:#64748b;">
          Infant ${metrics.vacancies.byAge.infant} · Toddler ${metrics.vacancies.byAge.toddler} · Preschool ${metrics.vacancies.byAge.preschool} · School ${metrics.vacancies.byAge.schoolAge}
        </div>
        <div style="margin-top:12px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;font-size:13px;">
          <div>
            <span style="color:#64748b;">New in 24h:</span>
            <strong style="color:#0f172a;"> ${metrics.vacancies.new24h}</strong>
          </div>
          <div>
            <span style="color:#64748b;">Expiring ≤7d:</span>
            <strong style="color:${metrics.vacancies.expiringSoon > 5 ? '#dc2626' : '#0f172a'};"> ${metrics.vacancies.expiringSoon}</strong>
          </div>
          <div>
            <span style="color:#64748b;">Aged out 24h:</span>
            <strong style="color:#0f172a;"> ${metrics.vacancies.expired24h}</strong>
          </div>
        </div>
      </div>

      <!-- PARENT INQUIRIES -->
      <div style="background:#f0fdf4;border-left:4px solid #16a34a;padding:16px;margin-bottom:24px;border-radius:4px;">
        <h2 style="color:#14532d;font-size:18px;margin:0 0 16px;">Parent Inquiries</h2>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          <div>
            <p style="color:#64748b;font-size:13px;margin:0;">Real inquiries (total)</p>
            <p style="color:#0f172a;font-size:22px;font-weight:bold;margin:4px 0;">${metrics.inquiries.totalReal}</p>
            <p style="color:#16a34a;font-size:12px;margin:0;">${metrics.inquiries.newReal24h > 0 ? '+' + metrics.inquiries.newReal24h + ' today' : 'None today'}</p>
          </div>
          <div>
            <p style="color:#64748b;font-size:13px;margin:0;">Test inquiries</p>
            <p style="color:#94a3b8;font-size:22px;font-weight:bold;margin:4px 0;">${metrics.inquiries.totalTest}</p>
            <p style="color:#64748b;font-size:12px;margin:0;">${metrics.inquiries.newTest24h > 0 ? '+' + metrics.inquiries.newTest24h + ' today' : 'None today'}</p>
          </div>
        </div>
        <div style="margin-top:12px;padding-top:12px;border-top:1px solid #dcfce7;font-size:13px;color:#64748b;">
          ${metrics.inquiries.replied} replied · ${metrics.inquiries.pending} pending
        </div>
      </div>

      <!-- SITE TRAFFIC -->
      <div style="background:#f0fdfa;border-left:4px solid #0d9488;padding:16px;margin-bottom:24px;border-radius:4px;">
        <h2 style="color:#134e4a;font-size:18px;margin:0 0 16px;">Site Traffic (Last 24h)</h2>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:12px;">
          <div>
            <p style="color:#64748b;font-size:13px;margin:0;">Page views</p>
            <p style="color:#0f172a;font-size:20px;font-weight:bold;margin:4px 0;">${metrics.views.pageViews}</p>
          </div>
          <div>
            <p style="color:#64748b;font-size:13px;margin:0;">Listing views</p>
            <p style="color:#0f172a;font-size:20px;font-weight:bold;margin:4px 0;">${metrics.views.listingViews}</p>
          </div>
          <div>
            <p style="color:#64748b;font-size:13px;margin:0;">Contact clicks</p>
            <p style="color:#0f172a;font-size:20px;font-weight:bold;margin:4px 0;">${metrics.views.contactClicks}</p>
          </div>
          <div>
            <p style="color:#64748b;font-size:13px;margin:0;">Unique listings</p>
            <p style="color:#0f172a;font-size:20px;font-weight:bold;margin:4px 0;">${metrics.views.uniqueListingsViewed}</p>
          </div>
        </div>
      </div>

      <!-- RECOMMENDED ACTIONS -->
      ${buildActionsBlock(metrics)}

      <div style="margin-top:32px;padding-top:24px;border-top:1px solid #e2e8f0;text-align:center;">
        <a href="https://familychildcaresf.com" style="display:inline-block;background:#7c3aed;color:white;text-decoration:none;padding:10px 24px;border-radius:6px;font-size:14px;font-weight:600;">
          View Site
        </a>
      </div>
    </div>
  </div>
</body>
</html>`

  const text = `
FamilyChildCareSF Daily Report — ${dateStr}

ADMIN QUEUE (${adminQueueTotal} open)
- Suspicious duplicate intakes: ${metrics.intake.pendingSuspicious}
- Validation failures: ${metrics.intake.pendingValidation}
- Insert errors: ${metrics.intake.pendingInsertError}
- Providers awaiting approval: ${metrics.providers.pendingApproval}

PROVIDER INTAKE
- Jotform drop form: ${metrics.providers.totalJotform} total (${metrics.providers.new24hJotform} new in 24h)
- Self-signup (SSO): ${metrics.providers.totalSelfSignup} total (${metrics.providers.new24hSelfSignup} new in 24h)
- Admin-added: ${metrics.providers.totalAdmin} total (${metrics.providers.new24hAdmin} new in 24h)
- Returning-provider auto-updates (24h): ${metrics.intake.autoUpdates24h}
- Total Jotform submissions logged (24h): ${metrics.intake.intakeEvents24h}

VACANCY HEALTH
- Active listings: ${metrics.vacancies.totalActive} (${metrics.vacancies.totalSpots} open spots, ${metrics.vacancies.waitlistOnly} waitlist-only)
- New in 24h: ${metrics.vacancies.new24h}
- Expiring in next 7 days: ${metrics.vacancies.expiringSoon}
- Aged out in last 24h: ${metrics.vacancies.expired24h}

PARENT INQUIRIES
- Real inquiries: ${metrics.inquiries.totalReal} total (${metrics.inquiries.newReal24h} today)
- Test inquiries: ${metrics.inquiries.totalTest} total
- ${metrics.inquiries.replied} replied, ${metrics.inquiries.pending} pending

SITE TRAFFIC (Last 24h)
- Page views: ${metrics.views.pageViews}
- Listing views: ${metrics.views.listingViews}
- Contact clicks: ${metrics.views.contactClicks}
- Unique listings viewed: ${metrics.views.uniqueListingsViewed}

familychildcaresf.com
`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: 'SF FCC Registry <noreply@notifications.familychildcaresf.com>',
      to: [recipient],
      subject,
      html,
      text,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Resend API error (${res.status}): ${body}`)
  }
}

function buildActionsBlock(metrics: any): string {
  const items: string[] = []

  if (metrics.intake.pendingSuspicious > 0) {
    items.push(`<strong>${metrics.intake.pendingSuspicious} suspicious duplicate${metrics.intake.pendingSuspicious === 1 ? '' : 's'}:</strong> on-file providers have unread confirm/deny emails. Chase any about to expire.`)
  }
  if (metrics.intake.pendingValidation > 0) {
    items.push(`<strong>${metrics.intake.pendingValidation} validation failure${metrics.intake.pendingValidation === 1 ? '' : 's'}:</strong> review Jotform required-field setup — providers are getting rejected before reaching the DB.`)
  }
  if (metrics.providers.pendingApproval > 0) {
    items.push(`<strong>${metrics.providers.pendingApproval} provider${metrics.providers.pendingApproval === 1 ? '' : 's'} awaiting approval:</strong> non-ELFA + non-SF zip. Decide include/exclude.`)
  }
  if (metrics.vacancies.expiringSoon > 5) {
    items.push(`<strong>${metrics.vacancies.expiringSoon} listings expire within 7 days:</strong> make sure the reminder function is running.`)
  }
  if (metrics.providers.noVacancyEver > 0 && metrics.providers.noVacancyEver >= Math.max(3, metrics.providers.total * 0.1)) {
    items.push(`<strong>${metrics.providers.noVacancyEver} providers have no vacancy row at all:</strong> likely legacy/admin imports — consider backfilling or pruning.`)
  }
  if (metrics.inquiries.totalReal === 0) {
    items.push(`<strong>No real parent inquiries yet:</strong> parent-side awareness is the gap.`)
  }
  if (metrics.providers.new24h === 0 && metrics.intake.intakeEvents24h === 0) {
    items.push(`<strong>No intake activity in 24h:</strong> verify Jotform webhook is hitting <code>jotform-intake</code>.`)
  }

  if (items.length === 0) {
    return `
      <div style="background:#f0fdf4;border-left:4px solid #16a34a;padding:16px;border-radius:4px;">
        <h2 style="color:#14532d;font-size:18px;margin:0 0 8px;">Recommended Actions</h2>
        <p style="color:#166534;font-size:14px;margin:0;">Nothing urgent — queues are clear and activity looks healthy.</p>
      </div>`
  }

  return `
      <div style="background:#fee2e2;border-left:4px solid #dc2626;padding:16px;border-radius:4px;">
        <h2 style="color:#7f1d1d;font-size:18px;margin:0 0 12px;">Recommended Actions</h2>
        <ul style="color:#991b1b;font-size:14px;line-height:1.6;margin:0;padding-left:20px;">
          ${items.map((i) => `<li>${i}</li>`).join('')}
        </ul>
      </div>`
}
