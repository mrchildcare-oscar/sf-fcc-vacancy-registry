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

    // Get detailed metrics for diagnosis
    const metrics = await getDetailedMetrics(supabase, yesterday, now)
    
    // Send the report email
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
  const metrics: any = {
    providers: {},
    inquiries: {},
    funnel: {},
  }

  // === PROVIDER FUNNEL ANALYSIS ===
  
  // Get all auth users (SSO signups)
  const { data: authUsers, count: totalAuthUsers } = await supabase.auth.admin.listUsers()
  
  // Total providers with profiles (completed basic onboarding)
  const { data: allProviders, count: totalProviders } = await supabase
    .from('providers')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  // Providers with complete data (all required fields filled)
  const completeProviders = allProviders?.filter(p => 
    p.business_name && 
    p.license_number && 
    p.owner_name && 
    p.zip_code && 
    p.contact_email &&
    p.licensed_capacity > 0
  ) || []

  // Providers with active vacancies
  const { data: activeVacancies } = await supabase
    .from('vacancies')
    .select('provider_id')
    .gt('expires_at', endDate.toISOString())

  const providersWithVacancies = new Set(activeVacancies?.map(v => v.provider_id) || [])

  // New signups in last 24 hours
  const newAuthUsers = authUsers?.filter((u: any) => {
    const createdAt = new Date(u.created_at)
    return createdAt >= startDate && createdAt <= endDate
  }) || []

  const { data: newProviders } = await supabase
    .from('providers')
    .select('*')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())

  metrics.providers = {
    // Totals
    totalSSOSignups: authUsers?.length || 0,
    totalProvidersStarted: totalProviders || 0,
    totalProvidersComplete: completeProviders.length,
    totalWithVacancies: providersWithVacancies.size,
    
    // Last 24 hours
    newSSOSignups: newAuthUsers.length,
    newProvidersStarted: newProviders?.length || 0,
    newVacanciesPosted: 0, // will calculate below
    
    // Conversion rates
    ssoToProfileRate: totalProviders && authUsers ? ((totalProviders / authUsers.length) * 100).toFixed(1) : '0',
    profileToCompleteRate: totalProviders ? ((completeProviders.length / totalProviders) * 100).toFixed(1) : '0',
    completeToVacancyRate: completeProviders.length ? ((providersWithVacancies.size / completeProviders.length) * 100).toFixed(1) : '0',
  }

  // New vacancies in last 24 hours
  const { count: newVacanciesCount } = await supabase
    .from('vacancies')
    .select('*', { count: 'exact', head: true })
    .gte('reported_at', startDate.toISOString())
    .lte('reported_at', endDate.toISOString())

  metrics.providers.newVacanciesPosted = newVacanciesCount || 0

  // === INQUIRY ANALYSIS ===
  
  // All inquiries
  const { data: allInquiries } = await supabase
    .from('parent_inquiries')
    .select('*')
    .order('created_at', { ascending: false })

  // Inquiries in last 24 hours
  const newInquiries = allInquiries?.filter(i => {
    const createdAt = new Date(i.created_at)
    return createdAt >= startDate && createdAt <= endDate
  }) || []

  // Identify likely test inquiries (from staff emails or test patterns)
  const testEmailPatterns = ['@familychildcaresf.com', 'ryan.tang', 'test', 'demo']
  const realInquiries = allInquiries?.filter(i => 
    !testEmailPatterns.some(pattern => 
      i.parent_email?.toLowerCase().includes(pattern)
    )
  ) || []

  const newRealInquiries = newInquiries.filter(i => 
    !testEmailPatterns.some(pattern => 
      i.parent_email?.toLowerCase().includes(pattern)
    )
  )

  metrics.inquiries = {
    // Totals
    totalInquiries: allInquiries?.length || 0,
    totalRealInquiries: realInquiries.length,
    totalTestInquiries: (allInquiries?.length || 0) - realInquiries.length,
    
    // Last 24 hours
    newInquiries: newInquiries.length,
    newRealInquiries: newRealInquiries.length,
    newTestInquiries: newInquiries.length - newRealInquiries.length,
    
    // Response rates
    repliedInquiries: allInquiries?.filter(i => i.status === 'replied').length || 0,
    pendingInquiries: allInquiries?.filter(i => i.status === 'pending').length || 0,
  }

  // === BARRIER DETECTION ===
  
  // Find providers stuck at each stage
  const stuckAtSSO = authUsers?.filter((u: any) => 
    !allProviders?.find(p => p.id === u.id)
  ) || []

  const stuckAtProfile = allProviders?.filter(p => 
    !completeProviders.find(cp => cp.id === p.id)
  ) || []

  const stuckAtVacancy = completeProviders.filter(p => 
    !providersWithVacancies.has(p.id)
  )

  metrics.funnel = {
    stuckAtSSO: stuckAtSSO.length,
    stuckAtProfile: stuckAtProfile.length,
    stuckAtVacancy: stuckAtVacancy.length,
    
    // Recent dropoffs (last 7 days)
    recentSSODropoffs: stuckAtSSO.filter((u: any) => {
      const createdAt = new Date(u.created_at)
      const daysAgo = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
      return daysAgo <= 7
    }).length,
    
    // Sample of incomplete profiles for diagnosis
    incompleteProfiles: stuckAtProfile.slice(0, 3).map(p => ({
      email: p.email,
      createdDaysAgo: Math.floor((now.getTime() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24)),
      missingFields: [
        !p.business_name && 'business_name',
        !p.license_number && 'license_number',
        !p.owner_name && 'owner_name',
        !p.zip_code && 'zip_code',
        !p.contact_email && 'contact_email',
        !p.licensed_capacity && 'licensed_capacity',
      ].filter(Boolean),
    })),
  }

  // === VACANCY DETAILS ===
  const { data: vacancyData } = await supabase
    .from('vacancies')
    .select('*')
    .gt('expires_at', endDate.toISOString())

  const totalSpots = vacancyData?.reduce((sum: number, v: any) => 
    sum + (v.infant_spots || 0) + (v.toddler_spots || 0) + 
    (v.preschool_spots || 0) + (v.school_age_spots || 0), 0) || 0

  metrics.vacancies = {
    totalActive: vacancyData?.length || 0,
    totalSpots,
    byAge: {
      infant: vacancyData?.reduce((sum: number, v: any) => sum + (v.infant_spots || 0), 0) || 0,
      toddler: vacancyData?.reduce((sum: number, v: any) => sum + (v.toddler_spots || 0), 0) || 0,
      preschool: vacancyData?.reduce((sum: number, v: any) => sum + (v.preschool_spots || 0), 0) || 0,
      schoolAge: vacancyData?.reduce((sum: number, v: any) => sum + (v.school_age_spots || 0), 0) || 0,
    },
  }

  return metrics
}

async function sendDiagnosticReport(apiKey: string, recipient: string, metrics: any, date: Date) {
  const dateStr = date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })

  const subject = `FamilyChildCareSF Diagnostic Report - ${date.toLocaleDateString()}`

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;margin:0;padding:20px;">
  <div style="max-width:700px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
    <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:32px;text-align:center;">
      <h1 style="color:white;font-size:24px;margin:0;">🔍 Daily Diagnostic Report</h1>
      <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;font-size:14px;">FamilyChildCareSF.com</p>
      <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:13px;">${dateStr}</p>
    </div>
    
    <div style="padding:32px;">
      <!-- PROVIDER FUNNEL -->
      <div style="background:#f0f9ff;border-left:4px solid #0284c7;padding:16px;margin-bottom:24px;border-radius:4px;">
        <h2 style="color:#0c4a6e;font-size:18px;margin:0 0 16px;">📊 Provider Onboarding Funnel</h2>
        
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
          <tr style="background:#e0f2fe;">
            <td style="padding:8px;font-weight:600;color:#0c4a6e;font-size:14px;">Stage</td>
            <td style="padding:8px;font-weight:600;color:#0c4a6e;font-size:14px;text-align:center;">Total</td>
            <td style="padding:8px;font-weight:600;color:#0c4a6e;font-size:14px;text-align:center;">Last 24h</td>
            <td style="padding:8px;font-weight:600;color:#0c4a6e;font-size:14px;text-align:center;">Conversion</td>
          </tr>
          <tr>
            <td style="padding:8px;color:#475569;font-size:14px;">1. SSO Signups</td>
            <td style="padding:8px;color:#0f172a;font-size:15px;font-weight:600;text-align:center;">${metrics.providers.totalSSOSignups}</td>
            <td style="padding:8px;color:#0f172a;font-size:15px;text-align:center;">${metrics.providers.newSSOSignups > 0 ? '+' + metrics.providers.newSSOSignups : '-'}</td>
            <td style="padding:8px;color:#64748b;font-size:14px;text-align:center;">—</td>
          </tr>
          <tr style="background:#f8fafc;">
            <td style="padding:8px;color:#475569;font-size:14px;">2. Profile Started</td>
            <td style="padding:8px;color:#0f172a;font-size:15px;font-weight:600;text-align:center;">${metrics.providers.totalProvidersStarted}</td>
            <td style="padding:8px;color:#0f172a;font-size:15px;text-align:center;">${metrics.providers.newProvidersStarted > 0 ? '+' + metrics.providers.newProvidersStarted : '-'}</td>
            <td style="padding:8px;color:#64748b;font-size:14px;text-align:center;">${metrics.providers.ssoToProfileRate}%</td>
          </tr>
          <tr>
            <td style="padding:8px;color:#475569;font-size:14px;">3. Profile Complete</td>
            <td style="padding:8px;color:#0f172a;font-size:15px;font-weight:600;text-align:center;">${metrics.providers.totalProvidersComplete}</td>
            <td style="padding:8px;color:#0f172a;font-size:15px;text-align:center;">—</td>
            <td style="padding:8px;color:#64748b;font-size:14px;text-align:center;">${metrics.providers.profileToCompleteRate}%</td>
          </tr>
          <tr style="background:#f8fafc;">
            <td style="padding:8px;color:#475569;font-size:14px;">4. Vacancy Posted</td>
            <td style="padding:8px;color:#0f172a;font-size:15px;font-weight:600;text-align:center;">${metrics.providers.totalWithVacancies}</td>
            <td style="padding:8px;color:#0f172a;font-size:15px;text-align:center;">${metrics.providers.newVacanciesPosted > 0 ? '+' + metrics.providers.newVacanciesPosted : '-'}</td>
            <td style="padding:8px;color:#64748b;font-size:14px;text-align:center;">${metrics.providers.completeToVacancyRate}%</td>
          </tr>
        </table>
        
        <div style="background:#fef3c7;padding:12px;border-radius:6px;margin-top:12px;">
          <p style="color:#92400e;font-size:13px;margin:0;font-weight:600;">⚠️ Drop-off Points:</p>
          <ul style="color:#78350f;font-size:13px;margin:4px 0 0;padding-left:20px;">
            <li>${metrics.funnel.stuckAtSSO} users signed up but never started profile</li>
            <li>${metrics.funnel.stuckAtProfile} providers with incomplete profiles</li>
            <li>${metrics.funnel.stuckAtVacancy} complete profiles without vacancy posts</li>
          </ul>
        </div>
      </div>

      <!-- INQUIRY ANALYSIS -->
      <div style="background:#f0fdf4;border-left:4px solid #16a34a;padding:16px;margin-bottom:24px;border-radius:4px;">
        <h2 style="color:#14532d;font-size:18px;margin:0 0 16px;">💬 Parent Inquiry Analysis</h2>
        
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:12px;">
          <div>
            <p style="color:#64748b;font-size:13px;margin:0;">Real Inquiries (Total)</p>
            <p style="color:#0f172a;font-size:20px;font-weight:bold;margin:4px 0;">${metrics.inquiries.totalRealInquiries}</p>
            <p style="color:#16a34a;font-size:12px;margin:0;">${metrics.inquiries.newRealInquiries > 0 ? '+' + metrics.inquiries.newRealInquiries + ' today' : 'None today'}</p>
          </div>
          <div>
            <p style="color:#64748b;font-size:13px;margin:0;">Test Inquiries</p>
            <p style="color:#94a3b8;font-size:20px;font-weight:bold;margin:4px 0;">${metrics.inquiries.totalTestInquiries}</p>
            <p style="color:#64748b;font-size:12px;margin:0;">${metrics.inquiries.newTestInquiries > 0 ? '+' + metrics.inquiries.newTestInquiries + ' today' : 'None today'}</p>
          </div>
        </div>
        
        <div style="background:${metrics.inquiries.totalRealInquiries === 0 ? '#fef2f2' : '#f0f9ff'};padding:10px;border-radius:4px;">
          <p style="color:${metrics.inquiries.totalRealInquiries === 0 ? '#991b1b' : '#0369a1'};font-size:13px;margin:0;font-weight:600;">
            ${metrics.inquiries.totalRealInquiries === 0 ? '❌ No real parent inquiries yet' : '✅ Parents are finding and using the platform'}
          </p>
        </div>
        
        <div style="margin-top:12px;padding-top:12px;border-top:1px solid #e2e8f0;">
          <p style="color:#64748b;font-size:12px;margin:0;">Response Status: ${metrics.inquiries.repliedInquiries} replied, ${metrics.inquiries.pendingInquiries} pending</p>
        </div>
      </div>

      <!-- INCOMPLETE PROFILES SAMPLE -->
      ${metrics.funnel.incompleteProfiles.length > 0 ? `
      <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:16px;margin-bottom:24px;border-radius:4px;">
        <h2 style="color:#78350f;font-size:18px;margin:0 0 12px;">🔧 Sample Incomplete Profiles</h2>
        <p style="color:#92400e;font-size:13px;margin:0 0 12px;">Recent profiles with missing data:</p>
        ${metrics.funnel.incompleteProfiles.map((p: any) => `
        <div style="background:white;padding:8px;margin-bottom:8px;border-radius:4px;font-size:12px;">
          <strong>${p.email}</strong> (${p.createdDaysAgo} days ago)<br>
          Missing: ${p.missingFields.join(', ')}
        </div>
        `).join('')}
      </div>
      ` : ''}

      <!-- VACANCY SUMMARY -->
      <div style="background:#faf5ff;border-left:4px solid #9333ea;padding:16px;margin-bottom:24px;border-radius:4px;">
        <h2 style="color:#581c87;font-size:18px;margin:0 0 12px;">📍 Active Vacancies</h2>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div>
            <p style="color:#64748b;font-size:13px;margin:0;">Total Listings</p>
            <p style="color:#0f172a;font-size:20px;font-weight:bold;margin:4px 0;">${metrics.vacancies.totalActive}</p>
          </div>
          <div>
            <p style="color:#64748b;font-size:13px;margin:0;">Total Open Spots</p>
            <p style="color:#0f172a;font-size:20px;font-weight:bold;margin:4px 0;">${metrics.vacancies.totalSpots}</p>
          </div>
        </div>
        <div style="margin-top:12px;padding-top:12px;border-top:1px solid #e2e8f0;font-size:13px;color:#64748b;">
          Infant: ${metrics.vacancies.byAge.infant} | Toddler: ${metrics.vacancies.byAge.toddler} | Preschool: ${metrics.vacancies.byAge.preschool} | School: ${metrics.vacancies.byAge.schoolAge}
        </div>
      </div>

      <!-- ACTION ITEMS -->
      <div style="background:#fee2e2;border-left:4px solid #dc2626;padding:16px;border-radius:4px;">
        <h2 style="color:#7f1d1d;font-size:18px;margin:0 0 12px;">📋 Recommended Actions</h2>
        <ul style="color:#991b1b;font-size:14px;line-height:1.6;margin:0;padding-left:20px;">
          ${metrics.funnel.stuckAtSSO > 5 ? '<li><strong>High SSO dropout:</strong> Consider simpler onboarding flow or email reminders</li>' : ''}
          ${metrics.funnel.stuckAtProfile > 10 ? '<li><strong>Many incomplete profiles:</strong> Review required fields, add help text, or allow partial saves</li>' : ''}
          ${metrics.inquiries.totalRealInquiries === 0 ? '<li><strong>No real inquiries:</strong> Need parent outreach, SEO, or marketing to families</li>' : ''}
          ${metrics.providers.totalWithVacancies < 10 ? '<li><strong>Few vacancy posts:</strong> Email providers, simplify vacancy form, or add incentives</li>' : ''}
          ${metrics.funnel.recentSSODropoffs > 3 ? '<li><strong>Recent SSO dropoffs:</strong> Check for login issues or confusing UI after SSO</li>' : ''}
        </ul>
      </div>

      <div style="margin-top:32px;padding-top:24px;border-top:1px solid #e2e8f0;text-align:center;">
        <a href="https://familychildcaresf.com" style="display:inline-block;background:#7c3aed;color:white;text-decoration:none;padding:10px 24px;border-radius:6px;font-size:14px;font-weight:600;">
          View Dashboard
        </a>
      </div>
    </div>
  </div>
</body>
</html>`

  const text = `
FamilyChildCareSF Diagnostic Report - ${dateStr}

PROVIDER FUNNEL
1. SSO Signups: ${metrics.providers.totalSSOSignups} total (${metrics.providers.newSSOSignups} today)
2. Profile Started: ${metrics.providers.totalProvidersStarted} (${metrics.providers.ssoToProfileRate}% conversion)
3. Profile Complete: ${metrics.providers.totalProvidersComplete} (${metrics.providers.profileToCompleteRate}% conversion)
4. Vacancy Posted: ${metrics.providers.totalWithVacancies} (${metrics.providers.completeToVacancyRate}% conversion)

DROP-OFF POINTS
- ${metrics.funnel.stuckAtSSO} users signed up but never started profile
- ${metrics.funnel.stuckAtProfile} providers with incomplete profiles
- ${metrics.funnel.stuckAtVacancy} complete profiles without vacancies

PARENT INQUIRIES
Real Inquiries: ${metrics.inquiries.totalRealInquiries} total (${metrics.inquiries.newRealInquiries} today)
Test Inquiries: ${metrics.inquiries.totalTestInquiries} total
Status: ${metrics.inquiries.totalRealInquiries === 0 ? 'NO REAL INQUIRIES YET' : 'Parents are using the platform'}

ACTIVE VACANCIES
Total Listings: ${metrics.vacancies.totalActive}
Total Spots: ${metrics.vacancies.totalSpots}

View dashboard: https://familychildcaresf.com
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