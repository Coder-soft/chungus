"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
  const [loading, setLoading] = useState(false)

  async function signInWithDiscord() {
    const supabase = createClient()
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "discord",
        options: {
          scopes: "identify email",
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (e) {
      // no-op; consider showing a toast if you have one globally
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="w-full max-w-sm border rounded-lg p-6 space-y-4">
        <h1 className="text-xl font-semibold">Sign in</h1>
        <p className="text-sm text-muted-foreground">Use your Discord account to continue.</p>
        <Button onClick={signInWithDiscord} disabled={loading} className="w-full">
          {loading ? "Redirecting..." : "Continue with Discord"}
        </Button>
      </div>
    </div>
  )
}
