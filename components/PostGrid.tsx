"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePostPage } from "@/hooks/usePostPage";
import type { Post } from "@/hooks/usePostPage";
import { GridTabIcon, VideoTabIcon } from "@/components/icons/ProfileTabIcons";
import { TabButton } from "./TabButton";

interface PostGridProps {
  username: string;
  initialPosts: Post[];
  initialNextCursor: string | null;
}

type TabKey = "all" | "video";

function ImagePostIcon() {
  return (
    <span
      aria-hidden="true"
      className="absolute right-2 top-2 z-10 flex h-5.25 w-5.25 items-center justify-center text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]"
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-full w-full">
        <rect x="5" y="5" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
        <path d="M8 15.5l2.4-2.4 1.8 1.8 2.6-3.1L17 14.4V17H8z" fill="currentColor" />
        <circle cx="15.5" cy="8.5" r="1.2" fill="currentColor" />
      </svg>
    </span>
  );
}

function VideoPostIcon() {
  return (
    <span
      aria-hidden="true"
      className="absolute right-2 top-2 z-10 flex h-5.25 w-5.25 items-center justify-center text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-full w-full">
        <path d="M8 5.8v12.4c0 .8.9 1.3 1.6.9l9.6-6.2c.6-.4.6-1.3 0-1.8L9.6 4.9C8.9 4.5 8 5 8 5.8z" />
      </svg>
    </span>
  );
}

export function PostGrid({ username, initialPosts, initialNextCursor }: PostGridProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("all");

  const allTab = usePostPage(username, { initialPosts, initialNextCursor });
  const videoTab = usePostPage(username, {
    mediaType: "VIDEO",
    enabled: activeTab === "video",
  });

  const active = activeTab === "video" ? videoTab : allTab;

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) active.loadMore(); },
      { rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [active]);

  return (
    <>
      <div className="mx-auto grid max-w-170 grid-cols-2 mb-4 px-1 md:px-0">
        <TabButton
          iconComponent={GridTabIcon}
          onClick={() => setActiveTab("all")}
          active={activeTab === "all"}
        />
        <TabButton
          iconComponent={VideoTabIcon}
          onClick={() => setActiveTab("video")}
          active={activeTab === "video"}
        />
      </div>

      <div className="grid grid-cols-3 gap-1 p-1 md:p-0">
        {active.posts.map((post) => (
          <a
            key={post.instagramPostId}
            href={post.extractedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative block overflow-hidden bg-gray-100"
            style={{ aspectRatio: "4/5" }}
          >
            <Image
              src={post.thumbnailUrl}
              alt=""
              fill
              sizes="(max-width: 640px) 50vw, 226px"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {post.mediaType === "VIDEO" ? <VideoPostIcon /> : <ImagePostIcon />}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-end p-3 opacity-0 group-hover:opacity-100">
              <span className="text-white text-xs font-medium truncate drop-shadow">
                {post.extractedUrl.replace(/^https?:\/\//, "")}
              </span>
            </div>
          </a>
        ))}
      </div>

      {activeTab === "video" && videoTab.initialized && active.posts.length === 0 && !active.loading && (
        <p className="py-10 text-center text-sm text-gray-500">No video posts yet.</p>
      )}

      {(active.nextCursor || active.loading) && (
        <div ref={sentinelRef} className="flex justify-center py-8">
          {active.loading && (
            <div className="h-6 w-6 rounded-full border-2 border-gray-300 border-t-gray-700 animate-spin" />
          )}
        </div>
      )}
    </>
  );
}
