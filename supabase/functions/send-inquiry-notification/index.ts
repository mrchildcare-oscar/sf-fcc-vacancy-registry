import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Admin email for failure notifications
const ADMIN_EMAIL = 'oscar@familychildcaresf.com'

const AGE_GROUP_LABELS: Record<string, string> = {
  infant: 'Infant (Under 2)',
  toddler: 'Toddler (2-3 years)',
  preschool: 'Preschool (3-5 years)',
  school_age: 'School Age (6+)',
  multiple: 'Multiple age groups',
}

// Check if text contains URLs (server-side validation backup)
function containsUrl(text: string): boolean {
  const urlPattern = /https?:\/\/|www\.|\.com|\.org|\.net|\.io|\.co\//i
  return urlPattern.test(text)
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { inquiry_id } = await req.json()

    if (!inquiry_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing inquiry_id' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Create Supabase client with service role key (bypasses RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendApiKey = Deno.env.get('RESEND_API_KEY')

    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured')
      return new Response(
        JSON.stringify({ success: false, error: 'Email service not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get the inquiry with provider info
    const { data: inquiry, error: inquiryError } = await supabase
      .from('parent_inquiries')
      .select('*')
      .eq('id', inquiry_id)
      .single()

    if (inquiryError || !inquiry) {
      console.error('Failed to fetch inquiry:', inquiryError)
      return new Response(
        JSON.stringify({ success: false, error: 'Inquiry not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Server-side validation: Block messages with URLs
    if (containsUrl(inquiry.message)) {
      console.error('Message contains URL, blocking:', inquiry.id)
      return new Response(
        JSON.stringify({ success: false, error: 'Messages cannot contain links' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get the provider info
    const { data: provider, error: providerError } = await supabase
      .from('providers')
      .select('business_name, contact_email, owner_name, phone, neighborhood, zip_code, website, languages')
      .eq('id', inquiry.provider_id)
      .single()

    if (providerError || !provider) {
      console.error('Failed to fetch provider:', providerError)
      return new Response(
        JSON.stringify({ success: false, error: 'Provider not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Build email content
    const ageGroupLabel = AGE_GROUP_LABELS[inquiry.age_group_interested] || inquiry.age_group_interested
    const phoneInfo = inquiry.parent_phone ? `<p><strong>Phone:</strong> ${inquiry.parent_phone}</p>` : ''

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Inquiry</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 24px;">New Inquiry Received</h1>
    <p style="margin: 5px 0 0 0; opacity: 0.9;">for ${provider.business_name}</p>
  </div>

  <div style="background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; border-top: none;">
    <h2 style="margin-top: 0; color: #1e40af; font-size: 18px;">Parent Information</h2>
    <p><strong>Name:</strong> ${inquiry.parent_name}</p>
    <p><strong>Email:</strong> <a href="mailto:${inquiry.parent_email}" style="color: #2563eb;">${inquiry.parent_email}</a></p>
    ${phoneInfo}
    <p><strong>Interested in:</strong> ${ageGroupLabel}</p>

    <h2 style="color: #1e40af; font-size: 18px;">Message</h2>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #2563eb;">
      <p style="margin: 0; white-space: pre-wrap;">${inquiry.message}</p>
    </div>

    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0; color: #64748b; font-size: 14px;">
        Reply directly to this email to respond to the parent, or view all inquiries in your
        <a href="https://beta.familychildcaresf.com/#vacancies" style="color: #2563eb;">provider dashboard</a>.
      </p>
    </div>
  </div>

  <div style="text-align: center; padding: 15px; color: #94a3b8; font-size: 12px;">
    <p style="margin: 0;">SF Family Child Care Vacancy Registry</p>
    <p style="margin: 5px 0 0 0;">This email was sent because a parent submitted an inquiry through the registry.</p>
  </div>
</body>
</html>
`

    const emailText = `
New Inquiry Received for ${provider.business_name}

Parent Information:
- Name: ${inquiry.parent_name}
- Email: ${inquiry.parent_email}
${inquiry.parent_phone ? `- Phone: ${inquiry.parent_phone}` : ''}
- Interested in: ${ageGroupLabel}

Message:
${inquiry.message}

---
Reply to this email to respond to the parent.
View all inquiries at: https://beta.familychildcaresf.com/#vacancies
`

    // Send email to provider via Resend
    const providerEmailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'SF FCC Registry <noreply@notifications.familychildcaresf.com>',
        to: [provider.contact_email],
        reply_to: inquiry.parent_email,
        subject: `New Inquiry from ${inquiry.parent_name} - ${ageGroupLabel}`,
        html: emailHtml,
        text: emailText,
      }),
    })

    if (!providerEmailResponse.ok) {
      const errorText = await providerEmailResponse.text()
      console.error('Resend API error (provider):', errorText)

      // Notify admin of failure
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'SF FCC Registry <noreply@notifications.familychildcaresf.com>',
          to: [ADMIN_EMAIL],
          subject: `[ALERT] Email delivery failed - ${provider.business_name}`,
          text: `Email failed to send to provider.

Provider: ${provider.business_name}
Provider Email: ${provider.contact_email}
Error: ${errorText}

Parent Info:
- Name: ${inquiry.parent_name}
- Email: ${inquiry.parent_email}
- Phone: ${inquiry.parent_phone || 'N/A'}
- Message: ${inquiry.message}

Please follow up with the provider to verify their email address.`,
        }),
      })

      return new Response(
        JSON.stringify({ success: false, error: 'Failed to send email to provider' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const providerEmailResult = await providerEmailResponse.json()
    console.log('Provider email sent:', providerEmailResult.id)

    // Build provider details for parent email
    const providerLocation = provider.neighborhood || provider.zip_code || ''
    const providerPhone = provider.phone ? `<p><strong>Phone:</strong> <a href="tel:${provider.phone}" style="color: #059669;">${provider.phone}</a></p>` : ''
    const providerWebsite = provider.website ? `<p><strong>Website:</strong> <a href="${provider.website.startsWith('http') ? provider.website : 'https://' + provider.website}" style="color: #059669;">${provider.website}</a></p>` : ''
    const providerLanguages = provider.languages && provider.languages.length > 0
      ? `<p><strong>Languages:</strong> ${Array.isArray(provider.languages) ? provider.languages.join(', ') : provider.languages}</p>`
      : ''

    // Build confirmation email for parent
    const parentEmailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inquiry Confirmation</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 24px;">Inquiry Sent Successfully</h1>
    <p style="margin: 5px 0 0 0; opacity: 0.9;">Your message has been delivered</p>
  </div>

  <div style="background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; border-top: none;">
    <p>Hi ${inquiry.parent_name},</p>
    <p>Your inquiry has been sent to <strong>${provider.business_name}</strong>. They will respond directly to your email at <strong>${inquiry.parent_email}</strong>.</p>

    <h2 style="color: #059669; font-size: 18px;">Provider Information</h2>
    <div style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
      <p style="margin: 0 0 5px 0;"><strong style="font-size: 16px;">${provider.business_name}</strong></p>
      ${providerLocation ? `<p><strong>Location:</strong> ${providerLocation}</p>` : ''}
      <p><strong>Email:</strong> <a href="mailto:${provider.contact_email}" style="color: #059669;">${provider.contact_email}</a></p>
      ${providerPhone}
      ${providerWebsite}
      ${providerLanguages}
    </div>

    <h2 style="color: #059669; font-size: 18px;">Your Inquiry</h2>
    <p><strong>Age Group:</strong> ${ageGroupLabel}</p>
    ${inquiry.parent_phone ? `<p><strong>Your Phone:</strong> ${inquiry.parent_phone}</p>` : ''}

    <h3 style="color: #059669; font-size: 16px;">Your Message:</h3>
    <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #10b981;">
      <p style="margin: 0; white-space: pre-wrap;">${inquiry.message}</p>
    </div>

    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0; color: #64748b; font-size: 14px;">
        Looking for more options? <a href="https://beta.familychildcaresf.com" style="color: #059669;">Browse more providers</a> on the SF Family Child Care Vacancy Registry.
      </p>
    </div>
  </div>

  <div style="text-align: center; padding: 15px; color: #94a3b8; font-size: 12px;">
    <p style="margin: 0;">SF Family Child Care Vacancy Registry</p>
    <p style="margin: 5px 0 0 0;">This is a confirmation of your inquiry submission.</p>
  </div>
</body>
</html>
`

    const providerLanguagesText = provider.languages && provider.languages.length > 0
      ? `- Languages: ${Array.isArray(provider.languages) ? provider.languages.join(', ') : provider.languages}`
      : ''

    const parentEmailText = `
Hi ${inquiry.parent_name},

Your inquiry has been sent to ${provider.business_name}. They will respond directly to your email at ${inquiry.parent_email}.

Provider Information:
- ${provider.business_name}
${providerLocation ? `- Location: ${providerLocation}` : ''}
- Email: ${provider.contact_email}
${provider.phone ? `- Phone: ${provider.phone}` : ''}
${provider.website ? `- Website: ${provider.website}` : ''}
${providerLanguagesText}

Your Inquiry:
- Age Group: ${ageGroupLabel}
${inquiry.parent_phone ? `- Your Phone: ${inquiry.parent_phone}` : ''}

Your Message:
${inquiry.message}

---
Looking for more options? Browse more providers at: https://beta.familychildcaresf.com
`

    // Send confirmation email to parent
    const parentEmailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'SF FCC Registry <noreply@notifications.familychildcaresf.com>',
        to: [inquiry.parent_email],
        reply_to: provider.contact_email,
        subject: `Inquiry Sent to ${provider.business_name} - Confirmation`,
        html: parentEmailHtml,
        text: parentEmailText,
      }),
    })

    if (!parentEmailResponse.ok) {
      const errorText = await parentEmailResponse.text()
      console.error('Resend API error (parent):', errorText)

      // Notify admin of parent email failure
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'SF FCC Registry <noreply@notifications.familychildcaresf.com>',
          to: [ADMIN_EMAIL],
          subject: `[ALERT] Parent confirmation email failed - ${inquiry.parent_name}`,
          text: `Parent confirmation email failed to send.

Provider: ${provider.business_name}
Provider Email: ${provider.contact_email} (sent successfully)

Parent Info:
- Name: ${inquiry.parent_name}
- Email: ${inquiry.parent_email}
- Phone: ${inquiry.parent_phone || 'N/A'}

Error: ${errorText}

Note: The provider DID receive the inquiry notification. Only the parent confirmation failed.`,
        }),
      })

      // Also notify the provider that parent email may be invalid
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'SF FCC Registry <noreply@notifications.familychildcaresf.com>',
          to: [provider.contact_email],
          subject: `Note: Parent email may be incorrect - ${inquiry.parent_name}`,
          text: `Hi ${provider.owner_name || provider.business_name},

We tried to send a confirmation email to ${inquiry.parent_name} at ${inquiry.parent_email}, but it could not be delivered.

The email address may be incorrect or have a typo. If a phone number was provided, we recommend using that to contact the parent instead.

${inquiry.parent_phone ? `Phone: ${inquiry.parent_phone}` : 'No phone number was provided.'}

Best regards,
SF Family Child Care Vacancy Registry`,
        }),
      })
      // Don't fail the whole request, provider email was sent
    } else {
      const parentEmailResult = await parentEmailResponse.json()
      console.log('Parent confirmation email sent:', parentEmailResult.id)
    }

    return new Response(
      JSON.stringify({ success: true, email_id: providerEmailResult.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
