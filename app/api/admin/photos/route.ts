import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getServerEnv } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase";
import { adminPhotoSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const authed = await isAdminAuthenticated();

  if (!authed) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const url = new URL(request.url);
  const parsed = adminPhotoSchema.safeParse({
    path: url.searchParams.get("path"),
  });

  if (!parsed.success) {
    return new NextResponse("Missing photo path.", { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const { bucket } = getServerEnv();
  const { data, error } = await supabase.storage.from(bucket).download(parsed.data.path);

  if (error || !data) {
    return new NextResponse("Photo not found.", { status: 404 });
  }

  return new NextResponse(data, {
    status: 200,
    headers: {
      "Content-Type": data.type || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${parsed.data.path.split("/").pop()}"`,
    },
  });
}
