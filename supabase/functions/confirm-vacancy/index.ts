import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  // Only handle GET requests (email link clicks)
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 })
  }

  const url = new URL(req.url)
  const token = url.searchParams.get('token')

  if (!token) {
    return htmlResponse(
      'Missing Token',
      'No confirmation token was provided. Please use the link from your email.',
      false
    )
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data, error } = await supabase.rpc('confirm_vacancy', {
      p_token: token,
    })

    if (error) {
      console.error('RPC error:', error)
      return htmlResponse(
        'Something Went Wrong',
        'We could not process your confirmation. Please try again or log in to update your listing directly.',
        false
      )
    }

    if (!data?.success) {
      const errorType = data?.error
      if (errorType === 'token_expired') {
        return htmlResponse(
          'Link Expired',
          'This confirmation link has expired. Please log in to your dashboard to update your listing, or wait for the next reminder email.',
          false
        )
      }
      return htmlResponse(
        'Invalid Link',
        'This confirmation link is no longer valid. It may have already been used. Please log in to your dashboard to update your listing.',
        false
      )
    }

    const businessName = data.business_name || 'Your business'
    const expiresAt = new Date(data.new_expires_at)
    const formattedDate = expiresAt.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    return htmlResponse(
      'Listing Confirmed!',
      `<strong>${businessName}</strong> is confirmed on the SF Family Child Care Registry.<br><br>
       Your listing will remain visible until <strong>${formattedDate}</strong> (${data.ttl_days} days).<br><br>
       We'll send you a reminder before it expires again.`,
      true
    )
  } catch (err) {
    console.error('Unexpected error:', err)
    return htmlResponse(
      'Something Went Wrong',
      'An unexpected error occurred. Please try again later or log in to update your listing.',
      false
    )
  }
})

function htmlResponse(title: string, message: string, success: boolean): Response {
  const registryUrl = 'https://familychildcaresf.com'
  const color = success ? '#16a34a' : '#dc2626'
  const icon = success ? '&#10003;' : '&#10007;'
  const iconBg = success ? '#dcfce7' : '#fee2e2'

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} - SF FCC Registry</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f3f4f6; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 1rem; }
    .card { background: white; border-radius: 1rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,.1); max-width: 480px; width: 100%; padding: 2.5rem; text-align: center; }
    .icon { width: 64px; height: 64px; border-radius: 50%; background: ${iconBg}; color: ${color}; font-size: 2rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; }
    h1 { font-size: 1.5rem; color: #111827; margin-bottom: 1rem; }
    p { color: #4b5563; line-height: 1.6; margin-bottom: 1.5rem; }
    .btn { display: inline-block; background: #7c3aed; color: white; text-decoration: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; font-weight: 500; transition: background 0.2s; }
    .btn:hover { background: #6d28d9; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${icon}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="${registryUrl}" class="btn">Visit the Registry</a>
  </div>
</body>
</html>`

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
