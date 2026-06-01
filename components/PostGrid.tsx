"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import type { PostPage } from "@/lib/posts";

interface Post {
  id: string;
  instagramPostId: string;
  thumbnailUrl: string;
  mediaType: string;
  caption: string;
  extractedUrl: string;
  postedAt: string;
}

interface PostGridProps {
  username: string;
  initialPosts: Post[];
  initialNextCursor: string | null;
}

function ImagePostIcon() {
  return (
    <span
      aria-hidden="true"
      className="absolute right-2 top-2 z-10 flex h-[21px] w-[21px] items-center justify-center text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]"
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
      className="absolute right-2 top-2 z-10 flex h-[21px] w-[21px] items-center justify-center text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-full w-full">
        <path d="M8 5.8v12.4c0 .8.9 1.3 1.6.9l9.6-6.2c.6-.4.6-1.3 0-1.8L9.6 4.9C8.9 4.5 8 5 8 5.8z" />
      </svg>
    </span>
  );
}

export function PostGrid({ username, initialPosts, initialNextCursor }: PostGridProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || !nextCursor) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/posts/${username}?cursor=${encodeURIComponent(nextCursor)}`);
      if (!res.ok) return;
      const data: PostPage = await res.json();
      setPosts((prev) => {
        const seen = new Set(prev.map((p) => p.instagramPostId));
        const fresh = data.posts.filter((p) => !seen.has(p.instagramPostId));
        return [...prev, ...fresh];
      });
      setNextCursor(data.nextCursor);
    } finally {
      setLoading(false);
    }
  }, [loading, nextCursor, username]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
      { rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <>
      <div className="grid grid-cols-3 gap-1 p-1 md:p-0">
        {posts.map((post) => (
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

      {nextCursor && (
        <div ref={sentinelRef} className="flex justify-center py-8">
          {loading && (
            <div className="h-6 w-6 rounded-full border-2 border-gray-300 border-t-gray-700 animate-spin" />
          )}
        </div>
      )}
    </>
  );
}
