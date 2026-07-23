"use client";

import { useState, type MouseEvent } from "react";
import { Heart } from "lucide-react";
import { clientFetch } from "@/lib/api/client-fetch";
import { postLike } from "@/lib/api/feed";

// SPEC-05: "Likes are reversible." BookCard (domain-types/feed.ts)
// carries no `liked` field — the feed API has no per-viewer "did I
// already like this" signal to hydrate from — so this always starts
// unliked and only reflects *this session's* toggles, not prior likes
// from an earlier visit. A real "already liked" indicator would need
// that field added to BookCard server-side; out of scope here.
export function LikeButton({ bookId }: { bookId: string }) {
  const [liked, setLiked] = useState(false);
  const [pending, setPending] = useState(false);

  async function onClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (pending) return;

    const next = !liked;
    setLiked(next); // optimistic
    setPending(true);
    try {
      await postLike(clientFetch, { bookId, liked: next });
    } catch {
      setLiked(!next); // revert on failure
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={liked}
      aria-label={liked ? "Unlike this book" : "Like this book"}
      className="shrink-0 rounded-full p-1 text-muted-foreground hover:text-foreground"
    >
      <Heart className="h-4 w-4" fill={liked ? "currentColor" : "none"} />
    </button>
  );
}
