"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { PostPage, PostMediaFilter } from "@/lib/posts";

export type Post = PostPage["posts"][number];

interface UsePostPageOptions {
  mediaType?: PostMediaFilter;
  initialPosts?: Post[];
  initialNextCursor?: string | null;
  enabled?: boolean;
}

interface UsePostPageResult {
  posts: Post[];
  loading: boolean;
  nextCursor: string | null;
  initialized: boolean;
  loadMore: () => void;
}

export function usePostPage(
  username: string,
  {
    mediaType,
    initialPosts,
    initialNextCursor = null,
    enabled = true,
  }: UsePostPageOptions = {}
): UsePostPageResult {
  const [posts, setPosts] = useState<Post[]>(initialPosts ?? []);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor ?? null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(initialPosts !== undefined);
  const initStarted = useRef(initialPosts !== undefined);

  const fetchPage = useCallback(
    async (cursor?: string | null): Promise<PostPage | null> => {
      const params = new URLSearchParams();
      if (cursor) params.set("cursor", cursor);
      if (mediaType) params.set("mediaType", mediaType);
      const query = params.toString();
      const res = await fetch(`/api/posts/${username}${query ? `?${query}` : ""}`);
      if (!res.ok) return null;
      return res.json();
    },
    [username, mediaType]
  );

  // Lazy initial fetch for tabs without SSR data (e.g. video tab).
  useEffect(() => {
    if (!enabled || initStarted.current) return;
    initStarted.current = true;

    let cancelled = false;

    async function init() {
      setLoading(true);
      try {
        const data = await fetchPage();
        if (!data || cancelled) return;
        setPosts(data.posts);
        setNextCursor(data.nextCursor);
        setInitialized(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void init();
    return () => {
      cancelled = true;
    };
  }, [enabled, fetchPage]);

  const loadMore = useCallback(async () => {
    if (loading || !nextCursor) return;
    setLoading(true);
    try {
      const data = await fetchPage(nextCursor);
      if (!data) return;
      setPosts((prev) => {
        const seen = new Set(prev.map((p) => p.instagramPostId));
        const fresh = data.posts.filter((p) => !seen.has(p.instagramPostId));
        return [...prev, ...fresh];
      });
      setNextCursor(data.nextCursor);
    } finally {
      setLoading(false);
    }
  }, [loading, nextCursor, fetchPage]);

  return { posts, loading, nextCursor, initialized, loadMore };
}
