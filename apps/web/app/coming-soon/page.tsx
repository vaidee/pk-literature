export const metadata = {
  title: "Opening Soon — Tamil Literature",
};

export default function ComingSoonPage() {
  return (
    <div className="flex flex-col items-center gap-3 py-24 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">விரைவில் திறக்கப்படும்</h1>
      <p className="text-lg text-muted-foreground">Opening soon</p>
      <p className="max-w-md text-sm text-muted-foreground">
        We&apos;re still stocking the shelves. Check back shortly.
      </p>
    </div>
  );
}
