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

    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured')
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const confirmBaseUrl = `${supabaseUrl}/functions/v1/confirm-vacancy`
    const now = new Date()
    const results = { sent_30: 0, sent_40: 0, errors: [] as string[] }

    // Query vacancies needing 30-day reminder (15 days before expiry, reminder not yet sent)
    const fifteenDaysOut = new Date(now)
    fifteenDaysOut.setDate(fifteenDaysOut.getDate() + 15)

    const { data: reminder30Vacancies, error: err30 } = await supabase
      .from('vacancies')
      .select(`
        id, provider_id, expires_at, confirmation_token,
        infant_spots, toddler_spots, preschool_spots, school_age_spots,
        waitlist_available,
        providers!inner (business_name, contact_email, owner_name)
      `)
      .is('reminder_30_sent_at', null)
      .lte('expires_at', fifteenDaysOut.toISOString())
      .gt('expires_at', now.toISOString())

    if (err30) {
      console.error('Error querying 30-day reminders:', err30)
      results.errors.push(`Query error (30-day): ${err30.message}`)
    }

    // Query vacancies needing 40-day reminder (5 days before expiry, reminder not yet sent)
    const fiveDaysOut = new Date(now)
    fiveDaysOut.setDate(fiveDaysOut.getDate() + 5)

    const { data: reminder40Vacancies, error: err40 } = await supabase
      .from('vacancies')
      .select(`
        id, provider_id, expires_at, confirmation_token,
        infant_spots, toddler_spots, preschool_spots, school_age_spots,
        waitlist_available,
        providers!inner (business_name, contact_email, owner_name)
      `)
      .is('reminder_40_sent_at', null)
      .lte('expires_at', fiveDaysOut.toISOString())
      .gt('expires_at', now.toISOString())

    if (err40) {
      console.error('Error querying 40-day reminders:', err40)
      results.errors.push(`Query error (40-day): ${err40.message}`)
    }

    // Process 30-day reminders (friendly)
    for (const vacancy of (reminder30Vacancies || [])) {
      try {
        const provider = Array.isArray(vacancy.providers) ? vacancy.providers[0] : vacancy.providers
        if (!provider?.contact_email) continue

        const daysLeft = Math.ceil((new Date(vacancy.expires_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        const token = await ensureToken(supabase, vacancy)
        const confirmUrl = `${confirmBaseUrl}?token=${token}`

        await sendReminderEmail(resendApiKey, {
          to: provider.contact_email,
          businessName: provider.business_name,
          ownerName: provider.owner_name,
          daysLeft,
          confirmUrl,
          isUrgent: false,
        })

        await supabase
          .from('vacancies')
          .update({ reminder_30_sent_at: now.toISOString() })
          .eq('id', vacancy.id)

        results.sent_30++
      } catch (err) {
        const msg = `Failed 30-day reminder for vacancy ${vacancy.id}: ${err instanceof Error ? err.message : err}`
        console.error(msg)
        results.errors.push(msg)
      }
    }

    // Process 40-day reminders (urgent)
    for (const vacancy of (reminder40Vacancies || [])) {
      try {
        const provider = Array.isArray(vacancy.providers) ? vacancy.providers[0] : vacancy.providers
        if (!provider?.contact_email) continue

        const daysLeft = Math.ceil((new Date(vacancy.expires_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        const token = await ensureToken(supabase, vacancy)
        const confirmUrl = `${confirmBaseUrl}?token=${token}`

        await sendReminderEmail(resendApiKey, {
          to: provider.contact_email,
          businessName: provider.business_name,
          ownerName: provider.owner_name,
          daysLeft,
          confirmUrl,
          isUrgent: true,
        })

        await supabase
          .from('vacancies')
          .update({ reminder_40_sent_at: now.toISOString() })
          .eq('id', vacancy.id)

        results.sent_40++
      } catch (err) {
        const msg = `Failed 40-day reminder for vacancy ${vacancy.id}: ${err instanceof Error ? err.message : err}`
        console.error(msg)
        results.errors.push(msg)
      }
    }

    console.log('Reminder results:', results)
    return new Response(
      JSON.stringify({ success: true, ...results }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Unexpected error:', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Ensure a confirmation token exists for this vacancy (reuse existing or generate new)
async function ensureToken(
  supabase: ReturnType<typeof createClient>,
  vacancy: { id: string; confirmation_token: string | null }
): Promise<string> {
  if (vacancy.confirmation_token) {
    return vacancy.confirmation_token
  }

  const { data, error } = await supabase.rpc('generate_confirmation_token', {
    p_vacancy_id: vacancy.id,
  })

  if (error) throw new Error(`Token generation failed: ${error.message}`)
  return data as string
}

// Send a reminder email via Resend
async function sendReminderEmail(
  apiKey: string,
  opts: {
    to: string
    businessName: string
    ownerName: string
    daysLeft: number
    confirmUrl: string
    isUrgent: boolean
  }
) {
  const subject = opts.isUrgent
    ? `Urgent: Your listing will be hidden in ${opts.daysLeft} day${opts.daysLeft === 1 ? '' : 's'}`
    : `Reminder: Your listing expires in ${opts.daysLeft} days — is your availability still accurate?`

  const urgentBanner = opts.isUrgent
    ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px 16px;margin-bottom:20px;color:#991b1b;font-weight:600;">
        Your listing will be hidden from families in ${opts.daysLeft} day${opts.daysLeft === 1 ? '' : 's'} unless you confirm.
       </div>`
    : ''

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;margin:0;padding:20px;">
  <div style="max-width:560px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">
    <div style="background:#7c3aed;padding:24px 32px;">
      <h1 style="color:white;font-size:20px;margin:0;">SF Family Child Care Registry</h1>
    </div>
    <div style="padding:32px;">
      ${urgentBanner}
      <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 16px;">
        Hi ${opts.ownerName || 'there'},
      </p>
      <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 16px;">
        Your listing for <strong>${opts.businessName}</strong> on the SF Family Child Care Registry
        ${opts.isUrgent ? `will be <strong>hidden from families in ${opts.daysLeft} day${opts.daysLeft === 1 ? '' : 's'}</strong>` : `expires in <strong>${opts.daysLeft} days</strong>`}.
      </p>
      <p style="color:#374151;font-size:16px;line-height:1.6;margin:0 0 24px;">
        If your availability information is still accurate, just click the button below to keep your listing active:
      </p>
      <div style="text-align:center;margin:0 0 24px;">
        <a href="${opts.confirmUrl}" style="display:inline-block;background:#7c3aed;color:white;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:600;">
          Yes, Still Accurate
        </a>
      </div>
      <p style="color:#6b7280;font-size:14px;line-height:1.5;margin:0 0 8px;">
        If your availability has changed, please <a href="https://familychildcaresf.com" style="color:#7c3aed;">log in to your dashboard</a> to update it.
      </p>
      <p style="color:#9ca3af;font-size:12px;line-height:1.5;margin:24px 0 0;padding-top:16px;border-top:1px solid #e5e7eb;">
        You're receiving this because you have an active listing on the SF Family Child Care Registry.
        This is an automated reminder to help keep the registry accurate for families.
      </p>
    </div>
  </div>
</body>
</html>`

  const text = opts.isUrgent
    ? `URGENT: Your listing for ${opts.businessName} will be hidden in ${opts.daysLeft} day(s).\n\nConfirm your listing is still accurate: ${opts.confirmUrl}\n\nOr log in to update: https://familychildcaresf.com`
    : `Hi ${opts.ownerName || 'there'},\n\nYour listing for ${opts.businessName} expires in ${opts.daysLeft} days.\n\nIf your availability is still accurate, confirm here: ${opts.confirmUrl}\n\nOr log in to update: https://familychildcaresf.com`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: 'SF FCC Registry <noreply@notifications.familychildcaresf.com>',
      to: [opts.to],
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
