"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import GradualBlur from "@/components/GradualBlur";
import LogoLoop, { type LogoItem } from "@/components/LogoLoop";
import CountUp from "@/components/CountUp";
import { listChannelRatings, type ChannelRating, listYouTubeWorks, type YouTubeWork } from "@/lib/api";

export default function Home() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [ratings, setRatings] = useState<ChannelRating[] | null>(null);
  const [works, setWorks] = useState<YouTubeWork[] | null>(null);
  const scrollToClientVoice = () => {
    const el = document.getElementById("client-voice");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };


  const clientCards: LogoItem[] = ratings ? ratings.map((r) => ({
        title: `${r.channelName} – ${r.youtubeHandle}`,
        node: (
          <Card className="w-[320px] sm:w-[360px] rounded-2xl border shadow-md bg-white text-black">
            <CardHeader className="flex flex-row items-start gap-4">
              {(() => {
                const raw = (r.avatarUrl || "").trim();
                const src = raw
                  ? raw.startsWith("http")
                    ? raw
                    : raw.startsWith("//")
                      ? `https:${raw}`
                      : raw
                  : "";
                if (src) {
                  return (
                    <Image
                      src={src}
                      alt={r.channelName}
                      width={20}
                      height={20}
                      className="h-5 w-5 rounded-full object-cover"
                      unoptimized
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                        const el = document.getElementById(`initials-${r.id}`);
                        if (el) el.style.display = "flex";
                      }}
                    />
                  );
                }
                return (
                  <div
                    id={`initials-${r.id}`}
                    className="h-5 w-5 rounded-full bg-muted flex items-center justify-center font-semibold"
                  >
                    {(r.channelName || r.youtubeHandle || "?").replace(/^@/, "").slice(0, 2).toUpperCase()}
                  </div>
                );
              })()}
              <div className="grid gap-1">
                <CardTitle className="text-lg">{r.channelName}</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">{r.youtubeHandle}</CardDescription>
                <div className="flex items-center gap-1 pt-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={
                        "h-4 w-4 " + (i < r.stars ? "text-yellow-500 fill-yellow-500" : "text-gray-300")
                      }
                    />
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardFooter className="pt-0">
              <p className="text-sm leading-6 text-gray-700 line-clamp-4">{r.comment}</p>
            </CardFooter>
          </Card>
        ),
      })) : [];

  useEffect(() => {
    setMounted(true);
    // Fetch public reviews
    listChannelRatings()
      .then((data) => setRatings(data))
      .catch(() => setRatings([]));
    // Fetch youtube works
    listYouTubeWorks()
      .then((data) => setWorks(data))
      .catch(() => setWorks([]));
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
      v.removeEventListener("loadedmetadata", onLoaded as any);
      v.removeEventListener("canplay", onCanPlay);
      v.removeEventListener("ended", onEnded);
      v.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, []);
  return (
    <>
      {/* Hero section with video background */}
      <section className="min-h-screen text-foreground flex items-center justify-center p-6 sm:p-10 relative overflow-hidden">
        {/* Background video: scoped to hero section only */}
        {mounted ? (
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
            poster="/image.png"
            src="/mouseryvidezcoldkid.mp4"
          />
        ) : (
          <div
            className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover bg-center bg-cover"
            style={{ backgroundImage: 'url(/image.png)' }}
            aria-hidden="true"
          />
        )}

        <main className="w-full max-w-md sm:max-w-lg relative z-10">
          <Card className="rounded-2xl border shadow-sm text-center gap-4 bg-background/70 backdrop-blur-sm">
            <CardHeader className="flex flex-col items-center gap-3 px-6 pt-8">
              <Avatar className="h-24 w-24 rounded-full ring-2 ring-primary/20">
                <AvatarImage src="/image.png" alt="Chungus" />
                <AvatarFallback className="bg-muted text-primary font-semibold">CH</AvatarFallback>
              </Avatar>
              <div className="grid gap-2">
                <CardTitle className="text-3xl">Chungus</CardTitle>
                <CardDescription className="text-base">
                  Clarity, Precision, Impact in <span className="text-[#ffa400]">Every</span> Frame.
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
          <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent" />
          <GradualBlur preset="page-header" target="page" height="4rem" strength={3} opacity={1} />
        </header>

        {/* Footer gradient scoped to hero only */}
        <footer className="pointer-events-none absolute inset-x-0 bottom-0 h-16 z-10">
          <div className="absolute inset-0 bg-gradient-to-t from-white/40 to-transparent" />
          <GradualBlur preset="page-footer" height="4rem" strength={3} opacity={1} />
        </footer>
      </section>

      {/* Client Voice section */}
      <section id="client-voice" className="relative min-h-screen w-full bg-white text-black flex items-center justify-center">
        <div className="mx-auto max-w-6xl px-6 sm:px-10 py-12 sm:py-16 w-full">
          <h2 className="text-2xl sm:text-3xl font-semibold mb-8 text-center">Client Voice</h2>
          <LogoLoop
            logos={clientCards}
            speed={120}
            direction="left"
            width="100%"
            logoHeight={220}
            gap={24}
            pauseOnHover
            fadeOut
            fadeOutColor="#ffffff"
            scaleOnHover
            ariaLabel="Client testimonials"
          />
        </div>
      </section>

      {/* Views I got. section */}
      <section className="relative min-h-screen w-full bg-white text-black flex items-center">
        <div className="mx-auto max-w-6xl px-6 sm:px-10 py-12 sm:py-16">
          <h3 className="text-2xl sm:text-3xl font-semibold mb-8 text-center">Views I got.</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[
              { label: "Total Views", value: 1250000 },
              { label: "Watch Time (hrs)", value: 48000 },
              { label: "Subscribers Gained", value: 56000 },
              { label: "Avg. CTR (%)", value: 12.5 }
            ].map((metric) => (
              <div key={metric.label} className="rounded-2xl border shadow-sm bg-white p-6 text-center">
                <CountUp
                  to={metric.value as number}
                  duration={2}
                  separator="," 
                  className="text-3xl sm:text-4xl font-bold"
                />
                <div className="text-xs sm:text-sm text-muted-foreground mt-2">{metric.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* My works section */}
      <section className="relative min-h-screen w-full bg-white text-black flex items-center">
        <div className="mx-auto max-w-6xl px-6 sm:px-10 py-12 sm:py-16 w-full">
          <h3 className="text-2xl sm:text-3xl font-semibold mb-8 text-center">My works</h3>
          {!works || works.length === 0 ? (
            <div className="text-center text-muted-foreground">No works yet</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {works.map((w) => (
                <Card key={w.id} className="overflow-hidden rounded-2xl border shadow-sm bg-white">
                  {w.thumbnail_url ? (
                    <div className="relative aspect-video w-full">
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
                  <CardHeader className="flex flex-row items-center gap-3">
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
                    <div className="px-6 pb-6 text-sm text-gray-700">{w.note}</div>
                  ) : null}
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

