import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const POSTMARK_SERVER_TOKEN = Deno.env.get("POSTMARK_SERVER_TOKEN") ?? "";
const POSTMARK_FROM_EMAIL = Deno.env.get("POSTMARK_FROM_EMAIL") ?? "";
const ZOOM_LINK = Deno.env.get("ZOOM_LINK") ?? "";
const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") ?? "*";
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "content-type, authorization, x-client-info, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" }
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

    const { error: dbError } = await supabase
      .from("buildathon_registrations")
      .upsert(
        { first_name: firstName, email, business_name: businessName, source },
        { onConflict: "email" }
      );

    if (dbError) {
      console.error(dbError.message);
      return json({ error: "We could not save your registration." }, 500);
    }

    if (!POSTMARK_SERVER_TOKEN || !POSTMARK_FROM_EMAIL || !ZOOM_LINK) {
      return json({ error: "Your registration was saved, but the confirmation email is not configured." }, 500);
    }

    const mail = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": POSTMARK_SERVER_TOKEN
      },
      body: JSON.stringify({
        From: POSTMARK_FROM_EMAIL,
        To: email,
        Subject: "You're in: AI in Action — The Buildathon",
        TextBody: `Great, you're in.\n\nAI in Action: The Buildathon\nTuesday, September 1, 2026\n6:00 PM ET\n75 minutes\nLive on Zoom\n\nJoin Zoom:\n${ZOOM_LINK}\n\nBefore the event:\n- Have one clear solo photo ready\n- Save 1–2 outfit references\n- Log in to ChatGPT and Gemini\n- Join from a laptop or desktop if possible\n\nSee you there,\nMichelle Robinson\nClairen Haus`,
        HtmlBody: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#161616;line-height:1.6"><h1>Great, you're in.</h1><p>Check your email for the Zoom link and instructions for before the event.</p><div style="margin:28px 0;padding:22px;border:1px solid #e5e5e5;border-radius:14px"><strong>AI in Action: The Buildathon</strong><br>Tuesday, September 1, 2026<br>6:00 PM ET<br>75 minutes · Live on Zoom</div><p><a href="${ZOOM_LINK}" style="display:inline-block;padding:13px 20px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:9px;font-weight:700">Join the Zoom</a></p><h2 style="font-size:18px;margin-top:30px">Before the event</h2><ul><li>Have one clear solo photo ready</li><li>Save 1–2 outfit references</li><li>Log in to ChatGPT and Gemini</li><li>Join from a laptop or desktop if possible</li></ul><p style="margin-top:30px">See you there,<br><strong>Michelle Robinson</strong><br>Clairen Haus</p></div>`
      })
    });

    if (!mail.ok) {
      console.error(await mail.text());
      return json({ error: "Your registration was saved, but we could not send the confirmation email." }, 500);
    }

    return json({ ok: true });
  } catch (error) {
    console.error(error);
    return json({ error: "Unexpected error. Please try again." }, 500);
  }
});
