import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  createGalleryCardVisitorToken,
  GALLERY_CARD_VOTER_COOKIE,
  voteForGalleryCard,
} from "@/lib/gallery-cards";

function buildCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as { cardId?: string } | null;
    const cardId = body?.cardId?.trim() ?? "";

    if (!cardId) {
      return NextResponse.json(
        { error: "That card could not be found." },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }

    const cookieStore = await cookies();
    const existingToken = cookieStore.get(GALLERY_CARD_VOTER_COOKIE)?.value ?? null;
    const voterToken = existingToken ?? createGalleryCardVisitorToken();
    const result = await voteForGalleryCard({ cardId, voterToken });

    if (!result) {
      return NextResponse.json(
        { error: "That card could not be found." },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }

    const response = NextResponse.json(
      {
        success: true,
        card: result,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );

    if (!existingToken) {
      response.cookies.set(GALLERY_CARD_VOTER_COOKIE, voterToken, buildCookieOptions());
    }

    return response;
  } catch (error) {
    console.error("[cards-vote] request_failed", error);
    return NextResponse.json(
      { error: "We couldn't save your like right now. Please try again." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
