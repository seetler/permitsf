# PermitSF

**Live at: https://www.permitsf.com**

A permit tracking and management application for San Francisco residents and businesses, featuring Hugo - an AI assistant powered by OpenAI.

## Tech Stack

- **Framework**: Next.js 16.1.1 (App Router)
- **Language**: TypeScript + React 19
- **Styling**: Tailwind CSS + CSS Variables
- **Auth**: Clerk (@clerk/nextjs)
- **AI**: OpenAI API (openai)
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React
- **Payments**: Stripe (subscriptions)

---

## Project Structure

```
permitsf/
├── app/
│   ├── api/
│   │   ├── chat/route.ts       # OpenAI API endpoint for Hugo
│   │   └── stripe/
│   │       ├── checkout/route.ts  # Creates Stripe checkout session
│   │       ├── webhook/route.ts   # Handles Stripe events
│   │       └── portal/route.ts    # Stripe customer portal
│   ├── hugo/page.tsx           # AI chat assistant (public)
│   ├── permits/
│   │   ├── layout.tsx          # Auth guard wrapper
│   │   └── page.tsx            # Permit dashboard (paywall)
│   ├── profile/
│   │   ├── layout.tsx          # Auth guard wrapper
│   │   └── page.tsx            # User profile + subscription management
│   ├── sign-in/[[...sign-in]]/page.tsx
│   ├── sign-up/[[...sign-up]]/page.tsx
│   ├── globals.css             # Tailwind + CSS variables
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Redirects to /hugo
│
├── components/
│   ├── auth-layout.tsx         # Shared auth guard component
│   ├── sidebar.tsx             # Responsive navigation
│   ├── providers.tsx           # ClerkProvider wrapper
│   ├── paywall-modal.tsx       # Subscription upgrade modal
│   └── ui/                     # shadcn/ui components
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── label.tsx
│       └── textarea.tsx
│
├── lib/utils.ts                # cn() class merge utility
├── middleware.ts               # Clerk auth middleware
└── public/images/hugo.jpg      # Hugo avatar
```

---

## Routes

| Route | Auth | Description |
|-------|------|-------------|
| `/` | No | Redirects to `/hugo` |
| `/hugo` | No | Hugo AI assistant |
| `/permits` | Yes | Permit dashboard (requires subscription) |
| `/profile` | Yes | User profile + subscription management |
| `/sign-in` | No | Clerk sign-in |
| `/sign-up` | No | Clerk sign-up |
| `/api/chat` | No | POST - Hugo AI endpoint |
| `/api/stripe/checkout` | Yes | POST - Create Stripe checkout session |
| `/api/stripe/webhook` | No | POST - Stripe webhook handler |
| `/api/stripe/portal` | Yes | POST - Open Stripe customer portal |

---

## Environment Variables

```bash
# .env.local

# AI
OPENAI_API_KEY=sk-...

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Stripe Payments
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...

# App URL (for Stripe redirects)
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

---

## Getting Started

```bash
npm install
npm run dev      # Development
npm run build    # Production build
npm start        # Production server
```

---

## Features

### Hugo AI Assistant (`/hugo`)
- Chat interface powered by OpenAI API
- Answers SF permit questions with official SF.gov links
- Quick-start prompts for common questions

### Permit Dashboard (`/permits`)
- View permits with status badges (pending, approved, under-review, rejected)
- Search and filter UI
- Requires Premium subscription (paywall for free users)
- *Uses mock data*

### User Profile (`/profile`)
- Personal and business information form
- Subscription status card (Free/Premium)
- Upgrade button for free users
- "Manage Subscription" for Premium users (opens Stripe portal)
- *Profile data stored in Clerk metadata*

### Stripe Subscription
- Monthly subscription ($9.99/month)
- Checkout via Stripe hosted page
- Webhook updates Clerk user metadata on payment events
- Customer portal for subscription management

### Responsive Sidebar
- Desktop: Collapsible sidebar
- Mobile: Overlay drawer with backdrop

---

## Auth Flow

Protected routes (`/permits`, `/profile`) use a shared `AuthLayout` component that:
1. Checks auth state via Clerk's `useAuth()` hook
2. Shows loading state while Clerk initializes
3. Redirects to `/sign-in` if not authenticated

---

## Deployment

Vercel deployment requires:
- `OPENAI_API_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET` (from Stripe Dashboard webhook config)
- `STRIPE_PRICE_ID`
- `NEXT_PUBLIC_APP_URL` (your production URL)

### Stripe Webhook Setup

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://www.permitsf.com/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy the signing secret to `STRIPE_WEBHOOK_SECRET`

**Important:** Use `www.permitsf.com` (not `permitsf.com`) to match the Clerk domain configuration.
