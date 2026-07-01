import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Failure alerting (reuses the project's Resend setup, same as send-inquiry-notification)
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ADMIN_EMAIL = "oscar@familychildcaresf.com";
const ALERT_FROM = "SF FCC Registry <noreply@notifications.familychildcaresf.com>";

interface IGMedia {
  id: string;
  caption?: string;
  media_type?: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  timestamp: string;
}

async function sendAlert(subject: string, text: string): Promise<{ ok: boolean; detail: string }> {
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not configured; cannot send alert:", subject);
    return { ok: false, detail: "RESEND_API_KEY not configured" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: ALERT_FROM, to: [ADMIN_EMAIL], subject, text }),
    });
    const detail = await res.text();
    if (!res.ok) {
      console.error("Alert email failed:", detail);
      return { ok: false, detail };
    }
    return { ok: true, detail };
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    console.error("Alert email exception:", detail);
    return { ok: false, detail };
  }
}

Deno.serve(async (req: Request) => {
  // Manual self-test: POST {"test": true} sends a test alert email and returns,
  // without touching Instagram. The 6-hourly cron sends {} so this never fires in prod.
  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* no/empty body — normal cron call */ }
  if (body?.test === true) {
    const r = await sendAlert(
      "[FCC Gallery] TEST alert — delivery check",
      "This is a manual test of the daycaresf.com Instagram gallery failure alert.\n\n" +
      "If you're reading this, alert delivery works end-to-end (Resend → your inbox). No action needed.\n\n" +
      "Real alerts fire automatically only when a sync actually fails.",
    );
    return new Response(JSON.stringify({ ok: r.ok, test: true, detail: r.detail }), {
      status: r.ok ? 200 : 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: configs, error: cfgErr } = await supabase.from("gallery_config").select("*");
  if (cfgErr) {
    return new Response(JSON.stringify({ error: cfgErr.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
  const results: Array<Record<string, unknown>> = [];
  for (const cfg of configs ?? []) {
    const startedAt = new Date().toISOString();
    // Alert only on the transition into failure, so a persistent outage emails
    // once rather than every 6h. First run / unknown status is treated as healthy.
    const prevStatus: string | null = cfg.last_sync_status ?? null;
    const alreadyFailing = prevStatus !== null && prevStatus !== "ok";
    const orgLabel = cfg.organization_id;
    let token: string = cfg.access_token;
    try {
      const refreshedAt = cfg.token_refreshed_at ? new Date(cfg.token_refreshed_at).getTime() : 0;
      const ageDays = (Date.now() - refreshedAt) / (1000 * 60 * 60 * 24);
      if (ageDays > 30) {
        const refreshRes = await fetch(`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${token}`);
        const refreshJson = await refreshRes.json();
        if (refreshJson.access_token) {
          token = refreshJson.access_token;
          await supabase.from("gallery_config").update({ access_token: token, token_refreshed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", cfg.id);
        }
      }
      const fields = "id,caption,media_type,media_url,permalink,thumbnail_url,timestamp";
      const mediaRes = await fetch(`https://graph.instagram.com/v21.0/me/media?fields=${fields}&limit=30&access_token=${token}`);
      const mediaJson = await mediaRes.json();
      if (!mediaRes.ok || !Array.isArray(mediaJson.data)) {
        const status = `ig_error: ${JSON.stringify(mediaJson).slice(0, 400)}`;
        await supabase.from("gallery_config").update({ last_sync_at: startedAt, last_sync_status: status }).eq("id", cfg.id);
        if (!alreadyFailing) {
          await sendAlert(
            `[FCC Gallery] Instagram sync FAILED (org ${orgLabel})`,
            `The daycaresf.com Instagram gallery sync just started failing.\n\n` +
            `Org: ${orgLabel}\nWhen: ${startedAt}\n\nInstagram API response:\n` +
            `${JSON.stringify(mediaJson, null, 2).slice(0, 1500)}\n\n` +
            `Most likely the access token was invalidated (an Instagram/Facebook password change throws OAuthException code 190). ` +
            `A dead token cannot auto-refresh — regenerate it in the Meta app dashboard ` +
            `(Instagram > API setup with Instagram login > Generate token) and update gallery_config.access_token. ` +
            `The wall keeps showing the last good posts until then.\n\n` +
            `(You will not be emailed again until the sync recovers and breaks a second time.)`,
          );
        }
        results.push({ org: cfg.id, error: mediaJson });
        continue;
      }
      const rows = (mediaJson.data as IGMedia[]).map((p) => ({
        organization_id: cfg.organization_id,
        ig_media_id: p.id,
        image_url: p.media_url ?? p.thumbnail_url ?? "",
        thumbnail_url: p.thumbnail_url ?? null,
        caption: p.caption ?? null,
        permalink: p.permalink ?? null,
        media_type: p.media_type ?? "IMAGE",
        posted_at: p.timestamp,
        source: "instagram",
        url_refreshed_at: new Date().toISOString(),
        is_active: true,
      }));
      const { error: upErr } = await supabase.from("gallery_posts").upsert(rows, { onConflict: "ig_media_id" });
      if (upErr) {
        await supabase.from("gallery_config").update({ last_sync_at: startedAt, last_sync_status: `db_error: ${upErr.message}` }).eq("id", cfg.id);
        if (!alreadyFailing) {
          await sendAlert(
            `[FCC Gallery] Instagram sync DB error (org ${orgLabel})`,
            `The daycaresf.com Instagram gallery fetched posts but failed to write them to the database.\n\n` +
            `Org: ${orgLabel}\nWhen: ${startedAt}\nDatabase error: ${upErr.message}`,
          );
        }
        results.push({ org: cfg.id, error: upErr.message });
        continue;
      }
      await supabase.from("gallery_config").update({ last_sync_at: startedAt, last_sync_status: "ok", last_sync_count: rows.length, updated_at: new Date().toISOString() }).eq("id", cfg.id);
      results.push({ org: cfg.id, synced: rows.length, latest_post: rows[0]?.posted_at });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await supabase.from("gallery_config").update({ last_sync_at: startedAt, last_sync_status: `exception: ${msg}` }).eq("id", cfg.id);
      if (!alreadyFailing) {
        await sendAlert(
          `[FCC Gallery] Instagram sync exception (org ${orgLabel})`,
          `The daycaresf.com Instagram gallery sync threw an exception.\n\n` +
          `Org: ${orgLabel}\nWhen: ${startedAt}\nError: ${msg}`,
        );
      }
      results.push({ org: cfg.id, error: msg });
    }
  }
  return new Response(JSON.stringify({ ok: true, results }), { headers: { "Content-Type": "application/json" } });
});
