import Image from "next/image";
import { notFound } from "next/navigation";
import { serverFetch } from "@/lib/api/server-fetch";
import { getBook } from "@/lib/api/catalog";
import { similarBooks } from "@/lib/api/search";
import { ApiError } from "@/lib/api/problem-details";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { BookCard } from "@/components/book-card";
import { Badge } from "@pk-literature/ui";

export default async function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const book = await getBookOr404(id);
  const similar = await getSimilarSafely(id);

  const inStock = book.inventory?.availability === "in_stock" && book.inventory.stock > 0;

  return (
    <div className="flex flex-col gap-12">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-[300px_1fr]">
        <div className="relative aspect-[2/3] w-full max-w-xs overflow-hidden rounded-lg bg-muted">
          {book.cover ? (
            <Image src={book.cover.url} alt={book.title} fill sizes="300px" className="object-cover" priority />
          ) : (
            <div className="flex h-full items-center justify-center p-4 text-center text-muted-foreground">{book.title}</div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-bold">{book.title}</h1>
            {book.subtitle && <p className="text-lg text-muted-foreground">{book.subtitle}</p>}
            {book.work.authors.length > 0 && (
              <p className="mt-1 text-sm text-muted-foreground">
                by {book.work.authors.map((a) => a.author.canonicalName).join(", ")}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span>{book.publisher.name}</span>
            {book.editionLabel && <span>&middot; {book.editionLabel}</span>}
            {book.pageCount && <span>&middot; {book.pageCount} pages</span>}
            {book.publicationDate && <span>&middot; {book.publicationDate}</span>}
          </div>

          {book.collections.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {book.collections.map((collection) => (
                <Badge key={collection.id} variant="outline">
                  {collection.name}
                </Badge>
              ))}
            </div>
          )}

          {book.inventory && (
            <div className="flex items-center gap-4">
              <span className="text-xl font-semibold">
                {book.inventory.currency} {book.inventory.price.toFixed(2)}
              </span>
              <span className={inStock ? "text-sm text-green-700" : "text-sm text-destructive"}>
                {inStock ? "In stock" : "Out of stock"}
              </span>
            </div>
          )}

          <AddToCartButton bookId={book.id} disabled={!inStock} />

          {book.contributors.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {book.contributors.map((c) => `${c.author.canonicalName} (${c.role})`).join(", ")}
            </div>
          )}
        </div>
      </div>

      {similar.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold">Similar books</h2>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {similar.map((b) => (
              <BookCard key={b.id} book={b} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

async function getBookOr404(id: string) {
  try {
    return await getBook(serverFetch, id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }
}

async function getSimilarSafely(id: string) {
  try {
    return (await similarBooks(serverFetch, id)).items;
  } catch {
    return [];
  }
}
