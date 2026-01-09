# PermitSF

A permit tracking and management application for San Francisco residents and businesses, featuring Hugo - an AI assistant powered by Claude.

## Tech Stack

- **Framework**: Next.js 16.1.1 (App Router)
- **Language**: TypeScript + React 19
- **Styling**: Tailwind CSS + CSS Variables
- **Auth**: Clerk (@clerk/nextjs)
- **AI**: Anthropic Claude API (@anthropic-ai/sdk)
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React

---

## Project Structure

```
permitsf/
├── app/
│   ├── api/chat/route.ts       # Claude API endpoint for Hugo
│   ├── hugo/page.tsx           # AI chat assistant (public)
│   ├── permits/
│   │   ├── layout.tsx          # Auth guard wrapper
│   │   └── page.tsx            # Permit dashboard (protected)
│   ├── profile/
│   │   ├── layout.tsx          # Auth guard wrapper
│   │   └── page.tsx            # User profile form (protected)
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
│   └── ui/                     # shadcn/ui components
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── label.tsx
│       └── textarea.tsx
│
├── lib/utils.ts                # cn() class merge utility
└── public/images/hugo.jpg      # Hugo avatar
```

---

## Routes

| Route | Auth | Description |
|-------|------|-------------|
| `/` | No | Redirects to `/hugo` |
| `/hugo` | No | Hugo AI assistant |
| `/permits` | Yes | Permit dashboard |
| `/profile` | Yes | User profile |
| `/sign-in` | No | Clerk sign-in |
| `/sign-up` | No | Clerk sign-up |
| `/api/chat` | No | POST - Hugo AI endpoint |

---

## Environment Variables

```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
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
- Chat interface powered by Claude API
- Answers SF permit questions with official SF.gov links
- Quick-start prompts for common questions

### Permit Dashboard (`/permits`)
- View permits with status badges (pending, approved, under-review, rejected)
- Search and filter UI
- *Uses mock data*

### User Profile (`/profile`)
- Personal and business information form
- *Uses mock data, no persistence*

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
- `ANTHROPIC_API_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
