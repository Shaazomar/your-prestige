"use client";

import { OrganicVideoShape } from "./OrganicVideoShape";

interface HeroVideoProps {
  posterImage: string;
  videoSrc?: string;
  modalVideoUrl?: string;
}

export function parseVideoUrl(url?: string) {
  if (!url || typeof url !== "string") return { type: "none" as const, embedUrl: null, rawUrl: null };
  const trimmed = url.trim();
  if (!trimmed) return { type: "none" as const, embedUrl: null, rawUrl: null };

  const ytRegex = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = trimmed.match(ytRegex);
  if (match && match[2].length === 11) {
    const videoId = match[2];
    return {
      type: "youtube" as const,
      videoId,
      embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1`,
      backgroundEmbedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0&enablejsapi=1`,
      rawUrl: trimmed,
    };
  }

  const vimeoRegex = /(?:vimeo\.com\/)(\d+)/;
  const vimeoMatch = trimmed.match(vimeoRegex);
  if (vimeoMatch && vimeoMatch[1]) {
    const videoId = vimeoMatch[1];
    return {
      type: "vimeo" as const,
      videoId,
      embedUrl: `https://player.vimeo.com/video/${videoId}?autoplay=1`,
      backgroundEmbedUrl: `https://player.vimeo.com/video/${videoId}?autoplay=1&muted=1&loop=1&background=1`,
      rawUrl: trimmed,
    };
  }

  return {
    type: "native" as const,
    embedUrl: trimmed,
    backgroundEmbedUrl: trimmed,
    rawUrl: trimmed,
  };
}

export function HeroVideo({ posterImage, videoSrc }: HeroVideoProps) {
  return (
    <div className="relative w-full aspect-[4/3] sm:aspect-[14/11] lg:h-[620px]">
      <OrganicVideoShape posterImage={posterImage} videoSrc={videoSrc} />
    </div>
  );
}
