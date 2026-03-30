import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getServerEnv } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function POST(request: Request) {
  const authed = await isAdminAuthenticated();

  if (!authed) {
    return new NextResponse("Unauthorized", { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  const formData = await request.formData();
  const householdId = String(formData.get("householdId") ?? "").trim();

  if (!householdId) {
    return new NextResponse("Missing household id.", { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  const supabase = createServerSupabaseClient();
  const { bucket } = getServerEnv();
  const { data: household, error: householdError } = await supabase
    .from("households")
    .select("id, dogs(storage_path)")
    .eq("id", householdId)
    .single();

  if (householdError || !household) {
    return new NextResponse("Entry not found.", { status: 404, headers: { "Cache-Control": "no-store" } });
  }

  const photoPaths = (household.dogs ?? [])
    .map((dog) => dog.storage_path)
    .filter((path): path is string => typeof path === "string" && path.length > 0);

  if (photoPaths.length > 0) {
    const { error: storageError } = await supabase.storage.from(bucket).remove(photoPaths);

    if (storageError) {
      return new NextResponse("Failed to delete saved photos.", { status: 500, headers: { "Cache-Control": "no-store" } });
    }
  }

  const { error: deleteError } = await supabase.from("households").delete().eq("id", householdId);

  if (deleteError) {
    return new NextResponse("Failed to delete entry.", { status: 500, headers: { "Cache-Control": "no-store" } });
  }

  return NextResponse.redirect(new URL("/admin", request.url), { status: 303, headers: { "Cache-Control": "no-store" } });
}
