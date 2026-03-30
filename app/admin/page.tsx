import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";
import { DeleteEntryButton } from "@/components/delete-entry-button";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getServerEnv } from "@/lib/env";
import { listAdminGalleryCards } from "@/lib/gallery-cards";
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

type AdminPageSearchParams = {
  galleryError?: string;
  gallerySuccess?: string;
};

type AdminPageProps = {
  searchParams?: Promise<AdminPageSearchParams>;
};

type GalleryCards = Awaited<ReturnType<typeof listAdminGalleryCards>>;

function buildDogLabel(count: number) {
  return `${count} dog${count === 1 ? "" : "s"}`;
}

async function buildSignedUrlCache(entries: HouseholdRecord[], bucket: string) {
  const supabase = createServerSupabaseClient();
  const signedUrlCache = new Map<string, string>();

  // Signed URLs let the admin page preview photos from a private bucket without making the bucket public.
  for (const entry of entries) {
    for (const dog of entry.dogs) {
      if (signedUrlCache.has(dog.storage_path)) {
        continue;
      }

      const { data: originalSigned } = await supabase.storage.from(bucket).createSignedUrl(dog.storage_path, 60 * 60);

      if (originalSigned?.signedUrl) {
        signedUrlCache.set(dog.storage_path, originalSigned.signedUrl);
      }
    }
  }

  return signedUrlCache;
}

function DashboardStats({ entries, galleryCards }: { entries: HouseholdRecord[]; galleryCards: GalleryCards }) {
  const totalDachshunds = entries.reduce((sum, entry) => sum + entry.dachshund_count, 0);
  const totalPhotos = entries.reduce((sum, entry) => sum + entry.dogs.length, 0);
  const totalPublishedGalleryCards = galleryCards.filter((card) => card.isPublished).length;

  return (
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
      <article className="stat">
        <span className="statLabel">Gallery cards live</span>
        <strong className="statValue">{totalPublishedGalleryCards}</strong>
      </article>
    </section>
  );
}

function SubmissionEntries({
  entries,
  signedUrlCache,
}: {
  entries: HouseholdRecord[];
  signedUrlCache: Map<string, string>;
}) {
  const latestSubmission = entries[0]?.created_at;

  return (
    <section className="adminPanel panel">
      <h2 className="pageTitle">Recent activity</h2>
      <p className="sectionText">
        {latestSubmission ? `Newest submission arrived ${formatAdminHktDate(latestSubmission)}.` : "No households have submitted yet."}
      </p>

      <div className="divider" />

      {entries.length === 0 ? (
        <div className="empty">No entries yet. Once a household submits the form, it will appear here.</div>
      ) : (
        <div className="entries">
          {entries.map((entry) => {
            const submitterName = entry.household_name || "Unnamed household";

            return (
              <article className="entry" key={entry.id}>
                <div className="entryTop">
                  <div>
                    <h3 className="entryTitle">{submitterName}</h3>
                    <p className="metaText">
                      {formatAdminHktDate(entry.created_at)} - {buildDogLabel(entry.dachshund_count)}
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
                            {dog.content_type ? ` - ${dog.content_type}` : ""}
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
                            <Image
                              alt={`${dog.name} upload`}
                              className="adminThumb"
                              height={800}
                              src={signedUrlCache.get(dog.storage_path) ?? ""}
                              unoptimized
                              width={800}
                            />
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
  );
}

function GalleryManager({
  galleryCards,
  searchParams,
}: {
  galleryCards: GalleryCards;
  searchParams?: AdminPageSearchParams;
}) {
  return (
    <section className="adminPanel panel">
      <div className="galleryAdminTop">
        <div>
          <h2 className="pageTitle">Gallery manager</h2>
          <p className="sectionText">
            Upload many finished card images at once. New uploads appear on the public gallery in the order they were added.
          </p>
        </div>
      </div>

      {searchParams?.gallerySuccess ? <p className="successText">{searchParams.gallerySuccess}</p> : null}
      {searchParams?.galleryError ? <p className="errorText">{searchParams.galleryError}</p> : null}

      <form className="galleryAdminForm" action="/api/admin/gallery" method="post" encType="multipart/form-data">
        <input type="hidden" name="intent" value="create" />

        <label className="field">
          <span className="label">Gallery images</span>
          <input className="input" name="files" type="file" accept="image/png,image/jpeg,image/webp" multiple required />
          <span className="hint">Choose one or many final JPG, PNG, or WebP card images. Each filename becomes the card name automatically.</span>
        </label>

        <label className="field">
          <span className="label">Visibility</span>
          <select className="input" name="isPublished" defaultValue="true">
            <option value="true">Published</option>
            <option value="false">Hidden</option>
          </select>
        </label>

        <div className="buttonRow">
          <button className="button" type="submit">
            Upload gallery cards
          </button>
        </div>
      </form>

      <div className="divider" />

      {galleryCards.length === 0 ? (
        <div className="empty">No gallery cards yet. Upload the first finished card to publish it on /cards.</div>
      ) : (
        <div className="galleryAdminList">
          {galleryCards.map((card) => (
            <article className="galleryAdminCard" key={card.id}>
              <div className="galleryAdminCardMedia">
                <Image
                  alt={`${card.name} gallery preview`}
                  className="adminThumb galleryAdminThumb"
                  height={320}
                  src={card.imageSrc}
                  unoptimized
                  width={240}
                />
              </div>

              <form className="galleryAdminCardBody" action="/api/admin/gallery" method="post">
                <input type="hidden" name="intent" value="update" />
                <input type="hidden" name="cardId" value={card.id} />

                <div className="galleryAdminCardCopy">
                  <input
                    className="galleryAdminNameInput"
                    name="name"
                    maxLength={80}
                    defaultValue={card.name}
                    aria-label="Card name"
                    required
                  />
                  <p className="metaText">
                    Added {formatAdminHktDate(card.createdAt)} - {card.isPublished ? "Published" : "Hidden"}
                  </p>
                </div>

                <label className="field galleryAdminVisibilityField">
                  <span className="label">Visibility</span>
                  <select className="input" name="isPublished" defaultValue={card.isPublished ? "true" : "false"}>
                    <option value="true">Published</option>
                    <option value="false">Hidden</option>
                  </select>
                </label>

                <div className="buttonRow galleryAdminActions">
                  <button className="secondaryButton" type="submit">
                    Save
                  </button>
                  <Link className="linkButton" href={card.downloadHref}>
                    Download
                  </Link>
                </div>
              </form>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  noStore();

  const authed = await isAdminAuthenticated();

  if (!authed) {
    redirect("/admin/login");
  }

  const supabase = createServerSupabaseClient();
  const { bucket } = getServerEnv();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const { data, error } = await supabase
    .from("households")
    .select("id, household_name, dachshund_count, created_at, dogs(id, name, storage_path, original_filename, content_type)")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load admin dashboard: ${error.message}`);
  }

  const entries = (data ?? []) as HouseholdRecord[];
  const galleryCards = await listAdminGalleryCards();
  const signedUrlCache = await buildSignedUrlCache(entries, bucket);

  return (
    <main className="shell">
      <div className="adminHeader">
        <div>
          <span className="eyebrow">Private Admin</span>
          <h1 className="pageTitle">Hot Dog Poll admin.</h1>
          <p className="pageText">
            Review every household submission, keep the running count accurate, and manage the public gallery cards.
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

      <DashboardStats entries={entries} galleryCards={galleryCards} />
      <SubmissionEntries entries={entries} signedUrlCache={signedUrlCache} />
      <GalleryManager galleryCards={galleryCards} searchParams={resolvedSearchParams} />
    </main>
  );
}
