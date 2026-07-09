# Abundant Global Club — Full Platform Fix & Feature Build Prompt

You are working on the **Abundant Global Club** web app (Next.js/React frontend + Firebase Admin SDK backend + Stripe for payments). Below is a full audit of current issues and the complete feature spec for the finished product. Work through this systematically, **consolidate duplicate/conflicting code instead of adding parallel implementations**, and confirm each section works end-to-end (admin write → Firestore → public site render) before moving to the next.

---

## 0. Ground Rules

- **No duplicate logic.** Before adding a new component/hook/API route, search the codebase for an existing one that does something similar (e.g. settings loaders, image upload widgets, form builders) and consolidate rather than fork.
- **Single source of truth in Firestore** for every content type below. The admin dashboard writes to Firestore; the public site reads from the same collections in real time (`onSnapshot` or ISR revalidation — pick one pattern and use it consistently everywhere).
- **Every admin screen must actually persist and reflect changes on the live site** — treat "admin edits X but the public page doesn't change" as a bug wherever you find it.
- **Full responsiveness**: every admin and public page must work correctly at mobile (375px), tablet (768px), and desktop (1280px+) breakpoints. Audit the sidebar, tables, modals, forms, sliders, and calendar for overflow/scroll issues.
- Fix the current known bug first: **Settings and other pages currently show "Failed to load settings"** — trace the Firestore read (likely a missing document, bad security rule, or unhandled null) and fix it so Settings loads cleanly, with the Retry button only appearing on genuine failures.

---

## 1. Authentication, Roles & Admin Invite System

- Roles: `super_admin`, `admin`, `member`.
- Only a `super_admin` can generate **admin invite codes** (single-use or expiring, with a role pre-assigned to the code: `admin` or scoped permissions).
- Build an **Invite Admins** screen (under Settings or a new "Team/Access" section) where super admin can:
  - Generate a code, set expiry, set role/permissions.
  - View pending/used/expired invites, revoke unused ones.
- New admin signup flow: enter invite code → validate against Firestore → create account with the assigned role → code marked used.
- Enforce role checks on every admin route/API (not just hiding UI — verify server-side too).

---

## 2. Global CMS Architecture (Pages, Navbar, Footer)

Build a generic **Pages** system so any page's content and placement is admin-editable, replacing one-off hardcoded pages where possible.

- **Create Page** form fields: title, slug, content blocks (rich text/sections), status (draft/published), SEO meta.
- **Placement controls** on every custom page:
  - **Footer placement**: dropdown to assign the page under `Platform`, `Company`, `Connect`, or "None" (not shown in footer). Footer must render these three columns dynamically from Firestore instead of hardcoded links.
  - **Navbar placement**: option to show the page as a top-level nav item OR as a dropdown item under an existing nav menu (Home/About/Events/Membership/Contact/etc.). Navbar must render dynamically based on this config, including nested dropdowns.
- Existing pages (Home, About, Events, Membership, Contact) should be migrated into this same CMS model wherever feasible so admin can edit their content blocks too, not just the custom pages.

### 2a. About Page Builder (specific requirement)
Admin-editable About page with these modular sections, each with add/edit/delete:
- **Founder's Message card**: message text + founder portrait image, laid out **side-by-side** (image left/right, text opposite — admin picks layout direction).
- **Mission / Vision card**: text + accompanying image, same side-by-side card pattern.
- **Core Values** (already present — keep editable: title + description per value, add/remove entries).
- **Team Members grid**: for each member — portrait photo, name/title, short bio, and social media icon buttons (LinkedIn, Twitter/X, Instagram, Facebook, email, phone, WhatsApp, etc.), each link admin-editable per member. Support add/edit/delete/suspend (hide without deleting) per team member.

### 2b. Custom Forms Builder
- Admin can build custom forms (fields: text, email, phone, textarea, select, checkbox, file upload, etc.).
- Admin specifies **where the form displays** — a specific page/section (dropdown of existing pages, or "Contact Page", "Event Registration", etc.).
- Submissions land in a Firestore collection and are visible/exportable in the admin dashboard, with the same response workflow described in Section 6.

---

## 3. Hero Slider

- Admin can upload **multiple images** to the slider, reorder them (drag/drop), and delete individual slides.
- Per-slider (or per-slide) settings, all admin-configurable and actually applied on the frontend:
  - **Speed** (autoplay interval, ms/seconds)
  - **Transition type** (fade, slide, none)
  - **Behavior** (autoplay on/off, loop on/off, pause on hover)
- Slider component on the homepage must read this config from Firestore and apply it live — verify changing speed/transition in admin visibly changes frontend behavior without a code deploy.

---

## 4. Events

- Admin creates events with: title, description, cover image, date/time, location (physical or virtual link), **type: Free or Paid**, and if Paid, a **price** (and currency).
- **Homepage**: "Upcoming Events" section must pull live from Firestore (replace the current static "No Upcoming Events" placeholder) — show next N upcoming events sorted by date, with a "View All Events" link.
- **Dedicated Events page**:
  - **Real-time calendar view** showing which dates have events (event dots/badges on the calendar).
  - **List view** and **filters** (by month, by free/paid, by category/tag if you add one) — user can toggle between calendar view and list/filter view.
  - Clicking an event opens details + registration.
- **Registration & payment**:
  - Free events: member clicks "Register" → confirmed instantly, saved to an `event_registrations` collection linked to member + event.
  - Paid events: member pays by card via **Stripe** (already configured in Integrations) using the price the admin set; on successful payment, registration is confirmed and a Stripe payment record is linked to the registration.
  - After successful registration (free or paid), show an **"Add to Calendar"** option generating a downloadable `.ics` file (and/or Google Calendar link) with the event's date, time, location/link.
- Admin Events dashboard: list/create/edit/delete events, view registrant list per event (name, email, paid/free, payment status), export if useful.

---

## 5. Membership Plans & Subscriptions (Stripe)

- Admin creates/edits/deletes **Membership Plans** (name, price, billing interval, benefits list, tier).
- Members see available plans in their **Member Dashboard** and can subscribe.
- **Free access window**: all members get free/full access until **August 31, [current year]**. Starting **September 1**, members without an active paid subscription are prompted to upgrade to continue enjoying member benefits (show an in-dashboard banner/modal, not a hard paywall unless that's explicitly wanted — clarify with product owner if uncertain, otherwise default to a soft prompt).
- Implement this date gate as a single shared utility/config (one constant date, one `isWithinFreePeriod()` helper) used everywhere the check is needed — do not duplicate the date logic in multiple components.
- Subscription payments processed via **Stripe** (already configured in admin/Integrations page) — use Stripe Checkout or Elements for card collection, webhook to confirm/update subscription status in Firestore, and reflect current plan/status in both the admin Members CRM and the member's own dashboard.

---

## 6. Members CRM

Admin **Members** table must capture and display, per member:
- Name
- Email / Phone
- Date joined
- Member profile view (link/drawer to view full profile)
- Profile image
- Plan tier (current membership plan / subscription status)

Support search, filters, and the existing "Add Member" flow. Add view/edit/suspend/delete actions consistent with the rest of the CMS.

---

## 7. Contact Page

- Wire the existing Contact form fully end-to-end: submissions save to Firestore and appear in a new **Contact Submissions** admin screen.
- Admin can **respond to a submission directly from the dashboard** (reply via email — trigger an email send, e.g. through a transactional email provider or Firebase Extension — and log the reply thread against the submission).
- Mark submissions as new/responded/archived.
- Add a **WhatsApp chat button** on the Contact page (floating or inline) linking to `https://wa.me/<number>` with the number pulled from admin settings (reuse the same social/contact settings used elsewhere — don't hardcode a second phone number field).
- Contact page's "Get in Touch" info (email, phone, address, social links) should pull from the same Settings/CMS source as the footer and About page, not be duplicated/hardcoded separately.

---

## 8. Site-wide UX: Language Switcher & Dark/Light Mode

- Audit the `EN` language switcher and the moon/sun icon dark/light toggle — confirm they are currently non-functional or partially wired, then implement fully:
  - i18n: extract all UI strings, support language switching that actually changes rendered content (even if only 1–2 languages to start, architecture should support adding more).
  - Theme: dark/light mode toggle must persist (localStorage/user preference) and apply consistently across **every** page, including admin dashboard and all public pages — no pages left un-themed.

---

## 9. Integrations Page Additions

Keep the existing Firebase Admin SDK and Stripe integration blocks, and add:
- **Anthropic API** integration block: admin pastes an Anthropic API key (stored securely, server-side only, never exposed to the client), used to power the chatbot below.
- Confirm all integration fields validate and show connection status (the existing "Live"/green-dot pattern used on the dashboard).

---

## 10. AI Chatbot

- Add a chatbot widget (floating button, expandable panel) available across the public site.
- Powered by the **Anthropic API** using the key from Integrations (Section 9).
- Chatbot should be able to **read from the platform's content** (pages, events, membership plans, FAQs) to answer visitor/member questions — implement this via retrieval: pull relevant Firestore content into the prompt context (RAG-lite) rather than hardcoding answers.
- Admin dashboard: a **Chatbot** management screen where admin can:
  - Edit the system prompt / persona / tone.
  - View conversation logs/messages.
  - Possibly curate a set of canned Q&A or knowledge snippets the bot should prioritize.
  - Enable/disable the chatbot site-wide.

---

## 11. Final QA Pass

Once implemented, verify:
1. Every admin CRUD screen (Members, Events, Testimonials, Hero Slider, Membership Plans, Integrations, Pages, Settings, Forms, Contact Submissions, Team Members, Chatbot, Admin Invites) creates/updates/deletes correctly and reflects on the public site without manual redeploys.
2. No duplicate components/hooks/API routes remain for settings loading, image upload, forms, or date logic — consolidate anything found.
3. Mobile/tablet/desktop responsiveness on every page listed above.
4. Dark/light mode and language switching work identically across admin and public site.
5. Stripe flows (event payments + membership subscriptions) work in test mode end-to-end, including webhooks updating Firestore.
6. The free-access-until-Aug-31 gate triggers correctly and only in one place in the codebase.
7. The chatbot responds using live platform data and respects the admin-configured persona.
