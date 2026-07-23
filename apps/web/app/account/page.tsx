import { redirect } from "next/navigation";
import Link from "next/link";
import { serverFetch } from "@/lib/api/server-fetch";
import { getProfile } from "@/lib/api/identity";
import { ApiError } from "@/lib/api/problem-details";
import { ProfileForm } from "@/components/profile-form";

export default async function AccountPage() {
  const profile = await getProfileOrRedirect();

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-8">
      <h1 className="text-2xl font-bold">Your account</h1>
      <ProfileForm initialProfile={profile} />
      <div className="flex gap-6 text-sm underline">
        <Link href="/account/addresses">Address book</Link>
        <Link href="/account/orders">Order history</Link>
      </div>
    </div>
  );
}

async function getProfileOrRedirect() {
  try {
    return await getProfile(serverFetch);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect("/login");
    throw err;
  }
}
