import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const POSTMARK_SERVER_TOKEN = Deno.env.get("POSTMARK_SERVER_TOKEN") ?? "";
const POSTMARK_FROM_EMAIL = Deno.env.get("POSTMARK_FROM_EMAIL") ?? "";
const ZOOM_LINK = Deno.env.get("ZOOM_LINK") ?? "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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
      .upsert(
        {
          first_name: firstName,
          email,
          business_name: businessName,
          source,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "email" }
      )
      .select("id,email,confirmation_email_status")
      .single();

    if (dbError || !registration) {
      console.error(dbError?.message ?? "Registration save failed");
      return json({ error: "We could not save your registration." }, 500);
    }

    if (!POSTMARK_SERVER_TOKEN || !POSTMARK_FROM_EMAIL || !ZOOM_LINK) {
      await supabase
        .from("buildathon_registrations")
        .update({ confirmation_email_status: "pending", updated_at: new Date().toISOString() })
        .eq("id", registration.id);

      return json({ ok: true, emailSent: false, emailStatus: "pending" }, 202);
    }

    const subject = "You're in: AI in Action — The Buildathon";
    const textBody = `Great, you're in, ${firstName}.\n\nAI in Action: The Buildathon\nTuesday, September 1, 2026\n6:00 PM ET\n75 minutes\nLive on Zoom\n\nJoin Zoom:\n${ZOOM_LINK}\n\nBefore the event:\n- Have one clear solo photo ready\n- Save 1–2 outfit references\n- Log in to ChatGPT and Gemini\n- Join from a laptop or desktop if possible\n\nSee you there,\nMichelle Robinson\nFounder + CEO, Clairen Haus`;

    const htmlBody = `<!doctype html><html><body style="margin:0;background:#060a14;font-family:Arial,sans-serif;color:#f7f8fb"><div style="max-width:640px;margin:0 auto;padding:36px 22px"><div style="padding:34px;border:1px solid #263044;border-radius:24px;background:linear-gradient(180deg,#0b1120,#080d18)"><div style="font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#f3b653;font-weight:700">AI IN ACTION · THE BUILDATHON</div><h1 style="margin:12px 0 14px;font-size:40px;line-height:1;color:#fff">Great, you're in.</h1><p style="font-size:17px;line-height:1.7;color:#b7c0cf">${firstName}, your seat is saved. Keep this email — your Zoom link is below.</p><div style="margin:28px 0;padding:22px;border-radius:18px;border:1px solid #29344a;background:#0b1222"><div style="font-size:20px;font-weight:700;color:#fff">Tuesday, September 1, 2026</div><div style="margin-top:7px;color:#9faabd">6:00 PM ET · 75 minutes · Live on Zoom</div></div><a href="${ZOOM_LINK}" style="display:inline-block;padding:15px 24px;border-radius:999px;text-decoration:none;font-weight:800;color:#071018;background:linear-gradient(90deg,#18d9ff,#8658ff,#e331ff)">Join the Zoom</a><h2 style="margin:34px 0 12px;font-size:20px;color:#fff">Before we build</h2><ul style="padding-left:21px;color:#b7c0cf;line-height:1.9"><li>Have one clear solo photo ready</li><li>Save 1–2 outfit references</li><li>Log in to ChatGPT and Gemini before the session</li><li>Use a laptop or desktop if possible</li></ul><p style="margin-top:32px;color:#b7c0cf;line-height:1.7">See you there,<br><strong style="color:#fff">Michelle Robinson</strong><br>Founder + CEO, Clairen Haus</p></div></div></body></html>`;

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
      const failure = await mail.text();
      console.error(failure);
      await supabase
        .from("buildathon_registrations")
        .update({ confirmation_email_status: "failed", updated_at: new Date().toISOString() })
        .eq("id", registration.id);

      return json({ ok: true, emailSent: false, emailStatus: "failed" }, 202);
    }

    const mailResult = await mail.json();
    await supabase
      .from("buildathon_registrations")
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
