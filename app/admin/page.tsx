import type { Metadata } from "next";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";
import { DeleteEntryButton } from "@/components/delete-entry-button";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getServerEnv } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase";
import { formatAdminHktDate } from "@/lib/utils";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

type HouseholdRecord = {
  id: string;
  household_name: string | null;
  dachshund_count: number;
  created_at: string;
  dogs: {
    id: string;
    name: string;
    storage_path: string;
    original_filename: string | null;
    content_type: string | null;
  }[];
};

export default async function AdminPage() {
  noStore();

  const authed = await isAdminAuthenticated();

  if (!authed) {
    redirect("/admin/login");
  }

  const supabase = createServerSupabaseClient();
  const { bucket } = getServerEnv();
  const { data, error } = await supabase
    .from("households")
    .select("id, household_name, dachshund_count, created_at, dogs(id, name, storage_path, original_filename, content_type)")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load admin dashboard: ${error.message}`);
  }

  const entries = (data ?? []) as HouseholdRecord[];
  const totalDachshunds = entries.reduce((sum, entry) => sum + entry.dachshund_count, 0);
  const totalPhotos = entries.reduce((sum, entry) => sum + entry.dogs.length, 0);
  const latestSubmission = entries[0]?.created_at;
  const signedUrlCache = new Map<string, string>();

  for (const entry of entries) {
    for (const dog of entry.dogs) {
      if (!signedUrlCache.has(dog.storage_path)) {
        const { data: originalSigned } = await supabase.storage.from(bucket).createSignedUrl(dog.storage_path, 60 * 60);

        if (originalSigned?.signedUrl) {
          signedUrlCache.set(dog.storage_path, originalSigned.signedUrl);
        }
      }
    }
  }

  return (
    <main className="shell">
      <div className="adminHeader">
        <div>
          <span className="eyebrow">Private Admin</span>
          <h1 className="pageTitle">Hot Dog Poll admin.</h1>
          <p className="pageText">
            Review every household submission, keep the running count accurate, and download the saved photos.
          </p>
        </div>

        <div className="buttonRow">
          <Link className="secondaryButton" href="/api/admin/export">
            Export CSV
          </Link>
          <form action="/api/admin/logout" method="post">
            <button className="linkButton" type="submit">
              Log out
            </button>
          </form>
        </div>
      </div>

      <section className="statsRow">
        <article className="stat">
          <span className="statLabel">Households</span>
          <strong className="statValue">{entries.length}</strong>
        </article>
        <article className="stat">
          <span className="statLabel">Total dachshunds</span>
          <strong className="statValue">{totalDachshunds}</strong>
        </article>
        <article className="stat">
          <span className="statLabel">Photos saved</span>
          <strong className="statValue">{totalPhotos}</strong>
        </article>
      </section>

      <section className="adminPanel panel">
        <h2 className="pageTitle">Recent activity</h2>
        <p className="sectionText">
          {latestSubmission
            ? `Newest submission arrived ${formatAdminHktDate(latestSubmission)}.`
            : "No households have submitted yet."}
        </p>

        <div className="divider" />

        {entries.length === 0 ? (
          <div className="empty">No entries yet. Once a household submits the form, it will appear here.</div>
        ) : (
          <div className="entries">
            {entries.map((entry) => {
              const submitterName = entry.household_name || "Unnamed household";
              const dogLabel = `${entry.dachshund_count} dog${entry.dachshund_count === 1 ? "" : "s"}`;

              return (
                <article className="entry" key={entry.id}>
                  <div className="entryTop">
                    <div>
                      <h3 className="entryTitle">{submitterName}</h3>
                      <p className="metaText">
                        {formatAdminHktDate(entry.created_at)} · {dogLabel}
                      </p>
                    </div>

                    <div className="buttonRow">
                      <span className="eyebrow">{entry.dachshund_count} counted</span>
                      <DeleteEntryButton householdId={entry.id} />
                    </div>
                  </div>

                  <div className="dogList">
                    {entry.dogs.map((dog) => (
                      <div className="dogCard" key={dog.id}>
                        <div className="dogCardTop">
                          <div>
                            <h4 className="dogName">{dog.name}</h4>
                            <p className="metaText">
                              {dog.original_filename ?? "Original filename unavailable"}
                              {dog.content_type ? ` • ${dog.content_type}` : ""}
                            </p>
                          </div>

                          <div className="buttonRow">
                            <Link className="secondaryButton" href={`/api/admin/photos?path=${encodeURIComponent(dog.storage_path)}`}>
                              Download photo
                            </Link>
                          </div>
                        </div>

                        <div className="adminImageGrid">
                          <div className="adminImageCard">
                            <span className="resultLabel">Photo</span>
                            {signedUrlCache.get(dog.storage_path) ? (
                              <img alt={`${dog.name} upload`} className="adminThumb" src={signedUrlCache.get(dog.storage_path)} />
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
