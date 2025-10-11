"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { SubmitPayload, ChannelRating, deleteChannelRating, listChannelRatings, submitChannelRating } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Toaster } from "@/components/ui/sonner"
import { Spinner } from "@/components/ui/spinner"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import Image from "next/image"
import CountUp from "@/components/CountUp"
import { previewYouTube, upsertYouTubeWork, listYouTubeWorks, refreshYouTubeWork, type YouTubeWork, logYouTubeViews, getTotalYouTubeViews } from "@/lib/api"

export default function AdminPage() {
  const [form, setForm] = useState<SubmitPayload>({ youtubeHandle: "", stars: 5, comment: "" })
  const [submitting, setSubmitting] = useState(false)
  const [rows, setRows] = useState<ChannelRating[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [workUrl, setWorkUrl] = useState("")
  const [workNote, setWorkNote] = useState("")
  const [workPreview, setWorkPreview] = useState<Record<string, unknown> | null>(null)
  const [workSaving, setWorkSaving] = useState(false)
  const [works, setWorks] = useState<YouTubeWork[] | null>(null)
  const [refreshingId, setRefreshingId] = useState<number | null>(null)
  const [viewWorkId, setViewWorkId] = useState<number | "">("")
  const [viewUrl, setViewUrl] = useState("")
  const [logging, setLogging] = useState(false)
  const [totalViews, setTotalViews] = useState<number | null>(null)
  const [totalLoading, setTotalLoading] = useState(false)

  const sortedRows = useMemo(() => {
    return (rows ?? []).slice().sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
  }, [rows])

  async function refresh() {
    setLoading(true)
    try {
      const data = await listChannelRatings()
      setRows(data)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to fetch ratings"
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    listYouTubeWorks().then(setWorks).catch(() => setWorks([]))
  }, [])

  useEffect(() => {
    // View logs functionality removed - keeping effect for future use
  }, [viewWorkId, works])

  async function loadTotalViews() {
    setTotalLoading(true)
    try {
      const tv = await getTotalYouTubeViews()
      setTotalViews(tv)
    } catch {
      setTotalViews(0)
    } finally {
      setTotalLoading(false)
    }
  }

  useEffect(() => {
    loadTotalViews()
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.youtubeHandle.trim()) {
      toast.error("YouTube handle is required")
      return
    }
    if (form.stars < 1 || form.stars > 5) {
      toast.error("Stars must be between 1 and 5")
      return
    }
    if (!form.comment.trim()) {
      toast.error("Comment is required")
      return
    }

    setSubmitting(true)
    try {
      await submitChannelRating({
        youtubeHandle: form.youtubeHandle.trim(),
        stars: form.stars,
        comment: form.comment.trim(),
      })
      toast.success("Submitted!")
      setForm({ youtubeHandle: "", stars: 5, comment: "" })
      await refresh()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to submit"
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  async function onDelete(id: number) {
    try {
      await deleteChannelRating(id)
      toast.success("Deleted")
      await refresh()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to delete"
      toast.error(msg)
    }
  }

  return (
    <div className="container mx-auto max-w-6xl p-6 space-y-8">
      <Toaster richColors position="top-right" />

      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Admin Panel</h1>
        <p className="text-muted-foreground">Submit new YouTube channel ratings and manage existing entries.</p>
      </div>
      <Tabs defaultValue="ratings" className="space-y-8">
        <TabsList>
          <TabsTrigger value="ratings">Ratings</TabsTrigger>
          <TabsTrigger value="works">My Works</TabsTrigger>
          <TabsTrigger value="views">Views</TabsTrigger>
        </TabsList>

        <TabsContent value="ratings" className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Submit Channel Rating</CardTitle>
              <CardDescription>POST /api/submit-channel</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="youtubeHandle">YouTube Handle</Label>
                  <Input
                    id="youtubeHandle"
                    placeholder="@mrbeast"
                    value={form.youtubeHandle}
                    onChange={(e) => setForm((f) => ({ ...f, youtubeHandle: e.target.value }))}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="stars">Stars (1-5)</Label>
                  <Input
                    id="stars"
                    type="number"
                    min={1}
                    max={5}
                    value={form.stars}
                    onChange={(e) => setForm((f) => ({ ...f, stars: Number(e.target.value) }))}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="comment">Comment</Label>
                  <Textarea
                    id="comment"
                    placeholder="Your review comment here"
                    value={form.comment}
                    onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit"}
                  </Button>
                  <Badge variant="outline">No auth required</Badge>
                </div>
              </form>
            </CardContent>
          </Card>

          <Separator />

          <Card>
            <CardHeader>
              <CardTitle>Existing Ratings</CardTitle>
              <CardDescription>GET /api/channels and DELETE /api/channels/[id]</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center gap-2 text-muted-foreground"><Spinner /> Loading...</div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[52px]">ID</TableHead>
                        <TableHead>Avatar</TableHead>
                        <TableHead>Handle</TableHead>
                        <TableHead>Channel</TableHead>
                        <TableHead>Subscribers</TableHead>
                        <TableHead>Stars</TableHead>
                        <TableHead>Comment</TableHead>
                        <TableHead className="w-[120px] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground">No ratings yet</TableCell>
                        </TableRow>
                      ) : (
                        sortedRows.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell>{r.id}</TableCell>
                            <TableCell>
                              <Avatar className="h-10 w-10">
                                {r.avatarUrl && r.avatarUrl.trim() !== "" ? (
                                  <AvatarImage src={r.avatarUrl} alt={r.channelName} />
                                ) : null}
                                <AvatarFallback>
                                  {(r.channelName || r.youtubeHandle || "?")
                                    .replace(/^@/, "")
                                    .slice(0, 2)
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            </TableCell>
                            <TableCell>{r.youtubeHandle}</TableCell>
                            <TableCell>{r.channelName}</TableCell>
                            <TableCell>{r.subscriberCount.toLocaleString()}</TableCell>
                            <TableCell>{"★".repeat(r.stars)}</TableCell>
                            <TableCell className="max-w-[360px] truncate" title={r.comment}>{r.comment}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="destructive" size="sm" onClick={() => onDelete(r.id)}>Delete</Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="views" className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Log current views</CardTitle>
              <CardDescription>Fetch current view count via YouTube API and store a snapshot</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="workSelect">Select a saved work (optional)</Label>
                <select
                  id="workSelect"
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                  value={viewWorkId}
                  onChange={(e) => setViewWorkId(e.target.value ? Number(e.target.value) : "")}
                >
                  <option value="">— None —</option>
                  {(works ?? []).map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.video_title || "Untitled"} {w.channel_title ? `— ${w.channel_title}` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="viewUrl">Or paste YouTube URL</Label>
                <Input id="viewUrl" placeholder="https://www.youtube.com/watch?v=..." value={viewUrl} onChange={(e) => setViewUrl(e.target.value)} />
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  disabled={logging || (!viewWorkId && !viewUrl.trim())}
                  onClick={async () => {
                    setLogging(true)
                    try {
                      if (viewWorkId) {
                        await logYouTubeViews({ work_id: Number(viewWorkId) })
                      } else if (viewUrl.trim()) {
                        await logYouTubeViews({ youtube_url: viewUrl.trim() })
                      }
                      await loadTotalViews()
                      toast.success("Logged views")
                    } catch (e: unknown) {
                      const msg = e instanceof Error ? e.message : "Failed to log views"
                      toast.error(msg)
                    } finally {
                      setLogging(false)
                    }
                  }}
                >
                  {logging ? "Logging..." : "Log Now"}
                </Button>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Total views stored in logs (global)</div>
                {totalLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground"><Spinner /> Loading...</div>
                ) : (
                  <div className="rounded-md border p-6 flex items-center justify-between">
                    <div className="text-lg font-medium">Total views</div>
                    <div className="group inline-block">
                      <CountUp
                        to={totalViews ?? 0}
                        separator="," 
                        className="text-3xl font-bold transition-all duration-300 will-change-transform will-change-auto group-hover:tracking-wide group-hover:scale-105 group-hover:text-primary"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="works" className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Add a YouTube link</CardTitle>
              <CardDescription>Preview details via YouTube API and save to Supabase</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="youtubeUrl">YouTube URL</Label>
                <Input id="youtubeUrl" placeholder="https://www.youtube.com/watch?v=..." value={workUrl} onChange={(e) => setWorkUrl(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="note">Note</Label>
                <Textarea id="note" placeholder="Optional note" value={workNote} onChange={(e) => setWorkNote(e.target.value)} />
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={async () => {
                    try {
                      const p = await previewYouTube(workUrl)
                      setWorkPreview(p)
                      toast.success("Preview loaded")
                    } catch (e: unknown) {
                      const msg = e instanceof Error ? e.message : "Failed to preview"
                      toast.error(msg)
                    }
                  }}
                >
                  Preview
                </Button>
                <Button
                  type="button"
                  disabled={workSaving}
                  onClick={async () => {
                    setWorkSaving(true)
                    try {
                      await upsertYouTubeWork({ youtube_url: workUrl, note: workNote, preview: workPreview })
                      toast.success("Saved")
                      setWorkUrl("")
                      setWorkNote("")
                      setWorkPreview(null)
                      const list = await listYouTubeWorks()
                      setWorks(list)
                    } catch (e: unknown) {
                      const msg = e instanceof Error ? e.message : "Failed to save"
                      toast.error(msg)
                    } finally {
                      setWorkSaving(false)
                    }
                  }}
                >
                  {workSaving ? "Saving..." : "Save"}
                </Button>
              </div>

              {workPreview ? (
                <div className="grid grid-cols-1 sm:grid-cols-[320px_1fr] gap-4 rounded-lg border p-4">
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
                    {workPreview.thumbnail_url ? (
                      <Image src={workPreview.thumbnail_url} alt={workPreview.video_title} fill className="object-cover" />
                    ) : null}
                  </div>
                  <div className="space-y-1">
                    <div className="font-medium">{workPreview.video_title}</div>
                    <div className="text-sm text-muted-foreground">{workPreview.channel_title}</div>
                    <div className="text-sm text-muted-foreground">{workPreview.view_count?.toLocaleString?.() || workPreview.view_count} views</div>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>Existing Works</CardTitle>
                  <CardDescription>GET /api/youtube/works</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!works || works.length === 0 || refreshingId !== null}
                  onClick={async () => {
                    if (!works || works.length === 0) return
                    try {
                      toast.message("Refreshing all works...")
                      // Process sequentially to be gentle with quotas/rate limits
                      for (const w of works) {
                        setRefreshingId(w.id)
                        try {
                          await refreshYouTubeWork(w.id)
                        } catch {
                          // continue on error, individual toasts below
                        }
                      }
                      const list = await listYouTubeWorks()
                      setWorks(list)
                      toast.success("All works refreshed")
                    } catch (e: unknown) {
                      const msg = e instanceof Error ? e.message : "Failed to refresh all"
                      toast.error(msg)
                    } finally {
                      setRefreshingId(null)
                    }
                  }}
                >
                  {refreshingId !== null ? "Refreshing..." : "Refresh All"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!works || works.length === 0 ? (
                <div className="text-muted-foreground">No works</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {works.map((w) => (
                    <Card key={w.id} className="overflow-hidden">
                      {w.thumbnail_url ? (
                        <div className="relative aspect-video">
                          <Image src={w.thumbnail_url} alt={w.video_title || ""} fill className="object-cover" />
                        </div>
                      ) : null}
                      <CardHeader>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <CardTitle className="truncate text-base">{w.video_title || "Untitled video"}</CardTitle>
                            <CardDescription className="truncate">{w.channel_title || "Unknown channel"}</CardDescription>
                          </div>
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={refreshingId === w.id}
                            onClick={async () => {
                              try {
                                setRefreshingId(w.id)
                                await refreshYouTubeWork(w.id)
                                const list = await listYouTubeWorks()
                                setWorks(list)
                                toast.success("Updated")
                              } catch (e: unknown) {
                                const msg = e instanceof Error ? e.message : "Failed to update"
                                toast.error(msg)
                              } finally {
                                setRefreshingId(null)
                              }
                            }}
                          >
                            {refreshingId === w.id ? "Updating..." : "Update Info"}
                          </Button>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
