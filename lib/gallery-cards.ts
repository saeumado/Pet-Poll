import { randomUUID } from "crypto";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getServerEnv } from "@/lib/env";
import { slugify } from "@/lib/utils";

export type GalleryCard = {
  id: string;
  name: string;
  imageSrc: string;
  downloadHref: string;
  isPublished: boolean;
  createdAt: string;
};

type GalleryCardRow = {
  created_at: string;
  id: string;
  image_path: string;
  is_published: boolean;
  name: string;
  sort_order: number;
};

function formatCardName(fileName: string) {
  return fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .slice(0, 80);
}

async function getSignedAssetUrl(imagePath: string) {
  if (imagePath.startsWith("/")) {
    return imagePath;
  }

  if (/^https?:\/\//.test(imagePath)) {
    return imagePath;
  }

  const supabase = createServerSupabaseClient();
  const { bucket } = getServerEnv();
  // Gallery images live in a private bucket, so public/admin pages use short-lived signed URLs for display.
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(imagePath, 60 * 60);

  if (error || !data?.signedUrl) {
    throw new Error(`Failed to create gallery asset URL: ${error?.message ?? "Missing signed URL."}`);
  }

  return data.signedUrl;
}

function mapDownloadHref(id: string) {
  return `/api/cards/download?cardId=${encodeURIComponent(id)}`;
}

async function hydrateCard(row: GalleryCardRow): Promise<GalleryCard> {
  return {
    id: row.id,
    name: row.name,
    imageSrc: await getSignedAssetUrl(row.image_path),
    downloadHref: mapDownloadHref(row.id),
    isPublished: row.is_published,
    createdAt: row.created_at,
  };
}

export async function listPublishedGalleryCards() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("gallery_cards")
    .select("id, name, image_path, sort_order, is_published, created_at")
    .eq("is_published", true)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load gallery cards: ${error.message}`);
  }

  return Promise.all(((data ?? []) as GalleryCardRow[]).map(hydrateCard));
}

export async function listAdminGalleryCards() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("gallery_cards")
    .select("id, name, image_path, sort_order, is_published, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load admin gallery cards: ${error.message}`);
  }

  return Promise.all(((data ?? []) as GalleryCardRow[]).map(hydrateCard));
}

export async function createGalleryCards(input: {
  files: File[];
  isPublished: boolean;
}) {
  const supabase = createServerSupabaseClient();
  const { bucket } = getServerEnv();
  const uploadedPaths: string[] = [];

  try {
    for (const file of input.files) {
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const name = formatCardName(file.name) || "Gallery Card";
      const fileSlug = slugify(name) || "gallery-card";
      const storagePath = `gallery/${fileSlug}-${randomUUID()}.${extension.replace(/[^a-z0-9]/g, "") || "jpg"}`;
      const bytes = await file.arrayBuffer();

      const { error: uploadError } = await supabase.storage.from(bucket).upload(storagePath, bytes, {
        contentType: file.type,
        upsert: false,
      });

      if (uploadError) {
        throw new Error(`Failed to upload gallery image: ${uploadError.message}`);
      }

      uploadedPaths.push(storagePath);

      const { error: insertError } = await supabase.from("gallery_cards").insert({
        image_path: storagePath,
        is_published: input.isPublished,
        name,
      });

      if (insertError) {
        throw new Error(`Failed to save gallery card: ${insertError.message}`);
      }
    }
  } catch (error) {
    if (uploadedPaths.length > 0) {
      await supabase.storage.from(bucket).remove(uploadedPaths);
    }

    throw error;
  }
}

export async function updateGalleryCard(input: {
  cardId: string;
  name: string;
  isPublished: boolean;
}) {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("gallery_cards")
    .update({
      name: input.name.trim(),
      is_published: input.isPublished,
    })
    .eq("id", input.cardId);

  if (error) {
    throw new Error(`Failed to update gallery card: ${error.message}`);
  }
}

export async function getPublishedGalleryCardById(cardId: string) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("gallery_cards")
    .select("id, name, image_path, is_published")
    .eq("id", cardId)
    .eq("is_published", true)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load gallery card: ${error.message}`);
  }

  return data;
}
