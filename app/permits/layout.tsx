import { AuthLayout } from "@/components/auth-layout"

export default function PermitsLayout({ children }: { children: React.ReactNode }) {
  return <AuthLayout>{children}</AuthLayout>
}
