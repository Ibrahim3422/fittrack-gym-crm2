# FitTrack – Gym Management CRM

A single-page gym management app (members, memberships, attendance, bookings, trainers, payments, invoices, reports, messages). Plain HTML/CSS/JavaScript: no install, no build step.

## Run it

Open `index.html` in a browser (or serve the folder with any static server, e.g. `python3 -m http.server`).

**Demo login:** `admin@fittrack.pk` / `admin123`

## What's inside

- Dashboard with stats, growth chart, plan donut, expiring-soon list with one-click renew
- Members (add/edit/archive, search, filters, pagination) and full member profiles
- Membership plans, attendance (check in/out), bookings (list + week calendar, trainer double-booking blocked)
- Trainers, payments, printable invoices, reports with date ranges
- Messages with an AI assistant (demo template provider, swappable in `FT.ai.providers`)
- Notifications, global search, settings (gym info, currency, reminders, profile)
- 25 demo members, 4 trainers, 4 plans, and generated attendance/bookings/payments/invoices

## Important notes

- **Data is stored in your browser** (localStorage). Clearing site data resets it; Settings → "Reset demo data" restores the demo set.
- **Login is a client-side demo.** It does not protect real data. A production version needs a backend (server-side auth + database).
- Messages are stored in-app only. `FT.channels` is where WhatsApp/email senders would be added.

## Structure

```
index.html
css/style.css
js/data.js      store, seed data, derived statuses (expiry, overdue)
js/ui.js        helpers, icons, SVG charts, modals, forms
js/views-a.js   dashboard, members, member profile, plans
js/views-b.js   attendance, bookings, trainers, payments, invoices, reports, messages, settings
js/app.js       router, login, layout, search, notifications
```
