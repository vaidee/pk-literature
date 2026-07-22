import { validateBookFields } from "../validate";
import type { CanonicalBook } from "../types";

const validBook: CanonicalBook = {
  sourceRef: "book-1",
  isbn13: "9781234567890",
  title: "Vishnupuram",
  subtitle: null,
  authorNames: ["Jeyamohan"],
  publisherName: "Kalachuvadu",
  description: "A novel.",
  language: "ta",
  coverSourceUrl: "https://example.com/cover.jpg",
  price: 450,
  currency: "INR",
  stock: 10,
  category: "Novel",
  publicationDate: "2020-01-01",
  editionLabel: null,
  pageCount: 620,
};

describe("validateBookFields", () => {
  it("passes a fully populated book with no issues", () => {
    const result = validateBookFields(validBook);
    expect(result.hasErrors).toBe(false);
    expect(result.issues).toHaveLength(0);
  });

  it("flags every required field as an error when missing", () => {
    const result = validateBookFields({
      ...validBook,
      title: null,
      authorNames: [],
      publisherName: null,
      price: null,
      language: null,
      coverSourceUrl: null,
    });

    expect(result.hasErrors).toBe(true);
    const codes = result.issues.map((i) => i.code);
    expect(codes).toEqual(
      expect.arrayContaining([
        "missing_title",
        "missing_author",
        "missing_publisher",
        "missing_price",
        "missing_language",
        "missing_cover",
      ]),
    );
  });

  it("warns (not errors) on a missing ISBN", () => {
    const result = validateBookFields({ ...validBook, isbn13: null });
    expect(result.hasErrors).toBe(false);
    expect(result.issues).toEqual([{ severity: "warning", code: "missing_isbn", message: expect.any(String) }]);
  });

  it("errors on a malformed ISBN", () => {
    const result = validateBookFields({ ...validBook, isbn13: "not-an-isbn" });
    expect(result.hasErrors).toBe(true);
    expect(result.issues).toContainEqual(
      expect.objectContaining({ severity: "error", code: "invalid_isbn" }),
    );
  });

  it("errors on an unrecognized currency", () => {
    const result = validateBookFields({ ...validBook, currency: "XXX" });
    expect(result.hasErrors).toBe(true);
    expect(result.issues).toContainEqual(
      expect.objectContaining({ severity: "error", code: "invalid_currency" }),
    );
  });

  it("warns (not errors) on a missing description", () => {
    const result = validateBookFields({ ...validBook, description: null });
    expect(result.hasErrors).toBe(false);
    expect(result.issues).toEqual([
      { severity: "warning", code: "missing_description", message: expect.any(String) },
    ]);
  });
});
