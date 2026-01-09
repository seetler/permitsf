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
├── app/                        # Next.js App Router (pages & API)
│   ├── api/
│   │   └── chat/
│   │       └── route.ts        # Claude API endpoint for Hugo assistant
│   ├── hugo/
│   │   └── page.tsx            # AI chat assistant (public)
│   ├── permits/
│   │   ├── layout.tsx          # Auth guard (redirects to /sign-in)
│   │   └── page.tsx            # Permit dashboard (protected)
│   ├── profile/
│   │   ├── layout.tsx          # Auth guard (redirects to /sign-in)
│   │   └── page.tsx            # User profile form (protected)
│   ├── sign-in/
│   │   └── [[...sign-in]]/
│   │       └── page.tsx        # Clerk sign-in page
│   ├── sign-up/
│   │   └── [[...sign-up]]/
│   │       └── page.tsx        # Clerk sign-up page
│   ├── globals.css             # Tailwind base + CSS variables
│   ├── layout.tsx              # Root layout (ClerkProvider + Sidebar)
│   └── page.tsx                # Homepage (redirects to /hugo)
│
├── components/
│   ├── sidebar.tsx             # Main navigation (responsive)
│   ├── providers.tsx           # ClerkProvider wrapper
│   └── ui/                     # shadcn/ui components (only used ones listed)
│       ├── badge.tsx           # Status badges for permits
│       ├── button.tsx          # Buttons throughout app
│       ├── card.tsx            # Card containers
│       ├── input.tsx           # Text inputs
│       ├── label.tsx           # Form labels
│       └── textarea.tsx        # Multi-line text input
│
├── lib/
│   └── utils.ts                # cn() - Tailwind class merge utility
│
├── public/
│   └── images/
│       └── hugo.jpg            # Hugo assistant avatar
│
└── Configuration Files
    ├── .env.local              # Environment variables (git-ignored)
    ├── .npmrc                  # npm config (legacy-peer-deps)
    ├── components.json         # shadcn/ui config
    ├── next.config.mjs         # Next.js config
    ├── package.json            # Dependencies
    ├── postcss.config.mjs      # PostCSS config
    ├── tailwind.config.ts      # Tailwind config
    └── tsconfig.json           # TypeScript config
```

---

## Routes

| Route | Auth Required | Description |
|-------|---------------|-------------|
| `/` | No | Redirects to `/hugo` |
| `/hugo` | No | Hugo AI assistant chat interface |
| `/permits` | Yes | Permit tracking dashboard |
| `/profile` | Yes | User profile management |
| `/sign-in` | No | Clerk authentication |
| `/sign-up` | No | Clerk registration |
| `/api/chat` | No | POST endpoint for Hugo AI responses |

---

## Environment Variables

Create a `.env.local` file with:

```bash
# Anthropic API
ANTHROPIC_API_KEY=sk-ant-...

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

---

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

---

## Key Features

### 1. Hugo AI Assistant (`/hugo`)
- Chat interface powered by Claude API
- Answers questions about SF permit requirements
- Provides links to official SF.gov resources
- Suggested quick prompts for common questions

### 2. Permit Dashboard (`/permits`)
- View all submitted permits
- Track permit status (pending, approved, under-review, rejected)
- Search and filter permits
- **Note**: Currently uses mock data

### 3. User Profile (`/profile`)
- Personal information management
- Business details
- **Note**: Currently uses mock data (no persistence)

### 4. Responsive Sidebar
- Desktop: Collapsible sidebar
- Mobile: Overlay drawer with backdrop
- Shows user info when signed in

---

## Authentication Flow

Uses Clerk for authentication:

1. **Public routes**: `/`, `/hugo`, `/sign-in`, `/sign-up`
2. **Protected routes**: `/permits`, `/profile`
3. **Auth guard**: Layout components use `useAuth()` hook and redirect to `/sign-in` if not authenticated

---

## Styling System

### CSS Variables (defined in `globals.css`)

```css
--background, --foreground
--card, --card-foreground
--primary, --primary-foreground
--secondary, --secondary-foreground
--muted, --muted-foreground
--accent, --accent-foreground
--destructive, --destructive-foreground
--border, --input, --ring
```

### Tailwind Utilities

- `cn()` function in `lib/utils.ts` merges Tailwind classes
- Uses `clsx` + `tailwind-merge` for conflict resolution

---

## Cleanup Summary

The following were identified as unused and candidates for removal:

### Unused Files
| File | Reason |
|------|--------|
| `context/auth-context.tsx` | Replaced by Clerk |
| `components/protected-route.tsx` | Replaced by layout guards |
| `components/theme-provider.tsx` | Dark mode not implemented |
| `hooks/use-mobile.tsx` | Not used anywhere |
| `hooks/use-toast.ts` | Not used anywhere |
| `styles/globals.css` | Duplicate of `app/globals.css` |
| `app/permits/loading.tsx` | Empty file (returns null) |
| `public/placeholder-*` | Unused placeholder images |

### Unused UI Components (in `components/ui/`)
Many shadcn/ui components were installed but never used. Only the following are actively used:
- `badge.tsx`, `button.tsx`, `card.tsx`, `input.tsx`, `label.tsx`, `textarea.tsx`

### Unused Dependencies
- `recharts`, `next-themes`, `embla-carousel-react`, `date-fns`
- `react-resizable-panels`, `cmdk`, `input-otp`, `vaul`, `react-day-picker`

---

## Deployment

Deployed on Vercel. Required environment variables:
- `ANTHROPIC_API_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL`

---

## License

Private project.
