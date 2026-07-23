import Link from "next/link";
import { serverFetch } from "@/lib/api/server-fetch";
import { search } from "@/lib/api/search";
import { BookCard } from "@/components/book-card";
import { Badge } from "@pk-literature/ui";

interface SearchParams {
  q?: string;
  page?: string;
  publisherId?: string;
  authorId?: string;
  themeId?: string;
  genreId?: string;
  language?: string;
  availability?: string;
}

interface SearchPageProps {
  searchParams: Promise<SearchParams>;
}

// Building a query string from `params` naively (e.g. via
// `new URLSearchParams({...params, ...overrides})`) would stringify
// every `undefined` facet as the literal text "undefined" in the URL —
// this drops them instead.
function buildSearchHref(params: SearchParams, overrides: Record<string, string>): string {
  const merged: Record<string, string> = {};
  for (const [key, value] of Object.entries({ ...params, ...overrides })) {
    if (value !== undefined) merged[key] = value;
  }
  return `/search?${new URLSearchParams(merged).toString()}`;
}

// SPEC-08 — faceted search. Facet links re-run the search with that
// facet's value added, standard "click a facet to filter" UX; there's
// no client-side facet toggling here (a plain GET-with-query-params
// page keeps this a Server Component with no interactivity needed,
// and every facet click is a real, bookmarkable/shareable URL).
export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const q = params.q ?? "";

  if (!q) {
    return <p className="text-muted-foreground">Enter a search term above.</p>;
  }

  const page = params.page ? Number(params.page) : 1;
  const result = await search(serverFetch, {
    q,
    page,
    publisherId: params.publisherId,
    authorId: params.authorId,
    themeId: params.themeId,
    genreId: params.genreId,
    language: params.language,
    availability: params.availability,
  });

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-[200px_1fr]">
      <aside className="flex flex-col gap-6">
        {result.facets.map((facet) => (
          <div key={facet.key}>
            <h3 className="mb-2 text-sm font-semibold">{facet.label}</h3>
            <ul className="flex flex-col gap-1">
              {facet.values.map((value) => (
                <li key={value.value}>
                  <Link
                    href={buildSearchHref(params, { page: "1", [facet.key]: value.value })}
                    className="flex items-center justify-between text-sm text-muted-foreground hover:text-foreground"
                  >
                    <span>{value.label}</span>
                    <Badge variant="outline">{value.count}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </aside>

      <div>
        <p className="mb-4 text-sm text-muted-foreground">
          {result.totalItems} result{result.totalItems === 1 ? "" : "s"} for &ldquo;{q}&rdquo;
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {result.items.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
        {result.totalItems === 0 && <p className="text-muted-foreground">No books matched your search.</p>}

        <div className="mt-8 flex justify-center gap-4">
          {page > 1 && (
            <Link href={buildSearchHref(params, { page: String(page - 1) })} className="text-sm underline">
              Previous
            </Link>
          )}
          {page < result.totalPages && (
            <Link href={buildSearchHref(params, { page: String(page + 1) })} className="text-sm underline">
              Next
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
