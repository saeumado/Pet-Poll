import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServerSupabaseClient } from "@/lib/supabase";

type ExportHousehold = {
  id: string;
  household_name: string | null;
  dachshund_count: number;
  created_at: string;
  dogs: {
    content_type: string | null;
    name: string;
    original_filename: string | null;
    storage_path: string;
  }[];
};

function escapeCsv(value: string | number | null) {
  const text = value == null ? "" : String(value);

  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

export async function GET() {
  const authed = await isAdminAuthenticated();

  if (!authed) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("households")
    .select("id, household_name, dachshund_count, created_at, dogs(name, storage_path, original_filename, content_type)")
    .order("created_at", { ascending: false });

  if (error) {
    return new NextResponse("Failed to build export.", { status: 500 });
  }

  const rows = [["Household", "Dachshund Count", "Submitted At", "Dog Name", "Photo Path", "Original File Name", "Content Type"]];

  for (const household of (data ?? []) as ExportHousehold[]) {
    for (const dog of household.dogs ?? []) {
      rows.push([
        household.household_name ?? "",
        String(household.dachshund_count),
        household.created_at,
        dog.name,
        dog.storage_path,
        dog.original_filename ?? "",
        dog.content_type ?? "",
      ]);
    }
  }

  const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="dachshund-submissions.csv"',
    },
  });
}
