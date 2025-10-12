"use client";

import { useEffect, useRef, useState } from "react";
import type React from "react";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Sun, Moon } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import Image from "next/image";
import Link from "next/link";
import GradualBlur from "@/components/GradualBlur";
import LogoLoop, { type LogoItem } from "@/components/LogoLoop";
import CountUp from "@/components/CountUp";
import { listChannelRatings, type ChannelRating, listYouTubeWorks, type YouTubeWork, getTotalYouTubeViews } from "@/lib/api";
import ShinyText from "@/components/ShinyText";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function Home() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [ratings, setRatings] = useState<ChannelRating[] | null>(null);
  const [works, setWorks] = useState<YouTubeWork[] | null>(null);
  const [totalViews, setTotalViews] = useState<number | null>(null);
  const [totalLoading, setTotalLoading] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const scrollToClientVoice = () => {
    const el = document.getElementById("client-voice");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
    const preferred = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const initial = (stored === "dark" || stored === "light") ? stored : preferred;
    setTheme(initial as "light" | "dark");
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    try { localStorage.setItem("theme", next); } catch {}
  };

  


  const clientCards: LogoItem[] = ratings ? ratings.map((r) => ({
        title: `${r.channelName} – ${r.subscriberCount.toLocaleString()} subscribers`,
        node: (
          <Card className="w-[240px] sm:w-[360px] rounded-2xl border shadow-md bg-card text-foreground">
            <CardHeader className="flex flex-row items-start gap-2 sm:gap-4">
              {(() => {
                const raw = (r.avatarUrl || "").trim();
                const src = raw ? (raw.startsWith("//") ? `https:${raw}` : raw) : "";
                return (
                  <Avatar className="h-10 w-10 overflow-hidden">
                    {src ? <AvatarImage src={src} alt={r.channelName} /> : null}
                  </Avatar>
                );
              })()}
              <div className="grid gap-1">
                <CardTitle className="text-sm sm:text-lg">{r.channelName}</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">{r.subscriberCount.toLocaleString()} subscribers</CardDescription>
                <div className="flex items-center gap-1 pt-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={
                        "h-3 w-3 sm:h-4 sm:w-4 " + (i < r.stars ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground")
                      }
                    />
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardFooter className="pt-0">
              <p className="text-xs sm:text-sm leading-6 text-muted-foreground line-clamp-3 sm:line-clamp-4">{r.comment}</p>
            </CardFooter>
          </Card>
        ),
      })) : [];

  useEffect(() => {
    // Fetch public reviews
    listChannelRatings()
      .then((data) => setRatings(data))
      .catch(() => setRatings([]));
    // Fetch youtube works
    listYouTubeWorks()
      .then((data) => setWorks(data))
      .catch(() => setWorks([]));
    // Fetch global total views from DB logs
    (async () => {
      setTotalLoading(true);
      try {
        const tv = await getTotalYouTubeViews();
        setTotalViews(tv);
      } catch {
        setTotalViews(0);
      } finally {
        setTotalLoading(false);
      }
    })();
    const v = videoRef.current;
    if (!v) return;
    const tryPlay = async () => {
      try {
        // Ensure muted before attempting autoplay
        v.muted = true;
        await v.play();
      } catch {
        // Autoplay may be blocked; keep muted and rely on user gesture
      }
    };
    const onLoaded = () => tryPlay();
    const onCanPlay = () => tryPlay();
    const onEnded = () => {
      // Manual loop to avoid encoder black frames at tail
      v.currentTime = 0;
      void v.play();
    };
    const onTimeUpdate = () => {
      // Jump slightly before end to prevent black flash between loops
      const remaining = v.duration - v.currentTime;
      if (isFinite(remaining) && remaining > 0 && remaining < 0.12) {
        v.currentTime = 0.01;
        void v.play();
      }
    };

    if (v.readyState >= 1) onLoaded();
    else v.addEventListener("loadedmetadata", onLoaded, { once: true });
    v.addEventListener("canplay", onCanPlay);
    v.addEventListener("ended", onEnded);
    v.addEventListener("timeupdate", onTimeUpdate);
    return () => {
      v.removeEventListener("loadedmetadata", onLoaded);
      v.removeEventListener("canplay", onCanPlay);
      v.removeEventListener("ended", onEnded);
      v.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, []);

  return (
    <>
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border shadow-lg rounded-full px-2 py-1 sm:px-3 sm:py-1.5 max-w-[95vw]">
        <ul className="flex items-center gap-1 whitespace-nowrap overflow-x-auto">
          <li>
            <Avatar className="h-8 w-8 ring-2 ring-primary/20">
              <AvatarImage src="/image.png" alt="Chungus" />
              <AvatarFallback>CH</AvatarFallback>
            </Avatar>
          </li>
          <li>
            <button onClick={() => scrollToId('home')} className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm hover:bg-muted">Home</button>
          </li>
          <li>
            <button onClick={() => scrollToId('client-voice')} className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm hover:bg-muted">Clients</button>
          </li>
          <li>
            <button onClick={() => scrollToId('total-views')} className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm hover:bg-muted">Views</button>
          </li>
          <li>
            <button onClick={() => scrollToId('works')} className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm hover:bg-muted">Works</button>
          </li>
          <li>
            <button onClick={() => scrollToId('contact')} className="px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm hover:bg-muted">Contact</button>
          </li>
          <li>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggleTheme}
                  aria-label="Toggle theme"
                  className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted"
                >
                  {theme === "dark" ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent sideOffset={6}>Toggle theme</TooltipContent>
            </Tooltip>
          </li>
        </ul>
      </nav>
      {/* Hero section with video background */}
      <section id="home" className="min-h-[85vh] sm:min-h-screen text-foreground flex items-center justify-center p-6 sm:p-10 relative overflow-hidden">
        {/* Background video: always render, no image fallback */}
        <video
          className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover"
          ref={videoRef}
          autoPlay
          muted
          playsInline
          preload="auto"
          loop
          controls={false}
          aria-hidden="true"
          src="/mouseryvidezcoldkid.mp4"
        />

        <main className="w-full max-w-md sm:max-w-lg relative z-10">
          <Card className="rounded-2xl border shadow-sm text-center gap-4 bg-background/70 backdrop-blur-sm">
            <CardHeader className="flex flex-col items-center gap-3 px-6 pt-8">
              <Avatar className="h-24 w-24 rounded-full ring-2 ring-primary/20">
                <AvatarImage src="/image.png" alt="Chungus" />
                <AvatarFallback className="bg-muted text-primary font-semibold">CH</AvatarFallback>
              </Avatar>
              <div className="grid gap-2">
                <CardTitle className="text-3xl">ChungusFX</CardTitle>
                <CardDescription className="text-base">
                  Video editor
                </CardDescription>
              </div>
            </CardHeader>
            <CardFooter className="justify-center pt-2 pb-8 px-6">
              <Button 
                className="rounded-full px-6 py-2" 
                size="lg" 
                onClick={scrollToClientVoice}
              >
                View clients
              </Button>
            </CardFooter>
          </Card>
        </main>

        {/* Header gradient fixed to page */}
        <header className="pointer-events-none absolute inset-x-0 top-0 h-16 z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 to-transparent" />
          <GradualBlur preset="page-header" target="page" height="4rem" strength={3} opacity={1} />
        </header>

        {/* Footer gradient scoped to hero only */}
        <footer className="pointer-events-none absolute inset-x-0 bottom-0 h-16 z-10">
          <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
          <GradualBlur preset="page-footer" height="4rem" strength={3} opacity={1} />
        </footer>
      </section>

      {/* Client Voice section */}
      <section id="client-voice" className="relative min-h-[85vh] sm:min-h-screen w-full bg-background text-foreground flex items-center justify-center">
        <div className="mx-auto max-w-6xl px-6 sm:px-10 pt-12 pb-6 sm:pt-16 sm:pb-10 w-full">
          <h2 className="text-2xl sm:text-3xl font-semibold mb-8 text-center">Testimonials</h2>
          <LogoLoop
            logos={clientCards}
            speed={120}
            direction="left"
            width="100%"
            logoHeight={180}
            gap={16}
            pauseOnHover
            fadeOut
            fadeOutColor="var(--background)"
            scaleOnHover
            ariaLabel="Client testimonials"
          />
        </div>
      </section>

      {/* Total Views Racked Up section */}
      <section id="total-views" className="relative min-h-[85vh] sm:min-h-screen w-full bg-background text-foreground flex items-center">
        <div className="mx-auto max-w-6xl px-6 sm:px-10 pt-6 pb-12 sm:pt-10 sm:pb-16">
          <h3 className="text-2xl sm:text-3xl font-semibold mb-8 text-center">Total Views Racked Up</h3>
          <div className="grid grid-cols-1 sm:grid-cols-1 gap-6">
            <div className="rounded-2xl border shadow-sm bg-card p-6 text-center">
              <div className="text-xs sm:text-sm text-muted-foreground mb-2">Total Views</div>
              {totalLoading ? (
                <div className="text-muted-foreground">Loading...</div>
              ) : (
                <div className="group inline-block">
                  <CountUp
                    to={totalViews ?? 0}
                    duration={2}
                    separator="," 
                    className="text-3xl sm:text-4xl font-bold transition-all duration-300 will-change-transform will-change-auto group-hover:tracking-wide group-hover:scale-105 group-hover:text-primary"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* My works section */}
      <section id="works" className="relative min-h-[85vh] sm:min-h-screen w-full bg-background text-foreground flex items-center">
        <div className="mx-auto max-w-6xl px-6 sm:px-10 py-12 sm:py-16 w-full">
          <h3 className="text-2xl sm:text-3xl font-semibold mb-8 text-center">My works</h3>
          {!works || works.length === 0 ? (
            <div className="text-center text-muted-foreground">No works yet</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {works.map((w) => (
                <Card key={w.id} className="rounded-2xl border shadow-sm bg-card overflow-hidden p-0">
                  {w.thumbnail_url ? (
                    <div className="relative aspect-video w-full overflow-hidden">
                      <Image
                        src={w.thumbnail_url}
                        alt={w.video_title || "YouTube thumbnail"}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 33vw"
                        priority={false}
                      />
                    </div>
                  ) : null}
                  <CardHeader className="flex flex-row items-center gap-3 p-6">
                    <Avatar className="h-10 w-10">
                      {w.channel_avatar_url ? (
                        <AvatarImage src={w.channel_avatar_url} alt={w.channel_title || "Channel"} />
                      ) : null}
                      <AvatarFallback>{(w.channel_title || "?").slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <CardTitle className="truncate text-base">{w.video_title || "Untitled video"}</CardTitle>
                      <CardDescription className="truncate">{w.channel_title || "Unknown channel"}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardFooter className="flex items-center justify-between gap-3">
                    <div className="text-sm text-muted-foreground">
                      {w.view_count.toLocaleString()} views
                    </div>
                    <Link
                      href={w.youtube_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={buttonVariants({ variant: "link", size: "sm", className: "uppercase px-0" })}
                    >
                      YOUTUBE
                    </Link>
                  </CardFooter>
                  {w.note ? (
                    <div className="px-6 pb-6 text-sm text-muted-foreground">{w.note}</div>
                  ) : null}
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Contact section */}
      <section id="contact" className="relative min-h-[85vh] sm:min-h-screen w-full bg-background text-foreground flex items-center">
        <div className="mx-auto max-w-6xl px-6 sm:px-10 py-12 sm:py-16 w-full">
          <h3 className="text-2xl sm:text-3xl font-semibold mb-8 text-center">Contact</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="overflow-hidden rounded-2xl border shadow-sm bg-card p-0">
              <div className="relative w-full h-28 sm:h-36 overflow-hidden">
                <Image src="/imagecopy.png" alt="X cover" fill className="object-cover" priority={false} />
                <div className="absolute bottom-3 left-3">
                  <div className="relative">
                    <Avatar className="h-12 w-12 ring-3 ring-foreground bg-card">
                      <AvatarImage src="/image.png" alt="Chungus" />
                      <AvatarFallback>CH</AvatarFallback>
                    </Avatar>
                    <span className="absolute -bottom-0 -right-1 h-3 w-3 rounded-full bg-green-500 ring-2 ring-background" />
                  </div>
                </div>
              </div>
              <div className="p-4 flex flex-col gap-2">
                <div className="min-w-0">
                  <CardTitle className="truncate text-sm">Reach me on X</CardTitle>
                  <CardDescription className="text-xs line-clamp-2">Fast replies. Business inquiries welcomed.</CardDescription>
                </div>
                <div className="pt-1">
                  <Button asChild size="sm" className="bg-black text-white hover:bg-black/90">
                    <a href="https://x.com/chungusfx" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                      <Image src="/X.svg" alt="X" width={18} height={18} />
                      <span>Message on X</span>
                    </a>
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="overflow-hidden rounded-2xl border shadow-sm bg-card p-0">
              <div className="relative w-full h-28 sm:h-36 overflow-hidden">
                <Image src="/imagecopy.png" alt="Discord cover" fill className="object-cover" priority={false} />
                <div className="absolute bottom-3 left-3">
                  <div className="relative">
                    <Avatar className="h-12 w-12 ring-3 ring-foreground bg-card">
                      <AvatarImage src="/image.png" alt="Chungus" />
                      <AvatarFallback>CH</AvatarFallback>
                    </Avatar>
                    <span className="absolute -bottom-0 -right-1 h-3 w-3 rounded-full bg-green-500 ring-2 ring-background" />
                  </div>
                </div>
              </div>
              <div className="p-4 flex flex-col gap-2">
                <div className="min-w-0">
                  <CardTitle className="truncate text-sm">Ask me on Discord</CardTitle>
                  <CardDescription className="text-xs line-clamp-2">Ask or share ideas, with me to get started with your next banger!</CardDescription>
                </div>
                <div className="pt-1">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-[#5865F2] text-white hover:bg-[#4752C4] flex items-center gap-2">
                        <Image src="/discord.svg" alt="Discord" width={18} height={18} />
                        <span>Open Discord</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Open Discord</DialogTitle>
                        <DialogDescription>Choose where to open Discord.</DialogDescription>
                      </DialogHeader>
                      <DialogFooter className="sm:justify-between">
                        <DialogClose asChild>
                          <Button
                            variant="secondary"
                            onClick={() => window.open("https://discord.com/users/1389514011078299760", "_blank", "noopener")}
                          >
                            Open in Web
                          </Button>
                        </DialogClose>
                        <DialogClose asChild>
                          <Button
                            className="bg-[#5865F2] text-white hover:bg-[#4752C4]"
                            onClick={() => {
                              window.location.href = "discord://discord.com/";
                            }}
                          >
                            Open in App
                          </Button>
                        </DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <footer className="w-full py-16 border-t bg-background/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Copyright © <span className="font-semibold">Coder-Soft</span>
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            Powered by <ShinyText text="Coder-Soft" speed={3} className="inline-block text-base font-semibold" />
          </div>
        </div>
      </footer>
    </>
  );
}

