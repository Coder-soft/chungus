import { ReactNode } from "react"
import { redirect } from "next/navigation"
import { isEmailAllowed } from "@/lib/admins"
import { createClient as createServerClient } from "@/lib/supabase/server"

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const allowed = await isEmailAllowed(user.email)
  if (!allowed) {
    redirect("/")
  }

  return <>{children}</>
}
