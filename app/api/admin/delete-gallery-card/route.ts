import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getServerEnv } from "@/lib/env";
import { getAdminGalleryCardById } from "@/lib/gallery-cards";
import { createServerSupabaseClient } from "@/lib/supabase";
import { galleryCardDeleteSchema } from "@/lib/validation";

function redirectToAdmin(request: Request, params: Record<string, string>) {
  const url = new URL("/admin", request.url);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return NextResponse.redirect(url, {
    status: 303,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: Request) {
  const authed = await isAdminAuthenticated();

  if (!authed) {
    return new NextResponse("Unauthorized", { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  const formData = await request.formData();
  const parsed = galleryCardDeleteSchema.safeParse({
    cardId: String(formData.get("cardId") ?? ""),
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Missing gallery card id.";
    return redirectToAdmin(request, { galleryError: message });
  }

  try {
    const card = await getAdminGalleryCardById(parsed.data.cardId);

    if (!card) {
      return redirectToAdmin(request, { galleryError: "Gallery card not found." });
    }

    const supabase = createServerSupabaseClient();
    const { bucket } = getServerEnv();

    if (!card.image_path.startsWith("/") && !/^https?:\/\//.test(card.image_path)) {
      const { error: storageError } = await supabase.storage.from(bucket).remove([card.image_path]);

      if (storageError) {
        return redirectToAdmin(request, { galleryError: "Failed to delete saved gallery image." });
      }
    }

    const { error: deleteError } = await supabase.from("gallery_cards").delete().eq("id", parsed.data.cardId);

    if (deleteError) {
      return redirectToAdmin(request, { galleryError: "Failed to delete gallery card." });
    }

    return redirectToAdmin(request, { gallerySuccess: `"${card.name}" was deleted.` });
  } catch (error) {
    console.error("[admin-gallery-delete] request_failed", error);
    return redirectToAdmin(request, { galleryError: "We couldn't delete that gallery card right now. Please try again." });
  }
}
