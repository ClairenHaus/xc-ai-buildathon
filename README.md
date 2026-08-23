# XC AI Buildathon Landing Page

Static GitHub Pages package for:

AI in Action: The Buildathon  
Tuesday, September 1, 2026  
6:00 PM ET  
75 minutes  
Live on Zoom  
Free live attendance  
Replay + follow-along workbook: $19 pre-event / $29 post-event

## Included

- Full responsive landing page
- Approved dark neon / editorial visual system
- Automatic hero crossfade rotation
- Full-resolution AI portrait assets
- Supplied transparent speaking image in the host section
- Registration form
- Separate confirmation page
- Replay + workbook sales page with $19 pre-event and $29 post-event Stripe checkout links
- Matching confetti on confirmation page load
- GitHub Pages-ready static structure
- Supabase Edge Function + Postmark confirmation-email workflow

## Hero animation

- Original image: 3 seconds
- Each AI image: 2.4 seconds
- Crossfade: 520ms
- Continuous loop
- No arrows
- No dots
- Reduced-motion users see a static first frame

## Replay package

Includes:

- Full Buildathon recording
- Follow-along workbook
- Every workshop prompt
- Step-by-step instructions for all five builds
- Refinement checkpoints

Pricing:

- $19 before September 1, 2026 at 6:00 PM ET
- $29 once the Buildathon begins

The confirmation page automatically switches from the $19 Stripe link to the $29 link at event start.

## Registration setup

The public site is static. The included Supabase Edge Function handles secure registration storage and Postmark confirmation email delivery.

Run `supabase/schema.sql`, deploy `supabase/functions/register-buildathon/index.ts`, set the required function secrets, then set `registrationEndpoint` in `config.js`.

Required secrets:

- `POSTMARK_SERVER_TOKEN`
- `POSTMARK_FROM_EMAIL`
- `ZOOM_LINK`
- `ALLOWED_ORIGIN`

Do not place secret keys in the public repository.

## GitHub Pages

Deploy from the `main` branch and repository root. The site does not use Vercel.
