# Civic Easy

Civic Easy is a done-for-you permit service for San Francisco. Clients describe a project, review a service recommendation, and purchase help for **$99 per permit plus government fees**. A specialist handles research, preparation, filing, and follow-up through a decision.

Production website: https://civiceasy.com

## Client experience

- `/hugo`: conversational intake with preliminary permit suggestions, official sources, and service cards.
- `/services`: review a saved draft, the scope for one permit, separate government fees, and one-time checkout. Sign-in preserves the draft in the same browser tab.
- `/requests`: real purchased requests; no mock permits or subscription paywall.
- `/requests/[id]`: updates, secure documents, messages, and city application details.
- `/profile`: contact details and management of any existing subscription.
- `/permits`: redirects to `/requests` for existing bookmarks.

## Operations

- `/operations`: staff-only queue with owner/status filters, search, and overdue follow-ups.
- `/operations/[id]`: assign/reassign work, set the next action and follow-up date, send information requests, keep internal notes, exchange documents, and record city application references and outcomes.
- Set `CIVIC_EASY_STAFF_IDS` to your Clerk user ID to start solo. The first configured user owns new cases automatically. Add comma-separated IDs to expand the team. All configured staff can access and reassign every case; there is no client-controlled admin flag.
- Every active case needs an owner, next action, and follow-up date. Reopening a completed or cancelled case requires these fields again.
- A service order, internal case, and government application have separate records and statuses. Mark a case completed only when its purchased scope has been delivered; filing alone is not completion.
- Additional permits require a separate, approved purchase. In this release, government-fee amounts and approval are coordinated through case messages; staff arrange collection separately. The initial $99 checkout never silently charges government fees.

## Setup

Stack: Next.js, TypeScript, Clerk, Stripe Checkout, PostgreSQL, private Vercel Blob storage, and Resend email.

1. Run `npm install`.
2. Copy `.env.example` to `.env.local` **only on a new setup**; preserve existing secrets if the file already exists.
3. Add a PostgreSQL `DATABASE_URL`, using the database provider's TLS settings. Run `npm run db:migrate`. The migration is repeatable and does not insert fake client data.
4. Configure Clerk and set `CIVIC_EASY_STAFF_IDS` to your user ID from the Clerk dashboard. Use the `civiceasy.com` domain for production.
5. Configure Stripe and the webhook below. Prices default to **9900 USD cents** per permit. Optional server-side price variables let you refine individual services later. No Stripe subscription price is needed for new orders.
6. Configure Resend with a verified `EMAIL_FROM`. New-case and client-reply notifications default to **info@evolvedigitallyllc.com**. Set `CIVIC_EASY_NOTIFY_EMAIL` to change the recipient.
7. Connect a **private** Vercel Blob store and set `BLOB_READ_WRITE_TOKEN`. Documents are downloaded through an authenticated route that checks case ownership/staff access. Files are restricted to PDFs, JPEGs, and PNGs up to 3 MB; they are always served as downloads.
8. Set `NEXT_PUBLIC_APP_URL=https://civiceasy.com` in production and a strong `CRON_SECRET`.
9. Enable the scheduler. `vercel.json` requests a once-per-minute run of `/api/jobs`; this cadence requires a Vercel plan supporting it. Alternatively use your scheduler to call that endpoint every minute with `Authorization: Bearer <CRON_SECRET>` and remove the Vercel cron declaration. Email is queued, not sent in request handlers.
10. Run `npm run dev`.

Checkout stays disabled until database, Stripe, staff assignment, email, app URL, and scheduler credentials are configured. This is a configuration check, not a connectivity check: complete the prelaunch test below before accepting purchases. Uploads show a clear unavailable message until private storage is connected. No production resources are provisioned by the migration.

## Stripe events

Endpoint: `https://civiceasy.com/api/stripe/webhook`

Enable:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `charge.refunded`
- `customer.subscription.updated` and `customer.subscription.deleted` for existing subscribers

Fulfillment checks the signed webhook, paid status, order owner, amount, currency, and checkout session. An order lock and unique order/case relationship prevent duplicate fulfillment. Case creation and the two email jobs commit together. A redirect does not count as payment confirmation. Refunds update payment status and notify operations for manual case review; they do not silently cancel work.

New subscription checkout is retired. Existing subscription portal management and subscription webhooks remain available.

## Notifications and recovery

The outbox worker claims up to five messages per run with a lease, uses the provider's idempotency key, and retries failures with backoff. After eight failed attempts, a message stays in `outbox` with `failed_at` for operator review. Inspect delivery failures with:

```sql
SELECT id, recipient, subject, attempts, failed_at FROM outbox
WHERE failed_at IS NOT NULL ORDER BY failed_at DESC;
```

After correcting the sender/provider configuration, retry a failed message with:

```sql
UPDATE outbox SET failed_at = NULL, attempts = 0, available_at = now(), lease_until = NULL
WHERE id = '<message-id>' AND sent_at IS NULL;
```

The worker also queues one reminder per day for overdue or unassigned cases. Configure scheduler failure alerts in the hosting provider. Email contains links, not private case documents or full client messages.

## Verification

```bash
npm run typecheck
npm test
npm run build
```

Tests use PGlite (real PostgreSQL engine) in memory. They cover fulfillment and transaction rollback, replayed webhooks, incorrect/unpaid payments, ownership checks, internal notes, information requests, assignment, optimistic concurrency, email retry, and reminders. They do not charge cards, send emails, or call government services.

Before launch, exercise Stripe **test mode** end-to-end: purchase → signed webhook → one assigned case → both emails → staff request → client reply/document → filing update → completed. Replay the webhook and verify no duplicates. Verify another customer cannot access the case or document. Test a refund. Then configure matching live credentials and webhook secrets.

## Implementation notes

- The catalog and official resource directory live in `lib/catalog.ts`. Suggestions are preliminary; staff confirms requirements. Review sources periodically and update verification dates.
- Hugo returns structured recommendations. The server resolves prices and URLs from the catalog. Chat history/drafts are saved only in session storage; the reviewed project summary is persisted with the order. Uploaded documents and case notes are never sent to the model.
- Public chat is rate limited to 40 requests per IP per hour in PostgreSQL (in-memory fallback in local development). Production requires the database. Use a trusted proxy that overwrites `X-Forwarded-For`.
- Orders snapshot scope and price so later catalog edits do not alter an existing purchase.
- Private storage has file signatures/type/size validation, but no antivirus scanning. Staff should treat uploaded documents as untrusted files.
- Server APIs enforce owner/staff authorization; hiding a navigation item is not an access control.
- The operations list currently loads the latest 500 cases. Introduce server pagination when volume warrants it.
