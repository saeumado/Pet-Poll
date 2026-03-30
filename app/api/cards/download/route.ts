import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";
import { getPublishedGalleryCardById } from "@/lib/gallery-cards";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const cardId = url.searchParams.get("cardId") ?? "";

  if (!cardId) {
    return new NextResponse("Missing card id.", { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  try {
    const card = await getPublishedGalleryCardById(cardId);

    if (!card) {
      return new NextResponse("Card not found.", { status: 404, headers: { "Cache-Control": "no-store" } });
    }

    if (card.image_path.startsWith("/")) {
      return NextResponse.redirect(new URL(card.image_path, request.url), {
        status: 307,
        headers: { "Cache-Control": "no-store" },
      });
    }

    const supabase = createServerSupabaseClient();
    const { bucket } = getServerEnv();
    const { data, error } = await supabase.storage.from(bucket).download(card.image_path);

    if (error || !data) {
      return new NextResponse("Card image not found.", { status: 404, headers: { "Cache-Control": "no-store" } });
    }

    const extension = card.image_path.split(".").pop()?.toLowerCase() || "png";
    const fileName = `${card.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "gallery-card"}.${extension}`;

    return new NextResponse(data, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Type": data.type || "application/octet-stream",
      },
    });
  } catch (error) {
    console.error("[cards-download] request_failed", error);
    return new NextResponse("We couldn't download that card right now.", {
      status: 500,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
