import { readFile } from "fs/promises"
import path from "path"

let cached: Set<string> | null = null

export async function getAdminAllowlist(): Promise<Set<string>> {
  if (cached) return cached
  const fp = path.join(process.cwd(), "admins.json")
  try {
    const raw = await readFile(fp, "utf-8")
    const list = JSON.parse(raw) as unknown
    if (Array.isArray(list)) {
      cached = new Set(list.filter((v) => typeof v === "string").map((e) => e.toLowerCase()))
      return cached
    }
  } catch {
    // ignore, fallthrough to empty set
  }
  cached = new Set()
  return cached
}

export async function isEmailAllowed(email: string | null | undefined): Promise<boolean> {
  if (!email) return false
  const set = await getAdminAllowlist()
  return set.has(email.toLowerCase())
}
