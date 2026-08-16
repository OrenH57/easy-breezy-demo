# Easy Breezy client system

This is a small full-stack service-business site. It has a public booking and chat flow plus a password-protected owner dashboard for clients, messages, annual reminders, and payment records.

## Run locally

1. Copy `.env.example` to `.env` and replace the sample values.
2. Run `npm run dev` (the React client starts on `http://127.0.0.1:5173`). In another terminal, run `npm start` for the API on port 4173.
3. Open `http://127.0.0.1:5173`; the owner dashboard is at `/admin`.

## What the system stores

- Customer contact details and service request.
- Chat requests.
- A one-year follow-up reminder for each service request.
- Payment amount, payment method, and receipt/reference ID.

It never stores card numbers, CVVs, or bank-account details. Use Stripe Checkout or another PCI-compliant payment provider to take payments, then retain only its receipt/reference ID here.

## Add a new state

Add one entry to `states.json`, with a two-letter code, the state name, its real phone number, and its service areas. Keep `enabled` set to `false` until its local content, phone routing, privacy/legal copy, and operational coverage are ready. Turn it on, then the new site is available at `/<state-code>` (for example `/nj`). All new leads and messages are tagged with that state, while the owner dashboard remains shared.

## React component map

- `components/Brand.jsx`: shared Easy Breezy identity.
- `components/Layout.jsx`: shared navigation, footer, phone action, and chat drawer.
- `components/BookingForm.jsx`: one booking flow reused on the home and booking pages.
- `pages/Home.jsx`, `Services.jsx`, `Booking.jsx`, and `About.jsx`: public routes.
- `pages/Admin.jsx`: owner login and business-center UI.
- `lib/api.js`: one API boundary used by every form and dashboard request.

The public routes are `/`, `/services`, `/booking`, and `/about`. State-ready variants use `/:state`, `/:state/services`, `/:state/booking`, and `/:state/about`.

## Before launch

- Set a unique, password-manager-generated `ADMIN_PASSWORD` (at least 16 characters). Owner sign-in is disabled if it is missing; never deploy with the example value.
- Keep `TRUST_PROXY=true` only when the service is behind Render's proxy (as configured in `render.yaml`). It makes rate limits use the real visitor address. Do not enable it on a server exposed directly to the internet.
- Treat the dashboard as customer data: use a production HTTPS domain, restrict dashboard access at your hosting provider/VPN if possible, give every owner a separate account with MFA before more people need access, and use encrypted managed storage with backups rather than local JSON as usage grows.
- Add a verified Resend sender and `RESEND_API_KEY` to enable reminder emails.
- Host it behind HTTPS. Run the app continuously (or deploy a daily scheduled job) so scheduled reminder checks can be added reliably.
- Connect a real payment provider. Stripe Checkout is the recommended route for one-time payments; do not build a card-number form into this site.
- Add privacy policy, terms, service area, business address, and real customer reviews only after permission.
