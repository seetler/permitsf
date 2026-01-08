# PermitSF

A permit tracking and management application for San Francisco residents and businesses.

## Features

- **Hugo AI Assistant** (`/hugo`) - Chat with an AI assistant powered by Claude to understand what permits you need for your project. No login needed.

- **My Permits Dashboard** (`/permits`) - Track all your permit applications with status, department info, and documents. Login Required.

- **User Profile** (`/profile`) - Manage your personal and business information. Login Required

## Tech Stack

- Next.js 16
- React 19
- Tailwind CSS
- Radix UI components
- Anthropic Claude API

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env.local` file with your Anthropic API key:
   ```
   ANTHROPIC_API_KEY=your-api-key-here
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key for the Hugo AI assistant |

## Project Structure

```
app/
├── api/chat/       # Claude API route for Hugo
├── hugo/           # AI assistant page
├── permits/        # Permits dashboard
├── profile/        # User profile page
└── layout.tsx      # Root layout with sidebar
components/
├── ui/             # Reusable UI components
└── sidebar.tsx     # Navigation sidebar
```
