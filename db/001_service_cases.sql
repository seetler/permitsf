CREATE TABLE IF NOT EXISTS orders (
 id uuid PRIMARY KEY, user_id text NOT NULL, email text NOT NULL, request_key uuid NOT NULL,
 service_id text NOT NULL, service_name text NOT NULL, scope text NOT NULL, amount integer NOT NULL CHECK(amount >= 50),
 currency text NOT NULL DEFAULT 'usd', objective text NOT NULL, project_address text NOT NULL,
 accepted_at timestamptz NOT NULL DEFAULT now(), terms_version text NOT NULL DEFAULT '2026-09-18',
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','paid','refunded','partially_refunded')),
 stripe_session_id text UNIQUE, stripe_payment_id text UNIQUE,
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id, request_key)
);
CREATE TABLE IF NOT EXISTS cases (
 id uuid PRIMARY KEY, order_id uuid NOT NULL UNIQUE REFERENCES orders(id),
 status text NOT NULL DEFAULT 'received' CHECK(status IN ('received','in_progress','action_needed','filed','completed','cancelled')),
 assignee_id text, next_action text NOT NULL DEFAULT 'Review the project and contact the client',
 follow_up_at timestamptz, version integer NOT NULL DEFAULT 1,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS case_events (
 id uuid PRIMARY KEY, case_id uuid NOT NULL REFERENCES cases(id), actor_id text NOT NULL,
 kind text NOT NULL CHECK(kind IN ('message','note','status','request','document','application')),
 body text NOT NULL, internal boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS applications (
 id uuid PRIMARY KEY, case_id uuid NOT NULL REFERENCES cases(id), department text NOT NULL,
 permit_name text NOT NULL, reference text NOT NULL DEFAULT '', status text NOT NULL DEFAULT 'preparing'
 CHECK(status IN ('preparing','submitted','corrections','approved','denied','withdrawn')), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS documents (
 id uuid PRIMARY KEY, case_id uuid NOT NULL REFERENCES cases(id), uploader_id text NOT NULL,
 name text NOT NULL, pathname text NOT NULL UNIQUE, content_type text NOT NULL, size integer NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS outbox (
 id uuid PRIMARY KEY, dedupe_key text NOT NULL UNIQUE, recipient text NOT NULL, subject text NOT NULL, body text NOT NULL,
 attempts integer NOT NULL DEFAULT 0, available_at timestamptz NOT NULL DEFAULT now(),
 lease_id uuid, lease_until timestamptz, sent_at timestamptz, failed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS rate_limits (key text PRIMARY KEY, hits integer NOT NULL DEFAULT 1, expires_at timestamptz NOT NULL);
CREATE INDEX IF NOT EXISTS orders_owner_idx ON orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS cases_follow_up_idx ON cases(follow_up_at);
CREATE INDEX IF NOT EXISTS case_events_case_idx ON case_events(case_id, created_at);
CREATE INDEX IF NOT EXISTS applications_case_idx ON applications(case_id);
CREATE INDEX IF NOT EXISTS documents_case_idx ON documents(case_id);
CREATE INDEX IF NOT EXISTS outbox_due_idx ON outbox(available_at) WHERE sent_at IS NULL AND failed_at IS NULL;
