import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const POSTMARK_SERVER_TOKEN = Deno.env.get("POSTMARK_SERVER_TOKEN") ?? "";
const POSTMARK_FROM_EMAIL = Deno.env.get("POSTMARK_FROM_EMAIL") ?? "";
const ZOOM_LINK = Deno.env.get("ZOOM_LINK") ?? "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const EVENT_DATE = "Tuesday, September 1, 2026";
const EVENT_TIME = "7:00 PM ET";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, authorization, x-client-info, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

const safeText = (value: unknown, max = 160) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";
const validEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  try {
    const body = await req.json();
    const firstName = safeText(body.firstName, 80);
    const email = safeText(body.email, 180).toLowerCase();
    const businessName = safeText(body.businessName, 160);
    const source = safeText(body.source, 80) || "xc-ai-buildathon";

    if (!firstName || !businessName || !validEmail(email)) {
      return json({ error: "Please provide your first name, business name, and a valid email." }, 400);
    }

    const { data: registration, error: dbError } = await supabase
      .from("buildathon_registrations")
      .upsert({
        first_name: firstName,
        email,
        business_name: businessName,
        source,
        updated_at: new Date().toISOString(),
      }, { onConflict: "email" })
      .select("id,email")
      .single();

    if (dbError || !registration) {
      console.error(dbError?.message ?? "Registration save failed");
      return json({ error: "We could not save your registration." }, 500);
    }

    if (!POSTMARK_SERVER_TOKEN || !POSTMARK_FROM_EMAIL || !ZOOM_LINK) {
      await supabase.from("buildathon_registrations")
        .update({ confirmation_email_status: "pending", updated_at: new Date().toISOString() })
        .eq("id", registration.id);
      return json({ ok: true, emailSent: false, emailStatus: "pending" }, 202);
    }

    const subject = "You're in: AI in Action — The Buildathon";
    const textBody = `Great, you're in, ${firstName}.\n\nAI in Action: The Buildathon\n${EVENT_DATE}\n${EVENT_TIME}\n75 minutes\nLive on Zoom\n\nJoin Zoom:\n${ZOOM_LINK}\n\nBefore the event:\n- Have one clear solo photo ready\n- Save 1–2 outfit references\n- Log in to ChatGPT and Gemini\n- Join from a laptop or desktop if possible\n\nThird-party recording and AI notetaking tools are not permitted in this session.\n\nSee you there,\nMichelle Robinson\nFounder + CEO, Clairen Haus`;

    const htmlBody = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="only light"><meta name="supported-color-schemes" content="light"><style>:root{color-scheme:light only!important;supported-color-schemes:light!important}.email-bg{background:#f3f6fc!important}.brand-panel{background:#0b1120!important}.brand-white{color:#ffffff!important}.brand-muted{color:#dce3ee!important}.brand-gold{color:#f3b653!important}.detail-card{background:#f6f8fd!important;color:#111827!important}.detail-muted{color:#5f6b7c!important}.policy-box{background:#111a2b!important;color:#cfd8e6!important}@media (prefers-color-scheme:dark){.email-bg{background:#f3f6fc!important}.brand-panel{background:#0b1120!important}.brand-white{color:#ffffff!important}.brand-muted{color:#dce3ee!important}.brand-gold{color:#f3b653!important}.detail-card{background:#f6f8fd!important;color:#111827!important}.detail-muted{color:#5f6b7c!important}.policy-box{background:#111a2b!important;color:#cfd8e6!important}}</style></head><body class="email-bg" bgcolor="#f3f6fc" style="margin:0;padding:0;background:#f3f6fc;font-family:Arial,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f3f6fc" class="email-bg"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#0b1120" class="brand-panel" style="max-width:640px;background:#0b1120;border:1px solid #263044;border-radius:24px"><tr><td style="padding:34px 30px"><div class="brand-gold" style="font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#f3b653!important;font-weight:700">AI IN ACTION · THE BUILDATHON</div><h1 class="brand-white" style="margin:12px 0 14px;font-size:40px;line-height:1.05;color:#ffffff!important;font-weight:800">Great, you're in.</h1><p class="brand-muted" style="margin:0;font-size:17px;line-height:1.7;color:#dce3ee!important">${firstName}, your seat is saved.<br>Keep this email — your Zoom link is below.</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f6f8fd" class="detail-card" style="margin:28px 0;background:#f6f8fd;border-radius:18px"><tr><td style="padding:22px"><div style="font-size:20px;font-weight:800;line-height:1.3;color:#111827!important">${EVENT_DATE}</div><div class="detail-muted" style="margin-top:7px;font-size:16px;line-height:1.5;color:#5f6b7c!important">${EVENT_TIME} · 75 minutes · Live on Zoom</div></td></tr></table><table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td bgcolor="#18d9ff" style="border-radius:999px;background-color:#18d9ff;background-image:linear-gradient(90deg,#18d9ff,#8658ff,#e331ff)"><a href="${ZOOM_LINK}" style="display:inline-block;padding:15px 24px;border-radius:999px;text-decoration:none;font-size:17px;font-weight:800;color:#ffffff!important">Join the Zoom</a></td></tr></table><h2 class="brand-white" style="margin:34px 0 12px;font-size:20px;color:#ffffff!important">Before we build</h2><ul class="brand-muted" style="margin:0;padding-left:21px;color:#dce3ee!important;line-height:1.9"><li>Have one clear solo photo ready</li><li>Save 1–2 outfit references</li><li>Log in to ChatGPT and Gemini before the session</li><li>Use a laptop or desktop if possible</li></ul><div class="policy-box" style="margin-top:24px;padding:16px 18px;border:1px solid #33415a;border-radius:14px;background:#111a2b!important;color:#cfd8e6!important;font-size:13px;line-height:1.6">Third-party recording and AI notetaking tools are not permitted in this session.</div><p class="brand-muted" style="margin:32px 0 0;color:#dce3ee!important;line-height:1.7">See you there,<br><strong class="brand-white" style="color:#ffffff!important">Michelle Robinson</strong><br>Founder + CEO, Clairen Haus</p></td></tr></table></td></tr></table></body></html>`;

    const mail = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": POSTMARK_SERVER_TOKEN,
      },
      body: JSON.stringify({
        From: POSTMARK_FROM_EMAIL,
        To: email,
        Subject: subject,
        TextBody: textBody,
        HtmlBody: htmlBody,
        MessageStream: "outbound",
      }),
    });

    if (!mail.ok) {
      console.error(await mail.text());
      await supabase.from("buildathon_registrations")
        .update({ confirmation_email_status: "failed", updated_at: new Date().toISOString() })
        .eq("id", registration.id);
      return json({ ok: true, emailSent: false, emailStatus: "failed" }, 202);
    }

    const mailResult = await mail.json();
    await supabase.from("buildathon_registrations")
      .update({
        confirmation_email_status: "sent",
        confirmation_email_sent_at: new Date().toISOString(),
        postmark_message_id: mailResult?.MessageID ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", registration.id);

    return json({ ok: true, emailSent: true, emailStatus: "sent" });
  } catch (error) {
    console.error(error);
    return json({ error: "Unexpected error. Please try again." }, 500);
  }
});
