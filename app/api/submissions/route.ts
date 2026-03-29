import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getServerEnv } from "@/lib/env";
import { submissionSchema } from "@/lib/validation";
import { slugify } from "@/lib/utils";

function getExtension(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase();

  if (fromName && /^[a-z0-9]+$/.test(fromName)) {
    return fromName;
  }

  if (file.type === "image/png") {
    return "png";
  }

  if (file.type === "image/webp") {
    return "webp";
  }

  return "jpg";
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const householdName = String(formData.get("householdName") ?? "");
    const dachshundCount = Number(formData.get("dachshundCount") ?? 0);

    const dogs = Array.from({ length: dachshundCount }, (_, index) => ({
      name: String(formData.get(`dogName-${index}`) ?? ""),
      file: formData.get(`dogPhoto-${index}`),
    }));

    const parsed = submissionSchema.safeParse({
      householdName,
      dachshundCount,
      dogs,
    });

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Your submission could not be validated.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const { bucket } = getServerEnv();
    const householdId = randomUUID();
    const uploadedPaths: string[] = [];
    const safeHouseholdSlug = slugify(parsed.data.householdName) || "household";

    try {
      for (let index = 0; index < parsed.data.dogs.length; index += 1) {
        const dog = parsed.data.dogs[index];
        const extension = getExtension(dog.file);
        const dogSlug = slugify(dog.name) || `dog-${index + 1}`;
        const originalStoragePath = `${householdId}/original/${safeHouseholdSlug}-${dogSlug}-${index + 1}.${extension}`;
        const bytes = await dog.file.arrayBuffer();

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(originalStoragePath, bytes, {
            contentType: dog.file.type,
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Upload failed for ${dog.name}: ${uploadError.message}`);
        }

        uploadedPaths.push(originalStoragePath);
      }

      const { error: householdError } = await supabase.from("households").insert({
        id: householdId,
        household_name: parsed.data.householdName || null,
        dachshund_count: parsed.data.dachshundCount,
      });

      if (householdError) {
        throw new Error(`Household save failed: ${householdError.message}`);
      }

      const dogRows = parsed.data.dogs.map((dog, index) => ({
        household_id: householdId,
        name: dog.name,
        storage_path: uploadedPaths[index],
        original_filename: dog.file.name,
        content_type: dog.file.type,
      }));

      const { error: dogError } = await supabase.from("dogs").insert(dogRows);

      if (dogError) {
        const { error: deleteHouseholdError } = await supabase.from("households").delete().eq("id", householdId);

        if (deleteHouseholdError) {
          console.error("Rollback failure for household record", deleteHouseholdError);
        }

        throw new Error(`Dog save failed: ${dogError.message}`);
      }

      const { data: totals, error: totalError } = await supabase.from("households").select("dachshund_count");

      if (totalError) {
        throw new Error(`Failed to load total dachshund count: ${totalError.message}`);
      }

      const totalDachshunds = (totals ?? []).reduce((sum, row) => sum + row.dachshund_count, 0);

      return NextResponse.json({
        success: true,
        householdName: parsed.data.householdName || null,
        dogCount: parsed.data.dachshundCount,
        totalDachshunds,
        message: parsed.data.householdName
          ? `Thanks, ${parsed.data.householdName}! Your submission is complete.`
          : "Your submission is complete.",
      });
    } catch (error) {
      if (uploadedPaths.length > 0) {
        const { error: cleanupError } = await supabase.storage.from(bucket).remove(uploadedPaths);

        if (cleanupError) {
          console.error("Upload cleanup failure", cleanupError);
        }
      }

      throw error;
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error: "We couldn't save that entry right now. Please try again in a moment.",
      },
      { status: 500 },
    );
  }
}
