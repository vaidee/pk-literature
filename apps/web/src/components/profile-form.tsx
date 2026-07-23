"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@pk-literature/domain-types";
import { Button, Input, Label } from "@pk-literature/ui";
import { clientFetch } from "@/lib/api/client-fetch";
import { logout, updateProfile } from "@/lib/api/identity";
import { ApiError } from "@/lib/api/problem-details";

export function ProfileForm({ initialProfile }: { initialProfile: User }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialProfile.displayName);
  const [phone, setPhone] = useState(initialProfile.phone ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setSaved(false);
    try {
      await updateProfile(clientFetch, { displayName, phone: phone || undefined });
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? (err.problem.detail ?? err.message) : "Could not save profile.");
    } finally {
      setPending(false);
    }
  }

  async function onLogout() {
    await logout(clientFetch).catch(() => {});
    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={initialProfile.email} disabled />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="displayName">Name</Label>
        <Input id="displayName" required value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {saved && <p className="text-sm text-green-700">Saved.</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save changes"}
        </Button>
        <Button type="button" variant="outline" onClick={onLogout}>
          Sign out
        </Button>
      </div>
    </form>
  );
}
