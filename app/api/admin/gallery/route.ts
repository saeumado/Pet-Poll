import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createGalleryCards, updateGalleryCard } from "@/lib/gallery-cards";
import { galleryCardUpdateSchema, galleryCardUploadSchema } from "@/lib/validation";

function expectsJson(request: Request) {
  return request.headers.get("accept")?.includes("application/json") ?? false;
}

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

function respondWithMessage(
  request: Request,
  type: "error" | "success",
  message: string,
  status = 200,
) {
  if (expectsJson(request)) {
    return NextResponse.json({ [type]: message }, { status, headers: { "Cache-Control": "no-store" } });
  }

  return redirectToAdmin(request, type === "error" ? { galleryError: message } : { gallerySuccess: message });
}

export async function POST(request: Request) {
  const authed = await isAdminAuthenticated();

  if (!authed) {
    if (expectsJson(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }

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
        return respondWithMessage(request, "error", message, 400);
      }

      await createGalleryCards(parsed.data);

      return respondWithMessage(request, "success", `${parsed.data.files.length} gallery card(s) uploaded.`);
    }

    if (intent === "update") {
      const parsed = galleryCardUpdateSchema.safeParse({
        cardId: String(formData.get("cardId") ?? ""),
        name: String(formData.get("name") ?? ""),
        isPublished: formData.get("isPublished") === "true",
      });

      if (!parsed.success) {
        const message = parsed.error.issues[0]?.message ?? "Could not validate the gallery update.";
        return respondWithMessage(request, "error", message, 400);
      }

      await updateGalleryCard(parsed.data);

      return respondWithMessage(request, "success", "Gallery card updated.");
    }

    return respondWithMessage(request, "error", "Unknown gallery action.", 400);
  } catch (error) {
    console.error("[admin-gallery] request_failed", error);
    return respondWithMessage(request, "error", "We couldn't save that gallery change right now. Please try again.", 500);
  }
}
