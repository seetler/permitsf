import { AuthLayout } from "@/components/auth-layout"

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <AuthLayout>{children}</AuthLayout>
}
