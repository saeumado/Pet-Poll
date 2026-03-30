import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createGalleryCards, updateGalleryCard } from "@/lib/gallery-cards";
import { galleryCardUpdateSchema, galleryCardUploadSchema } from "@/lib/validation";

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
  const intent = String(formData.get("intent") ?? "").trim();

  try {
    if (intent === "create") {
      const parsed = galleryCardUploadSchema.safeParse({
        files: formData.getAll("files"),
        isPublished: formData.get("isPublished") === "true",
      });

      if (!parsed.success) {
        const message = parsed.error.issues[0]?.message ?? "Could not validate the gallery upload.";
        return redirectToAdmin(request, { galleryError: message });
      }

      await createGalleryCards(parsed.data);

      return redirectToAdmin(request, { gallerySuccess: `${parsed.data.files.length} gallery card(s) uploaded.` });
    }

    if (intent === "update") {
      const parsed = galleryCardUpdateSchema.safeParse({
        cardId: String(formData.get("cardId") ?? ""),
        name: String(formData.get("name") ?? ""),
        isPublished: formData.get("isPublished") === "true",
      });

      if (!parsed.success) {
        const message = parsed.error.issues[0]?.message ?? "Could not validate the gallery update.";
        return redirectToAdmin(request, { galleryError: message });
      }

      await updateGalleryCard(parsed.data);

      return redirectToAdmin(request, { gallerySuccess: "Gallery card updated." });
    }

    return redirectToAdmin(request, { galleryError: "Unknown gallery action." });
  } catch (error) {
    console.error("[admin-gallery] request_failed", error);
    return redirectToAdmin(request, {
      galleryError: "We couldn't save that gallery change right now. Please try again.",
    });
  }
}
