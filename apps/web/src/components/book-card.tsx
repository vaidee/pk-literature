import Image from "next/image";
import Link from "next/link";
import type { BookCard as BookCardType } from "@pk-literature/domain-types";
import { Badge } from "@pk-literature/ui";
import { LikeButton } from "./like-button";

export function BookCard({ book }: { book: BookCardType }) {
  return (
    <div className="group relative flex w-40 flex-shrink-0 flex-col gap-2 sm:w-48">
      <Link href={`/books/${book.id}`} className="block">
        <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md bg-muted">
          {book.cover ? (
            <Image
              src={book.cover.url}
              alt={book.title}
              fill
              sizes="(min-width: 640px) 12rem, 10rem"
              className="object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center p-2 text-center text-xs text-muted-foreground">
              {book.title}
            </div>
          )}
        </div>
      </Link>
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0">
          <Link href={`/books/${book.id}`}>
            <p className="truncate text-sm font-medium">{book.title}</p>
          </Link>
          {book.authorName && <p className="truncate text-xs text-muted-foreground">{book.authorName}</p>}
        </div>
        <LikeButton bookId={book.id} />
      </div>
      <div className="flex items-center justify-between">
        {book.price !== null ? (
          <span className="text-sm font-semibold">
            {book.currency} {book.price.toFixed(2)}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Unavailable</span>
        )}
        {book.chips.isNew && (
          <Badge variant="secondary" className="text-[10px]">
            New
          </Badge>
        )}
      </div>
    </div>
  );
}
