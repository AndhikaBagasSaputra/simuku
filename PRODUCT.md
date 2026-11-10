# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary user: the owner, managing their own personal money. Later the app may be shared with friends or family, each with their own account (sign-in and per-account sync exist for this). It is not planned as a public product for strangers.

The defining situation is a quick capture on a phone: right after spending or receiving money, often on the move, in a few seconds. Everything else (reviewing, splitting bills, exporting) is secondary to how fast and certain that capture feels.

## Product Purpose

Simuku is a personal money notebook in Indonesian. It records income and expenses and keeps the related money obligations in the same place, so the user always knows how much is left this month, who owes whom, and what is due soon. Success means logging is fast enough to happen every time, and the numbers can be trusted.

## Positioning

Everything in one place, connected. Transactions, debts and receivables, split bills, savings goals, and recurring bills live in one app and feed each other instead of being re-entered:

- a split bill creates the user's own expense and the matching debts or receivables automatically;
- paying a recurring bill can record the expense in the same step;
- the home screen combines today, the selected period, and upcoming bills.

## Operating Context

- Used mostly on a phone as an installed PWA, one-handed, often offline; also on a laptop in the browser (sidebar layout on wide screens).
- Split bill results are copied as text and pasted into WhatsApp.
- Currency is Indonesian Rupiah; all copy is Indonesian (`lang="id"`).
- Light and dark themes, following the system by default.

## Capabilities and Constraints

- Features: transactions with categories, search and filters, period picker, statistics charts; today summary card; history grouped by day (collapsed, 7 days per page); debts and receivables with payments; split bill (per-portion or shared items, discount, fees, payer); savings goals; recurring bills with due-date reminders inside the app; Excel/CSV export; JSON backup and restore.
- Privacy: optional 6-digit PIN app lock (per device, auto-lock after a chosen idle time; forgetting the PIN wipes local data). The lock is a screen lock, not encryption.
- Data is stored locally first so the app works offline. Optional email + password sign-in syncs through Supabase; last write wins on conflicts.
- Stack: React + TypeScript + Vite, Tailwind CSS v4, Recharts, vite-plugin-pwa; deployed on Vercel at simuku.vercel.app.
- Undecided: push notifications for bill reminders while the app is closed (planned after sync is live).

## Brand Commitments

- Name: Simuku. Existing app icon in `public/icon.svg` and PWA icons in `public/`.
- Voice: casual, friendly Indonesian ("kamu"), short practical hints.

## Evidence on Hand

No real users, testimonials, or metrics yet. Do not invent any.

## Product Principles

1. Capture first: recording a transaction on a phone must stay the fastest, most certain path in the app.
2. One record, many effects: when one action implies another (split bill, bill payment), the app does the bookkeeping instead of asking the user to do it twice.
3. The user's numbers are sacred: nothing is lost silently; destructive actions are undoable or explicitly confirmed, and totals always add up.
4. Works without the internet: the local copy is the source the user acts on; sync is a background convenience.
5. Private by default: data belongs to the user and stays on their devices unless they sign in.

## Accessibility & Inclusion

No specific requirement established beyond readable contrast in both themes, comfortable tap targets for one-handed phone use, and keyboard support on desktop.
