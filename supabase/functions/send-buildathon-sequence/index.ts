import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const POSTMARK_SERVER_TOKEN = Deno.env.get("POSTMARK_SERVER_TOKEN") ?? "";
const POSTMARK_FROM_EMAIL = Deno.env.get("POSTMARK_FROM_EMAIL") ?? "";
const ZOOM_LINK = Deno.env.get("ZOOM_LINK") ?? "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const EVENT_START = new Date("2026-09-01T19:00:00-04:00");
const HOUR = 60 * 60 * 1000;
const MINUTE = 60 * 1000;

const escapeHtml = (value: string) => value
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

type EmailKey = "day1" | "day3" | "48h" | "24h" | "3h" | "30m";

type EmailContent = {
  subject: string;
  preview: string;
  heading: string;
  html: string;
  text: string;
  showZoomButton?: boolean;
};

function selectEmail(createdAt: string, now: Date): { key: EmailKey; dueAt: Date } | null {
  const created = new Date(createdAt);
  const cutoff48 = new Date(EVENT_START.getTime() - 48 * HOUR);
  const cutoff24 = new Date(EVENT_START.getTime() - 24 * HOUR);
  const cutoff3 = new Date(EVENT_START.getTime() - 3 * HOUR);
  const cutoff30 = new Date(EVENT_START.getTime() - 30 * MINUTE);

  if (now >= EVENT_START) return null;

  if (now >= cutoff30 && created <= cutoff30) return { key: "30m", dueAt: cutoff30 };
  if (now >= cutoff3 && created <= cutoff3) return { key: "3h", dueAt: cutoff3 };
  if (now >= cutoff24 && created <= cutoff24) return { key: "24h", dueAt: cutoff24 };
  if (now >= cutoff48 && created <= cutoff48) return { key: "48h", dueAt: cutoff48 };

  if (now < cutoff48) {
    const day3 = new Date(created.getTime() + 72 * HOUR);
    const day1 = new Date(created.getTime() + 24 * HOUR);
    if (now >= day3) return { key: "day3", dueAt: day3 };
    if (now >= day1) return { key: "day1", dueAt: day1 };
  }

  return null;
}

function contentFor(key: EmailKey, firstName: string): EmailContent {
  const name = escapeHtml(firstName);

  if (key === "day1") return {
    subject: "Start with one photo",
    preview: "It does not need to be professional.",
    heading: "Start with one photo",
    html: `<p>Hi ${name},</p><p>Before the Buildathon, I want you to choose the photo you are going to start with.</p><p><strong>Do not make this harder than it needs to be.</strong></p><p>You do not need a professional headshot. You do not need the perfect outfit. You do not need a studio background.</p><p>Choose one clear photo where:</p><ul><li>You are the only person in the picture</li><li>Your face is easy to see</li><li>The lighting is decent</li><li>You actually look like yourself</li></ul><p>That is enough.</p><p>Part of what we are going to work through together is how to take an ordinary photo and give AI enough direction to create something polished without turning you into a completely different person.</p><p>And when AI gets it wrong, because sometimes it absolutely will, I will show you how to refine the prompt instead of starting over every time.</p><p>For now, just choose your photo and save it somewhere easy to find.</p><p>We will build from there.</p>`,
    text: `Hi ${firstName},\n\nBefore the Buildathon, I want you to choose the photo you are going to start with.\n\nDo not make this harder than it needs to be.\n\nYou do not need a professional headshot. You do not need the perfect outfit. You do not need a studio background.\n\nChoose one clear photo where:\n- You are the only person in the picture\n- Your face is easy to see\n- The lighting is decent\n- You actually look like yourself\n\nThat is enough.\n\nPart of what we are going to work through together is how to take an ordinary photo and give AI enough direction to create something polished without turning you into a completely different person.\n\nAnd when AI gets it wrong, because sometimes it absolutely will, I will show you how to refine the prompt instead of starting over every time.\n\nFor now, just choose your photo and save it somewhere easy to find.\n\nWe will build from there.`
  };

  if (key === "day3") return {
    subject: "You are building all five of these",
    preview: "This is not a watch-me-use-AI session.",
    heading: "You are building all five",
    html: `<p>Hi ${name},</p><p>A quick reminder about what makes this Buildathon different.</p><p><strong>You are not coming to watch me click around ChatGPT while you take notes.</strong></p><p>You are going to build with me.</p><p>We are starting with one photo and working toward five business assets:</p><ul><li>A professional headshot</li><li>An outfit and brand variation</li><li>A Reel-sized creative</li><li>A short spoken script</li><li>A short AI-generated video</li></ul><p>You will run the prompts yourself, look at what AI gives you, make adjustments, and keep building.</p><p>The goal is to leave the session with business assets you have already created and can actually use, not just a bunch of notes about what to try later.</p><p>Before we meet, make sure you have:</p><ul><li>Your starting photo</li><li>One or two outfit references</li><li>Access to ChatGPT</li><li>Access to Gemini</li></ul><p>A laptop or desktop will make the session much easier to follow than working entirely from your phone.</p><p>That is really all you need.</p>`,
    text: `Hi ${firstName},\n\nA quick reminder about what makes this Buildathon different.\n\nYou are not coming to watch me click around ChatGPT while you take notes. You are going to build with me.\n\nWe are starting with one photo and working toward five business assets:\n- A professional headshot\n- An outfit and brand variation\n- A Reel-sized creative\n- A short spoken script\n- A short AI-generated video\n\nYou will run the prompts yourself, look at what AI gives you, make adjustments, and keep building.\n\nThe goal is to leave the session with business assets you have already created and can actually use, not just a bunch of notes about what to try later.\n\nBefore we meet, make sure you have your starting photo, one or two outfit references, access to ChatGPT, and access to Gemini.\n\nA laptop or desktop will make the session much easier to follow than working entirely from your phone.\n\nThat is really all you need.`
  };

  if (key === "48h") return {
    subject: "Your Buildathon prep check",
    preview: "Make sure these four things are ready.",
    heading: "Your Buildathon prep check",
    html: `<p>Hi ${name},</p><p>We are getting close, so this is your official prep check.</p><p>Before the Buildathon, have these ready:</p><p><strong>1. Your starting photo</strong><br>One clear solo image where your face is visible.</p><p><strong>2. One or two outfit references</strong><br>Screenshots are completely fine. Pick something you would actually wear.</p><p><strong>3. ChatGPT and Gemini</strong><br>Make sure you can log into both before we start.</p><p><strong>4. Your computer</strong><br>A laptop or desktop is strongly recommended. You are going to be creating while we are together.</p><p>Also, give yourself the full 75 minutes.</p><p>We are going to move through the builds together, and you will get much more out of the session if you can actually work instead of trying to multitask.</p><p>Your Zoom link is in your registration confirmation email.</p><p>I will see you soon.</p>`,
    text: `Hi ${firstName},\n\nWe are getting close, so this is your official prep check.\n\nBefore the Buildathon, have these ready:\n\n1. Your starting photo\nOne clear solo image where your face is visible.\n\n2. One or two outfit references\nScreenshots are completely fine. Pick something you would actually wear.\n\n3. ChatGPT and Gemini\nMake sure you can log into both before we start.\n\n4. Your computer\nA laptop or desktop is strongly recommended. You are going to be creating while we are together.\n\nAlso, give yourself the full 75 minutes.\n\nWe are going to move through the builds together, and you will get much more out of the session if you can actually work instead of trying to multitask.\n\nYour Zoom link is in your registration confirmation email.\n\nI will see you soon.`
  };

  if (key === "24h") return {
    subject: "We build tomorrow",
    preview: "Get your files ready now so you can jump straight in.",
    heading: "We build tomorrow",
    html: `<p>Hi ${name},</p><p>We build tomorrow.</p><p>Take five minutes today and make sure everything you need is sitting somewhere easy to access.</p><p><strong>Your checklist:</strong></p><ul><li>Starting photo</li><li>Outfit inspiration</li><li>ChatGPT logged in</li><li>Gemini logged in</li><li>Laptop or desktop ready</li><li>Charger nearby</li></ul><p>We only have 75 minutes together, so I do not want you spending the first part of the session searching through your camera roll or resetting passwords.</p><p>Come ready to work.</p><p>Your Zoom link is in your registration confirmation email.</p><p>See you tomorrow.</p>`,
    text: `Hi ${firstName},\n\nWe build tomorrow.\n\nTake five minutes today and make sure everything you need is sitting somewhere easy to access.\n\nYour checklist:\n- Starting photo\n- Outfit inspiration\n- ChatGPT logged in\n- Gemini logged in\n- Laptop or desktop ready\n- Charger nearby\n\nWe only have 75 minutes together, so I do not want you spending the first part of the session searching through your camera roll or resetting passwords.\n\nCome ready to work.\n\nYour Zoom link is in your registration confirmation email.\n\nSee you tomorrow.`
  };

  if (key === "3h") return {
    subject: "We build tonight at 7",
    preview: "Pull up your photo. We start in a few hours.",
    heading: "We build tonight at 7",
    html: `<p>Hi ${name},</p><p>We are a few hours away from <strong>AI in Action: The Buildathon.</strong></p><p>We start tonight at <strong>7:00 PM ET.</strong></p><p>Before you join, pull up:</p><ul><li>Your starting photo</li><li>Your outfit references</li><li>ChatGPT</li><li>Gemini</li></ul><p>Then come ready to build.</p><p>I am not spending the first 20 minutes explaining why AI matters.</p><p><strong>We are getting into the work.</strong></p><p>I recommend joining a few minutes early so you are settled before we begin.</p><p>See you tonight.</p>`,
    text: `Hi ${firstName},\n\nWe are a few hours away from AI in Action: The Buildathon.\n\nWe start tonight at 7:00 PM ET.\n\nBefore you join, pull up your starting photo, outfit references, ChatGPT, and Gemini.\n\nThen come ready to build.\n\nI am not spending the first 20 minutes explaining why AI matters. We are getting into the work.\n\nJoin the Buildathon:\n${ZOOM_LINK}\n\nI recommend joining a few minutes early so you are settled before we begin.\n\nSee you tonight.`,
    showZoomButton: true
  };

  return {
    subject: "We start in 30 minutes",
    preview: "Grab your photo and come join me.",
    heading: "We start in 30 minutes",
    html: `<p>Hi ${name},</p><p>We start in 30 minutes.</p><p>Grab your photo, open ChatGPT and Gemini, and come join me.</p><p>See you at 7.</p>`,
    text: `Hi ${firstName},\n\nWe start in 30 minutes.\n\nGrab your photo, open ChatGPT and Gemini, and come join me.\n\nJoin the Buildathon:\n${ZOOM_LINK}\n\nSee you at 7.`,
    showZoomButton: true
  };
}

function emailHtml(content: EmailContent) {
  const zoomButton = content.showZoomButton ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:26px 0"><tr><td bgcolor="#18d9ff" style="border-radius:999px;background-color:#18d9ff;background-image:linear-gradient(90deg,#18d9ff,#8658ff,#e331ff)"><a href="${ZOOM_LINK}" style="display:inline-block;padding:15px 24px;border-radius:999px;text-decoration:none;font-size:17px;font-weight:800;color:#ffffff!important">Join the Buildathon</a></td></tr></table>` : "";

  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="only light"><meta name="supported-color-schemes" content="light"><style>:root{color-scheme:light only!important;supported-color-schemes:light!important}.email-bg{background:#f3f6fc!important}.brand-panel{background:#0b1120!important}.brand-white{color:#ffffff!important}.brand-muted{color:#dce3ee!important}.brand-gold{color:#f3b653!important}@media (prefers-color-scheme:dark){.email-bg{background:#f3f6fc!important}.brand-panel{background:#0b1120!important}.brand-white{color:#ffffff!important}.brand-muted{color:#dce3ee!important}.brand-gold{color:#f3b653!important}}</style></head><body class="email-bg" bgcolor="#f3f6fc" style="margin:0;padding:0;background:#f3f6fc;font-family:Arial,sans-serif"><div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${escapeHtml(content.preview)}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f3f6fc" class="email-bg"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#0b1120" class="brand-panel" style="max-width:640px;background:#0b1120;border:1px solid #263044;border-radius:24px"><tr><td style="padding:34px 30px"><div class="brand-gold" style="font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:#f3b653!important;font-weight:700">AI IN ACTION · THE BUILDATHON</div><h1 class="brand-white" style="margin:12px 0 20px;font-size:36px;line-height:1.08;color:#ffffff!important;font-weight:800">${escapeHtml(content.heading)}</h1><div class="brand-muted" style="font-size:16px;line-height:1.75;color:#dce3ee!important">${content.html}</div>${zoomButton}<p class="brand-muted" style="margin:32px 0 0;color:#dce3ee!important;line-height:1.7">Michelle<br><strong class="brand-white" style="color:#ffffff!important">Founder + CEO, Clairen Haus</strong></p></td></tr></table></td></tr></table></body></html>`;
}

async function claimEmail(registrationId: string, key: EmailKey, dueAt: Date) {
  const nowIso = new Date().toISOString();
  const { data: existing } = await supabase
    .from("buildathon_email_log")
    .select("id,status,attempts,last_attempt_at")
    .eq("registration_id", registrationId)
    .eq("email_key", key)
    .maybeSingle();

  if (existing) {
    if (existing.status === "sent" || existing.status === "sending") return null;
    if ((existing.attempts ?? 0) >= 3) return null;
    if (existing.last_attempt_at && Date.now() - new Date(existing.last_attempt_at).getTime() < 15 * MINUTE) return null;

    const { data: claimed } = await supabase
      .from("buildathon_email_log")
      .update({
        status: "sending",
        attempts: (existing.attempts ?? 0) + 1,
        last_attempt_at: nowIso,
        due_at: dueAt.toISOString(),
        error_message: null,
        updated_at: nowIso,
      })
      .eq("id", existing.id)
      .eq("status", "failed")
      .select("id")
      .maybeSingle();
    return claimed?.id ?? null;
  }

  const { data: inserted, error } = await supabase
    .from("buildathon_email_log")
    .insert({
      registration_id: registrationId,
      email_key: key,
      due_at: dueAt.toISOString(),
      status: "sending",
      attempts: 1,
      last_attempt_at: nowIso,
      updated_at: nowIso,
    })
    .select("id")
    .single();

  if (error) return null;
  return inserted.id as string;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { "Content-Type": "application/json" } });
  if (!POSTMARK_SERVER_TOKEN || !POSTMARK_FROM_EMAIL || !ZOOM_LINK) return new Response(JSON.stringify({ error: "Email configuration incomplete" }), { status: 500, headers: { "Content-Type": "application/json" } });

  const now = new Date();
  if (now >= EVENT_START) return new Response(JSON.stringify({ ok: true, sent: 0, reason: "event_started" }), { headers: { "Content-Type": "application/json" } });

  const { data: registrations, error: regError } = await supabase
    .from("buildathon_registrations")
    .select("id,first_name,email,created_at")
    .order("created_at", { ascending: true });

  if (regError) return new Response(JSON.stringify({ error: regError.message }), { status: 500, headers: { "Content-Type": "application/json" } });

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const registration of registrations ?? []) {
    const selected = selectEmail(registration.created_at, now);
    if (!selected) { skipped++; continue; }

    const logId = await claimEmail(registration.id, selected.key, selected.dueAt);
    if (!logId) { skipped++; continue; }

    const content = contentFor(selected.key, registration.first_name);
    try {
      const mail = await fetch("https://api.postmarkapp.com/email", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "X-Postmark-Server-Token": POSTMARK_SERVER_TOKEN,
        },
        body: JSON.stringify({
          From: POSTMARK_FROM_EMAIL,
          To: registration.email,
          Subject: content.subject,
          TextBody: `${content.text}\n\nMichelle\nFounder + CEO, Clairen Haus`,
          HtmlBody: emailHtml(content),
          MessageStream: "outbound",
        }),
      });

      if (!mail.ok) {
        const err = (await mail.text()).slice(0, 1000);
        await supabase.from("buildathon_email_log").update({ status: "failed", error_message: err, updated_at: new Date().toISOString() }).eq("id", logId);
        failed++;
        continue;
      }

      const result = await mail.json();
      await supabase.from("buildathon_email_log").update({
        status: "sent",
        sent_at: new Date().toISOString(),
        postmark_message_id: result?.MessageID ?? null,
        error_message: null,
        updated_at: new Date().toISOString(),
      }).eq("id", logId);
      sent++;
    } catch (error) {
      await supabase.from("buildathon_email_log").update({ status: "failed", error_message: String(error).slice(0, 1000), updated_at: new Date().toISOString() }).eq("id", logId);
      failed++;
    }
  }

  return new Response(JSON.stringify({ ok: true, sent, failed, skipped, checked: registrations?.length ?? 0 }), { headers: { "Content-Type": "application/json" } });
});
